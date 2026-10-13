import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { mkdir, writeFile } from "node:fs/promises";
import { originals } from "../src/lib/catalog.ts";
import { SlotScenery, SlotSymbol } from "../src/components/SlotArt.tsx";
await mkdir("public/originals", { recursive: true });
const escape = (s) =>
  s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
for (const g of originals.filter((g) => g.slot)) {
  const scene = renderToStaticMarkup(
    createElement(SlotScenery, { scene: g.slot.scene }),
  ).replace("<svg", '<svg x="0" y="0" width="1000" height="650"');
  const art = renderToStaticMarkup(
    createElement(SlotSymbol, { spec: g.slot, index: 6 }),
  );
  const icon = art
    .slice(art.indexOf("<svg"), art.lastIndexOf("</svg>") + 6)
    .replace("<svg", '<svg x="380" y="130" width="240" height="240"');
  const colors = {
    solar: "#ef8e21",
    city: "#5419a0",
    temple: "#267f52",
    moon: "#1a77b0",
    castle: "#be492c",
    cosmos: "#8945ba",
    reef: "#15a8a3",
    train: "#426388",
    desert: "#e5a044",
    ice: "#6caed7",
    cave: "#795bba",
    garden: "#82a72b",
    royal: "#bd3471",
    canyon: "#cb783f",
    arcade: "#374bb6",
    map: "#a68c4e",
  };
  const backdrop = colors[g.slot.scene];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="650" viewBox="0 0 1000 650"><defs><radialGradient id="bg"><stop stop-color="${backdrop}"/><stop offset="1" stop-color="#152336"/></radialGradient><linearGradient id="shade" x2="0" y2="1"><stop stop-color="#080812" stop-opacity=".15"/><stop offset="1" stop-color="#080812" stop-opacity=".65"/></linearGradient></defs><rect width="1000" height="650" fill="url(#bg)"/>${scene}<rect width="1000" height="650" fill="url(#shade)"/><circle cx="500" cy="255" r="133" fill="#0a0a1455" stroke="${g.accent}" stroke-opacity=".3"/>${icon}<text x="40" y="50" fill="${g.accent}" font-size="17" font-family="sans-serif" letter-spacing="5">SPINDRA ORIGINALS</text><text x="500" y="455" text-anchor="middle" fill="#fff8d8" stroke="#201b35" stroke-width="1" paint-order="stroke" font-size="47" font-family="Georgia,serif" font-weight="bold">${escape(g.name)}</text><text x="500" y="505" text-anchor="middle" fill="#eee5d0" font-size="19" font-family="sans-serif" letter-spacing="2">${escape(g.slot.feature.toUpperCase())}</text><text x="500" y="555" text-anchor="middle" fill="#f2f4ff" font-size="16" font-family="sans-serif">${g.slot.reels} REELS · ${g.slot.rows} ROWS · ${g.slot.mode === "ways" ? g.slot.rows ** g.slot.reels + " WAYS" : g.slot.lines.length + " LINES"}</text></svg>`;
  await writeFile(
    `public/originals/${g.slug}.svg`,
    svg
      .replaceAll("var(--accent)", g.accent)
      .replaceAll("var(--theme)", g.color),
  );
}
console.log("Generated 16 distinct original slot covers.");
