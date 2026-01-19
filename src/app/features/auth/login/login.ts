import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/authService';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  username = '';
  email = '';
  errorMessage = signal<string | null>(null);

  constructor(private authService: AuthService, private router: Router) {}

  onLogin() {
    this.errorMessage.set(null);
    // Trim whitespace from inputs (mobile keyboards often add extra spaces)
    const trimmedEmail = this.email.trim();
    const trimmedUsername = this.username.trim();
    
    // Login with username and email only
    this.authService.loginWithEmail(trimmedEmail, trimmedUsername).subscribe({
      next: (response: any) => {
        this.router.navigate(['/daily-calendar']);
      },
      error: (err: any) => {
        this.errorMessage.set('Login failed: Invalid email or username.');
        console.error(err);
      }
    });
  }
}