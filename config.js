// config.js

/**
 * Configuration and Global Variables
 */

const DEBUG = false; // Set to true to enable debug logging

// Game Settings
const GAME_SETTINGS = {
  gravityInitial: 0.3, // Reduced gravity for slower falling
  gravity: 0.3, // Current gravity
  maxGravity: 1.5, // Maximum gravity at hardest difficulty
  initialSpeed: 0.5, // Slower initial speed for easier start
  maxSpeed: 3, // Maximum speed after all increments
  currentSpeed: 0.5, // Current speed
  initialSpawnRate: 1800, // Slower initial spawn rate for easier gameplay
  spawnRate: 1800, // Current spawn rate
  minSpawnRate: 800, // Minimum spawn rate in ms
  maxEmojisOnScreen: 5, // Max emojis at hardest difficulty
  initialRadius: 80, // Start with 80px sized emojis
  minRadius: 40, // Minimum radius at max difficulty
  maxNetSlices: 100, // Net slices required for maximum difficulty
};
// Emoji Settings
const EMOJI_SETTINGS = {
  types: [
      // Common popular emojis
      '❤️', '😂', '😍', '🔥', '😊', '👍', '✨', '😎', '🎉', '💪', 
      '🎂', '🍕', '🍔', '🍩', '🍺', '🎁', '🚀', '🐶', '🐱', '🌟', 
      '🎮', '📱', '🎵', '⚽️', '🍦', '🍓', '🥳', '😇', '🤗', '💡',
      '🌈', '🌸', '🦄', '🎯', '🍫', '🍹', '🍷', '🍾', '🍬', '🍩',
      '💦', '🍆', '🍑', '👅', '😏', '😈', '👀', '💋', '😘', '😜', 
      '👄', '😻', '🤤', '🥵', '👙', '🩲', '🩳', '🔥', '💃', '🕺', 
      '🍒', '🍌', '🤪', '😽', '💫', '💔', '🖤', '😚', '🤭', '🙈', 
      '🙉', '🙊', '👼', '😋', '😝', '💍', '🌹', '👑', '💌', '👠'
  ],
  specialEmojis: ['⭐️', '💥'], // Special emojis for power-ups
  specialEmojiChance: 0.1, // 10% chance for special emoji
  radius: GAME_SETTINGS.initialRadius, // Initial radius for larger emojis
};



// Attach UI_ELEMENTS to the global window object
window.UI_ELEMENTS = {
  gameCanvas: document.getElementById('gameCanvas'),
  swipeTrailCanvas: document.getElementById('swipeTrailCanvas'),
  slicedCount: document.getElementById('slicedCount'), // New Sliced Count Display
  missedCount: document.getElementById('missedCount'), // New Missed Count Display
  leaderboard: document.getElementById('leaderboard'),
  startScreen: document.getElementById('startScreen'),
  instructionScreen: document.getElementById('instructionScreen'),
  gameOverScreen: document.getElementById('gameOverScreen'),
  finalScore: document.getElementById('finalScore'),
  startButton: document.getElementById('startButton'),
  instructionsButton: document.getElementById('instructionsButton'),
  backButton: document.getElementById('backButton'),
  restartButton: document.getElementById('restartButton'),
  pauseButton: document.getElementById('pauseButton'), // Added
  pauseScreen: document.getElementById('pauseScreen'), // Added
  resumeButton: document.getElementById('resumeButton'), // Added
  comboCount: document.getElementById('comboCount'), // Added
};

// Attach gameState to the global window object
window.gameState = {
  emojis: [],
  slicedEmojis: [],
  swipePath: [],
  sliced: 0, // New: Count of sliced emojis
  missed: 0, // New: Count of missed emojis
  gameRunning: false,
  lastEmojiTime: 0,
  topScore: { slices: 0, misses: 0 },
  netSlices: 0, // Tracks net slices for dynamic difficulty
  particles: [], // Added particles for slice effects
  combo: 0, // Added for combo multiplier
  maxCombo: 0, // Added to track max combo
  sparkles: [], // Added sparkles array
};

// Canvas Contexts
window.CONTEXTS = {
  game: window.UI_ELEMENTS.gameCanvas.getContext('2d'),
  swipeTrail: window.UI_ELEMENTS.swipeTrailCanvas.getContext('2d'),
};
