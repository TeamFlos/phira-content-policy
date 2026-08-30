import type { Artist, ContentPolicy, RightsHolderPolicy, Status, TrackEntry } from "../data/schema";

/** forbidden 最严，free 最松；用于综合判定取最严格者 */
export function severity(s: Status): number {
  switch (s) {
    case "forbidden":
      return 2;
    case "restricted":
      return 1;
    case "free":
      return 0;
    default: {
      const _exhaustive: never = s;
      return _exhaustive;
    }
  }
}

function strictest(statuses: readonly Status[]): Status {
  let pick: Status = "free";
  for (const s of statuses) {
    if (severity(s) > severity(pick)) pick = s;
  }
  return pick;
}

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

export type TrackOrigin =
  | { kind: "rights_holder"; id: string; policy: RightsHolderPolicy }
  | { kind: "independent" };

interface IndexedTrack {
  track: TrackEntry;
  origin: TrackOrigin;
  nameNormalized: string;
  artistNormalized: string;
  aliasesNormalized: string[];
  addedAt: string;
  catalogSize: number;
}

interface IndexedRightsHolder {
  id: string;
  policy: RightsHolderPolicy;
  trackCount: number;
  nameNormalized: string;
  addedAt: string;
}

interface IndexedArtist {
  id: string;
  artist: Artist;
  nameNormalized: string;
  aliasesNormalized: string[];
  addedAt: string;
  trackCount: number;
}

export interface SearchIndex {
  policy: ContentPolicy;
  tracks: IndexedTrack[];
  rightsHolders: IndexedRightsHolder[];
  artists: IndexedArtist[];
  stats: { tracks: number; rightsHolders: number; artists: number };
}

export interface EntryMetadata {
  tracks: Record<string, string>;
  rightsHolders: Record<string, string>;
  artists: Record<string, string>;
}

function trackMetadataKey(origin: TrackOrigin, name: string, artist: string): string {
  return JSON.stringify([
    origin.kind,
    origin.kind === "rights_holder" ? origin.id : "",
    name,
    artist,
  ]);
}

export function buildIndex(policy: ContentPolicy, metadata?: EntryMetadata): SearchIndex {
  const tracks: IndexedTrack[] = [];
  const rightsHolders: IndexedRightsHolder[] = [];
  const artists: IndexedArtist[] = [];

  for (const [id, rh] of Object.entries(policy.rightsHolders)) {
    rightsHolders.push({
      id,
      policy: rh.policy,
      trackCount: rh.tracks.length,
      nameNormalized: normalize(rh.policy.name),
      addedAt: metadata?.rightsHolders[id] ?? "",
    });
    for (const track of rh.tracks) {
      const origin = { kind: "rights_holder" as const, id, policy: rh.policy };
      tracks.push({
        track,
        origin,
        nameNormalized: normalize(track.name),
        artistNormalized: normalize(track.artist),
        aliasesNormalized: (track.aliases ?? []).map(normalize),
        addedAt: metadata?.tracks[trackMetadataKey(origin, track.name, track.artist)] ?? "",
        catalogSize: rh.tracks.length,
      });
    }
  }

  for (const track of policy.independentTracks) {
    const origin = { kind: "independent" as const };
    tracks.push({
      track,
      origin,
      nameNormalized: normalize(track.name),
      artistNormalized: normalize(track.artist),
      aliasesNormalized: (track.aliases ?? []).map(normalize),
      addedAt: metadata?.tracks[trackMetadataKey(origin, track.name, track.artist)] ?? "",
      catalogSize: 1,
    });
  }

  for (const [id, artist] of Object.entries(policy.artists)) {
    artists.push({
      id,
      artist,
      nameNormalized: normalize(artist.name),
      aliasesNormalized: (artist.aliases ?? []).map(normalize),
      addedAt: metadata?.artists[id] ?? "",
      trackCount: tracks.filter((track) => (track.track.artistIds ?? []).includes(id)).length,
    });
  }

  return {
    policy,
    tracks,
    rightsHolders,
    artists,
    stats: {
      tracks: tracks.length,
      rightsHolders: rightsHolders.length,
      artists: artists.length,
    },
  };
}

/** 关联到的艺人条目：若 artistIds 在 policy.artists 中存在则返回 artist，否则 artist 为 null */
export interface LinkedArtist {
  id: string;
  artist: Artist | null;
}

export type TrackMatchField = "name" | "artist" | "alias";

export interface TrackHit {
  track: TrackEntry;
  origin: TrackOrigin;
  matchedOn: readonly TrackMatchField[];
  linkedArtists: readonly LinkedArtist[];
  /** 综合判定（forbidden > restricted > free 取最严） */
  composite: Status;
  addedAt: string;
  catalogSize: number;
}

export interface RightsHolderHit {
  id: string;
  policy: RightsHolderPolicy;
  trackCount: number;
  addedAt: string;
  tracks: readonly TrackEntry[];
}

export interface ArtistHit {
  id: string;
  artist: Artist;
  trackCount: number;
  addedAt: string;
  tracks: readonly TrackEntry[];
}

export interface SearchResults {
  query: string;
  /** query 为空时为 true，前端用以决定首屏状态 */
  isEmpty: boolean;
  isBrowsing: boolean;
  hasResults: boolean;
  tracks: readonly TrackHit[];
  rightsHolders: readonly RightsHolderHit[];
  artists: readonly ArtistHit[];
}

export type ResultKind = "all" | "tracks" | "rightsHolders" | "artists";
export type SortMode =
  | "count"
  | "countAsc"
  | "name"
  | "nameDesc"
  | "addedAt"
  | "addedAtAsc"
  | "severity"
  | "severityAsc";

export interface SearchOptions {
  browse: boolean;
  kind: ResultKind;
  status: Status | "all";
  sort: SortMode;
}

function resolveLinkedArtists(ids: readonly string[], policy: ContentPolicy): LinkedArtist[] {
  return ids.map((id) => {
    // policy.artists is typed as Record<string, Artist> without noUncheckedIndexedAccess,
    // so the lookup is implicitly typed Artist. The ?? null is load-bearing at runtime.
    const a: Artist | undefined = policy.artists[id];
    return { id, artist: a ?? null };
  });
}

function compositeStatus(
  track: TrackEntry,
  origin: TrackOrigin,
  linked: readonly LinkedArtist[],
): Status {
  const statuses: Status[] = [];
  if (track.status) statuses.push(track.status);
  if (origin.kind === "rights_holder") statuses.push(origin.policy.status);
  for (const la of linked) {
    if (la.artist) statuses.push(la.artist.status);
  }
  return strictest(statuses);
}

// 排序固定到一个 locale，避免跨浏览器 CJK/Latin 混排顺序漂移。
// "zh-Hans" 与 UI 语言一致，Chinese collation 对本数据集（中日英混合）是合理默认。
const NAME_COLLATOR = new Intl.Collator("zh-Hans");

function bySeverityThenName<T>(
  severityOf: (t: T) => Status,
  nameOf: (t: T) => string,
): (a: T, b: T) => number {
  return (a, b) => {
    const d = severity(severityOf(b)) - severity(severityOf(a));
    return d !== 0 ? d : NAME_COLLATOR.compare(nameOf(a), nameOf(b));
  };
}

export function search(
  index: SearchIndex,
  rawQuery: string,
  options: SearchOptions = { browse: false, kind: "all", status: "all", sort: "count" },
): SearchResults {
  const q = normalize(rawQuery);
  if (q === "" && !options.browse) {
    return {
      query: rawQuery,
      isEmpty: true,
      isBrowsing: false,
      hasResults: false,
      tracks: [],
      rightsHolders: [],
      artists: [],
    };
  }

  const trackHits: TrackHit[] = [];
  if (options.kind === "all" || options.kind === "tracks")
    for (const it of index.tracks) {
      const matchedOn: TrackMatchField[] = [];
      if (q !== "") {
        if (it.nameNormalized.includes(q)) matchedOn.push("name");
        if (it.artistNormalized.includes(q)) matchedOn.push("artist");
        if (it.aliasesNormalized.some((a) => a.includes(q))) matchedOn.push("alias");
        if (matchedOn.length === 0) continue;
      }
      const linked = resolveLinkedArtists(it.track.artistIds ?? [], index.policy);
      const composite = compositeStatus(it.track, it.origin, linked);
      if (options.status !== "all" && composite !== options.status) continue;
      trackHits.push({
        track: it.track,
        origin: it.origin,
        matchedOn,
        linkedArtists: linked,
        composite,
        addedAt: it.addedAt,
        catalogSize: it.catalogSize,
      });
    }

  const rhHits: RightsHolderHit[] = [];
  if (options.kind === "all" || options.kind === "rightsHolders")
    for (const ir of index.rightsHolders) {
      if (q !== "" && !ir.nameNormalized.includes(q)) continue;
      if (options.status !== "all" && ir.policy.status !== options.status) continue;
      rhHits.push({
        id: ir.id,
        policy: ir.policy,
        trackCount: ir.trackCount,
        addedAt: ir.addedAt,
        tracks: index.policy.rightsHolders[ir.id]?.tracks ?? [],
      });
    }

  const artistHits: ArtistHit[] = [];
  if (options.kind === "all" || options.kind === "artists")
    for (const ia of index.artists) {
      if (
        q !== "" &&
        !ia.nameNormalized.includes(q) &&
        !ia.aliasesNormalized.some((a) => a.includes(q))
      )
        continue;
      if (options.status !== "all" && ia.artist.status !== options.status) continue;
      artistHits.push({
        id: ia.id,
        artist: ia.artist,
        trackCount: ia.trackCount,
        addedAt: ia.addedAt,
        tracks: index.tracks
          .filter((track) => (track.track.artistIds ?? []).includes(ia.id))
          .map((track) => track.track),
      });
    }

  const compare =
    <T>(
      countOf: (item: T) => number,
      nameOf: (item: T) => string,
      dateOf: (item: T) => string,
      statusOf: (item: T) => Status,
    ) =>
    (a: T, b: T): number => {
      if (options.sort === "name") return NAME_COLLATOR.compare(nameOf(a), nameOf(b));
      if (options.sort === "nameDesc") return NAME_COLLATOR.compare(nameOf(b), nameOf(a));
      if (options.sort === "addedAt") {
        const dateDiff = dateOf(b).localeCompare(dateOf(a));
        return dateDiff || NAME_COLLATOR.compare(nameOf(a), nameOf(b));
      }
      if (options.sort === "addedAtAsc") {
        const dateDiff = dateOf(a).localeCompare(dateOf(b));
        return dateDiff || NAME_COLLATOR.compare(nameOf(a), nameOf(b));
      }
      if (options.sort === "severity") return bySeverityThenName(statusOf, nameOf)(a, b);
      if (options.sort === "severityAsc") {
        const severityDiff = severity(statusOf(a)) - severity(statusOf(b));
        return severityDiff || NAME_COLLATOR.compare(nameOf(a), nameOf(b));
      }
      const countDiff =
        options.sort === "countAsc" ? countOf(a) - countOf(b) : countOf(b) - countOf(a);
      return countDiff || bySeverityThenName(statusOf, nameOf)(a, b);
    };

  trackHits.sort(
    compare(
      (h) => h.catalogSize,
      (h) => h.track.name,
      (h) => h.addedAt,
      (h) => h.composite,
    ),
  );
  rhHits.sort(
    compare(
      (h) => h.trackCount,
      (h) => h.policy.name,
      (h) => h.addedAt,
      (h) => h.policy.status,
    ),
  );
  artistHits.sort(
    compare(
      (h) => h.trackCount,
      (h) => h.artist.name,
      (h) => h.addedAt,
      (h) => h.artist.status,
    ),
  );

  return {
    query: rawQuery,
    isEmpty: false,
    isBrowsing: q === "",
    hasResults: trackHits.length + rhHits.length + artistHits.length > 0,
    tracks: trackHits,
    rightsHolders: rhHits,
    artists: artistHits,
  };
}
