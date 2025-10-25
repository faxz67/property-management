// Data Service for Automatic Data Fetching with French Dates

import api from '../api';
import { 
  formatFrenchDate, 
  formatFrenchDateTime, 
  getCurrentFrenchDate,
  getCurrentFrenchDateTime,
  isOverdue,
  getDaysUntilDue,
  formatFrenchCurrency,
  getCurrentMonth,
  getCurrentDate,
  getDueDate
} from '../utils/dateUtils';

/**
 * Enhanced data service with automatic fetching and French formatting
 */
class DataService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache
    this.refreshInterval = null;
    this.isRefreshing = false;
  }

  /**
   * Check if data is cached and still valid
   * @param {string} key - Cache key
   * @returns {boolean} True if data is cached and valid
   */
  isCacheValid(key) {
    const cached = this.cache.get(key);
    if (!cached) return false;
    return Date.now() - cached.timestamp < this.cacheTimeout;
  }

  /**
   * Get cached data
   * @param {string} key - Cache key
   * @returns {any} Cached data or null
   */
  getCachedData(key) {
    const cached = this.cache.get(key);
    return cached ? cached.data : null;
  }

  /**
   * Set cached data
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   */
  setCachedData(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Start automatic data refresh
   * @param {number} interval - Refresh interval in milliseconds (default: 2 minutes)
   */
  startAutoRefresh(interval = 2 * 60 * 1000) {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    
    this.refreshInterval = setInterval(() => {
      this.refreshAllData();
    }, interval);
    
    console.log('🔄 Auto-refresh started with interval:', interval / 1000, 'seconds');
  }

  /**
   * Stop automatic data refresh
   */
  stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
      console.log('⏹️ Auto-refresh stopped');
    }
  }

  /**
   * Refresh all data
   */
  async refreshAllData() {
    if (this.isRefreshing) return;
    
    this.isRefreshing = true;
    console.log('🔄 Refreshing all data...');
    
    try {
      await Promise.all([
        this.fetchProperties(),
        this.fetchTenants(),
        this.fetchBills(),
        this.fetchBillsStats(),
        this.fetchExpenses()
      ]);
      console.log('✅ All data refreshed successfully');
    } catch (error) {
      console.error('❌ Error refreshing data:', error);
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Fetch properties with French formatting and photos
   */
  async fetchProperties() {
    const cacheKey = 'properties';
    
    if (this.isCacheValid(cacheKey)) {
      return this.getCachedData(cacheKey);
    }

    try {
      console.log('🏠 Fetching properties with photos...');
      const response = await api.listProperties();
      
      if (response.data?.success && response.data?.data?.properties) {
        const properties = await Promise.all(
          response.data.data.properties.map(async (property) => {
            // Fetch photos for each property
            let photos = [];
            try {
              const photosResponse = await api.getPropertyPhotos(property.id);
              if (photosResponse.data?.success && photosResponse.data?.data?.photos) {
                photos = photosResponse.data.data.photos.map(photo => ({
                  ...photo,
                  // Normalize photo URL for display
                  display_url: this.normalizePhotoUrl(photo.file_url),
                  // Add French formatted dates
                  created_at_fr: formatFrenchDate(photo.created_at),
                  updated_at_fr: photo.updated_at ? formatFrenchDate(photo.updated_at) : null
                }));
              }
            } catch (photoError) {
              console.warn(`⚠️ Could not fetch photos for property ${property.id}:`, photoError);
            }

            return {
              ...property,
              // Add photos
              photos: photos,
              primary_photo: photos.find(photo => photo.is_primary) || photos[0] || null,
              // Add French formatted dates
              created_at_fr: formatFrenchDate(property.created_at),
              updated_at_fr: property.updated_at ? formatFrenchDate(property.updated_at) : null,
              // Format currency
              rent_formatted: formatFrenchCurrency(property.rent || property.monthly_rent || 0),
              // Add status indicators
              is_active: property.status === 'ACTIVE',
              status_fr: property.status === 'ACTIVE' ? 'Actif' : 'Inactif',
              // Add display information
              display_title: property.title || property.name || 'Propriété sans nom',
              display_address: this.formatAddress(property),
              // Add photo count
              photo_count: photos.length,
              has_photos: photos.length > 0
            };
          })
        );
        
        this.setCachedData(cacheKey, properties);
        console.log('✅ Properties fetched with photos:', properties.length);
        return properties;
      }
      
      throw new Error('Invalid response structure');
    } catch (error) {
      console.error('❌ Error fetching properties:', error);
      throw error;
    }
  }

  /**
   * Fetch tenants with French formatting
   */
  async fetchTenants() {
    const cacheKey = 'tenants';
    
    if (this.isCacheValid(cacheKey)) {
      return this.getCachedData(cacheKey);
    }

    try {
      console.log('👥 Fetching tenants...');
      const response = await api.listTenants();
      
      if (response.data?.success && response.data?.data?.tenants) {
        const tenants = response.data.data.tenants.map(tenant => ({
          ...tenant,
          // Add French formatted dates
          created_at_fr: formatFrenchDate(tenant.created_at),
          updated_at_fr: tenant.updated_at ? formatFrenchDate(tenant.updated_at) : null,
          move_in_date_fr: tenant.move_in_date ? formatFrenchDate(tenant.move_in_date) : null,
          move_out_date_fr: tenant.move_out_date ? formatFrenchDate(tenant.move_out_date) : null,
          // Format currency
          rent_amount_formatted: tenant.rent_amount ? formatFrenchCurrency(tenant.rent_amount) : null,
          // Add status indicators
          is_active: tenant.status === 'ACTIVE' || tenant.is_active === true,
          status_fr: tenant.status === 'ACTIVE' || tenant.is_active === true ? 'Actif' : 'Inactif',
          // Add display name
          display_name: tenant.fullName || tenant.full_name || tenant.name || 'Locataire'
        }));
        
        this.setCachedData(cacheKey, tenants);
        console.log('✅ Tenants fetched:', tenants.length);
        return tenants;
      }
      
      throw new Error('Invalid response structure');
    } catch (error) {
      console.error('❌ Error fetching tenants:', error);
      throw error;
    }
  }

  /**
   * Fetch bills with French formatting and status analysis
   */
  async fetchBills(filters = {}) {
    const cacheKey = `bills_${JSON.stringify(filters)}`;
    
    if (this.isCacheValid(cacheKey)) {
      return this.getCachedData(cacheKey);
    }

    try {
      console.log('💳 Fetching bills...');
      const response = await api.listBills(filters);
      
      if (response.data?.success && response.data?.data?.bills) {
        const bills = response.data.data.bills.map(bill => {
          const dueDate = new Date(bill.due_date);
          const paymentDate = bill.payment_date ? new Date(bill.payment_date) : null;
          const isOverdueBill = isOverdue(bill.due_date);
          const daysUntilDue = getDaysUntilDue(bill.due_date);
          
          return {
            ...bill,
            // Add French formatted dates
            created_at_fr: formatFrenchDate(bill.created_at),
            due_date_fr: formatFrenchDate(bill.due_date),
            payment_date_fr: paymentDate ? formatFrenchDate(paymentDate) : null,
            // Format currency
            amount_formatted: formatFrenchCurrency(bill.amount || bill.total_amount || 0),
            rent_amount_formatted: bill.rent_amount ? formatFrenchCurrency(bill.rent_amount) : null,
            charges_formatted: bill.charges ? formatFrenchCurrency(bill.charges) : null,
            total_amount_formatted: formatFrenchCurrency(bill.total_amount || bill.amount || 0),
            // Add status analysis
            is_overdue: isOverdueBill,
            days_until_due: daysUntilDue,
            status_fr: this.getBillStatusFrench(bill.status),
            priority: this.getBillPriority(bill.status, isOverdueBill, daysUntilDue),
            // Add display information
            tenant_display_name: bill.tenant?.name || bill.tenant?.fullName || 'Locataire',
            property_display_name: bill.property?.title || bill.property?.name || 'Propriété'
          };
        });
        
        this.setCachedData(cacheKey, bills);
        console.log('✅ Bills fetched:', bills.length);
        return bills;
      }
      
      throw new Error('Invalid response structure');
    } catch (error) {
      console.error('❌ Error fetching bills:', error);
      throw error;
    }
  }

  /**
   * Fetch bills statistics with French formatting
   */
  async fetchBillsStats() {
    const cacheKey = 'bills_stats';
    
    if (this.isCacheValid(cacheKey)) {
      return this.getCachedData(cacheKey);
    }

    try {
      console.log('📊 Fetching bills statistics...');
      const response = await api.getBillsStats();
      
      if (response.data?.success && response.data?.data) {
        const stats = response.data.data;
        const enhancedStats = {
          ...stats,
          // Format currency
          totalAmount_formatted: formatFrenchCurrency(stats.totalAmount || 0),
          paidAmount_formatted: formatFrenchCurrency(stats.paidAmount || 0),
          pendingAmount_formatted: formatFrenchCurrency(stats.pendingAmount || 0),
          overdueAmount_formatted: formatFrenchCurrency(stats.overdueAmount || 0),
          // Add French labels
          totalBills_fr: `${stats.totalBills || 0} facture${(stats.totalBills || 0) > 1 ? 's' : ''}`,
          paidBills_fr: `${stats.paidBills || 0} facture${(stats.paidBills || 0) > 1 ? 's' : ''} payée${(stats.paidBills || 0) > 1 ? 's' : ''}`,
          pendingBills_fr: `${stats.pendingBills || 0} facture${(stats.pendingBills || 0) > 1 ? 's' : ''} en attente`,
          overdueBills_fr: `${stats.overdueBills || 0} facture${(stats.overdueBills || 0) > 1 ? 's' : ''} en retard`,
          // Add current date info
          last_updated: getCurrentFrenchDateTime(),
          last_updated_timestamp: new Date().toISOString()
        };
        
        this.setCachedData(cacheKey, enhancedStats);
        console.log('✅ Bills statistics fetched');
        return enhancedStats;
      }
      
      throw new Error('Invalid response structure');
    } catch (error) {
      console.error('❌ Error fetching bills statistics:', error);
      throw error;
    }
  }

  /**
   * Fetch expenses with French formatting
   */
  async fetchExpenses() {
    const cacheKey = 'expenses';
    
    if (this.isCacheValid(cacheKey)) {
      return this.getCachedData(cacheKey);
    }

    try {
      console.log('💰 Fetching expenses...');
      const response = await api.listExpenses();
      
      if (response.data?.success && response.data?.data?.expenses) {
        const expenses = response.data.data.expenses.map(expense => ({
          ...expense,
          // Add French formatted dates
          created_at_fr: formatFrenchDate(expense.created_at),
          date_fr: expense.date ? formatFrenchDate(expense.date) : null,
          // Format currency
          amount_formatted: formatFrenchCurrency(expense.amount || 0),
          // Add display information
          category_fr: this.getExpenseCategoryFrench(expense.category),
          status_fr: expense.status === 'APPROVED' ? 'Approuvé' : 'En attente'
        }));
        
        this.setCachedData(cacheKey, expenses);
        console.log('✅ Expenses fetched:', expenses.length);
        return expenses;
      }
      
      throw new Error('Invalid response structure');
    } catch (error) {
      console.error('❌ Error fetching expenses:', error);
      throw error;
    }
  }

  /**
   * Get bill status in French
   * @param {string} status - Bill status
   * @returns {string} French status
   */
  getBillStatusFrench(status) {
    const statusMap = {
      'PENDING': 'En attente',
      'PAID': 'Payé',
      'OVERDUE': 'En retard',
      'RECEIPT_SENT': 'Reçu envoyé',
      'CANCELLED': 'Annulé'
    };
    return statusMap[status] || status;
  }

  /**
   * Get bill priority based on status and due date
   * @param {string} status - Bill status
   * @param {boolean} isOverdue - Is bill overdue
   * @param {number} daysUntilDue - Days until due date
   * @returns {string} Priority level
   */
  getBillPriority(status, isOverdue, daysUntilDue) {
    if (status === 'PAID') return 'low';
    if (isOverdue) return 'critical';
    if (daysUntilDue <= 3) return 'high';
    if (daysUntilDue <= 7) return 'medium';
    return 'low';
  }

  /**
   * Get expense category in French
   * @param {string} category - Expense category
   * @returns {string} French category
   */
  getExpenseCategoryFrench(category) {
    const categoryMap = {
      'MAINTENANCE': 'Maintenance',
      'REPAIRS': 'Réparations',
      'UTILITIES': 'Services publics',
      'INSURANCE': 'Assurance',
      'TAXES': 'Taxes',
      'ADMINISTRATIVE': 'Administratif',
      'OTHER': 'Autre'
    };
    return categoryMap[category] || category;
  }

  /**
   * Get dashboard summary with all data
   */
  async getDashboardSummary() {
    try {
      console.log('📊 Fetching dashboard summary...');
      
      const [properties, tenants, bills, stats, expenses] = await Promise.all([
        this.fetchProperties(),
        this.fetchTenants(),
        this.fetchBills({ limit: 10 }),
        this.fetchBillsStats(),
        this.fetchExpenses()
      ]);

      const summary = {
        properties: {
          total: properties.length,
          active: properties.filter(p => p.is_active).length,
          data: properties
        },
        tenants: {
          total: tenants.length,
          active: tenants.filter(t => t.is_active).length,
          data: tenants
        },
        bills: {
          total: bills.length,
          pending: bills.filter(b => b.status === 'PENDING').length,
          overdue: bills.filter(b => b.is_overdue).length,
          paid: bills.filter(b => b.status === 'PAID').length,
          data: bills
        },
        stats: stats,
        expenses: {
          total: expenses.length,
          data: expenses
        },
        last_updated: getCurrentFrenchDateTime(),
        last_updated_timestamp: new Date().toISOString()
      };

      console.log('✅ Dashboard summary fetched');
      return summary;
    } catch (error) {
      console.error('❌ Error fetching dashboard summary:', error);
      throw error;
    }
  }

  /**
   * Create a new bill with current date defaults
   */
  getNewBillDefaults() {
    return {
      tenant_id: 0,
      property_id: 0,
      amount: 0,
      month: getCurrentMonth(),
      due_date: getDueDate(),
      description: 'Paiement de loyer mensuel',
      status: 'PENDING'
    };
  }

  /**
   * Normalize photo URL for display
   * @param {string} photoUrl - The photo URL from the database
   * @returns {string} Normalized URL for display
   */
  normalizePhotoUrl(photoUrl) {
    if (!photoUrl) return null;
    
    // If it's already a full URL, return as is
    if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) {
      return photoUrl;
    }
    
    // If it starts with /uploads, prefix with backend base URL
    if (photoUrl.startsWith('/uploads')) {
      const backendBaseUrl = this.getBackendBaseUrl();
      return `${backendBaseUrl}${photoUrl}`;
    }
    
    // If it's a relative path, construct the full URL
    const backendBaseUrl = this.getBackendBaseUrl();
    return `${backendBaseUrl}/uploads${photoUrl.startsWith('/') ? '' : '/'}${photoUrl}`;
  }

  /**
   * Get backend base URL
   * @returns {string} Backend base URL
   */
  getBackendBaseUrl() {
    // Get from environment or use default
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4002/api';
    return apiBaseUrl.replace('/api', '');
  }

  /**
   * Format property address
   * @param {Object} property - Property object
   * @returns {string} Formatted address
   */
  formatAddress(property) {
    const parts = [];
    
    if (property.address) parts.push(property.address);
    if (property.city) parts.push(property.city);
    if (property.country) parts.push(property.country);
    
    return parts.join(', ') || 'Adresse non spécifiée';
  }

  /**
   * Get current system status
   */
  getSystemStatus() {
    return {
      cache_size: this.cache.size,
      is_auto_refresh_active: !!this.refreshInterval,
      is_refreshing: this.isRefreshing,
      current_time: getCurrentFrenchDateTime(),
      timezone: 'Europe/Paris',
      backend_base_url: this.getBackendBaseUrl()
    };
  }
}

// Create singleton instance
const dataService = new DataService();

export default dataService;
