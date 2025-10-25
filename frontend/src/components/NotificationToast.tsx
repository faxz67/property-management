import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  AlertTriangle, 
  UserPlus, 
  Wrench, 
  Database,
  X,
  Bell
} from 'lucide-react';
import notificationService from '../services/notificationService';
import '../styles/navigation-animations.css';

interface ToastNotification {
  id: string;
  type: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  icon: string;
  color: string;
}

const NotificationToast: React.FC = () => {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  useEffect(() => {
    const unsubscribe = notificationService.addListener((notifications) => {
      // Filtrer les nouvelles notifications non lues
      const newNotifications = notifications.filter(notification => !notification.read);
      
      // Créer des toasts pour les nouvelles notifications
      const newToasts = newNotifications.map(notification => ({
        id: notification.id,
        type: notification.type,
        priority: notification.priority,
        title: notification.title,
        message: notification.message,
        icon: notification.icon,
        color: notification.color
      }));

      // Ajouter les nouveaux toasts
      setToasts(prevToasts => {
        const existingIds = prevToasts.map(toast => toast.id);
        const uniqueNewToasts = newToasts.filter(toast => !existingIds.includes(toast.id));
        return [...prevToasts, ...uniqueNewToasts];
      });
    });

    return unsubscribe;
  }, []);

  const getNotificationIcon = (iconName: string, color: string) => {
    const iconProps = { className: `w-5 h-5 text-${color}-600` };
    
    switch (iconName) {
      case 'alert-triangle':
        return <AlertTriangle {...iconProps} />;
      case 'user-plus':
        return <UserPlus {...iconProps} />;
      case 'check-circle':
        return <CheckCircle {...iconProps} />;
      case 'wrench':
        return <Wrench {...iconProps} />;
      case 'database':
        return <Database {...iconProps} />;
      default:
        return <Bell {...iconProps} />;
    }
  };

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50 shadow-red-200';
      case 'medium':
        return 'border-l-orange-500 bg-orange-50 shadow-orange-200';
      case 'low':
        return 'border-l-blue-500 bg-blue-50 shadow-blue-200';
      default:
        return 'border-l-gray-500 bg-gray-50 shadow-gray-200';
    }
  };

  const removeToast = (toastId: string) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== toastId));
  };

  const handleToastClick = (toastId: string) => {
    // Marquer la notification comme lue
    notificationService.markAsRead(toastId);
    // Supprimer le toast
    removeToast(toastId);
  };

  // Auto-remove toasts after 5 seconds
  useEffect(() => {
    toasts.forEach(toast => {
      const timer = setTimeout(() => {
        removeToast(toast.id);
      }, 5000);

      return () => clearTimeout(timer);
    });
  }, [toasts]);

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          className={`max-w-sm w-full bg-white rounded-lg shadow-lg border-l-4 ${getPriorityStyles(toast.priority)} p-4 nav-item-enter-delay-${Math.min(index + 1, 5)}`}
          style={{
            animation: 'slideInRight 0.3s ease-out'
          }}
        >
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              {getNotificationIcon(toast.icon, toast.color)}
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900">
                {toast.title}
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                {toast.message}
              </p>
            </div>
            
            <div className="flex-shrink-0">
              <button
                onClick={() => removeToast(toast.id)}
                className="text-gray-400 hover:text-gray-600 nav-transition nav-hover-scale"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="mt-3 flex items-center justify-between">
            <button
              onClick={() => handleToastClick(toast.id)}
              className="text-xs text-blue-600 hover:text-blue-800 nav-transition nav-hover-scale"
            >
              Marquer comme lu
            </button>
            
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                toast.priority === 'high' ? 'bg-red-500' :
                toast.priority === 'medium' ? 'bg-orange-500' : 'bg-blue-500'
              }`}></div>
              <span className="text-xs text-gray-500">
                {toast.priority === 'high' ? 'Haute' :
                 toast.priority === 'medium' ? 'Moyenne' : 'Basse'}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationToast;
