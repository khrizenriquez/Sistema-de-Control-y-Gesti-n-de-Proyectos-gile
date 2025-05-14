import { Column } from '../entities/Column';
import { api } from '../../infrastructure/api';

export interface BoardData {
  id: string;
  title: string;
  description?: string;
  columns: Column[];
}

export interface UpdateBoardOrder {
  boardId: string;
  sourceColumnId: string;
  destinationColumnId: string;
  sourceIndex: number;
  destinationIndex: number;
  cardId: string;
}

export interface Board {
  id: string;
  name: string;
  project_id: string;
  project_name?: string;
  created_at: string;
  template?: string;
}

export interface CreateBoardRequest {
  name: string;
  project_id: string;
  template?: string;
}

export class BoardService {
  async getBoardData(boardId: string): Promise<BoardData> {
    try {
      // Primero, obtenemos los detalles básicos del tablero
      const response = await api.get(`/boards/${boardId}`);
      const board = response.data;
      
      // Luego, obtenemos las columnas y tarjetas
      // En un caso real, habría un endpoint específico para esto
      // Por ahora, usamos datos de prueba
      return {
        id: boardId,
        title: board.name || 'Project Board',
        description: 'Manage your projects and tasks',
        columns: [
          {
            id: 'todo',
            title: 'To Do',
            cards: [
              {
                id: 'card-5',
                title: 'Implementar autenticación',
                checklistProgress: {
                  completed: 2,
                  total: 5,
                },
                assignee: {
                  id: 'user-1',
                  name: 'John Doe',
                  avatar: '/avatars/john.jpg',
                },
              },
              {
                id: 'card-6',
                title: 'Configurar CI/CD',
                assignee: {
                  id: 'user-2',
                  name: 'Jane Smith',
                  avatar: '/avatars/jane.jpg',
                },
              },
            ],
          },
          {
            id: 'inprogress',
            title: 'In Progress',
            cards: [
              {
                id: 'card-9',
                title: 'Diseñar interfaz de usuario',
                dueDate: '2024-03-25',
                assignee: {
                  id: 'user-1',
                  name: 'John Doe',
                  avatar: '/avatars/john.jpg',
                },
              },
            ],
          },
          {
            id: 'done',
            title: 'Done',
            cards: [],
          },
        ],
      };
    } catch (error) {
      console.error('Error fetching board data:', error);
      throw error;
    }
  }

  async updateCardOrder(update: UpdateBoardOrder): Promise<boolean> {
    try {
      // En un caso real, esto sería una llamada a la API
      console.log('Updating card order:', update);
      return true;
    } catch (error) {
      console.error('Error updating card order:', error);
      throw error;
    }
  }
  
  async getBoards(): Promise<Board[]> {
    try {
      const response = await api.get('/boards');
      return response.data;
    } catch (error) {
      console.error('Error fetching boards:', error);
      throw error;
    }
  }
  
  async createBoard(boardData: CreateBoardRequest): Promise<Board> {
    try {
      const response = await api.post('/boards', boardData);
      return response.data;
    } catch (error) {
      console.error('Error creating board:', error);
      throw error;
    }
  }
  
  async getBoardById(boardId: string): Promise<Board> {
    try {
      const response = await api.get(`/boards/${boardId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching board with ID ${boardId}:`, error);
      throw error;
    }
  }
} 