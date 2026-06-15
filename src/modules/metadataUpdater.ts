import { SearchResultDialog } from "./searchResultDialog";
import { METADATA_SOURCES, MetadataSource } from "../services/registry";
import { RateLimitError } from "../utils/errors";
import { getString } from "../utils/locale";
import * as bibtexParse from "@orcid/bibtex-parse-js";

export type { MetadataSource };

export class MetadataUpdater {
  public static async updateItemMetadata(item: Zotero.Item, source: MetadataSource = "dblp"): Promise<boolean> {
    const title = item.getField("title") as string;
    if (!title) return false;

    let results: bibtexParse.BibtexEntry[];
    try {
      results = await METADATA_SOURCES.find((s) => s.id === source)!.search(title);
    } catch (error) {
      const text =
        error instanceof RateLimitError ? getString("metadata-rate-limited") : getString("metadata-search-error");
      new ztoolkit.ProgressWindow(addon.data.config.addonName)
        .createLine({ text, type: "fail" })
        .show()
        .startCloseTimer(8000);
      ztoolkit.log("Search error:", error);
      return false;
    }

    if (results.length === 0) {
      new ztoolkit.ProgressWindow(addon.data.config.addonName)
        .createLine({ text: getString("metadata-no-results", { args: { title } }), type: "fail" })
        .show()
        .startCloseTimer(5000);
      return false;
    }

    const selected = await SearchResultDialog.show(results);
    if (!selected) return false;

    return this.updateFromBibtex(item, selected);
  }

  private static getZoteroItemType(bibtexType: string): string {
    const typeMap: { [key: string]: string } = {
      article: "journalArticle",
      inproceedings: "conferencePaper",
      incollection: "bookSection",
      phdthesis: "thesis",
      mastersthesis: "thesis",
      www: "webpage",
      manual: "document",
      techreport: "report",
      unpublished: "unpublished",
      dataset: "dataset",
      software: "software",
      patent: "patent",
      misc: "document",
    };

    return typeMap[bibtexType] || "journalArticle";
  }

  private static async updateJournalArticle(item: Zotero.Item, result: bibtexParse.BibtexEntry) {
    if (result.entryTags.journal) {
      item.setField("publicationTitle", result.entryTags.journal);
      item.setField("journalAbbreviation", result.entryTags.journal);
    }
    if (result.entryTags.issue) {
      item.setField("issue", result.entryTags.issue);
    }
  }

  private static async updateConferencePaper(item: Zotero.Item, result: bibtexParse.BibtexEntry) {
    if (result.entryTags.booktitle) {
      const proceedingsTitle = result.entryTags.booktitle.split(",")[0];
      if (!proceedingsTitle.startsWith("Proceedings of the")) {
        item.setField("proceedingsTitle", "Proceedings of the " + proceedingsTitle);
        item.setField("conferenceName", proceedingsTitle);
      } else {
        item.setField("proceedingsTitle", proceedingsTitle);
        item.setField("conferenceName", proceedingsTitle.replace("Proceedings of the ", ""));
      }
    }
  }

  public static async updateFromBibtex(item: Zotero.Item, result: bibtexParse.BibtexEntry): Promise<boolean> {
    try {
      ztoolkit.log("Updating item metadata:", item, result);

      const newType = this.getZoteroItemType(result.entryType);
      const itemTypeID = Zotero.ItemTypes.getID(newType);
      if (typeof itemTypeID === "number") {
        item.setType(itemTypeID);
      } else {
        throw new Error("Invalid item type ID");
      }

      if (result.entryTags.title) item.setField("title", result.entryTags.title);
      if (result.entryTags.year) item.setField("date", result.entryTags.year);
      if (result.entryTags.doi) item.setField("DOI", result.entryTags.doi);
      if (result.entryTags.url) item.setField("url", result.entryTags.url);
      if (result.entryTags.pages) item.setField("pages", result.entryTags.pages);
      if (result.entryTags.publisher) item.setField("publisher", result.entryTags.publisher);
      if (result.entryTags.address) item.setField("place", result.entryTags.address);
      if (result.entryTags.isbn) item.setField("ISBN", result.entryTags.isbn);
      if (result.entryTags.volume) item.setField("volume", result.entryTags.volume);
      if (result.entryTags.series) item.setField("series", result.entryTags.series);

      if (newType === "journalArticle") {
        await this.updateJournalArticle(item, result);
      } else if (newType === "conferencePaper") {
        await this.updateConferencePaper(item, result);
      }

      if (result.entryTags.author) {
        item.setCreators(
          result.entryTags.author.split(" and ").map((author) => ({
            firstName: author.split(" ").slice(0, -1).join(" "),
            lastName: author.split(" ").slice(-1)[0],
            creatorType: "author",
          })),
        );
      }

      await item.saveTx();
      return true;
    } catch (error) {
      ztoolkit.log("Error updating metadata:", error);
      return false;
    }
  }
}
