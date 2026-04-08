import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, XCircle, Info, Search, Calendar, 
  Building2, Hash, ArrowRight, ShieldCheck, Clock,
  Filter, Download, ChevronRight, AlertCircle, MessageSquare,
  Eye, ArrowLeft
} from 'lucide-react';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import ShiftScheduler from './ShiftScheduler';

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
  
  // V18.8 New States
  const [activeTab, setActiveTab] = useState('PENDING'); // PENDING, APPROVED, REJECTED
  const [inspectedStore, setInspectedStore] = useState(null);

  // V18.9: Advanced Filters
  const [filterDistrict, setFilterDistrict] = useState('ALL');
  const [filterStore, setFilterStore] = useState('ALL');
  const [filterWeek, setFilterWeek] = useState('ALL');
  const [selectedKeys, setSelectedKeys] = useState([]); // Composite keys: storeId-weekStart

  const activeColors = {
    card: isDarkMode ? '#1e293b' : '#ffffff',
    border: isDarkMode ? '#334155' : '#e2e8f0',
    textMain: isDarkMode ? '#f1f5f9' : '#1e293b',
    textMuted: isDarkMode ? '#94a3b8' : '#64748b',
    accent: '#4f46e5',
    accentSoft: isDarkMode ? 'rgba(79, 70, 229, 0.15)' : 'rgba(79, 70, 229, 0.05)',
  };

  useEffect(() => {
    fetchStores();
  }, [activeTab]);

  const fetchStores = async () => {
    try {
      setLoading(true);
      // Pending: 5, Approved: 6, Rejected: 7
      let status = 5;
      if (activeTab === 'APPROVED') status = 6;
      if (activeTab === 'REJECTED') status = 7;

      const res = await api.get(`/ShiftApproval/stores?status=${status}`);
      setStores(res.data);
    } catch (err) {
      console.error(err);
      showToast('Error al sincronizar consola', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleSelectStore = (store) => {
    const key = `${store.storeId}-${store.weekStart}`;
    setSelectedKeys(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleSelectAll = () => {
    if (selectedKeys.length === filteredStores.length) {
      setSelectedKeys([]);
    } else {
      setSelectedKeys(filteredStores.map(s => `${s.storeId}-${s.weekStart}`));
    }
  };

  const handleApprove = async () => {
    if (selectedKeys.length === 0) return;
    try {
      setProcessing(true);
      for (const key of selectedKeys) {
        const [storeId, weekStart] = key.split('-');
        const storeData = stores.find(s => s.storeId === storeId && s.weekStart === weekStart);
        if (storeData) {
          const exclusiveEnd = getExclusiveEndDate(storeData.weekStart);
          await api.post('/ShiftApproval/approve', {
            storeId: storeId,
            startDate: storeData.weekStart, // Usar WeekStart exacto
            endDate: exclusiveEnd,          // Usar Lunes siguiente 00:00
            comment: approvalComment || "Aprobación masiva desde consola"
          });
        }
      }
      showToast(`Se han aprobado ${selectedKeys.length} mallas exitosamente`);
      setSelectedKeys([]);
      setApprovalComment('');
      setShowApprovalModal(false);
      fetchStores();
    } catch (err) {
      showToast('Error en la aprobación masiva', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (selectedKeys.length === 0 || !rejectionComment.trim()) return;
    try {
      setProcessing(true);
      for (const key of selectedKeys) {
        const [storeId, weekStart] = key.split('-');
        const storeData = stores.find(s => s.storeId === storeId && s.weekStart === weekStart);
        if (storeData) {
          const exclusiveEnd = getExclusiveEndDate(storeData.weekStart);
          await api.post('/ShiftApproval/reject', { 
            storeId: storeId, 
            startDate: storeData.weekStart, // Usar WeekStart exacto
            endDate: exclusiveEnd,          // Usar Lunes siguiente 00:00
            comment: rejectionComment 
          });
        }
      }
      showToast(`${selectedKeys.length} mallas han sido rechazadas`);
      setSelectedKeys([]);
      setRejectionComment('');
      setShowCommentModal(false);
      fetchStores();
    } catch (err) {
      showToast('Error al procesar el rechazo', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const formatDateRange = (min, max) => {
    try {
      const d1 = new Date(min);
      const d2 = new Date(max);
      const options = { day: '2-digit', month: 'short' };
      return `${d1.toLocaleDateString('es-CO', options)} - ${d2.toLocaleDateString('es-CO', options)}`;
    } catch {
      return "Periodo no definido";
    }
  };

  const getExclusiveEndDate = (weekStart) => {
    try {
      const start = new Date(weekStart);
      const end = new Date(start);
      end.setDate(start.getDate() + 7);
      // Formato ISO local para el backend
      const offset = end.getTimezoneOffset();
      const localEnd = new Date(end.getTime() - (offset * 60 * 1000));
      return localEnd.toISOString().split('.')[0];
    } catch {
      return null;
    }
  };

  const filteredStores = stores.filter(s => {
    if (!s) return false;
    
    // 🔍 Filtro de Buscador
    const search = (searchTerm || "").toLowerCase();
    const matchesSearch = (s.name || "").toLowerCase().includes(search) || 
                         (s.externalId || "").toLowerCase().includes(search) || 
                         (s.districtName || "").toLowerCase().includes(search);
    
    // 🎭 Filtros Advanced V18.9
    const matchesDistrict = filterDistrict === 'ALL' || s.districtName === filterDistrict;
    const matchesStore = filterStore === 'ALL' || s.name === filterStore;
    const matchesWeek = filterWeek === 'ALL' || formatDateRange(s.minDate, s.maxDate) === filterWeek;

    return matchesSearch && matchesDistrict && matchesStore && matchesWeek;
  });

  // Extract Lists for Filters
  const districtsList = [...new Set(stores.map(s => s.districtName))].sort();
  const storesList = [...new Set(stores.map(s => s.name))].sort();
  const weeksList = [...new Set(stores.map(s => formatDateRange(s.minDate, s.maxDate)))].sort();

  // V18.8 INSPECTION MODE RENDER
  if (inspectedStore) {
    return (
      <div className="page-container" style={{ padding: '0 1rem' }}>
         <div style={{ 
           display: 'flex', 
           alignItems: 'center', 
           gap: '20px', 
           padding: '2rem 0', 
           borderBottom: `1px solid ${activeColors.border}`,
           marginBottom: '2rem'
         }}>
            <button 
              onClick={() => setInspectedStore(null)}
              style={{ 
                width: '48px', height: '48px', borderRadius: '16px', background: activeColors.accentSoft,
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: activeColors.accent,
                border: 'none', cursor: 'pointer', transition: 'all 0.2s'
              }}
              className="hover:scale-110 active:scale-95"
            >
              <ArrowLeft size={24} strokeWidth={2.5} />
            </button>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: '950', color: activeColors.textMain, margin: 0 }}>
                Verificación: {inspectedStore.name}
              </h1>
              <p style={{ margin: 0, color: activeColors.textMuted, fontSize: '0.85rem', fontWeight: '700' }}>
                AUDITORÍA DE SOLO LECTURA • PERIOD: {formatDateRange(inspectedStore.minDate, inspectedStore.maxDate)}
              </p>
            </div>
         </div>
         <ShiftScheduler 
            user={user} 
            readOnly={false} 
            forceApprover={true}
            initialStoreId={inspectedStore.storeId} 
            initialDate={inspectedStore.weekStart} 
         />
      </div>
    );
  }

  return (
    <div className="page-container animate-fade-in" style={{ padding: '2rem 1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Header Elite */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3.5rem', gap: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '950', color: activeColors.textMain, margin: 0, letterSpacing: '-0.04em' }}>
            Consola de Aprobación
          </h1>
          <p style={{ color: activeColors.textMuted, fontSize: '0.95rem', fontWeight: '600', marginTop: '8px' }}>
            Validación jerárquica de turnos para el periodo vigente
          </p>
        </div>

        {activeTab === 'PENDING' && (
          <div style={{ display: 'flex', gap: '16px' }}>
            <button 
              disabled={selectedKeys.length === 0 || processing}
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
                cursor: selectedKeys.length === 0 ? 'not-allowed' : 'pointer',
                opacity: selectedKeys.length === 0 ? 0.5 : 1
              }}
            >
              <XCircle size={18} /> Rechazar ({selectedKeys.length})
            </button>
            <button 
              disabled={selectedKeys.length === 0 || processing}
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
                cursor: selectedKeys.length === 0 ? 'not-allowed' : 'pointer',
                opacity: selectedKeys.length === 0 ? 0.5 : 1
              }}
            >
              <CheckCircle size={18} /> Aprobar Seleccionados
            </button>
          </div>
        )}
      </div>

      {/* Tabs de Estado V18.8 */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '2.5rem', background: activeColors.card, padding: '8px', borderRadius: '24px', border: `1.5px solid ${activeColors.border}`, width: 'fit-content' }}>
        {[
          { id: 'PENDING', label: 'Pendientes', icon: Clock, count: null },
          { id: 'APPROVED', label: 'Aprobados', icon: CheckCircle, count: null },
          { id: 'REJECTED', label: 'Rechazados', icon: AlertCircle, count: null }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 24px', borderRadius: '18px',
              border: 'none', fontWeight: '900', fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.3s',
              background: activeTab === tab.id ? activeColors.accent : 'transparent',
              color: activeTab === tab.id ? 'white' : activeColors.textMuted,
              boxShadow: activeTab === tab.id ? '0 10px 20px rgba(79, 70, 229, 0.2)' : 'none'
            }}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Toolbar & Advanced Filters V18.9 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
          
          {/* Buscador Principal */}
          <div style={{ position: 'relative', flex: '1', minWidth: '300px' }}>
            <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por sede, ID o distrito..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '16px 20px 16px 55px', 
                borderRadius: '18px', 
                border: `1.5px solid ${activeColors.border}`, 
                background: activeColors.card, 
                color: activeColors.textMain, 
                fontWeight: '700',
                outline: 'none',
                fontSize: '0.9rem'
              }}
              className="focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all"
            />
          </div>

          {/* Filtro Distrito */}
          <div style={{ minWidth: '180px' }}>
            <select 
              value={filterDistrict}
              onChange={(e) => setFilterDistrict(e.target.value)}
              style={{ width: '100%', padding: '16px 20px', borderRadius: '18px', border: `1.5px solid ${activeColors.border}`, background: activeColors.card, color: activeColors.textMain, fontWeight: '800', fontSize: '0.85rem', outline: 'none', cursor: 'pointer' }}
            >
              <option value="ALL">📍 Todos los Distritos</option>
              {districtsList.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {/* Filtro Sede */}
          <div style={{ minWidth: '180px' }}>
            <select 
              value={filterStore}
              onChange={(e) => setFilterStore(e.target.value)}
              style={{ width: '100%', padding: '16px 20px', borderRadius: '18px', border: `1.5px solid ${activeColors.border}`, background: activeColors.card, color: activeColors.textMain, fontWeight: '800', fontSize: '0.85rem', outline: 'none', cursor: 'pointer' }}
            >
              <option value="ALL">🏪 Todas las Sedes</option>
              {storesList.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Filtro Semana */}
          <div style={{ minWidth: '220px' }}>
            <select 
              value={filterWeek}
              onChange={(e) => setFilterWeek(e.target.value)}
              style={{ width: '100%', padding: '16px 20px', borderRadius: '18px', border: `1.5px solid ${activeColors.border}`, background: activeColors.card, color: activeColors.textMain, fontWeight: '800', fontSize: '0.85rem', outline: 'none', cursor: 'pointer' }}
            >
              <option value="ALL">📅 Todos los Periodos</option>
              {weeksList.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>

          {/* Stats Count */}
          <div style={{ padding: '14px 24px', background: activeColors.accentSoft, borderRadius: '18px', border: `1.5px solid ${activeColors.accent}30`, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: '950', color: activeColors.accent }}>{filteredStores.length}</span>
            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: activeColors.accent, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Turnos</span>
          </div>
        </div>
      </div>

      {/* Grid de Tiendas */}
      <div style={{ background: activeColors.card, borderRadius: '32px', border: `1.5px solid ${activeColors.border}`, overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.03)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', background: activeColors.accentSoft + '40', borderBottom: `1.5px solid ${activeColors.border}` }}>
              {activeTab === 'PENDING' && (
                <th style={{ padding: '20px 24px', width: '60px' }}>
                  <input 
                    type="checkbox" 
                    checked={selectedKeys.length === filteredStores.length && filteredStores.length > 0}
                    onChange={handleSelectAll}
                    style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: activeColors.accent }}
                  />
                </th>
              )}
              <th style={{ padding: '20px 24px', fontSize: '0.7rem', fontWeight: '900', color: activeColors.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Sede / Identificador</th>
              <th style={{ padding: '20px 24px', fontSize: '0.7rem', fontWeight: '900', color: activeColors.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Distrito</th>
              <th style={{ padding: '20px 24px', fontSize: '0.7rem', fontWeight: '900', color: activeColors.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Periodo Gestión</th>
              <th style={{ padding: '20px 24px', fontSize: '0.7rem', fontWeight: '900', color: activeColors.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Fecha de Carga</th>
              <th style={{ padding: '20px 24px', fontSize: '0.7rem', fontWeight: '900', color: activeColors.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Usuario Registra</th>
              <th style={{ padding: '20px 24px', fontSize: '0.7rem', fontWeight: '900', color: activeColors.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'right' }}>Labor</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ padding: '100px', textAlign: 'center' }}>
                  <div style={{ width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTopColor: activeColors.accent, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
                  <p style={{ marginTop: '20px', fontWeight: '700', color: activeColors.textMuted }}>Sincronizando turnos...</p>
                </td>
              </tr>
            ) : filteredStores.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ padding: '100px', textAlign: 'center' }}>
                  <ShieldCheck size={48} className="text-emerald-500 mx-auto opacity-30 mb-4" />
                  <p style={{ fontSize: '1rem', fontWeight: '800', color: activeColors.textMain }}>¡Sin turnos en este estado!</p>
                  <p style={{ fontSize: '0.85rem', fontWeight: '600', color: activeColors.textMuted }}>No se encontraron registros para la pestaña seleccionada.</p>
                </td>
              </tr>
            ) : filteredStores.map(store => (
              <tr key={`${store.storeId}-${store.weekStart}`} style={{ borderBottom: `1px solid ${activeColors.border}`, transition: 'all 0.2s' }} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                {activeTab === 'PENDING' && (
                  <td style={{ padding: '24px' }}>
                    <input 
                      type="checkbox" 
                      checked={selectedKeys.includes(`${store.storeId}-${store.weekStart}`)}
                      onChange={() => handleSelectStore(store)}
                      style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: activeColors.accent }}
                    />
                  </td>
                )}
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: activeColors.accent }}>
                      <Calendar size={14} />
                      <span style={{ fontSize: '0.85rem', fontWeight: '950' }}>{formatDateRange(store.minDate, store.maxDate)}</span>
                   </div>
                </td>
                <td style={{ padding: '24px' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: activeColors.textMuted }}>
                      <Clock size={14} />
                      <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>{new Date(store.lastUploadAt).toLocaleString()}</span>
                   </div>
                </td>
                <td style={{ padding: '24px' }}>
                  <div>
                    <div style={{ fontWeight: '950', fontSize: '0.85rem', color: activeColors.textMain }}>{store.authorName || 'SISTEMA'}</div>
                    <div style={{ fontWeight: '700', fontSize: '0.7rem', color: activeColors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{store.authorProfile || 'PROCESO AUTOMÁTICO'}</div>
                  </div>
                </td>
                <td style={{ padding: '24px', textAlign: 'right' }}>
                   <button 
                    onClick={() => setInspectedStore(store)}
                    style={{ 
                      padding: '8px 16px', borderRadius: '12px', background: activeColors.accentSoft, color: activeColors.accent,
                      border: 'none', fontWeight: '950', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px',
                      cursor: 'pointer', float: 'right'
                    }}
                    className="hover:scale-105 active:scale-95"
                   >
                     <Eye size={16} /> INSPECCIONAR
                   </button>
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
                 <h3 style={{ fontSize: '1.5rem', fontWeight: '950', color: activeColors.textMain, margin: '0 0 12px 0' }}>Rechazar Turnos</h3>
                 <p style={{ color: activeColors.textMuted, fontSize: '0.9rem', fontWeight: '600', marginBottom: '32px' }}>
                    Se notificará a los gerentes de los {selectedKeys.length} turnos seleccionados. Por favor, indica el motivo del rechazo para su corrección.
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
              <h3 style={{ fontSize: '1.5rem', fontWeight: '950', color: activeColors.textMain, marginBottom: '12px' }}>¿Aprobar turnos?</h3>
              <p style={{ color: activeColors.textMuted, marginBottom: '32px' }}>Se aprobarán {selectedKeys.length} turnos seleccionados.</p>
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
