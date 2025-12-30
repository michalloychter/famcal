import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h1 mat-dialog-title>Confirm Deletion</h1>
    <div mat-dialog-content>
      Are you sure you want to delete this task? This action cannot be undone.
    </div>
    <div mat-dialog-actions>
      <!-- Click "No" passes 'false' back to the calling component -->
      <button mat-button (click)="onNoClick()">No</button>
      <!-- Click "Yes" passes 'true' back to the calling component -->
      <button mat-button color="warn" (click)="onYesClick()" cdkFocusInitial>Yes, Delete</button>
    </div>
  `,
})
export class ConfirmationDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  onNoClick(): void {
    this.dialogRef.close(false); // Close with result 'false'
  }

  onYesClick(): void {
    this.dialogRef.close(true); // Close with result 'true'
  }
}