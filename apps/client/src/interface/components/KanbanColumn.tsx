import { FunctionComponent } from 'preact';
import { Droppable } from '@hello-pangea/dnd';
import { KanbanCard } from './KanbanCard';

// Define a type for the cards that matches the column data structure
type ColumnCardType = {
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
};

interface KanbanColumnProps {
  column: {
    id: string;
    title: string;
    cards: Array<ColumnCardType>;
  };
  onCardUpdate?: (cardId: string, updates: Partial<ColumnCardType>) => void;
}

export const KanbanColumn: FunctionComponent<KanbanColumnProps> = ({ column, onCardUpdate }) => {
  // Convert column card format to KanbanCard format
  const convertCardFormat = (card: ColumnCardType) => {
    // Convert attachments from number to array of objects as expected by KanbanCard
    const attachments = card.attachments 
      ? Array.from({ length: card.attachments }).map((_, i) => ({
          id: `${card.id}-attachment-${i}`,
          url: '#',
          name: `Attachment ${i+1}`,
          type: 'file'
        })) 
      : undefined;

    return {
      ...card,
      attachments
    };
  };

  // Handle card updates and convert back to column format
  const handleCardUpdate = (cardId: string, updates: any) => {
    if (onCardUpdate) {
      // Convert attachments array back to number if it exists
      const columnUpdates = { ...updates };
      if (updates.attachments) {
        columnUpdates.attachments = updates.attachments.length;
      }
      onCardUpdate(cardId, columnUpdates);
    }
  };

  return (
    <div className="w-80 flex-shrink-0">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-gray-800 font-semibold">{column.title}</h2>
        <button className="text-gray-500 hover:text-gray-700">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>
      </div>

      {/* Droppable Area */}
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`min-h-[200px] rounded-lg p-2 ${
              snapshot.isDraggingOver ? 'bg-gray-100' : 'bg-gray-50'
            }`}
          >
            {column.cards.map((card, index) => (
              <KanbanCard
                key={card.id}
                card={convertCardFormat(card)}
                index={index}
                onUpdate={handleCardUpdate}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {/* Add Card Button */}
      <button className="w-full mt-2 p-2 flex items-center text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded">
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
        </svg>
        <span>Add a card</span>
      </button>
    </div>
  );
}; 