CREATE DATABASE IF NOT EXISTS online_exam;
USE online_exam;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('student','admin') DEFAULT 'student',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quizzes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  duration_minutes INT NOT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  quiz_id INT NOT NULL,
  question_text TEXT NOT NULL,
  option_a VARCHAR(255) NOT NULL,
  option_b VARCHAR(255) NOT NULL,
  option_c VARCHAR(255),
  option_d VARCHAR(255),
  correct_option CHAR(1) NOT NULL,
  difficulty ENUM('easy','medium','hard') DEFAULT 'medium',
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS attempts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  quiz_id INT NOT NULL,
  user_id INT NOT NULL,
  start_time DATETIME,
  end_time DATETIME,
  score INT DEFAULT 0,
  status ENUM('in_progress','submitted','auto_submitted') DEFAULT 'in_progress',
  violations_count INT DEFAULT 0,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS responses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  attempt_id INT NOT NULL,
  question_id INT NOT NULL,
  selected_option CHAR(1),
  is_correct TINYINT(1),
  FOREIGN KEY (attempt_id) REFERENCES attempts(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS violations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  attempt_id INT NOT NULL,
  type VARCHAR(50) NOT NULL,
  details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (attempt_id) REFERENCES attempts(id) ON DELETE CASCADE
);

SHOW TABLES;
INSERT INTO users (name, email, password, role)
VALUES ('Admin', 'admin@gmail.com', 'admin123', 'admin');

UPDATE users SET role = 'admin' WHERE email = 'admin@gmail.com';

SELECT * FROM users;
SELECT * FROM quizzes;
SELECT * FROM attempts;
ALTER TABLE attempts ADD UNIQUE KEY unique_user_quiz (user_id, quiz_id);

UPDATE users
SET password = '$2b$10$uSk7f2cKfpKjEX4wah09luOxhjDv83OtnVIoUb4QmXgYFu6QFh9h6'
WHERE email = 'admin@gmail.com';

SELECT id, title 
FROM quizzes 
WHERE title = 'a';

-- OFF
SET SQL_SAFE_UPDATES = 0;
-- ON
SET SQL_SAFE_UPDATES = 1;

SELECT id, title, created_at
FROM quizzes
WHERE created_at = '2026-01-29 19:00:57';

DELETE v
FROM violations v
JOIN attempts a ON v.attempt_id = a.id
WHERE a.quiz_id = 1;

DELETE r
FROM responses r
JOIN attempts a ON r.attempt_id = a.id
WHERE a.quiz_id = 1;

DELETE FROM attempts
WHERE quiz_id = 1;

DELETE FROM quizzes
WHERE id = 1;




