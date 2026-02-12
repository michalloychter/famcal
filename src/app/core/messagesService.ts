import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './authService';
import { environment } from '../../environments/environment';

export interface FamMessage {
  id?: string;
  memberName: string;
  familyId: string;
  date: string;
  text: string;
}

@Injectable({ providedIn: 'root' })
export class MessagesService {
  private apiUrl = `${environment.apiUrl}/messages`;

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }

  getMessages(familyId: string): Observable<FamMessage[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<FamMessage[]>(`${this.apiUrl}?familyId=${familyId}`, { headers });
  }

  sendMessage(msg: Omit<FamMessage, 'id'>): Observable<FamMessage> {
    const headers = this.getAuthHeaders();
    return this.http.post<FamMessage>(this.apiUrl, msg, { headers });
  }
}
