import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'date-ideas-modal',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule],
  templateUrl: './date-ideas-modal.component.html',
  styleUrls: ['./date-ideas-modal.component.css']
})
export class DateIdeasModal {}
