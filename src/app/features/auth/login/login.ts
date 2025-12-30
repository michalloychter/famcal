import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms'; // Required for [(ngModel)]
import { CommonModule } from '@angular/common'; // Required for *ngIf
import { Router } from '@angular/router'; // Required for redirection
import { AuthService } from '../../../core/authService'; // Import the AuthService (adjust path if needed)
import { log } from 'node:console';

@Component({
  selector: 'app-login',
  standalone: true, // Assuming it's a standalone component
  imports: [FormsModule, CommonModule], // Add necessary modules here
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login { // Changed class name to standard 'LoginComponent'
  userName = signal<string>(''); 
  password = signal<string>('');
  errorMessage = signal<string | null>(null); 

  // Inject the AuthService and the Router
  constructor(private authService: AuthService, private router: Router) {}

  // Method to handle the login button click
  onLogin() {

     this.errorMessage.set(null); 
    this.authService.login(this.userName(), this.password()).subscribe({
      next: (response:any) => {
        // Success: Redirect to the daily-calendar route
        this.router.navigate(['/daily-calendar']); 
        console.log("res", response);
        
      },
      error: (err:any) => {
        // Error: Display an error message
        this.errorMessage.set('Login failed: Invalid credentials.');
        console.error(err);
      }
    });
  }
}