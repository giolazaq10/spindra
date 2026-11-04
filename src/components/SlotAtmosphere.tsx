import { memo, type CSSProperties } from "react";
/** A fixed number of decorative nodes; motion stays in CSS, outside reel updates. */
export default memo(function SlotAtmosphere({
  phase,
}: {
  phase: "idle" | "spin" | "win" | "bonus";
}) {
  return (
    <div className={"slot-atmosphere atmosphere-" + phase} aria-hidden="true">
      <i className="slot-aura-orb orb-one" />
      <i className="slot-aura-orb orb-two" />
      <div className="slot-light-trails">
        {Array.from({ length: 12 }, (_, i) => (
          <i
            key={i}
            style={
              {
                "--trail": i,
                "--trail-x": (i * 29 + 7) % 100,
              } as CSSProperties
            }
          />
        ))}
      </div>
      <div className="slot-sparkle-field">
        {Array.from({ length: 10 }, (_, i) => (
          <span
            key={i}
            style={
              {
                "--spark": i,
                "--spark-x": (i * 37 + 11) % 100,
                "--spark-y": (i * 23 + 13) % 100,
              } as CSSProperties
            }
          >
            ✦
          </span>
        ))}
      </div>
    </div>
  );
});
