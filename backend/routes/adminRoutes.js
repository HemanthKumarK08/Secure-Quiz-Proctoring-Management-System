
import express from "express";
import { authenticate } from "../middleware/auth.js";
import { authorizeRole } from "../middleware/role.js";
import { pool } from "../config/db.js";
import mammoth from "mammoth";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import {
  createQuiz,
  updateQuiz,
  deleteQuiz,
  getAllQuizzes
} from "../models/quizModel.js";

import {
  addQuestion,
  getQuestionsByQuiz
} from "../models/questionModel.js";

import { logAudit, getAuditLogs } from "../models/auditModel.js";

const router = express.Router();

router.use(authenticate, authorizeRole("admin"));

const passFailCase = `
  CASE
    WHEN a.status = 'auto_submitted' THEN 'Fail'
    WHEN a.score >= (SELECT COUNT(*) FROM questions qq WHERE qq.quiz_id = a.quiz_id) / 2 THEN 'Pass'
    ELSE 'Fail'
  END
`;

/* =========================
   DASHBOARD ANALYTICS
========================= */
router.get("/overview", async (req, res) => {
  try {
    const [[{ total_students }]] = await pool.query(
      "SELECT COUNT(*) AS total_students FROM users WHERE role = 'student'"
    );

    const [[{ total_quizzes }]] = await pool.query(
      "SELECT COUNT(*) AS total_quizzes FROM quizzes WHERE deleted_at IS NULL"
    );

    const [[{ total_attempts }]] = await pool.query(
      "SELECT COUNT(*) AS total_attempts FROM attempts"
    );

    const [[{ active_attempts }]] = await pool.query(
      "SELECT COUNT(*) AS active_attempts FROM attempts WHERE status = 'in_progress'"
    );

    const [[{ total_violations }]] = await pool.query(
      "SELECT COUNT(*) AS total_violations FROM violations"
    );

    const [[passFail]] = await pool.query(`
      SELECT
        SUM(CASE WHEN ${passFailCase} = 'Pass' THEN 1 ELSE 0 END) AS pass_count,
        SUM(CASE WHEN ${passFailCase} = 'Fail' THEN 1 ELSE 0 END) AS fail_count
      FROM attempts a
      WHERE a.status IN ('submitted', 'auto_submitted')
    `);

    const [mostAttemptedRows] = await pool.query(`
      SELECT q.title, COUNT(a.id) AS attempt_count
      FROM quizzes q
      LEFT JOIN attempts a ON a.quiz_id = q.id
      WHERE q.deleted_at IS NULL
      GROUP BY q.id, q.title
      ORDER BY attempt_count DESC
      LIMIT 1
    `);

    const most_attempted_quiz = mostAttemptedRows[0]?.title || "N/A";
    const most_attempted_count = mostAttemptedRows[0]?.attempt_count || 0;

    res.json({
      total_students,
      total_quizzes,
      total_attempts,
      active_attempts,
      total_violations,
      pass_count: passFail?.pass_count ?? 0,
      fail_count: passFail?.fail_count ?? 0,
      most_attempted_quiz,
      most_attempted_count
    });
  } catch (err) {
    console.error("OVERVIEW ERROR:", err);
    res.status(500).json({ message: "Overview failed" });
  }
});

router.post("/quizzes", async (req, res) => {
  try {
    const { title, description, duration_minutes } = req.body;

    if (!title || !duration_minutes) {
      return res.status(400).json({ message: "Title and duration required" });
    }

    const id = await createQuiz({
      title,
      description: description || "",
      duration_minutes
    });

    await logAudit({
      user_id: req.user.id,
      action: "Quiz created",
      module: "quizzes",
      details: `Quiz ID ${id}: ${title}`
    });

    res.status(201).json({ message: "Quiz created successfully", id });
  } catch (err) {
    console.error("CREATE QUIZ ERROR:", err);
    res.status(500).json({ message: "Quiz creation failed" });
  }
});

router.get("/quizzes", async (req, res) => {
  try {
    const quizzes = await getAllQuizzes();
    res.json(quizzes);
  } catch (err) {
    console.error("FETCH QUIZZES ERROR:", err);
    res.status(500).json({ message: "Failed to fetch quizzes" });
  }
});

router.put("/quizzes/:id", async (req, res) => {
  try {
    const { title, description, duration_minutes, is_active } = req.body;

    await updateQuiz(req.params.id, {
      title,
      description,
      duration_minutes,
      is_active: is_active ? 1 : 0
    });

    res.json({ message: "Quiz updated successfully" });
  } catch (err) {
    console.error("UPDATE QUIZ ERROR:", err);
    res.status(500).json({ message: "Quiz update failed" });
  }
});

router.delete("/quizzes/:id", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT title FROM quizzes WHERE id = ?",
      [req.params.id]
    );

    await deleteQuiz(req.params.id);

    await logAudit({
      user_id: req.user.id,
      action: "Quiz deleted",
      module: "quizzes",
      details: `Soft-deleted quiz ID ${req.params.id}: ${rows[0]?.title || "unknown"}`
    });

    res.json({ message: "Quiz deleted successfully (soft delete)" });
  } catch (err) {
    console.error("DELETE QUIZ ERROR:", err);
    res.status(500).json({ message: "Quiz deletion failed" });
  }
});

router.post("/quizzes/:quizId/questions", async (req, res) => {
  try {
    const quiz_id = req.params.quizId;
    const {
      question_text,
      option_a,
      option_b,
      option_c,
      option_d,
      correct_option
    } = req.body;

    if (!question_text || !option_a || !option_b || !correct_option) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const id = await addQuestion({
      quiz_id,
      question_text,
      option_a,
      option_b,
      option_c,
      option_d,
      correct_option
    });

    res.status(201).json({ message: "Question added successfully", id });
  } catch (err) {
    console.error("ADD QUESTION ERROR:", err);
    res.status(500).json({ message: "Failed to add question" });
  }
});

router.get("/quizzes/:quizId/questions", async (req, res) => {
  try {
    const questions = await getQuestionsByQuiz(req.params.quizId);
    res.json(questions);
  } catch (err) {
    console.error("FETCH QUESTIONS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch questions" });
  }
});

router.get("/attempts/active", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        a.id AS attempt_id,
        u.name AS student,
        q.title AS quiz,
        a.status,
        a.start_time,
        COUNT(v.id) AS violations
      FROM attempts a
      JOIN users u ON a.user_id = u.id
      JOIN quizzes q ON a.quiz_id = q.id
      LEFT JOIN violations v ON v.attempt_id = a.id
      WHERE a.status = 'in_progress'
      GROUP BY a.id
      ORDER BY a.start_time DESC
    `);

    res.json(rows);
  } catch (err) {
    console.error("ACTIVE ATTEMPTS ERROR:", err);
    res.status(500).json({ message: "Monitoring failed" });
  }
});

router.get("/students", async (req, res) => {
  try {
    const { name } = req.query;
    let sql = `
      SELECT 
        u.id,
        u.name,
        u.email,
        COUNT(DISTINCT a.id) AS total_attempts,
        COUNT(v.id) AS total_violations
      FROM users u
      LEFT JOIN attempts a ON a.user_id = u.id
      LEFT JOIN violations v ON v.attempt_id = a.id
      WHERE u.role = 'student'
    `;
    const params = [];

    if (name) {
      sql += " AND u.name LIKE ?";
      params.push(`%${name}%`);
    }

    sql += " GROUP BY u.id ORDER BY u.name";

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error("STUDENT LIST ERROR:", err);
    res.status(500).json({ message: "Failed to load students" });
  }
});

router.get("/quizzes/:quizId/results", async (req, res) => {
  try {
    const quizId = req.params.quizId;

    const [rows] = await pool.query(`
      SELECT 
        u.name AS student_name,
        u.email,
        a.score,
        a.status,
        a.start_time,
        a.end_time,
        COUNT(v.id) AS violations
      FROM attempts a
      JOIN users u ON a.user_id = u.id
      LEFT JOIN violations v ON v.attempt_id = a.id
      WHERE a.quiz_id = ?
      GROUP BY a.id
      ORDER BY a.start_time DESC
    `, [quizId]);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch quiz results" });
  }
});

/* =========================
   STUDENT PERFORMANCE REPORT
========================= */
router.get("/reports/performance", async (req, res) => {
  try {
    const { student, quiz, date } = req.query;
    let sql = `
      SELECT
        u.name AS student_name,
        q.title AS quiz_name,
        a.score,
        COALESCE(a.end_time, a.start_time) AS attempt_date,
        a.status,
        ${passFailCase} AS pass_fail,
        RANK() OVER (PARTITION BY a.quiz_id ORDER BY a.score DESC) AS rank_in_quiz
      FROM attempts a
      JOIN users u ON a.user_id = u.id
      JOIN quizzes q ON a.quiz_id = q.id
      WHERE a.status IN ('submitted', 'auto_submitted')
    `;
    const params = [];

    if (student) {
      sql += " AND u.name LIKE ?";
      params.push(`%${student}%`);
    }
    if (quiz) {
      sql += " AND q.title LIKE ?";
      params.push(`%${quiz}%`);
    }
    if (date) {
      sql += " AND DATE(COALESCE(a.end_time, a.start_time)) = ?";
      params.push(date);
    }

    sql += " ORDER BY attempt_date DESC";

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error("PERFORMANCE REPORT ERROR:", err);
    res.status(500).json({ message: "Failed to load performance report" });
  }
});

/* =========================
   EXAM MALPRACTICE REPORT
========================= */
router.get("/reports/violations", async (req, res) => {
  try {
    const { type, student, quiz } = req.query;
    let sql = `
      SELECT
        u.name AS student_name,
        q.title AS quiz_name,
        v.type AS violation_type,
        v.created_at AS violation_time,
        v.details
      FROM violations v
      JOIN attempts a ON v.attempt_id = a.id
      JOIN users u ON a.user_id = u.id
      JOIN quizzes q ON a.quiz_id = q.id
      WHERE 1=1
    `;
    const params = [];

    if (type) {
      sql += " AND v.type LIKE ?";
      params.push(`%${type}%`);
    }
    if (student) {
      sql += " AND u.name LIKE ?";
      params.push(`%${student}%`);
    }
    if (quiz) {
      sql += " AND q.title LIKE ?";
      params.push(`%${quiz}%`);
    }

    sql += " ORDER BY v.created_at DESC";

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error("VIOLATION REPORT ERROR:", err);
    res.status(500).json({ message: "Failed to load violation report" });
  }
});

/* =========================
   AUDIT LOG
========================= */
router.get("/audit-logs", async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
    const logs = await getAuditLogs(limit);
    res.json(logs);
  } catch (err) {
    console.error("AUDIT LOG ERROR:", err);
    res.status(500).json({ message: "Failed to load audit logs" });
  }
});

/* =========================
   SEARCH & FILTER
========================= */
router.get("/search", async (req, res) => {
  try {
    const { type, query, date } = req.query;

    if (!type) {
      return res.status(400).json({ message: "Search type required" });
    }

    let rows = [];

    switch (type) {
      case "students": {
        [rows] = await pool.query(
          "SELECT id, name, email, role, created_at FROM users WHERE role = 'student' AND name LIKE ? ORDER BY name",
          [`%${query || ""}%`]
        );
        break;
      }
      case "quizzes": {
        [rows] = await pool.query(
          "SELECT id, title, description, duration_minutes, created_at FROM quizzes WHERE deleted_at IS NULL AND title LIKE ? ORDER BY title",
          [`%${query || ""}%`]
        );
        break;
      }
      case "attempts": {
        if (!date) {
          return res.status(400).json({ message: "Date required for attempt search (YYYY-MM-DD)" });
        }
        [rows] = await pool.query(`
          SELECT u.name AS student_name, q.title AS quiz_name, a.score, a.status,
                 COALESCE(a.end_time, a.start_time) AS attempt_date
          FROM attempts a
          JOIN users u ON a.user_id = u.id
          JOIN quizzes q ON a.quiz_id = q.id
          WHERE DATE(COALESCE(a.end_time, a.start_time)) = ?
          ORDER BY attempt_date DESC
        `, [date]);
        break;
      }
      case "violations": {
        [rows] = await pool.query(`
          SELECT u.name AS student_name, q.title AS quiz_name, v.type, v.details, v.created_at
          FROM violations v
          JOIN attempts a ON v.attempt_id = a.id
          JOIN users u ON a.user_id = u.id
          JOIN quizzes q ON a.quiz_id = q.id
          WHERE v.type LIKE ?
          ORDER BY v.created_at DESC
        `, [`%${query || ""}%`]);
        break;
      }
      default:
        return res.status(400).json({ message: "Invalid search type" });
    }

    res.json(rows);
  } catch (err) {
    console.error("SEARCH ERROR:", err);
    res.status(500).json({ message: "Search failed" });
  }
});

/* =========================
   LEADERBOARD / RANKING
========================= */
router.get("/leaderboard", async (req, res) => {
  try {
    const [topScorers] = await pool.query(`
      SELECT u.name, SUM(a.score) AS total_score, COUNT(a.id) AS quizzes_taken
      FROM attempts a
      JOIN users u ON a.user_id = u.id
      WHERE u.role = 'student' AND a.status IN ('submitted', 'auto_submitted')
      GROUP BY u.id, u.name
      ORDER BY total_score DESC
      LIMIT 10
    `);

    const [mostActive] = await pool.query(`
      SELECT u.name, COUNT(a.id) AS attempt_count
      FROM attempts a
      JOIN users u ON a.user_id = u.id
      WHERE u.role = 'student'
      GROUP BY u.id, u.name
      ORDER BY attempt_count DESC
      LIMIT 10
    `);

    res.json({ top_scorers: topScorers, most_active: mostActive });
  } catch (err) {
    console.error("LEADERBOARD ERROR:", err);
    res.status(500).json({ message: "Failed to load leaderboard" });
  }
});

/* =========================
   TEMPLATES & BULK UPLOAD
========================= */

// Download DOCX template
router.get("/templates/docx", (req, res) => {
  const filePath = path.join(__dirname, "../templates/question_template.docx");
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: "DOCX template not found" });
  }
  res.download(filePath, "question_template.docx");
});

// POST /api/admin/quizzes/:quizId/upload-questions
router.post("/quizzes/:quizId/upload-questions", async (req, res) => {
  try {
    const quizId = parseInt(req.params.quizId, 10);
    const { fileContent, fileType } = req.body;

    if (!fileContent || !fileType) {
      return res.status(400).json({ message: "Missing fileContent or fileType" });
    }

    // Verify quiz exists
    const [quizRows] = await pool.query(
      "SELECT id FROM quizzes WHERE id = ? AND deleted_at IS NULL",
      [quizId]
    );
    if (!quizRows.length) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    let parsedQuestions = [];
    let errors = [];

    // Fetch existing questions to check for duplicates
    const [existingQuestions] = await pool.query(
      "SELECT question_text FROM questions WHERE quiz_id = ?",
      [quizId]
    );
    const seenQuestions = new Set(
      existingQuestions.map(q => q.question_text.trim().toLowerCase())
    );

    if (fileType === "xlsx") {
      // fileContent is a pre-parsed 2D array of rows from SheetJS in the frontend
      const rows = fileContent;
      if (!Array.isArray(rows) || rows.length < 2) {
        return res.status(400).json({ message: "Empty or invalid Excel file" });
      }

      // Check header
      const headers = rows[0].map(h => String(h || "").trim().toLowerCase());
      const expected = ["question", "optiona", "optionb", "optionc", "optiond", "correctanswer"];
      const missing = expected.filter(exp => !headers.includes(exp));
      if (missing.length > 0) {
        return res.status(400).json({
          message: `Invalid Excel format. Missing headers: ${missing.join(", ")}`
        });
      }

      const qIdx = headers.indexOf("question");
      const aIdx = headers.indexOf("optiona");
      const bIdx = headers.indexOf("optionb");
      const cIdx = headers.indexOf("optionc");
      const dIdx = headers.indexOf("optiond");
      const ansIdx = headers.indexOf("correctanswer");

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 1; // 1-based row number
        
        // Skip empty rows
        if (!row || row.length === 0 || row.every(cell => !String(cell || "").trim())) {
          continue;
        }

        const questionText = String(row[qIdx] || "").trim();
        const optionA = String(row[aIdx] || "").trim();
        const optionB = String(row[bIdx] || "").trim();
        const optionC = String(row[cIdx] || "").trim();
        const optionD = String(row[dIdx] || "").trim();
        const correctAnswerVal = String(row[ansIdx] || "").trim();

        if (!questionText) {
          errors.push(`Row ${rowNum}: Question cannot be empty`);
          continue;
        }

        // Check options
        if (!optionA) {
          errors.push(`Row ${rowNum}: Missing Option A`);
          continue;
        }
        if (!optionB) {
          errors.push(`Row ${rowNum}: Missing Option B`);
          continue;
        }
        if (!optionC) {
          errors.push(`Row ${rowNum}: Missing Option C`);
          continue;
        }
        if (!optionD) {
          errors.push(`Row ${rowNum}: Missing Option D`);
          continue;
        }

        // Correct answer must match one of the options
        const matchA = correctAnswerVal.toLowerCase() === optionA.toLowerCase();
        const matchB = correctAnswerVal.toLowerCase() === optionB.toLowerCase();
        const matchC = correctAnswerVal.toLowerCase() === optionC.toLowerCase();
        const matchD = correctAnswerVal.toLowerCase() === optionD.toLowerCase();

        if (!matchA && !matchB && !matchC && !matchD) {
          errors.push(`Row ${rowNum}: Correct Answer does not match any option`);
          continue;
        }

        // Map correct answer text to A, B, C, or D
        let correctOption = "";
        if (matchA) correctOption = "A";
        else if (matchB) correctOption = "B";
        else if (matchC) correctOption = "C";
        else if (matchD) correctOption = "D";

        // Check duplicates
        const normQuestion = questionText.toLowerCase();
        if (seenQuestions.has(normQuestion)) {
          errors.push(`Row ${rowNum}: Duplicate Question`);
          continue;
        }
        seenQuestions.add(normQuestion);

        parsedQuestions.push({
          question_text: questionText,
          option_a: optionA,
          option_b: optionB,
          option_c: optionC,
          option_d: optionD,
          correct_option: correctOption
        });
      }

    } else if (fileType === "docx") {
      // Decode base64 DOCX
      const docxBuffer = Buffer.from(fileContent, "base64");
      const result = await mammoth.extractRawText({ buffer: docxBuffer });
      const text = result.value;

      // Write to debug log file
      fs.writeFileSync("parser-debug.log", `=== RAW TEXT ===\n${text}\n=== END RAW TEXT ===\n`);

      const lines = text.split(/\r?\n/).map(l => l.replace(/[\u200B-\u200D\uFEFF]/g, '').trim());
      
      // Append lines array to debug log file
      fs.appendFileSync("parser-debug.log", `=== LINES ARRAY ===\n${JSON.stringify(lines, null, 2)}\n=== END LINES ARRAY ===`);

      let currentQuestion = null;
      let questionBlockCount = 0;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;

        // Robust question match supporting: "Question: [text]", "Question 1: [text]", "1. [text]"
        const qMatch = line.match(/^\s*(?:Question\s*(?:\d+)?\s*[:\-]\s*|\d+[\.\)\:\-]\s*)(.*)$/i);

        if (qMatch) {
          if (currentQuestion) {
            validateAndAddDocxQuestion(currentQuestion, seenQuestions, parsedQuestions, errors);
          }
          questionBlockCount++;
          currentQuestion = {
            text: qMatch[1].trim(),
            lines: [],
            lineNum: i + 1
          };
        } else if (currentQuestion) {
          currentQuestion.lines.push(line);
        }
      }

      // Process last question
      if (currentQuestion) {
        validateAndAddDocxQuestion(currentQuestion, seenQuestions, parsedQuestions, errors);
      }

      if (questionBlockCount === 0) {
        return res.status(400).json({ message: "No questions found in DOCX format template" });
      }

    } else {
      return res.status(400).json({ message: "Unsupported file type" });
    }

    // Insert valid questions into DB
    let uploadedCount = 0;
    if (parsedQuestions.length > 0) {
      const insertSql = `
        INSERT INTO questions 
        (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, difficulty)
        VALUES ?
      `;
      const insertValues = parsedQuestions.map(q => [
        quizId,
        q.question_text,
        q.option_a,
        q.option_b,
        q.option_c,
        q.option_d,
        q.correct_option,
        "medium"
      ]);

      await pool.query(insertSql, [insertValues]);
      uploadedCount = parsedQuestions.length;

      // Log to Audit Log
      await logAudit({
        user_id: req.user.id,
        action: "Bulk questions upload",
        module: "questions",
        details: `Uploaded ${uploadedCount} questions to quiz ID ${quizId}. Errors skipped: ${errors.length}`
      });
    }

    res.json({
      success: true,
      uploadedCount,
      errors
    });

  } catch (err) {
    console.error("UPLOAD QUESTIONS ERROR:", err);
    res.status(500).json({ message: "Failed to upload questions" });
  }
});

// Helper to validate and add DOCX parsed questions
function validateAndAddDocxQuestion(q, seenQuestions, parsedQuestions, errors) {
  const rowNum = q.lineNum;

  // Combine all text under this question block
  const fullText = (q.text + "\n" + q.lines.join("\n")).trim();

  // Regexes for option/answer markers
  const regexA = /A\s*[\)\]\.\:\-\]]|\(A\)/i;
  const regexB = /B\s*[\)\]\.\:\-\]]|\(B\)/i;
  const regexC = /C\s*[\)\]\.\:\-\]]|\(C\)/i;
  const regexD = /D\s*[\)\]\.\:\-\]]|\(D\)/i;
  const regexAns = /(?:Correct\s+)?Ans(?:wer)?\s*[\:\-]/i;

  const matchA = fullText.match(regexA);
  const matchB = fullText.match(regexB);
  const matchC = fullText.match(regexC);
  const matchD = fullText.match(regexD);
  const matchAns = fullText.match(regexAns);

  if (!matchA || !matchB || !matchC || !matchD || !matchAns) {
    errors.push(`Row ${rowNum}: Could not find all options (A, B, C, D) and Answer in the question block`);
    return;
  }

  const idxA = matchA.index;
  const idxB = matchB.index;
  const idxC = matchC.index;
  const idxD = matchD.index;
  const idxAns = matchAns.index;

  // Verify indices are sequential: A < B < C < D < Ans
  if (!(idxA < idxB && idxB < idxC && idxC < idxD && idxD < idxAns)) {
    errors.push(`Row ${rowNum}: Options and Answer are out of sequential order`);
    return;
  }

  // Extract substrings
  const questionText = fullText.substring(0, idxA).trim();
  const optionAText = fullText.substring(idxA + matchA[0].length, idxB).trim();
  const optionBText = fullText.substring(idxB + matchB[0].length, idxC).trim();
  const optionCText = fullText.substring(idxC + matchC[0].length, idxD).trim();
  const optionDText = fullText.substring(idxD + matchD[0].length, idxAns).trim();
  const answerText = fullText.substring(idxAns + matchAns[0].length).trim();

  if (!questionText) {
    errors.push(`Row ${rowNum}: Question text cannot be empty`);
    return;
  }
  if (!optionAText) {
    errors.push(`Row ${rowNum}: Option A cannot be empty`);
    return;
  }
  if (!optionBText) {
    errors.push(`Row ${rowNum}: Option B cannot be empty`);
    return;
  }
  if (!optionCText) {
    errors.push(`Row ${rowNum}: Option C cannot be empty`);
    return;
  }
  if (!optionDText) {
    errors.push(`Row ${rowNum}: Option D cannot be empty`);
    return;
  }
  if (!answerText) {
    errors.push(`Row ${rowNum}: Correct Answer is required`);
    return;
  }

  // Map correct answer text to A, B, C, or D (take first line only to support additional annotations)
  let cleanAns = answerText.split(/\r?\n/)[0].trim().replace(/[\)\]\.\s]/g, "").toUpperCase();
  const validAnswers = ["A", "B", "C", "D"];

  if (!validAnswers.includes(cleanAns)) {
    // Check if it matches option text instead
    const matchOptA = cleanAns.toLowerCase() === optionAText.toLowerCase();
    const matchOptB = cleanAns.toLowerCase() === optionBText.toLowerCase();
    const matchOptC = cleanAns.toLowerCase() === optionCText.toLowerCase();
    const matchOptD = cleanAns.toLowerCase() === optionDText.toLowerCase();

    if (matchOptA) cleanAns = "A";
    else if (matchOptB) cleanAns = "B";
    else if (matchOptC) cleanAns = "C";
    else if (matchOptD) cleanAns = "D";
    else {
      errors.push(`Row ${rowNum}: Correct Answer does not match any option`);
      return;
    }
  }

  // Check duplicate
  const normQuestion = questionText.toLowerCase();
  if (seenQuestions.has(normQuestion)) {
    errors.push(`Row ${rowNum}: Duplicate Question`);
    return;
  }
  seenQuestions.add(normQuestion);

  parsedQuestions.push({
    question_text: questionText,
    option_a: optionAText,
    option_b: optionBText,
    option_c: optionCText,
    option_d: optionDText,
    correct_option: cleanAns
  });
}

export default router;
