import { Component, Input, computed, ViewChild, ElementRef, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TasksService } from '../../core/tasksService';
import { HouseTasksService, HouseTask } from '../../core/houseTasksService';
import { AuthService } from '../../core/authService';

export type TableTask = { title: string; details: string; color: string };



@Component({
  selector: 'app-house-tasks-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './house-tasks-table.component.html',
  styleUrls: ['./house-tasks-table.component.css']
})
export class HouseTasksTableComponent {
  @ViewChild('hiddenColorInput') hiddenColorInput!: ElementRef<HTMLInputElement>;
  @Input() days: string[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  showModal = false;
  modalMember: string | null = null;
  modalDay: string | null = null;
  modalTaskTitle = '';
  modalTaskDetails = '';
  modalTaskColor = '#ffd54f';

  tasksMap: { [member: string]: { [day: string]: HouseTask } } = {};
  members = computed(() => (this.tasksService?.familyMembers?.() ?? []).map((m: any) => m.name));

  constructor(
    private tasksService: TasksService,
    private houseTasksService: HouseTasksService,
    private authService: AuthService
  ) {
    // Always fetch family members when component is created
    this.tasksService.fetchFamilyMembers().subscribe();
    // Load house tasks for the current family when component loads
    const familyName = this.tasksService.currentFamilyName;
    if (familyName) {
      this.houseTasksService.loadTasksForFamily(familyName);
    }
    // Subscribe to the signal of house tasks and update tasksMap reactively
    effect(() => {
      const tasks = this.houseTasksService.tasks();
      this.tasksMap = {};
      for (const task of tasks) {
        if (!this.tasksMap[task.memberName]) this.tasksMap[task.memberName] = {};
        this.tasksMap[task.memberName][task.day] = task;
      }
    });
  }

  openColorPicker() {
    if (this.hiddenColorInput) {
      this.hiddenColorInput.nativeElement.click();
    }
  }

  openTaskModal(member: string, day: string) {
    // Check if user is authenticated (token exists)
    const token = this.authService.getToken();
    if (!token) {
      alert('Please log in before adding a task.');
      return;
    }
    this.modalMember = member;
    this.modalDay = day;
    const cell = this.tasksMap[member]?.[day];
    if (cell) {
      this.modalTaskTitle = cell.title || '';
      this.modalTaskDetails = cell.details || '';
      this.modalTaskColor = cell.color || '#ffd54f';
    } else {
      this.modalTaskTitle = '';
      this.modalTaskDetails = '';
      this.modalTaskColor = '#ffd54f';
    }
    this.showModal = true;
  }

  onColorPicked(event: Event) {
    const input = event.target as HTMLInputElement;
    this.modalTaskColor = input.value;
  }

  closeTaskModal() {
    this.showModal = false;
    this.modalMember = null;
    this.modalDay = null;
    this.modalTaskTitle = '';
    this.modalTaskDetails = '';
    this.modalTaskColor = '#ffd54f';
  }

  saveTaskFromModal() {
    if (this.modalMember && this.modalDay) {
      const familyName = this.tasksService.currentFamilyName;
      if (!familyName) return;
      const newTask: HouseTask = {
        familyId: familyName,
        memberName: this.modalMember,
        day: this.modalDay,
        title: this.modalTaskTitle,
        details: this.modalTaskDetails,
        color: this.modalTaskColor
      };
      this.houseTasksService.createTask(newTask).subscribe({
        next: () => {
          // After creating, reload all tasks for the family so the signal updates
          this.houseTasksService.loadTasksForFamily(familyName);
          this.closeTaskModal();
        },
        error: () => {
          this.closeTaskModal();
        }
      });
    } else {
      this.closeTaskModal();
    }
  }
  // State for details modal
  showDetailsModal = false;
  detailsModalText = '';
  detailsModalTitle = '';

  openDetailsModal(title: string, details: string) {
    this.detailsModalTitle = title;
    this.detailsModalText = details;
    this.showDetailsModal = true;
  }

  closeDetailsModal() {
    this.showDetailsModal = false;
    this.detailsModalText = '';
    this.detailsModalTitle = '';
  }
}




