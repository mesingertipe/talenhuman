import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, XCircle, Info, Search, Calendar, 
  Building2, Hash, ArrowRight, ShieldCheck, Clock,
  Filter, Download, ChevronRight, AlertCircle, MessageSquare,
  Eye, ArrowLeft, Cpu, X
} from 'lucide-react';
import { createPortal } from 'react-dom';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import ShiftScheduler from './ShiftScheduler';

const ShiftApproval = ({ user }) => {
  const { isDarkMode } = useTheme();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [rejectionComment, setRejectionComment] = useState('');
  const [approvalComment, setApprovalComment] = useState('');
  const [processing, setProcessing] = useState(false);
  const [syncPhase, setSyncPhase] = useState(0); 
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  
  const [activeTab, setActiveTab] = useState('PENDING');
  const [inspectedStore, setInspectedStore] = useState(null);

  const [filterDistrict, setFilterDistrict] = useState('ALL');
  const [filterStore, setFilterStore] = useState('ALL');
  const [filterWeek, setFilterWeek] = useState('ALL');
  const [selectedKeys, setSelectedKeys] = useState([]);

  const activeColors = {
    card: isDarkMode ? '#1e293b' : '#ffffff',
    border: isDarkMode ? '#334155' : '#e2e8f0',
    textMain: isDarkMode ? '#f1f5f9' : '#1e293b',
    textMuted: isDarkMode ? '#94a3b8' : '#64748b',
    accent: '#4f46e5',
    accentSoft: isDarkMode ? 'rgba(79, 70, 229, 0.15)' : 'rgba(79, 70, 229, 0.05)',
  };

  useEffect(() => { fetchStores(); }, [activeTab]);

  const fetchStores = async () => {
    try {
      setLoading(true);
      let status = 5;
      if (activeTab === 'APPROVED') status = 6;
      if (activeTab === 'REJECTED') status = 7;
      const res = await api.get(`/ShiftApproval/stores?status=${status}`);
      setStores(res.data);
    } catch (err) { console.error(err); showToast('Error al sincronizar consola', 'error'); } 
    finally { setLoading(false); }
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleSelectStore = (store) => {
    const key = `${store.storeId}-${store.weekStart}`;
    setSelectedKeys(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const handleSelectAll = (fStores) => {
    if (selectedKeys.length === fStores.length && fStores.length > 0) { setSelectedKeys([]); } 
    else { setSelectedKeys(fStores.map(s => `${s.storeId}-${s.weekStart}`)); }
  };

  const delay = (ms) => new Promise(res => setTimeout(res, ms));

  const handleApprove = async () => {
    if (selectedKeys.length === 0) return;
    try {
      setProcessing(true); setSyncPhase(1); await delay(600);
      for (const key of selectedKeys) {
        setSyncPhase(2);
        const [storeId, weekStart] = key.split('-');
        const storeData = stores.find(s => s.storeId === storeId && s.weekStart === weekStart);
        if (storeData) {
          const exclusiveEnd = getExclusiveEndDate(storeData.weekStart);
          await api.post('/ShiftApproval/approve', {
            storeId: storeId, startDate: storeData.weekStart, endDate: exclusiveEnd,
            comment: approvalComment || "Aprobación masiva desde consola"
          });
        }
      }
      setSyncPhase(3); await delay(800); setSyncPhase(4); await delay(1200);
      showToast(`Se han aprobado ${selectedKeys.length} mallas exitosamente`);
      setSelectedKeys([]); setApprovalComment(''); setShowApprovalModal(false); fetchStores();
    } catch (err) { showToast('Error en la aprobación masiva', 'error'); } 
    finally { setProcessing(false); setSyncPhase(0); }
  };

  const handleReject = async () => {
    if (selectedKeys.length === 0 || !rejectionComment.trim()) return;
    try {
      setProcessing(true); setSyncPhase(1); await delay(600);
      for (const key of selectedKeys) {
        setSyncPhase(2);
        const [storeId, weekStart] = key.split('-');
        const storeData = stores.find(s => s.storeId === storeId && s.weekStart === weekStart);
        if (storeData) {
          const exclusiveEnd = getExclusiveEndDate(storeData.weekStart);
          await api.post('/ShiftApproval/reject', { 
            storeId: storeId, startDate: storeData.weekStart, endDate: exclusiveEnd,
            comment: rejectionComment 
          });
        }
      }
      setSyncPhase(3); await delay(800); setSyncPhase(4); await delay(1200);
      showToast(`${selectedKeys.length} mallas han sido rechazadas`);
      setSelectedKeys([]); setRejectionComment(''); setShowCommentModal(false); fetchStores();
    } catch (err) { showToast('Error al procesar el rechazo', 'error'); } 
    finally { setProcessing(false); setSyncPhase(0); }
  };

  const formatDateRange = (min, max) => {
    try {
      const d1 = new Date(min); const d2 = new Date(max);
      const options = { day: '2-digit', month: 'short' };
      return `${d1.toLocaleDateString('es-CO', options)} - ${d2.toLocaleDateString('es-CO', options)}`;
    } catch { return "Periodo no definido"; }
  };

  const getExclusiveEndDate = (weekStart) => {
    try {
      const start = new Date(weekStart); const end = new Date(start);
      end.setDate(start.getDate() + 7);
      const offset = end.getTimezoneOffset();
      const localEnd = new Date(end.getTime() - (offset * 60 * 1000));
      return localEnd.toISOString().split('.')[0];
    } catch { return null; }
  };

  const filteredStores = stores.filter(s => {
    if (!s) return false;
    const search = (searchTerm || "").toLowerCase();
    const matchesSearch = (s.name || "").toLowerCase().includes(search) || 
                         (s.externalId || "").toLowerCase().includes(search) || 
                         (s.districtName || "").toLowerCase().includes(search);
    const matchesDistrict = filterDistrict === 'ALL' || s.districtName === filterDistrict;
    const matchesStore = filterStore === 'ALL' || s.name === filterStore;
    const matchesWeek = filterWeek === 'ALL' || formatDateRange(s.minDate, s.maxDate) === filterWeek;
    return matchesSearch && matchesDistrict && matchesStore && matchesWeek;
  });

  const districtsList = [...new Set(stores.map(s => s.districtName))].sort();
  const storesList = [...new Set(stores.map(s => s.name))].sort();
  const weeksList = [...new Set(stores.map(s => formatDateRange(s.minDate, s.maxDate)))].sort();

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
              <ShiftScheduler user={user} readOnly={activeTab !== 'PENDING'} forceApprover={true} initialStoreId={inspectedStore.storeId} initialDate={inspectedStore.weekStart} />
            </div>
            <div style={{ position: 'absolute', right: showHistoryDrawer ? '0' : '-450px', top: '0', bottom: '0', width: '380px', background: isDarkMode ? '#1e293b' : '#f8fafc', borderRadius: '32px', borderLeft: `2px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`, padding: '28px', transition: 'right 0.4s ease', zIndex: 50, overflowY: 'auto' }}>
               <h3 style={{ fontSize: '1.1rem', fontWeight: '950', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}><ShieldCheck size={20} /> Auditoría</h3>
               {fetchingHistory ? <p>Cargando...</p> : history.map((log, idx) => {
                 const getActionLabel = (action) => {
                   if (action === 'Published') return 'PROGRAMADO';
                   if (action === 'Approved') return 'APROBADO';
                   if (action === 'Rejected') return 'RECHAZADO';
                   return action.toUpperCase();
                 };
                 return (
                   <div key={idx} style={{ marginBottom: '20px', padding: '15px', borderRadius: '20px', background: activeColors.card, border: `1px solid ${activeColors.border}` }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: '900', color: log.action === 'Approved' ? '#10b981' : (log.action === 'Rejected' ? '#ef4444' : activeColors.accent), marginBottom: '5px' }}>
                        {getActionLabel(log.action)}
                      </div>
                      <p style={{ fontSize: '0.85rem', fontWeight: '700', margin: '0 0 10px 0' }}>"{log.comment}"</p>
                      <div style={{ fontSize: '0.7rem', color: activeColors.textMuted }}>{log.userName} • {new Date(log.actionAt).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                   </div>
                 );
               })}
            </div>
         </div>
      </div>
    );
  };

  return (
    <div className="page-container" style={{ padding: '2rem 1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      {inspectedStore ? renderInspectionMode() : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2.5rem', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '2.5rem', fontWeight: '950', color: activeColors.textMain, margin: 0, letterSpacing: '-1px' }}>Consola de Aprobación</h1>
              <p style={{ color: activeColors.textMuted, fontWeight: '600', fontSize: '1rem', marginTop: '5px' }}>Validación jerárquica de mallas semanales</p>
            </div>
            {activeTab === 'PENDING' && (
              <div style={{ display: 'flex', gap: '12px' }}>
                <button disabled={selectedKeys.length === 0 || processing} onClick={() => setShowCommentModal(true)} style={{ padding: '14px 28px', borderRadius: '18px', border: 'none', background: '#fee2e2', color: '#ef4444', fontWeight: '800', cursor: 'pointer', opacity: selectedKeys.length === 0 ? 0.5 : 1, transition: 'all 0.2s' }}>
                   Rechazar ({selectedKeys.length})
                </button>
                <button disabled={selectedKeys.length === 0 || processing} onClick={() => setShowApprovalModal(true)} style={{ padding: '14px 28px', borderRadius: '18px', border: 'none', background: activeColors.accent, color: 'white', fontWeight: '900', cursor: 'pointer', opacity: selectedKeys.length === 0 ? 0.5 : 1, boxShadow: '0 10px 20px rgba(79, 70, 229, 0.3)', transition: 'all 0.2s' }}>
                   Aprobar Seleccionados
                </button>
              </div>
            )}
          </div>

          {/* SMART FILTERS V19.5 */}
          <div style={{ display: 'flex', gap: '20px', marginBottom: '2.5rem', background: activeColors.card, padding: '24px', borderRadius: '28px', border: `1.5px solid ${activeColors.border}`, boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
            <div style={{ flex: 1.5, position: 'relative' }}>
               <Search style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: activeColors.textMuted }} size={20} />
               <input 
                 style={{ width: '100%', padding: '15px 15px 15px 50px', borderRadius: '18px', border: `1.5px solid ${activeColors.border}`, background: activeColors.bg, color: activeColors.textMain, fontWeight: '700' }} 
                 placeholder="Buscar por sede, supervisor o ID..." 
                 value={searchTerm} 
                 onChange={e => setSearchTerm(e.target.value)} 
               />
            </div>
            
            <div style={{ flex: 1, display: 'flex', gap: '10px' }}>
              <select value={filterDistrict} onChange={e => setFilterDistrict(e.target.value)} style={{ flex: 1, padding: '10px 15px', borderRadius: '15px', border: `1.5px solid ${activeColors.border}`, background: activeColors.bg, color: activeColors.textMain, fontWeight: '700' }}>
                <option value="ALL">Todos los Distritos</option>
                {districtsList.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <select value={filterWeek} onChange={e => setFilterWeek(e.target.value)} style={{ flex: 1, padding: '10px 15px', borderRadius: '15px', border: `1.5px solid ${activeColors.border}`, background: activeColors.bg, color: activeColors.textMain, fontWeight: '700' }}>
                <option value="ALL">Todas las Semanas</option>
                {weeksList.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '2.5rem' }}>
            {['PENDING', 'APPROVED', 'REJECTED'].map(tID => (
              <button key={tID} onClick={() => setActiveTab(tID)} style={{ padding: '10px 20px', borderRadius: '12px', border: 'none', fontWeight: '900', background: activeTab === tID ? activeColors.accent : activeColors.card, color: activeTab === tID ? 'white' : activeColors.textMuted, cursor: 'pointer' }}>{tID}</button>
            ))}
          </div>
          <div style={{ background: activeColors.card, borderRadius: '25px', border: `1.5px solid ${activeColors.border}`, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: activeColors.textMuted }}>
                  {activeTab === 'PENDING' && <th style={{ padding: '15px 20px' }}><input type="checkbox" style={{ width: '18px', height: '18px', borderRadius: '6px' }} onChange={() => handleSelectAll(filteredStores)} checked={selectedKeys.length === filteredStores.length && filteredStores.length > 0} /></th>}
                  <th style={{ padding: '15px 20px', fontSize: '0.8rem', fontWeight: '900', textTransform: 'uppercase' }}>Sede / Identificador</th>
                  <th style={{ padding: '15px 20px', fontSize: '0.8rem', fontWeight: '900', textTransform: 'uppercase' }}>Periodo de Operación</th>
                  <th style={{ padding: '15px 20px', fontSize: '0.8rem', fontWeight: '900', textTransform: 'uppercase', textAlign: 'right' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {loading ? <tr><td colSpan="4" style={{ padding: '50px', textAlign: 'center' }}>
                   <div className="animate-pulse" style={{ color: activeColors.accent, fontWeight: '800' }}>Sincronizando registros...</div>
                </td></tr> : filteredStores.length === 0 ? <tr><td colSpan="4" style={{ padding: '50px', textAlign: 'center', color: activeColors.textMuted }}>No se encontraron registros para los filtros aplicados.</td></tr> : filteredStores.map(store => (
                  <tr key={`${store.storeId}-${store.weekStart}`} style={{ background: activeColors.bg, transition: 'transform 0.2s' }} className="hover:scale-[1.005]">
                    {activeTab === 'PENDING' && <td style={{ padding: '15px 20px' }}><input type="checkbox" style={{ width: '18px', height: '18px' }} checked={selectedKeys.includes(`${store.storeId}-${store.weekStart}`)} onChange={() => handleSelectStore(store)} /></td>}
                    <td style={{ padding: '15px 20px' }}>
                      <div style={{ fontWeight: '900', color: activeColors.textMain, fontSize: '1.05rem' }}>{store.name}</div>
                      <div style={{ fontSize: '0.7rem', color: activeColors.textMuted, fontWeight: '700' }}>ID: {store.externalId} • {store.districtName}</div>
                    </td>
                    <td style={{ padding: '15px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', color: activeColors.textMain }}>
                        <Calendar size={14} /> {formatDateRange(store.minDate, store.maxDate)}
                      </div>
                    </td>
                    <td style={{ padding: '15px 20px', textAlign: 'right' }}>
                      <button onClick={() => setInspectedStore(store)} style={{ padding: '10px 20px', borderRadius: '14px', background: activeColors.accentSoft, color: activeColors.accent, border: 'none', fontWeight: '950', fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s' }} className="hover:brightness-95">
                        INSPECCIONAR
                      </button>
                    </td>
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
