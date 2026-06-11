interface Question {
  id: number;
  expression: string;
  correctAnswer: number;
  options: number[];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getDifficultyRange(stage: number): { addMin: number; addMax: number; subMin: number; subMax: number; ops: string[] } {
  if (stage <= 1) {
    return { addMin: 1, addMax: 50, subMin: 10, subMax: 99, ops: ['+', '-'] };
  } else if (stage <= 2) {
    return { addMin: 10, addMax: 99, subMin: 20, subMax: 199, ops: ['+', '-'] };
  } else if (stage <= 3) {
    return { addMin: 20, addMax: 199, subMin: 50, subMax: 399, ops: ['+', '-', '×'] };
  } else if (stage <= 4) {
    return { addMin: 50, addMax: 399, subMin: 100, subMax: 599, ops: ['+', '-', '×'] };
  } else if (stage <= 5) {
    return { addMin: 100, addMax: 599, subMin: 200, subMax: 899, ops: ['+', '-', '×', '÷'] };
  } else {
    const boost = (stage - 5) * 100;
    return {
      addMin: 200 + boost,
      addMax: 899 + boost,
      subMin: 300 + boost,
      subMax: 1299 + boost,
      ops: ['+', '-', '×', '÷'],
    };
  }
}

function generateQuestion(id: number, stage: number): Question {
  const diff = getDifficultyRange(stage);
  const op = diff.ops[randInt(0, diff.ops.length - 1)];
  let a: number, b: number, answer: number;
  let expression: string;

  switch (op) {
    case '+':
      a = randInt(diff.addMin, diff.addMax);
      b = randInt(diff.addMin, diff.addMax);
      answer = a + b;
      expression = `${a} + ${b}`;
      break;
    case '-':
      a = randInt(diff.subMin, diff.subMax);
      b = randInt(1, a);
      answer = a - b;
      expression = `${a} - ${b}`;
      break;
    case '×':
      a = randInt(2, Math.min(12 + stage, 20));
      b = randInt(2, Math.min(12 + stage, 20));
      answer = a * b;
      expression = `${a} × ${b}`;
      break;
    case '÷':
      b = randInt(2, Math.min(12 + stage, 20));
      answer = randInt(2, Math.min(12 + stage, 20));
      a = b * answer;
      expression = `${a} ÷ ${b}`;
      break;
    default:
      a = randInt(1, 50);
      b = randInt(1, 50);
      answer = a + b;
      expression = `${a} + ${b}`;
  }

  const optionSet = new Set<number>([answer]);
  const maxOffset = Math.max(5, Math.floor(answer * 0.15) + stage * 2);
  while (optionSet.size < 3) {
    const offset = randInt(1, maxOffset) * (Math.random() < 0.5 ? 1 : -1);
    const fake = answer + offset;
    if (fake >= 0 && fake !== answer) {
      optionSet.add(fake);
    }
  }

  return { id, expression, correctAnswer: answer, options: shuffle([...optionSet]) };
}

export function generateQuestions(count: number = 10, stage: number = 1): Question[] {
  const questions: Question[] = [];
  for (let i = 0; i < count; i++) {
    questions.push(generateQuestion(i + 1, stage));
  }
  return questions;
}

export type { Question };
