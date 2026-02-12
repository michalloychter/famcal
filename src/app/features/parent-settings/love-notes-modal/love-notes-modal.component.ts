import { Component, OnInit, ChangeDetectorRef, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TasksService, Task } from '../../../core/tasksService';
import { AuthService } from '../../../core/authService';

@Component({
  selector: 'love-notes-modal',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule, ReactiveFormsModule, MatTooltipModule],
  templateUrl: './love-notes-modal.component.html',
  styleUrls: ['./love-notes-modal.component.css']
})
export class LoveNotesModal implements OnInit {
  noteForm: FormGroup;
  notes: Task[] = [];
  loading = true;
  private loadedOnce = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private tasksService: TasksService,
    private dialogRef: MatDialogRef<LoveNotesModal>,
    private cdr: ChangeDetectorRef
  ) {
    this.noteForm = this.fb.group({
      message: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.tasksService.getTasks().subscribe({
      next: () => {
        const allTasks = this.tasksService.allTasks();
        this.notes = allTasks.filter((task: Task) => task.type === 'private').reverse();
        this.loading = false;
        this.loadedOnce = true;
      },
      error: (err: any) => {
        console.error('Error loading notes:', err);
        this.loading = false;
      }
    });
  }

  isMyMessage(note: Task): boolean {
    const currentUser = this.authService.currentUser();
    return note.memberName === currentUser?.name || note.email === currentUser?.email;
  }

  onEnterPress(event: KeyboardEvent) {
    if (!event.shiftKey) {
      event.preventDefault();
      setTimeout(() => {
        this.sendNote();
      }, 0);
    }
  }

  sendNote() {
    if (this.noteForm.valid) {
      const currentUser = this.authService.currentUser();
      const noteTask = {
        title: 'Love Note',
        date: new Date(),
        details: this.noteForm.value.message,
        familyName: currentUser?.familyName || '',
        memberName: currentUser?.name || currentUser?.familyName || '',
        email: currentUser?.email || '',
        type: 'private'
      };
      const tempId = 'temp-' + Date.now();
      const messageText = this.noteForm.value.message;
      this.noteForm.reset();
      this.notes.push({ ...noteTask, id: tempId, details: messageText } as Task);
      this.tasksService.addTask(noteTask).subscribe({
        next: (response: any) => {
          const tempIndex = this.notes.findIndex((n: Task) => n.id === tempId);
          if (tempIndex !== -1 && response?.id) {
            this.notes[tempIndex] = { ...noteTask, id: response.id, details: messageText } as Task;
          }
        },
        error: (err: any) => {
          console.error('Error sending note:', err);
          this.notes.pop();
          alert('Failed to send note. Please try again.');
        }
      });
    }
  }

  deleteNote(index: number) {
    const noteToDelete = this.notes[index];
    const noteId = noteToDelete.id;
    if (noteId) {
      this.notes.splice(index, 1);
      this.tasksService.deleteTask(noteId).subscribe({
        next: () => {},
        error: (err: any) => {
          this.notes.splice(index, 0, noteToDelete);
          console.error('Error deleting note:', err);
          alert('Failed to delete note. Please try again.');
        }
      });
    }
  }
}
