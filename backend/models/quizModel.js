import { pool } from "../config/db.js";

export const getActiveQuizzes = async () => {
  const [rows] = await pool.execute(
    "SELECT id, title, description, duration_minutes FROM quizzes WHERE is_active = 1 AND deleted_at IS NULL"
  );
  return rows;
};

export const getQuizById = async (id) => {
  const [rows] = await pool.execute(
    "SELECT * FROM quizzes WHERE id = ? AND deleted_at IS NULL",
    [id]
  );
  return rows[0];
};

export const createQuiz = async ({ title, description, duration_minutes }) => {
  const [result] = await pool.execute(
    "INSERT INTO quizzes (title, description, duration_minutes, is_active) VALUES (?, ?, ?, 1)",
    [title, description, duration_minutes]
  );
  return result.insertId;
};

export const updateQuiz = async (
  id,
  { title, description, duration_minutes, is_active }
) => {
  await pool.execute(
    "UPDATE quizzes SET title = ?, description = ?, duration_minutes = ?, is_active = ? WHERE id = ?",
    [title, description, duration_minutes, is_active, id]
  );
};

export const deleteQuiz = async (id) => {
  await pool.execute(
    "UPDATE quizzes SET is_active = 0, deleted_at = NOW() WHERE id = ?",
    [id]
  );
};

export const getAllQuizzes = async () => {
  const [rows] = await pool.execute(
    "SELECT * FROM quizzes WHERE deleted_at IS NULL ORDER BY id DESC"
  );
  return rows;
};
