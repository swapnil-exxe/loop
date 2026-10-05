// Web Audio API sound generator for admin actions (Approve & Reject)
let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Pleasant, uplifting 3-note ascending chime for Approve action
 * (C5 -> E5 -> G5, Apple/iOS success style)
 */
export function playApproveSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const notes = [
      { freq: 523.25, time: now, duration: 0.12, vol: 0.22 },        // C5
      { freq: 659.25, time: now + 0.08, duration: 0.14, vol: 0.25 }, // E5
      { freq: 783.99, time: now + 0.16, duration: 0.35, vol: 0.28 }  // G5
    ];

    notes.forEach(({ freq, time, duration, vol }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.exponentialRampToValueAtTime(vol, time + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(time);
      osc.stop(time + duration);
    });
  } catch (err) {
    console.warn('Audio play error:', err);
  }
}

/**
 * Distinct, soft descending 2-tone for Reject action
 * (F#4 -> D4, Apple/iOS dismiss/cancel style)
 */
export function playRejectSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const notes = [
      { freq: 369.99, time: now, duration: 0.12, vol: 0.22 },        // F#4
      { freq: 293.66, time: now + 0.09, duration: 0.26, vol: 0.24 }  // D4
    ];

    notes.forEach(({ freq, time, duration, vol }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.exponentialRampToValueAtTime(vol, time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(time);
      osc.stop(time + duration);
    });
  } catch (err) {
    console.warn('Audio play error:', err);
  }
}
