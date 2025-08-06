import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';
import { UserService } from '../../services/user.service'; // <-- Import UserService
import { User } from '../../models/user.model';
import {FormsModule} from '@angular/forms'; // <-- Import User model

@Component({
  standalone: true,
  selector: 'app-manage-accounts',
  imports: [CommonModule, ConfirmDialogComponent, FormsModule],
  templateUrl: './manage-accounts.component.html',
})
export class ManageAccountsComponent implements OnInit {
  users: User[] = [];
  paginatedUsers: User[] = [];
  showDialog = false;
  dialogMessage = '';
  confirmAction: (() => void) | null = null;

  // Pagination properties
  currentPage: number = 1;
  itemsPerPage: number = 10;
  itemsPerPageOptions: number[] = [10, 20, 50, 100];
  totalPages: number = 0;

  // Inject UserService instead of AuthService
  constructor(private userService: UserService, private router: Router) {}

  // Use ngOnInit for initial data loading
  ngOnInit(): void {
    this.loadUsers();
  }

  /**
   * Fetches the list of users from the backend API.
   */
  loadUsers(): void {
    this.userService.getUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.updatePagination();
      },
      error: (err) => {
        console.error('Failed to load users', err);
        if (err.status === 403) {
          alert('You need ADMIN privileges to access this page');
        }
      }
    });
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.users.length / this.itemsPerPage);
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedUsers = this.users.slice(startIndex, endIndex);
  }

  onItemsPerPageChange(): void {
    this.currentPage = 1;
    this.updatePagination();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  navigateToAdd(): void {
    this.router.navigate(['/accounts/add']);
  }

  navigateToEdit(userId: number): void {
    this.router.navigate(['/accounts/edit', userId]);
  }

  /**
   * Sets up the confirmation dialog for deleting a user.
   */
  confirmDelete(userId: number): void {
    const user = this.users.find(u => u.id === userId);
    if (!user) return;

    const fullName = [user.firstName, user.middleName, user.lastName].filter(Boolean).join(' ');
    this.dialogMessage = `Are you sure you want to delete "${fullName}"?`;

    // The action to perform when the user confirms
    this.confirmAction = () => {
      this.userService.deleteUser(userId).subscribe({
        next: () => {
          console.log(`User with ID ${userId} deleted successfully.`);
          this.loadUsers(); // Refresh the user list from the server
        },
        error: (err) => console.error(`Failed to delete user with ID ${userId}`, err)
      });
    };

    this.showDialog = true;
  }

  /**
   * Handles the result from the confirmation dialog.
   */
  onConfirm(result: boolean): void {
    if (result && this.confirmAction) {
      this.confirmAction();
    }
    this.showDialog = false;
    this.confirmAction = null; // Clear the action
  }
}
