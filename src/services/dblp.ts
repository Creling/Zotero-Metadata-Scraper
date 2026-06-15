import * as bibtexParse from "@orcid/bibtex-parse-js";
import { RateLimitError, isRateLimitError } from "../utils/errors";

interface DBLPResponse {
  result: {
    hits: {
      hit: Array<{
        info: {
          title: string;
          authors?: {
            author: string[];
          };
          venue?: string;
          journal?: string;
          year?: string;
          doi?: string;
          url?: string;
          type?: string;
        };
      }>;
    };
  };
}

export class DBLPService {
  private static async fetchBibTeX(url: string): Promise<bibtexParse.BibtexEntry | null> {
    try {
      const response = await fetch(`${url}.bib`);
      if (!response.ok) return null;
      const bibText = (await response.text())
        .replace(/[\n\r]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      const parsed = bibtexParse.toJSON(bibText);
      return parsed[0] ?? null;
    } catch (error) {
      ztoolkit.log("Error fetching BibTeX from DBLP:", error);
      return null;
    }
  }

  private static async parseHit(hit: any): Promise<bibtexParse.BibtexEntry> {
    const info = hit.info;
    ztoolkit.log("DBLP hit:", info);
    const bibData = await this.fetchBibTeX(info.url);
    if (bibData) return bibData;
    throw new Error("No BibTeX data found");
  }

  public static async searchByTitle(title: string): Promise<bibtexParse.BibtexEntry[]> {
    const encodedTitle = encodeURIComponent(title);
    let response: Awaited<ReturnType<typeof Zotero.HTTP.request>>;
    try {
      response = await Zotero.HTTP.request("GET", `https://dblp.org/search/publ/api?q=${encodedTitle}&format=json`, {
        responseType: "json",
      });
    } catch (error) {
      if (isRateLimitError(error)) throw new RateLimitError("DBLP");
      ztoolkit.log("Network error fetching from DBLP:", error);
      throw error;
    }

    const hits = (response.response as DBLPResponse)?.result?.hits?.hit ?? [];
    const settled = await Promise.allSettled(hits.map((hit) => this.parseHit(hit)));
    return settled
      .filter((r): r is PromiseFulfilledResult<bibtexParse.BibtexEntry> => r.status === "fulfilled")
      .map((r) => r.value);
  }
}
