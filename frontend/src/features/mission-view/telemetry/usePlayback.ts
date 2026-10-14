import { useCallback, useEffect, useRef, useState } from 'react';

export function usePlayback(duration: number) {
  const time = useRef(0);
  const [displayTime, setDisplayTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  useEffect(() => {
    if (!playing) return;
    let frame = 0, previous = performance.now(), lastUI = previous;
    const tick = (now: number) => {
      time.current = Math.min(duration, time.current + (now - previous) / 1000 * speed);
      previous = now;
      if (now - lastUI >= 80 || time.current >= duration) { setDisplayTime(time.current); lastUI = now; }
      if (time.current >= duration) { setPlaying(false); return; }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, speed, duration]);
  const seek = useCallback((value: number) => { setPlaying(false); time.current = Math.max(0, Math.min(duration, value)); setDisplayTime(time.current); }, [duration]);
  return { time, displayTime, playing, setPlaying, speed, setSpeed, seek };
}
