export interface SearchOptions {
  regex: boolean;
  caseSensitive: boolean;
  wholeWord: boolean;
  multiline: boolean;
}

export interface Match {
  id: string;
  line: number;
  startCol: number;
  endCol: number;
  content: string;
  contextBefore: string[];
  contextAfter: string[];
}

export interface SearchResult {
  file: string;
  matches: Match[];
}

export enum PreserveCaseMode {
  Off = 'off',
  Auto = 'auto',
  Lower = 'lower',
  Upper = 'upper',
}

export interface ReplaceOptions extends SearchOptions {
  preserveCase: PreserveCaseMode;
}

export interface Change {
  type: 'delete' | 'insert';
  text: string;
  position: number;
}

export interface DiffResult {
  original: string;
  modified: string;
  changes: Change[];
}

export enum ReplaceMode {
  Single = 'single',
  Batch = 'batch',
}

export interface ReplaceOperation {
  mode: ReplaceMode;
  file: string;
  originalContent: string;
  newContent: string;
  timestamp: number;
  checksum: string;
}

export enum Event {
  SearchStart = 'search:start',
  SearchComplete = 'search:complete',
  ReplaceStart = 'replace:start',
  ReplaceComplete = 'replace:complete',
  Error = 'error',
}

export interface SearchToken {
  id: string;
  timestamp: number;
  cancelled: boolean;
}

export interface FilterOptions {
  fileTypes: string[];
  excludePatterns: string[];
  respectGitignore: boolean;
  includePaths?: string[];
  openFilesOnly?: boolean;
}

export interface SearchHistoryItem {
  query: string;
  replacement: string;
  timestamp: number;
}