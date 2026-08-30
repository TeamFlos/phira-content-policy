import { pinyin } from "pinyin-pro";
import type { ContentPolicy } from "../src/data/schema.js";
import type { PinyinDocument, PinyinDocuments } from "../src/search/pinyinTypes.js";

interface PinyinSource {
  name: string;
  artist?: string;
  aliases?: readonly string[];
}

interface PinyinTokens {
  full: string[];
  initials: string[];
}

function normalizeRomanized(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[üǖǘǚǜ]/g, "v")
    .replace(/u:/g, "v")
    .normalize("NFD")
    .replace(/\p{Mark}/gu, "")
    .replace(/[^a-z0-9]/g, "");
}

function addCompactToken(target: Set<string>, parts: readonly string[]): void {
  const token = parts.map(normalizeRomanized).join("");
  if (token.length >= 2) target.add(token);
}

function pinyinTokens(value: string): PinyinTokens {
  const hanSegments = value.match(/\p{Script=Han}+/gu) ?? [];
  if (hanSegments.length === 0) return { full: [], initials: [] };

  const full = new Set<string>();
  const initials = new Set<string>();
  const options = {
    toneType: "none" as const,
    type: "array" as const,
    nonZh: "consecutive" as const,
    v: true,
  };

  addCompactToken(full, pinyin(value, options));
  addCompactToken(initials, pinyin(value, { ...options, pattern: "first" }));

  for (const segment of hanSegments) {
    const fullParts = pinyin(segment, options);
    const initialParts = pinyin(segment, { ...options, pattern: "first" });
    for (let index = 0; index < fullParts.length; index += 1) {
      addCompactToken(full, fullParts.slice(index));
      addCompactToken(initials, initialParts.slice(index));
    }
  }

  return { full: [...full], initials: [...initials] };
}

function mergeTokens(values: readonly string[]): PinyinTokens {
  const full = new Set<string>();
  const initials = new Set<string>();
  for (const value of values) {
    const tokens = pinyinTokens(value);
    tokens.full.forEach((token) => full.add(token));
    tokens.initials.forEach((token) => initials.add(token));
  }
  return { full: [...full], initials: [...initials] };
}

function documentFor(source: PinyinSource, id: number): PinyinDocument {
  const name = pinyinTokens(source.name);
  const artist = pinyinTokens(source.artist ?? "");
  const aliases = mergeTokens(source.aliases ?? []);
  return {
    id,
    nameFull: name.full.join(" "),
    nameInitials: name.initials.join(" "),
    artistFull: artist.full.join(" "),
    artistInitials: artist.initials.join(" "),
    aliasFull: aliases.full.join(" "),
    aliasInitials: aliases.initials.join(" "),
  };
}

export function buildPinyinDocuments(policy: ContentPolicy): PinyinDocuments {
  const trackSources: PinyinSource[] = [];
  for (const rightsHolder of Object.values(policy.rightsHolders)) {
    for (const track of rightsHolder.tracks) {
      trackSources.push({ name: track.name, artist: track.artist, aliases: track.aliases });
    }
  }
  for (const track of policy.independentTracks) {
    trackSources.push({ name: track.name, artist: track.artist, aliases: track.aliases });
  }

  return {
    tracks: trackSources.map(documentFor),
    rightsHolders: Object.values(policy.rightsHolders).map((rightsHolder, id) =>
      documentFor({ name: rightsHolder.policy.name }, id),
    ),
    artists: Object.values(policy.artists).map((artist, id) =>
      documentFor({ name: artist.name, aliases: artist.aliases }, id),
    ),
  };
}
