import { ReplaceOperation, ReplaceMode } from '../types';
import { hash } from '../utils/hash';

export class UndoManager {
  private undoStack: ReplaceOperation[][] = [];
  private redoStack: ReplaceOperation[][] = [];
  private currentBatch: ReplaceOperation[] = [];
  private batching = false;

  startBatch(): void {
    this.batching = true;
    this.currentBatch = [];
  }

  endBatch(): void {
    if (this.currentBatch.length > 0) {
      this.undoStack.push([...this.currentBatch]);
      this.currentBatch = [];
    }
    this.batching = false;
    this.redoStack = [];
  }

  record(operation: ReplaceOperation): void {
    if (this.batching) {
      this.currentBatch.push(operation);
    } else {
      this.undoStack.push([operation]);
      this.redoStack = [];
    }
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  peekUndo(): ReplaceOperation[] | null {
    if (this.undoStack.length === 0) return null;
    return this.undoStack[this.undoStack.length - 1];
  }

  popUndo(): ReplaceOperation[] | null {
    if (this.undoStack.length === 0) return null;
    const batch = this.undoStack.pop()!;
    this.redoStack.push(batch);
    return batch;
  }

  popRedo(): ReplaceOperation[] | null {
    if (this.redoStack.length === 0) return null;
    const batch = this.redoStack.pop()!;
    this.undoStack.push(batch);
    return batch;
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.currentBatch = [];
    this.batching = false;
  }
}