import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getImprovementSuggestion(question: string): Observable<{ suggestions: { title: string; details: string }[] }> {
    return this.http.post<{ suggestions: { title: string; details: string }[] }>(`${this.apiUrl}/ai-improvement-suggestion`, { question });
  }

  getFamilyEveningTasks(idea: string, date: string): Observable<{ tasks: any[] }> {
    return this.http.post<{ tasks: any[] }>(`${this.apiUrl}/ai-family-evening-tasks`, { idea, date });
  }

  getClothingSuggestion(temp: number, description: string, city: string): Observable<{ advice: string }> {
    return this.http.post<{ advice: string }>(`${this.apiUrl}/ai-clothing-suggestion`, { temp, description, city });
  }
}
