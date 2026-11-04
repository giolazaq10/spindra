import { memo, type CSSProperties } from "react";
import LivingWorld from "./LivingWorld";
/** A fixed number of decorative nodes; motion stays in CSS, outside reel updates. */
export default memo(function SlotAtmosphere({
  phase,
  scene,
}: {
  phase: "idle" | "spin" | "win" | "bonus";
  scene: string;
}) {
  return (
    <div
      className={"slot-atmosphere atmosphere-" + phase}
      data-ambient-scene={scene}
      aria-hidden="true"
    >
      <LivingWorld scene={scene} phase={phase} />
      <i className="slot-aura-orb orb-one" />
      <i className="slot-aura-orb orb-two" />
      <div className="slot-stage-lights">
        <i />
        <i />
      </div>
      <div className="slot-perspective-floor" />
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
