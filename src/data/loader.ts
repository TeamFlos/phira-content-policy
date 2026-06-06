import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { parse } from "smol-toml";
import type { z } from "zod";
import {
  artistSchema,
  rightsHolderPolicySchema,
  trackFileSchema,
  type Artist,
  type ContentPolicy,
  type ResolvedRightsHolder,
  type RightsHolderPolicy,
  type TrackEntry,
} from "./schema";

export type LoadError =
  | { filePath: string; kind: "parse"; message: string }
  | { filePath: string; kind: "schema"; issues: z.core.$ZodIssue[] }
  | { filePath: string; kind: "structure"; message: string };

export type LoadResult<T> = { data: T } | { errors: LoadError[] };

async function readDirSafe(
  dir: string,
): Promise<{ name: string; isFile(): boolean; isDirectory(): boolean }[] | LoadError> {
  try {
    return await readdir(dir, { withFileTypes: true });
  } catch (e) {
    const err = e as NodeJS.ErrnoException;
    if (err.code === "ENOENT") return [];
    return {
      filePath: dir,
      kind: "structure",
      message: `Cannot read directory: ${String(e)}`,
    };
  }
}

async function parseTOML<T>(filePath: string, schema: z.ZodType<T>): Promise<LoadResult<T>> {
  let raw: string;
  try {
    raw = await readFile(filePath, "utf-8");
  } catch (e) {
    return { errors: [{ filePath, kind: "parse", message: `Cannot read file: ${String(e)}` }] };
  }

  let parsed: unknown;
  try {
    parsed = parse(raw);
  } catch (e) {
    return { errors: [{ filePath, kind: "parse", message: `Invalid TOML syntax: ${String(e)}` }] };
  }

  const result = schema.safeParse(parsed);
  if (result.success) return { data: result.data };
  return { errors: [{ filePath, kind: "schema", issues: result.error.issues }] };
}

async function loadRightsHolder(dirPath: string): Promise<LoadResult<ResolvedRightsHolder>> {
  const errors: LoadError[] = [];
  let policy: RightsHolderPolicy | null = null;
  const tracks: TrackEntry[] = [];

  const policyResult = await parseTOML(join(dirPath, "_policy.toml"), rightsHolderPolicySchema);
  if ("errors" in policyResult) {
    errors.push(...policyResult.errors);
  } else {
    policy = policyResult.data;
  }

  let entries: { name: string; isFile(): boolean }[];
  const dirEntries = await readDirSafe(dirPath);
  if (!Array.isArray(dirEntries)) return { errors: [dirEntries] };
  entries = dirEntries.filter(
    (e) =>
      e.isFile() &&
      e.name.endsWith(".toml") &&
      e.name !== "_policy.toml" &&
      !e.name.startsWith("."),
  );

  if (entries.length === 0) {
    errors.push({
      filePath: dirPath,
      kind: "structure",
      message: "No track files found in rights holder directory",
    });
  }

  let trackErrors = false;
  for (const entry of entries) {
    const filePath = join(dirPath, entry.name);
    const result = await parseTOML(filePath, trackFileSchema);
    if ("errors" in result) {
      errors.push(...result.errors);
      trackErrors = true;
    } else {
      tracks.push(...result.data.track);
    }
  }

  if (policy === null || trackErrors) return { errors };
  return { data: { policy, tracks } };
}

async function loadArtist(filePath: string): Promise<LoadResult<Artist>> {
  return parseTOML(filePath, artistSchema);
}

async function loadIndependentFile(filePath: string): Promise<LoadResult<TrackEntry[]>> {
  const result = await parseTOML(filePath, trackFileSchema);
  if ("errors" in result) return result;
  return { data: result.data.track };
}

async function loadRightsHolders(
  dataDir: string,
): Promise<LoadResult<Record<string, ResolvedRightsHolder>>> {
  const dir = join(dataDir, "rights_holders");
  const dirEntries = await readDirSafe(dir);
  if (!Array.isArray(dirEntries)) return { errors: [dirEntries] };
  const entries = dirEntries.filter((e) => e.isDirectory() && !e.name.startsWith("."));

  const results = await Promise.all(
    entries.map(async (e) => {
      const r = await loadRightsHolder(join(dir, e.name));
      if ("errors" in r) return r;
      return { key: e.name, value: r.data } as const;
    }),
  );

  const good: { key: string; value: ResolvedRightsHolder }[] = [];
  const bad: LoadError[] = [];
  for (const r of results) {
    if ("errors" in r) {
      bad.push(...r.errors);
    } else {
      good.push(r);
    }
  }
  if (bad.length > 0) return { errors: bad };
  const data: Record<string, ResolvedRightsHolder> = {};
  for (const { key, value } of good) {
    data[key] = value;
  }
  return { data };
}

async function loadArtists(dataDir: string): Promise<LoadResult<Record<string, Artist>>> {
  const dir = join(dataDir, "artists");
  const dirEntries = await readDirSafe(dir);
  if (!Array.isArray(dirEntries)) return { errors: [dirEntries] };
  const entries = dirEntries.filter(
    (e) => e.isFile() && e.name.endsWith(".toml") && !e.name.startsWith("."),
  );

  const results = await Promise.all(
    entries.map(async (e) => {
      const r = await loadArtist(join(dir, e.name));
      if ("errors" in r) return r;
      return { key: e.name.replace(/\.toml$/, ""), value: r.data } as const;
    }),
  );

  const good: { key: string; value: Artist }[] = [];
  const bad: LoadError[] = [];
  for (const r of results) {
    if ("errors" in r) {
      bad.push(...r.errors);
    } else {
      good.push(r);
    }
  }
  if (bad.length > 0) return { errors: bad };
  const data: Record<string, Artist> = {};
  for (const { key, value } of good) {
    data[key] = value;
  }
  return { data };
}

async function loadIndependentTracks(dataDir: string): Promise<LoadResult<TrackEntry[]>> {
  const dir = join(dataDir, "independent");
  const dirEntries = await readDirSafe(dir);
  if (!Array.isArray(dirEntries)) return { errors: [dirEntries] };
  const entries = dirEntries.filter(
    (e) => e.isFile() && e.name.endsWith(".toml") && !e.name.startsWith("."),
  );

  const results = await Promise.all(entries.map((e) => loadIndependentFile(join(dir, e.name))));

  const good: TrackEntry[][] = [];
  const bad: LoadError[] = [];
  for (const r of results) {
    if ("errors" in r) {
      bad.push(...r.errors);
    } else {
      good.push(r.data);
    }
  }
  if (bad.length > 0) return { errors: bad };
  return { data: good.flat() };
}

export async function loadContentPolicy(dataDir: string): Promise<LoadResult<ContentPolicy>> {
  const [rh, artists, independent] = await Promise.all([
    loadRightsHolders(dataDir),
    loadArtists(dataDir),
    loadIndependentTracks(dataDir),
  ]);

  if ("errors" in rh || "errors" in artists || "errors" in independent) {
    const errors: LoadError[] = [];
    if ("errors" in rh) errors.push(...rh.errors);
    if ("errors" in artists) errors.push(...artists.errors);
    if ("errors" in independent) errors.push(...independent.errors);
    return { errors };
  }

  return {
    data: {
      rightsHolders: rh.data,
      artists: artists.data,
      independentTracks: independent.data,
    },
  };
}
