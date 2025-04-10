import { FunctionComponent, JSX } from 'preact';
import { useState } from 'preact/hooks';
import { Link } from 'wouter-preact';
import { useTheme } from '../../context/ThemeContext';

// Importar iconos
import { 
  IconHome, IconUser, IconClipboardList, IconPlus, 
  IconUsers, IconMenu2, IconX, IconMoon, IconSun 
} from '../../icons';

interface LayoutProps {
  children: JSX.Element | JSX.Element[];
}

export const Layout: FunctionComponent<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { isDarkTheme, toggleTheme } = useTheme();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className={`min-h-screen flex flex-col ${isDarkTheme ? 'dark' : ''}`}>
      {/* Barra superior */}
      <header className="bg-white dark:bg-gray-800 shadow-sm py-4 px-4 md:px-6 flex justify-between items-center">
        <div className="flex items-center">
          {/* Botón del menú móvil */}
          <button 
            onClick={toggleSidebar}
            className="md:hidden mr-3 text-gray-600 dark:text-gray-300"
            aria-label="Toggle sidebar"
          >
            {isSidebarOpen ? <IconX size={24} /> : <IconMenu2 size={24} />}
          </button>
          
          {/* Logo */}
          <Link href="/dashboard">
            <a className="text-xl font-bold text-blue-600 dark:text-blue-400">
              Ágile
            </a>
          </Link>
        </div>

        {/* Buscador */}
        <div className="hidden md:block flex-1 max-w-md mx-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar..."
              className="bg-gray-100 dark:bg-gray-700 w-full py-2 pl-4 pr-10 rounded-lg border-0 focus:ring-2 focus:ring-blue-500 dark:text-white"
            />
            <div className="absolute right-3 top-2.5 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        {/* Acciones de usuario */}
        <div className="flex items-center space-x-4">
          {/* Botón de tema */}
          <button 
            onClick={toggleTheme} 
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Toggle theme"
          >
            {isDarkTheme 
              ? <IconSun size={20} className="text-yellow-400" /> 
              : <IconMoon size={20} className="text-gray-600" />
            }
          </button>
          
          {/* Botón de notificaciones */}
          <Link href="/notifications">
            <div className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 relative">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
              </svg>
              {/* Indicador de notificaciones */}
              <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500"></span>
            </div>
          </Link>
          
          {/* Dropdown de usuario */}
          <div className="relative group">
            <button className="flex items-center space-x-2 focus:outline-none">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                KH
              </div>
            </button>
            
            {/* Menú del dropdown */}
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-20 hidden group-hover:block">
              <Link href="/profile">
                <div className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                  Perfil
                </div>
              </Link>
              <Link href="/settings">
                <div className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                  Configuración
                </div>
              </Link>
              <hr className="my-1 dark:border-gray-600" />
              <button 
                className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Menú lateral */}
        <nav 
          className={`
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
            md:translate-x-0
            fixed md:static top-0 left-0 h-full md:h-auto z-30 md:z-0
            w-64 bg-white dark:bg-gray-800 shadow-lg md:shadow-none
            transition-transform duration-300 ease-in-out
            pt-20 md:pt-0 flex-shrink-0
          `}
        >
          <div className="h-full md:h-[calc(100vh-4rem)] overflow-y-auto px-4 py-6">
            <ul className="space-y-2">
              <li>
                <Link href="/dashboard">
                  <div className="flex items-center p-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                    <IconHome size={20} className="mr-3" />
                    <span>Inicio</span>
                  </div>
                </Link>
              </li>
              <li>
                <Link href="/profile">
                  <div className="flex items-center p-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                    <IconUser size={20} className="mr-3" />
                    <span>Perfil</span>
                  </div>
                </Link>
              </li>
              <li>
                <Link href="/boards">
                  <div className="flex items-center p-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                    <IconClipboardList size={20} className="mr-3" />
                    <span>Tableros</span>
                  </div>
                </Link>
              </li>
              <li>
                <Link href="/boards/new">
                  <div className="flex items-center p-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                    <IconPlus size={20} className="mr-3" />
                    <span>Nuevo tablero</span>
                  </div>
                </Link>
              </li>
              <li>
                <Link href="/teams">
                  <div className="flex items-center p-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                    <IconUsers size={20} className="mr-3" />
                    <span>Equipos</span>
                  </div>
                </Link>
              </li>
            </ul>
          </div>
        </nav>

        {/* Contenido principal */}
        <main className="flex-1 p-4 md:p-6 bg-gray-50 dark:bg-gray-900">
          {/* Overlay para cerrar sidebar en móvil */}
          {isSidebarOpen && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
              onClick={toggleSidebar}
              aria-hidden="true"
            ></div>
          )}
          
          {children}
        </main>
      </div>
    </div>
  );
}; 