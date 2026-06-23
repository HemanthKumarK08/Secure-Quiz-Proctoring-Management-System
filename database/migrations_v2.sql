-- Run this on an existing online_exam database
USE online_exam;

-- Soft delete timestamp (keeps is_active for backward compatibility)
ALTER TABLE quizzes ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL;

-- Audit log table
CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  action VARCHAR(100) NOT NULL,
  module VARCHAR(50) NOT NULL,
  details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Unique constraint for one attempt per student per quiz (if not already added)
-- ALTER TABLE attempts ADD UNIQUE KEY unique_user_quiz (user_id, quiz_id);
