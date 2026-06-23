import { pool } from "../config/db.js";

// ============================
// CREATE ATTEMPT
// ============================
export const createAttempt = async ({ quiz_id, user_id, start_time }) => {
  const [result] = await pool.execute(
    `INSERT INTO attempts (quiz_id, user_id, start_time, status)
     VALUES (?, ?, ?, 'in_progress')`,
    [quiz_id, user_id, start_time]
  );
  return result.insertId;
};


// ============================
// GET ATTEMPT BY ID
// ============================
export const getAttemptById = async (id) => {
  const [rows] = await pool.execute(
    "SELECT * FROM attempts WHERE id = ?",
    [id]
  );
  return rows[0];
};


// ============================
// UPDATE ON SUBMIT
// ============================
export const updateAttemptOnSubmit = async ({ id, end_time, score, status }) => {
  await pool.execute(
    `UPDATE attempts 
     SET end_time = ?, score = ?, status = ? 
     WHERE id = ?`,
    [end_time, score, status, id]
  );
};


// ============================
// STUDENT PREVIOUS ATTEMPTS
// ============================
export const getMyAttempts = async (user_id) => {
  const [rows] = await pool.execute(
    `SELECT 
        a.id,
        q.title AS quiz,
        a.score,
        a.status,
        a.start_time,
        a.end_time
     FROM attempts a
     JOIN quizzes q ON a.quiz_id = q.id
     WHERE a.user_id = ?
     ORDER BY a.start_time DESC`,
    [user_id]
  );

  return rows;
};


// ============================
// ADMIN LIVE MONITORING
// ============================
export const getActiveAttemptsWithViolations = async () => {
  const [rows] = await pool.execute(
    `SELECT 
        a.id,
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
     ORDER BY a.start_time DESC`
  );

  return rows;
};


// ============================
// PREVENT MULTIPLE ATTEMPTS
// ============================
export const hasCompletedAttempt = async (user_id, quiz_id) => {
  const [rows] = await pool.execute(
    `SELECT id 
     FROM attempts 
     WHERE user_id = ? 
       AND quiz_id = ?
       AND status IN ('submitted', 'auto_submitted')
     LIMIT 1`,
    [user_id, quiz_id]
  );

  return rows.length > 0;
};


export async function getAttemptByUserAndQuiz(user_id, quiz_id) {
  const [[row]] = await pool.query(
    "SELECT * FROM attempts WHERE user_id = ? AND quiz_id = ? LIMIT 1",
    [user_id, quiz_id]
  );
  return row;
}
