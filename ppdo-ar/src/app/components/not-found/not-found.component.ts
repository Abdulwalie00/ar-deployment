import { Component } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import {RouterLink} from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="flex items-center justify-center min-h-screen p-4">
      <div class="app-card app-state" style="max-width: 32rem; width: 100%; padding: 3rem 1.5rem;">
        <div class="text-7xl font-bold" style="color: var(--app-primary); line-height: 1;">404</div>
        <h3>We can't find that page</h3>
        <p>The link may be broken, or the page may have been moved. Check the address, or head back to somewhere familiar.</p>
        <div class="flex flex-wrap justify-center gap-2 mt-3">
          <button type="button" class="app-btn app-btn-secondary" (click)="goBack()">Go back</button>
          <a [routerLink]="isSignedIn ? '/project-dashboard' : '/login'" class="app-btn app-btn-primary">
            {{ isSignedIn ? 'Go to dashboard' : 'Go to sign in' }}
          </a>
        </div>
      </div>
    </div>
  `
})
export class NotFoundComponent {
  readonly isSignedIn: boolean;

  constructor(private location: Location, authService: AuthService) {
    this.isSignedIn = authService.hasValidToken();
  }

  goBack(): void {
    this.location.back();
  }
}
