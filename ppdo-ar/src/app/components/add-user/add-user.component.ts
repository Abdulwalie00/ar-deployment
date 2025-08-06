import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/user.service'; // <-- Import UserService
import { User, UserRole } from '../../models/user.model'; // <-- Import User model
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import {Division} from '../../models/project.model';
import {DivisionService} from '../../services/division.service';

@Component({
  standalone: true,
  selector: 'app-add-user',
  imports: [CommonModule, FormsModule, ConfirmDialogComponent],
  templateUrl: './add-user.component.html',
})
export class AddUserComponent implements OnInit {
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
  showDialog = false;

  constructor(
    private userService: UserService, // <-- Inject UserService
    private divisionService: DivisionService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDivisions();
  }

  loadDivisions(): void {
    this.divisionService.getDivisions().subscribe({
      next: (data) => {
        this.divisions = data;
      },
      error: (err) => {
        console.error('Failed to load divisions', err);
      }
    });
  }

  /**
   * Shows the confirmation dialog.
   */
  submit(): void {
    this.showDialog = true;
  }

  /**
   * Handles the confirmation. If confirmed, sends the new user data to the backend.
   */
  onConfirm(result: boolean): void {
    if (result) {
      // The payload sent to the backend should match the DTO.
      // The backend will handle the ID, password hashing, and timestamps.
      this.userService.createUser(this.user).subscribe({
        next: () => {
          console.log('User created successfully.');
          this.router.navigate(['/accounts']); // Navigate to the user list on success
        },
        error: (err) => {
          console.error('Failed to create user', err);
          // Optionally, show an error message to the user
          this.showDialog = false; // Close the dialog on error
        }
      });
    } else {
      this.showDialog = false;
    }
  }

  /**
   * Navigates back to the accounts list when the cancel button is clicked.
   */
  cancel(): void {
    this.router.navigate(['/accounts']);
  }
}
