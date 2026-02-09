
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Task } from '../../core/tasksService';
import { ConfirmationDialogComponent } from '../../shared/confirmation-dialog/confirmation-dialog';

@Component({
  selector: 'app-improvement-task-modal',
  standalone: true,
  imports: [CommonModule, MatDialogModule, FormsModule, ConfirmationDialogComponent, MatFormFieldModule, MatInputModule],
  template: `
    <div class="modal-header">
    </div>
    <button class="close-x-btn" (click)="onClose()" title="Close">
      <i class="fa-solid fa-xmark"></i>
    </button>
    <div class="modal-title-row">
      <h2 mat-dialog-title *ngIf="!editMode">{{ data.title }}</h2>
      <mat-form-field *ngIf="editMode" appearance="outline" class="edit-field">
        <mat-label>Task title</mat-label>
        <input matInput [(ngModel)]="editTitle" />
      </mat-form-field>
    </div>
    <mat-dialog-content>
      <div *ngIf="!editMode"><strong>Details:</strong> {{ data.details }}</div>
      <mat-form-field *ngIf="editMode" appearance="outline" class="edit-field">
        <mat-label>Task details</mat-label>
        <textarea matInput rows="3" [(ngModel)]="editDetails"></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions style="display: flex; justify-content: flex-end; gap: 16px;">
      <button *ngIf="!editMode" class="edit-task-icon-btn" (click)="startEdit()" title="Edit task">
        <i class="fa-solid fa-pen-to-square"></i>
      </button>
      <button *ngIf="editMode" class="edit-task-icon-btn" (click)="saveEdit()" title="Save changes">
        <i class="fa-solid fa-floppy-disk"></i>
      </button>
      <button *ngIf="editMode" class="edit-task-icon-btn" (click)="cancelEdit()" title="Cancel edit">
        <i class="fa-solid fa-xmark"></i>
      </button>
      <button class="delete-task-icon-btn" (click)="onDelete()" title="Delete task">
        <i class="fa-solid fa-trash"></i>
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
  .mat-mdc-dialog-surface {background-color: #ffe066;}
    .modal-header {
      height: 32px;
    }
    .modal-title-row {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      padding-bottom: 8px;
    }
    .close-x-btn {
      position: absolute;
      top: 16px;
      right: 16px;
      z-index: 2;
      background: none;
      border: 0;
      font-size: 1.3em;
      color: #888;
      cursor: pointer;
      margin: 0;
      transition: color 0.2s;
    }
    .edit-field {
      width: 100%;
      margin-bottom: 12px;
    }
    .mat-mdc-dialog-surface {
        padding:15px;
    }
    .modal-header{padding:10px}
    .modal-header h2 {
      width: 100%;
      margin: 0;
      padding-right: 40px;
      box-sizing: border-box;
      text-align: left;
      word-break: break-word;
    }
    .close-x-btn {
      position: absolute;
      top: 8px;
      right: 8px;
      z-index: 2;
      background: none;
      border: 0;
      font-size: 1.3em;
      color: #888;
      cursor: pointer;
      margin: 0;
      transition: color 0.2s;
    }
    :host ::ng-deep .mat-dialog-container {
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
    :host ::ng-deep .mat-mdc-dialog-surface {
      padding: 20px !important;
    }
    :host ::ng-deep .modal-header,
    :host ::ng-deep mat-dialog-content,
    :host ::ng-deep mat-dialog-actions {
      max-width: 100%;
      overflow-x: hidden;
      word-break: break-word;
      white-space: normal;
    }
    .modal-header h2, .modal-header button, mat-dialog-content, mat-dialog-actions {
      max-width: 100%;
      overflow-x: hidden;
      word-break: break-word;
      white-space: normal;
    }
    .mat-mdc-dialog-container-with-actions .mat-mdc-dialog-content {
    padding-top: 0px;
 }
 .mdc-dialog--open .mat-mdc-dialog-surface{
    background-color: #ffe066 !important;
 }
    :host ::ng-deep .close-x-btn {
      background: none !important;
      border: none !important;
      box-shadow: none !important;
      outline: none !important;
    }
    .close-x-btn {
      background: none;
      border: 0;
      font-size: 1.3em;
      color: #888;
      cursor: pointer;
      margin-bottom: 20px;
      transition: color 0.2s;
    }
    .close-x-btn:hover {
      color: #e53935;
    }
    .edit-task-icon-btn, .delete-task-icon-btn {
      background: none;
      border: none;
      font-size: 1.2em;
      cursor: pointer;
      margin-left: 8px;
      transition: color 0.2s;
    }
    .edit-task-icon-btn:hover {
      color: #1976d2;
    }
    .delete-task-icon-btn:hover {
      color: #e53935;
    }
  `],
})
export class ImprovementTaskModalComponent {
  editMode = false;
  editTitle: string;
  editDetails: string;

  constructor(
    public dialogRef: MatDialogRef<ImprovementTaskModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Task,
    private dialog: MatDialog
  ) {
    this.editTitle = data.title;
    this.editDetails = data.details;
  }

  startEdit() {
    this.editMode = true;
  }

  saveEdit() {
    // Only close if changed and not empty
    if (this.editTitle.trim() && (this.editTitle !== this.data.title || this.editDetails !== this.data.details)) {
      this.dialogRef.close({ action: 'edit', title: this.editTitle.trim(), details: this.editDetails.trim() });
    } else {
      this.editMode = false;
    }
  }

  cancelEdit() {
    this.editMode = false;
    this.editTitle = this.data.title;
    this.editDetails = this.data.details;
  }

  async onDelete() {
    // Open confirmation dialog before deleting
    const confirmRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '320px',
      hasBackdrop: true
    });
    const confirmed = await confirmRef.afterClosed().toPromise();
    if (confirmed) {
      this.dialogRef.close({ action: 'delete' });
    }
  }

  onClose() {
    this.dialogRef.close();
  }
}
