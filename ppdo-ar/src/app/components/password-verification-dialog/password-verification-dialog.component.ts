import { AfterViewInit, Component, ElementRef, EventEmitter, HostListener, Input, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { BudgetService, BudgetServerOutdatedError } from '../../services/budget.service';

/**
 * Asks the signed-in user for their password again. Success also unlocks
 * budget figures for a few minutes (see BudgetService).
 */
@Component({
  selector: 'app-password-verification-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './password-verification-dialog.component.html',
})
export class PasswordVerificationDialogComponent implements AfterViewInit {
  @Input() description = 'For security, enter your password to continue.';
  @Output() confirmed = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();
  @ViewChild('passwordInput') passwordInput?: ElementRef<HTMLInputElement>;

  password = '';
  errorMessage = '';
  isLoading = false;

  constructor(private budgetService: BudgetService) {}

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

    this.budgetService.unlock(this.password).subscribe({
      next: () => {
        this.isLoading = false;
        this.password = '';
        this.confirmed.emit();
      },
      error: (err: unknown) => {
        this.isLoading = false;
        this.password = '';
        this.errorMessage = this.describeError(err);
        this.passwordInput?.nativeElement.focus();
      }
    });
  }

  /** Only a 401 means the password was wrong; say so plainly for everything else. */
  private describeError(err: unknown): string {
    if (err instanceof BudgetServerOutdatedError) {
      return 'Your password was accepted, but the server is running an older version. Please restart or update the backend, then try again.';
    }
    if (!(err instanceof HttpErrorResponse)) {
      return 'Something went wrong while checking your password. Please try again.';
    }
    switch (err.status) {
      case 401:
        return 'That password is not correct. Please try again.';
      case 429:
        return err.error?.message ?? 'Too many incorrect attempts. Please wait a few minutes.';
      case 0:
      case 502:
      case 503:
      case 504:
        return 'Cannot reach the server. Check that it is running and try again.';
      default:
        return 'The server could not check your password right now. Please try again in a moment.';
    }
  }

  closeDialog(): void {
    this.closed.emit();
  }
}
