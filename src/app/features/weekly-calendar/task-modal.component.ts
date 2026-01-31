import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { Task, TasksService } from '../../core/tasksService';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-task-modal',
  standalone: true,
  imports: [CommonModule, MatDialogModule, ReactiveFormsModule],
  template: `
    <div class="modal-header">
      <h2 mat-dialog-title>{{ editMode ? 'Edit Task' : 'Task Details' }}</h2>
      <button class="close-x-btn" (click)="close()" aria-label="Close">
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
  <mat-dialog-content style="max-height: 60%; overflow: scroll;">
      <form *ngIf="editMode" [formGroup]="form" (ngSubmit)="save()">
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
        <mat-dialog-actions align="end">
          <button class="fam-btn" mat-button type="button" (click)="toggleEditMode()">Cancel</button>
          <button class="fam-btn" mat-button color="primary" type="submit" [disabled]="form.invalid">Save</button>
        </mat-dialog-actions>
      </form>
      <div *ngIf="!editMode && data" [class.task-done]="data.done">
        <p><strong>Title:</strong> <span [class.task-title-done]="data.done">{{ data.title }}</span></p>
        <p><strong>Member:</strong> {{ data.memberName }}</p>
        <p><strong>Details:</strong> <span [class.task-text-done]="data.done">{{ data.details }}</span></p>
        <p><strong>Date:</strong> <span [class.task-text-done]="data.done">{{ data.date | date:'short' }}</span></p>
        <p *ngIf="data.end"><strong>End:</strong> <span [class.task-text-done]="data.done">{{ data.end | date:'short' }}</span></p>
        <button 
          class="done-tag" 
          [class.done-active]="data.done"
          (click)="toggleTaskDone()"
        >
          Done
        </button>
        <button class="fam-btn" mat-button color="primary" (click)="toggleEditMode()">Edit</button>
      </div>
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
    .done-tag {
      padding: 5px 10px;
      border: 2px solid #4caf50;
      background: white;
      color: #4caf50;
      border-radius: 30px;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.75rem;
      transition: all 0.3s;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      width: 100%;
      max-width: 200px;
      text-align: center;
      margin: 10px 0;
      display: block;
      box-sizing: border-box;
      white-space: nowrap;
    }

    .done-tag:hover {
      background: #e8f5e9;
      border-color: #4caf50;
      transform: scale(1.05);
    }

    .done-tag.done-active {
      background: #4caf50;
      color: white;
      border-color: #4caf50;
    }

    .done-tag.done-active:hover {
      background: #2e7d32;
      border-color: #2e7d32;
    }

    .task-title-done,
    .task-text-done {
      text-decoration: line-through;
      color: #999;
    }

    .task-done {
      opacity: 0.7;
    }
  `]
})

export class TaskModalComponent {
  editMode = false;
  form: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<TaskModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Task,
    private tasksService: TasksService,
    private fb: FormBuilder
  ) {
    // Pre-fill form with task data
    let datePart = '';
    let timePart = '19:00';
    if (data.date) {
      const d = new Date(data.date);
      datePart = d.toISOString().slice(0, 10);
      const hours = d.getHours();
      const minutes = d.getMinutes();
      if (hours !== 0 || minutes !== 0) {
        timePart = d.toTimeString().slice(0, 5);
      }
    }
    this.form = this.fb.group({
      title: [data.title, Validators.required],
      details: [data.details],
      date: [datePart, Validators.required],
      time: [timePart, Validators.required],
      type: [data.type || '']
    });
    // Automatically open in edit mode for AI-generated tasks
    if (data.type === 'ai') {
      this.editMode = true;
    }
  }

  close() {
    this.dialogRef.close();
  }

  toggleEditMode() {
    this.editMode = !this.editMode;
    if (this.editMode) {
      // Reset form to current data
      let datePart = '';
      let timePart = '19:00';
      if (this.data.date) {
        const d = new Date(this.data.date);
        datePart = d.toISOString().slice(0, 10);
        const hours = d.getHours();
        const minutes = d.getMinutes();
        if (hours !== 0 || minutes !== 0) {
          timePart = d.toTimeString().slice(0, 5);
        }
      }
      this.form.setValue({
        title: this.data.title,
        details: this.data.details,
        date: datePart,
        time: timePart,
        type: this.data.type || ''
      });
    }
  }

  save() {
    if (this.form.valid && this.data.id) {
      const { date, time, ...rest } = this.form.value;
      const dateTime = new Date(date + 'T' + time);
      const updatedData = { ...rest, date: dateTime, type: this.form.value.type };
      this.tasksService.updateTask(this.data.id, updatedData).subscribe({
        next: (updatedTask) => {
          // Update local data for immediate UI feedback
          Object.assign(this.data, updatedTask);
          this.editMode = false;
        },
        error: (err) => {
          alert('Failed to update task.');
        }
      });
    }
  }

  toggleTaskDone(): void {
    if (!this.data.id) return;
    this.tasksService.toggleTaskDone(this.data.id, !this.data.done).subscribe({
      next: () => {
        this.data.done = !this.data.done;
      },
      error: (err) => {
        alert('Failed to update task status.');
      }
    });
  }
}
