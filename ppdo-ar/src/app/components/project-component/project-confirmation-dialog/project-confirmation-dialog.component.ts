// src/app/components/project-confirmation-dialog/project-confirmation-dialog.component.ts
import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCircleInfo, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-project-confirmation-dialog',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './project-confirmation-dialog.component.html',
  styleUrl: './project-confirmation-dialog.component.css'
})
export class ProjectConfirmationDialogComponent {
  @Input() show: boolean = false;
  @Input() title: string = 'Please confirm';
  @Input() message: string = 'Are you sure?';
  @Input() confirmText: string = 'Confirm';
  @Input() tone: 'default' | 'danger' = 'default';
  @Output() confirmed = new EventEmitter<boolean>();

  faCircleInfo = faCircleInfo;
  faTriangleExclamation = faTriangleExclamation;

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.show) {
      this.onCancel();
    }
  }

  onConfirm(): void {
    this.confirmed.emit(true);
  }

  onCancel(): void {
    this.confirmed.emit(false);
  }
}
