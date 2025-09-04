import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faDownload } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-download-dialog',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-sm text-center">
        <h3 class="text-xl font-semibold text-gray-800 dark:text-white mb-4">Generation Complete!</h3>
        <p class="text-gray-600 dark:text-gray-300 mb-6">Your narrative report is ready to download.</p>
        <div class="flex justify-center space-x-4">
          <button
            (click)="close.emit()"
            class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          >
            Close
          </button>
          <button
            (click)="download.emit()"
            class="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <fa-icon [icon]="faDownload" class="mr-2"></fa-icon>
            Download Narrative
          </button>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class DownloadDialogComponent {
  @Output() download = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();
  faDownload = faDownload;
}
