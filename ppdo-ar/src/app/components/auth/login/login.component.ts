import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import {NgIf} from '@angular/common';
import {
  trigger,
  transition,
  style,
  animate,
} from '@angular/animations';
import { AuthService } from '../../../services/auth.service';
import { PwaService } from '../../../services/pwa.service';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import {FaIconComponent} from '@fortawesome/angular-fontawesome';

declare var FinisherHeader: any; // Declare the library


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    FormsModule,
    NgIf,
    FaIconComponent
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  animations: [
    trigger('fadeInAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('500ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
  ],
})
export class LoginComponent {
  username = '';
  password = '';
  error = '';
  loading = false;
  success = false;
  showPassword = false;
  capsLockOn = false;
  private returnUrl = '/project-dashboard';


  // We inject the AuthService and Router.
  constructor(private authService: AuthService, private router: Router, route: ActivatedRoute, public pwa: PwaService) {
    const requested = route.snapshot.queryParamMap.get('returnUrl');
    // Only follow in-app paths so the link cannot redirect off-site.
    if (requested && requested.startsWith('/') && !requested.startsWith('//')) {
      this.returnUrl = requested;
    }
  }
  ldsLogoUrl: string = 'app/assets/logos/LDS.png';
  ictoLogoUrl: string = 'app/assets/logos/ICTO.png';
  icon = faCheck;

  get hasReturnUrl(): boolean {
    return this.returnUrl !== '/project-dashboard';
  }

  onPasswordKey(event: KeyboardEvent): void {
    this.capsLockOn = event.getModifierState?.('CapsLock') ?? false;
  }

  /**
   * This method is called when the user submits the login form.
   * It uses the AuthService to send the credentials to the backend.
   */
  login(): void {
    if (!this.username.trim() || !this.password) {
      this.error = 'Please enter both your username and password.';
      return;
    }

    this.error = '';
    this.loading = true;

    const credentials = {
      username: this.username.trim(),
      password: this.password
    };

    // We call the service's login method and "subscribe" to the response.
    this.authService.login(credentials).subscribe({
      // --- Success Case ---
      // The 'next' block runs if the backend returns a 200 OK response.
      next: () => {
        this.loading = false;
        this.success = true;
        // Short pause so the success state registers, then continue.
        setTimeout(() => {
          this.router.navigateByUrl(this.returnUrl);
        }, 500);
      },
      // --- Error Case ---
      // The 'error' block runs if the backend returns an error (e.g., 401, 403).
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        this.password = '';
        // Tell the user what actually went wrong, in plain words.
        if (err.status === 429) {
          this.error = err.error?.message ?? 'Too many incorrect attempts. Please wait a few minutes and try again.';
        } else if (err.status === 0) {
          this.error = 'Cannot reach the server. Check your network connection and try again.';
        } else if (err.status >= 500) {
          this.error = 'The server is having trouble right now. Please try again in a moment.';
        } else {
          this.error = 'Incorrect username or password. Please try again.';
        }
        console.error('Login failed', err); // Log the technical error for debugging.
      }
    });
  }

  ngAfterViewInit(): void {
    // Only initialize if the script is loaded
    if ((window as any).FinisherHeader) {
      new FinisherHeader({
        "count": 31,
        "size": { "min": 1, "max": 37, "pulse": 0 },
        "speed": { "x": { "min": 0, "max": 0.7 }, "y": { "min": 0, "max": 0.6 } },
        "colors": {
          "background": "#1a3b71",
          "particles": ["#fbfcca", "#d7f3fe", "#ffd0a7"]
        },
        "blending": "overlay",
        "opacity": { "center": 0.6, "edge": 0 },
        "skew": -2,
        "shapes": ["c"],
        "element": "finisher-header" // Target the div you created
      });
    }
  }
}
