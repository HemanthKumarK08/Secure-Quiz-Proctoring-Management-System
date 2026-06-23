import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import bodyParser from 'body-parser';

import authRoutes from './routes/authRoutes.js';
import quizRoutes from './routes/quizRoutes.js';
import attemptRoutes from './routes/attemptRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import questionRoutes from './routes/questionRoutes.js';   

dotenv.config();

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.json({ status: 'Online exam API running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/attempts', attemptRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/questions', questionRoutes);   

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
