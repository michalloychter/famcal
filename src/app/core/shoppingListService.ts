
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from './authService';

@Injectable({ providedIn: 'root' })
export class ShoppingListService {
    
  constructor(private http: HttpClient, private authService: AuthService) {}

  private getAuthHeaders() {
    const token = this.authService.getToken();
    console.log('ShoppingListService: getAuthHeaders token', token);
    return {
      headers: new HttpHeaders({ Authorization: token ? `Bearer ${token}` : '' })
    };
  }

  private apiUrl = 'http://localhost:3000/api/shopping-list';

  getShoppingList(familyId: string): Observable<string[]> {
    console.log('ShoppingListService: getShoppingList called with familyId:', familyId);
    return this.http.post<{ shoppingList: string[] }>(`${this.apiUrl}/get`, { familyId }, this.getAuthHeaders()).pipe(
      map(res => res.shoppingList)
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
