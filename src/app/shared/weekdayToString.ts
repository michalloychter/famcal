// Converts a weekday number (0=Sunday, 6=Saturday) to its English name
export function weekdayToString(weekday: number): string {
  const weekdays = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ];
  return weekdays[weekday] ?? '';
}
