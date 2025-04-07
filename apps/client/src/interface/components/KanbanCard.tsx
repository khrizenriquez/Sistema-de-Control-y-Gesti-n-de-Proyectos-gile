import { FunctionComponent } from 'preact';
import { Draggable } from '@hello-pangea/dnd';
import { Card } from '../../domain/entities/Card';

interface KanbanCardProps {
  card: Card;
  index: number;
}

export const KanbanCard: FunctionComponent<KanbanCardProps> = ({ card, index }) => {
  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`bg-white rounded-lg shadow-sm p-3 mb-2 cursor-pointer hover:shadow-md transition-shadow ${
            snapshot.isDragging ? 'shadow-lg ring-2 ring-blue-500 ring-opacity-50' : ''
          }`}
        >
          {/* Título */}
          <h3 className="text-sm font-medium text-gray-800 mb-2">{card.title}</h3>

          {/* Metadatos */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-2">
              {/* Checklist Progress */}
              {card.checklistProgress && (
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span>{card.checklistProgress.completed}/{card.checklistProgress.total}</span>
                </div>
              )}

              {/* Attachments */}
              {card.attachments && (
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  <span>{card.attachments}</span>
                </div>
              )}
            </div>

            {/* Due Date */}
            {card.dueDate && (
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{card.dueDate}</span>
              </div>
            )}
          </div>

          {/* Assignee */}
          {card.assignee && (
            <div className="mt-2 flex justify-end">
              <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {card.assignee.avatar ? (
                  <img
                    src={card.assignee.avatar}
                    alt={card.assignee.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-medium text-gray-600">
                    {card.assignee.name[0]}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}; 