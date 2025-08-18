import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import {AuthService} from '../../services/auth.service';

@Component({
  selector: 'app-password-verification-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  templateUrl: './password-verification-dialog.component.html',
})
export class PasswordVerificationDialogComponent {
  @Output() confirmed = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  password = '';
  errorMessage = '';
  isLoading = false;
  faSpinner = faSpinner;

  constructor(private authService: AuthService) {}

  verifyPassword(): void {
    if (!this.password) {
      this.errorMessage = 'Password is required.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.verifyPassword(this.password).subscribe({
      next: () => {
        this.isLoading = false;
        this.confirmed.emit();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'Incorrect password. Please try again.';
        console.error('Password verification failed', err);
      }
    });
  }

  closeDialog(): void {
    this.closed.emit();
  }
}
