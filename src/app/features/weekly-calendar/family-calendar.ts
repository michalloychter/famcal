import { Component, OnInit, signal, computed } from '@angular/core'; 
import { MatDialog } from '@angular/material/dialog';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventInput } from '@fullcalendar/core';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { TasksService, Task} from '../../core/tasksService'; 
import { TaskModalComponent } from './task-modal.component';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/authService';
import type { familyDetails } from '../../shared/models/family';
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
    private tasksService: TasksService,
    private authService: AuthService,
    private dialog: MatDialog
  ) {}
 

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
    eventClick: this.onEventClick.bind(this)
  };

  // Handler to open modal on event click
  onEventClick(arg: any) {
    const event = arg.event;
    // Find the task by id
    const task = this.tasksService.allTasks().find(t => t.id === event.id);
    if (task) {
      this.dialog.open(TaskModalComponent, {
        data: task,
        width: '400px',
        autoFocus: true,
        restoreFocus: true,
        hasBackdrop: true,
        closeOnNavigation: true
      });
    }
  }

  currentUser = computed(() => this.authService.currentUser());

  calendarEvents = computed(() => {
   console.log("currentUser",this.currentUser());
   
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
      console.log("Current userfamilyId:", this.currentUser()?.familyId);
      
      this.tasksService.getTasksByFamilyId(String(this.currentUser()?.familyId || '')).subscribe({
        error: (err) => console.error("Error fetching family calendar tasks:", err),
        next: () => console.log("Family calendar task loading initiated via subscribe.")
      });
    } else {
      console.warn("User not logged in or missing ID. Cannot fetch calendar tasks.");
    }
  }
}
