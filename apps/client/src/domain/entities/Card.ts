export interface Card {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  assignee?: {
    id: string;
    name: string;
    avatar?: string;
  };
  labels?: string[];
  checklistProgress?: {
    completed: number;
    total: number;
  };
  attachments?: number;
} 