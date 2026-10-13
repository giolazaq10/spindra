import { useEffect, useRef, useState } from "react";

type Frame = { at: number; show: () => void };
// A single cancellable presentation queue. Actions remain locked until the last
// card lands; navigation clears every callback before demo-round cleanup.
export default function useTableMotion() {
  const [animating, setAnimating] = useState(false);
  const locked = useRef(false),
    timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
      locked.current = false;
    },
    [],
  );
  function play(frames: Frame[], duration: number, done?: () => void) {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    locked.current = true;
    setAnimating(true);
    for (const frame of frames)
      timers.current.push(setTimeout(frame.show, frame.at));
    timers.current.push(
      setTimeout(() => {
        locked.current = false;
        setAnimating(false);
        done?.();
      }, duration),
    );
  }
  return { animating, locked, play };
}
