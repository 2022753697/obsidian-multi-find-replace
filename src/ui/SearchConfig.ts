import { SearchOptions, PreserveCaseMode, SearchHistoryItem } from '../types';
import { Notice } from 'obsidian';

export interface SearchConfigData {
  query: string;
  replacement: string;
  searchOptions: SearchOptions;
  preserveCase: PreserveCaseMode;
  fileTypes: string[];
  excludePatterns: string[];
  respectGitignore: boolean;
  includePaths: string[];
  contextLines: number;
}

export class SearchConfig {
  private data: SearchConfigData;
  private errorEl: HTMLElement | null = null;
  private onChange: () => void;
  private history: SearchHistoryItem[] = [];
  private collapsed = true;

  constructor(private panel: any, onChange: () => void) {
    this.onChange = onChange;
    this.data = this.getDefaultData();
  }

  private getDefaultData(): SearchConfigData {
    return {
      query: '',
      replacement: '',
      searchOptions: {
        regex: false,
        caseSensitive: false,
        wholeWord: false,
        multiline: false,
      },
      preserveCase: PreserveCaseMode.Off,
      fileTypes: ['.md'],
      excludePatterns: ['.git', 'node_modules', 'dist'],
      respectGitignore: true,
      includePaths: [],
      contextLines: 2,
    };
  }

  render(container: HTMLElement): void {
    container.empty();

    const header = container.createDiv('multi-find-config-header');
    const toggleIcon = header.createSpan('multi-find-toggle');
    toggleIcon.setText(this.collapsed ? '▶' : '▼');
    header.createSpan().setText('搜索配置');

    const historyBtn = header.createSpan('multi-find-history-btn');
    historyBtn.setText('历史记录 ▼');
    historyBtn.onclick = (e) => {
      e.stopPropagation();
      this.showHistoryDropdown(historyBtn);
    };

    header.onclick = () => {
      this.collapsed = !this.collapsed;
      this.render(container);
    };

    if (this.collapsed) return;

    const body = container.createDiv('multi-find-config-body');

    // Query input
    body.createEl('label', { text: '查找:' });
    const queryInput = body.createEl('input', { type: 'text', placeholder: '输入搜索词...' });
    queryInput.value = this.data.query;
    queryInput.oninput = () => {
      this.data.query = queryInput.value;
      this.onChange();
    };

    // Replacement input
    body.createEl('label', { text: '替换为:' });
    const replaceInput = body.createEl('input', { type: 'text', placeholder: '替换文本（支持 $1, $2）' });
    replaceInput.value = this.data.replacement;
    replaceInput.oninput = () => {
      this.data.replacement = replaceInput.value;
    };

    // Error display
    this.errorEl = body.createDiv('multi-find-error');
    this.errorEl.style.display = 'none';

    // Options
    const optionsGrid = body.createDiv('multi-find-options');
    this.addCheckbox(optionsGrid, '正则', this.data.searchOptions.regex, v => {
      this.data.searchOptions.regex = v;
      this.onChange();
    });
    this.addCheckbox(optionsGrid, '全词匹配', this.data.searchOptions.wholeWord, v => {
      this.data.searchOptions.wholeWord = v;
      this.onChange();
    });
    this.addCheckbox(optionsGrid, '多行', this.data.searchOptions.multiline, v => {
      this.data.searchOptions.multiline = v;
      this.onChange();
    });
    this.addCheckbox(optionsGrid, '大小写敏感', this.data.searchOptions.caseSensitive, v => {
      this.data.searchOptions.caseSensitive = v;
      this.onChange();
    });

    // Preserve case
    body.createEl('label', { text: '保留大小写:' });
    const caseSelect = body.createEl('select');
    const caseOptions = [
      { value: PreserveCaseMode.Off, label: '不保留' },
      { value: PreserveCaseMode.Auto, label: '自动' },
      { value: PreserveCaseMode.Lower, label: '小写' },
      { value: PreserveCaseMode.Upper, label: '大写' },
    ];
    caseOptions.forEach(o => {
      const opt = caseSelect.createEl('option');
      opt.value = o.value;
      opt.text = o.label;
      if (o.value === this.data.preserveCase) opt.selected = true;
    });
    caseSelect.onchange = () => {
      this.data.preserveCase = caseSelect.value as PreserveCaseMode;
    };

    // File types
    body.createEl('label', { text: '文件类型:' });
    const typeInput = body.createEl('input', { type: 'text', placeholder: '.md, .txt' });
    typeInput.value = this.data.fileTypes.join(', ');
    typeInput.oninput = () => {
      this.data.fileTypes = typeInput.value.split(',').map(s => s.trim()).filter(Boolean);
    };

    // Exclude patterns
    body.createEl('label', { text: '排除模式:' });
    const excludeInput = body.createEl('input', { type: 'text', placeholder: '.git, node_modules' });
    excludeInput.value = this.data.excludePatterns.join(', ');
    excludeInput.oninput = () => {
      this.data.excludePatterns = excludeInput.value.split(',').map(s => s.trim()).filter(Boolean);
    };

    this.addCheckbox(body, '尊重 .gitignore', this.data.respectGitignore, v => {
      this.data.respectGitignore = v;
    });
  }

  private addCheckbox(container: HTMLElement, label: string, checked: boolean, onChange: (v: boolean) => void): void {
    const wrapper = container.createEl('label', { cls: 'multi-find-checkbox-label' });
    const cb = wrapper.createEl('input', { type: 'checkbox' });
    cb.checked = checked;
    cb.onchange = () => onChange(cb.checked);
    wrapper.createSpan().setText(label);
  }

  getConfig(): SearchConfigData {
    return { ...this.data };
  }

  setSearchText(text: string): void {
    this.data.query = text;
  }

  showError(message: string): void {
    if (this.errorEl) {
      this.errorEl.style.display = message ? 'block' : 'none';
      this.errorEl.setText(message);
    }
  }

  private showHistoryDropdown(btn: HTMLElement): void {
    if (this.history.length === 0) {
      new Notice('暂无搜索历史');
      return;
    }
    const dropdown = document.createElement('div');
    dropdown.addClass('multi-find-history-dropdown');
    this.history.forEach(item => {
      const entry = dropdown.createDiv('multi-find-history-item');
      entry.setText(`${item.query} → ${item.replacement}`);
      entry.onclick = () => {
        this.setSearchText(item.query);
        this.onChange();
        dropdown.remove();
      };
    });
    btn.parentElement!.appendChild(dropdown);
    const closeHandler = (e: MouseEvent) => {
      if (!dropdown.contains(e.target as Node)) {
        dropdown.remove();
        document.removeEventListener('click', closeHandler);
      }
    };
    setTimeout(() => document.addEventListener('click', closeHandler), 0);
  }
}