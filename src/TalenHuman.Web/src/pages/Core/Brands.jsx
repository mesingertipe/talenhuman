import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, X, Building2, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import BulkImportModal from '../../components/Shared/BulkImportModal';
import { useTableData } from '../../hooks/useTableData';
import Pagination from '../../components/Shared/Pagination';
import { Search } from 'lucide-react';

const Brands = () => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [currentBrand, setCurrentBrand] = useState(null);
  const [formData, setFormData] = useState({ name: '' });
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const { 
    data: currentBrands, 
    searchTerm, 
    setSearchTerm, 
    currentPage, 
    setCurrentPage, 
    totalPages, 
    totalItems, 
    itemsPerPage, 
    setItemsPerPage 
  } = useTableData(brands, ['name']);

  useEffect(() => {
    fetchBrands();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const fetchBrands = async () => {
    try {
      setLoading(true);
      const res = await api.get('/brands');
      setBrands(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (currentBrand) {
        await api.put(`/brands/${currentBrand.id}`, formData);
        showToast("Marca actualizada con éxito");
      } else {
        await api.post('/brands', formData);
        showToast("Marca creada con éxito");
      }
      setShowModal(false);
      fetchBrands();
    } catch (err) {
      showToast("Error al guardar la marca", "error");
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/brands/${currentBrand.id}`);
      showToast("Marca eliminada correctamente");
      setShowConfirm(false);
      fetchBrands();
    } catch (err) {
      showToast("Error al eliminar la marca", "error");
    }
  };

  return (
    <div className="page-container animate-in fade-in duration-300">
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="w-full sm:max-w-sm">
          <input 
            type="text" 
            placeholder="Buscar marcas..." 
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
            onClick={() => { setCurrentBrand(null); setFormData({ name: '' }); setShowModal(true); }}
            className="btn-premium btn-premium-primary whitespace-nowrap"
          >
            <Plus size={20} /> Nueva Marca
          </button>
        </div>
      </div>

      <div className="card flex flex-col" style={{ padding: 0, overflow: 'hidden', minHeight: '60vh' }}>
        {loading ? (
          <div style={{ padding: '6rem', textAlign: 'center' }}>
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              <p className="text-slate-500 font-medium">Cargando catálogo...</p>
            </div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', background: 'var(--bg-main)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', trackingWider: '0.1em' }}>Nombre de la Marca</th>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', trackingWider: '0.1em', textAlign: 'right' }}>Gestión</th>
              </tr>
            </thead>
            <tbody>
              {currentBrands.map((brand) => (
                <tr key={brand.id} style={{ borderBottom: '1px solid var(--border)' }} className="hover:bg-slate-50/50 transition-colors">
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '40px', height: '40px', background: '#f5f3ff', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
                        <Building2 size={20} />
                      </div>
                      <div className="font-bold text-slate-800">{brand.name}</div>
                    </div>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                    <button 
                      onClick={() => { setCurrentBrand(brand); setFormData({ name: brand.name }); setShowModal(true); }}
                      style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', padding: '0.5rem' }}
                      className="hover:scale-110 transition-transform"
                    >
                      <Edit size={20} />
                    </button>
                    <button 
                      onClick={() => { setCurrentBrand(brand); setShowConfirm(true); }}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.5rem' }}
                      className="hover:scale-110 transition-transform"
                    >
                      <Trash2 size={20} />
                    </button>
                  </td>
                </tr>
              ))}
              {currentBrands.length === 0 && (
                <tr>
                  <td colSpan="2" style={{ padding: '4rem', textAlign: 'center' }}>
                    <div className="flex flex-col items-center gap-2 opacity-30">
                      <Building2 size={48} />
                      <p className="font-bold">No se encontraron marcas.</p>
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
                {currentBrand ? <Edit size={24} className="text-indigo-500" /> : <Plus size={24} className="text-indigo-500" />}
                {currentBrand ? 'Editar Marca' : 'Nueva Marca'}
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
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nombre de la Marca</label>
                  <div className="relative">
                    <Building2 size={18} className="absolute left-3 top-4 text-slate-400" />
                    <input 
                      required 
                      value={formData.name} 
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                      className="w-full p-3 pl-10 rounded-xl border-slate-200 bg-slate-50 focus:ring-2 focus:ring-indigo-500 transition-all font-medium" 
                      placeholder="Ej. Adidas, Nike, etc."
                    />
                  </div>
                  <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-500 flex items-start gap-3">
                    <AlertCircle size={16} className="text-indigo-500 mt-0.5" />
                    <p>Las marcas registradas aquí podrán ser seleccionadas al crear nuevas tiendas y asignar inventarios.</p>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn-premium btn-premium-secondary">
                  No Guardar
                </button>
                <button type="submit" className="btn-premium btn-premium-primary">
                  {currentBrand ? 'Actualizar Marca' : 'Añadir Marca'}
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
              <h2 className="text-2xl font-bold mb-3">¿Eliminar Marca?</h2>
              <p className="text-slate-500 text-sm mb-8 px-4" style={{ lineHeight: '1.6' }}>
                Estás por descartar permanentemente la marca <strong>{currentBrand?.name}</strong>. Asegúrate de que no haya tiendas vinculadas activas.
              </p>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={() => setShowConfirm(false)} className="btn-premium btn-premium-secondary" style={{ flex: 1 }}>
                  Conservar
                </button>
                <button onClick={handleDelete} className="btn-premium btn-premium-danger" style={{ flex: 1 }}>
                  Eliminar Marca
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <BulkImportModal 
        isOpen={showImport} 
        onClose={() => setShowImport(false)} 
        type="brands" 
        onComplete={fetchBrands} 
      />

      {toast.show && (
        <div className="toast-container">
          <div className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>
            {toast.type === 'success' ? <CheckCircle size={20} className="text-emerald-500" /> : <AlertCircle size={20} className="text-red-500" />}
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
};

export default Brands;
