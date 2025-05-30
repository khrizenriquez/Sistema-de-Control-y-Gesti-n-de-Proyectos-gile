import { useState, useEffect } from 'preact/hooks';
import { useRoute } from 'wouter-preact';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../infrastructure/api';

interface Sprint {
  id: string;
  name: string;
  project_id: string;
  goal?: string;
  start_date?: string;
  end_date?: string;
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  duration_days?: number;
  stories_count: number;
  completed_stories_count: number;
  created_at: string;
}

interface Project {
  id: string;
  name: string;
}

export const SprintManagementPage = () => {
  const [match, params] = useRoute('/projects/:projectId/sprints');
  const { isDarkTheme } = useTheme();
  const { user } = useAuth();
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const [newSprint, setNewSprint] = useState({
    name: '',
    goal: '',
    duration_weeks: 2,
    start_date: ''
  });

  const projectId = params?.projectId;

  const fetchData = async () => {
    if (!projectId) return;
    
    try {
      setLoading(true);
      
      // Obtener información del proyecto
      const projectResponse = await api.get(`/api/projects/${projectId}`);
      setProject(projectResponse.data);
      
      // Obtener sprints del proyecto
      const sprintsResponse = await api.get(`/api/sprints/project/${projectId}`);
      setSprints(sprintsResponse.data);
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const handleCreateSprint = async () => {
    if (!projectId || !newSprint.name) return;
    
    try {
      const sprintData = {
        name: newSprint.name,
        project_id: projectId,
        goal: newSprint.goal || undefined,
        duration_weeks: newSprint.duration_weeks,
        start_date: newSprint.start_date || undefined
      };
      
      await api.post('/api/sprints/', sprintData);
      setShowCreateModal(false);
      setNewSprint({ name: '', goal: '', duration_weeks: 2, start_date: '' });
      fetchData();
      
    } catch (error) {
      console.error('Error creating sprint:', error);
      alert('Error creando el sprint');
    }
  };

  const handleStartSprint = async (sprintId: string) => {
    try {
      await api.post(`/api/sprints/${sprintId}/start`);
      fetchData();
    } catch (error) {
      console.error('Error starting sprint:', error);
      alert('Error iniciando el sprint');
    }
  };

  const handleCompleteSprint = async (sprintId: string) => {
    try {
      await api.post(`/api/sprints/${sprintId}/complete`);
      fetchData();
    } catch (error) {
      console.error('Error completing sprint:', error);
      alert('Error completando el sprint');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'completed': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${isDarkTheme ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className={`mt-4 ${isDarkTheme ? 'text-gray-300' : 'text-gray-600'}`}>Cargando sprints...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-6 ${isDarkTheme ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                Gestión de Sprints
              </h1>
              <p className={`mt-1 ${isDarkTheme ? 'text-gray-300' : 'text-gray-600'}`}>
                Proyecto: {project?.name}
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 md:mt-0 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Crear Sprint
            </button>
          </div>
        </div>

        {/* Sprints List */}
        <div className="space-y-4">
          {sprints.map((sprint) => (
            <div key={sprint.id} className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6`}>
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className={`text-lg font-semibold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                      {sprint.name}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(sprint.status)}`}>
                      {sprint.status}
                    </span>
                  </div>
                  
                  {sprint.goal && (
                    <p className={`text-sm mb-3 ${isDarkTheme ? 'text-gray-300' : 'text-gray-600'}`}>
                      <strong>Objetivo:</strong> {sprint.goal}
                    </p>
                  )}
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className={`block font-medium ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
                        Duración
                      </span>
                      <span className={isDarkTheme ? 'text-white' : 'text-gray-900'}>
                        {sprint.duration_days || '--'} días
                      </span>
                    </div>
                    
                    <div>
                      <span className={`block font-medium ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
                        Fecha inicio
                      </span>
                      <span className={isDarkTheme ? 'text-white' : 'text-gray-900'}>
                        {sprint.start_date ? formatDate(sprint.start_date) : '--'}
                      </span>
                    </div>
                    
                    <div>
                      <span className={`block font-medium ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
                        Fecha fin
                      </span>
                      <span className={isDarkTheme ? 'text-white' : 'text-gray-900'}>
                        {sprint.end_date ? formatDate(sprint.end_date) : '--'}
                      </span>
                    </div>
                    
                    <div>
                      <span className={`block font-medium ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
                        Progreso
                      </span>
                      <span className={isDarkTheme ? 'text-white' : 'text-gray-900'}>
                        {sprint.completed_stories_count}/{sprint.stories_count} historias
                      </span>
                    </div>
                  </div>
                  
                  {/* Barra de progreso */}
                  {sprint.stories_count > 0 && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className={isDarkTheme ? 'text-gray-400' : 'text-gray-500'}>
                          Completación
                        </span>
                        <span className={isDarkTheme ? 'text-white' : 'text-gray-900'}>
                          {Math.round((sprint.completed_stories_count / sprint.stories_count) * 100)}%
                        </span>
                      </div>
                      <div className={`w-full h-2 rounded-full ${isDarkTheme ? 'bg-gray-700' : 'bg-gray-200'}`}>
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(sprint.completed_stories_count / sprint.stories_count) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  
                  {/* Días restantes para sprints activos */}
                  {sprint.status === 'active' && sprint.end_date && (
                    <div className="mt-3">
                      <span className={`text-sm font-medium ${isDarkTheme ? 'text-yellow-400' : 'text-yellow-600'}`}>
                        {calculateDaysRemaining(sprint.end_date)} días restantes
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Actions */}
                <div className="mt-4 lg:mt-0 lg:ml-6 flex space-x-2">
                  {sprint.status === 'planning' && (
                    <button
                      onClick={() => handleStartSprint(sprint.id)}
                      className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                    >
                      Iniciar
                    </button>
                  )}
                  
                  {sprint.status === 'active' && (
                    <button
                      onClick={() => handleCompleteSprint(sprint.id)}
                      className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                    >
                      Completar
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {sprints.length === 0 && (
            <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center`}>
              <p className={`text-lg ${isDarkTheme ? 'text-gray-300' : 'text-gray-600'}`}>
                No hay sprints creados para este proyecto
              </p>
              <p className={`text-sm mt-2 ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
                Crea tu primer sprint para comenzar con la metodología Scrum
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create Sprint Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-md mx-4">
            <h3 className={`text-lg font-semibold mb-4 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
              Crear Nuevo Sprint
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                  Nombre del sprint:
                </label>
                <input
                  type="text"
                  value={newSprint.name}
                  onChange={(e) => setNewSprint(prev => ({ ...prev, name: (e.target as HTMLInputElement).value }))}
                  placeholder="Sprint 1"
                  className={`w-full p-2 border rounded-lg ${isDarkTheme ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  required
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                  Objetivo del sprint (opcional):
                </label>
                <textarea
                  value={newSprint.goal}
                  onChange={(e) => setNewSprint(prev => ({ ...prev, goal: (e.target as HTMLTextAreaElement).value }))}
                  placeholder="Implementar funcionalidades básicas de usuario"
                  className={`w-full p-2 border rounded-lg ${isDarkTheme ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  rows={3}
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                  Duración en semanas:
                </label>
                <select
                  value={newSprint.duration_weeks}
                  onChange={(e) => setNewSprint(prev => ({ ...prev, duration_weeks: parseInt((e.target as HTMLSelectElement).value) }))}
                  className={`w-full p-2 border rounded-lg ${isDarkTheme ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                >
                  <option value={1}>1 semana</option>
                  <option value={2}>2 semanas</option>
                  <option value={3}>3 semanas</option>
                  <option value={4}>4 semanas</option>
                </select>
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                  Fecha de inicio (opcional):
                </label>
                <input
                  type="date"
                  value={newSprint.start_date}
                  onChange={(e) => setNewSprint(prev => ({ ...prev, start_date: (e.target as HTMLInputElement).value }))}
                  className={`w-full p-2 border rounded-lg ${isDarkTheme ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewSprint({ name: '', goal: '', duration_weeks: 2, start_date: '' });
                }}
                className={`px-4 py-2 rounded-lg ${isDarkTheme ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateSprint}
                disabled={!newSprint.name}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg disabled:opacity-50"
              >
                Crear Sprint
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 