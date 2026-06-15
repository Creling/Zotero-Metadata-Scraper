import { getString } from "../utils/locale";
import { MetadataSource, MetadataUpdater } from "./metadataUpdater";

export class MetadataUIFactory {
  private static async updateItems(items: Zotero.Item[], source: MetadataSource) {
    const progressWin = new ztoolkit.ProgressWindow(addon.data.config.addonName)
      .createLine({
        text: getString("metadata-updating"),
        type: "default",
        progress: 0,
      })
      .show();

    let successCount = 0;
    const totalItems = items.length;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const success = await MetadataUpdater.updateItemMetadata(item, source);
      if (success) successCount++;

      progressWin.changeLine({
        progress: ((i + 1) / totalItems) * 100,
        text: `[${i + 1}/${totalItems}] ${getString("metadata-updating")}`,
      });
    }

    progressWin.changeLine({
      text: getString("metadata-update-complete", {
        args: {
          successCount,
          totalItems,
        },
      }),
      progress: 100,
      type: successCount === totalItems ? "success" : "warning",
    });
    progressWin.startCloseTimer(5000);
  }

  public static registerPreferenceUI() {
    Zotero.PreferencePanes.register({
      pluginID: addon.data.config.addonID,
      src: rootURI + "content/preferences.xhtml",
      label: getString("prefs-title"),
      image: `chrome://${addon.data.config.addonRef}/content/icons/favicon.png`,
    });
  }

  public static registerRightClickMenuItem(win: _ZoteroTypes.MainWindow) {
    const menuIcon = `chrome://${addon.data.config.addonRef}/content/icons/favicon@0.5x.png`;
    const popup = win.document.getElementById("zotero-itemmenu");
    if (!popup) return;

    ztoolkit.UI.appendElement(
      {
        tag: "menu",
        namespace: "xul",
        id: `${addon.data.config.addonRef}-fetch-menu`,
        attributes: {
          label: getString("menuitem-fetch-metadata"),
          image: menuIcon,
          class: "menu-iconic",
        },
        children: [
          {
            tag: "menupopup",
            namespace: "xul",
            children: (
              [
                ["DBLP", "dblp"],
                ["Semantic Scholar", "semantic-scholar"],
                ["CrossRef", "crossref"],
                ["OpenAlex", "openalex"],
                ["arXiv", "arxiv"],
              ] as [string, MetadataSource][]
            ).map(([label, source]) => ({
              tag: "menuitem",
              namespace: "xul",
              attributes: { label },
              listeners: [
                {
                  type: "command",
                  listener: async () => {
                    const items = Zotero.getActiveZoteroPane().getSelectedItems();
                    if (!items || !items.length) return;
                    await MetadataUIFactory.updateItems(items, source);
                  },
                },
              ],
            })),
          },
        ],
      },
      popup,
    );
  }
}
