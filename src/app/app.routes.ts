import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { FamilyCalendar } from './features/weekly-calendar/family-calendar';
import { FamilyMembers } from './features/family-members/family-members';
import { DailyCalendar } from './features/daily-calendar/daily-calendar';
import { ShoppingListComponent } from './features/shopping-list/shopping-list';
import { FamilyEveningComponent } from './features/family-evening/family-evening';
import { ParentSettings } from './features/parent-settings/parent-settings';
import { HouseTasksTableComponent } from './features/house-tasks-table/house-tasks-table.component';
export const routes: Routes = [
  // Redirect the default path to the login page
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'daily-calendar', component: DailyCalendar },
  { path: 'family-calendar', component: FamilyCalendar },
  { path: 'family-members', component: FamilyMembers },
  {
    path: 'shopping-list',component: ShoppingListComponent,
  },
  {
    path: 'family-evening',component: FamilyEveningComponent,
  },
  {
    path: 'parent-settings', component: ParentSettings,
  },
  {
    path: 'house-tasks-table',
    component: HouseTasksTableComponent,
  }
 
];
