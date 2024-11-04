// emoji.js

/**
 * Emoji Classes
 */

class Emoji {
  /**
   * Creates an instance of Emoji.
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {string} emoji - Emoji character
   * @param {number} vx - X velocity
   * @param {number} vy - Y velocity
   * @param {boolean} isSpecial - Is this a special emoji
   */
  constructor(x, y, emoji, vx, vy, isSpecial = false) {
    this.x = x;
    this.y = y;
    this.emoji = emoji;
    this.vx = vx;
    this.vy = vy;
    this.radius = EMOJI_SETTINGS.radius; // Use the radius from EMOJI_SETTINGS or override
    this.sliced = false;
    this.isSpecial = isSpecial;
    this.rotation = 0;
    this.rotationSpeed = (Math.random() - 0.5) * 0.1; // Random rotation speed
  }

  /**
   * Updates the emoji's position and velocity
   */
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += GAME_SETTINGS.gravity;
    this.rotation += this.rotationSpeed;
  }

  /**
   * Draws the emoji on the canvas
   * @param {CanvasRenderingContext2D} context - The canvas context
   */
  draw(context) {
    context.save();
    context.translate(this.x, this.y);
    context.rotate(this.rotation);
    context.font = `${this.radius}px Segoe UI Emoji, Apple Color Emoji, sans-serif`; // Dynamic font size based on radius
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    if (this.isSpecial) {
      // Glow effect for special emojis
      context.shadowColor = 'gold';
      context.shadowBlur = 20;
    }
    context.fillText(this.emoji, 0, 0);
    context.restore();
  }

  /**
   * Checks if the emoji has moved off-screen
   * @returns {boolean} True if off-screen, false otherwise
   */
  isOffScreen() {
    return this.y - this.radius > UI_ELEMENTS.gameCanvas.height;
  }
}

class SlicedEmojiFragment {
  /**
   * Creates an instance of SlicedEmojiFragment.
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {string} emoji - Emoji character
   * @param {number} sliceAngle - Angle of the slice in radians
   * @param {number} radius - Radius of the fragment
   * @param {string} side - 'left' or 'right', indicating which side of the slice
   * @param {object} sliceLine - Object with point1 and point2 {x1, y1, x2, y2}
   */
  constructor(x, y, emoji, sliceAngle, radius, side, sliceLine) {
    this.x = x;
    this.y = y;
    this.emoji = emoji;
    this.sliceAngle = sliceAngle;
    this.radius = radius; // Set the radius
    this.side = side;
    this.sliceLine = sliceLine; // Store the slice line

    // Calculate velocities based on slice angle
    const speed = GAME_SETTINGS.currentSpeed;
    // Fragments move away from the slice line, perpendicular to the slice angle
    const fragmentAngle = this.sliceAngle + (this.side === 'left' ? -Math.PI / 2 : Math.PI / 2);
    this.vx = Math.cos(fragmentAngle) * speed;
    this.vy = Math.sin(fragmentAngle) * speed;

    // Set rotation
    this.rotation = 0;
    this.angularVelocity = this.side === 'left' ? -0.05 : 0.05;

    this.ttl = 60; // Adjusted lifetime
    this.opacity = 1;
    this.scale = 1;
    this.scaleVelocity = 0.01;
  }

  /**
   * Updates the fragment's position, rotation, scale, and opacity
   */
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += GAME_SETTINGS.gravity;

    this.rotation += this.angularVelocity;
    this.scale += this.scaleVelocity;
    if (this.scale > 1.2 || this.scale < 0.8) {
      this.scaleVelocity *= -1;
    }

    this.ttl--;
    this.opacity = this.ttl / 60;
  }

  /**
   * Draws the fragment on the canvas
   * @param {CanvasRenderingContext2D} context - The canvas context
   */
  draw(context) {
    context.save();
    context.globalAlpha = this.opacity;
    context.translate(this.x, this.y);
    context.rotate(this.rotation);

    // Rotate the context so that the slice line is vertical
    context.rotate(this.sliceAngle);

    // Define the clipping path based on the slice line
    context.beginPath();

    const halfWidth = this.radius * 2;
    const halfHeight = this.radius * 2;

    if (this.side === 'left') {
      // Left side of the slice line
      context.moveTo(-halfWidth, -halfHeight);
      context.lineTo(0, -halfHeight);
      context.lineTo(0, halfHeight);
      context.lineTo(-halfWidth, halfHeight);
    } else {
      // Right side of the slice line
      context.moveTo(0, -halfHeight);
      context.lineTo(halfWidth, -halfHeight);
      context.lineTo(halfWidth, halfHeight);
      context.lineTo(0, halfHeight);
    }

    context.closePath();
    context.clip();

    // Rotate back so that the emoji is upright
    context.rotate(-this.sliceAngle);

    // Scale
    context.scale(this.scale, this.scale);

    // Draw the emoji
    context.font = `${this.radius}px Segoe UI Emoji, Apple Color Emoji, sans-serif`; // Dynamic font size
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(this.emoji, 0, 0); // Centered

    context.restore();
  }

  /**
   * Checks if the fragment's lifetime has expired
   * @returns {boolean} True if expired, false otherwise
   */
  isExpired() {
    return this.ttl <= 0;
  }
}

class SlicedEmoji {
  /**
   * Creates an instance of SlicedEmoji.
   * @param {number} x - X position (emoji's center)
   * @param {number} y - Y position (emoji's center)
   * @param {string} emoji - Emoji character
   * @param {number} sliceAngle - Angle of the slice in radians
   * @param {number} radius - Radius of the sliced emoji
   * @param {object} sliceLine - Object with point1 and point2 {x1, y1, x2, y2}
   */
  constructor(x, y, emoji, sliceAngle, radius, sliceLine) {
    this.x = x;
    this.y = y;
    this.emoji = emoji;
    this.sliceAngle = sliceAngle;
    this.radius = radius;
    this.sliceLine = sliceLine;

    this.fragments = [];

    // Create two fragments: 'left' and 'right' of the slice
    const leftFragment = new SlicedEmojiFragment(this.x, this.y, this.emoji, sliceAngle, this.radius, 'left', sliceLine);
    const rightFragment = new SlicedEmojiFragment(this.x, this.y, this.emoji, sliceAngle, this.radius, 'right', sliceLine);

    this.fragments.push(leftFragment);
    this.fragments.push(rightFragment);

    // Lifetime
    this.ttl = 60; // Adjusted lifetime
    this.opacity = 1;
  }

  /**
   * Updates the sliced emoji's fragments
   */
  update() {
    this.fragments.forEach(fragment => fragment.update());

    // Decrease TTL and opacity
    this.ttl--;
    this.opacity = this.ttl / 60;
  }

  /**
   * Draws the sliced emoji's fragments on the canvas
   * @param {CanvasRenderingContext2D} context - The canvas context
   */
  draw(context) {
    context.save();
    context.globalAlpha = this.opacity;

    // Draw each fragment
    this.fragments.forEach(fragment => fragment.draw(context));

    context.restore();
  }

  /**
   * Checks if the sliced emoji's lifetime has expired
   * @returns {boolean} True if expired, false otherwise
   */
  isExpired() {
    return this.ttl <= 0 && this.fragments.every(frag => frag.isExpired());
  }
}

class SliceParticle {
  /**
   * Creates an instance of SliceParticle.
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} angle - Direction of the particle
   */
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.speed = Math.random() * 2 + 1;
    this.radius = Math.random() * 2 + 1;
    this.ttl = 30; // Frames
    this.opacity = 1;
    this.color = `hsl(${Math.random() * 360}, 100%, 50%)`; // Random color
  }

  /**
   * Updates the particle's position and opacity
   */
  update() {
    this.x += Math.cos(this.angle) * this.speed;
    this.y += Math.sin(this.angle) * this.speed;
    this.ttl--;
    this.opacity = this.ttl / 30;
  }

  /**
   * Draws the particle on the canvas
   * @param {CanvasRenderingContext2D} context - The canvas context
   */
  draw(context) {
    context.save();
    context.globalAlpha = this.opacity;
    context.fillStyle = this.color;
    context.beginPath();
    context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  /**
   * Checks if the particle's lifetime has expired
   * @returns {boolean} True if expired, false otherwise
   */
  isExpired() {
    return this.ttl <= 0;
  }
}

/**
 * SparkleParticle Class
 * Represents a single sparkle in the sparkles animation.
 */
class SparkleParticle {
  /**
   * Creates an instance of SparkleParticle.
   * @param {number} x - X position
   * @param {number} y - Y position
   */
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = Math.random() * 3 + 2; // Size between 2 and 5
    this.speedX = (Math.random() - 0.5) * 2; // Horizontal speed between -1 and 1
    this.speedY = (Math.random() - 0.5) * 2; // Vertical speed between -1 and 1
    this.ttl = 30; // Time to live (frames)
    this.opacity = 1;
    this.color = `rgba(255, 255, 255, ${this.opacity})`; // White sparkles
  }

  /**
   * Updates the sparkle's position and properties.
   */
  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.ttl--;
    this.opacity = this.ttl / 30;
    this.color = `rgba(255, 255, 255, ${this.opacity})`;
  }

  /**
   * Draws the sparkle on the canvas.
   * @param {CanvasRenderingContext2D} context - The canvas context
   */
  draw(context) {
    context.save();
    context.globalAlpha = this.opacity;
    context.fillStyle = this.color;
    context.beginPath();
    context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  /**
   * Checks if the sparkle's lifetime has expired.
   * @returns {boolean} True if expired, false otherwise
   */
  isExpired() {
    return this.ttl <= 0;
  }
}
