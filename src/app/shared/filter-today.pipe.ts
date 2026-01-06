import { Pipe, PipeTransform } from '@angular/core';
import { Task } from '../core/tasksService';
import { convertAnyDateToJSDate } from './convertTimestamp';

@Pipe({
  name: 'filterToday',
  standalone: true
})
export class FilterTodayPipe implements PipeTransform {
  transform(tasks: Task[]): Task[] {
    if (!Array.isArray(tasks)) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();
    return tasks.filter(task => {
      const taskDate = convertAnyDateToJSDate(task.date);
      if (!taskDate || isNaN(taskDate.getTime())) return false;
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() === todayTimestamp;
    });
  }
}
