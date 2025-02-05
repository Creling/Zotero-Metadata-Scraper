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
  authors: Array<{
    authorId?: string;
    name: string;
  }>;
  doi?: string;
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
        fields: "title,abstract,venue,citationCount,citationStyles",
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
      const hits = data.data || [];

      return Promise.all(hits.map((hit: SemanticScholarResponse) => this.parseHit(hit)));
    } catch (error) {
      console.error("Error fetching from Semantic Scholar:", error);
      return [];
    }
  }

  private static parseHit(data: SemanticScholarResponse): bibtexParse.BibtexEntry {
    const bibText = data.citationStyles?.bibtex;
    if (bibText) {
      const parsed = bibtexParse.toJSON(bibText);
      return parsed[0];
    }

    throw new Error("No BibTeX data found");
  }
}
