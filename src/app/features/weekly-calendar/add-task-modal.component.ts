import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-add-task-modal',
  standalone: true,
  imports: [CommonModule, MatDialogModule, ReactiveFormsModule],
  template: `
    <h2 mat-dialog-title>Add Task</h2>
    <form [formGroup]="form" (ngSubmit)="submit()" style="background: transparent; box-shadow: none;">
      <mat-dialog-content style="background: transparent; box-shadow: none;">
        <div style="margin-bottom: 20px;">
          <label style="margin-inline-end: 10px;">Title:</label>
          <input type="text" formControlName="title" required />
        </div>
        <div style="margin-bottom: 20px;">
          <label style="margin-inline-end: 10px;">Details:</label>
          <textarea formControlName="details" placeholder="Optional details..."></textarea>
        </div>
        <div style="margin-bottom: 20px;">
          <label style="margin-inline-end: 10px;">Date:</label>
          <input type="date" formControlName="date" required />
        </div>
        <div style="margin-bottom: 20px;">
          <label style="margin-inline-end: 10px;">Time:</label>
          <input type="time" formControlName="time" required />
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