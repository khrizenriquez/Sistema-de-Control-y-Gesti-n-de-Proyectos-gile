import { FunctionComponent } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { Link } from 'wouter-preact';

interface Team {
  id: string;
  name: string;
  description: string;
  membersCount: number;
  isOwner: boolean;
  avatar?: string;
}

export const TeamsPage: FunctionComponent = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Datos simulados para desarrollo
  const mockTeams: Team[] = [
    {
      id: 'team-1',
      name: 'Equipo de Desarrollo',
      description: 'Equipo principal de desarrollo de software',
      membersCount: 8,
      isOwner: true
    },
    {
      id: 'team-2',
      name: 'Equipo de Diseño',
      description: 'Equipo de diseño UX/UI',
      membersCount: 5,
      isOwner: false
    },
    {
      id: 'team-3',
      name: 'Equipo de Marketing',
      description: 'Equipo de marketing y comunicación',
      membersCount: 4,
      isOwner: true
    }
  ];

  useEffect(() => {
    // Simular carga de datos
    setTimeout(() => {
      setTeams(mockTeams);
      setIsLoading(false);
    }, 500);
  }, []);

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Mis Equipos</h1>
        <Link href="/teams/new">
          <a className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Equipo
          </a>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map(team => (
            <Link key={team.id} href={`/teams/${team.id}`}>
              <a className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-xl font-semibold text-gray-600 mr-4">
                    {team.avatar ? (
                      <img src={team.avatar} alt={team.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      team.name.charAt(0)
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{team.name}</h3>
                    <p className="text-sm text-gray-500">{team.membersCount} miembros</p>
                  </div>
                </div>
                <p className="text-gray-600 mb-4 line-clamp-2">{team.description || 'Sin descripción'}</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    {team.isOwner ? 'Propietario' : 'Miembro'}
                  </span>
                  <button className="text-blue-600 hover:text-blue-800">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </a>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}; 