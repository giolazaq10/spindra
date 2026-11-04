import type { RigName } from "../lib/worldDirector";
const rigFaces: Record<RigName, [number, number, number, number]> = {
  angler: [39, 62, 45, 4.1],
  confectioner: [44, 65, 49, 4],
  guardian: [43, 63, 46, 3.7],
  explorer: [42, 64, 46, 4],
  engineer: [39, 63, 45, 4],
  keeper: [40, 63, 46, 3.6],
};
export default function RigFace({ rig }: { rig: RigName }) {
  const [left, right, y, width] = rigFaces[rig];
  return (
    <svg className="rig-face" viewBox="0 0 100 100">
      <g
        className="rig-eyebrows"
        stroke="#583a42"
        strokeWidth=".95"
        fill="none"
        strokeLinecap="round"
      >
        {[left, right].map((x, i) => (
          <path
            key={i}
            className={i ? "rig-brow-right" : "rig-brow-left"}
            d={`M${x - width} ${y - 4.8}q${width}-${2} ${width * 2} 0`}
          />
        ))}
      </g>
      <g
        className="rig-eyelids"
        style={{ transformOrigin: `${(left + right) / 2}px ${y}px` }}
      >
        {[left, right].map((x) => (
          <path
            key={x}
            d={`M${x - width} ${y}q${width}-${3.7} ${width * 2} 0q-${width} 3.5-${width * 2} 0`}
            fill="#e8ddd0"
            stroke="#764a43"
            strokeWidth=".45"
          />
        ))}
        <g className="rig-pupils">
          {[left, right].map((x) => (
            <g key={x}>
              <ellipse cx={x + 0.3} cy={y} rx="1.6" ry="1.9" fill="#436455" />
              <ellipse cx={x + 0.3} cy={y} rx=".8" ry="1.5" fill="#172831" />
              <circle cx={x + 0.7} cy={y - 0.7} r=".45" fill="#fff9e0" />
            </g>
          ))}
        </g>
      </g>
    </svg>
  );
}
