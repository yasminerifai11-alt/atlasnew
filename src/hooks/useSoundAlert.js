import { useRef, useCallback } from "react";

const ALERT_SOUND_FREQ = {
  CRITICAL: [880, 660, 880],
  HIGH: [660, 550],
  MEDIUM: [440],
  LOW: [330],
  INFO: [550],
};

export function useSoundAlert() {
  const audioCtxRef = useRef(null);

  const playAlert = useCallback((level = "INFO") => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      const freqs = ALERT_SOUND_FREQ[level] || ALERT_SOUND_FREQ.INFO;
      const now = ctx.currentTime;

      freqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + i * 0.15);
        gain.gain.setValueAtTime(0.08, now + i * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.15);
        osc.stop(now + i * 0.15 + 0.3);
      });
    } catch {
      // AudioContext not available
    }
  }, []);

  return playAlert;
}
