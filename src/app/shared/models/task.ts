export interface FirebaseTimestamp {
  _seconds: number;
  _nanoseconds: number;
}

export interface Task {
  id: string; 
  title: string;
  // date (start time) can be a string, Date object (on client), or timestamp object (from API)
  date: string | Date | FirebaseTimestamp |undefined; 
  details: string; 
  userID: string; 
  memberName: string;
  // Add an optional 'end' property for calendar scheduling
  end?: string | Date | FirebaseTimestamp|undefined; 
}

// Interface for creating a new task, where 'id' might be optional before saving
export type NewTaskPayload = Omit<Task, 'id'>;