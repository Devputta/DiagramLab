import { DiagramPage } from '../types/diagram';

export interface HistoryEntry {
  page: DiagramPage;
  actionName?: string;
  timestamp: number;
}

export interface HistoryStackState {
  past: HistoryEntry[];
  present: HistoryEntry;
  future: HistoryEntry[];
}

export class UndoRedoStackManager {
  private past: HistoryEntry[] = [];
  private present: HistoryEntry;
  private future: HistoryEntry[] = [];
  private maxDepth: number;
  private isBatching = false;
  private batchStartState: DiagramPage | null = null;
  private listeners: Set<(state: HistoryStackState) => void> = new Set();

  constructor(initialPage: DiagramPage, maxDepth = 60) {
    this.maxDepth = maxDepth;
    this.present = {
      page: JSON.parse(JSON.stringify(initialPage)),
      actionName: 'Initial State',
      timestamp: Date.now(),
    };
  }

  public getState(): HistoryStackState {
    return {
      past: this.past,
      present: this.present,
      future: this.future,
    };
  }

  public canUndo(): boolean {
    return this.past.length > 0;
  }

  public canRedo(): boolean {
    return this.future.length > 0;
  }

  public getUndoActionName(): string | undefined {
    return this.present.actionName;
  }

  public getRedoActionName(): string | undefined {
    return this.future[0]?.actionName;
  }

  /**
   * Reset the history stack (e.g. when switching pages)
   */
  public reset(page: DiagramPage): void {
    this.past = [];
    this.present = {
      page: JSON.parse(JSON.stringify(page)),
      actionName: 'Page Reset',
      timestamp: Date.now(),
    };
    this.future = [];
    this.isBatching = false;
    this.batchStartState = null;
    this.notify();
  }

  /**
   * Start a continuous action (e.g. mouse drag or resize)
   */
  public startBatch(): void {
    if (!this.isBatching) {
      this.isBatching = true;
      this.batchStartState = JSON.parse(JSON.stringify(this.present.page));
    }
  }

  /**
   * Commit a finished continuous action (e.g. mouse up after dragging/resizing)
   */
  public endBatch(finalPage: DiagramPage, actionName = 'Modify Shapes'): boolean {
    if (!this.isBatching) return false;
    this.isBatching = false;

    if (!this.batchStartState) {
      return false;
    }

    const startJson = JSON.stringify(this.batchStartState);
    const finalJson = JSON.stringify(finalPage);

    // If nothing actually changed, discard
    if (startJson === finalJson) {
      this.batchStartState = null;
      return false;
    }

    // Push the state from before the drag started to past
    this.past.push({
      page: this.batchStartState,
      actionName,
      timestamp: Date.now(),
    });

    if (this.past.length > this.maxDepth) {
      this.past.shift();
    }

    this.present = {
      page: JSON.parse(finalJson),
      actionName,
      timestamp: Date.now(),
    };

    // Any new change clears the future (redo) stack
    this.future = [];
    this.batchStartState = null;
    this.notify();
    return true;
  }

  /**
   * Push a discrete change to the stack
   */
  public push(newPage: DiagramPage, actionName = 'Edit Diagram'): boolean {
    const currentJson = JSON.stringify(this.present.page);
    const newJson = JSON.stringify(newPage);

    // Avoid duplicate redundant steps
    if (currentJson === newJson) {
      return false;
    }

    this.past.push(this.present);
    if (this.past.length > this.maxDepth) {
      this.past.shift();
    }

    this.present = {
      page: JSON.parse(newJson),
      actionName,
      timestamp: Date.now(),
    };

    this.future = [];
    this.notify();
    return true;
  }

  /**
   * Undo the last change
   */
  public undo(): DiagramPage | null {
    if (this.past.length === 0) return null;

    const previousEntry = this.past.pop()!;
    this.future.unshift(this.present);
    this.present = previousEntry;

    this.notify();
    return JSON.parse(JSON.stringify(this.present.page));
  }

  /**
   * Redo the previously undone change
   */
  public redo(): DiagramPage | null {
    if (this.future.length === 0) return null;

    const nextEntry = this.future.shift()!;
    this.past.push(this.present);
    this.present = nextEntry;

    this.notify();
    return JSON.parse(JSON.stringify(this.present.page));
  }

  public subscribe(listener: (state: HistoryStackState) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const state = this.getState();
    this.listeners.forEach((listener) => listener(state));
  }
}
