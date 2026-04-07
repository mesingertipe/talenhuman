import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, XCircle, Info, Search, Calendar, 
  Building2, Hash, ArrowRight, ShieldCheck, Clock,
  Filter, Download, ChevronRight, AlertCircle, MessageSquare
} from 'lucide-react';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

const ShiftApproval = ({ user }) => {
  const { isDarkMode } = useTheme();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStores, setSelectedStores] = useState([]);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [rejectionComment, setRejectionComment] = useState('');
  const [approvalComment, setApprovalComment] = useState('');
  const [processing, setProcessing] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const activeColors = {
    card: isDarkMode ? '#1e293b' : '#ffffff',
    border: isDarkMode ? '#334155' : '#e2e8f0',
    textMain: isDarkMode ? '#f1f5f9' : '#1e293b',
    textMuted: isDarkMode ? '#94a3b8' : '#64748b',
    accent: '#4f46e5',
    accentSoft: isDarkMode ? 'rgba(79, 70, 229, 0.15)' : 'rgba(79, 70, 229, 0.05)',
  };

  useEffect(() => {
    fetchPendingStores();
  }, []);

  const fetchPendingStores = async () => {
    try {
      setLoading(true);
      const res = await api.get('/ShiftApproval/pending-stores');
      setStores(res.data);
    } catch (err) {
      console.error(err);
      showToast('Error al cargar tiendas pendientes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleSelectStore = (id) => {
    setSelectedStores(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedStores.length === filteredStores.length) {
      setSelectedStores([]);
    } else {
      setSelectedStores(filteredStores.map(s => s.storeId));
    }
  };

  const handleApprove = async () => {
    if (selectedStores.length === 0) return;
    try {
      setProcessing(true);
      // Backend expects a single store approval per request
      // We will loop through selected stores
      for (const storeId of selectedStores) {
        const storeData = stores.find(s => s.storeId === storeId);
        if (storeData) {
          await api.post('/ShiftApproval/approve', {
            storeId: storeId,
            startDate: storeData.minDate,
            endDate: storeData.maxDate,
            comment: approvalComment || "Aprobación masiva desde consola"
          });
        }
      }
      showToast(`Se han aprobado ${selectedStores.length} mallas exitosamente`);
      setSelectedStores([]);
      setApprovalComment('');
      setShowApprovalModal(false);
      fetchPendingStores();
    } catch (err) {
      showToast('Error en la aprobación masiva', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (selectedStores.length === 0 || !rejectionComment.trim()) return;
    try {
      setProcessing(true);
      for (const storeId of selectedStores) {
        const storeData = stores.find(s => s.storeId === storeId);
        if (storeData) {
          await api.post('/ShiftApproval/reject', { 
            storeId: storeId, 
            startDate: storeData.minDate,
            endDate: storeData.maxDate,
            comment: rejectionComment 
          });
        }
      }
      showToast(`${selectedStores.length} mallas han sido rechazadas`);
      setSelectedStores([]);
      setRejectionComment('');
      setShowCommentModal(false);
      fetchPendingStores();
    } catch (err) {
      showToast('Error al procesar el rechazo', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const filteredStores = stores.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.externalId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.districtName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-container animate-fade-in" style={{ padding: '2rem 1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Header Elite */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3.5rem', gap: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '950', color: activeColors.textMain, margin: 0, letterSpacing: '-0.04em' }}>
            Consola de Aprobación
          </h1>
          <p style={{ color: activeColors.textMuted, fontSize: '0.95rem', fontWeight: '600', marginTop: '8px' }}>
            Validación jerárquica de mallas horarias para el periodo vigente
          </p>
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <button 
            disabled={selectedStores.length === 0 || processing}
            onClick={() => setShowCommentModal(true)}
            style={{ 
              padding: '14px 28px', 
              borderRadius: '18px', 
              border: `2px solid ${isDarkMode ? '#ef444433' : '#fecaca'}`, 
              background: isDarkMode ? '#7f1d1d1a' : '#fef2f2', 
              color: '#ef4444', 
              fontWeight: '800', 
              fontSize: '0.9rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px',
              transition: 'all 0.2s',
              cursor: selectedStores.length === 0 ? 'not-allowed' : 'pointer',
              opacity: selectedStores.length === 0 ? 0.5 : 1
            }}
          >
            <XCircle size={18} /> Rechazar ({selectedStores.length})
          </button>
          <button 
            disabled={selectedStores.length === 0 || processing}
            onClick={() => setShowApprovalModal(true)}
            style={{ 
              padding: '14px 28px', 
              borderRadius: '18px', 
              border: 'none', 
              background: activeColors.accent, 
              color: 'white', 
              fontWeight: '900', 
              fontSize: '0.9rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px',
              boxShadow: '0 10px 25px rgba(79, 70, 229, 0.3)',
              transition: 'all 0.2s',
              cursor: selectedStores.length === 0 ? 'not-allowed' : 'pointer',
              opacity: selectedStores.length === 0 ? 0.5 : 1
            }}
          >
            <CheckCircle size={18} /> Aprobar Seleccionados
          </button>
        </div>
      </div>

      {/* Toolbar & Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '20px', marginBottom: '2rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: '600px' }}>
          <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por sede, ID o distrito..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '18px 24px 18px 60px', 
              borderRadius: '20px', 
              border: `1.5px solid ${activeColors.border}`, 
              background: activeColors.card, 
              color: activeColors.textMain, 
              fontWeight: '700',
              outline: 'none',
              transition: 'all 0.2s'
            }}
            className="focus:border-indigo-500 focus:shadow-xl focus:shadow-indigo-500/5"
          />
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
           <div style={{ padding: '12px 20px', background: activeColors.accentSoft, borderRadius: '16px', border: `1.5px solid ${activeColors.accent}20` }}>
              <span style={{ fontSize: '10px', fontWeight: '900', color: activeColors.accent, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tiendas Pendientes</span>
              <span style={{ fontSize: '1.2rem', fontWeight: '950', color: activeColors.accent }}>{stores.length}</span>
           </div>
        </div>
      </div>

      {/* Grid de Tiendas */}
      <div style={{ background: activeColors.card, borderRadius: '32px', border: `1.5px solid ${activeColors.border}`, overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.03)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', background: activeColors.accentSoft + '40', borderBottom: `1.5px solid ${activeColors.border}` }}>
              <th style={{ padding: '20px 24px', width: '60px' }}>
                <input 
                  type="checkbox" 
                  checked={selectedStores.length === filteredStores.length && filteredStores.length > 0}
                  onChange={handleSelectAll}
                  style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: activeColors.accent }}
                />
              </th>
              <th style={{ padding: '20px 24px', fontSize: '0.7rem', fontWeight: '900', color: activeColors.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Sede / Identificador</th>
              <th style={{ padding: '20px 24px', fontSize: '0.7rem', fontWeight: '900', color: activeColors.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Distrito</th>
              <th style={{ padding: '20px 24px', fontSize: '0.7rem', fontWeight: '900', color: activeColors.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Carga Realizada</th>
              <th style={{ padding: '20px 24px', fontSize: '0.7rem', fontWeight: '900', color: activeColors.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Autor de Malla</th>
              <th style={{ padding: '20px 24px', fontSize: '0.7rem', fontWeight: '900', color: activeColors.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'right' }}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ padding: '100px', textAlign: 'center' }}>
                  <div style={{ width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTopColor: activeColors.accent, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
                  <p style={{ marginTop: '20px', fontWeight: '700', color: activeColors.textMuted }}>Sincronizando mallas horarias...</p>
                </td>
              </tr>
            ) : filteredStores.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '100px', textAlign: 'center' }}>
                  <ShieldCheck size={48} className="text-emerald-500 mx-auto opacity-30 mb-4" />
                  <p style={{ fontSize: '1rem', fontWeight: '800', color: activeColors.textMain }}>¡Sin mallas pendientes!</p>
                  <p style={{ fontSize: '0.85rem', fontWeight: '600', color: activeColors.textMuted }}>Todas las tiendas han sido validadas para el periodo actual.</p>
                </td>
              </tr>
            ) : filteredStores.map(store => (
              <tr key={store.storeId} style={{ borderBottom: `1px solid ${activeColors.border}`, transition: 'all 0.2s' }} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td style={{ padding: '24px' }}>
                  <input 
                    type="checkbox" 
                    checked={selectedStores.includes(store.storeId)}
                    onChange={() => handleSelectStore(store.storeId)}
                    style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: activeColors.accent }}
                  />
                </td>
                <td style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '14px', background: activeColors.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', color: activeColors.accent }}>
                        <Building2 size={20} />
                      </div>
                      <div>
                        <span style={{ display: 'block', fontSize: '0.9rem', fontWeight: '900', color: activeColors.textMain }}>{store.name}</span>
                        <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: '800', color: activeColors.textMuted }}>{store.externalId}</span>
                      </div>
                    </div>
                </td>
                <td style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: activeColors.textMuted }}>
                     <Filter size={14} />
                     <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>{store.districtName || 'SIN DISTRITO'}</span>
                  </div>
                </td>
                <td style={{ padding: '24px' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: activeColors.textMuted }}>
                      <Calendar size={14} />
                      <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>{new Date(store.lastUploadAt).toLocaleDateString()}</span>
                   </div>
                </td>
                <td style={{ padding: '24px' }}>
                  <div style={{ fontWeight: '800', fontSize: '0.85rem', color: activeColors.textMain }}>{store.authorName || 'SISTEMA'}</div>
                </td>
                <td style={{ padding: '24px', textAlign: 'right' }}>
                   <span style={{ 
                      padding: '8px 16px', 
                      borderRadius: '12px', 
                      fontSize: '0.7rem', 
                      fontWeight: '950', 
                      background: '#fef3c7', 
                      color: '#d97706',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      border: '1.5px solid #fde68a'
                    }}>
                     Pendiente RH
                   </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de Rechazo con Comentarios */}
      {showCommentModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
           <div style={{ background: activeColors.card, width: '100%', maxWidth: '500px', borderRadius: '32px', boxShadow: '0 25px 60px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
              <div style={{ padding: '40px' }}>
                 <div style={{ width: '64px', height: '64px', background: '#fee2e2', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', marginBottom: '24px' }}>
                    <AlertCircle size={32} />
                 </div>
                 <h3 style={{ fontSize: '1.5rem', fontWeight: '950', color: activeColors.textMain, margin: '0 0 12px 0' }}>Rechazar Mallas</h3>
                 <p style={{ color: activeColors.textMuted, fontSize: '0.9rem', fontWeight: '600', marginBottom: '32px' }}>
                    Se notificará a los gerentes de las {selectedStores.length} sedes seleccionadas. Por favor, indica el motivo del rechazo para su corrección.
                 </p>

                 <div className="group">
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '900', color: activeColors.textMuted, marginBottom: '12px', textTransform: 'uppercase' }}>Motivo del Rechazo *</label>
                    <div style={{ position: 'relative' }}>
                       <MessageSquare size={18} className="absolute left-5 top-5 text-slate-400" />
                       <textarea 
                          value={rejectionComment}
                          onChange={(e) => setRejectionComment(e.target.value)}
                          placeholder="Ej: Cobertura insuficiente en fin de semana..."
                          style={{ 
                            width: '100%', 
                            padding: '18px 24px 18px 60px', 
                            borderRadius: '24px', 
                            border: `2px solid ${activeColors.border}`, 
                            background: activeColors.card, 
                            color: activeColors.textMain, 
                            fontWeight: '700',
                            minHeight: '120px',
                            resize: 'none',
                            outline: 'none'
                          }}
                          className="focus:border-red-400 focus:shadow-xl focus:shadow-red-500/5"
                       />
                    </div>
                 </div>

                 <div style={{ display: 'flex', gap: '16px', marginTop: '40px' }}>
                    <button 
                      onClick={() => { setShowCommentModal(false); setRejectionComment(''); }}
                      style={{ flex: 1, padding: '18px', borderRadius: '20px', border: `2px solid ${activeColors.border}`, background: 'transparent', color: activeColors.textMuted, fontWeight: '800', cursor: 'pointer' }}
                    >
                      Cancelar
                    </button>
                    <button 
                      disabled={!rejectionComment.trim() || processing}
                      onClick={handleReject}
                      style={{ 
                        flex: 2, 
                        padding: '18px', 
                        borderRadius: '20px', 
                        border: 'none', 
                        background: '#ef4444', 
                        color: 'white', 
                        fontWeight: '950', 
                        boxShadow: '0 10px 25px rgba(239, 68, 68, 0.3)',
                        cursor: 'pointer'
                      }}
                    >
                      {processing ? 'Procesando...' : 'Confirmar Rechazo'}
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Modal de Aprobación */}
      {showApprovalModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
           <div style={{ background: activeColors.card, width: '100%', maxWidth: '400px', borderRadius: '32px', padding: '40px', textAlign: 'center' }}>
              <div style={{ width: '64px', height: '64px', background: '#dcfce7', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a', margin: '0 auto 24px' }}>
                 <CheckCircle size={32} />
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '950', color: activeColors.textMain, marginBottom: '12px' }}>¿Aprobar mallas?</h3>
              <p style={{ color: activeColors.textMuted, marginBottom: '32px' }}>Se aprobarán {selectedStores.length} sedes seleccionadas.</p>
              <div style={{ display: 'flex', gap: '12px' }}>
                 <button onClick={() => setShowApprovalModal(false)} style={{ flex: 1, padding: '16px', borderRadius: '16px', border: `1px solid ${activeColors.border}`, background: 'transparent', fontWeight: '800' }}>Cancelar</button>
                 <button onClick={handleApprove} style={{ flex: 1, padding: '16px', borderRadius: '16px', background: activeColors.accent, color: 'white', fontWeight: '950' }}>Confirmar</button>
              </div>
           </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div style={{ 
          position: 'fixed', bottom: '40px', left: '50%', transform: 'translateX(-50%)', 
          zIndex: 10000, padding: '16px 32px', borderRadius: '20px', 
          background: toast.type === 'success' ? '#10b981' : '#ef4444', 
          color: 'white', fontWeight: '800', fontSize: '0.9rem',
          boxShadow: '0 15px 40px rgba(0,0,0,0.2)', animation: 'slideUp 0.3s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {toast.type === 'success' ? <ShieldCheck size={20} /> : <AlertCircle size={20} />}
            {toast.message}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes slideUp { from { transform: translate(-50%, 50px); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.5s ease-out; }
      `}</style>
    </div>
  );
};

export default ShiftApproval;
