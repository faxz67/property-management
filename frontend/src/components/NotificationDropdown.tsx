import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  X, 
  CheckCircle, 
  AlertTriangle, 
  UserPlus, 
  Wrench, 
  Database,
  Eye,
  Trash2,
  Filter,
  RefreshCw,
  Settings,
  ChevronDown
} from 'lucide-react';
import notificationService from '../services/notificationService';
import '../styles/navigation-animations.css';

interface Notification {
  id: string;
  type: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  detail?: string;
  timestamp: string;
  timestamp_fr: string;
  action?: {
    type: string;
    label: string;
    data: any;
  };
  read: boolean;
  icon: string;
  color: string;
}

const NotificationDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'high' | 'medium' | 'low'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Écouter les mises à jour du service de notification
  useEffect(() => {
    const unsubscribe = notificationService.addListener((updatedNotifications) => {
      console.log('📢 Notifications updated:', updatedNotifications.length);
      setNotifications(updatedNotifications || []);
    });

    // Démarrer le polling automatique
    try {
      notificationService.startPolling();
      console.log('🔄 Notification polling started');
    } catch (error) {
      console.error('❌ Error starting notification polling:', error);
    }

    return () => {
      try {
        unsubscribe();
        notificationService.stopPolling();
        console.log('🛑 Notification polling stopped');
      } catch (error) {
        console.error('❌ Error stopping notification polling:', error);
      }
    };
  }, []);

  // Fermer le dropdown quand on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getNotificationIcon = (iconName: string, color: string) => {
    const iconProps = { className: `w-4 h-4 text-${color}-600` };
    
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50';
      case 'medium':
        return 'border-l-orange-500 bg-orange-50';
      case 'low':
        return 'border-l-blue-500 bg-blue-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    try {
      if (notification.action) {
        await notificationService.executeAction(notification);
      }
      notificationService.markAsRead(notification.id);
    } catch (error) {
      console.error('❌ Error handling notification click:', error);
    }
  };

  const handleMarkAllAsRead = () => {
    notificationService.markAllAsRead();
  };

  const handleRefresh = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('🔄 Refreshing notifications...');
      await notificationService.fetchNotifications();
      console.log('✅ Notifications refreshed');
    } catch (error) {
      console.error('❌ Error refreshing notifications:', error);
      setError('Erreur lors du chargement des notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveNotification = (notificationId: string) => {
    notificationService.removeNotification(notificationId);
  };

  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.read;
      case 'high':
        return notification.priority === 'high';
      case 'medium':
        return notification.priority === 'medium';
      case 'low':
        return notification.priority === 'low';
      default:
        return true;
    }
  });

  const unreadCount = notifications.filter(n => !n.read).length;
  const stats = notificationService.getStats();

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bouton de notification */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-blue-600 nav-transition nav-hover-scale"
        title="Notifications"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center nav-active-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-[9999] nav-item-enter-delay-1" style={{ maxHeight: '80vh', overflow: 'hidden' }}>
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="p-1 text-gray-400 hover:text-gray-600 nav-transition nav-hover-scale"
                  title="Actualiser"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 nav-transition nav-hover-scale"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filtres */}
            <div className="flex items-center space-x-2 mb-3">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">Toutes</option>
                <option value="unread">Non lues</option>
                <option value="high">Priorité haute</option>
                <option value="medium">Priorité moyenne</option>
                <option value="low">Priorité basse</option>
              </select>
            </div>

            {/* Statistiques */}
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>{filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''}</span>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-blue-600 hover:text-blue-800 nav-transition nav-hover-scale"
                >
                  Tout marquer comme lu
                </button>
              )}
            </div>
          </div>

          {/* Liste des notifications */}
          <div className="max-h-96 overflow-y-auto">
            {error ? (
              <div className="p-6 text-center text-red-500">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-red-300" />
                <p className="font-medium">Erreur de chargement</p>
                <p className="text-sm">{error}</p>
                <button
                  onClick={handleRefresh}
                  className="mt-2 text-blue-600 hover:text-blue-800 text-sm nav-transition nav-hover-scale"
                >
                  Réessayer
                </button>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>Aucune notification</p>
                <p className="text-sm">Vous êtes à jour !</p>
              </div>
            ) : (
              filteredNotifications.map((notification, index) => (
                <div
                  key={notification.id}
                  className={`p-4 border-l-4 ${getPriorityColor(notification.priority)} hover:bg-gray-50 nav-item-enter-delay-${Math.min(index + 1, 5)}`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.icon, notification.color)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className={`text-sm font-medium ${notification.read ? 'text-gray-600' : 'text-gray-900'}`}>
                          {notification.title}
                        </h4>
                        <div className="flex items-center space-x-1">
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                          <button
                            onClick={() => handleRemoveNotification(notification.id)}
                            className="p-1 text-gray-400 hover:text-red-600 nav-transition nav-hover-scale"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      
                      <p className={`text-sm ${notification.read ? 'text-gray-500' : 'text-gray-700'}`}>
                        {notification.message}
                      </p>
                      
                      {notification.detail && (
                        <p className="text-xs text-gray-500 mt-1">
                          {notification.detail}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-400">
                          {notification.timestamp_fr}
                        </span>
                        
                        {notification.action && (
                          <button
                            onClick={() => handleNotificationClick(notification)}
                            className="text-xs text-blue-600 hover:text-blue-800 nav-transition nav-hover-scale flex items-center space-x-1"
                          >
                            <Eye className="w-3 h-3" />
                            <span>{notification.action.label}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center space-x-4">
                <span>Total: {stats.total}</span>
                <span>Non lues: {stats.unread}</span>
              </div>
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('navigate-to-section', {
                    detail: { section: 'settings' }
                  }));
                  setIsOpen(false);
                }}
                className="text-blue-600 hover:text-blue-800 nav-transition nav-hover-scale flex items-center space-x-1"
              >
                <Settings className="w-4 h-4" />
                <span>Paramètres</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
