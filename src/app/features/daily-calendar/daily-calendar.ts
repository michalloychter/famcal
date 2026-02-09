
import { Component, OnInit , signal, computed, inject, effect } from '@angular/core'; 
import { MatDialog } from '@angular/material/dialog';
import { ImprovementTaskModalComponent } from './improvement-task-modal.component';
import { weekdayToString } from '../../shared/weekdayToString';
import { CommonModule } from '@angular/common';
import { FriendlyDateTimePipe } from '../../shared/friendly-date-time.pipe';
import { FilterTodayPipe } from '../../shared/filter-today.pipe';
import { TasksService ,Task} from '../../core/tasksService'; 
import { AuthService} from '../../core/authService';
import { WeatherService, WeatherData } from '../../core/weather';
import { AiService } from '../../core/aiService';

// Helper for localStorage improvement task persistence
const IMPROVEMENT_TASKS_KEY = 'improvementTasksSeen';
interface ImprovementTaskSeen {
  [taskId: string]: string; // ISO date string of first seen
}

@Component({
  selector: 'app-daily-calendar',
  standalone: true,
  imports: [CommonModule, FriendlyDateTimePipe], 
  templateUrl: './daily-calendar.html',
  styleUrls: ['./daily-calendar.css', './daily-calendar.mobile.css'],
})
export class DailyCalendar implements OnInit {
  constructor(
    private taskService: TasksService,
    private authService: AuthService,
    private weatherService: WeatherService,
    private aiService: AiService,
    private dialog: MatDialog
  ) {}

  openImprovementTaskModal(task: Task): void {
    const dialogRef = this.dialog.open(ImprovementTaskModalComponent, {
      data: { ...task },
      width: '400px',
      autoFocus: true,
      restoreFocus: true,
      hasBackdrop: true,
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result && result.action === 'edit') {
        this.taskService.updateTask(task.id, { title: result.title, details: result.details }).subscribe({
          next: () => {
            this.taskService.getTasks().subscribe(tasks => {
              this.tasks = tasks;
              this.setImprovementTaskForToday();
            });
          },
          error: (err) => {
            console.error('Failed to update task:', err);
          }
        });
      } else if (result && result.action === 'delete') {
        this.taskService.deleteTask(task.id).subscribe({
          next: () => {
            this.taskService.getTasks().subscribe(tasks => {
              this.tasks = tasks;
              this.setImprovementTaskForToday();
            });
          },
          error: (err) => {
            console.error('Failed to delete task:', err);
          }
        });
      }
    });
  }
  // Helper: get improvement tasks for today and next 6 days (7 days total)
  /**
   * Returns improvement tasks that should be shown for the next 7 days, using localStorage to persist first-seen date.
   * Each improvement task is shown for 7 days from the first time it is seen on this device.
   * Expired entries are automatically removed.
   */
  public improvementTasksForNext7Days(): { date: Date, task: Task }[] {
    const result: { date: Date, task: Task }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Load seen improvement tasks from localStorage
    let seen: ImprovementTaskSeen = {};
    try {
      const raw = localStorage.getItem(IMPROVEMENT_TASKS_KEY);
      if (raw) seen = JSON.parse(raw);
    } catch {}
    let changed = false;
    for (const task of this.tasks) {
      if (task.type === 'improvement' && task.id) {
        let firstSeenStr = seen[task.id];
        let firstSeen: Date;
        if (!firstSeenStr) {
          // Mark as first seen today
          firstSeen = new Date();
          firstSeen.setHours(0,0,0,0);
          seen[task.id] = firstSeen.toISOString();
          changed = true;
        } else {
          firstSeen = new Date(firstSeenStr);
          firstSeen.setHours(0,0,0,0);
        }
        // Show for 7 days from first seen
        const diffDays = Math.floor((today.getTime() - firstSeen.getTime()) / (1000*60*60*24));
        if (diffDays >= 0 && diffDays < 7) {
          result.push({ date: new Date(today), task });
        } else if (diffDays >= 7) {
          // Expired, remove from seen
          delete seen[task.id];
          changed = true;
        }
      }
    }
    if (changed) {
      try {
        localStorage.setItem(IMPROVEMENT_TASKS_KEY, JSON.stringify(seen));
      } catch {}
    }
    return result;
  }
  // Helper: get all non-improvement tasks for today
  public nonImprovementTasksForToday(): Task[] {
    return this.filterTasksForToday(this.tasks).filter(t => t.type !== 'improvement');
  }
  // Use the same color palette and hash logic as FamilyMembers
  // --- Improvement Task Card State ---
  public improvementTaskForToday: Task | null = null;
  public expandedImprovementId: string | null = null;
  private memberColors = [
    '#1976d2', '#388e3c', '#fbc02d', '#e040fb', '#0097a7', '#757575', '#ff7043', '#8d6e63', '#43a047', '#c62828'
  ];
  getMemberColor(memberName: string): string {
    if (!memberName) return '#bbb';
    let hash = 0;
    for (let i = 0; i < memberName.length; i++) {
      hash = memberName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % this.memberColors.length;
    return this.memberColors[idx];
  }
  // Helper to normalize task type for CSS class (copied from FamilyMembers)


  public mapTaskType(type: string | undefined | null): string {
    if (!type) return 'other';
    const t = type.trim().toLowerCase();
    if (t === 'meet' || t === 'meeting') return 'meeting';
    if (t === 'class') return 'class';
    if (t === 'shopping' || t === 'shop') return 'shopping';
    if (t === 'birthday' || t === 'bday') return 'birthday';
    if (t === 'doctor' || t === 'see a doctor') return 'doctor';
    if (t === 'other') return 'other';
    return 'other';
  }
  
 tasks: Task[] = [];

 memberEmail: string | null = null;
 weather = signal<WeatherData | null>(null);
  weatherError = signal<string | null>(null);
  clothingAdvice = signal<string | null>(null);
  clothingLoading = signal<boolean>(false); 

readonly memberName = computed(() => {
  const user = this.authService.currentUser();
  // Prefer name, then username, then email, then id
  return user && (user.name || user.username || user.email || user.id || '');
});

 

// Use tasks$ observable for async pipe in template. Filter for today in template or with a helper if needed.


ngOnInit(): void {
  // Get the logged-in member's email from authService
  const user = this.authService.currentUser();
  this.memberEmail = user && user.email ? user.email : null;
  // Initial fetch if not already loaded
  if (this.memberEmail) {
    this.taskService.getTasksByEmail(this.memberEmail).subscribe(tasks => {
      this.tasks = tasks;
      this.setImprovementTaskForToday();
    });
  } else {
    this.taskService.getTasks().subscribe(tasks => {
      this.tasks = tasks;
      this.setImprovementTaskForToday();
    });
  }
  this.fetchWeatherAndAdvice();
}

  // Find the improvement task for today (only one)
  private setImprovementTaskForToday(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();
    this.improvementTaskForToday = null;
    for (const task of this.tasks) {
      if (
        task.type === 'improvement' &&
        task.date &&
        task.repeatUntil
      ) {
        const start = new Date(task.date); start.setHours(0,0,0,0);
        const end = new Date(task.repeatUntil); end.setHours(0,0,0,0);
        if (todayTimestamp >= start.getTime() && todayTimestamp <= end.getTime()) {
          this.improvementTaskForToday = task;
          break;
        }
      }
    }
  }

  public toggleImprovementDetails(taskId: string): void {
    if (this.expandedImprovementId === taskId) {
      this.expandedImprovementId = null;
    } else {
      this.expandedImprovementId = taskId;
    }
  }

    fetchWeatherAndAdvice(): void {
    // Get weather data first
    this.weatherService.getWeather().subscribe({
      next: (weatherData) => {
        this.weather.set(weatherData);
        this.weatherError.set(null);
        
        // Once we have weather, get clothing advice
        this.getClothingAdvice(weatherData);
      },
      error: (err) => {
        this.weatherError.set('Could not fetch weather data.');
        this.weather.set(null);
        console.error(err);
      }
    });
  }

  getClothingAdvice(weatherData: WeatherData): void {
    this.clothingLoading.set(true);
    this.aiService.getClothingSuggestion(weatherData.temp, weatherData.description, weatherData.city).subscribe({
      next: (response) => {
        this.clothingAdvice.set(response.advice);
        this.clothingLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to get clothing advice:', err);
        this.clothingAdvice.set(null);
        this.clothingLoading.set(false);
      }
    });
  }
  

  // Returns tasks for today, including recurring class tasks (by weekday)
  filterTasksForToday(tasks: Task[]): Task[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();
    const todayWeekday = today.getDay();
    return tasks.filter(task => {
      if (task.type === 'improvement' && task.date && task.repeatUntil) {
        // Show if today is between date and repeatUntil (inclusive)
        const start = new Date(task.date); start.setHours(0,0,0,0);
        const end = new Date(task.repeatUntil); end.setHours(0,0,0,0);
        return todayTimestamp >= start.getTime() && todayTimestamp <= end.getTime();
      }
      if (task.type === 'class' && typeof task.weekday === 'number') {
        return task.weekday === todayWeekday;
      }
      if (task.date) {
        const taskDate = new Date(task.date);
        taskDate.setHours(0, 0, 0, 0);
        return taskDate.getTime() === todayTimestamp;
      }
      return false;
    });
  }

  // Helper to get weekday name for display
  getWeekdayName(weekday: number): string {
    return weekdayToString(weekday);
  }

  toggleTaskDone(task: Task): void {
    if (!task.id) return;
    const newDoneStatus = !task.done;
    this.taskService.toggleTaskDone(task.id, newDoneStatus).subscribe({
      next: () => {
        // After toggling, reload tasks so UI updates immediately
        if (this.memberEmail) {
          this.taskService.getTasksByEmail(this.memberEmail).subscribe(tasks => {
            this.tasks = tasks;
            this.setImprovementTaskForToday();
          });
        } else {
          this.taskService.getTasks().subscribe(tasks => {
            this.tasks = tasks;
            this.setImprovementTaskForToday();
          });
        }
      },
      error: (err) => {
        console.error('Failed to toggle task status:', err);
  // Optionally show error to user in a non-blocking way
      }
    });
  }
}