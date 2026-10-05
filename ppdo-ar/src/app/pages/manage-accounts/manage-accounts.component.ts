import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/user.service'; // <-- Import UserService
import { User, roleLabel } from '../../models/user.model';
import {FormsModule} from '@angular/forms'; // <-- Import User model
import { AuthService } from '../../services/auth.service';
import { ConfirmService } from '../../services/confirm.service';
import { ToastService } from '../../services/toast.service';

@Component({
  standalone: true,
  selector: 'app-manage-accounts',
  imports: [CommonModule, FormsModule],
  templateUrl: './manage-accounts.component.html',
})
export class ManageAccountsComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  paginatedUsers: User[] = [];
  isLoading = true;
  loadError = false;
  searchTerm = '';
  roleFilter: string | null = null;
  readonly roleFilters = ['ROLE_SUPERADMIN', 'ROLE_ADMIN', 'ROLE_USER'];
  readonly roleLabel = roleLabel;
  currentUsername: string | null = null;

  // Pagination properties
  currentPage: number = 1;
  itemsPerPage: number = 10;
  itemsPerPageOptions: number[] = [10, 20, 50, 100];
  totalPages: number = 0;

  // Inject UserService instead of AuthService
  constructor(
    private userService: UserService,
    private router: Router,
    private authService: AuthService,
    private confirmService: ConfirmService,
    private toast: ToastService
  ) {}

  // Use ngOnInit for initial data loading
  ngOnInit(): void {
    this.currentUsername = this.authService.getUsername();
    this.loadUsers();
  }

  /**
   * Fetches the list of users from the backend API.
   */
  loadUsers(): void {
    this.isLoading = true;
    this.loadError = false;
    this.userService.getUsers().subscribe({
      next: (data) => {
        this.users = [...data].sort((a, b) =>
          `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`)
        );
        this.isLoading = false;
        this.applyFilters();
      },
      error: (err) => {
        console.error('Failed to load users', err);
        this.isLoading = false;
        this.loadError = true;
        this.toast.error('Could not load user accounts', err);
      }
    });
  }

  applyFilters(resetPage = true): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredUsers = this.users.filter(user => {
      if (this.roleFilter && user.role !== this.roleFilter) {
        return false;
      }
      if (!term) {
        return true;
      }
      return [
        user.firstName,
        user.middleName,
        user.lastName,
        user.email,
        user.username,
        user.division?.name,
        user.division?.code
      ].some(value => (value ?? '').toLowerCase().includes(term));
    });

    if (resetPage) {
      this.currentPage = 1;
    }
    this.updatePagination();
  }

  setRoleFilter(role: string | null): void {
    this.roleFilter = role;
    this.applyFilters();
  }

  countByRole(role: string | null): number {
    return role ? this.users.filter(user => user.role === role).length : this.users.length;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.roleFilter = null;
    this.applyFilters();
  }

  fullName(user: User): string {
    return [user.firstName, user.middleName, user.lastName].filter(Boolean).join(' ');
  }

  isCurrentUser(user: User): boolean {
    return !!this.currentUsername && user.username === this.currentUsername;
  }

  updatePagination(): void {
    this.totalPages = Math.max(1, Math.ceil(this.filteredUsers.length / this.itemsPerPage));
    this.currentPage = Math.min(this.currentPage, this.totalPages);
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedUsers = this.filteredUsers.slice(startIndex, endIndex);
  }

  get rangeStart(): number {
    return this.filteredUsers.length === 0 ? 0 : (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  get rangeEnd(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.filteredUsers.length);
  }

  onItemsPerPageChange(): void {
    this.itemsPerPage = Number(this.itemsPerPage);
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
   * Asks for confirmation, then deletes the user.
   */
  confirmDelete(user: User): void {
    if (this.isCurrentUser(user)) {
      this.toast.warning('You cannot delete your own account', 'Ask another super admin if this account must be removed.');
      return;
    }

    const fullName = this.fullName(user);
    this.confirmService.ask({
      title: 'Delete this account?',
      message: `"${fullName}" (${user.username}) will no longer be able to sign in. This cannot be undone.`,
      confirmText: 'Delete account',
      tone: 'danger'
    }).subscribe(confirmed => {
      if (!confirmed) {
        return;
      }
      this.userService.deleteUser(user.id).subscribe({
        next: () => {
          this.toast.success('Account deleted', `${fullName} has been removed.`);
          this.users = this.users.filter(u => u.id !== user.id);
          this.applyFilters(false);
        },
        error: (err) => {
          console.error(`Failed to delete user with ID ${user.id}`, err);
          this.toast.error('Could not delete the account', err);
        }
      });
    });
  }
}
