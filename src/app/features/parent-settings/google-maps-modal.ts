import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'google-maps-modal',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule, TranslateModule],
  template: `
    <div class="modal-content">
      <button mat-icon-button class="close-x" mat-dialog-close>
        <i class="fa-solid fa-xmark"></i>
      </button>
      <h2><i class="fa-solid fa-map-location-dot"></i> Google Maps Search</h2>
      <iframe
        *ngIf="mapsUrl"
        [src]="mapsUrl"
        width="100%"
        height="500"
        style="border:0; border-radius: 12px; margin-top: 10px;"
        allowfullscreen=""
        loading="lazy"
        referrerpolicy="no-referrer-when-downgrade"
      ></iframe>
      <div *ngIf="!mapsUrl" class="loading">
        <i class="fa-solid fa-spinner fa-spin"></i> Loading map...
      </div>
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
    .loading {
      text-align: center;
      padding: 40px;
      color: #722f37;
      font-size: 1.2rem;
    }
    .fa-spinner {
      margin-right: 10px;
    }
  `]
})
export class GoogleMapsModal implements OnInit {
  mapsUrl: SafeResourceUrl | null = null;
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { place: string },
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    // Build Google Maps search URL
    const query = encodeURIComponent(this.data.place);
    const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
    this.mapsUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}
