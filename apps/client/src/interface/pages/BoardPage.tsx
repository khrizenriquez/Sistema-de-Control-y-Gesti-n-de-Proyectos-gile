import { FunctionComponent } from 'preact';
import { useState } from 'preact/hooks';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { KanbanColumn } from '../components/KanbanColumn';

// Tipos
interface Card {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  attachments?: number;
  checklistProgress?: {
    completed: number;
    total: number;
  };
  assignee?: {
    id: string;
    name: string;
    avatar: string;
  };
}

interface Column {
  id: string;
  title: string;
  cards: Card[];
}

interface Board {
  columns: Column[];
}

export const BoardPage: FunctionComponent = () => {
  // Estado inicial del tablero (mock data)
  const [board, setBoard] = useState<Board>({
    columns: [
      {
        id: 'todo',
        title: 'To Do',
        cards: [
          {
            id: 'card-1',
            title: 'Implementar autenticación',
            description: 'Agregar sistema de login y registro',
            dueDate: '2024-04-01',
            attachments: 2,
            checklistProgress: { completed: 2, total: 5 },
            assignee: {
              id: 'user-1',
              name: 'John Doe',
              avatar: 'https://i.pravatar.cc/150?img=1'
            }
          }
        ]
      },
      {
        id: 'in-progress',
        title: 'In Progress',
        cards: [
          {
            id: 'card-2',
            title: 'Diseñar interfaz de usuario',
            description: 'Crear mockups y prototipos',
            dueDate: '2024-03-25',
            attachments: 5,
            checklistProgress: { completed: 3, total: 8 },
            assignee: {
              id: 'user-2',
              name: 'Jane Smith',
              avatar: 'https://i.pravatar.cc/150?img=2'
            }
          }
        ]
      },
      {
        id: 'done',
        title: 'Done',
        cards: []
      }
    ]
  });

  // Manejador para actualizar una tarjeta
  const handleCardUpdate = (cardId: string, updates: Partial<Card>) => {
    setBoard(prevBoard => ({
      columns: prevBoard.columns.map(column => ({
        ...column,
        cards: column.cards.map(card => 
          card.id === cardId ? { ...card, ...updates } : card
        )
      }))
    }));
  };

  // Manejador para el drag and drop
  const handleDragEnd = (result: DropResult) => {
    const { destination, source } = result;

    // Si no hay destino válido, no hacemos nada
    if (!destination) return;

    // Si el origen y destino son iguales, no hacemos nada
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

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

    // Actualizar el estado
    setBoard(prevBoard => ({
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
    }));
  };

  return (
    <div className="p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tablero del Proyecto</h1>
      </header>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-6 overflow-x-auto pb-4">
          {board.columns.map(column => (
            <KanbanColumn 
              key={column.id} 
              column={column}
              onCardUpdate={handleCardUpdate}
            />
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}; 