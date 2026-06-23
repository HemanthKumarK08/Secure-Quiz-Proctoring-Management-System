import express from "express";
import { authenticate } from "../middleware/auth.js";

import {
  createAttempt,
  getAttemptById,
  updateAttemptOnSubmit,
  getAttemptByUserAndQuiz,
  getMyAttempts
} from "../models/attemptModel.js";

import { getQuestionsWithAnswersForQuiz } from "../models/questionModel.js";
import { saveResponses } from "../models/responseModel.js";
import { logViolation, countViolationsForAttempt } from "../models/violationModel.js";
import { logAudit } from "../models/auditModel.js";
import { getQuizById } from "../models/quizModel.js";

const router = express.Router();

/* =========================
   START QUIZ
========================= */
router.post("/start", authenticate, async (req, res) => {
  try {
    const { quiz_id } = req.body;

    if (!quiz_id) {
      return res.status(400).json({ message: "quiz_id required" });
    }

    // 🔍 Check existing attempt
    const existing = await getAttemptByUserAndQuiz(req.user.id, quiz_id);

    if (existing) {
      // ❌ Already finished
      if (existing.status !== "in_progress") {
        return res.status(403).json({
          message: "You have already completed this quiz"
        });
      }

      // ✅ Resume attempt
      const questions = await getQuestionsWithAnswersForQuiz(quiz_id);

      const sanitized = questions.map(q => ({
        id: q.id,
        question_text: q.question_text,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d
      }));

      return res.json({
        attempt_id: existing.id,
        questions: sanitized
      });
    }

    // ✅ Create new attempt
    const attemptId = await createAttempt({
      quiz_id,
      user_id: req.user.id,
      start_time: new Date()
    });

    const quiz = await getQuizById(quiz_id);
    await logAudit({
      user_id: req.user.id,
      action: "Quiz started",
      module: "attempts",
      details: quiz ? `${quiz.title} (attempt ${attemptId})` : `Quiz ID ${quiz_id}`
    });

    const questions = await getQuestionsWithAnswersForQuiz(quiz_id);

    const sanitized = questions.map(q => ({
      id: q.id,
      question_text: q.question_text,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d
    }));

    res.json({
      attempt_id: attemptId,
      questions: sanitized
    });

  } catch (err) {
    console.error("START QUIZ ERROR:", err);
    res.status(500).json({ message: "Failed to start quiz" });
  }
});

/* =========================
   SUBMIT QUIZ
========================= */
router.post("/submit", authenticate, async (req, res) => {
  try {
    const { attempt_id, responses } = req.body;

    if (!attempt_id || !Array.isArray(responses)) {
      return res.status(400).json({ message: "Invalid submission data" });
    }

    const attempt = await getAttemptById(attempt_id);

    if (!attempt || attempt.user_id !== req.user.id) {
      return res.status(404).json({ message: "Attempt not found" });
    }

    // ❌ Prevent double submit
    if (attempt.status !== "in_progress") {
      return res.status(400).json({ message: "Quiz already submitted" });
    }

    const questions = await getQuestionsWithAnswersForQuiz(attempt.quiz_id);

    let score = 0;

    const markedResponses = responses.map(r => {
      const q = questions.find(q => q.id === r.question_id);
      const is_correct = q && q.correct_option === r.selected_option;
      if (is_correct) score++;
      return { ...r, is_correct };
    });

    await saveResponses(attempt_id, markedResponses);

    await updateAttemptOnSubmit({
      id: attempt_id,
      end_time: new Date(),
      score,
      status: "submitted"
    });

    const quiz = await getQuizById(attempt.quiz_id);
    await logAudit({
      user_id: req.user.id,
      action: "Quiz submitted",
      module: "attempts",
      details: quiz
        ? `${quiz.title}: score ${score}/${questions.length}`
        : `Attempt ${attempt_id}: score ${score}`
    });

    res.json({
      score,
      total: questions.length,
      status: "submitted"
    });

  } catch (err) {
    console.error("SUBMIT QUIZ ERROR:", err);
    res.status(500).json({ message: "Submit failed" });
  }
});

/* =========================
   LOG VIOLATION (AUTO SUBMIT)
========================= */
router.post("/violations", authenticate, async (req, res) => {
  try {
    const { attempt_id, type, details } = req.body;

    if (!attempt_id) {
      return res.status(400).json({ message: "attempt_id required" });
    }

    const attempt = await getAttemptById(attempt_id);

    // ❌ Ignore violations after submit
    if (!attempt || attempt.status !== "in_progress") {
      return res.json({ count: 0 });
    }

    await logViolation({
      attempt_id,
      type: type || "PROCTOR",
      details: details || ""
    });

    const count = await countViolationsForAttempt(attempt_id);

    // 🚨 AUTO SUBMIT ON FIRST VIOLATION
    if (count >= 1) {
      await updateAttemptOnSubmit({
        id: attempt_id,
        end_time: new Date(),
        score: 0,
        status: "auto_submitted"
      });
    }

    res.json({
      count,
      auto_submitted: count >= 1
    });

  } catch (err) {
    console.error("VIOLATION ERROR:", err);
    res.status(500).json({ message: "Violation logging failed" });
  }
});

/* =========================
   STUDENT ATTEMPT HISTORY
========================= */
router.get("/mine", authenticate, async (req, res) => {
  try {
    const attempts = await getMyAttempts(req.user.id);
    res.json(attempts);
  } catch (err) {
    console.error("FETCH ATTEMPTS ERROR:", err);
    res.status(500).json({ message: "Failed to load attempts" });
  }
});

export default router;
