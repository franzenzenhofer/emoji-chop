// music.js

/**
 * Music Management using Web Audio API
 */

// AudioContext and State Variables
let audioContext;
let isAudioInitialized = false;

// Define the melody for "When the Saints Go Marching In" (C Major)
const SAINTS_MELODY = [
  { note: 'E4', duration: 400 },
  { note: 'G4', duration: 400 },
  { note: 'A4', duration: 400 },
  { note: 'G4', duration: 400 },
  { note: 'E4', duration: 400 },
  { note: 'C4', duration: 800 },
  { note: 'E4', duration: 400 },
  { note: 'G4', duration: 400 },
  { note: 'A4', duration: 400 },
  { note: 'G4', duration: 400 },
  { note: 'E4', duration: 400 },
  { note: 'C4', duration: 800 },
  // Repeat or extend the melody as needed
];

// Convert note names to frequencies (C4 to C5)
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
  debug('AudioContext initialized');
  isAudioInitialized = true;
}

/**
 * Plays a single note.
 * @param {string} note - The note name (e.g., 'C4')
 * @param {number} duration - Duration in milliseconds
 */
function playNote(note, duration) {
  if (!isAudioInitialized) {
    debug('AudioContext not initialized. Note cannot be played.');
    return;
  }

  const frequency = NOTE_FREQUENCIES[note];
  if (!frequency) {
    debug(`Frequency for note ${note} not defined.`);
    return;
  }

  // Create oscillator for the note
  const oscillator = audioContext.createOscillator();
  oscillator.type = 'sine'; // Smooth tone
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

  // Create gain node for volume and envelope
  const gainNode = audioContext.createGain();
  gainNode.gain.setValueAtTime(0, audioContext.currentTime);

  // ADSR Envelope
  gainNode.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + 0.05); // Attack
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration / 1000); // Decay

  // Connect nodes
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  // Start and stop oscillator
  oscillator.start();
  oscillator.stop(audioContext.currentTime + duration / 1000 + 0.1);
}

/**
 * Plays the next note in the melody sequence.
 * This function should be called each time the player slices an emoji.
 */
function playNextMelodyNote() {
  if (!isAudioInitialized) {
    debug('AudioContext not initialized. Cannot play melody.');
    return;
  }

  // Get the current note
  const currentNote = SAINTS_MELODY[melodyIndex];
  if (!currentNote) {
    debug('Melody index out of range. Resetting melody.');
    resetMelody();
    return;
  }

  playNote(currentNote.note, currentNote.duration);

  // Increment melody index
  melodyIndex++;

  // If we've reached the end of the melody, reset
  if (melodyIndex >= SAINTS_MELODY.length) {
    resetMelody();
  }
}

/**
 * Resets the melody to the start.
 * This function should be called when the player misses an emoji or the melody completes.
 */
function resetMelody() {
  melodyIndex = 0;
  debug('Melody reset to start.');
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

/**
 * Utility function for debugging (assumes DEBUG is defined globally)
 */
function debug(...args) {
  if (typeof DEBUG !== 'undefined' && DEBUG) {
    console.log('[DEBUG - music.js]:', ...args);
  }
}
