
import { Component, OnInit, OnDestroy, computed, signal, ElementRef, Renderer2, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../core/authService';
import { NavIconsComponent } from '../../shared/nav-icons/nav-icons.component';
import type { familyDetails } from '../../shared/models/family';
import { AllMessagesModalComponent } from '../../features/all-messages-modal/all-messages-modal.component';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [ CommonModule, TranslateModule, NavIconsComponent],
  templateUrl: './header.html', 
  styleUrls: ['./header.css', './header-nav.css']
})
export class Header implements OnInit, OnDestroy {
 
  public userMenuOpen = signal(false);
  private removeDocClickListener: (() => void) | null = null;

  currentLang = signal('en');

  constructor(
  public authService: AuthService,
  private router: Router,
  private hostRef: ElementRef,
  private renderer: Renderer2,
  private translate: TranslateService,
  private dialog: MatDialog,
  @Inject(PLATFORM_ID) private platformId: Object
 
  ) {
    this.translate.addLangs(['en', 'he']);
    this.translate.setDefaultLang('en');
    const browserLang = this.translate.getBrowserLang();
    const initialLang = browserLang === 'he' ? 'he' : 'en';
    this.currentLang.set(initialLang);
    this.translate.use(initialLang);
    // Set <html> dir and lang on load (browser only)
    if (isPlatformBrowser(this.platformId)) {
      const dir = initialLang === 'he' ? 'rtl' : 'ltr';
      document.documentElement.setAttribute('dir', dir);
      document.documentElement.setAttribute('lang', initialLang);
    }
  }
  openAllMessages() {
    this.dialog.open(AllMessagesModalComponent, {
      width: '600px',
      maxWidth: '90vw',
      panelClass: 'scrolling-dialog'
    });
  }
  onLangChange(event: Event) {
    const value = (event.target as HTMLSelectElement)?.value;
    if (value) this.switchLang(value);
  }

  switchLang(lang: string) {
    this.currentLang.set(lang);
    this.translate.use(lang);
    // Set <html> dir and lang attributes dynamically (browser only)
    if (isPlatformBrowser(this.platformId)) {
      const dir = lang === 'he' ? 'rtl' : 'ltr';
      document.documentElement.setAttribute('dir', dir);
      document.documentElement.setAttribute('lang', lang);
      console.log('Switched language to:', lang, 'dir:', dir);
    }
  }

  toggleUserMenu(): void {
    const willOpen = !this.userMenuOpen();
    this.userMenuOpen.set(willOpen);
    // If we're opening the menu, refresh the current user's profile from the server
    if (willOpen) {
      const family = this.authService.currentUser();
      if (family && family.id) {
        // fetch fresh profile; subscription will update the stored signal
        this.authService.fetchFamilyById(family.id).subscribe({
          next: (freshFamily: familyDetails) => { console.log('Refreshed family profile:', freshFamily); },
          error: (err: any) => { console.error('Failed to refresh family profile', err); }
        });
      }
    }
  }

  ngOnInit(): void {
    // Listen for document clicks and close the menus when clicking outside the header element
    this.removeDocClickListener = this.renderer.listen('document', 'click', (event: Event) => {
      const target = event.target as Node;
      if (!this.hostRef.nativeElement.contains(target)) {
        this.userMenuOpen.set(false);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.removeDocClickListener) {
      this.removeDocClickListener();
      this.removeDocClickListener = null;
    }
  }

  public readonly isLoggedIn = computed(() => {
    // Access the signal value using parentheses: authService.currentUser()
    const user = this.authService.currentUser();
    // Use the !! shorthand to convert the user object/null to a boolean
    return !!user; 
  }); 
  


  logout(): void {
    this.authService.logout();
    // Optional: Redirect to login page or home page after logout
    this.router.navigate(['/login']); 
  }

  onLogoClick() {
    if (this.authService.currentUser()) {
      this.router.navigate(['/daily-calendar']);
    } else {
      this.router.navigate(['/login']);
    }
  }
}
