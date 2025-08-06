import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service'; // <-- Import UserService
import { User } from '../../models/user.model'; // <-- Import User model
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

@Component({
  standalone: true,
  selector: 'app-edit-user',
  imports: [CommonModule, FormsModule, ConfirmDialogComponent],
  templateUrl: './edit-user.component.html',
})
export class EditUserComponent implements OnInit {
  user: User | null = null;
  // Add a separate property for the password to avoid binding directly to a sensitive field
  password = '';
  showDialog = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService // <-- Inject UserService
  ) {}

  ngOnInit(): void {
    const userId = +this.route.snapshot.params['id'];
    if (isNaN(userId)) {
      this.router.navigate(['/accounts']);
      return;
    }

    this.userService.getUserById(userId).subscribe({
      next: (data) => {
        this.user = data;
      },
      error: (err) => {
        console.error('Failed to load user', err);
        this.router.navigate(['/accounts']); // Redirect if user not found
      }
    });
  }

  /**
   * Shows the confirmation dialog before submitting the update.
   */
  submit(): void {
    if (this.user) {
      this.showDialog = true;
    }
  }

  /**
   * Handles the confirmation result from the dialog.
   * If confirmed, sends the updated user data to the backend.
   */
  onConfirm(result: boolean): void {
    if (result && this.user) {
      // Create a payload object with only the fields to be updated.
      const updatePayload: Partial<User> & { password?: string } = {
        firstName: this.user.firstName,
        middleName: this.user.middleName,
        lastName: this.user.lastName,
        email: this.user.email,
        username: this.user.username,
        role: this.user.role,
      };

      // Only include the password in the payload if the user entered a new one.
      if (this.password && this.password.trim() !== '') {
        updatePayload.password = this.password;
      }

      this.userService.updateUser(this.user.id, updatePayload).subscribe({
        next: () => {
          console.log(`User with ID ${this.user?.id} updated successfully.`);
          this.router.navigate(['/accounts']);
        },
        error: (err) => {
          console.error(`Failed to update user with ID ${this.user?.id}`, err);
          this.showDialog = false; // Keep the dialog open on error if desired
        }
      });
    } else {
      this.showDialog = false;
    }
  }

  cancel(): void {
    this.router.navigate(['/accounts']);
  }
}
