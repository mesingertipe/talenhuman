import React, { useState, useEffect } from 'react';
import { 
    Activity, Search, ShieldAlert, Download, X, 
    Trash2, AlertCircle, Database, Calendar
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';
import * as XLSX from 'xlsx';

const AuditLogs = () => {
    const { isDarkMode } = useTheme();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cleaning, setCleaning] = useState(false);
    const [showClearModal, setShowClearModal] = useState(false);
    const [daysToKeep, setDaysToKeep] = useState("60");
    
    // Filters
    const [filters, setFilters] = useState({
        startDate: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        actionType: '',
        entityType: '',
        limit: 100
    });

    const activeColors = {
        bg: isDarkMode ? '#0f172a' : '#f8fafc',
        card: isDarkMode ? '#1e293b' : '#ffffff',
        border: isDarkMode ? '#334155' : '#f1f5f9',
        textMain: isDarkMode ? '#f1f5f9' : '#1e293b',
        textMuted: isDarkMode ? '#94a3b8' : '#64748b',
        accent: '#4f46e5',
        success: '#10b981',
        danger: '#ef4444'
    };

    useEffect(() => {
        fetchLogs();
    }, [filters]);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);
            if (filters.actionType) params.append('actionType', filters.actionType);
            if (filters.entityType) params.append('entityType', filters.entityType);
            params.append('limit', filters.limit);
            
            const res = await api.get(`/auditlogs?${params.toString()}`);
            setLogs(res.data);
        } catch (error) {
            console.error("Error fetching logs", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCleanup = () => {
        setShowClearModal(true);
    };

    const executeCleanup = async () => {
        if (!daysToKeep || isNaN(daysToKeep)) return;

        try {
            setCleaning(true);
            const res = await api.delete(`/auditlogs/clear?olderThanDays=${daysToKeep}`);
            setShowClearModal(false);
            fetchLogs();
            alert(res.data.message); // Could be replaced by a toast, but keeping alert for success is acceptable if toasts aren't registered
        } catch (err) {
            alert("Error al depurar registros.");
        } finally {
            setCleaning(false);
        }
    };

    const handleExport = () => {
        if (logs.length === 0) return alert("No hay datos para exportar");
        
        const data = logs.map(l => ({
            'Fecha y Hora': new Date(l.timestamp).toLocaleString('es-CO'),
            'Usuario': l.userName,
            'Acción': l.action,
            'Módulo/Entidad': l.entityType,
            'Detalles': l.details,
            'IP': l.ipAddress || 'N/A',
            'Éxito': l.isSuccess ? 'Sí' : 'No'
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Auditoria");
        XLSX.writeFile(wb, `TalenHuman_Auditoria_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const getActionColor = (action) => {
        if (action.includes("CREATE")) return activeColors.success;
        if (action.includes("DELETE") || action.includes("FAIL")) return activeColors.danger;
        if (action.includes("UPDATE")) return "#f59e0b";
        return activeColors.accent;
    };

    return (
        <div className="page-container animate-in fade-in duration-500" style={{ padding: '2rem 1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.2rem', fontWeight: '950', color: activeColors.textMain, margin: '0 0 8px 0', letterSpacing: '-0.03em', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <ShieldAlert size={32} className="text-indigo-500" /> Auditoría del Sistema
                    </h1>
                    <p style={{ color: activeColors.textMuted, fontSize: '0.9rem', fontWeight: '600', margin: 0 }}>
                        Trazabilidad y control de movimientos críticos en la plataforma
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                        onClick={handleExport}
                        style={{ padding: '10px 20px', borderRadius: '14px', fontWeight: '800', fontSize: '0.8rem', background: activeColors.card, color: activeColors.textMain, border: `1px solid ${activeColors.border}`, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                        <Download size={16} /> Exportar
                    </button>
                    <button 
                        onClick={handleCleanup}
                        disabled={cleaning}
                        style={{ padding: '10px 20px', borderRadius: '14px', fontWeight: '800', fontSize: '0.8rem', background: 'transparent', color: activeColors.danger, border: `1px solid ${activeColors.danger}`, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                        className="hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                    >
                        <Trash2 size={16} /> {cleaning ? 'Purgando...' : 'Purgar Antiguos'}
                    </button>
                </div>
            </div>

            {showClearModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s ease-out' }}>
                    <div style={{ background: activeColors.card, borderRadius: '24px', padding: '32px', maxWidth: '450px', width: '90%', border: `1px solid ${activeColors.border}`, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }} className="animate-in zoom-in-95 duration-200">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '1.4rem', fontWeight: '900', color: activeColors.textMain, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <AlertCircle size={24} className="text-red-500" />
                                Purgar Historial
                            </h2>
                            <button onClick={() => setShowClearModal(false)} style={{ background: 'none', border: 'none', color: activeColors.textMuted, cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>
                        <p style={{ color: activeColors.textMuted, fontSize: '0.95rem', fontWeight: '600', lineHeight: '1.6', marginBottom: '24px' }}>
                            ¿Estás completamente seguro de purgar los registros de auditoría? Indica cuántos días de historial reciente deseas conservar. Esta acción es <strong>irreversible</strong> y quedará registrada.
                        </p>
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: activeColors.textMuted, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Días a conservar (Ej: 60)
                            </label>
                            <input 
                                type="number" 
                                value={daysToKeep} 
                                onChange={(e) => setDaysToKeep(e.target.value)}
                                style={{ width: '100%', padding: '14px 16px', borderRadius: '14px', border: `2px solid ${activeColors.border}`, background: activeColors.bg, color: activeColors.textMain, fontSize: '1rem', fontWeight: '700', outline: 'none', transition: 'border 0.2s' }}
                                min="1"
                                className="focus:border-indigo-500"
                            />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button 
                                onClick={() => setShowClearModal(false)}
                                style={{ padding: '12px 24px', borderRadius: '14px', fontWeight: '800', fontSize: '0.9rem', color: activeColors.textMain, background: activeColors.bg, border: `1px solid ${activeColors.border}`, cursor: 'pointer' }}
                                className="hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={executeCleanup}
                                disabled={cleaning || !daysToKeep}
                                style={{ padding: '12px 24px', borderRadius: '14px', fontWeight: '800', fontSize: '0.9rem', color: '#fff', background: activeColors.danger, border: 'none', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                                className="hover:opacity-90 transition-opacity disabled:opacity-50"
                            >
                                <Trash2 size={18} /> {cleaning ? 'Procesando...' : 'Confirmar Purga'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="card" style={{ background: activeColors.card, borderRadius: '24px', border: `1px solid ${activeColors.border}`, padding: '24px', marginBottom: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '800', color: activeColors.textMuted, marginBottom: '8px', textTransform: 'uppercase' }}>Desde</label>
                        <input 
                            type="date"
                            value={filters.startDate}
                            onChange={e => setFilters(prev => ({...prev, startDate: e.target.value}))}
                            style={{ width: '100%', padding: '12px', borderRadius: '12px', border: `1px solid ${activeColors.border}`, background: activeColors.bg, color: activeColors.textMain, outline: 'none' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '800', color: activeColors.textMuted, marginBottom: '8px', textTransform: 'uppercase' }}>Hasta</label>
                        <input 
                            type="date"
                            value={filters.endDate}
                            onChange={e => setFilters(prev => ({...prev, endDate: e.target.value}))}
                            style={{ width: '100%', padding: '12px', borderRadius: '12px', border: `1px solid ${activeColors.border}`, background: activeColors.bg, color: activeColors.textMain, outline: 'none' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '800', color: activeColors.textMuted, marginBottom: '8px', textTransform: 'uppercase' }}>Acción</label>
                        <select 
                            value={filters.actionType}
                            onChange={e => setFilters(prev => ({...prev, actionType: e.target.value}))}
                            style={{ width: '100%', padding: '12px', borderRadius: '12px', border: `1px solid ${activeColors.border}`, background: activeColors.bg, color: activeColors.textMain, outline: 'none' }}
                        >
                            <option value="">Todas las acciones</option>
                            <option value="LOGIN">Acceso (Login)</option>
                            <option value="LOGIN_ATTEMPT">Intentos Fallidos</option>
                            <option value="CREATE">Creación</option>
                            <option value="UPDATE">Edición</option>
                            <option value="DELETE">Eliminación</option>
                            <option value="MASS_UPDATE">Actualización Masiva</option>
                            <option value="CHANGE_PASSWORD">Cambio de Clave</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '800', color: activeColors.textMuted, marginBottom: '8px', textTransform: 'uppercase' }}>Módulo</label>
                        <input 
                            type="text"
                            placeholder="Ej. User, Novedad, Store..."
                            value={filters.entityType}
                            onChange={e => setFilters(prev => ({...prev, entityType: e.target.value}))}
                            style={{ width: '100%', padding: '12px', borderRadius: '12px', border: `1px solid ${activeColors.border}`, background: activeColors.bg, color: activeColors.textMain, outline: 'none' }}
                        />
                    </div>
                </div>
            </div>

            <div className="card" style={{ background: activeColors.card, borderRadius: '24px', border: `1px solid ${activeColors.border}`, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: `2px solid ${activeColors.border}` }}>
                                <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.7rem', fontWeight: '900', color: activeColors.textMuted, textTransform: 'uppercase' }}>Fecha y Hora</th>
                                <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.7rem', fontWeight: '900', color: activeColors.textMuted, textTransform: 'uppercase' }}>Usuario / IP</th>
                                <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.7rem', fontWeight: '900', color: activeColors.textMuted, textTransform: 'uppercase' }}>Acción</th>
                                <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.7rem', fontWeight: '900', color: activeColors.textMuted, textTransform: 'uppercase' }}>Módulo</th>
                                <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.7rem', fontWeight: '900', color: activeColors.textMuted, textTransform: 'uppercase' }}>Detalles</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: activeColors.textMuted }}>
                                        <div className="flex flex-col items-center justify-center gap-4">
                                            <Database className="animate-pulse" size={32} />
                                            <span style={{ fontWeight: '800' }}>Cargando registros...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: activeColors.textMuted, fontWeight: '800' }}>No se encontraron registros de auditoría.</td>
                                </tr>
                            ) : (
                                logs.map(log => (
                                    <tr key={log.id} style={{ borderBottom: `1px solid ${activeColors.border}`, transition: 'background 0.2s' }} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <td style={{ padding: '16px', fontSize: '0.8rem', color: activeColors.textMain, whiteSpace: 'nowrap' }}>
                                            <div style={{ fontWeight: '800' }}>{new Date(log.timestamp).toLocaleDateString('es-CO')}</div>
                                            <div style={{ color: activeColors.textMuted }}>{new Date(log.timestamp).toLocaleTimeString('es-CO')}</div>
                                        </td>
                                        <td style={{ padding: '16px', fontSize: '0.85rem' }}>
                                            <div style={{ fontWeight: '800', color: activeColors.textMain }}>{log.userName}</div>
                                            <div style={{ fontSize: '0.7rem', color: activeColors.textMuted, fontFamily: 'monospace' }}>IP: {log.ipAddress || 'Interno'}</div>
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <span style={{ 
                                                padding: '4px 10px', 
                                                borderRadius: '20px', 
                                                fontSize: '0.7rem', 
                                                fontWeight: '900', 
                                                background: `${getActionColor(log.action)}15`, 
                                                color: getActionColor(log.action),
                                                border: `1px solid ${getActionColor(log.action)}30`
                                            }}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px', fontSize: '0.8rem', fontWeight: '800', color: activeColors.textMain }}>
                                            {log.entityType}
                                        </td>
                                        <td style={{ padding: '16px', fontSize: '0.8rem', color: activeColors.textMuted, maxWidth: '400px' }}>
                                            {!log.isSuccess && <AlertCircle size={14} className="inline mr-1 text-red-500" />}
                                            {log.details}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AuditLogs;
