/** Original lightweight vector objects, drawn directly on the reels without medal frames. */
export default function SlotObject({
  kind,
  paint,
  scene,
}: {
  kind: string;
  paint: string;
  scene: string;
}) {
  const fill = `url(#${paint})`;
  const candy = scene === "candy";
  return (
    <g
      className={"slot-object object-" + kind}
      fill={fill}
      stroke="#18223b"
      strokeWidth="1.4"
      strokeLinejoin="round"
    >
      {kind === "sun" ? (
        <>
          <path d="M50 2l7 14 16-8 1 18 18-1-8 16 14 9-14 9 8 16-18-1-1 18-16-8-7 14-7-14-16 8-1-18-18 1 8-16L2 50l14-9-8-16 18 1 1-18 16 8Z" />
          <circle cx="50" cy="50" r="26" fill="#ffe76b" />
          <path
            d="M34 42q15-16 30 0"
            fill="none"
            stroke="#fff9b2"
            strokeWidth="5"
          />
        </>
      ) : kind === "moon" ? (
        <>
          <path d="M68 5C7-1-11 80 47 94q31 4 46-25C44 83 26 33 68 5Z" />
          <path
            d="M22 48q-6 22 14 34"
            fill="none"
            stroke="#fff9"
            strokeWidth="5"
          />
          <circle cx="76" cy="22" r="7" fill="#ffe577" />
        </>
      ) : kind === "flame" ? (
        <>
          <path d="M51 3q8 28 24 36 4-13 1-21 38 47 12 68-37 27-65-3C1 56 36 40 34 23q9 9 8 20Q60 27 51 3Z" />
          <path
            d="M51 46q2 15 13 23 9 24-13 24-27-3-12-24Z"
            fill="#fff08a"
            stroke="none"
          />
        </>
      ) : kind === "gem" || kind === "diamond" ? (
        <>
          <path d="M24 8h52l22 29-48 58L2 37Z" />
          <path
            d="M24 8l9 29L50 95 67 37 76 8M2 37h96M33 37L50 8l17 29"
            fill="none"
            stroke="#fff8"
            strokeWidth="2"
          />
          <path d="M24 11L8 34h24Z" fill="#fff8" stroke="none" />
        </>
      ) : kind === "star" ? (
        <>
          <path d="M50 3l15 29 32 6-23 24 4 34-28-14-28 14 4-34L3 38l32-6Z" />
          <path
            d="M50 17l7 24 25 2-22 11 9 25-19-17-19 17 8-25-22-11 26-2Z"
            fill="#fff5"
            stroke="none"
          />
        </>
      ) : kind === "heart" ? (
        <>
          <path d="M50 92C-20 49 1 0 31 10q14 2 19 16Q58 5 78 10c37 9 24 52-28 82Z" />
          <path
            d="M16 36q-1-20 17-17"
            fill="none"
            stroke="#fff9"
            strokeWidth="6"
            strokeLinecap="round"
          />
        </>
      ) : kind === "flower" ? (
        <>
          <path d="M50 32C15-15-9 33 27 49-12 75 28 113 49 76c25 41 67 5 28-26C116 24 70-9 50 32Z" />
          <circle cx="51" cy="52" r="17" fill="#ffe16a" />
          <circle cx="46" cy="47" r="6" fill="#fff8" stroke="none" />
        </>
      ) : kind === "leaf" || kind === "feather" ? (
        <>
          <path d="M12 88C-1 30 32 4 93 7q1 71-64 77Z" />
          <path
            d="M12 91L76 24M37 67l-5-27M53 51l28 1"
            fill="none"
            stroke="#fff9"
            strokeWidth="3"
          />
        </>
      ) : kind === "crown" ? (
        <>
          <path d="M13 80L4 25l26 19L50 11l21 33 25-19-9 55Z" />
          <rect x="14" y="77" width="73" height="16" rx="6" />
          <path d="M22 67h56" stroke="#fff7" strokeWidth="5" />
          <path d="M50 37l10 14-10 14-10-14Z" fill="#ff528c" />
          <circle cx="7" cy="21" r="6" fill="#fff0a2" />
          <circle cx="50" cy="9" r="6" fill="#fff0a2" />
          <circle cx="94" cy="21" r="6" fill="#fff0a2" />
        </>
      ) : kind === "fish" || kind === "turtle" ? (
        <>
          <path d="M70 38L98 17v64L70 63Z" />
          <ellipse cx="42" cy="50" rx="38" ry="28" />
          <path d="M32 22l15-16 13 19M31 77l15 16 13-18" />
          <path
            d="M34 26q-10 23 0 48M49 25q-9 25 0 51"
            stroke="#fff6"
            strokeWidth="4"
            fill="none"
          />
          <circle cx="20" cy="45" r="7" fill="white" />
          <circle cx="18" cy="45" r="3" fill="#172440" stroke="none" />
        </>
      ) : kind === "shell" ? (
        <>
          <path d="M49 92C-27 60 4-1 28 21 38-8 67-2 73 21c29-23 56 49-24 71Z" />
          <path
            d="M49 84L26 25M49 84V17M49 84l26-59M49 84L9 43M49 84l42-41"
            fill="none"
            stroke="#fff6"
            strokeWidth="3"
          />
          <path d="M34 88h32l-3 8H36Z" />
        </>
      ) : kind === "rocket" ? (
        <>
          <path
            d="M25 54L7 70v24l26-15M69 48l24 19-2 25-27-15"
            fill="#ff5f8c"
          />
          <path d="M33 70q-10 30 9 27 14-2 13-27" fill="#ffc94b" />
          <path d="M27 70C22 32 54 5 82 4c5 36-11 66-37 78Z" />
          <circle cx="57" cy="36" r="13" fill="#78f6ff" />
          <path
            d="M40 32q7-13 22-17"
            fill="none"
            stroke="#fff9"
            strokeWidth="4"
          />
        </>
      ) : kind === "zap" ? (
        <>
          <path d="M51 3L13 55h30L31 97 90 34H60L77 3Z" />
          <path d="M55 9L27 48h23" fill="none" stroke="#fff9" strokeWidth="4" />
        </>
      ) : kind === "key" ? (
        <>
          <path d="M38 43L11 77l11 13 12-12 10 9 12-14-9-9 10-12" />
          <circle cx="64" cy="29" r="25" />
          <circle cx="66" cy="27" r="11" fill="var(--slot-reel-bottom)" />
          <path
            d="M49 16q12-10 25-3"
            fill="none"
            stroke="#fff9"
            strokeWidth="4"
          />
        </>
      ) : kind === "shield" ? (
        <>
          <path d="M50 4L92 20 86 65Q76 85 50 98 18 81 13 64L7 20Z" />
          <path
            d="M50 15l30 12-5 33q-6 15-25 25-24-16-25-26l-5-32Z"
            fill="#fff2"
          />
          <path
            d="M50 24l8 20 20 2-16 13 5 21-17-12-17 12 5-21-16-13 20-2Z"
            fill="#fff1a0"
          />
        </>
      ) : kind === "sword" ? (
        <>
          <path d="M46 62L66 8 94 3 90 31 57 72Z" />
          <path d="M66 20L56 60" stroke="#fff9" strokeWidth="4" />
          <path d="M30 56l33 24-8 9-33-24Z" fill="#ffd16b" />
          <path d="M35 68L14 94l-10-9 22-26Z" fill="#d48960" />
        </>
      ) : kind === "tower" ? (
        <>
          <path d="M16 92V29H8V7h15v12h13V7h14v12h14V7h15v22h-8v63Z" />
          <path d="M32 92V63q14-19 27 0v29" fill="#2b3152" />
          <path d="M25 40h11v13H25m29-13h11v13H54" fill="#ffe593" />
        </>
      ) : kind === "ship" ? (
        <>
          <path d="M5 69h90L77 92H25Z" fill="#d48b4e" />
          <path d="M50 6v66" stroke="#ffda87" strokeWidth="5" />
          <path d="M44 10L10 59h34ZM57 15v44h36Z" />
          <path
            d="M10 96q14-9 27 0t27 0 27 0"
            stroke="#8ef1ff"
            strokeWidth="4"
            fill="none"
          />
        </>
      ) : kind === "anchor" ? (
        <>
          <circle
            cx="50"
            cy="16"
            r="11"
            fill="none"
            stroke={fill}
            strokeWidth="9"
          />
          <path
            d="M50 27v62M27 40h46M8 60q5 31 42 31 37-1 42-31M8 60l-5 18m5-18 18 5m66-5 5 18m-5-18-18 5"
            fill="none"
            stroke={fill}
            strokeWidth="9"
            strokeLinecap="round"
          />
        </>
      ) : kind === "clock" ||
        kind === "compass" ||
        kind === "orbit" ||
        kind === "disc" ? (
        <>
          <circle cx="50" cy="50" r="44" />
          <circle cx="50" cy="50" r="33" fill={candy ? "#ffb9ee" : "#d9f6ff"} />
          {kind === "clock" ? (
            <path
              d="M50 25v27l20 12"
              fill="none"
              stroke="#253553"
              strokeWidth="5"
            />
          ) : kind === "disc" && candy ? (
            <path
              d="M50 50c-26 5-24-33 4-28 37 4 32 62-9 56C-8 68 7 2 56 8"
              fill="none"
              stroke="#fff"
              strokeWidth="7"
            />
          ) : (
            <>
              <path d="M50 18l12 31-12 33-12-33Z" fill="#ff5689" />
              <path d="M18 50l31-12 33 12-33 12Z" fill="#6986f8" />
            </>
          )}
        </>
      ) : kind === "trophy" ? (
        <>
          <path d="M20 12h60L72 56Q50 84 28 56Z" />
          <path
            d="M20 20H5q-1 35 25 30M80 20h15q1 35-25 30"
            fill="none"
            stroke={fill}
            strokeWidth="7"
          />
          <path d="M46 67v17H29v10h42V84H55V67" />
          <path d="M33 21v20" stroke="#fff9" strokeWidth="5" />
        </>
      ) : kind === "car" || kind === "train" ? (
        <>
          <path d="M9 42l17-27h43l16 27 10 9v28H5V51Z" />
          <path d="M29 22h34l10 22H19Z" fill="#a7f6ff" />
          <rect x="13" y="53" width="17" height="9" rx="4" fill="#fff5ac" />
          <rect x="70" y="53" width="17" height="9" rx="4" fill="#fff5ac" />
          <circle cx="24" cy="80" r="12" fill="#24314a" />
          <circle cx="77" cy="80" r="12" fill="#24314a" />
          <circle cx="24" cy="80" r="5" fill="#eaf5ff" />
          <circle cx="77" cy="80" r="5" fill="#eaf5ff" />
        </>
      ) : kind === "bird" || kind === "butterfly" ? (
        <>
          <path d="M48 51C-6-14-17 55 34 66 0 77 33 107 48 74c22 36 59 2 22-9 55-8 34-82-18-15Z" />
          <path d="M49 34v48" stroke="#34415d" strokeWidth="7" />
          <path d="M48 37L34 19m18 18 14-18" fill="none" />
          <circle cx="18" cy="43" r="8" fill="#fff7" />
          <circle cx="82" cy="43" r="8" fill="#fff7" />
        </>
      ) : kind === "tree" || kind === "mountain" ? (
        <>
          <path d="M44 74h13v23H44Z" fill="#ba8352" />
          <path d="M50 3L9 49h18L5 78h90L73 49h18Z" />
          {kind === "mountain" && (
            <path d="M50 3L30 26l15-4 8 8 7-9 12 7Z" fill="#eeffff" />
          )}
        </>
      ) : kind === "snowflake" ? (
        <g stroke={fill} strokeWidth="7" strokeLinecap="round">
          {[0, 60, 120].map((a) => (
            <g key={a} transform={`rotate(${a} 50 50)`}>
              <path
                d="M50 4v92M36 14l14 13 14-13M36 86l14-13 14 13"
                fill="none"
              />
            </g>
          ))}
          <circle cx="50" cy="50" r="10" fill="#efffff" />
        </g>
      ) : kind === "hexagon" ? (
        <>
          <path d="M26 8h48l24 42-24 42H26L2 50Z" />
          <path d="M35 25h30l15 25-15 25H35L20 50Z" fill="#ffeb92" />
          <path d="M50 38q-20 24 0 27 20-3 0-27Z" fill="#f4a32e" />
        </>
      ) : kind === "gamepad" || kind === "radio" ? (
        <>
          <path d="M21 21q29-10 58 0l17 47q4 26-16 22L64 73H37L20 90Q0 94 4 68Z" />
          <path d="M19 46h23M31 34v24" stroke="#243459" strokeWidth="7" />
          <circle cx="71" cy="42" r="6" fill="#ff6d95" />
          <circle cx="83" cy="56" r="6" fill="#ffe482" />
        </>
      ) : kind === "ghost" ? (
        <>
          <path d="M12 94V42C9-9 91-9 88 42v52L72 83 58 94 43 83 28 94 20 85Z" />
          <ellipse cx="35" cy="42" rx="8" ry="12" fill="#2d355f" />
          <ellipse cx="67" cy="42" rx="8" ry="12" fill="#2d355f" />
          <path
            d="M40 67q10 12 20 0"
            fill="none"
            stroke="#2d355f"
            strokeWidth="5"
          />
        </>
      ) : kind === "spade" || kind === "club" ? (
        <>
          <path
            d={
              kind === "spade"
                ? "M50 4C26 28-9 57 12 74q18 11 31-4l-8 24h30l-8-24q15 16 31 4C111 56 74 28 50 4Z"
                : "M39 41C5 3 96-15 65 40c46-15 37 57-6 30l9 24H33l9-24C-6 94-5 27 39 41Z"
            }
          />
        </>
      ) : kind === "headphones" ? (
        <>
          <path
            d="M15 60V44C12-4 88-4 85 44v16"
            fill="none"
            stroke={fill}
            strokeWidth="14"
          />
          <rect x="7" y="49" width="23" height="40" rx="10" />
          <rect x="70" y="49" width="23" height="40" rx="10" />
          <path
            d="M20 17q30-21 59 0"
            stroke="#fff9"
            strokeWidth="3"
            fill="none"
          />
        </>
      ) : kind === "flag" || kind === "map" || kind === "ticket" ? (
        <>
          <path d="M10 15l25-8 30 8 25-8v78l-25 8-30-8-25 8Z" />
          <path d="M35 8v76m30-69v77" stroke="#fff7" strokeWidth="2" />
          <path
            d="M20 62Q49 18 78 57M62 51l16 6-2-16"
            fill="none"
            stroke="#f5fff8"
            strokeWidth="5"
          />
        </>
      ) : kind === "lamp" ? (
        <>
          <path d="M17 38Q51 11 83 38L70 71H30Z" />
          <path
            d="M17 42Q-8 24 10 15q12-7 17 16M79 43l20-22-6 33-19 9"
            fill="none"
            stroke={fill}
            strokeWidth="7"
          />
          <path d="M44 69v15H28v10h45V84H58V69" />
          <path d="M35 9h30l-4 13H39Z" fill="#f8d787" />
        </>
      ) : kind === "axe" ? (
        <>
          <path d="M45 21l11 6-28 71-12-6Z" fill="#e2a66d" />
          <path d="M17 19Q50-2 87 21L78 49Q49 27 20 46Z" />
          <path
            d="M24 23q29-16 55 2"
            fill="none"
            stroke="#fff9"
            strokeWidth="4"
          />
        </>
      ) : kind === "eye" ? (
        <>
          <path d="M3 50q47-65 94 0Q50 115 3 50Z" />
          <circle cx="50" cy="50" r="24" fill="#a3edff" />
          <ellipse cx="50" cy="50" rx="7" ry="20" fill="#293858" />
          <circle cx="42" cy="40" r="6" fill="#fff" />
        </>
      ) : (
        <>
          <path
            d="M9 56Q24 9 48 32T94 14M8 76q30-40 44-18t42-13"
            stroke={fill}
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
          />
          <circle cx="73" cy="78" r="13" />
          <path
            d="M16 51q20-26 33-11"
            stroke="#fff8"
            strokeWidth="3"
            fill="none"
          />
        </>
      )}
    </g>
  );
}
