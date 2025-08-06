import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBell, faSun, faMoon } from '@fortawesome/free-solid-svg-icons';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { jwtDecode } from 'jwt-decode';

import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, RouterLink],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  faBell = faBell;
  faSun = faSun;
  faMoon = faMoon;
  isDarkMode = false;

  currentTime: string = '';
  menuOpen = false;
  currentUser: User | null = null;
  initials: string = '';
  avatarColor: string = '#000000';
  divisionLogoUrl: string | null = null; // New property for the logo

  private intervalId: any;
  private authSubscription!: Subscription;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadTheme();
    this.startTimeUpdater();

    this.authSubscription = this.authService.isAuthenticated$.subscribe(isAuthenticated => {
      if (isAuthenticated) {
        this.fetchCurrentUserProfile();
      } else {
        this.currentUser = null;
        this.initials = '';
        this.divisionLogoUrl = null; // Clear logo on logout
      }
    });
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    clearInterval(this.intervalId);
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

            // Set the division logo URL
            if (user.division?.code) {
              this.divisionLogoUrl = `app/assets/logos/${user.division.code}.png`;
            } else {
              this.divisionLogoUrl = null; // Or a default logo
            }
          },
          error: (err) => {
            console.error('Failed to fetch user:', err);
            this.logout();
          }
        });
      } catch (error) {
        console.error('Invalid token:', error);
        this.logout();
      }
    }
  }

  createAvatar() {
    if (this.currentUser) {
      this.initials = (this.currentUser.firstName.charAt(0) + this.currentUser.lastName.charAt(0)).toUpperCase();
      this.avatarColor = this.generateColor(this.currentUser.username);
    }
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

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
    this.closeMenu();
  }
}
