import { FilterOptions } from '../types';
import { createGitignoreFilter, mergePatterns } from '../utils/gitignore';

const BINARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico', '.svg',
  '.pdf', '.zip', '.rar', '.7z', '.tar', '.gz',
  '.exe', '.dll', '.so', '.dylib',
  '.mp3', '.mp4', '.avi', '.mov', '.wav', '.flac',
  '.woff', '.woff2', '.ttf', '.eot',
  '.psd', '.ai', '.xcf',
]);

export class FileFilter {
  async filter(files: string[], filters: FilterOptions): Promise<string[]> {
    let filtered = files;

    if (filters.fileTypes.length > 0) {
      filtered = filtered.filter(f =>
        filters.fileTypes.some(t => f.endsWith(t.startsWith('.') ? t : `.${t}`))
      );
    }

    if (filters.includePaths && filters.includePaths.length > 0) {
      filtered = filtered.filter(f =>
        filters.includePaths!.some(p => f.startsWith(p))
      );
    }

    const patterns = mergePatterns(filters.excludePatterns, filters.respectGitignore);
    const ignoreFilter = createGitignoreFilter(patterns);
    filtered = filtered.filter(f => !ignoreFilter(f));

    return filtered;
  }

  isBinaryContent(content: string | ArrayBuffer): boolean {
    if (content instanceof ArrayBuffer) {
      return true;
    }
    return false;
  }

  isBinaryExtension(path: string): boolean {
    const ext = path.toLowerCase().slice(path.lastIndexOf('.'));
    return BINARY_EXTENSIONS.has(ext);
  }
}