import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

export interface AiSuggestionEditData {
  title: string;
  details: string;
  type: string;
}

@Component({
  selector: 'app-ai-suggestion-edit-modal',
  standalone: true,
  imports: [CommonModule, MatDialogModule, ReactiveFormsModule],
  template: `
    <div class="modal-header">
      <h2 mat-dialog-title>Edit Suggestion</h2>
      <button class="close-x-btn" (click)="close()" aria-label="Close">
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
    <mat-dialog-content style="max-height: 60%; overflow: scroll;">
      <form [formGroup]="form" (ngSubmit)="save()">
        <div style="margin-bottom: 20px;">
          <label style="margin-inline-end: 10px;">Title:</label>
          <input type="text" formControlName="title" required />
        </div>
        <div style="margin-bottom: 20px;">
          <label style="margin-inline-end: 10px;">Details:</label>
          <textarea formControlName="details" placeholder="Optional details..."></textarea>
        </div>
        <div style="margin-bottom: 20px;">
          <label style="margin-inline-end: 10px;">Type:</label>
          <select formControlName="type" style="padding: 5px; border-radius: 4px; border: 1px solid #ccc;">
            <option value="">Select type (optional)</option>
            <option value="parents">💑 Parents / Date Night</option>
            <option value="meeting">Meeting</option>
            <option value="class">Class</option>
            <option value="shopping">Shopping</option>
            <option value="birthday">Birthday</option>
            <option value="doctor">Doctor</option>
            <option value="other">Other</option>
          </select>
        </div>
        <mat-dialog-actions align="end">
          <button class="fam-btn" mat-button type="button" (click)="close()">Cancel</button>
          <button class="fam-btn" mat-button color="primary" type="submit" [disabled]="form.invalid">Save</button>
        </mat-dialog-actions>
      </form>
    </mat-dialog-content>
  `,
  styles: [`
    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 8px;
    }
    .close-x-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      color: #888;
      cursor: pointer;
      padding: 0 8px;
      line-height: 1;
      transition: color 0.2s;
    }
    .close-x-btn:hover {
      color: #e53935;
    }
  `]
})
export class AiSuggestionEditModalComponent {
  form: FormGroup;
  constructor(
    public dialogRef: MatDialogRef<AiSuggestionEditModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AiSuggestionEditData,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      title: [data.title, Validators.required],
      details: [data.details],
      type: [data.type || '']
    });
  }
  close() {
    this.dialogRef.close();
  }
  save() {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }
}
