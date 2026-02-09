import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export interface FamilyEvening {
  id: string;
  familyId: string;
  date: string;
  title: string;
  tasks: { memberName: string; task: string }[];
}

@Injectable({ providedIn: 'root' })
export class FamilyEveningService {
  private apiUrl = `${environment.apiUrl}/family-evenings`;
  private _evenings = signal<FamilyEvening[]>([]);
  evenings = this._evenings.asReadonly();

  constructor(private http: HttpClient) {}

  fetchEvenings(familyId: string): Observable<FamilyEvening[]> {
    return this.http.post<FamilyEvening[]>(`${this.apiUrl}/by-family`, { familyId });
  }

  createEvening(payload: Omit<FamilyEvening, 'id'>) {
    return this.http.post<{ id: string }>(this.apiUrl, payload);
  }

  addTaskToEvening(eveningId: string, memberName: string, task: string, familyId: string) {
    return this.http.post(`${this.apiUrl}/${eveningId}/task`, { memberName, task, familyId });
  }

  deleteEvening(eveningId: string) {
    return this.http.delete(`${this.apiUrl}/${eveningId}`);
  }
}
