import { Project } from '../entities/Project';
import { Task } from '../entities/Task';
import { Message } from '../entities/Message';

export interface DashboardData {
  projects: Project[];
  tasks: Task[];
  messages: Message[];
  incomeGrowth: number;
  monthlyData: {
    month: string;
    value: number;
  }[];
}

export class DashboardService {
  constructor() {}

  async getDashboardData(): Promise<DashboardData> {
    // En un caso real, esto vendría de una API
    return {
      projects: [
        { id: '1', name: 'UI/UX', progress: 70, type: 'UI/UX', color: '#3B82F6' },
        { id: '2', name: 'Front-End', progress: 40, type: 'Front-End', color: '#EF4444' },
        { id: '3', name: 'Web UI', progress: 80, type: 'Web UI', color: '#8B5CF6' },
        { id: '4', name: 'NFT App', progress: 50, type: 'NFT App', color: '#F59E0B' },
        { id: '5', name: 'Mobile UI', progress: 80, type: 'Mobile UI', color: '#EC4899' }
      ],
      tasks: [
        { id: '1', projectId: '1', title: 'Design System', completed: true, type: 'Hope Project' },
        { id: '2', projectId: '2', title: 'Component Library', completed: false, type: 'Dream Project' },
        { id: '3', projectId: '3', title: 'Landing Page', completed: true, type: 'Care Project' }
      ],
      messages: [
        { id: '1', username: 'winniftrd', userDisplayName: 'Winniftrd', content: 'Message goes here 😊', timestamp: '30m' },
        { id: '2', username: 'esther', userDisplayName: 'Esther', content: 'Message goes here 😊', timestamp: '1h' },
        { id: '3', username: 'leland', userDisplayName: 'Leland', content: 'Message goes here 😊', timestamp: '3h' },
        { id: '4', username: 'jimmy', userDisplayName: 'Jimmy', content: 'Message goes here 😊', timestamp: '10h' }
      ],
      incomeGrowth: 10.2,
      monthlyData: [
        { month: 'Jan', value: 30 },
        { month: 'Feb', value: 40 },
        { month: 'Mar', value: 45 },
        { month: 'Apr', value: 35 },
        { month: 'May', value: 50 },
        { month: 'Jun', value: 45 },
        { month: 'Jul', value: 60 },
        { month: 'Aug', value: 55 },
        { month: 'Sep', value: 48 },
        { month: 'Oct', value: 42 },
        { month: 'Nov', value: 38 },
        { month: 'Dec', value: 35 }
      ]
    };
  }
} 