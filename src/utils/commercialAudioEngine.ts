/**
 * Commercial Audio Engine for TawZoon Video Commercials
 * Provides professional UI sound effects (transition whooshes, shimmer chimes)
 * and curated background commercial music (Upbeat Pop, Luxury Chill, Viral Reels, Soft Lo-Fi, Custom Upload).
 * Works seamlessly with Web Audio API for 0-latency live preview and MediaRecorder stream mixing.
 */

export type MusicGenre = 'upbeat_pop' | 'luxury_chill' | 'viral_reels' | 'soft_acoustic' | 'custom' | 'none';

export interface AudioEngineSettings {
  musicGenre: MusicGenre;
  musicVolume: number; // 0.0 to 1.0
  sfxEnabled: boolean;
  sfxVolume: number; // 0.0 to 1.0
  customAudioBuffer?: AudioBuffer | null;
  customAudioFileName?: string;
}

/**
 * Synthesizes a modern silky UI Whoosh / Swoosh transition sound effect
 * Pure, single high-end noise sweep with windowed smooth envelope (zero thump/crunch/click)
 */
export const playTransitionWhoosh = (
  ctx: AudioContext | OfflineAudioContext,
  dest: AudioNode,
  startTime: number,
  volume = 0.5
) => {
  if (volume <= 0) return;
  const now = Math.max(0, startTime);
  const duration = 0.28;

  const bufferSize = Math.floor(ctx.sampleRate * duration);
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    const window = Math.sin((Math.PI * i) / bufferSize);
    output[i] = (Math.random() * 2 - 1) * window;
  }

  const whiteNoise = ctx.createBufferSource();
  whiteNoise.buffer = noiseBuffer;

  const highpass = ctx.createBiquadFilter();
  highpass.type = 'highpass';
  highpass.frequency.setValueAtTime(850, now);

  const bandpass = ctx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.Q.setValueAtTime(1.6, now);
  bandpass.frequency.setValueAtTime(900, now);
  bandpass.frequency.exponentialRampToValueAtTime(3200, now + duration * 0.45);
  bandpass.frequency.exponentialRampToValueAtTime(1100, now + duration);

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.0001, now);
  noiseGain.gain.linearRampToValueAtTime(volume * 0.35, now + duration * 0.35);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  whiteNoise.connect(highpass);
  highpass.connect(bandpass);
  bandpass.connect(noiseGain);
  noiseGain.connect(dest);

  whiteNoise.start(now);
  whiteNoise.stop(now + duration);
};

/**
 * Synthesizes a delicate luxury sparkle / chime sound for discount badges and accents
 */
export const playShimmerChime = (
  ctx: AudioContext | OfflineAudioContext,
  dest: AudioNode,
  startTime: number,
  volume = 0.4
) => {
  if (volume <= 0) return;
  const now = Math.max(0, startTime);
  const freqs = [1046.5, 1318.5, 1567.98, 2093.0]; // C6, E6, G6, C7 arpeggio

  freqs.forEach((freq, idx) => {
    const noteStart = now + idx * 0.055;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, noteStart);

    gain.gain.setValueAtTime(0.0001, noteStart);
    gain.gain.linearRampToValueAtTime(volume * 0.25, noteStart + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.6);

    osc.connect(gain);
    gain.connect(dest);

    osc.start(noteStart);
    osc.stop(noteStart + 0.65);
  });
};

const playKick = (ctx: AudioContext | OfflineAudioContext, dest: AudioNode, time: number, vol = 0.6) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.setValueAtTime(130, time);
  osc.frequency.exponentialRampToValueAtTime(38, time + 0.12);

  gain.gain.setValueAtTime(vol * 0.7, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);

  osc.connect(gain);
  gain.connect(dest);
  osc.start(time);
  osc.stop(time + 0.22);
};

const playSnare = (ctx: AudioContext | OfflineAudioContext, dest: AudioNode, time: number, vol = 0.5) => {
  const bufferSize = Math.floor(ctx.sampleRate * 0.15);
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.setValueAtTime(1000, time);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(vol * 0.5, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(dest);
  noise.start(time);
  noise.stop(time + 0.15);
};

const playHiHat = (ctx: AudioContext | OfflineAudioContext, dest: AudioNode, time: number, vol = 0.3) => {
  const bufferSize = Math.floor(ctx.sampleRate * 0.05);
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.setValueAtTime(7000, time);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(vol * 0.35, time);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.045);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(dest);
  noise.start(time);
  noise.stop(time + 0.05);
};

const playChord = (
  ctx: AudioContext | OfflineAudioContext,
  dest: AudioNode,
  time: number,
  notes: number[],
  duration: number,
  vol = 0.3,
  type: OscillatorType = 'triangle'
) => {
  notes.forEach((freq) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime((vol * 0.35) / notes.length, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(time);
    osc.stop(time + duration + 0.05);
  });
};

const playBassNote = (
  ctx: AudioContext | OfflineAudioContext,
  dest: AudioNode,
  time: number,
  freq: number,
  duration: number,
  vol = 0.4
) => {
  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(freq, time);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(320, time);
  filter.frequency.exponentialRampToValueAtTime(120, time + duration);

  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.linearRampToValueAtTime(vol * 0.45, time + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(dest);

  osc.start(time);
  osc.stop(time + duration + 0.05);
};

export const scheduleBackgroundMusic = (
  ctx: AudioContext | OfflineAudioContext,
  masterDest: AudioNode,
  totalDurationSec: number,
  genre: MusicGenre,
  volume = 0.6,
  customBuffer?: AudioBuffer | null
) => {
  if (genre === 'none' || volume <= 0) return;

  const musicGain = ctx.createGain();
  musicGain.gain.setValueAtTime(volume, 0);
  musicGain.connect(masterDest);

  if (genre === 'custom' && customBuffer) {
    const source = ctx.createBufferSource();
    source.buffer = customBuffer;
    source.loop = true;
    source.connect(musicGain);
    source.start(0);
    source.stop(totalDurationSec);
    return;
  }

  if (genre === 'upbeat_pop') {
    const bpm = 122;
    const beatInterval = 60 / bpm;
    const totalBeats = Math.ceil(totalDurationSec / beatInterval);

    const chords = [
      [261.63, 329.63, 392.0, 493.88],
      [220.0, 261.63, 329.63, 392.0],
      [174.61, 220.0, 261.63, 329.63],
      [196.0, 246.94, 293.66, 349.23],
    ];
    const bassNotes = [65.41, 55.0, 43.65, 49.0];

    for (let beat = 0; beat < totalBeats; beat++) {
      const time = beat * beatInterval;
      if (time >= totalDurationSec) break;

      const measureIdx = Math.floor(beat / 4) % 4;
      const beatInMeasure = beat % 4;

      if (beatInMeasure === 0 || beatInMeasure === 2) {
        playKick(ctx, musicGain, time, 0.6);
      }
      if (beatInMeasure === 2 && time + beatInterval * 0.5 < totalDurationSec) {
        playKick(ctx, musicGain, time + beatInterval * 0.5, 0.4);
      }

      if (beatInMeasure === 1 || beatInMeasure === 3) {
        playSnare(ctx, musicGain, time, 0.5);
      }

      playHiHat(ctx, musicGain, time, 0.25);
      if (time + beatInterval * 0.5 < totalDurationSec) {
        playHiHat(ctx, musicGain, time + beatInterval * 0.5, 0.2);
      }

      if (beatInMeasure === 0 || beatInMeasure === 2) {
        playChord(ctx, musicGain, time, chords[measureIdx], beatInterval * 1.6, 0.35, 'triangle');
      }

      if (beatInMeasure === 0) {
        playBassNote(ctx, musicGain, time, bassNotes[measureIdx], beatInterval * 0.8, 0.5);
      } else if (beatInMeasure === 2) {
        playBassNote(ctx, musicGain, time, bassNotes[measureIdx] * 1.5, beatInterval * 0.7, 0.45);
      }
    }
    return;
  }

  if (genre === 'luxury_chill') {
    const bpm = 96;
    const beatInterval = 60 / bpm;
    const totalBeats = Math.ceil(totalDurationSec / beatInterval);

    const chords = [
      [293.66, 349.23, 440.0, 523.25, 659.25],
      [196.0, 246.94, 329.63, 349.23, 440.0],
      [261.63, 329.63, 392.0, 493.88, 587.33],
      [220.0, 277.18, 329.63, 392.0, 523.25],
    ];
    const bassNotes = [73.42, 49.0, 65.41, 55.0];

    for (let beat = 0; beat < totalBeats; beat++) {
      const time = beat * beatInterval;
      if (time >= totalDurationSec) break;

      const measureIdx = Math.floor(beat / 4) % 4;
      const beatInMeasure = beat % 4;

      if (beatInMeasure === 0) {
        playKick(ctx, musicGain, time, 0.5);
        playBassNote(ctx, musicGain, time, bassNotes[measureIdx], beatInterval * 1.8, 0.45);
      }
      if (beatInMeasure === 2) {
        playSnare(ctx, musicGain, time, 0.35);
      }

      for (let s = 0; s < 4; s++) {
        const sTime = time + s * (beatInterval / 4);
        if (sTime < totalDurationSec) {
          playHiHat(ctx, musicGain, sTime, s % 2 === 0 ? 0.2 : 0.1);
        }
      }

      if (beatInMeasure === 0) {
        playChord(ctx, musicGain, time, chords[measureIdx], beatInterval * 2.8, 0.4, 'sine');
      }
    }
    return;
  }

  if (genre === 'viral_reels') {
    const bpm = 132;
    const beatInterval = 60 / bpm;
    const totalBeats = Math.ceil(totalDurationSec / beatInterval);

    const bassNotes = [41.2, 41.2, 49.0, 43.65];
    const leadNotes = [523.25, 659.25, 783.99, 987.77, 1046.5];

    for (let beat = 0; beat < totalBeats; beat++) {
      const time = beat * beatInterval;
      if (time >= totalDurationSec) break;

      const measureIdx = Math.floor(beat / 4) % 4;
      const beatInMeasure = beat % 4;

      if (beatInMeasure === 0 || (beatInMeasure === 2 && beat % 2 === 0)) {
        playKick(ctx, musicGain, time, 0.7);
        playBassNote(ctx, musicGain, time, bassNotes[measureIdx], beatInterval * 1.4, 0.6);
      }

      if (beatInMeasure === 2) {
        playSnare(ctx, musicGain, time, 0.6);
      }

      for (let h = 0; h < 4; h++) {
        const hTime = time + h * (beatInterval / 4);
        if (hTime < totalDurationSec) {
          playHiHat(ctx, musicGain, hTime, 0.28);
        }
      }

      const note = leadNotes[(beat * 3) % leadNotes.length];
      playChord(ctx, musicGain, time, [note], beatInterval * 0.4, 0.28, 'sine');
    }
    return;
  }

  if (genre === 'soft_acoustic') {
    const bpm = 88;
    const beatInterval = 60 / bpm;
    const totalBeats = Math.ceil(totalDurationSec / beatInterval);

    const chords = [
      [349.23, 440.0, 523.25, 659.25],
      [329.63, 392.0, 493.88, 587.33],
      [293.66, 349.23, 440.0, 523.25],
      [261.63, 329.63, 392.0, 493.88],
    ];
    const bassNotes = [43.65, 41.2, 36.71, 32.7];

    for (let beat = 0; beat < totalBeats; beat++) {
      const time = beat * beatInterval;
      if (time >= totalDurationSec) break;

      const measureIdx = Math.floor(beat / 4) % 4;
      const beatInMeasure = beat % 4;

      if (beatInMeasure === 0) {
        playKick(ctx, musicGain, time, 0.4);
        playBassNote(ctx, musicGain, time, bassNotes[measureIdx], beatInterval * 2.0, 0.35);
      }
      if (beatInMeasure === 2) {
        playSnare(ctx, musicGain, time, 0.3);
      }

      const currentChord = chords[measureIdx];
      const pluck1 = currentChord[beatInMeasure % currentChord.length];
      playChord(ctx, musicGain, time, [pluck1], beatInterval * 0.9, 0.3, 'triangle');

      if (time + beatInterval * 0.5 < totalDurationSec) {
        const pluck2 = currentChord[(beatInMeasure + 2) % currentChord.length];
        playChord(ctx, musicGain, time + beatInterval * 0.5, [pluck2], beatInterval * 0.8, 0.25, 'triangle');
        playHiHat(ctx, musicGain, time + beatInterval * 0.5, 0.12);
      }
    }
  }
};

export const mixCommercialAudio = (
  ctx: AudioContext | OfflineAudioContext,
  destination: AudioNode,
  totalDurationSec: number,
  secondsPerImage: number,
  numImages: number,
  settings: AudioEngineSettings
) => {
  scheduleBackgroundMusic(
    ctx,
    destination,
    totalDurationSec,
    settings.musicGenre,
    settings.musicVolume,
    settings.customAudioBuffer
  );

  if (settings.sfxEnabled && settings.sfxVolume > 0) {
    playShimmerChime(ctx, destination, 0.2, settings.sfxVolume * 0.8);

    const cycleTime = totalDurationSec / Math.max(1, numImages);
    for (let i = 1; i < numImages; i++) {
      const transitionTime = i * cycleTime;
      if (transitionTime < totalDurationSec) {
        playTransitionWhoosh(ctx, destination, transitionTime, settings.sfxVolume * 0.85);
      }
    }

    if (totalDurationSec > 3) {
      playShimmerChime(ctx, destination, totalDurationSec - 1.8, settings.sfxVolume * 0.6);
    }
  }
};

export const preRenderFullCommercialAudio = async (
  totalDurationSec: number,
  secondsPerImage: number,
  numImages: number,
  settings: AudioEngineSettings
): Promise<AudioBuffer | null> => {
  if (settings.musicGenre === 'none' && (!settings.sfxEnabled || settings.sfxVolume <= 0)) {
    return null;
  }

  const sampleRate = 44100;
  const lengthSamples = Math.max(sampleRate, Math.ceil((totalDurationSec + 0.5) * sampleRate));
  const offlineCtx = new OfflineAudioContext(2, lengthSamples, sampleRate);

  mixCommercialAudio(
    offlineCtx,
    offlineCtx.destination,
    totalDurationSec,
    secondsPerImage,
    numImages,
    settings
  );

  try {
    const renderedBuffer = await offlineCtx.startRendering();
    return renderedBuffer;
  } catch (e) {
    console.warn('OfflineAudioContext rendering failed', e);
    return null;
  }
};
