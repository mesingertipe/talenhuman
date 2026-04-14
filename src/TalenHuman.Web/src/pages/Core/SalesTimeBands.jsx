import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Edit, X, CheckCircle, AlertCircle, 
  Search, Clock, Palette, Save, ArrowRight
} from 'lucide-react';
import api from '../../services/api';
import PermissionGuard from '../../components/Shared/PermissionGuard';
import { useTableData } from '../../hooks/useTableData';
import Pagination from '../../components/Shared/Pagination';
import { useTheme } from '../../context/ThemeContext';

const SalesTimeBands = ({ user }) => {
  const { isDarkMode } = useTheme();
  
  const activeColors = {
    bg: isDarkMode ? '#0f172a' : '#f8fafc',
    card: isDarkMode ? '#1e293b' : '#ffffff',
    border: isDarkMode ? '#334155' : '#f1f5f9',
    textMain: isDarkMode ? '#f1f5f9' : '#1e293b',
    textMuted: isDarkMode ? '#94a3b8' : '#64748b',
    accent: '#8b5cf6',
    accentSoft: isDarkMode ? 'rgba(139, 92, 246, 0.15)' : '#f5f3ff'
  };

  const [bands, setBands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [currentBand, setCurrentBand] = useState(null);
  
  const [formData, setFormData] = useState({ 
    name: '', 
    startTime: '08:00', 
    endTime: '12:00', 
    color: '#8b5cf6',
    IsActive: true 
  });

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { 
    data: currentBands, 
    searchTerm, 
    setSearchTerm, 
    currentPage, 
    setCurrentPage, 
    totalPages, 
    totalItems, 
    itemsPerPage, 
    setItemsPerPage 
  } = useTableData(bands, ['name']);

  useEffect(() => {
    fetchBands();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const fetchBands = async () => {
    try {
      setLoading(true);
      const res = await api.get('/sales/time-bands');
      setBands(res.data);
    } catch (err) {
      console.error("Error fetching time bands:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const payload = {
        ...formData,
        startTime: formData.startTime + ":00",
        endTime: formData.endTime + ":00"
      };

      if (currentBand) {
        await api.put(`/sales/time-bands/${currentBand.id}`, { ...payload, id: currentBand.id });
        showToast("Franja actualizada con éxito");
      } else {
        await api.post('/sales/time-bands', payload);
        showToast("Franja creada con éxito");
      }
      setShowModal(false);
      fetchBands();
    } catch (err) {
      showToast("Error al guardar la franja", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await api.delete(`/sales/time-bands/${currentBand.id}`);
      showToast("Franja eliminada correctamente");
      setShowConfirm(false);
      fetchBands();
    } catch (err) {
      showToast("Error al eliminar la franja", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    return timeStr.substring(0, 5);
  };

  return (
    <div className="page-container animate-in fade-in duration-500" style={{ padding: '2rem 1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Elite Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4rem', gap: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: '950', color: activeColors.textMain, margin: 0, letterSpacing: '-0.03em' }}>Franjas Horarias</h1>
          <p style={{ color: activeColors.textMuted, fontSize: '0.9rem', fontWeight: '600', marginTop: '6px' }}>Definición de periodos operativos para análisis de rendimiento BI</p>
        </div>

        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', width: '100%', maxWidth: '700px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} className="absolute left-4 top-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Filtrar franjas..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-premium pl-12"
              style={{ margin: 0, borderRadius: '20px', height: '56px' }}
            />
          </div>
          <PermissionGuard module="SALES:SALES_TIME_BANDS" action="Create" user={user}>
            <button 
              onClick={() => { 
                setCurrentBand(null); 
                setFormData({ name: '', startTime: '08:00', endTime: '12:00', color: '#8b5cf6', IsActive: true }); 
                setShowModal(true); 
              }}
              className="btn-premium btn-premium-primary"
              style={{ borderRadius: '20px', height: '56px', padding: '0 25px', background: activeColors.accent, boxShadow: `0 10px 25px ${activeColors.accent}33` }}
            >
              <Plus size={20} /> Nueva Franja
            </button>
          </PermissionGuard>
        </div>
      </div>

      <div className="card flex flex-col" style={{ padding: 0, overflow: 'hidden', minHeight: '60vh' }}>
        {loading ? (
          <div style={{ padding: '6rem', textAlign: 'center' }}>
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
              <p className="text-slate-500 font-medium">Sincronizando periodos...</p>
            </div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', background: 'var(--bg-main)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', trackingWider: '0.05em' }}>Periodo Operativo</th>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', trackingWider: '0.05em' }}>Rango de Tiempo</th>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', trackingWider: '0.05em' }}>Color BI</th>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', trackingWider: '0.05em', textAlign: 'right' }}>Gestión</th>
              </tr>
            </thead>
            <tbody>
              {currentBands.map((band) => (
                <tr key={band.id} style={{ borderBottom: '1px solid var(--border)' }} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '40px', height: '40px', background: `${band.color}15`, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: band.color, border: `1px solid ${band.color}33`, flexShrink: 0 }}>
                        <Clock size={20} />
                      </div>
                      <div className="font-bold text-slate-800 dark:text-white uppercase tracking-tight">{band.name}</div>
                    </div>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: activeColors.textMain, fontWeight: '850', fontSize: '1rem' }}>
                      <div className="py-1 px-3 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 font-black">{formatTime(band.startTime)}</div>
                      <ArrowRight size={14} className="text-slate-400" />
                      <div className="py-1 px-3 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 font-black">{formatTime(band.endTime)}</div>
                    </div>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '8px', background: band.color, boxShadow: `0 4px 10px ${band.color}44` }}></div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{band.color}</span>
                    </div>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                    <PermissionGuard module="SALES:SALES_TIME_BANDS" action="Update" user={user}>
                      <button 
                        onClick={() => { 
                          setCurrentBand(band); 
                          setFormData({ 
                            name: band.name, 
                            startTime: formatTime(band.startTime), 
                            endTime: formatTime(band.endTime), 
                            color: band.color || '#8b5cf6',
                            IsActive: band.isActive !== false 
                          }); 
                          setShowModal(true); 
                        }}
                        style={{ background: 'none', border: 'none', color: activeColors.accent, cursor: 'pointer', padding: '0.5rem' }}
                        className="hover:scale-110 transition-transform"
                      >
                        <Edit size={20} />
                      </button>
                    </PermissionGuard>
                  </td>
                </tr>
              ))}
              {currentBands.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ padding: '4rem', textAlign: 'center' }}>
                    <div className="flex flex-col items-center gap-2 opacity-30">
                      <Clock size={48} />
                      <p className="font-bold uppercase tracking-widest text-xs">No se han definido franjas horarias</p>
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(2, 6, 23, 0.85)', backdropFilter: 'blur(30px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: activeColors.card, width: '100%', maxWidth: '520px', maxHeight: '92vh', borderRadius: '48px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 50px 100px rgba(0,0,0,0.4)', animation: 'modalFadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            
            {/* Header Elite v3 */}
            <div style={{ padding: '40px 60px', borderBottom: `1px solid ${activeColors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isDarkMode ? '#1e293b' : '#ffffff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <div style={{ width: '64px', height: '64px', background: activeColors.accentSoft, borderRadius: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: activeColors.accent }}>
                    {currentBand ? <Edit size={28} strokeWidth={2.5} /> : <Plus size={28} strokeWidth={2.5} />}
                </div>
                <div>
                  <h2 style={{ fontSize: '1.8rem', fontWeight: '950', color: activeColors.textMain, margin: 0, letterSpacing: '-0.03em' }}>
                    {currentBand ? 'Ajustar Parámetros' : 'Configurar Nueva Franja'}
                  </h2>
                  <p style={{ fontSize: '0.85rem', color: activeColors.textMuted, fontWeight: '700', marginTop: '4px', letterSpacing: '0.02em' }}>
                    Definición de periodos operativos BI
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
            
            <form onSubmit={handleSave} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '50px 60px', flex: 1, overflowY: 'auto', background: isDarkMode ? '#0f172a' : '#fcfdfe' }} className="custom-scrollbar">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '36px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '950', color: activeColors.accent, background: activeColors.accentSoft, padding: '4px 12px', borderRadius: '8px' }}>01</span>
                      <h3 style={{ fontSize: '0.75rem', fontWeight: '900', color: activeColors.textMain, letterSpacing: '0.05em', margin: 0 }}>Parámetros de Tiempo</h3>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: activeColors.textMuted, marginBottom: '14px', letterSpacing: '0.05em', paddingLeft: '4px' }}>Nombre del Periodo *</label>
                        <div className="relative group">
                          <Palette size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                          <input 
                            required 
                            value={formData.name} 
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                            className="w-full p-4 pl-12 rounded-[20px] border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all font-bold text-sm" 
                            placeholder="Ej. Mañana, Almuerzo, Peak..."
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: activeColors.textMuted, marginBottom: '14px', letterSpacing: '0.05em', paddingLeft: '4px' }}>Hora Inicio *</label>
                          <input 
                            type="time"
                            required 
                            value={formData.startTime} 
                            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} 
                            className="w-full p-4 rounded-[20px] border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all font-black text-sm" 
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: activeColors.textMuted, marginBottom: '14px', letterSpacing: '0.05em', paddingLeft: '4px' }}>Hora Fin *</label>
                          <input 
                            type="time"
                            required 
                            value={formData.endTime} 
                            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })} 
                            className="w-full p-4 rounded-[20px] border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all font-black text-sm" 
                          />
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: activeColors.textMuted, marginBottom: '14px', letterSpacing: '0.05em', paddingLeft: '4px' }}>Color Identificador (HEX)</label>
                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                          <div className="relative flex-1">
                            <Palette size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                              value={formData.color} 
                              onChange={(e) => setFormData({ ...formData, color: e.target.value })} 
                              className="w-full p-4 pl-12 rounded-[20px] border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 font-bold text-sm" 
                              placeholder="#8b5cf6"
                            />
                          </div>
                          <input 
                            type="color" 
                            value={formData.color} 
                            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                            style={{ width: '56px', height: '56px', borderRadius: '18px', border: 'none', cursor: 'pointer', padding: 0, overflow: 'hidden' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ padding: '40px 60px', borderTop: `1px solid ${activeColors.border}`, display: 'flex', gap: '24px', background: isDarkMode ? '#1e293b' : '#ffffff' }}>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  style={{ flex: 1, padding: '20px', borderRadius: '24px', border: `2px solid ${activeColors.border}`, background: 'white', color: activeColors.textMuted, fontWeight: '900', fontSize: '0.95rem', cursor: 'pointer', transition: 'all 0.2s' }}
                  className="hover:bg-slate-50"
                  disabled={isSubmitting}
                >
                  Cerrar
                </button>
                <button 
                  type="submit" 
                  style={{ flex: 2, padding: '20px', borderRadius: '24px', border: 'none', background: activeColors.accent, color: 'white', fontWeight: '950', fontSize: '0.95rem', cursor: 'pointer', boxShadow: `0 10px 25px ${activeColors.accent}33`, transition: 'all 0.3s' }}
                  className="hover:scale-[1.02] active:scale-[0.98]"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Sincronizando...' : <><Save size={18} /> {currentBand ? 'Guardar Cambios' : 'Confirmar Registro'}</>}
                </button>
              </div>
            </form>
          </div>
          <style>{`
            @keyframes modalFadeIn {
              from { opacity: 0; transform: scale(0.95) translateY(20px); }
              to { opacity: 1; transform: scale(1) translateY(0); }
            }
          `}</style>
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

export default SalesTimeBands;
