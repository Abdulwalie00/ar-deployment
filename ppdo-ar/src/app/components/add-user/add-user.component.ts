import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/user.service'; // <-- Import UserService
import { UserRole } from '../../models/user.model'; // <-- Import User model
import {Division} from '../../models/project.model';
import {DivisionService} from '../../services/division.service';
import { ConfirmService } from '../../services/confirm.service';
import { ToastService } from '../../services/toast.service';
import { HasUnsavedChanges } from '../../guards/unsaved-changes.guard';

@Component({
  standalone: true,
  selector: 'app-add-user',
  imports: [CommonModule, FormsModule],
  templateUrl: './add-user.component.html',
  styleUrls: ['./add-user.component.css']
})
export class AddUserComponent implements OnInit, HasUnsavedChanges {
  @ViewChild('userForm') userForm?: NgForm;

  // Define the user object for the form
  user = {
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    username: '',
    password: '', // Use a 'password' field, not 'passwordHash'
    role: 'ROLE_USER' as UserRole, // Default to a safe role
    divisionId: null,
  };

  divisions: Division[] = [];
  showPassword = false;
  isSaving = false;
  private saved = false;

  constructor(
    private userService: UserService, // <-- Inject UserService
    private divisionService: DivisionService,
    private confirmService: ConfirmService,
    private toast: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDivisions();
  }

  loadDivisions(): void {
    this.divisionService.getDivisions().subscribe({
      next: (data) => {
        this.divisions = [...data].sort((a, b) => a.name.localeCompare(b.name));
      },
      error: (err) => {
        console.error('Failed to load divisions', err);
        this.toast.error('Could not load the list of offices', err);
      }
    });
  }

  /**
   * Validates the form, then asks for confirmation before creating the user.
   */
  submit(form: NgForm): void {
    if (form.invalid) {
      form.control.markAllAsTouched();
      this.toast.warning('Please complete the highlighted fields');
      return;
    }

    this.confirmService.ask({
      title: 'Create this account?',
      message: `${this.user.firstName} ${this.user.lastName} will be able to sign in as "${this.user.username.trim()}".`,
      confirmText: 'Create account'
    }).subscribe(confirmed => {
      if (confirmed) {
        this.createUser();
      }
    });
  }

  private createUser(): void {
    this.isSaving = true;
    // The payload sent to the backend should match the DTO.
    // The backend will handle the ID, password hashing, and timestamps.
    const payload = { ...this.user, username: this.user.username.trim(), email: this.user.email.trim() };
    this.userService.createUser(payload as any).subscribe({
      next: () => {
        this.saved = true;
        this.isSaving = false;
        this.toast.success('Account created', `${this.user.firstName} ${this.user.lastName} can now sign in.`);
        this.router.navigate(['/accounts']); // Navigate to the user list on success
      },
      error: (err) => {
        console.error('Failed to create user', err);
        this.isSaving = false;
        // Most failures here are a username or email that is already taken.
        this.toast.error(
          'The account could not be created',
          err?.status >= 500 || err?.status === 409
            ? 'The username or email may already be in use. Try a different one.'
            : err
        );
      }
    });
  }

  /**
   * Navigates back to the accounts list when the cancel button is clicked.
   */
  cancel(): void {
    this.router.navigate(['/accounts']);
  }

  hasUnsavedChanges(): boolean {
    return !this.saved && !!this.userForm?.dirty;
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.hasUnsavedChanges()) {
      event.preventDefault();
    }
  }
}
