import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-loading-dialog',
  standalone: true,
  imports: [CommonModule, FaIconComponent],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-xs text-center">
        <fa-icon [icon]="faSpinner" class="text-blue-500 text-4xl mb-4 animate-spin"></fa-icon>
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white">{{ message }}</h3>
      </div>
    </div>
  `,
  styleUrls: ['./loading-dialog.component.css'] // Add this line
})
export class LoadingDialogComponent {
  @Input() message: string = 'Please wait...';
  faSpinner = faSpinner;
}
