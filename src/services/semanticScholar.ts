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
}

export class SemanticScholarService {
  private static readonly BASE_URL = "https://api.semanticscholar.org/graph/v1";

  public static async fetchMetadataByDOI(
    doi: string,
  ): Promise<PaperMetadata | null> {
    try {
      const response = await Zotero.HTTP.request(
        "GET",
        `${this.BASE_URL}/paper/${encodeURIComponent(doi)}`,
        {
          headers: {
            Accept: "application/json",
          },
          responseType: "json",
        },
      );

      if (!response.status || response.status !== 200) {
        Zotero.debug(
          `[Metadata Scraper] Failed to fetch metadata: ${response.status}`,
        );
        return null;
      }

      const data = response.response as SemanticScholarResponse;
      return this.transformResponse(data);
    } catch (error) {
      Zotero.debug(`[Metadata Scraper] Error fetching metadata: ${error}`);
      return null;
    }
  }

  public static async fetchMetadataByTitle(
    title: string,
  ): Promise<PaperMetadata | null> {
    try {
      const queryParams = new URLSearchParams({
        query: title,
        limit: "1",
        fields: "title,abstract,year,venue,authors,citationCount",
      });

      const response = await Zotero.HTTP.request(
        "GET",
        `${this.BASE_URL}/paper/search?${queryParams.toString()}`,
        {
          headers: {
            Accept: "application/json",
          },
          responseType: "json",
        },
      );

      if (!response.status || response.status !== 200) {
        Zotero.debug(
          `[Metadata Scraper] Failed to fetch metadata: ${response.status}`,
        );
        return null;
      }

      const data = response.response;
      if (!data.data || !data.data.length) {
        return null;
      }

      return this.transformResponse(data.data[0]);
    } catch (error) {
      Zotero.debug(`[Metadata Scraper] Error fetching metadata: ${error}`);
      return null;
    }
  }

  private static transformResponse(
    data: SemanticScholarResponse,
  ): PaperMetadata {
    return {
      title: data.title,
      authors: data.authors.map((author) => ({
        name: author.name,
        authorId: author.authorId,
      })),
      abstract: data.abstract,
      year: data.year,
      venue: data.venue,
      doi: data.doi,
      citationCount: data.citationCount,
    };
  }
}
