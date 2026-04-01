import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, X, User, Building, Store, CheckCircle, AlertCircle, Search, Download, MapPin } from 'lucide-react';
import * as XLSX from 'xlsx';
import api from '../../services/api';
import SearchableSelect from '../../components/Shared/SearchableSelect';
import MultiSearchableSelect from '../../components/Shared/MultiSearchableSelect';
import { useTableData } from '../../hooks/useTableData';
import Pagination from '../../components/Shared/Pagination';
import { useTheme } from '../../context/ThemeContext';

const Districts = ({ user }) => {
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
  } = useTableData(districts, ['name', 'supervisorName', 'storeNames']);

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
      const supervisorUsers = usersRes.data.filter(u => u.roles?.some(r => r.toLowerCase() === 'distrital'));
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

  const handleExportExcel = () => {
    const dataToExport = districts.map(d => ({
      Distrito: d.name,
      Distrital: d.supervisorName || 'Sin asignar',
      Tiendas: d.storeCount,
      Sedes: d.storeNames?.join(', ') || ''
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Distritos");
    XLSX.writeFile(wb, `Reporte_Distritos_${new Date().toISOString().split('T')[0]}.xlsx`);
    showToast("Reporte Excel generado");
  };

  return (
    <div className="page-container animate-in fade-in duration-500" style={{ padding: '2rem 1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Elite Header & Toolbar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4rem', gap: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: '950', color: activeColors.textMain, margin: 0, letterSpacing: '-0.03em' }}>Gestión de distritos</h1>
          <p style={{ color: activeColors.textMuted, fontSize: '0.9rem', fontWeight: '600', marginTop: '6px' }}>Agrupación de sedes y asignación de distritales</p>
        </div>

        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', width: '100%', maxWidth: '850px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} className="absolute left-4 top-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Filtrar por nombre, supervisor o sede..." 
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
              onClick={() => { setCurrentDistrict(null); setFormData({ name: '', supervisorId: null, storeIds: [] }); setShowModal(true); }}
              className="btn-premium btn-premium-primary"
              style={{ borderRadius: '20px', height: '56px', padding: '0 25px' }}
            >
              <Plus size={20} /> Nuevo Distrito
            </button>
          </div>
        </div>
      </div>

      <div className="card flex flex-col" style={{ padding: 0, overflow: 'hidden', minHeight: '60vh' }}>
        {loading ? (
          <div style={{ padding: '6rem', textAlign: 'center' }}>
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              <p className="text-slate-500 font-medium tracking-widest uppercase text-[10px] font-black">Sincronizando zonas...</p>
            </div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', background: 'var(--bg-main)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', trackingWider: '0.1em' }}>Distrito / Zona</th>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', trackingWider: '0.1em' }}>Distrital a cargo</th>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', trackingWider: '0.1em' }}>Sedes Agrupadas</th>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', trackingWider: '0.1em', textAlign: 'right' }}>Gestión</th>
              </tr>
            </thead>
            <tbody>
              {currentDistricts.map((d) => (
                <tr key={d.id} style={{ borderBottom: '1px solid var(--border)' }} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '38px', height: '38px', background: activeColors.accentSoft, color: activeColors.accent, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Building size={20} />
                      </div>
                      <div className="font-bold text-slate-800 dark:text-white text-lg">{d.name}</div>
                    </div>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    {d.supervisorName ? (
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black text-xs border border-slate-200 dark:border-slate-700">
                          {d.supervisorName.charAt(0)}
                        </div>
                        <span className="font-bold text-slate-700 dark:text-slate-300">{d.supervisorName}</span>
                      </div>
                    ) : (
                      <span className="font-black text-[10px] text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-100 dark:border-slate-700 italic">Sin distrital</span>
                    )}
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 rounded-lg text-xs font-black uppercase tracking-wider border border-indigo-100 dark:border-indigo-500/20">
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
                      style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', padding: '0.5rem' }}
                      className="hover:scale-110 transition-transform"
                    >
                      <Edit size={18} />
                    </button>
                    <button 
                      onClick={() => { setCurrentDistrict(d); setShowConfirm(true); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '0.5rem' }}
                      className="hover:scale-110 transition-transform"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {currentDistricts.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ padding: '4rem', textAlign: 'center' }}>
                    <div className="flex flex-col items-center gap-2 opacity-40">
                      <Building size={48} />
                      <p className="font-medium text-slate-500">No se encontraron distritos con ese criterio.</p>
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
                  {currentDistrict ? <Edit size={24} /> : <Plus size={24} />}
                </div>
                <div>
                  <h2 className="text-2xl font-black dark:text-white" style={{ margin: 0, letterSpacing: '-0.03em' }}>
                    {currentDistrict ? 'Editar Distrito' : 'Nuevo Distrito'}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configuración regional de supervisión</p>
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
                <div className="grid grid-cols-1 gap-10">
                  <div className="mb-4">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center font-bold text-xs">01</div>
                      <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Identificación Regional</h3>
                      <div className="h-[1px] flex-1 bg-slate-100 dark:bg-slate-800 ml-2"></div>
                    </div>

                    <div className="space-y-8">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 px-1">Nombre del Distrito *</label>
                        <div className="relative group">
                          <Building size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                          <input 
                            required 
                            value={formData.name} 
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                            className="w-full p-4 pl-12 rounded-[20px] border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all font-bold text-sm" 
                            placeholder="Ej. Distrito Norte"
                          />
                        </div>
                      </div>

                      <SearchableSelect
                        label="Distrital a cargo"
                        options={supervisors.map(u => ({ value: u.id, label: u.fullName }))}
                        value={formData.supervisorId}
                        onChange={(val) => setFormData({ ...formData, supervisorId: val })}
                        icon={User}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center font-bold text-xs">02</div>
                      <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Sucursales Asociadas</h3>
                      <div className="h-[1px] flex-1 bg-slate-100 dark:bg-slate-800 ml-2"></div>
                    </div>

                    <MultiSearchableSelect
                      label="Sedes del Grupo"
                      options={stores.map(s => ({ 
                        value: s.id, 
                        label: `${s.name} (${s.externalId || 'S/ID'})` 
                      }))}
                      value={formData.storeIds}
                      onChange={(val) => setFormData({ ...formData, storeIds: val })}
                      placeholder="Seleccionar tiendas..."
                    />
                  </div>
                </div>

                <div className="mt-8 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-start gap-3">
                  <MapPin size={18} className="text-indigo-400 mt-0.5 shrink-0" />
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-tight leading-normal">
                    La agrupación por distrito permite reportes consolidados y gestión directa por distrital de zona.
                  </p>
                </div>
              </div>

              <div className="modal-footer" style={{ padding: '1rem 2.5rem 2.5rem', border: 'none' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-premium btn-premium-secondary" style={{ height: '56px', borderRadius: '20px', flex: 1 }} disabled={isSubmitting}>
                  Cerrar
                </button>
                <button type="submit" className="btn-premium btn-premium-primary" style={{ height: '56px', borderRadius: '20px', flex: 2 }} disabled={isSubmitting}>
                  {isSubmitting ? <div className="loader"></div> : (currentDistrict ? 'Guardar Cambios' : 'Confirmar Distrito')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showConfirm && (
        <div className="modal-overlay">
          <div className="modal-content shadow-2xl" style={{ maxWidth: '420px', borderRadius: '32px' }}>
            <div className="modal-body text-center pt-10 p-8">
              <div className="w-20 h-20 bg-red-50 dark:bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 size={40} />
              </div>
              <h2 className="text-2xl font-black mb-3 dark:text-white">¿Eliminar distrito?</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 px-4 font-medium leading-relaxed">
                Se eliminará permanentemente el grupo <strong>{currentDistrict?.name}</strong>. Las tiendas asociadas quedarán sin zona asignada.
              </p>
              <div className="flex gap-4">
                <button onClick={() => setShowConfirm(false)} className="btn-premium btn-premium-secondary flex-1" style={{ borderRadius: '16px' }} disabled={isDeleting}>
                  Cancelar
                </button>
                <button onClick={handleDelete} className="btn-premium btn-premium-danger flex-1" style={{ borderRadius: '16px' }} disabled={isDeleting}>
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
