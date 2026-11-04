import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { mkdir, writeFile } from "node:fs/promises";
import { originals } from "../src/lib/catalog.ts";
import { SlotScenery, SlotSymbol } from "../src/components/SlotArt.tsx";
import { PremiumCover } from "../src/components/PremiumSlotArt.tsx";
import { slotLook, slotCoverSymbol } from "../src/lib/slotPresentation.ts";
await mkdir("public/originals", { recursive: true });
const escape = (s) =>
  s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
for (const g of originals.filter((g) => g.slot)) {
  if (g.slot.premium) {
    await writeFile(
      `public/originals/${g.slug}.svg`,
      renderToStaticMarkup(
        createElement(PremiumCover, {
          kind: g.slot.premium,
          name: g.name,
          feature: g.slot.feature,
        }),
      ),
    );
    continue;
  }
  const look = slotLook(g.slot.scene);
  const scene = renderToStaticMarkup(
    createElement(SlotScenery, { scene: g.slot.scene }),
  ).replace("<svg", '<svg x="0" y="0" width="1000" height="650"');
  const symbol = (index, x, y, size) => {
    const raw = renderToStaticMarkup(
      createElement(SlotSymbol, { spec: g.slot, index, raster: false }),
    );
    return raw
      .slice(raw.indexOf("<svg"), raw.lastIndexOf("</svg>") + 6)
      .replace(
        "<svg",
        `<svg x="${x}" y="${y}" width="${size}" height="${size}"`,
      )
      .replace(
        /(id="|url\(#)([^"\)]+)(?="|\))/g,
        (_m, lead, id) => lead + g.slug + "-" + index + "-" + x + "-" + id,
      );
  };
  const titleFont =
    look.family === "neon" ? "Arial,sans-serif" : "Georgia,serif";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="750" viewBox="0 0 1000 750"><defs><radialGradient id="cover-bg" cx=".3" cy=".2" r="1"><stop stop-color="${look.primary}"/><stop offset=".4" stop-color="${look.deep}"/><stop offset="1" stop-color="${look.deep}"/></radialGradient><radialGradient id="cover-halo"><stop stop-color="${look.secondary}" stop-opacity=".65"/><stop offset="1" stop-color="${look.secondary}" stop-opacity="0"/></radialGradient><linearGradient id="cover-shade" x2="0" y2="1"><stop stop-color="${look.deep}" stop-opacity=".05"/><stop offset=".55" stop-color="${look.deep}" stop-opacity=".15"/><stop offset="1" stop-color="${look.deep}" stop-opacity=".97"/></linearGradient><linearGradient id="title-ink" x2="0" y2="1"><stop stop-color="#ffffff"/><stop offset="1" stop-color="${look.primary}"/></linearGradient></defs><rect width="1000" height="750" rx="28" fill="url(#cover-bg)"/><g opacity=".8">${scene}</g><ellipse cx="650" cy="220" rx="380" ry="290" fill="url(#cover-halo)"/><rect width="1000" height="750" fill="url(#cover-shade)"/><path d="M38 145V40H250M750 40H962V145M38 605V710H250M750 710H962V605" fill="none" stroke="${look.primary}" stroke-width="2" opacity=".65"/><circle cx="500" cy="250" r="158" fill="${look.deep}" fill-opacity=".35" stroke="${look.primary}" stroke-width="2" stroke-opacity=".5"/>${symbol(5, 155, 190, 190)}${symbol(6, 655, 185, 190)}${symbol(slotCoverSymbol(g.slot.scene), 345, 80, 310)}<text x="58" y="81" fill="${look.primary}" font-size="17" font-family="Arial,sans-serif" letter-spacing="5">SPINDRA ORIGINALS</text><text x="500" y="505" text-anchor="middle" fill="url(#title-ink)" stroke="${look.deep}" stroke-width="2" paint-order="stroke" font-size="60" font-family="${titleFont}" font-weight="900">${escape(g.name)}</text><text x="500" y="548" text-anchor="middle" fill="#fff" font-size="18" font-family="Arial,sans-serif" letter-spacing="3">${escape(look.label)}</text><rect x="220" y="584" width="560" height="47" rx="24" fill="${look.deep}" fill-opacity=".85" stroke="${look.primary}" stroke-opacity=".6"/><text x="500" y="614" text-anchor="middle" fill="#fff0d8" font-size="17" font-family="Arial,sans-serif">${escape(g.slot.feature)}</text></svg>`;
  await writeFile(
    `public/originals/${g.slug}.svg`,
    svg
      .replaceAll("var(--accent)", look.primary)
      .replaceAll("var(--theme)", look.deep),
  );
}
console.log(
  `Generated ${originals.filter((g) => g.slot).length} colorful original slot covers.`,
);
