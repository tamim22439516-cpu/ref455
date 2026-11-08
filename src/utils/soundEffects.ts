/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Premium Web Audio API Sound Effects for Tawzoon Nexus
// Synthesizes crystal-clear, professional audio tones without external mp3 asset dependencies.

export function playNotificationSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime;
    // Pleasant dual bell chime (F5 -> C6)
    const notes = [
      { freq: 698.46, time: now, duration: 0.18, gain: 0.15 },
      { freq: 1046.50, time: now + 0.12, duration: 0.35, gain: 0.20 }
    ];
    notes.forEach(({ freq, time, duration, gain: gainVal }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(gainVal, time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(time);
      osc.stop(time + duration);
    });
  } catch {
    // Audio unavailable or blocked by browser policy
  }
}

export function playLoginSuccessSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime;
    // Warm rising melodic chord for login welcome (C5 -> E5 -> G5 -> C6)
    const notes = [
      { freq: 523.25, time: now, duration: 0.15, gain: 0.15 },
      { freq: 659.25, time: now + 0.08, duration: 0.15, gain: 0.18 },
      { freq: 783.99, time: now + 0.16, duration: 0.15, gain: 0.20 },
      { freq: 1046.50, time: now + 0.24, duration: 0.45, gain: 0.25 }
    ];
    notes.forEach(({ freq, time, duration, gain: gainVal }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(gainVal, time + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(time);
      osc.stop(time + duration);
    });
  } catch {
    // Audio unavailable
  }
}

export function playSuccessActionSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime;
    const notes = [
      { freq: 880.00, time: now, duration: 0.12, gain: 0.14 },
      { freq: 1318.51, time: now + 0.10, duration: 0.28, gain: 0.18 }
    ];
    notes.forEach(({ freq, time, duration, gain: gainVal }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(gainVal, time + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(time);
      osc.stop(time + duration);
    });
  } catch {}
}
