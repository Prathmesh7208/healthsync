/**
 * Web Audio API Ambulance & Emergency SOS Siren Synthesizer + Haptic Engine + Queue Token Announcer
 */
let audioCtx: AudioContext | null = null;

/**
 * Triggers native haptic vibration patterns on supported mobile devices
 */
export function triggerHapticVibration(pattern: number[] = [300, 100, 300, 100, 500]): void {
  try {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  } catch (err) {
    console.warn('Haptic vibration unsupported:', err);
  }
}

/**
 * Plays high-priority dual-tone emergency SOS siren + triggers mobile haptic vibration
 */
export function playEmergencySiren(durationSeconds: number = 3): void {
  // 1. Mobile Haptic feedback
  triggerHapticVibration([400, 100, 400, 100, 600]);

  // 2. Synthesized Dual-Tone Siren
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
    gain.gain.setValueAtTime(0.25, now);

    // 2-tone frequency alternation (880 Hz <-> 660 Hz)
    const cycles = Math.floor(durationSeconds * 2);
    for (let i = 0; i < cycles; i++) {
      const t = now + i * 0.5;
      osc.frequency.setValueAtTime(i % 2 === 0 ? 880 : 660, t);
    }

    // Fade out
    gain.gain.setValueAtTime(0.25, now + durationSeconds - 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, now + durationSeconds);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + durationSeconds);
  } catch (err) {
    console.warn('Audio siren alert blocked or unsupported:', err);
  }
}

/**
 * Plays pleasant hospital reception chime
 */
export function playQueueChime(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioCtx || audioCtx.state === 'suspended') {
      audioCtx = new AudioContextClass();
    }

    const now = audioCtx.currentTime;
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';

    osc1.frequency.setValueAtTime(523.25, now); // C5
    osc1.frequency.setValueAtTime(659.25, now + 0.15); // E5
    osc1.frequency.setValueAtTime(783.99, now + 0.3); // G5

    osc2.frequency.setValueAtTime(1046.5, now + 0.3); // C6

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(audioCtx.destination);

    osc1.start(now);
    osc2.start(now + 0.3);
    osc1.stop(now + 0.8);
    osc2.stop(now + 0.8);
  } catch (err) {
    console.warn('Queue chime failed:', err);
  }
}

/**
 * Text-to-Speech voice announcement for OPD Token Calling
 */
export function speakTokenCall(tokenNumber: string | number, doctorName?: string, cabin: string = 'Cabin 1'): void {
  playQueueChime();
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    setTimeout(() => {
      try {
        const text = `Token number ${tokenNumber}, please proceed to ${doctorName ? doctorName + "'s room" : cabin}.`;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.95;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
      } catch {
        // Fallback
      }
    }, 400);
  }
}
