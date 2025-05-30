import { useState, useEffect } from 'preact/hooks';
import { api } from '../../infrastructure/api';

interface SprintInfo {
  project_id: string;
  project_name: string;
  active_sprint?: {
    id: string;
    name: string;
    goal?: string;
    start_date?: string;
    end_date?: string;
    status: string;
    days_remaining?: number;
    stories_count: number;
    completed_stories_count: number;
    progress_percentage: number;
  };
  message?: string;
}

interface SprintInfoProps {
  boardId: string;
  isDarkTheme: boolean;
}

export const SprintInfo = ({ boardId, isDarkTheme }: SprintInfoProps) => {
  const [sprintInfo, setSprintInfo] = useState<SprintInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSprintInfo = async () => {
      try {
        const response = await api.get(`/api/boards/${boardId}/sprint`);
        setSprintInfo(response.data);
      } catch (error) {
        console.error('Error fetching sprint info:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSprintInfo();
  }, [boardId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'planning': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'completed': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!sprintInfo || !sprintInfo.active_sprint) {
    return (
      <div className={`bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6`}>
        <div className="flex items-center">
          <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className={`text-sm font-medium ${isDarkTheme ? 'text-yellow-400' : 'text-yellow-800'}`}>
              No hay sprint activo
            </p>
            <p className={`text-xs ${isDarkTheme ? 'text-yellow-300' : 'text-yellow-700'}`}>
              {sprintInfo?.message || 'Crea y activa un sprint para comenzar'}
            </p>
          </div>
        </div>
        <div className="mt-3">
          <a 
            href={`/projects/${sprintInfo?.project_id}/sprints`}
            className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-medium ${
              isDarkTheme 
                ? 'bg-yellow-700 text-yellow-100 hover:bg-yellow-600' 
                : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
            }`}
          >
            Gestionar Sprints
          </a>
        </div>
      </div>
    );
  }

  const sprint = sprintInfo.active_sprint;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <h3 className={`font-semibold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
            {sprint.name}
          </h3>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(sprint.status)}`}>
            {sprint.status}
          </span>
        </div>
        
        <a 
          href={`/projects/${sprintInfo.project_id}/sprints`}
          className={`text-xs ${isDarkTheme ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'}`}
        >
          Ver todos los sprints
        </a>
      </div>

      {sprint.goal && (
        <p className={`text-sm mb-3 ${isDarkTheme ? 'text-gray-300' : 'text-gray-600'}`}>
          <strong>Objetivo:</strong> {sprint.goal}
        </p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
        {sprint.start_date && (
          <div>
            <span className={`block font-medium ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
              Inicio
            </span>
            <span className={isDarkTheme ? 'text-white' : 'text-gray-900'}>
              {formatDate(sprint.start_date)}
            </span>
          </div>
        )}
        
        {sprint.end_date && (
          <div>
            <span className={`block font-medium ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
              Fin
            </span>
            <span className={isDarkTheme ? 'text-white' : 'text-gray-900'}>
              {formatDate(sprint.end_date)}
            </span>
          </div>
        )}
        
        {sprint.days_remaining !== undefined && (
          <div>
            <span className={`block font-medium ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
              Días restantes
            </span>
            <span className={`font-medium ${
              sprint.days_remaining <= 3 
                ? (isDarkTheme ? 'text-red-400' : 'text-red-600')
                : sprint.days_remaining <= 7
                ? (isDarkTheme ? 'text-yellow-400' : 'text-yellow-600')
                : (isDarkTheme ? 'text-green-400' : 'text-green-600')
            }`}>
              {sprint.days_remaining}
            </span>
          </div>
        )}
        
        <div>
          <span className={`block font-medium ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
            Progreso
          </span>
          <span className={isDarkTheme ? 'text-white' : 'text-gray-900'}>
            {sprint.completed_stories_count}/{sprint.stories_count}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      {sprint.stories_count > 0 && (
        <div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className={`text-xs ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
              Completación del Sprint
            </span>
            <span className={`text-xs font-medium ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
              {sprint.progress_percentage}%
            </span>
          </div>
          <div className={`w-full h-2 rounded-full ${isDarkTheme ? 'bg-gray-700' : 'bg-gray-200'}`}>
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${sprint.progress_percentage}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
}; 