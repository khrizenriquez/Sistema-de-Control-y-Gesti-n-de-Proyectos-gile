import { FunctionComponent } from 'preact';
import { Droppable } from '@hello-pangea/dnd';
import { Column } from '../../domain/entities/Column';
import { KanbanCard } from './KanbanCard';

interface KanbanColumnProps {
  column: Column;
}

export const KanbanColumn: FunctionComponent<KanbanColumnProps> = ({ column }) => {
  return (
    <div className="bg-gray-100 rounded-lg p-4 w-80 flex-shrink-0">
      {/* Encabezado de la columna */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-700">{column.title}</h2>
        <button className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
          </svg>
        </button>
      </div>

      {/* Área donde se pueden soltar las tarjetas */}
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`min-h-[200px] transition-colors ${
              snapshot.isDraggingOver ? 'bg-blue-50' : ''
            }`}
          >
            {column.cards.map((card, index) => (
              <KanbanCard key={card.id} card={card} index={index} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {/* Botón para agregar tarjeta */}
      <button className="w-full mt-3 py-2 text-gray-600 text-sm hover:bg-gray-200 rounded transition-colors flex items-center justify-center">
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
        </svg>
        Add a card...
      </button>
    </div>
  );
}; 