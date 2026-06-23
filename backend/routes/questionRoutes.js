import express from 'express';
import { pool } from '../config/db.js';

const router = express.Router();

// Add question to quiz
router.post('/add', async (req, res) => {
  try {
    const { quizId, question, a, b, c, d, correct } = req.body;

    const sql = `
      INSERT INTO questions
      (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    await pool.execute(sql, [quizId, question, a, b, c, d, correct]);

    res.json({ message: 'Question added successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Database error' });
  }
});

export default router;
