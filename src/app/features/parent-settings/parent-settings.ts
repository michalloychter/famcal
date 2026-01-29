

import { Component, OnInit, signal, Inject, ChangeDetectorRef, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/authService';
import { MatDialog, MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AiService } from '../../core/aiService';
import { TasksService, Task } from '../../core/tasksService';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FamilyCalendar } from '../weekly-calendar/family-calendar';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-parent-settings',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatTooltipModule],
  templateUrl: './parent-settings.html',
  styleUrl: './parent-settings.css'
})
export class ParentSettings implements OnInit {
  // Computed signal for parent dates
  parentDates = computed(() => {
    const allTasks = this.tasksService.allTasks();
    return allTasks.filter(task => task.type === 'parents');
  });

  // Computed signal for upcoming dates (future dates only, sorted by date)
  upcomingDates = computed(() => {
    const now = new Date();
    return this.parentDates()
      .filter(date => date.date && new Date(date.date) >= now)
      .sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateA - dateB;
      });
  });

  // For *ngFor trackBy
  trackById(index: number, item: any) {
    return item.id;
  }

  constructor(
    public authService: AuthService,
    private router: Router,
    private dialog: MatDialog,
    private aiService: AiService,
    public tasksService: TasksService
  ) {}

  ngOnInit() {
    // Debug: log currentUser to help diagnose production issue
    const currentUser = this.authService.currentUser();
    console.log('[ParentSettings] ngOnInit currentUser:', currentUser);
    if (!currentUser?.isParent) {
      alert('Access denied. This page is only for parents.');
      this.router.navigate(['/daily-calendar']);
    }
    // Load tasks to get parent dates
    this.tasksService.getTasks().subscribe();
  }

  getIconForDate(date: Task): string {
    const title = date.title.toLowerCase();
    if (title.includes('coffee')) return 'fa-solid fa-mug-hot';
    if (title.includes('restaurant')) return 'fa-solid fa-utensils';
    if (title.includes('picnic')) return 'fa-solid fa-basket-shopping';
    if (title.includes('movie')) return 'fa-solid fa-film';
    return 'fa-solid fa-heart';
  }

  formatTitle(title: string): string {
    // Remove "Night" from the title
    return title.replace(/\s*Night\s*/gi, ' ').trim();
  }

  cleanPlaceName(details: string): string {
    // Remove "Romantic date at " or "romantic date at " prefix if it exists
    return details.replace(/^Romantic date at\s*/gi, '').trim();
  }

  getWazeLink(placeName: string): string {
    // Clean the place name first
    const cleanPlace = this.cleanPlaceName(placeName);
    // Create Waze navigation link with place name
    const encodedPlace = encodeURIComponent(cleanPlace);
    return `https://waze.com/ul?q=${encodedPlace}&navigate=yes`;
  }

  getDateSuggestions(type: string, event: Event) {
    event.stopPropagation();
    
    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          
          // Open modal with AI suggestions
          this.dialog.open(DateSuggestionsModal, {
            width: '600px',
            maxWidth: '90vw',
            data: { type, lat, lon }
          });
        },
        (error) => {
          alert('Please enable location services to get nearby suggestions.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  }

  openDateIdeas() {
    this.dialog.open(DateIdeasModal, {
      width: '600px',
      maxWidth: '90vw'
    });
  }

  openOurCalendar() {
    this.dialog.open(OurCalendarModal, {
      width: '600px',
      maxWidth: '90vw'
    });
  }

  openLoveNotes() {
    this.dialog.open(LoveNotesModal, {
      width: '600px',
      maxWidth: '90vw'
    });
  }
}

// Plan Date Modal
@Component({
  selector: 'plan-date-modal',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule, ReactiveFormsModule],
  template: `
    <div class="modal-content">
      <button mat-icon-button class="close-x" mat-dialog-close>
        <i class="fa-solid fa-xmark"></i>
      </button>
      <h2><i class="fa-solid fa-calendar-days"></i> <i class="fa-solid fa-pencil"></i> Plan a Date</h2>
      <p>Schedule your next romantic date night</p>
      <form [formGroup]="dateForm" (ngSubmit)="saveDatePlan()" class="date-form">
        <div class="form-group">
          <label><i class="fa-solid fa-calendar"></i></label>
          <input type="datetime-local" formControlName="datetime" required />
        </div>
        
        <div class="form-group">
          <label><i class="fa-solid fa-location-dot"></i></label>
          <input type="text" formControlName="place" placeholder="Restaurant, park, etc." required />
        </div>
        
        <div class="form-group">
          <label><i class="fa-solid fa-note-sticky"></i></label>
          <textarea formControlName="details" rows="3" placeholder="Any special notes..."></textarea>
        </div>
        
        <div style="position: relative;">
          <button mat-raised-button type="submit" class="save-btn" [disabled]="!dateForm.valid || saving">
            <i class="fa-solid fa-heart"></i> {{ saving ? 'Saving...' : 'Save Date Plan' }}
          </button>
          <i *ngIf="showHeart" class="fa-solid fa-heart floating-heart"></i>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .modal-content {
      padding: 20px;
      min-width: 400px;
      position: relative;
    }
    .close-x {
      position: absolute;
      top: 10px;
      right: 10px;
      color: #722f37;
      cursor: pointer;
      background: none;
      border: none;
      font-size: 1.5rem;
      z-index: 10;
    }
    .close-x:hover {
      color: #5c1f29;
    }
    h2 {
      color: #722f37;
      margin-bottom: 10px;
    }
    h2 i {
      margin-right: 5px;
    }
    .date-form {
      margin: 20px 0;
    }
    .form-group {
      margin-bottom: 15px;
    }
    .form-group label {
      display: block;
      margin-bottom: 5px;
      color: #722f37;
      font-weight: 500;
    }
    .form-group label i {
      margin-right: 5px;
    }
    .form-group input,
    .form-group textarea {
      width: 100%;
      padding: 10px;
      border: 2px solid #ddd;
      border-radius: 8px;
      font-size: 1rem;
      box-sizing: border-box;
    }
    .form-group input:focus,
    .form-group textarea:focus {
      outline: none;
      border-color: #722f37;
    }
    .form-group textarea {
      resize: vertical;
      font-family: inherit;
    }
    .save-btn {
      background: #722f37;
      color: white;
      width: 100%;
    }
    .save-btn:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
    .floating-heart {
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 3rem;
      color: #722f37;
      animation: floatUp 2s ease-out forwards;
      pointer-events: none;
    }
    @keyframes floatUp {
      0% {
        opacity: 1;
        transform: translateX(-50%) translateY(0) scale(1);
      }
      50% {
        opacity: 1;
        transform: translateX(-50%) translateY(-100px) scale(1.5);
      }
      100% {
        opacity: 0;
        transform: translateX(-50%) translateY(-200px) scale(2);
      }
    }
  `]
})
export class PlanDateModal {
  dateForm: FormGroup;
  saving = false;
  showHeart = false;

  constructor(
    private fb: FormBuilder,
    private tasksService: TasksService,
    private authService: AuthService,
    private dialogRef: MatDialogRef<PlanDateModal>
  ) {
    this.dateForm = this.fb.group({
      datetime: ['', Validators.required],
      place: ['', Validators.required],
      details: ['']
    });
  }

  saveDatePlan() {
    if (this.dateForm.valid && !this.saving) {
      this.saving = true;
      const formValue = this.dateForm.value;
      const currentUser = this.authService.currentUser();
      
      const taskData = {
        title: `Date at ${formValue.place}`,
        date: new Date(formValue.datetime),
        details: formValue.place || formValue.details || '',
        familyName: currentUser?.familyName || '',
        memberName: 'Parents',
        type: 'parents',
        familyID: String(currentUser?.id || ''),
        email: currentUser?.email || ''
      };

      this.tasksService.addTask(taskData).subscribe({
        next: () => {
          this.saving = false;
          this.showHeart = true;
          setTimeout(() => {
            this.dialogRef.close();
          }, 2000);
        },
        error: (err) => {
          this.saving = false;
          console.error('Error saving date plan:', err);
          alert('Failed to save date plan. Please try again.');
        }
      });
    }
  }
}

// Date Ideas Modal
@Component({
  selector: 'date-ideas-modal',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule],
  template: `
    <div class="modal-content">
      <h2>Date Ideas</h2>
      <p>Get inspired with creative date ideas</p>
      <div class="ideas-list">
        <div class="idea-card">
          <i class="fa-solid fa-mug-hot"></i>
        </div>
        <div class="idea-card">
          <i class="fa-solid fa-utensils"></i>
        </div>
        <div class="idea-card">
          <i class="fa-solid fa-basket-shopping"></i>
        </div>
        <div class="idea-card">
          <i class="fa-solid fa-film"></i>
        </div>
      </div>
      <button mat-button class="close-btn" mat-dialog-close>Close</button>
    </div>
  `,
  styles: [`
    .modal-content {
      padding: 20px;
    }
    h2 {
      color: #722f37;
      margin-bottom: 10px;
    }
    .ideas-list {
      margin: 20px 0;
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
    }
    .idea-card {
      padding: 30px;
      background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
      border-radius: 12px;
      cursor: pointer;
      transition: transform 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      aspect-ratio: 1;
    }
    .idea-card i {
      font-size: 3rem;
      color: #722f37;
    }
    .idea-card:hover {
      transform: scale(1.05);
    }
    .close-btn {
      background: #722f37;
      color: white;
      width: 100%;
    }
  `]
})
export class DateIdeasModal {}

// Our Calendar Modal
@Component({
  selector: 'our-calendar-modal',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule, FamilyCalendar, MatTooltipModule],
  template: `
    <div class="modal-content">
      <button mat-icon-button class="close-x" mat-dialog-close matTooltip="Close calendar" matTooltipPosition="left">
        <i class="fa-solid fa-xmark"></i>
      </button>
      <app-family-calendar></app-family-calendar>
    </div>
  `,
  styles: [`
    .modal-content {
      padding: 0;
      width: 95vw;
      height: 95vh;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .close-x {
      position: absolute;
      top: 10px;
      right: 10px;
      color: #722f37;
      cursor: pointer;
      background: none;
      border: none;
      font-size: 1.5rem;
      z-index: 1000;
    }
    .close-x:hover {
      color: #5c1f29;
    }
    app-family-calendar {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    ::ng-deep app-family-calendar {
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    ::ng-deep .calendar-container {
      height: 100% !important;
      overflow: visible !important;
      overflow-x: visible !important;
      padding: 20px !important;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    ::ng-deep .calendar-header {
      flex-shrink: 0;
      padding: 10px 20px;
      width: 100%;
    }
    ::ng-deep full-calendar {
      flex: 1 !important;
      height: auto !important;
      min-height: 0;
      width: 100%;
    }
    ::ng-deep .fc {
      height: 100% !important;
      width: 100%;
    }
    ::ng-deep .fc-view-harness {
      height: 100% !important;
    }
  `]
})
export class OurCalendarModal {}

// Love Notes Modal
@Component({
  selector: 'love-notes-modal',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule, ReactiveFormsModule, MatTooltipModule],
  template: `
    <div class="modal-content">
      <button mat-icon-button class="close-x" mat-dialog-close matTooltip="Close" matTooltipPosition="left">
        <i class="fa-solid fa-xmark"></i>
      </button>
      <h2><i class="fa-solid fa-envelope-open-text"></i> our Notes</h2>
      
      <!-- Chat Messages - WhatsApp Style -->
      <div class="chat-container">
        <div class="chat-messages">
          @if (notes.length === 0) {
            <p class="no-messages">No messages yet. Start the conversation!</p>
          } @else {
            @for (note of notes; track note.id) {
              <div class="message-wrapper" [class.my-message]="isMyMessage(note)">
                <div class="message-bubble" [class.my-bubble]="isMyMessage(note)">
                  <p class="message-text">{{ note.details }}</p>
                  <div class="message-footer">
                    <span class="message-author">{{ note.memberName }}</span>
                    <span class="message-time">{{ note.date | date:'h:mm a' }}</span>
                  </div>
                </div>
              </div>
            }
          }
        </div>
      </div>
      
      <!-- Message Input - Fixed at Bottom -->
      <div class="message-input-section">
        <form [formGroup]="noteForm">
          <div class="message-input-container">
            <textarea 
              formControlName="message" 
              placeholder="Type a message..." 
              rows="2"
              (keydown.enter)="onEnterPress($any($event))"
              matTooltip="Press Enter to send, Shift+Enter for new line" 
              matTooltipPosition="above"
              matTooltipShowDelay="500"></textarea>
            <button mat-icon-button type="button" (click)="sendNote()" class="send-btn" [disabled]="!noteForm.valid" matTooltip="Send message" matTooltipPosition="left">
              <i class="fa-solid fa-paper-plane"></i>
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .modal-content {
      padding: 0;
      position: relative;
      max-height: 80vh;
      display: flex;
      flex-direction: column;
      background: #f0f0f0;
    }
    .close-x {
      position: absolute;
      top: 10px;
      right: 10px;
      color: #722f37;
      cursor: pointer;
      background: white;
      border: none;
      font-size: 1.5rem;
      z-index: 100;
      border-radius: 50%;
      width: 36px;
      height: 36px;
    }
    .close-x:hover {
      background: #f0f0f0;
    }
    h2 {
      color: white;
      background: #722f37;
      margin: 0;
      padding: 15px 20px;
      padding-right: 50px;
      font-size: 1.2rem;
    }
    .chat-container {
      flex: 1;
      overflow-y: auto;
      padding: 15px;
      background: #f0f0f0;
      min-height: 300px;
      max-height: 50vh;
    }
    .chat-messages {
      display: flex;
      flex-direction: column-reverse;
      gap: 8px;
    }
    .no-messages {
      text-align: center;
      color: #999;
      padding: 40px 20px;
      font-style: italic;
    }
    .message-wrapper {
      display: flex;
      width: 100%;
    }
    .message-wrapper.my-message {
      justify-content: flex-end;
    }
    .message-bubble {
      max-width: 70%;
      padding: 8px 12px;
      border-radius: 12px;
      background: white;
      box-shadow: 0 1px 2px rgba(0,0,0,0.1);
      word-wrap: break-word;
    }
    .message-bubble.my-bubble {
      background: #dcf8c6;
    }
    .message-text {
      margin: 0 0 5px 0;
      color: #333;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .message-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      font-size: 0.75rem;
    }
    .message-author {
      color: #9f3939;
      font-weight: 500;
    }
    .message-time {
      color: #666;
    }
    .message-input-section {
      padding: 10px;
      background: white;
      border-top: 1px solid #ddd;
    }
    .message-input-container {
      display: flex;
      align-items: flex-end;
      gap: 10px;
    }
    textarea {
      flex: 1;
      padding: 10px;
      border: 2px solid #ddd;
      border-radius: 20px;
      font-size: 1rem;
      resize: none;
      min-height: 40px;
      max-height: 100px;
      font-family: inherit;
    }
    textarea:focus {
      outline: none;
      border-color: #722f37;
    }
    .send-btn {
      background: none;
      border: none;
      width: 48px;
      height: 48px;
      flex-shrink: 0;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .send-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .send-btn:not(:disabled):hover i {
      color: #5c1f29;
    }
    .send-btn i {
      font-size: 1.5rem;
      color: #722f37;
    }
  `]
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
    // Load notes once on init
    this.tasksService.getTasks().subscribe({
      next: () => {
        const allTasks = this.tasksService.allTasks();
        // Reverse to show newest at bottom (WhatsApp style)
        this.notes = allTasks.filter(task => task.type === 'private').reverse();
        this.loading = false;
        this.loadedOnce = true;
      },
      error: (err) => {
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
      // Use setTimeout to defer the call outside of the current change detection
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
      
      // Reset form immediately
      this.noteForm.reset();
      
      // Add to notes array (now safe because button click is outside change detection)
      this.notes.push({ ...noteTask, id: tempId, details: messageText } as Task);
      
      this.tasksService.addTask(noteTask).subscribe({
        next: (response: any) => {
          // Replace temp note with real one from server (if it has an ID)
          const tempIndex = this.notes.findIndex(n => n.id === tempId);
          if (tempIndex !== -1 && response?.id) {
            this.notes[tempIndex] = { ...noteTask, id: response.id, details: messageText } as Task;
          }
        },
        error: (err) => {
          console.error('Error sending note:', err);
          // Remove the optimistic note on error
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
      // Optimistically remove from array
      this.notes.splice(index, 1);
      
      this.tasksService.deleteTask(noteId).subscribe({
        next: () => {
          // Successfully deleted
        },
        error: (err) => {
          // Restore the note on error
          this.notes.splice(index, 0, noteToDelete);
          console.error('Error deleting note:', err);
          alert('Failed to delete note. Please try again.');
        }
      });
    }
  }
}

// Date Suggestions Modal
@Component({
  selector: 'date-suggestions-modal',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule, ReactiveFormsModule, MatTooltipModule],
  template: `
    <div class="modal-content">
      <button mat-icon-button class="close-x" mat-dialog-close matTooltip="Close" matTooltipPosition="left">
        <i class="fa-solid fa-xmark"></i>
      </button>
      <h2><i [class]="getIconClass()"></i> {{ getTitle() }}</h2>
      
      <!-- Add Date Form -->
      <div class="add-date-section">
        <h3>Schedule This Date</h3>
        <form [formGroup]="dateForm" (ngSubmit)="saveDate()" class="date-form">
          <div class="form-group">
            <input type="datetime-local" formControlName="datetime" required matTooltip="Select date and time for your date" matTooltipPosition="above" />
          </div>
          <div class="form-group place-input-group">
            <input type="text" formControlName="place" placeholder="Place (optional)" matTooltip="Enter the location name" matTooltipPosition="above" />
            <a *ngIf="mapsUrl" [href]="mapsUrl" target="_blank" class="maps-btn" matTooltip="Search nearby places on Google Maps" matTooltipPosition="left">
              <i class="fa-solid fa-map-location-dot"></i>
            </a>
          </div>
          <button mat-raised-button type="submit" class="save-btn" [disabled]="!dateForm.valid || saving" matTooltip="Add this date to your calendar" matTooltipPosition="above">
            <i class="fa-solid fa-heart"></i> {{ saving ? 'Saving...' : 'Add to Calendar' }}
          </button>
        </form>
        <div *ngIf="showHeart" class="floating-heart">💕</div>
      </div>
      
      <!-- Suggestions -->
      <p>{{ loadingMessage }}</p>
      <div class="suggestions-content">
        <div *ngIf="loading" class="loading">
          <i class="fa-solid fa-spinner fa-spin"></i> Loading...
        </div>
        <div *ngIf="!loading && suggestions" class="suggestions-list">
          <div class="tips">
            <p [innerHTML]="formatSuggestions()"></p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-content {
      padding: 20px;
      position: relative;
    }
    .close-x {
      position: absolute;
      top: 10px;
      right: 10px;
      color: #722f37;
      cursor: pointer;
      background: none;
      border: none;
      font-size: 1.5rem;
      z-index: 10;
    }
    .close-x:hover {
      color: #5c1f29;
    }
    h2 {
      color: #722f37;
      margin-bottom: 10px;
    }
    .add-date-section {
      background: #f6ebf2;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
      position: relative;
    }
    .add-date-section h3 {
      color: #722f37;
      margin-bottom: 10px;
      font-size: 1.1rem;
    }
    .date-form {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .form-group {
      position: relative;
    }
    .place-input-group {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .form-group input {
      width: 100%;
      padding: 10px;
      border: 2px solid #ddd;
      border-radius: 8px;
      font-size: 1rem;
      box-sizing: border-box;
    }
    .form-group input:focus {
      outline: none;
      border-color: #722f37;
    }
    .maps-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      background: #9f3939;
      color: white;
      border-radius: 8px;
      text-decoration: none;
      flex-shrink: 0;
      transition: background 0.3s;
    }
    .maps-btn:hover {
      background: #722f37;
    }
    .maps-btn i {
      font-size: 1.2rem;
    }
    .save-btn {
      background: #722f37;
      color: white;
    }
    .save-btn:disabled {
      background: #ccc;
    }
    .floating-heart {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 3rem;
      animation: floatUp 2s ease-out forwards;
      pointer-events: none;
    }
    @keyframes floatUp {
      0% {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
      }
      100% {
        opacity: 0;
        transform: translate(-50%, -200%) scale(2);
      }
    }
    .suggestions-content {
      margin: 20px 0;
      min-height: 150px;
    }
    .loading {
      text-align: center;
      padding: 40px;
      color: #722f37;
      font-size: 1.2rem;
    }
    .fa-spinner {
      margin-right: 10px;
    }
    .suggestions-list {
      padding: 15px;
      background: #f6ebf2;
      border-radius: 8px;
      line-height: 1.8;
    }
    .tips {
      white-space: pre-line;
    }
  `]
})
export class DateSuggestionsModal implements OnInit {
  loading = true;
  suggestions = '';
  mapsUrl = '';
  loadingMessage = 'Getting suggestions near you...';
  dateForm: FormGroup;
  saving = false;
  showHeart = false;
  
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { type: string; lat: number; lon: number },
    private aiService: AiService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private tasksService: TasksService,
    private authService: AuthService,
    private dialogRef: MatDialogRef<DateSuggestionsModal>
  ) {
    // Initialize form with default title based on type
    const titleMap: any = {
      coffee: 'Coffee Date',
      restaurant: 'Restaurant Date',
      picnic: 'Picnic Date',
      movie: 'Movie Date'
    };
    
    this.dateForm = this.fb.group({
      datetime: ['', Validators.required],
      place: ['']
    });
  }
  
  ngOnInit() {
    this.getAISuggestions();
  }
  
  saveDate() {
    if (this.dateForm.valid && !this.saving) {
      this.saving = true;
      const formValue = this.dateForm.value;
      const currentUser = this.authService.currentUser();
      
      const titleMap: any = {
        coffee: 'Coffee Date',
        restaurant: 'Restaurant Date',
        picnic: 'Picnic Date',
        movie: 'Movie Date'
      };
      
      const title = formValue.place ? `${titleMap[this.data.type]} - ${formValue.place}` : titleMap[this.data.type];
      
      const taskData = {
        title: title,
        date: new Date(formValue.datetime),
        details: formValue.place || '',
        familyName: currentUser?.familyName || '',
        memberName: currentUser?.name || currentUser?.familyName || '',
        email: currentUser?.email || '',
        type: 'parents'
      };
      
      this.tasksService.addTask(taskData).subscribe({
        next: () => {
          this.saving = false;
          this.showHeart = true;
          setTimeout(() => {
            this.dialogRef.close();
          }, 1500);
        },
        error: (err) => {
          console.error('Error saving date:', err);
          alert('Failed to save date. Please try again.');
          this.saving = false;
        }
      });
    }
  }
  
  getIconClass(): string {
    const icons: any = {
      coffee: 'fa-solid fa-mug-hot',
      restaurant: 'fa-solid fa-utensils',
      picnic: 'fa-solid fa-basket-shopping',
      movie: 'fa-solid fa-film'
    };
    return icons[this.data.type] || 'fa-solid fa-heart';
  }
  
  getTitle(): string {
    const titles: any = {
      coffee: 'Coffee Shops Near You',
      restaurant: 'Restaurants Near You',
      picnic: 'Picnic Spots Near You',
      movie: 'Movies & Shows Near You'
    };
    return titles[this.data.type] || 'Date Ideas';
  }
  
  formatSuggestions(): string {
    return this.suggestions.replace(/\n/g, '<br>');
  }
  
  async getAISuggestions() {
    const typeMap: any = {
      coffee: 'coffee shops',
      restaurant: 'romantic restaurants',
      picnic: 'parks and picnic spots',
      movie: 'cinemas and entertainment venues'
    };
    
    // Create a Google Maps search URL
    this.mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(typeMap[this.data.type])}/@${this.data.lat},${this.data.lon},14z`;
    
    const question = `I want to find ${typeMap[this.data.type]} for a romantic date. Please suggest 3-4 specific tips for choosing the best place and what to look for to make it a memorable romantic experience.`;
    
    try {
      const response = await this.aiService.getImprovementSuggestion(question).toPromise();
      // Format the suggestions
      if (response && response.suggestions) {
        this.suggestions = '💡 Tips for choosing the perfect spot:\n\n';
        this.suggestions += response.suggestions.map((s: any, index: number) => 
          `${index + 1}. ${s.title}\n   ${s.details}`
        ).join('\n\n');
      } else {
        this.suggestions = 'Click the button above to explore options in your area!';
      }
    } catch (error) {
      this.suggestions = 'Click the button above to explore options in your area!';
    } finally {
      this.loading = false;
      this.loadingMessage = 'AI-powered tips for your romantic date';
      this.cdr.detectChanges();
    }
  }
}
