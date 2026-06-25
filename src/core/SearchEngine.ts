import { Match, SearchOptions } from '../types';

export class SearchEngine {
  private contextLines: number;

  constructor(contextLines = 2) {
    this.contextLines = contextLines;
  }

  setContextLines(n: number): void {
    this.contextLines = n;
  }

  search(content: string, query: string, options: SearchOptions): Match[] {
    const lines = content.split('\n');
    const regex = this.buildPattern(query, options);
    const matches: Match[] = [];

    if (options.regex) {
      for (let i = 0; i < lines.length; i++) {
        regex.lastIndex = 0;
        const lineMatches = lines[i].matchAll(regex);
        for (const m of lineMatches) {
          if (m.index === undefined) continue;
          matches.push(this.buildMatch(lines, i, m.index, m[0].length, m[0]));
        }
      }
    } else {
      for (let i = 0; i < lines.length; i++) {
        regex.lastIndex = 0;
        let execResult: RegExpExecArray | null;
        while ((execResult = regex.exec(lines[i])) !== null) {
          if (execResult.index === regex.lastIndex) regex.lastIndex++;
          matches.push(
            this.buildMatch(lines, i, execResult.index, execResult[0].length, execResult[0])
          );
        }
      }
    }

    return matches;
  }

  validateRegex(pattern: string): { valid: boolean; error?: string } {
    try {
      new RegExp(pattern);
      return { valid: true };
    } catch (e: unknown) {
      return { valid: false, error: (e as Error).message };
    }
  }

  private buildPattern(query: string, options: SearchOptions): RegExp {
    let pattern = query;
    if (!options.regex) {
      pattern = this.escapeRegex(query);
    }
    if (options.wholeWord) {
      pattern = `\\b(?:${pattern})\\b`;
    }
    const flags = options.caseSensitive ? 'gm' : 'gim';
    if (options.multiline) {
      return new RegExp(pattern, flags);
    }
    return new RegExp(pattern, flags.replace('m', ''));
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private buildMatch(lines: string[], lineIdx: number, startCol: number, length: number, content: string): Match {
    return {
      id: `${lineIdx}:${startCol}:${length}`,
      line: lineIdx + 1,
      startCol,
      endCol: startCol + length,
      content,
      contextBefore: lines.slice(Math.max(0, lineIdx - this.contextLines), lineIdx),
      contextAfter: lines.slice(lineIdx + 1, lineIdx + 1 + this.contextLines),
    };
  }
}