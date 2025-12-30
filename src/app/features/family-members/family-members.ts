import { Component, OnInit, Pipe, PipeTransform , signal, computed} from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { FriendlyDateTimePipe } from '../../shared/friendly-date-time.pipe';
import {MatButtonModule} from '@angular/material/button';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms'; 
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AuthService, UserDetails, FamilyMember } from '../../core/authService'; 
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
  
  //familyMembers: FamilyMember[] = [];
  selectedMember=signal< FamilyMember | null> (null) ;
  // will hold a computed signal, initialized in constructor so injected services are available
  selectedMemberTasks: any;
  public readonly currentUserId= computed(()=>{
    return this.authService?.currentUser()?.id;
  }); 
 public readonly familyMembers= computed(()=>{
  const user=this.authService.currentUser()
  return user?.familyMembers || []
 })
  // --- New Properties for the Add Task Form ---
  isFormVisible: boolean = false;
  newTaskForm: FormGroup;
  // ---------------------------------------------

  constructor(
    private authService: AuthService,
    private tasksService: TasksService,
    private fb: FormBuilder ,// Inject FormBuilder
    //private cdr: ChangeDetectorRef ,
    private dialog: MatDialog 
  ) {
    // Initialize the form group with validators
    this.newTaskForm = this.fb.group({
      title: ['', Validators.required],
      details: [''],
      date: ['', Validators.required], // Start time input (will be a string from HTML date picker)
      end: [''], // Optional end time
      type: [''] // New: task type
    });

    // initialize computed after services are available
    this.selectedMemberTasks = computed(() => {
      const member = this.selectedMember();
      if (!member) return [] as Task[];
      return this.tasksService.allTasks().filter(task => task.memberName === member.memberName);
    });
  }

  ngOnInit(): void {


    this.loadTasks(); // Use a dedicated method to load tasks
  }

  // A helper method to reload tasks after an addition
  loadTasks(): void {
  this.tasksService.getTasks().subscribe(tasks => {
    // tasks are written to the service's signal by getTasks();
    const currentMembers = this.familyMembers();
    const currentSelectedMember = this.selectedMember();
    if ( currentSelectedMember) {
      this.selectMember(currentSelectedMember);
    } else if (currentMembers.length > 0) {
      this.selectMember(currentMembers[0]);
    }
  });
  }

  selectMember(member: FamilyMember): void {
    this.selectedMember.set(member);
    this.isFormVisible = false; 
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
        this.tasksService.deleteTask(taskId).subscribe({
          next: () => {
            console.log(`Task ${taskId} deleted successfully.`);
            this.loadTasks(); // Reload tasks to update the UI instantly
          },
          error: (err) => {
            console.error('Error deleting task:', err);
            alert('Failed to delete task.');
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

    // (formValue already declared above)
    const userIdValue = this.currentUserId();
    const selectedMemberValue = this.selectedMember();
    const newTaskPayload: NewTaskPayload = {
      title: formValue.title,
      details: formValue.details,
      date: convertAnyDateToJSDate(formValue.date), // Convert HTML string input to Date object
      end: formValue.end ? convertAnyDateToJSDate(formValue.end) : undefined, // Convert optional end time
      userID: String(userIdValue),
      // Assign to the currently selected member (use memberName property)
      memberName: selectedMemberValue ? String(selectedMemberValue.memberName) : '',
      type: formValue.type || this.selectedTaskType || '' // Include task type in payload
    };

    // Actually submit the task to the backend
    this.tasksService.addTask(newTaskPayload).subscribe({
      next: (response) => {
        console.log('Task added successfully', response);
        this.toggleFormVisibility(); // Hide form on success
        this.loadTasks(); // Refresh the task list
      },
      error: (err) => {
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