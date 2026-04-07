import React, { useState, useEffect } from 'react';
import { 
    Settings, Shield, Bell, Mail, Smartphone, Save, 
    CheckCircle, Clock, ListOrdered, UserCheck, Users, Info, AlertCircle,
    Zap, X, AlertTriangle
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';

const OperationalSettings = () => {
    const { isDarkMode } = useTheme();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [settings, setSettings] = useState({
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
        setShowConfirm(true);
    };

    const confirmSave = async () => {
        setShowConfirm(false);
        try {
            setSaving(true);
            // Ensure we send only the relevant fields to avoid 400 if unnecessary fields are present
            const payload = {
                id: settings.id,
                attendanceMode: settings.attendanceMode,
                shiftApprovalMode: settings.shiftApprovalMode,
                enablePushNotifications: settings.enablePushNotifications,
                enableEmailNotifications: settings.enableEmailNotifications
            };
            await api.post('/OperationalSettings', payload);
            showToast("Protocolos actualizados exitosamente", "success");
        } catch (err) {
            showToast("Error en la sincronización de reglas", "error");
        } finally {
            setSaving(false);
        }
    };

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Sincronizando Kernel...</p>
        </div>
    );

    return (
        <div className={`min-h-screen ${isDarkMode ? 'dark' : ''} bg-slate-50 dark:bg-[#0b0f1a] transition-colors duration-500`}>
            
            <div className="max-w-5xl mx-auto py-12 px-6 relative z-10">
                
                {/* Header: Clean & Professional */}
                <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-8 border-b border-slate-200/60 dark:border-white/5 pb-10">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-[20px] flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-white/10 shadow-xl shadow-slate-200/50 dark:shadow-none">
                            <Settings size={30} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-[1000] text-slate-900 dark:text-white tracking-tight leading-tight">
                                Configuraciones <span className="text-indigo-600 dark:text-indigo-400">Operativas</span>
                            </h1>
                            <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">
                                Gestión de Inteligencia de Negocio y Reglas de Campo
                            </p>
                        </div>
                    </div>
                    
                    <button 
                        onClick={handleSaveRequest}
                        disabled={saving}
                        className="group relative flex items-center gap-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-10 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.15em] transition-all hover:scale-[1.02] active:scale-95 disabled:grayscale shadow-2xl"
                    >
                        {saving ? (
                            <div className="animate-spin h-5 w-5 border-2 border-current rounded-full border-t-transparent"></div>
                        ) : (
                            <Save size={18} className="transition-transform group-hover:rotate-12" />
                        )}
                        {saving ? 'Guardando...' : 'Aplicar Cambios'}
                    </button>
                </div>

                <div className="grid lg:grid-cols-12 gap-10">
                    
                    {/* Left Column (Main Rules) */}
                    <div className="lg:col-span-8 space-y-8">
                        
                        {/* 1. MOTOR DE ASISTENCIA */}
                        <div className="bg-white dark:bg-slate-800/40 p-8 md:p-10 rounded-[32px] border border-slate-200 dark:border-white/5 shadow-sm transition-all">
                           <div className="flex items-center gap-5 mb-10 border-b border-slate-100 dark:border-white/5 pb-8">
                                <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                    <Clock size={28} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black dark:text-white tracking-tight">Motor de Asistencia</h2>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Consolidación de Marcas Biométricas</p>
                                </div>
                           </div>

                           <div className="grid sm:grid-cols-2 gap-6">
                                <ModeOption 
                                    active={settings.attendanceMode === 0}
                                    onClick={() => setSettings({...settings, attendanceMode: 0})}
                                    icon={<Smartphone />}
                                    title="Protocolo Min-Max"
                                    description="Algoritmo que prioriza la primera y última marca del día."
                                    color="indigo"
                                />
                                <ModeOption 
                                    active={settings.attendanceMode === 1}
                                    onClick={() => setSettings({...settings, attendanceMode: 1})}
                                    icon={<ListOrdered />}
                                    title="Modo Secuencial"
                                    description="Auditoría cronológica total de todas las marcas registradas."
                                    color="slate"
                                />
                           </div>
                        </div>

                         {/* 2. FLUJO DE APROBACIÓN */}
                        <div className="bg-white dark:bg-slate-800/40 p-8 md:p-10 rounded-[32px] border border-slate-200 dark:border-white/5 shadow-sm transition-all">
                           <div className="flex items-center gap-5 mb-10 border-b border-slate-100 dark:border-white/5 pb-8">
                                <div className="w-14 h-14 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center text-amber-600 dark:text-amber-400">
                                    <Shield size={28} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black dark:text-white tracking-tight">Flujo de Aprobación</h2>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Autoridad Normativa de Turnos</p>
                                </div>
                           </div>

                           <div className="grid sm:grid-cols-2 gap-6">
                                <ModeOption 
                                    active={settings.shiftApprovalMode === 0}
                                    onClick={() => setSettings({...settings, shiftApprovalMode: 0})}
                                    icon={<Users />}
                                    title="RH Central"
                                    description="Un único equipo gestor aprueba toda la compañía."
                                    color="amber"
                                />
                                <ModeOption 
                                    active={settings.shiftApprovalMode === 1}
                                    onClick={() => setSettings({...settings, shiftApprovalMode: 1})}
                                    icon={<UserCheck />}
                                    title="Nivel Distrital"
                                    description="Validación regional delegada a Supervisores."
                                    color="emerald"
                                />
                           </div>
                        </div>
                    </div>

                    {/* Right Column (Side Rules) */}
                    <div className="lg:col-span-4 space-y-8">
                        
                        {/* 3. NOTIFICACIONES */}
                        <div className="bg-slate-900 dark:bg-slate-950 p-8 rounded-[32px] border border-slate-800 shadow-2xl text-white">
                            <div className="flex items-center gap-4 mb-10">
                                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-indigo-400">
                                    <Bell size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black tracking-tight">Alertas Smart</h3>
                                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-0.5">Notificaciones Push/Email</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <PremiumSwitch 
                                    icon={<Mail size={18} />}
                                    title="Reporte vía Email"
                                    active={settings.enableEmailNotifications}
                                    onChange={(val) => setSettings({...settings, enableEmailNotifications: val})}
                                />
                                <div className="h-px bg-white/5"></div>
                                <PremiumSwitch 
                                    icon={<Smartphone size={18} />}
                                    title="Push App Móvil"
                                    active={settings.enablePushNotifications}
                                    onChange={(val) => setSettings({...settings, enablePushNotifications: val})}
                                />
                            </div>
                            
                            <div className="mt-10 p-5 bg-indigo-500/10 rounded-2xl border border-indigo-500/10">
                                <div className="flex gap-4">
                                    <Zap size={16} className="text-indigo-500 flex-shrink-0 mt-0.5" />
                                    <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-wider">
                                        Sincronización instantánea tras validación.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Audit Note */}
                        <div className="bg-white dark:bg-slate-800/10 p-8 rounded-[32px] border border-slate-200 dark:border-white/5 shadow-sm">
                            <div className="flex items-start gap-4">
                                <Info className="text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-1" size={20} />
                                <div>
                                    <h4 className="text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-widest mb-3">Auditoría</h4>
                                    <p className="text-[11px] font-medium text-slate-400 leading-relaxed italic">
                                        "Los cambios en parámetros operativos generan una entrada irreversible en el Log de Auditoría."
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            {showConfirm && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 backdrop-blur-md bg-slate-900/60 transition-all animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[32px] shadow-[0_30px_100px_rgba(0,0,0,0.5)] overflow-hidden border border-white/10">
                        <div className="p-8">
                            <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mb-6">
                                <AlertTriangle size={32} />
                            </div>
                            <h3 className="text-2xl font-black dark:text-white tracking-tight mb-4">¿Confirmar Actualización?</h3>
                            <p className="text-sm font-bold text-slate-500 leading-relaxed">
                                Estos cambios afectarán el procesamiento de asistencia y los flujos de aprobación de toda la compañía de forma inmediata.
                            </p>
                        </div>
                        <div className="flex p-4 gap-4 bg-slate-50 dark:bg-slate-800/50">
                            <button 
                                onClick={() => setShowConfirm(false)}
                                className="flex-1 px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={confirmSave}
                                className="flex-1 px-6 py-4 rounded-2xl bg-indigo-600 text-white font-black text-[11px] uppercase tracking-widest shadow-xl shadow-indigo-600/30 hover:scale-[1.02] transition-all"
                            >
                                Confirmar y Aplicar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Corporate Toast */}
            {toast.show && (
                <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 px-10 py-6 rounded-full shadow-2xl animate-in slide-in-from-bottom-10 z-[1000] border border-white/20 ${toast.type === 'error' ? 'bg-rose-600 text-white' : 'bg-slate-900 text-white shadow-indigo-600/10'}`}>
                    {toast.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} className="text-emerald-400" />}
                    <p className="text-xs font-black uppercase tracking-widest">{toast.message}</p>
                </div>
            )}
        </div>
    );
};

const ModeOption = ({ active, onClick, icon, title, description, color }) => {
    const variants = {
        indigo: 'border-indigo-600 ring-4 ring-indigo-600/5 bg-indigo-50/20 dark:bg-indigo-600/5',
        amber: 'border-amber-500 ring-4 ring-amber-500/5 bg-amber-50/20 dark:bg-amber-500/5',
        emerald: 'border-emerald-600 ring-4 ring-emerald-600/5 bg-emerald-50/20 dark:bg-emerald-600/5',
        slate: 'border-slate-800 ring-4 ring-slate-800/5 bg-slate-50 dark:bg-white/5'
    };

    return (
        <div 
            onClick={onClick}
            className={`group relative p-7 rounded-[24px] border-2 cursor-pointer transition-all duration-300 ${active ? variants[color] : 'border-slate-100 dark:border-white/5 bg-white dark:bg-slate-800/20 hover:border-slate-200 dark:hover:border-white/10'}`}
        >
            <div className="flex flex-col gap-6">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                    {React.cloneElement(icon, { size: 24, strokeWidth: 2.5 })}
                </div>
                <div>
                    <h3 className={`text-base font-black tracking-tight mb-2 ${active ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>{title}</h3>
                    <p className={`text-[11px] font-bold leading-relaxed ${active ? 'text-slate-500 dark:text-slate-400' : 'text-slate-400'}`}>{description}</p>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${active ? 'border-indigo-600 bg-indigo-600 text-white translate-x-0' : 'border-slate-200 dark:border-white/5 opacity-40'}`}>
                    {active && <CheckCircle size={14} strokeWidth={3} />}
                </div>
            </div>
        </div>
    );
};

const PremiumSwitch = ({ icon, title, active, onChange }) => {
    return (
        <div className="flex items-center justify-between group cursor-pointer" onClick={() => onChange(!active)}>
            <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-white/10 text-slate-500'}`}>
                    {icon}
                </div>
                <span className={`text-xs font-black tracking-widest uppercase transition-colors ${active ? 'text-white' : 'text-slate-500'}`}>{title}</span>
            </div>
            <div className={`w-14 h-7 rounded-full p-1 transition-all duration-500 relative ${active ? 'bg-indigo-600' : 'bg-white/10'}`}>
                <div className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow-lg transition-all duration-500 transform ${active ? 'translate-x-7' : 'translate-x-0'}`}></div>
            </div>
        </div>
    );
};

export default OperationalSettings;
