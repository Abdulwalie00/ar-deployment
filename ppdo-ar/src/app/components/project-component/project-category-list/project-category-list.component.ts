// src/app/components/project-category-list/project-category-list.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectCategory } from '../../../models/project.model';
import { ProjectDataService } from '../../../services/project-data.service';
import { AuthService } from '../../../services/auth.service';
import { UserService } from '../../../services/user.service';
import { ProjectConfirmationDialogComponent } from '../project-confirmation-dialog/project-confirmation-dialog.component';
import {ProjectCategoryAddDialogComponent} from '../project-category-add-dialog/project-category-add-dialog.component';

@Component({
  selector: 'app-project-category-list',
  standalone: true,
  imports: [CommonModule, ProjectConfirmationDialogComponent, ProjectCategoryAddDialogComponent],
  templateUrl: './project-category-list.component.html',
})
export class ProjectCategoryListComponent implements OnInit {
  categories: ProjectCategory[] = [];
  isAdmin = false;

  showCategoryDialog = false;
  categoryToEdit: ProjectCategory | null = null;

  showDeleteConfirmation = false;
  categoryToDelete: ProjectCategory | null = null;
  deleteMessage = '';

  constructor(
    private projectDataService: ProjectDataService,
    private authService: AuthService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.isAdmin();
    this.loadCategories();
  }

  loadCategories(): void {
    if (this.isAdmin) {
      this.projectDataService.getProjectCategories().subscribe(data => this.categories = data);
    } else {
      this.userService.getCurrentUserDivision().subscribe(division => {
        if (division) {
          this.projectDataService.getProjectCategories(division.id).subscribe(data => this.categories = data);
        }
      });
    }
  }

  openAddDialog(): void {
    this.categoryToEdit = null;
    this.showCategoryDialog = true;
  }

  openEditDialog(category: ProjectCategory): void {
    this.categoryToEdit = category;
    this.showCategoryDialog = true;
  }

  handleDialogClosed(): void {
    this.showCategoryDialog = false;
    this.categoryToEdit = null;
  }

  handleCategorySaved(category: ProjectCategory): void {
    this.loadCategories(); // Refresh the list
    this.handleDialogClosed();
  }

  openDeleteConfirmation(category: ProjectCategory): void {
    this.categoryToDelete = category;
    this.deleteMessage = `Are you sure you want to delete the category "${category.name}"?`;
    this.showDeleteConfirmation = true;
  }

  handleDeleteConfirmation(confirmed: boolean): void {
    if (confirmed && this.categoryToDelete) {
      this.projectDataService.deleteProjectCategory(this.categoryToDelete.id).subscribe({
        next: () => {
          this.loadCategories(); // Refresh list on successful deletion
          this.categoryToDelete = null;
          this.showDeleteConfirmation = false;
        },
        error: (err) => {
          console.error("Failed to delete category", err);
          // Optionally, show an error message to the user
          this.categoryToDelete = null;
          this.showDeleteConfirmation = false;
        }
      });
    } else {
      this.categoryToDelete = null;
      this.showDeleteConfirmation = false;
    }
  }
}
