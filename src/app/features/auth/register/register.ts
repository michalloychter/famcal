

import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, FormControl, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/authService';
import { Router, RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';



@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {
  onAddMember() {
    // Placeholder for add member action
    alert('Add Member functionality coming soon!');
  }


  // Helper to format phone numbers with country code and remove leading zero
  error = signal<string>('');
  missingFields = signal<string[] | null>(null);
  formatPhoneNumber(phone: string, country: string): string {
    // Accepts either country code (e.g. 'IL') or option string (e.g. 'Israel (+972)')
    if (!phone) return '';
    let formatted = phone.trim();
    if (formatted.startsWith('0')) {
      formatted = formatted.substring(1);
    }
    let code = '';
    // Try to extract code from country string if it looks like an option
    const match = country && country.match && country.match(/\((\+\d+)\)/);
    if (match) {
      code = match[1];
      console.log("Extracted country code:", code);
      
    } else {
      // fallback to old logic
      const countryCodes: { [key: string]: string } = {
        IL: '+972', US: '+1', GB: '+44', FR: '+33', DE: '+49', IN: '+91', BR: '+55', RU: '+7', CN: '+86', JP: '+81', NP: '+977'
      };
      code = countryCodes[country] || '';
    }
    // Only add code if number is 9 digits and code exists
    if (/^\d{9}$/.test(formatted) && code) {
      console.log("Formatting phone number with code:", code, formatted);
      
      return code + formatted;
    }
    // Otherwise, return as is (already formatted or invalid)
    return formatted;
  }
  registerForm: FormGroup;
  loading = false;
  submitted = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      familyName: ['', Validators.required],
      members: this.fb.array([
        this.createMemberGroup()
      ])
    });
  }

  get members(): FormArray {
    return this.registerForm.get('members') as FormArray;
  }

  createMemberGroup(): FormGroup {
    return this.fb.group({
      memberName: ['', Validators.required],
      username: ['', Validators.required],
      email: [''],
      country: [''],
      whatsappNumber: ['', [Validators.required, Validators.pattern('^0?\\d{8,14}$')]],
      color: ['#1976d2'],
      isParent: [false]
    });
  }


  // Removed duplicate/erroneous code after constructor


  static passwordsMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { mismatch: true };
  }



  // Helper to get members FormArray
  addMember() {
    this.members.push(this.createMemberGroup());
  }


  removeMember(index: number) {
    if (this.members.length > 1) {
      this.members.removeAt(index);
    }
  }

  editMember(index: number) {
    // Placeholder for edit member functionality (e.g., open a modal or inline edit)
    // For now, just log the member to be edited
    console.log('Edit member at index', index, this.members.at(index).value);
  }

  // Helper getter for easy access to form fields in the template
  get f() { return this.registerForm.controls; }
  get memberControls() {
    return (this.registerForm.get('members') as FormArray).controls;
  }


  onSubmit() {
    this.submitted = true;
    this.error.set('');
    const missing: string[] = [];
    if (this.registerForm.invalid) {
      missing.push('familyName');
    }
  const firstMember = this.members.at(0).value;
  if (!firstMember.memberName) missing.push('first member name');
  if (!firstMember.username) missing.push('first member username');
  if (!firstMember.email) missing.push('first member email');
  if (!firstMember.whatsappNumber) missing.push('first member whatsappNumber');
    if (missing.length > 0) {
      this.missingFields.set(missing);
      this.error.set('Please fill all required fields');
      return;
    }
    this.loading = true;
    const payload = {
      familyName: this.registerForm.value.familyName,
      members: this.members.value.map((m: any) => ({
        name: m.memberName,
        username: m.username,
        email: m.email,
        country: m.country,
        whatsappNumber: this.formatPhoneNumber(m.whatsappNumber, m.country),
        color: m.color,
        isParent: m.isParent || false
      }))
    };
    this.missingFields.set(null);
    const registerObservable = this.authService.register(payload);
    registerObservable.subscribe({
      next: (response: any) => {
        this.router.navigate(['/login']);
      },
      error: (error: any) => {
        let msg = 'Registration failed';
        if (error) {
          if (error.error && typeof error.error === 'object') {
            msg = error.error.error || msg;
          } else if (error.error && typeof error.error === 'string') {
            msg = error.error;
          } else if (typeof error.message === 'string' && error.message) {
            msg = error.message;
          } else if (error.statusText) {
            msg = error.statusText;
          }
        }
        this.error.set(msg);
        if (
          error &&
          error.error &&
          typeof error.error === 'object' &&
          Array.isArray(error.error.missing)
        ) {
          this.missingFields.set(error.error.missing);
        } else {
          this.missingFields.set(null);
        }
        this.loading = false;
      }
    });
  }
}