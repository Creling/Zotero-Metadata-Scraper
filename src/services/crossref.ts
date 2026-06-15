import * as bibtexParse from "@orcid/bibtex-parse-js";
import { RateLimitError, isRateLimitError } from "../utils/errors";

interface CrossRefAuthor {
  given?: string;
  family?: string;
  name?: string;
}

interface CrossRefItem {
  DOI?: string;
  title?: string[];
  author?: CrossRefAuthor[];
  published?: { "date-parts": number[][] };
  type?: string;
  "container-title"?: string[];
  volume?: string;
  issue?: string;
  page?: string;
  ISBN?: string[];
  publisher?: string;
}

const CROSSREF_TYPE_MAP: Record<string, string> = {
  "journal-article": "article",
  "proceedings-article": "inproceedings",
  book: "book",
  "book-chapter": "incollection",
  monograph: "book",
  "edited-book": "book",
  "reference-book": "book",
  report: "techreport",
  dissertation: "phdthesis",
  "posted-content": "misc",
  dataset: "misc",
  "peer-review": "misc",
  standard: "techreport",
};

export class CrossRefService {
  private static readonly BASE_URL = "https://api.crossref.org";
  private static readonly USER_AGENT = "ZoteroMetadataScraper/1.0 (https://github.com/creling/zotero-metadata-scraper)";

  public static async searchByTitle(title: string): Promise<bibtexParse.BibtexEntry[]> {
    const queryParams = new URLSearchParams({
      "query.title": title,
      rows: "10",
      select: "DOI,title,author,published,type,container-title,volume,issue,page,ISBN,publisher",
    });

    let response: Awaited<ReturnType<typeof Zotero.HTTP.request>>;
    try {
      response = await Zotero.HTTP.request("GET", `${this.BASE_URL}/works?${queryParams.toString()}`, {
        headers: {
          Accept: "application/json",
          "User-Agent": this.USER_AGENT,
        },
        responseType: "json",
      });
    } catch (error) {
      if (isRateLimitError(error)) throw new RateLimitError("CrossRef");
      ztoolkit.log("Network error fetching from CrossRef:", error);
      throw error;
    }

    const items: CrossRefItem[] = response.response?.message?.items ?? [];
    return items.map((item) => this.parseItem(item));
  }

  private static parseItem(item: CrossRefItem): bibtexParse.BibtexEntry {
    const entryType = CROSSREF_TYPE_MAP[item.type ?? ""] ?? "article";
    const authorStr = (item.author ?? [])
      .map((a) => [a.given, a.family].filter(Boolean).join(" ") || a.name || "")
      .filter(Boolean)
      .join(" and ");
    const year = item.published?.["date-parts"]?.[0]?.[0]?.toString() ?? "";
    const venue = item["container-title"]?.[0] ?? "";
    const doi = item.DOI ?? "";
    const isConference = entryType === "inproceedings";

    return {
      citationKey: doi || item.title?.[0]?.slice(0, 20) || "unknown",
      entryType,
      entryTags: {
        title: item.title?.[0] ?? "",
        author: authorStr,
        year,
        ...(isConference ? { booktitle: venue } : { journal: venue }),
        ...(item.volume ? { volume: item.volume } : {}),
        ...(item.issue ? { number: item.issue } : {}),
        ...(item.page ? { pages: item.page } : {}),
        ...(item.publisher ? { publisher: item.publisher } : {}),
        ...(item.ISBN?.[0] ? { isbn: item.ISBN[0] } : {}),
        ...(doi ? { doi } : {}),
      },
    };
  }
}
