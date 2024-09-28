// util.js

/**
 * Utility Functions
 */

/**
 * Debug function that logs messages when DEBUG flag is true
 * @param  {...any} args - The messages or variables to log
 */
function debug(...args) {
  if (DEBUG) {
    console.log('[DEBUG]:', ...args);
  }
}

/**
 * Resize the canvas to fit the window without maintaining aspect ratio
 */
function resizeCanvas() {
  if (typeof UI_ELEMENTS === 'undefined' || !UI_ELEMENTS.gameCanvas || !UI_ELEMENTS.swipeTrailCanvas) {
    console.error('[ERROR]: Canvas elements are not properly initialized.');
    return;
  }

  // Set canvas dimensions to match the window's inner dimensions
  UI_ELEMENTS.gameCanvas.width = window.innerWidth;
  UI_ELEMENTS.gameCanvas.height = window.innerHeight;
  UI_ELEMENTS.swipeTrailCanvas.width = window.innerWidth;
  UI_ELEMENTS.swipeTrailCanvas.height = window.innerHeight;
  debug('Canvas resized to', window.innerWidth, 'x', window.innerHeight);
}

/**
 * Get a random integer between min and max (inclusive)
 * @param {number} min - Minimum integer
 * @param {number} max - Maximum integer
 * @returns {number} Random integer
 */
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

/**
 * Shows a specific screen by its ID
 * @param {string} screenId - The ID of the screen to show
 */
function showScreen(screenId) {
  const screen = UI_ELEMENTS[screenId];
  if (screen) {
    screen.classList.remove('hidden');
    debug(`${screenId} shown.`);
  } else {
    debug(`Attempted to show unknown screen: ${screenId}`);
  }
}

/**
 * Hides a specific screen by its ID
 * @param {string} screenId - The ID of the screen to hide
 */
function hideScreen(screenId) {
  const screen = UI_ELEMENTS[screenId];
  if (screen) {
    screen.classList.add('hidden');
    debug(`${screenId} hidden.`);
  } else {
    debug(`Attempted to hide unknown screen: ${screenId}`);
  }
}

/**
 * Hides all overlay screens
 */
function hideAllScreens() {
  const screens = ['startScreen', 'instructionScreen', 'gameOverScreen', 'upgradePanel'];
  screens.forEach(screenId => hideScreen(screenId));
}
