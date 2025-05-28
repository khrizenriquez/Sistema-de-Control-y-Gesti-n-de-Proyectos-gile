import { useState, useEffect } from 'preact/hooks';
import { useRoute } from 'wouter-preact';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../infrastructure/api';

interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'critical';
  completion_percentage: number;
  start_date?: string;
  planned_end_date?: string;
  actual_end_date?: string;
  client_name?: string;
  project_manager_id?: string;
  created_at: string;
  created_by: string;
}

interface ProjectHealth {
  project_id: string;
  status: string;
  completion_percentage: number;
  is_overdue: boolean;
  days_remaining?: number;
  risk_level: 'low' | 'medium' | 'high';
  risk_factors: string[];
  stats: {
    total_stories: number;
    completed_stories: number;
    total_tasks: number;
    completed_tasks: number;
    completion_percentage: number;
  };
  overdue_sprints: number;
  overdue_milestones: number;
}

interface Milestone {
  id: string;
  name: string;
  description?: string;
  due_date: string;
  completed_at?: string;
  is_completed: boolean;
  is_overdue: boolean;
}

export const ProjectLifecyclePage = () => {
  const [match, params] = useRoute('/projects/:id/lifecycle');
  const { isDarkTheme } = useTheme();
  const [project, setProject] = useState<Project | null>(null);
  const [health, setHealth] = useState<ProjectHealth | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  
  const [statusAction, setStatusAction] = useState<'start' | 'complete' | 'pause' | 'resume' | 'cancel' | 'archive'>('start');
  const [reason, setReason] = useState('');
  const [startDate, setStartDate] = useState('');
  const [plannedEndDate, setPlannedEndDate] = useState('');
  const [milestoneName, setMilestoneName] = useState('');
  const [milestoneDescription, setMilestoneDescription] = useState('');
  const [milestoneDueDate, setMilestoneDueDate] = useState('');

  const projectId = params?.id;

  const fetchProjectData = async () => {
    if (!projectId) return;
    
    try {
      setLoading(true);
      
      // Fetch project details
      const projectResponse = await api.get(`/api/projects/${projectId}`);
      setProject(projectResponse.data);
      
      // Fetch project health
      const healthResponse = await api.get(`/api/projects/${projectId}/health`);
      setHealth(healthResponse.data);
      
      // Fetch milestones
      const milestonesResponse = await api.get(`/api/projects/${projectId}/milestones`);
      setMilestones(milestonesResponse.data);
      
    } catch (error) {
      console.error('Error fetching project data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  const handleStatusChange = async () => {
    if (!projectId) return;
    
    try {
      let endpoint = '';
      let data = {};
      
      switch (statusAction) {
        case 'start':
          endpoint = `/api/projects/${projectId}/start`;
          if (startDate) data = { start_date: startDate };
          break;
        case 'complete':
          endpoint = `/api/projects/${projectId}/complete`;
          if (reason) data = { completion_notes: reason };
          break;
        case 'pause':
          endpoint = `/api/projects/${projectId}/pause`;
          if (reason) data = { reason };
          break;
        case 'resume':
          endpoint = `/api/projects/${projectId}/resume`;
          break;
        case 'cancel':
          endpoint = `/api/projects/${projectId}/cancel`;
          data = { reason };
          break;
        case 'archive':
          endpoint = `/api/projects/${projectId}/archive`;
          break;
      }
      
      await api.post(endpoint, data);
      setShowStatusModal(false);
      setReason('');
      fetchProjectData();
      
    } catch (error) {
      console.error('Error updating project status:', error);
      alert('Error actualizando el estado del proyecto');
    }
  };

  const handleDateUpdate = async () => {
    if (!projectId) return;
    
    try {
      const data: any = {};
      if (startDate) data.start_date = startDate;
      if (plannedEndDate) data.planned_end_date = plannedEndDate;
      
      await api.put(`/api/projects/${projectId}/dates`, data);
      setShowDateModal(false);
      setStartDate('');
      setPlannedEndDate('');
      fetchProjectData();
      
    } catch (error) {
      console.error('Error updating project dates:', error);
      alert('Error actualizando las fechas del proyecto');
    }
  };

  const handleCreateMilestone = async () => {
    if (!projectId || !milestoneName || !milestoneDueDate) return;
    
    try {
      const data = {
        name: milestoneName,
        description: milestoneDescription,
        due_date: milestoneDueDate
      };
      
      await api.post(`/api/projects/${projectId}/milestones`, data);
      setShowMilestoneModal(false);
      setMilestoneName('');
      setMilestoneDescription('');
      setMilestoneDueDate('');
      fetchProjectData();
      
    } catch (error) {
      console.error('Error creating milestone:', error);
      alert('Error creando el hito');
    }
  };

  const updateCompletion = async () => {
    if (!projectId) return;
    
    try {
      await api.post(`/api/projects/${projectId}/update-completion`);
      fetchProjectData();
    } catch (error) {
      console.error('Error updating completion:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'on_hold': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'archived': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 dark:text-green-400';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400';
      case 'high': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getAvailableActions = (status: string) => {
    switch (status) {
      case 'planning':
        return [{ action: 'start', label: 'Iniciar Proyecto', needsReason: false }];
      case 'active':
        return [
          { action: 'complete', label: 'Completar Proyecto', needsReason: false },
          { action: 'pause', label: 'Pausar Proyecto', needsReason: true },
          { action: 'cancel', label: 'Cancelar Proyecto', needsReason: true }
        ];
      case 'on_hold':
        return [
          { action: 'resume', label: 'Reanudar Proyecto', needsReason: false },
          { action: 'cancel', label: 'Cancelar Proyecto', needsReason: true }
        ];
      case 'completed':
      case 'cancelled':
        return [{ action: 'archive', label: 'Archivar Proyecto', needsReason: false }];
      default:
        return [];
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${isDarkTheme ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className={`mt-4 ${isDarkTheme ? 'text-gray-300' : 'text-gray-600'}`}>Cargando información del proyecto...</p>
        </div>
      </div>
    );
  }

  if (!project || !health) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${isDarkTheme ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <p className={`text-lg ${isDarkTheme ? 'text-gray-300' : 'text-gray-600'}`}>Proyecto no encontrado</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-6 ${isDarkTheme ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                {project.name}
              </h1>
              <p className={`mt-1 ${isDarkTheme ? 'text-gray-300' : 'text-gray-600'}`}>
                {project.description}
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
                {project.status}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(project.priority)}`}>
                {project.priority}
              </span>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Project Health */}
          <div className="lg:col-span-2 space-y-6">
            {/* Health Status */}
            <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-lg font-semibold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                  Estado de Salud del Proyecto
                </h2>
                <button
                  onClick={updateCompletion}
                  className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Actualizar
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm ${isDarkTheme ? 'text-gray-300' : 'text-gray-600'}`}>
                      Progreso General
                    </span>
                    <span className={`text-sm font-medium ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                      {Math.round(health.completion_percentage)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${health.completion_percentage}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${isDarkTheme ? 'text-gray-300' : 'text-gray-600'}`}>
                      Nivel de Riesgo
                    </span>
                    <span className={`text-sm font-medium capitalize ${getRiskColor(health.risk_level)}`}>
                      {health.risk_level}
                    </span>
                  </div>
                  {health.days_remaining !== null && (
                    <p className={`text-sm mt-1 ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
                      {health.is_overdue ? 
                        'Proyecto atrasado' : 
                        `${health.days_remaining} días restantes`
                      }
                    </p>
                  )}
                </div>
              </div>

              {health.risk_factors.length > 0 && (
                <div className="mt-4">
                  <h3 className={`text-sm font-medium mb-2 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                    Factores de Riesgo:
                  </h3>
                  <ul className="space-y-1">
                    {health.risk_factors.map((factor, index) => (
                      <li key={index} className={`text-sm ${isDarkTheme ? 'text-red-400' : 'text-red-600'}`}>
                        • {factor}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Statistics */}
            <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6`}>
              <h2 className={`text-lg font-semibold mb-4 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                Estadísticas del Proyecto
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                    {health.stats.completed_stories}
                  </div>
                  <div className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
                    de {health.stats.total_stories} Historias
                  </div>
                </div>
                
                <div className="text-center">
                  <div className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                    {health.stats.completed_tasks}
                  </div>
                  <div className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
                    de {health.stats.total_tasks} Tareas
                  </div>
                </div>
                
                <div className="text-center">
                  <div className={`text-2xl font-bold ${health.overdue_sprints > 0 ? 'text-red-500' : (isDarkTheme ? 'text-white' : 'text-gray-900')}`}>
                    {health.overdue_sprints}
                  </div>
                  <div className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
                    Sprints Atrasados
                  </div>
                </div>
                
                <div className="text-center">
                  <div className={`text-2xl font-bold ${health.overdue_milestones > 0 ? 'text-red-500' : (isDarkTheme ? 'text-white' : 'text-gray-900')}`}>
                    {health.overdue_milestones}
                  </div>
                  <div className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
                    Hitos Atrasados
                  </div>
                </div>
              </div>
            </div>

            {/* Milestones */}
            <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-lg font-semibold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                  Hitos del Proyecto
                </h2>
                <button
                  onClick={() => setShowMilestoneModal(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Agregar Hito
                </button>
              </div>
              
              <div className="space-y-3">
                {milestones.map((milestone) => (
                  <div 
                    key={milestone.id}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      milestone.is_completed ? 
                        'bg-green-50 dark:bg-green-900/20' : 
                        milestone.is_overdue ? 
                          'bg-red-50 dark:bg-red-900/20' :
                          'bg-gray-50 dark:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        milestone.is_completed ? 'bg-green-500' :
                        milestone.is_overdue ? 'bg-red-500' : 'bg-yellow-500'
                      }`}></div>
                      <div>
                        <h3 className={`font-medium ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                          {milestone.name}
                        </h3>
                        <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
                          {new Date(milestone.due_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    {milestone.is_overdue && !milestone.is_completed && (
                      <span className="text-sm text-red-600 dark:text-red-400 font-medium">
                        Atrasado
                      </span>
                    )}
                    
                    {milestone.is_completed && (
                      <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                        Completado
                      </span>
                    )}
                  </div>
                ))}
                
                {milestones.length === 0 && (
                  <p className={`text-center py-8 ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
                    No hay hitos definidos para este proyecto
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Actions */}
          <div className="space-y-6">
            {/* Project Actions */}
            <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6`}>
              <h2 className={`text-lg font-semibold mb-4 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                Acciones del Proyecto
              </h2>
              
              <div className="space-y-3">
                {getAvailableActions(project.status).map((action) => (
                  <button
                    key={action.action}
                    onClick={() => {
                      setStatusAction(action.action as any);
                      setShowStatusModal(true);
                    }}
                    className={`w-full px-4 py-2 text-left rounded-lg transition-colors ${
                      action.action === 'cancel' ? 
                        'bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-400' :
                      action.action === 'complete' ?
                        'bg-green-50 hover:bg-green-100 text-green-700 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:text-green-400' :
                        'bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:text-blue-400'
                    }`}
                  >
                    {action.label}
                  </button>
                ))}
                
                <button
                  onClick={() => setShowDateModal(true)}
                  className="w-full px-4 py-2 text-left rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300 transition-colors"
                >
                  Actualizar Fechas
                </button>
              </div>
            </div>

            {/* Project Dates */}
            <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6`}>
              <h2 className={`text-lg font-semibold mb-4 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                Fechas del Proyecto
              </h2>
              
              <div className="space-y-3">
                {project.start_date && (
                  <div>
                    <span className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>Inicio:</span>
                    <p className={`${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                      {new Date(project.start_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
                
                {project.planned_end_date && (
                  <div>
                    <span className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>Fin Planificado:</span>
                    <p className={`${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                      {new Date(project.planned_end_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
                
                {project.actual_end_date && (
                  <div>
                    <span className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>Fin Real:</span>
                    <p className={`${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                      {new Date(project.actual_end_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Info */}
            <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6`}>
              <h2 className={`text-lg font-semibold mb-4 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                Información Adicional
              </h2>
              
              <div className="space-y-3">
                <div>
                  <span className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>Creado por:</span>
                  <p className={`${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                    {project.created_by}
                  </p>
                </div>
                
                <div>
                  <span className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>Fecha de creación:</span>
                  <p className={`${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                    {new Date(project.created_at).toLocaleDateString()}
                  </p>
                </div>
                
                {project.client_name && (
                  <div>
                    <span className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>Cliente:</span>
                    <p className={`${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                      {project.client_name}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Change Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-md mx-4">
            <h3 className={`text-lg font-semibold mb-4 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
              {statusAction === 'start' && 'Iniciar Proyecto'}
              {statusAction === 'complete' && 'Completar Proyecto'}
              {statusAction === 'pause' && 'Pausar Proyecto'}
              {statusAction === 'resume' && 'Reanudar Proyecto'}
              {statusAction === 'cancel' && 'Cancelar Proyecto'}
              {statusAction === 'archive' && 'Archivar Proyecto'}
            </h3>
            
            {(statusAction === 'pause' || statusAction === 'cancel' || statusAction === 'complete') && (
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                  {statusAction === 'complete' ? 'Notas de completación (opcional):' : 'Razón:'}
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason((e.target as HTMLTextAreaElement).value)}
                  className={`w-full p-2 border rounded-lg ${isDarkTheme ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  rows={3}
                  required={statusAction === 'cancel'}
                />
              </div>
            )}
            
            {statusAction === 'start' && (
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                  Fecha de inicio (opcional):
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate((e.target as HTMLInputElement).value)}
                  className={`w-full p-2 border rounded-lg ${isDarkTheme ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                />
              </div>
            )}
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setReason('');
                  setStartDate('');
                }}
                className={`px-4 py-2 rounded-lg ${isDarkTheme ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
              >
                Cancelar
              </button>
              <button
                onClick={handleStatusChange}
                disabled={statusAction === 'cancel' && !reason}
                className={`px-4 py-2 rounded-lg ${
                  statusAction === 'cancel' ? 
                    'bg-red-500 hover:bg-red-600 text-white disabled:opacity-50' :
                  statusAction === 'complete' ?
                    'bg-green-500 hover:bg-green-600 text-white' :
                    'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Date Update Modal */}
      {showDateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-md mx-4">
            <h3 className={`text-lg font-semibold mb-4 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
              Actualizar Fechas del Proyecto
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                  Fecha de inicio:
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate((e.target as HTMLInputElement).value)}
                  className={`w-full p-2 border rounded-lg ${isDarkTheme ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                  Fecha de finalización planificada:
                </label>
                <input
                  type="date"
                  value={plannedEndDate}
                  onChange={(e) => setPlannedEndDate((e.target as HTMLInputElement).value)}
                  className={`w-full p-2 border rounded-lg ${isDarkTheme ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => {
                  setShowDateModal(false);
                  setStartDate('');
                  setPlannedEndDate('');
                }}
                className={`px-4 py-2 rounded-lg ${isDarkTheme ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
              >
                Cancelar
              </button>
              <button
                onClick={handleDateUpdate}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
              >
                Actualizar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Milestone Modal */}
      {showMilestoneModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-md mx-4">
            <h3 className={`text-lg font-semibold mb-4 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
              Crear Nuevo Hito
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                  Nombre del hito:
                </label>
                <input
                  type="text"
                  value={milestoneName}
                  onChange={(e) => setMilestoneName((e.target as HTMLInputElement).value)}
                  className={`w-full p-2 border rounded-lg ${isDarkTheme ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  required
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                  Descripción (opcional):
                </label>
                <textarea
                  value={milestoneDescription}
                  onChange={(e) => setMilestoneDescription((e.target as HTMLTextAreaElement).value)}
                  className={`w-full p-2 border rounded-lg ${isDarkTheme ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  rows={3}
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                  Fecha de vencimiento:
                </label>
                <input
                  type="date"
                  value={milestoneDueDate}
                  onChange={(e) => setMilestoneDueDate((e.target as HTMLInputElement).value)}
                  className={`w-full p-2 border rounded-lg ${isDarkTheme ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  required
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => {
                  setShowMilestoneModal(false);
                  setMilestoneName('');
                  setMilestoneDescription('');
                  setMilestoneDueDate('');
                }}
                className={`px-4 py-2 rounded-lg ${isDarkTheme ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateMilestone}
                disabled={!milestoneName || !milestoneDueDate}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg disabled:opacity-50"
              >
                Crear Hito
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 