export function slotWinTier(returned: number, stake: number) {
  const ratio = stake > 0 ? returned / stake : 0;
  return ratio >= 50
    ? "epic"
    : ratio >= 25
      ? "mega"
      : ratio >= 10
        ? "big"
        : "normal";
}
