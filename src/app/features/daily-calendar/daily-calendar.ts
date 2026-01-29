import { Component, OnInit , signal, computed, inject} from '@angular/core'; 
import { weekdayToString } from '../../shared/weekdayToString';
import { CommonModule } from '@angular/common';
import { FriendlyDateTimePipe } from '../../shared/friendly-date-time.pipe';
import { FilterTodayPipe } from '../../shared/filter-today.pipe';
import { TasksService ,Task} from '../../core/tasksService'; 
import { AuthService} from '../../core/authService';
import { WeatherService, WeatherData } from '../../core/weather';
import { AiService } from '../../core/aiService';
import { convertAnyDateToJSDate } from '../../shared/convertTimestamp';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-daily-calendar',
  standalone: true,
  imports: [CommonModule, FriendlyDateTimePipe], 
  templateUrl: './daily-calendar.html',
  styleUrls: ['./daily-calendar.css', './daily-calendar.mobile.css'],
})
export class DailyCalendar implements OnInit {
  // Use the same color palette and hash logic as FamilyMembers
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
  
  constructor(
    private taskService: TasksService,
    private authService: AuthService ,
    private weatherService: WeatherService,
    private aiService: AiService
  ) {}
 tasks$!: Observable<Task[]>; 
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
    if (this.memberEmail) {
      this.tasks$ = this.taskService.getTasksByEmail(this.memberEmail);
    } else {
      this.tasks$ = this.taskService.getTasks(); // fallback: all tasks
    }
    this.fetchWeatherAndAdvice();
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
        console.log(`Task ${task.id} marked as ${newDoneStatus ? 'done' : 'not done'}`);
      },
      error: (err) => {
        console.error('Failed to toggle task status:', err);
        alert('Failed to update task status. Please try again.');
      }
    });
  }
}