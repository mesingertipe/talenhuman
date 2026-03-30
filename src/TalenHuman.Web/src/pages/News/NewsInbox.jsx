import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
    FileText, CheckCircle, XCircle, Clock, Search, 
    Filter, Eye, Calendar, User as UserIcon, 
    AlertCircle, FileCheck, FileX, History, Plus, Paperclip, X,
    ChevronRight, LayoutGrid, ListTodo, ClipboardList, Download, ExternalLink
} from 'lucide-react';
import api from '../../services/api';
import NewsRequest from './NewsRequest';
import { useTheme } from '../../context/ThemeContext';
import HelpIcon from '../../components/Shared/HelpIcon';
import SearchableSelect from '../../components/Shared/SearchableSelect';

const NewsInbox = ({ user }) => {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('Todos');
    const [selectedNews, setSelectedNews] = useState(null);
    const [showDetail, setShowDetail] = useState(false);
    const [showRequest, setShowRequest] = useState(false);
    const [showActionModal, setShowActionModal] = useState(false);
    const [actionType, setActionType] = useState('Approve'); 
    const [actionComment, setActionComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const { isDarkMode } = useTheme();

    // Premium Color System (Aligned with NewsDesigner)
    const activeColors = {
        bg: isDarkMode ? '#0f172a' : '#f8fafc',
        card: isDarkMode ? '#1e293b' : '#ffffff',
        border: isDarkMode ? '#334155' : '#f1f5f9',
        textMain: isDarkMode ? '#f1f5f9' : '#1e293b',
        textMuted: isDarkMode ? '#94a3b8' : '#64748b',
        accent: '#4f46e5',
        accentHover: '#4338ca'
    };

    useEffect(() => { fetchNews(); }, []);

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    };

    const fetchNews = async () => {
        try {
            setLoading(true);
            const res = await api.get('/novedades');
            setNews(res.data);
        } catch (err) {
            showToast("Error al sincronizar datos", "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchDetail = async (id) => {
        try {
            const res = await api.get(`/novedades/${id}`);
            setSelectedNews(res.data);
            setShowDetail(true);
        } catch (err) {
            showToast("Error al cargar detalle", "error");
        }
    };

    const handleViewFile = async (adjuntoId) => {
        try {
            const res = await api.get(`/Files/view/${adjuntoId}`, { responseType: 'blob' });
            const blob = new Blob([res.data], { type: res.headers['content-type'] });
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
            // Cleanup after a delay
            setTimeout(() => window.URL.revokeObjectURL(url), 100);
        } catch (err) {
            showToast("Error al recuperar el archivo", "error");
        }
    };

    const handleAction = async (e) => {
        e.preventDefault();
        if (!actionComment.trim()) {
            showToast("Justificación requerida", "error");
            return;
        }

        try {
            setIsSubmitting(true);
            const status = actionType === 'Approve' ? 1 : 2;
            await api.put(`/novedades/${selectedNews.id}/status`, {
                status,
                comentario: actionComment
            });
            showToast(actionType === 'Approve' ? "Novedad aprobada" : "Novedad rechazada");
            setShowActionModal(false);
            setShowDetail(false);
            fetchNews();
        } catch (err) {
            showToast("Error al procesar acción", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredNews = news.filter(n => {
        const term = searchTerm.toLowerCase();
        const matchesSearch = (n.empleadoNombre || '').toLowerCase().includes(term) || 
                             (n.empleadoCedula || '').includes(term) ||
                             (n.storeNombre || '').toLowerCase().includes(term) ||
                             (n.novedadTipoNombre || '').toLowerCase().includes(term);
        
        const matchesStatus = statusFilter === 'Todos' || 
                             (statusFilter === 'Pendiente' && n.status === 0) ||
                             (statusFilter === 'Aprobado' && n.status === 1) ||
                             (statusFilter === 'Rechazado' && n.status === 2);
        
        return matchesSearch && matchesStatus;
    });

    const getStatusInfo = (status) => {
        switch(status) {
            case 0: return { label: 'Pendiente', color: '#f59e0b', icon: <Clock size={12} />, bg: '#fffbeb' };
            case 1: return { label: 'Aprobado', color: '#10b981', icon: <CheckCircle size={12} />, bg: '#f0fdf4' };
            case 2: return { label: 'Rechazado', color: '#ef4444', icon: <XCircle size={12} />, bg: '#fef2f2' };
            default: return { label: 'Desconocido', color: '#64748b', icon: <Clock size={12} />, bg: '#f8fafc' };
        }
    };

    return (
        <div style={{ padding: '40px', maxWidth: '1600px', margin: '0 auto', animation: 'fadeIn 0.5s ease-out' }}>
            {/* Header V12 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <div style={{ width: '32px', height: '32px', background: activeColors.accent, color: 'white', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ClipboardList size={20} />
                        </div>
                        <h1 style={{ fontSize: '2.2rem', fontWeight: '950', color: activeColors.textMain, margin: 0, letterSpacing: '-0.03em' }}>Bandeja de Novedades</h1>
                    </div>
                    <p style={{ color: activeColors.textMuted, fontWeight: '700', fontSize: '0.9rem' }}>Gestión centralizada de requerimientos operativos</p>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={() => setShowRequest(true)} className="btn-premium btn-premium-primary" style={{ height: '52px', padding: '0 30px', borderRadius: '18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Plus size={20} /> Nueva Solicitud
                    </button>
                    <HelpIcon content="Visualización y aprobación de novedades filtradas por rol y tienda." />
                </div>
            </div>

            {/* Filters Bar V12 */}
            <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '300px', position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '18px', top: '18px', color: '#94a3b8' }} />
                    <input 
                        type="text" 
                        placeholder="Buscar por colaborador, cédula o tienda..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ width: '100%', padding: '16px 20px 16px 52px', borderRadius: '20px', background: activeColors.card, border: `1px solid ${activeColors.border}`, color: activeColors.textMain, fontSize: '0.9rem', fontWeight: '700', boxSizing: 'border-box' }}
                    />
                </div>

                <div style={{ width: '220px' }}>
                    <SearchableSelect
                        options={[
                            { id: 'Todos', name: 'Todos los Estados' },
                            { id: 'Pendiente', name: 'Pendientes' },
                            { id: 'Aprobado', name: 'Aprobados' },
                            { id: 'Rechazado', name: 'Rechazados' }
                        ]}
                        value={statusFilter}
                        onChange={(val) => setStatusFilter(val)}
                        placeholder="Estado..."
                        icon={Filter}
                    />
                </div>
            </div>

            {/* Content Area V12 */}
            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px', gap: '20px' }}>
                    <div className="loader-v12"></div>
                    <p style={{ fontSize: '11px', fontWeight: '900', color: activeColors.textMuted, textTransform: 'uppercase', letterSpacing: '0.2em' }}>Sincronizando Bandeja...</p>
                </div>
            ) : filteredNews.length === 0 ? (
                <div style={{ background: activeColors.card, borderRadius: '40px', padding: '80px', textAlign: 'center', border: `1px solid ${activeColors.border}` }}>
                    <div style={{ width: '80px', height: '80px', background: isDarkMode ? '#1e293b' : '#f8fafc', borderRadius: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 25px', color: '#cbd5e1' }}>
                        <ListTodo size={40} />
                    </div>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: '950', color: activeColors.textMain, margin: '0 0 10px' }}>Sin resultados</h3>
                    <p style={{ color: activeColors.textMuted, fontWeight: '700', fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto' }}>No encontramos novedades que coincidan con sus parámetros de búsqueda.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '25px' }}>
                    {filteredNews.map(n => {
                        const status = getStatusInfo(n.status);
                        return (
                            <div key={n.id} onClick={() => fetchDetail(n.id)} style={{ background: activeColors.card, borderRadius: '32px', padding: '30px', border: `1px solid ${activeColors.border}`, cursor: 'pointer', transition: 'all 0.3s ease-out' }} className="hover:shadow-2xl hover:border-indigo-500 hover:-translate-y-1 group">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ padding: '6px 12px', background: status.bg, color: status.color, borderRadius: '10px', fontSize: '10px', fontWeight: '950', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase' }}>
                                            {status.icon} {status.label}
                                        </div>
                                        <span style={{ fontSize: '9px', color: activeColors.textMuted, fontWeight: '900', textTransform: 'uppercase' }}>#{n.idSolicitud}</span>
                                    </div>
                                    <div style={{ color: activeColors.textMuted, fontSize: '10px', fontWeight: '800' }}>
                                        {new Date(n.fechaInicio).toLocaleDateString()}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                                    <div style={{ width: '48px', height: '48px', background: activeColors.accent + '20', color: activeColors.accent, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <UserIcon size={24} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ fontSize: '1.1rem', fontWeight: '950', color: activeColors.textMain, margin: 0, letterSpacing: '-0.02em' }}>{n.empleadoNombre}</h4>
                                        <p style={{ fontSize: '0.75rem', fontWeight: '800', color: activeColors.textMuted, margin: 0 }}>CC: {n.empleadoCedula}</p>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', margin: '0 0 20px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ width: '28px', height: '28px', background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f8fafc', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: activeColors.accent }}><Paperclip size={14} /></div>
                                        <div>
                                            <p style={{ fontSize: '9px', fontWeight: '900', color: activeColors.textMuted, textTransform: 'uppercase', margin: 0 }}>Tipo {n.attachmentsCount > 0 ? `• ${n.attachmentsCount} Archivos` : ''}</p>
                                            <p style={{ fontSize: '0.85rem', fontWeight: '900', color: activeColors.textMain, margin: 0 }}>{n.novedadTipoNombre}</p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ width: '28px', height: '28px', background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f8fafc', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: activeColors.accent }}><LayoutGrid size={14} /></div>
                                        <div>
                                            <p style={{ fontSize: '9px', fontWeight: '900', color: activeColors.textMuted, textTransform: 'uppercase', margin: 0 }}>Ubicación</p>
                                            <p style={{ fontSize: '0.85rem', fontWeight: '900', color: activeColors.textMain, margin: 0 }}>{n.storeNombre}</p>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ padding: '15px 0', borderTop: `1px solid ${activeColors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: n.status === 0 ? '#4f46e5' : '#cbd5e1' }}></div>
                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#cbd5e1' }}></div>
                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#cbd5e1' }}></div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: activeColors.accent, fontSize: '10px', fontWeight: '950', textTransform: 'uppercase' }}>
                                        Gestionar <ChevronRight size={14} />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Detail Modal V12 */}
            {showDetail && selectedNews && createPortal(
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(12px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
                    <div style={{ background: activeColors.card, width: '100%', maxWidth: '900px', borderRadius: '48px', overflow: 'hidden', border: `1px solid ${activeColors.border}`, animation: 'scaleIn 0.3s ease-out' }}>
                        <div style={{ padding: '40px 40px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                <div style={{ width: '56px', height: '56px', background: activeColors.accent, color: 'white', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 20px rgba(79, 70, 229, 0.2)' }}>
                                    <UserIcon size={24} />
                                </div>
                                <div>
                                    <p style={{ fontSize: '10px', color: activeColors.accent, fontWeight: '950', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '4px' }}>Detalle de Requerimiento</p>
                                    <h2 style={{ fontSize: '1.6rem', fontWeight: '950', color: activeColors.textMain, margin: 0, letterSpacing: '-0.02em' }}>{selectedNews.empleadoNombre}</h2>
                                </div>
                            </div>
                            <button onClick={() => setShowDetail(false)} style={{ width: '44px', height: '44px', borderRadius: '50%', background: isDarkMode ? '#1e293b' : '#f8fafc', border: `1px solid ${activeColors.border}`, cursor: 'pointer', color: activeColors.textMuted }}><X size={20} /></button>
                        </div>

                        <div style={{ padding: '0 40px 40px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px', maxHeight: '60vh', overflowY: 'auto' }}>
                            <div style={{ background: activeColors.bg, padding: '25px', borderRadius: '28px', border: `1px solid ${activeColors.border}` }}>
                                <p style={{ fontSize: '9px', fontWeight: '950', color: activeColors.textMuted, textTransform: 'uppercase', marginBottom: '15px' }}>Información Básica</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ fontSize: '11px', fontWeight: '900', color: activeColors.textMuted }}>Estado</span>
                                        <div style={{ padding: '3px 10px', background: getStatusInfo(selectedNews.status).bg, color: getStatusInfo(selectedNews.status).color, borderRadius: '8px', fontSize: '9px', fontWeight: '950' }}>{getStatusInfo(selectedNews.status).label}</div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ fontSize: '11px', fontWeight: '900', color: activeColors.textMuted }}>Tipo</span>
                                        <span style={{ fontSize: '11px', fontWeight: '950', color: activeColors.textMain }}>{selectedNews.novedadTipoNombre}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ fontSize: '11px', fontWeight: '900', color: activeColors.textMuted }}>Tienda</span>
                                        <span style={{ fontSize: '11px', fontWeight: '950', color: activeColors.textMain }}>{selectedNews.storeNombre}</span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ background: activeColors.bg, padding: '25px', borderRadius: '28px', border: `1px solid ${activeColors.border}` }}>
                                <p style={{ fontSize: '9px', fontWeight: '950', color: activeColors.textMuted, textTransform: 'uppercase', marginBottom: '15px' }}>Cronograma</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ fontSize: '11px', fontWeight: '900', color: activeColors.textMuted }}>Fecha Inicio</span>
                                        <span style={{ fontSize: '11px', fontWeight: '950', color: activeColors.textMain }}>{new Date(selectedNews.fechaInicio).toLocaleDateString()}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ fontSize: '11px', fontWeight: '900', color: activeColors.textMuted }}>Fecha Fin</span>
                                        <span style={{ fontSize: '11px', fontWeight: '950', color: activeColors.textMain }}>{new Date(selectedNews.fechaFin).toLocaleDateString()}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ fontSize: '11px', fontWeight: '900', color: activeColors.textMuted }}>Radicado por</span>
                                        <span style={{ fontSize: '11px', fontWeight: '950', color: activeColors.textMain }}>{selectedNews.createdBy}</span>
                                    </div>
                                </div>
                            </div>

                             {/* Adjuntos */}
                            {selectedNews.adjuntos && selectedNews.adjuntos.length > 0 && (
                                <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                                        <Paperclip size={16} style={{ color: activeColors.accent }} />
                                        <h3 style={{ fontSize: '11px', fontWeight: '950', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.15em', margin: 0 }}>Documentación de Soporte ({selectedNews.adjuntos.length} archivos)</h3>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
                                        {selectedNews.adjuntos.map((adj, idx) => (
                                            <div key={idx} style={{ background: activeColors.bg, padding: '18px 22px', borderRadius: '24px', border: `1px solid ${activeColors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '15px', transition: 'all 0.2s' }} className="hover:border-indigo-400">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 1, overflow: 'hidden' }}>
                                                    <div style={{ width: '36px', height: '36px', background: isDarkMode ? '#1e293b' : '#ffffff', color: activeColors.accent, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1px solid ${activeColors.border}` }}>
                                                        <FileText size={18} />
                                                    </div>
                                                    <div style={{ overflow: 'hidden' }}>
                                                        <p style={{ fontSize: '11px', fontWeight: '900', color: activeColors.textMain, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{adj.fileName}</p>
                                                        <p style={{ fontSize: '9px', fontWeight: '700', color: activeColors.textMuted, margin: 0 }}>Archivo Adjunto</p>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => handleViewFile(adj.id)}
                                                    style={{ display: 'flex', alignItems: 'center', gap: '8px', background: activeColors.accent, color: 'white', padding: '10px 18px', borderRadius: '14px', border: 'none', fontWeight: '950', fontSize: '10px', textTransform: 'uppercase', cursor: 'pointer', boxShadow: '0 5px 15px rgba(79, 70, 229, 0.2)' }}
                                                >
                                                    <ExternalLink size={14} /> Visualizar
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Observaciones */}
                            <div style={{ background: activeColors.card, padding: '30px', borderRadius: '28px', border: `1px solid ${activeColors.border}`, gridColumn: '1 / -1' }}>
                                <h3 style={{ fontSize: '10px', fontWeight: '950', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '15px' }}>Exposición de Motivos</h3>
                                <p style={{ fontSize: '0.9rem', color: activeColors.textMain, fontWeight: '600', lineHeight: '1.6', fontStyle: 'italic', margin: 0 }}>"{selectedNews.observaciones || 'Sin aclaraciones adicionales.'}"</p>
                            </div>

                            {/* Dynamic Data if exists */}
                            {selectedNews.datosDinamicos && (
                                <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
                                    {Object.entries(JSON.parse(selectedNews.datosDinamicos)).map(([key, val]) => (
                                        <div key={key} style={{ padding: '15px 20px', background: isDarkMode ? '#1e293b50' : '#f8fafc', border: `1px solid ${activeColors.border}`, borderRadius: '16px' }}>
                                            <p style={{ fontSize: '9px', fontWeight: '950', color: activeColors.textMuted, textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.05em' }}>{key}</p>
                                            <p style={{ fontSize: '0.9rem', fontWeight: '900', color: activeColors.textMain, margin: 0 }}>
                                                {typeof val === 'boolean' ? (val ? 'SÍ' : 'NO') : (val === 'true' ? 'SÍ' : val === 'false' ? 'NO' : val)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* History Timeline */}
                            <div style={{ background: activeColors.card, padding: '30px', borderRadius: '28px', border: `1px solid ${activeColors.border}`, gridColumn: '1 / -1' }}>
                                <h3 style={{ fontSize: '10px', fontWeight: '950', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}><History size={16} /> Trazabilidad Operativa</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    {selectedNews.logs?.map((log, i) => (
                                        <div key={i} style={{ display: 'flex', gap: '20px' }}>
                                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: log.accion.includes('Aprob') ? '#10b981' : log.accion.includes('Rech') ? '#ef4444' : '#4f46e5', marginTop: '6px', flexShrink: 0 }}></div>
                                            <div>
                                                <p style={{ fontSize: '11px', fontWeight: '900', color: activeColors.textMain, margin: 0, textTransform: 'uppercase' }}>{log.accion} - <span style={{ color: activeColors.textMuted }}>{log.usuario}</span></p>
                                                <p style={{ fontSize: '10px', color: activeColors.textMuted, margin: '2px 0 8px' }}>{new Date(log.fechaHoraColombia).toLocaleString()}</p>
                                                {log.comentario && <p style={{ fontSize: '11px', fontWeight: '600', color: activeColors.textMuted, background: isDarkMode ? '#1e293b' : '#f8fafc', padding: '10px 15px', borderRadius: '12px', border: `1px solid ${activeColors.border}`, fontStyle: 'italic' }}>{log.comentario}</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer Actions */}
                        <div style={{ padding: '25px 40px', background: activeColors.card, borderTop: `1px solid ${activeColors.border}`, display: 'flex', gap: '15px' }}>
                            {selectedNews.status === 0 ? (
                                <>
                                    <button onClick={() => { setActionType('Reject'); setActionComment(''); setShowActionModal(true); }} style={{ flex: 1, padding: '16px', borderRadius: '16px', background: 'transparent', border: '2px solid #ef4444', color: '#ef4444', fontWeight: '950', fontSize: '11px', textTransform: 'uppercase', cursor: 'pointer' }}>Rechazar</button>
                                    <button onClick={() => { setActionType('Approve'); setActionComment(''); setShowActionModal(true); }} style={{ flex: 2, padding: '16px', borderRadius: '16px', background: '#10b981', color: 'white', border: 'none', fontWeight: '950', fontSize: '11px', textTransform: 'uppercase', cursor: 'pointer', boxShadow: '0 10px 15px rgba(16, 185, 129, 0.2)' }}>Aprobar Requerimiento</button>
                                </>
                            ) : (
                                <button onClick={() => setShowDetail(false)} style={{ flex: 1, padding: '16px', borderRadius: '16px', background: activeColors.accent, color: 'white', border: 'none', fontWeight: '950', fontSize: '11px', textTransform: 'uppercase', cursor: 'pointer' }}>Cerrar Detalle</button>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Action Modal V12 (Confirm Approve/Reject) */}
            {showActionModal && createPortal(
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)', zIndex: 11000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
                    <div style={{ background: activeColors.card, width: '100%', maxWidth: '500px', borderRadius: '32px', border: `1px solid ${activeColors.border}`, boxShadow: '0 40px 80px rgba(0,0,0,0.3)', animation: 'scaleIn 0.2s ease-out' }}>
                        <div style={{ padding: '30px', borderBottom: `1px solid ${activeColors.border}`, display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: actionType === 'Approve' ? '#10b981' : '#ef4444', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {actionType === 'Approve' ? <CheckCircle size={20} /> : <XCircle size={20} />}
                            </div>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: '950', color: activeColors.textMain, margin: 0 }}>{actionType === 'Approve' ? 'Aprobar Solicitud' : 'Rechazar Solicitud'}</h3>
                        </div>
                        <form onSubmit={handleAction} style={{ padding: '30px' }}>
                            <p style={{ color: activeColors.textMuted, fontSize: '0.85rem', fontWeight: '600', marginBottom: '20px' }}>
                                Ingrese una justificación para procesar este requerimiento. Este comentario será visible para el solicitante.
                            </p>
                            <textarea
                                value={actionComment}
                                onChange={(e) => setActionComment(e.target.value)}
                                placeholder="Escribe tu comentario aquí..."
                                style={{ width: '100%', minHeight: '120px', padding: '15px', borderRadius: '16px', border: `1px solid ${activeColors.border}`, background: activeColors.bg, color: activeColors.textMain, fontWeight: '600', boxSizing: 'border-box', marginBottom: '25px', resize: 'none' }}
                                required
                            />
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button type="button" onClick={() => setShowActionModal(false)} style={{ flex: 1, padding: '14px', borderRadius: '14px', background: 'transparent', border: `1px solid ${activeColors.border}`, color: activeColors.textMuted, fontWeight: '900', fontSize: '11px', textTransform: 'uppercase', cursor: 'pointer' }}>Cancelar</button>
                                <button type="submit" disabled={isSubmitting} style={{ flex: 1, padding: '14px', borderRadius: '14px', background: actionType === 'Approve' ? '#10b981' : '#ef4444', color: 'white', border: 'none', fontWeight: '900', fontSize: '11px', textTransform: 'uppercase', cursor: 'pointer' }}>
                                    {isSubmitting ? '...' : actionType === 'Approve' ? 'Confirmar Aprobación' : 'Confirmar Rechazo'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {/* News Request Modal */}
            {showRequest && createPortal(
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(20px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
                    <div style={{ width: '100%', maxWidth: '1200px', animation: 'fadeInDown 0.5s ease-out' }}>
                        <NewsRequest 
                            user={user}
                            onComplete={() => { setShowRequest(false); fetchNews(); }} 
                            onCancel={() => setShowRequest(false)} 
                        />
                    </div>
                </div>,
                document.body
            )}

            {/* Toasts V12 */}
            {toast.show && (
                <div style={{ position: 'fixed', bottom: '40px', right: '40px', zIndex: 11000, background: toast.type === 'success' ? '#10b981' : '#ef4444', color: 'white', padding: '16px 30px', borderRadius: '20px', fontWeight: '900', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.15em', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 15px 30px rgba(0,0,0,0.2)' }}>
                    {toast.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    {toast.message}
                </div>
            )}
        </div>
    );
};

export default NewsInbox;
