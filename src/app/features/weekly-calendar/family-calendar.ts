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
import { GoogleCalendarService, GoogleCalendarEvent } from '../../core/googleCalendarService';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

function isEventInput(event: EventInput | null): event is EventInput {
	return event !== null;
}

@Component({
	selector: 'app-family-calendar',
	standalone: true,
	imports: [FullCalendarModule, CommonModule, MatButtonModule, MatIconModule],
	templateUrl: './family-calendar.html',
	styleUrl: './family-calendar.css'
})
export class FamilyCalendar implements OnInit {
	googleCalendarEvents = signal<GoogleCalendarEvent[]>([]);
	isGoogleCalendarConnected = signal<boolean>(false);
	isLoadingGoogleCalendar = signal<boolean>(false);
	googleCalendarInitialized = signal<boolean>(false);
	
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
		private dialog: MatDialog,
		private googleCalendarService: GoogleCalendarService
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
			const familyMembers = this.tasksService.familyMembers();
			
			// Map FamCal tasks
			const famCalEvents = this.tasksService.allTasks()
				.filter(task => task.type !== 'private')
				.map(task => {
					const startDate = convertAnyDateToJSDate(task.date);
					const endDate = convertAnyDateToJSDate(task.end);
					if (!startDate || isNaN(startDate.getTime())) { return null; }
						// Find member by name to get their color
						const member = familyMembers.find(m => m.name === task.memberName);
						const backgroundColor = member?.color || this.getMemberColor(task.memberName);
						return {
							id: task.id,
							title: `${task.memberName}: ${task.title}`,
							start: startDate,
							end: endDate ? endDate : undefined,
							extendedProps: { details: task.details, source: 'famcal' },
							backgroundColor,
							borderColor: 'transparent'
						} as EventInput;
				})
				.filter(isEventInput);
			
			// Map Google Calendar events
			const googleEvents = this.googleCalendarEvents()
				.map(event => {
					const startDate = event.start.dateTime 
						? new Date(event.start.dateTime) 
						: event.start.date 
							? new Date(event.start.date) 
							: null;
					const endDate = event.end.dateTime 
						? new Date(event.end.dateTime) 
						: event.end.date 
							? new Date(event.end.date) 
							: null;
					
					if (!startDate) return null;
					
					return {
						id: `google-${event.id}`,
						title: `📅 ${event.summary}`,
						start: startDate,
						end: endDate || undefined,
						extendedProps: { 
							details: event.description || '', 
							location: event.location || '',
							source: 'google' 
						},
						backgroundColor: '#4285f4', // Google blue
						borderColor: '#1967d2',
						textColor: '#ffffff'
					} as EventInput;
				})
				.filter(isEventInput);
			
			return [...famCalEvents, ...googleEvents];
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
		
		// Initialize Google Calendar service
		this.initializeGoogleCalendar();
	}
	
	async initializeGoogleCalendar() {
		try {
			await this.googleCalendarService.initialize();
			this.googleCalendarInitialized.set(true);
			// Check if already signed in (including from localStorage)
			if (this.googleCalendarService.isSignedIn()) {
				this.isGoogleCalendarConnected.set(true);
				await this.loadGoogleCalendarEvents();
			}
		} catch (error) {
			console.error('Error initializing Google Calendar:', error);
			this.googleCalendarInitialized.set(false);
		}
	}
	
	async connectGoogleCalendar() {
		if (!this.googleCalendarInitialized()) {
			alert('Google Calendar is still initializing. Please wait a moment and try again.');
			return;
		}
		
		this.isLoadingGoogleCalendar.set(true);
		try {
			await this.googleCalendarService.authorize();
			this.isGoogleCalendarConnected.set(true);
			await this.loadGoogleCalendarEvents();
		} catch (error: any) {
			console.error('Error connecting to Google Calendar:', error);
			
			if (error.error === 'access_denied') {
				alert('Access denied. Please make sure your email is added as a test user in the Google Cloud Console OAuth consent screen.');
			} else {
				alert('Failed to connect to Google Calendar. Please try again.');
			}
		} finally {
			this.isLoadingGoogleCalendar.set(false);
		}
	}
	
	async disconnectGoogleCalendar() {
		this.googleCalendarService.signOut();
		this.isGoogleCalendarConnected.set(false);
		this.googleCalendarEvents.set([]);
	}
	
	async loadGoogleCalendarEvents() {
		try {
			// Get events for the next 30 days
			const today = new Date();
			const futureDate = new Date();
			futureDate.setDate(today.getDate() + 30);
			
			const events = await this.googleCalendarService.getCalendarEvents(today, futureDate);
			this.googleCalendarEvents.set(events);
		} catch (error) {
			console.error('Error loading Google Calendar events:', error);
		}
	}
}
