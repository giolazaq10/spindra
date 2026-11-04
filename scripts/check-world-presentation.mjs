// Offline, isolated visual fixture. Never connects to Supabase or submits cash wagers.
import { build } from "esbuild";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { originals } from "../src/lib/catalog.ts";
const run = promisify(execFile),
  directory = resolve("artifacts/world-presentation");
const chrome =
  process.env.CHROME_PATH ||
  (process.platform === "win32"
    ? "C:/Program Files/Google/Chrome/Application/chrome.exe"
    : "/usr/bin/chromium");
if (!existsSync(chrome))
  throw Error("Set CHROME_PATH to an installed Chrome/Chromium executable.");
await mkdir(directory, { recursive: true });
const script = resolve(directory, "fixture.js"),
  html = resolve(directory, "fixture.html");
await build({
  entryPoints: ["tests/fixtures/world-presentation.tsx"],
  outfile: script,
  bundle: true,
  format: "iife",
  jsx: "automatic",
  tsconfig: "tsconfig.app.json",
  define: { "process.env.NODE_ENV": '"development"' },
});
await writeFile(
  script,
  (await readFile(script, "utf8")).replaceAll(
    "/worlds/",
    pathToFileURL(resolve("public/worlds") + "/").href,
  ),
);
const css = (await readdir("dist/assets")).find((f) => f.endsWith(".css"));
if (!css) throw Error("Run npm run build before browser presentation checks.");
await writeFile(
  html,
  `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="${pathToFileURL(resolve("dist/assets/" + css)).href}"><style>body{background:#10182b}.spindra-extension .compact-slot-page{padding-top:16px;margin:auto}#root{min-height:100vh}</style><div id="root"></div><script src="${pathToFileURL(script).href}"></script>`,
);
const cases = originals
  .filter((g) => g.slot)
  .flatMap((g) =>
    [1200, 390].map((width) => ({ game: g.slug, mode: "idle", width })),
  );
for (const game of [
  "solar-vault",
  "astra-cascade",
  "copper-lock",
  "nitro-sevens",
])
  for (const width of [1200, 390])
    for (const mode of ["win", "pending"]) cases.push({ game, width, mode });
cases.push({ game: "solar-vault", width: 390, mode: "bonus" });
const reports = [];
let cursor = 0;
async function worker(workerId) {
  while (cursor < cases.length) {
    const item = cases[cursor++],
      name = `${item.game}-${item.width}-${item.mode}`,
      shell = resolve(directory, name + ".html");
    const child = pathToFileURL(html);
    child.searchParams.set("game", item.game);
    child.searchParams.set("mode", item.mode);
    await writeFile(
      shell,
      `<!doctype html><style>body{margin:0;background:#10182b}iframe{border:0;display:block}</style><iframe width="${item.width}" height="1160" src="${child.href}"></iframe><script>const frame=document.querySelector('iframe');addEventListener('message',event=>{if(event.source!==frame.contentWindow||event.data?.type!=='world-fixture-report')return;const out=document.createElement('pre');out.id='qa-report';out.style.display='none';out.textContent=JSON.stringify(event.data.report);document.body.append(out);});</script>`,
    );
    const { stdout, stderr } = await run(
      chrome,
      [
        "--headless=new",
        "--disable-gpu",
        "--no-first-run",
        `--user-data-dir=${resolve(directory, "profile-" + workerId)}`,
        `--screenshot=${resolve(directory, name + ".png")}`,
        "--dump-dom",
        "--virtual-time-budget=4500",
        `--window-size=${Math.max(500, item.width)},1200`,
        pathToFileURL(shell).href,
      ],
      { windowsHide: true, maxBuffer: 8 * 1024 * 1024, timeout: 30000 },
    );
    const match = stdout.match(/<pre id="qa-report"[^>]*>(.*?)<\/pre>/s);
    if (!match)
      throw Error(`No fixture report for ${name}: ${stderr.slice(-300)}`);
    const report = JSON.parse(
      match[1]
        .replaceAll("&amp;", "&")
        .replaceAll("&lt;", "<")
        .replaceAll("&gt;", ">"),
    );
    report.assets = report.assets.map((a) => ({
      ...a,
      src: a.src.slice(a.src.lastIndexOf("/worlds/")),
    }));
    if (
      report.width !== item.width ||
      report.scrollWidth > item.width ||
      !report.stable ||
      !report.stakeNextToSpin ||
      report.assets.some((a) => !a.loaded)
    )
      throw Error(`Layout or asset failure: ${JSON.stringify(report)}`);
    if (item.mode === "win" && (report.requests !== 1 || report.finishes !== 1))
      throw Error(`Stop did not settle once: ${name}`);
    if (
      item.mode === "pending" &&
      (report.requests !== 1 ||
        report.finishes !== 0 ||
        report.actor !== "anticipation")
    )
      throw Error(`Unconfirmed presentation failure: ${name}`);
    if (item.mode === "bonus" && (!report.bonus || report.finishes !== 0))
      throw Error(`Confirmed bonus was discarded: ${name}`);
    reports.push(report);
    console.log(`PASS ${name}`);
  }
}
await Promise.all([0, 1, 2, 3].map(worker));
const result = {
  fixture: "Offline headless Chrome; local test outcomes; no cash requests",
  cases: reports.length,
  reports: reports.sort((a, b) =>
    (a.game + a.width + a.mode).localeCompare(b.game + b.width + b.mode),
  ),
};
await writeFile(
  resolve(directory, "results.json"),
  JSON.stringify(result, null, 2) + "\n",
);
console.log(
  `Verified ${reports.length} desktop/mobile presentation cases. Screenshots and reports: artifacts/world-presentation/`,
);
