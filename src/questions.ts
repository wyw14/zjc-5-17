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

function generateQuestion(id: number): Question {
  const op = Math.random() < 0.5 ? '+' : '-';
  let a: number, b: number, answer: number;

  if (op === '+') {
    a = randInt(1, 50);
    b = randInt(1, 50);
    answer = a + b;
  } else {
    a = randInt(10, 99);
    b = randInt(1, a);
    answer = a - b;
  }

  const expression = `${a} ${op} ${b}`;

  const optionSet = new Set<number>([answer]);
  while (optionSet.size < 3) {
    const offset = randInt(1, 5) * (Math.random() < 0.5 ? 1 : -1);
    const fake = answer + offset;
    if (fake >= 0 && fake !== answer) {
      optionSet.add(fake);
    }
  }

  return { id, expression, correctAnswer: answer, options: shuffle([...optionSet]) };
}

export function generateQuestions(count: number = 50): Question[] {
  const questions: Question[] = [];
  for (let i = 0; i < count; i++) {
    questions.push(generateQuestion(i + 1));
  }
  return questions;
}

export type { Question };
