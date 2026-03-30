import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, X, MapPin, FileSpreadsheet, Store, Tag, CheckCircle, AlertCircle, Building, Download, Search, Clock, Settings, Hash, Layout, Globe, Activity, Info, Shield } from 'lucide-react';
import * as XLSX from 'xlsx';
import api from '../../services/api';
import BulkImportModal from '../../components/Shared/BulkImportModal';
import SearchableSelect from '../../components/Shared/SearchableSelect';
import { useTableData } from '../../hooks/useTableData';
import Pagination from '../../components/Shared/Pagination';
import { useTheme } from '../../context/ThemeContext';

const Stores = () => {
  const { isDarkMode } = useTheme();
  const activeColors = {
    bg: isDarkMode ? '#0f172a' : '#f8fafc',
    card: isDarkMode ? '#1e293b' : '#ffffff',
    border: isDarkMode ? '#334155' : '#f1f5f9',
    textMain: isDarkMode ? '#f1f5f9' : '#1e293b',
    textMuted: isDarkMode ? '#94a3b8' : '#64748b',
    accent: '#4f46e5',
    accentSoft: isDarkMode ? 'rgba(79, 70, 229, 0.15)' : '#eef2ff'
  };

  const [stores, setStores] = useState([]);
  const [brands, setBrands] = useState([]);
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [currentStore, setCurrentStore] = useState(null);
  const [formTab, setFormTab] = useState('general'); // 'general', 'location', 'operation'
  
  const [formData, setFormData] = useState({ 
    name: '', 
    address: '', 
    brandId: '', 
    cityId: '', 
    districtId: '', 
    externalId: '', 
    biometricId: '', 
    isActive: true,
    useSequentialPairing: true,
    operationalDayStart: '05:00',
    defaultStartTime: '08:00',
    defaultEndTime: '17:00'
  });
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const processedStores = stores.map(s => ({
    ...s,
    cityName: cities.find(c => c.id === s.cityId)?.name || '',
    districtName: districts.find(d => d.id === s.districtId)?.name || '',
    brandName: s.brandName || brands.find(b => b.id === s.brandId)?.name || ''
  }));

  const { 
    data: currentStores, 
    searchTerm, 
    setSearchTerm, 
    currentPage, 
    setCurrentPage, 
    totalPages, 
    totalItems, 
    itemsPerPage, 
    setItemsPerPage 
  } = useTableData(processedStores, []);

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [storesRes, brandsRes, citiesRes, districtsRes] = await Promise.all([
        api.get('/stores'),
        api.get('/brands'),
        api.get('/cities'),
        api.get('/districts')
      ]);
      setStores(storesRes.data);
      setBrands(brandsRes.data);
      setCities(citiesRes.data);
      setDistricts(districtsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      if (currentStore) {
        await api.put(`/stores/${currentStore.id}`, formData);
        showToast("Sede actualizada con éxito");
      } else {
        await api.post('/stores', formData);
        showToast("Sede creada con éxito");
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      showToast("Error al guardar la tienda", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await api.delete(`/stores/${currentStore.id}`);
      showToast("Sede eliminada satisfactoriamente");
      setShowConfirm(false);
      fetchData();
    } catch (err) {
      showToast("Error al eliminar el registro", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportExcel = () => {
    const dataToExport = processedStores.map(s => ({
      Tienda: s.name,
      Direccion: s.address,
      Ciudad: s.cityName,
      Distrito: s.districtName,
      Marca: s.brandName,
      ID_Externo: s.externalId,
      ID_Biometrico: s.biometricId,
      Estado: s.isActive ? 'Activo' : 'Inactivo'
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tiendas");
    XLSX.writeFile(wb, `Reporte_Tiendas_${new Date().toISOString().split('T')[0]}.xlsx`);
    showToast("Reporte Excel generado");
  };

  return (
    <div className="page-container animate-in fade-in duration-500" style={{ padding: '2rem 1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Elite Header & Toolbar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4rem', gap: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: '950', color: activeColors.textMain, margin: 0, letterSpacing: '-0.03em' }}>Gestión de tiendas</h1>
          <p style={{ color: activeColors.textMuted, fontSize: '0.9rem', fontWeight: '600', marginTop: '6px' }}>Administración de puntos de venta y sucursales</p>
        </div>

        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', width: '100%', maxWidth: '850px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} className="absolute left-4 top-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Filtrar por nombre, distrito, ciudad o marca..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-premium pl-12"
              style={{ margin: 0, borderRadius: '20px', height: '56px' }}
            />
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handleExportExcel}
              className="btn-premium btn-premium-secondary"
              style={{ borderRadius: '20px', height: '56px', padding: '0 20px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b' }}
              title="Descargar Excel"
            >
              <Download size={18} />
            </button>
            <button 
              onClick={() => setShowImport(true)}
              className="btn-premium btn-premium-secondary"
              style={{ borderRadius: '20px', height: '56px', padding: '0 25px' }}
            >
              <FileSpreadsheet size={18} /> Importar
            </button>
            <button 
              onClick={() => { 
                setCurrentStore(null); 
                setFormData({ 
                  name: '', 
                  address: '', 
                  brandId: '', 
                  cityId: '', 
                  districtId: '', 
                  externalId: '', 
                  biometricId: '', 
                  isActive: true,
                  useSequentialPairing: true,
                  operationalDayStart: '05:00',
                  defaultStartTime: '08:00',
                  defaultEndTime: '17:00'
                }); 
                setFormTab('general');
                setShowModal(true); 
              }}
              className="btn-premium btn-premium-primary"
              style={{ borderRadius: '20px', height: '56px', padding: '0 25px' }}
            >
              <Plus size={20} /> Nueva Tienda
            </button>
          </div>
        </div>
      </div>

      <div className="card flex flex-col" style={{ padding: 0, overflow: 'hidden', minHeight: '60vh' }}>
        {loading ? (
          <div style={{ padding: '6rem', textAlign: 'center' }}>
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              <p className="text-slate-500 font-medium">Cargando puntos de venta...</p>
            </div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', background: 'var(--bg-main)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', trackingWider: '0.1em' }}>Tienda / Local</th>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', trackingWider: '0.1em' }}>ID / Ciudad / Distrito</th>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', trackingWider: '0.1em' }}>Estado</th>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', trackingWider: '0.1em' }}>Marca Asociada</th>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', trackingWider: '0.1em', textAlign: 'right' }}>Gestión</th>
              </tr>
            </thead>
            <tbody>
              {currentStores.map((store) => (
                <tr key={store.id} style={{ borderBottom: '1px solid var(--border)' }} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '38px', height: '38px', background: 'var(--bg-main)', color: '#4f46e5', border: '1px solid var(--border)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Store size={20} />
                      </div>
                      <div className="font-bold text-slate-800 dark:text-white">{store.name}</div>
                    </div>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '900', color: '#4f46e5', textTransform: 'uppercase' }}>{store.externalId || '---'}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={12} /> {store.cityName || 'Sin ciudad'}
                      </span>
                      {store.districtId && (
                        <span style={{ fontSize: '0.75rem', color: '#4f46e5', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px', textTransform: 'uppercase' }}>
                          <Building size={12} /> {store.districtName || 'Distrito'}
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <span style={{ 
                      padding: '0.35rem 0.75rem', 
                      background: store.isActive !== false ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                      color: store.isActive !== false ? '#10b981' : '#ef4444', 
                      borderRadius: '9999px', 
                      fontSize: '0.7rem', 
                      fontWeight: '800',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      textTransform: 'uppercase'
                    }}>
                      {store.isActive !== false ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                      {store.isActive !== false ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <span style={{ padding: '0.35rem 0.75rem', background: '#f1f5f9', color: '#475569', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Tag size={12} /> {store.brandName || 'N/A'}
                    </span>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                    <button 
                      onClick={() => { 
                        setCurrentStore(store); 
                        setFormData({ 
                          name: store.name, 
                          address: store.address, 
                          brandId: store.brandId, 
                          cityId: store.cityId || '',
                          externalId: store.externalId || '',
                          biometricId: store.biometricId || '',
                          districtId: store.districtId || '',
                          isActive: store.isActive !== false,
                          useSequentialPairing: !!store.useSequentialPairing,
                          operationalDayStart: store.operationalDayStart || '05:00',
                          defaultStartTime: store.defaultStartTime || '08:00',
                          defaultEndTime: store.defaultEndTime || '17:00'
                        }); 
                        setFormTab('general');
                        setShowModal(true); 
                      }}
                      style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', padding: '0.5rem' }}
                      className="hover:scale-110 transition-transform"
                    >
                      <Edit size={18} />
                    </button>
                    <button 
                      onClick={() => { setCurrentStore(store); setShowConfirm(true); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                      className="hover:scale-110 transition-transform"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {currentStores.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: '4rem', textAlign: 'center' }}>
                    <div className="flex flex-col items-center gap-2 opacity-40">
                      <Store size={48} />
                      <p className="font-medium">No se encontraron tiendas.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
        {!loading && (
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content animate-in zoom-in duration-300 shadow-2xl" style={{ maxWidth: '680px', borderRadius: '40px', padding: 0, overflow: 'hidden', border: 'none' }}>
            {/* Header Elite v3 */}
            <div style={{ padding: '40px 60px', borderBottom: `1px solid ${activeColors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isDarkMode ? '#1e293b' : '#ffffff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <div style={{ width: '64px', height: '64px', background: activeColors.accentSoft, borderRadius: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: activeColors.accent }}>
                    {currentStore ? <Edit size={28} strokeWidth={2.5} /> : <Plus size={28} strokeWidth={2.5} />}
                </div>
                <div>
                  <h2 style={{ fontSize: '1.8rem', fontWeight: '950', color: activeColors.textMain, margin: 0, letterSpacing: '-0.03em' }}>
                    {currentStore ? 'Actualizar Sede' : 'Registrar Sede'}
                  </h2>
                  <p style={{ fontSize: '0.85rem', color: activeColors.textMuted, fontWeight: '700', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Configuración Técnica Operativa V12
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                style={{ background: activeColors.accentSoft, border: 'none', width: '52px', height: '52px', borderRadius: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: activeColors.accent, transition: 'all 0.2s' }}
                className="hover:rotate-90"
              >
                <X size={28} strokeWidth={3} />
              </button>
            </div>
            
            <form onSubmit={handleSave}>
              <div style={{ padding: '50px 60px', flex: 1, overflowY: 'auto', background: isDarkMode ? '#0f172a' : '#fcfdfe', maxHeight: '70vh' }} className="custom-scrollbar">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '56px' }}>
                  
                  {/* Sección 01 */}
                  <div style={{ position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '36px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '950', color: activeColors.accent, background: activeColors.accentSoft, padding: '4px 12px', borderRadius: '8px' }}>01</span>
                      <h3 style={{ fontSize: '0.75rem', fontWeight: '900', color: activeColors.textMain, textTransform: 'uppercase', letterSpacing: '0.15em', margin: 0 }}>Identidad y Marca</h3>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px 36px' }}>
                      <div className="md:col-span-2 group">
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: activeColors.textMuted, textTransform: 'uppercase', marginBottom: '14px', letterSpacing: '0.1em' }}>Nombre Comercial *</label>
                        <div style={{ position: 'relative' }}>
                          <Store size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                          <input 
                            required value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            placeholder="Ej. Porton T. Lindavista" 
                            style={{ width: '100%', padding: '22px 24px 22px 60px', borderRadius: '24px', border: `2px solid ${activeColors.border}`, background: activeColors.card, color: activeColors.textMain, fontWeight: '700', fontSize: '0.95rem', outline: 'none', transition: 'all 0.3s' }}
                            className="focus:border-indigo-500 focus:shadow-xl"
                          />
                        </div>
                      </div>
                      <div className="group">
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: activeColors.textMuted, textTransform: 'uppercase', marginBottom: '14px', letterSpacing: '0.1em' }}>ID Externo (ERP) *</label>
                        <div style={{ position: 'relative' }}>
                          <Tag size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                          <input 
                            required value={formData.externalId}
                            onChange={(e) => setFormData({...formData, externalId: e.target.value})}
                            placeholder="Código ERP..." 
                            style={{ width: '100%', padding: '22px 24px 22px 60px', borderRadius: '24px', border: `2px solid ${activeColors.border}`, background: activeColors.card, color: activeColors.textMain, fontWeight: '700', fontSize: '0.95rem', outline: 'none', transition: 'all 0.3s' }}
                            className="focus:border-indigo-500 focus:shadow-xl"
                          />
                        </div>
                      </div>
                      <div className="group">
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: activeColors.textMuted, textTransform: 'uppercase', marginBottom: '14px', letterSpacing: '0.1em' }}>ID Biométrico</label>
                        <div style={{ position: 'relative' }}>
                          <Hash size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                          <input 
                            value={formData.biometricId}
                            onChange={(e) => setFormData({...formData, biometricId: e.target.value})}
                            placeholder="Bio ID..." 
                            style={{ width: '100%', padding: '22px 24px 22px 60px', borderRadius: '24px', border: `2px solid ${activeColors.border}`, background: activeColors.card, color: activeColors.textMain, fontWeight: '700', fontSize: '0.95rem', outline: 'none', transition: 'all 0.3s' }}
                            className="focus:border-indigo-500 focus:shadow-xl"
                          />
                        </div>
                      </div>
                      <div className="md:col-span-2">
                         <SearchableSelect
                            label="Marca Asociada *"
                            options={brands.map(b => ({ value: b.id, label: b.name }))}
                            value={formData.brandId}
                            onChange={(val) => setFormData({...formData, brandId: val})}
                            placeholder="Vincular a una marca..."
                            icon={Tag}
                            required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Sección 02 */}
                  <div style={{ position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '36px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '950', color: activeColors.accent, background: activeColors.accentSoft, padding: '4px 12px', borderRadius: '8px' }}>02</span>
                      <h3 style={{ fontSize: '0.75rem', fontWeight: '900', color: activeColors.textMain, textTransform: 'uppercase', letterSpacing: '0.15em', margin: 0 }}>Localización y Ubicación</h3>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px 36px' }}>
                      <SearchableSelect
                        label="Ciudad Regional *"
                        options={cities.map(c => ({ value: c.id, label: c.name }))}
                        value={formData.cityId}
                        onChange={(val) => setFormData({...formData, cityId: val})}
                        placeholder="Ubicación geográfica..."
                        icon={Globe}
                        required
                      />
                      <SearchableSelect
                        label="Distrito / Zona"
                        options={districts.map(d => ({ value: d.id, label: d.name }))}
                        value={formData.districtId}
                        onChange={(val) => setFormData({...formData, districtId: val})}
                        placeholder="Agrupación operativa..."
                        icon={Building}
                      />
                      <div className="md:col-span-2 group">
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: activeColors.textMuted, textTransform: 'uppercase', marginBottom: '14px', letterSpacing: '0.1em' }}>Dirección Física *</label>
                        <div style={{ position: 'relative' }}>
                          <MapPin size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                          <input 
                            required value={formData.address}
                            onChange={(e) => setFormData({...formData, address: e.target.value})}
                            placeholder="Ubicación exacta de la sede..." 
                            style={{ width: '100%', padding: '22px 24px 22px 60px', borderRadius: '24px', border: `2px solid ${activeColors.border}`, background: activeColors.card, color: activeColors.textMain, fontWeight: '700', fontSize: '0.95rem', outline: 'none', transition: 'all 0.3s' }}
                            className="focus:border-indigo-500 focus:shadow-xl"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sección 03 */}
                  <div style={{ position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '36px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '950', color: activeColors.accent, background: activeColors.accentSoft, padding: '4px 12px', borderRadius: '8px' }}>03</span>
                      <h3 style={{ fontSize: '0.75rem', fontWeight: '900', color: activeColors.textMain, textTransform: 'uppercase', letterSpacing: '0.15em', margin: 0 }}>Configuración Operativa</h3>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                        <div style={{ background: isDarkMode ? 'rgba(79, 70, 229, 0.05)' : '#f8faff', padding: '36px', borderRadius: '32px', border: `1px solid ${activeColors.border}`, display: 'flex', flexWrap: 'wrap', gap: '30px', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', gap: '40px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <div 
                                        onClick={() => setFormData({...formData, isActive: !formData.isActive})}
                                        style={{ width: '56px', height: '28px', background: formData.isActive ? '#10b981' : '#cbd5e1', borderRadius: '20px', position: 'relative', cursor: 'pointer', transition: 'all 0.3s' }}
                                    >
                                        <div style={{ width: '22px', height: '22px', background: 'white', borderRadius: '50%', position: 'absolute', top: '3px', left: formData.isActive ? '31px' : '3px', transition: 'all 0.3s', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}></div>
                                    </div>
                                    <div>
                                        <span style={{ display: 'block', fontSize: '10px', fontWeight: '900', color: activeColors.textMuted, textTransform: 'uppercase' }}>Estado de Tienda</span>
                                        <span style={{ fontSize: '0.8rem', fontWeight: '950', color: formData.isActive ? '#10b981' : activeColors.textMuted }}>{formData.isActive ? 'TIENDA ACTIVA' : 'TIENDA CERRADA'}</span>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <div 
                                        onClick={() => setFormData({...formData, useSequentialPairing: !formData.useSequentialPairing})}
                                        style={{ width: '56px', height: '28px', background: formData.useSequentialPairing ? '#4f46e5' : '#10b981', borderRadius: '20px', position: 'relative', cursor: 'pointer', transition: 'all 0.3s' }}
                                    >
                                        <div style={{ width: '22px', height: '22px', background: 'white', borderRadius: '50%', position: 'absolute', top: '3px', left: formData.useSequentialPairing ? '31px' : '3px', transition: 'all 0.3s', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}></div>
                                    </div>
                                    <div>
                                        <span style={{ display: 'block', fontSize: '10px', fontWeight: '900', color: activeColors.textMuted, textTransform: 'uppercase' }}>Mapeo de Marcaciones</span>
                                        <span style={{ fontSize: '0.8rem', fontWeight: '950', color: formData.useSequentialPairing ? '#4f46e5' : '#10b981' }}>{formData.useSequentialPairing ? 'MODO SECUENCIAL' : 'MODO TURNOS'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px 36px' }}>
                             <div className="group">
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: activeColors.textMuted, textTransform: 'uppercase', marginBottom: '14px', letterSpacing: '0.1em' }}>Inicio Día Operativo</label>
                                <div style={{ position: 'relative' }}>
                                    <Clock size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                    <input 
                                        type="time" value={formData.operationalDayStart}
                                        onChange={(e) => setFormData({...formData, operationalDayStart: e.target.value})}
                                        style={{ width: '100%', padding: '22px 24px 22px 60px', borderRadius: '24px', border: `2px solid ${activeColors.border}`, background: activeColors.card, color: activeColors.textMain, fontWeight: '700', fontSize: '0.95rem', outline: 'none' }}
                                        className="focus:border-indigo-500 focus:shadow-xl"
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', color: activeColors.textMuted, padding: '10px' }}>
                                <Info size={24} className="text-amber-500 shrink-0" />
                                <p style={{ fontSize: '0.72rem', fontWeight: '700', color: isDarkMode ? '#94a3b8' : '#64748b', margin: 0, lineHeight: '1.4' }}>
                                    Define el punto de quiebre para agrupar marcaciones nocturnas en un mismo periodo operativo.
                                </p>
                            </div>
                        </div>

                        {!formData.useSequentialPairing && (
                            <div style={{ padding: '40px', background: isDarkMode ? 'rgba(79, 70, 229, 0.05)' : '#f8faff', borderRadius: '32px', border: `1px dashed ${activeColors.border}`, animation: 'fadeIn 0.5s ease-out' }}>
                                <h4 style={{ fontSize: '11px', fontWeight: '950', color: activeColors.accent, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '24px' }}>Horarios Base de la Sede</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '36px' }}>
                                    <div className="group">
                                        <span style={{ display: 'block', fontSize: '10px', fontWeight: '900', color: activeColors.textMuted, textTransform: 'uppercase', marginBottom: '10px' }}>Entrada Teórica</span>
                                        <input 
                                            type="time" value={formData.defaultStartTime}
                                            onChange={(e) => setFormData({...formData, defaultStartTime: e.target.value})}
                                            style={{ width: '100%', padding: '16px 20px', borderRadius: '16px', border: `2px solid ${activeColors.border}`, background: 'white', fontWeight: '750', textAlign: 'center' }}
                                        />
                                    </div>
                                    <div className="group">
                                        <span style={{ display: 'block', fontSize: '10px', fontWeight: '900', color: activeColors.textMuted, textTransform: 'uppercase', marginBottom: '10px' }}>Salida Teórica</span>
                                        <input 
                                            type="time" value={formData.defaultEndTime}
                                            onChange={(e) => setFormData({...formData, defaultEndTime: e.target.value})}
                                            style={{ width: '100%', padding: '16px 20px', borderRadius: '16px', border: `2px solid ${activeColors.border}`, background: 'white', fontWeight: '750', textAlign: 'center' }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                  </div>

                  {/* Sección Footer de Seguridad */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '30px', background: isDarkMode ? 'rgba(79, 70, 229, 0.1)' : '#f1f5f9', borderRadius: '32px', color: activeColors.textMuted }}>
                     <Shield size={20} />
                     <p style={{ fontSize: '0.75rem', fontWeight: '700', maxWidth: '600px', margin: 0 }}>
                       <span style={{ fontWeight: '950', color: activeColors.textMain }}>ALERTA DE SEGURIDAD:</span> Los cambios en el mapeo de marcaciones afectarán la consolidación de asistencia de forma retroactiva para los periodos abiertos.
                     </p>
                  </div>

                </div>
                
                <div style={{ display: 'flex', gap: '24px', paddingTop: '60px' }}>
                  <button 
                    type="button" 
                    onClick={() => setShowModal(false)}
                    style={{ flex: 1, padding: '24px', borderRadius: '28px', border: `2px solid ${activeColors.border}`, background: 'white', color: activeColors.textMuted, fontWeight: '900', fontSize: '1rem', cursor: 'pointer', transition: 'all 0.2s' }}
                    className="hover:bg-slate-50"
                  >
                    Descartar
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    style={{ flex: 2, padding: '24px', borderRadius: '28px', border: 'none', background: activeColors.accent, color: 'white', fontWeight: '950', fontSize: '1rem', cursor: 'pointer', boxShadow: '0 15px 35px rgba(79, 70, 229, 0.4)', transition: 'all 0.3s' }}
                    className="hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {isSubmitting ? 'Sincronizando...' : currentStore ? 'Guardar Cambios' : 'Confirmar Registro'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {showConfirm && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '420px', borderRadius: '32px' }}>
            <div className="modal-body" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
              <div className="mb-6" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', width: '88px', height: '88px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                <Trash2 size={44} />
              </div>
              <h2 className="text-2xl font-black mb-3">¿Eliminar tienda?</h2>
              <p className="text-slate-500 text-sm mb-10 px-4 font-medium" style={{ lineHeight: '1.6' }}>
                Estás por eliminar permanentemente <strong>{currentStore?.name}</strong>. Esta acción impactará sobre la asignación de empleados históricos.
              </p>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={() => setShowConfirm(false)} className="btn-premium btn-premium-secondary" style={{ flex: 1, borderRadius: '16px' }} disabled={isDeleting}>
                  Cancelar
                </button>
                <button onClick={handleDelete} className="btn-premium btn-premium-danger" style={{ flex: 1, borderRadius: '16px' }} disabled={isDeleting}>
                  {isDeleting ? <div className="loader"></div> : 'Eliminar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast.show && (
        <div className="toast-container">
          <div className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>
            {toast.type === 'success' ? <CheckCircle size={20} className="text-emerald-500" /> : <AlertCircle size={20} className="text-red-500" />}
            {toast.message}
          </div>
        </div>
      )}

      <BulkImportModal 
        isOpen={showImport} 
        onClose={() => setShowImport(false)} 
        type="stores" 
        onComplete={fetchData} 
      />
    </div>
  );
};

export default Stores;
