import * as bibtexParse from "@orcid/bibtex-parse-js";
import { DBLPService } from "./dblp";
import { SemanticScholarService } from "./semanticScholar";
import { CrossRefService } from "./crossref";
import { OpenAlexService } from "./openAlex";
import { ArXivService } from "./arxiv";

interface MetadataServiceEntry {
  id: string;
  label: string;
  search: (title: string) => Promise<bibtexParse.BibtexEntry[]>;
}

export const METADATA_SOURCES = [
  { id: "dblp", label: "DBLP", search: (t: string) => DBLPService.searchByTitle(t) },
  { id: "semantic-scholar", label: "Semantic Scholar", search: (t: string) => SemanticScholarService.searchByTitle(t) },
  { id: "crossref", label: "CrossRef", search: (t: string) => CrossRefService.searchByTitle(t) },
  { id: "openalex", label: "OpenAlex", search: (t: string) => OpenAlexService.searchByTitle(t) },
  { id: "arxiv", label: "arXiv", search: (t: string) => ArXivService.searchByTitle(t) },
] satisfies MetadataServiceEntry[];

export type MetadataSource = (typeof METADATA_SOURCES)[number]["id"];
