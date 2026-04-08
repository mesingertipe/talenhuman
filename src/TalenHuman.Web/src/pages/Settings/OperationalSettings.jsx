import React, { useState, useEffect } from 'react';
import { 
    Settings, Shield, Bell, Mail, Smartphone, Save, 
    CheckCircle, Clock, ListOrdered, UserCheck, Users, Info, AlertCircle,
    Zap, Sparkles, AlertTriangle, ShieldCheck, X, HelpCircle
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
        enableEmailNotifications: true
    });
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

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
        console.log("Triggering confirmation modal...");
        setShowConfirm(true);
    };

    const confirmSave = async () => {
        setShowConfirm(false);
        try {
            setSaving(true);
            // Payload exacto para el UpdateOperationalSettingsDto
            const payload = {
                attendanceMode: parseInt(settings.attendanceMode),
                shiftApprovalMode: parseInt(settings.shiftApprovalMode),
                enablePushNotifications: !!settings.enablePushNotifications,
                enableEmailNotifications: !!settings.enableEmailNotifications
            };
            
            console.log("Sending payload:", payload);
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
        <div className={`min-h-screen ${isDarkMode ? 'dark' : ''} bg-[#f1f5f9] dark:bg-[#020617] p-4 md:p-10 transition-all duration-500 font-inter`}>
            
            <div className="max-w-6xl mx-auto space-y-8">
                
                {/* Header Action Bar - Premium & Professional */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 px-10 py-8 rounded-[40px] shadow-sm border border-slate-200/60 dark:border-white/5">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-indigo-600/20 transition-transform hover:rotate-3 active:scale-95">
                            <Settings size={28} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-[900] text-slate-900 dark:text-white tracking-tight">Opciones Operativas</h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">Configuración Administrativa V15</p>
                        </div>
                    </div>
                    
                    <button 
                        onClick={handleSaveRequest}
                        disabled={saving}
                        className="group relative flex items-center gap-4 bg-indigo-600 hover:bg-slate-900 dark:hover:bg-white dark:hover:text-black text-white px-10 py-5 rounded-[22px] font-[1000] text-[11px] uppercase tracking-[0.2em] transition-all duration-300 shadow-[0_20px_40px_-10px_rgba(79,70,229,0.35)] hover:shadow-[0_25px_50px_-12px_rgba(79,70,229,0.5)] hover:translate-y-[-2px] active:scale-95 disabled:grayscale overflow-hidden"
                    >
                        {/* Glow effect on hover */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                        
                        {saving ? (
                            <div className="animate-spin h-5 w-5 border-2 border-white rounded-full border-t-transparent"></div>
                        ) : (
                            <Save size={18} strokeWidth={3} className="relative z-10 transition-transform group-hover:rotate-12" />
                        )}
                        <span className="relative z-10">{saving ? 'EJECUTANDO SYNC...' : 'APLICAR CAMBIOS'}</span>
                    </button>
                </div>

                <div className="grid lg:grid-cols-12 gap-8">
                    
                    {/* Main Content Sections */}
                    <div className="lg:col-span-8 space-y-8">
                        
                        {/* MOTOR DE ASISTENCIA */}
                        <div className="bg-white dark:bg-slate-900 p-10 rounded-[48px] shadow-sm border border-slate-200/60 dark:border-white/5 space-y-8">
                            <div className="flex items-center gap-4">
                                <Clock size={20} className="text-indigo-600" />
                                <h3 className="text-[11px] font-[1000] text-slate-400 uppercase tracking-widest">Motor de Asistencia</h3>
                            </div>
                            
                            <div className="grid md:grid-cols-2 gap-6">
                                <PremiumModeCard 
                                    active={settings.attendanceMode === 0}
                                    onClick={() => setSettings({...settings, attendanceMode: 0})}
                                    title="Protocolo Min-Max"
                                    description="Optimización basada en marcas extremas."
                                    icon={<Smartphone size={22} />}
                                />
                                <PremiumModeCard 
                                    active={settings.attendanceMode === 1}
                                    onClick={() => setSettings({...settings, attendanceMode: 1})}
                                    title="Modo Secuencial"
                                    description="Auditoría total de registros intermedios."
                                    icon={<ListOrdered size={22} />}
                                />
                            </div>
                        </div>

                        {/* FLUJO DE APROBACIÓN */}
                        <div className="bg-white dark:bg-slate-900 p-10 rounded-[48px] shadow-sm border border-slate-200/60 dark:border-white/5 space-y-8">
                            <div className="flex items-center gap-4">
                                <Shield size={20} className="text-indigo-600" />
                                <h3 className="text-[11px] font-[1000] text-slate-400 uppercase tracking-widest">Flujo de Aprobación</h3>
                            </div>
                            
                            <div className="grid md:grid-cols-2 gap-6">
                                <PremiumModeCard 
                                    active={settings.shiftApprovalMode === 0}
                                    onClick={() => setSettings({...settings, shiftApprovalMode: 0})}
                                    title="Nivel Central (RH)"
                                    description="Validación unificada en gestión centralizada."
                                    icon={<Users size={22} />}
                                />
                                <PremiumModeCard 
                                    active={settings.shiftApprovalMode === 1}
                                    onClick={() => setSettings({...settings, shiftApprovalMode: 1})}
                                    title="Nivel Distrital"
                                    description="Delegación a gerencia regional y distrital."
                                    icon={<UserCheck size={22} />}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Notification Sidebar - Consistency Update */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] shadow-sm border border-slate-200/60 dark:border-white/5 space-y-8 h-full flex flex-col">
                            <div className="flex items-center gap-3">
                                <Bell size={18} className="text-indigo-600" />
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Alertas Smart</h3>
                            </div>
                            
                            <div className="space-y-4 flex-grow">
                                <UserStyleSwitchCard 
                                    icon={<Mail size={20} />}
                                    title="Reporte vía Email"
                                    active={settings.enableEmailNotifications}
                                    onChange={(val) => setSettings({...settings, enableEmailNotifications: val})}
                                />
                                <UserStyleSwitchCard 
                                    icon={<Smartphone size={20} />}
                                    title="Notificaciones Push"
                                    active={settings.enablePushNotifications}
                                    onChange={(val) => setSettings({...settings, enablePushNotifications: val})}
                                />
                            </div>
                            
                            <div className="mt-8 p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/5">
                                <div className="flex gap-4">
                                    <ShieldCheck size={20} className="text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                                    <div>
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white mb-1">Seguridad Activa</h4>
                                        <p className="text-[9px] font-bold text-slate-400 italic">
                                            Logs auditados en cada cambio operativo.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirmation Modal - Precise 'New User' Style */}
            {showConfirm && (
                <div className="fixed inset-0 z-[5000] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-xl animate-in fade-in duration-500">
                    <div className="bg-white dark:bg-[#0f172a] w-full max-w-md rounded-[48px] shadow-[0_80px_150px_-30px_rgba(0,0,0,0.7)] overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300">
                        {/* Header Elite */}
                        <div className="flex items-center justify-between px-10 py-8 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-indigo-600 text-white rounded-[18px] flex items-center justify-center shadow-xl shadow-indigo-600/30">
                                    <Shield size={22} strokeWidth={3} />
                                </div>
                                <h3 className="text-xl font-[1000] text-slate-900 dark:text-white tracking-tighter">Seguridad de Red</h3>
                            </div>
                            <button 
                                onClick={() => setShowConfirm(false)}
                                className="w-10 h-10 border border-slate-200 dark:border-white/10 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 transition-all active:scale-90"
                            >
                                <X size={20} strokeWidth={3} />
                            </button>
                        </div>
                        
                        <div className="p-12 text-center">
                            <div className="relative w-24 h-24 mx-auto mb-8">
                                <div className="absolute inset-0 bg-indigo-600/10 rounded-[32px] animate-ping"></div>
                                <div className="relative w-24 h-24 bg-indigo-600/10 text-indigo-600 rounded-[32px] flex items-center justify-center">
                                    <AlertTriangle size={48} strokeWidth={2.5} />
                                </div>
                            </div>
                            <h4 className="text-2xl font-[1000] text-slate-900 dark:text-white mb-4 tracking-tight">¿Sincronizar Kernel?</h4>
                            <p className="text-[12px] font-bold text-slate-400 leading-relaxed max-w-[280px] mx-auto uppercase tracking-widest">
                                Los protocolos de asistencia se actualizarán de forma irreversible para toda la organización.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 p-10 bg-slate-50 dark:bg-[#020617]/50">
                            <button 
                                onClick={confirmSave}
                                className="w-full py-5 rounded-[22px] bg-indigo-600 text-white font-[1000] text-[11px] uppercase tracking-[0.2em] hover:bg-slate-900 dark:hover:bg-white dark:hover:text-black transition-all active:scale-95 shadow-2xl shadow-indigo-600/20"
                            >
                                EJECUTAR SINCRONIZACIÓN
                            </button>
                            <button 
                                onClick={() => setShowConfirm(false)}
                                className="w-full py-5 rounded-[22px] font-black text-[11px] uppercase tracking-[0.2em] text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-white/5 transition-all active:scale-95"
                            >
                                CANCELAR OPERACIÓN
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Precision Toast */}
            {toast.show && (
                <div className={`fixed bottom-10 right-10 flex items-center gap-5 px-10 py-6 rounded-3xl shadow-2xl animate-in slide-in-from-right-10 z-[3000] border border-white/10 ${toast.type === 'error' ? 'bg-rose-600 text-white' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-950'}`}>
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                         {toast.type === 'error' ? <AlertCircle size={22} /> : <CheckCircle size={22} className={isDarkMode ? 'text-indigo-600' : 'text-emerald-400'} />}
                    </div>
                    <span className="text-[12px] font-black uppercase tracking-[0.2em]">{toast.message}</span>
                </div>
            )}
        </div>
    );
};

const PremiumModeCard = ({ active, onClick, title, description, icon }) => {
    return (
        <div 
            onClick={onClick}
            className={`group p-8 rounded-[40px] border-2 cursor-pointer transition-all duration-300 flex flex-col gap-6 relative overflow-hidden ${active ? 'border-indigo-600 bg-white dark:bg-indigo-600/5 shadow-xl shadow-indigo-600/5 ring-4 ring-indigo-600/5' : 'border-slate-100 dark:border-white/5 bg-transparent opacity-70 hover:opacity-100 hover:border-slate-200 dark:hover:border-white/10'}`}
        >
            <div className="flex justify-between items-start">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${active ? 'bg-indigo-600 text-white shadow-xl' : 'bg-slate-100 dark:bg-white/5 text-slate-400 group-hover:bg-slate-200'}`}>
                    {React.cloneElement(icon, { strokeWidth: 2.5 })}
                </div>
                {active && <CheckCircle size={24} className="text-indigo-600 animate-in zoom-in-50" />}
            </div>
            <div>
                <h4 className={`text-lg font-[900] tracking-tight mb-2 ${active ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-400'}`}>{title}</h4>
                <p className={`text-[12px] font-bold leading-relaxed ${active ? 'text-indigo-600/70' : 'text-slate-400'}`}>{description}</p>
            </div>
        </div>
    );
};

const UserStyleSwitchCard = ({ icon, title, active, onChange }) => {
    return (
        <div 
            className="flex items-center justify-between bg-white dark:bg-slate-900 p-8 rounded-[38px] border border-slate-200/60 dark:border-white/5 shadow-md hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer group"
            onClick={() => onChange(!active)}
        >
            <div className="flex items-center gap-5">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${active ? 'bg-indigo-600 text-white' : 'bg-slate-50 dark:bg-white/5 text-slate-400 group-hover:text-slate-600'}`}>
                    {icon}
                </div>
                <div>
                   <div className="flex items-center gap-2">
                        <span className={`text-[15px] font-[1000] tracking-tight transition-colors ${active ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>{title}</span>
                        <HelpCircle size={14} className="text-slate-300" />
                   </div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Status: {active ? 'On' : 'Off'}</p>
                </div>
            </div>
            
            <div className={`w-14 h-8 rounded-full p-1.5 transition-all duration-300 relative ${active ? 'bg-indigo-600 shadow-lg shadow-indigo-600/30' : 'bg-slate-200 dark:bg-white/10'}`}>
                <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-300 transform ${active ? 'translate-x-6' : 'translate-x-0'}`}></div>
            </div>
        </div>
    );
};

export default OperationalSettings;
