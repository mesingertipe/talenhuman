import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, X, MapPin, FileSpreadsheet, Store, Tag, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import BulkImportModal from '../../components/Shared/BulkImportModal';
import SearchableSelect from '../../components/Shared/SearchableSelect';
import { useTableData } from '../../hooks/useTableData';
import Pagination from '../../components/Shared/Pagination';
import { Search } from 'lucide-react';

const Stores = () => {
  const [stores, setStores] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [currentStore, setCurrentStore] = useState(null);
  const [formData, setFormData] = useState({ name: '', address: '', brandId: '' });
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

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
      const [storesRes, brandsRes] = await Promise.all([
        api.get('/stores'),
        api.get('/brands')
      ]);
      setStores(storesRes.data);
      setBrands(brandsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
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
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/stores/${currentStore.id}`);
      showToast("Sede eliminada satisfactoriamente");
      setShowConfirm(false);
      fetchData();
    } catch (err) {
      showToast("Error al eliminar el registro", "error");
    }
  };

  return (
    <div className="page-container animate-in fade-in duration-300">
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="w-full sm:max-w-sm">
          <input 
            type="text" 
            placeholder="Buscar tiendas..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2.5 m-0 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm font-medium text-sm transition-all"
            style={{ margin: 0 }}
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-shrink-0">
          <button 
            onClick={() => setShowImport(true)}
            className="btn-premium btn-premium-secondary whitespace-nowrap"
          >
            <FileSpreadsheet size={18} /> Importar
          </button>
          <button 
            onClick={() => { setCurrentStore(null); setFormData({ name: '', address: '', brandId: brands[0]?.id || '' }); setShowModal(true); }}
            className="btn-premium btn-premium-primary whitespace-nowrap"
          >
            <Plus size={20} /> Nueva Tienda
          </button>
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
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', trackingWider: '0.1em' }}>Marca Asociada</th>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', trackingWider: '0.1em' }}>Dirección</th>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', trackingWider: '0.1em', textAlign: 'right' }}>Gestión</th>
              </tr>
            </thead>
            <tbody>
              {currentStores.map((store) => (
                <tr key={store.id} style={{ borderBottom: '1px solid var(--border)' }} className="hover:bg-slate-50 transition-colors">
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '38px', height: '38px', background: '#e0e7ff', color: '#4f46e5', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Store size={20} />
                      </div>
                      <div className="font-bold text-slate-800">{store.name}</div>
                    </div>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <span style={{ padding: '0.35rem 0.75rem', background: '#f1f5f9', color: '#475569', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Tag size={12} /> {store.brandName || brands.find(b => b.id === store.brandId)?.name || 'N/A'}
                    </span>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <MapPin size={14} className="text-slate-400" /> {store.address}
                    </div>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                    <button 
                      onClick={() => { setCurrentStore(store); setFormData({ name: store.name, address: store.address, brandId: store.brandId }); setShowModal(true); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: '1rem', color: '#6366f1' }}
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
                  <td colSpan="4" style={{ padding: '4rem', textAlign: 'center' }}>
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
              <h2 className="text-xl font-bold flex items-center gap-2" style={{ margin: 0 }}>
                {currentStore ? <Edit size={24} className="text-indigo-500" /> : <Plus size={24} className="text-indigo-500" />}
                {currentStore ? 'Editar Tienda' : 'Nueva Tienda'}
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}
              >
                <X size={22} />
              </button>
            </div>
            
            <form onSubmit={handleSave}>
              <div className="modal-body space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nombre de la Tienda</label>
                  <div className="relative">
                    <Store size={18} className="absolute left-3 top-4 text-slate-400" />
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
                    label="Marca Asociada"
                    options={brands.map(b => ({ value: b.id, label: b.name }))}
                    value={formData.brandId}
                    onChange={(val) => setFormData({ ...formData, brandId: val })}
                    placeholder="Seleccionar marca..."
                    icon={Tag}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Dirección / Ubicación</label>
                  <div className="relative">
                    <MapPin size={18} className="absolute left-3 top-4 text-slate-400" />
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

              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn-premium btn-premium-secondary">
                  No Guardar
                </button>
                <button type="submit" className="btn-premium btn-premium-primary">
                  {currentStore ? 'Guardar Cambios' : 'Crear Tienda'}
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
              <h2 className="text-2xl font-bold mb-3">¿Eliminar Tienda?</h2>
              <p className="text-slate-500 text-sm mb-8 px-4" style={{ lineHeight: '1.6' }}>
                Estás por eliminar permanentemente <strong>{currentStore?.name}</strong>. Esta acción impactará sobre la asignación de empleados.
              </p>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={() => setShowConfirm(false)} className="btn-premium btn-premium-secondary" style={{ flex: 1 }}>
                  Conservar
                </button>
                <button onClick={handleDelete} className="btn-premium btn-premium-danger" style={{ flex: 1 }}>
                  Sí, eliminar
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
