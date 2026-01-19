// ...existing imports...
import { Component, EventEmitter, Output, Input, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AiService } from '../../core/aiService';
import { timeout, catchError, of } from 'rxjs';
import { lookupService } from 'node:dns/promises';


export interface ImprovementSuggestion {
  title: string;
  details: string;
}

@Component({
  selector: 'app-weekly-improvement',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './weekly-improvement.html',
  styleUrl: './weekly-improvement.css'
})

export class WeeklyImprovementComponent {
  improvement: string = '';
  aiSuggestions: ImprovementSuggestion[] = [];
  loading = false;
  error: string | null = null;
  cardDates: { [idx: number]: string } = {};
  cardReminders: { [idx: number]: string } = {};
  savedCards: { [idx: number]: boolean } = {}; // Track which cards are saved

  @Input() memberColor: string = '#1976d2'; // Receive color from parent

  @Output() improvementSaved = new EventEmitter<string>();
  @Output() saveAsTask = new EventEmitter<{ title: string; details: string; date: string; reminderDateTime?: string }>();

  constructor(private aiService: AiService, private cdr: ChangeDetectorRef) {}

  submitImprovement() {
    const value = this.improvement.trim();
    if (!value) return;
    this.loading = true;
    this.error = null;
    this.aiSuggestions = [];

    this.aiService.getImprovementSuggestion(value)
      .pipe(
        timeout(20000),
        catchError((err) => {
          console.error('AI suggestion error:', err);
          this.error = err.error?.error || 'Failed to get AI suggestion. Please try again.';
          this.loading = false;
          this.cdr.detectChanges();
          return of({ suggestions: [] });
        })
      )
      .subscribe((res) => {
        console.log('AI suggestions response:', res);
        if (res && Array.isArray(res.suggestions) && res.suggestions.length > 0) {
          // Validate that suggestions have title and details
          const validSuggestions = res.suggestions.filter(s => s.title && s.details);
          if (validSuggestions.length > 0) {
            this.aiSuggestions = validSuggestions;
            this.improvementSaved.emit(value);
            this.improvement = '';
          } else {
            this.error = 'Received suggestions but they are missing required fields.';
          }
        } else {
          this.error = 'No suggestions received from AI. Please try again.';
        }
        this.loading = false;
        this.cdr.detectChanges();
      });
  }

  saveCardAsTask(idx: number, step: ImprovementSuggestion) {
    const date = this.cardDates[idx];
    if (!date) return;
    const reminder = this.cardReminders[idx];
    this.saveAsTask.emit({
      title: step.title,
      details: step.details,
      date: date,
      reminderDateTime: reminder
    });
    // Mark card as saved
    this.savedCards[idx] = true;
    // Don't clear the dates/reminders, keep them visible but show saved state
  }

  closeAndClear() {
    this.aiSuggestions = [];
    this.cardDates = {};
    this.cardReminders = {};
    this.savedCards = {};
    this.error = null;
  }
}
