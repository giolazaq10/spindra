import { useId } from "react";
import type { PremiumKind } from "@/lib/premiumSlots";
import { vaultCoinPays } from "@/lib/premiumSlots";
export function PremiumBackdrop({ kind }: { kind: PremiumKind }) {
  return (
    <svg
      className={"premium-backdrop backdrop-" + kind}
      viewBox="0 0 1000 700"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {kind === "cascade" ? (
        <>
          <ellipse cx="500" cy="350" rx="420" ry="250" fill="#292252" />
          {[0, 1, 2].map((i) => (
            <ellipse
              key={i}
              className={"cosmic-ring ring-" + i}
              cx="500"
              cy="350"
              rx={290 + i * 70}
              ry={130 + i * 40}
              fill="none"
              stroke={i % 2 ? "#bf9cff" : "#7ef0e8"}
              strokeWidth={i === 0 ? 3 : 1}
              opacity=".4"
              transform={`rotate(${i * 38 - 25} 500 350)`}
            />
          ))}
          {Array.from({ length: 35 }, (_, i) => (
            <g key={i} fill={i % 2 ? "#b9b1ff" : "#bcfff0"}>
              <circle
                cx={(i * 137) % 1000}
                cy={(i * 89) % 700}
                r={i % 4 === 0 ? 3 : 1}
              />
            </g>
          ))}
          <path
            d="M0 580L170 330L210 650M1000 490L860 290L810 700"
            fill="none"
            stroke="#9187c433"
            strokeWidth="100"
          />
        </>
      ) : kind === "vault" ? (
        <>
          <rect width="1000" height="700" fill="#222527" />
          {Array.from({ length: 9 }, (_, i) => (
            <path
              key={i}
              d={`M${i * 140 - 500} 0l500 700`}
              stroke="#33393b"
              strokeWidth="60"
            />
          ))}
          <circle
            cx="500"
            cy="350"
            r="310"
            fill="none"
            stroke="#9e795733"
            strokeWidth="55"
          />
          {[60, 940].map((x) => (
            <g key={x}>
              <rect
                x={x - 22}
                y="100"
                width="44"
                height="500"
                rx="14"
                fill="#4c5050"
                stroke="#c3b59b"
                strokeWidth="3"
              />
              {[160, 350, 540].map((y) => (
                <circle
                  key={y}
                  cx={x}
                  cy={y}
                  r="9"
                  fill="#15191a"
                  stroke="#7f8c89"
                  strokeWidth="3"
                />
              ))}
            </g>
          ))}
          <path d="M100 640H900" stroke="#d7a56d" strokeWidth="2" />
        </>
      ) : (
        <>
          <rect width="1000" height="700" fill="#122723" />
          {Array.from({ length: 8 }, (_, i) => (
            <path
              key={i}
              d={`M${i * 180 - 500} 700l650-700`}
              stroke={i % 2 ? "#f4f6d7" : "#b9d953"}
              strokeWidth={i % 2 ? 45 : 12}
              opacity=".08"
            />
          ))}
          <path d="M0 560H1000M0 575H1000" stroke="#d9e3bb33" strokeWidth="3" />
          <g transform="translate(870 145)">
            <g className="motor-gear">
              <circle r="100" fill="none" stroke="#c5d4b344" strokeWidth="20" />
              {Array.from({ length: 12 }, (_, i) => (
                <path
                  key={i}
                  d="M-10-125h20v50h-20Z"
                  fill="#cee0bd33"
                  transform={`rotate(${i * 30})`}
                />
              ))}
              <circle r="30" fill="#d9e3bb33" />
            </g>
          </g>
        </>
      )}
    </svg>
  );
}
const gemColors = [
  "#f2efff",
  "#67e9f7",
  "#b59bff",
  "#ffd976",
  "#ff7e9c",
  "#71edbb",
  "#eaabff",
];
export function PremiumSymbol({
  kind,
  index,
}: {
  kind: PremiumKind;
  index: number;
}) {
  const id = useId().replace(/:/g, ""),
    color = gemColors[index % 7];
  if (kind === "cascade")
    return (
      <svg
        className={"premium-symbol crystal-" + index}
        viewBox="0 0 100 100"
        role="img"
        aria-label={
          ["Opal", "Aqua", "Amethyst", "Citrine", "Ruby", "Emerald", "Nova"][
            index
          ]
        }
      >
        <defs>
          <linearGradient id={id} x2=".8" y2="1">
            <stop stopColor="#fff" />
            <stop offset=".4" stopColor={color} />
            <stop offset="1" stopColor="#423d81" />
          </linearGradient>
        </defs>
        <path
          d={
            index % 3 === 0
              ? "M50 4L88 30L83 76L50 96L13 71L10 28Z"
              : index % 3 === 1
                ? "M50 5L91 48L50 96L9 48Z"
                : "M28 8H72L94 38L71 91H29L6 38Z"
          }
          fill={"url(#" + id + ")"}
          stroke="#f3faff"
          strokeWidth="2"
        />
        <path
          d="M50 5L35 34L12 29L31 68L50 95L68 66L88 30L64 35Z"
          fill={color}
          opacity=".6"
        />
        <path d="M35 34L64 35L68 66L31 68Z" fill="#fff" opacity=".25" />
        <path
          d="M18 29L34 16M69 20L81 31"
          stroke="#fff"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>
    );
  if (kind === "vault")
    return (
      <svg
        className={
          "premium-symbol vault-token " + (!index ? "empty-socket" : "")
        }
        viewBox="0 0 100 100"
        role="img"
        aria-label={
          index
            ? vaultCoinPays[index - 1] / 100 + " times locked coin"
            : "Empty vault socket"
        }
      >
        <defs>
          <radialGradient id={id}>
            <stop stopColor={index ? "#ffe8a9" : "#263136"} />
            <stop offset=".7" stopColor={index ? "#bf8a47" : "#11191c"} />
            <stop offset="1" stopColor={index ? "#6b4927" : "#293136"} />
          </radialGradient>
        </defs>
        <circle
          cx="50"
          cy="50"
          r="43"
          fill={"url(#" + id + ")"}
          stroke={index ? "#f8d999" : "#626662"}
          strokeWidth={index ? 5 : 2}
        />
        <circle
          cx="50"
          cy="50"
          r="34"
          fill="none"
          stroke={index ? "#6d4a29" : "#3b4546"}
          strokeWidth="1.5"
          strokeDasharray={index ? "2 4" : "0"}
        />
        {index ? (
          <>
            <path
              d="M43 31v-7a7 7 0 0114 0v7"
              fill="none"
              stroke="#56432d"
              strokeWidth="3"
            />
            <rect x="39" y="29" width="22" height="17" rx="3" fill="#76572d" />
            <text
              x="50"
              y="68"
              textAnchor="middle"
              fontSize={vaultCoinPays[index - 1] >= 100 ? 19 : 23}
              fontWeight="900"
              fill="#382d20"
            >
              {vaultCoinPays[index - 1] / 100}×
            </text>
            <path d="M20 28L28 20" stroke="#fff7d5" strokeWidth="4" />
          </>
        ) : (
          <path d="M35 50H65M50 35V65" stroke="#5a6667" strokeWidth="3" />
        )}
      </svg>
    );
  return (
    <svg
      className={"premium-symbol motor-symbol motor-" + index}
      viewBox="0 0 100 100"
      role="img"
      aria-label={
        ["Cherry", "Lemon", "Bell", "BAR", "Diamond", "Seven", "Gear wild"][
          index
        ]
      }
    >
      {index === 0 ? (
        <>
          <path
            d="M40 49Q39 16 66 13M65 53Q73 26 66 13Q85 13 84 26"
            fill="none"
            stroke="#326247"
            strokeWidth="6"
          />
          <circle
            cx="32"
            cy="65"
            r="21"
            fill="#e2484c"
            stroke="#7e1f31"
            strokeWidth="4"
          />
          <circle
            cx="72"
            cy="67"
            r="20"
            fill="#fc6762"
            stroke="#7e1f31"
            strokeWidth="4"
          />
          <path
            d="M20 57L30 51M61 61L68 56"
            stroke="#ffb7ac"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </>
      ) : index === 1 ? (
        <>
          <ellipse
            cx="50"
            cy="53"
            rx="38"
            ry="25"
            transform="rotate(-25 50 53)"
            fill="#f5cc36"
            stroke="#a68627"
            strokeWidth="4"
          />
          <path d="M73 28Q85 10 92 23Q82 37 73 28" fill="#5e9757" />
        </>
      ) : index === 2 ? (
        <>
          <path
            d="M25 68V45Q25 20 50 20T75 45V68L86 77H14Z"
            fill="#f2b53e"
            stroke="#9c6725"
            strokeWidth="4"
          />
          <circle cx="50" cy="81" r="8" fill="#c88a24" />
          <path
            d="M36 43V59"
            stroke="#ffe1a0"
            strokeWidth="6"
            strokeLinecap="round"
          />
        </>
      ) : index === 3 ? (
        <>
          <rect
            x="7"
            y="27"
            width="86"
            height="47"
            rx="7"
            fill="#213a32"
            stroke="#577866"
            strokeWidth="3"
          />
          <text
            x="50"
            y="61"
            textAnchor="middle"
            fontSize="32"
            fontWeight="900"
            fill="#e9efce"
          >
            BAR
          </text>
        </>
      ) : index === 4 ? (
        <>
          <path
            d="M9 35L28 13H72L91 35L50 89Z"
            fill="#7cdce4"
            stroke="#276b79"
            strokeWidth="4"
          />
          <path
            d="M9 35H91M28 13L38 35L50 89L62 35L72 13"
            fill="none"
            stroke="#d7fffb"
            strokeWidth="3"
          />
        </>
      ) : index === 5 ? (
        <text
          x="50"
          y="84"
          textAnchor="middle"
          fontSize="94"
          fontFamily="Georgia,serif"
          fontWeight="900"
          fill="#df4244"
          stroke="#fff2c6"
          strokeWidth="2"
        >
          7
        </text>
      ) : (
        <>
          <path
            d="M40 7H60L63 20L78 16L86 34L76 44L90 53L82 73L66 71L61 90H40L36 76L20 81L11 61L24 50L9 40L20 21L36 23Z"
            fill="#afb9a0"
            stroke="#42584c"
            strokeWidth="3"
          />
          <circle cx="50" cy="49" r="23" fill="#24483a" />
          <text
            x="50"
            y="55"
            textAnchor="middle"
            fontSize="13"
            fill="#eff6c5"
            fontWeight="900"
          >
            WILD
          </text>
        </>
      )}
    </svg>
  );
}
export function PremiumCover({
  kind,
  name,
  feature,
}: {
  kind: PremiumKind;
  name: string;
  feature: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1000"
      height="650"
      viewBox="0 0 1000 650"
    >
      <PremiumBackdrop kind={kind} />
      <rect y="390" width="1000" height="260" fill="#0b111c" opacity=".83" />
      {[0, 1, 2].map((i) => (
        <svg
          key={i}
          x={230 + i * 190}
          y={kind === "vault" ? 150 : 140}
          width="170"
          height="220"
          viewBox="0 0 100 100"
        >
          <PremiumSymbol
            kind={kind}
            index={
              kind === "vault"
                ? i + 3
                : kind === "nitro"
                  ? i === 1
                    ? 6
                    : 5
                  : i + 3
            }
          />
        </svg>
      ))}
      <text
        x="45"
        y="58"
        fill="#e9f2dc"
        fontSize="17"
        letterSpacing="6"
        fontFamily="sans-serif"
      >
        SPINDRA · SIGNATURE SERIES
      </text>
      <text
        x="500"
        y="470"
        textAnchor="middle"
        fill="#fff2cc"
        fontSize="68"
        fontWeight="bold"
        fontFamily="Georgia,serif"
      >
        {name}
      </text>
      <text
        x="500"
        y="531"
        textAnchor="middle"
        fill="#b9e6de"
        fontSize="21"
        fontFamily="sans-serif"
      >
        {feature}
      </text>
      <text
        x="500"
        y="586"
        textAnchor="middle"
        fill="#c4cbd6"
        fontSize="15"
        letterSpacing="4"
        fontFamily="sans-serif"
      >
        ORIGINAL ART · DISTINCT MECHANICS
      </text>
    </svg>
  );
}
