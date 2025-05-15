import { useState, useEffect, useRef } from 'preact/hooks';
import { useRoute, useLocation } from 'wouter-preact';
import { ProjectService } from '../../domain/services/ProjectService';
import { useTheme } from '../../context/ThemeContext';

interface Project {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  created_by: string;
}

export const ProjectDetailPage = () => {
  const [, params] = useRoute('/projects/:id');
  const [, navigate] = useLocation();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const dataFetchedRef = useRef(false);

  useEffect(() => {
    const fetchProject = async () => {
      if (dataFetchedRef.current) return;
      
      try {
        if (params && params.id) {
          const projectData = await ProjectService.getProjectById(params.id);
          if (projectData) {
            setProject(projectData);
            dataFetchedRef.current = true;
          } else {
            setError('No se pudo cargar el proyecto');
          }
        }
      } catch (err) {
        setError('Error al cargar el proyecto');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [params?.id]);

  const handleBackClick = () => {
    navigate('/projects');
  };

  const handleMembersClick = () => {
    if (project) {
      navigate(`/projects/${project.id}/members`);
    }
  };

  const handleCreateBoard = () => {
    if (project) {
      navigate(`/boards/new?projectId=${project.id}`);
    }
  };

  // Clases condicionales para modo oscuro
  const cardClass = isDarkMode 
    ? 'bg-gray-800 text-white' 
    : 'bg-white';
  
  const buttonClass = isDarkMode
    ? 'bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg'
    : 'bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg';
  
  const secondaryButtonClass = isDarkMode
    ? 'bg-gray-700 text-white hover:bg-gray-600 px-4 py-2 rounded-lg'
    : 'bg-gray-200 text-gray-800 hover:bg-gray-300 px-4 py-2 rounded-lg';

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full p-8">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-4">
        <p className="text-red-500">{error}</p>
        <button 
          className={secondaryButtonClass}
          onClick={handleBackClick}
        >
          Volver a proyectos
        </button>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center p-4">
        <p>Proyecto no encontrado</p>
        <button 
          className={secondaryButtonClass}
          onClick={handleBackClick}
        >
          Volver a proyectos
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            {project.name}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Creado por {project.created_by} el {new Date(project.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex space-x-2">
          <button 
            className={secondaryButtonClass}
            onClick={handleBackClick}
          >
            Volver
          </button>
          <button 
            className={secondaryButtonClass}
            onClick={handleMembersClick}
          >
            Ver miembros
          </button>
          <button 
            className={buttonClass}
            onClick={handleCreateBoard}
          >
            Crear tablero
          </button>
        </div>
      </div>

      <div className={`mb-6 p-4 rounded-lg shadow ${cardClass}`}>
        <h2 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          Descripción
        </h2>
        <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          {project.description || 'Sin descripción'}
        </p>
      </div>

      <div className="mb-6">
        <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          Tableros del proyecto
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          Actualmente no hay tableros para este proyecto.
        </p>
        <button 
          className={`${buttonClass} mt-2`}
          onClick={handleCreateBoard}
        >
          Crear primer tablero
        </button>
      </div>
    </div>
  );
}; 