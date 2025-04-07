export interface Task {
  id: string;
  projectId: string;
  title: string;
  completed: boolean;
  type: 'Hope Project' | 'Dream Project' | 'Care Project';
} 