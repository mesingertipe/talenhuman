import React, { useState, useEffect } from 'react';
import { 
  Clock, CheckCircle, XCircle, ArrowLeft, Plus, Search, 
  Calendar, Info, Paperclip, FileText, ChevronRight, Inbox, 
  RefreshCw, X, History, User, Store, ExternalLink, CalendarDays, ArrowRight
} from 'lucide-react';
import api from '../../services/api';
import { formatDate } from '../../utils/formatters';
import NewsRequest from '../News/NewsRequest';
import { useTheme } from '../../context/ThemeContext';
import TalenHumanDatePicker from '../../components/Shared/TalenHumanDatePicker';

const MobileRequests = ({ user, theme }) => {
  const { isDarkMode } = useTheme();
  const isDark = theme === 'dark' || isDarkMode;
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Date Filters
  const [dateTab, setDateTab] = useState('Mes'); // 'Dia', 'Semana', 'Mes', 'Rango'
  const [customRange, setCustomRange] = useState({ start: '', end: '' });
  // Status Filter
  const [statusFilter, setStatusFilter] = useState('Todos'); // 'Todos', 'PendienteGerente', 'Pendiente', 'Aprobado', 'Rechazado'

  // Colors
  const cardBg = isDark ? 'rgba(15, 23, 42, 0.6)' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)';
  const primaryText = isDark ? '#ffffff' : '#1e293b';
  const mutedText = isDark ? 'rgba(255, 255, 255, 0.4)' : '#64748b';
  const accentColor = '#4f46e5';

  const getRanges = () => {
    const today = new Date();
    
    if (dateTab === 'Dia') {
      const start = new Date(today.setHours(0,0,0,0));
      const end = new Date(today.setHours(23,59,59,999));
      return { start, end };
    }
    
    if (dateTab === 'Semana') {
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
      const start = new Date(today.setDate(diff));
      start.setHours(0,0,0,0);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      end.setHours(23,59,59,999);
      return { start, end };
    }
    
    if (dateTab === 'Mes') {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      end.setHours(23,59,59,999);
      return { start, end };
    }
    
    if (dateTab === 'Rango' && customRange.start && customRange.end) {
      const start = new Date(customRange.start);
      start.setHours(0,0,0,0);
      const end = new Date(customRange.end);
      end.setHours(23,59,59,999);
      return { start, end };
    }

    return null;
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const range = getRanges();
      let url = '/novedades/my-requests';
      
      const params = [];
      if (range) {
        params.push(`startDate=${range.start.toISOString()}`);
        params.push(`endDate=${range.end.toISOString()}`);
      }
      
      if (statusFilter !== 'Todos') {
        let statusCode = 0;
        if (statusFilter === 'Pendiente') statusCode = 0;
        if (statusFilter === 'Aprobado') statusCode = 1;
        if (statusFilter === 'Rechazado') statusCode = 2;
        if (statusFilter === 'PendienteGerente') statusCode = 3;
        params.push(`status=${statusCode}`);
      }

      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }

      const res = await api.get(url);
      setRequests(res.data || []);
    } catch (err) {
      console.error("Error fetching requests", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [dateTab, customRange, statusFilter]);

  const loadDetail = async (id) => {
    try {
      setDetailLoading(true);
      const res = await api.get(`/novedades/${id}`);
      setSelectedRequest(res.data);
      setShowDetail(true);
    } catch (err) {
      console.error("Error loading detail", err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDownloadFile = async (adjId) => {
    try {
      const res = await api.get(`/Files/view/${adjId}`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: res.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    } catch (err) {
      console.error("Error loading file", err);
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 0: return { label: 'Pendiente Admin/RH', color: '#f59e0b', bg: '#fffbeb', icon: <Clock size={12} /> };
      case 1: return { label: 'Aprobado', color: '#10b981', bg: '#f0fdf4', icon: <CheckCircle size={12} /> };
      case 2: return { label: 'Rechazado', color: '#ef4444', bg: '#fef2f2', icon: <XCircle size={12} /> };
      case 3: return { label: 'Pendiente Gerente', color: '#4f46e5', bg: '#eef2ff', icon: <Clock size={12} /> };
      default: return { label: 'Desconocido', color: '#64748b', bg: '#f8fafc', icon: <Clock size={12} /> };
    }
  };

  const filteredRequests = requests.filter(r => {
    if (!searchTerm) return true;
    return (r.novedadTipoNombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
           (r.observaciones || '').toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="animate-in fade-in slide-in-from-bottom-5 duration-500" style={{ paddingBottom: '100px' }}>
      
      {/* 🏔️ HEADER */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px', color: primaryText, margin: 0 }}>Mis Solicitudes</h1>
        <p style={{ fontSize: '13px', color: mutedText, marginTop: '4px' }}>Carga y monitorea tus novedades de nómina.</p>
      </div>

      {/* 📅 DATE TABS (Premium Pill Selection) */}
      <div style={{ 
        display: 'flex', background: isDark ? 'rgba(255, 255, 255, 0.03)' : '#f1f5f9', 
        borderRadius: '16px', padding: '6px', marginBottom: '20px', gap: '4px'
      }}>
        {['Dia', 'Semana', 'Mes', 'Rango'].map(tab => (
          <button 
            key={tab}
            onClick={() => setDateTab(tab)}
            style={{ 
              flex: 1, padding: '10px 0', borderRadius: '12px', border: 'none',
              background: dateTab === tab ? (isDark ? '#4f46e5' : '#ffffff') : 'transparent',
              color: dateTab === tab ? (isDark ? '#ffffff' : '#1e293b') : mutedText,
              fontWeight: '700', fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s',
              boxShadow: dateTab === tab && !isDark ? '0 4px 10px rgba(0,0,0,0.05)' : 'none'
            }}
          >
            {tab === 'Dia' ? 'Día' : tab}
          </button>
        ))}
      </div>

      {/* CUSTOM RANGE PICKERS (If Rango selected) */}
      {dateTab === 'Rango' && (
        <div style={{ 
          background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: '24px', 
          padding: '20px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '15px'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <span style={{ fontSize: '10px', fontWeight: '800', color: mutedText, display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>Desde</span>
              <TalenHumanDatePicker 
                value={customRange.start}
                onChange={(iso) => setCustomRange(prev => ({ ...prev, start: iso }))}
                isDarkMode={isDark}
              />
            </div>
            <div>
              <span style={{ fontSize: '10px', fontWeight: '800', color: mutedText, display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>Hasta</span>
              <TalenHumanDatePicker 
                value={customRange.end}
                onChange={(iso) => setCustomRange(prev => ({ ...prev, end: iso }))}
                isDarkMode={isDark}
              />
            </div>
          </div>
        </div>
      )}

      {/* 🏷️ STATUS FILTERS CHIPS */}
      <div style={{ 
        display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', 
        marginBottom: '20px', scrollbarWidth: 'none'
      }}>
        {['Todos', 'PendienteGerente', 'Pendiente', 'Aprobado', 'Rechazados'].map(status => {
          let label = status;
          if (status === 'PendienteGerente') label = 'Pendiente Gerente';
          if (status === 'Pendiente') label = 'Pendiente Admin/RH';
          if (status === 'Rechazados') label = 'Rechazados';
          
          const isSelected = (status === 'Rechazados' && statusFilter === 'Rechazado') || statusFilter === status;
          
          return (
            <button
              key={status}
              onClick={() => setStatusFilter(status === 'Rechazados' ? 'Rechazado' : status)}
              style={{
                padding: '8px 16px', borderRadius: '99px', border: `1px solid ${isSelected ? accentColor : cardBorder}`,
                background: isSelected ? 'rgba(79, 70, 229, 0.1)' : cardBg,
                color: isSelected ? accentColor : primaryText,
                fontWeight: '700', fontSize: '11px', whiteSpace: 'nowrap', cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* 🔍 SEARCH BAR */}
      <div style={{ 
        height: '52px', background: cardBg, borderRadius: '18px', 
        border: `1px solid ${cardBorder}`, display: 'flex', alignItems: 'center', padding: '0 16px', gap: '12px',
        marginBottom: '25px'
      }}>
        <Search size={18} color={mutedText} />
        <input 
          placeholder="Buscar solicitud..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ background: 'none', border: 'none', outline: 'none', color: primaryText, fontSize: '14px', width: '100%', fontWeight: '500' }}
        />
      </div>

      {/* 📋 REQUESTS LIST */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '30vh', gap: '15px' }}>
          <div style={{ width: '32px', height: '32px', border: '3px solid rgba(0,0,0,0.05)', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: '11px', fontWeight: '800', color: mutedText, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Sincronizando...</span>
        </div>
      ) : filteredRequests.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredRequests.map((item) => {
            const badge = getStatusBadge(item.status);
            return (
              <div 
                key={item.id} 
                onClick={() => loadDetail(item.id)}
                style={{ 
                  background: cardBg, borderRadius: '24px', padding: '20px', 
                  border: `1px solid ${cardBorder}`, display: 'flex', alignItems: 'center', gap: '16px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.02)', cursor: 'pointer', transition: 'transform 0.2s'
                }}
                className="active:scale-95"
              >
                <div style={{ 
                  width: '48px', height: '48px', 
                  background: 'rgba(79, 70, 229, 0.05)', 
                  borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5', flexShrink: 0
                }}>
                  <FileText size={24} strokeWidth={1.5} />
                </div>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '15px', fontWeight: '800', color: primaryText, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.novedadTipoNombre}</span>
                    <span style={{ fontSize: '9px', fontWeight: '900', color: mutedText }}>#{item.idSolicitud}</span>
                  </div>
                  
                  <p style={{ fontSize: '11px', color: mutedText, margin: '0 0 10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.observaciones || 'Sin observaciones.'}
                  </p>
                  
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', borderTop: `1px solid ${cardBorder}`, paddingTop: '10px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 8px', background: badge.bg, color: badge.color, borderRadius: '8px', fontSize: '9px', fontWeight: '950', textTransform: 'uppercase' }}>
                      {badge.icon}
                      <span>{badge.label}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: mutedText, fontSize: '10px', fontWeight: '700' }}>
                      <Calendar size={12} />
                      <span>{formatDate(item.fechaInicio)}</span>
                    </div>
                  </div>
                </div>
                
                <ChevronRight size={18} color={mutedText} style={{ flexShrink: 0 }} />
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: cardBg, borderRadius: '32px', border: `2px dashed ${cardBorder}` }}>
          <Inbox size={48} color={mutedText} style={{ marginBottom: '16px', opacity: 0.5 }} />
          <p style={{ color: primaryText, fontWeight: '700', margin: 0 }}>Sin solicitudes registradas</p>
          <p style={{ color: mutedText, fontSize: '13px', marginTop: '4px' }}>Presiona el botón (+) para solicitar una novedad.</p>
        </div>
      )}

      {/* ➕ FLOATING ACTION BUTTON */}
      <button 
        onClick={() => setShowCreate(true)}
        style={{ 
          position: 'fixed', bottom: '100px', right: '30px', 
          width: '60px', height: '60px', borderRadius: '50%', 
          background: '#4f46e5', color: 'white', display: 'flex', 
          alignItems: 'center', justifyContent: 'center', border: 'none', 
          boxShadow: '0 15px 30px rgba(79, 70, 229, 0.4)', zIndex: 99,
          cursor: 'pointer'
        }}
      >
        <Plus size={32} strokeWidth={2.5} />
      </button>

      {/* 📝 NEW REQUEST FULL SCREEN MODAL */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: isDark ? '#0f172a' : '#f8fafc', zIndex: 10000, overflowY: 'auto', padding: '20px' }}>
          <div style={{ maxWidth: '700px', margin: '0 auto' }}>
            <NewsRequest 
              user={user}
              isEmployeeSelfService={true}
              onComplete={() => { setShowCreate(false); fetchRequests(); }}
              onCancel={() => setShowCreate(false)}
            />
          </div>
        </div>
      )}

      {/* 🔍 DETAIL & TRACKING OVERLAY */}
      {showDetail && selectedRequest && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(10px)', zIndex: 10000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ 
            background: isDark ? '#1e293b' : '#ffffff', width: '100%', maxWidth: '500px', 
            borderTopLeftRadius: '36px', borderTopRightRadius: '36px', padding: '30px',
            maxHeight: '92vh', overflowY: 'auto', border: `1px solid ${cardBorder}`,
            boxShadow: '0 -20px 40px rgba(0,0,0,0.1)', animation: 'slideUp 0.3s ease-out'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <div>
                <span style={{ fontSize: '10px', color: '#4f46e5', fontWeight: '950', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Seguimiento de Solicitud</span>
                <h3 style={{ fontSize: '20px', fontWeight: '900', color: primaryText, margin: '2px 0 0' }}>{selectedRequest.novedadTipoNombre}</h3>
              </div>
              <button 
                onClick={() => setShowDetail(false)} 
                style={{ width: '40px', height: '40px', borderRadius: '50%', background: isDark ? '#334155' : '#f1f5f9', border: 'none', color: mutedText, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Info Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px' }}>
              <div style={{ background: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc', padding: '16px', borderRadius: '20px', border: `1px solid ${cardBorder}`, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <span style={{ fontSize: '9px', fontWeight: '800', color: mutedText, display: 'block', textTransform: 'uppercase' }}>Fecha Inicio</span>
                  <span style={{ fontSize: '13px', fontWeight: '750', color: primaryText }}>{formatDate(selectedRequest.fechaInicio)}</span>
                </div>
                <div>
                  <span style={{ fontSize: '9px', fontWeight: '800', color: mutedText, display: 'block', textTransform: 'uppercase' }}>Fecha Fin</span>
                  <span style={{ fontSize: '13px', fontWeight: '750', color: primaryText }}>{formatDate(selectedRequest.fechaFin)}</span>
                </div>
              </div>

              {/* Dynamic fields if any */}
              {selectedRequest.datosDinamicos && Object.keys(JSON.parse(selectedRequest.datosDinamicos)).length > 0 && (
                <div style={{ background: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc', padding: '20px', borderRadius: '20px', border: `1px solid ${cardBorder}` }}>
                  <span style={{ fontSize: '9px', fontWeight: '800', color: mutedText, display: 'block', textTransform: 'uppercase', marginBottom: '12px' }}>Datos Adicionales</span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {Object.entries(JSON.parse(selectedRequest.datosDinamicos)).map(([key, val]) => (
                      <div key={key}>
                        <span style={{ fontSize: '9px', fontWeight: '800', color: mutedText, display: 'block' }}>{key}</span>
                        <span style={{ fontSize: '12px', fontWeight: '750', color: primaryText }}>
                          {typeof val === 'boolean' ? (val ? 'SÍ' : 'NO') : (val === 'true' ? 'SÍ' : val === 'false' ? 'NO' : val)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Exposición Motivos */}
              <div style={{ background: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc', padding: '20px', borderRadius: '20px', border: `1px solid ${cardBorder}` }}>
                <span style={{ fontSize: '9px', fontWeight: '800', color: mutedText, display: 'block', textTransform: 'uppercase', marginBottom: '8px' }}>Exposición de Motivos</span>
                <p style={{ fontSize: '13px', color: primaryText, fontWeight: '600', fontStyle: 'italic', margin: 0 }}>
                  "{selectedRequest.observaciones || 'Sin aclaraciones adicionales.'}"
                </p>
              </div>

              {/* Attachments */}
              {selectedRequest.adjuntos && selectedRequest.adjuntos.length > 0 && (
                <div>
                  <span style={{ fontSize: '9px', fontWeight: '800', color: mutedText, display: 'block', textTransform: 'uppercase', marginBottom: '10px' }}>Adjuntos ({selectedRequest.adjuntos.length})</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedRequest.adjuntos.map((file) => (
                      <div key={file.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: isDark ? '#2e3a4e' : '#f1f5f9', borderRadius: '12px', border: `1px solid ${cardBorder}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', flex: 1 }}>
                          <FileText size={16} color={accentColor} style={{ flexShrink: 0 }} />
                          <span style={{ fontSize: '11px', fontWeight: '800', color: primaryText, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.fileName}</span>
                        </div>
                        <button 
                          onClick={() => handleDownloadFile(file.id)}
                          style={{ border: 'none', background: '#4f46e5', color: 'white', padding: '6px 12px', borderRadius: '8px', fontSize: '9px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <ExternalLink size={10} /> Ver
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 🗺️ VISUAL TRACKING TIMELINE */}
            <div style={{ background: isDark ? 'rgba(255,255,255,0.01)' : '#fafafa', padding: '20px', borderRadius: '24px', border: `1px dashed ${cardBorder}`, marginBottom: '30px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <History size={16} color="#4f46e5" />
                <span style={{ fontSize: '11px', fontWeight: '950', color: mutedText, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Trazabilidad de Solicitud</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative' }}>
                {/* Vertical Line Connector */}
                <div style={{ position: 'absolute', left: '11px', top: '12px', bottom: '12px', width: '2px', background: isDark ? '#334155' : '#e2e8f0', zIndex: 1 }}></div>

                {/* Step 1: Creación */}
                <div style={{ display: 'flex', gap: '16px', position: 'relative', zIndex: 2 }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
                    <CheckCircle size={14} />
                  </div>
                  <div>
                    <h5 style={{ fontSize: '12px', fontWeight: '900', color: primaryText, margin: 0 }}>Creado</h5>
                    <p style={{ fontSize: '10px', color: mutedText, margin: '2px 0 0' }}>Solicitud registrada inicialmente por el empleado.</p>
                  </div>
                </div>

                {/* Step 2: Gerente Approval */}
                {(() => {
                  let circleBg = isDark ? '#334155' : '#e2e8f0';
                  let icon = <Clock size={12} color={mutedText} />;
                  let stepTitle = "Pendiente Gerente";
                  let stepDesc = "En espera de aprobación por el Gerente de Tienda.";
                  
                  // Check logs for manager actions
                  const gerApproveLog = selectedRequest.logs?.find(l => l.accion === "Aprobó (Gerente)");
                  const gerRejectLog = selectedRequest.logs?.find(l => l.accion === "Rechazó (Gerente)");

                  if (gerApproveLog) {
                    circleBg = '#10b981';
                    icon = <CheckCircle size={14} color="white" />;
                    stepTitle = "Aprobado por Gerente";
                    stepDesc = `Aprobado por ${gerApproveLog.usuario}. Comentario: "${gerApproveLog.comentario}"`;
                  } else if (gerRejectLog) {
                    circleBg = '#ef4444';
                    icon = <XCircle size={14} color="white" />;
                    stepTitle = "Rechazado por Gerente";
                    stepDesc = `Rechazado por ${gerRejectLog.usuario}. Motivo: "${gerRejectLog.comentario}"`;
                  } else if (selectedRequest.status === 3) {
                    circleBg = '#4f46e5';
                    icon = <RefreshCw size={12} color="white" className="animate-spin" />;
                    stepTitle = "Pendiente Gerente";
                    stepDesc = "En espera de la aprobación del Gerente de Tienda.";
                  }

                  return (
                    <div style={{ display: 'flex', gap: '16px', position: 'relative', zIndex: 2 }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: circleBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
                        {icon}
                      </div>
                      <div>
                        <h5 style={{ fontSize: '12px', fontWeight: '900', color: primaryText, margin: 0 }}>{stepTitle}</h5>
                        <p style={{ fontSize: '10px', color: mutedText, margin: '2px 0 0' }}>{stepDesc}</p>
                      </div>
                    </div>
                  );
                })()}

                {/* Step 3: Admin/RH Approval */}
                {(() => {
                  let circleBg = isDark ? '#334155' : '#e2e8f0';
                  let icon = <Clock size={12} color={mutedText} />;
                  let stepTitle = "Pendiente Admin / RH";
                  let stepDesc = "En espera de validación final por Administración / Talento Humano.";
                  
                  const isGerRejected = selectedRequest.logs?.some(l => l.accion === "Rechazó (Gerente)");
                  const adminApproveLog = selectedRequest.logs?.find(l => l.accion === "Aprobó");
                  const adminRejectLog = selectedRequest.logs?.find(l => l.accion === "Rechazó");

                  if (isGerRejected) {
                    circleBg = isDark ? '#475569' : '#cbd5e1';
                    icon = <XCircle size={12} color={mutedText} />;
                    stepTitle = "Proceso Finalizado";
                    stepDesc = "La novedad fue rechazada en la etapa previa.";
                  } else if (adminApproveLog) {
                    circleBg = '#10b981';
                    icon = <CheckCircle size={14} color="white" />;
                    stepTitle = "Aprobado (Final)";
                    stepDesc = `Aprobado por ${adminApproveLog.usuario}. Comentario: "${adminApproveLog.comentario}"`;
                  } else if (adminRejectLog) {
                    circleBg = '#ef4444';
                    icon = <XCircle size={14} color="white" />;
                    stepTitle = "Rechazado por Admin / RH";
                    stepDesc = `Rechazado por ${adminRejectLog.usuario}. Motivo: "${adminRejectLog.comentario}"`;
                  } else if (selectedRequest.status === 0) {
                    circleBg = '#f59e0b';
                    icon = <RefreshCw size={12} color="white" className="animate-spin" />;
                    stepTitle = "Pendiente Admin / RH";
                    stepDesc = "En espera de validación final por Administración / Talento Humano.";
                  }

                  return (
                    <div style={{ display: 'flex', gap: '16px', position: 'relative', zIndex: 2 }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: circleBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
                        {icon}
                      </div>
                      <div>
                        <h5 style={{ fontSize: '12px', fontWeight: '900', color: primaryText, margin: 0 }}>{stepTitle}</h5>
                        <p style={{ fontSize: '10px', color: mutedText, margin: '2px 0 0' }}>{stepDesc}</p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Close Button */}
            <button 
              onClick={() => setShowDetail(false)}
              style={{ width: '100%', padding: '16px', borderRadius: '18px', background: '#4f46e5', color: 'white', border: 'none', fontSize: '12px', fontWeight: '950', textTransform: 'uppercase', cursor: 'pointer', boxShadow: '0 10px 20px rgba(79, 70, 229, 0.2)' }}
            >
              Cerrar Detalle
            </button>
          </div>
        </div>
      )}

      {/* Embedded Styles */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
};

export default MobileRequests;
