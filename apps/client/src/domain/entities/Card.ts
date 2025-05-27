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
  assignee_id?: string;
  labels?: string[];
  checklistProgress?: {
    completed: number;
    total: number;
  };
  attachments?: number;
  cover_color?: string;
  comments?: CardComment[];
}

export interface CardComment {
  id: string;
  card_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  content: string;
  created_at: string;
  updated_at: string;
} 