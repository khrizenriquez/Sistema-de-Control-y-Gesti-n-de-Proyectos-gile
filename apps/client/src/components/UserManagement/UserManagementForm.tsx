import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { User } from '../../domain/entities/User';
import { useAuth } from '../../context/AuthContext';
import { AuthApiAdapter } from '../../infrastructure/adapters/AuthApiAdapter';

interface UserFormData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: string;
  bio?: string;
  avatar_url?: string;
}

interface ProjectAssignment {
  projectId: string;
  projectName: string;
  role: string;
}

const UserManagementForm = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'member',
    bio: '',
    avatar_url: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [projects, setProjects] = useState<{ id: string, name: string }[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [projectRole, setProjectRole] = useState<string>('member');
  const [userAssignments, setUserAssignments] = useState<ProjectAssignment[]>([]);
  // Nuevos estados para la edición de roles
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingUserRole, setEditingUserRole] = useState<string>('');
  const [showRoleModal, setShowRoleModal] = useState<boolean>(false);
  const [updatingRole, setUpdatingRole] = useState<boolean>(false);
  
  const authApi = new AuthApiAdapter();

  // Solo los administradores pueden acceder a esta página
  useEffect(() => {
    if (currentUser?.role !== 'admin') {
      setError('Solo los administradores pueden gestionar usuarios');
      return;
    }
    
    // Cargar usuarios y proyectos
    loadUsers();
    loadProjects();
  }, [currentUser]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`${apiUrl}/api/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al cargar usuarios');
      }
      
      const data = await response.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`${apiUrl}/api/projects`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al cargar proyectos');
      }
      
      const data = await response.json();
      setProjects(data);
    } catch (err: any) {
      console.error('Error cargando proyectos:', err);
    }
  };

  const handleInputChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    
    setFormData((prev) => ({
      ...prev,
      [target.name]: target.value
    }));
  };

  const handleAddUser = async (e: Event) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    try {
      setLoading(true);
      
      // Validar los datos del formulario
      if (!formData.email || !formData.password || !formData.first_name || !formData.last_name) {
        setError('Todos los campos marcados con * son obligatorios');
        setLoading(false);
        return;
      }
      
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('authToken');
      
      // Crear el usuario con autenticación para permitir asignación automática
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      // Si hay token (admin autenticado), incluirlo para permitir asignación automática
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${apiUrl}/api/auth/register`, {
        method: 'POST',
        headers,
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al crear usuario');
      }
      
      // Obtener los datos del usuario creado
      const newUser = await response.json();
      
      // Mostrar mensaje de éxito con información sobre asignación automática
      let successMessage = 'Usuario creado correctamente';
      if (formData.role === 'product_owner' || formData.role === 'developer') {
        successMessage += '. Se ha asignado automáticamente a todos los proyectos existentes.';
      }
      
      // Asignaciones manuales adicionales (si las hay)
      if (userAssignments.length > 0 && token) {
        for (const assignment of userAssignments) {
          await fetch(`${apiUrl}/api/projects/${assignment.projectId}/members`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              member_email: newUser.email,
              role: assignment.role
            })
          });
        }
        successMessage += ' Asignaciones adicionales completadas.';
      }
      
      // Resetear el formulario
      setFormData({
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        role: 'member',
        bio: '',
        avatar_url: ''
      });
      
      setUserAssignments([]);
      setSuccess(successMessage);
      
      // Recargar la lista de usuarios
      loadUsers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProjectAssignment = () => {
    if (!selectedProject) return;
    
    const project = projects.find(p => p.id === selectedProject);
    if (!project) return;
    
    const alreadyAssigned = userAssignments.some(a => a.projectId === selectedProject);
    if (alreadyAssigned) {
      setError('Este proyecto ya ha sido asignado');
      return;
    }
    
    setUserAssignments(prev => [
      ...prev,
      {
        projectId: selectedProject,
        projectName: project.name,
        role: projectRole
      }
    ]);
    
    setSelectedProject('');
    setProjectRole('member');
  };

  const handleRemoveAssignment = (projectId: string) => {
    setUserAssignments(prev => prev.filter(a => a.projectId !== projectId));
  };

  const handleEditUserRole = (user: User) => {
    setEditingUserId(user.id);
    setEditingUserRole(user.role || 'member');
    setShowRoleModal(true);
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setEditingUserRole('');
    setShowRoleModal(false);
  };

  const handleUpdateRole = async () => {
    if (!editingUserId || !editingUserRole) return;
    
    try {
      setUpdatingRole(true);
      setError(null);
      
      // Llamar al método para actualizar el rol en Supabase Auth y en la base de datos
      const result = await authApi.updateUserRoleById(editingUserId, editingUserRole);
      
      if (result.success) {
        // Actualizar la lista de usuarios localmente
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === editingUserId ? {...user, role: editingUserRole} : user
          )
        );
        
        setSuccess(`Rol de usuario actualizado correctamente a: ${editingUserRole}`);
        handleCancelEdit(); // Cerrar el modal
      } else {
        setError(result.error || 'Error al actualizar el rol del usuario');
      }
    } catch (err: any) {
      setError(`Error: ${err.message}`);
    } finally {
      setUpdatingRole(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Gestión de Usuarios</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-md">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-md">
          {success}
        </div>
      )}
      
      <form onSubmit={handleAddUser} className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Crear Nuevo Usuario</h3>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block mb-1 font-medium">Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md"
              required
            />
          </div>
          
          <div>
            <label className="block mb-1 font-medium">Contraseña *</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md"
              required
            />
          </div>
          
          <div>
            <label className="block mb-1 font-medium">Nombre *</label>
            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md"
              required
            />
          </div>
          
          <div>
            <label className="block mb-1 font-medium">Apellido *</label>
            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md"
              required
            />
          </div>
          
          <div>
            <label className="block mb-1 font-medium">Rol del Usuario *</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md"
              required
            >
              <option value="admin">Administrador</option>
              <option value="product_owner">Product Owner</option>
              <option value="developer">Desarrollador</option>
              <option value="member">Miembro</option>
            </select>
          </div>
          
          <div>
            <label className="block mb-1 font-medium">URL de Avatar</label>
            <input
              type="text"
              name="avatar_url"
              value={formData.avatar_url}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md"
            />
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block mb-1 font-medium">Bio</label>
          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleInputChange}
            className="w-full p-2 border rounded-md"
            rows={3}
          />
        </div>
        
        <div className="mb-6">
          <h4 className="font-medium mb-2">Asignar a Proyectos</h4>
          
          <div className="flex gap-2 mb-2">
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject((e.target as HTMLSelectElement).value)}
              className="flex-1 p-2 border rounded-md"
            >
              <option value="">Seleccionar Proyecto</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
            
            <select
              value={projectRole}
              onChange={(e) => setProjectRole((e.target as HTMLSelectElement).value)}
              className="w-40 p-2 border rounded-md"
            >
              <option value="developer">Dev</option>
              <option value="product_owner">Product Owner</option>
              <option value="member">Miembro</option>
            </select>
            
            <button
              type="button"
              onClick={handleAddProjectAssignment}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              disabled={!selectedProject}
            >
              Añadir
            </button>
          </div>
          
          {userAssignments.length > 0 && (
            <div className="mt-2 border rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 text-left">Proyecto</th>
                    <th className="p-2 text-left">Rol</th>
                    <th className="p-2 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {userAssignments.map(assignment => (
                    <tr key={assignment.projectId} className="border-t">
                      <td className="p-2">{assignment.projectName}</td>
                      <td className="p-2">{assignment.role}</td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveAssignment(assignment.projectId)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        <button
          type="submit"
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
          disabled={loading}
        >
          {loading ? 'Creando Usuario...' : 'Crear Usuario'}
        </button>
      </form>
      
      <div>
        <h3 className="text-xl font-semibold mb-4">Usuarios Existentes</h3>
        
        {loading ? (
          <p>Cargando usuarios...</p>
        ) : users.length > 0 ? (
          <div className="border rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 text-left">Nombre</th>
                  <th className="p-2 text-left">Email</th>
                  <th className="p-2 text-left">Rol</th>
                  <th className="p-2 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="border-t">
                    <td className="p-2">{user.name}</td>
                    <td className="p-2">{user.email}</td>
                    <td className="p-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                        user.role === 'developer' ? 'bg-blue-100 text-blue-800' :
                        user.role === 'product_owner' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role === 'admin' ? 'Administrador' :
                         user.role === 'developer' ? 'Desarrollador' :
                         user.role === 'product_owner' ? 'Product Owner' :
                         'Miembro'}
                      </span>
                    </td>
                    <td className="p-2 text-center">
                      <button
                        type="button"
                        className="text-blue-600 hover:text-blue-800 mr-2"
                        onClick={() => handleEditUserRole(user)}
                      >
                        Cambiar Rol
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No hay usuarios para mostrar.</p>
        )}
      </div>
      
      {/* Modal para editar el rol del usuario */}
      {showRoleModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Cambiar Rol de Usuario</h3>
            
            <p className="mb-4">
              Selecciona el nuevo rol para el usuario:
            </p>
            
            <select
              value={editingUserRole}
              onChange={(e) => setEditingUserRole((e.target as HTMLSelectElement).value)}
              className="w-full p-2 border rounded-md mb-4"
            >
              <option value="admin">Administrador</option>
              <option value="product_owner">Product Owner</option>
              <option value="developer">Desarrollador</option>
              <option value="member">Miembro</option>
            </select>
            
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-4 py-2 border rounded-md hover:bg-gray-100"
              >
                Cancelar
              </button>
              
              <button
                type="button"
                onClick={handleUpdateRole}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                disabled={updatingRole}
              >
                {updatingRole ? 'Actualizando...' : 'Actualizar Rol'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementForm; 