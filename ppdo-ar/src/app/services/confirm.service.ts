import { Injectable, signal } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  /** 'danger' styles the confirm button red for destructive actions. */
  tone?: 'default' | 'danger';
}

interface ActiveConfirm extends Required<ConfirmOptions> {
  result: Subject<boolean>;
}

/**
 * Promise-style confirmation dialog rendered once by the app shell.
 * Usage: this.confirm.ask({ message: 'Delete?' }).subscribe(ok => ...)
 */
@Injectable({
  providedIn: 'root'
})
export class ConfirmService {
  readonly active = signal<ActiveConfirm | null>(null);

  ask(options: ConfirmOptions): Observable<boolean> {
    // Resolve any dialog that is still open so its caller is not left waiting.
    this.close(false);

    const result = new Subject<boolean>();
    this.active.set({
      title: options.title ?? 'Please confirm',
      message: options.message,
      confirmText: options.confirmText ?? 'Confirm',
      cancelText: options.cancelText ?? 'Cancel',
      tone: options.tone ?? 'default',
      result
    });
    return result.asObservable();
  }

  close(confirmed: boolean): void {
    const current = this.active();
    if (!current) {
      return;
    }
    this.active.set(null);
    current.result.next(confirmed);
    current.result.complete();
  }
}
