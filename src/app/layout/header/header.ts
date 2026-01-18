import { Component, OnInit, OnDestroy, computed, signal, ElementRef, Renderer2 } from '@angular/core';
import { AuthService } from '../../core/authService';
import type { familyDetails } from '../../shared/models/family';
import { Subscription } from 'rxjs';
import { Router, RouterLink } from '@angular/router'; // Import RouterLink for standalone component links
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true, // Assuming standalone
  imports: [RouterLink, CommonModule], // Import RouterLink if standalone
  templateUrl: './header.html', 
  styleUrls: ['./header.css', './header-nav.css']
})
export class Header implements OnInit, OnDestroy {
  // local UI state for the user menu dropdown
  public userMenuOpen = signal(false);
  public navMenuOpen = signal(false);
  private removeDocClickListener: (() => void) | null = null;

  constructor(
    public authService: AuthService,
    private router: Router,
    private hostRef: ElementRef,
    private renderer: Renderer2
  ) {}

  toggleNavMenu(): void {
    this.navMenuOpen.set(!this.navMenuOpen());
  }

  closeNavMenu(): void {
    this.navMenuOpen.set(false);
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
        this.navMenuOpen.set(false);
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
}
