export interface FirebaseTimestamp {
  _seconds: number;
  _nanoseconds: number;
}

export interface Task {
  id: string;
  title: string;
  date?: string | Date | FirebaseTimestamp; // For normal tasks
  details: string;
  familyID: string;
  memberName: string;
  end?: string | Date | FirebaseTimestamp;
  // For class tasks (recurring weekly)
  type?: string;
  weekday?: number; // 0 (Sunday) - 6 (Saturday)
  time?: string;    // 'HH:mm'
}

// Interface for creating a new task, where 'id' might be optional before saving
export type NewTaskPayload = Omit<Task, 'id'>;