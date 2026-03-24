import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
    FileText, CheckCircle, XCircle, Clock, Search, 
    Filter, MoreVertical, Eye, MessageSquare, Calendar,
    User as UserIcon, AlertCircle, FileCheck, FileX, History, Plus, Paperclip, X
} from 'lucide-react';
import api from '../../services/api';
import NewsRequest from './NewsRequest';
import { useTheme } from '../../context/ThemeContext';

const NewsInbox = () => {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('Todos');
    const [selectedNews, setSelectedNews] = useState(null);
    const [showDetail, setShowDetail] = useState(false);
    const [showRequest, setShowRequest] = useState(false);
    const [showActionModal, setShowActionModal] = useState(false);
    const [actionType, setActionType] = useState('Approve'); // Approve or Reject
    const [actionComment, setActionComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const { isDarkMode } = useTheme();

    useEffect(() => {
        fetchNews();
    }, []);

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
            showToast("Error al cargar novedades", "error");
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
            showToast("Error al cargar el detalle", "error");
        }
    };

    const handleAction = async (e) => {
        e.preventDefault();
        if (!actionComment.trim()) {
            showToast("El comentario es obligatorio", "error");
            return;
        }

        try {
            setIsSubmitting(true);
            const status = actionType === 'Approve' ? 1 : 2; // Aprobado: 1, Rechazado: 2 (Match enum NovedadStatus)
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
            case 0: return { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-500', color: '#f59e0b', darkColor: '#fbbf24', border: 'border-amber-100 dark:border-amber-800', dot: 'bg-amber-500', boxShadow: '0 0 10px rgba(245, 158, 11, 0.9)', label: 'Pendiente' };
            case 1: return { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-500', color: '#10b981', darkColor: '#34d399', border: 'border-emerald-100 dark:border-emerald-800', dot: 'bg-emerald-500', boxShadow: '0 0 10px rgba(16, 185, 129, 0.9)', label: 'Aprobado' };
            case 2: return { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-500', color: '#ef4444', darkColor: '#f87171', border: 'border-red-100 dark:border-red-800', dot: 'bg-red-500', boxShadow: '0 0 10px rgba(239, 68, 68, 0.9)', label: 'Rechazado' };
            default: return { bg: 'bg-slate-50 dark:bg-slate-800/20', text: 'text-slate-500', color: '#64748b', darkColor: '#94a3b8', border: 'border-slate-100 dark:border-slate-800', dot: 'bg-slate-400', label: 'Desconocido' };
        }
    };

    return (
        <div className="page-container animate-in fade-in duration-300">
            {/* Stats Cards - Forced Horizontal Row via inline Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem', width: '100%' }}>
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-5 p-6 transition-all hover:translate-y-[-4px]" style={{ borderRadius: '24px', borderLeft: '6px solid #f59e0b' }}>
                    <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400">
                        <Clock size={28} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Pendientes</p>
                        <p className="text-3xl font-black text-slate-800 dark:text-white leading-none">{stats.pending}</p>
                    </div>
                </div>
                
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-5 p-6 transition-all hover:translate-y-[-4px]" style={{ borderRadius: '24px', borderLeft: '6px solid #10b981' }}>
                    <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle size={28} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Aprobadas</p>
                        <p className="text-3xl font-black text-slate-800 dark:text-white leading-none">{stats.approved}</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-5 p-6 transition-all hover:translate-y-[-4px]" style={{ borderRadius: '24px', borderLeft: '6px solid #ef4444' }}>
                    <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/40 text-red-600 dark:text-red-400">
                        <X size={28} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Rechazadas</p>
                        <p className="text-3xl font-black text-slate-800 dark:text-white leading-none">{stats.rejected}</p>
                    </div>
                </div>
            </div>

            <div className="page-header mb-10" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '1.5rem', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', flex: '1 1 auto', maxWidth: '850px' }}>
                    <div style={{ position: 'relative', flex: '2 1 400px', minWidth: '300px' }}>
                        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Buscar Novedad o # Radicado..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input-premium lg:!pl-12 dark:bg-slate-900 w-full"
                            style={{ margin: 0, height: '52px', paddingLeft: '3.5rem' }}
                        />
                    </div>
                    <div style={{ position: 'relative', flex: '1 1 200px', minWidth: '180px' }}>
                        <Filter size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <select 
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="input-premium lg:!pl-12 dark:bg-slate-900 font-bold w-full appearance-none cursor-pointer"
                            style={{ margin: 0, height: '52px', paddingLeft: '3.5rem' }}
                        >
                            <option>Todos</option>
                            <option>Pendiente</option>
                            <option>Aprobado</option>
                            <option>Rechazado</option>
                        </select>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', flexShrink: 0, marginLeft: 'auto' }}>
                    <button 
                        className="btn-premium btn-premium-primary font-black uppercase tracking-widest" 
                        style={{ height: '48px', padding: '0 1.5rem', fontSize: '11px', margin: 0 }}
                        onClick={() => setShowRequest(true)}
                    >
                         <Plus size={18} className="mr-2" /> Nueva Solicitud
                    </button>
                    <button 
                         className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 transition-all shadow-sm"
                         style={{ height: '48px', width: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', cursor: 'pointer', margin: 0 }}
                    >
                        <Filter size={20} />
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="py-24 text-center">
                        <div className="loader !border-indigo-600 !w-12 !h-12 mx-auto"></div>
                        <p className="mt-6 text-slate-400 font-black uppercase tracking-widest text-[10px]">Sincronizando Bandeja...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="text-left bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800">
                                    <th className="p-6 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-10">Solicitante / Entidad</th>
                                    <th className="p-6 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Tipo de Novedad</th>
                                    <th className="p-6 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Estado</th>
                                    <th className="p-6 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right pr-10">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredNews.map(n => {
                                    const st = getStatusStyles(n.status);
                                    const isEmployee = n.novedadCategoria === 'Empleado';
                                    const isStore = n.novedadCategoria === 'Tienda';
                                    const isBrand = n.novedadCategoria === 'Marca';
                                    
                                    return (
                                    <tr key={n.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-indigo-900/10 transition-colors cursor-pointer group" onClick={() => fetchDetail(n.id)}>
                                            <td className="p-6 pl-10">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base shadow-sm ${isEmployee ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : isStore ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'}`}>
                                                        {isEmployee ? (n.empleadoNombre?.[0] || 'E') : isStore ? 'T' : 'M'}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-0.5">
                                                            <span className="text-[9px] font-black bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-lg leading-none border border-indigo-100 dark:border-indigo-800">#{n.idSolicitud}</span>
                                                            <p className="font-black text-slate-800 dark:text-white text-sm uppercase tracking-tight">
                                                                {isEmployee ? n.empleadoNombre : isStore ? n.storeNombre : n.brandNombre}
                                                            </p>
                                                        </div>
                                                        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                                                            {isEmployee ? `C.C. ${n.empleadoCedula}` : n.novedadCategoria}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <p className="font-black text-indigo-600 dark:text-indigo-400 text-xs mb-1 uppercase tracking-tight">{n.novedadTipoNombre}</p>
                                                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold flex items-center gap-2">
                                                    <Calendar size={14} className="opacity-50" />
                                                    {new Date(n.fechaInicio).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })} - {new Date(n.fechaFin).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                                                </p>
                                            </td>
                                            <td className="p-6">
                                                <div className={`flex items-center gap-2 text-[11px] font-black uppercase tracking-widest`} style={{ color: isDarkMode ? st.darkColor : st.color }}>
                                                    <div className={`w-1.5 h-1.5 rounded-full`} style={{ boxShadow: st.boxShadow, backgroundColor: isDarkMode ? st.darkColor : st.color }}></div>
                                                    {st.label}
                                                </div>
                                            </td>
                                            <td className="p-6 pr-10 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={(e) => { e.stopPropagation(); fetchDetail(n.id); }} className="p-3 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 rounded-2xl transition-all">
                                                        <Eye size={22} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filteredNews.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="py-32 text-center text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] opacity-30">
                                            No hay registros en esta vista
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Detail Sheet / Modal */}
            {showDetail && selectedNews && createPortal(
                <div className="modal-overlay !bg-slate-900/90 backdrop-blur-xl">
                    <div className="modal-content shadow-2xl dark:bg-slate-900 border dark:border-slate-800 overflow-hidden" style={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '1100px', maxHeight: '92vh', borderRadius: '48px' }}>
                        <div className="modal-header shrink-0 border-b dark:border-slate-800 px-6 py-5 flex justify-between items-center bg-white dark:bg-slate-800">
                            <div>
                                <h2 className="text-xl font-black flex items-center gap-3 dark:text-white uppercase tracking-tight" style={{ margin: 0 }}>
                                    Detalle Operativo
                                    <span className={`text-[9px] px-3 py-1 rounded-lg border font-black tracking-widest uppercase shadow-sm ${getStatusStyles(selectedNews.status).bg} ${getStatusStyles(selectedNews.status).border}`} style={{ color: isDarkMode ? getStatusStyles(selectedNews.status).darkColor : getStatusStyles(selectedNews.status).color, borderColor: isDarkMode ? getStatusStyles(selectedNews.status).darkColor : getStatusStyles(selectedNews.status).color }}>
                                        {getStatusStyles(selectedNews.status).label}
                                    </span>
                                </h2>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-1 ml-1">Radicado Interno: <span className="text-indigo-600 dark:text-indigo-400">#ND-{selectedNews.idSolicitud}</span></p>
                            </div>
                            <button onClick={() => setShowDetail(false)} className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-all p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                                <X size={24} />
                            </button>
                        </div>

                        
                        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-900/40 bespoke-scrollbar">
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
                                <div className="space-y-6" style={{ flex: '1 1 500px', minWidth: 0 }}>
                                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-[24px] shadow-sm">
                                        <h3 className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                            <UserIcon size={16} className="text-indigo-500" /> Perfil de la Solicitud
                                        </h3>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1.5rem' }}>
                                            <div className={`w-20 h-20 rounded-2xl flex-shrink-0 flex items-center justify-center font-black text-3xl text-white shadow-lg ${selectedNews.novedadCategoria === 'Empleado' ? 'bg-indigo-600' : selectedNews.novedadCategoria === 'Tienda' ? 'bg-amber-500' : 'bg-purple-600'}`}>
                                                {(selectedNews.empleadoNombre || selectedNews.storeNombre || selectedNews.brandNombre)?.[0]}
                                            </div>
                                            <div className="text-center sm:text-left pt-1">
                                                <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight leading-tight mb-2">
                                                    {selectedNews.empleadoNombre || selectedNews.storeNombre || selectedNews.brandNombre}
                                                </h3>
                                                <div className="flex flex-wrap justify-center sm:justify-start gap-3">
                                                    <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700">
                                                        {selectedNews.empleadoCedula ? `C.C. ${selectedNews.empleadoCedula}` : `Unidad: ${selectedNews.novedadCategoria}`}
                                                    </span>
                                                    {selectedNews.storeNombre && (
                                                        <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-indigo-100 dark:border-indigo-800">
                                                            Sede: {selectedNews.storeNombre}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-[24px] shadow-sm">
                                        <h3 className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                            <FileText size={16} className="text-indigo-500" /> Parámetros de Tiempo
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                                                <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-widest mb-2 px-1">Concepto</p>
                                                <p className="text-lg font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-tight">{selectedNews.novedadTipoNombre}</p>
                                            </div>
                                            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                                                <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-widest mb-2">Vigencia Periodo</p>
                                                <p className="text-base font-black text-slate-700 dark:text-slate-200">
                                                    {new Date(selectedNews.fechaInicio).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    <span className="mx-2 opacity-30">—</span>
                                                    {new Date(selectedNews.fechaFin).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </p>
                                            </div>

                                            {selectedNews.datosDinamicos && (
                                                <div className="col-span-1 sm:col-span-2 pt-4 border-t dark:border-slate-800">
                                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-[0.2em] mb-4 px-1">Campos Adicionales Capturados</p>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {Object.entries(JSON.parse(selectedNews.datosDinamicos || '{}')).map(([key, val]) => (
                                                            <div key={key} className="flex justify-between items-center p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
                                                                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{key}</span>
                                                                <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase">{val === 'true' ? 'Activado' : val === 'false' ? 'Desactivado' : val}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6" style={{ flex: '1 1 350px', minWidth: 0 }}>
                                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-[24px] shadow-sm">
                                        <h3 className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                            <MessageSquare size={16} className="text-indigo-500" /> Exposición de Motivos
                                        </h3>
                                        <div className="rounded-3xl p-6 bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 min-h-[120px]">
                                            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-bold italic" style={{ margin: 0 }}>
                                                "{selectedNews.observaciones || 'Sin aclaraciones adicionales por parte del solicitante.'}"
                                            </p>
                                        </div>
                                    </div>

                                    {selectedNews.adjuntoUrl && (
                                        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-[24px] shadow-sm text-center">
                                             <h3 className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center justify-center gap-2">
                                                <Paperclip size={16} className="text-indigo-500" /> Soporte Documental
                                            </h3>
                                             <a href={selectedNews.adjuntoUrl} target="_blank" rel="noreferrer" 
                                                className="inline-flex btn-premium btn-premium-secondary !h-14 !px-10 !text-xs !font-black !rounded-2xl !w-full sm:!w-auto">
                                                <FileCheck size={20} className="mr-3" /> Visualizar Evidencia
                                             </a>
                                        </div>
                                    )}

                                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[24px] shadow-sm overflow-hidden">
                                        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800 border-b dark:border-slate-800">
                                            <h3 className="text-[9px] font-black text-slate-800 dark:text-white uppercase tracking-[0.2em] flex items-center gap-2" style={{ margin: 0 }}>
                                                <History size={16} className="text-indigo-500" /> Trazabilidad
                                            </h3>
                                        </div>
                                        <div className="p-6">
                                             <div className="relative pl-8 space-y-8">
                                                <div className="absolute left-1 top-2 bottom-2 w-0.5 bg-slate-100 dark:bg-slate-800"></div>
                                                
                                                {selectedNews.logs && selectedNews.logs.map((log, idx) => (
                                                    <div key={idx} className="relative">
                                                         <div className={`absolute -left-[35px] top-1.5 w-4 h-4 rounded-full border-4 border-white dark:border-slate-900 shadow-sm ${log.accion === 'Creó' ? 'bg-indigo-500' : log.accion === 'Aprobó' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                                                         <div className="flex justify-between items-start mb-1">
                                                            <p className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tight">{log.accion} Solicitud</p>
                                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                                {new Date(log.fechaHoraColombia).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                                                            </p>
                                                         </div>
                                                         <p className="text-[10px] text-slate-500 dark:text-slate-500 font-bold uppercase tracking-widest">
                                                            {log.usuario} <span className="mx-1.5 opacity-30">•</span> {new Date(log.fechaHoraColombia).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                         </p>
                                                         {log.comentario && log.comentario !== 'Registro inicial de la novedad.' && (
                                                            <div className="mt-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 italic">
                                                                <p className="text-[11px] text-slate-600 dark:text-slate-300 font-bold leading-relaxed">"{log.comentario}"</p>
                                                            </div>
                                                         )}
                                                    </div>
                                                ))}
                                             </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer shrink-0 p-6 bg-white dark:bg-slate-900 border-t dark:border-slate-800" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'flex-end' }}>
                            {selectedNews.status === 0 ? (
                                <>
                                    <button onClick={() => { setActionType('Reject'); setActionComment(''); setShowActionModal(true); }} className="btn-premium btn-premium-danger !h-14 flex-1 text-[11px] font-black uppercase tracking-[0.1em]">
                                        <FileX size={18} className="mr-2" /> Denegar
                                    </button>
                                    <button onClick={() => { setActionType('Approve'); setActionComment(''); setShowActionModal(true); }} className="btn-premium btn-premium-primary !h-14 flex-1 text-[11px] font-black uppercase tracking-[0.1em]">
                                        <FileCheck size={18} className="mr-2" /> Aprobar
                                    </button>
                                </>
                            ) : (
                                <button onClick={() => setShowDetail(false)} className="btn-premium btn-premium-secondary !h-14 w-full text-[11px] font-black uppercase tracking-[0.15em]">
                                    Cerrar Expediente
                                </button>
                            )}
                        </div>
                    </div>
                </div>,
                document.getElementById('modal-root')
            )}

            {/* Action Modal */}
            {showActionModal && createPortal(
                <div className="modal-overlay !z-[10001] !bg-slate-900/95 backdrop-blur-xl">
                    <div className="modal-content shadow-2xl dark:bg-slate-900 border dark:border-slate-800"
                         style={{ 
                             position: 'fixed', 
                             top: '50%', 
                             left: '50%', 
                             transform: 'translate(-50%, -50%)',
                             maxWidth: '540px',
                             borderRadius: '48px',
                             padding: '4rem'
                         }}>
                        <div className="text-center">
                            <div className={`mx-auto mb-8 w-24 h-24 rounded-[32px] flex items-center justify-center shadow-lg animate-pulse-subtle ${actionType === 'Approve' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                                {actionType === 'Approve' ? <CheckCircle size={48} /> : <XCircle size={48} />}
                            </div>
                            <h2 className="text-3xl font-black mb-3 dark:text-white uppercase tracking-tight">¿Confirmar Acción?</h2>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-bold mb-10 leading-relaxed px-4">
                                Estás por <span className="dark:text-white underline decoration-2 underline-offset-4">{actionType === 'Approve' ? 'Aprobar' : 'Rechazar'}</span> este registro. Esta acción quedará vinculada permanentemente a tu perfil de auditoría.
                            </p>
                            
                            <div className="text-left mb-10">
                                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 ml-1">Justificación Administrativa</label>
                                <textarea 
                                    required
                                    value={actionComment}
                                    onChange={(e) => setActionComment(e.target.value)}
                                    placeholder="Escribe el motivo técnico de la decisión..."
                                    className="input-premium dark:bg-slate-900 min-h-[120px] !text-sm !font-bold"
                                />
                            </div>

                            <div className="flex gap-4">
                                <button onClick={() => setShowActionModal(false)} className="btn-premium btn-premium-secondary !h-16 flex-1 text-xs font-black uppercase tracking-widest" disabled={isSubmitting}>
                                    Volver
                                </button>
                                <button onClick={handleAction} className={`btn-premium !h-16 flex-1 text-xs font-black uppercase tracking-widest shadow-xl ${actionType === 'Approve' ? 'btn-premium-primary shadow-indigo-100' : 'btn-premium-danger shadow-red-100 dark:shadow-none'}`} disabled={isSubmitting}>
                                    {isSubmitting ? <div className="loader !border-white !w-5 !h-5"></div> : actionType === 'Approve' ? 'Confirmar' : 'Confirmar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.getElementById('modal-root')
            )}

            {/* News Request Modal */}
            {showRequest && createPortal(
                <div className="modal-overlay !z-[10001] !bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-6">
                    <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-[48px] shadow-2xl bespoke-scrollbar"
                         style={{ position: 'relative' }}>
                        <NewsRequest 
                            onComplete={() => { setShowRequest(false); fetchNews(); }} 
                            onCancel={() => setShowRequest(false)} 
                        />
                    </div>
                </div>,
                document.getElementById('modal-root')
            )}

            {toast.show && (
                <div className="toast-container !z-[10002]">
                    <div className={`toast shadow-2xl ${toast.type === 'success' ? 'toast-success bg-emerald-500 text-white' : 'toast-error bg-red-500 text-white'}`}>
                        {toast.type === 'success' ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
                        <span className="font-black uppercase tracking-tight">{toast.message}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NewsInbox;
