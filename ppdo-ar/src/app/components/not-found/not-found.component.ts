import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="flex items-center justify-center min-h-screen bg-gray-100">
      <div class="text-center">
        <h1 class="text-9xl font-bold text-gray-800">404</h1>
        <p class="text-2xl md:text-3xl text-gray-600 mt-4">Page Not Found</p>
        <p class="text-gray-500 mt-2">Sorry, the page you are looking for does not exist.</p>
        <a routerLink="/" class="mt-6 inline-block px-6 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700">
          Go Back Home
        </a>
      </div>
    </div>
  `
})
export class NotFoundComponent {}
