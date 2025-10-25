import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Eye, 
  Plus, 
  Filter, 
  Download, 
  User,
  Home,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw
} from 'lucide-react';
import api from '../api';
import '../styles/navigation-animations.css';
import dataService from '../services/dataService';
import { formatFrenchDate, formatFrenchDateTime, getCurrentFrenchDateTime } from '../utils/dateUtils';

interface Bill {
  id: number;
  tenant: {
    id: number;
    name: string;
    email: string;
    phone: string;
  };
  property: {
    id: number;
    title: string;
    address: string;
    city: string;
  };
  amount: number;
  rent_amount?: number;
  charges?: number;
  total_amount?: number;
  payment_date?: string;
  month: string;
  due_date: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'RECEIPT_SENT';
  description: string;
  created_at: string;
}

interface BillsStats {
  totalBills: number;
  totalAmount: number;
  pendingBills: number;
  overdueBills: number;
  statusBreakdown: Array<{
    status: string;
    count: number;
    total_amount: number;
  }>;
}

interface CreateBillForm {
  tenant_id: number;
  property_id: number;
  amount: number;
  month: string;
  due_date: string;
  description: string;
}

const PaymentsManagement: React.FC = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [stats, setStats] = useState<BillsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [payingBill, setPayingBill] = useState<number | null>(null);
  const [downloadingBill, setDownloadingBill] = useState<number | null>(null);
  const [selectedBillsForDownload, setSelectedBillsForDownload] = useState<number[]>([]);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    page: 1,
    limit: 10
  });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  });

  // Form state with French defaults
  const [createForm, setCreateForm] = useState<CreateBillForm>(() => {
    const defaults = dataService.getNewBillDefaults();
    return {
      tenant_id: 0,
      property_id: 0,
      amount: 0,
      month: defaults.month,
      due_date: defaults.due_date,
      description: defaults.description
    };
  });

  // Additional state for form
  const [tenants, setTenants] = useState<unknown[]>([]);
  const [properties, setProperties] = useState<unknown[]>([]);

  useEffect(() => {
    fetchBills();
    fetchStats();
    fetchTenants();
    fetchProperties();
  }, [filters]);

  const fetchBills = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching bills with filters:', filters);
      
      // Check authentication token
      const token = localStorage.getItem('token');
      console.log('🔑 Token exists:', !!token);
      
      if (!token) {
        console.error('❌ No authentication token found');
        setError('Token d\'authentification manquant');
        setBills([]);
        return;
      }
      
      // Use the enhanced data service with French dates
      const bills = await dataService.fetchBills(filters);
      console.log('📋 Enhanced Bills Response:', bills);
      
      setBills(bills);
      console.log('✅ Bills set with French formatting:', bills.length, 'bills');
      
      // Log bill details for debugging
      bills.forEach((bill, index) => {
        console.log(`📄 Bill ${index + 1}:`, {
          id: bill.id,
          tenant_name: bill.tenant_display_name,
          property_title: bill.property_display_name,
          status: bill.status_fr,
          amount: bill.amount_formatted,
          due_date: bill.due_date_fr,
          is_overdue: bill.is_overdue
        });
      });
      
    } catch (err: unknown) {
      console.error('❌ Error fetching bills:', err);
      setError(err.userMessage || err.message || 'Erreur lors de la récupération des factures');
      setBills([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const stats = await dataService.fetchBillsStats();
      setStats(stats);
      console.log('✅ Enhanced stats fetched with French formatting:', stats);
    } catch (err: unknown) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const fetchTenants = async () => {
    try {
      const tenants = await dataService.fetchTenants();
      setTenants(tenants);
      console.log('✅ Enhanced tenants fetched with French formatting:', tenants.length, 'tenants');
    } catch (err: unknown) {
      console.error('❌ Failed to fetch tenants:', err);
      setTenants([]);
    }
  };

  const fetchProperties = async () => {
    try {
      const properties = await dataService.fetchProperties();
      setProperties(properties);
      console.log('✅ Enhanced properties fetched with French formatting:', properties.length, 'properties');
    } catch (err: unknown) {
      console.error('❌ Failed to fetch properties:', err);
      setProperties([]);
    }
  };


  const handleDownloadBill = async (billId: number) => {
    try {
      setDownloadingBill(billId);
      
      // Use the existing API client for consistency
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }
      
      // Get the API base URL from the environment or use default
      const apiBaseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4002/api';
      const downloadURL = `${apiBaseURL}/bills/${billId}/download`;
      
      console.log('📥 Téléchargement PDF depuis:', downloadURL);
      
      const response = await fetch(downloadURL, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/pdf',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erreur de réponse:', response.status, errorText);
        throw new Error(`Échec du téléchargement (${response.status}): ${response.statusText}`);
      }

      // Check if response is actually a PDF
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/pdf')) {
        console.warn('⚠️ Type de contenu inattendu:', contentType);
      }

      // Get the filename from the response headers
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `quittance-${billId}.pdf`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }

      // Create blob and download
      const blob = await response.blob();
      
      // Verify blob is not empty and is a PDF
      if (blob.size === 0) {
        throw new Error('Le fichier PDF téléchargé est vide');
      }
      
      // Check PDF magic number
      const arrayBuffer = await blob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const pdfHeader = String.fromCharCode(uint8Array[0], uint8Array[1], uint8Array[2], uint8Array[3]);
      if (pdfHeader !== '%PDF') {
        console.warn('⚠️ Le fichier téléchargé ne semble pas être un PDF valide');
      }

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('✅ Quittance téléchargée avec succès:', filename, `(${(blob.size / 1024).toFixed(1)} KB)`);
      alert(`✅ Quittance téléchargée avec succès !\nFichier: ${filename}\nTaille: ${(blob.size / 1024).toFixed(1)} KB`);
      
    } catch (err: unknown) {
      console.error('❌ Erreur de téléchargement:', err);
      alert('❌ Échec du téléchargement: ' + (err.message || 'Erreur inconnue'));
    } finally {
      setDownloadingBill(null);
    }
  };

  const handleDownloadMultipleBills = async () => {
    if (selectedBillsForDownload.length === 0) {
      alert('Veuillez sélectionner au moins une facture à télécharger');
      return;
    }

    for (const billId of selectedBillsForDownload) {
      await handleDownloadBill(billId);
      // Small delay between downloads to avoid overwhelming the browser
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setSelectedBillsForDownload([]);
    alert(`${selectedBillsForDownload.length} facture(s) téléchargée(s) avec succès !`);
  };

  const toggleBillSelection = (billId: number) => {
    setSelectedBillsForDownload(prev => 
      prev.includes(billId) 
        ? prev.filter(id => id !== billId)
        : [...prev, billId]
    );
  };

  const selectAllBills = () => {
    if (selectedBillsForDownload.length === bills.length) {
      setSelectedBillsForDownload([]);
    } else {
      setSelectedBillsForDownload(bills.map(bill => bill.id));
    }
  };

  const handleMarkAsPaid = async (billId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir marquer cette facture comme payée ?')) {
      return;
    }

    try {
      setPayingBill(billId);
      await api.markBillAsPaid(billId);
      
      // Refresh bills and stats
      await fetchBills();
      await fetchStats();
      
      alert('Facture marquée comme payée avec succès !');
    } catch (err: unknown) {
      alert(err.userMessage || 'Échec de la mise à jour de la facture');
    } finally {
      setPayingBill(null);
    }
  };

  const handleUndoPayment = async (billId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler le paiement de cette facture ? Le montant sera soustrait des profits.')) {
      return;
    }

    try {
      setPayingBill(billId);
      await api.undoPayment(billId);
      
      // Refresh bills and stats
      await fetchBills();
      await fetchStats();
      
      alert('Paiement annulé avec succès !');
    } catch (err: unknown) {
      alert(err.userMessage || 'Échec de l\'annulation du paiement');
    } finally {
      setPayingBill(null);
    }
  };

  const handleCreateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('🔄 Creating bill with data:', createForm);
      const response = await api.createBill(createForm);
      console.log('✅ Bill creation response:', response);
      
      setShowCreateForm(false);
      setCreateForm({
        tenant_id: 0,
        property_id: 0,
        amount: 0,
        month: new Date().toISOString().slice(0, 7),
        due_date: new Date().toISOString().slice(0, 10),
        description: 'Monthly rent payment'
      });
      
      // Add a small delay to ensure the database has been updated
      console.log('⏳ Waiting for database to update...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Refresh bills and stats
      console.log('🔄 Refreshing bills and stats...');
      await fetchBills();
      await fetchStats();
      
      console.log('✅ Bill created and data refreshed successfully!');
      alert('Facture créée avec succès !');
    } catch (err: unknown) {
      console.error('❌ Error creating bill:', err);
      alert('Erreur lors de la création de la facture: ' + (err.userMessage || err.message || 'Erreur inconnue'));
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filtering
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleRefresh = async () => {
    console.log('🔄 Manual refresh triggered');
    try {
      // Clear cache and refresh all data
      dataService.clearCache();
      await Promise.all([fetchBills(), fetchStats(), fetchTenants(), fetchProperties()]);
      console.log('✅ Manual refresh completed with French formatting');
    } catch (error) {
      console.error('❌ Error during manual refresh:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'PAID':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'OVERDUE':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'RECEIPT_SENT':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      default:
        return <XCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'OVERDUE':
        return 'bg-red-100 text-red-800';
      case 'RECEIPT_SENT':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && bills.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center content-fade-in">
        <div className="nav-item-enter-delay-1">
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Paiements</h1>
          <p className="text-gray-600 mt-1">Gérer les factures, reçus et paiements</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2 nav-transition nav-hover-lift nav-item-enter-delay-1"
            title="Actualiser les données"
          >
            <RefreshCw className="w-4 h-4 nav-icon-float" />
            Actualiser
          </button>
          {selectedBillsForDownload.length > 0 && (
            <button
              onClick={handleDownloadMultipleBills}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 nav-transition nav-hover-lift nav-item-enter-delay-2"
            >
              <Download className="w-4 h-4 nav-icon-float-delay" />
              Télécharger ({selectedBillsForDownload.length})
            </button>
          )}
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 nav-transition nav-hover-lift nav-item-enter-delay-3"
          >
            <Plus className="w-4 h-4 nav-icon-float" />
            Créer une Facture
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              <p className="text-red-600 font-medium">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Bills</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalBills}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900">${stats.totalAmount.toFixed(2)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingBills}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <AlertCircle className="w-8 h-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-gray-900">{stats.overdueBills}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="PAID">Paid</option>
              <option value="OVERDUE">Overdue</option>
              <option value="RECEIPT_SENT">Receipt Sent</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search bills..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm w-64"
            />
          </div>
        </div>
      </div>

      {/* Bills Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedBillsForDownload.length === bills.length && bills.length > 0}
                    onChange={selectAllBills}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    title="Sélectionner tout"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Locataire
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Propriété
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mois
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date d'échéance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bills.map((bill) => (
                <tr key={bill.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedBillsForDownload.includes(bill.id)}
                      onChange={() => toggleBillSelection(bill.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      title="Sélectionner pour téléchargement"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <User className="w-4 h-4 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{bill.tenant.name}</div>
                        <div className="text-sm text-gray-500">{bill.tenant.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Home className="w-4 h-4 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{bill.property.title}</div>
                        <div className="text-sm text-gray-500">{bill.property.city}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    €{(bill.total_amount || bill.amount).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {bill.month}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(bill.due_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(bill.status)}`}>
                      {getStatusIcon(bill.status)}
                      <span className="ml-1">{bill.status.replace('_', ' ')}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedBill(bill)}
                        className="text-blue-600 hover:text-blue-900 nav-transition nav-hover-scale"
                        title="Voir détails"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDownloadBill(bill.id)}
                        disabled={downloadingBill === bill.id}
                        className="text-gray-600 hover:text-gray-900 disabled:opacity-50 nav-transition nav-hover-scale"
                        title="Télécharger la quittance PDF"
                      >
                        {downloadingBill === bill.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                      </button>
                      {(bill.status === 'PENDING' || bill.status === 'OVERDUE') && (
                        <button
                          onClick={() => handleMarkAsPaid(bill.id)}
                          disabled={payingBill === bill.id}
                          className="text-green-600 hover:text-green-900 disabled:opacity-50 nav-transition nav-hover-scale"
                          title="Marquer comme payée"
                        >
                          {payingBill === bill.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                        </button>
                      )}
                      {bill.status === 'PAID' && (
                        <button
                          onClick={() => handleUndoPayment(bill.id)}
                          disabled={payingBill === bill.id}
                          className="text-orange-600 hover:text-orange-900 disabled:opacity-50 nav-transition nav-hover-scale"
                          title="Annuler le paiement"
                        >
                          {payingBill === bill.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
                          ) : (
                            <XCircle className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{' '}
                  <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span>
                  {' '}to{' '}
                  <span className="font-medium">
                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                  </span>
                  {' '}of{' '}
                  <span className="font-medium">{pagination.total}</span>
                  {' '}results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === pagination.page
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Bill Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Bill</h3>
              <form onSubmit={handleCreateBill} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tenant</label>
                  <select
                    value={createForm.tenant_id}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, tenant_id: parseInt(e.target.value) }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  >
                    <option value={0}>Sélectionner un locataire</option>
                    {Array.isArray(tenants) && tenants.map(tenant => (
                      <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Property</label>
                  <select
                    value={createForm.property_id}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, property_id: parseInt(e.target.value) }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  >
                    <option value={0}>Sélectionner une propriété</option>
                    {Array.isArray(properties) && properties.map(property => (
                      <option key={property.id} value={property.id}>{property.title}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={createForm.amount}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, amount: parseFloat(e.target.value) }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Month</label>
                  <input
                    type="month"
                    value={createForm.month}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, month: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Due Date</label>
                  <input
                    type="date"
                    value={createForm.due_date}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, due_date: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={createForm.description}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    rows={3}
                  />
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Create Bill
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Professional Receipt Modal */}
      {selectedBill && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-0 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-0">
              {/* Receipt Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-t-md">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold">QUITTANCE DE LOYER</h2>
                    <p className="text-blue-100 text-sm">Reçu de paiement de loyer</p>
                  </div>
                  <button
                    onClick={() => setSelectedBill(null)}
                    className="text-white hover:text-blue-200 transition-colors"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Receipt Content */}
              <div className="p-6 bg-white">
                {/* Company/Property Info */}
                <div className="border-b border-gray-200 pb-4 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Propriétaire</h3>
                      <p className="text-sm text-gray-600">Gestion Locative</p>
                      <p className="text-sm text-gray-600">123 Rue de la Paix</p>
                      <p className="text-sm text-gray-600">75001 Paris, France</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Locataire</h3>
                      <p className="text-sm text-gray-600 font-medium">{selectedBill.tenant.name}</p>
                      <p className="text-sm text-gray-600">{selectedBill.tenant.email}</p>
                      <p className="text-sm text-gray-600">{selectedBill.tenant.phone}</p>
                    </div>
                  </div>
                </div>

                {/* Property Details */}
                <div className="border-b border-gray-200 pb-4 mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Détails du Bien</h3>
                  <p className="text-sm text-gray-600 font-medium">{selectedBill.property.title}</p>
                  <p className="text-sm text-gray-600">{selectedBill.property.address}</p>
                  <p className="text-sm text-gray-600">{selectedBill.property.city}</p>
                </div>

                {/* Payment Details */}
                <div className="border-b border-gray-200 pb-4 mb-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Détail du règlement :</h3>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">Loyer :</span>
                        <span className="font-semibold text-gray-900">
                          €{(selectedBill.rent_amount || selectedBill.amount).toFixed(2)} euros
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">
                          (le cas échéant, contribution aux économies d'énergies) :
                        </span>
                        <span className="font-semibold text-gray-900">
                          €{(selectedBill.charges || 0).toFixed(2)} euros
                        </span>
                      </div>
                      
                      <div className="border-t border-gray-300 pt-3">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold text-gray-900">Total :</span>
                          <span className="text-xl font-bold text-blue-600">
                            €{(selectedBill.total_amount || selectedBill.amount).toFixed(2)} euros
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Date */}
                <div className="border-b border-gray-200 pb-4 mb-6">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 font-medium">Date du paiement :</span>
                      <span className="text-lg font-bold text-green-600">
                        le {selectedBill.payment_date 
                          ? new Date(selectedBill.payment_date).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit', 
                              year: 'numeric'
                            })
                          : '...... / ...... / 20......'
                        }
                      </span>
                    </div>
                  </div>
                </div>

                {/* Period and Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Période</h4>
                    <p className="text-blue-800">{selectedBill.month}</p>
                    <p className="text-sm text-blue-600">Échéance: {new Date(selectedBill.due_date).toLocaleDateString('fr-FR')}</p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Statut</h4>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedBill.status)}`}>
                      {getStatusIcon(selectedBill.status)}
                      <span className="ml-2">{selectedBill.status.replace('_', ' ')}</span>
                    </span>
                  </div>
                </div>

                {/* Description */}
                {selectedBill.description && (
                  <div className="border-b border-gray-200 pb-4 mb-6">
                    <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                    <p className="text-sm text-gray-600">{selectedBill.description}</p>
                  </div>
                )}

                {/* Receipt Footer */}
                <div className="text-center text-xs text-gray-500 border-t border-gray-200 pt-4">
                  <p>Ce reçu fait foi de paiement du loyer pour la période indiquée.</p>
                  <p className="mt-1">Généré le {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR')}</p>
                </div>
                
                {/* Action Buttons */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-1 gap-2">
                    {/* Mark as Paid Button */}
                    {(selectedBill.status === 'PENDING' || selectedBill.status === 'OVERDUE') && (
                      <button
                        onClick={() => {
                          handleMarkAsPaid(selectedBill.id);
                          setSelectedBill(null);
                        }}
                        disabled={payingBill === selectedBill.id}
                        className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {payingBill === selectedBill.id ? (
                          <>
                            <Clock className="w-4 h-4 mr-2 animate-spin" />
                            Marquage en cours...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Marquer comme payée
                          </>
                        )}
                      </button>
                    )}
                    
                    {selectedBill.status === 'PAID' && (
                      <button
                        onClick={() => {
                          handleUndoPayment(selectedBill.id);
                          setSelectedBill(null);
                        }}
                        disabled={payingBill === selectedBill.id}
                        className="flex items-center justify-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {payingBill === selectedBill.id ? (
                          <>
                            <Clock className="w-4 h-4 mr-2 animate-spin" />
                            Annulation en cours...
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 mr-2" />
                            Annuler le paiement
                          </>
                        )}
                      </button>
                    )}
                    
                    {/* Download Button */}
                    <button
                      onClick={() => handleDownloadBill(selectedBill.id)}
                      disabled={downloadingBill === selectedBill.id}
                      className="flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {downloadingBill === selectedBill.id ? (
                        <>
                          <Clock className="w-4 h-4 mr-2 animate-spin" />
                          Téléchargement en cours...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          📄 Télécharger la Quittance PDF
                        </>
                      )}
                    </button>
                    
                  </div>
                  
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentsManagement;

