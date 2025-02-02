declare module "@orcid/bibtex-parse-js" {
  interface BibtexEntry {
    citationKey: string;
    entryType: string;
    entryTags: {
      title?: string;
      author?: string;
      year?: string;
      pages?: string;
      volume?: string;
      number?: string;
      publisher?: string;
      series?: string;
      booktitle?: string;
      journal?: string;
      address?: string;
      month?: string;
      isbn?: string;
      doi?: string;
      url?: string;
      [key: string]: string | undefined;
    };
  }

  export function toJSON(bibtex: string): BibtexEntry[];
  export function toBibtex(json: BibtexEntry[]): string;
}
