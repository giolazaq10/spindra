/** Nine original painted symbols share one cached atlas per game. Cell order is stable. */
export default function MaterialSymbol({
  scene,
  cell,
}: {
  scene: string;
  cell: number;
}) {
  const column = cell % 3,
    row = Math.floor(cell / 3);
  return (
    <svg
      className="symbol-raster"
      x="0"
      y="0"
      width="100"
      height="100"
      viewBox="3 3 94 90"
      overflow="hidden"
      aria-hidden="true"
    >
      <image
        href={`/worlds/symbols-${scene}.webp`}
        x={-column * 100}
        y={-row * 100}
        width="300"
        height="300"
        preserveAspectRatio="none"
      />
    </svg>
  );
}
