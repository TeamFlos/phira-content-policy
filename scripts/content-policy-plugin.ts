import { readdir } from "node:fs/promises";
import { join, resolve, sep } from "node:path";
import type { Plugin } from "vite";
import { loadContentPolicy, type LoadError } from "../src/data/loader.js";

const VIRTUAL_ID = "virtual:content-policy";
const RESOLVED_ID = "\0" + VIRTUAL_ID;

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

function isUnderDir(filePath: string, dir: string): boolean {
  if (filePath === dir) return true;
  const prefix = dir.endsWith(sep) ? dir : dir + sep;
  return filePath.startsWith(prefix);
}

export function contentPolicyPlugin(dataDir: string): Plugin {
  const absDataDir = resolve(dataDir);

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

      const result = await loadContentPolicy(absDataDir);
      if ("errors" in result) {
        const msg =
          `Failed to load content policy from ${absDataDir}:\n` +
          result.errors.map(formatError).join("\n");
        return this.error(msg);
      }

      // ContentPolicy is JSON-safe by construction: schema.ts only permits
      // strings, arrays of strings, and records of those. If that ever changes,
      // this stringify becomes lossy/unsafe.
      return `export default ${JSON.stringify(result.data)};`;
    },

    async handleHotUpdate(ctx) {
      if (!isUnderDir(ctx.file, absDataDir) || !ctx.file.endsWith(".toml")) return;
      const mod = ctx.server.moduleGraph.getModuleById(RESOLVED_ID);
      if (!mod) return;
      ctx.server.moduleGraph.invalidateModule(mod);
      return [mod, ...ctx.modules];
    },
  };
}
