
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from './authService';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ShoppingListService {
    
  constructor(private http: HttpClient, private authService: AuthService) {}

  private getAuthHeaders() {
    const token = this.authService.getToken();
    console.log('ShoppingListService: getAuthHeaders token', token);
    if (!token) {
      console.error('ShoppingListService: NO TOKEN FOUND!');
    }
    return {
      headers: new HttpHeaders({ Authorization: token ? `Bearer ${token}` : '' })
    };
  }

  private apiUrl = `${environment.apiUrl}/shopping-list`;

  getShoppingList(familyId: string): Observable<string[]> {
    console.log('=== ShoppingListService.getShoppingList START ===');
    console.log('familyId:', familyId);
    console.log('apiUrl:', this.apiUrl);
    const headers = this.getAuthHeaders();
    console.log('Auth headers:', headers);
    
    return this.http.post<{ shoppingList: string[] }>(`${this.apiUrl}/get`, { familyId }, headers).pipe(
      map(res => {
        console.log('Response from server:', res);
        console.log('Shopping list array:', res.shoppingList);
        return res.shoppingList;
      })
    );
  }

  updateShoppingList(familyId: string, shoppingList: string[]): Observable<any> {
    return this.http.put(`${this.apiUrl}`, { familyId, shoppingList }, this.getAuthHeaders());
  }

  addProduct(familyId: string, product: string): Observable<string[]> {
    return this.http.post<{ shoppingList: string[] }>(`${this.apiUrl}`, { familyId, product }, this.getAuthHeaders()).pipe(
      map(res => res.shoppingList)
    );
  }
}
