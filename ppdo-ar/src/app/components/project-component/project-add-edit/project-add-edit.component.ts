// src/app/components/project-component/project-add-edit/project-add-edit.component.ts
import { AfterViewInit, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ToastService } from '../../../services/toast.service';
import { BudgetService, BUDGET_LOCKED_STATUS } from '../../../services/budget.service';
import { HttpErrorResponse } from '@angular/common/http';
import { PasswordVerificationDialogComponent } from '../../password-verification-dialog/password-verification-dialog.component';
import { CommonModule, Location } from '@angular/common';
import {FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, FormsModule, FormArray} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize, switchMap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';
import type { CircleMarker, LeafletMouseEvent, Map } from 'leaflet';

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
    ProjectCategoryAddDialogComponent,
    PasswordVerificationDialogComponent,
    FormsModule,
    // Import the dialog
  ],
  templateUrl: './project-add-edit.component.html',
  styleUrls: ['./project-add-edit.component.css']
})
export class ProjectAddEditComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('locationMap') locationMapElement?: ElementRef<HTMLDivElement>;

  projectForm!: FormGroup;
  isEditMode: boolean = false;
  showAipYear: boolean = false;
  projectId: string | null = null;
  divisions: Division[] = [];
  projectCategories: ProjectCategory[] = [];
  public isAdmin: boolean = false;
  public isSuperAdmin: boolean = false;

  showConfirmationDialog: boolean = false;
  dialogMessage: string = '';
  dialogAction: 'add' | 'update' = 'add';

  // Dialog control
  showAddCategoryDialog = false;

  // New property for the AIP years dropdown
  aipYears: number[] = [];
  isSaving = false;
  isUploadingImages = false;
  isLoadingProject = false;
  isLoadingBudget = false;
  currentBudgetShown = false;
  showPasswordDialog = false;
  budgetNotice = '';
  private saved = false;
  private leafletLib?: typeof import('leaflet');
  private locationMap?: Map;
  private locationMarker?: CircleMarker;

  get images(): FormArray {
    return this.projectForm.get('images') as FormArray;
  }

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private projectDataService: ProjectDataService,
    private authService: AuthService,
    private userService: UserService,
    private location: Location,
    private toast: ToastService,
    private host: ElementRef<HTMLElement>,
    private budgetService: BudgetService,
  ) {}

  ngOnInit(): void {
    // Generate the list of years for the dropdown
    const currentYear = new Date().getFullYear();
    for (let i = currentYear - 2; i <= currentYear + 3; i++) {
      this.aipYears.push(i);
    }

    this.isAdmin = this.authService.isAdmin();
    this.isSuperAdmin = this.authService.isSuperAdmin();
    this.initForm();
    this.projectForm.get('latitude')?.valueChanges.subscribe(() => this.syncMapFromCoordinates());
    this.projectForm.get('longitude')?.valueChanges.subscribe(() => this.syncMapFromCoordinates());

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

    this.projectForm.get('typeOfProject')?.valueChanges.subscribe(type => {
      this.showAipYear = (type === 'Operational' || type === 'PPA/AIP');
      // Conditionally apply validators
      if (this.showAipYear) {
        this.projectForm.get('aipYear')?.setValidators(Validators.required);
      } else {
        this.projectForm.get('aipYear')?.clearValidators();
        this.projectForm.patchValue({ aipYear: null });
      }
      this.projectForm.get('aipYear')?.updateValueAndValidity();
    });

    this.route.paramMap.pipe(
      switchMap(params => {
        this.projectId = params.get('id');
        this.isEditMode = !!this.projectId;

        // A new project needs a budget; when editing, a blank budget means "keep the current one"
        // (budgets are not sent with project data and need a password re-check to view).
        const budgetControl = this.projectForm.get('budget');
        budgetControl?.setValidators(this.isEditMode ? [Validators.min(0)] : [Validators.required, Validators.min(0)]);
        budgetControl?.updateValueAndValidity({ emitEvent: false });

        if (this.isEditMode && this.projectId) {
          this.isLoadingProject = true;
          return this.projectDataService.getProjectById(this.projectId).pipe(
            catchError(err => {
              this.toast.error('Could not load this project for editing', err);
              return of(null);
            }),
            finalize(() => this.isLoadingProject = false)
          );
        } else {
          return of(null);
        }
      })
    ).subscribe(project => {
      if (this.isEditMode && project) {
        this.loadProjectForEdit(project);
      } else if (!this.isEditMode) { // Add mode for non-admin
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
        // Set the default AIP year to the current year when in add mode
        this.projectForm.patchValue({ aipYear: new Date().getFullYear() });
      }
    });
  }

  ngAfterViewInit(): void {
    void this.initializeLocationMap();
  }

  ngOnDestroy(): void {
    if (this.locationMap) {
      this.locationMap.remove();
    }
  }

  initForm(): void {
    this.projectForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      location: ['', Validators.required],
      latitude: [null, [Validators.required, Validators.min(-90), Validators.max(90)]],
      longitude: [null, [Validators.required, Validators.min(-180), Validators.max(180)]],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      budget: ['', [Validators.required, Validators.min(0)]],
      fundSource: ['', Validators.required],
      targetParticipant: ['', Validators.required],
      divisionId: ['', Validators.required],
      projectCategoryId: [''],
      status: ['planned', Validators.required],
      remarks: [''],
      objectives: ['', Validators.required],
      officeInCharge: [''],
      percentCompletion: [0],
      implementationSchedule: [''],
      dateOfAccomplishment: [''],
      images: this.fb.array([]),
      // Set the default value for aipYear
      aipYear: [''],
      typeOfProject: ['', Validators.required],
    }, { validators: dateRangeValidator });
  }

  loadDivisions(): void {
    this.projectDataService.getDivisions().subscribe({
      next: divisions => {
        this.divisions = divisions;
        this.preselectDivisionFromQuery();
      },
      error: err => this.toast.error('Could not load the list of offices', err)
    });
  }

  /** "Add Project" from an office page passes ?division=CODE; start with that office selected. */
  private preselectDivisionFromQuery(): void {
    const code = this.route.snapshot.queryParamMap.get('division');
    if (this.isEditMode || !code || this.projectForm.get('divisionId')?.value) {
      return;
    }
    const match = this.divisions.find(division => division.code === code);
    if (match) {
      this.projectForm.patchValue({ divisionId: match.id });
    }
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
      // The office list is only loaded for admins; show the project's own office.
      this.divisions = [project.division];
    }

    this.projectForm.patchValue({
      title: project.title,
      description: project.description,
      location: project.location,
      latitude: project.latitude ?? null,
      longitude: project.longitude ?? null,
      startDate: new Date(project.startDate).toISOString().substring(0, 10),
      endDate: new Date(project.endDate).toISOString().substring(0, 10),
      budget: null, // Locked until "Show current budget"; blank keeps it unchanged.
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
      officeInCharge: project.officeInCharge,
      // Patch the new fields
      aipYear: project.aipYear,
      typeOfProject: project.typeOfProject
    });
    this.syncMapFromCoordinates();

    if (project.images) {
      project.images.forEach(image => this.addImage(image));
    }

    if (!this.isSuperAdmin && !this.isAdmin) {
      this.projectForm.get('divisionId')?.disable();
    }

    this.showAipYear = (project.typeOfProject === 'Operational' || project.typeOfProject === 'PPA/AIP');
    if (this.showAipYear) {
      this.projectForm.get('aipYear')?.setValidators(Validators.required);
    }
  }

  addImage(image: ProjectImage): void {
    const imageGroup = this.fb.group({
      id: [image.id],
      projectId: [this.projectId || ''],
      imageUrl: [image.imageUrl],
      caption: [image.caption || ''],
      dateUploaded: [image.dateUploaded],
    });
    this.images.push(imageGroup);
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
    const nonImages = files.filter(file => !file.type.startsWith('image/'));
    if (nonImages.length > 0) {
      this.toast.warning('Only image files can be uploaded', nonImages.map(f => f.name).join(', '));
      input.value = '';
      return;
    }

    const uploadObservables = files.map(file =>
      this.projectDataService.uploadImage(file)
    );

    this.isUploadingImages = true;
    forkJoin(uploadObservables).pipe(
      finalize(() => {
        this.isUploadingImages = false;
        input.value = ''; // Allow choosing the same file again.
      })
    ).subscribe({
      next: (urls) => {
        urls.forEach(url => {
          const newImage: ProjectImage = {
            id: uuidv4(),
            projectId: this.projectId || '',
            imageUrl: url,
            caption: '',
            dateUploaded: new Date()
          };
          this.addImage(newImage);
        });
        this.projectForm.markAsDirty();
        this.toast.success(urls.length === 1 ? 'Photo uploaded' : `${urls.length} photos uploaded`);
      },
      error: (err) => {
        console.error('Image upload failed', err);
        this.toast.error('Photo upload failed', err);
      }
    });
  }

  removeImage(index: number): void {
    this.images.removeAt(index);
    this.projectForm.markAsDirty();
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

  private async initializeLocationMap(): Promise<void> {
    if (!this.locationMapElement || this.locationMap) {
      return;
    }

    if (!this.leafletLib) {
      this.leafletLib = await import('leaflet');
    }

    const L = this.leafletLib;
    this.locationMap = L.map(this.locationMapElement.nativeElement).setView([12.8797, 121.774], 6);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.locationMap);

    this.locationMap.on('click', (event: LeafletMouseEvent) => {
      const latitude = Number(event.latlng.lat.toFixed(6));
      const longitude = Number(event.latlng.lng.toFixed(6));

      this.projectForm.patchValue(
        { latitude, longitude },
        { emitEvent: false }
      );
      this.projectForm.get('latitude')?.markAsTouched();
      this.projectForm.get('longitude')?.markAsTouched();
      this.projectForm.markAsDirty();

      this.placeOrMoveMarker(latitude, longitude, true);
    });

    this.syncMapFromCoordinates();
    setTimeout(() => this.locationMap?.invalidateSize(), 0);
  }

  private syncMapFromCoordinates(): void {
    if (!this.locationMap) {
      return;
    }

    const latitude = this.parseCoordinate(this.projectForm.get('latitude')?.value);
    const longitude = this.parseCoordinate(this.projectForm.get('longitude')?.value);

    if (latitude === null || longitude === null) {
      return;
    }

    this.placeOrMoveMarker(latitude, longitude, !this.locationMarker);
  }

  private placeOrMoveMarker(latitude: number, longitude: number, centerMap: boolean): void {
    if (!this.locationMap || !this.leafletLib) {
      return;
    }

    if (!this.locationMarker) {
      this.locationMarker = this.leafletLib.circleMarker([latitude, longitude], {
        radius: 8,
        color: '#1d4ed8',
        weight: 2,
        fillColor: '#3b82f6',
        fillOpacity: 0.85,
      }).addTo(this.locationMap);
    } else {
      this.locationMarker.setLatLng([latitude, longitude]);
    }

    if (centerMap) {
      this.locationMap.setView([latitude, longitude], Math.max(this.locationMap.getZoom(), 15));
    }
  }

  private parseCoordinate(value: unknown): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const numericValue = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(numericValue) ? numericValue : null;
  }

  getOpenStreetMapLink(): string {
    const latitude = this.parseCoordinate(this.projectForm.get('latitude')?.value);
    const longitude = this.parseCoordinate(this.projectForm.get('longitude')?.value);

    if (latitude === null || longitude === null) {
      return '#';
    }

    return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`;
  }

  onSubmit(): void {
    if (this.isSaving) {
      return;
    }
    if (this.projectForm.invalid) {
      this.projectForm.markAllAsTouched();
      const missing = this.countInvalidFields();
      this.toast.warning(
        'Please complete the highlighted fields',
        missing === 1 ? '1 field needs your attention.' : `${missing} fields need your attention.`
      );
      this.focusFirstInvalidField();
      return;
    }
    this.dialogAction = this.isEditMode ? 'update' : 'add';
    this.dialogMessage = this.isEditMode
      ? 'Save your changes to this project?'
      : 'Add this project to the records?';
    this.showConfirmationDialog = true;
  }

  onConfirmation(confirmed: boolean): void {
    this.showConfirmationDialog = false;
    if (confirmed) {
      const formValue = this.projectForm.getRawValue();
      const payload = {
        ...formValue,
        latitude: this.parseCoordinate(formValue.latitude),
        longitude: this.parseCoordinate(formValue.longitude),
        // Blank budget while editing = keep the current value on the server.
        budget: this.parseCoordinate(formValue.budget),
      };

      const operation = this.isEditMode && this.projectId
        ? this.projectDataService.updateProject(this.projectId, payload)
        : this.projectDataService.addProject(payload);

      this.isSaving = true;
      operation.subscribe({
        next: project => {
          this.saved = true;
          this.isSaving = false;
          this.toast.success(
            this.isEditMode ? 'Project updated' : 'Project added',
            `"${formValue.title}" was saved successfully.`
          );
          // A new project opens its detail page so the result is visible;
          // an edit returns to wherever the user came from.
          if (!this.isEditMode && project?.id) {
            this.router.navigate(['/project-detail', project.id], { replaceUrl: true });
          } else {
            this.location.back();
          }
        },
        error: err => {
          // Keep everything the user typed so they can retry.
          this.isSaving = false;
          this.toast.error('The project could not be saved', err);
        }
      });
    }
  }

  /** Reveals the saved budget in the form (asks for the password first if needed). */
  showCurrentBudget(): void {
    if (this.budgetService.isUnlocked()) {
      this.loadCurrentBudget();
    } else {
      this.showPasswordDialog = true;
    }
  }

  onBudgetPasswordVerified(): void {
    this.showPasswordDialog = false;
    this.loadCurrentBudget();
  }

  private loadCurrentBudget(): void {
    if (!this.projectId) return;
    this.isLoadingBudget = true;
    this.budgetNotice = '';
    this.budgetService.getBudget(this.projectId).pipe(
      finalize(() => this.isLoadingBudget = false)
    ).subscribe({
      next: result => {
        this.currentBudgetShown = true;
        const control = this.projectForm.get('budget');
        // Only fill it in if the user has not already typed a new value.
        if (control && (control.value === null || control.value === '')) {
          control.setValue(result.budget, { emitEvent: false });
        }
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === BUDGET_LOCKED_STATUS) {
          this.showPasswordDialog = true;
        } else if (err.status === 403) {
          this.budgetNotice = 'You do not have permission to view or change this budget.';
        } else {
          this.toast.error('Could not load the budget', err);
        }
      }
    });
  }

  /** Used by the unsaved-changes guard before leaving the page. */
  hasUnsavedChanges(): boolean {
    return !this.saved && this.projectForm?.dirty;
  }

  /** Warn before closing or reloading the tab with unsaved edits. */
  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.hasUnsavedChanges()) {
      event.preventDefault();
    }
  }

  private countInvalidFields(): number {
    return Object.values(this.projectForm.controls).filter(control => control.invalid).length
      + (this.projectForm.hasError('dateRange') ? 1 : 0);
  }

  private focusFirstInvalidField(): void {
    setTimeout(() => {
      const firstInvalid = this.host.nativeElement.querySelector<HTMLElement>(
        'form .ng-invalid[formControlName], form .invalid-field'
      );
      if (firstInvalid) {
        firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstInvalid.focus({ preventScroll: true });
      }
    });
  }

  onCancel(): void {
    if (this.isEditMode && this.projectId) {
      this.router.navigate(['/project-detail', this.projectId]);
    } else {
      this.router.navigate(['/project-dashboard']);
    }
  }
}
