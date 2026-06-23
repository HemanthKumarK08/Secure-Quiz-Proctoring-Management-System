import express from "express";
import { authenticate } from "../middleware/auth.js";
import { getActiveQuizzes, getQuizById } from "../models/quizModel.js";
import { getQuestionsForQuiz } from "../models/questionModel.js";

const router = express.Router();

router.get("/", authenticate, async (req, res) => {
  try {
    const quizzes = await getActiveQuizzes();
    res.json(quizzes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load quizzes" });
  }
});

router.get("/:id", authenticate, async (req, res) => {
  try {
    const quiz = await getQuizById(req.params.id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    const questions = await getQuestionsForQuiz(quiz.id);
    res.json({ quiz, questions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load quiz" });
  }
});

export default router;
