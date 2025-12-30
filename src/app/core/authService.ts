import { Injectable, PLATFORM_ID, Inject , signal, Signal} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { isPlatformBrowser } from '@angular/common'; // <-- Import this

// Define an interface for a single family member
export interface FamilyMember {
  id: number;
  memberName: string;
  userID: string;
}

export interface UserDetails {
  id: number;
  userName: string;
  email: string;
  firstName:string;
  lastName:string;
  token?: string; 

  familyMembers?: FamilyMember[]; 
  // Optional contact/info fields
  bankName?: string | null;
  bankUrl?: string | null;
  healthFundName?: string | null;
  healthFundUrl?: string | null;
  superName?: string | null;
  superUrl?: string | null;
}
export interface UserRegistrationPayload {
  userName: string;
  password: string;
  firstName: string;
  lastName: string;
  email:string
  members: string; 
}
@Injectable({
  providedIn: 'root',
})
export class AuthService {
    private loginUrl = 'http://localhost:3000/api/login';
    private registerUrl = 'http://localhost:3000/api/register'; 
    private isBrowser: boolean; 
    private _currentUser= signal<UserDetails | null>(null);
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

    /**
     * Refresh the current user from the server by id and update the stored signal/localStorage.
     */
    fetchUserById(userId: number | string) {
      if (!userId) throw new Error('userId is required');
      return this.http.get<UserDetails>(`http://localhost:3000/api/users/${userId}`).pipe(
        tap(user => {
          if (user) {
            if (this.isBrowser) { localStorage.setItem('currentUser', JSON.stringify(user)); }
            this._currentUser.set(user);
          }
        })
      );
    }
    

    public get currentUserValue(): UserDetails | null {
     
      return this.currentUser();
    }

    login(userName: string, password: string): Observable<any> {
      return this.http.post<any>(this.loginUrl, { userName, password }).pipe(
        tap(response => {
          console.log("res:",response);
          if (response && response.user) {
          
            // The response.user now includes 'familyMembers' which matches the updated interface
            const user: UserDetails = response.user;
            
            if (this.isBrowser) { 
              localStorage.setItem('currentUser', JSON.stringify(user));
            }
            this._currentUser.set(user); 
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
     register(userData: UserRegistrationPayload): Observable<any> {
        return this.http.post(this.registerUrl, userData);
    }
}