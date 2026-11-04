import { memo } from "react";
import type { WorldActor as Actor } from "../lib/livingWorlds";
function Cog() {
  const points = Array.from({ length: 64 }, (_, i) => {
    const radius = i % 4 < 2 ? 49 : 40,
      angle = (i * Math.PI) / 32;
    return (
      80 + Math.cos(angle) * radius + "," + (80 + Math.sin(angle) * radius)
    );
  }).join(" ");
  return (
    <g className="world-cog">
      <polygon points={points} fill="var(--slot-primary)" />
      <circle cx="80" cy="80" r="27" fill="var(--slot-deep)" />
      <circle cx="80" cy="80" r="11" fill="#fff1be" />
      {[0, 60, 120].map((a) => (
        <path
          key={a}
          transform={"rotate(" + a + " 80 80)"}
          d="M45 80h70"
          stroke="var(--slot-secondary)"
          strokeWidth="8"
        />
      ))}
    </g>
  );
}
function Drawing({ kind }: { kind: Actor }) {
  if (["fish", "turtle"].includes(kind))
    return kind === "fish" ? (
      <>
        <path
          className="world-tail"
          d="M109 79l34-25-5 46Z"
          fill="var(--slot-secondary)"
        />
        <ellipse cx="72" cy="79" rx="49" ry="31" fill="var(--slot-primary)" />
        <path
          d="M54 51l16-21 15 23M49 102l20 22 17-18"
          fill="var(--slot-secondary)"
        />
        <path
          d="M58 51q-9 29 0 56M75 49q-9 32 0 60"
          stroke="#fff3"
          strokeWidth="7"
        />
        <circle cx="39" cy="72" r="8" fill="#fff4d1" />
        <circle className="world-eye" cx="37" cy="73" r="4" fill="#17283b" />
        <path d="M24 88q12 8 20-1" fill="none" />
      </>
    ) : (
      <>
        <g className="world-flippers" fill="var(--slot-secondary)">
          <path d="M46 62L19 41 27 74ZM45 99l-23 23 9-35ZM104 62l28-16-8 31ZM105 96l28 22-10-29Z" />
        </g>
        <ellipse cx="79" cy="80" rx="43" ry="37" fill="var(--slot-primary)" />
        <path
          d="M59 53l32 1 20 26-19 28-32-1-18-27Z"
          fill="var(--slot-deep)"
          stroke="var(--slot-secondary)"
          strokeWidth="4"
        />
        <ellipse cx="23" cy="80" rx="20" ry="16" fill="var(--slot-secondary)" />
        <circle className="world-eye" cx="17" cy="75" r="3" fill="#17283b" />
      </>
    );
  if (
    ["bird", "eagle", "parrot", "bat", "dragon", "butterfly", "bee"].includes(
      kind,
    )
  ) {
    if (kind === "butterfly")
      return (
        <>
          <g className="world-wing" fill="var(--slot-secondary)">
            <path d="M76 78C-5-5 6 116 74 94ZM76 92C-1 126 39 168 78 108Z" />
            <circle cx="44" cy="67" r="11" fill="#fff3b7" />
          </g>
          <g className="world-wing wing-other" fill="var(--slot-primary)">
            <path d="M84 78c81-83 70 38 2 16ZM84 92c77 34 37 76-2 16Z" />
            <circle cx="119" cy="67" r="11" fill="#fff3b7" />
          </g>
          <path
            d="M80 57v66m0-64L68 43m12 16 13-16"
            fill="none"
            stroke="#352147"
            strokeWidth="7"
            strokeLinecap="round"
          />
        </>
      );
    if (kind === "bee")
      return (
        <>
          <ellipse
            className="world-wing"
            cx="58"
            cy="48"
            rx="26"
            ry="17"
            fill="#efffffaa"
          />
          <ellipse
            className="world-wing wing-other"
            cx="95"
            cy="45"
            rx="27"
            ry="19"
            fill="#efffffaa"
          />
          <ellipse cx="82" cy="84" rx="46" ry="31" fill="#ffd570" />
          <path d="M70 55v56m20-56v56" stroke="#52394c" strokeWidth="13" />
          <circle cx="36" cy="80" r="25" fill="var(--slot-primary)" />
          <circle className="world-eye" cx="28" cy="75" r="4" fill="#17283b" />
          <path d="M120 82l22 8-19 5M32 56 26 37m14 18 6-18" fill="#52394c" />
        </>
      );
    if (kind === "dragon")
      return (
        <>
          <path
            className="world-dragon-fire"
            d="M33 79Q2 46 4 75q-11 24 20 28l24-12Z"
            fill="#ffb55d"
          />
          <path
            className="world-tail"
            d="M86 94q74 65 55-16-4 50-42 8"
            fill="var(--slot-secondary)"
          />
          <path
            className="world-wing"
            d="M77 79 111 12l31 62-25-13-8 29-20-22Z"
            fill="var(--slot-primary)"
          />
          <path
            d="M47 62q10-31 27-11l27 43-25 27-22-28-24-2 7-17Z"
            fill="var(--slot-secondary)"
          />
          <path
            d="M57 53 56 34l15 18M77 109l-8 21h24"
            fill="var(--slot-primary)"
          />
          <circle className="world-eye" cx="49" cy="70" r="4" fill="#fff4b7" />
        </>
      );
    return (
      <>
        <path
          className="world-wing"
          d={
            kind === "bat"
              ? "M76 79 14 23 23 86l17-18 16 20 11-12Z"
              : "M79 82 15 22 8 52l23 2 8 19 16-6 8 23Z"
          }
          fill="var(--slot-primary)"
        />
        <path
          className="world-wing wing-other"
          d={
            kind === "bat"
              ? "M84 79l62-56-9 63-17-18-16 20-11-12Z"
              : "M81 82l64-60 7 30-23 2-8 19-16-6-8 23Z"
          }
          fill="var(--slot-secondary)"
        />
        <path
          className="world-tail"
          d="M71 93l-11 43 20-12 22 12-13-43Z"
          fill="var(--slot-secondary)"
        />
        <ellipse
          cx="80"
          cy="81"
          rx="19"
          ry="32"
          fill={kind === "eagle" ? "#f0ddb9" : "var(--slot-primary)"}
        />
        <circle
          cx="80"
          cy="54"
          r="17"
          fill={kind === "parrot" ? "#ffb26b" : "var(--slot-secondary)"}
        />
        <path d="M66 55 52 64l17 3" fill="#ffde82" />
        <circle className="world-eye" cx="74" cy="51" r="3" fill="#14223b" />
      </>
    );
  }
  if (["car", "racecar", "train", "wagon"].includes(kind))
    return (
      <>
        {kind === "train" ? (
          <>
            <path
              d="M26 60h75v45H18V80h11V40h18v40h16V58Z"
              fill="var(--slot-primary)"
            />
            <path d="M90 42h41v64H91Z" fill="var(--slot-secondary)" />
            <rect x="98" y="50" width="25" height="27" rx="3" fill="#bdedf2" />
            <path d="M22 39h31l-5-10H28Z" fill="#fff1b3" />
            <g className="world-steam" fill="#d9f6ff80">
              <circle cx="39" cy="20" r="10" />
              <circle cx="49" cy="9" r="8" />
            </g>
          </>
        ) : kind === "wagon" ? (
          <>
            <path d="M24 59q56-69 109 0v45H24Z" fill="#f3dfae" />
            <path d="M24 82h111v25H24Z" fill="#ad7049" />
            <path d="M52 46v39m27-49v49m29-40v40" stroke="#a9784a" />
          </>
        ) : (
          <>
            <path
              d={
                kind === "racecar"
                  ? "M12 87l34-8 24-28h40l17 30 23 6v24H12Z"
                  : "M13 83l22-7 22-30h55l24 35 14 6v25H13Z"
              }
              fill="var(--slot-primary)"
            />
            <path d="M54 76 70 54h31l16 23Z" fill="#c5edf4" />
            <path
              d="M79 53v24M18 91h19m91 2h14"
              stroke="#fff5cf"
              strokeWidth="5"
            />
            {kind === "racecar" && (
              <path
                d="M32 52h20v34M21 47h42v7"
                stroke="var(--slot-secondary)"
                strokeWidth="8"
              />
            )}
          </>
        )}
        {[42, 116].map((x) => (
          <g className="world-wheel" key={x}>
            <circle
              cx={x}
              cy="111"
              r={kind === "wagon" ? 21 : 17}
              fill="#1e283d"
            />
            <circle cx={x} cy="111" r="9" fill="#ddd4aa" />
            <path
              d={"M" + (x - 12) + " 111h24M" + x + " 99v24"}
              stroke="#8b8f9f"
              strokeWidth="3"
            />
          </g>
        ))}
      </>
    );
  if (["ship", "sailboat", "airship", "carpet"].includes(kind)) {
    if (kind === "carpet")
      return (
        <>
          <path
            d="M16 76q49-27 126-5l-15 35Q56 85 20 111Z"
            fill="var(--slot-primary)"
          />
          <path
            d="M34 75q43-10 90 0l-9 19-32-9-42 7Z"
            fill="var(--slot-secondary)"
          />
          <path
            className="world-tail"
            d="M20 102 9 120m20-17-9 19m109-28 11 19m-3-27 12 18"
            stroke="#ffe5ab"
            strokeWidth="4"
          />
        </>
      );
    if (kind === "airship")
      return (
        <>
          <ellipse cx="80" cy="60" rx="67" ry="37" fill="var(--slot-primary)" />
          <path
            d="M44 33q-22 28 0 56m37-66v74m37-61q17 25 0 50"
            stroke="#fff4a9"
            strokeWidth="4"
            fill="none"
          />
          <path
            d="M57 92v20m45-20v20M51 112h58l-9 22H62Z"
            fill="var(--slot-secondary)"
          />
          <path d="M28 50 8 39v40l21-7" fill="var(--slot-secondary)" />
        </>
      );
    return (
      <>
        <g className="world-sail">
          <path
            d="M78 28v73M78 32 28 82h50ZM86 37l40 46H86Z"
            fill={kind === "ship" ? "#e9d8c1" : "#ffefbb"}
          />
          <path d="M81 31h37l-9-14H81Z" fill="var(--slot-secondary)" />
        </g>
        <path d="M16 94q69 18 130 0l-23 33H39Z" fill="var(--slot-primary)" />
        <path d="M31 108h97" stroke="#fff0b4" strokeWidth="3" />
        <path
          d="M15 138q18-9 35 0t35 0 35 0 30 0"
          stroke="var(--slot-secondary)"
          fill="none"
        />
      </>
    );
  }
  if (["gear", "clock", "piston", "anvil"].includes(kind)) {
    if (kind === "gear") return <Cog />;
    if (kind === "clock")
      return (
        <>
          <g className="world-pendulum">
            <path d="M80 85v52" stroke="#eccb8b" strokeWidth="4" />
            <circle cx="80" cy="138" r="13" fill="var(--slot-primary)" />
          </g>
          <circle cx="80" cy="66" r="48" fill="var(--slot-primary)" />
          <circle cx="80" cy="66" r="39" fill="#f6edcf" />
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((a) => (
            <path
              key={a}
              transform={"rotate(" + a + " 80 66)"}
              d="M80 32v5"
              stroke="#4b3a55"
              strokeWidth="3"
            />
          ))}
          <path
            className="world-clock-hand"
            d="M80 66V39M80 66h23"
            stroke="#493247"
            strokeWidth="4"
            fill="none"
          />
          <circle cx="80" cy="66" r="5" fill="var(--slot-secondary)" />
        </>
      );
    if (kind === "piston")
      return (
        <>
          <path d="M37 26h86v110H37Z" fill="#27394d" />
          <path d="M42 23v119m76-119v119" stroke="#acb6bc" strokeWidth="6" />
          <g className="world-piston-head">
            <path d="M48 49h64v36H48Z" fill="var(--slot-primary)" />
            <path d="M51 58h58m-58 9h58" stroke="#ffeac2" strokeWidth="4" />
            <path d="M75 84h10v56H75Z" fill="var(--slot-secondary)" />
          </g>
        </>
      );
    return (
      <>
        <path
          d="M17 48h128l-28 24H91l-7 34 33 13v14H43v-14l24-13-4-34H40Z"
          fill="var(--slot-primary)"
        />
        <path d="M23 53h112M66 74h23" stroke="#fff1c0" strokeWidth="5" />
        <path
          className="world-forge-spark"
          d="m62 26 5 12m20-18-3 13m23-3-8 10"
          stroke="#ffac63"
          strokeWidth="4"
        />
      </>
    );
  }
  if (
    [
      "planet",
      "sun",
      "moon",
      "orb",
      "comet",
      "rocket",
      "arcadeShip",
      "ghost",
      "cloud",
      "snowflake",
      "crystal",
    ].includes(kind)
  ) {
    if (kind === "rocket" || kind === "arcadeShip")
      return (
        <>
          <path
            className="world-flame"
            d="M65 108 80 150l15-42Z"
            fill="#ffc96f"
          />
          <path
            d="M80 17q39 31 23 88H57Q42 48 80 17Z"
            fill="var(--slot-primary)"
          />
          <path
            d="M58 80 34 119l27-9m42-30 23 39-27-9"
            fill="var(--slot-secondary)"
          />
          <circle cx="80" cy="62" r="15" fill="#b1f4ff" />
          <path d="M64 101h32" stroke="#fff2ad" strokeWidth="5" />
        </>
      );
    if (kind === "ghost")
      return (
        <>
          <path
            d="M31 126V67a49 49 0 0 1 98 0v59l-17-12-17 13-17-13-17 13-15-13Z"
            fill="var(--slot-primary)"
          />
          <g className="world-eye" fill="#213553">
            <ellipse cx="62" cy="72" rx="9" ry="14" />
            <ellipse cx="100" cy="72" rx="9" ry="14" />
          </g>
          <path d="M66 103q14 12 29 0" fill="none" />
        </>
      );
    if (kind === "cloud")
      return (
        <>
          <path
            d="M29 101C-1 73 24 42 48 52 40 9 110 4 115 51c41-8 49 48 20 52Z"
            fill="#d9effb"
          />
          <path
            className="world-rain-stroke"
            d="m44 118-9 17m38-17-9 17m39-17-9 17"
            stroke="var(--slot-secondary)"
            strokeWidth="5"
          />
        </>
      );
    if (kind === "snowflake")
      return (
        <g
          className="world-cog"
          stroke="#d4fcff"
          strokeWidth="5"
          strokeLinecap="round"
        >
          {[0, 60, 120].map((a) => (
            <g key={a} transform={"rotate(" + a + " 80 80)"}>
              <path d="M80 18v124m0-107-15-12m15 12 15-12m-15 102-15 12m15-12 15 12" />
            </g>
          ))}
          <circle cx="80" cy="80" r="13" fill="var(--slot-primary)" />
        </g>
      );
    if (kind === "crystal")
      return (
        <>
          <path
            d="M40 109 30 52l25-28 31 15 36-8 13 67-52 42Z"
            fill="var(--slot-primary)"
          />
          <path
            d="m55 25 12 83 18 31 10-76 25-30M31 52l36 56 64-10M85 39l10 24"
            fill="none"
            stroke="#e9fff2"
            strokeWidth="3"
          />
          <path className="world-specular" d="m44 52 12-10 7 31Z" fill="#fff" />
        </>
      );
    if (kind === "moon")
      return (
        <>
          <path
            d="M108 22C22-1-8 117 77 141c31 7 54-8 66-33C58 139 29 49 108 22Z"
            fill="#f0edb9"
          />
          <path
            className="world-specular"
            d="m123 29 5 13 15 5-15 4-5 15-5-15-15-4 15-5Z"
            fill="var(--slot-secondary)"
          />
        </>
      );
    if (kind === "comet")
      return (
        <>
          <path
            d="M26 104 144 14 109 93 53 137Z"
            fill="var(--slot-secondary)"
            opacity=".7"
          />
          <path d="M36 112 143 15 76 110Z" fill="#fff2aa" />
          <circle cx="39" cy="120" r="24" fill="var(--slot-primary)" />
        </>
      );
    return (
      <>
        <circle cx="80" cy="80" r="43" fill="var(--slot-primary)" />
        <ellipse
          className="world-orbit-ring"
          cx="80"
          cy="80"
          rx="68"
          ry="20"
          transform="rotate(-25 80 80)"
          fill="none"
          stroke="var(--slot-secondary)"
          strokeWidth="8"
        />
        {kind === "sun" ? (
          <g className="world-cog" stroke="#ffe59c" strokeWidth="5">
            {Array.from({ length: 12 }, (_, i) => (
              <path
                key={i}
                transform={"rotate(" + i * 30 + " 80 80)"}
                d="M80 17V7"
              />
            ))}
          </g>
        ) : (
          <>
            <path
              d="M44 64q35-21 70 0m-70 21q35-16 71 0"
              fill="none"
              stroke="#ffffff45"
              strokeWidth="7"
            />
            <circle
              className="world-specular"
              cx="67"
              cy="57"
              r="9"
              fill="#fff9d9"
            />
          </>
        )}
      </>
    );
  }
  if (["flower", "lollipop", "balloon", "honeycomb"].includes(kind)) {
    if (kind === "honeycomb")
      return (
        <>
          {[
            [59, 43],
            [100, 43],
            [39, 78],
            [80, 78],
            [120, 78],
            [59, 114],
            [100, 114],
          ].map(([x, y], i) => (
            <path
              key={i}
              d={`M${x} ${y - 23}l20 12v23l-20 12-20-12V${y - 11}Z`}
              fill={i % 2 ? "var(--slot-primary)" : "var(--slot-secondary)"}
              stroke="#ffe9ab"
              strokeWidth="2"
            />
          ))}
        </>
      );
    if (kind === "balloon")
      return (
        <>
          <path
            className="world-tail"
            d="M80 108q-25 17 0 29t0 15"
            fill="none"
            stroke="#ffe9ac"
          />
          <ellipse
            cx="80"
            cy="64"
            rx="43"
            ry="53"
            fill="var(--slot-secondary)"
          />
          <path d="m70 113 10-8 10 8Z" fill="var(--slot-primary)" />
          <path
            className="world-specular"
            d="M57 38q-10 12-10 27"
            fill="none"
            stroke="#fff8de"
            strokeWidth="7"
            strokeLinecap="round"
          />
        </>
      );
    return (
      <>
        <path
          d="M80 76v74"
          stroke={kind === "flower" ? "#5fb990" : "#f3d3ad"}
          strokeWidth="9"
        />
        {kind === "flower" ? (
          <>
            <path
              d="M78 132q-49-27-47-44 37-5 47 44m4-10q41-30 53-19-12 32-53 19"
              fill="#5fb990"
            />
            {[0, 60, 120, 180, 240, 300].map((a) => (
              <ellipse
                key={a}
                transform={"rotate(" + a + " 80 61)"}
                cx="80"
                cy="33"
                rx="16"
                ry="29"
                fill="var(--slot-secondary)"
              />
            ))}
            <circle cx="80" cy="61" r="21" fill="var(--slot-primary)" />
          </>
        ) : (
          <>
            <circle cx="80" cy="57" r="44" fill="var(--slot-primary)" />
            <path
              className="world-cog"
              d="M80 18c-52 20-18 78 17 59 26-15-4-48-23-29-10 10 6 24 14 12"
              fill="none"
              stroke="#fff2d9"
              strokeWidth="11"
            />
          </>
        )}
      </>
    );
  }
  if (["flag", "banner", "sign", "torch", "lantern"].includes(kind)) {
    if (kind === "torch")
      return (
        <>
          <path d="m65 77 30 0-8 65H73Z" fill="#bd8558" />
          <path
            className="world-flame"
            d="M80 8c41 43 4 43 24 69C61 98 23 63 80 8Z"
            fill="var(--slot-secondary)"
          />
          <path
            className="world-flame"
            d="M78 38q32 44-5 43-20-14 5-43"
            fill="#ffe48c"
          />
        </>
      );
    if (kind === "lantern")
      return (
        <>
          <path
            d="M80 13v18m0 92v25M56 34q24-38 48 0"
            stroke="#d8c296"
            strokeWidth="5"
            fill="none"
          />
          <path
            d="M43 40h74l10 36-13 47H46L33 76Z"
            fill="var(--slot-secondary)"
          />
          <path
            d="M80 42v75M52 48l-7 32 9 34m53-66 8 32-9 34"
            stroke="#ffe19c"
            strokeWidth="4"
          />
          <path
            className="world-flame"
            d="m80 58 14 29-14 18-14-18Z"
            fill="#fff0b0"
          />
        </>
      );
    if (kind === "sign")
      return (
        <>
          <rect
            x="16"
            y="35"
            width="128"
            height="86"
            rx="15"
            fill="#1c2442"
            stroke="var(--slot-primary)"
            strokeWidth="6"
          />
          <path
            className="world-sign-light"
            d="M32 62h36L54 96m39-48-15 27h23L88 104"
            fill="none"
            stroke="var(--slot-secondary)"
            strokeWidth="7"
          />
          <path d="M48 120v25m64-25v25" stroke="#a3b6ce" strokeWidth="5" />
        </>
      );
    return (
      <>
        <path d="M35 17v129" stroke="#ccb992" strokeWidth="7" />
        <g className="world-sail">
          <path
            d="M39 23q50-27 92 0v66q-42-28-92 0Z"
            fill="var(--slot-secondary)"
          />
          {kind === "flag" ? (
            [0, 1, 2].map((i) => (
              <path
                key={i}
                d={`M${44 + i * 30} 30v20h15v20h15V45h-15V25Z`}
                fill="#f7f1d1"
              />
            ))
          ) : (
            <path
              d="m85 36 7 15 17 2-12 12 3 17-15-8-15 8 3-17-12-12 17-2Z"
              fill="#ffe6a0"
            />
          )}
        </g>
      </>
    );
  }
  if (kind === "compass")
    return (
      <>
        <circle cx="80" cy="80" r="57" fill="#f5dfac" />
        <circle cx="80" cy="80" r="47" fill="var(--slot-deep)" />
        <g className="world-compass-needle">
          <path d="m80 33 17 47-17 47-17-47Z" fill="var(--slot-secondary)" />
          <path d="m33 80 47-17 47 17-47 17Z" fill="var(--slot-primary)" />
          <circle cx="80" cy="80" r="8" fill="#fff3ce" />
        </g>
      </>
    );
  if (kind === "crown")
    return (
      <>
        <path
          d="M32 117 17 41l33 29 29-43 30 43 34-29-15 76Z"
          fill="var(--slot-primary)"
        />
        <path d="M35 121h89v16H35Z" fill="var(--slot-secondary)" />
        <path d="m80 69 13 18-13 17-13-17Z" fill="#ed7d9b" />
        <circle cx="47" cy="96" r="6" fill="#a7edff" />
        <circle cx="112" cy="96" r="6" fill="#a7edff" />
      </>
    );
  return (
    <>
      {[-18, 0, 18].map((a, i) => (
        <g key={a} transform={"rotate(" + a + " 80 115)"}>
          <rect
            x="48"
            y="30"
            width="65"
            height="98"
            rx="8"
            fill="#f9efd5"
            stroke="var(--slot-secondary)"
            strokeWidth="3"
          />
          <path
            d="m80 56 16 23-16 22-16-22Z"
            fill={i % 2 ? "var(--slot-primary)" : "#dc7c96"}
          />
        </g>
      ))}
    </>
  );
}
export default memo(function WorldActor({ kind }: { kind: Actor }) {
  return (
    <svg
      className={"world-actor world-actor-" + kind}
      viewBox="0 0 160 160"
      aria-hidden="true"
      fill="none"
      stroke="#203047"
      strokeWidth="2"
      strokeLinejoin="round"
    >
      <Drawing kind={kind} />
    </svg>
  );
});
