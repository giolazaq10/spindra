import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
const manifest = JSON.parse(
  readFileSync(
    new URL("../docs/slot-world-assets.json", import.meta.url),
    "utf8",
  ),
);
test("all production world assets exist, match their manifest, and use bounded WebP atlases", () => {
  assert.equal(manifest.assets.length, 56);
  assert.equal(
    manifest.assets.filter((a) => a.kind === "background").length,
    25,
  );
  assert.equal(manifest.assets.filter((a) => a.kind === "symbols").length, 25);
  assert.equal(manifest.assets.filter((a) => a.kind === "rig").length, 6);
  const actual = readdirSync(new URL("../public/worlds/", import.meta.url))
    .filter((p) => p.endsWith(".webp"))
    .sort();
  assert.deepEqual(
    actual,
    manifest.assets.map((a) => a.path.split("/").at(-1)).sort(),
  );
  for (const asset of manifest.assets) {
    assert.match(asset.path, /^public\/worlds\/[a-z-]+\.webp$/);
    assert.ok(asset.prompt.length > 100);
    const data = readFileSync(new URL("../" + asset.path, import.meta.url));
    assert.equal(data.subarray(0, 4).toString(), "RIFF");
    assert.equal(data.subarray(8, 12).toString(), "WEBP");
    assert.equal(createHash("sha256").update(data).digest("hex"), asset.sha256);
    assert.equal(data.length, asset.bytes);
    assert.ok(data.length < 450000);
    if (asset.kind !== "background") {
      assert.equal(asset.width, asset.height);
      assert.equal(asset.alpha, true);
    }
  }
});
