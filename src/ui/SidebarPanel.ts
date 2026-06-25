import { ItemView, WorkspaceLeaf, setIcon, Notice } from 'obsidian';
import { WorkspaceAdapter } from '../adapter/WorkspaceAdapter';
import { EventBus } from '../adapter/EventBus';
import { SearchEngine } from '../core/SearchEngine';
import { ReplaceEngine } from '../core/ReplaceEngine';
import { FileFilter } from '../core/FileFilter';
import { UndoManager } from '../core/UndoManager';
import { PerformanceController } from '../core/PerformanceController';
import { SearchConfig } from './SearchConfig';
import { ResultRenderer } from './ResultRenderer';
import { Navigator } from './Navigator';
import {
  Match, SearchResult, SearchToken, ReplaceOptions,
  PreserveCaseMode, SearchHistoryItem, Event, ReplaceMode,
} from '../types';
import { hash } from '../utils/hash';

export const VIEW_TYPE = 'multi-find-replace-panel';

export class SidebarPanel extends ItemView {
  private searchConfig: SearchConfig;
  private resultRenderer: ResultRenderer;
  private navigator: Navigator;
  private currentToken: SearchToken | null = null;
  private results: SearchResult[] = [];
  private history: SearchHistoryItem[] = [];
  private debouncedSearch: () => void;

  constructor(
    leaf: WorkspaceLeaf,
    private workspaceAdapter: WorkspaceAdapter,
    private searchEngine: SearchEngine,
    private replaceEngine: ReplaceEngine,
    private fileFilter: FileFilter,
    private undoManager: UndoManager,
    private performanceController: PerformanceController,
    private eventBus: EventBus,
  ) {
    super(leaf);
    this.searchConfig = new SearchConfig(this, this.onSearchConfigChange.bind(this));
    this.resultRenderer = new ResultRenderer(
      this,
      (file: string, line: number, startCol?: number, endCol?: number) =>
        this.openFileInEditor(file, line, startCol, endCol),
    );
    this.navigator = new Navigator();
    this.debouncedSearch = this.performanceController.debounce(
      () => this.executeSearch(),
      300,
    );
  }

  getViewType(): string {
    return VIEW_TYPE;
  }

  getDisplayText(): string {
    return '多文件查找替换';
  }

  getIcon(): string {
    return 'search';
  }

  async onOpen(): Promise<void> {
    const container = this.containerEl.children[1] as HTMLElement;
    container.empty();
    container.addClass('multi-find-replace-container');

    const titleEl = container.createDiv('multi-find-title');
    titleEl.setText('多文件查找替换');
    const closeBtn = titleEl.createSpan('multi-find-close');
    setIcon(closeBtn, 'x');
    closeBtn.onclick = () => this.leaf.detach();

    const configEl = container.createDiv('multi-find-config');
    this.searchConfig.render(configEl);

    const statsEl = container.createDiv('multi-find-stats');
    statsEl.id = 'multi-find-stats';
    this.resultRenderer.setStatsEl(statsEl);

    const actionsEl = container.createDiv('multi-find-actions');
    this.renderActions(actionsEl);

    const resultsEl = container.createDiv('multi-find-results');
    resultsEl.id = 'multi-find-results';
    this.resultRenderer.setResultsEl(resultsEl);

    this.registerEvents();
  }

  setSearchText(text: string): void {
    this.searchConfig.setSearchText(text);
    this.debouncedSearch();
  }

  private renderActions(container: HTMLElement): void {
    const replaceAllBtn = container.createEl('button', { text: '全部替换' });
    replaceAllBtn.onclick = () => this.replaceAll();

    const replaceNextBtn = container.createEl('button', { text: '逐个替换' });
    replaceNextBtn.onclick = () => this.replaceNext();

    const undoBtn = container.createEl('button', { text: '撤销' });
    undoBtn.id = 'multi-find-undo';
    undoBtn.onclick = () => this.undo();

    const cancelBtn = container.createEl('button', { text: '取消搜索' });
    cancelBtn.id = 'multi-find-cancel';
    cancelBtn.onclick = () => this.cancelSearch();

    const exportBtn = container.createEl('button', { text: '导出结果' });
    exportBtn.onclick = () => this.exportResults();
  }

  private onSearchConfigChange(): void {
    this.debouncedSearch();
  }

  private async executeSearch(): Promise<void> {
    if (this.currentToken) {
      this.performanceController.cancelSearch(this.currentToken);
    }

    const config = this.searchConfig.getConfig();
    if (!config.query) {
      this.results = [];
      this.resultRenderer.render([]);
      this.eventBus.emit(Event.SearchComplete, []);
      return;
    }

    if (config.searchOptions.regex) {
      const validation = this.searchEngine.validateRegex(config.query);
      if (!validation.valid) {
        this.searchConfig.showError(validation.error || '');
        return;
      }
      this.searchConfig.showError('');
    }

    this.eventBus.emit(Event.SearchStart, config.query);
    const token = this.performanceController.createSearchToken();
    this.currentToken = token;

    const files = this.workspaceAdapter.getMarkdownFiles();
    const filteredFiles = await this.fileFilter.filter(
      files.map(f => f.path),
      {
        fileTypes: config.fileTypes,
        excludePatterns: config.excludePatterns,
        respectGitignore: config.respectGitignore,
        includePaths: config.includePaths.length > 0 ? config.includePaths : undefined,
        openFilesOnly: false,
      }
    );

    const results: SearchResult[] = [];
    for (const file of files) {
      if (!this.performanceController.isValidToken(token)) break;
      if (!filteredFiles.includes(file.path)) continue;

      try {
        const content = await this.workspaceAdapter.readFile(file);
        if (this.fileFilter.isBinaryContent(content)) continue;

        const matches = this.searchEngine.search(content, config.query, config.searchOptions);
        if (matches.length > 0) {
          results.push({ file: file.path, matches });
        }
      } catch {
        // skip unreadable files
      }
    }

    if (!this.performanceController.isValidToken(token)) return;

    const totalMatches = results.reduce((sum, r) => sum + r.matches.length, 0);
    if (this.performanceController.checkThreshold(totalMatches)) {
      new Notice(`匹配数超过 10000（共 ${totalMatches} 处），请缩小搜索范围`);
    }

    this.results = results;
    this.resultRenderer.render(results);
    this.eventBus.emit(Event.SearchComplete, results);

    this.addHistory(config.query, config.replacement);
  }

  private async replaceAll(): Promise<void> {
    if (this.results.length === 0) return;

    const totalMatches = this.results.reduce((s, r) => s + r.matches.length, 0);
    const confirmed = confirm(`确定要替换全部 ${totalMatches} 处匹配？此操作可撤销。`);
    if (!confirmed) return;

    this.eventBus.emit(Event.ReplaceStart, totalMatches);
    this.undoManager.startBatch();

    for (const result of this.results) {
      try {
        const file = this.workspaceAdapter.getMarkdownFiles().find(f => f.path === result.file);
        if (!file) continue;

        const content = await this.workspaceAdapter.readFile(file);
        let modified = content;

        for (const match of result.matches) {
          modified = this.replaceEngine.replace(match, this.searchConfig.getConfig().replacement, modified, this.getReplaceOptions());
        }

        if (modified !== content) {
          const checksum = hash(content);
          this.undoManager.record({
            mode: ReplaceMode.Single,
            file: result.file,
            originalContent: content,
            newContent: modified,
            timestamp: Date.now(),
            checksum,
          });

          await this.workspaceAdapter.writeFile(file, modified);
        }
      } catch {
        new Notice(`替换失败：${result.file}`);
      }
    }

    this.undoManager.endBatch();
    this.results = [];
    this.resultRenderer.render([]);
    this.eventBus.emit(Event.ReplaceComplete, totalMatches);
    new Notice(`替换完成，共 ${totalMatches} 处`);
  }

  private async replaceNext(): Promise<void> {
    for (const result of this.results) {
      if (result.matches.length > 0) {
        const match = result.matches[0];
        const file = this.workspaceAdapter.getMarkdownFiles().find(f => f.path === result.file);
        if (file) {
          this.workspaceAdapter.openFile(file, match.line);
        }
        return;
      }
    }
  }

  private async undo(): Promise<void> {
    const batch = this.undoManager.popUndo();
    if (!batch) return;

    for (const op of batch) {
      try {
        const file = this.workspaceAdapter.getMarkdownFiles().find(f => f.path === op.file);
        if (!file) continue;

        const currentContent = await this.workspaceAdapter.readFile(file);
        const currentChecksum = hash(currentContent);
        if (currentChecksum !== op.checksum) {
          const ok = confirm(`文件 ${op.file} 已被修改，确定要撤销？`);
          if (!ok) continue;
        }

        await this.workspaceAdapter.writeFile(file, op.originalContent);
      } catch {
        new Notice(`撤销失败：${op.file}`);
      }
    }

    new Notice(`已撤销 ${batch.length} 个文件的替换`);
  }

  private cancelSearch(): void {
    if (this.currentToken) {
      this.performanceController.cancelSearch(this.currentToken);
      this.currentToken = null;
    }
  }

  private openFileInEditor(filePath: string, line: number, startCol?: number, endCol?: number): void {
    const file = this.workspaceAdapter.getMarkdownFiles().find(f => f.path === filePath);
    if (file) {
      this.workspaceAdapter.openFile(file, line, startCol, endCol);
    }
  }

  private exportResults(): void {
    if (this.results.length === 0) return;

    const lines: string[] = [];
    for (const result of this.results) {
      for (const match of result.matches) {
        lines.push(`${result.file}:${match.line}:${match.startCol} ${match.content}`);
      }
    }

    const text = lines.join('\n');
    navigator.clipboard.writeText(text).then(() => {
      new Notice('搜索结果已复制到剪贴板');
    });
  }

  private getReplaceOptions(): ReplaceOptions {
    const config = this.searchConfig.getConfig();
    return {
      ...config.searchOptions,
      preserveCase: config.preserveCase,
    };
  }

  private addHistory(query: string, replacement: string): void {
    this.history = this.history.filter(h => h.query !== query);
    this.history.unshift({ query, replacement, timestamp: Date.now() });
    if (this.history.length > 10) this.history.pop();
  }

  private registerEvents(): void {
    this.registerKeyEvent(document, 'keydown', (e: KeyboardEvent) => {
      if (e.key === 'F3') {
        e.preventDefault();
        this.navigator.next();
      } else if (e.key === 'F3' && e.shiftKey) {
        e.preventDefault();
        this.navigator.prev();
      }
    });
  }

  private registerKeyEvent(target: HTMLElement | Document, type: string, handler: (e: KeyboardEvent) => void): void {
    target.addEventListener(type, handler as EventListener);
    this.register(() => target.removeEventListener(type, handler as EventListener));
  }
}