import { slotWinTier } from "./slotWinTier";
export type WorldEvent = {
  id: number;
  type: "idle" | "spin" | "settled" | "bonus" | "error";
  returned: number;
  stake: number;
};
export type ActorState =
  | "idle"
  | "anticipation"
  | "neutral"
  | "disappointed"
  | "delighted"
  | "cheer"
  | "celebrate"
  | "triumph"
  | "bonus";
export function actorState(event: WorldEvent): ActorState {
  if (event.type === "spin") return "anticipation";
  if (event.type === "bonus") return "bonus";
  if (event.type !== "settled") return "idle";
  const tier = slotWinTier(event.returned, event.stake);
  if (tier === "epic" || tier === "mega") return "triumph";
  if (tier === "big") return "celebrate";
  if (event.stake > 0 && event.returned >= event.stake * 5) return "cheer";
  if (event.returned > event.stake) return "delighted";
  if (event.returned < event.stake) return "disappointed";
  return "neutral";
}
export const reactionDuration = (state: ActorState) =>
  state === "triumph"
    ? 4000
    : state === "celebrate" || state === "bonus"
      ? 2800
      : state === "cheer"
        ? 2200
        : 1600;
export type RigName =
  "angler" | "confectioner" | "guardian" | "explorer" | "engineer" | "keeper";
export type WorldDirection = {
  character: RigName;
  name: string;
  role: string;
  signature: "cast" | "stir" | "summon" | "survey" | "tinker" | "bloom";
  atmosphere:
    | "water"
    | "sugar"
    | "magic"
    | "leaves"
    | "steam"
    | "snow"
    | "sand"
    | "embers";
  focus: string;
};
export const worldDirections: Record<string, WorldDirection> = {
  solar: {
    character: "guardian",
    name: "Solis",
    role: "Keeper of the sunforge",
    signature: "summon",
    atmosphere: "embers",
    focus: "Sunstone observatory",
  },
  city: {
    character: "engineer",
    name: "Vega",
    role: "Neon street pilot",
    signature: "tinker",
    atmosphere: "steam",
    focus: "Rain on neon streets",
  },
  temple: {
    character: "keeper",
    name: "Lian",
    role: "Jade sanctuary keeper",
    signature: "bloom",
    atmosphere: "leaves",
    focus: "Bamboo canopy",
  },
  moon: {
    character: "angler",
    name: "Mara",
    role: "Moon harbor navigator",
    signature: "cast",
    atmosphere: "water",
    focus: "Moonlit tidal harbor",
  },
  castle: {
    character: "guardian",
    name: "Rhea",
    role: "Crownfire sentinel",
    signature: "summon",
    atmosphere: "embers",
    focus: "Crownfire battlements",
  },
  cosmos: {
    character: "engineer",
    name: "Nova",
    role: "Velvet orbit captain",
    signature: "survey",
    atmosphere: "magic",
    focus: "Orbital station windows",
  },
  reef: {
    character: "angler",
    name: "Coralie",
    role: "Lagoon angler",
    signature: "cast",
    atmosphere: "water",
    focus: "Living coral lagoon",
  },
  train: {
    character: "engineer",
    name: "Ada",
    role: "Midnight rail conductor",
    signature: "tinker",
    atmosphere: "steam",
    focus: "Steam railway",
  },
  desert: {
    character: "explorer",
    name: "Saffra",
    role: "Caravan cartographer",
    signature: "survey",
    atmosphere: "sand",
    focus: "Saffron palace dunes",
  },
  ice: {
    character: "keeper",
    name: "Eira",
    role: "Glacier bloom keeper",
    signature: "bloom",
    atmosphere: "snow",
    focus: "Frozen blossom valley",
  },
  cave: {
    character: "keeper",
    name: "Nyx",
    role: "Crystal grotto watcher",
    signature: "summon",
    atmosphere: "magic",
    focus: "Obsidian crystal cavern",
  },
  garden: {
    character: "keeper",
    name: "Flora",
    role: "Butterfly garden keeper",
    signature: "bloom",
    atmosphere: "leaves",
    focus: "Electric botanical garden",
  },
  royal: {
    character: "guardian",
    name: "Rubi",
    role: "Royal gallery sentinel",
    signature: "summon",
    atmosphere: "magic",
    focus: "Ruby royal gallery",
  },
  canyon: {
    character: "explorer",
    name: "Copper",
    role: "Frontier prospector",
    signature: "survey",
    atmosphere: "sand",
    focus: "Copper frontier trail",
  },
  arcade: {
    character: "engineer",
    name: "Pixel",
    role: "Arcade district inventor",
    signature: "tinker",
    atmosphere: "magic",
    focus: "Aurora arcade boulevard",
  },
  map: {
    character: "explorer",
    name: "Atlas",
    role: "Sky expedition cartographer",
    signature: "survey",
    atmosphere: "steam",
    focus: "Flying expedition port",
  },
  storm: {
    character: "guardian",
    name: "Aella",
    role: "Thunder eagle guardian",
    signature: "summon",
    atmosphere: "magic",
    focus: "Storm eagle mountain eyrie",
  },
  candy: {
    character: "confectioner",
    name: "Pippa",
    role: "Sugar parade inventor",
    signature: "stir",
    atmosphere: "sugar",
    focus: "Sugar carnival parade",
  },
  pirate: {
    character: "angler",
    name: "Pearl",
    role: "Corsair pearl diver",
    signature: "cast",
    atmosphere: "water",
    focus: "Black pearl crossing",
  },
  honey: {
    character: "confectioner",
    name: "Amber",
    role: "Meadow honey artisan",
    signature: "stir",
    atmosphere: "leaves",
    focus: "Amber apiary meadow",
  },
  aurora: {
    character: "engineer",
    name: "Tikka",
    role: "Aurora clockmaker",
    signature: "tinker",
    atmosphere: "snow",
    focus: "Clockwork conservatory",
  },
  dragon: {
    character: "guardian",
    name: "Kaia",
    role: "Dragon forge warden",
    signature: "summon",
    atmosphere: "embers",
    focus: "Volcanic artisan forge",
  },
  astral: {
    character: "keeper",
    name: "Astra",
    role: "Celestial laboratory keeper",
    signature: "summon",
    atmosphere: "magic",
    focus: "Astral crystal laboratory",
  },
  foundry: {
    character: "engineer",
    name: "Cora",
    role: "Copper lockworks engineer",
    signature: "tinker",
    atmosphere: "steam",
    focus: "Copper piston foundry",
  },
  motor: {
    character: "engineer",
    name: "Nitro",
    role: "Midnight speedway mechanic",
    signature: "tinker",
    atmosphere: "embers",
    focus: "Neon speedway pit lane",
  },
};
export function worldDirection(scene: string) {
  return worldDirections[scene] || worldDirections.solar;
}
export type MotionTier = "still" | "low" | "full";
export function motionTier(
  reduced: boolean,
  cores = 8,
  memory = 8,
  width = 1000,
): MotionTier {
  return reduced
    ? "still"
    : cores <= 4 || memory <= 4 || width < 600
      ? "low"
      : "full";
}
// Critically damped motion with bounded overshoot; presentation only, never RNG for a wager.
export function springTravel(t: number, strength = 12) {
  return 1 - Math.exp(-strength * t) * Math.cos(t * strength * 0.75);
}
export function idleDelay(random: () => number = Math.random) {
  return 2800 + Math.floor(Math.max(0, Math.min(1, random())) * 5200);
}
