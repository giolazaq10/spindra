import { useEffect, useState } from "react";
import { credits } from "../lib/money";
export default function AnimatedCredits({ amount }: { amount: number }) {
  const [display, setDisplay] = useState({ amount, value: 0 });
  useEffect(() => {
    if (!amount) return;
    let frame = 0,
      timer: ReturnType<typeof setTimeout>;
    const total = 36;
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    function tick() {
      frame++;
      const t = reduced ? 1 : frame / total;
      setDisplay({ amount, value: Math.round(amount * (1 - (1 - t) ** 3)) });
      if (t < 1) timer = setTimeout(tick, 33);
    }
    timer = setTimeout(tick, 33);
    return () => clearTimeout(timer);
  }, [amount]);
  return <>{credits(display.amount === amount ? display.value : 0)}</>;
}
