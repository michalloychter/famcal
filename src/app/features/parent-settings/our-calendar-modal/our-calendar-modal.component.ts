import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { FamilyCalendar } from '../../weekly-calendar/family-calendar';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'our-calendar-modal',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule, FamilyCalendar, MatTooltipModule],
  templateUrl: './our-calendar-modal.component.html',
  styleUrls: ['./our-calendar-modal.component.css']
})
export class OurCalendarModal {}
