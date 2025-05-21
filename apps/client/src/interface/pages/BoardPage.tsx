import { FunctionComponent } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { KanbanColumn } from '../components/KanbanColumn';
import { useRoute } from 'wouter-preact';
import { BoardService, UpdateBoardOrder } from '../../domain/services/BoardService';
import { ProjectService } from '../../domain/services/ProjectService';

// Tipos
interface Card {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  list_id: string;
  position: number;
  assignee_id?: string;
  assignee_name?: string;
  assignee_email?: string;
  attachments?: number;
  checklistProgress?: {
    completed: number;
    total: number;
  };
  assignee?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

interface Column {
  id: string;
  title: string;
  cards: Card[];
}

interface Board {
  id: string;
  title: string;
  description?: string;
  columns: Column[];
}

export const BoardPage: FunctionComponent = () => {
  const [match, params] = useRoute('/boards/:id');
  const boardId = params?.id;
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [developers, setDevelopers] = useState<any[]>([]);
  const boardService = new BoardService();
  const projectService = new ProjectService();

  // Cargar datos del tablero
  useEffect(() => {
    if (!boardId) return;

    const fetchBoardData = async () => {
      try {
        setLoading(true);
        const boardData = await boardService.getBoardData(boardId);
        setBoard(boardData as any);
        setError(null);
        
        // Si tenemos el board, cargar los desarrolladores del proyecto
        if (boardData && boardData.project_id) {
          try {
            const devs = await ProjectService.getDevelopers(boardData.project_id);
            setDevelopers(devs);
          } catch (err) {
            console.error('Error loading developers:', err);
            // No establecer error general para que al menos se muestre el tablero
          }
        }
      } catch (err) {
        console.error('Error loading board data:', err);
        setError('Error al cargar los datos del tablero. Por favor, intenta de nuevo.');
      } finally {
        setLoading(false);
      }
    };

    fetchBoardData();
  }, [boardId]);

  // Manejador para actualizar una tarjeta
  const handleCardUpdate = async (cardId: string, updates: Partial<Card>) => {
    if (!board) return;

    try {
      // Actualizar la tarjeta en el servidor
      await boardService.updateCard(cardId, {
        title: updates.title,
        description: updates.description,
        due_date: updates.dueDate,
        list_id: updates.list_id
      });

      // Actualizar el estado local
      setBoard(prevBoard => {
        if (!prevBoard) return null;
        
        return {
          ...prevBoard,
          columns: prevBoard.columns.map(column => ({
            ...column,
            cards: column.cards.map(card => 
              card.id === cardId ? { ...card, ...updates } : card
            )
          }))
        };
      });
    } catch (err) {
      console.error('Error updating card:', err);
      // Mostrar mensaje de error al usuario
    }
  };

  // Manejador para crear una nueva tarjeta
  const handleAddCard = async (listId: string, title: string) => {
    if (!board) return;

    try {
      // Crear la tarjeta en el servidor
      const newCard = await boardService.createCard(listId, { title });

      // Actualizar el estado local
      setBoard(prevBoard => {
        if (!prevBoard) return null;
        
        return {
          ...prevBoard,
          columns: prevBoard.columns.map(column => {
            if (column.id === listId) {
              return {
                ...column,
                cards: [...column.cards, {
                  id: newCard.id,
                  title: newCard.title,
                  description: newCard.description,
                  dueDate: newCard.due_date,
                  list_id: newCard.list_id,
                  position: newCard.position,
                  assignee_id: newCard.assignee_id,
                  assignee_name: newCard.assignee_name,
                  assignee_email: newCard.assignee_email,
                  assignee: newCard.assignee_id ? {
                    id: newCard.assignee_id,
                    name: newCard.assignee_name || 'Usuario',
                    avatar: undefined
                  } : undefined
                }]
              };
            }
            return column;
          })
        };
      });
    } catch (err) {
      console.error('Error creating card:', err);
      // Mostrar mensaje de error al usuario
    }
  };

  // Manejador para el drag and drop
  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // Si no hay destino válido, no hacemos nada
    if (!destination || !board) return;

    // Si el origen y destino son iguales, no hacemos nada
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    try {
      // Encontrar las columnas de origen y destino
      const sourceColumn = board.columns.find(col => col.id === source.droppableId);
      const destColumn = board.columns.find(col => col.id === destination.droppableId);

      if (!sourceColumn || !destColumn) return;

      // Crear nuevas arrays para las columnas
      const newSourceCards = Array.from(sourceColumn.cards);
      const newDestCards = source.droppableId === destination.droppableId 
        ? newSourceCards 
        : Array.from(destColumn.cards);

      // Remover la tarjeta del origen
      const [movedCard] = newSourceCards.splice(source.index, 1);

      // Insertar la tarjeta en el destino
      if (source.droppableId === destination.droppableId) {
        newSourceCards.splice(destination.index, 0, movedCard);
      } else {
        newDestCards.splice(destination.index, 0, movedCard);
      }

      // Actualizar el estado local inmediatamente para una experiencia fluida
      setBoard(prevBoard => {
        if (!prevBoard) return null;
        
        return {
          ...prevBoard,
          columns: prevBoard.columns.map(column => {
            if (column.id === source.droppableId) {
              return {
                ...column,
                cards: newSourceCards
              };
            }
            if (column.id === destination.droppableId) {
              return {
                ...column,
                cards: newDestCards
              };
            }
            return column;
          })
        };
      });

      // Actualizar en el servidor
      const updateData: UpdateBoardOrder = {
        boardId: board.id,
        sourceColumnId: source.droppableId,
        destinationColumnId: destination.droppableId,
        sourceIndex: source.index,
        destinationIndex: destination.index,
        cardId: draggableId
      };

      await boardService.updateCardOrder(updateData);
    } catch (err) {
      console.error('Error updating card order:', err);
      // Si falla, podríamos revertir el cambio en el estado local
      // o intentar nuevamente
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="p-6">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded mb-6">
          Tablero no encontrado.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{board.title}</h1>
        {board.description && <p className="text-gray-600">{board.description}</p>}
      </header>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-6 overflow-x-auto pb-4">
          {board.columns.map(column => (
            <KanbanColumn 
              key={column.id} 
              column={column}
              onCardUpdate={handleCardUpdate}
              onAddCard={handleAddCard}
              availableDevelopers={developers}
            />
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}; 