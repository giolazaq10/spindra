export type WorldActor =
  | "sun"
  | "rocket"
  | "car"
  | "sign"
  | "bird"
  | "lantern"
  | "moon"
  | "sailboat"
  | "torch"
  | "banner"
  | "planet"
  | "comet"
  | "fish"
  | "turtle"
  | "train"
  | "clock"
  | "carpet"
  | "snowflake"
  | "crystal"
  | "bat"
  | "butterfly"
  | "flower"
  | "crown"
  | "cards"
  | "wagon"
  | "compass"
  | "arcadeShip"
  | "ghost"
  | "airship"
  | "eagle"
  | "cloud"
  | "lollipop"
  | "balloon"
  | "ship"
  | "parrot"
  | "bee"
  | "honeycomb"
  | "gear"
  | "dragon"
  | "anvil"
  | "orb"
  | "piston"
  | "racecar"
  | "flag";
export type LivingWorldProfile = {
  name: string;
  habitat: string;
  actors: [WorldActor, WorldActor];
  motion: [string, string];
  weather: string;
};
export const livingWorlds: Record<string, LivingWorldProfile> = {
  solar: {
    name: "Sunforge observatory",
    habitat: "sky",
    actors: ["sun", "rocket"],
    motion: ["orbit", "fly"],
    weather: "embers",
  },
  city: {
    name: "Neon night streets",
    habitat: "city",
    actors: ["car", "sign"],
    motion: ["drive", "sway"],
    weather: "rain",
  },
  temple: {
    name: "Jade bamboo sanctuary",
    habitat: "temple",
    actors: ["bird", "lantern"],
    motion: ["fly", "bob"],
    weather: "leaves",
  },
  moon: {
    name: "Moonlit tidal harbor",
    habitat: "sea",
    actors: ["moon", "sailboat"],
    motion: ["bob", "sail"],
    weather: "stars",
  },
  castle: {
    name: "Crownfire battlements",
    habitat: "castle",
    actors: ["torch", "banner"],
    motion: ["sway", "sway"],
    weather: "embers",
  },
  cosmos: {
    name: "Velvet orbital station",
    habitat: "space",
    actors: ["planet", "comet"],
    motion: ["orbit", "fly"],
    weather: "stars",
  },
  reef: {
    name: "Living coral lagoon",
    habitat: "reef",
    actors: ["fish", "turtle"],
    motion: ["swim", "swim"],
    weather: "bubbles",
  },
  train: {
    name: "Midnight steam railway",
    habitat: "rail",
    actors: ["train", "clock"],
    motion: ["drive", "sway"],
    weather: "steam",
  },
  desert: {
    name: "Saffron palace dunes",
    habitat: "dunes",
    actors: ["carpet", "lantern"],
    motion: ["fly", "bob"],
    weather: "sand",
  },
  ice: {
    name: "Glacier bloom valley",
    habitat: "ice",
    actors: ["snowflake", "crystal"],
    motion: ["orbit", "bob"],
    weather: "snow",
  },
  cave: {
    name: "Obsidian crystal grotto",
    habitat: "cave",
    actors: ["crystal", "bat"],
    motion: ["bob", "fly"],
    weather: "stars",
  },
  garden: {
    name: "Electric butterfly garden",
    habitat: "garden",
    actors: ["butterfly", "flower"],
    motion: ["flutter", "sway"],
    weather: "pollen",
  },
  royal: {
    name: "Ruby royal gallery",
    habitat: "palace",
    actors: ["crown", "cards"],
    motion: ["bob", "sway"],
    weather: "stars",
  },
  canyon: {
    name: "Copper frontier trail",
    habitat: "canyon",
    actors: ["wagon", "compass"],
    motion: ["drive", "sway"],
    weather: "sand",
  },
  arcade: {
    name: "Aurora arcade district",
    habitat: "arcade",
    actors: ["arcadeShip", "ghost"],
    motion: ["fly", "bob"],
    weather: "pixels",
  },
  map: {
    name: "Atlas sky expedition",
    habitat: "map",
    actors: ["compass", "airship"],
    motion: ["sway", "fly"],
    weather: "steam",
  },
  storm: {
    name: "Thunder eagle peaks",
    habitat: "storm",
    actors: ["eagle", "cloud"],
    motion: ["fly", "sway"],
    weather: "rain",
  },
  candy: {
    name: "Sugar carnival parade",
    habitat: "candy",
    actors: ["lollipop", "balloon"],
    motion: ["sway", "bob"],
    weather: "sprinkles",
  },
  pirate: {
    name: "Black pearl crossing",
    habitat: "pirate",
    actors: ["ship", "parrot"],
    motion: ["sail", "fly"],
    weather: "bubbles",
  },
  honey: {
    name: "Amber meadow apiary",
    habitat: "meadow",
    actors: ["bee", "honeycomb"],
    motion: ["flutter", "sway"],
    weather: "pollen",
  },
  aurora: {
    name: "Aurora clockwork workshop",
    habitat: "clockwork",
    actors: ["gear", "clock"],
    motion: ["orbit", "sway"],
    weather: "snow",
  },
  dragon: {
    name: "Dragon volcanic forge",
    habitat: "forge",
    actors: ["dragon", "anvil"],
    motion: ["fly", "bob"],
    weather: "embers",
  },
  astral: {
    name: "Astral crystal laboratory",
    habitat: "lab",
    actors: ["orb", "crystal"],
    motion: ["orbit", "bob"],
    weather: "stars",
  },
  foundry: {
    name: "Copper piston foundry",
    habitat: "factory",
    actors: ["piston", "gear"],
    motion: ["pump", "orbit"],
    weather: "steam",
  },
  motor: {
    name: "Midnight neon speedway",
    habitat: "road",
    actors: ["racecar", "flag"],
    motion: ["drive", "sway"],
    weather: "embers",
  },
};
export const livingWorld = (scene: string) =>
  livingWorlds[scene] || livingWorlds.solar;
