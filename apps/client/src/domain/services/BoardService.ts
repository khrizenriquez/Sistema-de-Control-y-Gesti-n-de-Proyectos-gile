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

export interface List {
  id: string;
  name: string;
  board_id: string;
  position: number;
  created_at: string;
}

export interface Card {
  id: string;
  title: string;
  description?: string;
  list_id: string;
  position: number;
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCardRequest {
  title: string;
  description?: string;
  position?: number;
  due_date?: string;
}

export interface UpdateCardRequest {
  title?: string;
  description?: string;
  position?: number;
  due_date?: string;
  list_id?: string;
}

export class BoardService {
  async getBoardData(boardId: string): Promise<BoardData> {
    try {
      // Obtener los detalles básicos del tablero
      const boardResponse = await api.get(`/api/boards/${boardId}`);
      const board = boardResponse.data;
      
      // Obtener las listas del tablero
      const listsResponse = await api.get(`/api/boards/${boardId}/lists`);
      const lists = listsResponse.data;
      
      // Para cada lista, obtener sus tarjetas
      const columns = await Promise.all(
        lists.map(async (list: List) => {
          const cardsResponse = await api.get(`/api/boards/lists/${list.id}/cards`);
          const cards = cardsResponse.data;
          
          return {
            id: list.id,
            title: list.name,
            cards: cards.map((card: Card) => ({
              id: card.id,
              title: card.title,
              description: card.description,
              dueDate: card.due_date,
              list_id: card.list_id,
              position: card.position
            }))
          };
        })
      );
      
      return {
        id: boardId,
        title: board.name,
        description: '',
        columns
      };
    } catch (error) {
      console.error('Error fetching board data:', error);
      throw error;
    }
  }

  async updateCardOrder(update: UpdateBoardOrder): Promise<boolean> {
    try {
      // Actualizar la posición de la tarjeta
      await api.put(`/api/boards/cards/${update.cardId}`, {
        list_id: update.destinationColumnId,
        position: update.destinationIndex
      });
      
      return true;
    } catch (error) {
      console.error('Error updating card order:', error);
      throw error;
    }
  }
  
  async getBoards(): Promise<Board[]> {
    try {
      const response = await api.get('/api/boards');
      return response.data;
    } catch (error) {
      console.error('Error fetching boards:', error);
      throw error;
    }
  }
  
  async createBoard(boardData: CreateBoardRequest): Promise<Board> {
    try {
      const response = await api.post('/api/boards', boardData);
      return response.data;
    } catch (error) {
      console.error('Error creating board:', error);
      throw error;
    }
  }
  
  async getBoardById(boardId: string): Promise<Board> {
    try {
      const response = await api.get(`/api/boards/${boardId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching board with ID ${boardId}:`, error);
      throw error;
    }
  }
  
  async getBoardLists(boardId: string): Promise<List[]> {
    try {
      const response = await api.get(`/api/boards/${boardId}/lists`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching lists for board ${boardId}:`, error);
      throw error;
    }
  }
  
  async createList(boardId: string, name: string, position?: number): Promise<List> {
    try {
      const response = await api.post(`/api/boards/${boardId}/lists`, {
        name,
        position
      });
      return response.data;
    } catch (error) {
      console.error('Error creating list:', error);
      throw error;
    }
  }
  
  async getListCards(listId: string): Promise<Card[]> {
    try {
      const response = await api.get(`/api/boards/lists/${listId}/cards`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching cards for list ${listId}:`, error);
      throw error;
    }
  }
  
  async createCard(listId: string, cardData: CreateCardRequest): Promise<Card> {
    try {
      const response = await api.post(`/api/boards/lists/${listId}/cards`, cardData);
      return response.data;
    } catch (error) {
      console.error('Error creating card:', error);
      throw error;
    }
  }
  
  async getCardById(cardId: string): Promise<Card> {
    try {
      const response = await api.get(`/api/boards/cards/${cardId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching card with ID ${cardId}:`, error);
      throw error;
    }
  }
  
  async updateCard(cardId: string, cardData: UpdateCardRequest): Promise<Card> {
    try {
      const response = await api.put(`/api/boards/cards/${cardId}`, cardData);
      return response.data;
    } catch (error) {
      console.error(`Error updating card with ID ${cardId}:`, error);
      throw error;
    }
  }
  
  async deleteCard(cardId: string): Promise<void> {
    try {
      await api.delete(`/api/boards/cards/${cardId}`);
    } catch (error) {
      console.error(`Error deleting card with ID ${cardId}:`, error);
      throw error;
    }
  }
} 