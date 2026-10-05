import { Component, NgZone, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { NavigationCancel, NavigationEnd, NavigationError, Router, RouterOutlet } from '@angular/router';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { ThemeService } from './services/theme.service';
import { PwaService } from './services/pwa.service';
import { FeedbackHostComponent } from './components/shared/feedback-host/feedback-host.component';
import { APP_NAME } from './app-title.strategy';

declare global {
  interface Window {
    /** Defined in index.html: fades out the opening splash screen. */
    __hideSplash?: () => void;
  }
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, FontAwesomeModule, FeedbackHostComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnDestroy {
  title = 'PPDO-AR';
  readonly appName = APP_NAME;
  /** Current page name, shown in the desktop app's title bar. */
  pageTitle = '';
  private navSubscription: Subscription;
  private titleObserver?: MutationObserver;

  constructor(
    private themeService: ThemeService,
    // Created here so install/update/offline handling starts with the app.
    public pwa: PwaService,
    router: Router,
    titleService: Title,
    zone: NgZone
  ) {
    this.themeService.applySavedPreferences();

    this.navSubscription = router.events
      .pipe(filter(event =>
        event instanceof NavigationEnd || event instanceof NavigationCancel || event instanceof NavigationError))
      .subscribe(() => {
        // The first page is on screen: let the splash animation finish and leave.
        requestAnimationFrame(() => window.__hideSplash?.());
      });

    // Mirror the tab title (which pages may set after loading their data)
    // in the desktop app's title bar.
    const updatePageTitle = () => {
      const fullTitle = titleService.getTitle();
      this.pageTitle = fullTitle.endsWith(` · ${APP_NAME}`) ? fullTitle.slice(0, -(APP_NAME.length + 3)) : '';
    };
    const titleElement = document.querySelector('title');
    if (titleElement) {
      this.titleObserver = new MutationObserver(() => zone.run(updatePageTitle));
      this.titleObserver.observe(titleElement, { childList: true, characterData: true, subtree: true });
    }
    updatePageTitle();
  }

  ngOnDestroy(): void {
    this.navSubscription.unsubscribe();
    this.titleObserver?.disconnect();
  }

  /** Keyboard shortcut past the navigation (a plain #hash link would reload the app because of <base href>). */
  skipToMain(event: Event): void {
    event.preventDefault();
    const main = document.getElementById('main-content');
    if (main) {
      if (!main.hasAttribute('tabindex')) {
        main.setAttribute('tabindex', '-1');
      }
      main.focus();
    }
  }
}
