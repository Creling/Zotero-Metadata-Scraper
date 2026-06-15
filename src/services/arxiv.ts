import * as bibtexParse from "@orcid/bibtex-parse-js";
import { RateLimitError } from "../utils/errors";

const ATOM_NS = "http://www.w3.org/2005/Atom";
const ARXIV_NS = "http://arxiv.org/schemas/atom";

function getText(el: Element, tag: string, ns: string): string {
  return el.getElementsByTagNameNS(ns, tag)[0]?.textContent?.trim() ?? "";
}

export class ArXivService {
  private static readonly BASE_URL = "https://export.arxiv.org/api/query";

  public static async searchByTitle(title: string): Promise<bibtexParse.BibtexEntry[]> {
    const queryParams = new URLSearchParams({
      search_query: `ti:${title}`,
      max_results: "10",
    });

    let response: Awaited<ReturnType<typeof Zotero.HTTP.request>>;
    try {
      response = await Zotero.HTTP.request("GET", `${this.BASE_URL}?${queryParams.toString()}`, {
        headers: { Accept: "application/atom+xml" },
        responseType: "document",
      });
    } catch (error) {
      if ((error as any)?.status === 429) throw new RateLimitError("arXiv");
      ztoolkit.log("Network error fetching from arXiv:", error);
      throw error;
    }

    const xmlDoc = response.response as XMLDocument;
    const entries = Array.from(xmlDoc.getElementsByTagNameNS(ATOM_NS, "entry"));
    return entries.map((entry) => this.parseEntry(entry)).filter(Boolean) as bibtexParse.BibtexEntry[];
  }

  private static parseEntry(entry: Element): bibtexParse.BibtexEntry | null {
    const title = getText(entry, "title", ATOM_NS).replace(/\s+/g, " ");
    if (!title) return null;

    const authors = Array.from(entry.getElementsByTagNameNS(ATOM_NS, "author"))
      .map((a) => getText(a, "name", ATOM_NS))
      .filter(Boolean)
      .join(" and ");

    const published = getText(entry, "published", ATOM_NS);
    const year = published ? new Date(published).getFullYear().toString() : "";

    const doi = getText(entry, "doi", ARXIV_NS);
    const journalRef = getText(entry, "journal_ref", ARXIV_NS);

    // arXiv abstract page URL from <id>
    const idUrl = getText(entry, "id", ATOM_NS);
    // Strip version suffix to get the canonical URL
    const url = idUrl.replace(/v\d+$/, "");
    const arxivId = url.split("/abs/").pop() ?? "";

    const isPublished = !!journalRef;

    return {
      citationKey: arxivId || title.slice(0, 20),
      entryType: isPublished ? "article" : "misc",
      entryTags: {
        title,
        author: authors,
        year,
        ...(isPublished ? { journal: journalRef } : { howpublished: `arXiv:${arxivId}` }),
        ...(doi ? { doi } : {}),
        url,
      },
    };
  }
}
