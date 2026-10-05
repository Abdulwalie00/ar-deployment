import { AfterViewInit, Component, ElementRef, EventEmitter, HostListener, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {AuthService} from '../../services/auth.service';

@Component({
  selector: 'app-password-verification-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './password-verification-dialog.component.html',
})
export class PasswordVerificationDialogComponent implements AfterViewInit {
  @Output() confirmed = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();
  @ViewChild('passwordInput') passwordInput?: ElementRef<HTMLInputElement>;

  password = '';
  errorMessage = '';
  isLoading = false;

  constructor(private authService: AuthService) {}

  ngAfterViewInit(): void {
    setTimeout(() => this.passwordInput?.nativeElement.focus());
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeDialog();
  }

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
        this.password = '';
        this.errorMessage = err?.status === 0
          ? 'Cannot reach the server. Please try again.'
          : 'That password is not correct. Please try again.';
        this.passwordInput?.nativeElement.focus();
        console.error('Password verification failed', err);
      }
    });
  }

  closeDialog(): void {
    this.closed.emit();
  }
}
