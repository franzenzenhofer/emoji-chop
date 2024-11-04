// music.js

/**
 * Music Management using Web Audio API
 */

/**
 * Notes:
 * - We're using modern sound design techniques to create a richer, more pleasing sound.
 * - The melody remains "Ode to Joy" as per your request.
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
  'G3': 196.00,
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
 * Plays a single note with enhanced sound.
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

  const startTime = audioContext.currentTime;
  const endTime = startTime + duration / 1000;

  // Master Gain Node
  const masterGain = audioContext.createGain();
  masterGain.gain.setValueAtTime(0, startTime);

  // ADSR Envelope for Gain
  const attackTime = 0.02;
  const decayTime = 0.1;
  const sustainLevel = 0.7;
  const releaseTime = 0.3;

  masterGain.gain.linearRampToValueAtTime(1.0, startTime + attackTime); // Attack
  masterGain.gain.linearRampToValueAtTime(sustainLevel, startTime + attackTime + decayTime); // Decay
  masterGain.gain.setValueAtTime(sustainLevel, endTime - releaseTime); // Sustain
  masterGain.gain.linearRampToValueAtTime(0.0, endTime); // Release

  // Create a low-pass filter to soften the sound
  const filter = audioContext.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1500, startTime);

  // Filter Envelope
  filter.frequency.linearRampToValueAtTime(2000, startTime + attackTime); // Attack
  filter.frequency.linearRampToValueAtTime(1000, endTime); // Decay/Release

  // Create multiple oscillators for richer sound
  const oscillators = [];

  // Base oscillator
  const osc1 = audioContext.createOscillator();
  osc1.type = 'sawtooth';
  osc1.frequency.setValueAtTime(frequency, startTime);
  osc1.detune.setValueAtTime(-5, startTime);
  osc1.connect(filter);
  oscillators.push(osc1);

  // Slightly detuned oscillator for chorus effect
  const osc2 = audioContext.createOscillator();
  osc2.type = 'sawtooth';
  osc2.frequency.setValueAtTime(frequency, startTime);
  osc2.detune.setValueAtTime(5, startTime);
  osc2.connect(filter);
  oscillators.push(osc2);

  // Sub oscillator an octave lower
  const osc3 = audioContext.createOscillator();
  osc3.type = 'triangle';
  osc3.frequency.setValueAtTime(frequency / 2, startTime);
  osc3.connect(filter);
  oscillators.push(osc3);

  // Connect filter to master gain
  filter.connect(masterGain);

  // Reverb (Convolver Node)
  const convolver = audioContext.createConvolver();
  convolver.buffer = createReverbBuffer(audioContext);
  masterGain.connect(convolver);
  convolver.connect(audioContext.destination);

  // Also connect master gain directly to destination for dry signal
  masterGain.connect(audioContext.destination);

  // Start and stop oscillators
  oscillators.forEach(osc => {
    osc.start(startTime);
    osc.stop(endTime + releaseTime);
  });

  // Stop master gain after release
  masterGain.gain.setValueAtTime(0.0, endTime + releaseTime + 0.1);
}

/**
 * Creates a simple reverb buffer.
 * @param {AudioContext} context - The audio context
 * @returns {AudioBuffer} The reverb buffer
 */
function createReverbBuffer(context) {
  const sampleRate = context.sampleRate;
  const length = sampleRate * 2; // 2 seconds
  const impulse = context.createBuffer(2, length, sampleRate);
  for (let i = 0; i < impulse.numberOfChannels; i++) {
    const channelData = impulse.getChannelData(i);
    for (let j = 0; j < length; j++) {
      // Exponential decay
      channelData[j] = (Math.random() * 2 - 1) * Math.pow(1 - j / length, 2);
    }
  }
  return impulse;
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
  const currentNote = ODE_TO_JOY_MELODY[melodyIndex];
  if (!currentNote) {
    debug('Melody index out of range. Resetting melody.');
    resetMelody();
    return;
  }

  playNote(currentNote.note, currentNote.duration);

  // Increment melody index
  melodyIndex++;

  // If we've reached the end of the melody, reset
  if (melodyIndex >= ODE_TO_JOY_MELODY.length) {
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
 * Plays a sound effect when an emoji is sliced.
 */
function playSliceSound() {
  if (!isAudioInitialized) {
    debug('AudioContext not initialized. Slice sound cannot be played.');
    return;
  }

  // Play the next melody note
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
window.playSliceSound = playSliceSound; // Expose playSliceSound

/**
 * Utility function for debugging (assumes DEBUG is defined globally)
 */
function debug(...args) {
  if (typeof DEBUG !== 'undefined' && DEBUG) {
    console.log('[DEBUG - music.js]:', ...args);
  }
}
