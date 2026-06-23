const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const highScoreEl = document.getElementById("high-score");
const overlay = document.getElementById("overlay");
const overlayMsg = document.getElementById("overlay-msg");

const W = canvas.width;
const H = canvas.height;

// 小鸟
const BIRD = { x: 80, w: 28, h: 22, gravity: 0.45, flap: -7.5 };

// 管道
const PIPE_W = 52;
const PIPE_GAP = 130;
const PIPE_SPEED = 2.5;
const PIPE_INTERVAL = 1600; // ms

let bird, pipes, score, highScore, running, lastPipe, frameId;
let groundX = 0;

highScore = parseInt(localStorage.getItem("flappy-high") || "0");
highScoreEl.textContent = highScore;

function init() {
  bird = { y: H / 2 - 20, vy: 0, angle: 0 };
  pipes = [];
  score = 0;
  scoreEl.textContent = 0;
  running = true;
  lastPipe = 0;
  overlay.classList.add("hidden");
  if (frameId) cancelAnimationFrame(frameId);
  loop(performance.now());
}

function spawnPipe() {
  const minY = 60;
  const maxY = H - PIPE_GAP - 60;
  const topH = minY + Math.random() * (maxY - minY);
  pipes.push({ x: W, topH, scored: false });
}

function flap() {
  if (!running) {
    init();
    return;
  }
  bird.vy = BIRD.flap;
}

function update(dt, now) {
  // 小鸟物理
  bird.vy += BIRD.gravity;
  if (bird.vy > 10) bird.vy = 10; // 限制最大下落速度，防穿管
  bird.y += bird.vy;
  bird.angle = Math.min(Math.max(bird.vy * 3, -30), 70);

  // 地面滚动
  groundX = (groundX - PIPE_SPEED) % 24;

  // 管道生成
  if (now - lastPipe > PIPE_INTERVAL) {
    spawnPipe();
    lastPipe = now;
  }

  // 管道移动
  for (let i = pipes.length - 1; i >= 0; i--) {
    const p = pipes[i];
    p.x -= PIPE_SPEED;

    // 得分
    if (!p.scored && p.x + PIPE_W < BIRD.x) {
      p.scored = true;
      score++;
      scoreEl.textContent = score;
      if (score > highScore) {
        highScore = score;
        highScoreEl.textContent = highScore;
        localStorage.setItem("flappy-high", highScore);
      }
    }

    // 移除屏幕外管道
    if (p.x + PIPE_W < -10) pipes.splice(i, 1);
  }

  // 碰撞检测（缩小碰撞箱 4px 容错）
  const M = 4;
  const bx = BIRD.x - BIRD.w / 2 + M;
  const by = bird.y - BIRD.h / 2 + M;
  const bw = BIRD.w - M * 2;
  const bh = BIRD.h - M * 2;

  // 地面 / 天花板
  if (bird.y + BIRD.h / 2 > H - 40 || bird.y - BIRD.h / 2 < 0) {
    die();
    return;
  }

  // 管道碰撞
  for (const p of pipes) {
    if (
      bx + bw > p.x && bx < p.x + PIPE_W &&
      (by < p.topH || by + bh > p.topH + PIPE_GAP)
    ) {
      die();
      return;
    }
  }
}

function die() {
  running = false;
  overlayMsg.textContent = `得分: ${score}`;
  overlay.classList.remove("hidden");
  setTimeout(() => {
    overlayMsg.textContent = "点击或空格重新开始";
  }, 1200);
}

function draw() {
  // 天空
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#4ec0ca");
  sky.addColorStop(1, "#70d6d0");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  // 云朵
  drawCloud(40, 60, 1);
  drawCloud(180, 100, 0.7);
  drawCloud(260, 40, 0.5);

  // 管道
  ctx.fillStyle = "#2ecc71";
  ctx.strokeStyle = "#27ae60";
  ctx.lineWidth = 2;
  for (const p of pipes) {
    // 上管道
    ctx.fillStyle = "#2ecc71";
    ctx.fillRect(p.x, 0, PIPE_W, p.topH);
    ctx.fillStyle = "#27ae60";
    ctx.fillRect(p.x - 3, p.topH - 20, PIPE_W + 6, 20);

    // 下管道
    const bottomY = p.topH + PIPE_GAP;
    ctx.fillStyle = "#2ecc71";
    ctx.fillRect(p.x, bottomY, PIPE_W, H - bottomY - 40);
    ctx.fillStyle = "#27ae60";
    ctx.fillRect(p.x - 3, bottomY, PIPE_W + 6, 20);
  }

  // 地面
  ctx.fillStyle = "#ded895";
  ctx.fillRect(0, H - 40, W, 40);
  ctx.fillStyle = "#c8b862";
  ctx.fillRect(0, H - 40, W, 4);

  // 小鸟
  ctx.save();
  ctx.translate(BIRD.x, bird.y);
  ctx.rotate((bird.angle * Math.PI) / 180);

  // 身体
  ctx.fillStyle = "#f1c40f";
  ctx.beginPath();
  ctx.ellipse(0, 0, BIRD.w / 2, BIRD.h / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#e67e22";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // 翅膀
  const wingY = Math.sin(performance.now() / 80) * 4;
  ctx.fillStyle = "#e67e22";
  ctx.beginPath();
  ctx.ellipse(-4, wingY - 2, 8, 5, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // 眼睛
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(8, -4, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.arc(9, -4, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // 嘴
  ctx.fillStyle = "#e74c3c";
  ctx.beginPath();
  ctx.moveTo(12, 0);
  ctx.lineTo(20, 2);
  ctx.lineTo(12, 5);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawCloud(x, y, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.beginPath();
  ctx.arc(0, 0, 20, 0, Math.PI * 2);
  ctx.arc(20, -5, 15, 0, Math.PI * 2);
  ctx.arc(-18, 2, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function loop(now) {
  if (running) {
    update(16, now);
  }
  draw();
  frameId = requestAnimationFrame(loop);
}

// 输入
document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    e.preventDefault();
    flap();
  }
});

canvas.addEventListener("click", flap);
canvas.addEventListener("touchstart", (e) => {
  e.preventDefault();
  flap();
});

// 初始画面
draw();
