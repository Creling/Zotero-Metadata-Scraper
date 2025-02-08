# Zotero Metadata Scraper

A Zotero plugin that automatically retrieves and updates paper metadata from multiple academic sources based on paper titles.

## Features

- Fetch metadata from multiple sources:
  - [DBLP](https://dblp.org/)
  - [Semantic Scholar](https://www.semanticscholar.org/)
  - ...
- Update publication metadata automatically
- Multi-language support (English, Chinese)

## Installation

1. Download the latest release (.xpi file) from the [releases page](https://github.com/creling/zotero-metadata-scraper/releases)
2. In Zotero:
   - Go to Tools → Add-ons
   - Click the gear icon and choose "Install Add-on From File..."
   - Select the downloaded .xpi file

## Usage

1. Select one item in your Zotero library
2. Right-click and select "Fetch Metadata" from the context menu
3. The plugin will search for matching publications
4. If multiple matches are found, select the correct one from the search results dialog
5. The item's metadata will be updated automatically

## Configuration

### Semantic Scholar API Key (Optional)

To increase API rate limits for Semantic Scholar:

1. Go to Tools → Metadata Scraper Settings
2. Enter your Semantic Scholar API key
3. Click OK to save

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

### Build

- Development build with hot reload:

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

## License

[AGPL-3.0](LICENSE) © creling

## Support

- Report issues on [GitHub](https://github.com/creling/zotero-metadata-scraper/issues)
<!-- - Check the [documentation](doc/) for more details -->
