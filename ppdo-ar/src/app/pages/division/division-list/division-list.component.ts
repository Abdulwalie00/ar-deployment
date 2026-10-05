import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Division } from '../../../models/project.model';
import { DivisionService } from '../../../services/division.service';
import { ToastService } from '../../../services/toast.service';
import {
  ProjectConfirmationDialogComponent
} from '../../../components/project-component/project-confirmation-dialog/project-confirmation-dialog.component';

@Component({
  selector: 'app-division-list',
  standalone: true,
  imports: [CommonModule, ProjectConfirmationDialogComponent],
  templateUrl: './division-list.component.html',
})
export class DivisionListComponent implements OnInit {
  divisions: Division[] = [];
  showDeleteConfirmation = false;
  divisionToDelete: Division | null = null;
  deleteMessage = '';

  constructor(private divisionService: DivisionService, private router: Router, private toast: ToastService) {}

  ngOnInit(): void {
    this.loadDivisions();
  }

  loadDivisions(): void {
    this.divisionService.getDivisions().subscribe(data => this.divisions = data);
  }

  openAddDialog(): void {
    this.router.navigate(['/divisions/add']);
  }

  openEditDialog(division: Division): void {
    this.router.navigate(['/divisions/edit', division.id]);
  }

  openDeleteConfirmation(division: Division): void {
    this.divisionToDelete = division;
    this.deleteMessage = `Are you sure you want to delete the division "${division.name}"?`;
    this.showDeleteConfirmation = true;
  }

  handleDeleteConfirmation(confirmed: boolean): void {
    if (confirmed && this.divisionToDelete) {
      this.divisionService.deleteDivision(this.divisionToDelete.id).subscribe({
        next: () => {
          this.toast.success('Office deleted', this.divisionToDelete?.name);
          this.loadDivisions();
          this.divisionToDelete = null;
          this.showDeleteConfirmation = false;
        },
        error: (err) => {
          console.error("Failed to delete division", err);
          this.toast.error('The office could not be deleted', 'It may still have projects or users assigned to it.');
          this.divisionToDelete = null;
          this.showDeleteConfirmation = false;
        }
      });
    } else {
      this.divisionToDelete = null;
      this.showDeleteConfirmation = false;
    }
  }
}
