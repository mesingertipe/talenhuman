import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, X, MapPin, FileSpreadsheet, Store, Tag, CheckCircle, AlertCircle, Building } from 'lucide-react';
import api from '../../services/api';
import BulkImportModal from '../../components/Shared/BulkImportModal';
import SearchableSelect from '../../components/Shared/SearchableSelect';
import { useTableData } from '../../hooks/useTableData';
import Pagination from '../../components/Shared/Pagination';
import { Search } from 'lucide-react';
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
  const [formData, setFormData] = useState({ name: '', address: '', brandId: '', cityId: '', districtId: '', externalId: '', biometricId: '', isActive: true });
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
  } = useTableData(stores, []);

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

  return (
    <div className="page-container animate-in fade-in duration-500" style={{ padding: '2rem 1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Elite Header & Toolbar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4rem', gap: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: '950', color: activeColors.textMain, margin: 0, letterSpacing: '-0.03em' }}>Gestión de tiendas</h1>
          <p style={{ color: activeColors.textMuted, fontSize: '0.9rem', fontWeight: '600', marginTop: '6px' }}>Administración de puntos de venta y sucursales</p>
        </div>

        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', width: '100%', maxWidth: '750px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} className="absolute left-4 top-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Filtrar tiendas..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-premium pl-12"
              style={{ margin: 0, borderRadius: '20px', height: '56px' }}
            />
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setShowImport(true)}
              className="btn-premium btn-premium-secondary"
              style={{ borderRadius: '20px', height: '56px', padding: '0 25px' }}
            >
              <FileSpreadsheet size={18} /> Importar
            </button>
            <button 
              onClick={() => { setCurrentStore(null); setFormData({ name: '', address: '', brandId: '', cityId: '', districtId: '', externalId: '', biometricId: '', isActive: true }); setShowModal(true); }}
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
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', trackingWider: '0.1em' }}>ID / Ciudad</th>
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
                        <MapPin size={12} /> {cities.find(c => c.id === store.cityId)?.name || 'Sin ciudad'}
                      </span>
                      {store.districtId && (
                        <span style={{ fontSize: '0.75rem', color: '#4f46e5', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px', textTransform: 'uppercase' }}>
                          <Building size={12} /> {districts.find(d => d.id === store.districtId)?.name || 'Distrito'}
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
                      <Tag size={12} /> {store.brandName || brands.find(b => b.id === store.brandId)?.name || 'N/A'}
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
                          isActive: store.isActive !== false 
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
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h2 className="text-lg font-bold flex items-center gap-2 dark:text-white" style={{ margin: 0 }}>
                {currentStore ? <Edit size={22} className="text-indigo-500" /> : <Plus size={22} className="text-indigo-500" />}
                {currentStore ? 'Editar tienda' : 'Nueva tienda'}
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors bg-transparent border-none cursor-pointer p-2 rounded-full"
              >
                <X size={22} />
              </button>
            </div>
            
            <form onSubmit={handleSave}>
              <div className="modal-body space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nombre de la Tienda *</label>
                    <div className="relative">
                      <Store size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        required 
                        value={formData.name} 
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                        className="w-full p-3 pl-10 rounded-xl border-slate-200 bg-slate-50 focus:ring-2 focus:ring-indigo-500 transition-all font-medium" 
                        placeholder="Ej. Sede Central Norte"
                      />
                    </div>
                  </div>

                  <div>
                    <SearchableSelect
                      label="Ciudad"
                      options={cities.map(c => ({ value: c.id, label: c.name }))}
                      value={formData.cityId}
                      onChange={(val) => setFormData({ ...formData, cityId: val })}
                      placeholder="Seleccionar..."
                      icon={MapPin}
                      required
                    />
                  </div>

                  <div>
                    <SearchableSelect
                      label="Distrito"
                      options={districts.map(d => ({ value: d.id, label: d.name }))}
                      value={formData.districtId}
                      onChange={(val) => setFormData({ ...formData, districtId: val })}
                      placeholder="Seleccionar..."
                      icon={Building}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">ID Tienda / Código *</label>
                    <div className="relative">
                      <Tag size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        required
                        value={formData.externalId} 
                        onChange={(e) => setFormData({ ...formData, externalId: e.target.value })} 
                        className="w-full p-3 pl-10 rounded-xl border-slate-200 bg-slate-50 focus:ring-2 focus:ring-indigo-500 transition-all font-medium" 
                        placeholder="Ej. T-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">ID Biométrico</label>
                    <div className="relative">
                      <Tag size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        value={formData.biometricId} 
                        onChange={(e) => setFormData({ ...formData, biometricId: e.target.value })} 
                        className="w-full p-3 pl-10 rounded-xl border-slate-200 bg-slate-50 focus:ring-2 focus:ring-indigo-500 transition-all font-medium" 
                        placeholder="Ej. BIO-78"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <SearchableSelect
                      label="Marca Asociada"
                      options={brands.map(b => ({ value: b.id, label: b.name }))}
                      value={formData.brandId}
                      onChange={(val) => setFormData({ ...formData, brandId: val })}
                      placeholder="Seleccionar marca..."
                      icon={Tag}
                      required
                    />
                  </div>

                  <div className="md:col-span-2 mb-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Dirección / Ubicación *</label>
                    <div className="relative">
                      <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        required
                        value={formData.address} 
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })} 
                        className="w-full p-3 pl-10 rounded-xl border-slate-200 bg-slate-50 focus:ring-2 focus:ring-indigo-500 transition-all font-medium" 
                        placeholder="Ej. Av. Principal #123"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${formData.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                      {formData.isActive ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    </div>
                    <div>
                      <div className="font-bold text-sm dark:text-white leading-tight">Estado de la Tienda</div>
                      <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-0.5">
                        {formData.isActive ? 'TIENDA ACTIVA' : 'TIENDA INACTIVA'}
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

              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn-premium btn-premium-secondary" disabled={isSubmitting}>
                  Cancelar
                </button>
                <button type="submit" className="btn-premium btn-premium-primary" disabled={isSubmitting}>
                  {isSubmitting ? <div className="loader"></div> : (currentStore ? 'Guardar Cambios' : 'Crear Tienda')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showConfirm && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '420px' }}>
            <div className="modal-body" style={{ textAlign: 'center', paddingTop: '3rem' }}>
              <div className="mb-6" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                <Trash2 size={40} />
              </div>
              <h2 className="text-xl font-bold mb-3">¿Eliminar tienda?</h2>
              <p className="text-slate-500 text-sm mb-8 px-4" style={{ lineHeight: '1.6' }}>
                Estás por eliminar permanentemente <strong>{currentStore?.name}</strong>. Esta acción impactará sobre la asignación de empleados.
              </p>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={() => setShowConfirm(false)} className="btn-premium btn-premium-secondary" style={{ flex: 1 }} disabled={isDeleting}>
                  Cancelar
                </button>
                <button onClick={handleDelete} className="btn-premium btn-premium-danger" style={{ flex: 1 }} disabled={isDeleting}>
                  {isDeleting ? <div className="loader"></div> : 'Sí, eliminar'}
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
