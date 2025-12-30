import { Component, OnInit, OnDestroy, computed, signal, ElementRef, Renderer2 } from '@angular/core';
import { AuthService, UserDetails } from '../../core/authService'; // Adjust the path
import { Subscription } from 'rxjs';
import { Router, RouterLink } from '@angular/router'; // Import RouterLink for standalone component links
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true, // Assuming standalone
  imports: [RouterLink, CommonModule], // Import RouterLink if standalone
  templateUrl: './header.html', 
  styleUrls: ['./header.css']
})
export class Header implements OnInit, OnDestroy {
  // local UI state for the hamburger menu
  public menuOpen = signal(false);
  private removeDocClickListener: (() => void) | null = null;

  constructor(
    public authService: AuthService,
    private router: Router,
    private hostRef: ElementRef,
    private renderer: Renderer2
  ) {}

  toggleMenu(): void {
    const willOpen = !this.menuOpen();
    this.menuOpen.set(willOpen);
    // If we're opening the menu, refresh the current user's profile from the server
    if (willOpen) {
      const user = this.authService.currentUser();
      if (user && user.id) {
        // fetch fresh profile; subscription will update the stored signal
  this.authService.fetchUserById(user.id).subscribe({ next: (freshUser) => { console.log('Refreshed user profile:', freshUser); }, error: (err) => { console.error('Failed to refresh user profile', err); } });
      }
    }
  }

  ngOnInit(): void {
    // Listen for document clicks and close the menu when clicking outside the header element
    this.removeDocClickListener = this.renderer.listen('document', 'click', (event: Event) => {
      const target = event.target as Node;
      if (!this.hostRef.nativeElement.contains(target)) {
        this.menuOpen.set(false);
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
