import { pool } from "../config/db.js";

export const getQuestionsForQuiz = async (quizId) => {
  const [rows] = await pool.execute(
    "SELECT id, question_text, option_a, option_b, option_c, option_d FROM questions WHERE quiz_id = ?",
    [quizId]
  );
  return rows;
};

export const getQuestionsWithAnswersForQuiz = async (quizId) => {
  const [rows] = await pool.execute(
    "SELECT * FROM questions WHERE quiz_id = ?",
    [quizId]
  );
  return rows;
};

export const addQuestion = async ({
  quiz_id,
  question_text,
  option_a,
  option_b,
  option_c,
  option_d,
  correct_option,
  difficulty = "medium"
}) => {
  const [result] = await pool.execute(
    "INSERT INTO questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, difficulty) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [
      quiz_id,
      question_text,
      option_a,
      option_b,
      option_c,
      option_d,
      correct_option,
      difficulty
    ]
  );
  return result.insertId;
};

//////
export const getQuestionsByQuiz = async (quizId) => {
  const [rows] = await pool.execute(
    "SELECT id, question_text, option_a, option_b, option_c, option_d, correct_option FROM questions WHERE quiz_id = ?",
    [quizId]
  );
  return rows;
};
