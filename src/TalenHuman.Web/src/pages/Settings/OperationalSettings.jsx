import React, { useState, useEffect } from 'react';
import { 
    Settings, Shield, Bell, Mail, Smartphone, Save, 
    CheckCircle, Clock, ListOrdered, UserCheck, Users, Info, AlertCircle,
    Zap, Sparkles, AlertTriangle, ArrowRight, ShieldCheck
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
            const payload = {
                id: settings.id,
                attendanceMode: settings.attendanceMode,
                shiftApprovalMode: settings.shiftApprovalMode,
                enablePushNotifications: settings.enablePushNotifications,
                enableEmailNotifications: settings.enableEmailNotifications
            };
            await api.post('/OperationalSettings', payload);
            showToast("Protocolos sincronizados exitosamente", "success");
        } catch (err) {
            showToast("Fallo en la comunicación con el servidor", "error");
        } finally {
            setSaving(false);
        }
    };

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] gap-8">
            <div className="relative">
                <div className="w-20 h-20 border-[3px] border-slate-100 dark:border-white/5 rounded-full"></div>
                <div className="absolute inset-0 border-[3px] border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse">Sincronizando Elite V13.0</p>
        </div>
    );

    return (
        <div className={`min-h-screen ${isDarkMode ? 'dark' : ''} bg-[#f8fafc] dark:bg-[#06080f] transition-colors duration-700`}>
            
            {/* Header Action Bar (Floating Luxury Bar) */}
            <div className="sticky top-0 z-[100] backdrop-blur-xl bg-white/70 dark:bg-[#06080f]/70 border-b border-slate-200/60 dark:border-white/5 px-6 py-4">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                            <Settings size={20} />
                        </div>
                        <div>
                            <h1 className="text-xl font-[1000] text-slate-900 dark:text-white tracking-tight leading-none">Configuraciones Operativas</h1>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Sincronización en Tiempo Real</p>
                        </div>
                    </div>
                    
                    <button 
                        onClick={handleSaveRequest}
                        disabled={saving}
                        className="group flex items-center gap-3 bg-slate-900 dark:bg-white text-white dark:text-slate-950 px-8 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all hover:scale-[1.03] active:scale-95 shadow-2xl disabled:grayscale"
                    >
                        {saving ? <div className="animate-spin h-4 w-4 border-2 border-current rounded-full border-t-transparent"></div> : <Save size={16} />}
                        {saving ? 'Guardando...' : 'Aplicar Cambios'}
                    </button>
                </div>
            </div>

            <div className="max-w-5xl mx-auto py-16 px-6">
                
                <div className="grid lg:grid-cols-12 gap-12">
                    
                    {/* Main Settings Column */}
                    <div className="lg:col-span-8 space-y-16">
                        
                        {/* 1. MOTOR DE ASISTENCIA */}
                        <div className="space-y-10">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-600/5 dark:bg-indigo-400/5 rounded-2xl border border-indigo-600/10 dark:border-indigo-400/10">
                                    <Clock className="text-indigo-600 dark:text-indigo-400" size={24} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-[1000] text-slate-900 dark:text-white tracking-tight">Motor de Asistencia</h2>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <div className="h-px w-4 bg-slate-200 dark:bg-slate-800"></div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Protocolo de Identidad Biométrica</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-6">
                                <ArchitectureCard 
                                    active={settings.attendanceMode === 0}
                                    onClick={() => setSettings({...settings, attendanceMode: 0})}
                                    icon={<Smartphone />}
                                    title="Protocolo Min-Max"
                                    description="Algoritmo inteligente de optimización de marcas principales."
                                    color="indigo"
                                />
                                <ArchitectureCard 
                                    active={settings.attendanceMode === 1}
                                    onClick={() => setSettings({...settings, attendanceMode: 1})}
                                    icon={<ListOrdered />}
                                    title="Modo Secuencial"
                                    description="Auditoría total cronológica de todos los registros intermedios."
                                    color="slate"
                                />
                            </div>
                        </div>

                        {/* 2. FLUJO DE APROBACIÓN */}
                        <div className="space-y-10">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-amber-600/5 dark:bg-amber-400/5 rounded-2xl border border-amber-600/10 dark:border-amber-400/10">
                                    <Shield className="text-amber-600 dark:text-amber-400" size={24} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-[1000] text-slate-900 dark:text-white tracking-tight">Flujo de Aprobación</h2>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <div className="h-px w-4 bg-slate-200 dark:bg-slate-800"></div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Validación de Autoridad Operativa</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-6">
                                <ArchitectureCard 
                                    active={settings.shiftApprovalMode === 0}
                                    onClick={() => setSettings({...settings, shiftApprovalMode: 0})}
                                    icon={<Users />}
                                    title="Nivel Central (RH)"
                                    description="Unificación total de aprobaciones bajo un único equipo gestor."
                                    color="amber"
                                />
                                <ArchitectureCard 
                                    active={settings.shiftApprovalMode === 1}
                                    onClick={() => setSettings({...settings, shiftApprovalMode: 1})}
                                    icon={<UserCheck />}
                                    title="Nivel Distrital"
                                    description="Delegación de autoridad a niveles regionales y supervisores."
                                    color="emerald"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Column */}
                    <div className="lg:col-span-4 space-y-10">
                        
                        {/* 3. NOTIFICACIONES */}
                        <div className="bg-white dark:bg-slate-900/50 p-10 rounded-[40px] border border-slate-200/60 dark:border-white/5 shadow-xl transition-all">
                            <div className="flex items-center gap-4 mb-10">
                                <div className="w-12 h-12 bg-indigo-600/5 rounded-2xl flex items-center justify-center text-indigo-600 border border-indigo-600/10">
                                    <Bell size={24} />
                                </div>
                                <h3 className="text-xl font-[1000] text-slate-900 dark:text-white tracking-tight">Alertas Smart</h3>
                            </div>

                            <div className="space-y-8">
                                <LuxuryToggle 
                                    icon={<Mail size={18} />}
                                    title="Reporte vía Email"
                                    active={settings.enableEmailNotifications}
                                    onChange={(val) => setSettings({...settings, enableEmailNotifications: val})}
                                />
                                <div className="h-px bg-slate-100 dark:bg-white/5"></div>
                                <LuxuryToggle 
                                    icon={<Smartphone size={18} />}
                                    title="Push App Móvil"
                                    active={settings.enablePushNotifications}
                                    onChange={(val) => setSettings({...settings, enablePushNotifications: val})}
                                />
                            </div>
                            
                            <div className="mt-12 p-6 bg-slate-50 dark:bg-indigo-400/[0.03] rounded-3xl border border-slate-100 dark:border-indigo-400/10">
                                <div className="flex gap-4">
                                    <Zap size={18} className="text-indigo-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-[11px] font-bold text-slate-500 leading-relaxed uppercase tracking-wider">
                                        Las alertas se emiten instantáneamente tras cada validación.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Audit Note */}
                        <div className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 p-8 rounded-[40px] shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/20 blur-3xl group-hover:bg-indigo-600/30 transition-all"></div>
                            <div className="relative z-10 space-y-4">
                                <div className="flex items-center gap-3">
                                    <ShieldCheck size={20} className="text-indigo-400 dark:text-indigo-600" />
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Security Core</h4>
                                </div>
                                <p className="text-xs font-bold leading-relaxed">
                                    Cualquier modificación genera una entrada irreversible en el Log de Auditoría.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirmation Modal: Cinematic Blur */}
            {showConfirm && (
                <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-2xl animate-in fade-in duration-500">
                    <div className="bg-white dark:bg-[#0f172a] w-full max-w-lg rounded-[48px] shadow-[0_50px_120px_-20px_rgba(0,0,0,0.6)] overflow-hidden border border-white/20">
                        <div className="p-12 text-center">
                            <div className="w-24 h-24 bg-amber-500/10 text-amber-500 rounded-[34px] flex items-center justify-center mx-auto mb-10 shadow-inner">
                                <AlertTriangle size={48} strokeWidth={2.5} />
                            </div>
                            <h3 className="text-3xl font-[1000] dark:text-white tracking-tight mb-4">¿Confirmar Actualización?</h3>
                            <p className="text-base font-bold text-slate-400 leading-relaxed px-4">
                                Esta acción modificará los protocolos de procesamiento de asistencia para toda la organización.
                            </p>
                        </div>
                        <div className="flex p-8 gap-5 bg-slate-50 dark:bg-slate-900/50">
                            <button 
                                onClick={() => setShowConfirm(false)}
                                className="flex-1 px-8 py-5 rounded-2xl font-black text-[12px] uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 shadow-sm"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={confirmSave}
                                className="flex-1 px-8 py-5 rounded-2xl bg-indigo-600 text-white font-black text-[12px] uppercase tracking-widest shadow-[0_20px_40px_-10px_rgba(79,70,229,0.5)] hover:bg-indigo-500 transition-all active:scale-95"
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast System */}
            {toast.show && (
                <div className={`fixed bottom-10 right-10 flex items-center gap-5 px-10 py-6 rounded-3xl backdrop-blur-xl shadow-[0_30px_70px_rgba(0,0,0,0.3)] animate-in slide-in-from-right-10 z-[3000] border border-white/20 ${toast.type === 'error' ? 'bg-rose-600/90 text-white' : 'bg-slate-900/90 text-white'}`}>
                    <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center">
                        {toast.type === 'error' ? <AlertCircle size={22} /> : <CheckCircle size={22} className="text-emerald-400" />}
                    </div>
                    <div>
                        <p className="text-[11px] font-[1000] text-white/50 uppercase tracking-widest mb-0.5">Sistema</p>
                        <p className="text-xs font-black tracking-widest uppercase">{toast.message}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

const ArchitectureCard = ({ active, onClick, icon, title, description, color }) => {
    const activeBorder = {
        indigo: 'border-indigo-600 ring-[6px] ring-indigo-500/5',
        amber: 'border-amber-500 ring-[6px] ring-amber-500/5',
        emerald: 'border-emerald-600 ring-[6px] ring-emerald-500/5',
        slate: 'border-slate-800 ring-[6px] ring-slate-800/5'
    };

    return (
        <div 
            onClick={onClick}
            className={`group relative p-8 rounded-[36px] border-2 cursor-pointer transition-all duration-500 ${active ? activeBorder[color] + ' bg-white dark:bg-white/5 shadow-2xl' : 'border-slate-100 dark:border-white/5 bg-transparent dark:hover:bg-white/[0.02]'}`}
        >
            <div className="flex flex-col gap-6 relative z-10">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${active ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30' : 'bg-slate-100 dark:bg-white/5 text-slate-400'}`}>
                    {React.cloneElement(icon, { size: 28, strokeWidth: active ? 2.5 : 2 })}
                </div>
                <div>
                    <h3 className={`text-lg font-black tracking-tight mb-3 ${active ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-400'}`}>{title}</h3>
                    <p className={`text-xs font-bold leading-relaxed ${active ? 'text-slate-500 dark:text-slate-500' : 'text-slate-400 dark:text-slate-600'}`}>{description}</p>
                </div>
                <div className="flex justify-end pt-2">
                    <div className={`w-10 h-10 rounded-2xl border-2 transition-all duration-500 flex items-center justify-center ${active ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'border-slate-100 dark:border-white/5'}`}>
                        {active ? <CheckCircle size={20} strokeWidth={3} /> : <div className="w-1.5 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full"></div>}
                    </div>
                </div>
            </div>
            
            {active && (
                <div className="absolute -top-3 -right-3 text-indigo-600 dark:text-indigo-400 animate-bounce">
                    <Sparkles size={24} />
                </div>
            )}
        </div>
    );
};

const LuxuryToggle = ({ icon, title, active, onChange }) => {
    return (
        <div className="flex items-center justify-between group cursor-pointer" onClick={() => onChange(!active)}>
            <div className="flex items-center gap-5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${active ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30' : 'bg-slate-50 dark:bg-white/5 text-slate-400 group-hover:text-slate-600'}`}>
                    {icon}
                </div>
                <span className={`text-[13px] font-black tracking-[0.05em] uppercase transition-colors ${active ? 'text-slate-900 dark:text-white' : 'text-slate-400 group-hover:text-slate-600'}`}>{title}</span>
            </div>
            <div className={`w-16 h-8 rounded-full p-1.5 transition-all duration-500 relative ${active ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-white/10 shadow-inner'}`}>
                <div className={`w-5 h-5 rounded-full bg-white shadow-2xl transition-all duration-500 transform ${active ? 'translate-x-8 scale-110' : 'translate-x-0'}`}></div>
            </div>
        </div>
    );
};

export default OperationalSettings;
