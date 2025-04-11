import { FunctionComponent } from 'preact';
import { Link } from 'wouter-preact';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SideMenu: FunctionComponent<SideMenuProps> = ({ isOpen, onClose }) => {
  const menuItems = [
    { label: 'Dashboard', path: '/dashboard', icon: 'home' },
    { label: 'Tableros', path: '/boards', icon: 'dashboard' },
    { label: 'Crear tablero', path: '/boards/new', icon: 'add_box' },
    { label: 'Equipos', path: '/teams', icon: 'group' },
    { label: 'Mi perfil', path: '/profile', icon: 'person' }
  ];

  return (
    <div>
      {/* Overlay para dispositivos móviles */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Menú principal */}
      <aside 
        className={`
          fixed top-0 left-0 bottom-0 z-50 
          w-64 bg-white dark:bg-gray-800 shadow-lg 
          transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:relative lg:z-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          flex flex-col
        `}
      >
        {/* Logo y botón cerrar */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <span className="material-icons text-blue-600 dark:text-blue-400">dashboard</span>
            <h1 className="text-xl font-semibold text-gray-800 dark:text-white">Kanban App</h1>
          </div>
          <button 
            onClick={onClose}
            className="lg:hidden rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <span className="material-icons text-gray-600 dark:text-gray-300">close</span>
          </button>
        </div>

        {/* Enlaces de navegación */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link href={item.path}>
                  <div
                    className="flex items-center px-4 py-3 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={onClose}
                  >
                    <span className="material-icons mr-3">{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Pie del menú */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <span className="material-icons mr-3">help_outline</span>
            <span>Ayuda</span>
          </div>
        </div>
      </aside>
    </div>
  );
}; 