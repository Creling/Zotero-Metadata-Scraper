import * as bibtexParse from "@orcid/bibtex-parse-js";

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

export interface DBLPResult {
  title: string;
  authors?: string[];
  venue: string;
  year: string;
  doi?: string;
  url: string;
  type: string;
  pages?: string;
  volume?: string;
  number?: string;
  publisher?: string;
  series?: string;
  booktitle?: string;
  journal?: string;
  address?: string;
  month?: string;
  isbn?: string;
}

export class DBLPService {
  private static async fetchBibTeX(url: string): Promise<bibtexParse.BibtexEntry | null> {
    try {
      const bibUrl = `${url}.bib`;
      const response = await fetch(bibUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch BibTeX: ${response.statusText}`);
      }
      // const bibText = await response.text();
      const bibText = (await response.text())
        .replace(/[\n\r]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      const parsed = bibtexParse.toJSON(bibText);
      return parsed[0]; // DBLP always returns a single entry
    } catch (error) {
      console.error("Error fetching BibTeX:", error);
      return null;
    }
  }

  private static async parseHit(hit: any): Promise<bibtexParse.BibtexEntry> {
    const info = hit.info;
    ztoolkit.log("DBLP hit:", info);
    const bibData = await this.fetchBibTeX(info.url);

    if (bibData) {
      // ztoolkit.log("BibTeX data:", bibData);
      return bibData;
    }
    throw new Error("No BibTeX data found");
  }

  public static async searchByTitle(title: string): Promise<bibtexParse.BibtexEntry[]> {
    try {
      const encodedTitle = encodeURIComponent(title);
      const response = await fetch(`https://dblp.org/search/publ/api?q=${encodedTitle}&format=json`);

      if (!response.ok) {
        throw new Error(`DBLP API error: ${response.statusText}`);
      }

      const data = (await response.json()) as unknown as DBLPResponse;
      const hits = data.result?.hits?.hit || [];

      return Promise.all(hits.map((hit) => this.parseHit(hit)));
    } catch (error) {
      console.error("Error fetching from DBLP:", error);
      return [];
    }
  }
}
