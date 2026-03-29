import React, { useState, useEffect } from 'react';
import { 
    Clock, Search, Filter, Calendar, User as UserIcon, 
    CheckCircle, AlertCircle, ArrowUpRight, ArrowDownLeft,
    Download, RefreshCw, LayoutGrid, ListTodo, X, MapPin
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';
import * as XLSX from 'xlsx';
import Pagination from '../../components/Shared/Pagination';
import { useTableData } from '../../hooks/useTableData';

const Marcaciones = ({ user }) => {
    const { isDarkMode } = useTheme();
    const [marcaciones, setMarcaciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [dateRange, setDateRange] = useState({
        start: new Date().toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    // Premium Color System (V12 Elite)
    const activeColors = {
        bg: isDarkMode ? '#0f172a' : '#f8fafc',
        card: isDarkMode ? '#1e293b' : '#ffffff',
        border: isDarkMode ? '#334155' : '#f1f5f9',
        textMain: isDarkMode ? '#f1f5f9' : '#1e293b',
        textMuted: isDarkMode ? '#94a3b8' : '#64748b',
        accent: '#4f46e5',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444'
    };

    const { 
        data: currentData, 
        searchTerm, 
        setSearchTerm, 
        currentPage, 
        setCurrentPage, 
        totalPages, 
        totalItems, 
        itemsPerPage, 
        setItemsPerPage 
    } = useTableData(marcaciones, ['employeeName', 'employeeId', 'storeName', 'statusText']);

    useEffect(() => {
        fetchMarcaciones();
    }, [dateRange]);

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    };

    const fetchMarcaciones = async () => {
        try {
            setLoading(true);
            const res = await api.get('/attendance', { 
                params: { 
                    start: dateRange.start, 
                    end: dateRange.end 
                } 
            });
            
            // RBAC Filtering client-side if needed, though better in API 
            // For now, let's assume the API handles basic multi-tenancy correctly 
            // But we'll add extra layer if user has specific store restrictions
            let filtered = res.data;
            const isGerente = user?.roles?.includes('Gerente');
            const isDistrital = user?.roles?.includes('Distrital');

            if (isGerente && user?.storeId) {
                filtered = filtered.filter(m => m.storeId === user.storeId);
            } else if (isDistrital && user?.storeIds) {
                filtered = filtered.filter(m => user.storeIds.includes(m.storeId));
            }

            setMarcaciones(filtered);
        } catch (err) {
            showToast("Error al cargar marcaciones", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async () => {
        try {
            setIsSyncing(true);
            await api.post('/attendance/consolidate', { date: dateRange.start });
            showToast("Consolidación completada");
            fetchMarcaciones();
        } catch (err) {
            showToast("Error en el proceso de consolidación", "error");
        } finally {
            setIsSyncing(false);
        }
    };

    const handleExport = () => {
        const data = marcaciones.map(m => ({
            Colaborador: m.employeeName,
            Número: m.employeeId,
            Sede: m.storeName,
            Entrada: m.clockIn ? new Date(m.clockIn).toLocaleString() : 'N/A',
            Salida: m.clockOut ? new Date(m.clockOut).toLocaleString() : 'N/A',
            Estado: m.statusText,
            Observación: m.statusObservation
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Marcaciones");
        XLSX.writeFile(wb, `Marcaciones_${dateRange.start}_al_${dateRange.end}.xlsx`);
    };

    const getStatusStyle = (status) => {
        switch(status) {
            case 0: return { bg: '#ecfdf5', text: '#059669', border: '#d1fae5', label: 'Correcto' }; // Correcto
            case 1: return { bg: '#fffbeb', text: '#d97706', border: '#fef3c7', label: 'Desfasado' }; // Desfasado
            case 2: return { bg: '#fef2f2', text: '#ef4444', border: '#fee2e2', label: 'Marcación Errada' };    // MarcacionErrada
            case 3: return { bg: '#f8fafc', text: '#64748b', border: '#e2e8f0', label: 'Sin Marcación' }; // SinMarcacion
            default: return { bg: '#f8fafc', text: '#64748b', border: '#e2e8f0', label: 'N/A' };
        }
    };

    return (
        <div className="page-container animate-in fade-in duration-500" style={{ padding: '2rem 1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
            {/* Elite Header & Toolbar */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4rem', gap: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.2rem', fontWeight: '950', color: activeColors.textMain, margin: 0, letterSpacing: '-0.03em' }}>Gestión de asistencia</h1>
                    <p style={{ color: activeColors.textMuted, fontSize: '0.9rem', fontWeight: '600', marginTop: '6px' }}>Control de marcaciones y trazabilidad de ingresos</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button 
                        onClick={handleExport}
                        style={{ background: activeColors.card, color: activeColors.textMain, padding: '14px 24px', borderRadius: '20px', border: `1px solid ${activeColors.border}`, fontWeight: '800', fontSize: '0.75rem', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.2s' }}
                        className="hover:bg-slate-50 active:scale-95"
                    >
                        <Download size={18} /> <span className="hidden md:inline">Exportar Excel</span>
                    </button>
                    {(user?.roles?.includes('Admin') || user?.roles?.includes('SuperAdmin')) && (
                        <button 
                            onClick={handleSync}
                            disabled={isSyncing}
                            style={{ background: activeColors.accent, color: 'white', padding: '14px 28px', borderRadius: '20px', border: 'none', fontWeight: '800', fontSize: '0.75rem', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 8px 15px rgba(79, 70, 229, 0.2)', transition: 'all 0.2s' }}
                            className="hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                        >
                            <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} /> 
                            {isSyncing ? 'Consolidando...' : 'Consolidar Ahora'}
                        </button>
                    )}
                </div>
            </div>

            {/* Filters Bar V12 */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '3rem', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: '1 1 400px', maxWidth: '600px' }}>
                    <Search style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={20} />
                    <input 
                        type="text" 
                        placeholder="Buscar por nombre o número de identificación..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ width: '100%', padding: '18px 24px 18px 56px', borderRadius: '24px', background: activeColors.card, border: `2px solid ${activeColors.border}`, color: activeColors.textMain, fontSize: '0.95rem', fontWeight: '600', transition: 'all 0.3s' }}
                        className="focus:border-indigo-500 focus:shadow-xl outline-none"
                    />
                </div>
                
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: activeColors.card, padding: '8px 20px', borderRadius: '24px', border: `2px solid ${activeColors.border}` }}>
                    <Calendar size={18} className="text-slate-400" />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input 
                            type="date" 
                            value={dateRange.start}
                            onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                            style={{ border: 'none', background: 'transparent', color: activeColors.textMain, fontWeight: '700', fontSize: '0.85rem', outline: 'none' }} 
                        />
                        <span className="text-slate-400 font-bold">→</span>
                        <input 
                            type="date" 
                            value={dateRange.end}
                            onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                            style={{ border: 'none', background: 'transparent', color: activeColors.textMain, fontWeight: '700', fontSize: '0.85rem', outline: 'none' }} 
                        />
                    </div>
                </div>
            </div>

            {/* Table Content */}
            <div className="card" style={{ padding: 0, overflow: 'hidden', minHeight: '500px' }}>
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-[500px] gap-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Cargando marcaciones...</p>
                    </div>
                ) : (
                    <>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: isDarkMode ? '#1e293b' : '#f8fafc', textAlign: 'left', borderBottom: `1px solid ${activeColors.border}` }}>
                                    <th style={{ padding: '1.5rem 2.5rem', fontSize: '0.75rem', fontWeight: '900', textTransform: 'uppercase', color: activeColors.textMuted, letterSpacing: '0.1em' }}>Colaborador / Número</th>
                                    <th style={{ padding: '1.5rem', fontSize: '0.75rem', fontWeight: '900', textTransform: 'uppercase', color: activeColors.textMuted, letterSpacing: '0.1em' }}>Sede</th>
                                    <th style={{ padding: '1.5rem', fontSize: '0.75rem', fontWeight: '900', textTransform: 'uppercase', color: activeColors.textMuted, letterSpacing: '0.1em' }}>Entrada</th>
                                    <th style={{ padding: '1.5rem', fontSize: '0.75rem', fontWeight: '900', textTransform: 'uppercase', color: activeColors.textMuted, letterSpacing: '0.1em' }}>Salida</th>
                                    <th style={{ padding: '1.5rem 2.5rem', fontSize: '0.75rem', fontWeight: '900', textTransform: 'uppercase', color: activeColors.textMuted, letterSpacing: '0.1em', textAlign: 'right' }}>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentData.map(m => {
                                    const st = getStatusStyle(m.status);
                                    return (
                                        <tr key={m.id} style={{ borderBottom: `1px solid ${activeColors.border}` }} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td style={{ padding: '1.5rem 2.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                                                    <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-xs">
                                                        {m.employeeName.split(' ')[0][0]}{m.employeeName.split(' ').pop()[0]}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: '0.9rem', fontWeight: '900', color: activeColors.textMain, textTransform: 'uppercase' }}>{m.employeeName}</div>
                                                        <p style={{ fontSize: '0.75rem', fontWeight: '600', color: activeColors.textMuted, margin: 0 }}>Número: {m.employeeId}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1.5rem' }}>
                                                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-bold text-sm">
                                                    <MapPin size={14} className="text-indigo-400" /> {m.storeName}
                                                </div>
                                            </td>
                                            <td style={{ padding: '1.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: m.clockIn ? activeColors.success : activeColors.textMuted, fontWeight: '900', fontSize: '0.85rem' }}>
                                                    <ArrowUpRight size={16} /> {m.clockIn ? new Date(m.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                                </div>
                                                {m.clockIn && <div className="text-[9px] font-black opacity-30 uppercase mt-0.5">{new Date(m.clockIn).toLocaleDateString()}</div>}
                                            </td>
                                            <td style={{ padding: '1.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: m.clockOut ? activeColors.accent : activeColors.textMuted, fontWeight: '900', fontSize: '0.85rem' }}>
                                                    <ArrowDownLeft size={16} /> {m.clockOut ? new Date(m.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                                </div>
                                                {m.clockOut && <div className="text-[9px] font-black opacity-30 uppercase mt-0.5">{new Date(m.clockOut).toLocaleDateString()}</div>}
                                            </td>
                                            <td style={{ padding: '1.5rem 2.5rem', textAlign: 'right' }}>
                                                <div className="flex flex-col items-end gap-1">
                                                    <span style={{ padding: '6px 14px', borderRadius: '99px', background: st.bg, color: st.text, fontSize: '0.7rem', fontWeight: '950', textTransform: 'uppercase', border: `1px solid ${st.border}` }}>
                                                        {st.label}
                                                    </span>
                                                    {m.statusObservation && <span className="text-[9px] font-bold text-slate-400 tracking-tight italic">{m.statusObservation}</span>}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {currentData.length === 0 && (
                                    <tr>
                                        <td colSpan="5" style={{ padding: '8rem 2rem', textAlign: 'center' }}>
                                            <div className="flex flex-col items-center gap-4 opacity-20">
                                                <ListTodo size={64} />
                                                <p className="font-black text-xl uppercase tracking-widest">Sin registros consolidados</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <Pagination 
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        totalItems={totalItems}
                        itemsPerPage={itemsPerPage}
                        onItemsPerPageChange={setItemsPerPage}
                    />
                    </>
                )}
            </div>

            {/* Toast Notification */}
            {toast.show && (
                <div style={{ position: 'fixed', bottom: '40px', right: '40px', padding: '18px 30px', background: toast.type === 'error' ? activeColors.danger : activeColors.success, color: 'white', borderRadius: '24px', fontWeight: '900', fontSize: '0.85rem', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', zIndex: 10000, display: 'flex', alignItems: 'center', gap: '12px', animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                    {toast.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
                    {toast.message}
                </div>
            )}

            <style>{`
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(40px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default Marcaciones;
