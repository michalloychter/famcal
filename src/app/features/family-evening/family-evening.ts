import { Confetti } from './confetti';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AiService } from '../../core/aiService';
import { TasksService } from '../../core/tasksService';
import { RequiredErrorMessageComponent } from '../../shared/required-error-message.component';
import { Task } from '../../core/tasksService';

interface FamilyEveningTask {
  title: string;
  type: string;
  details: string;
}

@Component({
  selector: 'app-family-evening',
  standalone: true,
  imports: [FormsModule, CommonModule, RequiredErrorMessageComponent],
  templateUrl: './family-evening.html',
  styleUrls: ['./family-evening.css'],
})

export class FamilyEveningComponent {

  showPlanner = false;
  groupedEvenings = signal<{ title: string, tasks: Task[] }[]>([]);
  filteredMembers: any[] = [];
  idea = '';
  date = '';
  loading = signal(false);
  error = signal('');
  tasks = signal<FamilyEveningTask[]>([]);
  assignedMember: { [taskIdx: number]: string } = {};
  submitted = false;

  constructor(private aiService: AiService, private tasksService: TasksService) {
    if (this.tasksService && typeof this.tasksService.familyMembers === 'function') {
      this.filteredMembers = this.tasksService.familyMembers();
    }
  }


  openPlannerModal() {
    this.showPlanner = true;
  }

  closePlannerModal() {
    this.showPlanner = false;
  }


  ngOnInit(): void {
    setTimeout(() => {
      Confetti.start();
      setTimeout(() => {
        Confetti.stop(); // Stop animation after 3 seconds, but confetti remains visible
      }, 3000);
    }, 0);
    this.filteredMembers = this.tasksService.familyMembers();
    this.tasksService.fetchFamilyMembers().subscribe(members => {
      this.filteredMembers = members;
    });
    // Fetch all family evening tasks for this week and group by title
    this.tasksService.getTasks().subscribe(tasks => {
      const now = new Date();
      const day = now.getDay();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - day);
      weekStart.setHours(0,0,0,0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23,59,59,999);
      const familyEvenings = tasks.filter(t => {
        if (t.type !== 'family evening' || !t.date) return false;
        const d = typeof t.date === 'string' ? new Date(t.date) : t.date;
        return d >= weekStart && d <= weekEnd;
      });
      const grouped: { [title: string]: Task[] } = {};
      for (const t of familyEvenings) {
        if (!grouped[t.title]) grouped[t.title] = [];
        grouped[t.title].push(t);
      }
      this.groupedEvenings.set(Object.entries(grouped).map(([title, tasks]) => ({ title, tasks })));
    });
  }

  // No need to stop confetti on destroy, as we want the static confetti to remain as background


  // (Removed duplicate property declarations)



  // (Removed duplicate constructor)




  assignTask(task: FamilyEveningTask, member: any, idx: number) {
    this.assignedMember[idx] = member.email;
    const payload = {
      title: this.idea,
      details: task.details,
      date: new Date(this.date),
      familyName: member.familyName || '',
      memberName: member.name,
      email: member.email,
      type: 'family evening'
    };
    if (this.tasksService && typeof this.tasksService.addTask === 'function') {
      this.tasksService.addTask(payload).subscribe({
        next: () => {},
        error: () => {
          this.error.set('Failed to assign task.');
        }
      });
    }
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
    this.aiService.getFamilyEveningTasks(this.idea, this.date).subscribe({
      next: (res) => {
        this.tasks.set(res.tasks);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to get tasks from AI.');
        this.loading.set(false);
      }
    });
  }
}