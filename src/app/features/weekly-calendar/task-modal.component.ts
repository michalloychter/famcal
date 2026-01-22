import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { Task, TasksService } from '../../core/tasksService';

@Component({
  selector: 'app-task-modal',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  template: `
    <div class="modal-header">
      <h2 mat-dialog-title>Task Details</h2>
      <button class="close-x-btn" (click)="close()" aria-label="Close">
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
    <mat-dialog-content>
      <div *ngIf="data" [class.task-done]="data.done">
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
  constructor(
    public dialogRef: MatDialogRef<TaskModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Task,
    private tasksService: TasksService
  ) {}

  close() {
    this.dialogRef.close();
  }

  toggleTaskDone(): void {
    if (!this.data.id) return;
    
    this.tasksService.toggleTaskDone(this.data.id, !this.data.done).subscribe({
      next: () => {
        console.log('Task done status updated successfully');
        this.data.done = !this.data.done; // Update local data
      },
      error: (err) => {
        console.error('Error updating task status:', err);
        alert('Failed to update task status.');
      }
    });
  }
}
