
import { Confetti } from './confetti';
import { Component, signal, PLATFORM_ID, Inject, OnDestroy, ElementRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from '../../shared/confirmation-dialog/confirmation-dialog';
import { AiSuggestionEditModalComponent, AiSuggestionEditData } from './ai-suggestion-edit-modal.component';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AiService } from '../../core/aiService';
import { TasksService } from '../../core/tasksService';
import { FamilyEveningService, FamilyEvening } from '../../core/familyEveningService';
import { AuthService } from '../../core/authService';
import { RequiredErrorMessageComponent } from '../../shared/required-error-message.component';
import { TranslateModule } from '@ngx-translate/core';
import { TranslateService } from '@ngx-translate/core';

import { Task } from '../../core/tasksService';



interface FamilyEveningTask {
  title: string;
  type: string;
  details: string;
}

@Component({
  selector: 'app-family-evening',
  standalone: true,
  imports: [FormsModule, CommonModule, RequiredErrorMessageComponent, TranslateModule],
  templateUrl: './family-evening.html',
  styleUrls: ['./family-evening.css'],
})
export class FamilyEveningComponent implements OnDestroy {
  editSuggestion(task: FamilyEveningTask, idx: number) {
    const dialogRef = this.dialog.open(AiSuggestionEditModalComponent, {
      data: { title: task.title, details: task.details, type: task.type },
      width: '400px',
      autoFocus: true,
      restoreFocus: true,
      hasBackdrop: true,
      closeOnNavigation: true
    });
    dialogRef.afterClosed().subscribe((result: AiSuggestionEditData | undefined) => {
      if (result) {
        // Update the suggestion in the tasks signal array
        const arr = [...this.tasks()];
        arr[idx] = { ...arr[idx], ...result };
        this.tasks.set(arr);
      }
    });
  }
  assignTask(task: FamilyEveningTask, member: any, idx: number) {
    this.assignedMember[idx] = member.email;
  }
  ngOnInit(): void {
    // Show confetti when entering the component
    if (isPlatformBrowser(this.platformId)) {
      Confetti.start();
      setTimeout(() => Confetti.stop(), 5000); // Stop animation after 5 seconds
      setTimeout(() => Confetti.clear(), 5 * 60 * 1000); // Remove confetti after 5 minutes
    }
    const familyId = this.authService.currentUser()?.familyId;
    if (familyId) {
      this.familyEveningService.fetchEvenings(familyId).subscribe(evenings => {
        console.log('Fetched evenings:', evenings);
        this.evenings.set(evenings);
      });
    }
  }
  openPlannerModal() {
    this.showPlanner = true;
  }
  closePlannerModal() {
    this.showPlanner = false;
  }
  evenings = signal<FamilyEvening[]>([]);
  showPlanner = false;
  groupedEvenings = signal<{ title: string, tasks: Task[] }[]>([]);
  // Use a getter for reactivity
  get filteredMembers(): any[] {
    return this.tasksService.familyMembers();
  }
  idea = '';
  date = '';
  loading = signal(false);
  error = signal('');
  tasks = signal<FamilyEveningTask[]>([]);
  assignedMember: { [taskIdx: number]: string } = {};
  submitted = false;

  constructor(
    private aiService: AiService,
    private tasksService: TasksService,
    private familyEveningService: FamilyEveningService,
    private authService: AuthService,
    private dialog: MatDialog,
    @Inject(PLATFORM_ID) private platformId: Object,
    private elementRef: ElementRef,
    private translate: TranslateService
  ) {
    // Always fetch family members on init
    this.tasksService.fetchFamilyMembers().subscribe();
  }

  getAssignedMemberName(idx: number): string {
    const email = this.assignedMember?.[idx];
    if (!email) return 'Member';
    if (this.filteredMembers) {
      const member = this.filteredMembers.find((m: any) => m.email === email);
      return member?.name || 'Member';
    }
    return email;
  }

  submitIdea(event: Event) {
    this.submitted = true;
    event.preventDefault();
    if (!this.idea || !this.date) {
      return;
    }
    this.error.set('');
    this.tasks.set([]);
    this.loading.set(true);
  const lang = this.translate.currentLang || this.translate.getDefaultLang() || 'en';
  this.aiService.getFamilyEveningTasks(this.idea, this.date, lang).subscribe({
      next: (res) => {
        this.tasks.set(res.tasks);
        this.loading.set(false);
        // Do not save yet; wait for user to assign and click Save & Close
      },
      error: (err) => {
        this.error.set('Failed to get tasks from AI.');
        this.loading.set(false);
      }
    });
  }

  saveEvening() {
    // Only save tasks that have an assigned member
    const currentUser = this.authService.currentUser();
    const familyId = currentUser?.familyId;
    if (!familyId) return;
    const allTasks = this.tasks();
    const tasksArr: { memberName: string; task: string }[] = allTasks
      .map((task: any, i: number) => {
        const memberEmail = this.assignedMember[i];
        const member = this.filteredMembers.find((m: any) => m.email === memberEmail);
        if (memberEmail && member) {
          return {
            memberName: member.name as string,
            task: task.details as string
          };
        }
        return undefined;
      })
      .filter((t): t is { memberName: string; task: string } => !!t);
    if (tasksArr.length === 0) {
      this.error.set('Please assign at least one task to a member.');
      return;
    }
    this.loading.set(true);
    this.familyEveningService.createEvening({
      familyId,
      date: this.date,
      title: this.idea,
      tasks: tasksArr
    }).subscribe({
      next: () => {
        // Immediately refresh evenings signal
        this.familyEveningService.fetchEvenings(familyId).subscribe(evenings => {
          this.evenings.set(evenings);
          this.loading.set(false);
          if (isPlatformBrowser(this.platformId)) {
            Confetti.start();
            setTimeout(() => Confetti.clear(), 5000);
          }
          this.closePlannerModal();
        });
      },
      error: (err) => {
        this.error.set('Failed to save family evening.');
        this.loading.set(false);
      }
    });
  }

  ngOnDestroy(): void {
    // Clear confetti when leaving the component
    if (isPlatformBrowser(this.platformId)) {
      Confetti.clear();
    }
  }

  deleteEvening(eveningId: string) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '350px',
      data: { }
    });
    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.familyEveningService.deleteEvening(eveningId).subscribe({
          next: () => {
            this.evenings.set(this.evenings().filter((e: FamilyEvening) => e.id !== eveningId));
          },
          error: () => {
            this.error.set('Failed to delete family evening.');
          }
        });
      }
    });
  }
}