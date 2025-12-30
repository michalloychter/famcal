import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'friendlyDateTime',
  standalone: true
})
export class FriendlyDateTimePipe implements PipeTransform {
  transform(value: any): string {
    if (!value) return '';
    const date = new Date(value);
    if (isNaN(date.getTime())) return '';
    // Format: Tue Dec 30 2025, 4:00 PM
    const day = date.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
    const time = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true });
    return `${day}, ${time}`;
  }
}
