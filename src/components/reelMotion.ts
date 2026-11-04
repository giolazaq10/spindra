/** Presentation only: result generation and payout math do not depend on timing. */
export function reelMotion(
  reels: number,
  elapsed = 0,
  reduced = false,
  quick = false,
) {
  const first = reduced ? 0 : Math.max(0, (quick ? 90 : 180) - elapsed);
  return Array.from({ length: reels }, (_, col) => ({
    stop: first + (reduced ? 0 : col * (quick ? 18 : 60)),
    land: reduced ? 0 : quick ? 55 : 110,
  }));
}
