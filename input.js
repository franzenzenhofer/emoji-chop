// input.js

/**
 * User Input Handling
 */

// Swipe Variables
let isSwiping = false;

/**
 * Starts tracking a swipe
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 */
function startSwipe(x, y) {
  if (!gameState.gameRunning) return; // Only allow swiping when the game is running
  isSwiping = true;
  gameState.swipePath = [{ x, y, timestamp: Date.now() }];
  debug('Swipe started at', x, y);
}

/**
 * Updates the swipe path
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 */
function moveSwipe(x, y) {
  if (!isSwiping || !gameState.gameRunning) return;
  gameState.swipePath.push({ x, y, timestamp: Date.now() });
  // Limit swipe path points to those within the last 250ms
  const cutoffTime = Date.now() - 250;
  gameState.swipePath = gameState.swipePath.filter(point => point.timestamp >= cutoffTime);
  debug('Swipe moved to', x, y);
}

/**
 * Ends the swipe
 */
function endSwipe() {
  if (!gameState.gameRunning) return;
  isSwiping = false;
  // Optionally, keep the swipePath for fading
  debug('Swipe ended');
}

// Touch Events
UI_ELEMENTS.gameCanvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  const touch = e.touches[0];
  startSwipe(touch.clientX, touch.clientY);
});

UI_ELEMENTS.gameCanvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  const touch = e.touches[0];
  moveSwipe(touch.clientX, touch.clientY);
});

UI_ELEMENTS.gameCanvas.addEventListener('touchend', (e) => {
  e.preventDefault();
  endSwipe();
});

// Mouse Events
UI_ELEMENTS.gameCanvas.addEventListener('mousedown', (e) => {
  e.preventDefault();
  startSwipe(e.clientX, e.clientY);
});

UI_ELEMENTS.gameCanvas.addEventListener('mousemove', (e) => {
  if (!isSwiping) return;
  moveSwipe(e.clientX, e.clientY);
});

UI_ELEMENTS.gameCanvas.addEventListener('mouseup', (e) => {
  e.preventDefault();
  endSwipe();
});
