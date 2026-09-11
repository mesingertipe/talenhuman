import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, X, FileSpreadsheet, CheckCircle, AlertCircle, Clock, Link as LinkIcon, ServerCrash, Zap, Settings, Activity } from 'lucide-react';
import api from '../../services/api';
import PermissionGuard from '../../components/Shared/PermissionGuard';
import { useTableData } from '../../hooks/useTableData';
import Pagination from '../../components/Shared/Pagination';
import { Search } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const IntegrationTriggers = ({ user }) => {
  const { isDarkMode } = useTheme();
  const activeColors = {
    textMain: isDarkMode ? '#f1f5f9' : '#1e293b',
    textMuted: isDarkMode ? '#94a3b8' : '#64748b',
  };

  const translateCron = (cron) => {
    if (!cron) return 'Sin definir';
    const parts = cron.trim().split(/\s+/);
    if (parts.length < 5) return 'Horario personalizado';
    
    const [min, hour, day, month, dow] = parts;
    
    if (min.startsWith('*/') && hour === '*' && day === '*' && month === '*' && dow === '*') {
      return `Cada ${min.replace('*/', '')} minutos`;
    }
    if (min === '0' && hour.startsWith('*/') && day === '*' && month === '*' && dow === '*') {
      return `Cada ${hour.replace('*/', '')} horas`;
    }
    if (min === '0' && hour === '*' && day === '*' && month === '*' && dow === '*') {
      return 'Cada hora exacta';
    }
    if (min === '0' && hour === '0' && day === '*' && month === '*' && dow === '*') {
      return 'Diario a la medianoche';
    }
    if (!isNaN(min) && !isNaN(hour) && day === '*' && month === '*' && dow === '*') {
      let h = parseInt(hour);
      const ampm = h >= 12 ? 'PM' : 'AM';
      if (h > 12) h -= 12;
      if (h === 0) h = 12;
      return `Diario a las ${h}:${min.padStart(2, '0')} ${ampm}`;
    }
    return 'Horario programado';
  };

  const [triggers, setTriggers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [currentTrigger, setCurrentTrigger] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  
  const [formData, setFormData] = useState({ 
    name: '', 
    targetUrl: '', 
    cronExpression: '0 * * * *', 
    isActive: true 
  });
  
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { 
    data: currentTriggers, 
    searchTerm, 
    setSearchTerm, 
    currentPage, 
    setCurrentPage, 
    totalPages, 
    totalItems, 
    itemsPerPage, 
    setItemsPerPage 
  } = useTableData(triggers, ['name', 'targetUrl', 'cronExpression']);

  useEffect(() => {
    fetchTriggers();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const fetchTriggers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/IntegrationTriggers');
      setTriggers(res.data);
    } catch (err) {
      console.error(err);
      showToast("Error al cargar los triggers", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async (trigger) => {
    setCurrentTrigger(trigger);
    setShowLogsModal(true);
    try {
      setLoadingLogs(true);
      const res = await api.get(`/IntegrationTriggers/${trigger.id}/logs`);
      setLogs(res.data);
    } catch (err) {
      console.error(err);
      showToast("Error al cargar los logs", "error");
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      if (currentTrigger) {
        await api.put(`/IntegrationTriggers/${currentTrigger.id}`, { ...currentTrigger, ...formData });
        showToast("Trigger actualizado con éxito");
      } else {
        await api.post('/IntegrationTriggers', formData);
        showToast("Trigger creado con éxito");
      }
      setShowModal(false);
      fetchTriggers();
    } catch (err) {
      showToast("Error al guardar el trigger", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await api.delete(`/IntegrationTriggers/${currentTrigger.id}`);
      showToast("Trigger eliminado correctamente");
      setShowConfirm(false);
      fetchTriggers();
    } catch (err) {
      showToast("Error al eliminar el trigger", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="page-container animate-in fade-in duration-500" style={{ padding: '2rem 1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4rem', gap: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: '950', color: activeColors.textMain, margin: 0, letterSpacing: '-0.03em' }}>Triggers de Integración</h1>
          <p style={{ color: activeColors.textMuted, fontSize: '0.9rem', fontWeight: '600', marginTop: '6px' }}>Orquestador de Cron Jobs y Tareas en Segundo Plano</p>
        </div>

        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', width: '100%', maxWidth: '700px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} className="absolute left-4 top-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar triggers..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-premium pl-12"
              style={{ margin: 0, borderRadius: '20px', height: '56px' }}
            />
          </div>
          <div className="flex gap-3">
            <PermissionGuard module="SYSTEM" action="Create" user={user}>
              <button 
                onClick={() => { setCurrentTrigger(null); setFormData({ name: '', targetUrl: '', cronExpression: '0 * * * *', isActive: true }); setShowModal(true); }}
                className="btn-premium btn-premium-primary"
                style={{ borderRadius: '20px', height: '56px', padding: '0 25px' }}
              >
                <Plus size={20} /> Nuevo Trigger
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
              <p className="text-slate-500 font-medium">Cargando orquestador...</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto w-full custom-scrollbar">
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px', tableLayout: 'fixed' }}>
              <thead>
                <tr style={{ textAlign: 'left', background: 'var(--bg-main)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', width: '25%' }}>Tarea</th>
                  <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', width: '30%' }}>URL Destino</th>
                  <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', width: '20%' }}>Frecuencia (Cron)</th>
                  <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', width: '10%' }}>Estado</th>
                  <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textAlign: 'right', width: '15%' }}>Acciones</th>
                </tr>
              </thead>
            <tbody>
              {currentTriggers.map((trigger) => (
                <tr key={trigger.id} style={{ borderBottom: '1px solid var(--border)' }} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '40px', height: '40px', background: 'var(--bg-main)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1', border: '1px solid var(--border)' }}>
                        <Zap size={20} />
                      </div>
                      <div className="font-bold text-slate-800 dark:text-white">{trigger.name}</div>
                    </div>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <div className="text-xs text-slate-500 font-mono truncate max-w-[250px]" title={trigger.targetUrl}>
                      {trigger.targetUrl}
                    </div>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        {translateCron(trigger.cronExpression)}
                      </span>
                      <span className="px-2 py-0.5 w-fit bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded font-mono text-[10px] font-bold">
                        {trigger.cronExpression}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <span style={{ 
                      padding: '0.35rem 0.75rem', 
                      background: trigger.isActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                      color: trigger.isActive ? '#10b981' : '#ef4444', 
                      borderRadius: '9999px', 
                      fontSize: '0.7rem', 
                      fontWeight: '800',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}>
                      {trigger.isActive ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                      {trigger.isActive ? 'Activo' : 'Pausado'}
                    </span>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                    <button 
                      onClick={() => fetchLogs(trigger)}
                      style={{ background: 'none', border: 'none', color: '#8b5cf6', cursor: 'pointer', padding: '0.5rem' }}
                      className="hover:scale-110 transition-transform"
                      title="Ver Logs"
                    >
                      <Activity size={20} />
                    </button>
                    <PermissionGuard module="SYSTEM" action="Update" user={user}>
                      <button 
                        onClick={() => { setCurrentTrigger(trigger); setFormData({ name: trigger.name, targetUrl: trigger.targetUrl, cronExpression: trigger.cronExpression, isActive: trigger.isActive }); setShowModal(true); }}
                        style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', padding: '0.5rem' }}
                        className="hover:scale-110 transition-transform"
                        title="Editar"
                      >
                        <Edit size={20} />
                      </button>
                    </PermissionGuard>
                    <PermissionGuard module="SYSTEM" action="Delete" user={user}>
                      <button 
                        onClick={() => { setCurrentTrigger(trigger); setShowConfirm(true); }}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.5rem' }}
                        className="hover:scale-110 transition-transform"
                        title="Eliminar"
                      >
                        <Trash2 size={20} />
                      </button>
                    </PermissionGuard>
                  </td>
                </tr>
              ))}
              {currentTriggers.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: '4rem', textAlign: 'center' }}>
                    <div className="flex flex-col items-center gap-2 opacity-30">
                      <Settings size={48} />
                      <p className="font-bold">No se han configurado triggers.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2 className="text-lg font-bold flex items-center gap-2 dark:text-white" style={{ margin: 0 }}>
                {currentTrigger ? <Edit size={22} className="text-indigo-500" /> : <Plus size={22} className="text-indigo-500" />}
                {currentTrigger ? 'Editar Trigger' : 'Nuevo Trigger'}
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors bg-transparent border-none cursor-pointer p-2 rounded-full"
              >
                <X size={22} />
              </button>
            </div>
            
            <form onSubmit={handleSave}>
              <div className="modal-body overflow-y-auto max-h-[70vh] custom-scrollbar" style={{ padding: '0 2.5rem 2.5rem' }}>
                <div className="mb-8">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 tracking-wide mb-2 px-1">Nombre Descriptivo *</label>
                      <div className="relative group">
                        <input 
                          required 
                          value={formData.name} 
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                          className="w-full p-4 rounded-[20px] border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all font-bold text-sm" 
                          placeholder="Ej. Sincronización de Marcaciones a Falcon"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 tracking-wide mb-2 px-1">URL de Destino (Webhook) *</label>
                      <div className="relative group">
                        <LinkIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input 
                          required 
                          type="url"
                          value={formData.targetUrl} 
                          onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })} 
                          className="w-full p-4 pl-12 rounded-[20px] border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all text-sm font-mono" 
                          placeholder="https://faas-fra1.digitalocean.com/..."
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 tracking-wide mb-2 px-1">Expresión Cron *</label>
                      <div className="relative group">
                        <Clock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input 
                          required 
                          value={formData.cronExpression} 
                          onChange={(e) => setFormData({ ...formData, cronExpression: e.target.value })} 
                          className="w-full p-4 pl-12 rounded-[20px] border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all font-bold text-sm font-mono text-indigo-600 dark:text-indigo-400" 
                          placeholder="*/10 * * * *"
                        />
                      </div>
                      <p className="mt-2 text-xs text-slate-500 px-2">
                        Utiliza formato CRON estándar (Minuto Hora Día Mes DíaSemana). El servidor evalúa en tiempo UTC.
                        Ejemplos: <code>*/10 * * * *</code> (cada 10 min), <code>0 12 * * *</code> (diario a las 12).
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-50 dark:border-slate-800 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${formData.isActive ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100' : 'bg-slate-100 text-slate-400'}`}>
                      {formData.isActive ? <CheckCircle size={22} /> : <AlertCircle size={22} />}
                    </div>
                    <div>
                      <div className="font-bold text-sm dark:text-white leading-tight">Estado Vigencia</div>
                      <div className="text-[10px] text-emerald-600 font-black tracking-widest mt-1">
                        {formData.isActive ? 'Activo (Corriendo)' : 'Pausado'}
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
                  {isSubmitting ? <div className="loader"></div> : (currentTrigger ? 'Actualizar' : 'Guardar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Logs Modal */}
      {showLogsModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '800px', width: '90%' }}>
            <div className="modal-header">
              <h2 className="text-lg font-bold flex items-center gap-2 dark:text-white" style={{ margin: 0 }}>
                <Activity size={22} className="text-purple-500" />
                Logs de Ejecución: {currentTrigger?.name}
              </h2>
              <button 
                onClick={() => setShowLogsModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors bg-transparent border-none cursor-pointer p-2 rounded-full"
              >
                <X size={22} />
              </button>
            </div>
            <div className="modal-body custom-scrollbar" style={{ padding: '1.5rem', maxHeight: '70vh', overflowY: 'auto' }}>
              {loadingLogs ? (
                <div className="flex justify-center py-12"><div className="loader"></div></div>
              ) : logs.length === 0 ? (
                <div className="text-center py-12 text-slate-500 opacity-60">
                  <Activity size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Aún no hay ejecuciones registradas para este trigger.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {logs.map(log => (
                    <div key={log.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-3">
                          {log.isSuccess ? (
                            <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 rounded">
                              <CheckCircle size={14} /> Exitoso
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded">
                              <ServerCrash size={14} /> Fallido
                            </span>
                          )}
                          <span className="text-xs font-mono text-slate-500 font-bold bg-white dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
                            HTTP {log.statusCode}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-slate-400">
                          {new Date(log.executedAt).toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="bg-slate-900 rounded-lg p-3 overflow-x-auto">
                        <pre className="text-[11px] text-emerald-400 font-mono m-0 whitespace-pre-wrap word-break">
                          {log.responseBody || '(Sin respuesta del servidor)'}
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
              <h2 className="text-xl font-bold mb-3">¿Eliminar trigger?</h2>
              <p className="text-slate-500 text-sm mb-8 px-4" style={{ lineHeight: '1.6' }}>
                Estás por eliminar el trigger <strong>{currentTrigger?.name}</strong>. Esto detendrá sus ejecuciones programadas permanentemente.
              </p>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={() => setShowConfirm(false)} className="btn-premium btn-premium-secondary" disabled={isDeleting}>
                  No, cancelar
                </button>
                <button onClick={handleDelete} className="btn-premium btn-premium-danger" disabled={isDeleting}>
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
    </div>
  );
};

export default IntegrationTriggers;
