import { resolve } from "node:path";
import { loadContentPolicy } from "../src/data/loader.js";

const dataDir = resolve(import.meta.dirname, "..", "data");
const result = await loadContentPolicy(dataDir);

if ("errors" in result) {
  for (const e of result.errors) {
    console.error(`  ${e.filePath}`);
    console.error(`    [${e.kind}] ${"issues" in e ? JSON.stringify(e.issues) : e.message}`);
  }
  console.error(`\n${result.errors.length} error(s)`);
  process.exitCode = 1;
} else {
  const { rightsHolders, artists, independentTracks } = result.data;
  const trackCount =
    Object.values(rightsHolders).reduce((n, rh) => n + rh.tracks.length, 0) +
    independentTracks.length;
  console.log(
    `OK: ${Object.keys(rightsHolders).length} rights holder(s), ${Object.keys(artists).length} artist(s), ${trackCount} track(s)`,
  );
}
