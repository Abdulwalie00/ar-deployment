import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { UserService } from '../../services/user.service'; // <-- Import UserService
import { User } from '../../models/user.model'; // <-- Import User model
import { Division } from '../../models/project.model';
import { DivisionService } from '../../services/division.service';
import { ConfirmService } from '../../services/confirm.service';
import { ToastService } from '../../services/toast.service';
import { HasUnsavedChanges } from '../../guards/unsaved-changes.guard';

@Component({
  standalone: true,
  selector: 'app-edit-user',
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-user.component.html',
  // Same look as the "Create New User" page.
  styleUrls: ['../add-user/add-user.component.css'],
})
export class EditUserComponent implements OnInit, HasUnsavedChanges {
  @ViewChild('userForm') userForm?: NgForm;

  user: User | null = null;
  // Add a separate property for the password to avoid binding directly to a sensitive field
  password = '';
  divisionId: string | null = null;
  divisions: Division[] = [];
  showPassword = false;
  isSaving = false;
  loadError = false;
  private saved = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService, // <-- Inject UserService
    private divisionService: DivisionService,
    private confirmService: ConfirmService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    const userId = +this.route.snapshot.params['id'];
    if (isNaN(userId)) {
      this.router.navigate(['/accounts']);
      return;
    }

    this.divisionService.getDivisions().subscribe({
      next: divisions => this.divisions = [...divisions].sort((a, b) => a.name.localeCompare(b.name)),
      error: err => this.toast.error('Could not load the list of offices', err)
    });

    this.userService.getUserById(userId).subscribe({
      next: (data) => {
        if (!data) {
          this.loadError = true;
          return;
        }
        this.user = data;
        this.divisionId = data.division?.id ?? null;
      },
      error: (err) => {
        console.error('Failed to load user', err);
        this.loadError = true;
      }
    });
  }

  /**
   * Validates the form, then asks for confirmation before saving.
   */
  submit(form: NgForm): void {
    if (!this.user) {
      return;
    }
    if (form.invalid) {
      form.control.markAllAsTouched();
      this.toast.warning('Please complete the highlighted fields');
      return;
    }

    this.confirmService.ask({
      title: 'Save changes?',
      message: this.password.trim()
        ? `Update ${this.user.firstName} ${this.user.lastName}'s account and set a new password?`
        : `Update ${this.user.firstName} ${this.user.lastName}'s account details?`,
      confirmText: 'Save changes'
    }).subscribe(confirmed => {
      if (confirmed) {
        this.save();
      }
    });
  }

  private save(): void {
    if (!this.user) {
      return;
    }
    // Create a payload object with only the fields to be updated.
    const updatePayload: Partial<User> & { password?: string; divisionId?: string } = {
      firstName: this.user.firstName,
      middleName: this.user.middleName,
      lastName: this.user.lastName,
      email: this.user.email,
      username: this.user.username.trim(),
      role: this.user.role,
    };

    if (this.divisionId) {
      updatePayload.divisionId = this.divisionId;
    }

    // Only include the password in the payload if the user entered a new one.
    if (this.password && this.password.trim() !== '') {
      updatePayload.password = this.password;
    }

    this.isSaving = true;
    this.userService.updateUser(this.user.id, updatePayload).subscribe({
      next: () => {
        this.saved = true;
        this.isSaving = false;
        this.toast.success('Account updated', `${this.user?.firstName} ${this.user?.lastName}'s details were saved.`);
        this.router.navigate(['/accounts']);
      },
      error: (err) => {
        console.error(`Failed to update user with ID ${this.user?.id}`, err);
        this.isSaving = false;
        this.toast.error(
          'The changes could not be saved',
          err?.status >= 500 ? 'The username or email may already be used by another account.' : err
        );
      }
    });
  }

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
