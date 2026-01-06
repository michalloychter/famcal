import { Component, OnInit, Pipe, PipeTransform , signal, computed} from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { FriendlyDateTimePipe } from '../../shared/friendly-date-time.pipe';
import {MatButtonModule} from '@angular/material/button';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms'; 
import { MatDialog } from '@angular/material/dialog';
import { AuthService, FamilyMember } from '../../core/authService';
import { HttpClient } from '@angular/common/http';
import { TasksService, Task, NewTaskPayload as OrigNewTaskPayload } from '../../core/tasksService'; 
// Extend NewTaskPayload to allow 'type' for UI payload
type NewTaskPayload = OrigNewTaskPayload & { type?: string };
import { ConfirmationDialogComponent } from '../../shared/confirmation-dialog/confirmation-dialog';
import { convertAnyDateToJSDate } from '../../shared/convertTimestamp';
import { log } from 'console';
//import {FirebaseDatePipe} from '../../shared/pipes/firebase-date.pipe';


@Component({
  selector: 'app-family-members',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FriendlyDateTimePipe], 
  templateUrl: './family-members.html',
  styleUrl: './family-members.css',
})
export class FamilyMembers implements OnInit {
  selectedTaskType: string | null = null;
  selectedMember = signal<FamilyMember | null>(null);
  selectedMemberTasks: any;
  public readonly currentUserId = computed(() => {
    return this.authService?.currentUser()?.id;
  });
  // Computed property: true if current user is main user (not a member)
  // Computed property: true if current user is main user (not a member)
  public readonly isMainUser = computed(() => {
    const user = this.authService.currentUser();
    // Heuristic: if user has a familyMembers array, treat as main user; if not, treat as member
    return !!user && Array.isArray(user.familyMembers);
  });
  public readonly familyMembers = signal<FamilyMember[]>([]);
  isFormVisible: boolean = false;
  newTaskForm: FormGroup;

  // --- Add Member Form ---
  showAddMemberForm: boolean = false;
  addMemberForm: FormGroup;

  constructor(
    private authService: AuthService,
    private tasksService: TasksService,
    private fb: FormBuilder ,
    private dialog: MatDialog,
    private http: HttpClient
  ) {
    // Fetch all members with the same familyName
    const familyName = this.authService.currentUser()?.familyName;
    if (familyName) {
      this.http.get<FamilyMember[]>(`http://localhost:3000/api/members?familyName=${encodeURIComponent(familyName)}`)
        .subscribe(members => this.familyMembers.set(members));
    }
    // Initialize the form group with validators
    this.newTaskForm = this.fb.group({
      title: ['', Validators.required],
      details: [''],
      date: ['', Validators.required],
      reminderDateTime: ['', Validators.required],
      end: [''],
      type: ['']
    });

    // Add Member Form
    this.addMemberForm = this.fb.group({
      memberName: ['', Validators.required],
      isUser: [false]
    });

    // Use a signal to store tasks for the selected member
    this.selectedMemberTasks = signal<Task[]>([]);
  }
  // Add Member logic
  submitAddMember(): void {
    if (this.addMemberForm.invalid) return;
    const { memberName, isUser } = this.addMemberForm.value;
    this.tasksService.addMember({ name: memberName, isUser }).subscribe({
      next: () => {
        this.addMemberForm.reset();
        this.showAddMemberForm = false;
        // Refresh members list
        this.tasksService.fetchFamilyMembers().subscribe();
      },
      error: (err) => {
        alert('Failed to add member: ' + (err?.error?.error || err.message || err));
      }
    });
  }

  ngOnInit(): void {
  // Load family members from backend
  this.tasksService.fetchFamilyMembers().subscribe();
  // No need to load all tasks at once; tasks are loaded per member
  }

  // A helper method to reload tasks after an addition
  loadTasks(): void {
  // No-op: tasks are loaded per member
  }

  selectMember(member: FamilyMember): void {
    this.selectedMember.set(member);
    this.isFormVisible = false;
    if (member && member.email) {
      this.tasksService.getTasksByEmail(member.email).subscribe(tasks => {
        this.selectedMemberTasks.set(tasks);
      });
    } else {
      this.selectedMemberTasks.set([]);
    }
  }
  

  // --- New Methods for Form Visibility and Submission ---

  toggleFormVisibility(): void {
    this.isFormVisible = !this.isFormVisible;
    if (!this.isFormVisible) {
      this.newTaskForm.reset();
      this.selectedTaskType = null;
    }
  }

  openTaskForm(type: string): void {
  this.selectedTaskType = type;
  this.isFormVisible = true;
  this.newTaskForm.reset();
  // Set both type and title to the selected type
  this.newTaskForm.patchValue({ type: type, title: type });
  }

  deleteTask(taskId: string): void {
    // Open the confirmation dialog
    console.log("taskid",taskId);
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '300px', // Optional width
    });
    // Subscribe to the result when the dialog closes
    dialogRef.afterClosed().subscribe((result: any) => {
      // 'result' is 'true' if the user confirmed the deletion
      if (result === true) {
        // Optimistically remove the task from the selectedMemberTasks signal
        const prevTasks = this.selectedMemberTasks();
        this.selectedMemberTasks.update((tasks: Task[]) => tasks.filter((t: Task) => t.id !== taskId));
        this.tasksService.deleteTask(taskId).subscribe({
          next: () => {
            console.log(`Task ${taskId} deleted successfully.`);
            // No need to reload tasks, already removed optimistically
          },
          error: (err) => {
            console.error('Error deleting task:', err);
            alert('Failed to delete task.');
            // Rollback if error
            this.selectedMemberTasks.set(prevTasks);
          }
        });
      }
    });
  }

  submitNewTask(): void {
  console.log("sub", this.currentUserId());
  const formValue = this.newTaskForm.value;
  console.log('submitNewTask: formValue.type =', formValue.type, 'selectedTaskType =', this.selectedTaskType);
    // Validate form and auth
    if (this.newTaskForm.invalid || !this.selectedMember() || !this.currentUserId()) {
      console.log("invalid or unauthenticated");
      if (!this.currentUserId()) {
        alert('You must be logged in to add a task.');
      }
      return;
    }

    const userIdValue = this.currentUserId();
    const selectedMemberValue = this.selectedMember();
    const newTaskPayload: NewTaskPayload = {
      title: formValue.title,
      details: formValue.details,
      date: convertAnyDateToJSDate(formValue.date),
      reminderDateTime: formValue.reminderDateTime ? convertAnyDateToJSDate(formValue.reminderDateTime) : undefined,
      end: formValue.end ? convertAnyDateToJSDate(formValue.end) : undefined,
      familyName: this.authService.currentUser()?.familyName || '',
      memberName: selectedMemberValue ? String(selectedMemberValue.name) : '',
      email: selectedMemberValue ? String(selectedMemberValue.email) : '',
      type: formValue.type || this.selectedTaskType || ''
    };

    // Optimistically update the selectedMemberTasks signal
    const tempId = (typeof crypto !== 'undefined' && 'randomUUID' in crypto) ? (crypto as any).randomUUID() : `temp-${Date.now()}-${Math.floor(Math.random()*10000)}`;
    const optimisticTask: Task = {
      ...newTaskPayload,
      id: tempId,
      _optimistic: true
    } as Task;
  this.selectedMemberTasks.update((tasks: Task[]) => [...tasks, optimisticTask]);

    // Actually submit the task to the backend
    this.tasksService.addTask(newTaskPayload).subscribe({
      next: (response) => {
        // Replace the optimistic task with the real one
  this.selectedMemberTasks.update((tasks: Task[]) => tasks.map((t: Task) => t.id === tempId ? response : t));
        this.toggleFormVisibility(); // Hide form on success
      },
      error: (err) => {
        // Remove the optimistic task if error
  this.selectedMemberTasks.update((tasks: Task[]) => tasks.filter((t: Task) => t.id !== tempId));
        console.error('Error adding task:', err);
        alert('Failed to add task.');
      }
    });
  }
  // Helper to normalize task type for CSS class
  public mapTaskType(type: string | undefined | null): string {
    if (!type) return 'other';
    const t = type.trim().toLowerCase();
    // Uncomment for debugging:
    // console.log('mapTaskType:', t);
    if (t === 'meet' || t === 'meeting') return 'meeting';
    if (t === 'class') return 'class';
    if (t === 'shopping' || t === 'shop') return 'shopping';
    if (t === 'birthday' || t === 'bday') return 'birthday';
    if (t === 'doctor' || t === 'see a doctor') return 'doctor';
    if (t === 'other') return 'other';
    return 'other';
  }
}