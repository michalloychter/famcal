export function convertAnyDateToJSDate(timestamp: any): Date | undefined {
  if (!timestamp) return undefined;
  
  if (typeof timestamp === 'object' && timestamp !== null && '_seconds' in timestamp) {
    // Handle Firebase Timestamp objects
    return new Date(timestamp._seconds * 1000); 
  }
  
  // Handle ISO strings, numbers, or standard Date objects
  const date = new Date(timestamp);
  
  // Return undefined if the resulting Date object is invalid
  return isNaN(date.getTime()) ? undefined : date; 
}