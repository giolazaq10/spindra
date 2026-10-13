import {
  Sun,
  Moon,
  Flame,
  Orbit,
  Gem,
  Rocket,
  Star,
  Crown,
  Zap,
  Car,
  Disc3,
  Headphones,
  Radio,
  Trophy,
  Flag,
  Leaf,
  Flower2,
  Trees,
  Bird,
  KeyRound,
  Waves,
  Fish,
  Shell,
  Anchor,
  Ship,
  Swords,
  Shield,
  Castle,
  Telescope,
  Ticket,
  Clock,
  Lamp,
  TrainFront,
  Wind,
  Snowflake,
  Mountain,
  Hexagon,
  Eye,
  Heart,
  Diamond,
  Spade,
  Club,
  Compass,
  Pickaxe,
  Gamepad2,
  Ghost,
  Map,
  Feather,
  type LucideIcon,
} from "lucide-react";
import { useId, type CSSProperties } from "react";
import type { SlotSpec } from "../lib/slotModels";
const icons: Record<string, LucideIcon> = {
  sun: Sun,
  moon: Moon,
  flame: Flame,
  orbit: Orbit,
  gem: Gem,
  rocket: Rocket,
  star: Star,
  crown: Crown,
  zap: Zap,
  car: Car,
  disc: Disc3,
  headphones: Headphones,
  radio: Radio,
  trophy: Trophy,
  flag: Flag,
  leaf: Leaf,
  flower: Flower2,
  tree: Trees,
  bird: Bird,
  key: KeyRound,
  waves: Waves,
  fish: Fish,
  shell: Shell,
  anchor: Anchor,
  ship: Ship,
  sword: Swords,
  shield: Shield,
  tower: Castle,
  telescope: Telescope,
  ticket: Ticket,
  clock: Clock,
  lamp: Lamp,
  train: TrainFront,
  wind: Wind,
  snowflake: Snowflake,
  mountain: Mountain,
  hexagon: Hexagon,
  eye: Eye,
  heart: Heart,
  diamond: Diamond,
  spade: Spade,
  club: Club,
  compass: Compass,
  axe: Pickaxe,
  gamepad: Gamepad2,
  ghost: Ghost,
  map: Map,
  turtle: Feather,
  butterfly: Feather,
};
export function CoverIcon({ spec }: { spec: SlotSpec }) {
  const Icon = icons[spec.icons[6]] || Gem;
  return (
    <Icon width={190} height={190} strokeWidth={1.15} color="var(--accent)" />
  );
}
const sceneTints: Record<string, number> = {
  solar: 0,
  city: 2,
  temple: 3,
  moon: 4,
  castle: 1,
  cosmos: 5,
  reef: 4,
  train: 0,
  desert: 1,
  ice: 4,
  cave: 5,
  garden: 3,
  royal: 1,
  canyon: 0,
  arcade: 2,
  map: 0,
};
const jewelColors = [
  "#ffbf32",
  "#ff5a72",
  "#9d70ff",
  "#47d878",
  "#36c9f3",
  "#ee6bd9",
  "#ff9c41",
];
export function SlotSymbol({ spec, index }: { spec: SlotSpec; index: number }) {
  const id = useId().replace(/:/g, ""),
    scatter = index === 7;
  const Icon = icons[spec.icons[scatter ? 0 : index]] || Gem;
  const name = scatter ? spec.scatter!.name : spec.symbolNames[index];
  const color = scatter
    ? "#ffcd42"
    : jewelColors[(index + (sceneTints[spec.scene] || 0)) % 7];
  return (
    <div
      className={
        "themed-symbol illustrated-symbol symbol-tier-" +
        index +
        (scatter ? " scatter-symbol" : "")
      }
      role="img"
      aria-label={name}
      style={{ "--symbol-color": color } as CSSProperties}
    >
      <svg className="symbol-frame" viewBox="0 0 100 100" aria-hidden="true">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2=".8" y2="1">
            <stop stopColor="#ffffff" />
            <stop offset=".22" stopColor={color} />
            <stop offset="1" stopColor={color} stopOpacity=".7" />
          </linearGradient>
        </defs>
        {index >= 5 && (
          <path
            d="M50 4L62 15L79 12L82 29L96 39L87 54L91 72L73 76L63 93L48 84L30 91L24 75L7 66L16 49L10 31L29 28L35 10Z"
            fill={color}
            stroke="#fff4b1"
            strokeWidth="2"
            opacity=".65"
          />
        )}
        <ellipse cx="50" cy="87" rx="28" ry="5" fill="#172243" opacity=".18" />
        <Icon
          x={index >= 5 ? 21 : 13}
          y={index >= 5 ? 20 : 10}
          width={index >= 5 ? 60 : 76}
          height={index >= 5 ? 60 : 76}
          color="#252340"
          strokeWidth="1.35"
          fill={"url(#" + id + ")"}
        />
        <path
          d="M20 22L24 14L28 22L36 26L28 30L24 38L20 30L12 26Z"
          fill="#fff9d9"
          opacity=".85"
        />
        <circle cx="78" cy="17" r="3" fill="#fff" />
        <circle cx="85" cy="71" r="2" fill={color} />
      </svg>
      <small className="symbol-name">{scatter ? "SCATTER" : name}</small>
    </div>
  );
}
export function SlotScenery({ scene }: { scene: string }) {
  return (
    <svg
      className={"slot-scenery scenery-" + scene}
      viewBox="0 0 1000 650"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {scene === "solar" ? (
        <>
          <circle cx="500" cy="270" r="190" fill="#ef912433" />
          <circle cx="500" cy="270" r="125" fill="#ffe79044" />
          {Array.from({ length: 12 }, (_, i) => (
            <path
              key={i}
              d="M500 45L485 105L515 105Z"
              transform={`rotate(${i * 30} 500 270)`}
              fill="var(--accent)"
              opacity=".25"
            />
          ))}
        </>
      ) : scene === "city" ? (
        <>
          {Array.from({ length: 14 }, (_, i) => (
            <g key={i}>
              <rect
                x={i * 80 - 40}
                y={140 + ((i * 73) % 220)}
                width="65"
                height="510"
                fill="#292053"
                stroke="#9664f4"
                strokeOpacity=".35"
              />
              {[0, 1, 2, 3].map((j) => (
                <path
                  key={j}
                  d={`M${i * 80 - 30} ${200 + ((i * 73) % 220) + j * 40}h40`}
                  stroke="#53e1ff"
                />
              ))}
            </g>
          ))}
          <path d="M0 650L480 420L1000 650" stroke="#ea3fff" strokeWidth="4" />
        </>
      ) : scene === "temple" ? (
        <>
          <path
            d="M250 600V270L500 120L750 270V600Z"
            fill="#18563d"
            stroke="#b8c87566"
          />
          <path d="M200 300H800L500 90Z" fill="#213d29" stroke="#aac16b" />
          {[300, 410, 560, 670].map((x) => (
            <rect
              key={x}
              x={x}
              y="300"
              width="30"
              height="300"
              fill="#9eb46c44"
            />
          ))}
        </>
      ) : scene === "moon" ? (
        <>
          <circle cx="790" cy="120" r="100" fill="#d2ecff55" />
          <circle cx="830" cy="90" r="95" fill="#0f203a" />
          {[330, 420, 510, 600].map((y) => (
            <path
              key={y}
              d={`M0 ${y}Q250 ${y - 100} 500 ${y}T1000 ${y}`}
              fill="none"
              stroke="#5bb4dd44"
              strokeWidth="30"
            />
          ))}
        </>
      ) : scene === "castle" ? (
        <>
          <path
            d="M160 650V240H220V180H270V240H330V650M670 650V240H730V180H780V240H840V650"
            fill="#451d26"
            stroke="#ff8c5555"
          />
          <path d="M300 620L500 140L700 620Z" fill="#ed6c1c11" />
          {[0, 1, 2, 3, 4].map((i) => (
            <path
              key={i}
              d={`M${100 + i * 200} 650q-70-120 0-220q90 150 0 220`}
              fill="#ff854c22"
            />
          ))}
        </>
      ) : scene === "cosmos" ? (
        <>
          {[80, 140, 220].map((r) => (
            <ellipse
              key={r}
              cx="500"
              cy="280"
              rx={r * 2}
              ry={r}
              fill="none"
              stroke="#db9ffa55"
              strokeWidth="3"
              transform={`rotate(-25 500 280)`}
            />
          ))}
          <circle cx="750" cy="170" r="50" fill="#bd7adc66" />
        </>
      ) : scene === "reef" ? (
        <>
          {Array.from({ length: 9 }, (_, i) => (
            <path
              key={i}
              d={`M${i * 140 - 40} 650Q${i * 140 + 80} 360 ${i * 140 - 30} ${280 + (i % 3) * 60}M${i * 140} 550l70-110M${i * 140} 480l-50-60`}
              fill="none"
              stroke={i % 2 ? "#de787955" : "#41a5a566"}
              strokeWidth="20"
            />
          ))}
          {[0, 1, 2, 3, 4].map((i) => (
            <circle
              key={i}
              cx={i * 240 + 40}
              cy={160 + (i % 3) * 100}
              r="25"
              fill="none"
              stroke="#8affdf44"
            />
          ))}
        </>
      ) : scene === "train" ? (
        <>
          <path
            d="M100 650L460 180M900 650L540 180"
            stroke="#b7c6d966"
            strokeWidth="8"
          />
          {[230, 320, 420, 530, 640].map((y) => (
            <path
              key={y}
              d={`M${500 - (y - 180) * 0.85} ${y}h${(y - 180) * 1.7}`}
              stroke="#8794b144"
              strokeWidth="8"
            />
          ))}
          {[120, 850].map((x) => (
            <g key={x}>
              <path d={`M${x} 620V160`} stroke="#78869b" strokeWidth="6" />
              <circle cx={x} cy="155" r="35" fill="#ffc96e33" />
            </g>
          ))}
        </>
      ) : scene === "desert" ? (
        <>
          <circle cx="790" cy="160" r="100" fill="#ffa22f55" />
          <path d="M0 440Q280 230 600 460T1200 440V650H0Z" fill="#d28c2722" />
          <path d="M0 530Q350 300 680 530T1200 450V650H0Z" fill="#ebbc4922" />
          {[220, 800].map((x) => (
            <path
              key={x}
              d={`M${x} 280V130M${x - 25} 150h50l-10 65h-30Z`}
              fill="none"
              stroke="#f0d48d55"
              strokeWidth="3"
            />
          ))}
        </>
      ) : scene === "ice" ? (
        <>
          <path
            d="M-50 650L180 130L410 650L680 80L1050 650Z"
            fill="#9fcde622"
            stroke="#cdedff55"
            strokeWidth="3"
          />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <path
              key={i}
              d={`M${i * 190} 0l35 ${120 + (i % 3) * 80}l35 -${120 + (i % 3) * 80}`}
              fill="#d3f4ff22"
            />
          ))}
        </>
      ) : scene === "cave" ? (
        <>
          <path
            d="M0 0L90 330L180 160L280 250L410 80L550 210L650 160L780 310L900 140L1000 380V0Z"
            fill="#75689144"
          />
          <path
            d="M0 650L100 360L200 620L460 460L550 610L790 430L900 630L1000 440V650Z"
            fill="#423957"
          />
          {[180, 770].map((x) => (
            <path
              key={x}
              d={`M${x} 520l30-100l35 100l-30 60Z`}
              fill="#cfb0fb33"
              stroke="#dac4f855"
            />
          ))}
        </>
      ) : scene === "garden" ? (
        <>
          {Array.from({ length: 8 }, (_, i) => (
            <g key={i}>
              <path
                d={`M${i * 150} 650Q${i * 150 + 80} 200 ${i * 150 + 40} 70`}
                fill="none"
                stroke="#8bde6255"
                strokeWidth="4"
              />
              <circle
                cx={i * 150 + 40}
                cy="90"
                r="55"
                fill="#b7ee6422"
                stroke="#d2a2ff44"
              />
            </g>
          ))}
        </>
      ) : scene === "royal" ? (
        <>
          <path d="M60 0V650M940 0V650" stroke="#ca538777" strokeWidth="100" />
          <path
            d="M330 440L300 140L400 240L500 80L600 240L700 140L670 440Z"
            fill="#ffd27822"
            stroke="#ffd69466"
            strokeWidth="4"
          />
        </>
      ) : scene === "canyon" ? (
        <>
          <path
            d="M0 650V200L130 80L280 140L330 440L700 490L750 200L900 100L1000 170V650Z"
            fill="#b7724833"
            stroke="#d8925566"
          />
          <path
            d="M180 650L340 260M820 650L690 330"
            stroke="#aa684d44"
            strokeWidth="30"
          />
        </>
      ) : scene === "arcade" ? (
        <>
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <path
              key={i}
              d={`M0 ${350 + i * 45}H1000M${i * 160} 650L500 280`}
              stroke="#4beaaf33"
            />
          ))}
          <path
            d="M0 160Q300-20 500 130T1000 80M0 210Q300 30 500 180T1000 130"
            fill="none"
            stroke="#dd73fa55"
            strokeWidth="35"
          />
        </>
      ) : (
        <>
          <path
            d="M90 80L360 35L620 100L900 40V550L650 610L350 550L90 610Z"
            fill="#cfc48a11"
            stroke="#d7ca8155"
          />
          <path d="M350 45V550M630 100V600" stroke="#d4c48033" />
          {[210, 780].map((x) => (
            <g key={x}>
              <circle cx={x} cy="230" r="100" fill="none" stroke="#cfc88e44" />
              <path d={`M${x} 110l25 100l-25 140l-25-140Z`} fill="#cfb95c33" />
            </g>
          ))}
        </>
      )}
    </svg>
  );
}
