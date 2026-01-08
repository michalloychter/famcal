import { Component, OnInit, signal, computed } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventInput } from '@fullcalendar/core';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { TasksService, Task } from '../../core/tasksService';
import { AddTaskModalComponent } from './add-task-modal.component';
import { TaskModalComponent } from './task-modal.component';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/authService';
import { convertAnyDateToJSDate } from '../../shared/convertTimestamp';

function isEventInput(event: EventInput | null): event is EventInput {
	return event !== null;
}

@Component({
	selector: 'app-family-calendar',
	standalone: true,
	imports: [FullCalendarModule, CommonModule, AddTaskModalComponent, TaskModalComponent],
	templateUrl: './family-calendar.html',
	styleUrl: './family-calendar.css'
})
export class FamilyCalendar implements OnInit {
	// Helper to get color for a member name
	getMemberColor(memberName: string): string {
		const colors = [
			'#1976d2', '#388e3c', '#fbc02d', '#e040fb', '#0097a7', '#757575', '#ff7043', '#8d6e63', '#43a047', '#c62828'
		];
		if (!memberName) return '#bbb';
		let hash = 0;
		for (let i = 0; i < memberName.length; i++) {
			hash = memberName.charCodeAt(i) + ((hash << 5) - hash);
		}
		const idx = Math.abs(hash) % colors.length;
		return colors[idx];
	}
	constructor(
		private tasksService: TasksService,
		private authService: AuthService,
		private dialog: MatDialog
	) {}

	// Handler to open add-task modal on date click
	onDateClick(arg: any) {
		const dateStr = arg.dateStr;
		const currentUser = this.authService.currentUser();
		const members = Array.isArray(currentUser?.familyMembers) ? currentUser.familyMembers : [];
		const dialogRef = this.dialog.open(AddTaskModalComponent, {
			data: { date: dateStr, members },
			width: '400px',
			autoFocus: true,
			restoreFocus: true,
			hasBackdrop: true,
			closeOnNavigation: true
		});
			dialogRef.afterClosed().subscribe((result: any) => {
				if (result && result.title) {
					// Use current user's name and email directly
					const memberName = currentUser?.name || '';
					const email = currentUser?.email || '';
					this.tasksService.addTask({
						title: result.title,
						details: result.details,
						date: new Date(result.date),
						familyName: currentUser?.familyName || '',
						memberName: memberName,
						email: email
					}).subscribe();
				}
			});
	}

	// Handler to open modal on event click
	onEventClick(arg: any) {
		const event = arg.event;
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
			const mappedEvents = this.tasksService.allTasks()
				.map(task => {
					const startDate = convertAnyDateToJSDate(task.date);
					const endDate = convertAnyDateToJSDate(task.end);
					if (!startDate || isNaN(startDate.getTime())) { return null; }
						// Use member color for background
						const backgroundColor = this.getMemberColor(task.memberName);
						return {
							id: task.id,
							title: `${task.memberName}: ${task.title}`,
							start: startDate,
							end: endDate ? endDate : undefined,
							extendedProps: { details: task.details },
							backgroundColor,
							borderColor: 'transparent'
						} as EventInput;
				});
			return mappedEvents.filter(isEventInput);
		});

	private baseCalendarOptions: CalendarOptions = {
		plugins: [timeGridPlugin, interactionPlugin],
		initialView: 'timeGridWeek',
		headerToolbar: {
			left: 'prev,next today',
			center: 'title',
			right: 'timeGridWeek,timeGridDay'
		},
		events: [],
		eventClick: this.onEventClick.bind(this),
		dateClick: this.onDateClick.bind(this)
	};

	public readonly calendarOptions = computed<CalendarOptions>(() => {
		return {
			...this.baseCalendarOptions,
			events: this.calendarEvents()
		};
	});

	ngOnInit() {
		if (this.currentUser()) {
			this.tasksService.getTasksByFamilyId(String(this.currentUser()?.familyId || '')).subscribe();
		}
	}
}
