import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, X, MapPin, FileSpreadsheet, Store, Tag, CheckCircle, AlertCircle, Building, Download, Search, Clock, Settings, Hash } from 'lucide-react';
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
  const [formData, setFormData] = useState({ 
    name: '', 
    address: '', 
    brandId: '', 
    cityId: '', 
    districtId: '', 
    externalId: '', 
    biometricId: '', 
    isActive: true,
    useSequentialPairing: true, // Default to "Modo Marcaciones"
    operationalDayStart: '05:00',
    defaultStartTime: '08:00',
    defaultEndTime: '17:00'
  });
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Elite V12: Enrich data for global filtering (District Name, City Name, Brand Name)
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
          <div className="modal-content animate-in zoom-in duration-300 shadow-2xl" style={{ maxWidth: '620px', borderRadius: '32px' }}>
            <div className="modal-header" style={{ padding: '2.5rem 2.5rem 1rem', border: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div style={{ width: '52px', height: '52px', background: activeColors.accentSoft, color: activeColors.accent, borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', shadow: '0 4px 12px rgba(79, 70, 229, 0.1)' }}>
                  {currentStore ? <Edit size={24} /> : <Plus size={24} />}
                </div>
                <div>
                  <h2 className="text-2xl font-black dark:text-white" style={{ margin: 0, letterSpacing: '-0.03em' }}>
                    {currentStore ? 'Editar Tienda' : 'Nueva Tienda'}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configuración técnica de sede</p>
                </div>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-all bg-slate-50 dark:bg-slate-800 border-none cursor-pointer p-2.5 rounded-full hover:rotate-90"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSave}>
              <div className="modal-body overflow-y-auto max-h-[70vh] custom-scrollbar" style={{ padding: '0 2.5rem 2.5rem' }}>
                {/* --- Section 1: General Info --- */}
                <div className="mb-10">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center font-bold text-xs">01</div>
                    <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Identificación de Sede</h3>
                    <div className="h-[1px] flex-1 bg-slate-100 dark:bg-slate-800 ml-2"></div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 px-1">Nombre Comercial *</label>
                      <div className="relative group">
                        <Store size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input 
                          required 
                          value={formData.name} 
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                          className="w-full p-4 pl-12 rounded-[20px] border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all font-bold text-sm" 
                          placeholder="Ej. Sede Central Norte"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 px-1">ID Externo (ERP) *</label>
                      <div className="relative group">
                        <Tag size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input 
                          required
                          value={formData.externalId} 
                          onChange={(e) => setFormData({ ...formData, externalId: e.target.value })} 
                          className="w-full p-4 pl-12 rounded-[20px] border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all font-bold text-sm"
                          placeholder="ERP Code..."
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 px-1">ID Biométrico</label>
                      <div className="relative group">
                        <Hash size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input 
                          value={formData.biometricId} 
                          onChange={(e) => setFormData({ ...formData, biometricId: e.target.value })} 
                          className="w-full p-4 pl-12 rounded-[20px] border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all font-bold text-sm"
                          placeholder="Bio ID..."
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* --- Section 2: Branding & Location --- */}
                <div className="mb-10">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center font-bold text-xs">02</div>
                    <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Ubicación y Marca</h3>
                    <div className="h-[1px] flex-1 bg-slate-100 dark:bg-slate-800 ml-2"></div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
                    <div>
                      <SearchableSelect
                        label="Ciudad Regional"
                        options={cities.map(c => ({ value: c.id, label: c.name }))}
                        value={formData.cityId}
                        onChange={(val) => setFormData({ ...formData, cityId: val })}
                        icon={MapPin}
                        required
                      />
                    </div>

                    <div>
                      <SearchableSelect
                        label="Distrito / Zona"
                        options={districts.map(d => ({ value: d.id, label: d.name }))}
                        value={formData.districtId}
                        onChange={(val) => setFormData({ ...formData, districtId: val })}
                        icon={Building}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <SearchableSelect
                        label="Marca / Grupo"
                        options={brands.map(b => ({ value: b.id, label: b.name }))}
                        value={formData.brandId}
                        onChange={(val) => setFormData({ ...formData, brandId: val })}
                        icon={Tag}
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 px-1">Dirección Física *</label>
                      <div className="relative group">
                        <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input 
                          required
                          value={formData.address} 
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })} 
                          className="w-full p-4 pl-12 rounded-[20px] border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all font-bold text-sm"
                          placeholder="Dirección completa..."
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* --- Section 3: Operational Configuration (Attendance Mode) --- */}
                <div className="mb-10">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center font-bold text-xs">03</div>
                    <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Lógica de Asistencia</h3>
                    <div className="h-[1px] flex-1 bg-slate-100 dark:bg-slate-800 ml-2"></div>
                  </div>

                  <div className="space-y-6">
                    <div className="p-6 rounded-[28px] bg-slate-50/50 dark:bg-slate-800/30 border-2 border-slate-100 dark:border-slate-800/50">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${formData.useSequentialPairing ? 'bg-indigo-500 text-white shadow-lg' : 'bg-emerald-500 text-white shadow-lg'}`}>
                            {formData.useSequentialPairing ? <Settings size={20} /> : <Clock size={20} />}
                          </div>
                          <div>
                            <div className="font-bold text-sm dark:text-white">
                                {formData.useSequentialPairing ? 'Modo Marcaciones' : 'Modo Turno'}
                            </div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                {formData.useSequentialPairing ? 'Cruce Secuencial (Biométrico manda)' : 'Basado en Turnos (Calendario manda)'}
                            </div>
                          </div>
                        </div>
                        <label className="premium-switch">
                          <input 
                            type="checkbox" 
                            checked={formData.useSequentialPairing}
                            onChange={(e) => setFormData({ ...formData, useSequentialPairing: e.target.checked })}
                          />
                          <span className="premium-switch-slider"></span>
                        </label>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                        {formData.useSequentialPairing 
                           ? 'Prioriza el orden de las marcaciones para armar pares, ideal para puntos con mucha rotación horaria.' 
                           : 'Valida que el empleado cumpla exactamente el horario programado en su calendario.'}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3 px-1">Inicio Día Operativo</label>
                            <div className="relative group">
                                <Clock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                <input 
                                    type="time"
                                    value={formData.operationalDayStart} 
                                    onChange={(e) => setFormData({ ...formData, operationalDayStart: e.target.value })} 
                                    className="w-full p-4 pl-12 rounded-[20px] border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all font-black text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3 px-1 text-right">Corte de 24 Horas</label>
                            <div className="text-[10px] text-slate-400 text-right font-medium italic">
                                Define cuándo se agrupan las marcaciones en un solo reporte diario.
                            </div>
                        </div>
                    </div>

                    {!formData.useSequentialPairing && (
                       <div className="p-6 rounded-[28px] bg-emerald-50/30 dark:bg-emerald-900/10 border-2 border-emerald-100 dark:border-emerald-800 group animate-in slide-in-from-top-4 duration-500">
                           <div className="flex items-center gap-3 mb-5">
                                <Building size={16} className="text-emerald-500" />
                                <h4 className="text-[11px] font-black text-emerald-600 uppercase tracking-widest">Horario Estándar del Centro</h4>
                           </div>
                           <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 px-1">Entrada Sede</label>
                                    <input 
                                        type="time"
                                        value={formData.defaultStartTime} 
                                        onChange={(e) => setFormData({ ...formData, defaultStartTime: e.target.value })} 
                                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-bold text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 px-1">Salida Sede</label>
                                    <input 
                                        type="time"
                                        value={formData.defaultEndTime} 
                                        onChange={(e) => setFormData({ ...formData, defaultEndTime: e.target.value })} 
                                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-bold text-sm"
                                    />
                                </div>
                           </div>
                           <p className="text-[9px] text-emerald-600/70 mt-4 font-bold uppercase text-center tracking-tighter">Este horario servirá de respaldo si el empleado no tiene un turno asignado.</p>
                       </div>
                    )}
                  </div>
                </div>

                {/* --- Section 4: Operational Status --- */}
                <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-50 dark:border-slate-800 flex items-center justify-between shadow-sm mt-6">
                  <div className="flex items-center gap-5">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${formData.isActive ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100' : 'bg-slate-100 text-slate-400'}`}>
                      {formData.isActive ? <CheckCircle size={26} /> : <AlertCircle size={26} />}
                    </div>
                    <div>
                      <div className="font-black text-md dark:text-white leading-tight">Estado Operativo</div>
                      <div className="text-[10px] text-emerald-600 uppercase font-black tracking-widest mt-1.5 flex items-center gap-1.5">
                        {formData.isActive ? <><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div> TIENDA EN OPERACIÓN</> : 'TIENDA INACTIVA / CERRADA'}
                      </div>
                    </div>
                  </div>
                  <label className="premium-switch">
                    <input 
                      type="checkbox" 
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    />
                    <span className="premium-switch-slider"></span>
                  </label>
                </div>
              </div>

              <div className="modal-footer" style={{ padding: '1rem 2.5rem 2.5rem', border: 'none' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-premium btn-premium-secondary" style={{ height: '56px', borderRadius: '20px', flex: 1 }} disabled={isSubmitting}>
                  Cerrar
                </button>
                <button type="submit" className="btn-premium btn-premium-primary" style={{ height: '56px', borderRadius: '20px', flex: 2 }} disabled={isSubmitting}>
                  {isSubmitting ? <div className="loader"></div> : (currentStore ? 'Guardar Cambios' : 'Confirmar Sede')}
                </button>
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
