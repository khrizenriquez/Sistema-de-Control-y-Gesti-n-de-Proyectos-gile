import { BoardApiAdapter } from '../../infrastructure/adapters/BoardApiAdapter';
import { BoardData, UpdateBoardOrder } from '../../domain/services/BoardService';

export async function getBoardData(): Promise<BoardData> {
  const boardApi = new BoardApiAdapter();
  
  try {
    return await boardApi.getBoardData();
  } catch (error) {
    console.error('Error getting board data:', error);
    throw error;
  }
}

export async function updateCardOrder(update: UpdateBoardOrder): Promise<boolean> {
  const boardApi = new BoardApiAdapter();
  
  try {
    return await boardApi.updateCardOrder(update);
  } catch (error) {
    console.error('Error updating card order:', error);
    throw error;
  }
} 