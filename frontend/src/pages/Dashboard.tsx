import { useEffect, useState, useCallback } from 'react';
import { Search, Bell, Heart, X, Star, MapPin, Users, Bed, Bath, Wifi, Car, Coffee, Tv, LayoutDashboard, Building2, CreditCard, BarChart3, Settings as SettingsIcon, Shield, DollarSign, TrendingUp, Plus, Download, HelpCircle, Database } from 'lucide-react';
import '../styles/navigation-animations.css';
import dataService from '../services/dataService';
// import { useNavigate } from 'react-router-dom';
import TunnetSectionFixed from '../components/TunnetSectionFixed';
// Removed OverviewDashboard import due to type resolution issues
// import PaymentTracking from '../components/PaymentTracking';
import PaymentsManagement from '../components/PaymentsManagement';
import PropertiesSection from '../components/PropertiesSection';
import AdminManagement from './AdminManagement';
import ExpenseAnalytics from './ExpenseAnalytics';
import ApiDiagnostics from '../components/ApiDiagnostics';
import NotificationDropdown from '../components/NotificationDropdown';
import NotificationToast from '../components/NotificationToast';
import { listExpenses, listProperties, listTenants, getBillsStats, listBills } from '../api';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

// Types
interface DashboardProperty {
  id: number;
  title?: string;
  name?: string;
  rent?: number;
  monthly_rent?: number;
  [key: string]: any;
}


interface Activity {
  id: string;
  type: string;
  message: string;
  detail: string;
  time: string;
  color: string;
}

// Export functions
const exportToCSV = (data: any[], filename: string) => {
  if (!data || data.length === 0) {
    alert('Aucune donnée à exporter');
    return;
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const exportDashboardData = async () => {
  try {
    const [propertiesRes, tenantsRes, billsRes, expensesRes, billsStatsRes] = await Promise.all([
      listProperties(),
      listTenants(),
      listBills({ limit: 1000 }),
      listExpenses(),
      getBillsStats()
    ]);

    const properties = propertiesRes?.data?.data?.properties || [];
    const tenants = tenantsRes?.data?.data?.tenants || [];
    const bills = billsRes?.data?.data?.bills || [];
    const expenses = expensesRes?.data?.data?.expenses || [];
    const stats = billsStatsRes?.data?.data || {};

    // Export Properties
    if (properties.length > 0) {
      const propertiesData = properties.map((prop: any) => ({
        'ID': prop.id,
        'Titre': prop.title || prop.name || '',
        'Adresse': prop.address || '',
        'Ville': prop.city || '',
        'Pays': prop.country || '',
        'Loyer Mensuel': prop.rent || prop.monthly_rent || 0,
        'Type': prop.type || '',
        'Statut': prop.status || 'ACTIVE',
        'Date de Création': new Date(prop.created_at).toLocaleDateString('fr-FR')
      }));
      exportToCSV(propertiesData, 'proprietes');
    }

    // Export Tenants
    if (tenants.length > 0) {
      const tenantsData = tenants.map((tenant: any) => ({
        'ID': tenant.id,
        'Nom Complet': tenant.fullName || tenant.full_name || '',
        'Email': tenant.email || '',
        'Téléphone': tenant.phone || '',
        'Propriété': tenant.propertyName || tenant.property_name || '',
        'Statut': tenant.status || tenant.is_active ? 'ACTIF' : 'INACTIF',
        'Date d\'Entrée': tenant.move_in_date ? new Date(tenant.move_in_date).toLocaleDateString('fr-FR') : '',
        'Date de Création': new Date(tenant.created_at).toLocaleDateString('fr-FR')
      }));
      exportToCSV(tenantsData, 'locataires');
    }

    // Export Bills
    if (bills.length > 0) {
      const billsData = bills.map((bill: any) => ({
        'ID': bill.id,
        'Locataire': bill.tenantName || bill.tenant_name || '',
        'Propriété': bill.propertyName || bill.property_name || '',
        'Mois': bill.month || '',
        'Loyer': bill.rent_amount || bill.amount || 0,
        'Charges': bill.charges || 0,
        'Total': bill.total_amount || bill.amount || 0,
        'Statut': bill.status === 'PAID' ? 'PAYÉ' : 'EN ATTENTE',
        'Date de Paiement': bill.payment_date ? new Date(bill.payment_date).toLocaleDateString('fr-FR') : '',
        'Date de Création': new Date(bill.created_at).toLocaleDateString('fr-FR')
      }));
      exportToCSV(billsData, 'factures');
    }

    // Export Expenses
    if (expenses.length > 0) {
      const expensesData = expenses.map((expense: any) => ({
        'ID': expense.id,
        'Description': expense.description || '',
        'Type': expense.type || '',
        'Montant': expense.amount || 0,
        'Propriété': expense.propertyName || expense.property_name || '',
        'Date': expense.date ? new Date(expense.date).toLocaleDateString('fr-FR') : '',
        'Date de Création': new Date(expense.created_at).toLocaleDateString('fr-FR')
      }));
      exportToCSV(expensesData, 'depenses');
    }

    // Export Summary Statistics
    const summaryData = [{
      'Total Propriétés': properties.length,
      'Locataires Actifs': tenants.filter((t: any) => t.status === 'ACTIVE' || t.is_active).length,
      'Factures Total': bills.length,
      'Factures Payées': bills.filter((b: any) => b.status === 'PAID').length,
      'Factures En Attente': bills.filter((b: any) => b.status !== 'PAID').length,
      'Revenus Mensuels': (stats as any).totalAmount || 0,
      'Total Dépenses': expenses.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0),
      'Date d\'Export': new Date().toLocaleDateString('fr-FR')
    }];
    exportToCSV(summaryData, 'resume_dashboard');

    alert('Exportation terminée ! Tous les fichiers CSV ont été téléchargés.');
  } catch (error) {
    console.error('Erreur lors de l\'exportation:', error);
    alert('Erreur lors de l\'exportation des données. Veuillez réessayer.');
  }
};

// Real Statistics Component
const RealStatistics = ({ onError }: { onError?: (hasError: boolean) => void }) => {
  const [stats, setStats] = useState({
    totalProperties: 0,
    activeTenants: 0,
    monthlyRevenue: 0,
    pendingBills: 0,
    loading: true,
    error: null as string | null,
    lastUpdated: null as string | null
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Check if token exists before making API calls
        const token = localStorage.getItem('token');
        if (!token) {
          console.log('No token found, skipping API calls');
          setStats(prev => ({ ...prev, loading: false, error: 'No authentication token' }));
          onError?.(true);
          return;
        }

        setStats(prev => ({ ...prev, loading: true, error: null }));
        
        // Use the enhanced data service with French dates
        const summary = await dataService.getDashboardSummary();

        setStats({
          totalProperties: summary.properties.total,
          activeTenants: summary.tenants.active,
          monthlyRevenue: summary.stats.totalAmount || 0,
          pendingBills: summary.stats.pendingBills || 0,
          loading: false,
          error: null,
          lastUpdated: summary.last_updated
        });
        onError?.(false);
      } catch (error) {
        console.error('Error fetching statistics:', error);
        
        // Provide more specific error messages
        let errorMessage = 'Failed to load statistics';
        const errorMsg = (error as any)?.message || '';
        if (errorMsg.includes('Network error')) {
          errorMessage = 'Network connection error. Please check your internet connection.';
        } else if (errorMsg.includes('timeout')) {
          errorMessage = 'Request timeout. Please try again.';
        } else if (errorMsg.includes('401')) {
          errorMessage = 'Authentication error. Please login again.';
        } else if (errorMsg.includes('500')) {
          errorMessage = 'Server error. Please try again later.';
        }
        
        // Set fallback data so the dashboard doesn't break completely
        setStats({
          totalProperties: 0,
          activeTenants: 0,
          monthlyRevenue: 0,
          pendingBills: 0,
          loading: false,
          error: errorMessage,
          lastUpdated: null
        });
        onError?.(true);
      }
    };

    fetchStats();
    
    // Start auto-refresh for statistics
    dataService.startAutoRefresh(2 * 60 * 1000); // Refresh every 2 minutes
    
    // Cleanup on unmount
    return () => {
      dataService.stopAutoRefresh();
    };
  }, [onError]);

  if (stats.loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
                <div className="h-3 bg-gray-200 rounded w-20 mt-2"></div>
              </div>
              <div className="p-3 bg-gray-200 rounded-full w-12 h-12"></div>
            </div>
          </div>
        ))}
        <div className="col-span-full text-center py-4">
          <div className="inline-flex items-center text-gray-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            Chargement des statistiques du tableau de bord...
          </div>
        </div>
      </div>
    );
  }

  if (stats.error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-red-600 font-medium">{stats.error}</p>
            <p className="text-red-500 text-sm mt-1">Veuillez rafraîchir la page ou vérifier votre connexion.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Export Button */}
      <div className="flex justify-end">
        <button
          onClick={exportDashboardData}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          title="Exporter toutes les données"
        >
          <Database className="w-4 h-4 mr-2" />
          <span className="text-sm font-medium">Exporter les Données</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500 nav-hover-lift nav-item-enter-delay-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Propriétés Totales</p>
              <p className="text-2xl font-bold text-gray-900 content-fade-in">{stats.totalProperties}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full nav-icon-float">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-xs text-green-600 mt-2">Depuis la base de données</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500 nav-hover-lift nav-item-enter-delay-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Locataires Actifs</p>
              <p className="text-2xl font-bold text-gray-900 content-fade-in">{stats.activeTenants}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full nav-icon-float-delay">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-xs text-green-600 mt-2">Actuellement actifs</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500 nav-hover-lift nav-item-enter-delay-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Revenus Mensuels</p>
              <p className="text-2xl font-bold text-gray-900 content-fade-in">€{stats.monthlyRevenue.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full nav-icon-float">
              <DollarSign className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <p className="text-xs text-green-600 mt-2">Ce mois-ci</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500 nav-hover-lift nav-item-enter-delay-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Factures en Attente</p>
              <p className="text-2xl font-bold text-gray-900 content-fade-in">{stats.pendingBills}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full nav-icon-float-delay">
              <CreditCard className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <p className="text-xs text-red-600 mt-2">Nécessitent une attention</p>
        </div>
      </div>
      
      {/* Last Updated Info */}
      {stats.lastUpdated && (
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Dernière mise à jour : {stats.lastUpdated}
          </p>
        </div>
      )}
    </div>
  );
};

// Real Property Performance Component
const RealPropertyPerformance = () => {
  const [properties, setProperties] = useState<DashboardProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        // Check if token exists before making API calls
        const token = localStorage.getItem('token');
        if (!token) {
          console.log('No token found, skipping property API calls');
          setLoading(false);
          setError('No authentication token');
          return;
        }

        setLoading(true);
        const res = await listProperties();
        const propertiesData = res?.data?.data?.properties || [];
        
        // Sort by rent amount (highest first) and take top 3
        const sortedProperties = propertiesData
          .sort((a: DashboardProperty, b: DashboardProperty) => (b.rent || b.monthly_rent || 0) - (a.rent || a.monthly_rent || 0))
          .slice(0, 3);
        
        setProperties(sortedProperties);
      } catch (error) {
        console.error('Error fetching properties:', error);
        setError('Failed to load property data');
        // Set empty array as fallback
        setProperties([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg animate-pulse">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-gray-200 rounded-full mr-3"></div>
              <div className="h-4 bg-gray-200 rounded w-32"></div>
            </div>
            <div className="h-4 bg-gray-200 rounded w-16"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 text-center py-4">{error}</div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="text-gray-500 text-center py-4">Aucune propriété trouvée</div>
    );
  }

  const colors = ['bg-green-500', 'bg-blue-500', 'bg-yellow-500'];

  return (
    <div className="space-y-4">
      {properties.map((property, index) => (
        <div key={property.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center">
            <div className={`w-3 h-3 ${colors[index]} rounded-full mr-3`}></div>
            <span className="font-medium">{property.title || property.name || `Property ${property.id}`}</span>
          </div>
          <span className="text-green-600 font-semibold">€{property.rent || property.monthly_rent || 0}/mo</span>
        </div>
      ))}
    </div>
  );
};

// Real Recent Activity Component
const RealRecentActivity = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecentActivity = async () => {
      try {
        setLoading(true);
        
        // Fetch recent data from multiple sources
        const [tenantsRes, billsRes] = await Promise.all([
          listTenants(),
          listBills({ limit: 5, sort: 'created_at', order: 'DESC' })
        ]);

        const tenants = tenantsRes?.data?.data?.tenants || [];
        const bills = billsRes?.data?.data?.bills || [];
        
        // Create activity items from recent data
        const activities: Activity[] = [];
        
        // Add recent tenants
        tenants.slice(0, 2).forEach((tenant: any) => {
          activities.push({
            id: `tenant-${tenant.id}`,
            type: 'tenant',
            message: 'New tenant registered',
            detail: `${tenant.fullName || tenant.full_name || 'Tenant'} moved into ${tenant.propertyName || tenant.property_name || 'property'}`,
            time: tenant.created_at,
            color: 'blue'
          });
        });
        
        // Add recent bills
        bills.slice(0, 2).forEach((bill: any) => {
          activities.push({
            id: `bill-${bill.id}`,
            type: 'payment',
            message: bill.status === 'PAID' ? 'Payment received' : 'Bill generated',
            detail: bill.status === 'PAID' 
              ? `€${bill.amount} from ${bill.tenantName || bill.tenant_name || 'tenant'}`
              : `€${bill.amount} bill for ${bill.tenantName || bill.tenant_name || 'tenant'}`,
            time: bill.created_at,
            color: bill.status === 'PAID' ? 'green' : 'yellow'
          });
        });
        
        // Sort by time and take most recent
        activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
        setActivities(activities.slice(0, 3));
        
      } catch (error) {
        console.error('Error fetching recent activity:', error);
        setError('Failed to load recent activity');
        // Set empty array as fallback
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentActivity();
  }, []);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center p-3 bg-gray-50 rounded-lg animate-pulse">
            <div className="w-2 h-2 bg-gray-200 rounded-full mr-3"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-32 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-48"></div>
            </div>
            <div className="h-3 bg-gray-200 rounded w-16"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 text-center py-4">{error}</div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-gray-500 text-center py-4">Aucune activité récente</div>
    );
  }

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue': return 'bg-blue-50';
      case 'green': return 'bg-green-50';
      case 'yellow': return 'bg-yellow-50';
      default: return 'bg-gray-50';
    }
  };

  const getDotColor = (color: string) => {
    switch (color) {
      case 'blue': return 'bg-blue-500';
      case 'green': return 'bg-green-500';
      case 'yellow': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <div key={activity.id} className={`flex items-center p-3 ${getColorClasses(activity.color)} rounded-lg`}>
          <div className={`w-2 h-2 ${getDotColor(activity.color)} rounded-full mr-3`}></div>
          <div className="flex-1">
            <p className="text-sm font-medium">{activity.message}</p>
            <p className="text-xs text-gray-600">{activity.detail}</p>
          </div>
          <span className="text-xs text-gray-500">{formatTimeAgo(activity.time)}</span>
        </div>
      ))}
    </div>
  );
};

const OverviewPies = () => {
  const [loading, setLoading] = useState(true);
  const [byType, setByType] = useState<any[]>([]);
  const [byMonth, setByMonth] = useState<any[]>([]);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        
        console.log('Fetching expense data...');
        const res = await listExpenses();
        console.log('Expense response:', res);
        
        // Handle different response structures
        let expenses: any[] = [];
        if (res?.data?.data?.expenses) {
          expenses = res.data.data.expenses;
        } else if ((res?.data as any)?.expenses) {
          expenses = (res.data as any).expenses;
        } else if (Array.isArray(res?.data)) {
          expenses = res.data;
        }
        
        console.log('Expenses data:', expenses);

        if (!expenses || expenses.length === 0) {
          console.log('No expenses found, using default data');
          // Set default data when no expenses exist
          setByType([
            { name: 'Maintenance', value: 1200 },
            { name: 'Utilities', value: 800 },
            { name: 'Insurance', value: 400 }
          ]);
          setByMonth([
            { name: '2024-10', value: 2400 },
            { name: '2024-11', value: 1800 },
            { name: '2024-12', value: 2200 }
          ]);
          setLoading(false);
          return;
        }

        const typeMap: Record<string, number> = {};
        const monthMap: Record<string, number> = {};

        for (const exp of expenses) {
          const cat = (exp.type || 'Misc').toString();
          typeMap[cat] = (typeMap[cat] || 0) + Number(exp.amount || 0);

          const m = (() => {
            const d = new Date(exp.date || exp.created_at || new Date());
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            return `${d.getFullYear()}-${mm}`;
          })();
          monthMap[m] = (monthMap[m] || 0) + Number(exp.amount || 0);
        }

        setByType(Object.keys(typeMap).map(k => ({ name: k, value: typeMap[k] }))); 
        const last6 = Object.keys(monthMap).sort().slice(-6);
        setByMonth(last6.map(k => ({ name: k, value: monthMap[k] })));
        
        console.log('Expense data processed successfully');
      } catch (e: any) {
        console.error('Error loading expenses:', e);
        // Set some default data for demo
        setByType([
          { name: 'Maintenance', value: 1200 },
          { name: 'Utilities', value: 800 },
          { name: 'Insurance', value: 400 }
        ]);
        setByMonth([
          { name: '2024-10', value: 2400 },
          { name: '2024-11', value: 1800 },
          { name: '2024-12', value: 2200 }
        ]);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-base font-semibold mb-3">Expense Breakdown (Type)</h3>
        {loading ? (
          <div className="text-gray-500 py-10 text-center">Chargement des données de dépenses…</div>
        ) : byType.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie 
                data={byType} 
                dataKey="value" 
                nameKey="name" 
                cx="50%" 
                cy="50%" 
                outerRadius={80} 
                label={({ name, percent }: any) => `${name} ${((percent as number) * 100).toFixed(0)}%`}
              >
                {byType.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [`€${value}`, name]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-gray-500 py-10 text-center">
            <p>Aucune donnée de dépense disponible</p>
            <p className="text-xs mt-2">Ajoutez des dépenses pour voir la répartition</p>
          </div>
        )}
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-base font-semibold mb-3">Monthly Expenses (Last 6)</h3>
        {loading ? (
          <div className="text-gray-500 py-10 text-center">Chargement des données mensuelles…</div>
        ) : byMonth.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie 
                data={byMonth} 
                dataKey="value" 
                nameKey="name" 
                cx="50%" 
                cy="50%" 
                outerRadius={80} 
                label={({ name, percent }: any) => `${name} ${((percent as number) * 100).toFixed(0)}%`}
              >
                {byMonth.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [`€${value}`, name]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-gray-500 py-10 text-center">
            <p>Aucune donnée de dépense mensuelle</p>
            <p className="text-xs mt-2">Les dépenses apparaîtront ici au fil du temps</p>
          </div>
        )}
      </div>
    </div>
  );
};

interface Property {
  id: number;
  title: string;
  location: string;
  price: number;
  image: string;
  tag: string;
  tagColor: string;
  description: string;
  bedrooms: number;
  bathrooms: number;
  guests: number;
  rating: number;
  reviews: number;
  amenities: string[];
  images: string[];
  host: {
    name: string;
    avatar: string;
    joinDate: string;
  };
  propertyDetails: {
    propertyType: string;
    size: string;
    checkIn: string;
    checkOut: string;
  };
}

const Dashboard = () => {
  const [activeSection, setActiveSection] = useState('overview');
  // const navigate = useNavigate();
  const user = (() => { try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; } })();
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isPropertyModalOpen, setIsPropertyModalOpen] = useState(false);
  const [hasApiErrors, setHasApiErrors] = useState(false);

  // Gestionnaire pour la navigation depuis les notifications
  const handleNavigateToSection = useCallback((event: CustomEvent) => {
    const { section, billId, tenantId, propertyId } = event.detail;
    setActiveSection(section);
    
    // Si on a des IDs spécifiques, on peut les stocker pour utilisation ultérieure
    if (billId) {
      localStorage.setItem('selectedBillId', billId.toString());
    }
    if (tenantId) {
      localStorage.setItem('selectedTenantId', tenantId.toString());
    }
    if (propertyId) {
      localStorage.setItem('selectedPropertyId', propertyId.toString());
    }
  }, []);

  const handleOpenReceipt = useCallback((event: CustomEvent) => {
    const { billId } = event.detail;
    // Ouvrir le modal de reçu pour la facture spécifique
    localStorage.setItem('openReceiptForBill', billId.toString());
    setActiveSection('payments');
  }, []);

  useEffect(() => {
    window.addEventListener('navigate-to-section', handleNavigateToSection as EventListener);
    window.addEventListener('open-receipt', handleOpenReceipt as EventListener);

    return () => {
      window.removeEventListener('navigate-to-section', handleNavigateToSection as EventListener);
      window.removeEventListener('open-receipt', handleOpenReceipt as EventListener);
    };
  }, [handleNavigateToSection, handleOpenReceipt]);

  const closePropertyDetails = () => {
    setSelectedProperty(null);
    setIsPropertyModalOpen(false);
  };

  const renderPropertiesContent = () => <PropertiesSection />;

  const renderTunnetContent = () => {
    console.log('renderTunnetContent called, rendering TunnetSectionFixed');
    try {
      return <TunnetSectionFixed />;
    } catch (error) {
      console.error('Error rendering TunnetSectionFixed:', error);
      return (
        <div className="p-6 bg-white rounded-lg shadow">
          <h2 className="text-lg font-semibold text-red-600">Error Loading Tenants</h2>
          <p className="text-sm text-gray-600">There was an error loading the tenants section.</p>
          <p className="text-xs text-gray-500 mt-2">Error: {(error as any)?.message || 'Unknown error'}</p>
        </div>
      );
    }
  };

  const renderOverviewContent = () => (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Bienvenue dans la Gestion Immobilière</h1>
        <p className="text-blue-100">Gérez vos propriétés, locataires et finances efficacement</p>
      </div>

      {/* Real Statistics Cards */}
      <RealStatistics onError={setHasApiErrors} />
      
      {/* API Diagnostics - Show when there are errors */}
      {hasApiErrors && (
        <ApiDiagnostics />
      )}


      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
              Aperçu des Revenus
            </h3>
          </div>
          <OverviewPies />
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
            Performance des Propriétés
          </h3>
          <RealPropertyPerformance />
        </div>
      </div>

      {/* Real Recent Activity */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Bell className="w-5 h-5 mr-2 text-purple-600" />
          Activité Récente
        </h3>
        <RealRecentActivity />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Star className="w-5 h-5 mr-2 text-orange-600" />
          Actions Rapides
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button 
            onClick={() => setActiveSection('properties')}
            className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-center group"
            title="Accéder à la section Propriétés pour ajouter une nouvelle propriété"
          >
            <Plus className="w-6 h-6 text-blue-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-medium text-blue-800">Ajouter Propriété</p>
          </button>
          <button 
            onClick={() => setActiveSection('tunnet')}
            className="p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-center group"
            title="Accéder à la section Locataires pour ajouter un nouveau locataire"
          >
            <Users className="w-6 h-6 text-green-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-medium text-green-800">Ajouter Locataire</p>
          </button>
          <button 
            onClick={() => setActiveSection('payments')}
            className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-center group"
            title="Accéder à la section Paiements pour générer des factures"
          >
            <CreditCard className="w-6 h-6 text-purple-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-medium text-purple-800">Générer Facture</p>
          </button>
          <button 
            onClick={() => setActiveSection('expense-analytics')}
            className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors text-center group"
            title="Voir les analyses et rapports détaillés"
          >
            <BarChart3 className="w-6 h-6 text-orange-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-medium text-orange-800">Voir Rapports</p>
          </button>
        </div>
        
        {/* Additional Quick Actions Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <button 
            onClick={() => setActiveSection('settings')}
            className="p-4 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors text-center group"
            title="Aller aux paramètres"
          >
            <SettingsIcon className="w-6 h-6 text-indigo-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-medium text-indigo-800">Paramètres</p>
          </button>
          <button 
            onClick={exportDashboardData}
            className="p-4 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors text-center group"
            title="Exporter toutes les données du dashboard en CSV"
          >
            <Download className="w-6 h-6 text-teal-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-medium text-teal-800">Exporter Données</p>
          </button>
          <button 
            onClick={() => {
              // Show help information
              alert('Aide Tableau de Bord:\n\n• Utilisez les Actions Rapides pour naviguer entre les sections\n• Les Statistiques affichent les données en temps réel de votre base de données\n• L\'Activité Récente affiche les dernières mises à jour des locataires et factures\n• Les Graphiques montrent les répartitions et tendances des dépenses');
            }}
            className="p-4 bg-pink-50 hover:bg-pink-100 rounded-lg transition-colors text-center group"
            title="Obtenir de l'aide et des informations"
          >
            <HelpCircle className="w-6 h-6 text-pink-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-medium text-pink-800">Aide</p>
          </button>
        </div>
      </div>
    </div>
  );

  const renderPaymentsContent = () => (
    <PaymentsManagement />
  );

  



  const renderExpenseAnalyticsContent = () => <ExpenseAnalytics />;

  // Settings component as a separate component to properly use hooks
  const SettingsContent = () => {
    const currentUser = (() => { try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; } })();
    const [name, setName] = useState(currentUser?.name || '');
    const [email, setEmail] = useState(currentUser?.email || '');
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState('');

    const handleSave = async () => {
      try {
        setSaving(true);
        setMsg('');
        const payload: any = {};
        if (name && name !== currentUser?.name) payload.name = name;
        if (email && email !== currentUser?.email) payload.email = email;
        const { updateProfile, me } = await import('../api');
        await updateProfile(payload);
        const fresh = await me();
        const admin = fresh?.data?.data?.admin;
        if (admin) {
          localStorage.setItem('user', JSON.stringify(admin));
        }
        setMsg('Saved');
        setTimeout(() => setMsg(''), 3000);
      } catch (e: any) {
        setMsg(e?.response?.data?.error || e?.userMessage || e?.message || 'Save failed');
      } finally {
        setSaving(false);
      }
    };

    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
        </div>


        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Paramètres du Compte</h3>
          <p className="text-gray-600 mb-4">Gérez vos préférences et paramètres de compte.</p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nom du Profil</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Entrez votre nom de profil"
                title="Nom du profil"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Entrez votre email"
                title="Adresse email"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button onClick={handleSave} disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60">
              {saving ? 'Enregistrement...' : 'Enregistrer les Modifications'}
            </button>
            {msg && <div className="text-sm text-gray-600">{msg}</div>}
            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); window.location.href = '/'; }}
                className="w-full md:w-auto bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSettingsContent = () => {
    return <SettingsContent />;
  };

  const renderAdminManagementContent = () => {
    console.log('Rendering AdminManagement component');
    return <AdminManagement />;
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        console.log('Rendering overview content');
        return renderOverviewContent();
      case 'properties':
        console.log('Rendering properties content');
        return renderPropertiesContent();
      case 'tunnet':
        console.log('Rendering tunnet content (tenants)');
        return renderTunnetContent();
      case 'payments':
        console.log('Rendering payments content');
        return renderPaymentsContent();
      case 'expense-analytics':
        console.log('Rendering expense analytics content');
        return renderExpenseAnalyticsContent();
      case 'settings':
        console.log('Rendering settings content');
        return renderSettingsContent();
      case 'admin-management':
        console.log('Rendering admin management content');
        return renderAdminManagementContent();
      default:
        console.log('Rendering default overview content');
        return renderOverviewContent();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-sm border-r border-gray-200 animate-slide-in-left">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-display-medium text-gray-900 animate-fade-in">Tableau de Bord</h1>
          <div className="mt-2 w-12 h-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full animate-expand"></div>
        </div>
        
        <nav className="mt-8 px-4">
          <div className="space-y-1">
            {/* Vue d'ensemble */}
            <button 
              onClick={() => setActiveSection('overview')}
              className={`group w-full flex items-center px-4 py-3 rounded-xl nav-transition nav-hover-lift nav-item-enter-delay-1 ${
                activeSection === 'overview' 
                  ? 'text-white bg-gradient-to-r from-blue-600 to-blue-700 border-l-4 border-blue-300 shadow-lg nav-active-glow' 
                  : 'text-gray-600 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 hover:text-blue-600 hover:border-l-4 hover:border-blue-200'
              }`}
            >
              <div className={`p-2 rounded-lg nav-transition ${
                activeSection === 'overview' 
                  ? 'bg-white/20 nav-icon-float' 
                  : 'bg-gray-100 group-hover:bg-blue-100'
              }`}>
                <LayoutDashboard className={`w-5 h-5 nav-transition ${
                  activeSection === 'overview' 
                    ? 'text-white' 
                    : 'text-gray-400 group-hover:text-blue-600'
                }`} />
              </div>
              <span className={`ml-3 font-medium nav-transition ${
                activeSection === 'overview' 
                  ? 'text-white' 
                  : 'text-gray-600 group-hover:text-blue-600'
              }`}>
                Vue d'ensemble
              </span>
              {activeSection === 'overview' && (
                <div className="ml-auto w-2 h-2 bg-white rounded-full nav-active-pulse"></div>
              )}
            </button>
            
            {/* Propriétés */}
            <button 
              onClick={() => setActiveSection('properties')}
              className={`group w-full flex items-center px-4 py-3 rounded-xl nav-transition nav-hover-lift nav-item-enter-delay-2 ${
                activeSection === 'properties' 
                  ? 'text-white bg-gradient-to-r from-green-600 to-green-700 border-l-4 border-green-300 shadow-lg nav-active-glow' 
                  : 'text-gray-600 hover:bg-gradient-to-r hover:from-gray-50 hover:to-green-50 hover:text-green-600 hover:border-l-4 hover:border-green-200'
              }`}
            >
              <div className={`p-2 rounded-lg nav-transition ${
                activeSection === 'properties' 
                  ? 'bg-white/20 nav-icon-float-delay' 
                  : 'bg-gray-100 group-hover:bg-green-100'
              }`}>
                <Building2 className={`w-5 h-5 nav-transition ${
                  activeSection === 'properties' 
                    ? 'text-white' 
                    : 'text-gray-400 group-hover:text-green-600'
                }`} />
              </div>
              <span className={`ml-3 font-medium nav-transition ${
                activeSection === 'properties' 
                  ? 'text-white' 
                  : 'text-gray-600 group-hover:text-green-600'
              }`}>
                Propriétés
              </span>
              {activeSection === 'properties' && (
                <div className="ml-auto w-2 h-2 bg-white rounded-full nav-active-pulse"></div>
              )}
            </button>
            
            {/* Locataires */}
            <button 
              onClick={() => setActiveSection('tunnet')}
              className={`group w-full flex items-center px-4 py-3 rounded-xl nav-transition nav-hover-lift nav-item-enter-delay-3 ${
                activeSection === 'tunnet' 
                  ? 'text-white bg-gradient-to-r from-purple-600 to-purple-700 border-l-4 border-purple-300 shadow-lg nav-active-glow' 
                  : 'text-gray-600 hover:bg-gradient-to-r hover:from-gray-50 hover:to-purple-50 hover:text-purple-600 hover:border-l-4 hover:border-purple-200'
              }`}
            >
              <div className={`p-2 rounded-lg nav-transition ${
                activeSection === 'tunnet' 
                  ? 'bg-white/20 nav-icon-float' 
                  : 'bg-gray-100 group-hover:bg-purple-100'
              }`}>
                <Users className={`w-5 h-5 nav-transition ${
                  activeSection === 'tunnet' 
                    ? 'text-white' 
                    : 'text-gray-400 group-hover:text-purple-600'
                }`} />
              </div>
              <span className={`ml-3 font-medium nav-transition ${
                activeSection === 'tunnet' 
                  ? 'text-white' 
                  : 'text-gray-600 group-hover:text-purple-600'
              }`}>
                Locataires
              </span>
              {activeSection === 'tunnet' && (
                <div className="ml-auto w-2 h-2 bg-white rounded-full nav-active-pulse"></div>
              )}
            </button>
            
            {/* Paiements */}
            <button 
              onClick={() => setActiveSection('payments')}
              className={`group w-full flex items-center px-4 py-3 rounded-xl nav-transition nav-hover-lift nav-item-enter-delay-4 ${
                activeSection === 'payments' 
                  ? 'text-white bg-gradient-to-r from-orange-600 to-orange-700 border-l-4 border-orange-300 shadow-lg nav-active-glow' 
                  : 'text-gray-600 hover:bg-gradient-to-r hover:from-gray-50 hover:to-orange-50 hover:text-orange-600 hover:border-l-4 hover:border-orange-200'
              }`}
            >
              <div className={`p-2 rounded-lg nav-transition ${
                activeSection === 'payments' 
                  ? 'bg-white/20 nav-icon-float-delay' 
                  : 'bg-gray-100 group-hover:bg-orange-100'
              }`}>
                <CreditCard className={`w-5 h-5 nav-transition ${
                  activeSection === 'payments' 
                    ? 'text-white' 
                    : 'text-gray-400 group-hover:text-orange-600'
                }`} />
              </div>
              <span className={`ml-3 font-medium nav-transition ${
                activeSection === 'payments' 
                  ? 'text-white' 
                  : 'text-gray-600 group-hover:text-orange-600'
              }`}>
                Paiements
              </span>
              {activeSection === 'payments' && (
                <div className="ml-auto w-2 h-2 bg-white rounded-full nav-active-pulse"></div>
              )}
            </button>
            
            {/* Analyse des Dépenses */}
            <button 
              onClick={() => setActiveSection('expense-analytics')}
              className={`group w-full flex items-center px-4 py-3 rounded-xl nav-transition nav-hover-lift nav-item-enter-delay-5 ${
                activeSection === 'expense-analytics' 
                  ? 'text-white bg-gradient-to-r from-indigo-600 to-indigo-700 border-l-4 border-indigo-300 shadow-lg nav-active-glow' 
                  : 'text-gray-600 hover:bg-gradient-to-r hover:from-gray-50 hover:to-indigo-50 hover:text-indigo-600 hover:border-l-4 hover:border-indigo-200'
              }`}
            >
              <div className={`p-2 rounded-lg nav-transition ${
                activeSection === 'expense-analytics' 
                  ? 'bg-white/20 nav-icon-float' 
                  : 'bg-gray-100 group-hover:bg-indigo-100'
              }`}>
                <DollarSign className={`w-5 h-5 nav-transition ${
                  activeSection === 'expense-analytics' 
                    ? 'text-white' 
                    : 'text-gray-400 group-hover:text-indigo-600'
                }`} />
              </div>
              <span className={`ml-3 font-medium nav-transition ${
                activeSection === 'expense-analytics' 
                  ? 'text-white' 
                  : 'text-gray-600 group-hover:text-indigo-600'
              }`}>
                Analyse des Dépenses
              </span>
              {activeSection === 'expense-analytics' && (
                <div className="ml-auto w-2 h-2 bg-white rounded-full nav-active-pulse"></div>
              )}
            </button>
            
            {/* Paramètres */}
            <button 
              onClick={() => setActiveSection('settings')}
              className={`group w-full flex items-center px-4 py-3 rounded-xl nav-transition nav-hover-lift nav-item-enter-delay-6 ${
                activeSection === 'settings' 
                  ? 'text-white bg-gradient-to-r from-gray-600 to-gray-700 border-l-4 border-gray-300 shadow-lg nav-active-glow' 
                  : 'text-gray-600 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:text-gray-700 hover:border-l-4 hover:border-gray-300'
              }`}
            >
              <div className={`p-2 rounded-lg nav-transition ${
                activeSection === 'settings' 
                  ? 'bg-white/20 nav-icon-float-delay' 
                  : 'bg-gray-100 group-hover:bg-gray-200'
              }`}>
                <SettingsIcon className={`w-5 h-5 nav-transition ${
                  activeSection === 'settings' 
                    ? 'text-white' 
                    : 'text-gray-400 group-hover:text-gray-600'
                }`} />
              </div>
              <span className={`ml-3 font-medium nav-transition ${
                activeSection === 'settings' 
                  ? 'text-white' 
                  : 'text-gray-600 group-hover:text-gray-700'
              }`}>
                Paramètres
              </span>
              {activeSection === 'settings' && (
                <div className="ml-auto w-2 h-2 bg-white rounded-full nav-active-pulse"></div>
              )}
            </button>

            {/* Gestion Administrateurs */}
            {user?.role === 'SUPER_ADMIN' && (
              <button 
                onClick={() => setActiveSection('admin-management')}
                className={`group w-full flex items-center px-4 py-3 rounded-xl nav-transition nav-hover-lift nav-item-enter-delay-7 ${
                  activeSection === 'admin-management' 
                    ? 'text-white bg-gradient-to-r from-red-600 to-red-700 border-l-4 border-red-300 shadow-lg nav-active-glow' 
                    : 'text-gray-600 hover:bg-gradient-to-r hover:from-gray-50 hover:to-red-50 hover:text-red-600 hover:border-l-4 hover:border-red-200'
                }`}
                title="Gestion des Administrateurs"
              >
                <div className={`p-2 rounded-lg nav-transition ${
                  activeSection === 'admin-management' 
                    ? 'bg-white/20 nav-icon-float' 
                    : 'bg-gray-100 group-hover:bg-red-100'
                }`}>
                  <Shield className={`w-5 h-5 nav-transition ${
                    activeSection === 'admin-management' 
                      ? 'text-white' 
                      : 'text-gray-400 group-hover:text-red-600'
                  }`} />
                </div>
                <span className={`ml-3 font-medium nav-transition ${
                  activeSection === 'admin-management' 
                    ? 'text-white' 
                    : 'text-gray-600 group-hover:text-red-600'
                }`}>
                  Gestion Administrateurs
                </span>
                {activeSection === 'admin-management' && (
                  <div className="ml-auto w-2 h-2 bg-white rounded-full nav-active-pulse"></div>
                )}
              </button>
            )}
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 content-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center flex-1 max-w-lg nav-item-enter-delay-1">
              <div className="relative w-full group">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-500 nav-transition" />
                <input
                  type="text"
                  placeholder="Rechercher"
                  aria-label="Rechercher des propriétés"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 nav-transition nav-hover-lift form-input"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-4 nav-item-enter-delay-2">
              <NotificationDropdown />
              <div className="flex items-center space-x-3 hover:bg-gray-50 p-2 rounded-lg nav-transition nav-hover-lift cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm hover:ring-2 hover:ring-blue-300 nav-transition nav-hover-scale">
                  {(user?.name || user?.fullName || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-label-large text-gray-900">{user?.name || user?.fullName || 'Utilisateur'}</div>
                  <div className="text-label-medium text-gray-500">{user?.role || 'Administrateur'}</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-6 content-scale-in">
        {renderContent()}
        </div>
      </div>

      {/* Property Details Modal */}
      {isPropertyModalOpen && selectedProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto transform animate-modal-slide-up">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-heading-large">{selectedProperty.title}</h2>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="ml-1 text-label-large">{selectedProperty.rating}</span>
                    <span className="ml-1 card-subtitle">({selectedProperty.reviews} reviews)</span>
                  </div>
                  <div className="flex items-center card-subtitle">
                    <MapPin className="w-4 h-4 mr-1" />
                    {selectedProperty.location}
                  </div>
                </div>
              </div>
                <button
                onClick={closePropertyDetails}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-all duration-200 transform hover:scale-110"
                aria-label="Close property details"
              >
                <X className="w-6 h-6" />
                </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Image Gallery */}
              <div className="mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-1">
                    <img
                      src={selectedProperty.images[0]}
                      alt={selectedProperty.title}
                      className="w-full h-80 object-cover rounded-lg"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedProperty.images.slice(1, 5).map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`${selectedProperty.title} ${index + 2}`}
                        className="w-full h-36 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Main Details */}
                <div className="lg:col-span-2 space-y-8">
                  {/* Property Overview */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {selectedProperty.propertyDetails.propertyType} hosted by {selectedProperty.host.name}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        selectedProperty.tagColor === 'orange' 
                          ? 'bg-orange-100 text-orange-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {selectedProperty.tag}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-6 text-gray-600 mb-4">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        <span>{selectedProperty.guests} guests</span>
                      </div>
                      <div className="flex items-center">
                        <Bed className="w-4 h-4 mr-1" />
                        <span>{selectedProperty.bedrooms} bedrooms</span>
                      </div>
                      <div className="flex items-center">
                        <Bath className="w-4 h-4 mr-1" />
                        <span>{selectedProperty.bathrooms} bathrooms</span>
                      </div>
                    </div>

                    <p className="text-gray-700 leading-relaxed">{selectedProperty.description}</p>
                  </div>

                  {/* Amenities */}
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">What this place offers</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedProperty.amenities.map((amenity, index) => {
                        const getAmenityIcon = (amenity: string) => {
                          switch (amenity.toLowerCase()) {
                            case 'wifi': return <Wifi className="w-5 h-5" />;
                            case 'tv': return <Tv className="w-5 h-5" />;
                            case 'parking': return <Car className="w-5 h-5" />;
                            case 'coffee maker': return <Coffee className="w-5 h-5" />;
                            default: return <div className="w-5 h-5 bg-gray-300 rounded"></div>;
                          }
                        };

                        return (
                          <div key={index} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                            {getAmenityIcon(amenity)}
                            <span className="text-gray-700">{amenity}</span>
                          </div>
              );
            })}
                    </div>
                  </div>

                  {/* Property Details */}
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Property Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">Property Type</h4>
                        <p className="text-gray-700">{selectedProperty.propertyDetails.propertyType}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">Size</h4>
                        <p className="text-gray-700">{selectedProperty.propertyDetails.size}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">Check-in</h4>
                        <p className="text-gray-700">{selectedProperty.propertyDetails.checkIn}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">Check-out</h4>
                        <p className="text-gray-700">{selectedProperty.propertyDetails.checkOut}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Booking Card */}
                <div className="lg:col-span-1">
                  <div className="sticky top-6">
                    {/* Host Info */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                      <div className="flex items-center space-x-4 mb-4">
                        <img
                          src={selectedProperty.host.avatar}
                          alt={selectedProperty.host.name}
                          className="w-12 h-12 rounded-full"
                        />
                        <div>
                          <h4 className="font-semibold text-gray-900">Hosted by {selectedProperty.host.name}</h4>
                          <p className="text-sm text-gray-600">{selectedProperty.host.joinDate}</p>
                        </div>
                      </div>
                    </div>

                    {/* Booking Card */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <span className="price-large">{selectedProperty.price}€</span>
                          <span className="text-body-small text-gray-500 ml-1">mois</span>
                        </div>
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="ml-1 text-label-large">{selectedProperty.rating}</span>
                        </div>
          </div>

                      {/* Booking Form */}
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="form-label mb-1">Check-in Date</label>
                            <input
                              type="date"
                              placeholder="Select check-in date"
                              title="Check-in date"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 form-input"
                            />
                          </div>
                          <div>
                            <label className="form-label mb-1">Lease Duration</label>
                            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 form-input" title="Lease duration">
                              <option>3 months</option>
                              <option>6 months</option>
                              <option>12 months</option>
                              <option>Month by month</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="form-label mb-1">Room Type</label>
                          <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 form-input" title="Room type">
                            <option>Private room</option>
                            <option>Shared room</option>
                            <option>Master room</option>
                          </select>
                        </div>
                        <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors btn-text">
                          Apply Now
                        </button>
                        <div className="flex items-center justify-center">
                          <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Add to favorites">
                            <Heart className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-sm text-gray-600 text-center">Application review required</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </div>
        </div>
      )}
      
      {/* Notification Toast */}
      <NotificationToast />
    </div>
  );
};

export default Dashboard;