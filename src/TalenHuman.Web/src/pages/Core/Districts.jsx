import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, X, User, Building, Store, CheckCircle, AlertCircle, Search, ChevronRight } from 'lucide-react';
import api from '../../services/api';
import SearchableSelect from '../../components/Shared/SearchableSelect';
import { useTableData } from '../../hooks/useTableData';
import Pagination from '../../components/Shared/Pagination';
import { useTheme } from '../../context/ThemeContext';

const Districts = () => {
  const { isDarkMode } = useTheme();
  const activeColors = {
    bg: isDarkMode ? '#0f172a' : '#f8fafc',
    card: isDarkMode ? '#1e293b' : '#ffffff',
    border: isDarkMode ? '#334155' : '#f1f5f9',
    textMain: isDarkMode ? '#f1f5f9' : '#1e293b',
    textMuted: isDarkMode ? '#94a3b8' : '#64748b',
    accent: '#4f46e5',
  };

  const [districts, setDistricts] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [currentDistrict, setCurrentDistrict] = useState(null);
  const [formData, setFormData] = useState({ name: '', supervisorId: null, storeIds: [] });
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { 
    data: currentDistricts, 
    searchTerm, 
    setSearchTerm, 
    currentPage, 
    setCurrentPage, 
    totalPages, 
    totalItems, 
    itemsPerPage, 
    setItemsPerPage 
  } = useTableData(districts, []);

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
      const [districtsRes, usersRes, storesRes] = await Promise.all([
        api.get('/districts'),
        api.get('/users'),
        api.get('/stores')
      ]);
      setDistricts(districtsRes.data);
      // Filter users who have Supervisor role (case-insensitive)
      const supervisorUsers = usersRes.data.filter(u => u.roles?.some(r => r.toLowerCase() === 'supervisor'));
      setSupervisors(supervisorUsers);
      setStores(storesRes.data);
    } catch (err) {
      console.error(err);
      showToast("Error al cargar datos", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      if (currentDistrict) {
        await api.put(`/districts/${currentDistrict.id}`, {
          ...formData,
          supervisorId: formData.supervisorId || null
        });
        showToast("Distrito actualizado con éxito");
      } else {
        await api.post('/districts', {
          ...formData,
          supervisorId: formData.supervisorId || null
        });
        showToast("Distrito creado con éxito");
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      showToast("Error al guardar el distrito", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await api.delete(`/districts/${currentDistrict.id}`);
      showToast("Distrito eliminado satisfactoriamente");
      setShowConfirm(false);
      fetchData();
    } catch (err) {
      showToast("Error al eliminar el registro", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleStore = (storeId) => {
    setFormData(prev => {
      const isSelected = prev.storeIds.includes(storeId);
      if (isSelected) {
        return { ...prev, storeIds: prev.storeIds.filter(id => id !== storeId) };
      } else {
        return { ...prev, storeIds: [...prev.storeIds, storeId] };
      }
    });
  };

  return (
    <div className="page-container animate-in fade-in duration-500" style={{ padding: '2rem 1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4rem', gap: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: '950', color: activeColors.textMain, margin: 0, letterSpacing: '-0.03em' }}>Distritos</h1>
          <p style={{ color: activeColors.textMuted, fontSize: '0.9rem', fontWeight: '600', marginTop: '6px' }}>Agrupación de sedes y asignación de supervisores</p>
        </div>

        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', width: '100%', maxWidth: '750px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar distritos..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-premium pl-12"
              style={{ margin: 0, borderRadius: '20px', height: '56px' }}
            />
          </div>
          <button 
            onClick={() => { setCurrentDistrict(null); setFormData({ name: '', supervisorId: null, storeIds: [] }); setShowModal(true); }}
            className="btn-premium btn-premium-primary"
            style={{ borderRadius: '20px', height: '56px', padding: '0 25px' }}
          >
            <Plus size={20} /> Nuevo Distrito
          </button>
        </div>
      </div>

      <div className="card flex flex-col" style={{ padding: 0, overflow: 'hidden', minHeight: '60vh' }}>
        {loading ? (
          <div style={{ padding: '6rem', textAlign: 'center' }}>
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              <p className="text-slate-500 font-medium">Cargando distritos...</p>
            </div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', background: 'var(--bg-main)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', trackingWider: '0.1em' }}>Distrito</th>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', trackingWider: '0.1em' }}>Supervisor a Cargo</th>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', trackingWider: '0.1em' }}>Sedes Agrupadas</th>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', trackingWider: '0.1em', textAlign: 'right' }}>Gestión</th>
              </tr>
            </thead>
            <tbody>
              {currentDistricts.map((d) => (
                <tr key={d.id} style={{ borderBottom: '1px solid var(--border)' }} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '38px', height: '38px', background: 'rgba(79, 70, 229, 0.1)', color: '#4f46e5', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Building size={20} />
                      </div>
                      <div className="font-bold text-slate-800 dark:text-white text-lg">{d.name}</div>
                    </div>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    {d.supervisorName ? (
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-indigo-600 font-bold text-xs border border-slate-200">
                          {d.supervisorName.charAt(0)}
                        </div>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{d.supervisorName}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs italic">Sin supervisor asignado</span>
                    )}
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-black uppercase tracking-wider">
                        {d.storeCount} Tiendas
                      </span>
                      {d.storeNames && d.storeNames.slice(0, 2).map((s, idx) => (
                        <span key={idx} className="text-[10px] text-slate-400 font-bold uppercase">• {s}</span>
                      ))}
                      {d.storeCount > 2 && <span className="text-[10px] text-slate-400 font-bold uppercase">+{d.storeCount - 2} más</span>}
                    </div>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                    <button 
                      onClick={() => { 
                        setCurrentDistrict(d); 
                        setFormData({ 
                          name: d.name, 
                          supervisorId: d.supervisorId || null, 
                          storeIds: d.storeIds || []
                        }); 
                        setShowModal(true); 
                      }}
                      className="p-2 hover:bg-indigo-50 text-indigo-600 rounded-xl transition-colors"
                    >
                      <Edit size={18} />
                    </button>
                    <button 
                      onClick={() => { setCurrentDistrict(d); setShowConfirm(true); }}
                      className="p-2 hover:bg-red-50 text-red-600 rounded-xl transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2 className="text-lg font-bold flex items-center gap-2 dark:text-white">
                <Building size={22} className="text-indigo-500" />
                {currentDistrict ? 'Editar Distrito' : 'Nuevo Distrito'}
              </h2>
              <button onClick={() => setShowModal(false)} className="bg-transparent border-none cursor-pointer p-2 rounded-full hover:bg-slate-100 transition-colors">
                <X size={22} className="text-slate-400" />
              </button>
            </div>
            
            <form onSubmit={handleSave}>
              <div className="modal-body space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nombre del Distrito *</label>
                  <div className="relative">
                    <Building size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      required 
                      value={formData.name} 
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                      className="w-full p-3 pl-10 rounded-xl border-slate-200 bg-slate-50 focus:ring-2 focus:ring-indigo-500 transition-all font-medium" 
                      placeholder="Ej. Distrito Norte"
                    />
                  </div>
                </div>

                <div>
                  <SearchableSelect
                    label="Supervisor Responsable"
                    options={supervisors.map(u => ({ value: u.id, label: u.fullName }))}
                    value={formData.supervisorId}
                    onChange={(val) => setFormData({ ...formData, supervisorId: val })}
                    placeholder="Seleccionar supervisor..."
                    icon={User}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Asignar Tiendas</label>
                  <div className="grid grid-cols-2 gap-3 max-h-[250px] overflow-y-auto p-2 border border-slate-200 rounded-xl bg-slate-50">
                    {stores.map(store => (
                      <div 
                        key={store.id} 
                        onClick={() => toggleStore(store.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-2 ${formData.storeIds.includes(store.id) ? 'bg-indigo-600/10 border-indigo-600' : 'bg-white border-slate-100 hover:border-indigo-200'}`}
                      >
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${formData.storeIds.includes(store.id) ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'}`}>
                          {formData.storeIds.includes(store.id) && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                        </div>
                        <div className="flex flex-col">
                          <span className={`text-xs font-bold ${formData.storeIds.includes(store.id) ? 'text-indigo-900' : 'text-slate-700'}`}>{store.name}</span>
                          <span className="text-[10px] text-slate-400 uppercase">{store.externalId}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn-premium btn-premium-secondary" disabled={isSubmitting}>
                  Cancelar
                </button>
                <button type="submit" className="btn-premium btn-premium-primary" disabled={isSubmitting}>
                  {isSubmitting ? <div className="loader"></div> : (currentDistrict ? 'Guardar Cambios' : 'Crear Distrito')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showConfirm && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '420px' }}>
            <div className="modal-body text-center pt-10">
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 size={40} />
              </div>
              <h2 className="text-xl font-bold mb-2">¿Eliminar distrito?</h2>
              <p className="text-slate-500 text-sm mb-8 px-4">
                Se eliminará el grupo <strong>{currentDistrict?.name}</strong>. Las tiendas asignadas quedarán sin distrito.
              </p>
              <div className="flex gap-4">
                <button onClick={() => setShowConfirm(false)} className="btn-premium btn-premium-secondary flex-1" disabled={isDeleting}>
                  Cancelar
                </button>
                <button onClick={handleDelete} className="btn-premium btn-premium-danger flex-1" disabled={isDeleting}>
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
    </div>
  );
};

export default Districts;
