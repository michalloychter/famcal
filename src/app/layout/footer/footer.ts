import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/authService';
import { NavIconsComponent } from '../../shared/nav-icons/nav-icons.component';
import { TranslateModule } from '@ngx-translate/core';
@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule, NavIconsComponent, TranslateModule],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
})
export class Footer {
  constructor(public authService: AuthService) {}
}
