declare module "virtual:content-policy" {
  import type { ContentPolicy } from "../data/schema";
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
  const data: ContentPolicy;
  export default data;
}
