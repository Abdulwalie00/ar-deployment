// src/app/components/project-category-add-dialog/project-category-add-dialog.component.ts
import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import { CommonModule } from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {ProjectDataService} from "../../../services/project-data.service";
import {ProjectCategory, ProjectCategoryDto} from "../../../models/project.model";
import { ToastService } from "../../../services/toast.service";

@Component({
  selector: 'app-project-category-add-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './project-category-add-dialog.component.html',
})
export class ProjectCategoryAddDialogComponent implements OnInit, OnChanges {
  @Input() show: boolean = false;
  @Input() categoryToEdit: ProjectCategory | null = null;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<ProjectCategory>();

  categoryForm!: FormGroup;
  isEditMode = false;

  constructor(
    private fb: FormBuilder,
    private projectDataService: ProjectDataService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.categoryForm = this.fb.group({
      name: ['', Validators.required],
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['categoryToEdit'] && this.categoryToEdit) {
      this.isEditMode = true;
      this.categoryForm.patchValue({
        name: this.categoryToEdit.name,
        code: this.categoryToEdit.code,
      });
    } else {
      this.isEditMode = false;
      this.categoryForm.reset();
    }
  }

  onSave(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    const categoryData: ProjectCategoryDto = this.categoryForm.value;
    const saveOperation = this.isEditMode && this.categoryToEdit
      ? this.projectDataService.updateProjectCategory(this.categoryToEdit.id, categoryData)
      : this.projectDataService.addProjectCategory(categoryData);


    saveOperation.subscribe({
      next: (savedCategory) => {
        this.toast.success(this.isEditMode ? "Category updated" : "Category added", savedCategory?.name);
        this.saved.emit(savedCategory);
        this.resetAndClose();
      },
      error: (err) => {
        console.error("Failed to save category", err);
        this.toast.error("The category could not be saved", err);
      }
    });
  }

  onCancel(): void {
    this.resetAndClose();
  }

  private resetAndClose(): void {
    this.categoryForm.reset();
    this.isEditMode = false;
    this.closed.emit();
  }
}
