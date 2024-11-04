// music.js

/**
 * Music Management using Web Audio API
 */

// AudioContext and State Variables
let audioContext;
let isAudioInitialized = false;

// Define the melody for "Ode to Joy" (C Major)
const ODE_TO_JOY_MELODY = [
  { note: 'E4', duration: 400 },
  { note: 'E4', duration: 400 },
  { note: 'F4', duration: 400 },
  { note: 'G4', duration: 400 },
  { note: 'G4', duration: 400 },
  { note: 'F4', duration: 400 },
  { note: 'E4', duration: 400 },
  { note: 'D4', duration: 400 },
  { note: 'C4', duration: 400 },
  { note: 'C4', duration: 400 },
  { note: 'D4', duration: 400 },
  { note: 'E4', duration: 400 },
  { note: 'D4', duration: 400 },
  { note: 'C4', duration: 400 },
  { note: 'C4', duration: 800 },
  // Continue melody as desired
];

// Convert note names to frequencies
const NOTE_FREQUENCIES = {
  'C4': 261.63,
  'D4': 293.66,
  'E4': 329.63,
  'F4': 349.23,
  'G4': 392.00,
  'A4': 440.00,
  'B4': 493.88,
  'C5': 523.25,
  // Add more notes if needed
};

// Melody Player State
let melodyIndex = 0;

/**
 * Initializes the AudioContext upon user interaction
 */
function initAudio() {
  if (audioContext) return;
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  isAudioInitialized = true;
}

/**
 * Plays a single note with a simple and beautiful sound.
 * @param {string} note - The note name (e.g., 'C4')
 * @param {number} duration - Duration in milliseconds
 */
function playNoteSimple(note, duration) {
  if (!isAudioInitialized) {
    return;
  }

  const frequency = NOTE_FREQUENCIES[note];
  if (!frequency) {
    return;
  }

  const oscillator = audioContext.createOscillator();
  oscillator.type = 'sine'; // Simple sine wave for a pure tone

  const gainNode = audioContext.createGain();

  oscillator.frequency.value = frequency;

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  const currentTime = audioContext.currentTime;

  // Simple ADSR envelope
  gainNode.gain.setValueAtTime(0, currentTime);
  gainNode.gain.linearRampToValueAtTime(0.8, currentTime + 0.05); // Attack
  gainNode.gain.linearRampToValueAtTime(0.6, currentTime + 0.1); // Decay
  gainNode.gain.setValueAtTime(0.6, currentTime + (duration / 1000) - 0.1); // Sustain
  gainNode.gain.linearRampToValueAtTime(0, currentTime + (duration / 1000)); // Release

  oscillator.start(currentTime);
  oscillator.stop(currentTime + (duration / 1000) + 0.1);
}

/**
 * Plays the next note in the melody sequence.
 * This function should be called each time the player slices an emoji.
 */
function playNextMelodyNote() {
  if (!isAudioInitialized) {
    return;
  }

  // Get the current note
  const currentNote = ODE_TO_JOY_MELODY[melodyIndex];
  if (!currentNote) {
    resetMelody();
    return;
  }

  playNoteSimple(currentNote.note, currentNote.duration);

  // Increment melody index
  melodyIndex++;

  // If we've reached the end of the melody, reset
  if (melodyIndex >= ODE_TO_JOY_MELODY.length) {
    resetMelody();
  }
}

/**
 * Resets the melody to the start.
 */
function resetMelody() {
  melodyIndex = 0;
}

/**
 * Plays a sound effect when an emoji is sliced.
 */
function playSliceSound() {
  // Play the next note in the melody
  playNextMelodyNote();
}

/**
 * Initializes AudioContext on first user interaction
 * to comply with browser autoplay policies.
 */
function setupUserInteraction() {
  const startButton = document.getElementById('startButton');
  if (startButton) {
    startButton.addEventListener('click', () => {
      initAudio();
    });
  }

  // Also initialize audio when the game canvas is touched/clicked
  const gameCanvas = document.getElementById('gameCanvas');
  if (gameCanvas) {
    gameCanvas.addEventListener('mousedown', () => {
      initAudio();
    });
    gameCanvas.addEventListener('touchstart', () => {
      initAudio();
    });
  }
}

// Setup user interaction to initialize AudioContext
window.addEventListener('DOMContentLoaded', setupUserInteraction);

// Expose necessary functions to the global scope
window.playNextMelodyNote = playNextMelodyNote;
window.resetMelody = resetMelody;
window.playSliceSound = playSliceSound;
