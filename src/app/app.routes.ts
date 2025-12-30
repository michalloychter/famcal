

import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { FamilyCalendar } from './features/weekly-calendar/family-calendar';
// Import your RegisterComponent after you create it
 import { FamilyMembers} from './features/family-members/family-members';
 import { DailyCalendar } from './features/daily-calendar/daily-calendar';

export const routes: Routes = [
  // Redirect the default path to the login page
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'daily-calendar', component: DailyCalendar   },
  { path: 'family-calendar', component: FamilyCalendar },
  { path: 'family-members', component: FamilyMembers },
  
];
