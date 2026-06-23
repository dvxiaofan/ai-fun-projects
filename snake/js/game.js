const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const highScoreEl = document.getElementById("high-score");
const overlay = document.getElementById("overlay");
const overlayMsg = document.getElementById("overlay-msg");

const GRID = 20;
const COLS = canvas.width / GRID;
const ROWS = canvas.height / GRID;

let snake, dir, nextDir, food, score, highScore, running, loopId;

highScore = parseInt(localStorage.getItem("snake-high") || "0");
highScoreEl.textContent = highScore;

function init() {
  const mid = Math.floor(ROWS / 2);
  snake = [
    { x: 5, y: mid },
    { x: 4, y: mid },
    { x: 3, y: mid },
  ];
  dir = { x: 1, y: 0 };
  nextDir = { x: 1, y: 0 };
  score = 0;
  scoreEl.textContent = 0;
  spawnFood();
  running = true;
  overlay.classList.add("hidden");
  if (loopId) clearInterval(loopId);
  loopId = setInterval(tick, 120);
}

function spawnFood() {
  while (true) {
    food = {
      x: Math.floor(Math.random() * COLS),
      y: Math.floor(Math.random() * ROWS),
    };
    if (!snake.some((s) => s.x === food.x && s.y === food.y)) break;
  }
}

function tick() {
  dir = nextDir;
  const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

  // 撞墙或撞自己
  if (
    head.x < 0 || head.x >= COLS ||
    head.y < 0 || head.y >= ROWS ||
    snake.some((s) => s.x === head.x && s.y === head.y)
  ) {
    gameOver();
    return;
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score++;
    scoreEl.textContent = score;
    if (score > highScore) {
      highScore = score;
      highScoreEl.textContent = highScore;
      localStorage.setItem("snake-high", highScore);
    }
    spawnFood();
  } else {
    snake.pop();
  }

  draw();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 画网格线（淡）
  ctx.strokeStyle = "rgba(255,255,255,0.03)";
  for (let i = 0; i <= COLS; i++) {
    ctx.beginPath();
    ctx.moveTo(i * GRID, 0);
    ctx.lineTo(i * GRID, canvas.height);
    ctx.stroke();
  }
  for (let i = 0; i <= ROWS; i++) {
    ctx.beginPath();
    ctx.moveTo(0, i * GRID);
    ctx.lineTo(canvas.width, i * GRID);
    ctx.stroke();
  }

  // 画蛇
  snake.forEach((seg, i) => {
    const brightness = 1 - i / snake.length * 0.5;
    ctx.fillStyle = i === 0
      ? "#00d2ff"
      : `rgba(0, 210, 255, ${brightness * 0.7})`;
    ctx.fillRect(seg.x * GRID + 1, seg.y * GRID + 1, GRID - 2, GRID - 2);
  });

  // 画食物
  ctx.fillStyle = "#ff6b6b";
  ctx.beginPath();
  ctx.arc(
    food.x * GRID + GRID / 2,
    food.y * GRID + GRID / 2,
    GRID / 2 - 2, 0, Math.PI * 2
  );
  ctx.fill();
}

function gameOver() {
  running = false;
  clearInterval(loopId);
  overlayMsg.textContent = `游戏结束！得分: ${score}`;
  overlay.classList.remove("hidden");
  setTimeout(() => {
    overlayMsg.textContent = "按空格键重新开始";
  }, 1500);
}

// 键盘控制
document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    e.preventDefault();
    if (!running) init();
    return;
  }

  const keyMap = {
    ArrowUp:    { x: 0, y: -1 },
    ArrowDown:  { x: 0, y: 1 },
    ArrowLeft:  { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 },
    KeyW: { x: 0, y: -1 },
    KeyS: { x: 0, y: 1 },
    KeyA: { x: -1, y: 0 },
    KeyD: { x: 1, y: 0 },
  };

  const newDir = keyMap[e.code];
  if (newDir && (newDir.x + dir.x !== 0 || newDir.y + dir.y !== 0)) {
    nextDir = newDir;
  }
});

// 初始画面
draw();
