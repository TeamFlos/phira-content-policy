declare module "virtual:content-policy" {
  import type { ContentPolicy } from "../data/schema";
  import type { PinyinDocuments } from "../search/pinyinTypes";
  export const metadata: {
    tracks: Record<string, string>;
    rightsHolders: Record<string, string>;
    artists: Record<string, string>;
  };
  export const issueTemplates: readonly {
    fileName: string;
    name: string;
    description: string;
    locale: "zh" | "en" | "other";
  }[];
  export const pinyinDocuments: PinyinDocuments;
  const data: ContentPolicy;
  export default data;
}
