// header.component.ts
import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBell, faSun, faMoon } from '@fortawesome/free-solid-svg-icons';
import { Router, RouterLink } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode';

import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { NotificationService } from '../../services/notification.service';
import { User } from '../../models/user.model';
import { Notification } from '../../models/notification.model';
import {ConfirmDialogComponent} from '../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, RouterLink, ConfirmDialogComponent],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  faBell = faBell;
  faSun = faSun;
  faMoon = faMoon;
  isDarkMode = false;
  showDialog = false;

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


  constructor(
    private authService: AuthService,
    private userService: UserService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadTheme();
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
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    this.stopNotificationPolling();
    clearInterval(this.intervalId);
  }

  startNotificationPolling(): void {
    this.notificationSubscription = interval(10000) // Poll every 10 seconds
      .pipe(
        switchMap(() => this.notificationService.getUnreadNotifications())
      )
      .subscribe(notifications => {
        this.notifications = notifications;
        this.unreadCount = notifications.length;
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
            this._performLogout(); // Change 'this.logout()' to 'this._performLogout()'
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
    this.notificationService.markAsRead(notification.id).subscribe(() => {
      this.notificationMenuOpen = false;
      this.router.navigate(['/project-detail', notification.project.id]);
    });
  }

  toggleNotificationMenu(): void {
    this.notificationMenuOpen = !this.notificationMenuOpen;
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

  loadTheme(): void {
    const savedTheme = localStorage.getItem('theme');
    this.isDarkMode = savedTheme === 'dark';
    document.documentElement.classList.toggle('dark', this.isDarkMode);
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

  toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;
    document.documentElement.classList.toggle('dark', this.isDarkMode);
    localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  // New method to initiate the logout confirmation
  confirmLogout(): void {
    this.showDialog = true;
    this.closeMenu();
  }

  // Handle the confirmation from the dialog
  onConfirm(confirmed: boolean): void {
    if (confirmed) {
      this._performLogout();
    }
    this.showDialog = false;
  }

  // The actual logout logic, now a private method
  private _performLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
