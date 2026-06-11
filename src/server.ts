import express from 'express';
import path from 'path';
import { generateQuestions } from './questions';

const app = express();
const PORT = 5503;

app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/api/questions', (_req, res) => {
  const questions = generateQuestions(50);
  res.json({ questions });
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Game server running at http://localhost:${PORT}`);
});
