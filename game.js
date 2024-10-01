// Constants
const EMPTY_TILE = { row: 2, col: 2 };
const SHADE_LABELS = ['A', 'B', 'B', 'C', 'C', 'D', 'D', 'E', '']; 

// Game state
let tiles = [];
let tileLabels = [];
let gameFont;
let selectedColor = null;
let gameStarted = false;
let gridOffsetX, gridOffsetY;
let shuffledGrayscale = [];
let previewLabels = [];
let matchCount = 0;

let myFont;
let timer;
let timeLeft = 30;
let gameOver = false;
let playerWon = false;

const GRID_SIZE = 3;
let TILE_SIZE;
let PREVIEW_TILE_SIZE;

function preload() {
  myFont = loadFont('PixelOperator-Bold.ttf');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont(myFont);

  // Make the tile size smaller (15% instead of 25% of the smaller dimension)
  TILE_SIZE = min(width, height) * 0.15;  
  PREVIEW_TILE_SIZE = TILE_SIZE / 3;

  updateOffsets();
  initializeGame();
  showColorSelectionScreen();
}

function draw() {
  if (playerWon) {
    showWinScreen();  // Display "YOU WIN!" screen if player has won
    return;
  }

  if (gameOver) {
    showTimesUpScreen();  // Display "TIME'S UP" screen when the game is over
    return;
  }

  if (!gameStarted) return;

  background(255);
  drawTiles();
  drawGrayscalePreview();
  checkMatchCount();
  displayMatchCount();
  updateTimer();
  displayTimer();
  checkTimeUp();
}

function updateOffsets() {
  gridOffsetX = (width - GRID_SIZE * TILE_SIZE) / 2;
  gridOffsetY = (height - GRID_SIZE * TILE_SIZE) / 2;
}

function initializeGame() {
  shuffleGrayscalePreview();
  initTiles();
}

function shuffleGrayscalePreview() {
  const grayscaleDistribution = [215, 170, 170, 100, 100, 65, 65, 10, 255];  
  shuffledGrayscale = shuffleArray([...grayscaleDistribution]);

  // Assign labels to the preview tiles, including the empty tile
  previewLabels = shuffledGrayscale.map(shade => 
    SHADE_LABELS[grayscaleDistribution.indexOf(shade)]);
}

function initTiles() {
  tiles = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(0));
  tileLabels = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(''));
  let num = 1;
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (row === GRID_SIZE - 1 && col === GRID_SIZE - 1) {
        // This is the empty tile
        tiles[row][col] = 0;
        tileLabels[row][col] = '';
      } else {
        tiles[row][col] = num;
        tileLabels[row][col] = SHADE_LABELS[num - 1];
        num++;
      }
    }
  }
}

function showColorSelectionScreen() {
  background(255);
  textSize(height * 0.07);  // Make text larger (7% of height)
  textAlign(CENTER);
  fill(0);
  text('PICK A COLOR BELOW', width / 2, height / 4);

  // Draw colored circles for color selection
  drawColorButton('blue', width / 2 - TILE_SIZE * 2, height / 2);
  drawColorButton('red', width / 2, height / 2);
  drawColorButton('green', width / 2 + TILE_SIZE * 2, height / 2);
}

function drawColorButton(color, x, y) {
	strokeWeight(5);
  fill(color);
  ellipse(x, y, TILE_SIZE * 1.5, TILE_SIZE * 1.5);  // Circle size slightly larger than the tile size
  fill(255);
}

function mousePressed() {
  if (!gameStarted && !gameOver && !playerWon) {
    handleColorSelection();
  } else if (!gameOver && !playerWon) {
    handleTileMove();
  }
}

function handleColorSelection() {
  const colorButtons = [
    { color: 'blue', x: width / 2 - TILE_SIZE * 2 },
    { color: 'red', x: width / 2 },
    { color: 'green', x: width / 2 + TILE_SIZE * 2 }
  ];

  for (let button of colorButtons) {
    const distance = dist(mouseX, mouseY, button.x, height / 2);  // Calculate distance from the circle
    if (distance <= TILE_SIZE * 0.75) {  // Check if clicked inside the circle
      selectedColor = button.color;
      startGame();
      break;
    }
  }
}

function handleTileMove() {
  const col = floor((mouseX - gridOffsetX) / TILE_SIZE);
  const row = floor((mouseY - gridOffsetY) / TILE_SIZE);

  if (isValidMove(row, col)) {
    moveTile(row, col);
    if (checkWin()) {
      playerWon = true;  // Set playerWon to true if the player wins
    }
  }
}

function startGame() {
  gameStarted = true;
  shuffleTiles();
  timer = millis();  // Start the timer
}

function drawTiles() {
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (tiles[row][col] !== 0) {
        const shade = getShadeFromLabel(tileLabels[row][col]);
        fill(getSelectedColor(shade));
        noStroke();
        rect(gridOffsetX + col * TILE_SIZE, gridOffsetY + row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }
    }
  }
}

function getShadeFromLabel(label) {
  const index = SHADE_LABELS.indexOf(label);
  const shades = [255, 200, 200, 150, 150, 100, 100, 50];
  return shades[index];
}

function getSelectedColor(shade) {
  switch (selectedColor) {
    case 'blue': return color(0, 0, shade);
    case 'red': return color(shade, 0, 0);
    case 'green': return color(0, shade, 0);
    default: return color(shade);
  }
}

function drawGrayscalePreview() {
  const previewX = width - (GRID_SIZE * PREVIEW_TILE_SIZE) - 100;
  const previewY = height * 0.2;

  for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {  // Now we're drawing all 9 tiles
    const row = floor(i / GRID_SIZE);
    const col = i % GRID_SIZE;
    fill(shuffledGrayscale[i]);
    noStroke();
    rect(previewX + col * PREVIEW_TILE_SIZE, previewY + row * PREVIEW_TILE_SIZE, PREVIEW_TILE_SIZE, PREVIEW_TILE_SIZE);
  }
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = floor(random(i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function checkMatchCount() {
  matchCount = 0;
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const index = row * GRID_SIZE + col;
      if (tileLabels[row][col] === previewLabels[index]) {
        matchCount++;
      }
    }
  }
}

function displayMatchCount() {
  fill(0);
  textSize(height * 0.045);  // Make text larger (4.5% of height)
  textAlign(CENTER, TOP);
  text(`MATCHED TILES: ${matchCount}`, width / 2, height * 0.05);  // Position relative to screen size
}

function isValidMove(row, col) {
  return abs(row - EMPTY_TILE.row) + abs(col - EMPTY_TILE.col) === 1;
}

function moveTile(row, col) {
  tiles[EMPTY_TILE.row][EMPTY_TILE.col] = tiles[row][col];
  tileLabels[EMPTY_TILE.row][EMPTY_TILE.col] = tileLabels[row][col];
  tiles[row][col] = 0;
  tileLabels[row][col] = '';
  EMPTY_TILE.row = row;
  EMPTY_TILE.col = col;
}

function shuffleTiles() {
  for (let i = 0; i < 1000; i++) {
    const possibleMoves = [
      { row: EMPTY_TILE.row - 1, col: EMPTY_TILE.col },
      { row: EMPTY_TILE.row + 1, col: EMPTY_TILE.col },
      { row: EMPTY_TILE.row, col: EMPTY_TILE.col - 1 },
      { row: EMPTY_TILE.row, col: EMPTY_TILE.col + 1 }
    ].filter(move => move.row >= 0 && move.row < GRID_SIZE && move.col >= 0 && move.col < GRID_SIZE);

    const move = random(possibleMoves);
    moveTile(move.row, move.col);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  TILE_SIZE = min(width, height) * 0.15;  // Recalculate tile size on resize (smaller than before)
  PREVIEW_TILE_SIZE = TILE_SIZE / 3;
  updateOffsets();
}

// Timer logic
function updateTimer() {
  const currentTime = millis();
  timeLeft = 30 - floor((currentTime - timer) / 1000);
  timeLeft = max(timeLeft, 0);  // Ensure time doesn't go negative
}

function displayTimer() {
  fill(0);
  textSize(height * 0.045);  // Timer text size larger (4.5% of height)
  textAlign(CENTER, TOP);
  text(`TIME LEFT: ${timeLeft}s`, width / 2, height * 0.1);  // Position relative to screen size
}

function checkTimeUp() {
  if (timeLeft <= 0 && !playerWon) {  // Only trigger game over if player hasn't won
    gameOver = true;
  }
}

function checkWin() {
  if (matchCount === 9) {  // Check for all 9 positions to match
    return true;
  }
  return false;
}

function showTimesUpScreen() {
  background(255, 0, 0);  // Red background
  fill(255);
  textSize(height * 0.12);  // Make "TIME'S UP" text larger (12% of height)
  textAlign(CENTER, CENTER);
  text("TIME'S UP", width / 2, height / 2);  // Display "TIME'S UP"
}

function showWinScreen() {
  background(0, 255, 0);  // Green background
  fill(255);
  textSize(height * 0.12);  // Make "YOU WIN!" text larger (12% of height)
  textAlign(CENTER, CENTER);
  text("YOU WIN!", width / 2, height / 2);  // Display "YOU WIN!"
}
