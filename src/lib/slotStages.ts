// Each original has its own environment and readable reel surface, independent of game math.
export const slotStages: Record<string, [string, string, string, string]> = {
  solar: ["#f9a445", "#a14079", "#fff9dc", "#ffe6a2"],
  city: ["#226ca3", "#3f246c", "#223663", "#122346"],
  temple: ["#42a88d", "#1c6676", "#effff1", "#bfebdb"],
  moon: ["#637cbd", "#303365", "#e8f2ff", "#b8c9ed"],
  castle: ["#d87971", "#723055", "#fff0e6", "#f4b9ab"],
  cosmos: ["#6c52bd", "#2b327b", "#403d8b", "#252655"],
  reef: ["#21b9c9", "#176a9b", "#cafff0", "#7bddd8"],
  train: ["#4886a2", "#334968", "#fff3d7", "#d6deca"],
  desert: ["#f6b56f", "#b9537c", "#fff1d8", "#ffc7b2"],
  ice: ["#69c6e1", "#6679be", "#f5ffff", "#c5eaf8"],
  cave: ["#965dc7", "#394384", "#424278", "#282d59"],
  garden: ["#89c66e", "#3a8d87", "#f4ffe6", "#c4eaa7"],
  royal: ["#dc76b0", "#793f8d", "#fff0fa", "#eac5ec"],
  canyon: ["#e79264", "#aa525a", "#fff3db", "#efc49e"],
  arcade: ["#386cb8", "#6743a0", "#253b65", "#152e50"],
  map: ["#8fba9e", "#4f7b82", "#fffae3", "#e4d7ab"],
  storm: ["#6f9bbd", "#454e91", "#ddecff", "#a9c9e7"],
  candy: ["#6fcde9", "#ed8fcb", "#fff1fc", "#f8c7e6"],
  pirate: ["#43b8b0", "#2e6688", "#d8fff2", "#9bd5ce"],
  honey: ["#f5ca58", "#c28354", "#fff9d8", "#ffe6a3"],
  aurora: ["#56b9b3", "#6d5eaa", "#effaff", "#c6e1ee"],
  dragon: ["#ca6a69", "#673975", "#fff0dd", "#eebcae"],
  astral: ["#7e74d5", "#3d5c99", "#393d80", "#242958"],
  foundry: ["#c28e61", "#58656e", "#fff4dd", "#ddcbaa"],
  motor: ["#c65b83", "#3b6584", "#fff6e4", "#e7ddbf"],
};
export function slotStageVars(scene: string) {
  const [top, bottom, reelTop, reelBottom] =
    slotStages[scene] || slotStages.solar;
  return {
    "--slot-sky": top,
    "--slot-horizon": bottom,
    "--slot-reel-top": reelTop,
    "--slot-reel-bottom": reelBottom,
  };
}
