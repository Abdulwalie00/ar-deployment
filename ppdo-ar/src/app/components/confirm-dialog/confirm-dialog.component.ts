import { Component, Input, Output, EventEmitter, HostListener, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCircleInfo, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';

@Component({
  standalone: true,
  selector: 'app-confirm-dialog',
  imports: [CommonModule, FontAwesomeModule],
  template: `
    <div class="app-dialog-backdrop" (click)="confirm.emit(false)">
      <div
        class="app-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        (click)="$event.stopPropagation()"
      >
        <div class="app-dialog-icon" [class.danger]="tone === 'danger'">
          <fa-icon [icon]="tone === 'danger' ? faTriangleExclamation : faCircleInfo"></fa-icon>
        </div>
        <h3 id="confirm-dialog-title">{{ title }}</h3>
        <p id="confirm-dialog-message">{{ message }}</p>
        <div class="app-dialog-actions">
          <button type="button" class="app-btn app-btn-secondary" (click)="confirm.emit(false)">
            {{ cancelText }}
          </button>
          <button
            #confirmButton
            type="button"
            class="app-btn"
            [ngClass]="tone === 'danger' ? 'app-btn-danger' : 'app-btn-primary'"
            (click)="confirm.emit(true)"
          >
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class ConfirmDialogComponent implements AfterViewInit {
  @Input() title = 'Please confirm';
  @Input() message = 'Are you sure you want to proceed?';
  @Input() confirmText = 'Confirm';
  @Input() cancelText = 'Cancel';
  @Input() tone: 'default' | 'danger' = 'default';
  @Output() confirm = new EventEmitter<boolean>();

  @ViewChild('confirmButton') confirmButton?: ElementRef<HTMLButtonElement>;

  faCircleInfo = faCircleInfo;
  faTriangleExclamation = faTriangleExclamation;

  ngAfterViewInit(): void {
    setTimeout(() => this.confirmButton?.nativeElement.focus());
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.confirm.emit(false);
  }
}
