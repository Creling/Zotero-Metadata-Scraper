import * as bibtexParse from "@orcid/bibtex-parse-js";
import { getPref } from "../utils/prefs";

export interface Author {
  name: string;
  authorId?: string;
}

export interface PaperMetadata {
  title: string;
  authors: Author[];
  abstract?: string;
  year?: number;
  venue?: string;
  doi?: string;
  citationCount?: number;
  bibtex?: string;
}

export interface SemanticScholarResponse {
  paperId: string;
  title: string;
  abstract?: string;
  year?: number;
  venue?: string;
  authors?: Array<{
    authorId?: string;
    name: string;
  }>;
  externalIds?: {
    DOI?: string;
    ArXiv?: string;
    PubMed?: string;
    [key: string]: string | undefined;
  };
  citationCount?: number;
  citationStyles?: {
    bibtex: string;
  };
}

export class SemanticScholarService {
  private static readonly BASE_URL = "https://api.semanticscholar.org/graph/v1";

  public static async searchByTitle(title: string): Promise<bibtexParse.BibtexEntry[]> {
    try {
      const queryParams = new URLSearchParams({
        query: title,
        limit: "10",
        fields: "title,abstract,venue,year,authors,externalIds,citationCount,citationStyles",
      });

      const apiKey = getPref("semanticScholarAPIKey");
      const headers: Record<string, string> = {
        Accept: "application/json",
      };

      if (apiKey) {
        headers["x-api-key"] = apiKey;
      }

      const response = await Zotero.HTTP.request("GET", `${this.BASE_URL}/paper/search?${queryParams.toString()}`, {
        headers,
        responseType: "json",
      });

      if (!response.status || response.status !== 200) {
        throw new Error(`Semantic Scholar API error: ${response.status}`);
      }

      const data = response.response;
      const hits: SemanticScholarResponse[] = data.data || [];

      const settled = await Promise.allSettled(hits.map((hit) => this.parseHit(hit)));
      return settled
        .filter((r): r is PromiseFulfilledResult<bibtexParse.BibtexEntry> => r.status === "fulfilled")
        .map((r) => r.value);
    } catch (error) {
      ztoolkit.log("Error fetching from Semantic Scholar:", error);
      return [];
    }
  }

  private static parseHit(data: SemanticScholarResponse): bibtexParse.BibtexEntry {
    // Prefer the pre-formatted BibTeX when available
    const bibText = data.citationStyles?.bibtex;
    if (bibText) {
      const parsed = bibtexParse.toJSON(bibText);
      if (parsed[0]) return parsed[0];
    }

    // Fall back to constructing an entry from individual fields so papers
    // without citationStyles (working papers, reports, etc.) still appear
    const authorStr = (data.authors ?? []).map((a) => a.name).join(" and ");
    const doi = data.externalIds?.DOI;
    const citationKey = data.paperId ?? data.title?.slice(0, 20) ?? "unknown";

    return {
      citationKey,
      entryType: "article",
      entryTags: {
        title: data.title ?? "",
        author: authorStr,
        year: data.year?.toString() ?? "",
        journal: data.venue ?? "",
        ...(doi ? { doi } : {}),
      },
    };
  }
}
