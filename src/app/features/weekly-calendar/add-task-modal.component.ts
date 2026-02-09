import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-add-task-modal',
  standalone: true,
  imports: [CommonModule, MatDialogModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <h2 mat-dialog-title>Add Task</h2>
    <form [formGroup]="form" (ngSubmit)="submit()" style="background: transparent; box-shadow: none;">
      <mat-dialog-content style="background: transparent; box-shadow: none;">
        <mat-form-field appearance="outline" style="width: 100%; margin-bottom: 16px;">
          <mat-label>Title</mat-label>
          <input matInput type="text" formControlName="title" required />
        </mat-form-field>
        <mat-form-field appearance="outline" style="width: 100%; margin-bottom: 16px;">
          <mat-label>Details</mat-label>
          <textarea matInput formControlName="details" placeholder="Optional details..."></textarea>
        </mat-form-field>
        <mat-form-field appearance="outline" style="width: 100%; margin-bottom: 16px;">
          <mat-label>Date</mat-label>
          <input matInput type="date" formControlName="date" required />
        </mat-form-field>
        <mat-form-field appearance="outline" style="width: 100%; margin-bottom: 16px;">
          <mat-label>Time</mat-label>
          <input matInput type="time" formControlName="time" required />
        </mat-form-field>
        <mat-form-field appearance="outline" style="width: 100%; margin-bottom: 16px;">
          <mat-label>Type</mat-label>
          <mat-select formControlName="type">
            <mat-option value="">Select type (optional)</mat-option>
            <mat-option value="parents">💑 Parents / Date Night</mat-option>
            <mat-option value="meeting">Meeting</mat-option>
            <mat-option value="class">Class</mat-option>
            <mat-option value="shopping">Shopping</mat-option>
            <mat-option value="birthday">Birthday</mat-option>
            <mat-option value="doctor">Doctor</mat-option>
            <mat-option value="other">Other</mat-option>
          </mat-select>
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button class="fam-btn" mat-button type="button" (click)="close()">Cancel</button>
        <button class="fam-btn" mat-button color="primary" type="submit" [disabled]="form.invalid">Add</button>
      </mat-dialog-actions>
    </form>
  `
})
export class AddTaskModalComponent {
  form: FormGroup;
  constructor(
    public dialogRef: MatDialogRef<AddTaskModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { date: string },
    private fb: FormBuilder
  ) {
    // Split the ISO date string into date and time
    let datePart = '';
    let timePart = '19:00'; // Default to 7:00 PM for date nights
    if (data.date) {
      const d = new Date(data.date);
      datePart = d.toISOString().slice(0, 10);
      // Only use the provided time if it's not midnight (which indicates date-only selection)
      const hours = d.getHours();
      const minutes = d.getMinutes();
      if (hours !== 0 || minutes !== 0) {
        timePart = d.toTimeString().slice(0, 5);
      }
    }
    this.form = this.fb.group({
      title: ['', Validators.required],
      details: [''],
      date: [datePart, Validators.required],
      time: [timePart, Validators.required],
      type: ['']
    });
  }
  submit() {
    if (this.form.valid) {
      // Combine date and time into a single ISO string
      const { date, time, ...rest } = this.form.value;
      const dateTime = new Date(date + 'T' + time);
      this.dialogRef.close({ ...rest, date: dateTime });
    }
  }
  close() {
    this.dialogRef.close();
  }
}