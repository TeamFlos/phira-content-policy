import { readFile } from "node:fs/promises";
import { z } from "zod";

const status = z.enum(["forbidden", "restricted", "free"]);

const trackEntry = z.object({
  name: z.string().min(1),
  artist: z.string().min(1),
  artistIds: z.array(z.string()).optional(),
  status,
  note: z.string().optional(),
});

const contentPolicy = z.object({
  rightsHolders: z.record(
    z.string(),
    z.object({
      policy: z.object({ name: z.string().min(1), status, note: z.string().optional() }),
      tracks: z.array(trackEntry),
    }),
  ),
  artists: z.record(
    z.string(),
    z.object({
      name: z.string().min(1),
      status,
      reason: z.string().optional(),
      note: z.string().optional(),
      references: z.array(z.string()).optional(),
    }),
  ),
  independentTracks: z.array(trackEntry).optional(),
});

const filePath = process.argv[2];
if (!filePath) {
  console.error("Usage: tsx scripts/validate-json.ts <content-policy.json>");
  process.exit(1);
}

const raw = await readFile(filePath, "utf-8");

let json: unknown;
try {
  json = JSON.parse(raw);
} catch (e) {
  console.error(`Invalid JSON: ${String(e)}`);
  process.exit(1);
}

const result = contentPolicy.safeParse(json);
if (!result.success) {
  console.error(`${result.error.issues.length} issue(s):`);
  for (const issue of result.error.issues) {
    console.error(`  ${issue.path.join(".")}: ${issue.message}`);
  }
  process.exit(1);
}

const { rightsHolders, artists, independentTracks } = result.data;
const trackCount =
  Object.values(rightsHolders).reduce((n, r: { tracks: unknown[] }) => n + r.tracks.length, 0) +
  (independentTracks ?? []).length;
console.log(
  `OK: ${Object.keys(rightsHolders).length} rights holder(s), ${Object.keys(artists).length} artist(s), ${trackCount} track(s)`,
);
