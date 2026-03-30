import React, { useState, useEffect } from 'react';
import { 
    Cpu, Clock, Save, Play, Search, AlertCircle, 
    CheckCircle, ListTodo, Activity, History, Settings, X, ShieldAlert, Trash2
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';
import { formatTenantDate } from '../../utils/localization';

const AttendanceMonitoring = () => {
    const { isDarkMode } = useTheme();
    const [user, setUser] = useState(null);
    const [settings, setSettings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [executing, setExecuting] = useState(false);
    const [showCleanupModal, setShowCleanupModal] = useState(false);
    const [progress, setProgress] = useState(0);
    const [dateRange, setDateRange] = useState({
        start: new Date().toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });
    const [cleaning, setCleaning] = useState(false);
    const [syncLogs, setSyncLogs] = useState([]);
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

    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (savedUser) setUser(JSON.parse(savedUser));
        fetchSettings();
        fetchSyncHistory();
    }, []);

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    };

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const res = await api.get('/systemsettings');
            const attendanceSettings = res.data.filter(s => s.group === 'Attendance');
            
            // Ensure defaults exist in state for UI
            const defaults = [
                { key: 'AttendanceConsolidationTime', value: '06:00', group: 'Attendance' },
                { key: 'BiometricRetentionDays', value: '7', group: 'Attendance' }
            ];
            
            const finalSettings = [...attendanceSettings];
            defaults.forEach(def => {
                if (!finalSettings.some(s => s.key === def.key)) {
                    finalSettings.push(def);
                }
            });

            setSettings(finalSettings);
        } catch (err) {
            showToast("Error al cargar configuración", "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchSyncHistory = async () => {
        try {
            const res = await api.get('/attendance/sync-history');
            setSyncLogs(res.data);
        } catch (err) {
            console.error("Error fetching sync logs:", err);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await api.post('/systemsettings/batch', settings);
            showToast("Configuración guardada correctamente");
        } catch (err) {
            showToast("Error al guardar configuración", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleManualExecute = async () => {
        try {
            setExecuting(true);
            setProgress(0);
            
            const startDate = new Date(dateRange.start + 'T00:00:00');
            const endDate = new Date(dateRange.end + 'T00:00:00');
            
            if (startDate > endDate) {
                showToast("La fecha de inicio no puede ser mayor que la de fin.", "error");
                setExecuting(false);
                return;
            }

            const datesToProcess = [];
            let currentDate = new Date(startDate);
            while (currentDate <= endDate) {
                datesToProcess.push(currentDate.toISOString().split('T')[0]);
                currentDate.setDate(currentDate.getDate() + 1);
            }

            let completed = 0;
            for (const date of datesToProcess) {
                await api.post('/attendance/consolidate', { date });
                completed++;
                setProgress(Math.round((completed / datesToProcess.length) * 100));
            }

            showToast(`Proceso de consolidación completado para ${datesToProcess.length} día(s)`);
            fetchSyncHistory();
        } catch (err) {
            const errorMsg = err.response?.data?.Message || err.message || "Error al iniciar consolidación";
            showToast(errorMsg.length > 100 ? errorMsg.substring(0, 97) + '...' : errorMsg, "error");
        } finally {
            setExecuting(false);
            setTimeout(() => setProgress(0), 1500);
        }
    };

    const handleCleanup = async () => {
        setShowCleanupModal(false);
        try {
            setCleaning(true);
            const res = await api.post('/attendance/cleanup');
            showToast(res.data.message || res.data.Message, "success");
        } catch (err) {
            const errorMsg = err.response?.data?.Message || err.message || "Error al realizar limpieza";
            showToast(errorMsg, "error");
        } finally {
            setCleaning(false);
        }
    };

    const updateSetting = (key, value) => {
        setSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s));
    };

    const getSettingValue = (key, defaultValue = '') => {
        const s = settings.find(s => s.key === key);
        return s ? s.value : defaultValue;
    };

    return (
        <div className="page-container animate-in fade-in duration-500" style={{ padding: '2rem 1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: '3rem' }}>
                <h1 style={{ fontSize: '2.2rem', fontWeight: '950', color: activeColors.textMain, margin: 0, letterSpacing: '-0.03em' }}>Monitoreo de asistencia</h1>
                <p style={{ color: activeColors.textMuted, fontSize: '0.9rem', fontWeight: '600', marginTop: '6px' }}>Control de procesos automáticos y consolidación de datos</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
                {/* Process Config */}
                <div className="card" style={{ padding: '2.5rem', background: activeColors.card, borderRadius: '40px', border: `1px solid ${activeColors.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                        <div style={{ padding: '12px', background: activeColors.accent + '15', color: activeColors.accent, borderRadius: '16px' }}>
                            <Settings size={28} />
                        </div>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: activeColors.textMain, margin: 0 }}>Configuración del Motor</h2>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '900', textTransform: 'uppercase', color: activeColors.textMuted, marginBottom: '0.75rem', letterSpacing: '0.05em' }}>Hora de ejecución diaria</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: activeColors.bg, padding: '14px 20px', borderRadius: '18px', border: `1px solid ${activeColors.border}` }}>
                                <Clock size={20} className="text-indigo-400" />
                                <input 
                                    type="time" 
                                    value={getSettingValue('AttendanceConsolidationTime', '06:00')}
                                    onChange={(e) => updateSetting('AttendanceConsolidationTime', e.target.value)}
                                    style={{ border: 'none', background: 'transparent', color: activeColors.textMain, fontWeight: '800', fontSize: '1.1rem', outline: 'none', width: '100%' }}
                                />
                            </div>
                            <p style={{ fontSize: '0.75rem', marginTop: '8px', color: activeColors.textMuted, fontWeight: '500' }}>El sistema cruzará marcaciones vs turnos automáticamente cada día a esta hora.</p>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '900', textTransform: 'uppercase', color: activeColors.textMuted, marginBottom: '0.75rem', letterSpacing: '0.05em' }}>Días de retención biométrica</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: activeColors.bg, padding: '14px 20px', borderRadius: '18px', border: `1px solid ${activeColors.border}` }}>
                                <History size={20} className="text-amber-500" />
                                <input 
                                    type="number" 
                                    min="1"
                                    max="90"
                                    value={getSettingValue('BiometricRetentionDays', '7')}
                                    onChange={(e) => updateSetting('BiometricRetentionDays', e.target.value)}
                                    style={{ border: 'none', background: 'transparent', color: activeColors.textMain, fontWeight: '800', fontSize: '1.1rem', outline: 'none', width: '100%' }}
                                />
                            </div>
                            <p style={{ fontSize: '0.75rem', marginTop: '8px', color: activeColors.textMuted, fontWeight: '500' }}>Los registros crudos más antiguos que este periodo serán eliminados para optimizar espacio.</p>
                        </div>

                        <div style={{ padding: '20px', background: isDarkMode ? '#0f172a' : '#f8fafc', borderRadius: '24px', border: '2px dashed ' + activeColors.border }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                <Activity size={18} className="text-emerald-500" />
                                <span style={{ fontWeight: '800', fontSize: '0.9rem', color: activeColors.textMain }}>Ejecución Manual por Rango</span>
                            </div>
                            <p style={{ fontSize: '0.8rem', color: activeColors.textMuted, marginBottom: '20px', lineHeight: '1.5' }}>Procesa o reprocesa la asistencia seleccionando un rango de fechas específico. Útil para reprocesamiento de días anteriores.</p>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: '900', textTransform: 'uppercase', color: activeColors.textMuted, marginBottom: '6px' }}>Desde</label>
                                    <input 
                                        type="date" 
                                        value={dateRange.start}
                                        onChange={e => setDateRange(prev => ({...prev, start: e.target.value}))}
                                        style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: `1px solid ${activeColors.border}`, background: activeColors.card, color: activeColors.textMain, outline: 'none', fontWeight: '700' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: '900', textTransform: 'uppercase', color: activeColors.textMuted, marginBottom: '6px' }}>Hasta</label>
                                    <input 
                                        type="date" 
                                        value={dateRange.end}
                                        onChange={e => setDateRange(prev => ({...prev, end: e.target.value}))}
                                        style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: `1px solid ${activeColors.border}`, background: activeColors.card, color: activeColors.textMain, outline: 'none', fontWeight: '700' }}
                                    />
                                </div>
                            </div>

                            {executing && (
                                <div style={{ marginBottom: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: '800', color: activeColors.accent, marginBottom: '6px' }}>
                                        <span>Procesando datos...</span>
                                        <span>{progress}%</span>
                                    </div>
                                    <div style={{ width: '100%', height: '8px', background: activeColors.border, borderRadius: '4px', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', background: activeColors.accent, width: `${progress}%`, transition: 'width 0.3s ease' }}></div>
                                    </div>
                                </div>
                            )}

                            <button 
                                onClick={handleManualExecute}
                                disabled={executing}
                                style={{ width: '100%', padding: '14px', borderRadius: '16px', fontWeight: '800', fontSize: '0.75rem', textTransform: 'uppercase', border: 'none', background: activeColors.success, color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 8px 15px rgba(16, 185, 129, 0.2)', marginBottom: '12px' }}
                                className="hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                            >
                                <Play size={18} className={executing ? 'animate-spin' : ''} /> {executing ? `Ejecutando (${progress}%)` : 'Ejecutar Consolidación'}
                            </button>

                            <button 
                                onClick={() => setShowCleanupModal(true)}
                                disabled={cleaning}
                                style={{ width: '100%', padding: '14px', borderRadius: '16px', fontWeight: '800', fontSize: '0.75rem', textTransform: 'uppercase', border: `1px solid ${activeColors.danger}`, background: 'transparent', color: activeColors.danger, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                                className="hover:bg-rose-50 dark:hover:bg-rose-950/20 active:scale-95 disabled:opacity-50"
                            >
                                <Trash2 size={18} className={cleaning ? 'animate-pulse' : ''} /> {cleaning ? 'Limpiando...' : 'Limpiar Registros Antiguos'}
                            </button>
                        </div>

                        <button 
                            onClick={handleSave}
                            disabled={saving}
                            style={{ padding: '16px', borderRadius: '18px', fontWeight: '800', fontSize: '0.8rem', textTransform: 'uppercase', border: 'none', background: activeColors.accent, color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 10px 20px rgba(79, 70, 229, 0.3)' }}
                            className="hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                        >
                            <Save size={20} /> {saving ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </div>

                {/* History / Logs */}
                <div className="card" style={{ padding: '2.5rem', background: activeColors.card, borderRadius: '40px', border: `1px solid ${activeColors.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                        <div style={{ padding: '12px', background: activeColors.warning + '15', color: activeColors.warning, borderRadius: '16px' }}>
                            <History size={28} />
                        </div>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: activeColors.textMain, margin: 0 }}>Historial de Sincronización</h2>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {syncLogs.length === 0 ? (
                            <p style={{ textAlign: 'center', color: activeColors.textMuted, fontSize: '0.8rem', padding: '2rem' }}>No hay historial disponible.</p>
                        ) : syncLogs.map((log, i) => (
                            <div key={log.id || i} style={{ padding: '1.5rem', background: activeColors.bg, borderRadius: '24px', border: `1px solid ${activeColors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: '800', color: activeColors.textMain }}>
                                        {formatTenantDate(log.startTime, user?.countryCode, null, { 
                                            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' 
                                        })}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                        <span style={{ fontSize: '0.65rem', fontWeight: '900', textTransform: 'uppercase', color: activeColors.textMuted }}>
                                            {log.executionType === 0 ? 'Manual' : 'Programado'}
                                        </span>
                                        <span style={{ height: '4px', width: '4px', borderRadius: '2px', background: activeColors.border }}></span>
                                        <span style={{ fontSize: '0.65rem', fontWeight: '900', textTransform: 'uppercase', color: log.status === 'Exitoso' ? activeColors.success : activeColors.danger }}>
                                            {log.status}
                                        </span>
                                        <span style={{ height: '4px', width: '4px', borderRadius: '2px', background: activeColors.border }}></span>
                                        <span style={{ fontSize: '0.65rem', fontWeight: '900', textTransform: 'uppercase', color: activeColors.textMuted }}>
                                            {log.durationSeconds?.toFixed(1)}s
                                        </span>
                                    </div>
                                    {log.errorMessage && (
                                        <p style={{ fontSize: '0.7rem', color: activeColors.danger, fontWeight: '700', marginTop: '6px' }}>
                                            <AlertCircle size={10} style={{ display: 'inline', marginRight: '4px' }} /> {log.errorMessage}
                                        </p>
                                    )}
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '1.25rem', fontWeight: '950', color: activeColors.textMain }}>{log.recordsProcessed}</div>
                                    <div style={{ fontSize: '0.6rem', fontWeight: '900', textTransform: 'uppercase', color: activeColors.textMuted }}>Marcaciones</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
        </div>

        {/* Premium Loading Overlay (V12 Elite) */}
        {executing && (
            <div style={{
                position: 'fixed', inset: 0, 
                background: isDarkMode ? 'rgba(15, 23, 42, 0.7)' : 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(8px)', zIndex: 10000,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
                <div className="animate-in zoom-in-95 duration-300" style={{
                    background: activeColors.card,
                    padding: '3rem', borderRadius: '40px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    border: `1px solid ${activeColors.border}`,
                    width: '90%', maxWidth: '500px', textAlign: 'center'
                }}>
                    <div className="relative" style={{ margin: '0 auto 2rem auto', width: '80px', height: '80px' }}>
                        <div className="animate-spin" style={{
                            position: 'absolute', inset: 0,
                            border: `4px solid ${activeColors.accent}20`,
                            borderTop: `4px solid ${activeColors.accent}`,
                            borderRadius: '50%'
                        }}></div>
                        <div style={{
                            position: 'absolute', inset: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: activeColors.accent
                        }}>
                            <Cpu size={32} className="animate-pulse" />
                        </div>
                    </div>

                    <h3 style={{ fontSize: '1.5rem', fontWeight: '950', color: activeColors.textMain, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>Consolidando Datos</h3>
                    <p style={{ fontSize: '0.9rem', color: activeColors.textMuted, fontWeight: '600', marginBottom: '2rem' }}>
                        Por favor espera. Estamos cruzando marcaciones biométricas con los turnos programados...
                    </p>

                    <div style={{ width: '100%', height: '12px', background: activeColors.border, borderRadius: '6px', overflow: 'hidden', marginBottom: '1rem' }}>
                        <div style={{
                            height: '100%', background: `linear-gradient(90deg, ${activeColors.accent}, #818cf8)`,
                            width: `${progress}%`, transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                        }}></div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: '900', textTransform: 'uppercase', color: activeColors.accent, letterSpacing: '0.1em' }}>
                            Progreso Total
                        </span>
                        <span style={{ fontSize: '1.1rem', fontWeight: '950', color: activeColors.textMain }}>
                            {progress}%
                        </span>
                    </div>
                </div>
            </div>
        )}

        {/* Premium Confirmation Modal (Cleanup) */}
        {showCleanupModal && (
            <div style={{
                position: 'fixed', inset: 0, 
                background: isDarkMode ? 'rgba(15, 23, 42, 0.8)' : 'rgba(15, 23, 42, 0.4)',
                backdropFilter: 'blur(10px)', zIndex: 10001,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
                <div className="animate-in zoom-in-95 duration-300" style={{
                    background: activeColors.card,
                    padding: '3rem', borderRadius: '40px',
                    boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.4)',
                    border: `1px solid ${activeColors.border}`,
                    width: '90%', maxWidth: '440px', textAlign: 'center'
                }}>
                    <div style={{ 
                        margin: '0 auto 1.5rem auto', width: '72px', height: '72px',
                        background: activeColors.danger + '15', color: activeColors.danger,
                        borderRadius: '24px', display: 'flex', alignItems: 'center', 
                        justifyContent: 'center'
                    }}>
                        <ShieldAlert size={40} className="animate-bounce" style={{ animationDuration: '2s' }} />
                    </div>

                    <h3 style={{ fontSize: '1.6rem', fontWeight: '950', color: activeColors.textMain, marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>¿Confirmar Limpieza?</h3>
                    <p style={{ fontSize: '0.9rem', color: activeColors.textMuted, fontWeight: '600', marginBottom: '2.5rem', lineHeight: '1.6' }}>
                        Esta acción eliminará permanentemente todos los registros biométricos crudos anteriores al periodo de retención. <span style={{ color: activeColors.danger, fontWeight: '800' }}>Esta acción no se puede deshacer.</span>
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <button 
                            onClick={() => setShowCleanupModal(false)}
                            style={{ padding: '16px', borderRadius: '18px', fontWeight: '800', fontSize: '0.8rem', textTransform: 'uppercase', border: `1px solid ${activeColors.border}`, background: 'transparent', color: activeColors.textMuted, cursor: 'pointer' }}
                            className="hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95"
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={handleCleanup}
                            style={{ padding: '16px', borderRadius: '18px', fontWeight: '800', fontSize: '0.8rem', textTransform: 'uppercase', border: 'none', background: activeColors.danger, color: 'white', cursor: 'pointer', boxShadow: `0 10px 20px ${activeColors.danger}30` }}
                            className="hover:scale-[1.03] active:scale-95 transition-all"
                        >
                            Sí, Eliminar
                        </button>
                    </div>
                </div>
            </div>
        )}

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

export default AttendanceMonitoring;
