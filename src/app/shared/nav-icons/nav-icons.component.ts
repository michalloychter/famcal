import { Component, Input, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NgIf } from '@angular/common';
import { AuthService } from '../../core/authService';
import { MatDialog } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { AllMessagesModalComponent } from '../../features/all-messages-modal/all-messages-modal.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-nav-icons',
  standalone: true,
  imports: [RouterModule, NgIf, TranslateModule, MatTooltipModule, MatDialogModule],
  templateUrl: './nav-icons.component.html',
  styleUrls: ['./nav-icons.component.css']
})
export class NavIconsComponent {
  @Input() showLabels = false;
  /** navType: 'header' or 'footer' (default: 'footer') */
  @Input() navType: 'header' | 'footer' = 'footer';
  authService = inject(AuthService);
  dialog = inject(MatDialog);
  openAllMessages() {
    this.dialog.open(AllMessagesModalComponent, {
      width: '600px',
      maxWidth: '90vw',
      panelClass: 'scrolling-dialog'
    });
  }
  constructor() {
    const translate = inject(TranslateService);
   
  }
}
