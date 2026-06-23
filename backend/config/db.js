import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

export const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "Kkhemanth@123",
  database: process.env.DB_NAME || "dbms_project",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
