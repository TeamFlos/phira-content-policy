export interface PinyinDocument {
  id: number;
  nameFull: string;
  nameInitials: string;
  artistFull: string;
  artistInitials: string;
  aliasFull: string;
  aliasInitials: string;
}

export interface PinyinDocuments {
  tracks: PinyinDocument[];
  rightsHolders: PinyinDocument[];
  artists: PinyinDocument[];
}
