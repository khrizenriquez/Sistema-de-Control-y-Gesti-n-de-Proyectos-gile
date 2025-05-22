import { api } from '../../infrastructure/api';

export interface Notification {
  id: string;
  user_id: string;
  content: string;
  type: string;
  entity_id: string;
  created_at: string;
  read: boolean;
  data?: any;
}

export interface NotificationUI {
  id: string;
  title: string;
  message: string;
  type: 'task' | 'mention' | 'invite' | 'system';
  read: boolean;
  date: Date;
  sender?: {
    name: string;
    avatar?: string;
  };
  link?: string;
  entityId: string;
}

export class NotificationService {
  async getNotifications(markAsRead: boolean = false): Promise<NotificationUI[]> {
    try {
      const response = await api.get(`/api/boards/notifications?mark_as_read=${markAsRead}`);
      return this.transformNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  async markAsRead(notificationId: string): Promise<void> {
    try {
      await api.put(`/api/boards/notifications/${notificationId}/read`);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await api.delete(`/api/boards/notifications/${notificationId}`);
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  async markAllAsRead(): Promise<void> {
    try {
      await api.put('/api/boards/notifications/mark-all-read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  private transformNotifications(notifications: Notification[]): NotificationUI[] {
    return notifications.map(notification => {
      const notificationUI: NotificationUI = {
        id: notification.id,
        title: this.getTitleFromType(notification.type),
        message: notification.content,
        type: this.mapNotificationType(notification.type),
        read: notification.read,
        date: new Date(notification.created_at),
        entityId: notification.entity_id,
        link: this.getLinkFromNotification(notification)
      };

      // Añadir información del remitente si está disponible en los datos
      if (notification.data) {
        if (notification.type === 'card_assigned' && notification.data.assigner_name) {
          notificationUI.sender = {
            name: notification.data.assigner_name,
          };
        } else if (notification.type === 'card_comment' && notification.data.commenter_name) {
          notificationUI.sender = {
            name: notification.data.commenter_name,
          };
        }
      }

      return notificationUI;
    });
  }

  private getTitleFromType(type: string): string {
    switch (type) {
      case 'card_assigned':
        return 'Asignación de tarea';
      case 'card_comment':
        return 'Mención en comentario';
      case 'invite':
        return 'Invitación a un equipo';
      case 'system':
        return 'Actualización del sistema';
      default:
        return 'Notificación';
    }
  }

  private mapNotificationType(type: string): 'task' | 'mention' | 'invite' | 'system' {
    switch (type) {
      case 'card_assigned':
        return 'task';
      case 'card_comment':
        return 'mention';
      case 'invite':
        return 'invite';
      default:
        return 'system';
    }
  }

  private getLinkFromNotification(notification: Notification): string | undefined {
    // Generar enlaces basados en el tipo y los datos de la notificación
    if (notification.data) {
      switch (notification.type) {
        case 'card_assigned':
        case 'card_comment':
          if (notification.data.board_id && notification.data.card_id) {
            return `/boards/${notification.data.board_id}?card=${notification.data.card_id}`;
          }
          break;
        case 'invite':
          if (notification.data.team_id) {
            return `/teams/${notification.data.team_id}`;
          }
          break;
      }
    }
    return undefined;
  }
} 