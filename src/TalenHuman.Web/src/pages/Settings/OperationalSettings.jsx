import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
    Settings, Shield, Bell, Mail, Smartphone, Save, 
    CheckCircle, Clock, ListOrdered, UserCheck, Users, Info, AlertCircle,
    Zap, Sparkles, AlertTriangle, ShieldCheck, X, HelpCircle, Activity
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';

const OperationalSettings = () => {
    const { isDarkMode } = useTheme();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [settings, setSettings] = useState({
        id: null,
        attendanceMode: 0, 
        shiftApprovalMode: 0, 
        enablePushNotifications: true,
        enableEmailNotifications: true,
        checkInEarlyInfinite: true,
        checkInEarlyTolerance: 15,
        checkInLateTolerance: 15,
        checkOutTolerance: 15
    });
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    // Premium Color System (V12 Elite - Unified with Monitoring)
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
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const res = await api.get('/OperationalSettings');
            setSettings(res.data);
        } catch (err) {
            console.error("Error al cargar configuraciones", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveRequest = () => {
        setShowConfirm(true);
    };

    const confirmSave = async () => {
        setShowConfirm(false);
        try {
            setSaving(true);
            const payload = {
                attendanceMode: parseInt(settings.attendanceMode),
                shiftApprovalMode: parseInt(settings.shiftApprovalMode),
                enablePushNotifications: !!settings.enablePushNotifications,
                enableEmailNotifications: !!settings.enableEmailNotifications,
                checkInEarlyInfinite: !!settings.checkInEarlyInfinite,
                checkInEarlyTolerance: parseInt(settings.checkInEarlyTolerance ?? 15),
                checkInLateTolerance: parseInt(settings.checkInLateTolerance ?? 15),
                checkOutTolerance: parseInt(settings.checkOutTolerance ?? 15)
            };
            
            const res = await api.post('/OperationalSettings', payload);
            setSettings(res.data);
            showToast("Protocolos sincronizados exitosamente", "success");
        } catch (err) {
            console.error("Save error:", err);
            showToast("Error de comunicación con el núcleo", "error");
        } finally {
            setSaving(false);
        }
    };

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
            <div className="w-10 h-10 border-[2px] border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Cargando Sistema V15</p>
        </div>
    );

    return (
        <div className="page-container animate-in fade-in duration-500" style={{ padding: '2rem 1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
            
            {/* Header Elite Unified Style */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3rem', gap: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.2rem', fontWeight: '950', color: activeColors.textMain, margin: 0, letterSpacing: '-0.03em' }}>Configuraciones operativas</h1>
                    <p style={{ color: activeColors.textMuted, fontSize: '0.9rem', fontWeight: '600', marginTop: '6px' }}>Gestión de protocolos y parámetros de ejecución del núcleo</p>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button 
                        onClick={handleSaveRequest}
                        disabled={saving}
                        style={{ 
                            padding: '16px 32px', 
                            borderRadius: '18px', 
                            fontWeight: '800', 
                            fontSize: '0.8rem', 
                            textTransform: 'uppercase', 
                            border: 'none', 
                            background: activeColors.accent, 
                            color: 'white', 
                            cursor: 'pointer', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            gap: '10px', 
                            boxShadow: '0 10px 20px rgba(79, 70, 229, 0.3)',
                            transition: 'all 0.2s'
                        }}
                        className="hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                    >
                        {saving ? (
                            <div className="animate-spin h-5 w-5 border-2 border-white rounded-full border-t-transparent"></div>
                        ) : (
                            <Save size={20} />
                        )}
                        {saving ? 'SINCRONIZANDO...' : 'APLICAR CAMBIOS'}
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }} className="grid-cols-1 md:grid-cols-2">
                
                {/* MOTOR DE ASISTENCIA */}
                <div className="card" style={{ padding: '2.5rem', background: activeColors.card, borderRadius: '40px', border: `1px solid ${activeColors.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
                        <div style={{ padding: '12px', background: activeColors.accent + '15', color: activeColors.accent, borderRadius: '16px' }}>
                            <Activity size={28} />
                        </div>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: activeColors.textMain, margin: 0 }}>Motor de Asistencia</h2>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '900', textTransform: 'uppercase', color: activeColors.textMuted, marginBottom: '0.75rem', letterSpacing: '0.05em' }}>Protocolo de cálculo</label>
                            <div style={{ display: 'grid', gap: '10px', marginBottom: '1.5rem' }}>
                                <SelectionBlock 
                                    active={settings.attendanceMode === 0}
                                    onClick={() => setSettings({...settings, attendanceMode: 0})}
                                    title="Protocolo Min-Max"
                                    description="Optimización basada en marcas extremas diarias."
                                    icon={<Smartphone size={18} />}
                                    colors={activeColors}
                                />
                                <SelectionBlock 
                                    active={settings.attendanceMode === 1}
                                    onClick={() => setSettings({...settings, attendanceMode: 1})}
                                    title="Modo Secuencial"
                                    description="Auditoría total de todos los registros intermedios."
                                    icon={<ListOrdered size={18} />}
                                    colors={activeColors}
                                />
                            </div>
                        </div>

                        <div style={{ paddingTop: '1.5rem', borderTop: `1px solid ${activeColors.border}` }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '900', textTransform: 'uppercase', color: activeColors.textMuted, marginBottom: '1.25rem', letterSpacing: '0.05em' }}>Tolerancia de marcación</label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                
                                {/* Entrada Anticipada (Check-In Early) */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontSize: '0.9rem', fontWeight: '800', color: activeColors.textMain }}>Entrada Anticipada (Check-In temprano)</div>
                                            <div style={{ fontSize: '0.75rem', fontWeight: '600', color: activeColors.textMuted }}>Considerar correcto al marcar antes del turno</div>
                                        </div>
                                        <div 
                                            onClick={() => setSettings({...settings, checkInEarlyInfinite: !settings.checkInEarlyInfinite})}
                                            style={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                gap: '8px', 
                                                cursor: 'pointer',
                                                background: settings.checkInEarlyInfinite ? activeColors.accent + '15' : activeColors.border,
                                                padding: '6px 14px',
                                                borderRadius: '12px',
                                                border: `1px solid ${settings.checkInEarlyInfinite ? activeColors.accent : activeColors.border}`,
                                                color: settings.checkInEarlyInfinite ? activeColors.accent : activeColors.textMuted,
                                                transition: 'all 0.2s',
                                                fontSize: '0.75rem',
                                                fontWeight: '800'
                                            }}
                                        >
                                            {settings.checkInEarlyInfinite ? 'PERMITIDO SIEMPRE' : 'LIMITADO'}
                                        </div>
                                    </div>
                                    {!settings.checkInEarlyInfinite && (
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: activeColors.bg, borderRadius: '14px', border: `1px solid ${activeColors.border}`, marginTop: '4px' }}>
                                            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: activeColors.textMuted }}>Minutos de tolerancia anticipada:</span>
                                            <input 
                                                type="number"
                                                min="0"
                                                max="240"
                                                value={settings.checkInEarlyTolerance ?? 15}
                                                onChange={(e) => setSettings({...settings, checkInEarlyTolerance: Math.max(0, parseInt(e.target.value) || 0)})}
                                                style={{ 
                                                    width: '70px', 
                                                    padding: '6px', 
                                                    borderRadius: '8px', 
                                                    border: `1px solid ${activeColors.border}`, 
                                                    background: isDarkMode ? '#1e293b' : '#ffffff',
                                                    color: activeColors.textMain,
                                                    fontWeight: '800',
                                                    textAlign: 'center',
                                                    outline: 'none'
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Entrada Tardía (Check-In Late) */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: '800', color: activeColors.textMain }}>Entrada Tardía (Check-In tarde)</div>
                                        <div style={{ fontSize: '0.75rem', fontWeight: '600', color: activeColors.textMuted }}>Minutos permitidos de retraso</div>
                                    </div>
                                    <input 
                                        type="number"
                                        min="0"
                                        max="120"
                                        value={settings.checkInLateTolerance ?? 15}
                                        onChange={(e) => setSettings({...settings, checkInLateTolerance: Math.max(0, parseInt(e.target.value) || 0)})}
                                        style={{ 
                                            width: '70px', 
                                            padding: '8px', 
                                            borderRadius: '10px', 
                                            border: `1px solid ${activeColors.border}`, 
                                            background: isDarkMode ? '#1e293b' : '#ffffff',
                                            color: activeColors.textMain,
                                            fontWeight: '800',
                                            textAlign: 'center',
                                            outline: 'none'
                                        }}
                                    />
                                </div>

                                {/* Salida (Check-Out) */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: '800', color: activeColors.textMain }}>Tolerancia de Salida (Check-Out)</div>
                                        <div style={{ fontSize: '0.75rem', fontWeight: '600', color: activeColors.textMuted }}>Minutos permitidos de desfase al salir</div>
                                    </div>
                                    <input 
                                        type="number"
                                        min="0"
                                        max="120"
                                        value={settings.checkOutTolerance ?? 15}
                                        onChange={(e) => setSettings({...settings, checkOutTolerance: Math.max(0, parseInt(e.target.value) || 0)})}
                                        style={{ 
                                            width: '70px', 
                                            padding: '8px', 
                                            borderRadius: '10px', 
                                            border: `1px solid ${activeColors.border}`, 
                                            background: isDarkMode ? '#1e293b' : '#ffffff',
                                            color: activeColors.textMain,
                                            fontWeight: '800',
                                            textAlign: 'center',
                                            outline: 'none'
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* FLUJO DE APROBACIÓN */}
                <div className="card" style={{ padding: '2.5rem', background: activeColors.card, borderRadius: '40px', border: `1px solid ${activeColors.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
                        <div style={{ padding: '12px', background: '#ec489915', color: '#ec4899', borderRadius: '16px' }}>
                            <Shield size={28} />
                        </div>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: activeColors.textMain, margin: 0 }}>Flujo de Aprobación</h2>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '900', textTransform: 'uppercase', color: activeColors.textMuted, marginBottom: '0.75rem', letterSpacing: '0.05em' }}>Jerarquía de Validación</label>
                            <div style={{ display: 'grid', gap: '10px' }}>
                                <SelectionBlock 
                                    active={settings.shiftApprovalMode === 0}
                                    onClick={() => setSettings({...settings, shiftApprovalMode: 0})}
                                    title="Nivel Central (RH)"
                                    description="Gestión unificada para toda la organización."
                                    icon={<Users size={18} />}
                                    colors={activeColors}
                                />
                                <SelectionBlock 
                                    active={settings.shiftApprovalMode === 1}
                                    onClick={() => setSettings({...settings, shiftApprovalMode: 1})}
                                    title="Nivel Distrital / Tienda"
                                    description="Delegación a gerencia regional y de sede."
                                    icon={<UserCheck size={18} />}
                                    colors={activeColors}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* NOTIFICACIONES SMART */}
                <div className="card" style={{ padding: '2.5rem', background: activeColors.card, borderRadius: '40px', border: `1px solid ${activeColors.border}`, gridColumn: 'span 2' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
                        <div style={{ padding: '12px', background: activeColors.warning + '15', color: activeColors.warning, borderRadius: '16px' }}>
                            <Bell size={28} />
                        </div>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: activeColors.textMain, margin: 0 }}>Alertas Smart</h2>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }} className="grid-cols-1 md:grid-cols-2">
                        <SwitchBlock 
                            active={settings.enableEmailNotifications}
                            onChange={(val) => setSettings({...settings, enableEmailNotifications: val})}
                            title="Reporte vía Email"
                            description="Envío automático de PDFs de cierre diario."
                            icon={<Mail size={20} />}
                            colors={activeColors}
                        />
                        <SwitchBlock 
                            active={settings.enablePushNotifications}
                            onChange={(val) => setSettings({...settings, enablePushNotifications: val})}
                            title="Notificaciones Push"
                            description="Alertas instantáneas en dispositivos móviles."
                            icon={<Smartphone size={20} />}
                            colors={activeColors}
                        />
                    </div>
                </div>
            </div>

            {/* Confirmation Modal - PORTAL POWER V18.3 */}
            {showConfirm && createPortal(
                <div style={{ position: 'fixed', inset: 0, zIndex: 100000, background: isDarkMode ? 'rgba(15, 23, 42, 0.7)' : 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="animate-in zoom-in-95 duration-300" style={{ background: activeColors.card, padding: '3rem', borderRadius: '40px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', border: `1px solid ${activeColors.border}`, width: '90%', maxWidth: '440px', textAlign: 'center' }}>
                        <div style={{ margin: '0 auto 1.5rem auto', width: '72px', height: '72px', background: activeColors.accent + '15', color: activeColors.accent, borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ShieldCheck size={40} className="animate-pulse" />
                        </div>
                        <h3 style={{ fontSize: '1.6rem', fontWeight: '950', color: activeColors.textMain, marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>¿Sincronizar Kernel?</h3>
                        <p style={{ fontSize: '0.9rem', color: activeColors.textMuted, fontWeight: '600', marginBottom: '2.5rem', lineHeight: '1.6' }}>
                            Los protocolos de asistencia se actualizarán de forma irreversible para toda la organización.
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <button onClick={() => setShowConfirm(false)} style={{ padding: '16px', borderRadius: '18px', fontWeight: '800', fontSize: '0.8rem', textTransform: 'uppercase', border: `1px solid ${activeColors.border}`, background: 'transparent', color: activeColors.textMuted, cursor: 'pointer' }}>Cancelar</button>
                            <button onClick={confirmSave} style={{ padding: '16px', borderRadius: '18px', fontWeight: '800', fontSize: '0.8rem', textTransform: 'uppercase', border: 'none', background: activeColors.accent, color: 'white', cursor: 'pointer', boxShadow: `0 10px 20px ${activeColors.accent}30` }}>Sincronizar</button>
                        </div>
                    </div>
                </div>,
                document.getElementById('modal-root') || document.body
            )}

            {/* Precision Toast */}
            {toast.show && (
                <div style={{ position: 'fixed', bottom: '40px', right: '40px', padding: '18px 30px', background: toast.type === 'error' ? activeColors.danger : '#0f172a', color: 'white', borderRadius: '24px', fontWeight: '900', fontSize: '0.85rem', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', zIndex: 100000, display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {toast.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} className="text-emerald-400" />}
                    {toast.message}
                </div>
            )}
        </div>
    );
};

// Selection Block Component - Transplanted Style from Monitoring Labels and Inputs
const SelectionBlock = ({ active, onClick, title, description, icon, colors }) => {
    return (
        <div 
            onClick={onClick}
            style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '15px', 
                background: active ? colors.accent + '08' : colors.bg, 
                padding: '16px 20px', 
                borderRadius: '18px', 
                border: `2px solid ${active ? colors.accent : colors.border}`,
                cursor: 'pointer',
                transition: 'all 0.2s',
                position: 'relative'
            }}
            className="hover:translate-x-1 group"
        >
            <div style={{ padding: '10px', background: active ? colors.accent : colors.border, color: active ? 'white' : colors.textMuted, borderRadius: '12px', transition: 'all 0.2s' }}>
                {icon}
            </div>
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.95rem', fontWeight: '800', color: active ? colors.accent : colors.textMain }}>{title}</div>
                <div style={{ fontSize: '0.75rem', fontWeight: '600', color: colors.textMuted }}>{description}</div>
            </div>
            {active && (
                <div style={{ width: '24px', height: '24px', background: colors.accent, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                    <CheckCircle size={14} strokeWidth={3} />
                </div>
            )}
        </div>
    );
};

// Switch Block Component - Impactful and Minimal
const SwitchBlock = ({ active, onChange, title, description, icon, colors }) => {
    return (
        <div 
            onClick={() => onChange(!active)}
            style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                background: colors.bg, 
                padding: '18px 24px', 
                borderRadius: '24px', 
                border: `1px solid ${colors.border}`,
                cursor: 'pointer'
            }}
            className="hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
        >
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                <div style={{ color: active ? colors.accent : colors.textMuted }}>
                    {icon}
                </div>
                <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: '900', color: colors.textMain }}>{title}</div>
                    <div style={{ fontSize: '0.7rem', fontWeight: '600', color: colors.textMuted }}>{active ? 'Habilitado' : 'Desactivado'}</div>
                </div>
            </div>
            <div style={{ 
                width: '48px', 
                height: '24px', 
                borderRadius: '12px', 
                background: active ? colors.accent : colors.border, 
                position: 'relative',
                transition: 'all 0.3s'
            }}>
                <div style={{ 
                    width: '18px', 
                    height: '18px', 
                    background: 'white', 
                    borderRadius: '50%', 
                    position: 'absolute', 
                    top: '3px',
                    left: active ? '27px' : '3px',
                    transition: 'all 0.3s',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                }}></div>
            </div>
        </div>
    );
};

export default OperationalSettings;
