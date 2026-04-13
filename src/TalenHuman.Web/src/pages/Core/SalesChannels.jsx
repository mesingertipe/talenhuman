import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, X, Filter, CheckCircle, AlertCircle, Search, FileSpreadsheet } from 'lucide-react';
import api from '../../services/api';
import BulkImportModal from '../../components/Shared/BulkImportModal';
import PermissionGuard from '../../components/Shared/PermissionGuard';
import { useTableData } from '../../hooks/useTableData';
import Pagination from '../../components/Shared/Pagination';
import { useTheme } from '../../context/ThemeContext';

const SalesChannels = ({ user }) => {
  const { isDarkMode } = useTheme();
  const activeColors = {
    bg: isDarkMode ? '#0f172a' : '#f8fafc',
    card: isDarkMode ? '#1e293b' : '#ffffff',
    border: isDarkMode ? '#334155' : '#f1f5f9',
    textMain: isDarkMode ? '#f1f5f9' : '#1e293b',
    textMuted: isDarkMode ? '#94a3b8' : '#64748b',
    accent: '#6366f1',
    accentSoft: isDarkMode ? 'rgba(99, 102, 241, 0.15)' : '#eef2ff'
  };

  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [currentChannel, setCurrentChannel] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', IsActive: true });
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { 
    data: currentChannels, 
    searchTerm, 
    setSearchTerm, 
    currentPage, 
    setCurrentPage, 
    totalPages, 
    totalItems, 
    itemsPerPage, 
    setItemsPerPage 
  } = useTableData(channels, ['name']);

  useEffect(() => {
    fetchChannels();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const fetchChannels = async () => {
    try {
      setLoading(true);
      const res = await api.get('/sales/channels');
      setChannels(res.data);
    } catch (err) {
      console.error("Error fetching channels:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      if (currentChannel) {
        await api.put(`/sales/channels/${currentChannel.id}`, formData);
        showToast("Canal actualizado con éxito");
      } else {
        await api.post('/sales/channels', formData);
        showToast("Canal creado con éxito");
      }
      setShowModal(false);
      fetchChannels();
    } catch (err) {
      showToast("Error al guardar el canal", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await api.delete(`/sales/channels/${currentChannel.id}`);
      showToast("Canal eliminado correctamente");
      setShowConfirm(false);
      fetchChannels();
    } catch (err) {
      showToast("Error al eliminar el canal", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="page-container animate-in fade-in duration-500" style={{ padding: '2rem 1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Elite Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4rem', gap: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: '950', color: activeColors.textMain, margin: 0, letterSpacing: '-0.03em' }}>Canales de Venta</h1>
          <p style={{ color: activeColors.textMuted, fontSize: '0.9rem', fontWeight: '600', marginTop: '6px' }}>Administración de orígenes de venta y plataformas maestras</p>
        </div>

        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', width: '100%', maxWidth: '700px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} className="absolute left-4 top-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Filtrar canales..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-premium pl-12"
              style={{ margin: 0, borderRadius: '20px', height: '56px' }}
            />
          </div>
          <div className="flex gap-3">
            <PermissionGuard module="SALES:SALES_CHANNELS" action="Create" user={user}>
              <button 
                onClick={() => setShowImport(true)}
                className="btn-premium btn-premium-secondary"
                style={{ borderRadius: '20px', height: '56px', padding: '0 25px' }}
              >
                <FileSpreadsheet size={18} /> Importar
              </button>
              <button 
                onClick={() => { 
                  setCurrentChannel(null); 
                  setFormData({ name: '', description: '', IsActive: true }); 
                  setShowModal(true); 
                }}
                className="btn-premium btn-premium-primary"
                style={{ borderRadius: '20px', height: '56px', padding: '0 25px' }}
              >
                <Plus size={20} /> Nuevo Canal
              </button>
            </PermissionGuard>
          </div>
        </div>
      </div>

      <div className="card flex flex-col" style={{ padding: 0, overflow: 'hidden', minHeight: '60vh' }}>
        {loading ? (
          <div style={{ padding: '6rem', textAlign: 'center' }}>
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              <p className="text-slate-500 font-medium">Cargando canales...</p>
            </div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', background: 'var(--bg-main)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', trackingWider: '0.05em' }}>Identificador Canal</th>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', trackingWider: '0.05em' }}>Descripción / Notas</th>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', trackingWider: '0.05em' }}>Estado</th>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', trackingWider: '0.05em', textAlign: 'right' }}>Gestión</th>
              </tr>
            </thead>
            <tbody>
              {currentChannels.map((channel) => (
                <tr key={channel.id} style={{ borderBottom: '1px solid var(--border)' }} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '40px', height: '40px', background: 'var(--bg-main)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1', border: '1px solid var(--border)', flexShrink: 0 }}>
                        <Filter size={20} />
                      </div>
                      <div className="font-bold text-slate-800 dark:text-white uppercase tracking-tight">{channel.name}</div>
                    </div>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem', fontSize: '0.85rem', color: activeColors.textMuted }}>
                    {channel.description || 'Sin descripción'}
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <span style={{ 
                      padding: '0.35rem 0.75rem', 
                      background: channel.isActive !== false ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                      color: channel.isActive !== false ? '#10b981' : '#ef4444', 
                      borderRadius: '9999px', 
                      fontSize: '0.7rem', 
                      fontWeight: '800',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}>
                      {channel.isActive !== false ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                      {channel.isActive !== false ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                    <PermissionGuard module="SALES:SALES_CHANNELS" action="Update" user={user}>
                      <button 
                        onClick={() => { 
                          setCurrentChannel(channel); 
                          setFormData({ name: channel.name, description: channel.description || '', IsActive: channel.isActive !== false }); 
                          setShowModal(true); 
                        }}
                        style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', padding: '0.5rem' }}
                        className="hover:scale-110 transition-transform"
                      >
                        <Edit size={20} />
                      </button>
                    </PermissionGuard>
                    <PermissionGuard module="SALES:SALES_CHANNELS" action="Delete" user={user}>
                      <button 
                        onClick={() => { setCurrentChannel(channel); setShowConfirm(true); }}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.5rem' }}
                        className="hover:scale-110 transition-transform"
                      >
                        <Trash2 size={20} />
                      </button>
                    </PermissionGuard>
                  </td>
                </tr>
              ))}
              {currentChannels.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ padding: '4rem', textAlign: 'center' }}>
                    <div className="flex flex-col items-center gap-2 opacity-30">
                      <Filter size={48} />
                      <p className="font-bold">No se encontraron canales de venta.</p>
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
                {currentChannel ? <Edit size={22} className="text-indigo-500" /> : <Plus size={22} className="text-indigo-500" />}
                {currentChannel ? 'Editar Canal' : 'Nuevo Canal de Venta'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors bg-transparent border-none cursor-pointer p-2 rounded-full">
                <X size={22} />
              </button>
            </div>
            
            <form onSubmit={handleSave}>
              <div className="modal-body overflow-y-auto max-h-[70vh] custom-scrollbar" style={{ padding: '0 2.5rem 2.5rem' }}>
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center font-bold text-xs">01</div>
                    <h3 className="text-sm font-black text-slate-800 dark:text-white tracking-wider uppercase">Identificación</h3>
                    <div className="h-[1px] flex-1 bg-slate-100 dark:bg-slate-800 ml-2"></div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 tracking-wide mb-2 px-1 uppercase">Nombre del Canal *</label>
                      <div className="relative group">
                        <Filter size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input 
                          required 
                          value={formData.name} 
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                          className="w-full p-4 pl-12 rounded-[20px] border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all font-bold text-sm uppercase" 
                          placeholder="Ej. COMEDOR, RAPPI, UBER EATS..."
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 tracking-wide mb-2 px-1">Descripción / Propósito</label>
                      <textarea 
                        value={formData.description} 
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                        className="w-full p-4 rounded-[20px] border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all font-bold text-sm min-h-[100px]" 
                        placeholder="Define el alcance de este canal..."
                      />
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-50 dark:border-slate-800 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${formData.IsActive ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100' : 'bg-slate-100 text-slate-400'}`}>
                      {formData.IsActive ? <CheckCircle size={22} /> : <AlertCircle size={22} />}
                    </div>
                    <div>
                      <div className="font-bold text-sm dark:text-white leading-tight">Estado Operativo</div>
                      <div className="text-[10px] text-emerald-600 font-black tracking-widest mt-1 uppercase">
                        {formData.IsActive ? 'Canal en Servicio' : 'Canal Suspendido'}
                      </div>
                    </div>
                  </div>
                  <label className="premium-switch">
                    <input 
                      type="checkbox" 
                      checked={formData.IsActive}
                      onChange={(e) => setFormData({ ...formData, IsActive: e.target.checked })}
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
                  {isSubmitting ? <div className="loader"></div> : (currentChannel ? 'Actualizar' : 'Registrar Canal')}
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
              <h2 className="text-xl font-bold mb-3">¿Eliminar canal?</h2>
              <p className="text-slate-500 text-sm mb-8 px-4" style={{ lineHeight: '1.6' }}>
                Estás por descartar permanentemente el canal <strong>{currentChannel?.name}</strong>. Esto afectará la organización de reportes de ventas vinculados.
              </p>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={() => setShowConfirm(false)} className="btn-premium btn-premium-secondary" disabled={isDeleting}>
                  No, cancelar
                </button>
                <button onClick={handleDelete} className="btn-premium btn-premium-danger" disabled={isDeleting}>
                  {isDeleting ? <div className="loader"></div> : 'Si, eliminar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <BulkImportModal 
        isOpen={showImport} 
        onClose={() => setShowImport(false)} 
        type="sales_channels" 
        onComplete={fetchChannels} 
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

export default SalesChannels;
