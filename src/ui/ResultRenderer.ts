import { SearchResult } from '../types';
import { escapeHtml } from '../utils/escape';

export class ResultRenderer {
  private statsEl: HTMLElement | null = null;
  private resultsEl: HTMLElement | null = null;
  private expandedFiles: Set<string> = new Set();

  constructor(
    private panel: any,
    private openFile: (file: string, line: number, startCol?: number, endCol?: number) => void,
  ) {}

  setStatsEl(el: HTMLElement): void {
    this.statsEl = el;
  }

  setResultsEl(el: HTMLElement): void {
    this.resultsEl = el;
  }

  render(results: SearchResult[]): void {
    if (!this.statsEl || !this.resultsEl) return;

    const totalMatches = results.reduce((s, r) => s + r.matches.length, 0);
    this.statsEl.setText(`共 ${results.length} 个文件，${totalMatches} 处匹配`);

    this.resultsEl.empty();

    for (const result of results) {
      const fileEl = this.resultsEl.createDiv('multi-find-file');
      const isExpanded = this.expandedFiles.has(result.file);

      const fileHeader = fileEl.createDiv('multi-find-file-header');
      const toggleIcon = fileHeader.createSpan('multi-find-toggle');
      toggleIcon.setText(isExpanded ? '▼' : '▶');
      fileHeader.createSpan('multi-find-file-name').setText(`${result.file} (${result.matches.length} 处)`);
      fileHeader.onclick = () => {
        if (isExpanded) {
          this.expandedFiles.delete(result.file);
        } else {
          this.expandedFiles.add(result.file);
        }
        this.render(results);
      };

      if (!isExpanded) continue;

      for (const match of result.matches) {
        const matchEl = fileEl.createDiv('multi-find-match');
        matchEl.addClass('multi-find-clickable');
        matchEl.createDiv('multi-find-match-line').setText(`第 ${match.line} 行`);

        if (match.contextBefore.length > 0) {
          const ctxBefore = matchEl.createDiv('multi-find-context-before');
          ctxBefore.setText(match.contextBefore.join('\n'));
        }

        const contentEl = matchEl.createDiv('multi-find-match-content');
        const before = match.content.slice(0, match.startCol);
        const after = match.content.slice(match.endCol);
        contentEl.createSpan().setText(escapeHtml(before));
        const highlight = contentEl.createSpan('multi-find-highlight');
        highlight.setText(escapeHtml(match.content));
        contentEl.createSpan().setText(escapeHtml(after));

        if (match.contextAfter.length > 0) {
          const ctxAfter = matchEl.createDiv('multi-find-context-after');
          ctxAfter.setText(match.contextAfter.join('\n'));
        }

        // 点击整个匹配项直接跳转
        matchEl.onclick = () => {
          this.openFile(result.file, match.line, match.startCol, match.endCol);
        };
      }
    }
  }
}