import { useEffect, useState } from 'preact/hooks';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'wouter-preact';
import UserManagementForm from '../components/UserManagement/UserManagementForm';
import { useTheme } from '../context/ThemeContext';

const AdminUsersPage = () => {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  useEffect(() => {
    // Redirigir a inicio de sesión si no está autenticado
    if (!loading && !user) {
      setLocation('/login');
      return;
    }

    // Verificar si el usuario es administrador
    if (user && user.role === 'admin') {
      setIsAuthorized(true);
    } else if (!loading) {
      // Redirigir a página principal si no es administrador
      setLocation('/');
    }
  }, [user, loading, setLocation]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null; // La redirección se maneja en el useEffect
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          Panel de Administración
        </h1>
        <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Gestiona los usuarios del sistema
        </p>
      </div>

      <UserManagementForm />
    </div>
  );
};

export default AdminUsersPage; 