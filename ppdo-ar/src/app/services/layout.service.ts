import { Injectable, signal } from '@angular/core';

/** Shared UI state for the app shell (e.g. the mobile navigation drawer). */
@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  readonly mobileNavOpen = signal(false);

  toggleMobileNav(): void {
    this.mobileNavOpen.update(open => !open);
  }

  closeMobileNav(): void {
    this.mobileNavOpen.set(false);
  }
}
