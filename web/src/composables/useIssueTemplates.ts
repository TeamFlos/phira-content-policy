import { onMounted, ref } from "vue";
import { issueTemplates as bundledTemplates } from "virtual:content-policy";

type IssueTemplate = (typeof bundledTemplates)[number];

interface GitHubContentEntry {
  name?: unknown;
  type?: unknown;
}

const API_URL =
  "https://api.github.com/repos/TeamFlos/phira-content-policy/contents/.github/ISSUE_TEMPLATE?ref=main";
const RAW_BASE_URL =
  "https://raw.githubusercontent.com/TeamFlos/phira-content-policy/main/.github/ISSUE_TEMPLATE/";

function parseYamlScalar(raw: string): string {
  const value = raw.trim();
  if (value.startsWith('"') && value.endsWith('"')) {
    try {
      return JSON.parse(value) as string;
    } catch {
      return value.slice(1, -1);
    }
  }
  if (value.startsWith("'") && value.endsWith("'")) return value.slice(1, -1).replace(/''/g, "'");
  return value;
}

function parseTemplate(fileName: string, source: string): IssueTemplate | null {
  const name = source.match(/^name:\s*(.+)$/m)?.[1];
  if (!name) return null;
  const description = source.match(/^description:\s*(.+)$/m)?.[1] ?? "";
  const stem = fileName.replace(/\.ya?ml$/i, "");
  const locale = stem.endsWith("-zh") ? "zh" : stem.endsWith("-en") ? "en" : "other";
  return {
    fileName,
    name: parseYamlScalar(name),
    description: parseYamlScalar(description),
    locale,
  };
}

async function fetchLatestTemplates(): Promise<IssueTemplate[]> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 5000);
  try {
    const directoryResponse = await fetch(API_URL, {
      headers: { Accept: "application/vnd.github+json" },
      mode: "cors",
      signal: controller.signal,
    });
    if (!directoryResponse.ok) throw new Error(`GitHub returned ${directoryResponse.status}`);

    const entries: unknown = await directoryResponse.json();
    if (!Array.isArray(entries)) throw new Error("GitHub returned an invalid template list");

    const files = entries.filter((entry): entry is GitHubContentEntry => {
      if (!entry || typeof entry !== "object") return false;
      const candidate = entry as GitHubContentEntry;
      return (
        candidate.type === "file" &&
        typeof candidate.name === "string" &&
        /\.ya?ml$/i.test(candidate.name)
      );
    });

    const loaded = await Promise.all(
      files.map(async (entry) => {
        try {
          const fileName = entry.name as string;
          const response = await fetch(`${RAW_BASE_URL}${encodeURIComponent(fileName)}`, {
            mode: "cors",
            signal: controller.signal,
          });
          if (!response.ok) return null;
          return parseTemplate(fileName, await response.text());
        } catch {
          return null;
        }
      }),
    );
    const templates = loaded.filter((template): template is IssueTemplate => template !== null);
    if (templates.length === 0) throw new Error("No readable issue templates");
    return templates.sort((a, b) => a.fileName.localeCompare(b.fileName));
  } finally {
    window.clearTimeout(timeout);
  }
}

export function useIssueTemplates() {
  const templates = ref<IssueTemplate[]>([...bundledTemplates]);
  const isLoading = ref(false);

  async function refresh(): Promise<void> {
    isLoading.value = true;
    try {
      templates.value = await fetchLatestTemplates();
    } catch {
      // The build-time snapshot remains available when GitHub is slow, rate-limited, or unreachable.
    } finally {
      isLoading.value = false;
    }
  }

  onMounted(() => {
    const idleWindow = window as Window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
    };
    if (idleWindow.requestIdleCallback) {
      idleWindow.requestIdleCallback(() => void refresh(), { timeout: 1500 });
    } else {
      window.setTimeout(() => void refresh(), 0);
    }
  });

  return { templates, isLoading };
}
