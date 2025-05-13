import { FunctionComponent } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { useParams, Link, useLocation } from 'wouter-preact';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'member';
}

interface Project {
  id: string;
  name: string;
  icon: string;
  status: 'active' | 'archived';
}

interface Goal {
  id: string;
  title: string;
  progress: number;
  dueDate?: string;
}

interface TeamData {
  id: string;
  name: string;
  description: string;
  members: TeamMember[];
  projects: Project[];
  goals: Goal[];
  isOwner: boolean;
}

export const TeamPage: FunctionComponent = () => {
  const { id } = useParams();
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('overview');
  const [team, setTeam] = useState<TeamData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Datos simulados para desarrollo
  const mockTeam: TeamData = {
    id: id || 'team-1',
    name: "Christofer's first team",
    description: '',
    isOwner: true,
    members: [
      {
        id: 'user-1',
        name: 'Christofer Alberto Enríquez Guzmán',
        email: 'cenriquez@example.com',
        avatar: '',
        role: 'admin'
      }
    ],
    projects: [
      {
        id: 'project-1',
        name: 'My First Project',
        icon: '📋',
        status: 'active'
      }
    ],
    goals: []
  };

  useEffect(() => {
    // Determinar la pestaña activa basado en la URL
    const path = location.split('/');
    const tab = path[path.length - 1];
    if (['overview', 'work', 'messages', 'calendar', 'knowledge'].includes(tab)) {
      setActiveTab(tab);
    } else if (path.length >= 3 && path[2] === id) {
      setActiveTab('overview');
    }
    
    // Simular carga de datos
    setTimeout(() => {
      setTeam(mockTeam);
      setIsLoading(false);
    }, 500);
  }, [id, location]);

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    setLocation(`/teams/${id}/${tab === 'overview' ? '' : tab}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Equipo no encontrado</h1>
        <p className="text-gray-600 mb-6">El equipo que buscas no existe o no tienes acceso a él.</p>
        <Link href="/teams">
          <a className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700">
            Volver a Mis Equipos
          </a>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Cabecera */}
      <header className="bg-gray-800 text-white py-4 px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-lg font-semibold">
              {team.name.charAt(0)}
            </div>
            <h1 className="text-xl font-semibold">{team.name}</h1>
            <button className="text-gray-400 hover:text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </button>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex -space-x-2">
              {team.members.slice(0, 3).map(member => (
                <div key={member.id} className="w-8 h-8 rounded-full bg-gray-400 border-2 border-gray-800 flex items-center justify-center text-sm font-medium text-gray-800">
                  {member.avatar ? (
                    <img src={member.avatar} alt={member.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    member.name.charAt(0)
                  )}
                </div>
              ))}
              {team.members.length > 3 && (
                <div className="w-8 h-8 rounded-full bg-gray-500 border-2 border-gray-800 flex items-center justify-center text-xs font-medium text-white">
                  +{team.members.length - 3}
                </div>
              )}
            </div>
            <button 
              onClick={() => setShowInviteModal(true)}
              className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Invite
            </button>
          </div>
        </div>

        {/* Navegación */}
        <nav className="mt-6">
          <ul className="flex border-b border-gray-700">
            <li className="mr-6">
              <button 
                onClick={() => handleTabClick('overview')}
                className={`pb-3 px-1 ${activeTab === 'overview' ? 'border-b-2 border-white text-white' : 'text-gray-400 hover:text-white'}`}
              >
                Overview
              </button>
            </li>
            <li className="mr-6">
              <button 
                onClick={() => handleTabClick('work')}
                className={`pb-3 px-1 ${activeTab === 'work' ? 'border-b-2 border-white text-white' : 'text-gray-400 hover:text-white'}`}
              >
                All work
              </button>
            </li>
            <li className="mr-6">
              <button 
                onClick={() => handleTabClick('messages')}
                className={`pb-3 px-1 ${activeTab === 'messages' ? 'border-b-2 border-white text-white' : 'text-gray-400 hover:text-white'}`}
              >
                Messages
              </button>
            </li>
            <li className="mr-6">
              <button 
                onClick={() => handleTabClick('calendar')}
                className={`pb-3 px-1 ${activeTab === 'calendar' ? 'border-b-2 border-white text-white' : 'text-gray-400 hover:text-white'}`}
              >
                Calendar
              </button>
            </li>
            <li className="mr-6">
              <button 
                onClick={() => handleTabClick('knowledge')}
                className={`pb-3 px-1 ${activeTab === 'knowledge' ? 'border-b-2 border-white text-white' : 'text-gray-400 hover:text-white'}`}
              >
                Knowledge
              </button>
            </li>
            <li>
              <button className="pb-3 px-1 text-gray-400 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </li>
          </ul>
        </nav>
      </header>

      {/* Contenido principal */}
      <main className="p-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Columna izquierda - Información del equipo */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-center mb-8">
                  <div className="w-32 h-32 bg-gray-300 rounded-full flex items-center justify-center text-5xl font-semibold text-gray-600">
                    {team.name.charAt(0)}
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">{team.name}</h2>
                {team.description ? (
                  <p className="text-gray-600 text-center mb-4">{team.description}</p>
                ) : (
                  <p className="text-gray-400 text-center mb-4 italic">Click to add team description...</p>
                )}
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">Curated work</h2>
                  <Link href={`/teams/${id}/work`}>
                    <a className="text-sm text-gray-500 hover:text-gray-700">View all work</a>
                  </Link>
                </div>
                
                {team.projects.length > 0 ? (
                  <div className="space-y-4">
                    {team.projects.map(project => (
                      <div key={project.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center text-lg">
                            {project.icon}
                          </div>
                          <div>
                            <h3 className="text-gray-800 font-medium">{project.name}</h3>
                            <div className="w-32 h-2 bg-gray-200 rounded mt-1"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">Organize links to important work such as portfolios, projects, templates, etc, for your team members to find easily.</p>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                      Add work
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Columna derecha - Miembros y Metas */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">Members</h2>
                  <Link href={`/teams/${id}/members`}>
                    <a className="text-sm text-gray-500 hover:text-gray-700">View all {team.members.length}</a>
                  </Link>
                </div>
                
                <div className="space-y-4">
                  {team.members.map(member => (
                    <div key={member.id} className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-medium mr-3">
                        {member.avatar ? (
                          <img src={member.avatar} alt={member.name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          member.name.charAt(0)
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-gray-800 font-medium">{member.name}</h3>
                        <p className="text-gray-500 text-sm">{member.role === 'admin' ? 'Team admin' : 'Member'}</p>
                      </div>
                    </div>
                  ))}
                  
                  <button className="w-full mt-2 flex items-center justify-center p-2 border border-dashed border-gray-300 rounded-full text-gray-500 hover:text-gray-700 hover:border-gray-400">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Add member</span>
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">Goals</h2>
                  <button className="px-2 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
                    Create goal
                  </button>
                </div>
                
                {team.goals.length > 0 ? (
                  <div className="space-y-4">
                    {team.goals.map(goal => (
                      <div key={goal.id} className="space-y-2">
                        <div className="flex justify-between">
                          <h3 className="text-gray-800 font-medium">{goal.title}</h3>
                          <span className="text-gray-500 text-sm">{goal.progress}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded overflow-hidden">
                          <div 
                            className="h-full bg-green-500" 
                            style={{ width: `${goal.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500 mb-2">This team hasn't created any goals yet</p>
                    <p className="text-gray-500 text-sm">Add a goal so the team can see what you hope to achieve.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'work' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Projects</h2>
                <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  New project
                </button>
              </div>
              
              <div className="mb-4">
                <div className="flex justify-between items-center border-b border-gray-200 py-2">
                  <h3 className="text-gray-600 font-medium">Name</h3>
                  <h3 className="text-gray-600 font-medium">Members</h3>
                </div>
                
                {team.projects.length > 0 ? (
                  <div>
                    {team.projects.map(project => (
                      <div key={project.id} className="flex justify-between items-center py-4 border-b border-gray-100 hover:bg-gray-50">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded bg-purple-100 flex items-center justify-center text-lg mr-3">
                            {project.icon}
                          </div>
                          <span className="text-gray-800">{project.name}</span>
                        </div>
                        <div className="flex">
                          {team.members.slice(0, 1).map(member => (
                            <div key={member.id} className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-medium -ml-2 first:ml-0 border-2 border-white">
                              {member.name.charAt(0)}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No projects found</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Templates</h2>
              <div className="space-y-4">
                <button className="w-full flex flex-col items-center justify-center p-6 border border-dashed border-gray-300 rounded-lg text-gray-500 hover:text-gray-700 hover:border-gray-400">
                  <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  <span>New Template</span>
                </button>
                
                <button className="w-full flex flex-col items-center justify-center p-6 border border-dashed border-gray-300 rounded-lg text-gray-500 hover:text-gray-700 hover:border-gray-400">
                  <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                  </svg>
                  <span>Explore all templates</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Team Messages</h2>
            <p className="text-gray-500">No messages yet. Start a conversation with your team!</p>
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Team Calendar</h2>
            <p className="text-gray-500">Calendar view is coming soon.</p>
          </div>
        )}

        {activeTab === 'knowledge' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Knowledge Base</h2>
            <p className="text-gray-500">Your team's knowledge base is empty. Start adding documents and resources!</p>
          </div>
        )}
      </main>

      {/* Modal para invitar miembros */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Invite to team</h2>
              <button onClick={() => setShowInviteModal(false)} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              <input 
                type="text" 
                placeholder="Add team members by name or email..." 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="mb-4">
              <h3 className="text-gray-700 font-medium mb-2">Members</h3>
              <div className="max-h-60 overflow-y-auto">
                {team.members.map(member => (
                  <div key={member.id} className="flex items-center justify-between py-2">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-medium mr-3">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-gray-800 font-medium">{member.name}</h4>
                        <p className="text-gray-500 text-sm">{member.email}</p>
                      </div>
                    </div>
                    <div className="text-gray-500 text-sm">
                      {member.role === 'admin' ? 'Team admin' : 'Member'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end">
              <button 
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded mr-2 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Invite
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para configuración del equipo */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Team settings</h2>
              <button onClick={() => setShowSettings(false)} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                <button className="px-4 py-2 border-b-2 border-blue-500 font-medium text-blue-600">
                  General
                </button>
                <button className="px-4 py-2 border-b-2 border-transparent font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
                  Members
                </button>
                <button className="px-4 py-2 border-b-2 border-transparent font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
                  Advanced
                </button>
              </nav>
            </div>
            
            <div className="py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Organization</label>
                <div className="text-gray-900">miorg.edu.gt</div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Team name</label>
                <input 
                  type="text" 
                  value={team.name}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
                  placeholder="Add a description..."
                ></textarea>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Team status</label>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                  <span>Endorsed</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">Endorsed teams are recommended by admins in your organization.</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Team privacy</label>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input 
                      type="radio" 
                      name="privacy" 
                      id="request" 
                      checked 
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <label htmlFor="request" className="ml-2 block">
                      <span className="text-gray-900 font-medium">Membership by request</span>
                      <p className="text-sm text-gray-500">A member has to request to join this team</p>
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input 
                      type="radio" 
                      name="privacy" 
                      id="private"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <label htmlFor="private" className="ml-2 block">
                      <span className="text-gray-900 font-medium">Private</span>
                      <p className="text-sm text-gray-500">Only invited members can access</p>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 