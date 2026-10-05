import { Injectable, NgZone, signal } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs/operators';
import { ToastService } from './toast.service';

/** Chrome/Edge's install prompt event (not yet in TypeScript's DOM types). */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface Window {
    /** Captured by the inline script in index.html, before Angular starts. */
    __installPrompt?: BeforeInstallPromptEvent;
  }
}

const UPDATE_CHECK_INTERVAL_MS = 30 * 60 * 1000;

/**
 * Desktop/mobile app behaviour: the "Install app" prompt, notices when a new
 * version is ready, and online/offline status.
 */
@Injectable({
  providedIn: 'root'
})
export class PwaService {
  /** True when the browser allows installing the app right now. */
  readonly canInstall = signal(false);
  /** True when running as an installed app window rather than a browser tab. */
  readonly isInstalled = signal(PwaService.detectInstalled());
  readonly isOnline = signal(navigator.onLine);

  private installPrompt?: BeforeInstallPromptEvent;
  private offlineToastId?: number;

  constructor(private swUpdate: SwUpdate, private toast: ToastService, private zone: NgZone) {
    this.setUpInstallPrompt();
    this.setUpConnectivity();
    this.setUpUpdates();
  }

  /** Opens the browser's install dialog. */
  async install(): Promise<void> {
    if (!this.installPrompt) {
      this.toast.info(
        'Install from your browser menu',
        'In Chrome or Edge, open the ⋮ menu and choose "Install PGLDS Project Monitoring".'
      );
      return;
    }

    const prompt = this.installPrompt;
    this.installPrompt = undefined;
    this.canInstall.set(false);
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'dismissed') {
      this.toast.info('Installation cancelled', 'You can install the app any time from your account menu.');
    }
  }

  private setUpInstallPrompt(): void {
    if (window.__installPrompt) {
      this.installPrompt = window.__installPrompt;
      this.canInstall.set(!this.isInstalled());
    }

    window.addEventListener('beforeinstallprompt', event => {
      event.preventDefault();
      this.installPrompt = event as BeforeInstallPromptEvent;
      this.canInstall.set(!this.isInstalled());
    });

    window.addEventListener('appinstalled', () => {
      this.installPrompt = undefined;
      this.canInstall.set(false);
      this.toast.success('App installed', 'Open "PGLDS Project Monitoring" from your Start menu, desktop, or taskbar.');
    });

    window.matchMedia('(display-mode: standalone), (display-mode: window-controls-overlay)')
      .addEventListener('change', () => this.isInstalled.set(PwaService.detectInstalled()));
  }

  private setUpConnectivity(): void {
    window.addEventListener('offline', () => {
      this.isOnline.set(false);
      this.offlineToastId = this.toast.show(
        'warning',
        'You are offline',
        'Changes cannot be saved until your connection is back.',
        { duration: 0 }
      );
    });

    window.addEventListener('online', () => {
      this.isOnline.set(true);
      if (this.offlineToastId !== undefined) {
        this.toast.dismiss(this.offlineToastId);
        this.offlineToastId = undefined;
      }
      this.toast.success('Back online');
    });
  }

  private setUpUpdates(): void {
    if (!this.swUpdate.isEnabled) {
      return; // The service worker only runs in production builds.
    }

    this.swUpdate.versionUpdates
      .pipe(filter((event): event is VersionReadyEvent => event.type === 'VERSION_READY'))
      .subscribe(() => {
        this.toast.show('info', 'A new version is available', 'Restart to get the latest improvements.', {
          duration: 0,
          action: { label: 'Restart now', run: () => document.location.reload() }
        });
      });

    this.swUpdate.unrecoverable.subscribe(() => {
      this.toast.show('error', 'The app needs to restart', 'Part of the app could not be loaded from the cache.', {
        duration: 0,
        action: { label: 'Restart', run: () => document.location.reload() }
      });
    });

    // Installed apps can stay open for days; look for updates now and then.
    const check = () => this.swUpdate.checkForUpdate().catch(() => undefined);
    // Outside Angular's zone so the timer does not keep the app "unstable".
    this.zone.runOutsideAngular(() => setInterval(check, UPDATE_CHECK_INTERVAL_MS));
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        check();
      }
    });
  }

  private static detectInstalled(): boolean {
    return window.matchMedia('(display-mode: standalone), (display-mode: window-controls-overlay), (display-mode: minimal-ui)').matches
      || (navigator as Navigator & { standalone?: boolean }).standalone === true;
  }
}
