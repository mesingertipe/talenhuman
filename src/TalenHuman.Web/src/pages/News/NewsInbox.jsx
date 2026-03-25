import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
    FileText, CheckCircle, XCircle, Clock, Search, 
    Filter, Eye, Calendar, User as UserIcon, 
    AlertCircle, FileCheck, FileX, History, Plus, Paperclip, X,
    ChevronRight, LayoutGrid, ListTodo, ClipboardList
} from 'lucide-react';
import api from '../../services/api';
import NewsRequest from './NewsRequest';
import { useTheme } from '../../context/ThemeContext';

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
                             (n.brandNombre || '').toLowerCase().includes(term) ||
                             (n.idSolicitud || '').toString().includes(term);
        const matchesStatus = statusFilter === 'Todos' || 
                             (statusFilter === 'Pendiente' && Number(n.status) === 0) ||
                             (statusFilter === 'Aprobado' && Number(n.status) === 1) ||
                             (statusFilter === 'Rechazado' && Number(n.status) === 2);
        return matchesSearch && matchesStatus;
    });

    const stats = {
        pending: news.filter(n => n.status === 0).length,
        approved: news.filter(n => n.status === 1).length,
        rejected: news.filter(n => n.status === 2).length
    };

    const getStatusStyles = (status) => {
        const s = Number(status);
        switch(s) {
            case 0: return { bg: '#fffbeb', text: '#d97706', border: '#fef3c7', label: 'Pendiente' };
            case 1: return { bg: '#ecfdf5', text: '#059669', border: '#d1fae5', label: 'Aprobado' };
            case 2: return { bg: '#fff1f2', text: '#e11d48', border: '#ffe4e6', label: 'Rechazado' };
            default: return { bg: '#f8fafc', text: '#64748b', border: '#e2e8f0', label: 'Desconocido' };
        }
    };

    return (
        <div style={{ padding: '2rem 1rem', maxWidth: '1400px', margin: '0 auto' }}>
            {/* Page Header (Companies Style) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.2rem', fontWeight: '950', color: activeColors.textMain, margin: 0, letterSpacing: '-0.03em' }}>Bandeja de novedades</h1>
                    <p style={{ color: activeColors.textMuted, fontSize: '0.9rem', fontWeight: '600', marginTop: '5px' }}>Trazabilidad y auditoría de solicitudes operativas</p>
                </div>
                <button 
                    onClick={() => setShowRequest(true)}
                    style={{ background: activeColors.accent, color: 'white', padding: '14px 30px', borderRadius: '18px', border: 'none', fontWeight: '800', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.15em', cursor: 'pointer', boxShadow: '0 10px 15px rgba(79, 70, 229, 0.2)', display: 'flex', alignItems: 'center', gap: '10px' }}
                    className="hover:scale-105 active:scale-95 transition-all"
                >
                    <Plus size={20} /> Nueva Solicitud
                </button>
            </div>

            {/* Stats Overview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
                {[
                    { label: 'Pendientes', val: stats.pending, icon: Clock, color: '#f59e0b', bg: '#fffbeb' },
                    { label: 'Aprobadas', val: stats.approved, icon: CheckCircle, color: '#10b981', bg: '#ecfdf5' },
                    { label: 'Rechazadas', val: stats.rejected, icon: XCircle, color: '#ef4444', bg: '#fff1f2' }
                ].map((s, idx) => (
                    <div key={idx} style={{ background: activeColors.card, padding: '1.5rem 2rem', borderRadius: '32px', border: `1px solid ${activeColors.border}`, display: 'flex', alignItems: 'center', gap: '1.5rem', boxShadow: '0 4px 15px rgba(0,0,0,0.01)' }}>
                        <div style={{ width: '60px', height: '60px', background: s.bg, color: s.color, borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <s.icon size={28} />
                        </div>
                        <div>
                            <p style={{ fontSize: '10px', fontWeight: '900', color: activeColors.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>{s.label}</p>
                            <p style={{ fontSize: '2rem', fontWeight: '950', color: activeColors.textMain, lineHeight: 1 }}>{s.val}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters Toolbar */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2.5rem', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: '1 1 400px', maxWidth: '600px' }}>
                    <Search style={{ position: 'absolute', left: '16px', top: '16px', color: '#94a3b8' }} size={18} />
                    <input 
                        type="text" 
                        placeholder="Buscar por nombre, cédula o radicado..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ width: '100%', padding: '14px 20px 14px 50px', borderRadius: '18px', background: activeColors.card, border: `1px solid ${activeColors.border}`, color: activeColors.textMain, fontSize: '0.9rem', fontWeight: '600', boxSizing: 'border-box' }}
                    />
                </div>
                <div style={{ position: 'relative', width: '220px' }}>
                    <Filter style={{ position: 'absolute', left: '16px', top: '16px', color: '#94a3b8' }} size={16} />
                    <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{ width: '100%', padding: '14px 20px 14px 45px', borderRadius: '18px', background: activeColors.card, border: `1px solid ${activeColors.border}`, color: activeColors.textMain, fontSize: '0.9rem', fontWeight: '700', cursor: 'pointer', appearance: 'none', boxSizing: 'border-box' }}
                    >
                        <option>Todos</option>
                        <option>Pendiente</option>
                        <option>Aprobado</option>
                        <option>Rechazado</option>
                    </select>
                </div>
            </div>

            {/* Table (Companies Style but Optimized) */}
            <div style={{ background: activeColors.card, borderRadius: '40px', border: `1px solid ${activeColors.border}`, overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
                {loading ? (
                    <div style={{ padding: '100px', textAlign: 'center', color: activeColors.textMuted, fontWeight: '900' }}>SINCRONIZANDO EXPEDIENTES...</div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: isDarkMode ? '#1e293b' : '#f8fafc', textAlign: 'left', borderBottom: `1px solid ${activeColors.border}` }}>
                                    <th style={{ padding: '1.5rem 2.5rem', fontSize: '0.7rem', fontWeight: '900', textTransform: 'uppercase', color: activeColors.textMuted, letterSpacing: '0.1em' }}>Solicitante / Entidad</th>
                                    <th style={{ padding: '1.5rem', fontSize: '0.7rem', fontWeight: '900', textTransform: 'uppercase', color: activeColors.textMuted, letterSpacing: '0.1em' }}>Concepto</th>
                                    <th style={{ padding: '1.5rem', fontSize: '0.7rem', fontWeight: '900', textTransform: 'uppercase', color: activeColors.textMuted, letterSpacing: '0.1em' }}>Estado</th>
                                    <th style={{ padding: '1.5rem 2.5rem', fontSize: '0.7rem', fontWeight: '900', textTransform: 'uppercase', color: activeColors.textMuted, letterSpacing: '0.1em', textAlign: 'right' }}>Gestión</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredNews.map(n => {
                                    const st = getStatusStyles(n.status);
                                    const category = n.novedadCategoria === 'Empleado' ? 'E' : n.novedadCategoria === 'Tienda' ? 'T' : 'M';
                                    const categoryColor = n.novedadCategoria === 'Empleado' ? '#4f46e5' : n.novedadCategoria === 'Tienda' ? '#f59e0b' : '#9333ea';
                                    
                                    return (
                                        <tr key={n.id} style={{ borderBottom: `1px solid ${activeColors.border}`, cursor: 'pointer' }} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors" onClick={() => fetchDetail(n.id)}>
                                            <td style={{ padding: '1.5rem 2.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                                                    <div style={{ width: '48px', height: '48px', background: `${categoryColor}15`, color: categoryColor, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '950', fontSize: '1.1rem', border: `1px solid ${categoryColor}25` }}>
                                                        {category}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: '0.9rem', fontWeight: '900', color: activeColors.textMain, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            {n.empleadoNombre || n.storeNombre || n.brandNombre}
                                                            <span style={{ fontSize: '9px', padding: '2px 8px', borderRadius: '6px', background: isDarkMode ? '#334155' : '#f1f5f9', color: activeColors.textMuted }}>#{n.idSolicitud}</span>
                                                        </div>
                                                        <p style={{ fontSize: '0.75rem', fontWeight: '600', color: activeColors.textMuted, marginTop: '2px' }}>{n.empleadoCedula ? `C.C. ${n.empleadoCedula}` : n.novedadCategoria}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1.5rem' }}>
                                                <p style={{ fontSize: '0.85rem', fontWeight: '800', color: activeColors.accent, textTransform: 'uppercase' }}>{n.novedadTipoNombre}</p>
                                                <p style={{ fontSize: '0.7rem', fontWeight: '600', color: activeColors.textMuted, display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                                                    <Calendar size={12} opacity={0.5} />
                                                    {new Date(n.fechaInicio).toLocaleDateString('es-CO')} - {new Date(n.fechaFin).toLocaleDateString('es-CO')}
                                                </p>
                                            </td>
                                            <td style={{ padding: '1.5rem' }}>
                                                <span style={{ padding: '6px 14px', borderRadius: '99px', background: st.bg, color: st.text, fontSize: '0.7rem', fontWeight: '950', textTransform: 'uppercase', letterSpacing: '0.05em', border: `1px solid ${st.border}`, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: st.text }}></div>
                                                    {st.label}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1.5rem 2.5rem', textAlign: 'right' }}>
                                                <button style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', padding: '10px' }} className="hover:scale-110 transition-transform">
                                                    <Eye size={22} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Detail Modal (Premium Elite) */}
            {showDetail && selectedNews && createPortal(
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(2, 6, 15, 0.9)', backdropFilter: 'blur(20px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: activeColors.card, width: '100%', maxWidth: '1000px', maxHeight: '90vh', borderRadius: '40px', overflow: 'hidden', display: 'flex', flexDirection: 'column', border: isDarkMode ? '1px solid #334155' : 'none' }}>
                        <div style={{ padding: '30px 40px', background: isDarkMode ? '#1e293b' : '#ffffff', borderBottom: `1px solid ${activeColors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: '950', color: activeColors.textMain, textTransform: 'uppercase', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    Detalle Operativo
                                    <span style={{ fontSize: '10px', padding: '4px 12px', borderRadius: '8px', background: getStatusStyles(selectedNews.status).bg, color: getStatusStyles(selectedNews.status).text, border: `1px solid ${getStatusStyles(selectedNews.status).border}` }}>
                                        {getStatusStyles(selectedNews.status).label}
                                    </span>
                                </h2>
                                <p style={{ fontSize: '0.7rem', fontWeight: '900', color: activeColors.textMuted, textTransform: 'uppercase', marginTop: '6px', letterSpacing: '0.1em' }}>Expediente Digital: <span style={{ color: activeColors.accent }}>#ND-{selectedNews.idSolicitud}</span></p>
                            </div>
                            <button onClick={() => setShowDetail(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: activeColors.textMuted }}><X size={24} /></button>
                        </div>

                        <div style={{ padding: '40px', flex: 1, overflowY: 'auto', background: isDarkMode ? '#0f172a' : '#f8fafc', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
                            {/* Profile Card */}
                            <div style={{ background: activeColors.card, padding: '30px', borderRadius: '28px', border: `1px solid ${activeColors.border}` }}>
                                <h3 style={{ fontSize: '10px', fontWeight: '950', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}><UserIcon size={16} /> Perfil Solicitante</h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                    <div style={{ width: '70px', height: '70px', background: activeColors.accent, color: 'white', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: '950' }}>
                                        {(selectedNews.empleadoNombre || selectedNews.storeNombre || selectedNews.brandNombre)?.[0]}
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '1.2rem', fontWeight: '950', color: activeColors.textMain, margin: 0 }}>{selectedNews.empleadoNombre || selectedNews.storeNombre || selectedNews.brandNombre}</p>
                                        <p style={{ fontSize: '0.8rem', fontWeight: '700', color: activeColors.textMuted, marginTop: '4px' }}>{selectedNews.empleadoCedula ? `C.C. ${selectedNews.empleadoCedula}` : selectedNews.novedadCategoria}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Data Card */}
                            <div style={{ background: activeColors.card, padding: '30px', borderRadius: '28px', border: `1px solid ${activeColors.border}` }}>
                                <h3 style={{ fontSize: '10px', fontWeight: '950', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}><ClipboardList size={16} /> Parámetros</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${activeColors.border}`, paddingBottom: '10px' }}>
                                        <span style={{ fontSize: '0.8rem', fontWeight: '800', color: activeColors.textMuted }}>Concepto:</span>
                                        <span style={{ fontSize: '0.8rem', fontWeight: '900', color: activeColors.accent }}>{selectedNews.novedadTipoNombre}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ fontSize: '0.8rem', fontWeight: '800', color: activeColors.textMuted }}>Vigencia:</span>
                                        <span style={{ fontSize: '0.8rem', fontWeight: '900', color: activeColors.textMain }}>{new Date(selectedNews.fechaInicio).toLocaleDateString()} - {new Date(selectedNews.fechaFin).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Observaciones */}
                            <div style={{ background: activeColors.card, padding: '30px', borderRadius: '28px', border: `1px solid ${activeColors.border}`, gridColumn: '1 / -1' }}>
                                <h3 style={{ fontSize: '10px', fontWeight: '950', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '15px' }}>Exposición de Motivos</h3>
                                <p style={{ fontSize: '0.9rem', color: activeColors.textMain, fontWeight: '600', lineHeight: '1.6', fontStyle: 'italic', margin: 0 }}>"{selectedNews.observaciones || 'Sin aclaraciones adicionales.'}"</p>
                            </div>

                            {/* Dynamic Data if exists */}
                            {selectedNews.datosDinamicos && (
                                <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
                                    {Object.entries(JSON.parse(selectedNews.datosDinamicos)).map(([key, val]) => (
                                        <div key={key} style={{ padding: '15px 20px', background: activeColors.card, border: `1px solid ${activeColors.border}`, borderRadius: '16px' }}>
                                            <p style={{ fontSize: '9px', fontWeight: '900', color: activeColors.textMuted, textTransform: 'uppercase', marginBottom: '4px' }}>{key}</p>
                                            <p style={{ fontSize: '0.85rem', fontWeight: '900', color: activeColors.textMain }}>{val}</p>
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
                                    <button onClick={() => { setActionType('Reject'); setActionComment(''); setShowActionModal(true); }} style={{ flex: 1, padding: '16px', borderRadius: '16px', border: 'none', background: '#fef2f2', color: '#ef4444', fontWeight: '800', fontSize: '11px', textTransform: 'uppercase', cursor: 'pointer' }}>Denegar Solicitud</button>
                                    <button onClick={() => { setActionType('Approve'); setActionComment(''); setShowActionModal(true); }} style={{ flex: 2, padding: '16px', borderRadius: '16px', border: 'none', background: activeColors.accent, color: 'white', fontWeight: '800', fontSize: '11px', textTransform: 'uppercase', cursor: 'pointer', boxShadow: '0 8px 20px rgba(79, 70, 229, 0.2)' }}>Autorizar Novedad</button>
                                </>
                            ) : (
                                <button onClick={() => setShowDetail(false)} style={{ width: '100%', padding: '16px', borderRadius: '16px', border: `1px solid ${activeColors.border}`, background: 'transparent', color: activeColors.textMuted, fontWeight: '800', fontSize: '11px', textTransform: 'uppercase', cursor: 'pointer' }}>Cerrar Expediente</button>
                            )}
                        </div>
                    </div>
                </div>,
                document.getElementById('modal-root')
            )}

            {/* Action Popup */}
            {showActionModal && createPortal(
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(2, 6, 15, 0.95)', backdropFilter: 'blur(15px)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: activeColors.card, padding: '50px', borderRadius: '40px', textAlign: 'center', maxWidth: '500px', width: '90%', border: isDarkMode ? '1px solid #334155' : 'none' }}>
                        <div style={{ width: '80px', height: '80px', background: actionType === 'Approve' ? '#ecfdf5' : '#fef2f2', color: actionType === 'Approve' ? '#10b981' : '#ef4444', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 30px' }}>
                            {actionType === 'Approve' ? <FileCheck size={40} /> : <FileX size={40} />}
                        </div>
                        <h2 style={{ fontSize: '2rem', fontWeight: '950', color: activeColors.textMain, textTransform: 'uppercase', marginBottom: '15px' }}>{actionType === 'Approve' ? 'Aprobar' : 'Rechazar'}</h2>
                        <p style={{ color: activeColors.textMuted, fontSize: '0.9rem', fontWeight: '600', marginBottom: '35px', lineHeight: 1.6 }}>Justifique administrativamente su decisión para que el colaborador sea notificado. *</p>
                        
                        <textarea 
                            value={actionComment}
                            onChange={(e) => setActionComment(e.target.value)}
                            placeholder="Escriba su comentario aquí..."
                            style={{ width: '100%', minHeight: '120px', padding: '15px', borderRadius: '18px', background: isDarkMode ? '#0f172a' : '#f8fafc', border: `1px solid ${activeColors.border}`, color: activeColors.textMain, fontWeight: '700', boxSizing: 'border-box', marginBottom: '30px' }}
                        />

                        <div style={{ display: 'flex', gap: '15px' }}>
                            <button onClick={() => setShowActionModal(false)} style={{ flex: 1, padding: '16px', borderRadius: '16px', border: `1px solid ${activeColors.border}`, background: 'transparent', color: activeColors.textMuted, fontWeight: '800', textTransform: 'uppercase' }}>Volver</button>
                            <button onClick={handleAction} disabled={isSubmitting} style={{ flex: 2, padding: '16px', borderRadius: '16px', border: 'none', background: actionType === 'Approve' ? '#10b981' : '#ef4444', color: 'white', fontWeight: '800', textTransform: 'uppercase', boxShadow: '0 8px 15px rgba(0,0,0,0.1)' }}>
                                {isSubmitting ? 'Procesando...' : 'Confirmar Acción'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.getElementById('modal-root')
            )}

            {/* Request Modal Portal */}
            {showRequest && createPortal(
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(2, 6, 15, 0.9)', backdropFilter: 'blur(30px)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ width: '100%', maxWidth: '1100px', maxHeight: '95vh', overflowY: 'auto', borderRadius: '48px', boxShadow: '0 40px 100px rgba(0,0,0,0.4)', background: activeColors.card }}>
                        <NewsRequest 
                            onComplete={() => { setShowRequest(false); fetchNews(); }} 
                            onCancel={() => setShowRequest(false)} 
                            user={user}
                        />
                    </div>
                </div>,
                document.getElementById('modal-root')
            )}

            {/* Toast System */}
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
