
import { Component, Input, computed, ViewChild, ElementRef, signal, effect, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TasksService } from '../../core/tasksService';
import { HouseTasksService, HouseTask } from '../../core/houseTasksService';
import { AuthService } from '../../core/authService';
import { SocketService } from '../../core/socket.service';

export type TableTask = { title: string; details: string; color: string };



@Component({
  selector: 'app-house-tasks-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './house-tasks-table.component.html',
  styleUrls: ['./house-tasks-table.component.css']
})
export class HouseTasksTableComponent implements OnInit, OnDestroy {
  confettiArray = Array.from({ length: 18 });
  private confettiMap = new WeakMap<HouseTask, boolean>();

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

  // effect to update tasksMap when houseTasksService.tasks changes
  private tasksMapEffect = effect(() => {
    const tasks = this.houseTasksService.tasks?.() ?? [];
    this.tasksMap = {};
    for (const task of tasks) {
      if (!this.tasksMap[task.memberName]) this.tasksMap[task.memberName] = {};
      this.tasksMap[task.memberName][task.day] = task;
    }
  });

  constructor(
    private tasksService: TasksService,
    private houseTasksService: HouseTasksService,
    private authService: AuthService,
    private socketService: SocketService
  ) {}


  ngOnInit() {
    // Always fetch family members when component is created
    this.tasksService.fetchFamilyMembers()?.subscribe?.();
    // Load house tasks for the current family when component loads
    const familyId = this.authService.currentUser()?.familyId;
    if (familyId) {
      this.houseTasksService.loadTasksForFamily(familyId);
      this.socketService.connect(familyId);
      this.socketService.onHouseTasksUpdate(() => {
        this.houseTasksService.loadTasksForFamily(familyId);
      });
    }
  }

  ngOnDestroy() {
    this.socketService.disconnect();
  }

  triggerConfetti(task: HouseTask) {
    this.confettiMap.set(task, true);
    setTimeout(() => {
      this.confettiMap.set(task, false);
    }, 1200);
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

  async saveTaskFromModal() {
    if (this.modalMember && this.modalDay) {
      const familyId = this.authService.currentUser()?.familyId;
      if (!familyId) return;
      const existingTask = this.tasksMap[this.modalMember]?.[this.modalDay];
      const newTask: HouseTask = {
        familyId: familyId,
        memberName: this.modalMember,
        day: this.modalDay,
        title: this.modalTaskTitle,
        details: this.modalTaskDetails,
        color: this.modalTaskColor,
        done: false // Always reset done to false on edit
      };
      try {
        if (existingTask && existingTask.id) {
          await this.houseTasksService.updateTask(existingTask.id, newTask).toPromise();
        } else {
          await this.houseTasksService.createTask(newTask).toPromise();
        }
        // No need to manually reload, socket will trigger reload
        this.closeTaskModal();
      } catch {
        this.closeTaskModal();
      }
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
  markTaskDone(task: HouseTask) {
    if (!task.id) return;
    // Optimistically update the UI immediately
    task.done = true;
    this.houseTasksService.updateTask(task.id, { done: true }).subscribe({
      error: () => {
        // If the update fails, revert the change
        task.done = false;
      }
    });
  }

  isConfettiActive(task: HouseTask): boolean {
    return !!this.confettiMap.get(task);
  }
}
