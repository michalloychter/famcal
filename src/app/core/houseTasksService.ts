import { Injectable, signal, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

import { AuthService } from './authService';

export interface HouseTask {
  id?: string;
  familyId: string;
  memberName: string;
  day: string;
  title: string;
  details: string;
  color: string;
  done?: boolean;
}

@Injectable({ providedIn: 'root' })

export class HouseTasksService {
  private apiUrl = `${environment.apiUrl}/house-tasks`;
  private _tasks = signal<HouseTask[]>([]);
  tasks = this._tasks.asReadonly();

  private http = inject(HttpClient);
  private auth = inject(AuthService);

  private getAuthHeaders(): HttpHeaders {
    const token = this.auth.getToken();
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }


  fetchTasks(familyId: string): Observable<HouseTask[]> {
    console.log(familyId,"familyId");
    
    return this.http.post<HouseTask[]>(`${this.apiUrl}/family`, { familyId }, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Loads all house tasks for a family and updates the signal. Call this after user sign-in.
   */
  loadTasksForFamily(familyId: string) {
    this.fetchTasks(familyId).subscribe(tasks => {
      this._tasks.set(tasks);
    });
  }

  createTask(task: HouseTask): Observable<HouseTask> {
    return this.http.post<HouseTask>(this.apiUrl, task, {
      headers: this.getAuthHeaders()
    });
  }

  updateTask(id: string, updates: Partial<HouseTask>): Observable<HouseTask> {
    return this.http.put<HouseTask>(`${this.apiUrl}/${id}`, updates, {
      headers: this.getAuthHeaders()
    });
  }

  deleteTask(id: string): Observable<{ id: string }> {
    return this.http.delete<{ id: string }>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }
}
