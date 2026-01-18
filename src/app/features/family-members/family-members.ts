// import { Confetti } from '../family-evening/confetti';
import { FamilyEveningComponent } from '../family-evening/family-evening';
import { WeeklyImprovementComponent } from '../weekly-improvement/weekly-improvement';
import { Component, OnInit, Pipe, PipeTransform , signal, computed} from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { FriendlyDateTimePipe } from '../../shared/friendly-date-time.pipe';
import {HttpClient} from '@angular/common/http';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms'; 
import { MatDialog } from '@angular/material/dialog';
import { AuthService, FamilyMember } from '../../core/authService'; 
import { TasksService, Task, NewTaskPayload } from '../../core/tasksService'; 
import { ConfirmationDialogComponent } from '../../shared/confirmation-dialog/confirmation-dialog';
import { RequiredErrorMessageComponent } from '../../shared/required-error-message.component';
import { convertAnyDateToJSDate } from '../../shared/convertTimestamp';

//import {FirebaseDatePipe} from '../../shared/pipes/firebase-date.pipe';


@Component({
  selector: 'app-family-members',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FriendlyDateTimePipe, WeeklyImprovementComponent, RequiredErrorMessageComponent, FamilyEveningComponent], 
  templateUrl: './family-members.html',
  styleUrl: './family-members.css',
})
export class FamilyMembers implements OnInit {
  showFamilyEvening = false;


  // Color palette for member borders
  private memberColors = [
    '#1976d2', '#388e3c', '#fbc02d', '#e040fb', '#0097a7', '#757575', '#ff7043', '#8d6e63', '#43a047', '#c62828'
  ];
  // Assign a color to each member by name (deterministic)
  getMemberColor(memberName: string): string {
    if (!memberName) return '#bbb';
    let hash = 0;
    for (let i = 0; i < memberName.length; i++) {
      hash = memberName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % this.memberColors.length;
    return this.memberColors[idx];
  }

  /**
   * Handler for AI improvement suggestion to prefill the add task form.
   * Opens the form with type 'improve' and prefilled details.
   */
  onSuggestAsTask(event: { type?: string, details: string }): void {
    this.selectedTaskType = event.type ?? null;
    this.isFormVisible = true;
    this.newTaskForm.reset({
      title: '',
      details: event.details,
      date: '',
      reminderDateTime: '',
      end: '',
      type: event.type ?? '',
      weekday: '',
      time: ''
    });
  }
  selectedTaskType: string | null = null;
  activeMemberTab: 'add' | 'all' = 'all';
  selectedMember = signal<FamilyMember | null>(null);
  selectedMemberTasks = signal<Task[]>([]);
  public readonly currentUserId = computed(() => {
    return this.authService?.currentUser()?.id;
  });

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
        .subscribe((members: FamilyMember[]) => this.familyMembers.set(members));
    }
    // Initialize the form group with validators (only once)
    this.newTaskForm = this.fb.group({
      title: ['', Validators.required],
      details: [''],
      date: [''],
      reminderDateTime: [''],
      end: [''],
      type: [''],
      weekday: [''],
      time: ['']
    });


    // Add Member Form
    this.addMemberForm = this.fb.group({
      memberName: ['', Validators.required],
      isUser: [false]
    });

  // Use a signal to store tasks for the selected member
  }


  showAddTaskModal = false;

  openAddTaskModal() {
    this.showAddTaskModal = true;
  }

  closeAddTaskModal() {
    this.showAddTaskModal = false;
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
    this.tasksService.fetchFamilyMembers().subscribe({
      next: (members: FamilyMember[]) => {
        this.familyMembers.set(members);
        // Do not auto-select any member; wait for user click
      }
    });
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
  



  toggleFormVisibility(): void {
    this.isFormVisible = !this.isFormVisible;
    if (!this.isFormVisible) {
      this.newTaskForm.reset({
        title: '',
        details: '',
        date: '',
        reminderDateTime: '',
        end: '',
        type: '',
        weekday: '',
        time: ''
      });
      this.selectedTaskType = null;
    }
  }

  openTaskForm(type: string): void {
  this.selectedTaskType = type;
  this.isFormVisible = true;
  this.newTaskForm.reset({
    title: type,
    details: '',
    date: '',
    reminderDateTime: '',
    end: '',
    type: type,
    weekday: '',
    time: ''
  });
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

  submitted = false;
  submitNewTask(): void {
    this.submitted = true;
    const formValue = this.newTaskForm.value;
    if (this.newTaskForm.invalid || !this.selectedMember() || !this.currentUserId()) {
      if (!this.currentUserId()) {
        alert('You must be logged in to add a task.');
      }
      return;
    }

    const userIdValue = this.currentUserId();
    const selectedMemberValue = this.selectedMember();
    let newTaskPayload: NewTaskPayload & { weekday?: number; time?: string; type?: string };
    if (formValue.type === 'class') {
      newTaskPayload = {
        title: formValue.title,
        details: formValue.details,
        date: undefined, // required by type, but not used for class
        familyName: this.authService.currentUser()?.familyName || '',
        memberName: selectedMemberValue ? String(selectedMemberValue.name) : '',
        email: selectedMemberValue ? String(selectedMemberValue.email) : '',
        type: 'class',
        weekday: formValue.weekday,
        time: formValue.time
      };
    } else {
      newTaskPayload = {
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
    }

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
        this.submitted = false;
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