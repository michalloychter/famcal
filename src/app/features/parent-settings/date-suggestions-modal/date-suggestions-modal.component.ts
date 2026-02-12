import { Component, OnInit, Inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TasksService, Task } from '../../../core/tasksService';
import { AuthService } from '../../../core/authService';
import { AiService } from '../../../core/aiService';
import { PlacesService } from '../../../core/placesService';
import { GoogleMapsModal } from '../google-maps-modal';
import { TranslateModule } from '@ngx-translate/core';
@Component({
  selector: 'date-suggestions-modal',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule, ReactiveFormsModule, MatTooltipModule, TranslateModule],
  templateUrl: './date-suggestions-modal.component.html',
  styleUrls: ['./date-suggestions-modal.component.css']
})
export class DateSuggestionsModal implements OnInit {
  loading = true;
  suggestions = '';
  places: any[] = [];
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
    public dialog: MatDialog,
    public dialogRef: MatDialogRef<DateSuggestionsModal>,
    private placesService: PlacesService
  ) {
    this.dateForm = this.fb.group({
      datetime: ['', Validators.required],
      place: ['']
    });
  }

  ngOnInit() {
    this.getAISuggestions();
  }

  setLoading(val: boolean) {
    this.loading = val;
    if (this.cdr) {
      this.cdr.detectChanges();
    }
  }

  selectPlace(name: string) {
    this.dateForm.patchValue({ place: name });
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
          this.dialogRef.close();
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
      coffee: 'COFFEE_SHOPS',
      restaurant: 'RESTAURANTS',
      picnic: 'PICNIC_SPOTS',
      movie: 'MOVIES_SHOWS',
    };
    return titles[this.data.type] || 'DATE_IDEAS';
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
    const type = typeMap[this.data.type] || 'places';
    try {
      const response = await this.placesService.getNearbyPlaces(type, this.data.lat, this.data.lon).toPromise();
      if (response && response.places && response.places.length > 0) {
        this.places = response.places;
        this.suggestions = '';
      } else {
        this.places = [];
        this.suggestions = 'No places found. Try searching on Google Maps.';
      }
    } catch (error) {
      this.places = [];
      this.suggestions = 'No places found. Try searching on Google Maps.';
    } finally {
      this.loading = false;
      this.loadingMessage = 'Nearby places for your date';
      this.cdr.detectChanges();
    }
  }

  openMapsModal() {
    const typeMap: any = {
      coffee: 'coffee shops',
      restaurant: 'romantic restaurants',
      picnic: 'parks and picnic spots',
      movie: 'cinemas and entertainment venues'
    };
    const placeType = typeMap[this.data.type] || 'places';
    const lat = this.data.lat;
    const lon = this.data.lon;
    const query = `${placeType} @${lat},${lon}`;
    this.dialog.open(GoogleMapsModal, {
      width: '95vw',
      maxWidth: '600px',
      data: { place: query }
    });
  }
}
