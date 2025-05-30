import { FunctionComponent } from 'preact';
import { useState, useRef, useEffect } from 'preact/hooks';
import { Link, useLocation } from 'wouter-preact';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  onMenuToggle: () => void;
}

export const Header: FunctionComponent<HeaderProps> = ({ onMenuToggle }) => {
  const { isDarkTheme, toggleTheme } = useTheme();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownTimeoutRef = useRef<number | null>(null);
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        // Añadir un retraso antes de cerrar el menú para mejor UX
        dropdownTimeoutRef.current = window.setTimeout(() => {
          setIsDropdownOpen(false);
        }, 200);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      // Limpiar timeout al desmontar
      if (dropdownTimeoutRef.current) {
        window.clearTimeout(dropdownTimeoutRef.current);
      }
    };
  }, []);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
    
    // Limpiar cualquier timeout existente
    if (dropdownTimeoutRef.current) {
      window.clearTimeout(dropdownTimeoutRef.current);
      dropdownTimeoutRef.current = null;
    }
  };

  const handleLogout = async () => {
    try {
      const result = await logout();
      if (result.success) {
        console.log('Sesión cerrada correctamente');
        setLocation('/');
      } else {
        console.error('Error al cerrar sesión:', result.error);
      }
    } catch (error) {
      console.error('Error en el proceso de logout:', error);
    }
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-30">
      <div className="max-w-full mx-auto px-4 h-16 flex items-center justify-between">
        {/* Botón de menú para móviles */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <span className="material-icons text-gray-600 dark:text-gray-200">menu</span>
        </button>

        {/* Logo (visible solo en desktop cuando el menú lateral está oculto) */}
        <div className="hidden lg:flex items-center space-x-2">
          <span className="material-icons text-blue-600 dark:text-blue-400">dashboard</span>
          <h1 className="text-xl font-semibold text-gray-800 dark:text-white">Kanban App</h1>
        </div>

        {/* Buscador */}
        <div className="flex-1 max-w-xl mx-4">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center">
              <span className="material-icons text-gray-400">search</span>
            </span>
            <input
              type="text"
              placeholder="Buscar..."
              className="w-full pl-10 pr-4 py-2 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Sección de acciones - derecha */}
        <div className="flex items-center space-x-4">
          {/* Botón de tema */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <span className="material-icons text-gray-600 dark:text-gray-200">
              {isDarkTheme ? 'light_mode' : 'dark_mode'}
            </span>
          </button>

          {/* Botón de notificaciones */}
          <Link href="/notifications">
            <div className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 relative">
              <span className="material-icons text-gray-600 dark:text-gray-200">notifications</span>
              <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">
                3
              </span>
            </div>
          </Link>

          {/* Dropdown de usuario */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={toggleDropdown}
              className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {user?.name ? (
                <div className="h-8 w-8 rounded-full bg-blue-500 text-white flex items-center justify-center">
                  {user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                </div>
              ) : (
                <img
                  src="https://i.pravatar.cc/32"
                  alt="Avatar"
                  className="h-8 w-8 rounded-full"
                />
              )}
              <span className="material-icons text-gray-600 dark:text-gray-200">
                {isDropdownOpen ? 'arrow_drop_up' : 'arrow_drop_down'}
              </span>
            </button>

            {isDropdownOpen && (
              <div 
                className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-200 dark:border-gray-700"
                onMouseEnter={() => {
                  // Cancelar cierre del menú si el ratón está sobre él
                  if (dropdownTimeoutRef.current) {
                    window.clearTimeout(dropdownTimeoutRef.current);
                    dropdownTimeoutRef.current = null;
                  }
                }}
              >
                {user && (
                  <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-800 dark:text-white">{user.name || 'Usuario'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                  </div>
                )}
                <Link href="/profile">
                  <div className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                    <span className="material-icons mr-2 text-gray-500 dark:text-gray-400 align-middle text-sm">person</span>
                    Mi perfil
                  </div>
                </Link>
                <Link href="/notifications">
                  <div className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                    <span className="material-icons mr-2 text-gray-500 dark:text-gray-400 align-middle text-sm">notifications</span>
                    Notificaciones
                  </div>
                </Link>
                <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <span className="material-icons mr-2 text-gray-500 dark:text-gray-400 align-middle text-sm">logout</span>
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}; 