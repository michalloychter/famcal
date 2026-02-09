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
  <mat-dialog-content>
      <form [formGroup]="form" (ngSubmit)="save()">
        <div class="form-field">
          <label>Title:</label>
          <input type="text" formControlName="title" required />
        </div>
        <div class="form-field">
          <label>Details:</label>
          <textarea formControlName="details" placeholder="Optional details..."></textarea>
        </div>
        <div class="form-field">
          <label>Type:</label>
          <select formControlName="type">
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
    :host ::ng-deep .mat-mdc-dialog-container {
      background-color: #ffe066 !important;
      border-radius: 12px !important;
      box-shadow: 0 2px 8px rgba(0,0,0,0.07) !important;
      padding: 0 !important;
      max-width: 95vw !important;
      width: 400px !important;
      min-width: 0 !important;
      overflow-x: hidden !important;
      overflow-y: auto !important;
      word-break: break-word !important;
      white-space: normal !important;
    }
    mat-dialog-content {
      max-height: 60vh;
      overflow-y: auto;
      padding: 20px;
    }
    .form-field {
      margin-bottom: 20px;
      display: flex;
      flex-direction: column;
    }
    .form-field label {
      margin-bottom: 8px;
      font-weight: 500;
      font-size: 1em;
    }
    .form-field input,
    .form-field textarea,
    .form-field select {
      padding: 8px;
      border-radius: 4px;
      border: 1px solid #ccc;
      font-size: 1em;
      width: 100%;
      box-sizing: border-box;
    }
    .form-field textarea {
      resize: vertical;
      min-height: 60px;
    }
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
    mat-dialog-actions {
      margin-top: 16px;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }
    .fam-btn {
      border-radius: 30px;
      border: 1px;
      color: #17a89a;
      padding: 5px 10px;
      cursor: pointer;
      background-color: #dad5d5;
    }
    @media (max-width: 600px) {
      :host ::ng-deep .mat-mdc-dialog-container {
        width: 95vw !important;
        min-width: unset !important;
        padding: 0 !important;
      }
      mat-dialog-content {
        padding: 10px;
      }
      .form-field label {
        font-size: 0.95em;
      }
      .form-field input,
      .form-field textarea,
      .form-field select {
        font-size: 0.95em;
        padding: 8px;
      }
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
