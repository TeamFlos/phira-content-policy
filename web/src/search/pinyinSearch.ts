import MiniSearch, { type SearchResult } from "minisearch";
import type { PinyinDocument } from "./pinyinTypes";

export type PinyinMatchField = "name" | "artist" | "alias";

export interface PinyinSearchMatches {
  direct: ReadonlyMap<number, ReadonlySet<PinyinMatchField>>;
  fuzzy: ReadonlyMap<number, ReadonlySet<PinyinMatchField>>;
}

const fullFields = ["nameFull", "artistFull", "aliasFull"] as const;
const initialFields = ["nameInitials", "artistInitials", "aliasInitials"] as const;
const allFields = [...fullFields, ...initialFields];

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

export function normalizePinyinQuery(value: string): string {
  return normalizeRomanized(value);
}

function matchField(field: string): PinyinMatchField | undefined {
  if (field.startsWith("name")) return "name";
  if (field.startsWith("artist")) return "artist";
  if (field.startsWith("alias")) return "alias";
  return undefined;
}

function collectMatches(
  results: readonly SearchResult[],
  matches: Map<number, Set<PinyinMatchField>>,
): void {
  for (const result of results) {
    const id = Number(result.id);
    const fields = matches.get(id) ?? new Set<PinyinMatchField>();
    for (const matchedFields of Object.values(result.match)) {
      for (const field of matchedFields) {
        const mapped = matchField(field);
        if (mapped) fields.add(mapped);
      }
    }
    if (fields.size > 0) matches.set(id, fields);
  }
}

export class PinyinSearchIndex {
  private readonly miniSearch: MiniSearch<PinyinDocument>;

  constructor(documents: readonly PinyinDocument[]) {
    this.miniSearch = new MiniSearch<PinyinDocument>({
      idField: "id",
      fields: allFields,
      tokenize: (text) => text.split(/\s+/).filter(Boolean),
      processTerm: (term) => term.toLowerCase(),
    });
    this.miniSearch.addAll(documents);
  }

  search(rawQuery: string): PinyinSearchMatches {
    const query = normalizePinyinQuery(rawQuery);
    if (query.length < 2) return { direct: new Map(), fuzzy: new Map() };

    const direct = new Map<number, Set<PinyinMatchField>>();
    collectMatches(
      this.miniSearch.search(query, {
        fields: [...fullFields],
        prefix: true,
        fuzzy: false,
      }),
      direct,
    );
    collectMatches(
      this.miniSearch.search(query, {
        fields: [...initialFields],
        prefix: true,
        fuzzy: false,
      }),
      direct,
    );

    const fuzzy = new Map<number, Set<PinyinMatchField>>();
    if (query.length >= 4) {
      collectMatches(
        this.miniSearch.search(query, {
          fields: [...fullFields],
          prefix: false,
          fuzzy: 0.25,
          maxFuzzy: 2,
          weights: { prefix: 0.85, fuzzy: 0.45 },
          filter: (result) =>
            result.terms.some((term) => Math.abs(term.length - query.length) <= 1),
        }),
        fuzzy,
      );
    }

    return { direct, fuzzy };
  }
}
