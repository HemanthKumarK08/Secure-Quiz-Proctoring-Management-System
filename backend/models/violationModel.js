import { pool } from "../config/db.js";

export const logViolation = async ({ attempt_id, type, details }) => {
  // 🛡️ Protection: prevent DB crash if bad data comes
  if (!attempt_id || !type) {
    console.error("❌ Invalid violation data:", { attempt_id, type, details });
    return;
  }

  try {
    await pool.execute(
      "INSERT INTO violations (attempt_id, type, details) VALUES (?, ?, ?)",
      [attempt_id, type, details || null]
    );
  } catch (err) {
    console.error("❌ Failed to insert violation:", err.message);
  }
};

export const countViolationsForAttempt = async (attempt_id) => {
  if (!attempt_id) return 0;

  const [rows] = await pool.execute(
    "SELECT COUNT(*) AS count FROM violations WHERE attempt_id = ?",
    [attempt_id]
  );

  return rows[0]?.count || 0;
};
