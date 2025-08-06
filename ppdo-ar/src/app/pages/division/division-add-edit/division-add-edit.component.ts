import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Division } from '../../../models/project.model';
import { DivisionService } from '../../../services/division.service';

@Component({
  selector: 'app-division-add-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './division-add-edit.component.html',
})
export class DivisionAddEditComponent implements OnInit {
  divisionForm!: FormGroup;
  isEditMode = false;
  divisionId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private divisionService: DivisionService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.divisionForm = this.fb.group({
      name: ['', Validators.required],
      code: ['', Validators.required],
    });

    this.divisionId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.divisionId;

    if (this.isEditMode && this.divisionId) {
      this.divisionService.getDivisionById(this.divisionId).subscribe(division => {
        this.divisionForm.patchValue(division);
      });
    }
  }

  onSave(): void {
    if (this.divisionForm.invalid) {
      this.divisionForm.markAllAsTouched();
      return;
    }

    const divisionData = this.divisionForm.value;

    const saveOperation = this.isEditMode && this.divisionId
      ? this.divisionService.updateDivision(this.divisionId, divisionData)
      : this.divisionService.createDivision(divisionData);

    saveOperation.subscribe({
      next: () => {
        this.router.navigate(['/divisions']);
      },
      error: (err) => {
        console.error("Failed to save division", err);
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/divisions']);
  }
}
