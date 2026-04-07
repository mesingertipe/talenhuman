import React, { useState, useEffect } from 'react';
import { 
    Settings, Shield, Bell, Mail, Smartphone, Save, 
    CheckCircle, Clock, ListOrdered, UserCheck, Users, Info, AlertCircle,
    Zap, Sparkles, AlertTriangle, ShieldCheck, ArrowRight
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

    const handleSaveRequest = () => setShowConfirm(true);

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
            const res = await api.post('/OperationalSettings', payload);
            setSettings(res.data);
            showToast("Protocolos Elite V13.0 Sincronizados", "success");
        } catch (err) {
            showToast("Error crítico de comunicación con el núcleo", "error");
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
            <div className="relative w-24 h-24">
                <div className="absolute inset-0 border-[6px] border-indigo-600/10 rounded-full"></div>
                <div className="absolute inset-0 border-[6px] border-t-indigo-600 rounded-full animate-spin"></div>
                <div className="absolute inset-4 bg-indigo-600/5 rounded-full flex items-center justify-center text-indigo-600">
                    <Settings className="animate-pulse" size={32} />
                </div>
            </div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse">Iniciando Kernel Elite V13.0</p>
        </div>
    );

    return (
        <div className={`min-h-screen ${isDarkMode ? 'dark' : ''} bg-[#fafbfc] dark:bg-[#070a13] transition-colors duration-700 font-inter`}>
            
            {/* Header Action Bar (God-Tier Luxury) */}
            <div className="sticky top-0 z-[100] backdrop-blur-xl bg-white/80 dark:bg-[#070a13]/80 border-b border-slate-200/60 dark:border-white/5 py-6 px-10 shadow-sm transition-all duration-500">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="relative group">
                            <div className="absolute inset-[-4px] bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-2xl blur-md opacity-20 group-hover:opacity-40 transition-opacity"></div>
                            <div className="relative w-14 h-14 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center text-indigo-600 border border-slate-200/60 dark:border-white/10 shadow-2xl transition-transform hover:scale-105 active:scale-95 cursor-pointer">
                                <Settings size={28} strokeWidth={2.5} />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.3em] bg-indigo-600/10 dark:bg-indigo-400/10 px-2 py-0.5 rounded-md">Precision System</span>
                                <div className="h-px w-4 bg-slate-200 dark:bg-slate-800"></div>
                            </div>
                            <h1 className="text-3xl font-[1000] text-slate-900 dark:text-white tracking-tight leading-none">
                                Configuraciones <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-500">Operativas</span>
                            </h1>
                        </div>
                    </div>
                    
                    <button 
                        onClick={handleSaveRequest}
                        disabled={saving}
                        className="group relative flex items-center gap-4 bg-gradient-to-r from-indigo-600 to-violet-500 hover:from-indigo-500 hover:to-violet-400 text-white px-12 py-5 rounded-[22px] font-black text-[13px] uppercase tracking-[0.2em] transition-all overflow-hidden shadow-[0_20px_50px_-15px_rgba(79,70,229,0.5)] active:scale-95 disabled:grayscale"
                    >
                         <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/15 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out"></div>
                        {saving ? (
                            <div className="animate-spin h-5 w-5 border-2 border-white rounded-full border-t-transparent"></div>
                        ) : (
                            <Save size={20} className="relative z-10 transition-transform group-hover:rotate-12" />
                        )}
                        <span className="relative z-10">{saving ? 'Guardando...' : 'Aplicar Cambios'}</span>
                    </button>
                </div>
            </div>

            <div className="max-w-6xl mx-auto py-16 px-10 relative z-10">
                <div className="grid lg:grid-cols-12 gap-12">
                    
                    {/* Main Regulations Section */}
                    <div className="lg:col-span-8 space-y-16">
                        
                        {/* 1. MOTOR DE ASISTENCIA */}
                        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-10 duration-500">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 bg-indigo-600/5 dark:bg-indigo-400/5 rounded-3xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-600/10 dark:border-indigo-400/10">
                                    <Clock size={30} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-[1000] text-slate-900 dark:text-white tracking-tight">Motor de Asistencia</h2>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-1">Sincronización Transaccional de Marcas</p>
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-8">
                                <GodTierCard 
                                    active={settings.attendanceMode === 0}
                                    onClick={() => setSettings({...settings, attendanceMode: 0})}
                                    icon={<Smartphone />}
                                    title="Protocolo Min-Max"
                                    description="Algoritmo jerárquico que procesa los extremos de la jornada laboral."
                                />
                                <GodTierCard 
                                    active={settings.attendanceMode === 1}
                                    onClick={() => setSettings({...settings, attendanceMode: 1})}
                                    icon={<ListOrdered />}
                                    title="Modo Secuencial"
                                    description="Auditoría cronológica completa para colaboradores multimarca."
                                />
                            </div>
                        </div>

                         {/* 2. FLUJO DE APROBACIÓN */}
                         <div className="space-y-10 animate-in fade-in slide-in-from-bottom-10 duration-700">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 bg-amber-500/5 dark:bg-amber-400/5 rounded-3xl flex items-center justify-center text-amber-600 dark:text-amber-500 border border-amber-500/10 dark:border-amber-400/10">
                                    <Shield size={30} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-[1000] text-slate-900 dark:text-white tracking-tight">Flujo de Aprobación</h2>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-1">Autoridad Normativa de Validaciones</p>
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-8">
                                <GodTierCard 
                                    active={settings.shiftApprovalMode === 0}
                                    onClick={() => setSettings({...settings, shiftApprovalMode: 0})}
                                    icon={<Users />}
                                    title="Nivel Central (RH)"
                                    description="Criterio unificado bajo un único equipo de Gestión Humana."
                                />
                                <GodTierCard 
                                    active={settings.shiftApprovalMode === 1}
                                    onClick={() => setSettings({...settings, shiftApprovalMode: 1})}
                                    icon={<UserCheck />}
                                    title="Nivel Distrital"
                                    description="Delegación de autoridad a cada Supervisor Regional."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Notification & Intelligence Section */}
                    <div className="lg:col-span-4 space-y-10">
                        
                        {/* 3. ALERTAS SMART */}
                        <div className="bg-white dark:bg-slate-900/50 p-10 rounded-[48px] border border-slate-200 dark:border-white/5 shadow-2xl relative overflow-hidden group transition-all duration-500 hover:shadow-indigo-500/10">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 blur-3xl pointer-events-none group-hover:bg-indigo-600/10 transition-all"></div>
                            
                            <div className="flex items-center gap-5 mb-12">
                                <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
                                    <Bell size={28} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-[1000] text-slate-900 dark:text-white tracking-tight">Alertas Smart</h3>
                                    <p className="text-[9px] text-indigo-600 dark:text-indigo-400/60 font-black uppercase tracking-widest mt-0.5">Push & Email Sync</p>
                                </div>
                            </div>

                            <div className="space-y-10">
                                <PremiumSwitch 
                                    icon={<Mail size={20} />}
                                    title="Reporte vía Email"
                                    active={settings.enableEmailNotifications}
                                    onChange={(val) => setSettings({...settings, enableEmailNotifications: val})}
                                />
                                <div className="h-px bg-slate-100 dark:bg-white/5"></div>
                                <PremiumSwitch 
                                    icon={<Smartphone size={20} />}
                                    title="Push App Móvil"
                                    active={settings.enablePushNotifications}
                                    onChange={(val) => setSettings({...settings, enablePushNotifications: val})}
                                />
                            </div>
                            
                            <div className="mt-12 p-6 bg-slate-50 dark:bg-indigo-500/5 rounded-3xl border border-slate-100 dark:border-indigo-500/10 transition-colors">
                                <div className="flex gap-4">
                                    <Zap size={20} className="text-indigo-600 flex-shrink-0 mt-0.5 animate-pulse" />
                                    <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase tracking-wider">
                                        Latencia mínima: Configuración propagada en milisegundos.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Audit Log Branding */}
                        <div className="bg-slate-900 dark:bg-white p-10 rounded-[48px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] dark:shadow-xl relative overflow-hidden group">
                           <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/30 dark:bg-indigo-600/5 blur-3xl pointer-events-none group-hover:scale-125 transition-transform duration-1000"></div>
                           <div className="relative z-10 space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center">
                                        <ShieldCheck size={20} />
                                    </div>
                                    <h4 className="text-[11px] font-black text-white dark:text-slate-900 uppercase tracking-[0.2em] opacity-80">Security Core</h4>
                                </div>
                                <p className="text-xs font-black text-white/70 dark:text-slate-500 leading-relaxed italic">
                                    "Los cambios operativos son inyectados irreversiblemente en la cadena de auditoría."
                                </p>
                           </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirmation Modal (Elite Grade) */}
            {showConfirm && (
                <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-[#000000]/40 backdrop-blur-3xl animate-in fade-in duration-500">
                    <div className="bg-white dark:bg-[#0c1221] w-full max-w-lg rounded-[56px] shadow-[0_60px_150px_-20px_rgba(0,0,0,0.7)] overflow-hidden border border-white/20 relative">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-600 via-violet-500 to-amber-500 animate-gradient"></div>
                        
                        <div className="p-16 text-center">
                            <div className="w-24 h-24 bg-amber-500/10 text-amber-500 rounded-[38px] flex items-center justify-center mx-auto mb-10 shadow-inner">
                                <AlertTriangle size={50} strokeWidth={2.5} className="animate-pulse" />
                            </div>
                            <h3 className="text-3xl font-[1000] dark:text-white tracking-tight mb-5 leading-tight">¿Confirmar Kernel Sync?</h3>
                            <p className="text-base font-bold text-slate-400 leading-relaxed">
                                Esta acción re-calibrará el procesamiento de asistencia corporativa de forma instantánea.
                            </p>
                        </div>
                        
                        <div className="flex p-10 gap-6 bg-slate-50 dark:bg-slate-900/50">
                            <button 
                                onClick={() => setShowConfirm(false)}
                                className="flex-1 px-8 py-5 rounded-3xl font-black text-[12px] uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 active:scale-95"
                            >
                                Abortar
                            </button>
                            <button 
                                onClick={confirmSave}
                                className="flex-1 px-8 py-5 rounded-3xl bg-indigo-600 text-white font-black text-[12px] uppercase tracking-widest shadow-2xl hover:bg-slate-900 hover:scale-[1.03] transition-all active:scale-95"
                            >
                                Confirmar Cambio
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Corporate System Toast */}
            {toast.show && (
                <div className={`fixed bottom-12 right-12 flex items-center gap-6 px-10 py-7 rounded-[32px] backdrop-blur-2xl shadow-[0_40px_100px_rgba(0,0,0,0.4)] animate-in slide-in-from-right-10 z-[3000] border border-white/20 ${toast.type === 'error' ? 'bg-rose-600/90 text-white' : 'bg-slate-900/95 text-white'}`}>
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shadow-inner">
                        {toast.type === 'error' ? <AlertCircle size={26} /> : <CheckCircle size={26} className="text-emerald-400" />}
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-1 opacity-50">Sincronización Exitosa</p>
                        <p className="text-sm font-black tracking-[0.1em] uppercase">{toast.message}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

const GodTierCard = ({ active, onClick, icon, title, description }) => {
    return (
        <div 
            onClick={onClick}
            className={`group relative p-10 rounded-[44px] border-2 cursor-pointer transition-all duration-500 overflow-hidden ${active ? 'border-indigo-600 bg-white dark:bg-white/5 shadow-[0_30px_70px_-20px_rgba(79,70,229,0.15)] ring-4 ring-indigo-600/5' : 'border-slate-100 dark:border-white/5 bg-transparent opacity-60 hover:opacity-100 shadow-sm'}`}
        >
            {active && (
                <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
            )}
            
            <div className="flex flex-col gap-8 relative z-10">
                <div className="flex justify-between items-start">
                    <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center transition-all duration-500 ${active ? 'bg-indigo-600 text-white shadow-2xl scale-110' : 'bg-slate-100 dark:bg-white/5 text-slate-400'}`}>
                        {React.cloneElement(icon, { size: 30, strokeWidth: 2.5 })}
                    </div>
                    {active && <div className="text-indigo-600 animate-bounce"><Sparkles size={20} /></div>}
                </div>
                
                <div>
                  <h3 className={`text-xl font-black tracking-tight mb-3 ${active ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>{title}</h3>
                  <p className={`text-xs font-bold leading-relaxed pr-4 ${active ? 'text-slate-500 dark:text-slate-400' : 'text-slate-400 dark:text-slate-600'}`}>{description}</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className={`h-1.5 rounded-full transition-all duration-1000 ${active ? 'bg-indigo-600 w-16' : 'bg-slate-100 dark:bg-white/5 w-6'}`}></div>
                    <div className={`w-10 h-10 rounded-2xl border-2 flex items-center justify-center transition-all duration-500 ${active ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-transparent'}`}>
                        <CheckCircle size={20} strokeWidth={3} />
                    </div>
                </div>
            </div>
        </div>
    );
};

const PremiumSwitch = ({ icon, title, active, onChange }) => {
    return (
        <div className="flex items-center justify-between group cursor-pointer" onClick={() => onChange(!active)}>
            <div className="flex items-center gap-5">
                <div className={`w-14 h-14 rounded-3xl flex items-center justify-center transition-all duration-700 ${active ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xl scale-105' : 'bg-slate-50 dark:bg-white/5 text-slate-400 border border-slate-100 dark:border-white/5'}`}>
                    {icon}
                </div>
                <span className={`text-[14px] font-[1000] tracking-[0.05em] uppercase transition-colors ${active ? 'text-slate-900 dark:text-white' : 'text-slate-400 group-hover:text-slate-600'}`}>{title}</span>
            </div>
            
            <div className={`w-18 h-10 rounded-full p-1.5 transition-all duration-500 relative shadow-inner ${active ? 'bg-indigo-600' : 'bg-slate-100 dark:bg-white/5'}`}>
                <div className={`w-7 h-7 rounded-full bg-white shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-all duration-500 transform ${active ? 'translate-x-8 scale-110' : 'translate-x-[0px]'}`}></div>
                {active && (
                   <div className="absolute inset-0 rounded-full animate-pulse ring-4 ring-indigo-600/30 pointer-events-none"></div>
                )}
            </div>
        </div>
    );
};

export default OperationalSettings;
