// src/app/components/project-add-edit/project-add-edit.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

import { ProjectConfirmationDialogComponent } from '../project-confirmation-dialog/project-confirmation-dialog.component';
import {Division, Project, ProjectCategory, ProjectImage} from '../../../models/project.model';
import { AuthService } from '../../../services/auth.service';
import { ProjectDataService } from '../../../services/project-data.service';
import {UserService} from '../../../services/user.service';
// Import the dialog component
import {ProjectCategoryAddDialogComponent} from "../project-category-add-dialog/project-category-add-dialog.component";

// Custom validator for the date range
export function dateRangeValidator(control: AbstractControl): { [key: string]: boolean } | null {
  const startDate = control.get('startDate')?.value;
  const endDate = control.get('endDate')?.value;
  if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
    return { 'dateRange': true };
  }
  return null;
}

@Component({
  selector: 'app-project-add-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ProjectConfirmationDialogComponent,
    ProjectCategoryAddDialogComponent // Import the dialog
  ],
  templateUrl: './project-add-edit.component.html',
  styleUrls: ['./project-add-edit.component.css']
})
export class ProjectAddEditComponent implements OnInit {
  projectForm!: FormGroup;
  isEditMode: boolean = false;
  showMoreFields: boolean = false;
  projectId: string | null = null;
  divisions: Division[] = [];
  projectCategories: ProjectCategory[] = [];
  public isAdmin: boolean = false;
  public isSuperAdmin: boolean = false;

  newlyUploadedImages: ProjectImage[] = [];
  currentProjectImages: ProjectImage[] = [];

  showConfirmationDialog: boolean = false;
  dialogMessage: string = '';
  dialogAction: 'add' | 'update' = 'add';

  // Dialog control
  showAddCategoryDialog = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private projectDataService: ProjectDataService,
    private authService: AuthService,
    private userService: UserService,
    private location: Location,
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.isAdmin();
    this.isSuperAdmin = this.authService.isSuperAdmin();
    this.initForm();

    if (this.isSuperAdmin || this.isAdmin) {
      this.loadDivisions();
      // Listen for division changes to update categories
      this.projectForm.get('divisionId')?.valueChanges.subscribe(divisionId => {
        if (divisionId) {
          this.loadProjectCategories(divisionId);
        } else {
          this.projectCategories = [];
        }
      });
    }

    this.route.paramMap.pipe(
      switchMap(params => {
        this.projectId = params.get('id');
        this.isEditMode = !!this.projectId;

        if (this.isEditMode && this.projectId) {
          return this.projectDataService.getProjectById(this.projectId);
        } else {
          return of(null);
        }
      })
    ).subscribe(project => {
      if (this.isEditMode && project) {
        this.loadProjectForEdit(project);
      } else { // Add mode for non-admin
        if (!this.isSuperAdmin && !this.isAdmin) {
          this.userService.getCurrentUserDivision().subscribe(userDivision => {
            if (userDivision) {
              this.divisions = [userDivision];
              this.projectForm.patchValue({ divisionId: userDivision.id });
              this.projectForm.get('divisionId')?.disable();
              this.loadProjectCategories(userDivision.id); // Non-admin loads categories for their division
            }
          });
        }
      }
    });
  }

  initForm(): void {
    this.projectForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      location: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      budget: ['', [Validators.required, Validators.min(0)]],
      fundSource: ['', Validators.required],
      targetParticipant: ['', Validators.required],
      divisionId: ['', Validators.required],
      projectCategoryId: [''],
      status: ['planned', Validators.required],
      remarks: ['', Validators.required],
      objectives: ['', Validators.required],
      officeInCharge: ['', Validators.required],
      percentCompletion: [0],
      implementationSchedule: [''],
      dateOfAccomplishment: [''],
    }, { validators: dateRangeValidator });
  }

  loadDivisions(): void {
    this.projectDataService.getDivisions().subscribe(divisions => {
      this.divisions = divisions;
    });
  }

  loadAllProjectCategories(): void {
    this.projectDataService.getProjectCategories().subscribe(categories => {
      this.projectCategories = categories;
    });
  }

  loadProjectCategories(divisionId: string): void {
    this.projectDataService.getProjectCategories(divisionId).subscribe(categories => {
      this.projectCategories = categories;
    });
  }

  loadProjectForEdit(project: Project): void {
    // For non-admins in edit mode, load categories for their division
    if (!this.isSuperAdmin && !this.isAdmin) {
      this.loadProjectCategories(project.division.id);
    }

    this.projectForm.patchValue({
      title: project.title,
      description: project.description,
      location: project.location,
      startDate: new Date(project.startDate).toISOString().substring(0, 10),
      endDate: new Date(project.endDate).toISOString().substring(0, 10),
      budget: project.budget,
      percentCompletion: project.percentCompletion,
      implementationSchedule: project.implementationSchedule,
      dateOfAccomplishment: project.dateOfAccomplishment,
      targetParticipant: project.targetParticipant,
      fundSource: project.fundSource,
      divisionId: project.division.id,
      projectCategoryId: project.projectCategory?.id,
      status: project.status,
      remarks: project.remarks,
      objectives: project.objectives,
      officeInCharge: project.officeInCharge
    });
    this.currentProjectImages = project.images || [];

    if (!this.isSuperAdmin && !this.isAdmin) {
      this.projectForm.get('divisionId')?.disable();
    }
  }

  onCategoryChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    if (selectElement.value === 'add-new-category') {
      this.showAddCategoryDialog = true;
      this.projectForm.get('projectCategoryId')?.setValue('', { emitEvent: false });
    }
  }

  handleCategorySaved(newCategory: ProjectCategory): void {
    this.projectCategories.push(newCategory);
    this.projectForm.get('projectCategoryId')?.setValue(newCategory.id);
    this.showAddCategoryDialog = false;
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }
    const files = Array.from(input.files);
    const uploadObservables = files.map(file =>
      this.projectDataService.uploadImage(file)
    );
    forkJoin(uploadObservables).subscribe({
      next: (urls) => {
        const newImages = urls.map(url => ({
          id: uuidv4(),
          projectId: this.projectId || '',
          imageUrl: url,
          caption: '',
          dateUploaded: new Date()
        }));
        this.newlyUploadedImages.push(...newImages);
      },
      error: (err) => console.error('Image upload failed', err)
    });
  }

  removeNewImage(imageUrl: string): void {
    this.newlyUploadedImages = this.newlyUploadedImages.filter(img => img.imageUrl !== imageUrl);
  }

  removeCurrentImage(imageId: string): void {
    this.currentProjectImages = this.currentProjectImages.filter(img => img.id !== imageId);
  }

  onPercentInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = Number(input.value);
    if (value > 100) {
      value = 100;
      input.value = '100';
    }
    this.projectForm.get('percentCompletion')?.setValue(value);
  }

  onSubmit(): void {
    if (this.projectForm.invalid) {
      this.projectForm.markAllAsTouched();
      return;
    }
    this.dialogAction = this.isEditMode ? 'update' : 'add';
    this.dialogMessage = `Are you sure you want to ${this.dialogAction} this project?`;
    this.showConfirmationDialog = true;
  }

  onConfirmation(confirmed: boolean): void {
    this.showConfirmationDialog = false;
    if (confirmed) {
      const formValue = this.projectForm.getRawValue();
      const finalImages = [...this.currentProjectImages, ...this.newlyUploadedImages];
      const projectData = { ...formValue, images: finalImages };

      const operation = this.isEditMode && this.projectId
        ? this.projectDataService.updateProject(this.projectId, projectData)
        : this.projectDataService.addProject(projectData);
      operation.subscribe(project => {
        this.location.back()
      });
    }
  }

  onCancel(): void {
    if (this.isEditMode && this.projectId) {
      this.router.navigate(['/project-detail', this.projectId]);
    } else {
      this.router.navigate(['/project-dashboard']);
    }
  }
}
