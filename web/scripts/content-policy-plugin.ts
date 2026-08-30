import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFile, readdir } from "node:fs/promises";
import { join, relative, resolve, sep } from "node:path";
import { parse } from "smol-toml";
import type { Plugin } from "vite";
import { loadContentPolicy, type LoadError } from "../src/data/loader.js";

const VIRTUAL_ID = "virtual:content-policy";
const RESOLVED_ID = "\0" + VIRTUAL_ID;
const execFileAsync = promisify(execFile);
const UNKNOWN_ADDED_AT = "1970-01-01T00:00:00.000Z";

interface EntryMetadata {
  tracks: Record<string, string>;
  rightsHolders: Record<string, string>;
  artists: Record<string, string>;
}

interface IssueTemplate {
  fileName: string;
  name: string;
  description: string;
  locale: "zh" | "en" | "other";
}

function trackMetadataKey(
  originKind: "rights_holder" | "independent",
  originId: string,
  name: string,
  artist: string,
): string {
  return JSON.stringify([originKind, originId, name, artist]);
}

function formatError(e: LoadError): string {
  if (e.kind === "schema") {
    const issues = e.issues
      .map((i) => `      - ${i.path.join(".") || "<root>"}: ${i.message} (${i.code})`)
      .join("\n");
    return `  ${e.filePath}\n    [schema]\n${issues}`;
  }
  return `  ${e.filePath}\n    [${e.kind}] ${e.message}`;
}

async function collectTomlPaths(dataDir: string): Promise<string[]> {
  const out: string[] = [];
  async function walk(dir: string): Promise<void> {
    try {
      const entries = await readdir(dir, { withFileTypes: true });
      for (const e of entries) {
        if (e.name.startsWith(".")) continue;
        const p = join(dir, e.name);
        if (e.isDirectory()) {
          await walk(p);
        } else if (e.isFile() && e.name.endsWith(".toml")) {
          out.push(p);
        }
      }
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") return;
      throw err;
    }
  }
  await walk(dataDir);
  return out;
}

async function collectIssueTemplatePaths(repoRoot: string): Promise<string[]> {
  const dir = join(repoRoot, ".github", "ISSUE_TEMPLATE");
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && /\.ya?ml$/i.test(entry.name))
      .map((entry) => join(dir, entry.name))
      .sort();
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
}

function parseYamlScalar(raw: string): string {
  const value = raw.trim();
  if (value.startsWith('"') && value.endsWith('"')) {
    try {
      return JSON.parse(value) as string;
    } catch {
      return value.slice(1, -1);
    }
  }
  if (value.startsWith("'") && value.endsWith("'")) return value.slice(1, -1).replaceAll("''", "'");
  return value;
}

async function loadIssueTemplates(
  repoRoot: string,
  paths: readonly string[],
): Promise<IssueTemplate[]> {
  const templates: IssueTemplate[] = [];
  for (const filePath of paths) {
    const source = await readFile(filePath, "utf8");
    const name = source.match(/^name:\s*(.+)$/m)?.[1];
    if (!name) continue;
    const description = source.match(/^description:\s*(.+)$/m)?.[1] ?? "";
    const fileName = relative(join(repoRoot, ".github", "ISSUE_TEMPLATE"), filePath).replaceAll(
      "\\",
      "/",
    );
    const stem = fileName.replace(/\.ya?ml$/i, "");
    const locale = stem.endsWith("-zh") ? "zh" : stem.endsWith("-en") ? "en" : "other";
    templates.push({
      fileName,
      name: parseYamlScalar(name),
      description: parseYamlScalar(description),
      locale,
    });
  }
  return templates;
}

async function collectFileAddedDates(dataDir: string): Promise<Map<string, string>> {
  const repoRoot = resolve(dataDir, "..");
  const relativeDataDir = relative(repoRoot, dataDir).replaceAll("\\", "/");
  const dates = new Map<string, string>();

  try {
    const { stdout } = await execFileAsync(
      "git",
      [
        "log",
        "--reverse",
        "--diff-filter=A",
        "--format=--CONTENT-POLICY-DATE--%aI",
        "--name-only",
        "--",
        relativeDataDir,
      ],
      { cwd: repoRoot, encoding: "utf8" },
    );
    let currentDate = UNKNOWN_ADDED_AT;
    for (const rawLine of stdout.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (line.startsWith("--CONTENT-POLICY-DATE--")) {
        currentDate = line.slice("--CONTENT-POLICY-DATE--".length);
      } else if (line.endsWith(".toml") && !dates.has(line)) {
        dates.set(line, currentDate);
      }
    }
  } catch {
    // Source archives and shallow checkouts may not contain Git history. Keep a
    // deterministic fallback so sorting still works and never changes by build time.
  }

  return dates;
}

async function buildEntryMetadata(
  dataDir: string,
  tomlPaths: readonly string[],
): Promise<EntryMetadata> {
  const repoRoot = resolve(dataDir, "..");
  const fileDates = await collectFileAddedDates(dataDir);
  const metadata: EntryMetadata = { tracks: {}, rightsHolders: {}, artists: {} };

  for (const filePath of tomlPaths) {
    const repoPath = relative(repoRoot, filePath).replaceAll("\\", "/");
    const dataPath = relative(dataDir, filePath).replaceAll("\\", "/");
    const addedAt = fileDates.get(repoPath) ?? UNKNOWN_ADDED_AT;
    const parts = dataPath.split("/");

    if (parts[0] === "artists" && parts.length === 2) {
      metadata.artists[parts[1].replace(/\.toml$/, "")] = addedAt;
      continue;
    }

    if (parts[0] === "rights_holders" && parts.length === 3 && parts[2] === "_policy.toml") {
      metadata.rightsHolders[parts[1]] = addedAt;
      continue;
    }

    if (
      (parts[0] === "rights_holders" && parts.length === 3) ||
      (parts[0] === "independent" && parts.length === 2)
    ) {
      const parsed = parse(await readFile(filePath, "utf8")) as {
        track?: { name?: unknown; artist?: unknown }[];
      };
      const originKind = parts[0] === "rights_holders" ? "rights_holder" : "independent";
      const originId = originKind === "rights_holder" ? parts[1] : "";
      for (const track of parsed.track ?? []) {
        if (typeof track.name !== "string" || typeof track.artist !== "string") continue;
        metadata.tracks[trackMetadataKey(originKind, originId, track.name, track.artist)] = addedAt;
      }
    }
  }

  return metadata;
}

function isUnderDir(filePath: string, dir: string): boolean {
  if (filePath === dir) return true;
  const prefix = dir.endsWith(sep) ? dir : dir + sep;
  return filePath.startsWith(prefix);
}

export function contentPolicyPlugin(dataDir: string): Plugin {
  const absDataDir = resolve(dataDir);
  const repoRoot = resolve(absDataDir, "..");
  const issueTemplateDir = join(repoRoot, ".github", "ISSUE_TEMPLATE");

  return {
    name: "content-policy",
    enforce: "pre",

    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID;
      return null;
    },

    async load(id) {
      if (id !== RESOLVED_ID) return null;

      // Watch every existing toml so edits trigger module reloads. Newly-created files
      // under data/ are caught by handleHotUpdate (Vite's project-root watcher fires
      // there). Registered before error check so HMR still recovers from a failed load.
      const tomlPaths = await collectTomlPaths(absDataDir);
      for (const p of tomlPaths) this.addWatchFile(p);
      const issueTemplatePaths = await collectIssueTemplatePaths(repoRoot);
      for (const p of issueTemplatePaths) this.addWatchFile(p);

      const result = await loadContentPolicy(absDataDir);
      if ("errors" in result) {
        const msg =
          `Failed to load content policy from ${absDataDir}:\n` +
          result.errors.map(formatError).join("\n");
        return this.error(msg);
      }

      const metadata = await buildEntryMetadata(absDataDir, tomlPaths);
      const issueTemplates = await loadIssueTemplates(repoRoot, issueTemplatePaths);

      // ContentPolicy is JSON-safe by construction: schema.ts only permits
      // strings, arrays of strings, and records of those. If that ever changes,
      // this stringify becomes lossy/unsafe.
      return `export const metadata = ${JSON.stringify(metadata)};\nexport const issueTemplates = ${JSON.stringify(issueTemplates)};\nexport default ${JSON.stringify(result.data)};`;
    },

    async handleHotUpdate(ctx) {
      const dataChanged = isUnderDir(ctx.file, absDataDir) && ctx.file.endsWith(".toml");
      const issueTemplateChanged =
        isUnderDir(ctx.file, issueTemplateDir) && /\.ya?ml$/i.test(ctx.file);
      if (!dataChanged && !issueTemplateChanged) return;
      const mod = ctx.server.moduleGraph.getModuleById(RESOLVED_ID);
      if (!mod) return;
      ctx.server.moduleGraph.invalidateModule(mod);
      return [mod, ...ctx.modules];
    },
  };
}
