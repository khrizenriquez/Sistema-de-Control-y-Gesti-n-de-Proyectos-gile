import { FunctionComponent } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { getBoardData, updateCardOrder } from '../../application/use-cases/getBoardData';
import { BoardData } from '../../domain/services/BoardService';
import { KanbanColumn } from '../components/KanbanColumn';

export const BoardPage: FunctionComponent = () => {
  const [data, setData] = useState<BoardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const boardData = await getBoardData();
        setData(boardData);
      } catch (error) {
        console.error('Error fetching board data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // Si no hay destino o el destino es el mismo que el origen, no hacemos nada
    if (!destination || (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )) {
      return;
    }

    // Crear una copia profunda del estado actual
    const newData = JSON.parse(JSON.stringify(data));
    if (!newData) return;

    // Encontrar las columnas de origen y destino
    const sourceColumn = newData.columns.find((col: any) => col.id === source.droppableId);
    const destColumn = newData.columns.find((col: any) => col.id === destination.droppableId);

    if (!sourceColumn || !destColumn) return;

    // Remover la tarjeta de la columna de origen
    const [movedCard] = sourceColumn.cards.splice(source.index, 1);

    // Insertar la tarjeta en la columna de destino
    destColumn.cards.splice(destination.index, 0, movedCard);

    // Actualizar el estado localmente primero (optimistic update)
    setData(newData);

    // Enviar la actualización al servidor
    try {
      await updateCardOrder({
        sourceColumnId: source.droppableId,
        destinationColumnId: destination.droppableId,
        sourceIndex: source.index,
        destinationIndex: destination.index,
        cardId: draggableId,
      });
    } catch (error) {
      console.error('Error updating card order:', error);
      // En caso de error, podríamos revertir el cambio local
      const originalData = await getBoardData();
      setData(originalData);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Project Board</h1>
        <p className="text-gray-600">Manage your projects and tasks</p>
      </div>

      {/* Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex space-x-6 overflow-x-auto pb-6">
          {data.columns.map((column) => (
            <KanbanColumn key={column.id} column={column} />
          ))}

          {/* Add Column Button */}
          <button className="bg-gray-100 rounded-lg p-4 w-80 flex-shrink-0 h-16 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Add another list
          </button>
        </div>
      </DragDropContext>
    </div>
  );
}; 