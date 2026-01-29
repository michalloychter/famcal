import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/authService';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { HouseTasksService } from '../../../core/houseTasksService';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, MatButtonModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  showLoginForm = signal<boolean>(false);
  
  constructor(private authService: AuthService, private router: Router, private dialog: MatDialog) {}

  openLoginForm() {
    this.dialog.open(LoginFormModal, {
      width: '400px',
      autoFocus: true,
      restoreFocus: true,
      hasBackdrop: true,
      closeOnNavigation: true
    });
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }
}

// Login Form Modal Component
@Component({
  selector: 'app-login-form-modal',
  standalone: true,
  imports: [FormsModule, CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <div class="login-modal">
      <h2>Login</h2>
      <div class="form-group">
        <label for="username">Username:</label>
        <input id="username" [(ngModel)]="username" name="username" required type="text" autocomplete="username" autocapitalize="none">
      </div>
      <div class="form-group">
        <label for="email">Email:</label>
        <input id="email" [(ngModel)]="email" name="email" required type="email" autocomplete="email" autocapitalize="none">
      </div>
      <div class="modal-actions">
        <button mat-button (click)="onCancel()">Cancel</button>
        <button mat-raised-button color="primary" (click)="onLogin()">Login</button>
      </div>
      <p *ngIf="errorMessage()" class="error-message">{{ errorMessage() }}</p>
    </div>
  `,
  styles: [`
    .login-modal {
      padding: 20px;
      min-width: 300px;
    }
    .form-group {
      margin-bottom: 15px;
    }
    .form-group label {
      display: block;
      margin-bottom: 5px;
      font-weight: 500;
    }
    .form-group input {
      width: 100%;
      padding: 8px;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-size: 14px;
    }
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 20px;
    }
    .error-message {
      color: red;
      margin-top: 10px;
      font-size: 14px;
    }
  `]
})
export class LoginFormModal {
  username = '';
  email = '';
  errorMessage = signal<string | null>(null);

  constructor(
    private authService: AuthService,
    private router: Router,
    private dialog: MatDialog,
    private houseTasksService: HouseTasksService
  ) {}

  onLogin() {
    this.errorMessage.set(null);
    const trimmedEmail = this.email.trim();
    const trimmedUsername = this.username.trim();
    this.authService.loginWithEmail(trimmedEmail, trimmedUsername).subscribe({
      next: (response: any) => {
        // After login, load house tasks for the user's family
        const user = response?.user;
        const familyId = user?.familyId || user?.familyID;
        if (familyId) {
          this.houseTasksService.loadTasksForFamily(familyId);
        }
        this.dialog.closeAll();
        this.router.navigate(['/daily-calendar']);
      },
      error: (err: any) => {
        this.errorMessage.set('Login failed: Invalid email or username.');
        console.error(err);
      }
    });
  }

  onCancel() {
    this.dialog.closeAll();
  }
}