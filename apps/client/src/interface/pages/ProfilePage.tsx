import { FunctionComponent } from 'preact';
import { useState } from 'preact/hooks';

interface UserProfile {
  firstName: string;
  lastName: string;
  role: string;
  email: string;
  avatar: string;
  localTime: string;
  teams: string[];
  tasks: Array<{
    id: string;
    title: string;
    tag: string;
    dueDate: string;
  }>;
  about: string;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const ProfilePage: FunctionComponent = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [profile, setProfile] = useState<UserProfile>({
    firstName: 'Jamie',
    lastName: 'Sánchez',
    role: 'Productora creativa (Admin)',
    email: 'jamie-template@289625799.asanatest1.us',
    avatar: 'https://ui-avatars.com/api/?name=Jamie+Sanchez&size=200',
    localTime: '09:28 hora local',
    teams: ['Staff', 'Sales', 'Product Engineering', 'Marketing NA', 'Marketing EMEA'],
    tasks: [
      { id: '1', title: '[Redes sociales] Publicaciones para el factor X (destacable) de la campaña', tag: 'Calendar', dueDate: 'Viernes' },
      { id: '2', title: 'Actualizar plantillas de documentos con los nuevos colores de código y fuente', tag: 'Creative', dueDate: 'Viernes' },
      { id: '3', title: 'Localizar los gráficos del Catálogo de productos', tag: 'Creative', dueDate: 'Viernes' },
      { id: '4', title: 'Campaña para redes sociales de Mobile evergreen', tag: 'Creative', dueDate: 'Domingo' },
      { id: '5', title: 'Crear la planificación de objetivos para el equipo', tag: 'Ops Admin', dueDate: '3 oct' },
    ],
    about: 'Usa este espacio para contarles a los demás sobre ti.'
  });

  const handleEditProfile = () => {
    setIsEditing(true);
  };

  const handleSaveProfile = () => {
    setIsEditing(false);
    // Aquí iría la lógica para guardar los cambios en el backend
  };

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePasswordChange = (field: keyof PasswordForm, value: string) => {
    setPasswordForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSavePassword = () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }
    // Aquí iría la lógica para cambiar la contraseña en el backend
    setIsChangingPassword(false);
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header con información del perfil */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="w-32 h-32 rounded-full overflow-hidden">
            <img src={profile.avatar} alt={`${profile.firstName} ${profile.lastName}`} className="w-full h-full object-cover" />
          </div>

          {/* Información del perfil */}
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                {isEditing ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={profile.firstName}
                      onChange={(e) => handleInputChange('firstName', e.currentTarget.value)}
                      className="text-2xl font-semibold mb-1 border rounded px-2 py-1 mr-2"
                      placeholder="Nombre"
                    />
                    <input
                      type="text"
                      value={profile.lastName}
                      onChange={(e) => handleInputChange('lastName', e.currentTarget.value)}
                      className="text-2xl font-semibold mb-1 border rounded px-2 py-1"
                      placeholder="Apellidos"
                    />
                  </div>
                ) : (
                  <h1 className="text-2xl font-semibold mb-1">{`${profile.firstName} ${profile.lastName}`}</h1>
                )}
                <p className="text-gray-600">{profile.role}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {profile.localTime}
                  </span>
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {profile.email}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200">
                  Establecer aviso de ausencia
                </button>
                {isEditing ? (
                  <button
                    onClick={handleSaveProfile}
                    className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
                  >
                    Guardar cambios
                  </button>
                ) : (
                  <button
                    onClick={handleEditProfile}
                    className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
                  >
                    Editar perfil
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Columna de tareas y cambio de contraseña */}
        <div className="col-span-2 space-y-6">
          {/* Sección de tareas */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Mis tareas</h2>
              <button className="text-blue-600 hover:text-blue-700">Ver todas las tareas</button>
            </div>
            <div className="space-y-4">
              {profile.tasks.map(task => (
                <div key={task.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" className="rounded border-gray-300" />
                    <span>{task.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      task.tag === 'Calendar' ? 'bg-yellow-100 text-yellow-800' :
                      task.tag === 'Creative' ? 'bg-pink-100 text-pink-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {task.tag}
                    </span>
                    <span className="text-sm text-gray-500">{task.dueDate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sección de cambio de contraseña */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Cambiar contraseña</h2>
              {!isChangingPassword && (
                <button
                  onClick={() => setIsChangingPassword(true)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  Cambiar
                </button>
              )}
            </div>
            {isChangingPassword && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contraseña actual
                  </label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => handlePasswordChange('currentPassword', e.currentTarget.value)}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nueva contraseña
                  </label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => handlePasswordChange('newPassword', e.currentTarget.value)}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirmar nueva contraseña
                  </label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => handlePasswordChange('confirmPassword', e.currentTarget.value)}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setIsChangingPassword(false)}
                    className="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSavePassword}
                    className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
                  >
                    Guardar contraseña
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Columna de información adicional */}
        <div className="space-y-6">
          {/* Acerca de mí */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Acerca de mí</h2>
            {isEditing ? (
              <textarea
                value={profile.about}
                onChange={(e) => handleInputChange('about', e.currentTarget.value)}
                className="w-full h-32 p-2 border rounded"
                placeholder="Cuéntanos sobre ti..."
              />
            ) : (
              <p className="text-gray-600">{profile.about}</p>
            )}
          </div>

          {/* Mis equipos */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Mis equipos</h2>
              <button className="text-gray-400 hover:text-gray-600">Mostrar más</button>
            </div>
            <div className="space-y-3">
              {profile.teams.map((team, index) => (
                <div key={index} className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>{team}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 