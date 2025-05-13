import { FunctionComponent } from 'preact';
import { useState } from 'preact/hooks';
import { useLocation } from 'wouter-preact';

interface BoardSection {
  id: string;
  name: string;
}

interface TeamMember {
  email: string;
}

export const CreateBoardPage: FunctionComponent = () => {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [boardData, setBoardData] = useState({
    name: '',
    sections: [] as BoardSection[],
    teamMembers: [] as TeamMember[],
  });
  const [newSection, setNewSection] = useState('');
  const [newEmail, setNewEmail] = useState('');

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

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
      // Aquí iría la lógica para crear el tablero
      setLocation('/boards');
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
        return boardData.name.trim().length > 0;
      case 2:
        return boardData.sections.length > 0;
      case 3:
        return true; // El paso 3 siempre es válido ya que los miembros son opcionales
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Barra lateral con preview */}
      <div className="hidden lg:block w-1/2 bg-white border-l">
        <div className="p-8">
          <div className="bg-white rounded-lg shadow-sm p-6 max-w-md mx-auto">
            <div className="w-12 h-12 bg-blue-100 rounded-lg mb-4 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              {boardData.name || 'Nombre del proyecto'}
            </h2>
            {boardData.sections.length > 0 && (
              <div className="mt-4 space-y-2">
                {boardData.sections.map(section => (
                  <div key={section.id} className="flex items-center space-x-2 text-gray-600">
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
        <div className="h-2 bg-gray-200">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Contenido del paso actual */}
        <div className="flex-1 p-8">
          <button
            onClick={handleBack}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-6"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Volver
          </button>

          <div className="max-w-2xl mx-auto">
            {step === 1 && (
              <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900">Nombra tu proyecto</h1>
                <div>
                  <input
                    type="text"
                    value={boardData.name}
                    onChange={(e) => setBoardData(prev => ({ ...prev, name: e.currentTarget.value }))}
                    placeholder="ej. Desarrollo de producto Q2"
                    className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Ajusta las secciones de tu proyecto</h1>
                  <p className="text-gray-600 mt-2">Las secciones organizan las tareas en grupos o etapas.</p>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSection}
                      onChange={(e) => setNewSection(e.currentTarget.value)}
                      placeholder="Nombre de la sección"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddSection()}
                    />
                    <button
                      onClick={handleAddSection}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Agregar
                    </button>
                  </div>

                  <div className="space-y-2">
                    {boardData.sections.map(section => (
                      <div
                        key={section.id}
                        className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200"
                      >
                        <span>{section.name}</span>
                        <button
                          onClick={() => handleRemoveSection(section.id)}
                          className="text-gray-400 hover:text-gray-600"
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
                  <h1 className="text-2xl font-bold text-gray-900">Invita a tu equipo</h1>
                  <p className="text-gray-600 mt-2">
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
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddTeamMember()}
                    />
                    <button
                      onClick={handleAddTeamMember}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Invitar
                    </button>
                  </div>

                  {boardData.teamMembers.length > 0 && (
                    <div className="space-y-2">
                      {boardData.teamMembers.map(member => (
                        <div
                          key={member.email}
                          className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                              {member.email[0].toUpperCase()}
                            </div>
                            <span>{member.email}</span>
                          </div>
                          <button
                            onClick={() => setBoardData(prev => ({
                              ...prev,
                              teamMembers: prev.teamMembers.filter(m => m.email !== member.email)
                            }))}
                            className="text-gray-400 hover:text-gray-600"
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

            <div className="mt-8">
              <button
                onClick={handleNext}
                disabled={!isStepValid()}
                className={`w-full px-6 py-3 text-white rounded-lg text-lg font-medium transition-colors
                  ${isStepValid()
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                {step === totalSteps ? 'Crear proyecto' : 'Continuar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 