// src/app/components/project-confirmation-dialog/project-confirmation-dialog.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-project-confirmation-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './project-confirmation-dialog.component.html',
  styleUrl: './project-confirmation-dialog.component.css'
})
export class ProjectConfirmationDialogComponent {
  @Input() show: boolean = false;
  @Input() message: string = 'Are you sure?';
  @Output() confirmed = new EventEmitter<boolean>();

  onConfirm(): void {
    this.confirmed.emit(true);
  }

  onCancel(): void {
    this.confirmed.emit(false);
  }
}
