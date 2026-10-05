import { Component, ElementRef, HostListener, ViewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faCircleCheck,
  faCircleExclamation,
  faCircleInfo,
  faTriangleExclamation,
  faXmark
} from '@fortawesome/free-solid-svg-icons';
import { ToastService, ToastTone } from '../../../services/toast.service';
import { ConfirmService } from '../../../services/confirm.service';

/**
 * Mounted once in the app root. Renders toast notifications and the shared
 * confirmation dialog driven by ToastService / ConfirmService.
 */
@Component({
  selector: 'app-feedback-host',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  template: `
    <div class="toast-stack" aria-live="polite" aria-atomic="false">
      <div
        *ngFor="let toast of toastService.toasts(); trackBy: trackById"
        class="toast-card"
        [ngClass]="'toast-' + toast.tone"
        [attr.role]="toast.tone === 'error' ? 'alert' : 'status'"
      >
        <fa-icon [icon]="iconFor(toast.tone)" class="toast-icon"></fa-icon>
        <div class="toast-copy">
          <strong>{{ toast.title }}</strong>
          <span *ngIf="toast.message">{{ toast.message }}</span>
          <button
            *ngIf="toast.action as action"
            type="button"
            class="app-btn app-btn-primary app-btn-sm toast-action"
            (click)="action.run(); toastService.dismiss(toast.id)"
          >
            {{ action.label }}
          </button>
        </div>
        <button type="button" class="toast-close" (click)="toastService.dismiss(toast.id)" aria-label="Dismiss message">
          <fa-icon [icon]="faXmark"></fa-icon>
        </button>
      </div>
    </div>

    <div
      *ngIf="confirmService.active() as dialog"
      class="app-dialog-backdrop"
      (click)="confirmService.close(false)"
    >
      <div
        class="app-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="app-confirm-title"
        aria-describedby="app-confirm-message"
        (click)="$event.stopPropagation()"
      >
        <div class="app-dialog-icon" [class.danger]="dialog.tone === 'danger'">
          <fa-icon [icon]="dialog.tone === 'danger' ? faTriangleExclamation : faCircleInfo"></fa-icon>
        </div>
        <h3 id="app-confirm-title">{{ dialog.title }}</h3>
        <p id="app-confirm-message">{{ dialog.message }}</p>
        <div class="app-dialog-actions">
          <button type="button" class="app-btn app-btn-secondary" (click)="confirmService.close(false)">
            {{ dialog.cancelText }}
          </button>
          <button
            #confirmButton
            type="button"
            class="app-btn"
            [ngClass]="dialog.tone === 'danger' ? 'app-btn-danger' : 'app-btn-primary'"
            (click)="confirmService.close(true)"
          >
            {{ dialog.confirmText }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class FeedbackHostComponent {
  @ViewChild('confirmButton') confirmButton?: ElementRef<HTMLButtonElement>;

  faXmark = faXmark;
  faCircleInfo = faCircleInfo;
  faTriangleExclamation = faTriangleExclamation;

  constructor(public toastService: ToastService, public confirmService: ConfirmService) {
    // Move keyboard focus into the dialog when it opens.
    effect(() => {
      if (this.confirmService.active()) {
        setTimeout(() => this.confirmButton?.nativeElement.focus());
      }
    });
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.confirmService.close(false);
  }

  iconFor(tone: ToastTone) {
    switch (tone) {
      case 'success': return faCircleCheck;
      case 'error': return faCircleExclamation;
      case 'warning': return faTriangleExclamation;
      default: return faCircleInfo;
    }
  }

  trackById(_: number, toast: { id: number }): number {
    return toast.id;
  }
}
