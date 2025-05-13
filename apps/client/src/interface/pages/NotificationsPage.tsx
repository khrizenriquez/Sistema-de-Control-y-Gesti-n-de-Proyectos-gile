import { FunctionComponent } from 'preact';
import { useState } from 'preact/hooks';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'task' | 'mention' | 'invite' | 'system';
  read: boolean;
  date: Date;
  sender?: {
    name: string;
    avatar: string;
  };
  link?: string;
}

export const NotificationsPage: FunctionComponent = () => {
  // Datos de ejemplo para las notificaciones
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'Asignación de tarea',
      message: 'Te han asignado una nueva tarea en el tablero "Desarrollo Web"',
      type: 'task',
      read: false,
      date: new Date(Date.now() - 1000 * 60 * 30), // 30 minutos atrás
      sender: {
        name: 'María García',
        avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
      },
      link: '/boards/1'
    },
    {
      id: '2',
      title: 'Mención en comentario',
      message: 'Carlos te ha mencionado en un comentario: "@usuario ¿Podrías revisar este problema?"',
      type: 'mention',
      read: false,
      date: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 horas atrás
      sender: {
        name: 'Carlos Rodríguez',
        avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
      },
      link: '/boards/2/card/15'
    },
    {
      id: '3',
      title: 'Invitación a un equipo',
      message: 'Has sido invitado al equipo "Diseño UI/UX"',
      type: 'invite',
      read: true,
      date: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 día atrás
      sender: {
        name: 'Laura Martínez',
        avatar: 'https://randomuser.me/api/portraits/women/22.jpg',
      },
      link: '/teams/5'
    },
    {
      id: '4',
      title: 'Actualización del sistema',
      message: 'El sistema se ha actualizado a la versión 2.3.0. Ver novedades.',
      type: 'system',
      read: true,
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 días atrás
      link: '/updates/2.3.0'
    }
  ]);

  // Función para marcar una notificación como leída
  const markAsRead = (id: string) => {
    setNotifications(notifications.map(notification => 
      notification.id === id ? { ...notification, read: true } : notification
    ));
  };

  // Función para marcar todas las notificaciones como leídas
  const markAllAsRead = () => {
    setNotifications(notifications.map(notification => ({ ...notification, read: true })));
  };

  // Función para eliminar una notificación
  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(notification => notification.id !== id));
  };

  // Función para formatear la fecha
  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    // Menos de un minuto
    if (diff < 60 * 1000) {
      return 'Ahora mismo';
    }
    
    // Menos de una hora
    if (diff < 60 * 60 * 1000) {
      const minutes = Math.floor(diff / (60 * 1000));
      return `Hace ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
    }
    
    // Menos de un día
    if (diff < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diff / (60 * 60 * 1000));
      return `Hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
    }
    
    // Menos de una semana
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      const days = Math.floor(diff / (24 * 60 * 60 * 1000));
      return `Hace ${days} ${days === 1 ? 'día' : 'días'}`;
    }
    
    // Formato de fecha normal
    return date.toLocaleDateString();
  };

  // Función para obtener el ícono según el tipo de notificación
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task':
        return (
          <div className="p-2 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
        );
      case 'mention':
        return (
          <div className="p-2 rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
            </svg>
          </div>
        );
      case 'invite':
        return (
          <div className="p-2 rounded-full bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
        );
      case 'system':
        return (
          <div className="p-2 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  const unreadCount = notifications.filter(notification => !notification.read).length;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          Notificaciones
          {unreadCount > 0 && (
            <span className="ml-2 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              {unreadCount} nuevas
            </span>
          )}
        </h1>
        
        <button
          onClick={markAllAsRead}
          disabled={unreadCount === 0}
          className={`px-4 py-2 text-sm font-medium rounded-lg ${
            unreadCount > 0
            ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
          }`}
        >
          Marcar todo como leído
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <svg className="w-16 h-16 text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p className="text-gray-600 dark:text-gray-400 text-lg">No tienes notificaciones</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {notifications.map((notification) => (
              <li
                key={notification.id}
                className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-750 ${
                  !notification.read ? 'bg-blue-50 dark:bg-blue-900 dark:bg-opacity-10' : ''
                }`}
              >
                <a
                  href={notification.link}
                  className="flex items-start space-x-4"
                  onClick={(e) => {
                    if (!notification.read) {
                      e.preventDefault();
                      markAsRead(notification.id);
                      if (notification.link) {
                        window.location.href = notification.link;
                      }
                    }
                  }}
                >
                  {/* Icono o avatar */}
                  {notification.sender ? (
                    <img
                      src={notification.sender.avatar}
                      alt={notification.sender.name}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    getNotificationIcon(notification.type)
                  )}
                  
                  {/* Contenido */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between">
                      <p className={`text-sm font-medium ${
                        !notification.read
                          ? 'text-gray-900 dark:text-white'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {notification.title}
                      </p>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(notification.date)}
                      </span>
                    </div>
                    
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {notification.message}
                    </p>
                    
                    {!notification.read && (
                      <span className="inline-block mt-2 w-2 h-2 rounded-full bg-blue-600"></span>
                    )}
                  </div>
                </a>
                
                {/* Acciones */}
                <div className="mt-2 flex justify-end space-x-2">
                  {!notification.read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    >
                      Marcar como leída
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notification.id)}
                    className="text-xs text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                  >
                    Eliminar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}; 