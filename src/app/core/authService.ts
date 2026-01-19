// Removed: now imported from family.ts
import { Injectable, PLATFORM_ID, Inject , signal, Signal} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { FamilyMember, familyDetails, FamilyRegistrationPayload } from '../shared/models/family';
export type { FamilyMember } from '../shared/models/family';
export type { familyDetails } from '../shared/models/family';
import { isPlatformBrowser } from '@angular/common'; // <-- Import this
import { environment } from '../../environments/environment';

// FamilyMember and familyDetails now imported from family.ts
// MemberRegistration and UserRegistrationPayload removed; use FamilyRegistrationPayload from family.ts
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // Token management
  setToken(token: string) {
    if (this.isBrowser) {
      localStorage.setItem('token', token);
      console.log('AuthService: setToken', token);
    }
  }

  getToken(): string | null {
    if (this.isBrowser) {
      const token = localStorage.getItem('token');
      console.log('AuthService: getToken', token);
      return token;
    }
    return null;
  }

  removeToken() {
    if (this.isBrowser) {
      localStorage.removeItem('token');
    }
  }
    private loginUrl = `${environment.apiUrl}/login`;
    private registerUrl = `${environment.apiUrl}/register`; 
    private isBrowser: boolean; 
  private _currentUser= signal<familyDetails | null>(null);
  currentUser=this._currentUser.asReadonly()

    constructor(
      private http: HttpClient,
      @Inject(PLATFORM_ID) platformId: Object 
    ) {
      this.isBrowser = isPlatformBrowser(platformId);
      let storedUser = null;
      if (this.isBrowser) { 
        const userString = localStorage.getItem('currentUser');
        storedUser = userString ? JSON.parse(userString) : null;
      }
      this._currentUser.set(storedUser);
    }

    // User login: for a member with isUser=true (by email and username)
    loginWithEmail(email: string, username: string): Observable<any> {
  return this.http.post<any>(this.loginUrl, { email, username }).pipe(
    tap(response => {
      if (response && response.user) {
        // Store member name and username in currentUser for greeting
        const memberUser = {
          ...response.user,
          name: response.user.name || '',
          username: response.user.username || '',
        };
        if (this.isBrowser) {
          localStorage.setItem('currentUser', JSON.stringify(memberUser));
        }
        this._currentUser.set(memberUser);
        if (response.token) {
          this.setToken(response.token);
        }
      }
    })
  );
    }

    // Admin login: for the main user (not a member) by username and password
    loginAsAdmin(password: string, userName: string): Observable<any> {
      return this.http.post<any>(this.loginUrl, { password, userName }).pipe(
        tap(response => {
          if (response && response.user) {
            const family: familyDetails = response.user;
            if (this.isBrowser) {
              localStorage.setItem('currentUser', JSON.stringify(family));
            }
            this._currentUser.set(family);
            if (response.token) {
              this.setToken(response.token);
            }
          }
        })
      );
    }

    /**
     * Refresh the current user from the server by id and update the stored signal/localStorage.
     */
    fetchFamilyById(familyId: number | string) {
      if (!familyId) throw new Error('familyId is required');
      return this.http.get<familyDetails>(`${environment.apiUrl}/families/${familyId}`).pipe(
        tap(family => {
          if (family) {
            if (this.isBrowser) { localStorage.setItem('currentUser', JSON.stringify(family)); }
            this._currentUser.set(family);
          }
        })
      );
    }
    

    public get currentFamilyValue(): familyDetails | null {
      return this.currentUser();
    }

    login(familyName: string, password: string): Observable<any> {
      return this.http.post<any>(this.loginUrl, { familyName, password }).pipe(
        tap(response => {
          console.log("res:",response);
          if (response && response.user) {
            const family: familyDetails = response.user;
            if (this.isBrowser) { 
              localStorage.setItem('currentUser', JSON.stringify(family));
            }
            this._currentUser.set(family); 
            if (response.token) {
              this.setToken(response.token);
            }
          }
        })
      );
    }

    logout() {
      if (this.isBrowser) { 
        localStorage.removeItem('currentUser');
      }
      this._currentUser.set(null); 
    }
   register(familyData: FamilyRegistrationPayload): Observable<any> {
    return this.http.post(this.registerUrl, familyData);
  }
}