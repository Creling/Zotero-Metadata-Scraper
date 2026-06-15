# Zotero Metadata Scraper

A Zotero plugin that automatically retrieves and updates paper metadata from multiple academic sources based on paper titles. Compatible with Zotero 7, 8, and 9.

## Features

- Fetch metadata from five sources:
  - [DBLP](https://dblp.org/) — CS conference and journal papers
  - [Semantic Scholar](https://www.semanticscholar.org/) — broad coverage across disciplines
  - [CrossRef](https://www.crossref.org/) — most reliable for anything with a DOI
  - [OpenAlex](https://openalex.org/) — working papers, reports, and grey literature
  - [arXiv](https://arxiv.org/) — CS, physics, and math preprints
- Update publication metadata automatically
- Multi-language support (English, Chinese)

## Installation

1. Download the latest release (.xpi file) from the [releases page](https://github.com/creling/zotero-metadata-scraper/releases)
2. In Zotero:
   - Go to Tools → Add-ons
   - Click the gear icon and choose "Install Add-on From File..."
   - Select the downloaded .xpi file

## Usage

1. Select one or more items in your Zotero library
2. Right-click and hover over "Fetch Metadata" to reveal the source submenu
3. Choose a source (see [Which source should I use?](#which-source-should-i-use))
4. If multiple matches are found, select the correct one from the search results dialog
5. The item's metadata will be updated automatically

### Which source should I use?

| Source               | Best for                                       |
| -------------------- | ---------------------------------------------- |
| **CrossRef**         | Journal articles and anything with a DOI       |
| **DBLP**             | Computer science conference and journal papers |
| **Semantic Scholar** | General academic papers across disciplines     |
| **OpenAlex**         | Working papers, reports, and grey literature   |
| **arXiv**            | CS, physics, and math preprints                |

![image](https://github.com/user-attachments/assets/05221bd1-05c3-4fe0-86ee-571a0487bcf6)

![image](https://github.com/user-attachments/assets/6990bd4c-4b23-4288-b95b-b8f0086b75d7)

## Configuration

### Semantic Scholar API Key (Optional)

Semantic Scholar enforces rate limits on unauthenticated requests. To increase your limit:

1. Go to Tools → Metadata Scraper Settings
2. Enter your [Semantic Scholar API key](https://www.semanticscholar.org/product/api)
3. Click OK to save

The other sources (CrossRef, OpenAlex, arXiv, DBLP) do not require API keys.

## Development

### Prerequisites

- Node.js
- npm

### Setup

1. Clone the repository:

```bash
git clone https://github.com/creling/zotero-metadata-scraper.git
cd zotero-metadata-scraper
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file at the project root with your Zotero paths:

```
ZOTERO_PLUGIN_ZOTERO_BIN_PATH = /Applications/Zotero.app/Contents/MacOS/zotero
ZOTERO_PLUGIN_PROFILE_PATH = /path/to/your/zotero/profile
```

Your profile path can be found in Zotero under Help → Profile Directory.

### Build

- Development (launches Zotero with hot reload):

```bash
npm run start
```

- Production build:

```bash
npm run build
```

### Lint

```bash
npm run lint:check  # Check code style
npm run lint:fix    # Fix code style
```

### Adding a new metadata source

1. Create `src/services/mySource.ts` with a class that exposes a single static method:

```typescript
import * as bibtexParse from "@orcid/bibtex-parse-js";
import { RateLimitError, isRateLimitError } from "../utils/errors";

export class MySourceService {
  public static async searchByTitle(title: string): Promise<bibtexParse.BibtexEntry[]> {
    let response: Awaited<ReturnType<typeof Zotero.HTTP.request>>;
    try {
      response = await Zotero.HTTP.request("GET", `https://api.example.com/search?q=${encodeURIComponent(title)}`, {
        responseType: "json",
      });
    } catch (error) {
      if (isRateLimitError(error)) throw new RateLimitError("My Source");
      throw error;
    }
    // parse response.response and return BibtexEntry[]
  }
}
```

2. Add one entry to `METADATA_SOURCES` in `src/services/registry.ts`:

```typescript
{ id: "my-source", label: "My Source", search: (t) => MySourceService.searchByTitle(t) },
```

That's it — the type union, the dispatch logic, and the right-click menu all update automatically.

## License

[AGPL-3.0](LICENSE) © creling

## Support

- Report issues on [GitHub](https://github.com/creling/zotero-metadata-scraper/issues)
<!-- - Check the [documentation](doc/) for more details -->
