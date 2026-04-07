import React, { useState, useEffect } from 'react';
import { 
    Settings, Shield, Bell, Mail, Smartphone, Save, 
    CheckCircle, Clock, ListOrdered, UserCheck, Users, Info, AlertCircle,
    Zap, X, AlertTriangle, Sparkles
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
            showToast("Protocolos sincronizados", "success");
        } catch (err) {
            showToast("Fallo en la comunicación serial", "error");
        } finally {
            setSaving(false);
        }
    };

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
            <div className="relative w-24 h-24">
                <div className="absolute inset-0 border-[6px] border-indigo-600/10 rounded-full"></div>
                <div className="absolute inset-0 border-[6px] border-t-indigo-600 rounded-full animate-spin"></div>
                <div className="absolute inset-4 bg-indigo-600/5 rounded-full flex items-center justify-center text-indigo-600">
                    <Settings className="animate-pulse" size={32} />
                </div>
            </div>
            <div className="flex flex-col items-center gap-1">
                <p className="text-[11px] font-[1000] text-slate-400 uppercase tracking-[0.4em] animate-pulse">Iniciando Kernel Elite</p>
                <div className="w-32 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 animate-progress w-[60%]"></div>
                </div>
            </div>
        </div>
    );

    return (
        <div className={`min-h-screen ${isDarkMode ? 'dark' : ''} bg-[#fdfdfe] dark:bg-[#080b14] transition-colors duration-700`}>
            
            {/* Background Ambient Effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/5 dark:bg-indigo-600/[0.03] blur-[140px] rounded-full"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-rose-500/5 dark:bg-rose-600/[0.03] blur-[140px] rounded-full"></div>
            </div>

            <div className="max-w-5xl mx-auto py-16 px-6 relative z-10">
                
                {/* Header Premium High-Fidelity */}
                <div className="flex flex-col lg:flex-row items-center justify-between mb-16 gap-10">
                    <div className="flex items-center gap-8">
                        <div className="relative group">
                            <div className="absolute inset-[-4px] bg-gradient-to-tr from-indigo-600 to-indigo-400 rounded-3xl blur-md opacity-20 group-hover:opacity-40 transition-opacity"></div>
                            <div className="relative w-20 h-20 bg-white dark:bg-slate-900 rounded-3xl flex items-center justify-center text-indigo-600 border border-slate-200 dark:border-white/10 shadow-2xl">
                                <Settings size={36} strokeWidth={2.5} />
                                <div className="absolute -top-2 -right-2 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center border-4 border-white dark:border-slate-900 shadow-lg">
                                    <Sparkles size={10} className="text-white" />
                                </div>
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.25em] bg-indigo-600/5 px-2 py-0.5 rounded">Security Core</span>
                                <div className="h-px w-6 bg-slate-200 dark:bg-slate-800"></div>
                            </div>
                            <h1 className="text-4xl font-[1000] text-slate-900 dark:text-white tracking-tight leading-none">
                                Configuración <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-indigo-400">Operativa</span>
                            </h1>
                        </div>
                    </div>
                    
                    <button 
                        onClick={handleSaveRequest}
                        disabled={saving}
                        className="group relative flex items-center gap-4 bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-600 text-white px-12 py-5 rounded-[22px] font-black text-[12px] uppercase tracking-[0.2em] transition-all overflow-hidden shadow-[0_20px_50px_-15px_rgba(79,70,229,0.5)] active:scale-95 disabled:grayscale"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                        <span className="relative z-10 flex items-center gap-4">
                            {saving ? <div className="animate-spin h-5 w-5 border-2 border-white rounded-full border-t-transparent"></div> : <Save size={20} />}
                            {saving ? 'Sincronizando' : 'Aplicar Cambios'}
                        </span>
                    </button>
                </div>

                <div className="grid lg:grid-cols-12 gap-10">
                    
                    {/* Left Column (Main Rules) */}
                    <div className="lg:col-span-8 space-y-10">
                        {/* 1. MOTOR DE ASISTENCIA */}
                        <RuleSection 
                            icon={<Clock />}
                            title="Motor de Asistencia"
                            subtitle="Consolidación de Identidad Biométrica"
                        >
                            <div className="space-y-6">
                                <EliteOption 
                                    active={settings.attendanceMode === 0}
                                    onClick={() => setSettings({...settings, attendanceMode: 0})}
                                    icon={<Smartphone />}
                                    title="Protocolo Min-Max"
                                    description="Algoritmo inteligente que prioriza la primera y última marca registradas por el colaborador."
                                    color="indigo"
                                />
                                <EliteOption 
                                    active={settings.attendanceMode === 1}
                                    onClick={() => setSettings({...settings, attendanceMode: 1})}
                                    icon={<ListOrdered />}
                                    title="Modo Secuencial"
                                    description="Auditoría total cronológica. Incluye almuerzos, permisos y marcas intermedias en reporte."
                                    color="slate"
                                />
                            </div>
                        </RuleSection>

                         {/* 2. FLUJO DE APROBACIÓN */}
                         <RuleSection 
                            icon={<Shield />}
                            title="Flujo de Aprobación"
                            subtitle="Canal de Validación de Horarios"
                            accent="amber"
                        >
                            <div className="space-y-6">
                                <EliteOption 
                                    active={settings.shiftApprovalMode === 0}
                                    onClick={() => setSettings({...settings, shiftApprovalMode: 0})}
                                    icon={<Users />}
                                    title="Nivel Central (RH)"
                                    description="Un único equipo de Gestión Humana aprueba toda la compañía de forma centralizada."
                                    color="amber"
                                />
                                <EliteOption 
                                    active={settings.shiftApprovalMode === 1}
                                    onClick={() => setSettings({...settings, shiftApprovalMode: 1})}
                                    icon={<UserCheck />}
                                    title="Nivel Distrital"
                                    description="Escalamiento jerárquico. Los supervisores validan sus propios distritos operativos."
                                    color="emerald"
                                />
                            </div>
                        </RuleSection>
                    </div>

                    {/* Right Column (Side Rules) */}
                    <div className="lg:col-span-4 space-y-10">
                        
                        {/* 3. NOTIFICACIONES */}
                        <div className="bg-slate-900 p-10 rounded-[40px] border border-white/10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] text-white relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 blur-3xl pointer-events-none group-hover:bg-indigo-600/20 transition-all"></div>
                            
                            <div className="flex items-center gap-5 mb-12">
                                <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-indigo-400 border border-white/5">
                                    <Bell size={28} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black tracking-tight">Alertas Smart</h3>
                                    <p className="text-[9px] text-indigo-400/60 font-black uppercase tracking-widest mt-0.5">Canales de Notificación</p>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <EliteSwitch 
                                    icon={<Mail size={20} />}
                                    title="Reporte vía Email"
                                    active={settings.enableEmailNotifications}
                                    onChange={(val) => setSettings({...settings, enableEmailNotifications: val})}
                                />
                                <div className="h-px bg-white/[0.03]"></div>
                                <EliteSwitch 
                                    icon={<Smartphone size={20} />}
                                    title="Push App Móvil"
                                    active={settings.enablePushNotifications}
                                    onChange={(val) => setSettings({...settings, enablePushNotifications: val})}
                                />
                            </div>
                            
                            <div className="mt-12 p-6 bg-indigo-500/5 rounded-3xl border border-indigo-500/10">
                                <div className="flex gap-4">
                                    <Zap size={18} className="text-indigo-400/60 flex-shrink-0 mt-0.5" />
                                    <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase tracking-wider">
                                        Las alertas se sincronizan en milisegundos tras cada validación.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Audit Note */}
                        <div className="backdrop-blur-md bg-white/40 dark:bg-slate-800/20 p-8 rounded-[40px] border border-slate-200 dark:border-white/5 shadow-sm">
                            <div className="flex items-start gap-5">
                                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700/50 rounded-xl flex items-center justify-center text-slate-400">
                                    <Info size={22} />
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-[0.2em] mb-3">Trazabilidad</h4>
                                    <p className="text-[11px] font-medium text-slate-500 leading-relaxed italic">
                                        "Cualquier modificación genera una entrada irreversible en el Log de Auditoría para cumplimiento legal."
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Premium Confirmation Modal */}
            {showConfirm && (
                <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-[#0f172a] w-full max-w-lg rounded-[48px] shadow-[0_50px_120px_-20px_rgba(0,0,0,0.5)] overflow-hidden border border-white/20 relative">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-500 to-indigo-600"></div>
                        
                        <div className="p-12">
                            <div className="w-20 h-20 bg-amber-500/10 text-amber-500 rounded-[30px] flex items-center justify-center mb-10 shadow-inner">
                                <AlertTriangle size={40} strokeWidth={2.5} />
                            </div>
                            <h3 className="text-3xl font-[1000] dark:text-white tracking-tight mb-5 leading-tight">¿Confirmar Cambio de Protocolo?</h3>
                            <p className="text-base font-bold text-slate-400 leading-relaxed">
                                Esta acción modificará cómo el núcleo procesa las marcas de asistencia y los niveles de autorización de toda la compañía de forma inmediata.
                            </p>
                        </div>
                        
                        <div className="flex p-8 gap-5 bg-slate-50 dark:bg-slate-900/50">
                            <button 
                                onClick={() => setShowConfirm(false)}
                                className="flex-1 px-8 py-5 rounded-2xl font-black text-[12px] uppercase tracking-widest text-slate-400 hover:text-slate-600 dark:hover:text-white transition-all border border-slate-200 dark:border-white/5 active:scale-95"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={confirmSave}
                                className="flex-1 px-8 py-5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-[12px] uppercase tracking-widest shadow-2xl hover:scale-[1.03] transition-all active:scale-95"
                            >
                                Confirmar y Sincronizar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Elite Toast */}
            {toast.show && (
                <div className={`fixed bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-5 px-10 py-6 rounded-full shadow-[0_30px_80px_rgba(0,0,0,0.4)] animate-in slide-in-from-bottom-10 z-[3000] border border-white/20 ${toast.type === 'error' ? 'bg-rose-600 text-white' : 'bg-slate-900 text-white'}`}>
                    <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                        {toast.type === 'error' ? <AlertCircle size={22} /> : <CheckCircle size={22} className="text-emerald-400" />}
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-0.5 opacity-60">Sistema Operativo</p>
                        <p className="text-xs font-black tracking-widest uppercase">{toast.message}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

const RuleSection = ({ icon, title, subtitle, accent = "indigo", children }) => (
    <div className="bg-white/80 dark:bg-slate-800/40 p-10 md:p-12 rounded-[50px] border border-slate-100 dark:border-white/5 shadow-[0_15px_40px_-20px_rgba(0,0,0,0.05)] relative group">
        <div className="flex items-center gap-6 mb-12">
            <div className={`w-16 h-16 bg-${accent}-600/10 dark:bg-${accent}-400/10 rounded-3xl flex items-center justify-center text-${accent}-600 dark:text-${accent}-400 shadow-inner`}>
                {React.cloneElement(icon, { size: 32, strokeWidth: 2.5 })}
            </div>
            <div>
                <h2 className="text-2xl font-black dark:text-white tracking-tight">{title}</h2>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.25em] mt-1">{subtitle}</p>
            </div>
        </div>
        {children}
    </div>
);

const EliteOption = ({ active, onClick, icon, title, description, color }) => {
    const variants = {
        indigo: 'border-indigo-600 ring-[8px] ring-indigo-600/5 bg-gradient-to-br from-indigo-50/50 to-white dark:from-indigo-600/[0.03] dark:to-transparent',
        amber: 'border-amber-500 ring-[8px] ring-amber-500/5 bg-gradient-to-br from-amber-50/50 to-white dark:from-amber-500/[0.03] dark:to-transparent',
        emerald: 'border-emerald-600 ring-[8px] ring-emerald-600/5 bg-gradient-to-br from-emerald-50/50 to-white dark:from-emerald-600/[0.03] dark:to-transparent',
        slate: 'border-slate-800 ring-[8px] ring-slate-800/5 bg-gradient-to-br from-slate-50 to-white dark:from-white/5 dark:to-transparent'
    };

    const iconColors = {
        indigo: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30',
        amber: 'text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/30',
        emerald: 'text-emerald-600 dark:text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30',
        slate: 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/10'
    };

    return (
        <div 
            onClick={onClick}
            className={`group relative p-8 rounded-[32px] border-2 cursor-pointer transition-all duration-500 ${active ? variants[color] : 'border-slate-50 dark:border-white/[0.03] bg-white dark:bg-white/[0.01] hover:border-slate-200 dark:hover:border-white/5 shadow-sm'}`}
        >
            <div className="flex items-center gap-8 relative z-10">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-xl ${active ? 'bg-indigo-600 text-white scale-110' : iconColors[color]}`}>
                    {React.cloneElement(icon, { size: 28, strokeWidth: 2.5 })}
                </div>
                <div className="flex-1">
                    <h3 className={`text-lg font-black tracking-tight mb-2 ${active ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-400'}`}>{title}</h3>
                    <p className={`text-xs font-bold leading-relaxed ${active ? 'text-slate-500 dark:text-slate-500' : 'text-slate-400 dark:text-slate-600'}`}>{description}</p>
                </div>
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${active ? 'border-indigo-600 bg-indigo-600 text-white shadow-lg' : 'border-slate-100 dark:border-white/5'}`}>
                    {active && <CheckCircle size={18} strokeWidth={3} />}
                </div>
            </div>
            
            {active && (
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-600/[0.02] rounded-full blur-2xl pointer-events-none"></div>
            )}
        </div>
    );
};

const EliteSwitch = ({ icon, title, active, onChange }) => {
    return (
        <div className="flex items-center justify-between group cursor-pointer" onClick={() => onChange(!active)}>
            <div className="flex items-center gap-5">
                <div className={`w-12 h-12 rounded-[18px] flex items-center justify-center transition-all duration-500 ${active ? 'bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-lg shadow-indigo-600/40 scale-110' : 'bg-white/5 text-slate-500 border border-white/5'}`}>
                    {icon}
                </div>
                <span className={`text-[13px] font-black tracking-[0.1em] uppercase transition-colors ${active ? 'text-white' : 'text-slate-500'}`}>{title}</span>
            </div>
            <div className={`w-16 h-8 rounded-full p-1.5 transition-all duration-500 relative shadow-inner ${active ? 'bg-indigo-600' : 'bg-white/10'}`}>
                <div className={`absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-white shadow-2xl transition-all duration-500 transform ${active ? 'translate-x-8 scale-110' : 'translate-x-0 outline outline-4 outline-white/5'}`}></div>
            </div>
        </div>
    );
};

export default OperationalSettings;
