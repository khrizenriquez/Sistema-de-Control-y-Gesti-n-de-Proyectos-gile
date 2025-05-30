import { FunctionComponent } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { useLocation } from 'wouter-preact';
import { BoardService, CreateBoardRequest } from '../../domain/services/BoardService';
import { useTheme } from '../../context/ThemeContext';
import { ProjectService } from '../../domain/services/ProjectService';

interface BoardSection {
  id: string;
  name: string;
}

interface TeamMember {
  email: string;
}

interface Project {
  id: string;
  name: string;
}

export const CreateBoardPage: FunctionComponent = () => {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [boardData, setBoardData] = useState({
    name: '',
    sections: [] as BoardSection[],
    teamMembers: [] as TeamMember[],
    project_id: '',
    template: 'kanban',
  });
  const [newSection, setNewSection] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  // Plantillas predefinidas
  const templates = {
    kanban: {
      name: 'Kanban',
      description: 'Tablero simple con flujo continuo',
      sections: [
        { id: '1', name: 'Por hacer' },
        { id: '2', name: 'En progreso' },
        { id: '3', name: 'Completado' }
      ]
    },
    scrum: {
      name: 'Scrum',
      description: 'Tablero para metodología Scrum con sprints',
      sections: [
        { id: '1', name: 'Product Backlog' },
        { id: '2', name: 'Sprint Backlog' },
        { id: '3', name: 'En progreso' },
        { id: '4', name: 'En revisión' },
        { id: '5', name: 'Completado' }
      ]
    },
    custom: {
      name: 'Personalizado',
      description: 'Crea tu propio flujo de trabajo',
      sections: []
    }
  };

  // Función para aplicar plantilla
  const applyTemplate = (templateKey: string) => {
    const template = templates[templateKey as keyof typeof templates];
    setBoardData(prev => ({
      ...prev,
      template: templateKey,
      sections: [...template.sections]
    }));
  };

  useEffect(() => {
    // Cargar proyectos disponibles
    const loadProjects = async () => {
      try {
        const projectsData = await ProjectService.getProjects();
        setProjects(projectsData);
        
        // Establecer el primer proyecto como predeterminado si está disponible
        if (projectsData.length > 0) {
          setBoardData(prev => ({
            ...prev,
            project_id: projectsData[0].id
          }));
        }
      } catch (err) {
        console.error('Error loading projects:', err);
        setError('No se pudieron cargar los proyectos. Verifica tu conexión.');
      }
    };
    
    loadProjects();
  }, []);

  const handleAddSection = () => {
    if (newSection.trim()) {
      setBoardData(prev => ({
        ...prev,
        sections: [...prev.sections, { id: Date.now().toString(), name: newSection.trim() }],
      }));
      setNewSection('');
    }
  };

  const handleRemoveSection = (id: string) => {
    setBoardData(prev => ({
      ...prev,
      sections: prev.sections.filter(section => section.id !== id),
    }));
  };

  const handleAddTeamMember = () => {
    if (newEmail.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      setBoardData(prev => ({
        ...prev,
        teamMembers: [...prev.teamMembers, { email: newEmail.trim() }],
      }));
      setNewEmail('');
    }
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      createBoard();
    }
  };

  const createBoard = async () => {
    if (!boardData.project_id) {
      setError('Se requiere seleccionar un proyecto');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const boardService = new BoardService();
      const createRequest: CreateBoardRequest = {
        name: boardData.name,
        project_id: boardData.project_id,
        template: boardData.template,
      };
      
      const createdBoard = await boardService.createBoard(createRequest);
      
      // Redirigir al usuario a la página de tableros
      setLocation('/boards');
    } catch (err: any) {
      console.error('Error creating board:', err);
      setError(err.message || 'Error al crear el tablero. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      setLocation('/boards');
    }
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return boardData.name.trim().length > 0 && boardData.project_id !== '';
      case 2:
        return boardData.sections.length > 0;
      case 3:
        return true; // El paso 3 siempre es válido ya que los miembros son opcionales
      default:
        return false;
    }
  };

  // Clases condicionales para modo oscuro
  const cardClass = isDarkMode 
    ? 'bg-gray-800 text-white shadow-sm' 
    : 'bg-white shadow-sm';
  
  const inputClass = isDarkMode
    ? 'bg-gray-700 text-white border-gray-600 focus:ring-blue-500 focus:border-transparent'
    : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent';
  
  const buttonClass = isDarkMode
    ? 'bg-blue-600 text-white hover:bg-blue-700'
    : 'bg-blue-600 text-white hover:bg-blue-700';
  
  const textClass = isDarkMode
    ? 'text-gray-200'
    : 'text-gray-600';

  // Verificar si no hay proyectos disponibles
  const noProjects = projects.length === 0;

  if (noProjects) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className={`max-w-md mx-auto p-6 rounded-lg shadow-md ${cardClass}`}>
          <svg className="w-16 h-16 text-yellow-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className={`text-xl font-bold mb-4 text-center ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            No hay proyectos disponibles
          </h2>
          <p className={`${textClass} text-center mb-6`}>
            Para crear un tablero, primero necesitas tener al menos un proyecto. Por favor, contacta a un administrador para crear un proyecto.
          </p>
          <div className="flex justify-center">
            <button
              onClick={() => setLocation('/boards')}
              className={`px-6 py-2 rounded-lg ${buttonClass}`}
            >
              Volver a Tableros
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} flex`}>
      {/* Barra lateral con preview */}
      <div className={`hidden lg:block w-1/2 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border-l`}>
        <div className="p-8">
          <div className={`${cardClass} rounded-lg p-6 max-w-md mx-auto`}>
            <div className="w-12 h-12 bg-blue-100 rounded-lg mb-4 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-2`}>
              {boardData.name || 'Nombre del tablero'}
            </h2>
            {boardData.sections.length > 0 && (
              <div className="mt-4 space-y-2">
                {boardData.sections.map(section => (
                  <div key={section.id} className={`flex items-center space-x-2 ${textClass}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                    <span>{section.name}</span>
                  </div>
                ))}
              </div>
            )}
            {boardData.teamMembers.length > 0 && (
              <div className="mt-4">
                <div className="flex -space-x-2">
                  {boardData.teamMembers.map((member) => (
                    <div
                      key={member.email}
                      className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm border-2 border-white"
                      title={member.email}
                    >
                      {member.email[0].toUpperCase()}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col">
        {/* Barra de progreso */}
        <div className={`h-2 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Contenido del paso actual */}
        <div className="flex-1 p-8">
          <button
            onClick={handleBack}
            className={`flex items-center ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-800'} mb-6`}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Volver
          </button>

          <div className="max-w-2xl mx-auto">
            {step === 1 && (
              <div className="space-y-6">
                <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Crea tu tablero</h1>
                
                {/* Seleccionar un proyecto */}
                <div className="mb-4">
                  <label className={`block ${textClass} mb-2`}>Selecciona un proyecto</label>
                  <select
                    value={boardData.project_id}
                    onChange={(e) => setBoardData(prev => ({ ...prev, project_id: e.currentTarget.value }))}
                    className={`w-full px-4 py-3 text-lg rounded-lg ${inputClass}`}
                    required
                  >
                    <option value="" disabled>Selecciona un proyecto</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className={`block ${textClass} mb-2`}>Nombre del tablero</label>
                  <input
                    type="text"
                    value={boardData.name}
                    onChange={(e) => setBoardData(prev => ({ ...prev, name: e.currentTarget.value }))}
                    placeholder="ej. Desarrollo de producto Q2"
                    className={`w-full px-4 py-3 text-lg rounded-lg ${inputClass}`}
                  />
                </div>
                
                <div>
                  <label className={`block ${textClass} mb-4`}>Elige una plantilla</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(templates).map(([key, template]) => (
                      <div
                        key={key}
                        onClick={() => applyTemplate(key)}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          boardData.template === key
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        } ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {template.name}
                          </h3>
                          {boardData.template === key && (
                            <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <p className={`text-sm ${textClass} mb-3`}>{template.description}</p>
                        {template.sections.length > 0 && (
                          <div className="space-y-1">
                            <p className={`text-xs font-medium ${textClass}`}>Columnas:</p>
                            <div className="flex flex-wrap gap-1">
                              {template.sections.map((section, index) => (
                                <span
                                  key={index}
                                  className={`px-2 py-1 text-xs rounded ${
                                    isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                                  }`}
                                >
                                  {section.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Ajusta las secciones de tu tablero</h1>
                  <p className={textClass + " mt-2"}>Las secciones organizan las tareas en grupos o etapas.</p>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSection}
                      onChange={(e) => setNewSection(e.currentTarget.value)}
                      placeholder="Nombre de la sección"
                      className={`flex-1 px-4 py-2 rounded-lg ${inputClass}`}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddSection()}
                    />
                    <button
                      onClick={handleAddSection}
                      className={`px-4 py-2 rounded-lg ${buttonClass}`}
                    >
                      Agregar
                    </button>
                  </div>

                  <div className="space-y-2">
                    {boardData.sections.map(section => (
                      <div
                        key={section.id}
                        className={`flex items-center justify-between p-3 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                      >
                        <span className={isDarkMode ? 'text-white' : ''}>{section.name}</span>
                        <button
                          onClick={() => handleRemoveSection(section.id)}
                          className={isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Invita a tu equipo</h1>
                  <p className={textClass + " mt-2"}>
                    Comienza invitando a algunos compañeros de equipo para colaborar.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.currentTarget.value)}
                      placeholder="nombre@empresa.com"
                      className={`flex-1 px-4 py-2 rounded-lg ${inputClass}`}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddTeamMember()}
                    />
                    <button
                      onClick={handleAddTeamMember}
                      className={`px-4 py-2 rounded-lg ${buttonClass}`}
                    >
                      Invitar
                    </button>
                  </div>

                  {boardData.teamMembers.length > 0 && (
                    <div className="space-y-2">
                      {boardData.teamMembers.map(member => (
                        <div
                          key={member.email}
                          className={`flex items-center justify-between p-3 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                              {member.email[0].toUpperCase()}
                            </div>
                            <span className={isDarkMode ? 'text-white' : ''}>{member.email}</span>
                          </div>
                          <button
                            onClick={() => {
                              setBoardData(prev => ({
                                ...prev,
                                teamMembers: prev.teamMembers.filter(m => m.email !== member.email),
                              }));
                            }}
                            className={isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            <div className="mt-8 flex justify-end">
              <button
                onClick={handleNext}
                disabled={!isStepValid() || loading}
                className={`px-6 py-3 rounded-lg ${buttonClass} ${!isStepValid() || loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Procesando...
                  </span>
                ) : step === totalSteps ? (
                  'Crear tablero'
                ) : (
                  'Continuar'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 