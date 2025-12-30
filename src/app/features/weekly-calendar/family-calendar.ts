import { Component, OnInit, signal, computed, inject } from '@angular/core'; 
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventInput } from '@fullcalendar/core';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { TasksService, Task} from '../../core/tasksService'; 
import { CommonModule } from '@angular/common';
import { AuthService, UserDetails } from '../../core/authService';
import {convertAnyDateToJSDate} from '../../shared/convertTimestamp'

// Define a type guard function (still needed for strict typing)
function isEventInput(event: EventInput | null): event is EventInput {
  return event !== null;
}

@Component({
  selector: 'app-family-calendar',
  standalone: true,
  imports: [FullCalendarModule, CommonModule], 
  // We use the computed signal in the template options binding now
  templateUrl: './family-calendar.html', 
  styleUrl: './family-calendar.css'
})

export class FamilyCalendar implements OnInit {
  constructor(
   private tasksService :TasksService, 
 private authService : AuthService
  ){}
  // private tasksService = inject(TasksService); 
  // private authService = inject(AuthService);

  // Define the BASE options once
  private baseCalendarOptions: CalendarOptions = {
    plugins: [timeGridPlugin, interactionPlugin],
    initialView: 'timeGridWeek',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'timeGridWeek,timeGridDay'
    },
    events: [], // Placeholder, will be overwritten by the computed signal
  };

  currentUser = computed(() => this.authService.currentUser());

  calendarEvents = computed(() => {
   
    const mappedEvents = this.tasksService.allTasks()
      .map(task => {
        const startDate = convertAnyDateToJSDate(task.date);
        const endDate = convertAnyDateToJSDate(task.end);
        if (!startDate || isNaN(startDate.getTime())) { return null; }

        return {
          id: task.id, title: `${task.memberName}: ${task.title}`,
          start: startDate, end: endDate ? endDate : undefined,
          extendedProps: { details: task.details }
        } as EventInput;
      });
      
      const filteredEvents = mappedEvents.filter(isEventInput);
      console.log("fo",filteredEvents);
      return filteredEvents;
  });


  public readonly calendarOptions = computed<CalendarOptions>(() => {
    const events = this.calendarEvents(); // Get the latest events from the other computed signal

    return {
      ...this.baseCalendarOptions, // Use the base options
      events: events                 // Overwrite/update the events property
    };
  });


  ngOnInit() {
   
    // Trigger the data load
    if (this.currentUser()) {
      this.tasksService.getTasks().subscribe({
          error: (err) => console.error("Error fetching daily tasks:", err),
          next: () => console.log("Task loading initiated via subscribe.")
      });
    } else {
       console.warn("User not logged in or missing ID. Cannot fetch calendar tasks.");
    }
  }
}
