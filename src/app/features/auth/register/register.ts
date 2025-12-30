import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../core/authService';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule], // Import ReactiveFormsModule for form handling
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {
  registerForm: FormGroup;
  loading = false;
  submitted = false;
  error = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      userName: ['', Validators.required], // Use 'userName' to match your backend login structure
      password: ['', [Validators.required, Validators.minLength(6)]],
      members:  ['', Validators.required],
      email:['', Validators.required],
      // New financial/health fields
      bankName: [''],
      bankUrl: [''],
      healthFundName: [''],
      healthFundUrl: [''],
      superName: [''],
      superUrl: ['']
    });
  }

  // Helper getter for easy access to form fields in the template
  get f() { return this.registerForm.controls; }

  onSubmit() {
    this.submitted = true;
    this.error = '';

    // Stop if the form is invalid
    if (this.registerForm.invalid) {
      return;
    }

    this.loading = true;

    // Normalize URL fields so links in the header open correctly even
    // if the user omitted the protocol (e.g., 'clalit.co.il')
    const payload = { ...this.registerForm.value } as any;
    const ensureProtocol = (u?: string) => {
      if (!u) return u;
      if (/^https?:\/\//i.test(u)) return u;
      return 'https://' + u;
    };
    payload.bankUrl = ensureProtocol(payload.bankUrl);
    payload.healthFundUrl = ensureProtocol(payload.healthFundUrl);
    payload.superUrl = ensureProtocol(payload.superUrl);

    this.authService.register(payload).subscribe({
      next: (response:any) => {
        // Handle successful registration (e.g., redirect to login or home)
        console.log('Registration successful', response);
        this.router.navigate(['/login']); 
      },
      error: (error:any) => {
        // Handle registration error
        this.error = error.message || 'Registration failed';
        this.loading = false;
      }
    });
  }
}