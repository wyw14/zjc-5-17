import express from 'express';
import path from 'path';
import { generateQuestions } from './questions';

const app = express();
const PORT = 5503;

app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/api/questions', (req, res) => {
  const stage = parseInt(String(req.query.stage || '1'), 10);
  const safeStage = isNaN(stage) || stage < 1 ? 1 : stage;
  const questions = generateQuestions(10, safeStage);
  res.json({ questions, stage: safeStage });
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Game server running at http://localhost:${PORT}`);
});
