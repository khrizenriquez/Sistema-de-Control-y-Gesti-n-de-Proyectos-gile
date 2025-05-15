import { useState, useEffect, useRef } from 'preact/hooks';
import { useRoute, useLocation } from 'wouter-preact';
import { ProjectService } from '../../domain/services/ProjectService';
import { useTheme } from '../../context/ThemeContext';

interface ProjectMember {
  id: string;
  user_id: string;
  email: string;
  role: string;
  added_at: string;
}

export const ProjectMembersPage = () => {
  const [, params] = useRoute('/projects/:id/members');
  const [, navigate] = useLocation();
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('member');
  const [addingMember, setAddingMember] = useState(false);
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const dataFetchedRef = useRef(false);

  useEffect(() => {
    const fetchMembers = async () => {
      if (dataFetchedRef.current) return;
      
      try {
        if (params && params.id) {
          const membersData = await ProjectService.getProjectMembers(params.id);
          setMembers(membersData);
          dataFetchedRef.current = true;
        }
      } catch (err) {
        setError('Error al cargar los miembros del proyecto');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [params?.id]);

  const handleBackClick = () => {
    if (params && params.id) {
      navigate(`/projects/${params.id}`);
    } else {
      navigate('/projects');
    }
  };

  const handleAddMember = async () => {
    if (!newMemberEmail.trim()) {
      setError('El email es requerido');
      return;
    }

    try {
      setAddingMember(true);
      if (params && params.id) {
        await ProjectService.addProjectMember(params.id, newMemberEmail, newMemberRole);
        // Recargar la lista de miembros
        const membersData = await ProjectService.getProjectMembers(params.id);
        setMembers(membersData);
        setNewMemberEmail('');
        setError(null);
        dataFetchedRef.current = false;
      }
    } catch (err) {
      setError('Error al añadir el miembro al proyecto');
      console.error(err);
    } finally {
      setAddingMember(false);
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'product_owner':
        return 'Product Owner';
      case 'developer':
        return 'Desarrollador';
      case 'member':
        return 'Miembro';
      default:
        return role;
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

  const inputClass = isDarkMode
    ? 'bg-gray-700 text-white border-gray-600 focus:ring-blue-500 focus:border-transparent'
    : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent';

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full p-8">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          Miembros del proyecto
        </h1>
        <button
          className={secondaryButtonClass}
          onClick={handleBackClick}
        >
          Volver al proyecto
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className={`mb-6 p-4 rounded-lg shadow ${cardClass}`}>
        <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          Añadir miembro
        </h2>
        <div className="flex flex-wrap gap-2">
          <div className="flex-grow">
            <input
              type="email"
              placeholder="Email del usuario"
              value={newMemberEmail}
              onChange={(e: Event) => {
                const target = e.target as HTMLInputElement;
                setNewMemberEmail(target.value);
              }}
              disabled={addingMember}
              className={`w-full p-2 border rounded ${inputClass}`}
            />
          </div>
          <div className="w-48">
            <select
              className={`w-full p-2 border rounded ${isDarkMode ? 'dark:bg-gray-800 dark:border-gray-700' : ''}`}
              value={newMemberRole}
              onChange={(e: Event) => {
                const target = e.target as HTMLSelectElement;
                setNewMemberRole(target.value);
              }}
              disabled={addingMember}
            >
              <option value="member">Miembro</option>
              <option value="developer">Desarrollador</option>
              <option value="product_owner">Product Owner</option>
            </select>
          </div>
          <button
            onClick={handleAddMember}
            disabled={addingMember}
            className={`${buttonClass} ${addingMember ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {addingMember ? 'Añadiendo...' : 'Añadir'}
          </button>
        </div>
      </div>

      <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
        Miembros actuales
      </h2>
      {members.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">
          Este proyecto no tiene miembros asignados.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Añadido
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {member.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getRoleName(member.role)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(member.added_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}; 