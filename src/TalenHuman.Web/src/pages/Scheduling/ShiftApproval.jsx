import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, CheckCircle, MessageSquare, ShieldCheck, 
  Search, Filter, Calendar, Cpu, Check, X, AlertTriangle, 
  Clock, MapPin, ChevronRight, User
} from 'lucide-react';
import { createPortal } from 'react-dom';
import api from '../../services/api';
import ShiftScheduler from './ShiftScheduler';

const ShiftApproval = ({ user }) => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('PENDING');
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [inspectedStore, setInspectedStore] = useState(null);
  
  const [rejectionComment, setRejectionComment] = useState('');
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [syncPhase, setSyncPhase] = useState(0);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('ALL');
  const [isDarkMode] = useState(document.documentElement.classList.contains('dark-mode'));

  const activeColors = {
    bg: isDarkMode ? '#0f172a' : '#f8fafc',
    card: isDarkMode ? '#1e293b' : '#ffffff',
    textMain: isDarkMode ? '#f1f5f9' : '#0f172a',
    textMuted: isDarkMode ? '#94a3b8' : '#64748b',
    border: isDarkMode ? '#334155' : '#e2e8f0',
    accent: '#4f46e5',
    accentSoft: isDarkMode ? 'rgba(79, 70, 229, 0.15)' : 'rgba(79, 70, 229, 0.08)'
  };

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/ShiftApproval/pending-stores');
      setStores(res.data || []);
    } catch (err) {
      showToast("Error al cargar tiendas", "error");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  const handleSelectAll = (filtered) => {
    if (selectedKeys.length === filtered.length) setSelectedKeys([]);
    else setSelectedKeys(filtered.map(s => `${s.storeId}-${s.weekStart}`));
  };

  const handleSelectStore = (store) => {
    const key = `${store.storeId}-${store.weekStart}`;
    if (selectedKeys.includes(key)) setSelectedKeys(selectedKeys.filter(k => k !== key));
    else setSelectedKeys([...selectedKeys, key]);
  };

  const handleApprove = async () => {
    try {
      setProcessing(true);
      setSyncPhase(1); // Fase 1: Analizando
      
      const payload = selectedKeys.map(key => {
        const [storeId, weekStart] = key.split('-');
        const store = stores.find(s => s.storeId === parseInt(storeId) && s.weekStart === weekStart);
        return { storeId: parseInt(storeId), weekStart, weekEnd: store.maxDate };
      });

      // Simular delay visual para Premium UX
      setTimeout(() => setSyncPhase(2), 800); // Fase 2: Procesando Maestro

      await api.post('/ShiftApproval/bulk-approve', { 
        approvals: payload,
        comment: "Aprobación masiva desde consola administrativa"
      });

      setSyncPhase(3); // Fase 3: Notificando
      setTimeout(() => setSyncPhase(4), 600); // Fase 4: Éxito

      setTimeout(() => {
        showToast(`Se aprobaron ${selectedKeys.length} mallas exitosamente`);
        setSelectedKeys([]);
        setShowApprovalModal(false);
        fetchData();
        setProcessing(false);
        setSyncPhase(0);
      }, 1200);

    } catch (err) {
      showToast("Error en la aprobación masiva", "error");
      setProcessing(false);
      setSyncPhase(0);
    }
  };

  const handleReject = async () => {
    if (!rejectionComment || rejectionComment.trim().length < 5) {
        showToast("Debes indicar un motivo válido", "error");
        return;
    }
    try {
      setProcessing(true);
      setSyncPhase(1);

      const payload = selectedKeys.map(key => {
        const [storeId, weekStart] = key.split('-');
        const store = stores.find(s => s.storeId === parseInt(storeId) && s.weekStart === weekStart);
        return { storeId: parseInt(storeId), weekStart, weekEnd: store.maxDate };
      });

      setTimeout(() => setSyncPhase(2), 800);

      await api.post('/ShiftApproval/bulk-reject', { 
        rejections: payload,
        comment: rejectionComment
      });

      setSyncPhase(3);
      setTimeout(() => {
        showToast(`${selectedKeys.length} mallas han sido rechazadas`);
        setSelectedKeys([]);
        setRejectionComment('');
        setShowCommentModal(false);
        fetchData();
        setProcessing(false);
        setSyncPhase(0);
      }, 1000);

    } catch (err) {
      showToast("Error al procesar el rechazo", "error");
      setProcessing(false);
      setSyncPhase(0);
    }
  };

  const filteredStores = useMemo(() => {
    return stores.filter(s => {
      const matchesTab = s.status === activeTab;
      const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDistrict = filterDistrict === 'ALL' || s.districtName === filterDistrict;
      return matchesTab && matchesSearch && matchesDistrict;
    });
  }, [stores, activeTab, searchTerm, filterDistrict]);

  const formatDateRange = (start, end) => {
    const s = new Date(start);
    const e = new Date(end);
    return `${s.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })} - ${e.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}`;
  };

  const districtsList = [...new Set(stores.map(s => s.districtName))].sort();
  const storesList = [...new Set(stores.map(s => s.name))].sort();

  const [history, setHistory] = useState([]);
  const [fetchingHistory, setFetchingHistory] = useState(false);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  
  useEffect(() => { if (inspectedStore) fetchHistory(); }, [inspectedStore]);
  
  const fetchHistory = async () => {
    try {
      setFetchingHistory(true);
      const res = await api.get(`/ShiftApproval/status?storeId=${inspectedStore.storeId}&startDate=${inspectedStore.weekStart}`);
      setHistory(res.data.history || []);
    } catch (err) { console.error("Error fetching audit trail", err); } 
    finally { setFetchingHistory(false); }
  };

  const renderInspectionMode = () => {
    if (!inspectedStore) return null;
    return (
      <div className="page-container animate-fade-in" style={{ padding: '0 1.5rem', maxWidth: '1600px', margin: '0 auto' }}>
         <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2rem 0', borderBottom: `2px solid ${activeColors.border}`, marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <button onClick={() => setInspectedStore(null)} style={{ width: '48px', height: '48px', borderRadius: '16px', background: activeColors.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', color: activeColors.accent, border: 'none', cursor: 'pointer' }}>
                <ArrowLeft size={24} strokeWidth={2.5} />
              </button>
              <div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: '950', color: activeColors.textMain, margin: 0 }}>Auditoría: {inspectedStore.name}</h1>
                <p style={{ margin: 0, color: activeColors.textMuted, fontSize: '0.85rem' }}>MODO INSPECCIÓN ELITE • PERIODO: {formatDateRange(inspectedStore.minDate, inspectedStore.maxDate)}</p>
              </div>
            </div>
            <button onClick={() => setShowHistoryDrawer(!showHistoryDrawer)} style={{ padding: '12px 24px', background: showHistoryDrawer ? activeColors.accent : activeColors.accentSoft, borderRadius: '16px', border: 'none', display: 'flex', alignItems: 'center', gap: '12px', color: showHistoryDrawer ? 'white' : activeColors.accent, fontWeight: '900', cursor: 'pointer' }}>
               <MessageSquare size={18} /> {showHistoryDrawer ? 'Cerrar Historial' : 'Ver Comentarios'}
            </button>
         </div>
         <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '32px' }}>
            <div style={{ background: activeColors.card, borderRadius: '32px', border: `1.5px solid ${activeColors.border}`, overflow: 'hidden', padding: '1rem', marginRight: showHistoryDrawer ? '400px' : '0', transition: 'margin 0.4s ease' }}>
              <ShiftScheduler user={user} readOnly={false} forceApprover={true} initialStoreId={inspectedStore.storeId} initialDate={inspectedStore.weekStart} />
            </div>
            <div style={{ position: 'absolute', right: showHistoryDrawer ? '0' : '-450px', top: '0', bottom: '0', width: '380px', background: isDarkMode ? '#1e293b' : '#f8fafc', borderRadius: '32px', borderLeft: `2px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`, padding: '28px', transition: 'right 0.4s ease', zIndex: 50, overflowY: 'auto' }}>
               <h3 style={{ fontSize: '1.1rem', fontWeight: '950', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}><ShieldCheck size={20} /> Auditoría</h3>
               {fetchingHistory ? <p>Cargando...</p> : history.map((log, idx) => (
                 <div key={idx} style={{ marginBottom: '20px', padding: '15px', borderRadius: '20px', background: activeColors.card, border: `1px solid ${activeColors.border}` }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: '900', color: log.action === 'Approved' ? '#10b981' : '#ef4444', marginBottom: '5px' }}>{log.action.toUpperCase()}</div>
                    <p style={{ fontSize: '0.85rem', fontWeight: '700', margin: '0 0 10px 0' }}>"{log.comment}"</p>
                    <div style={{ fontSize: '0.7rem', color: activeColors.textMuted }}>{log.userName} • {new Date(log.actionDate).toLocaleString()}</div>
                 </div>
               ))}
            </div>
         </div>
      </div>
    );
  };

  return (
    <div className="page-container" style={{ padding: '2rem 1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      {inspectedStore ? renderInspectionMode() : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3rem', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '2.3rem', fontWeight: '950', color: activeColors.textMain, margin: 0 }}>Consola de Aprobación</h1>
              <p style={{ color: activeColors.textMuted, fontWeight: '600' }}>Validación jerárquica de mallas semanales</p>
            </div>
            {activeTab === 'PENDING' && (
              <div style={{ display: 'flex', gap: '12px' }}>
                <button disabled={selectedKeys.length === 0 || processing} onClick={() => setShowCommentModal(true)} style={{ padding: '12px 24px', borderRadius: '15px', border: 'none', background: '#fee2e2', color: '#ef4444', fontWeight: '800', cursor: 'pointer', opacity: selectedKeys.length === 0 ? 0.5 : 1 }}>Rechazar ({selectedKeys.length})</button>
                <button disabled={selectedKeys.length === 0 || processing} onClick={() => setShowApprovalModal(true)} style={{ padding: '12px 24px', borderRadius: '15px', border: 'none', background: activeColors.accent, color: 'white', fontWeight: '900', cursor: 'pointer', opacity: selectedKeys.length === 0 ? 0.5 : 1 }}>Aprobar Seleccionados</button>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '2.5rem' }}>
            {['PENDING', 'APPROVED', 'REJECTED'].map(tID => (
              <button key={tID} onClick={() => setActiveTab(tID)} style={{ padding: '10px 20px', borderRadius: '12px', border: 'none', fontWeight: '900', background: activeTab === tID ? activeColors.accent : activeColors.card, color: activeTab === tID ? 'white' : activeColors.textMuted, cursor: 'pointer' }}>{tID}</button>
            ))}
          </div>
          <div style={{ background: activeColors.card, borderRadius: '25px', border: `1.5px solid ${activeColors.border}`, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', background: activeColors.accentSoft }}>
                  {activeTab === 'PENDING' && <th style={{ padding: '15px' }}><input type="checkbox" onChange={() => handleSelectAll(filteredStores)} /></th>}
                  <th style={{ padding: '15px' }}>Sede</th>
                  <th style={{ padding: '15px' }}>Periodo</th>
                  <th style={{ padding: '15px', textAlign: 'right' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {loading ? <tr><td colSpan="4" style={{ padding: '50px', textAlign: 'center' }}>Cargando datos...</td></tr> : filteredStores.map(store => (
                  <tr key={`${store.storeId}-${store.weekStart}`} style={{ borderBottom: `1px solid ${activeColors.border}` }}>
                    {activeTab === 'PENDING' && <td style={{ padding: '15px' }}><input type="checkbox" checked={selectedKeys.includes(`${store.storeId}-${store.weekStart}`)} onChange={() => handleSelectStore(store)} /></td>}
                    <td style={{ padding: '15px' }}><span style={{ fontWeight: '800' }}>{store.name}</span></td>
                    <td style={{ padding: '15px' }}>{formatDateRange(store.minDate, store.maxDate)}</td>
                    <td style={{ padding: '15px', textAlign: 'right' }}><button onClick={() => setInspectedStore(store)} style={{ padding: '6px 12px', borderRadius: '8px', background: activeColors.accentSoft, color: activeColors.accent, border: 'none', fontWeight: '900', cursor: 'pointer' }}>INSPECCIONAR</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* MODALS */}
      {showCommentModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: activeColors.card, padding: '30px', borderRadius: '25px', width: '400px' }}>
            <h3 style={{ fontWeight: '950', marginBottom: '15px' }}>Rechazar Malla</h3>
            <textarea value={rejectionComment} onChange={(e) => setRejectionComment(e.target.value)} style={{ width: '100%', height: '100px', borderRadius: '10px', padding: '10px' }} placeholder="Escribe el motivo..." />
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button onClick={() => setShowCommentModal(false)} style={{ flex: 1, padding: '10px' }}>Cancelar</button>
              <button onClick={handleReject} style={{ flex: 1, padding: '10px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '900' }}>Confirmar Rechazo</button>
            </div>
          </div>
        </div>
      )}

      {showApprovalModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: activeColors.card, padding: '30px', borderRadius: '25px', width: '400px', textAlign: 'center' }}>
            <h3 style={{ fontWeight: '950', marginBottom: '10px' }}>Aprobar Selección</h3>
            <p>Se aprobarán {selectedKeys.length} mallas semanales.</p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button onClick={() => setShowApprovalModal(false)} style={{ flex: 1, padding: '10px' }}>No, volver</button>
              <button onClick={handleApprove} style={{ flex: 1, padding: '10px', background: activeColors.accent, color: 'white', border: 'none', borderRadius: '10px', fontWeight: '900' }}>Sí, Aprobar todo</button>
            </div>
          </div>
        </div>
      )}

      {/* ELITE PROGRESS MONITOR portal */}
      {processing && syncPhase > 0 && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isDarkMode ? 'rgba(15, 23, 42, 0.9)' : 'rgba(30,30,60,0.8)', backdropFilter: 'blur(10px)' }}>
           <div style={{ background: isDarkMode ? '#1e293b' : 'white', padding: '40px', borderRadius: '40px', textAlign: 'center', width: '380px', boxShadow: '0 30px 60px rgba(0,0,0,0.5)' }}>
              <div style={{ position: 'relative', width: '70px', height: '70px', margin: '0 auto 20px' }}>
                <svg style={{ transform: 'rotate(-90deg)', width: '70px', height: '70px' }}>
                  <circle cx="35" cy="35" r="30" stroke="#f1f5f9" strokeWidth="5" fill="transparent" />
                  <circle cx="35" cy="35" r="30" stroke="#4f46e5" strokeWidth="5" fill="transparent" strokeDasharray="188.5" strokeDashoffset={188.5 - (188.5 * (syncPhase * 25)) / 100} style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5' }}>
                  {syncPhase >= 4 ? <CheckCircle size={28} /> : <Cpu size={28} className="animate-pulse" />}
                </div>
              </div>
              <h3 style={{ fontWeight: '950', fontSize: '1.3rem', margin: '0 0 10px 0' }}>
                {syncPhase === 1 ? "Analizando..." : syncPhase === 2 ? "Procesando Maestro..." : syncPhase === 3 ? "Notificando..." : "¡Finalizado!"}
              </h3>
              <div style={{ height: '5px', background: '#f1f5f9', borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${syncPhase * 25}%`, background: '#4f46e5', transition: 'width 0.6s ease' }} />
              </div>
           </div>
        </div>,
        document.body
      )}

      {/* Global Toast */}
      {toast.show && (
        <div style={{ position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)', zIndex: 10001, background: toast.type === 'error' ? '#ef4444' : '#10b981', color: 'white', padding: '12px 25px', borderRadius: '15px', fontWeight: '900', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default ShiftApproval;
