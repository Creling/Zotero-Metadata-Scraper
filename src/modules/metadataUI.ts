import { getString } from "../utils/locale";
import { MetadataUpdater } from "./metadataUpdater";

export class MetadataUIFactory {
  private static async updateItems(items: Zotero.Item[], source: "dblp" | "semantic-scholar") {
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

  public static registerRightClickMenuItem() {
    const menuIcon = `chrome://${addon.data.config.addonRef}/content/icons/favicon@0.5x.png`;
    ztoolkit.Menu.register("item", {
      tag: "menu",
      label: getString("menuitem-fetch-metadata"),
      icon: menuIcon,
      children: [
        {
          tag: "menuitem",
          label: "DBLP",
          commandListener: async (ev) => {
            const items = Zotero.getActiveZoteroPane().getSelectedItems();
            if (!items || !items.length) return;
            await this.updateItems(items, "dblp");
          },
        },
        {
          tag: "menuitem",
          label: "Semantic Scholar",
          commandListener: async (ev) => {
            const items = Zotero.getActiveZoteroPane().getSelectedItems();
            if (!items || !items.length) return;
            await this.updateItems(items, "semantic-scholar");
          },
        },
      ],
    });
  }
}
