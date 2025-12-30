import { Injectable , model, signal} from '@angular/core';
import { HttpClient , HttpParams} from '@angular/common/http';
import { Observable, tap, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService, FamilyMember } from './authService';
import {convertAnyDateToJSDate} from '.././shared/convertTimestamp'


export interface Task {
  id: string; 
  title: string;
  // date (start time) can be a string, Date object (on client), or timestamp object (from API)
  date: Date | undefined; 
  details: string; 
  userID: string; 
  memberName: string;
  // Add an optional 'end' property for calendar scheduling
  end?:Date | undefined; 
  // Optional flag used for optimistic UI updates
  _optimistic?: boolean;
}

// Interface for creating a new task, where 'id' might be optional before saving
export type NewTaskPayload = Omit<Task, 'id'>;


@Injectable({
  providedIn: 'root'
})
export class TasksService {
  // Assume backend API follows standard REST practices
  private apiUrl = 'http://localhost:3000/api/tasks';
  private _allTasks = signal<Task[]>([]);
  allTasks = this._allTasks.asReadonly();
 
  private _familyMembers=signal<FamilyMember[]>([]);
  familyMembers=this._familyMembers.asReadonly();
  
  constructor(private authService: AuthService ,private http: HttpClient) {
    // If a user was already stored (e.g., from localStorage) when the service is created,
    // pre-load tasks so UI shows data immediately.
    const userId = this.authService.currentUser()?.id;
    if (userId) {
      this.getTasks().subscribe({ next: () => {}, error: () => {} });
    }
  }

  /**
   * Retrieves all tasks from the API.
   */
   getTasks(): Observable<Task[]> { // Removed the 'userId?: string' parameter
    const userId = this.authService.currentUser()?.id; // Get the ID from the signal
  if (!userId) {
    // No user logged in: ensure internal signal is empty and return empty observable.
    this._allTasks.set([]);
    return of([] as Task[]);
  }

    let params = new HttpParams().set('userId', String(userId));
    
    // The request now automatically uses the ID from the Auth Service
    return this.http.get<Task[]>(this.apiUrl, { params: params }).pipe(
        tap(tasks => this._allTasks.set(tasks))
    );
  }
  /**
   * Adds a new task to the backend.
   * @param taskData The data for the new task (excluding the ID).
   */
  addTask(taskData: NewTaskPayload): Observable<Task> {
  console.log("addtask",taskData);

    // The backend should handle converting these to the correct database format (e.g., Firebase Timestamp).
    // We'll do an optimistic update: insert a temporary task locally, replace on success, remove on error.
  // Use a UUID for the temporary optimistic id when available
  const tempId = (typeof crypto !== 'undefined' && 'randomUUID' in crypto) ? (crypto as any).randomUUID() : `temp-${Date.now()}-${Math.floor(Math.random()*10000)}`;
    const optimisticTask: Task = {
      id: tempId,
      title: taskData.title,
      details: taskData.details,
      date: taskData.date as Date | undefined,
      end: taskData.end as Date | undefined,
      userID: taskData.userID,
      memberName: taskData.memberName
      , _optimistic: true
    };

    // Add immediately to local signal
    this._allTasks.update(tasks => [...tasks, optimisticTask]);

    return this.http.post<Task>(this.apiUrl, taskData).pipe(
      tap((createdTask) => {
        // Replace temp with real task
        this._allTasks.update(tasks => tasks.map(t => t.id === tempId ? createdTask : t));
      }),
      catchError(err => {
        // Roll back optimistic addition
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
    console.log("update", updatedData,id);
    
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
    // The response type might vary (e.g., status 200, no body). Use 'void' for simplicity here.
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}