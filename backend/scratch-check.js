import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASS || "Kkhemanth@123",
    database: process.env.DB_NAME || "online_exam",
  });

  const [logs] = await connection.execute("SELECT * FROM audit_logs ORDER BY id DESC LIMIT 20");
  console.log("AUDIT LOGS:");
  console.log(JSON.stringify(logs, null, 2));

  await connection.end();
}

run().catch(console.error);
