import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router'; // <-- Import the Router

@Component({
  selector: 'app-warning-dialog',
  templateUrl: './warning-dialog.component.html',
  styleUrls: ['./warning-dialog.component.css'],
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, CommonModule]
})
export class WarningDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<WarningDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { title: string; message: string },
    private router: Router // <-- Inject Router
  ) {}

  onOkClick(): void {
    this.dialogRef.close();
  }
}
