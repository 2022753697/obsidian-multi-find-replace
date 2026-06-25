import { Plugin, ItemView, WorkspaceLeaf, setIcon, Notice, TFile, App, PluginSettingTab, Setting } from 'obsidian';
import './styles.css';
import { WorkspaceAdapter } from './adapter/WorkspaceAdapter';
import { EventBus } from './adapter/EventBus';
import { SearchEngine } from './core/SearchEngine';
import { ReplaceEngine } from './core/ReplaceEngine';
import { FileFilter } from './core/FileFilter';
import { UndoManager } from './core/UndoManager';
import { PerformanceController } from './core/PerformanceController';
import { SidebarPanel } from './ui/SidebarPanel';
import {
  Match, SearchResult, SearchToken, ReplaceOptions,
  PreserveCaseMode, SearchHistoryItem, Event,
} from './types';
import { hash } from './utils/hash';

export default class MultiFindReplacePlugin extends Plugin {
  workspaceAdapter!: WorkspaceAdapter;
  eventBus!: EventBus;
  searchEngine!: SearchEngine;
  replaceEngine!: ReplaceEngine;
  fileFilter!: FileFilter;
  undoManager!: UndoManager;
  performanceController!: PerformanceController;

  async onload(): Promise<void> {
    console.log('Loading Multi Find Replace plugin');

    this.workspaceAdapter = new WorkspaceAdapter(this.app.vault, this.app.workspace);
    this.eventBus = new EventBus();
    this.searchEngine = new SearchEngine(2);
    this.replaceEngine = new ReplaceEngine();
    this.fileFilter = new FileFilter();
    this.undoManager = new UndoManager();
    this.performanceController = new PerformanceController();

    this.registerView(
      'multi-find-replace-panel',
      (leaf) => new SidebarPanel(
        leaf,
        this.workspaceAdapter,
        this.searchEngine,
        this.replaceEngine,
        this.fileFilter,
        this.undoManager,
        this.performanceController,
        this.eventBus,
      )
    );

    this.addRibbonIcon('search', '多文件查找替换', () => {
      this.activatePanel();
    });

    this.addCommand({
      id: 'open-multi-find-replace',
      name: '打开多文件查找替换面板',
      callback: () => this.activatePanel(),
    });

    this.registerEvent(
      this.app.workspace.on('editor-menu', (menu, editor) => {
        const selection = editor.getSelection();
        if (selection) {
          menu.addItem((item) => {
            item
              .setTitle('多文件搜索选中词')
              .setIcon('search')
              .onClick(() => {
                this.activatePanel(selection);
              });
          });
        }
      })
    );

    this.addSettingTab(new MultiFindReplaceSettingTab(this.app, this));
  }

  onunload(): void {
    console.log('Unloading Multi Find Replace plugin');
    this.app.workspace.detachLeavesOfType('multi-find-replace-panel');
  }

  async activatePanel(searchText?: string): Promise<void> {
    const { workspace } = this.app;
    let leaf = workspace.getLeavesOfType('multi-find-replace-panel')[0];

    if (!leaf) {
      leaf = workspace.getLeftLeaf(false)!;
      await leaf.setViewState({
        type: 'multi-find-replace-panel',
        active: true,
      });
    }

    workspace.revealLeaf(leaf);

    if (searchText && leaf.view instanceof SidebarPanel) {
      leaf.view.setSearchText(searchText);
    }
  }
}

class MultiFindReplaceSettingTab extends PluginSettingTab {
  constructor(app: App, private plugin: MultiFindReplacePlugin) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl('h2', { text: '多文件查找替换设置' });

    new Setting(containerEl)
      .setName('上下文行数')
      .setDesc('匹配结果上下文中显示的行数')
      .addText(text => text
        .setPlaceholder('2')
        .setValue('2')
        .onChange(async (value) => {
          const n = parseInt(value, 10);
          if (n >= 0 && n <= 20) {
            this.plugin.searchEngine.setContextLines(n);
          }
        }));
  }
}