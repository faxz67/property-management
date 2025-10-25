import axios from 'axios';

// Development API base URL
const getApiBaseURL = () => {
    // Use environment variable if available, otherwise use production default
    if (import.meta.env.VITE_API_BASE_URL) {
        return import.meta.env.VITE_API_BASE_URL;
    }
    // Production: API is on the same domain/IP (172.29.190.149)
    return window.location.origin + '/api';
};

const apiBaseURL = getApiBaseURL();
console.log('🚀 API Base URL:', apiBaseURL);

const api = axios.create({
    baseURL: apiBaseURL,
    withCredentials: true,
    timeout: 15000, // Optimized timeout for better UX
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    },
    // Enable request/response compression
    decompress: true,
    // Optimize for performance
    maxRedirects: 3,
    validateStatus: (status) => status < 500 // Don't throw for 4xx errors
});

// Request interceptor with performance optimizations
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');

        // Add request timestamp for performance monitoring
        config.metadata = { startTime: Date.now() };

        // Log request details in development
        if (import.meta.env.DEV) {
            console.log('API Request:', {
                url: config.url,
                hasToken: !!token,
                method: config.method,
                headers: config.headers
            });
        }

        // Don't set Content-Type for FormData
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        }

        // Add auth token if available
        if (token) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Add request ID for tracking
        config.headers['X-Request-ID'] = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Note: Removed cache-control headers to avoid CORS issues

        return config;
    },
    (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor with performance monitoring and better error handling
api.interceptors.response.use(
    (response) => {
        // Log performance metrics in development
        if (import.meta.env.DEV && response.config.metadata) {
            const duration = Date.now() - response.config.metadata.startTime;
            console.log(`API Response: ${response.config.method?.toUpperCase()} ${response.config.url} - ${duration}ms`);
        }
        return response;
    },
    (error) => {
        // Log performance metrics for errors
        if (import.meta.env.DEV && error.config?.metadata) {
            const duration = Date.now() - error.config.metadata.startTime;
            console.error(`API Error: ${error.config.method?.toUpperCase()} ${error.config.url} - ${duration}ms`);
        }

        // Network error
        if (!error.response) {
            console.error('Network error:', error);
            
            // Provide more specific error messages
            if (error.code === 'ECONNABORTED') {
                return Promise.reject(new Error('Request timeout. Please try again.'));
            } else if (error.code === 'ERR_NETWORK') {
                return Promise.reject(new Error('Network error. Please check your internet connection.'));
            } else {
                return Promise.reject(new Error('Network error. Please check your connection.'));
            }
        }

        // API error with response
        const errorMessage = error.response.data?.error || 'An unexpected error occurred';
        const status = error.response.status;
        
        if (import.meta.env.DEV) {
            console.error('API error:', {
                status,
                message: errorMessage,
                url: error.config?.url,
                method: error.config?.method,
                data: error.response.data
            });
        }

        // Handle specific HTTP status codes
        switch (status) {
            case 401:
                console.log('Authentication expired, redirecting to login');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/';
                return Promise.reject(new Error('Session expired. Please login again.'));
            
            case 403:
                return Promise.reject(new Error('Access denied. You do not have permission to perform this action.'));
            
            case 404:
                return Promise.reject(new Error('Resource not found.'));
            
            case 409:
                return Promise.reject(new Error('Conflict. The resource already exists or is in use.'));
            
            case 422:
                return Promise.reject(new Error('Validation error. Please check your input.'));
            
            case 429:
                return Promise.reject(new Error('Too many requests. Please wait a moment and try again.'));
            
            case 500:
                return Promise.reject(new Error('Server error. Please try again later.'));
            
            case 503:
                return Promise.reject(new Error('Service temporarily unavailable. Please try again later.'));
            
            default:
                // Enhance error object with friendly message
                error.userMessage = errorMessage;
                return Promise.reject(error);
        }
    }
);

// Simple cache implementation for API responses
const cache = new Map();
const CACHE_DURATION = 0; // Disable caching for now

const getCachedData = (key) => {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
    }
    cache.delete(key);
    return null;
};

const setCachedData = (key, data) => {
    cache.set(key, {
        data,
        timestamp: Date.now()
    });
};

// Clear cache when user logs out
export const clearCache = () => {
    cache.clear();
    console.log('API cache cleared');
};

// Auth
export const login = (email, password) => api.post('/auth/login', { email, password });
// Backend exposes profile at /auth/profile
export const me = () => {
    return api.get('/auth/profile');
};
export const updateProfile = (payload) => {
    // Clear profile cache when updating
    cache.delete('user_profile');
    return api.put('/auth/profile', payload);
};
export const registerAdmin = (payload) => api.post('/auth/register', payload);

// Admins (super admin)
export const listAdmins = () => {
    return api.get('/admins');
};
export const createAdmin = (payload) => {
    cache.delete('admins_list'); // Clear cache when creating
    return api.post('/admins', payload);
};
export const deleteAdmin = (id) => {
    cache.delete('admins_list'); // Clear cache when deleting
    return api.delete(`/admins/${id}`);
};
export const updateAdmin = (id, payload) => {
    cache.delete('admins_list'); // Clear cache when updating
    return api.put(`/admins/${id}`, payload);
};

// Aliases matching requested names
export const getAdmins = () => listAdmins();
export const addAdmin = (payload) => createAdmin(payload);

// Tenants (admin/super)
export const listTenants = () => {
    console.log('🔧 API: listTenants called');
    console.log('🔧 Token present:', !!localStorage.getItem('token'));
    return api.get('/tenants');
};
export const createTenant = (payload) => {
    cache.delete('tenants_list');
    return api.post('/tenants', payload);
};
export const updateTenant = (id, payload) => {
    cache.delete('tenants_list');
    return api.put(`/tenants/${id}`, payload);
};
export const deleteTenantApi = (id) => {
    cache.delete('tenants_list');
    return api.delete(`/tenants/${id}`);
};

// Tenant Documents
export const uploadTenantDocuments = (tenantId, formData) => {
    return api.post(`/tenants/${tenantId}/documents`, formData);
};
export const getTenantDocuments = (tenantId) => {
    return api.get(`/tenants/${tenantId}/documents`);
};
export const deleteTenantDocument = (tenantId, documentId) => {
    return api.delete(`/tenants/${tenantId}/documents/${documentId}`);
};
export const updateTenantDocumentType = (tenantId, documentId, documentType) => {
    return api.put(`/tenants/${tenantId}/documents/${documentId}`, { document_type: documentType });
};

// Properties (admin)
export const listProperties = () => {
    console.log('🔧 API: listProperties called');
    console.log('🔧 Token present:', !!localStorage.getItem('token'));
    return api.get('/properties');
};
// Let axios/browser set the Content-Type (including the multipart boundary) when sending FormData
export const createProperty = (payload) => {
    cache.delete('properties_list');
    return api.post('/properties', payload);
};
export const updateProperty = (id, payload) => {
    cache.delete('properties_list');
    return api.put(`/properties/${id}`, payload);
};
export const deleteProperty = (id) => {
    cache.delete('properties_list');
    return api.delete(`/properties/${id}`);
};

// Property Photos
export const uploadPropertyPhotos = (propertyId, formData) => {
    return api.post(`/properties/${propertyId}/photos`, formData);
};
export const getPropertyPhotos = (propertyId) => {
    return api.get(`/properties/${propertyId}/photos`);
};
export const deletePropertyPhoto = (propertyId, photoId) => {
    return api.delete(`/properties/${propertyId}/photos/${photoId}`);
};
export const setPrimaryPropertyPhoto = (propertyId, photoId) => {
    return api.put(`/properties/${propertyId}/photos/${photoId}/primary`);
};

// Bills (admin)
export const listBills = (params = {}) => {
    return api.get('/bills', { params });
};
export const getBillsStats = () => {
    return api.get('/bills/stats');
};
export const getBillById = (id) => {
    return api.get(`/bills/${id}`);
};
export const createBill = (payload) => {
    // Clear all bill-related caches
    cache.delete('bills_stats');
    Array.from(cache.keys()).forEach(key => {
        if (key.startsWith('bills_list_')) cache.delete(key);
    });
    return api.post('/bills', payload);
};
export const updateBill = (id, payload) => {
    cache.delete(`bill_${id}`);
    cache.delete('bills_stats');
    Array.from(cache.keys()).forEach(key => {
        if (key.startsWith('bills_list_')) cache.delete(key);
    });
    return api.put(`/bills/${id}`, payload);
};
export const deleteBill = (id) => {
    cache.delete(`bill_${id}`);
    cache.delete('bills_stats');
    Array.from(cache.keys()).forEach(key => {
        if (key.startsWith('bills_list_')) cache.delete(key);
    });
    return api.delete(`/bills/${id}`);
};
export const getReceiptHistory = (id) => api.get(`/bills/${id}/receipts`);
export const markBillAsPaid = (id) => {
    cache.delete(`bill_${id}`);
    cache.delete('bills_stats');
    cache.delete('profits_total');
    Array.from(cache.keys()).forEach(key => {
        if (key.startsWith('bills_list_')) cache.delete(key);
    });
    return api.put(`/bills/${id}/pay`);
};

export const undoPayment = (id) => {
    cache.delete(`bill_${id}`);
    cache.delete('bills_stats');
    cache.delete('profits_total');
    Array.from(cache.keys()).forEach(key => {
        if (key.startsWith('bills_list_')) cache.delete(key);
    });
    return api.put(`/bills/${id}/undo`);
};

export const getTotalProfit = () => api.get('/bills/profits/total');

// Analytics
export const getAnalyticsOverview = (params = {}) => {
    return api.get('/analytics/overview', { params });
};

// Expenses
export const createExpense = (payload) => {
    cache.delete('expenses_list');
    return api.post('/expenses', payload);
};
export const listExpenses = () => {
    return api.get('/expenses');
};
export const deleteExpense = (id) => {
    cache.delete('expenses_list');
    return api.delete(`/expenses/${id}`);
};

// Aggregate the exported helper functions into a default API object so
// components that import the default `api` can call `api.listProperties()` etc.
const apiClient = {
    // Auth
    login,
    me,
    updateProfile,
    registerAdmin,

    // Admins
    listAdmins,
    createAdmin,
    deleteAdmin,
    updateAdmin,
    getAdmins,
    addAdmin,

    // Tenants
    listTenants,
    createTenant,
    updateTenant,
    deleteTenantApi,

    // Properties
    listProperties,
    createProperty,
    updateProperty,
    deleteProperty,

    // Property Photos
    uploadPropertyPhotos,
    getPropertyPhotos,
    deletePropertyPhoto,
    setPrimaryPropertyPhoto,

    // Tenant Documents
    uploadTenantDocuments,
    getTenantDocuments,
    deleteTenantDocument,
    updateTenantDocumentType,

    // Bills
    listBills,
    getBillsStats,
    getBillById,
    createBill,
    updateBill,
    deleteBill,
    getReceiptHistory,
    markBillAsPaid,
    undoPayment,
    getTotalProfit,

    // Analytics
    getAnalyticsOverview,

    // Expenses
    createExpense,
    listExpenses,
    deleteExpense,

    // Raw axios instance for advanced use
    raw: api,
};

export default apiClient;
