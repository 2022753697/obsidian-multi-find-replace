import { TFile, Vault, Workspace, Notice, MarkdownView } from 'obsidian';

export class WorkspaceAdapter {
  constructor(
    private vault: Vault,
    private workspace: Workspace,
  ) {}

  getFiles(): TFile[] {
    return this.vault.getFiles();
  }

  getMarkdownFiles(): TFile[] {
    return this.vault.getMarkdownFiles();
  }

  async readFile(file: TFile): Promise<string> {
    return await this.vault.cachedRead(file);
  }

  async writeFile(file: TFile, content: string): Promise<void> {
    await this.vault.modify(file, content);
  }

  isFileOpen(file: TFile): boolean {
    return this.workspace.getActiveFile()?.path === file.path;
  }

  openFile(file: TFile, line: number, startCol?: number, endCol?: number): void {
    const leaf = this.workspace.getLeaf(false);
    if (leaf) {
      leaf.openFile(file).then(() => {
        const view = leaf.view;
        if (!(view instanceof MarkdownView)) return;
        const editor = view.editor;
        if (startCol !== undefined && endCol !== undefined) {
          editor.setSelection(
            { line: line - 1, ch: startCol },
            { line: line - 1, ch: endCol },
          );
        }
        editor.scrollIntoView(
          { from: { line: line - 1, ch: 0 }, to: { line: line - 1, ch: 0 } },
          true,
        );
      });
    }
  }

  getOpenFiles(): TFile[] {
    return this.workspace.getLeavesOfType('markdown').map((leaf: any) => leaf.view?.file).filter(Boolean) as TFile[];
  }

  async getGitignorePatterns(): Promise<string[]> {
    const gitignoreFiles = this.vault.getFiles().filter(f =>
      f.path === '.gitignore' || f.path.endsWith('/.gitignore')
    );
    const patterns: string[] = [];
    for (const f of gitignoreFiles) {
      try {
        const content = await this.vault.cachedRead(f);
        patterns.push(...content.split('\n').filter(l => l.trim() && !l.startsWith('#')));
      } catch {
        // skip unreadable gitignore
      }
    }
    return patterns;
  }
}