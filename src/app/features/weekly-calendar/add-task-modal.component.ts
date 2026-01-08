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
    <form [formGroup]="form" (ngSubmit)="submit()">
      <mat-dialog-content>
        <div>
          <label>Title:</label>
          <input type="text" formControlName="title" required />
        </div>
        <div>
          <label>Details:</label>
          <textarea formControlName="details"></textarea>
        </div>
        <div>
          <label>Date:</label>
          <input type="date" formControlName="date" required />
        </div>
        <div>
          <label>Time:</label>
          <input type="time" formControlName="time" required />
        </div>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="close()">Cancel</button>
        <button mat-button color="primary" type="submit" [disabled]="form.invalid">Add</button>
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
    let timePart = '';
    if (data.date) {
      const d = new Date(data.date);
      datePart = d.toISOString().slice(0, 10);
      timePart = d.toTimeString().slice(0, 5);
    }
    this.form = this.fb.group({
      title: ['', Validators.required],
      details: [''],
      date: [datePart, Validators.required],
      time: [timePart, Validators.required]
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