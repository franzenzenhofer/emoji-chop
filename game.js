// game.js

/**
 * Updates and draws all sparkles
 */
function updateAndDrawSparkles() {
  for (let i = gameState.sparkles.length - 1; i >= 0; i--) {
    const sparkle = gameState.sparkles[i];
    sparkle.update();
    sparkle.draw(CONTEXTS.game);

    if (sparkle.isExpired()) {
      gameState.sparkles.splice(i, 1);
    }
  }
}


/**
 * Main Game Logic
 */

window.addEventListener('load', () => {
  // Initialize the game on window load
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // Load top score from localStorage
  if (localStorage.getItem('emojiNinjaTopScore')) {
    try {
      const storedTopScore = JSON.parse(localStorage.getItem('emojiNinjaTopScore'));
      if (storedTopScore && typeof storedTopScore.slices === 'number' && typeof storedTopScore.misses === 'number') {
        gameState.topScore = storedTopScore;
        UI_ELEMENTS.leaderboard.textContent = `Top Score: ${gameState.topScore.slices} Sliced - ${gameState.topScore.misses} Missed.`;
        debug('Top score loaded:', gameState.topScore);
      } else {
        throw new Error('Invalid top score format.');
      }
    } catch (error) {
      debug('Error loading top score:', error);
      gameState.topScore = { slices: 0, misses: 0 };
      UI_ELEMENTS.leaderboard.textContent = `Top Score: 0 Slices - 0 Missed.`;
    }
  } else {
    debug('No top score found. Starting with top score of 0 Slices - 0 Missed.');
    UI_ELEMENTS.leaderboard.textContent = `Top Score: 0 Slices - 0 Missed.`;
  }

  // Ensure all overlay screens are in the correct initial state
  hideAllScreens();
  showScreen('startScreen');

  // Event Listeners for UI Buttons
  UI_ELEMENTS.startButton.addEventListener('click', () => {
    hideAllScreens();
    initGame();
  });

  UI_ELEMENTS.instructionsButton.addEventListener('click', () => {
    hideAllScreens();
    showScreen('instructionScreen');
  });

  UI_ELEMENTS.backButton.addEventListener('click', () => {
    hideAllScreens();
    showScreen('startScreen');
  });

  UI_ELEMENTS.restartButton.addEventListener('click', () => {
    hideAllScreens();
    initGame();
  });

  // Event Listeners for Pause and Resume Buttons
  UI_ELEMENTS.pauseButton.addEventListener('click', () => {
    gameState.gameRunning = false;
    showScreen('pauseScreen');
  });

  UI_ELEMENTS.resumeButton.addEventListener('click', () => {
    hideScreen('pauseScreen');
    gameState.gameRunning = true;
    gameLoop();
  });
});

/**
 * Initializes the game
 */
function initGame() {
  // Reset game state
  gameState.emojis = [];
  gameState.slicedEmojis = [];
  gameState.swipePath = [];
  gameState.sliced = 0;
  gameState.missed = 0;
  gameState.netSlices = 0;
  gameState.gameRunning = true;
  gameState.lastEmojiTime = Date.now();
  gameState.particles = [];
  gameState.combo = 0;
  gameState.maxCombo = 0;

  // Reset game settings to initial values
  GAME_SETTINGS.gravity = GAME_SETTINGS.gravityInitial;
  GAME_SETTINGS.currentSpeed = GAME_SETTINGS.initialSpeed;
  gameState.spawnRate = GAME_SETTINGS.initialSpawnRate;
  EMOJI_SETTINGS.radius = GAME_SETTINGS.initialRadius;

  // Update UI
  UI_ELEMENTS.slicedCount.textContent = `Sliced: ${gameState.sliced}`;
  UI_ELEMENTS.missedCount.textContent = `Missed: ${gameState.missed}`;
  UI_ELEMENTS.comboCount.textContent = `Combo: x${gameState.combo}`;
  UI_ELEMENTS.finalScore.textContent = `Your Score: ${gameState.netSlices} Slices - ${gameState.missed} Missed.`;

  // Clear any existing swipe paths
  gameState.swipePath = [];

  gameState.lastEmojiTime = Date.now() - gameState.spawnRate;


  // Start game loop
  gameLoop();
}

/**
 * The main game loop
 */
function gameLoop() {
  if (!gameState.gameRunning) {
    return;
  }

  const currentTime = Date.now();

  // Spawn emojis at intervals adjusted by spawnRate
  if (currentTime - gameState.lastEmojiTime > gameState.spawnRate) {
    spawnEmoji();
    gameState.lastEmojiTime = currentTime;
  }

  // Update game state
  clearCanvas();
  updateAndDrawEmojis();
  updateAndDrawSlicedEmojis();
  updateAndDrawParticles();
  checkCollisions();
  drawSwipeTrail();
  updateAndDrawSparkles(); // Add this line

  // Adjust difficulty based on net slices
  adjustDifficulty();

  // Update UI
  UI_ELEMENTS.slicedCount.textContent = `Sliced: ${gameState.sliced}`;
  UI_ELEMENTS.missedCount.textContent = `Missed: ${gameState.missed}`;
  UI_ELEMENTS.comboCount.textContent = `Combo: x${gameState.combo}`;
  UI_ELEMENTS.leaderboard.textContent = `Top Score: ${gameState.topScore.slices} Sliced - ${gameState.topScore.misses} Missed.`;

  // Update top score dynamically if netSlices exceeds current top score
  if (gameState.netSlices > gameState.topScore.slices) {
    gameState.topScore = { slices: gameState.sliced, misses: gameState.missed };
    localStorage.setItem('emojiNinjaTopScore', JSON.stringify(gameState.topScore));
    UI_ELEMENTS.leaderboard.textContent = `Top Score: ${gameState.topScore.slices} Sliced - ${gameState.topScore.misses} Missed.`;
  }

  // Request next frame
  requestAnimationFrame(gameLoop);
}

/**
 * Adjusts game difficulty based on net positive slices
 */
function adjustDifficulty() {
  const netSlices = gameState.netSlices;
  const maxNetSlices = GAME_SETTINGS.maxNetSlices;
  const ratio = Math.min(netSlices / maxNetSlices, 1); // Value between 0 and 1

  // Adjust gravity
  GAME_SETTINGS.gravity = GAME_SETTINGS.gravityInitial + ratio * (GAME_SETTINGS.maxGravity - GAME_SETTINGS.gravityInitial);

  // Adjust emoji size
  EMOJI_SETTINGS.radius = GAME_SETTINGS.initialRadius - ratio * (GAME_SETTINGS.initialRadius - GAME_SETTINGS.minRadius);

  // Adjust emoji speed
  GAME_SETTINGS.currentSpeed = GAME_SETTINGS.initialSpeed + ratio * (GAME_SETTINGS.maxSpeed - GAME_SETTINGS.initialSpeed);

  // Adjust spawn rate
  gameState.spawnRate = GAME_SETTINGS.initialSpawnRate - ratio * (GAME_SETTINGS.initialSpawnRate - GAME_SETTINGS.minSpawnRate);

  // Ensure minimum spawn rate
  gameState.spawnRate = Math.max(gameState.spawnRate, GAME_SETTINGS.minSpawnRate);
}

/**
 * Spawns a new emoji with directional constraints
 */
function spawnEmoji() {
  const isSpecial = Math.random() < EMOJI_SETTINGS.specialEmojiChance;
  const emojiList = isSpecial ? EMOJI_SETTINGS.specialEmojis : EMOJI_SETTINGS.types;
  const emojiChar = emojiList[getRandomInt(0, emojiList.length - 1)];

  // Decide the spawn side
  const spawnSides = ['left', 'right', 'topLeft', 'topRight'];
  const spawnDirection = spawnSides[Math.floor(Math.random() * spawnSides.length)];

  let x, y, vx, vy;

  const canvasWidth = UI_ELEMENTS.gameCanvas.width;
  const canvasHeight = UI_ELEMENTS.gameCanvas.height;

  const gravity = GAME_SETTINGS.gravity;
  const ensureOppositeExit = Math.random() < 0.9; // 90% chance to exit opposite side

  const speed = GAME_SETTINGS.currentSpeed;

  switch (spawnDirection) {
    case 'left':
      x = -EMOJI_SETTINGS.radius;
      y = getRandomInt(EMOJI_SETTINGS.radius, canvasHeight / 2 - EMOJI_SETTINGS.radius);
      if (ensureOppositeExit) {
        const timeToFall = Math.sqrt((2 * (canvasHeight - y)) / gravity);
        vx = (canvasWidth + 2 * EMOJI_SETTINGS.radius) / timeToFall;
        vy = 0;
      } else {
        vx = Math.random() * speed + speed;
        vy = (Math.random() - 0.5) * speed;
      }
      break;

    case 'right':
      x = canvasWidth + EMOJI_SETTINGS.radius;
      y = getRandomInt(EMOJI_SETTINGS.radius, canvasHeight / 2 - EMOJI_SETTINGS.radius);
      if (ensureOppositeExit) {
        const timeToFall = Math.sqrt((2 * (canvasHeight - y)) / gravity);
        vx = -(canvasWidth + 2 * EMOJI_SETTINGS.radius) / timeToFall;
        vy = 0;
      } else {
        vx = -(Math.random() * speed + speed);
        vy = (Math.random() - 0.5) * speed;
      }
      break;

    case 'topLeft':
      x = getRandomInt(EMOJI_SETTINGS.radius, canvasWidth / 2 - EMOJI_SETTINGS.radius);
      y = -EMOJI_SETTINGS.radius;
      if (ensureOppositeExit) {
        const timeToFall = Math.sqrt((2 * (canvasHeight + EMOJI_SETTINGS.radius)) / gravity);
        vx = (canvasWidth - x + EMOJI_SETTINGS.radius) / timeToFall;
        vy = 0;
      } else {
        vx = Math.random() * speed + speed;
        vy = Math.random() * speed + speed;
      }
      break;

    case 'topRight':
      x = getRandomInt(canvasWidth / 2 + EMOJI_SETTINGS.radius, canvasWidth - EMOJI_SETTINGS.radius);
      y = -EMOJI_SETTINGS.radius;
      if (ensureOppositeExit) {
        const timeToFall = Math.sqrt((2 * (canvasHeight + EMOJI_SETTINGS.radius)) / gravity);
        vx = -(x + EMOJI_SETTINGS.radius) / timeToFall;
        vy = 0;
      } else {
        vx = -(Math.random() * speed + speed);
        vy = Math.random() * speed + speed;
      }
      break;
  }

  const emoji = new Emoji(x, y, emojiChar, vx, vy, isSpecial);
  emoji.radius = EMOJI_SETTINGS.radius; // Set dynamic radius
  gameState.emojis.push(emoji);
}

/**
 * Updates and draws all emojis
 */
function updateAndDrawEmojis() {
  for (let i = gameState.emojis.length - 1; i >= 0; i--) {
    const emoji = gameState.emojis[i];
    emoji.update();
    emoji.draw(CONTEXTS.game);

    if (emoji.isOffScreen()) {
      gameState.emojis.splice(i, 1);
      gameState.missed++;
      gameState.netSlices = Math.max(gameState.netSlices - 1, 0);
      UI_ELEMENTS.missedCount.textContent = `Missed: ${gameState.missed}`;

      // Reset combo
      gameState.combo = 0;
      UI_ELEMENTS.comboCount.textContent = `Combo: x${gameState.combo}`;

      // Reset the melody when an emoji is missed
      if (typeof resetMelody === 'function') {
        resetMelody();
      }
    }
  }
}


/**
 * Updates and draws all sliced emojis
 */
function updateAndDrawSlicedEmojis() {
  for (let i = gameState.slicedEmojis.length - 1; i >= 0; i--) {
    const slicedEmoji = gameState.slicedEmojis[i];
    slicedEmoji.update();
    slicedEmoji.draw(CONTEXTS.game);

    if (slicedEmoji.isExpired()) {
      gameState.slicedEmojis.splice(i, 1);
    }
  }
}

/**
 * Updates and draws all slice particles
 */
function updateAndDrawParticles() {
  for (let i = gameState.particles.length - 1; i >= 0; i--) {
    const particle = gameState.particles[i];
    particle.update();
    particle.draw(CONTEXTS.game);

    if (particle.isExpired()) {
      gameState.particles.splice(i, 1);
    }
  }
}

/**
 * Clears the game canvas
 */
function clearCanvas() {
  CONTEXTS.game.clearRect(0, 0, UI_ELEMENTS.gameCanvas.width, UI_ELEMENTS.gameCanvas.height);
}

/**
 * Draws the swipe trail with a gradient
 */
function drawSwipeTrail() {
  const currentTime = Date.now();
  const fadeDuration = 250; // in milliseconds

  // Filter out points older than fadeDuration
  gameState.swipePath = gameState.swipePath.filter(point => currentTime - point.timestamp <= fadeDuration);

  CONTEXTS.swipeTrail.clearRect(0, 0, UI_ELEMENTS.swipeTrailCanvas.width, UI_ELEMENTS.swipeTrailCanvas.height);
  if (gameState.swipePath.length > 1) {
    CONTEXTS.swipeTrail.lineWidth = 5;
    CONTEXTS.swipeTrail.lineCap = 'round';
    CONTEXTS.swipeTrail.lineJoin = 'round';

    // Create a gradient for the trail
    const gradient = CONTEXTS.swipeTrail.createLinearGradient(
      gameState.swipePath[0].x,
      gameState.swipePath[0].y,
      gameState.swipePath[gameState.swipePath.length - 1].x,
      gameState.swipePath[gameState.swipePath.length - 1].y
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    CONTEXTS.swipeTrail.strokeStyle = gradient;

    CONTEXTS.swipeTrail.beginPath();

    // Start with the first point
    let prevPoint = gameState.swipePath[0];
    CONTEXTS.swipeTrail.moveTo(prevPoint.x, prevPoint.y);

    for (let i = 1; i < gameState.swipePath.length; i++) {
      const point = gameState.swipePath[i];
      CONTEXTS.swipeTrail.lineTo(point.x, point.y);
    }

    CONTEXTS.swipeTrail.stroke();
  }
}

/**
 * Checks for collisions between the swipe and emojis
 */
function checkCollisions() {
  for (let i = 0; i < gameState.swipePath.length - 1; i++) {
    const x1 = gameState.swipePath[i].x;
    const y1 = gameState.swipePath[i].y;
    const x2 = gameState.swipePath[i + 1].x;
    const y2 = gameState.swipePath[i + 1].y;

    for (let j = gameState.emojis.length - 1; j >= 0; j--) {
      const emoji = gameState.emojis[j];
      if (!emoji.sliced && lineCircleIntersection(x1, y1, x2, y2, emoji.x, emoji.y, emoji.radius)) {
        // Calculate exact intersection point
        const intersection = getLineCircleIntersectionPoint(x1, y1, x2, y2, emoji.x, emoji.y, emoji.radius);
        if (intersection) {
          emoji.sliced = true;
          handleSlicedEmoji(emoji, intersection);
          gameState.emojis.splice(j, 1);
        }
      }
    }
  }
}

/**
 * Handles the slicing of an emoji
 * @param {Emoji} emoji - The sliced emoji
 * @param {object} intersection - Intersection point {x, y}
 */
function handleSlicedEmoji(emoji, intersection) {
  // Determine the swipe direction at the intersection point
  // Find the index in swipePath closest to the intersection point
  let closestIndex = -1;
  let minDistance = Infinity;
  gameState.swipePath.forEach((point, index) => {
    const distance = Math.hypot(point.x - intersection.x, point.y - intersection.y);
    if (distance < minDistance) {
      minDistance = distance;
      closestIndex = index;
    }
  });

  // Ensure there's a next point to determine direction
  let angle;
  if (closestIndex < gameState.swipePath.length - 1) {
    const nextPoint = gameState.swipePath[closestIndex + 1];
    angle = Math.atan2(nextPoint.y - intersection.y, nextPoint.x - intersection.x);
  } else if (closestIndex > 0) {
    const prevPoint = gameState.swipePath[closestIndex - 1];
    angle = Math.atan2(intersection.y - prevPoint.y, intersection.x - prevPoint.x);
  } else {
    // Default angle if direction cannot be determined
    angle = Math.atan2(emoji.vy, emoji.vx);
  }

  handleSlicedEmojiWithAngle(emoji, intersection, angle);

  // Play the next note in the melody
  if (typeof playNextMelodyNote === 'function') {
    playNextMelodyNote();
  }
}


function handleSlicedEmojiWithAngle(emoji, intersection, angle) {
  // Play slice sound using AudioContext
  if (typeof playSliceSound === 'function') {
    playSliceSound();
  }

  // Update sliced count
  gameState.sliced++;
  gameState.netSlices = gameState.sliced - gameState.missed;
  UI_ELEMENTS.slicedCount.textContent = `Sliced: ${gameState.sliced}`;

  // Update combo
  gameState.combo++;
  if (gameState.combo > gameState.maxCombo) {
    gameState.maxCombo = gameState.combo;
  }
  UI_ELEMENTS.comboCount.textContent = `Combo: x${gameState.combo}`;

  // Create sliced emoji animation at emoji's current position
  const slicedEmoji = new SlicedEmoji(emoji.x, emoji.y, emoji.emoji, angle, emoji.radius);
  gameState.slicedEmojis.push(slicedEmoji);

  // Create slice particles at emoji's position
  const particleCount = 10;
  for (let i = 0; i < particleCount; i++) {
    const particleAngle = angle + (Math.random() - 0.5) * Math.PI / 2;
    const particle = new SliceParticle(emoji.x, emoji.y, particleAngle);
    gameState.particles.push(particle);
  }

  // Create sparkles at the emoji's position
  const sparkleCount = 20;
  for (let i = 0; i < sparkleCount; i++) {
    const sparkle = new SparkleParticle(emoji.x, emoji.y);
    gameState.sparkles.push(sparkle);
  }
}


/**
 * Line-circle intersection detection
 * @param {number} x1 - Line start x
 * @param {number} y1 - Line start y
 * @param {number} x2 - Line end x
 * @param {number} y2 - Line end y
 * @param {number} cx - Circle center x
 * @param {number} cy - Circle center y
 * @param {number} r - Circle radius
 * @returns {boolean} True if intersection occurs
 */
function lineCircleIntersection(x1, y1, x2, y2, cx, cy, r) {
  // Compute the coefficients of the quadratic equation
  const dx = x2 - x1;
  const dy = y2 - y1;
  const fx = x1 - cx;
  const fy = y1 - cy;

  const a = dx * dx + dy * dy;
  const b = 2 * (fx * dx + fy * dy);
  const c = fx * fx + fy * fy - r * r;

  let discriminant = b * b - 4 * a * c;

  // No intersection
  if (discriminant < 0) {
    return false;
  }

  discriminant = Math.sqrt(discriminant);
  const t1 = (-b - discriminant) / (2 * a);
  const t2 = (-b + discriminant) / (2 * a);

  // Check if the intersection occurs within the segment
  if ((t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1)) {
    return true;
  }

  return false;
}

/**
 * Calculates the exact intersection point between a line segment and a circle.
 * @param {number} x1 - Line start x
 * @param {number} y1 - Line start y
 * @param {number} x2 - Line end x
 * @param {number} y2 - Line end y
 * @param {number} cx - Circle center x
 * @param {number} cy - Circle center y
 * @param {number} r - Circle radius
 * @returns {object|null} Intersection point {x, y} or null
 */
function getLineCircleIntersectionPoint(x1, y1, x2, y2, cx, cy, r) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const a = dx * dx + dy * dy;
  const b = 2 * (dx * (x1 - cx) + dy * (y1 - cy));
  const c = (x1 - cx) * (x1 - cx) + (y1 - cy) * (y1 - cy) - r * r;
  const discriminant = b * b - 4 * a * c;

  if (discriminant < 0) {
    return null; // No intersection
  }

  const sqrtDiscriminant = Math.sqrt(discriminant);
  const t1 = (-b - sqrtDiscriminant) / (2 * a);
  const t2 = (-b + sqrtDiscriminant) / (2 * a);

  // Find the smallest positive t
  const t = (t1 >= 0 && t1 <= 1) ? t1 : ((t2 >= 0 && t2 <= 1) ? t2 : null);
  if (t === null) {
    return null;
  }

  return {
    x: x1 + t * dx,
    y: y1 + t * dy
  };
}

/**
 * Shows a specific screen by its ID
 * @param {string} screenId - The ID of the screen to show
 */
function showScreen(screenId) {
  const screen = UI_ELEMENTS[screenId];
  if (screen) {
    screen.classList.remove('hidden');
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
  }
}

/**
 * Hides all overlay screens
 */
function hideAllScreens() {
  const screens = ['startScreen', 'instructionScreen', 'gameOverScreen', 'pauseScreen'];
  screens.forEach(screenId => hideScreen(screenId));
}
