import React, { useEffect, useState } from 'react';
import api from '../api';
import { Building2, MapPin, Home, Edit, Trash2, X, Image, Camera, Eye } from 'lucide-react';
import PropertyPhotos from './PropertyPhotos';
import dataService from '../services/dataService';
import { formatFrenchDate, formatFrenchDateTime } from '../utils/dateUtils';
import '../styles/navigation-animations.css';

interface PropertyItem {
  id: number;
  title: string;
  address: string;
  city: string;
  country: string;
  property_type: string;
  monthly_rent?: number;
  description?: string;
  photo?: string;
  images?: Array<{
    id: number;
    image_url: string;
    image_alt?: string;
    is_primary: boolean;
  }>;
  // Optional property fields
  number_of_halls?: number;
  number_of_kitchens?: number;
  number_of_bathrooms?: number;
  number_of_parking_spaces?: number;
  number_of_rooms?: number;
  number_of_gardens?: number;
}

const PropertiesSection: React.FC = () => {
  const [items, setItems] = useState<PropertyItem[]>([]);
  const [title, setTitle] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [propertyType, setPropertyType] = useState('APARTMENT');
  const [rent, setRent] = useState('');
  const [description, setDescription] = useState('');
  
  // Optional property fields
  const [numberOfHalls, setNumberOfHalls] = useState('');
  const [numberOfKitchens, setNumberOfKitchens] = useState('');
  const [numberOfBathrooms, setNumberOfBathrooms] = useState('');
  const [numberOfParkingSpaces, setNumberOfParkingSpaces] = useState('');
  const [numberOfRooms, setNumberOfRooms] = useState('');
  const [numberOfGardens, setNumberOfGardens] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [photosModalPropertyId, setPhotosModalPropertyId] = useState<number | null>(null);

  console.log('PropertiesSection rendered - items:', items, 'loading:', loading);

  const fetchItems = async () => {
    try {
      // Check if token exists before making API calls
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found, skipping properties API call');
        setItems([]);
        return;
      }

      setLoading(true);
      console.log('🏠 Fetching properties with photos...');
      
      // Use the enhanced data service with photos
      const properties = await dataService.fetchProperties();
      setItems(properties);
      console.log('✅ Properties fetched with photos:', properties.length, 'properties');
      
      // Log photo information for debugging
      properties.forEach((property, index) => {
        console.log(`🏠 Property ${index + 1}:`, {
          id: property.id,
          title: property.display_title,
          address: property.display_address,
          photo_count: property.photo_count,
          has_photos: property.has_photos,
          primary_photo: property.primary_photo ? 'Yes' : 'No',
          rent: property.rent_formatted
        });
      });
      
    } catch (e) {
      console.error('❌ Failed to fetch properties:', e);
      setError('Erreur lors du chargement des propriétés');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const validateForm = () => {
    // Required fields validation
    if (!title.trim()) return 'Title is required';
    if (title.trim().length < 3) return 'Title must be at least 3 characters';
    if (title.trim().length > 255) return 'Title must be less than 255 characters';
    
    if (!address.trim()) return 'Address is required';
    if (address.trim().length < 5) return 'Address must be at least 5 characters';
    
    if (!city.trim()) return 'City is required';
    if (city.trim().length < 2) return 'City must be at least 2 characters';
    
    if (!country.trim()) return 'Country is required';
    if (country.trim().length < 2) return 'Country must be at least 2 characters';
    
    if (!propertyType.trim()) return 'Property type is required';
    
    // Optional fields validation
    const rentValue = parseFloat(rent);
    if (rent && (isNaN(rentValue) || rentValue <= 0)) {
      return 'Rent amount must be a positive number';
    }
    if (rentValue > 1000000) {
      return 'Rent amount seems unusually high. Please verify.';
    }
    
    // Description length validation if provided
    const trimmedDescription = description.trim();
    if (trimmedDescription && trimmedDescription.length > 2000) {
      return 'Description must be less than 2000 characters';
    }
    
    return null; // Validation passed
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true); 
    setError('');
    
    try {
      // Create FormData object for multipart/form-data
      const formData = new FormData();
      
      // Required fields
      formData.append('title', title.trim());
      formData.append('address', address.trim());
      formData.append('city', city.trim());
      formData.append('country', country.trim());
      formData.append('property_type', propertyType);
      
      // Optional fields - only append if they have valid values
      const rentValue = parseFloat(rent);
      if (!isNaN(rentValue) && rentValue > 0) {
        formData.append('monthly_rent', rentValue.toString());
      }
      
      const trimmedDescription = description.trim();
      if (trimmedDescription) {
        formData.append('description', trimmedDescription);
      }

      if (photoFile) {
        formData.append('photo', photoFile);
      }

      // Optional property fields - only append if they have valid values
      const hallsValue = parseInt(numberOfHalls);
      formData.append('number_of_halls', (!isNaN(hallsValue) && hallsValue >= 0 ? hallsValue : 0).toString());

      const kitchensValue = parseInt(numberOfKitchens);
      formData.append('number_of_kitchens', (!isNaN(kitchensValue) && kitchensValue >= 0 ? kitchensValue : 0).toString());

      const bathroomsValue = parseInt(numberOfBathrooms);
      formData.append('number_of_bathrooms', (!isNaN(bathroomsValue) && bathroomsValue >= 0 ? bathroomsValue : 0).toString());

      const parkingValue = parseInt(numberOfParkingSpaces);
      formData.append('number_of_parking_spaces', (!isNaN(parkingValue) && parkingValue >= 0 ? parkingValue : 0).toString());

      const roomsValue = parseInt(numberOfRooms);
      formData.append('number_of_rooms', (!isNaN(roomsValue) && roomsValue >= 0 ? roomsValue : 0).toString());

      const gardensValue = parseInt(numberOfGardens);
      formData.append('number_of_gardens', (!isNaN(gardensValue) && gardensValue >= 0 ? gardensValue : 0).toString());

      let response;
      if (editMode && editId) {
        response = await api.updateProperty(editId, formData);
      } else {
        response = await api.createProperty(formData);
      }

      // Confirm successful API response
      if (!response?.data?.success) {
        throw new Error(response?.data?.error || 'Failed to save property');
      }
      
      // Reset form
      setTitle('');
      setAddress(''); 
      setCity(''); 
      setCountry(''); 
      setPropertyType('APARTMENT');
      setRent(''); 
      setDescription(''); 
      setNumberOfHalls('');
      setNumberOfKitchens('');
      setNumberOfBathrooms('');
      setNumberOfParkingSpaces('');
      setNumberOfRooms('');
      setNumberOfGardens('');
      setPhotoFile(null);
      setPhotoPreview(null);
      setEditMode(false); 
      setEditId(null); 
      setIsModalOpen(false);
      
      await fetchItems();
    } catch (e: any) {
      console.error('Property submission error:', e);
      // Use the enhanced error message from our API interceptor
      setError(e.userMessage || e?.response?.data?.error || 'Failed to save property');
      
      // Log more details in development
      if (import.meta.env.DEV) {
        console.debug('Property submission debug:', {
          error: e.response?.data || e
        });
      }
    } finally {
      setLoading(false);
    }
  };
  
  const startEdit = (property: PropertyItem) => {
    setTitle(property.title);
    setAddress(property.address);
    setCity(property.city);
    setCountry(property.country);
    setPropertyType(property.property_type);
    setRent(property.monthly_rent?.toString() || '');
    setDescription(property.description || '');
    setNumberOfHalls(property.number_of_halls?.toString() || '');
    setNumberOfKitchens(property.number_of_kitchens?.toString() || '');
    setNumberOfBathrooms(property.number_of_bathrooms?.toString() || '');
    setNumberOfParkingSpaces(property.number_of_parking_spaces?.toString() || '');
    setNumberOfRooms(property.number_of_rooms?.toString() || '');
    setNumberOfGardens(property.number_of_gardens?.toString() || '');
    setEditMode(true);
    setEditId(property.id);
    setIsModalOpen(true);
  };
  
  const cancelEdit = () => {
    setTitle(''); 
    setAddress(''); 
    setCity(''); 
    setCountry(''); 
    setPropertyType('APARTMENT');
    setRent(''); 
    setDescription('');
    setNumberOfHalls('');
    setNumberOfKitchens('');
    setNumberOfBathrooms('');
    setNumberOfParkingSpaces('');
    setNumberOfRooms('');
    setNumberOfGardens('');
    setEditMode(false); 
    setEditId(null); 
    setIsModalOpen(false);
  };

  const onDelete = async (id: string) => {
    if (!confirm('Delete this property?')) return;
    try {
      await api.deleteProperty(id);
      await fetchItems();
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Failed to delete');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 content-fade-in">
        <div className="nav-item-enter-delay-1">
          <h1 className="text-2xl font-bold text-gray-900">Propriétés</h1>
          <p className="text-gray-600 mt-1">Gérer vos propriétés et leurs photos</p>
        </div>
        <div className="flex items-center space-x-3 nav-item-enter-delay-2">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 nav-transition nav-hover-lift"
          >
            <Home className="w-4 h-4 nav-icon-float" />
            <span>Ajouter Propriété</span>
          </button>
        </div>
      </div>
      
      {/* Property Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">{editMode ? 'Modifier la Propriété' : 'Ajouter une Nouvelle Propriété'}</h2>
              <button
                onClick={cancelEdit}
                className="text-gray-400 hover:text-gray-600"
                title="Fermer le modal"
                aria-label="Fermer le modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Modal Content */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Titre *</label>
                  <input 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    placeholder="Titre de la Propriété" 
                    value={title} 
                    onChange={e => setTitle(e.target.value)} 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Adresse *</label>
                  <input 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    placeholder="Adresse de la Propriété" 
                    value={address} 
                    onChange={e => setAddress(e.target.value)} 
                    required 
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ville *</label>
                  <input 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    placeholder="Ville" 
                    value={city} 
                    onChange={e => setCity(e.target.value)} 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pays *</label>
                  <input 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    placeholder="Pays" 
                    value={country} 
                    onChange={e => setCountry(e.target.value)} 
                    required 
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type de Propriété *</label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    value={propertyType} 
                    onChange={e => setPropertyType(e.target.value)} 
                    required
                    aria-label="Type de Propriété"
                    id="property-type"
                  >
                    <option value="APARTMENT">Appartement</option>
                    <option value="HOUSE">Maison</option>
                    <option value="CONDO">Condo</option>
                    <option value="STUDIO">Studio</option>
                    <option value="OTHER">Autre</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Loyer Mensuel</label>
                  <input 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    placeholder="Loyer Mensuel" 
                    type="number" 
                    step="0.01"
                    value={rent} 
                    onChange={e => setRent(e.target.value)} 
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="Description de la Propriété" 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  rows={3}
                />
              </div>
              
              {/* Optional Property Details */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Détails de la Propriété (Optionnel)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de Halls</label>
                    <input 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      placeholder="0" 
                      type="number" 
                      min="0"
                      value={numberOfHalls} 
                      onChange={e => setNumberOfHalls(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de Cuisines</label>
                    <input 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      placeholder="0" 
                      type="number" 
                      min="0"
                      value={numberOfKitchens} 
                      onChange={e => setNumberOfKitchens(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de Salles de Bain</label>
                    <input 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      placeholder="0" 
                      type="number" 
                      min="0"
                      value={numberOfBathrooms} 
                      onChange={e => setNumberOfBathrooms(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de Places de Parking</label>
                    <input 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      placeholder="0" 
                      type="number" 
                      min="0"
                      value={numberOfParkingSpaces} 
                      onChange={e => setNumberOfParkingSpaces(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de Chambres</label>
                    <input 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      placeholder="0" 
                      type="number" 
                      min="0"
                      value={numberOfRooms} 
                      onChange={e => setNumberOfRooms(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de Jardins</label>
                    <input 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      placeholder="0" 
                      type="number" 
                      min="0"
                      value={numberOfGardens} 
                      onChange={e => setNumberOfGardens(e.target.value)} 
                    />
                  </div>
                </div>
              </div>
              
              {/* Photo upload */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Image de la Propriété</h3>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e)=>{
                      const f = e.target.files?.[0] || null;
                      setPhotoFile(f || null);
                      if (f) {
                        const url = URL.createObjectURL(f);
                        setPhotoPreview(url);
                      } else {
                        setPhotoPreview(null);
                      }
                    }}
                  />
                  {photoPreview && (
                    <img src={photoPreview} alt="Aperçu" className="w-24 h-24 object-cover rounded border" />
                  )}
                </div>
              </div>
              
              {error && <div className="text-red-600">{error}</div>}
              
              {/* Modal Footer */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {loading ? 'Enregistrement...' : editMode ? 'Mettre à Jour la Propriété' : 'Ajouter Propriété'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((p, index) => (
          <div key={p.id} className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden nav-hover-lift nav-item-enter-delay-${Math.min(index + 1, 7)}`}>
            <div className="h-48 bg-gray-100 flex items-center justify-center relative group">
              {/* Display primary photo or first photo */}
              {p.primary_photo ? (
                <img 
                  src={p.primary_photo.display_url || p.primary_photo.file_url} 
                  alt={p.display_title} 
                  className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105" 
                  onError={(e) => {
                    console.warn(`Failed to load image for property ${p.id}:`, e);
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : p.photos && p.photos.length > 0 ? (
                <img 
                  src={p.photos[0].display_url || p.photos[0].file_url} 
                  alt={p.display_title} 
                  className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105" 
                  onError={(e) => {
                    console.warn(`Failed to load image for property ${p.id}:`, e);
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full w-full bg-gray-200">
                  <Building2 className="w-12 h-12 text-gray-400" />
                </div>
              )}
              
              {/* Photo count badge */}
              {p.photo_count > 0 && (
                <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                  <Camera className="w-3 h-3" />
                  {p.photo_count}
                </div>
              )}
              
              {/* Rent badge */}
              {p.rent_formatted && (
                <div className="absolute top-2 right-2 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  {p.rent_formatted}/mois
                </div>
              )}
              
              {/* Photo management button */}
              <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button
                  onClick={() => setPhotosModalPropertyId(p.id)}
                  className="bg-white bg-opacity-90 text-gray-700 p-2 rounded-full hover:bg-opacity-100 transition-all duration-200 nav-transition nav-hover-scale"
                  title="Gérer les photos"
                >
                  <Image className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{p.display_title}</h3>
              <div className="flex items-center text-gray-600 mb-2">
                <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                <span className="text-sm">{p.display_address}</span>
              </div>
              {/* Property numeric details */}
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-3">
                <div>Halls: <span className="font-medium">{p.number_of_halls ?? 0}</span></div>
                <div>Kitchens: <span className="font-medium">{p.number_of_kitchens ?? 0}</span></div>
                <div>Bathrooms: <span className="font-medium">{p.number_of_bathrooms ?? 0}</span></div>
                <div>Parking: <span className="font-medium">{p.number_of_parking_spaces ?? 0}</span></div>
                <div>Rooms: <span className="font-medium">{p.number_of_rooms ?? 0}</span></div>
                <div>Gardens: <span className="font-medium">{p.number_of_gardens ?? 0}</span></div>
              </div>
              <div className="flex items-center text-gray-500 text-sm mb-3">
                <span>{p.city}, {p.country}</span>
                <span className="mx-2">•</span>
                <span className="capitalize">{p.property_type.toLowerCase()}</span>
              </div>
              
              {/* Optional property details */}
              {(p.number_of_rooms || p.number_of_bathrooms || p.number_of_kitchens || p.number_of_halls || p.number_of_parking_spaces || p.number_of_gardens) && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {p.number_of_rooms && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {p.number_of_rooms} chambre{p.number_of_rooms !== 1 ? 's' : ''}
                    </span>
                  )}
                  {p.number_of_bathrooms && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {p.number_of_bathrooms} salle{p.number_of_bathrooms !== 1 ? 's' : ''} de bain
                    </span>
                  )}
                  {p.number_of_kitchens && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      {p.number_of_kitchens} cuisine{p.number_of_kitchens !== 1 ? 's' : ''}
                    </span>
                  )}
                  {p.number_of_halls && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {p.number_of_halls} hall{p.number_of_halls !== 1 ? 's' : ''}
                    </span>
                  )}
                  {p.number_of_parking_spaces && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {p.number_of_parking_spaces} place{p.number_of_parking_spaces !== 1 ? 's' : ''} de parking
                    </span>
                  )}
                  {p.number_of_gardens && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                      {p.number_of_gardens} jardin{p.number_of_gardens !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              )}
              
              {p.description && (
                <p className="text-gray-700 text-sm mb-4 line-clamp-2">{p.description}</p>
              )}
              <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                <button 
                  onClick={() => setPhotosModalPropertyId(p.id)} 
                  className="flex items-center text-green-600 hover:text-green-800 text-sm font-medium nav-transition nav-hover-scale"
                >
                  <Image className="w-4 h-4 mr-1" />
                  Photos ({p.photo_count || 0})
                </button>
                <button 
                  onClick={() => startEdit(p)} 
                  className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium nav-transition nav-hover-scale"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Modifier
                </button>
                <button 
                  onClick={() => onDelete(p.id)} 
                  className="flex items-center text-red-600 hover:text-red-800 text-sm font-medium nav-transition nav-hover-scale"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Building2 className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">Aucune propriété pour le moment</h3>
            <p className="text-gray-600">Ajoutez votre première propriété pour commencer.</p>
          </div>
        )}
      </div>

      {/* Property Photos Modal */}
      {photosModalPropertyId && (
        <PropertyPhotos
          propertyId={photosModalPropertyId}
          onClose={() => setPhotosModalPropertyId(null)}
        />
      )}
    </div>
  );
};

export default PropertiesSection;
