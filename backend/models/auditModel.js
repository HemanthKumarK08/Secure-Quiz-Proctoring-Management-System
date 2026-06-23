import { pool } from "../config/db.js";

export const logAudit = async ({ user_id, action, module, details = null }) => {
  await pool.execute(
    "INSERT INTO audit_logs (user_id, action, module, details) VALUES (?, ?, ?, ?)",
    [user_id, action, module, details]
  );
};

export const getAuditLogs = async (limit = 100) => {
  const [rows] = await pool.query(
    `SELECT al.id, al.action, al.module, al.details, al.created_at,
            u.name AS user_name, u.role AS user_role
     FROM audit_logs al
     LEFT JOIN users u ON al.user_id = u.id
     ORDER BY al.created_at DESC
     LIMIT ?`,
    [limit]
  );
  return rows;
};
