import { FunctionComponent } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { api } from '../../infrastructure/api';

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

interface Checklist {
  id: string;
  title: string;
  items: ChecklistItem[];
}

interface CardModalProps {
  card: {
    id: string;
    title: string;
    description?: string;
    dueDate?: string;
    assignee_id?: string;
    attachments?: Array<{
      id: string;
      url: string;
      name: string;
      type: string;
    }>;
    checklists?: Checklist[];
    cover?: {
      color?: string;
      image?: string;
    };
    assignee?: {
      id: string;
      name: string;
      avatar?: string;
    };
    cover_color?: string;
  };
  onClose: () => void;
  onUpdate: (cardId: string, updates: Partial<CardModalProps['card']>) => void;
  availableBoards?: Array<{
    id: string;
    title: string;
    lists: Array<{
      id: string;
      title: string;
    }>;
  }>;
  availableDevelopers?: Array<{
    id: string;
    name: string;
    email: string;
    avatar?: string;
  }>;
}

export const CardModal: FunctionComponent<CardModalProps> = ({ card, onClose, onUpdate, availableBoards, availableDevelopers }) => {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || '');
  const [isWatching, setIsWatching] = useState(false);
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [showAttachModal, setShowAttachModal] = useState(false);
  const [showCoverModal, setShowCoverModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [selectedColor, setSelectedColor] = useState(card.cover?.color || '');
  const [selectedAssignee, setSelectedAssignee] = useState(card.assignee_id || '');
  const [activities, setActivities] = useState<Array<{
    id: string;
    type: string;
    message: string;
    user: { name: string; avatar?: string };
    timestamp: string;
  }>>([]);
  const [comments, setComments] = useState<Array<{
    id: string;
    content: string;
    user_name: string;
    created_at: string;
  }>>([]);
  const [comment, setComment] = useState('');
  const [userInitial, setUserInitial] = useState('');
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  // Obtener información del usuario actual
  useEffect(() => {
    // En una implementación real, esto vendría del contexto de autenticación
    const userInfo = localStorage.getItem('userProfile');
    if (userInfo) {
      try {
        const user = JSON.parse(userInfo);
        setUserInitial(user.email ? user.email[0].toUpperCase() : 'U');
      } catch (e) {
        setUserInitial('U');
      }
    }
  }, [card.id]);

  // Manejadores para los modales
  const handleChecklistClick = () => {
    setShowChecklistModal(true);
  };

  const handleDateClick = () => {
    setShowDateModal(true);
  };

  const handleAttachmentClick = () => {
    setShowAttachModal(true);
  };

  const handleCoverClick = () => {
    setShowCoverModal(true);
  };

  const handleMoveClick = () => {
    setShowMoveModal(true);
  };

  const handleCopyClick = () => {
    setShowCopyModal(true);
  };

  const handleAssigneeChange = async (e: Event) => {
    const assigneeId = (e.target as HTMLSelectElement).value;
    const originalAssignee = selectedAssignee;
    
    try {
      setSelectedAssignee(assigneeId);
      
      if (assigneeId) {
        const developer = availableDevelopers?.find(dev => dev.id === assigneeId);
        
        // Asegurarnos de que estamos enviando el assignee_id correctamente
        const updates: Partial<CardModalProps['card']> = {
          assignee_id: assigneeId
        };

        // Si tenemos la información del desarrollador, también la incluimos
        if (developer) {
          updates.assignee = {
            id: developer.id,
            name: developer.name,
            avatar: developer.avatar
          };
        }
        
        console.log('Actualizando tarjeta con asignado:', updates);
        await onUpdate(card.id, updates);
      } else {
        // Si no hay asignado, enviamos undefined para ambos campos
        console.log('Eliminando asignado de la tarjeta');
        await onUpdate(card.id, {
          assignee_id: undefined,
          assignee: undefined
        });
      }
    } catch (error) {
      console.error('Error updating assignee:', error);
      // Reset to original value if there was an error
      setSelectedAssignee(originalAssignee);
    }
  };

  const saveChanges = () => {
    onUpdate(card.id, {
      title,
      description,
    });
  };

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    onUpdate(card.id, {
      cover: {
        ...card.cover,
        color
      },
      cover_color: color
    });
    // Cerrar el modal después de seleccionar un color
    setShowCoverModal(false);
  };

  useEffect(() => {
    // Inicializar el color basado en card.cover o card.cover_color
    if (card.cover?.color) {
      setSelectedColor(card.cover.color);
    } else if (card.cover_color) {
      setSelectedColor(card.cover_color);
    }
  }, [card.cover, card.cover_color]);

  // Función para cargar estados iniciales
  useEffect(() => {
    if (card.id) {
      // Cargar comentarios de la tarjeta
      const loadCardComments = async () => {
        try {
          setIsLoadingComments(true);
          const response = await api.get(`/api/boards/cards/${card.id}/comments`);
          if (response) {
            setComments(response.data);
          }
        } catch (error) {
          console.error('Error loading comments:', error);
        } finally {
          setIsLoadingComments(false);
        }
      };

      loadCardComments();
    }
    
    // Inicializar el asignado si existe
    if (card.assignee_id && availableDevelopers) {
      setSelectedAssignee(card.assignee_id);
    }
  }, [card.id]);

  const getHeaderStyle = () => {
    if (selectedColor) {
      return {
        backgroundColor: selectedColor,
        color: 'white',
        transition: 'background-color 0.3s ease'
      };
    }
    return {};
  };

  const handleClose = () => {
    saveChanges();
    onClose();
  };

  const handleAddComment = async () => {
    if (!comment.trim()) return;
    
    try {
      // Enviar comentario al backend
      const response = await api.post(`/api/boards/cards/${card.id}/comments`, { content: comment });
      
      if (response) {
        setComments(prev => [response.data, ...prev]);
        setComment('');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Error al añadir comentario. Por favor, intenta de nuevo.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-16 z-50">
      <div className="bg-gray-800 rounded-lg w-full max-w-2xl text-gray-100 shadow-xl">
        {/* Header with dynamic background color */}
        <div 
          className="flex justify-between items-start p-4 rounded-t-lg"
          style={getHeaderStyle()}
        >
          <div className="flex-1">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.currentTarget.value)}
              className="w-full text-xl font-semibold bg-transparent border-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
              placeholder="Título de la tarjeta"
              style={{ color: selectedColor ? 'white' : 'inherit' }}
              onBlur={saveChanges}
            />
            <div className="text-sm mt-1" style={{ color: selectedColor ? 'rgba(255,255,255,0.8)' : 'inherit' }}>
              in your inbox
            </div>
          </div>
          <button
            onClick={handleClose}
            className={selectedColor ? 'text-white hover:text-gray-200' : 'text-gray-400 hover:text-gray-200'}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex gap-8">
            {/* Left Column - Main Content */}
            <div className="flex-1 space-y-6">
              {/* Notifications */}
              <div className="space-y-2">
                <h3 className="text-sm text-gray-400">Notifications</h3>
                <button
                  onClick={() => setIsWatching(!isWatching)}
                  className="flex items-center space-x-2 text-gray-300 hover:text-gray-100"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span>Watch</span>
                  {isWatching && <span className="text-blue-400">(Watching)</span>}
                </button>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h3 className="text-sm text-gray-400">Description</h3>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.currentTarget.value)}
                  onBlur={saveChanges}
                  className="w-full h-32 bg-gray-700 text-gray-100 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 border-none"
                  placeholder="Add a more detailed description..."
                />
              </div>

              {/* Checklists - Moved here after description */}
              {card.checklists?.map((checklist) => (
                <div key={checklist.id} className="space-y-2 bg-gray-700/50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-200">{checklist.title}</h3>
                    <button className="text-sm text-gray-400 hover:text-gray-200">Delete</button>
                  </div>
                  <div className="space-y-2">
                    {checklist.items.map((item) => (
                      <div key={item.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={item.completed}
                          className="rounded border-gray-400 text-blue-500 focus:ring-blue-500"
                        />
                        <span className={`text-gray-300 ${item.completed ? 'line-through' : ''}`}>
                          {item.text}
                        </span>
                      </div>
                    ))}
                    <button className="text-gray-400 hover:text-gray-200 text-sm">
                      + Add an item
                    </button>
                  </div>
                </div>
              ))}

              {/* Activity */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm text-gray-400">Activity</h3>
                  <button className="text-sm text-gray-400 hover:text-gray-200">Show details</button>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                    {userInitial}
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={comment}
                      onChange={(e) => setComment(e.currentTarget.value)}
                      className="w-full bg-gray-700 text-gray-100 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 border-none"
                      placeholder="Write a comment..."
                      onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                    />
                  </div>
                </div>
                
                {/* Historial de actividades */}
                <div className="mt-4 space-y-4">
                  {isLoadingComments ? (
                    <div className="text-center py-4">
                      <div className="animate-pulse flex space-x-4 items-center">
                        <div className="rounded-full bg-gray-700 h-10 w-10"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                          <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                        </div>
                      </div>
                    </div>
                  ) : comments.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      No hay comentarios. ¡Sé el primero en comentar!
                    </div>
                  ) : (
                    comments.map(comment => (
                      <div key={comment.id} className="flex items-start space-x-3">
                        <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white font-medium">
                          {comment.user_name[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm">
                            <span className="font-medium text-gray-300">{comment.user_name}</span>
                            <span className="text-gray-500 ml-2">{new Date(comment.created_at).toLocaleString()}</span>
                          </div>
                          <p className="text-gray-300">{comment.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Sidebar */}
            <div className="w-60 space-y-4">
              <div className="text-center font-semibold text-gray-200 uppercase text-xs border-b border-gray-700 pb-2">
                AÑADIR A TARJETA
              </div>

              {/* Asignar a */}
              <div>
                <h4 className="text-sm text-gray-400 mb-2">Asignar a</h4>
                <select
                  value={selectedAssignee || ''}
                  onChange={handleAssigneeChange}
                  className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sin asignar</option>
                  {availableDevelopers?.map(dev => (
                    <option key={dev.id} value={dev.id}>
                      {dev.name || dev.email}
                    </option>
                  ))}
                </select>
              </div>

              {/* Checklist */}
              <button
                onClick={handleChecklistClick}
                className="w-full flex items-center space-x-2 p-2 rounded bg-gray-700 hover:bg-gray-600 text-gray-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 14l2 2 4-4" />
                </svg>
                <span>Checklist</span>
              </button>

              {/* Date */}
              <button
                onClick={handleDateClick}
                className="w-full flex items-center space-x-2 p-2 rounded bg-gray-700 hover:bg-gray-600 text-gray-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Dates</span>
              </button>

              {/* Attachment */}
              <button
                onClick={handleAttachmentClick}
                className="w-full flex items-center space-x-2 p-2 rounded bg-gray-700 hover:bg-gray-600 text-gray-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                <span>Attachment</span>
              </button>

              {/* Cover */}
              <button
                onClick={handleCoverClick}
                className="w-full flex items-center space-x-2 p-2 rounded bg-gray-700 hover:bg-gray-600 text-gray-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Cover</span>
              </button>

              <div className="text-center font-semibold text-gray-200 uppercase text-xs border-b border-gray-700 py-2">
                ACCIONES
              </div>

              {/* Move */}
              <button
                onClick={handleMoveClick}
                className="w-full flex items-center space-x-2 p-2 rounded bg-gray-700 hover:bg-gray-600 text-gray-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
                <span>Move</span>
              </button>

              {/* Copy */}
              <button
                onClick={handleCopyClick}
                className="w-full flex items-center space-x-2 p-2 rounded bg-gray-700 hover:bg-gray-600 text-gray-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                </svg>
                <span>Copy</span>
              </button>

              {/* Archive */}
              <button
                className="w-full flex items-center space-x-2 p-2 rounded bg-gray-700 hover:bg-gray-600 text-gray-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                <span>Archive</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cover Modal */}
      {showCoverModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-4 w-96">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-100">Cover</h3>
              <button
                onClick={() => setShowCoverModal(false)}
                className="text-gray-400 hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Size</label>
                <div className="grid grid-cols-2 gap-2">
                  <button className="p-4 border-2 border-gray-600 rounded hover:border-blue-500 focus:border-blue-500">
                    <div className="h-8 bg-gray-600 rounded mb-2"></div>
                    <div className="h-2 bg-gray-600 rounded w-3/4"></div>
                  </button>
                  <button className="p-4 border-2 border-gray-600 rounded hover:border-blue-500 focus:border-blue-500">
                    <div className="h-16 bg-gray-600 rounded mb-2"></div>
                    <div className="h-2 bg-gray-600 rounded w-3/4"></div>
                  </button>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm text-gray-400">Colors</label>
                  <button 
                    className="text-sm text-gray-400 hover:text-gray-200"
                    onClick={() => {
                      setSelectedColor('');
                      handleColorSelect('');
                    }}
                  >
                    Remove cover
                  </button>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    '#4CAF50', // green
                    '#FFC107', // yellow
                    '#FF9800', // orange
                    '#F44336', // red
                    '#9C27B0', // purple
                    '#2196F3', // blue
                    '#009688', // teal
                    '#8BC34A', // light green
                    '#E91E63', // pink
                    '#607D8B'  // gray
                  ].map((color) => (
                    <button
                      key={color}
                      onClick={() => handleColorSelect(color)}
                      className={`w-full h-8 rounded transition-all duration-200 hover:ring-2 hover:ring-offset-2 hover:ring-offset-gray-800 hover:ring-opacity-50`}
                      style={{
                        backgroundColor: color,
                        border: selectedColor === color ? '2px solid white' : 'none'
                      }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  <input
                    type="checkbox"
                    className="mr-2 rounded border-gray-600"
                  />
                  Enable colorblind friendly mode
                </label>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Attachments</label>
                <button className="w-full py-2 px-4 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors">
                  Upload a cover image
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  Tip: Drag an image onto the card to upload it.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modales */}
      {showChecklistModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-4 w-96">
            <h3 className="text-lg font-semibold text-gray-100 mb-4">Add checklist</h3>
            <input
              type="text"
              placeholder="Checklist"
              className="w-full bg-gray-700 text-gray-100 rounded-lg p-2 mb-4"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowChecklistModal(false)}
                className="px-4 py-2 text-gray-400 hover:text-gray-200"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {showDateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-4 w-96">
            <h3 className="text-lg font-semibold text-gray-100 mb-4">Dates</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Start date</label>
                <input
                  type="date"
                  className="w-full bg-gray-700 text-gray-100 rounded-lg p-2"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Due date</label>
                <input
                  type="date"
                  className="w-full bg-gray-700 text-gray-100 rounded-lg p-2"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Set due date reminder</label>
                <select className="w-full bg-gray-700 text-gray-100 rounded-lg p-2">
                  <option>None</option>
                  <option>At time of due date</option>
                  <option>5 minutes before</option>
                  <option>15 minutes before</option>
                  <option>1 hour before</option>
                  <option>1 day before</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => setShowDateModal(false)}
                className="px-4 py-2 text-gray-400 hover:text-gray-200"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showAttachModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-4 w-96">
            <h3 className="text-lg font-semibold text-gray-100 mb-4">Attach</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Attach a file</label>
                <input
                  type="file"
                  className="w-full bg-gray-700 text-gray-100 rounded-lg p-2"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Or paste a link</label>
                <input
                  type="text"
                  placeholder="Paste any link here..."
                  className="w-full bg-gray-700 text-gray-100 rounded-lg p-2"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => setShowAttachModal(false)}
                className="px-4 py-2 text-gray-400 hover:text-gray-200"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                Attach
              </button>
            </div>
          </div>
        </div>
      )}

      {showMoveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-4 w-96">
            <h3 className="text-lg font-semibold text-gray-100 mb-4">Move card</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Select destination</label>
                <select className="w-full bg-gray-700 text-gray-100 rounded-lg p-2 mb-2">
                  {availableBoards?.map(board => (
                    <option key={board.id} value={board.id}>{board.title}</option>
                  ))}
                </select>
                <select className="w-full bg-gray-700 text-gray-100 rounded-lg p-2">
                  {availableBoards?.[0]?.lists.map(list => (
                    <option key={list.id} value={list.id}>{list.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Position</label>
                <select className="w-full bg-gray-700 text-gray-100 rounded-lg p-2">
                  <option>1</option>
                  <option>2</option>
                  <option>3</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => setShowMoveModal(false)}
                className="px-4 py-2 text-gray-400 hover:text-gray-200"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                Move
              </button>
            </div>
          </div>
        </div>
      )}

      {showCopyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-4 w-96">
            <h3 className="text-lg font-semibold text-gray-100 mb-4">Copy card</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Title</label>
                <input
                  type="text"
                  value={`${card.title} - Copy`}
                  className="w-full bg-gray-700 text-gray-100 rounded-lg p-2"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Select destination</label>
                <select className="w-full bg-gray-700 text-gray-100 rounded-lg p-2 mb-2">
                  {availableBoards?.map(board => (
                    <option key={board.id} value={board.id}>{board.title}</option>
                  ))}
                </select>
                <select className="w-full bg-gray-700 text-gray-100 rounded-lg p-2">
                  {availableBoards?.[0]?.lists.map(list => (
                    <option key={list.id} value={list.id}>{list.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Keep...</label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded border-gray-600" />
                    <span className="text-gray-300">Members</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded border-gray-600" />
                    <span className="text-gray-300">Checklists</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded border-gray-600" />
                    <span className="text-gray-300">Due date</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => setShowCopyModal(false)}
                className="px-4 py-2 text-gray-400 hover:text-gray-200"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                Create card
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 