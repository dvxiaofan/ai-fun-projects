const boardEl = document.getElementById("board");
const minesEl = document.getElementById("mines");
const timerEl = document.getElementById("timer");
const faceEl = document.getElementById("face");
const diffBtns = document.querySelectorAll(".diff-btn");

const DIFFS = {
  easy:   { cols: 9,  rows: 9,  mines: 10 },
  medium: { cols: 16, rows: 16, mines: 40 },
  hard:   { cols: 30, rows: 16, mines: 99 },
};

let diff, cols, rows, mineCount;
let grid, revealed, flagged, mineSet;
let gameOver, firstClick, timer, timerId, flagCount;

function setDifficulty(d) {
  diff = d;
  diffBtns.forEach((btn) => btn.classList.toggle("active", btn.dataset.diff === d));
  init();
}

function init() {
  const cfg = DIFFS[diff];
  cols = cfg.cols;
  rows = cfg.rows;
  mineCount = cfg.mines;
  grid = [];
  revealed = [];
  flagged = [];
  mineSet = new Set();
  gameOver = false;
  firstClick = true;
  timer = 0;
  flagCount = 0;
  clearInterval(timerId);
  timerId = null;

  for (let r = 0; r < rows; r++) {
    grid[r] = [];
    revealed[r] = [];
    flagged[r] = [];
    for (let c = 0; c < cols; c++) {
      grid[r][c] = 0;
      revealed[r][c] = false;
      flagged[r][c] = false;
    }
  }

  minesEl.textContent = mineCount;
  timerEl.textContent = 0;
  faceEl.textContent = "🙂";
  render();
}

function placeMines(safeR, safeC) {
  let placed = 0;
  while (placed < mineCount) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);
    const key = r * cols + c;
    if (mineSet.has(key)) continue;
    if (Math.abs(r - safeR) <= 1 && Math.abs(c - safeC) <= 1) continue;
    mineSet.add(key);
    grid[r][c] = -1;
    placed++;
  }

  // 计算数字
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === -1) continue;
      let count = 0;
      forNeighbors(r, c, (nr, nc) => {
        if (grid[nr][nc] === -1) count++;
      });
      grid[r][c] = count;
    }
  }
}

function forNeighbors(r, c, fn) {
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) fn(nr, nc);
    }
  }
}

function reveal(r, c) {
  if (revealed[r][c] || flagged[r][c]) return;
  revealed[r][c] = true;

  if (grid[r][c] === 0) {
    forNeighbors(r, c, (nr, nc) => reveal(nr, nc));
  }
}

function chordReveal(r, c) {
  if (!revealed[r][c] || grid[r][c] <= 0) return;
  let flagCount = 0;
  forNeighbors(r, c, (nr, nc) => {
    if (flagged[nr][nc]) flagCount++;
  });
  if (flagCount === grid[r][c]) {
    forNeighbors(r, c, (nr, nc) => {
      if (!revealed[nr][nc] && !flagged[nr][nc]) {
        if (grid[nr][nc] === -1) {
          lose();
          return;
        }
        reveal(nr, nc);
      }
    });
    checkWin();
  }
}

function handleClick(r, c) {
  if (gameOver || flagged[r][c] || revealed[r][c]) return;

  if (firstClick) {
    firstClick = false;
    placeMines(r, c);
    timerId = setInterval(() => {
      timer++;
      timerEl.textContent = timer;
    }, 1000);
  }

  if (grid[r][c] === -1) {
    lose();
    return;
  }

  reveal(r, c);
  checkWin();
  render();
}

function handleRightClick(r, c) {
  if (gameOver || revealed[r][c]) return;
  flagged[r][c] = !flagged[r][c];
  flagCount += flagged[r][c] ? 1 : -1;
  minesEl.textContent = mineCount - flagCount;
  render();
}

function handleMiddleClick(r, c) {
  if (gameOver) return;
  chordReveal(r, c);
  render();
}

function checkWin() {
  let unrevealed = 0;
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      if (!revealed[r][c]) unrevealed++;

  if (unrevealed === mineCount) {
    gameOver = true;
    clearInterval(timerId);
    faceEl.textContent = "😎";
    // 自动标旗
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        if (!revealed[r][c]) flagged[r][c] = true;
    flagCount = mineCount;
    minesEl.textContent = 0;
    render();
  }
}

function lose() {
  gameOver = true;
  clearInterval(timerId);
  faceEl.textContent = "😵";
  // 显示所有雷
  for (const key of mineSet) {
    const r = Math.floor(key / cols);
    const c = key % cols;
    revealed[r][c] = true;
  }
  render();
}

function render() {
  boardEl.style.gridTemplateColumns = `repeat(${cols}, 28px)`;
  boardEl.innerHTML = "";

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = document.createElement("div");
      cell.className = "cell";

      if (revealed[r][c]) {
        cell.classList.add("revealed");
        if (grid[r][c] === -1) {
          cell.classList.add("mine");
          cell.textContent = "💣";
        } else if (grid[r][c] > 0) {
          cell.textContent = grid[r][c];
          cell.classList.add(`c${grid[r][c]}`);
        }
      } else if (flagged[r][c]) {
        cell.classList.add("flag");
        cell.textContent = "🚩";
      }

      cell.addEventListener("click", () => handleClick(r, c));
      cell.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        handleRightClick(r, c);
      });
      cell.addEventListener("auxclick", (e) => {
        if (e.button === 1) handleMiddleClick(r, c);
      });

      boardEl.appendChild(cell);
    }
  }
}

diffBtns.forEach((btn) => {
  btn.addEventListener("click", () => setDifficulty(btn.dataset.diff));
});

faceEl.addEventListener("click", init);

setDifficulty("easy");
