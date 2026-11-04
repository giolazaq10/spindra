import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
type Mode = "idle" | "hold" | "auto";
type Options = {
  busy: boolean;
  canStart: boolean;
  spin: RefObject<(quick: boolean) => Promise<boolean>>;
  root: RefObject<HTMLDivElement>;
  unlock: () => void;
};
export function useSlotPlayback(options: Options) {
  const [state, setState] = useState<{ mode: Mode; left: number }>({
    mode: "idle",
    left: 0,
  });
  const [turbo, setTurbo] = useState(false);
  const [notice, setNotice] = useState("");
  const latest = useRef(options),
    mode = useRef<Mode>("idle"),
    left = useRef(0),
    alive = useRef(true),
    inFlight = useRef(false),
    next = useRef<ReturnType<typeof setTimeout> | null>(null),
    fast = useRef(turbo);
  useLayoutEffect(() => {
    latest.current = options;
    fast.current = turbo;
  });
  function stop(reason = "") {
    mode.current = "idle";
    left.current = 0;
    if (next.current) clearTimeout(next.current);
    next.current = null;
    setState({ mode: "idle", left: 0 });
    if (reason) setNotice(reason);
  }
  const stopRef = useRef(stop);
  useLayoutEffect(() => {
    stopRef.current = stop;
  });
  useEffect(() => {
    alive.current = true;
    function keydown(e: KeyboardEvent) {
      if (e.code !== "Space" || e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.repeat) {
        if (mode.current === "hold") e.preventDefault();
        return;
      }
      const target = e.target instanceof Element ? e.target : null;
      if (
        document.querySelector('[role="dialog"], [aria-modal="true"]') ||
        target?.closest(
          'input,select,textarea,a,[contenteditable="true"],[role="textbox"]',
        ) ||
        (target?.closest("button") && !target.closest(".spin-control")) ||
        (target &&
          target !== document.body &&
          !latest.current.root.current?.contains(target))
      )
        return;
      e.preventDefault();
      latest.current.unlock();
      if (!latest.current.canStart) return;
      mode.current = "hold";
      left.current = 0;
      setNotice("Hold Space for quick spins. Release to stop.");
      setState({ mode: "hold", left: 0 });
    }
    const keyup = (e: KeyboardEvent) => {
      if (e.code === "Space" && mode.current === "hold") {
        e.preventDefault();
        stopRef.current();
      }
    };
    const blur = () => stopRef.current("Repeated spins stopped.");
    const visibility = () => {
      if (document.hidden) blur();
    };
    window.addEventListener("keydown", keydown);
    window.addEventListener("keyup", keyup);
    window.addEventListener("blur", blur);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("keyup", keyup);
      window.removeEventListener("blur", blur);
      document.removeEventListener("visibilitychange", visibility);
      mode.current = "idle";
      alive.current = false;
      if (next.current) clearTimeout(next.current);
    };
  }, []);
  useEffect(() => {
    if (state.mode === "idle" || options.busy || inFlight.current) return;
    next.current = setTimeout(() => {
      next.current = null;
      if (mode.current === "idle" || inFlight.current || latest.current.busy)
        return;
      if (document.querySelector('[role="dialog"], [aria-modal="true"]')) {
        stopRef.current("Repeated spins stopped while a dialog is open.");
        return;
      }
      if (!latest.current.canStart) {
        stopRef.current(
          "Stopped: balance or account is unavailable for another spin.",
        );
        return;
      }
      if (mode.current === "auto" && left.current === 0) {
        stopRef.current("Autoplay complete.");
        return;
      }
      void latest.current.spin.current!(
        mode.current === "hold" || fast.current,
      ).then((started) => {
        if (!started && alive.current)
          stopRef.current("Repeated spins stopped.");
      });
    }, 20);
    return () => {
      if (next.current) clearTimeout(next.current);
      next.current = null;
    };
  }, [state, options.busy, options.canStart]);
  function accepted() {
    inFlight.current = true;
    if (mode.current === "auto") {
      left.current = Math.max(0, left.current - 1);
      setState({ mode: "auto", left: left.current });
    }
  }
  function completed() {
    inFlight.current = false;
  }
  function startAuto(count: number) {
    if (
      !Number.isInteger(count) ||
      count < 1 ||
      count > 1000 ||
      latest.current.busy ||
      !latest.current.canStart
    )
      return;
    latest.current.unlock();
    mode.current = "auto";
    left.current = count;
    setNotice("Autoplay stops on free spins, an error, or leaving this game.");
    setState({ mode: "auto", left: count });
  }
  function manual() {
    stop();
    latest.current.unlock();
    void latest.current.spin.current!(fast.current);
  }
  return {
    mode: state.mode,
    left: state.left,
    turbo,
    setTurbo,
    notice,
    stop,
    accepted,
    completed,
    startAuto,
    manual,
  };
}
