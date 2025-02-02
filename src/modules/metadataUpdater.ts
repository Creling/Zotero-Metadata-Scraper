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

      // if (results.length === 1) {
      //   return this.updateFromDBLP(item, results[0]);
      // }

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
      Zotero.ItemTypes.getID("journalArticle");
      const newType = this.getZoteroItemType(result.type);
      ztoolkit.log("New item type:", newType);
      if (item.itemType !== newType) {
        const newItem = new Zotero.Item(
          newType as _ZoteroTypes.Item.ItemTypeMapping[keyof _ZoteroTypes.Item.ItemTypeMapping],
        );
        // Copy fields that both types have in common
        const fields = Object.keys(item.toJSON());
        for (const field of fields) {
          if (field !== "itemType" && field !== "creators") {
            try {
              const value = item.getField(field);
              if (value) {
                newItem.setField(field, value);
              }
            } catch (e) {
              // Skip fields that don't exist in the new type
              continue;
            }
          }
        }
        // Copy creators
        const creators = item.getCreators();
        if (creators.length > 0) {
          newItem.setCreators(creators);
        }
        // Save new item and remove old one
        await newItem.saveTx();
        await item.eraseTx();
        item = newItem;
      }

      // Update basic metadata
      item.setField("title", result.title);
      if (result.year) {
        item.setField("date", result.year);
      }
      if (result.venue) {
        item.setField("publicationTitle", result.venue);
      }
      if (result.journal) {
        item.setField("publicationTitle", result.journal);
      }
      if (result.booktitle) {
        item.setField("proceedingsTitle", result.booktitle);
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
      console.error("Error updating metadata from DBLP:", error);
      return false;
    }
  }
}
