import Ignore from 'ignore';

export function createGitignoreFilter(patterns: string[]): (path: string) => boolean {
  const ig = Ignore().add(patterns);
  return (path: string): boolean => ig.ignores(path);
}

export const DEFAULT_IGNORE_PATTERNS = [
  '.git',
  'node_modules',
  '.obsidian',
];

export function mergePatterns(userPatterns: string[], respectGitignore: boolean): string[] {
  const patterns = [...DEFAULT_IGNORE_PATTERNS];
  if (respectGitignore) {
    patterns.push(...userPatterns);
  }
  return patterns;
}