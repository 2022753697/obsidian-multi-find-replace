import { SearchToken } from '../types';
import { hash } from '../utils/hash';

export class PerformanceController {
  private tokens: Map<string, SearchToken> = new Map();
  private lastTimer: ReturnType<typeof setTimeout> | null = null;

  debounce(fn: () => void, delay: number): () => void {
    return () => {
      if (this.lastTimer) clearTimeout(this.lastTimer);
      this.lastTimer = setTimeout(fn, delay);
    };
  }

  createSearchToken(): SearchToken {
    const id = hash(Date.now().toString() + Math.random().toString());
    const token: SearchToken = { id, timestamp: Date.now(), cancelled: false };
    this.tokens.set(id, token);
    return token;
  }

  isValidToken(token: SearchToken): boolean {
    const stored = this.tokens.get(token.id);
    if (!stored) return false;
    return !stored.cancelled;
  }

  cancelSearch(token: SearchToken): void {
    token.cancelled = true;
    this.tokens.delete(token.id);
  }

  checkThreshold(results: number): boolean {
    return results > 10000;
  }
}