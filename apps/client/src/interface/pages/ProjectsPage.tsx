import { FunctionComponent } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { useLocation } from 'wouter-preact';
import { ProjectService } from '../../domain/services/ProjectService';
import { useTheme } from '../../context/ThemeContext';

interface Project {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
  created_by?: string;
}

export const ProjectsPage: FunctionComponent = () => {
  const [, setLocation] = useLocation();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newProject, setNewProject] = useState({ name: '', description: '' });
  const [showForm, setShowForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const projectsData = await ProjectService.getProjects();
      setProjects(projectsData);
    } catch (err) {
      console.error('Error loading projects:', err);
      setError('No se pudieron cargar los proyectos. Verifica tu conexión.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: Event) => {
    e.preventDefault();
    if (!newProject.name.trim()) {
      setError('El nombre del proyecto es requerido');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      await ProjectService.createProject({
        name: newProject.name,
        description: newProject.description,
      });
      
      // Limpiar el formulario
      setNewProject({ name: '', description: '' });
      setShowForm(false);
      
      // Recargar proyectos
      await loadProjects();
    } catch (err: any) {
      console.error('Error creating project:', err);
      setError(err.message || 'Error al crear el proyecto. Verifica tus permisos.');
    } finally {
      setIsCreating(false);
    }
  };

  // Clases condicionales para modo oscuro
  const cardClass = isDarkMode 
    ? 'bg-gray-800 text-white' 
    : 'bg-white';
  
  const inputClass = isDarkMode
    ? 'bg-gray-700 text-white border-gray-600 focus:ring-blue-500 focus:border-transparent'
    : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent';
  
  const buttonClass = isDarkMode
    ? 'bg-blue-600 text-white hover:bg-blue-700'
    : 'bg-blue-600 text-white hover:bg-blue-700';
  
  const secondaryButtonClass = isDarkMode
    ? 'bg-gray-700 text-white hover:bg-gray-600'
    : 'bg-gray-200 text-gray-800 hover:bg-gray-300';

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            Administración de Proyectos
          </h1>
          <button
            onClick={() => setShowForm(true)}
            className={`px-4 py-2 rounded-lg ${buttonClass}`}
          >
            Nuevo Proyecto
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {showForm && (
          <div className={`mb-8 p-4 rounded-lg shadow ${cardClass}`}>
            <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              Crear Nuevo Proyecto
            </h2>
            <form onSubmit={handleCreateProject}>
              <div className="mb-4">
                <label className={`block mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Nombre del Proyecto *
                </label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.currentTarget.value })}
                  className={`w-full px-3 py-2 rounded-lg ${inputClass}`}
                  required
                />
              </div>
              <div className="mb-4">
                <label className={`block mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Descripción
                </label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.currentTarget.value })}
                  className={`w-full px-3 py-2 rounded-lg ${inputClass}`}
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className={`px-4 py-2 rounded-lg ${secondaryButtonClass}`}
                  disabled={isCreating}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-lg ${buttonClass} ${isCreating ? 'opacity-70 cursor-not-allowed' : ''}`}
                  disabled={isCreating}
                >
                  {isCreating ? 'Creando...' : 'Crear Proyecto'}
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className={`text-center py-8 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-blue-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-2">Cargando proyectos...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className={`text-center py-8 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            <p>No hay proyectos disponibles. Crea tu primer proyecto para comenzar.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map(project => (
              <div
                key={project.id}
                className={`p-4 rounded-lg shadow ${cardClass} hover:shadow-md transition-shadow`}
              >
                <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-2`}>
                  {project.name}
                </h2>
                {project.description && (
                  <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {project.description}
                  </p>
                )}
                <div className={`flex justify-between items-center mt-4 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <span>Creado: {project.created_at && new Date(project.created_at).toLocaleDateString()}</span>
                  <span>Por: {project.created_by}</span>
                </div>
                <div className="mt-4 flex space-x-2">
                  <button
                    onClick={() => setLocation(`/projects/${project.id}`)}
                    className={`flex-1 px-3 py-2 rounded-lg ${buttonClass}`}
                  >
                    Ver detalles
                  </button>
                  <button
                    onClick={() => setLocation(`/projects/${project.id}/members`)}
                    className={`flex-1 px-3 py-2 rounded-lg ${secondaryButtonClass}`}
                  >
                    Miembros
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}; 