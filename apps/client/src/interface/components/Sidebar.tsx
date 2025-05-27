import { FunctionComponent } from 'preact';
import { Link, useLocation } from 'wouter-preact';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
}

export const Sidebar: FunctionComponent<SidebarProps> = ({ isOpen }) => {
  const [location] = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // Función para verificar si un enlace está activo
  const isActive = (path: string) => {
    if (path === '/dashboard' && location === '/dashboard') {
      return true;
    }
    if (path === '/boards' && (location === '/boards' || location.startsWith('/boards/'))) {
      return true;
    }
    if (path === '/teams' && (location === '/teams' || location.startsWith('/teams/'))) {
      return true;
    }
    if (path === '/projects' && (location === '/projects' || location.startsWith('/projects/'))) {
      return true;
    }
    return location === path;
  };

  // La clase base para todos los enlaces del menú
  const baseLinkClass = "flex items-center px-4 py-2 rounded-lg font-medium";
  // Clase para enlaces activos
  const activeLinkClass = "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:bg-opacity-30 dark:text-blue-200";
  // Clase para enlaces inactivos
  const inactiveLinkClass = "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700";

  return (
    <aside 
      className={`fixed inset-y-0 left-0 z-20 w-64 overflow-y-auto bg-white dark:bg-gray-800 transition-transform duration-300 ease-in-out transform ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}
    >
      <div className="h-14 border-b dark:border-gray-700 flex items-center px-4">
        <Link href="/dashboard">
          <div className="flex items-center space-x-2">
            <svg className="w-8 h-8 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
            </svg>
            <span className="font-semibold text-gray-800 dark:text-white">ProjectApp</span>
          </div>
        </Link>
      </div>

      <nav className="mt-5 px-2 space-y-1">
        <Link href="/dashboard">
          <div className={`${baseLinkClass} ${isActive('/dashboard') ? activeLinkClass : inactiveLinkClass}`}>
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Inicio
          </div>
        </Link>
        
        {isAdmin && (
          <Link href="/projects">
            <div className={`${baseLinkClass} ${isActive('/projects') ? activeLinkClass : inactiveLinkClass}`}>
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Proyectos
            </div>
          </Link>
        )}
        
        <Link href="/boards">
          <div className={`${baseLinkClass} ${isActive('/boards') ? activeLinkClass : inactiveLinkClass}`}>
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Tableros
          </div>
        </Link>

        <Link href="/teams">
          <div className={`${baseLinkClass} ${isActive('/teams') ? activeLinkClass : inactiveLinkClass}`}>
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Equipos
          </div>
        </Link>

        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <h3 className="px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Crear Nuevo
          </h3>
        </div>

        <Link href="/boards/new">
          <div className={`${baseLinkClass} ${isActive('/boards/new') ? activeLinkClass : inactiveLinkClass}`}>
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Nuevo Tablero
          </div>
        </Link>

        <Link href="/teams/new">
          <div className={`${baseLinkClass} ${isActive('/teams/new') ? activeLinkClass : inactiveLinkClass}`}>
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Nuevo Equipo
          </div>
        </Link>

        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <h3 className="px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Mi Cuenta
          </h3>
        </div>

        <Link href="/profile">
          <div className={`${baseLinkClass} ${isActive('/profile') ? activeLinkClass : inactiveLinkClass}`}>
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Mi Perfil
          </div>
        </Link>

        <Link href="/notifications">
          <div className={`${baseLinkClass} ${isActive('/notifications') ? activeLinkClass : inactiveLinkClass}`}>
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            Notificaciones
          </div>
        </Link>

        <Link href="/settings">
          <div className={`${baseLinkClass} ${isActive('/settings') ? activeLinkClass : inactiveLinkClass}`}>
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Configuración
          </div>
        </Link>
      </nav>
    </aside>
  );
}; 