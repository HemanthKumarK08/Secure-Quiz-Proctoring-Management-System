import { pool } from "../config/db.js";

export const saveResponses = async (attempt_id, responses) => {
  if (!responses || responses.length === 0) return;

  const values = responses.map((r) => [
    attempt_id,
    r.question_id,
    r.selected_option,
    r.is_correct ? 1 : 0
  ]);

  await pool.query(
    "INSERT INTO responses (attempt_id, question_id, selected_option, is_correct) VALUES ?",
    [values]
  );
};

export const getResponsesForAttempt = async (attempt_id) => {
  const [rows] = await pool.execute(
    `SELECT r.*, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_option
     FROM responses r
     JOIN questions q ON r.question_id = q.id
     WHERE r.attempt_id = ?`,
    [attempt_id]
  );
  return rows;
};
