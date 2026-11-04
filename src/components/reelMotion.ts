/** Presentation only: result generation and payout math do not depend on timing. */
export function reelMotion(reels: number, elapsed = 0, reduced = false) {
  const first = reduced ? 0 : Math.max(0, 180 - elapsed);
  return Array.from({ length: reels }, (_, col) => ({
    stop: first + (reduced ? 0 : col * 60),
    land: reduced ? 0 : 110,
  }));
}
