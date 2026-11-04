import { memo, useEffect, useId, useRef, type CSSProperties } from "react";
import { livingWorld } from "../lib/livingWorlds";
import WorldActor from "./WorldActor";
const Landscape = memo(function Landscape({ scene }: { scene: string }) {
  const habitat = livingWorld(scene).habitat,
    id = useId();
  const sea = ["sea", "reef", "pirate"].includes(habitat);
  const city = ["city", "road", "rail", "arcade"].includes(habitat);
  const forest = ["temple", "garden", "meadow"].includes(habitat);
  const mountains = ["dunes", "ice", "canyon", "storm"].includes(habitat);
  const interior = ["cave", "forge", "factory", "clockwork"].includes(habitat);
  return (
    <svg
      className="world-landscape"
      viewBox="0 0 1000 500"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="var(--slot-secondary)" stopOpacity=".35" />
          <stop offset="1" stopColor="var(--slot-deep)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="1000" height="500" fill={"url(#" + id + ")"} />
      {sea ? (
        <>
          <circle
            cx="760"
            cy="90"
            r="65"
            fill="var(--slot-primary)"
            opacity=".18"
          />
          {[0, 1, 2].map((i) => (
            <g
              key={i}
              className={"world-wave wave-" + i}
              transform={"translate(0 " + (180 + i * 75) + ")"}
            >
              <path
                d="M-100 30Q-20-10 60 30T220 30 380 30 540 30 700 30 860 30 1020 30 1180 30V300H-100Z"
                fill={i % 2 ? "var(--slot-secondary)" : "var(--slot-primary)"}
                opacity={0.12 + i * 0.03}
              />
              <path
                d="M-100 30Q-20-10 60 30T220 30 380 30 540 30 700 30 860 30 1020 30 1180 30"
                fill="none"
                stroke="#c6fff5"
                strokeOpacity=".3"
                strokeWidth="3"
              />
            </g>
          ))}
          {habitat === "reef" &&
            [70, 210, 760, 910].map((x, i) => (
              <g
                className="world-coral"
                key={x}
                transform={"translate(" + x + " 420)"}
              >
                <path
                  d="M0 0v-110M0-50l-35-25v-35M0-25l35-38v-27M0-80l20-24"
                  fill="none"
                  stroke={
                    i % 2 ? "var(--slot-primary)" : "var(--slot-secondary)"
                  }
                  strokeWidth="14"
                  strokeLinecap="round"
                />
              </g>
            ))}
          {habitat === "pirate" && (
            <path
              d="M700 240q75-125 165-60l75 60M805 197l-8-83m3 13q-40-32-60-6m60 4q29-42 66-27"
              fill="var(--slot-deep)"
              stroke="var(--slot-secondary)"
              strokeOpacity=".45"
              strokeWidth="6"
            />
          )}
        </>
      ) : city ? (
        <>
          <g className="world-city-far">
            {Array.from({ length: 12 }, (_, i) => (
              <g key={i}>
                <path
                  d={`M${i * 90} 350V${80 + ((i * 47) % 120)}h65V350Z`}
                  fill="var(--slot-deep)"
                />
                <path
                  d={`M${i * 90 + 12} ${120 + ((i * 47) % 120)}v120m20-120v120m20-120v120`}
                  stroke="var(--slot-secondary)"
                  strokeWidth="5"
                  strokeDasharray="7 14"
                  opacity=".45"
                />
              </g>
            ))}
          </g>
          {habitat === "rail" ? (
            <g className="world-track">
              <path
                d="M-60 410H1060M-60 450H1060"
                stroke="#b7d1db"
                strokeWidth="6"
              />
              {Array.from({ length: 18 }, (_, i) => (
                <path
                  key={i}
                  d={`M${i * 65} 400v62`}
                  stroke="var(--slot-primary)"
                  strokeOpacity=".4"
                  strokeWidth="12"
                />
              ))}
            </g>
          ) : (
            <>
              <path d="M0 365h1000v135H0Z" fill="#112339" />
              <path
                className="world-road-lines"
                d="M-200 430h1400"
                stroke="var(--slot-primary)"
                strokeDasharray={habitat === "road" ? "35 25" : "90 35"}
                strokeWidth="7"
                opacity=".6"
              />
              <path
                d="M0 375h1000"
                stroke="var(--slot-secondary)"
                strokeWidth="4"
                opacity=".5"
              />
            </>
          )}
          {habitat === "arcade" && (
            <path
              className="world-sign-light"
              d="M400 65h195v110H400Z M425 140l25-43 32 29 32-29 48 43"
              fill="none"
              stroke="var(--slot-primary)"
              strokeWidth="6"
            />
          )}
        </>
      ) : forest ? (
        <>
          <path
            d="M0 300Q200 160 430 310T1000 240V500H0Z"
            fill="var(--slot-primary)"
            opacity=".14"
          />
          <path
            d="M0 410Q300 260 650 390T1000 360V500H0Z"
            fill="var(--slot-secondary)"
            opacity=".12"
          />
          {[35, 145, 265, 755, 870, 965].map((x, i) => (
            <g
              className="world-plant"
              key={x}
              transform={"translate(" + x + " 430)"}
            >
              <path
                d={"M0 0q" + (i % 2 ? 20 : -15) + "-110 0-240"}
                fill="none"
                stroke="var(--slot-primary)"
                strokeWidth={habitat === "temple" ? 8 : 5}
              />
              <path
                d="M0-60q-60-55-65-10 18 20 65 10M0-125q64-55 68-13-23 23-68 13M0-185q-53-45-56-8 17 19 56 8"
                fill="var(--slot-secondary)"
                opacity=".6"
              />
            </g>
          ))}
          {habitat === "temple" && (
            <g
              fill="var(--slot-deep)"
              stroke="var(--slot-primary)"
              strokeWidth="3"
            >
              <path d="M390 300V180h220v120M360 180l140-80 140 80ZM410 100l90-65 90 65Z" />
              <path d="M465 300v-75h70v75" />
            </g>
          )}
          {habitat === "garden" &&
            [80, 300, 730, 940].map((x, i) => (
              <g
                className="world-flower-head"
                key={x}
                transform={"translate(" + x + " " + (330 - (i % 2) * 55) + ")"}
              >
                {[0, 60, 120].map((a) => (
                  <ellipse
                    key={a}
                    transform={"rotate(" + a + ")"}
                    rx="40"
                    ry="13"
                    fill="var(--slot-secondary)"
                    opacity=".4"
                  />
                ))}
                <circle r="13" fill="var(--slot-primary)" />
              </g>
            ))}
          {habitat === "meadow" && (
            <path
              d="m450 90 50-30 50 30v55l-50 30-50-30Zm-70 130 35-20 35 20v40l-35 20-35-20Z"
              fill="var(--slot-primary)"
              opacity=".35"
            />
          )}
        </>
      ) : mountains ? (
        <>
          <path
            d="M0 320L160 100 310 280 470 50 690 300 850 80 1000 300V500H0Z"
            fill="var(--slot-primary)"
            opacity=".17"
          />
          <path
            d="M0 470 210 230 430 420 670 170 1000 450V500H0Z"
            fill="var(--slot-secondary)"
            opacity=".2"
          />
          {habitat === "ice" && (
            <>
              <path
                d="m470 50-66 90 59-22 34 19 28-6Z M850 80l-60 90 64-34 41 24Z"
                fill="#e9ffff"
                opacity=".5"
              />
              <path
                className="world-aurora"
                d="M-80 60Q180 230 400 80T1100 60"
                fill="none"
                stroke="var(--slot-secondary)"
                strokeOpacity=".3"
                strokeWidth="50"
              />
            </>
          )}
          {habitat === "dunes" && (
            <path
              d="M0 310Q220 190 440 340T1000 300V500H0ZM600 260v-90h55v90m-60-90 32-48 33 48m60 80V130h24v120m-28-120 16-40 16 40"
              fill="var(--slot-secondary)"
              opacity=".3"
            />
          )}
          {habitat === "canyon" && (
            <path
              d="M115 380V225m0 68H70v-45m45 80h50v-60M890 390V245m0 50h-40v-30"
              fill="none"
              stroke="var(--slot-primary)"
              strokeWidth="18"
              strokeLinecap="round"
              opacity=".45"
            />
          )}
          {habitat === "storm" && (
            <path
              className="world-distant-lightning"
              d="m600 20-70 110h48l-80 140 130-160h-52l68-90Z"
              fill="#defcff"
            />
          )}
        </>
      ) : interior ? (
        <>
          {habitat === "cave" ? (
            <>
              <path
                d="m0 0 180 0-40 170-65-70-30 130ZM1000 0H820l60 240 40-120 80 40Z"
                fill="var(--slot-primary)"
                opacity=".18"
              />
              <path
                d="m0 500 100-220 90 220m600 0 70-260 140 260"
                fill="var(--slot-secondary)"
                opacity=".2"
              />
            </>
          ) : (
            <>
              <path
                d="M70 420V90h200v330m460 0V90h200v330M0 155h1000M0 340h1000"
                fill="none"
                stroke="var(--slot-secondary)"
                strokeOpacity=".22"
                strokeWidth="17"
              />
              <path
                d="M325 420V170q175-180 350 0v250Z"
                fill="var(--slot-primary)"
                opacity=".12"
              />
            </>
          )}
          {habitat === "forge" && (
            <>
              <path
                className="world-lava"
                d="M100 470q140-110 280-20t240 0 300 10"
                fill="none"
                stroke="#ff9c5c"
                strokeWidth="24"
                opacity=".5"
              />
              <path
                className="world-furnace"
                d="M400 320v-80q100-140 200 0v80Z"
                fill="var(--slot-secondary)"
                opacity=".4"
              />
            </>
          )}
          {habitat === "factory" &&
            [120, 830].map((x) => (
              <g key={x} className="world-factory-shaft">
                <path d={`M${x} 80v270`} stroke="#b7d3dc" strokeWidth="14" />
                <rect
                  x={x - 35}
                  y="160"
                  width="70"
                  height="40"
                  fill="var(--slot-primary)"
                  opacity=".5"
                />
              </g>
            ))}
          {habitat === "clockwork" &&
            [180, 820].map((x, i) => (
              <g
                className="world-background-cog"
                key={x}
                style={{ "--gear-turn": i ? 1 : -1 } as CSSProperties}
              >
                <circle
                  cx={x}
                  cy="200"
                  r="95"
                  fill="none"
                  stroke="var(--slot-primary)"
                  strokeOpacity=".2"
                  strokeWidth="20"
                  strokeDasharray="16 12"
                />
                <circle
                  cx={x}
                  cy="200"
                  r="65"
                  fill="none"
                  stroke="var(--slot-secondary)"
                  strokeOpacity=".25"
                  strokeWidth="5"
                />
              </g>
            ))}
        </>
      ) : ["castle", "palace"].includes(habitat) ? (
        <>
          {[70, 270, 730, 930].map((x, i) => (
            <g key={x}>
              <path
                d={`M${x - 35} 440V${i % 2 ? 70 : 140}h70V440Z`}
                fill="var(--slot-primary)"
                opacity=".2"
              />
              <path
                d={`M${x - 50} ${i % 2 ? 70 : 140}h100m-90 250h80`}
                stroke="var(--slot-secondary)"
                strokeWidth="8"
                opacity=".3"
              />
              <path
                className="world-window-light"
                d={`M${x - 15} 220v-40q15-35 30 0v40Z`}
                fill="#ffde9a"
              />
            </g>
          ))}
          <path
            d="M350 440V150q150-170 300 0v290M410 440V190q90-120 180 0v250"
            fill="none"
            stroke="var(--slot-secondary)"
            strokeOpacity=".2"
            strokeWidth="10"
          />
        </>
      ) : habitat === "candy" ? (
        <>
          <path
            d="M0 400Q100 30 240 400q160-420 300 0 130-320 260 0 110-390 200 0v100H0Z"
            fill="var(--slot-secondary)"
            opacity=".2"
          />
          {[90, 300, 760, 920].map((x, i) => (
            <g className="world-plant" key={x}>
              <path
                d={`M${x} 420V${200 + (i % 2) * 60}`}
                stroke="#fff1ca"
                strokeWidth="10"
                opacity=".5"
              />
              <circle
                cx={x}
                cy={200 + (i % 2) * 60}
                r="38"
                fill="var(--slot-primary)"
                opacity=".5"
              />
              <path
                d={`m${x - 25} ${180 + (i % 2) * 60} 45 40m-50-10 45-40`}
                stroke="#fff1ca"
                strokeWidth="7"
                opacity=".5"
              />
            </g>
          ))}
        </>
      ) : habitat === "map" ? (
        <>
          <path
            d="M0 100h1000M0 210h1000M0 320h1000M130 0v500M360 0v500M590 0v500M820 0v500"
            stroke="var(--slot-primary)"
            opacity=".13"
          />
          <path
            d="m100 130 70-50 100 20 35 100-95 55-100-30Zm560 60 110-40 115 100-90 100-140-45Z"
            fill="var(--slot-primary)"
            opacity=".2"
          />
          <path
            className="world-chart-route"
            d="M100 300Q300 60 480 230T920 100"
            fill="none"
            stroke="var(--slot-secondary)"
            strokeWidth="4"
            strokeDasharray="8 10"
          />
        </>
      ) : (
        <>
          <circle
            cx="500"
            cy="210"
            r={habitat === "sky" ? 125 : 95}
            fill="var(--slot-primary)"
            opacity=".12"
          />
          {[0, 1, 2].map((i) => (
            <ellipse
              className="world-orbital-track"
              key={i}
              cx="500"
              cy="220"
              rx={180 + i * 90}
              ry={65 + i * 25}
              fill="none"
              stroke="var(--slot-secondary)"
              strokeOpacity=".25"
              strokeWidth={i === 1 ? 5 : 2}
              transform={"rotate(" + (i * 25 - 25) + " 500 220)"}
            />
          ))}
          {habitat === "lab" && (
            <path
              d="M170 420V210h70v210m520 0V210h70v210M150 210h110m480 0h110"
              stroke="var(--slot-primary)"
              strokeOpacity=".4"
              strokeWidth="10"
            />
          )}
        </>
      )}
    </svg>
  );
});
export default memo(function LivingWorld({
  scene,
  phase,
}: {
  scene: string;
  phase: "idle" | "spin" | "win" | "bonus";
}) {
  const profile = livingWorld(scene),
    root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = root.current,
      cabinet = el?.closest(".slot-polished");
    if (!el || !cabinet) return;
    let frame = 0,
      bounds: DOMRect | null = null,
      x = 0,
      y = 0,
      disposed = false;
    const visibility = () => {
      el.dataset.worldPaused = String(document.hidden);
      if (document.hidden && frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    };
    visibility();
    document.addEventListener("visibilitychange", visibility);
    const fine =
      window.matchMedia?.("(pointer: fine)").matches &&
      !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const invalidate = () => {
      bounds = null;
    };
    const move = (event: Event) => {
      if (
        !fine ||
        disposed ||
        document.hidden ||
        typeof requestAnimationFrame !== "function"
      )
        return;
      bounds ||= cabinet.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      const pointer = event as PointerEvent;
      x = Math.max(
        -1,
        Math.min(1, ((pointer.clientX - bounds.left) / bounds.width) * 2 - 1),
      );
      y = Math.max(
        -1,
        Math.min(1, ((pointer.clientY - bounds.top) / bounds.height) * 2 - 1),
      );
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (disposed) return;
        el.style.setProperty("--world-look-x", String(x));
        el.style.setProperty("--world-look-y", String(y));
      });
    };
    const reset = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      el.style.setProperty("--world-look-x", "0");
      el.style.setProperty("--world-look-y", "0");
    };
    cabinet.addEventListener("pointermove", move, { passive: true });
    cabinet.addEventListener("pointerleave", reset);
    window.addEventListener("resize", invalidate);
    window.addEventListener("scroll", invalidate, { passive: true });
    return () => {
      disposed = true;
      if (frame) cancelAnimationFrame(frame);
      cabinet.removeEventListener("pointermove", move);
      cabinet.removeEventListener("pointerleave", reset);
      window.removeEventListener("resize", invalidate);
      window.removeEventListener("scroll", invalidate);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [scene]);
  return (
    <div
      className={
        "living-world weather-" +
        profile.weather +
        " habitat-" +
        profile.habitat
      }
      data-world={scene}
      data-phase={phase}
      ref={root}
      aria-hidden="true"
    >
      <div className="world-depth world-depth-far">
        <Landscape scene={scene} />
      </div>
      <div className="world-depth world-depth-near">
        {profile.actors.map((actor, i) => (
          <div key={actor} className={"world-scene-actor actor-seat-" + i}>
            <div className={"world-motion world-motion-" + profile.motion[i]}>
              <WorldActor kind={actor} />
            </div>
          </div>
        ))}
      </div>
      <div className="world-weather">
        {Array.from({ length: 12 }, (_, i) => (
          <i
            key={i}
            style={
              {
                "--weather-index": i,
                "--weather-x": (i * 37 + 9) % 100,
                "--weather-y": (i * 23 + 17) % 100,
              } as CSSProperties
            }
          />
        ))}
      </div>
      <div className="world-atmospheric-mist" />
    </div>
  );
});
