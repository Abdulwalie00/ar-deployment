// header.component.ts
import { ChangeDetectorRef, Component, ElementRef, HostListener, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBell, faSun, faMoon, faBars, faUser, faRightFromBracket, faDownload } from '@fortawesome/free-solid-svg-icons';
import { Router, RouterLink } from '@angular/router';
import { Subscription, of, timer } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode';

import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { NotificationService } from '../../services/notification.service';
import { User, roleLabel } from '../../models/user.model';
import { Notification } from '../../models/notification.model';
import { ThemeService } from '../../services/theme.service';
import { LayoutService } from '../../services/layout.service';
import { ConfirmService } from '../../services/confirm.service';
import { ToastService } from '../../services/toast.service';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';
import { PwaService } from '../../services/pwa.service';

const NOTIFICATION_POLL_MS = 15000;

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, RouterLink, TimeAgoPipe],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  faBell = faBell;
  faSun = faSun;
  faMoon = faMoon;
  faBars = faBars;
  faUser = faUser;
  faRightFromBracket = faRightFromBracket;
  faDownload = faDownload;
  isDarkMode = false;

  notifications: Notification[] = [];
  unreadCount = 0;
  notificationMenuOpen = false;

  currentTime: string = '';
  menuOpen = false;
  currentUser: User | null = null;
  initials: string = '';
  avatarColor: string = '#000000';
  divisionLogoUrl: string | null = null;

  private intervalId: any;
  private authSubscription!: Subscription;
  private notificationSubscription!: Subscription;
  private profileSubscription!: Subscription;


  constructor(
    private authService: AuthService,
    private userService: UserService,
    private notificationService: NotificationService,
    private themeService: ThemeService,
    private confirmService: ConfirmService,
    private toast: ToastService,
    public layout: LayoutService,
    public pwa: PwaService,
    private el: ElementRef,
    private changeDetector: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.themeService.applySavedPreferences();
    this.isDarkMode = this.themeService.isDarkMode();
    this.startTimeUpdater();

    this.authSubscription = this.authService.isAuthenticated$.subscribe(isAuthenticated => {
      if (isAuthenticated) {
        this.fetchCurrentUserProfile();
        this.startNotificationPolling();
      } else {
        this.currentUser = null;
        this.initials = '';
        this.divisionLogoUrl = null;
        this.stopNotificationPolling();
      }
    });

    this.profileSubscription = this.userService.profileUpdated$.subscribe(user => {
      this.currentUser = user;
      this.createAvatar();
    });
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    this.profileSubscription?.unsubscribe();
    this.stopNotificationPolling();
    clearInterval(this.intervalId);
  }

  get roleName(): string {
    return roleLabel(this.currentUser?.role ?? this.authService.getUserRole());
  }

  /** Close open menus when clicking anywhere else on the page. */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.el.nativeElement.contains(event.target)) {
      this.closeMenus();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeMenus();
  }

  startNotificationPolling(): void {
    this.stopNotificationPolling();
    // Load right away, then keep the badge fresh in the background.
    this.notificationSubscription = timer(0, NOTIFICATION_POLL_MS)
      .pipe(
        switchMap(() => this.notificationService.getUnreadNotifications().pipe(
          catchError(() => of(null)) // Keep polling through brief network hiccups.
        ))
      )
      .subscribe(notifications => {
        if (notifications) {
          this.notifications = notifications.sort(
            (a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime()
          );
          this.unreadCount = notifications.length;
        }
      });
  }

  stopNotificationPolling(): void {
    if (this.notificationSubscription) {
      this.notificationSubscription.unsubscribe();
    }
  }

  fetchCurrentUserProfile(): void {
    const token = this.authService.getToken();
    if (token) {
      try {
        const decodedToken: any = jwtDecode(token);
        const username = decodedToken.sub || decodedToken.username;

        if (!username) {
          throw new Error('Username not found in token');
        }

        this.userService.getUserByUsername(username).subscribe({
          next: (user) => {
            this.currentUser = user;
            this.createAvatar();

            if (user.division?.code) {
              this.divisionLogoUrl = `app/assets/logos/${user.division.code}.png`;
            } else {
              this.divisionLogoUrl = null;
            }
          },
          error: (err) => {
            console.error('Failed to fetch user:', err);
            // Being offline is not a reason to end the session.
            if (err?.status !== 0) {
              this._performLogout();
            }
          }
        });
      } catch (error) {
        console.error('Invalid token:', error);
        this._performLogout(); // Change 'this.logout()' to 'this._performLogout()'
      }
    }
  }

  createAvatar() {
    if (this.currentUser) {
      this.initials = (this.currentUser.firstName.charAt(0) + this.currentUser.lastName.charAt(0)).toUpperCase();
      this.avatarColor = this.generateColor(this.currentUser.username);
    }
  }

  onNotificationClick(notification: Notification): void {
    this.notificationMenuOpen = false;
    // Update the badge right away so the click feels instant.
    this.notifications = this.notifications.filter(n => n.id !== notification.id);
    this.unreadCount = this.notifications.length;

    this.notificationService.markAsRead(notification.id).subscribe({
      error: () => { /* The next poll restores the true state. */ }
    });
    if (notification.project?.id) {
      this.router.navigate(['/project-detail', notification.project.id]);
    }
  }

  toggleNotificationMenu(): void {
    this.notificationMenuOpen = !this.notificationMenuOpen;
    this.menuOpen = false;
  }

  generateColor(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = '#';
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xFF;
      color += ('00' + value.toString(16)).substr(-2);
    }
    return color;
  }

  startTimeUpdater(): void {
    this.updateTime();
    this.intervalId = setInterval(() => this.updateTime(), 1000);
  }

  updateTime(): void {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  toggleDarkMode(event?: MouseEvent): void {
    // Reveal the new theme from the centre of the toggle button.
    const button = (event?.currentTarget as HTMLElement | null)?.getBoundingClientRect();
    const origin = button ? { x: button.left + button.width / 2, y: button.top + button.height / 2 } : undefined;

    this.themeService.toggleDarkModeAnimated(origin, () => {
      this.isDarkMode = this.themeService.isDarkMode();
      // Render the new icon before the browser captures the "after" screen.
      this.changeDetector.detectChanges();
    });
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
    this.notificationMenuOpen = false;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  private closeMenus(): void {
    this.menuOpen = false;
    this.notificationMenuOpen = false;
  }

  installApp(): void {
    this.closeMenu();
    void this.pwa.install();
  }

  // Ask before signing out so a stray click does not end the session.
  confirmLogout(): void {
    this.closeMenu();
    this.confirmService.ask({
      title: 'Sign out?',
      message: 'You will need to enter your password again to get back in.',
      confirmText: 'Sign out'
    }).subscribe(confirmed => {
      if (confirmed) {
        this._performLogout();
        this.toast.info('You have been signed out');
      }
    });
  }

  // The actual logout logic, now a private method
  private _performLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
