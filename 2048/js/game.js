const boardEl = document.getElementById("board");
const scoreEl = document.getElementById("score");
const highScoreEl = document.getElementById("high-score");
const overlay = document.getElementById("overlay");
const overlayMsg = document.getElementById("overlay-msg");
const newGameBtn = document.getElementById("new-game");
const retryBtn = document.getElementById("retry-btn");

const SIZE = 4;
const GAP = 12;
const PADDING = 12;
const CELL_SIZE = (420 - PADDING * 2 - GAP * (SIZE - 1)) / SIZE;

let grid, score, highScore, won, over;

const COLORS = {
  2:    { bg: "#eee4da", fg: "#776e65", size: 36 },
  4:    { bg: "#ede0c8", fg: "#776e65", size: 36 },
  8:    { bg: "#f2b179", fg: "#f9f6f2", size: 36 },
  16:   { bg: "#f59563", fg: "#f9f6f2", size: 36 },
  32:   { bg: "#f67c5f", fg: "#f9f6f2", size: 36 },
  64:   { bg: "#f65e3b", fg: "#f9f6f2", size: 36 },
  128:  { bg: "#edcf72", fg: "#f9f6f2", size: 32 },
  256:  { bg: "#edcc61", fg: "#f9f6f2", size: 32 },
  512:  { bg: "#edc850", fg: "#f9f6f2", size: 32 },
  1024: { bg: "#edc53f", fg: "#f9f6f2", size: 26 },
  2048: { bg: "#edc22e", fg: "#f9f6f2", size: 26 },
};

highScore = parseInt(localStorage.getItem("2048-high") || "0");
highScoreEl.textContent = highScore;

function init() {
  grid = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
  score = 0;
  won = false;
  over = false;
  scoreEl.textContent = 0;
  overlay.classList.add("hidden");
  addRandom();
  addRandom();
  render();
}

function addRandom() {
  const empty = [];
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++)
      if (grid[r][c] === 0) empty.push([r, c]);
  if (empty.length === 0) return;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  grid[r][c] = Math.random() < 0.9 ? 2 : 4;
  return { r, c };
}

function getPos(r, c) {
  return {
    top: PADDING + r * (CELL_SIZE + GAP),
    left: PADDING + c * (CELL_SIZE + GAP),
  };
}

function render(newTiles = [], mergedTiles = []) {
  // 清除旧方块
  boardEl.querySelectorAll(".tile").forEach((el) => el.remove());

  // 画背景格子
  if (boardEl.children.length === 0) {
    for (let i = 0; i < SIZE * SIZE; i++) {
      const div = document.createElement("div");
      div.className = "cell-bg";
      boardEl.appendChild(div);
    }
  }

  // 画方块
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const val = grid[r][c];
      if (val === 0) continue;
      const { top, left } = getPos(r, c);
      const tile = document.createElement("div");
      const style = COLORS[val] || { bg: "#3c3a32", fg: "#f9f6f2", size: 22 };
      tile.className = "tile";
      tile.textContent = val;
      tile.style.top = top + "px";
      tile.style.left = left + "px";
      tile.style.width = CELL_SIZE + "px";
      tile.style.height = CELL_SIZE + "px";
      tile.style.background = style.bg;
      tile.style.color = style.fg;
      tile.style.fontSize = style.size + "px";

      if (newTiles.some((t) => t.r === r && t.c === c)) {
        tile.classList.add("new");
      }
      if (mergedTiles.some((t) => t.r === r && t.c === c)) {
        tile.classList.add("merged");
      }

      boardEl.appendChild(tile);
    }
  }
}

function slide(row) {
  let arr = row.filter((v) => v !== 0);
  const merged = [];
  for (let i = 0; i < arr.length - 1; i++) {
    if (arr[i] === arr[i + 1]) {
      arr[i] *= 2;
      merged.push(i);
      arr.splice(i + 1, 1);
      score += arr[i];
    }
  }
  while (arr.length < SIZE) arr.push(0);
  return { result: arr, merged };
}

function move(dir) {
  if (over) return false;
  let moved = false;
  const mergedTiles = [];

  const process = (r, c, getVal, setVal) => {
    const row = [];
    for (let i = 0; i < SIZE; i++) row.push(getVal(i));
    const { result, merged } = slide(row);
    for (let i = 0; i < SIZE; i++) {
      if (getVal(i) !== result[i]) {
        setVal(i, result[i]);
        moved = true;
      }
    }
    merged.forEach((idx) => {
      if (dir === "left") mergedTiles.push({ r, c: idx });
      if (dir === "right") mergedTiles.push({ r, c: SIZE - 1 - idx });
      if (dir === "up") mergedTiles.push({ r: idx, c });
      if (dir === "down") mergedTiles.push({ r: SIZE - 1 - idx, c });
    });
  };

  if (dir === "left") {
    for (let r = 0; r < SIZE; r++)
      process(r, 0, (i) => grid[r][i], (i, v) => (grid[r][i] = v));
  } else if (dir === "right") {
    for (let r = 0; r < SIZE; r++)
      process(r, 0, (i) => grid[r][SIZE - 1 - i], (i, v) => (grid[r][SIZE - 1 - i] = v));
  } else if (dir === "up") {
    for (let c = 0; c < SIZE; c++)
      process(0, c, (i) => grid[i][c], (i, v) => (grid[i][c] = v));
  } else if (dir === "down") {
    for (let c = 0; c < SIZE; c++)
      process(0, c, (i) => grid[SIZE - 1 - i][c], (i, v) => (grid[SIZE - 1 - i][c] = v));
  }

  if (!moved) return false;

  scoreEl.textContent = score;
  if (score > highScore) {
    highScore = score;
    highScoreEl.textContent = highScore;
    localStorage.setItem("2048-high", highScore);
  }

  const newTile = addRandom();
  render(newTile ? [newTile] : [], mergedTiles);

  // 检查 2048
  if (!won) {
    for (let r = 0; r < SIZE; r++)
      for (let c = 0; c < SIZE; c++)
        if (grid[r][c] === 2048) {
          won = true;
          setTimeout(() => showOverlay("你赢了! 🎉"), 300);
          return true;
        }
  }

  // 检查游戏结束
  if (isGameOver()) {
    over = true;
    setTimeout(() => showOverlay("游戏结束"), 300);
  }

  return true;
}

function isGameOver() {
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c] === 0) return false;
      if (c < SIZE - 1 && grid[r][c] === grid[r][c + 1]) return false;
      if (r < SIZE - 1 && grid[r][c] === grid[r + 1][c]) return false;
    }
  return true;
}

function showOverlay(msg) {
  overlayMsg.textContent = msg;
  overlay.classList.remove("hidden");
}

// 键盘
document.addEventListener("keydown", (e) => {
  const map = {
    ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down",
    KeyA: "left", KeyD: "right", KeyW: "up", KeyS: "down",
  };
  const dir = map[e.code];
  if (dir) {
    e.preventDefault();
    move(dir);
  }
});

// 触摸滑动
let touchStart = null;
boardEl.addEventListener("touchstart", (e) => {
  const t = e.touches[0];
  touchStart = { x: t.clientX, y: t.clientY };
});
boardEl.addEventListener("touchend", (e) => {
  if (!touchStart) return;
  const t = e.changedTouches[0];
  const dx = t.clientX - touchStart.x;
  const dy = t.clientY - touchStart.y;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);
  if (Math.max(absDx, absDy) < 30) return;
  if (absDx > absDy) {
    move(dx > 0 ? "right" : "left");
  } else {
    move(dy > 0 ? "down" : "up");
  }
  touchStart = null;
});

newGameBtn.addEventListener("click", init);
retryBtn.addEventListener("click", init);

init();
