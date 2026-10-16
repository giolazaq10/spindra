/** Format integer minor USD units for display. Never use display strings for settlement. */
export const credits = (minor: number) =>
  (minor / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
