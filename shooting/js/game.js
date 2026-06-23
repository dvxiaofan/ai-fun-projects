const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const highScoreEl = document.getElementById("high-score");
const livesEl = document.getElementById("lives");
const overlay = document.getElementById("overlay");
const overlayMsg = document.getElementById("overlay-msg");

const W = canvas.width;
const H = canvas.height;

let player, bullets, enemies, enemyBullets, particles;
let score, highScore, lives, wave, running, frameId;
let lastShot, lastEnemy, bossActive, boss;
let keys = {};

highScore = parseInt(localStorage.getItem("shooting-high") || "0");
highScoreEl.textContent = highScore;

function init() {
  player = { x: W / 2, y: H - 60, w: 28, h: 28, speed: 5, invincible: 0 };
  bullets = [];
  enemies = [];
  enemyBullets = [];
  particles = [];
  score = 0;
  lives = 3;
  wave = 0;
  bossActive = false;
  boss = null;
  lastShot = 0;
  lastEnemy = 0;
  running = true;
  scoreEl.textContent = 0;
  updateLives();
  overlay.classList.add("hidden");
  if (frameId) cancelAnimationFrame(frameId);
  loop(performance.now());
}

function updateLives() {
  livesEl.textContent = "❤️".repeat(lives);
}

function spawnEnemy() {
  if (bossActive) return;
  const types = [
    { w: 24, h: 24, hp: 1, speed: 1.5, color: "#e74c3c", score: 10 },
    { w: 28, h: 28, hp: 2, speed: 1, color: "#9b59b6", score: 20 },
    { w: 32, h: 32, hp: 3, speed: 0.8, color: "#3498db", score: 30 },
  ];
  const t = types[Math.floor(Math.random() * types.length)];
  enemies.push({
    x: 30 + Math.random() * (W - 60),
    y: -30,
    ...t,
    angle: 0,
    shootTimer: 0,
  });
}

function spawnBoss() {
  bossActive = true;
  boss = {
    x: W / 2,
    y: -60,
    targetY: 80,
    w: 60,
    h: 50,
    hp: 30 + wave * 10,
    maxHp: 30 + wave * 10,
    phase: 0,
    timer: 0,
    entered: false,
  };
}

function shoot() {
  const now = performance.now();
  if (now - lastShot < 150) return;
  lastShot = now;
  bullets.push({ x: player.x, y: player.y - 16, vy: -8, w: 4, h: 10 });
}

function enemyShoot(ex, ey, angle, speed) {
  enemyBullets.push({
    x: ex, y: ey,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    r: 4,
  });
}

function explode(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 3;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 20 + Math.random() * 20,
      color,
      r: 2 + Math.random() * 3,
    });
  }
}

function addScore(n) {
  score += n;
  scoreEl.textContent = score;
  if (score > highScore) {
    highScore = score;
    highScoreEl.textContent = highScore;
    localStorage.setItem("shooting-high", highScore);
  }
}

function update(now) {
  // 玩家移动
  if (keys.ArrowLeft || keys.KeyA) player.x -= player.speed;
  if (keys.ArrowRight || keys.KeyD) player.x += player.speed;
  if (keys.ArrowUp || keys.KeyW) player.y -= player.speed;
  if (keys.ArrowDown || keys.KeyS) player.y += player.speed;
  player.x = Math.max(player.w / 2, Math.min(W - player.w / 2, player.x));
  player.y = Math.max(player.h / 2, Math.min(H - player.h / 2, player.y));

  // 无敌时间
  if (player.invincible > 0) player.invincible--;

  // 自动射击
  if (keys.Space || keys.KeyJ) shoot();

  // 子弹移动
  for (let i = bullets.length - 1; i >= 0; i--) {
    bullets[i].y += bullets[i].vy;
    if (bullets[i].y < -20) bullets.splice(i, 1);
  }

  // 波次生成
  if (!bossActive && enemies.length === 0) {
    wave++;
    if (wave % 5 === 0) {
      spawnBoss();
    } else {
      const count = 3 + wave;
      for (let i = 0; i < count; i++) {
        setTimeout(() => spawnEnemy(), i * 300);
      }
    }
  }

  // 敌人移动
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    e.y += e.speed;
    e.angle += 0.03;
    e.x += Math.sin(e.angle) * 0.8;

    // 敌人射击
    e.shootTimer++;
    if (e.shootTimer > 60) {
      e.shootTimer = 0;
      const angle = Math.atan2(player.y - e.y, player.x - e.x);
      enemyShoot(e.x, e.y, angle, 3);
    }

    if (e.y > H + 30) { enemies.splice(i, 1); continue; }

    // 被子弹击中
    for (let j = bullets.length - 1; j >= 0; j--) {
      const b = bullets[j];
      if (Math.abs(b.x - e.x) < (e.w / 2 + b.w / 2) &&
          Math.abs(b.y - e.y) < (e.h / 2 + b.h / 2)) {
        bullets.splice(j, 1);
        e.hp--;
        if (e.hp <= 0) {
          explode(e.x, e.y, e.color, 8);
          addScore(e.score);
          enemies.splice(i, 1);
        }
        break;
      }
    }
  }

  // Boss 逻辑
  if (bossActive && boss) {
    if (!boss.entered) {
      boss.y += 1.5;
      if (boss.y >= boss.targetY) {
        boss.entered = true;
        boss.y = boss.targetY;
      }
    } else {
      boss.x += Math.sin(now / 800) * 2;
      boss.timer++;

      // Boss 弹幕
      if (boss.timer % 15 === 0) {
        const baseAngle = now / 500;
        for (let i = 0; i < 6; i++) {
          const a = baseAngle + (Math.PI * 2 / 6) * i;
          enemyShoot(boss.x, boss.y + boss.h / 2, a, 3);
        }
      }
      if (boss.timer % 40 === 0) {
        for (let i = 0; i < 3; i++) {
          const a = Math.PI / 2 + (i - 1) * 0.3;
          enemyShoot(boss.x, boss.y + boss.h / 2, a, 4);
        }
      }
    }

    // Boss 被击中
    for (let j = bullets.length - 1; j >= 0; j--) {
      const b = bullets[j];
      if (Math.abs(b.x - boss.x) < (boss.w / 2 + b.w / 2) &&
          Math.abs(b.y - boss.y) < (boss.h / 2 + b.h / 2)) {
        bullets.splice(j, 1);
        boss.hp--;
        if (boss.hp <= 0) {
          explode(boss.x, boss.y, "#ff6b9d", 30);
          addScore(100);
          bossActive = false;
          boss = null;
        }
      }
    }
  }

  // 敌方子弹移动 + 碰撞
  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    const b = enemyBullets[i];
    b.x += b.vx;
    b.y += b.vy;
    if (b.x < -10 || b.x > W + 10 || b.y < -10 || b.y > H + 10) {
      enemyBullets.splice(i, 1);
      continue;
    }

    // 击中玩家
    if (player.invincible <= 0 &&
        Math.abs(b.x - player.x) < (player.w / 2 + b.r) &&
        Math.abs(b.y - player.y) < (player.h / 2 + b.r)) {
      enemyBullets.splice(i, 1);
      hitPlayer();
    }
  }

  // 敌人撞玩家
  for (const e of enemies) {
    if (player.invincible <= 0 &&
        Math.abs(e.x - player.x) < (e.w / 2 + player.w / 2) &&
        Math.abs(e.y - player.y) < (e.h / 2 + player.h / 2)) {
      hitPlayer();
    }
  }

  // 粒子
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function hitPlayer() {
  lives--;
  updateLives();
  explode(player.x, player.y, "#ff6b9d", 15);
  player.invincible = 90;
  if (lives <= 0) {
    running = false;
    overlayMsg.textContent = `游戏结束 · 得分: ${score}`;
    overlay.classList.remove("hidden");
    setTimeout(() => {
      overlayMsg.textContent = "按空格键重新开始";
    }, 1500);
  }
}

function draw() {
  // 背景
  ctx.fillStyle = "#0a0a1a";
  ctx.fillRect(0, 0, W, H);

  // 星星背景
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  for (let i = 0; i < 30; i++) {
    const sx = (i * 137 + performance.now() * 0.01) % W;
    const sy = (i * 251 + performance.now() * 0.02) % H;
    ctx.fillRect(sx, sy, 1.5, 1.5);
  }

  // 玩家
  if (player.invincible <= 0 || Math.floor(player.invincible / 4) % 2 === 0) {
    ctx.save();
    ctx.translate(player.x, player.y);
    // 机身
    ctx.fillStyle = "#ff6b9d";
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.lineTo(-12, 14);
    ctx.lineTo(0, 8);
    ctx.lineTo(12, 14);
    ctx.closePath();
    ctx.fill();
    // 驾驶舱
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(0, -2, 4, 0, Math.PI * 2);
    ctx.fill();
    // 引擎光
    ctx.fillStyle = "#ffeb3b";
    ctx.globalAlpha = 0.5 + Math.sin(performance.now() / 50) * 0.3;
    ctx.beginPath();
    ctx.ellipse(0, 16, 4, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // 玩家子弹
  ctx.fillStyle = "#ffeb3b";
  for (const b of bullets) {
    ctx.fillRect(b.x - b.w / 2, b.y, b.w, b.h);
  }

  // 敌人
  for (const e of enemies) {
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.fillStyle = e.color;
    ctx.beginPath();
    ctx.arc(0, 0, e.w / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.arc(-3, -3, e.w / 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // Boss
  if (bossActive && boss) {
    ctx.save();
    ctx.translate(boss.x, boss.y);
    // 身体
    ctx.fillStyle = "#e91e63";
    ctx.beginPath();
    ctx.moveTo(0, -25);
    ctx.lineTo(-30, 20);
    ctx.lineTo(30, 20);
    ctx.closePath();
    ctx.fill();
    // 核心
    ctx.fillStyle = "#ff5722";
    ctx.beginPath();
    ctx.arc(0, 5, 10, 0, Math.PI * 2);
    ctx.fill();
    // 血条
    ctx.fillStyle = "#333";
    ctx.fillRect(-30, -35, 60, 5);
    ctx.fillStyle = "#ff1744";
    ctx.fillRect(-30, -35, 60 * (boss.hp / boss.maxHp), 5);
    ctx.restore();
  }

  // 敌方子弹
  ctx.fillStyle = "#ff1744";
  for (const b of enemyBullets) {
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // 粒子
  for (const p of particles) {
    ctx.globalAlpha = p.life / 40;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function loop(now) {
  if (running) {
    update(now);
  }
  draw();
  frameId = requestAnimationFrame(loop);
}

// 输入
document.addEventListener("keydown", (e) => {
  keys[e.code] = true;
  if (e.code === "Space") e.preventDefault();
  if (!running && (e.code === "Space" || e.code === "KeyJ")) init();
});
document.addEventListener("keyup", (e) => {
  keys[e.code] = false;
});

// 初始画面
draw();
