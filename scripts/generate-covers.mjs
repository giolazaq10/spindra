import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { mkdir, writeFile } from "node:fs/promises";
import { originals } from "../src/lib/catalog.ts";
import { SlotScenery, CoverIcon } from "../src/components/SlotArt.tsx";
await mkdir("public/originals", { recursive: true });
const escape = (s) =>
  s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
for (const g of originals.filter((g) => g.slot)) {
  const scene = renderToStaticMarkup(
    createElement(SlotScenery, { scene: g.slot.scene }),
  ).replace("<svg", '<svg x="0" y="0" width="1000" height="650"');
  const icon = renderToStaticMarkup(
    createElement(CoverIcon, { spec: g.slot }),
  ).replace("<svg", '<svg x="405" y="160"');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="650" viewBox="0 0 1000 650"><defs><radialGradient id="bg"><stop stop-color="${g.color}"/><stop offset="1" stop-color="#080812"/></radialGradient><linearGradient id="shade" x2="0" y2="1"><stop stop-color="#080812" stop-opacity=".15"/><stop offset="1" stop-color="#080812" stop-opacity=".95"/></linearGradient></defs><rect width="1000" height="650" fill="url(#bg)"/>${scene}<rect width="1000" height="650" fill="url(#shade)"/><circle cx="500" cy="255" r="133" fill="#0a0a1455" stroke="${g.accent}" stroke-opacity=".3"/>${icon}<text x="40" y="50" fill="${g.accent}" font-size="17" font-family="sans-serif" letter-spacing="5">SPINDRA ORIGINALS</text><text x="500" y="455" text-anchor="middle" fill="${g.accent}" font-size="47" font-family="Georgia,serif" font-weight="bold">${escape(g.name)}</text><text x="500" y="505" text-anchor="middle" fill="#eee5d0" font-size="19" font-family="sans-serif" letter-spacing="2">${escape(g.slot.feature.toUpperCase())}</text><text x="500" y="555" text-anchor="middle" fill="#ad9dac" font-size="16" font-family="sans-serif">${g.slot.reels} REELS · ${g.slot.rows} ROWS · ${g.slot.mode === "ways" ? g.slot.rows ** g.slot.reels + " WAYS" : g.slot.lines.length + " LINES"}</text></svg>`;
  await writeFile(
    `public/originals/${g.slug}.svg`,
    svg
      .replaceAll("var(--accent)", g.accent)
      .replaceAll("var(--theme)", g.color),
  );
}
console.log("Generated 16 distinct original slot covers.");
