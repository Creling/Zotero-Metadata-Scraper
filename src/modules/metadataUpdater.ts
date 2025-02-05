import { DBLPResult, DBLPService } from "../services/dblp";
import { SearchResultDialog } from "./searchResultDialog";
import { SemanticScholarService } from "../services/semanticScholar";

export class MetadataUpdater {
  public static async updateItemMetadata(
    item: Zotero.Item,
    source: "dblp" | "semantic-scholar" = "dblp",
  ): Promise<boolean> {
    const title = item.getField("title") as string;
    if (!title) return false;

    if (source === "dblp") {
      const results = await DBLPService.searchByTitle(title);
      if (results.length === 0) return false;

      const selected = await SearchResultDialog.show(results);
      if (!selected) return false;

      return this.updateFromDBLP(item, selected);
    } else {
      // Use Semantic Scholar implementation
      const result = await SemanticScholarService.fetchMetadataByTitle(title);
      if (!result) return false;

      // Update metadata from Semantic Scholar
      item.setField("title", result.title);
      if (result.year) {
        item.setField("year", result.year.toString());
      }
      if (result.venue) {
        item.setField("publicationTitle", result.venue);
      }
      if (result.doi) {
        item.setField("DOI", result.doi);
      }
      if (result.abstract) {
        item.setField("abstractNote", result.abstract);
      }

      // Update creators (authors)
      item.setCreators(
        result.authors.map((author) => {
          const nameParts = author.name.split(" ");
          return {
            firstName: nameParts.slice(0, -1).join(" "),
            lastName: nameParts.slice(-1)[0],
            creatorType: "author",
          };
        }),
      );

      await item.saveTx();
      return true;
    }
  }

  private static getZoteroItemType(dblpType: string): string {
    const typeMap: { [key: string]: string } = {
      "Journal Articles": "journalArticle",
      "Conference and Workshop Papers": "conferencePaper",
    };

    return typeMap[dblpType] || "journalArticle"; // Default to journalArticle if type is unknown
  }

  public static async updateFromDBLP(
    item: Zotero.Item,
    result: DBLPResult,
  ): Promise<boolean> {
    try {
      ztoolkit.log("Updating item metadata from DBLP:", item, result);

      // Update item type first
      const newType = this.getZoteroItemType(result.type);
      const itemTypeID = Zotero.ItemTypes.getID(newType);
      if (typeof itemTypeID === "number") {
        item.setType(itemTypeID);
      } else {
        throw new Error("Invalid item type ID");
      }
      Zotero.ItemTypes.getID("journalArticle");

      // Update basic metadata
      item.setField("title", result.title);
      if (result.year) {
        item.setField("date", result.year);
      }
      if (result.booktitle) {
        item.setField("proceedingsTitle", result.booktitle);
        item.setField("conferenceName", result.booktitle);
      }
      if (result.journal) {
        item.setField("journalAbbreviation", result.journal);
      }
      if (result.doi) {
        item.setField("DOI", result.doi);
      }
      if (result.url) {
        item.setField("url", result.url);
      }
      if (result.pages) {
        item.setField("pages", result.pages);
      }
      if (result.volume) {
        item.setField("volume", result.volume);
      }
      if (result.number) {
        item.setField("issue", result.number);
      }
      if (result.publisher) {
        item.setField("publisher", result.publisher);
      }
      if (result.series) {
        item.setField("series", result.series);
      }
      if (result.address) {
        item.setField("place", result.address);
      }
      if (result.isbn) {
        item.setField("ISBN", result.isbn);
      }

      // Update creators (authors)
      if (result.authors) {
        item.setCreators(
          result.authors.map((author) => ({
            firstName: author.split(" ").slice(0, -1).join(" "),
            lastName: author.split(" ").slice(-1)[0],
            creatorType: "author",
          })),
        );
      }

      await item.saveTx();
      return true;
    } catch (error) {
      ztoolkit.log("Error updating metadata from DBLP:", error);
      return false;
    }
  }
}
