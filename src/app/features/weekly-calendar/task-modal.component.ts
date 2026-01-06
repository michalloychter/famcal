import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { Task } from '../../core/tasksService';

@Component({
  selector: 'app-task-modal',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>Task Details</h2>
    <mat-dialog-content>
      <div *ngIf="data">
        <p><strong>Title:</strong> {{ data.title }}</p>
        <p><strong>Member:</strong> {{ data.memberName }}</p>
        <p><strong>Details:</strong> {{ data.details }}</p>
        <p><strong>Date:</strong> {{ data.date | date:'short' }}</p>
        <p *ngIf="data.end"><strong>End:</strong> {{ data.end | date:'short' }}</p>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="close()">Close</button>
    </mat-dialog-actions>
  `
})
export class TaskModalComponent {
  constructor(
    public dialogRef: MatDialogRef<TaskModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Task
  ) {}

  close() {
    this.dialogRef.close();
  }
}
