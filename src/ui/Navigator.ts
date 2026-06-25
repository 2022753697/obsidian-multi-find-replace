export class Navigator {
  private currentIndex = -1;
  private totalItems = 0;

  setTotal(n: number): void {
    this.totalItems = n;
    this.currentIndex = n > 0 ? 0 : -1;
  }

  next(): number {
    if (this.totalItems === 0) return -1;
    this.currentIndex = (this.currentIndex + 1) % this.totalItems;
    return this.currentIndex;
  }

  prev(): number {
    if (this.totalItems === 0) return -1;
    this.currentIndex = (this.currentIndex - 1 + this.totalItems) % this.totalItems;
    return this.currentIndex;
  }

  getCurrentIndex(): number {
    return this.currentIndex;
  }

  reset(): void {
    this.currentIndex = -1;
    this.totalItems = 0;
  }
}