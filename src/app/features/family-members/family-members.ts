// import { Confetti } from '../family-evening/confetti';
import { FamilyEveningComponent } from '../family-evening/family-evening';
import { WeeklyImprovementComponent } from '../weekly-improvement/weekly-improvement';
import { Component, OnInit, Pipe, PipeTransform , signal, computed} from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { FriendlyDateTimePipe } from '../../shared/friendly-date-time.pipe';
import {HttpClient} from '@angular/common/http';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms'; 
import { MatDialog } from '@angular/material/dialog';
import { environment } from '../../../environments/environment';
import { AuthService, FamilyMember } from '../../core/authService'; 
import { TasksService, Task, NewTaskPayload } from '../../core/tasksService'; 
import { ConfirmationDialogComponent } from '../../shared/confirmation-dialog/confirmation-dialog';
import { RequiredErrorMessageComponent } from '../../shared/required-error-message.component';
import { convertAnyDateToJSDate } from '../../shared/convertTimestamp';

//import {FirebaseDatePipe} from '../../shared/pipes/firebase-date.pipe';


@Component({
  selector: 'app-family-members',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FriendlyDateTimePipe, WeeklyImprovementComponent, RequiredErrorMessageComponent], 
  templateUrl: './family-members.html',
  styleUrl: './family-members.css',
})
export class FamilyMembers implements OnInit {
  // Called when user selects an AI card; saves it as a task for every day in the week
  selectAICard(card: { title: string; details: string; type?: string }): void {
    const member = this.selectedMember();
    if (!member) {
      alert('Select a member first.');
      return;
    }
    const familyName = this.authService.currentUser()?.familyName || '';
    const email = member.email;
    const memberName = member.name;
    // Save as a task for every day in the week (Sunday to Saturday)
    for (let weekday = 0; weekday < 7; weekday++) {
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      const taskDate = new Date(startOfWeek);
      taskDate.setDate(startOfWeek.getDate() + weekday);
      taskDate.setHours(9, 0, 0, 0); // Default time: 9:00 AM
      const payload = {
        title: card.title,
        details: card.details,
        date: taskDate,
        familyName,
        memberName,
        email,
        type: card.type || 'ai-suggestion',
        weekday,
        time: '09:00'
      };
      this.tasksService.addTask(payload).subscribe({
        next: () => {},
        error: (err) => {
          console.error('Failed to save AI task:', err);
        }
      });
    }
    // Optionally, clear cards and show success
    this.aiCards = [];
    alert('AI suggestion saved as daily tasks for this week!');
    this.cdr.detectChanges();
  }
  constructor(
    private authService: AuthService,
    private tasksService: TasksService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {
    // Fetch all members with the same familyName
    const familyName = this.authService.currentUser()?.familyName;
    if (familyName) {
      this.http.get<FamilyMember[]>(`${environment.apiUrl}/members?familyName=${encodeURIComponent(familyName)}`)
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
  }

  showAISuggestions(): void {
    Promise.resolve().then(() => {
      this.hideAISuggestions = false;
      this.cdr.detectChanges();
    });
  }
  setAISuggestions(suggestions: any[]): void {
    this.aiSuggestions = suggestions;
    Promise.resolve().then(() => {
      this.hideAISuggestions = false;
      this.cdr.detectChanges();
    });
  }
  hideAISuggestions: boolean = false;
  // Store AI suggestions for the view
  aiSuggestions: any[] = [];
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
  this.hideAISuggestions = true; // Hide AI list, keep task form visible
    // Extract title from text wrapped in **, use rest as details
    let title = '';
    let details = event.details;
    const match = details.match(/\*\*(.+?)\*\*/);
    if (match) {
      title = match[1].trim();
      // Remove the **title** part from details
      details = details.replace(match[0], '').trim();
    }
    this.newTaskForm.reset({
      title,
      details,
      date: '',
      reminderDateTime: '',
      end: '',
      type: event.type ?? '',
      weekday: '',
      time: ''
    });
  }

  /**
   * Handler for saving AI suggestion directly as a task without opening the form.
   */
  onSaveAsTask(event: { title: string; details: string; date: string; reminderDateTime?: string }): void {
    const member = this.selectedMember();
    if (!member) {
      alert('Please select a member first.');
      return;
    }
    
    const familyName = this.authService.currentUser()?.familyName || '';
    const email = member.email;
    const memberName = member.name;
    
    // Parse the date string to create a proper Date object
    const taskDate = new Date(event.date);
    taskDate.setHours(9, 0, 0, 0); // Default time: 9:00 AM
    
    // Parse reminder if provided
    let reminderDate: Date | undefined;
    if (event.reminderDateTime) {
      reminderDate = new Date(event.reminderDateTime);
    }
    
    const payload: NewTaskPayload = {
      title: event.title,
      details: event.details,
      date: taskDate,
      familyName,
      memberName,
      email,
      type: 'improvement',
      weekday: taskDate.getDay(),
      time: '09:00',
      reminderDateTime: reminderDate
    };
    
    this.tasksService.addTask(payload).subscribe({
      next: () => {
        alert(`Task "${event.title}" saved for ${memberName}!`);
        // Reload tasks for the selected member
        this.selectMember(member);
      },
      error: (err) => {
        console.error('Failed to save task:', err);
        alert('Failed to save task. Please try again.');
      }
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

        // --- AI Suggestion Submit Logic ---
        aiLoading = false;
        aiError = '';
        aiCards: { title: string; details: string; type?: string }[] = [];

        submitAISuggestion(idea: string, date: string): void {
          this.aiLoading = true;
          this.aiError = '';
          this.aiCards = [];
          // Call the AI service (assume tasksService.getFamilyEveningTasks exists, adapt if needed)
          this.tasksService.getFamilyEveningTasks(idea, date).subscribe({
            next: (res: any) => {
              // Take first 5 suggestions as cards
              this.aiCards = (res.tasks || []).slice(0, 5);
              this.aiLoading = false;
              this.cdr.detectChanges();
            },
            error: (err: any) => {
              this.aiError = 'Failed to get suggestions from AI.';
              this.aiLoading = false;
              this.cdr.detectChanges();
            }
          });
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