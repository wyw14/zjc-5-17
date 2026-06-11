interface Question {
  id: number;
  expression: string;
  correctAnswer: number;
  options: number[];
}

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const questionText = document.getElementById('question-text')!;
const optionBtns = document.querySelectorAll('.option-btn') as NodeListOf<HTMLButtonElement>;
const hpBar = document.getElementById('hp-bar')!;
const hpText = document.getElementById('hp-text')!;
const scoreText = document.getElementById('score-text')!;
const progressText = document.getElementById('progress-text')!;
const stageText = document.getElementById('stage-text')!;
const overlay = document.getElementById('overlay')!;
const overlayTitle = document.getElementById('overlay-title')!;
const overlayMsg = document.getElementById('overlay-msg')!;
const startBtn = document.getElementById('start-btn')!;

const MAX_HP = 5;
const QUESTIONS_PER_STAGE = 10;
const BASE_MONSTER_SPEED = 0.3;
const SPEED_INCREMENT_PER_STAGE = 0.15;

let hp = MAX_HP;
let score = 0;
let currentIndex = 0;
let questions: Question[] = [];
let isLocked = false;
let stage = 1;
let correctCount = 0;
let totalAnswered = 0;
let monsterSpeed = BASE_MONSTER_SPEED;
let isLoadingQuestions = false;

interface Particle { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; color: string; size: number; }
let particles: Particle[] = [];

interface WarriorState { x: number; y: number; swinging: boolean; swingTimer: number; facingLeft: boolean; }
let warrior: WarriorState;

interface MonsterState { x: number; y: number; targetX: number; alive: boolean; dying: boolean; deathTimer: number; hitFlash: number; }
let monster: MonsterState;

let damageFlash = 0;
let animFrame = 0;

function resize() {
  canvas.width = canvas.clientWidth * devicePixelRatio;
  canvas.height = canvas.clientHeight * devicePixelRatio;
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
}

window.addEventListener('resize', resize);
resize();

function initPositions() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  warrior = { x: w * 0.2, y: h * 0.55, swinging: false, swingTimer: 0, facingLeft: false };
  monster = { x: w * 0.85, y: h * 0.55, targetX: w * 0.65, alive: false, dying: false, deathTimer: 0, hitFlash: 0 };
}

initPositions();

function spawnParticles(x: number, y: number, count: number, color: string) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 3;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1,
      life: 30 + Math.random() * 20,
      maxLife: 50,
      color,
      size: 2 + Math.random() * 3,
    });
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.05;
    p.life--;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function drawParticles() {
  for (const p of particles) {
    const alpha = p.life / p.maxLife;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawWarrior() {
  const { x, y, swinging, swingTimer, facingLeft } = warrior;
  ctx.save();
  ctx.translate(x, y);
  if (facingLeft) ctx.scale(-1, 1);

  ctx.fillStyle = '#5dade2';
  ctx.fillRect(-10, -30, 20, 25);

  ctx.fillStyle = '#f0d9b5';
  ctx.beginPath();
  ctx.arc(0, -38, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#8e44ad';
  ctx.fillRect(-12, -50, 24, 8);

  ctx.fillStyle = '#f39c12';
  ctx.fillRect(-3, -46, 6, 6);

  ctx.fillStyle = '#2c3e50';
  ctx.fillRect(-8, -8, 7, 14);
  ctx.fillRect(1, -8, 7, 14);

  ctx.strokeStyle = '#bdc3c7';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(10, -25);
  ctx.lineTo(10, -55);
  ctx.stroke();

  if (swinging) {
    const swingAngle = Math.sin(swingTimer * 0.3) * 1.2;
    ctx.save();
    ctx.translate(10, -50);
    ctx.rotate(-0.5 + swingAngle);
    ctx.fillStyle = '#ecf0f1';
    ctx.fillRect(-2, 0, 4, 22);
    ctx.fillStyle = '#bdc3c7';
    ctx.fillRect(-5, 20, 10, 4);
    ctx.restore();
  } else {
    ctx.fillStyle = '#ecf0f1';
    ctx.save();
    ctx.translate(10, -50);
    ctx.rotate(-0.3);
    ctx.fillRect(-2, 0, 4, 22);
    ctx.fillStyle = '#bdc3c7';
    ctx.fillRect(-5, 20, 10, 4);
    ctx.restore();
  }

  ctx.restore();
}

function drawMonster() {
  if (!monster.alive && !monster.dying) return;
  const { x, y, dying, deathTimer, hitFlash } = monster;

  ctx.save();
  ctx.translate(x, y);

  if (dying) {
    const alpha = 1 - deathTimer / 20;
    ctx.globalAlpha = Math.max(0, alpha);
    const scale = 1 + deathTimer * 0.03;
    ctx.scale(scale, scale);
  }

  const bodyColor = hitFlash > 0 ? '#fff' : '#e74c3c';
  const eyeColor = hitFlash > 0 ? '#e74c3c' : '#f1c40f';

  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.ellipse(0, -10, 22, 28, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.moveTo(-15, -35);
  ctx.lineTo(-8, -22);
  ctx.lineTo(-22, -22);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(15, -35);
  ctx.lineTo(8, -22);
  ctx.lineTo(22, -22);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = eyeColor;
  ctx.beginPath();
  ctx.arc(-8, -14, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(8, -14, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#2c3e50';
  ctx.beginPath();
  ctx.arc(-8, -14, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(8, -14, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#2c3e50';
  ctx.beginPath();
  ctx.moveTo(-6, -2);
  ctx.lineTo(0, 4);
  ctx.lineTo(6, -2);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = bodyColor;
  ctx.fillRect(-14, 14, 10, 12);
  ctx.fillRect(4, 14, 10, 12);

  if (!dying && monster.alive && currentIndex < questions.length) {
    const q = questions[currentIndex];
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.font = 'bold 14px "Segoe UI", "PingFang SC", sans-serif';
    const tw = ctx.measureText(q.expression).width;
    const bgW = Math.max(tw + 24, 60);
    ctx.fillRect(-bgW / 2, -62, bgW, 22);
    ctx.fillStyle = '#f5c542';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(q.expression, 0, -51);
  }

  ctx.restore();
}

function drawGround() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  const groundY = h * 0.75;

  const grad = ctx.createLinearGradient(0, groundY, 0, h);
  grad.addColorStop(0, '#2d4a22');
  grad.addColorStop(1, '#1a3212');
  ctx.fillStyle = grad;
  ctx.fillRect(0, groundY, w, h - groundY);

  ctx.strokeStyle = '#3d6a32';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.lineTo(w, groundY);
  ctx.stroke();

  for (let i = 0; i < 8; i++) {
    const gx = ((i * 120 + animFrame * 0.2) % (w + 40)) - 20;
    ctx.strokeStyle = '#4a8a3a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(gx, groundY);
    ctx.lineTo(gx - 3, groundY - 8);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(gx, groundY);
    ctx.lineTo(gx + 3, groundY - 8);
    ctx.stroke();
  }
}

function drawDamageFlash() {
  if (damageFlash > 0) {
    ctx.fillStyle = `rgba(231, 76, 60, ${damageFlash / 15})`;
    ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    damageFlash--;
  }
}

function update() {
  animFrame++;

  if (monster.alive && !monster.dying) {
    if (monster.x > monster.targetX) {
      monster.x -= monsterSpeed;
    }
  }

  if (monster.dying) {
    monster.deathTimer++;
    if (monster.deathTimer >= 20) {
      monster.dying = false;
      monster.alive = false;
    }
  }

  if (warrior.swinging) {
    warrior.swingTimer++;
    if (warrior.swingTimer > 15) {
      warrior.swinging = false;
      warrior.swingTimer = 0;
    }
  }

  if (monster.hitFlash > 0) monster.hitFlash--;

  updateParticles();
}

function draw() {
  ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
  drawGround();
  drawWarrior();
  drawMonster();
  drawParticles();
  drawDamageFlash();
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

function updateHUD() {
  const pct = (hp / MAX_HP) * 100;
  hpBar.style.width = pct + '%';
  hpText.textContent = `❤️ ${hp} / ${MAX_HP}`;
  scoreText.textContent = `🏆 ${score}`;
  progressText.textContent = `⚔️ ${totalAnswered}`;
  stageText.textContent = `🏰 ${stage}`;
}

function showQuestion() {
  if (currentIndex >= questions.length) {
    loadNextBatch();
    return;
  }

  const q = questions[currentIndex];
  questionText.textContent = q.expression + ' = ?';

  optionBtns.forEach((btn, i) => {
    btn.textContent = String(q.options[i]);
    btn.className = 'option-btn';
    btn.disabled = false;
  });

  monster.x = canvas.clientWidth * 0.85;
  monster.targetX = canvas.clientWidth * 0.65;
  monster.alive = true;
  monster.dying = false;
  monster.deathTimer = 0;
  monster.hitFlash = 0;

  isLocked = false;
}

async function fetchQuestions(targetStage: number): Promise<Question[]> {
  const res = await fetch(`/api/questions?stage=${targetStage}`);
  const data = await res.json();
  return data.questions;
}

async function loadNextBatch() {
  if (isLoadingQuestions) return;
  isLoadingQuestions = true;
  try {
    const newQuestions = await fetchQuestions(stage);
    questions = newQuestions;
    currentIndex = 0;
    updateHUD();
    showQuestion();
  } catch {
    overlay.classList.remove('hidden');
    overlayTitle.textContent = '出错了';
    overlayMsg.textContent = '无法加载题目，请刷新重试';
    startBtn.textContent = '重试';
  } finally {
    isLoadingQuestions = false;
  }
}

function advanceStage() {
  stage++;
  monsterSpeed = BASE_MONSTER_SPEED + (stage - 1) * SPEED_INCREMENT_PER_STAGE;
  updateHUD();
}

async function startGame() {
  overlay.classList.add('hidden');
  hp = MAX_HP;
  score = 0;
  currentIndex = 0;
  correctCount = 0;
  totalAnswered = 0;
  stage = 1;
  monsterSpeed = BASE_MONSTER_SPEED;
  particles = [];
  damageFlash = 0;
  isLoadingQuestions = false;
  initPositions();
  updateHUD();

  try {
    questions = await fetchQuestions(stage);
  } catch {
    overlay.classList.remove('hidden');
    overlayTitle.textContent = '出错了';
    overlayMsg.textContent = '无法加载题目，请刷新重试';
    startBtn.textContent = '重试';
    return;
  }

  updateHUD();
  showQuestion();
}

function endGame() {
  overlay.classList.remove('hidden');
  overlayTitle.textContent = '💀 勇士倒下了';
  overlayMsg.textContent = `最终得分：${score}  |  闯过：${totalAnswered} 题  |  阶段：${stage}`;
  startBtn.textContent = '再来一局';
}

function handleAnswer(idx: number) {
  if (isLocked) return;
  isLocked = true;

  const q = questions[currentIndex];
  const selected = q.options[idx];
  const correct = selected === q.correctAnswer;

  optionBtns.forEach((btn, i) => {
    btn.disabled = true;
    if (q.options[i] === q.correctAnswer) {
      btn.classList.add('correct');
    } else if (i === idx) {
      btn.classList.add('wrong');
    }
  });

  if (correct) {
    score += 10 * stage;
    correctCount++;
    totalAnswered++;
    warrior.swinging = true;
    warrior.swingTimer = 0;
    monster.hitFlash = 8;

    if (correctCount >= QUESTIONS_PER_STAGE) {
      advanceStage();
      correctCount = 0;
    }

    setTimeout(() => {
      monster.alive = false;
      monster.dying = true;
      monster.deathTimer = 0;
      spawnParticles(monster.x, monster.y - 10, 25, '#e74c3c');
      spawnParticles(monster.x, monster.y - 10, 10, '#f5c542');
    }, 200);
  } else {
    hp--;
    totalAnswered++;
    damageFlash = 15;
    spawnParticles(warrior.x, warrior.y - 20, 15, '#e74c3c');
    if (hp <= 0) {
      setTimeout(() => {
        isLocked = true;
        endGame();
      }, 800);
      return;
    }
  }

  currentIndex++;
  updateHUD();

  setTimeout(() => {
    showQuestion();
  }, correct ? 800 : 1000);
}

optionBtns.forEach((btn, i) => {
  btn.addEventListener('click', () => handleAnswer(i));
});

startBtn.addEventListener('click', startGame);

gameLoop();
