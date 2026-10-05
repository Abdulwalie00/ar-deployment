import { Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

export type ToastTone = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: number;
  tone: ToastTone;
  title: string;
  message?: string;
}

/**
 * App-wide, non-blocking feedback messages shown in the corner of the screen.
 * Use this instead of console-only logging or alert() so users always know
 * whether an action worked.
 */
@Injectable({
  providedIn: 'root'
})
export class ToastService {
  readonly toasts = signal<Toast[]>([]);
  private nextId = 1;

  success(title: string, message?: string): void {
    this.show('success', title, message);
  }

  info(title: string, message?: string): void {
    this.show('info', title, message);
  }

  warning(title: string, message?: string): void {
    this.show('warning', title, message, 6000);
  }

  /**
   * Shows an error toast. When an HttpErrorResponse is passed, a readable
   * explanation is derived from it instead of exposing raw server output.
   */
  error(title: string, error?: unknown): void {
    this.show('error', title, this.describeError(error), 7000);
  }

  dismiss(id: number): void {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }

  private show(tone: ToastTone, title: string, message?: string, duration = 4000): void {
    const id = this.nextId++;
    // Keep the stack short so toasts never cover the page.
    this.toasts.update(list => [...list.slice(-3), { id, tone, title, message }]);
    setTimeout(() => this.dismiss(id), duration);
  }

  private describeError(error: unknown): string | undefined {
    if (typeof error === 'string') {
      return error;
    }
    if (!(error instanceof HttpErrorResponse)) {
      return undefined;
    }

    const serverMessage = typeof error.error === 'string'
      ? error.error
      : error.error?.message;

    switch (error.status) {
      case 0:
        return 'Cannot reach the server. Check your connection and try again.';
      case 400:
        return serverMessage || 'Some of the information provided is not valid.';
      case 403:
        return 'You do not have permission to do this.';
      case 404:
        return 'The record could not be found. It may have been removed.';
      case 409:
        return serverMessage || 'This conflicts with an existing record.';
      default:
        return error.status >= 500
          ? 'The server ran into a problem. Please try again in a moment.'
          : serverMessage;
    }
  }
}
