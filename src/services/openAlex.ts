import * as bibtexParse from "@orcid/bibtex-parse-js";
import { RateLimitError, isRateLimitError } from "../utils/errors";

interface OpenAlexWork {
  id?: string;
  doi?: string;
  display_name?: string;
  publication_year?: number;
  type?: string;
  authorships?: Array<{ author: { display_name: string } }>;
  primary_location?: {
    source?: { display_name?: string; type?: string };
  };
  biblio?: {
    volume?: string;
    issue?: string;
    first_page?: string;
    last_page?: string;
  };
}

const OPENALEX_TYPE_MAP: Record<string, string> = {
  article: "article",
  "book-chapter": "incollection",
  "proceedings-article": "inproceedings",
  preprint: "misc",
  book: "book",
  report: "techreport",
  dataset: "misc",
  dissertation: "phdthesis",
  "review-article": "article",
  editorial: "article",
  letter: "article",
  standard: "techreport",
};

export class OpenAlexService {
  private static readonly BASE_URL = "https://api.openalex.org";

  public static async searchByTitle(title: string): Promise<bibtexParse.BibtexEntry[]> {
    const queryParams = new URLSearchParams({
      search: title,
      "per-page": "10",
      select: "id,doi,display_name,authorships,publication_year,primary_location,type,biblio",
    });

    let response: Awaited<ReturnType<typeof Zotero.HTTP.request>>;
    try {
      response = await Zotero.HTTP.request("GET", `${this.BASE_URL}/works?${queryParams.toString()}`, {
        headers: {
          Accept: "application/json",
          "User-Agent": "ZoteroMetadataScraper/1.0",
        },
        responseType: "json",
      });
    } catch (error) {
      if (isRateLimitError(error)) throw new RateLimitError("OpenAlex");
      ztoolkit.log("Network error fetching from OpenAlex:", error);
      throw error;
    }

    const works: OpenAlexWork[] = response.response?.results ?? [];
    return works.map((work) => this.parseWork(work));
  }

  private static parseWork(work: OpenAlexWork): bibtexParse.BibtexEntry {
    const entryType = OPENALEX_TYPE_MAP[work.type ?? ""] ?? "article";
    const authorStr = (work.authorships ?? []).map((a) => a.author.display_name).join(" and ");
    const doi = work.doi?.replace("https://doi.org/", "") ?? "";
    const venue = work.primary_location?.source?.display_name ?? "";
    const isConference = entryType === "inproceedings";
    const b = work.biblio ?? {};
    const pages = b.first_page ? (b.last_page ? `${b.first_page}-${b.last_page}` : b.first_page) : undefined;

    return {
      citationKey: work.id?.split("/").pop() ?? "unknown",
      entryType,
      entryTags: {
        title: work.display_name ?? "",
        author: authorStr,
        year: work.publication_year?.toString() ?? "",
        ...(isConference ? { booktitle: venue } : { journal: venue }),
        ...(b.volume ? { volume: b.volume } : {}),
        ...(b.issue ? { number: b.issue } : {}),
        ...(pages ? { pages } : {}),
        ...(doi ? { doi } : {}),
      },
    };
  }
}
