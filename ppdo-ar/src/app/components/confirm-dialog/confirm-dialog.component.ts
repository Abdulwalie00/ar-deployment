import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-confirm-dialog',
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full transform transition-all duration-300 scale-95 hover:scale-100 border border-gray-200 dark:border-gray-700">
        <!-- Header with icon -->
        <div class="flex items-center justify-center p-6 border-b border-gray-100 dark:border-gray-700">
          <div class="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>

        <!-- Message -->
        <div class="p-6">
          <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-2 text-center">Confirm Action</h3>
          <p class="text-gray-600 dark:text-gray-300 text-center">{{ message }}</p>
        </div>

        <!-- Buttons -->
        <div class="flex flex-col sm:flex-row gap-3 p-6 bg-gray-50 dark:bg-gray-700/30 rounded-b-xl">
          <button
            (click)="confirm.emit(false)"
            class="px-5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 font-medium flex-1">
            Cancel
          </button>
          <button
            (click)="confirm.emit(true)"
            class="px-5 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 font-medium flex-1">
            Confirm
          </button>
        </div>
      </div>
    </div>
  `,
})
export class ConfirmDialogComponent {
  @Input() message = 'Are you sure you want to proceed?';
  @Output() confirm = new EventEmitter<boolean>();
}
