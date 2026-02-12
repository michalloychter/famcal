import { GoogleMapsModal } from './google-maps-modal';
import { LoveNotesModal } from './love-notes-modal/love-notes-modal.component';

import { DateSuggestionsModal } from './date-suggestions-modal/date-suggestions-modal.component';
import { DateIdeasModal } from './date-ideas-modal/date-ideas-modal.component';
import { OurCalendarModal } from './our-calendar-modal/our-calendar-modal.component';
import { Component, OnInit, signal, Inject, ChangeDetectorRef, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/authService';
import { MatDialog, MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AiService } from '../../core/aiService';
import { PlacesService } from '../../core/placesService';
import { TasksService, Task } from '../../core/tasksService';
import { WeatherService } from '../../core/weather';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FamilyCalendar } from '../weekly-calendar/family-calendar';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-parent-settings',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatTooltipModule, TranslateModule],
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
    private placesService: PlacesService,
    public tasksService: TasksService,
    private weatherService: WeatherService
  ) {}

  ngOnInit() {
    // Debug: log currentUser to help diagnose production issue
    const currentUser = this.authService.currentUser();
    console.log('[ParentSettings] ngOnInit currentUser:', currentUser);
    // Only run browser-only code in the browser
    if (typeof window !== 'undefined' && !currentUser?.isParent) {
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
    // Open modal immediately with loading state and no coords
    const dialogRef = this.dialog.open(DateSuggestionsModal, {
      width: '600px',
      maxWidth: '90vw',
      data: { type, lat: null, lon: null }
    });
    // Set loading true immediately
    if (dialogRef.componentInstance.setLoading) {
      dialogRef.componentInstance.setLoading(true);
    }
    // Now fetch location and update modal
    this.weatherService.getUserLocation().subscribe({
      next: (coords: { latitude: number, longitude: number }) => {
        dialogRef.componentInstance.data.lat = coords.latitude;
        dialogRef.componentInstance.data.lon = coords.longitude;
        if (dialogRef.componentInstance.setLoading) {
          dialogRef.componentInstance.setLoading(false);
        }
        if (dialogRef.componentInstance.getAISuggestions) {
          dialogRef.componentInstance.getAISuggestions();
        }
      },
      error: () => {
        // Fallback: use default city coordinates (e.g., Jerusalem)
        dialogRef.componentInstance.data.lat = 31.7683;
        dialogRef.componentInstance.data.lon = 35.2137;
        if (dialogRef.componentInstance.setLoading) {
          dialogRef.componentInstance.setLoading(false);
        }
        if (dialogRef.componentInstance.getAISuggestions) {
          dialogRef.componentInstance.getAISuggestions();
        }
      }
    });
  }

  openDateIdeas() {
    this.dialog.open(DateIdeasModal, {
      width: '600px',
      maxWidth: '90vw',
      maxHeight: '60%',
      panelClass: 'scrolling-dialog'
    });
  }

  openOurCalendar() {
    this.dialog.open(OurCalendarModal, {
      width: '600px',
      maxWidth: '90vw',
      panelClass: 'scrolling-dialog'
    });
  }

  openLoveNotes() {
    this.dialog.open(LoveNotesModal, {
      width: '600px',
      maxWidth: '90vw',
      panelClass: 'scrolling-dialog'
    });
  }

 
}

