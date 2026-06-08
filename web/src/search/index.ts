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
}

interface IndexedRightsHolder {
  id: string;
  policy: RightsHolderPolicy;
  trackCount: number;
  nameNormalized: string;
}

interface IndexedArtist {
  id: string;
  artist: Artist;
  nameNormalized: string;
  aliasesNormalized: string[];
}

export interface SearchIndex {
  policy: ContentPolicy;
  tracks: IndexedTrack[];
  rightsHolders: IndexedRightsHolder[];
  artists: IndexedArtist[];
  stats: { tracks: number; rightsHolders: number; artists: number };
}

export function buildIndex(policy: ContentPolicy): SearchIndex {
  const tracks: IndexedTrack[] = [];
  const rightsHolders: IndexedRightsHolder[] = [];
  const artists: IndexedArtist[] = [];

  for (const [id, rh] of Object.entries(policy.rightsHolders)) {
    rightsHolders.push({
      id,
      policy: rh.policy,
      trackCount: rh.tracks.length,
      nameNormalized: normalize(rh.policy.name),
    });
    for (const track of rh.tracks) {
      tracks.push({
        track,
        origin: { kind: "rights_holder", id, policy: rh.policy },
        nameNormalized: normalize(track.name),
        artistNormalized: normalize(track.artist),
        aliasesNormalized: (track.aliases ?? []).map(normalize),
      });
    }
  }

  for (const track of policy.independentTracks) {
    tracks.push({
      track,
      origin: { kind: "independent" },
      nameNormalized: normalize(track.name),
      artistNormalized: normalize(track.artist),
      aliasesNormalized: (track.aliases ?? []).map(normalize),
    });
  }

  for (const [id, artist] of Object.entries(policy.artists)) {
    artists.push({
      id,
      artist,
      nameNormalized: normalize(artist.name),
      aliasesNormalized: (artist.aliases ?? []).map(normalize),
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
}

export interface RightsHolderHit {
  id: string;
  policy: RightsHolderPolicy;
  trackCount: number;
}

export interface ArtistHit {
  id: string;
  artist: Artist;
}

export interface SearchResults {
  query: string;
  /** query 为空时为 true，前端用以决定首屏状态 */
  isEmpty: boolean;
  hasResults: boolean;
  tracks: readonly TrackHit[];
  rightsHolders: readonly RightsHolderHit[];
  artists: readonly ArtistHit[];
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
  const statuses: Status[] = [track.status];
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

export function search(index: SearchIndex, rawQuery: string): SearchResults {
  const q = normalize(rawQuery);
  if (q === "") {
    return {
      query: rawQuery,
      isEmpty: true,
      hasResults: false,
      tracks: [],
      rightsHolders: [],
      artists: [],
    };
  }

  const trackHits: TrackHit[] = [];
  for (const it of index.tracks) {
    const matchedOn: TrackMatchField[] = [];
    if (it.nameNormalized.includes(q)) matchedOn.push("name");
    if (it.artistNormalized.includes(q)) matchedOn.push("artist");
    if (it.aliasesNormalized.some((a) => a.includes(q))) matchedOn.push("alias");
    if (matchedOn.length === 0) continue;
    const linked = resolveLinkedArtists(it.track.artistIds ?? [], index.policy);
    const composite = compositeStatus(it.track, it.origin, linked);
    trackHits.push({
      track: it.track,
      origin: it.origin,
      matchedOn,
      linkedArtists: linked,
      composite,
    });
  }

  const rhHits: RightsHolderHit[] = [];
  for (const ir of index.rightsHolders) {
    if (!ir.nameNormalized.includes(q)) continue;
    rhHits.push({ id: ir.id, policy: ir.policy, trackCount: ir.trackCount });
  }

  const artistHits: ArtistHit[] = [];
  for (const ia of index.artists) {
    if (!ia.nameNormalized.includes(q) && !ia.aliasesNormalized.some((a) => a.includes(q))) continue;
    artistHits.push({ id: ia.id, artist: ia.artist });
  }

  trackHits.sort(
    bySeverityThenName(
      (h) => h.composite,
      (h) => h.track.name,
    ),
  );
  rhHits.sort(
    bySeverityThenName(
      (h) => h.policy.status,
      (h) => h.policy.name,
    ),
  );
  artistHits.sort(
    bySeverityThenName(
      (h) => h.artist.status,
      (h) => h.artist.name,
    ),
  );

  return {
    query: rawQuery,
    isEmpty: false,
    hasResults: trackHits.length + rhHits.length + artistHits.length > 0,
    tracks: trackHits,
    rightsHolders: rhHits,
    artists: artistHits,
  };
}
