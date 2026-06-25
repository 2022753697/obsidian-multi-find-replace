import { Match, ReplaceOptions, PreserveCaseMode, DiffResult, Change } from '../types';

export class ReplaceEngine {
  preview(match: Match, replacement: string, originalContent: string, options: ReplaceOptions): DiffResult {
    const replaced = this.applyReplace(originalContent, match, replacement, options);
    return this.computeDiff(originalContent, replaced, match);
  }

  replace(match: Match, replacement: string, originalContent: string, options: ReplaceOptions): string {
    return this.applyReplace(originalContent, match, replacement, options);
  }

  private applyReplace(content: string, match: Match, replacement: string, options: ReplaceOptions): string {
    const lines = content.split('\n');
    const lineIdx = match.line - 1;
    const line = lines[lineIdx];
    if (!line) return content;

    let actualReplacement = replacement;

    if (options.preserveCase !== PreserveCaseMode.Off) {
      actualReplacement = this.applyPreserveCase(match.content, replacement, options.preserveCase);
    }

    const newLine = line.slice(0, match.startCol) + actualReplacement + line.slice(match.endCol);
    lines[lineIdx] = newLine;
    return lines.join('\n');
  }

  private applyPreserveCase(original: string, replacement: string, mode: PreserveCaseMode): string {
    switch (mode) {
      case PreserveCaseMode.Upper:
        return replacement.toUpperCase();
      case PreserveCaseMode.Lower:
        return replacement.toLowerCase();
      case PreserveCaseMode.Auto: {
        if (original === original.toUpperCase()) return replacement.toUpperCase();
        if (original === original.toLowerCase()) return replacement.toLowerCase();
        if (original[0] === original[0].toUpperCase()) {
          return replacement[0].toUpperCase() + replacement.slice(1).toLowerCase();
        }
        return replacement.toLowerCase();
      }
      default:
        return replacement;
    }
  }

  private computeDiff(original: string, modified: string, match: Match): DiffResult {
    const changes: Change[] = [];
    const origLines = original.split('\n');
    const modLines = modified.split('\n');
    const lineIdx = match.line - 1;

    if (origLines[lineIdx] !== modLines[lineIdx]) {
      changes.push({
        type: 'delete',
        text: origLines[lineIdx],
        position: match.startCol,
      });
      changes.push({
        type: 'insert',
        text: modLines[lineIdx],
        position: match.startCol,
      });
    }

    return { original, modified, changes };
  }
}