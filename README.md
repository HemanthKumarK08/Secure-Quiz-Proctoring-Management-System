# 🛡️ Online Exam Proctoring System

A full-stack **Online Exam Proctoring System** developed using **HTML, CSS, JavaScript, Node.js, Express.js, and MySQL**. The system enables secure online examinations with role-based authentication, browser-based malpractice detection, automated evaluation, and comprehensive admin and student dashboards.

---

## 📖 Overview

The **Online Exam Proctoring System** is designed to conduct secure online examinations while maintaining exam integrity through browser-based monitoring. The application provides separate dashboards for **Administrators** and **Students**, allowing efficient quiz management, automated evaluation, performance tracking, and result generation.

---

## ✨ Key Features

### 🔐 Authentication
- Secure Login & Registration
- JWT-based Authentication
- Role-Based Access Control (Admin & Student)

### 👨‍💼 Admin Features
- Create & Manage Quizzes
- Manual Question Management
- Monitor Student Attempts
- View Quiz Results
- Export Results to Excel
- Track Malpractice Violations
- Student Management Dashboard

### 👨‍🎓 Student Features
- Secure Login
- View Available Quizzes
- Attempt Timed Quizzes
- View Previous Attempts
- Performance Summary Dashboard
- Search & Filter Attempt History

### 📝 Online Examination
- Timer-Based MCQ Exams
- Automatic Score Calculation
- Previous / Next Navigation
- Instant Result Generation

### 🛡️ Browser-Based Proctoring
- Tab Switch Detection
- Browser Focus Monitoring
- Violation Tracking
- Automatic Quiz Submission after Maximum Violations

### 📊 Reports & Analytics
- Quiz-wise Results
- Student Performance Reports
- Attempt History
- Excel Report Download

---

# 🏗️ Project Structure

```text
Online-Exam-Proctoring/
│
├── backend/
│   ├── config/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── app.js
│   └── package.json
│
├── frontend/
│   ├── css/
│   ├── js/
│   ├── index.html
│   ├── register.html
│   ├── admin-dashboard.html
│   ├── student-dashboard.html
│   ├── create-questions.html
│   ├── quiz.html
│   └── result.html
│
├── database/
│   └── online_exam.sql
│
└── README.md
```

---

# 💻 Tech Stack

## Frontend
- HTML5
- CSS3
- JavaScript
- Bootstrap 5

## Backend
- Node.js
- Express.js

## Database
- MySQL

## Libraries
- JWT
- bcrypt.js
- XLSX
- Bootstrap
- Font Awesome

---

# 📂 Modules

### Admin Module
- Authentication
- Quiz Management
- Question Management
- Live Monitoring
- Student Management
- Result Analytics
- Report Export

### Student Module
- Authentication
- Quiz Attempt
- Attempt History
- Performance Dashboard

### Proctoring Module
- Tab Switch Detection
- Window Focus Detection
- Violation Logging
- Automatic Submission

---

# 🔄 System Workflow

```text
Admin Login
      │
      ▼
Create Quiz
      │
      ▼
Add Questions
      │
      ▼
Publish Quiz
      │
      ▼
Student Login
      │
      ▼
Attempt Quiz
      │
      ▼
Browser Monitoring
      │
      ▼
Automatic Evaluation
      │
      ▼
Result Generation
      │
      ▼
Performance Report
```

---

# 🛡️ Proctoring Workflow

```text
Start Quiz
     │
     ▼
Browser Monitoring
     │
     ▼
Tab Switch / Focus Lost
     │
     ▼
Violation Recorded
     │
     ▼
Maximum Violations Reached
     │
     ▼
Auto Submit Quiz
     │
     ▼
Generate Result
```

---

# 🗄️ Database Tables

- Users
- Quizzes
- Questions
- Attempts
- Violations

---

# 🚀 Getting Started

## 1️⃣ Clone Repository

```bash
git clone https://github.com/your-username/online-exam-proctoring.git](https://github.com/HemanthKumarK08/Secure-Quiz-Proctoring-Management-System.git
```

## 2️⃣ Navigate to Backend

```bash
cd backend
```

## 3️⃣ Install Dependencies

```bash
npm install
```

## 4️⃣ Configure Database

Create a MySQL database:

```sql
CREATE DATABASE online_exam;
```

Import the provided SQL file into MySQL.

Update the database configuration in:

```
backend/config/db.js
```

## 5️⃣ Start Backend Server

```bash
npm start
```

or

```bash
node app.js
```

The server will start at:

```
http://localhost:3000
```

## 6️⃣ Run Frontend

Open the frontend using **Live Server** or any local web server.

```
frontend/index.html
```

---

# 🔮 Future Enhancements

- Bulk Question Upload (CSV/DOCX)
- AI-Based Face Detection
- Webcam Monitoring
- AI Question Generator
- Leaderboard
- Certificate Generation
- Email Notifications
- Cloud Deployment

---

# 📚 Learning Outcomes

- Full Stack Web Development
- REST API Development
- Authentication & Authorization
- MySQL Database Design
- Browser-Based Proctoring
- Role-Based Access Control
- Express.js Backend
- Database Integration
- Responsive UI Development

---

# 👨‍💻 Author

**Hemanth Kumar K**

🎓 Master of Computer Applications (MCA)  
🏫 Bangalore Institute of Technology (BIT), Bengaluru

