import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiService } from '../../core/aiService';

@Component({
  selector: 'app-weekly-improvement',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <form (ngSubmit)="submitImprovement()" class="improvement-form">
      <input id="improvement" name="improvement" [(ngModel)]="improvement" required placeholder="What do you want to improve this week?" />
      <button class="fam-btn" type="submit">Send</button>
    </form>
    <div *ngIf="aiSuggestion" class="saved-message">
      <strong>AI Suggestion:</strong>
      <ul>
        <li *ngFor="let step of suggestionSteps" (click)="selectSuggestion(step)" style="cursor:pointer;">
          {{ step }}
        </li>
      </ul>
    </div>
    <!-- Suggest as Task button removed; suggestion is emitted automatically on click -->
    <div *ngIf="loading" class="loading-message">Loading suggestion...</div>
    <div *ngIf="error" class="error-message">{{ error }}</div>
  `,
  styleUrls: ['./weekly-improvement.css']
})
export class WeeklyImprovementComponent {
  improvement = '';
  aiSuggestion: string | null = null;
  loading = false;
  error: string | null = null;
  selectedSuggestion: string | null = null;

  @Output() improvementSaved = new EventEmitter<string>();
  @Output() suggestAsTask = new EventEmitter<{ type?: string, details: string }>();

  constructor(private aiService: AiService) {}

  submitImprovement() {
    const value = this.improvement.trim();
    if (value) {
      this.loading = true;
      this.error = null;
      this.aiSuggestion = null;
      this.aiService.getImprovementSuggestion(value).subscribe({
        next: (res) => {
          this.aiSuggestion = res.suggestion;
          this.improvementSaved.emit(value);
          this.improvement = '';
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Failed to get AI suggestion.';
          this.loading = false;
        }
      });
    }
  }

  get suggestionSteps(): string[] {
    if (!this.aiSuggestion) return [];
    // Split on numbers followed by a dot and space (e.g., '1. ')
    const parts = this.aiSuggestion.split(/\d+\.\s+/).filter(s => s.trim());
    // If the first part is just intro, skip it
    return parts.length > 1 ? parts.slice(1) : parts;
  }

  selectSuggestion(step: string) {
    this.selectedSuggestion = step;
    // Immediately emit as a task with empty title and no type
    this.suggestAsTask.emit({ details: step });
    this.selectedSuggestion = null;
  }
}
