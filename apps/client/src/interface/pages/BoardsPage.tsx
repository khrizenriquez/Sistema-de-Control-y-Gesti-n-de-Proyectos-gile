import { FunctionComponent } from 'preact';
import { Link } from 'wouter-preact';

interface BoardTemplate {
  id: string;
  title: string;
  description: string;
  image: string;
  type: 'template';
}

interface Board {
  id: string;
  title: string;
  description: string;
  background: string;
  type: 'board';
  lastViewed?: string;
}

export const BoardsPage: FunctionComponent = () => {
  const templates: BoardTemplate[] = [
    {
      id: 'kanban',
      title: 'Tablero Kanban',
      description: 'Gestiona tu flujo de trabajo con columnas personalizables',
      image: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71',
      type: 'template',
    },
    {
      id: 'scrum',
      title: 'Tablero Scrum',
      description: 'Organiza sprints y gestiona historias de usuario',
      image: 'https://images.unsplash.com/photo-1552664688-cf412ec27db2',
      type: 'template',
    },
  ];

  const recentBoards: Board[] = [
    {
      id: 'board-1',
      title: 'Desarrollo Frontend',
      description: 'Equipo de desarrollo frontend',
      background: 'bg-gradient-to-r from-blue-400 to-blue-600',
      type: 'board',
      lastViewed: 'Hace 2 días',
    },
    {
      id: 'board-2',
      title: 'Marketing Q2',
      description: 'Planificación de marketing para Q2',
      background: 'bg-gradient-to-r from-purple-400 to-purple-600',
      type: 'board',
      lastViewed: 'Ayer',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Tableros</h1>
        <p className="text-gray-600">Selecciona un tablero o crea uno nuevo</p>
      </div>

      {/* Templates Section */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-800">Plantillas populares</h2>
          <button className="text-sm text-blue-600 hover:text-blue-700">Ver todas</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {templates.map((template) => (
            <Link href={`/board/new/${template.id}`} key={template.id}>
              <a className="block group">
                <div className="relative aspect-video rounded-lg overflow-hidden mb-3">
                  <img
                    src={template.image}
                    alt={template.title}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-20">
                    <span className="absolute top-2 right-2 bg-gray-100 text-xs px-2 py-1 rounded">
                      PLANTILLA
                    </span>
                  </div>
                </div>
                <h3 className="font-medium text-gray-800 mb-1">{template.title}</h3>
                <p className="text-sm text-gray-600">{template.description}</p>
              </a>
            </Link>
          ))}

          {/* Create Custom Board */}
          <Link href="/board/new/custom">
            <a className="block">
              <div className="relative aspect-video rounded-lg overflow-hidden mb-3 bg-gray-100 border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <svg className="w-8 h-8 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="block mt-2 text-sm font-medium text-gray-600">Crear tablero personalizado</span>
                  </div>
                </div>
              </div>
            </a>
          </Link>
        </div>
      </div>

      {/* Recent Boards */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-800">Tableros recientes</h2>
          <div className="flex items-center gap-4">
            <button className="text-sm text-gray-600 hover:text-gray-800">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
              </svg>
            </button>
            <button className="text-sm text-gray-600 hover:text-gray-800">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {recentBoards.map((board) => (
            <Link href={`/board/${board.id}`} key={board.id}>
              <a className="block group">
                <div className={`relative aspect-video rounded-lg overflow-hidden mb-3 ${board.background}`}>
                  <div className="absolute inset-0 bg-black bg-opacity-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-2 right-2 flex space-x-2">
                      <button className="p-1 bg-gray-800 bg-opacity-50 rounded hover:bg-opacity-70">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                        </svg>
                      </button>
                      <button className="p-1 bg-gray-800 bg-opacity-50 rounded hover:bg-opacity-70">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
                <h3 className="font-medium text-gray-800 mb-1">{board.title}</h3>
                <p className="text-sm text-gray-500">{board.lastViewed}</p>
              </a>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}; 