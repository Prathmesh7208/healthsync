/**
 * Web Audio API Ambulance & Emergency SOS Siren Synthesizer
 * Plays high-priority dual-tone audio alarm without needing external audio file dependencies.
 */
let audioCtx: AudioContext | null = null;

export function playEmergencySiren(durationSeconds: number = 3): void {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioCtx || audioCtx.state === 'suspended') {
      audioCtx = new AudioContextClass();
    }

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sawtooth';
    gain.gain.setValueAtTime(0.2, now);

    // 2-tone frequency alternation (750 Hz <-> 950 Hz)
    const cycles = Math.floor(durationSeconds * 2);
    for (let i = 0; i < cycles; i++) {
      const t = now + i * 0.5;
      osc.frequency.setValueAtTime(i % 2 === 0 ? 880 : 660, t);
    }

    // Fade out at end
    gain.gain.setValueAtTime(0.2, now + durationSeconds - 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, now + durationSeconds);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + durationSeconds);
  } catch (err) {
    console.warn('Audio siren alert blocked or unsupported:', err);
  }
}
