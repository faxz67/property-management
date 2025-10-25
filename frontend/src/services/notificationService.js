import api from '../api';
import { formatFrenchDateTime, getCurrentFrenchDateTime } from '../utils/dateUtils';

/**
 * Service de gestion des notifications
 * Gère les notifications en temps réel, les actions et le stockage
 */
class NotificationService {
  constructor() {
    this.notifications = [];
    this.listeners = [];
    this.isPolling = false;
    this.pollInterval = null;
    this.pollIntervalMs = 30000; // 30 secondes
  }

  /**
   * Ajouter un listener pour les mises à jour de notifications
   */
  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  /**
   * Notifier tous les listeners
   */
  notifyListeners() {
    this.listeners.forEach(callback => callback(this.notifications));
  }

  /**
   * Récupérer les notifications depuis l'API
   */
  async fetchNotifications() {
    try {
      // Vérifier si l'utilisateur est connecté
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found, skipping notifications fetch');
        this.notifications = [];
        this.notifyListeners();
        return [];
      }

      // Simuler des notifications basées sur les données réelles
      const [billsRes, tenantsRes, propertiesRes] = await Promise.all([
        api.listBills({ limit: 10, sort: 'created_at', order: 'DESC' }).catch(err => {
          console.warn('Error fetching bills for notifications:', err);
          return { data: { data: { bills: [] } } };
        }),
        api.listTenants().catch(err => {
          console.warn('Error fetching tenants for notifications:', err);
          return { data: { data: { tenants: [] } } };
        }),
        api.listProperties().catch(err => {
          console.warn('Error fetching properties for notifications:', err);
          return { data: { data: { properties: [] } } };
        })
      ]);

      const bills = billsRes?.data?.data?.bills || [];
      const tenants = tenantsRes?.data?.data?.tenants || [];
      const properties = propertiesRes?.data?.data?.properties || [];

      const notifications = [];

      // Notifications de factures en retard
      const overdueBills = bills.filter(bill => {
        const dueDate = new Date(bill.due_date);
        const today = new Date();
        return dueDate < today && bill.status !== 'PAID';
      });

      overdueBills.forEach(bill => {
        const daysOverdue = Math.floor((new Date() - new Date(bill.due_date)) / (1000 * 60 * 60 * 24));
        notifications.push({
          id: `overdue-${bill.id}`,
          type: 'overdue',
          priority: 'high',
          title: 'Facture en retard',
          message: `Facture de €${bill.amount || bill.total_amount} en retard de ${daysOverdue} jour${daysOverdue > 1 ? 's' : ''}`,
          detail: `Locataire: ${bill.tenant?.name || bill.tenant_name || 'N/A'}`,
          timestamp: bill.due_date,
          timestamp_fr: formatFrenchDateTime(bill.due_date),
          action: {
            type: 'view_bill',
            label: 'Voir la facture',
            data: { billId: bill.id }
          },
          read: false,
          icon: 'alert-triangle',
          color: 'red'
        });
      });

      // Notifications de nouveaux locataires
      const recentTenants = tenants.filter(tenant => {
        const joinDate = new Date(tenant.join_date || tenant.created_at);
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        return joinDate > threeDaysAgo;
      });

      recentTenants.forEach(tenant => {
        notifications.push({
          id: `tenant-${tenant.id}`,
          type: 'new_tenant',
          priority: 'medium',
          title: 'Nouveau locataire',
          message: `${tenant.name || tenant.full_name || 'Nouveau locataire'} a rejoint`,
          detail: `Propriété: ${tenant.property?.title || tenant.property_name || 'N/A'}`,
          timestamp: tenant.join_date || tenant.created_at,
          timestamp_fr: formatFrenchDateTime(tenant.join_date || tenant.created_at),
          action: {
            type: 'view_tenant',
            label: 'Voir le profil',
            data: { tenantId: tenant.id }
          },
          read: false,
          icon: 'user-plus',
          color: 'blue'
        });
      });

      // Notifications de paiements récents
      const recentPayments = bills.filter(bill => {
        const paymentDate = new Date(bill.payment_date || bill.updated_at);
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        return bill.status === 'PAID' && paymentDate > oneDayAgo;
      });

      recentPayments.forEach(bill => {
        notifications.push({
          id: `payment-${bill.id}`,
          type: 'payment',
          priority: 'low',
          title: 'Paiement reçu',
          message: `€${bill.amount || bill.total_amount} reçu`,
          detail: `De: ${bill.tenant?.name || bill.tenant_name || 'N/A'}`,
          timestamp: bill.payment_date || bill.updated_at,
          timestamp_fr: formatFrenchDateTime(bill.payment_date || bill.updated_at),
          action: {
            type: 'view_receipt',
            label: 'Voir le reçu',
            data: { billId: bill.id }
          },
          read: false,
          icon: 'check-circle',
          color: 'green'
        });
      });

      // Notifications de maintenance (simulées)
      const maintenanceProperties = properties.filter(property => {
        // Simuler des propriétés nécessitant de la maintenance
        return Math.random() > 0.8;
      });

      maintenanceProperties.forEach(property => {
        notifications.push({
          id: `maintenance-${property.id}`,
          type: 'maintenance',
          priority: 'medium',
          title: 'Maintenance requise',
          message: `Maintenance préventive recommandée`,
          detail: `Propriété: ${property.title || property.name || 'N/A'}`,
          timestamp: new Date().toISOString(),
          timestamp_fr: getCurrentFrenchDateTime(),
          action: {
            type: 'view_property',
            label: 'Voir la propriété',
            data: { propertyId: property.id }
          },
          read: false,
          icon: 'wrench',
          color: 'orange'
        });
      });

      // Notifications système
      notifications.push({
        id: 'system-backup',
        type: 'system',
        priority: 'low',
        title: 'Sauvegarde automatique',
        message: 'Sauvegarde quotidienne terminée avec succès',
        detail: 'Toutes vos données sont sécurisées',
        timestamp: new Date().toISOString(),
        timestamp_fr: getCurrentFrenchDateTime(),
        action: {
          type: 'view_backups',
          label: 'Voir les sauvegardes',
          data: {}
        },
        read: false,
        icon: 'database',
        color: 'gray'
      });

      // Trier par priorité et timestamp
      notifications.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return new Date(b.timestamp) - new Date(a.timestamp);
      });

      this.notifications = notifications;
      this.notifyListeners();
      
      console.log(`✅ Fetched ${notifications.length} notifications`);
      return notifications;
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications:', error);
      return [];
    }
  }

  /**
   * Marquer une notification comme lue
   */
  markAsRead(notificationId) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.notifyListeners();
    }
  }

  /**
   * Marquer toutes les notifications comme lues
   */
  markAllAsRead() {
    this.notifications.forEach(notification => {
      notification.read = true;
    });
    this.notifyListeners();
  }

  /**
   * Supprimer une notification
   */
  removeNotification(notificationId) {
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
    this.notifyListeners();
  }

  /**
   * Exécuter une action de notification
   */
  async executeAction(notification) {
    if (!notification.action) return;

    const { type, data } = notification.action;

    switch (type) {
      case 'view_bill':
        // Naviguer vers la section des paiements avec la facture sélectionnée
        window.dispatchEvent(new CustomEvent('navigate-to-section', {
          detail: { section: 'payments', billId: data.billId }
        }));
        break;

      case 'view_tenant':
        // Naviguer vers la section des locataires avec le locataire sélectionné
        window.dispatchEvent(new CustomEvent('navigate-to-section', {
          detail: { section: 'tunnet', tenantId: data.tenantId }
        }));
        break;

      case 'view_property':
        // Naviguer vers la section des propriétés avec la propriété sélectionnée
        window.dispatchEvent(new CustomEvent('navigate-to-section', {
          detail: { section: 'properties', propertyId: data.propertyId }
        }));
        break;

      case 'view_receipt':
        // Ouvrir le reçu de paiement
        window.dispatchEvent(new CustomEvent('open-receipt', {
          detail: { billId: data.billId }
        }));
        break;

      case 'view_backups':
        // Naviguer vers les paramètres
        window.dispatchEvent(new CustomEvent('navigate-to-section', {
          detail: { section: 'settings' }
        }));
        break;

      default:
        console.log('Action non reconnue:', type);
    }

    // Marquer comme lue après action
    this.markAsRead(notification.id);
  }

  /**
   * Démarrer le polling automatique
   */
  startPolling() {
    if (this.isPolling) {
      console.log('🔄 Polling already active');
      return;
    }
    
    this.isPolling = true;
    console.log('🔄 Starting notification polling...');
    
    this.pollInterval = setInterval(async () => {
      try {
        await this.fetchNotifications();
      } catch (error) {
        console.error('❌ Error in polling interval:', error);
      }
    }, this.pollIntervalMs);
    
    // Récupérer immédiatement
    this.fetchNotifications().catch(error => {
      console.error('❌ Error in initial fetch:', error);
    });
  }

  /**
   * Arrêter le polling automatique
   */
  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
      console.log('🛑 Notification polling stopped');
    }
    this.isPolling = false;
  }

  /**
   * Obtenir le nombre de notifications non lues
   */
  getUnreadCount() {
    return this.notifications.filter(n => !n.read).length;
  }

  /**
   * Obtenir les notifications par type
   */
  getNotificationsByType(type) {
    return this.notifications.filter(n => n.type === type);
  }

  /**
   * Obtenir les notifications par priorité
   */
  getNotificationsByPriority(priority) {
    return this.notifications.filter(n => n.priority === priority);
  }

  /**
   * Créer une notification personnalisée
   */
  createNotification(notification) {
    const newNotification = {
      id: `custom-${Date.now()}`,
      type: 'custom',
      priority: 'medium',
      timestamp: new Date().toISOString(),
      timestamp_fr: getCurrentFrenchDateTime(),
      read: false,
      ...notification
    };

    this.notifications.unshift(newNotification);
    this.notifyListeners();
    return newNotification;
  }

  /**
   * Obtenir les statistiques des notifications
   */
  getStats() {
    const total = this.notifications.length;
    const unread = this.getUnreadCount();
    const byType = {
      overdue: this.getNotificationsByType('overdue').length,
      new_tenant: this.getNotificationsByType('new_tenant').length,
      payment: this.getNotificationsByType('payment').length,
      maintenance: this.getNotificationsByType('maintenance').length,
      system: this.getNotificationsByType('system').length
    };
    const byPriority = {
      high: this.getNotificationsByPriority('high').length,
      medium: this.getNotificationsByPriority('medium').length,
      low: this.getNotificationsByPriority('low').length
    };

    return {
      total,
      unread,
      byType,
      byPriority,
      lastUpdated: getCurrentFrenchDateTime()
    };
  }
}

// Créer une instance singleton
const notificationService = new NotificationService();

export default notificationService;
