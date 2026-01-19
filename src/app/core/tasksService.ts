import { Injectable , model, signal} from '@angular/core';
import { HttpClient , HttpParams} from '@angular/common/http';
import { Observable, tap, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService, FamilyMember } from './authService';
import { environment } from '../../environments/environment';


export interface Task {
  id: string; 
  title: string;
  // date (start time) can be a string, Date object (on client), or timestamp object (from API)
  date: Date | undefined; 
  details: string; 
  familyName: string; // Use familyName instead of familyID
  memberName: string;
  email: string; // Add email for member-task association
  // Add an optional 'end' property for calendar scheduling
  end?:Date | undefined; 
  // New: reminder date/time (Date or string)
  reminderDateTime?: Date | string;
  // Optional flag used for optimistic UI updates
  _optimistic?: boolean;
  type?: string; // Add type for class/meeting/etc.
  weekday?: number; // 0 (Sunday) - 6 (Saturday)
  time?: string;    // 'HH:mm'
}

// Interface for creating a new task, where 'id' might be optional before saving
export type NewTaskPayload = Omit<Task, 'id'>;

@Injectable({
  providedIn: 'root'
})
export class TasksService {
  // === Fields ===
  private apiUrl = `${environment.apiUrl}/tasks`;
  private _allTasks = signal<Task[]>([]);
  allTasks = this._allTasks.asReadonly();

  private _familyMembers = signal<FamilyMember[]>([]);
  familyMembers = this._familyMembers.asReadonly();

  // === Constructor ===
  constructor(private authService: AuthService, private http: HttpClient) {
    // If a user was already stored (e.g., from localStorage) when the service is created,
    // pre-load tasks so UI shows data immediately.
    const familyName = this.authService.currentUser()?.familyName;
    if (familyName) {
      this.getTasks().subscribe({ next: () => {}, error: () => {} });
    }
  }

    /**
     * Calls the AI service to get family evening tasks (for suggestions)
     */
    getFamilyEveningTasks(idea: string, date: string): Observable<{ tasks: any[] }> {
      return this.http.post<{ tasks: any[] }>(`${environment.apiUrl}/ai-family-evening-tasks`, { idea, date });
    }

  // === Getters ===
  /**
   * Expose current family name for filtering in components
   */
  public get currentFamilyName(): string | undefined {
    return this.authService.currentUser()?.familyName;
  }

  // === Family Members ===
  /**
   * Fetches family members for the current user from the backend and updates the signal.
   */
  fetchFamilyMembers(): Observable<FamilyMember[]> {
    const family = this.authService.currentUser();
    const familyName = family?.familyName;
    if (!familyName || !family) {
      this._familyMembers.set([]);
      return of([]);
    }
    const url = `${environment.apiUrl}/members?familyName=${encodeURIComponent(familyName)}`;
    return this.http.get<FamilyMember[]>(url).pipe(
      tap(members => {
        // Add the main user as a member at the start of the array
        const userAsMember: FamilyMember = {
          id: family.id,
          name: family.familyName,
          username: '', // No username at family level
          email: '',    // No email at family level
          familyName: family.familyName,
          whatsappNumber: '', // Not present on familyDetails
        };
        this._familyMembers.set([userAsMember, ...members]);
      }),
      catchError(err => {
        this._familyMembers.set([]);
        return of([]);
      })
    );
  }

  /**
   * Adds a new family member for the current user.
   */
  addMember(member: { name: string; isUser: boolean; whatsappNumber?: string }): Observable<any> {
    const family = this.authService.currentUser();
    if (!family) return throwError(() => new Error('No current family'));
    const payload = {
      name: member.name,
      isUser: member.isUser,
      whatsappNumber: member.whatsappNumber || '',
      familyName: family.familyName
    };
    return this.http.post(`${environment.apiUrl}/members`, payload).pipe(
      tap(() => {
        // Optionally, refresh the family members list after adding
        this.fetchFamilyMembers().subscribe();
      })
    );
  }

  // === Tasks ===
  /**
   * Fetches tasks for a specific member by email.
   */
  getTasksByEmail(email: string): Observable<Task[]> {
    if (!email) return of([]);
    const params = new HttpParams().set('email', email);
    return this.http.get<Task[]>(this.apiUrl, { params });
  }

  /**
   * Retrieves all tasks from the API for the current family.
   */
  getTasks(): Observable<Task[]> {
    const familyId = this.authService.currentUser()?.id;
    if (!familyId) {
      this._allTasks.set([]);
      return of([] as Task[]);
    }
    let params = new HttpParams().set('familyId', familyId);
    return this.http.get<Task[]>(this.apiUrl, { params: params }).pipe(
      tap(tasks => this._allTasks.set(tasks))
    );
  }

  /**
   * Fetches all tasks for a given family by familyID.
   */
  getTasksByFamilyId(familyID: string): Observable<Task[]> {
    if (!familyID) return of([]);
    const params = new HttpParams().set('familyId', familyID);
    return this.http.get<Task[]>(this.apiUrl, { params });
  }

  /**
   * Adds a new task to the backend.
   * @param taskData The data for the new task (excluding the ID).
   */
  addTask(taskData: NewTaskPayload & { email?: string }): Observable<Task> {
    console.log("addtask", taskData);
    // Optimistic update: add a temporary task to the signal immediately
    const familyId = String(this.authService.currentUser()?.id || '');
    const tempId = (typeof crypto !== 'undefined' && 'randomUUID' in crypto) ? (crypto as any).randomUUID() : `temp-${Date.now()}-${Math.floor(Math.random()*10000)}`;
    const optimisticTask: Task = {
      id: tempId,
      title: taskData.title,
      details: taskData.details,
      date: taskData.date as Date | undefined,
      end: taskData.end as Date | undefined,
      familyName: taskData.familyName,
      memberName: taskData.memberName,
      email: taskData.email || '',
      _optimistic: true
    };
    this._allTasks.update(tasks => [...tasks, optimisticTask]);
    // Send to backend, include familyId
    return this.http.post<Task>(this.apiUrl, { ...taskData, familyName: taskData.familyName, email: taskData.email, familyId }).pipe(
      tap((createdTask) => {
        // Replace the optimistic task with the real one
        this._allTasks.update(tasks => tasks.map(t => t.id === tempId ? createdTask : t));
      }),
      catchError(err => {
        // Remove the optimistic task if error
        this._allTasks.update(tasks => tasks.filter(t => t.id !== tempId));
        return throwError(() => err);
      })
    );
  }

  /**
   * Updates an existing task.
   * @param id The ID of the task to update.
   * @param updatedData The partial or full task data to update.
   */
  updateTask(id: string, updatedData: Partial<NewTaskPayload>): Observable<Task> {
    console.log("update", updatedData, id);
    return this.http.put<Task>(`${this.apiUrl}/${id}`, updatedData).pipe(
      tap(() => {
        // Update the signal by filtering out the deleted task
        this._allTasks.update(tasks => tasks.filter(t => t.id !== id));
      })
    );
  }

  /**
   * Deletes a task from the backend.
   * @param id The ID of the task to delete.
   */
  deleteTask(id: string): Observable<void> {
    // Optimistic update: remove the task immediately from the signal
    const prevTasks = this._allTasks();
    this._allTasks.update(tasks => tasks.filter(t => t.id !== id));
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(err => {
        // Rollback if error
        this._allTasks.set(prevTasks);
        return throwError(() => err);
      })
    );
  }
}