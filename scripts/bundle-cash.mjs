import { build } from "esbuild";
import { readFileSync, writeFileSync } from "node:fs";
const path = "supabase/functions/_shared/cash-engine.js";
await build({
  entryPoints: ["src/lib/cashEngine.ts"],
  bundle: true,
  format: "esm",
  platform: "browser",
  outfile: path,
});
writeFileSync(
  path,
  '// @ts-self-types="./cash-engine.d.ts"\n// Generated from src/lib/cashEngine.ts; run npm run cash:bundle after math changes.\n' +
    readFileSync(path, "utf8"),
);
