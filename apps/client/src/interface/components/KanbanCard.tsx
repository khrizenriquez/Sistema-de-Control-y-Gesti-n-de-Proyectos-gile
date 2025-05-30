import { FunctionComponent } from 'preact';
import { useState } from 'preact/hooks';
import { Draggable } from '@hello-pangea/dnd';
import { CardModal } from './CardModal';

// This interface should match what CardModal expects
interface CardData {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  attachments?: Array<{
    id: string;
    url: string;
    name: string;
    type: string;
  }>;
  checklistProgress?: {
    completed: number;
    total: number;
  };
  checklists?: Array<{
    id: string;
    title: string;
    items: Array<{
      id: string;
      text: string;
      completed: boolean;
    }>;
  }>;
  cover?: {
    color?: string;
    image?: string;
  };
  cover_color?: string;
  assignee?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

interface KanbanCardProps {
  card: CardData;
  index: number;
  onUpdate?: (cardId: string, updates: Partial<CardData>) => void;
  availableDevelopers?: Array<{
    id: string;
    name: string;
    email: string;
    avatar?: string;
  }>;
}

export const KanbanCard: FunctionComponent<KanbanCardProps> = ({ 
  card, 
  index, 
  onUpdate, 
  availableDevelopers 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCardClick = (e: MouseEvent) => {
    e.preventDefault();
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleCardUpdate = (cardId: string, updates: Partial<CardData>) => {
    if (onUpdate) {
      onUpdate(cardId, updates);
    }
    setIsModalOpen(false);
  };

  return (
    <>
      <Draggable draggableId={card.id} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            onClick={handleCardClick}
            className={`rounded-lg shadow-sm p-3 mb-2 cursor-pointer ${
              card.cover_color ? '' : 'bg-white hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-600'
            } ${
              snapshot.isDragging ? 'shadow-lg' : ''
            }`}
            style={card.cover_color ? { backgroundColor: card.cover_color, color: '#fff' } : {}}
          >
            {/* Card Title */}
            <h3 className={`font-medium mb-2 ${card.cover_color ? 'text-white' : 'text-gray-800 dark:text-white'}`}>{card.title}</h3>

            {/* Card Metadata */}
            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-300">
              {/* Due Date */}
              {card.dueDate && (
                <div className="flex items-center space-x-1">
                  <svg className={`w-4 h-4 ${card.cover_color ? 'text-white' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className={card.cover_color ? 'text-white' : ''}>{card.dueDate}</span>
                </div>
              )}

              {/* Attachments */}
              {card.attachments && card.attachments.length > 0 && (
                <div className="flex items-center space-x-1">
                  <svg className={`w-4 h-4 ${card.cover_color ? 'text-white' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  <span className={card.cover_color ? 'text-white' : ''}>{card.attachments.length}</span>
                </div>
              )}

              {/* Checklist Progress */}
              {card.checklistProgress && (
                <div className="flex items-center space-x-1">
                  <svg className={`w-4 h-4 ${card.cover_color ? 'text-white' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span className={card.cover_color ? 'text-white' : ''}>{card.checklistProgress.completed}/{card.checklistProgress.total}</span>
                </div>
              )}
            </div>

            {/* Assignee */}
            {card.assignee && (
              <div className="mt-2 flex justify-end">
                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  {card.assignee.avatar ? (
                    <img src={card.assignee.avatar} alt={card.assignee.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-medium text-gray-600">{card.assignee.name[0]}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Draggable>

      {/* Card Modal */}
      {isModalOpen && (
        <CardModal
          card={{
            id: card.id,
            title: card.title,
            description: card.description,
            dueDate: card.dueDate,
            attachments: card.attachments,
            checklists: card.checklists,
            cover: card.cover_color ? { color: card.cover_color } : card.cover,
            assignee: card.assignee,
            assignee_id: card.assignee?.id
          }}
          onClose={handleModalClose}
          onUpdate={handleCardUpdate}
          availableDevelopers={availableDevelopers}
        />
      )}
    </>
  );
}; 