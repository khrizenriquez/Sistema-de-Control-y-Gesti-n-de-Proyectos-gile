import { FunctionComponent } from 'preact';
import { useState } from 'preact/hooks';

interface Label {
  id: string;
  name: string;
  color: string;
}

interface Template {
  id: string;
  name: string;
  description: string;
  type: 'kanban' | 'scrum';
  isDefault: boolean;
}

export const BoardSettingsPage: FunctionComponent = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'labels' | 'templates'>('general');
  const [visibility, setVisibility] = useState<'private' | 'team' | 'public'>('team');
  const [labels, setLabels] = useState<Label[]>([
    { id: '1', name: 'Alta prioridad', color: 'bg-red-500' },
    { id: '2', name: 'En progreso', color: 'bg-yellow-500' },
    { id: '3', name: 'Completado', color: 'bg-green-500' },
    { id: '4', name: 'Bug', color: 'bg-purple-500' },
  ]);
  const [templates, setTemplates] = useState<Template[]>([
    {
      id: '1',
      name: 'Kanban Básico',
      description: 'Tablero Kanban con columnas: Por hacer, En progreso, Hecho',
      type: 'kanban',
      isDefault: true,
    },
    {
      id: '2',
      name: 'Scrum Sprint',
      description: 'Tablero Scrum con backlog y sprint actual',
      type: 'scrum',
      isDefault: false,
    },
  ]);

  const handleAddLabel = () => {
    const newLabel: Label = {
      id: `${labels.length + 1}`,
      name: 'Nueva etiqueta',
      color: 'bg-gray-500',
    };
    setLabels([...labels, newLabel]);
  };

  const handleDeleteLabel = (id: string) => {
    setLabels(labels.filter(label => label.id !== id));
  };

  const handleSetDefaultTemplate = (id: string) => {
    setTemplates(templates.map(template => ({
      ...template,
      isDefault: template.id === id,
    })));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-2xl font-bold text-gray-900">Configuración del tablero</h1>
          </div>
          {/* Tabs */}
          <div className="flex space-x-8 mt-4">
            <button
              onClick={() => setActiveTab('general')}
              className={`pb-4 ${
                activeTab === 'general'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              General
            </button>
            <button
              onClick={() => setActiveTab('labels')}
              className={`pb-4 ${
                activeTab === 'labels'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Etiquetas
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`pb-4 ${
                activeTab === 'templates'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Plantillas
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'general' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Configuración general</h2>
              
              {/* Visibility Settings */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Visibilidad del tablero
                </label>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name="visibility"
                      value="private"
                      checked={visibility === 'private'}
                      onChange={() => setVisibility('private')}
                      className="h-4 w-4 text-blue-600 border-gray-300"
                    />
                    <div className="ml-3">
                      <label className="font-medium text-gray-900">Privado</label>
                      <p className="text-sm text-gray-500">Solo tú puedes ver y editar este tablero</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name="visibility"
                      value="team"
                      checked={visibility === 'team'}
                      onChange={() => setVisibility('team')}
                      className="h-4 w-4 text-blue-600 border-gray-300"
                    />
                    <div className="ml-3">
                      <label className="font-medium text-gray-900">Equipo</label>
                      <p className="text-sm text-gray-500">Todos los miembros del equipo pueden ver y editar</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name="visibility"
                      value="public"
                      checked={visibility === 'public'}
                      onChange={() => setVisibility('public')}
                      className="h-4 w-4 text-blue-600 border-gray-300"
                    />
                    <div className="ml-3">
                      <label className="font-medium text-gray-900">Público</label>
                      <p className="text-sm text-gray-500">Cualquiera con el enlace puede ver este tablero</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="border-t pt-4 mt-6">
                <button className="px-4 py-2 text-white bg-red-600 rounded hover:bg-red-700">
                  Eliminar tablero
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'labels' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">Etiquetas</h2>
                <button
                  onClick={handleAddLabel}
                  className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
                >
                  Agregar etiqueta
                </button>
              </div>
              
              <div className="space-y-4">
                {labels.map((label) => (
                  <div key={label.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-6 h-6 rounded ${label.color}`}></div>
                      <input
                        type="text"
                        value={label.name}
                        className="border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <button
                      onClick={() => handleDeleteLabel(label.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">Plantillas</h2>
                <button className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700">
                  Nueva plantilla
                </button>
              </div>
              
              <div className="space-y-4">
                {templates.map((template) => (
                  <div key={template.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">{template.name}</h3>
                      <p className="text-sm text-gray-500">{template.description}</p>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-2">
                        {template.type === 'kanban' ? 'Kanban' : 'Scrum'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4">
                      {template.isDefault ? (
                        <span className="text-sm text-green-600">Plantilla predeterminada</span>
                      ) : (
                        <button
                          onClick={() => handleSetDefaultTemplate(template.id)}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          Establecer como predeterminada
                        </button>
                      )}
                      <button className="text-gray-400 hover:text-gray-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 