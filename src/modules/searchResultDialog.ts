import { getString } from "../utils/locale";
import { DBLPResult } from "../services/dblp";

export class SearchResultDialog {
  public static async show(results: DBLPResult[]): Promise<DBLPResult | null> {
    return new Promise((resolve) => {
      ztoolkit.log("results");
      ztoolkit.log(results);
      const dialog = new ztoolkit.Dialog(3, 1)
        .setDialogData({
          selected: undefined as number | undefined,
        })
        .addCell(0, 0, {
          tag: "vbox",
          children: [
            {
              tag: "label",
              styles: {
                fontWeight: "bold",
                fontSize: "14px",
                margin: "10px 0",
              },
              properties: {
                value: getString("search-results"),
              },
            },
            {
              tag: "description",
              styles: {
                width: "600px",
                margin: "5px 0",
              },
              properties: {
                value: getString("select-result-description"),
              },
            },
            {
              tag: "richlistbox",
              namespace: "xul",
              styles: {
                width: "600px",
                maxHeight: "300px",
                margin: "10px 0",
              },
              attributes: {
                id: "results-list",
                flex: "1",
              },
              children: results.map((result, index) => ({
                tag: "richlistitem",
                namespace: "xul",
                children: [
                  {
                    tag: "vbox",
                    styles: {
                      padding: "5px",
                    },
                    children: [
                      {
                        tag: "label",
                        styles: {
                          fontWeight: "bold",
                        },
                        properties: {
                          value: result.title,
                        },
                      },
                      {
                        tag: "label",
                        styles: {
                          color: "#666",
                          marginTop: "2px",
                        },
                        properties: {
                          value: (result.authors ?? []).join(", "),
                        },
                      },
                      {
                        tag: "label",
                        styles: {
                          color: "#666",
                          marginTop: "2px",
                        },
                        properties: {
                          value: [
                            result.journal || result.booktitle || result.venue,
                            result.volume && `Vol. ${result.volume}`,
                            result.number && `No. ${result.number}`,
                            result.pages && `pp. ${result.pages}`,
                            result.year && `(${result.year})`,
                          ]
                            .filter(Boolean)
                            .join(", "),
                        },
                      },
                    ],
                  },
                ],
                attributes: {
                  selected: false,
                },
                listeners: [
                  {
                    type: "click",
                    listener: (event: Event) => {
                      const target = event.target as XULElement;
                      const richlistitem = target.closest("richlistitem");
                      if (!richlistitem) return;

                      const listbox = richlistitem.parentElement;
                      if (!listbox) return;

                      // Deselect all items
                      const items =
                        listbox.getElementsByTagName("richlistitem");
                      for (const item of items) {
                        item.setAttribute("selected", "false");
                      }

                      // Select clicked item
                      richlistitem.setAttribute("selected", "true");
                      dialog.dialogData.selected = index;
                    },
                  },
                ],
              })),
            },
          ],
        })
        .addButton(getString("confirm"), "confirm", {
          callback: () => {
            const selected = dialog.dialogData.selected;
            resolve(selected !== undefined ? results[selected] : null);
            dialog.window?.close();
          },
        })
        .addButton(getString("cancel"), "cancel", {
          callback: () => {
            resolve(null);
            dialog.window?.close();
          },
        })
        .open(getString("select-result"), {
          centerscreen: true,
        });
    });
  }
}
