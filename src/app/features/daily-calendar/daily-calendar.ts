import { Component, OnInit , signal, computed, inject} from '@angular/core'; 
import { CommonModule } from '@angular/common';
import { FriendlyDateTimePipe } from '../../shared/friendly-date-time.pipe';
import { TasksService ,Task} from '../../core/tasksService'; 
import { AuthService, UserDetails } from '../../core/authService';
import { WeatherService, WeatherData } from '../../core/weather';
import { convertAnyDateToJSDate } from '../../shared/convertTimestamp';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-daily-calendar',
  standalone: true,
  imports: [CommonModule, FriendlyDateTimePipe], 
  templateUrl: './daily-calendar.html',
  styleUrl: './daily-calendar.css',
})
export class DailyCalendar implements OnInit {
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
    private weatherService: WeatherService
  ) {}
 tasks$!: Observable<Task[]>; 
 weather = signal<WeatherData | null>(null);
  weatherError = signal<string | null>(null);
  clothingAdvice = signal<string | null>(null); 
 readonly firstName = computed(() => this.authService.currentUser()?.firstName || '');

 
public readonly tasksWithDates=computed(() => {
   return this.taskService.allTasks().map(task=>({
    ...task,
    date:convertAnyDateToJSDate(task.date),
    end: convertAnyDateToJSDate(task.end)
  }))
   
})
 public readonly todayTasks=computed(()=>{ 
 return this.filterTasksForToday(this.tasksWithDates())
 })
  public readonly taskCount = computed(() => this.todayTasks().length);

 ngOnInit(): void {
    //this.taskService.getTasks().subscribe({
    
  //});
     this.tasks$ = this.taskService.getTasks();
    this.fetchWeatherAndAdvice();
 }

    fetchWeatherAndAdvice(): void {
    // Get weather data first
    this.weatherService.getWeather().subscribe({
      next: (weatherData) => {
        this.weather.set(weatherData);
        this.weatherError.set(null);
      },
      error: (err) => {
        this.weatherError.set('Could not fetch weather data.');
        this.weather.set(null);
        console.error(err);
      }
    });
  }
  

  private filterTasksForToday(tasks: Task[]): Task[] {
    const today = new Date();
    // Normalize "today" to midnight today in local time
    today.setHours(0, 0, 0, 0); 
    
    const todayTimestamp = today.getTime(); // Get the numeric value of today's midnight

    return tasks.filter(task => {
       const taskDate = task.date ;
       console.log('taskdata',task );
       
      // 1. Convert any incoming date format (Timestamp or String) into a JS Date object
        if (!taskDate || isNaN(taskDate.getTime())) {
        return false; 
      }
      
      // 2. Validation check: Ensure the date object is valid
      if (isNaN(taskDate.getTime())) {
        console.warn('Skipping task due to unprocessable date format:', task.title);
        return false; 
      }
      
      // 3. Normalize the task date to midnight on its specific day
      taskDate.setHours(0, 0, 0, 0);
console.log(taskDate.getTime());

      // 4. Compare the normalized numeric timestamps
      return taskDate.getTime() === todayTimestamp;
    });
  }
}