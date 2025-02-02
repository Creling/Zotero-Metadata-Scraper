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
  private static async fetchBibTeX(url: string): Promise<any> {
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

  private static async parseHit(hit: any): Promise<DBLPResult> {
    const info = hit.info;
    ztoolkit.log("DBLP hit:", info);
    const bibData = await this.fetchBibTeX(info.url);

    interface HitInfo {
      title: string;
      authors?: {
        author: Array<{ text: string }>;
      };
      venue?: string;
      journal?: string;
      year?: string;
      doi?: string;
      url?: string;
      type?: string;
    }

    interface BibTeXEntryTags {
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

    const result: DBLPResult = {
      title: info.title,
      venue: info.venue || info.journal || "",
      year: info.year || "",
      doi: info.doi,
      url: info.url || "",
      type: info.type || "",
    };

    if (bibData) {
      // Add additional fields from BibTeX
      const entryTags = bibData.entryTags;
      ztoolkit.log("BibTeX entry tags:", entryTags);
      if (entryTags.author) result.authors = entryTags.author.split(" and ");
      if (entryTags.pages) result.pages = entryTags.pages;
      if (entryTags.volume) result.volume = entryTags.volume;
      if (entryTags.number) result.number = entryTags.number;
      if (entryTags.publisher) result.publisher = entryTags.publisher;
      if (entryTags.series) result.series = entryTags.series;
      if (entryTags.booktitle) result.booktitle = entryTags.booktitle;
      if (entryTags.journal) result.journal = entryTags.journal;
      if (entryTags.address) result.address = entryTags.address;
      if (entryTags.month) result.month = entryTags.month;
      if (entryTags.isbn) result.isbn = entryTags.isbn;
    }

    return result;
  }

  public static async searchByTitle(title: string): Promise<DBLPResult[]> {
    try {
      const encodedTitle = encodeURIComponent(title);
      const response = await fetch(
        `https://dblp.org/search/publ/api?q=${encodedTitle}&format=json`,
      );

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
