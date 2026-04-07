import React, { useState, useEffect } from 'react';
import { 
    Settings, Shield, Bell, Mail, Smartphone, Save, 
    CheckCircle, Clock, ListOrdered, UserCheck, Users, Info, AlertCircle,
    Zap, Sparkles, Layout, Database
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';

const OperationalSettings = () => {
    const { isDarkMode } = useTheme();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        attendanceMode: 0, // Default MinMax
        shiftApprovalMode: 0, // Default HR
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

    const handleSave = async () => {
        try {
            setSaving(true);
            await api.post('/OperationalSettings', settings);
            showToast("Sincronización Cloud exitosa", "success");
        } catch (err) {
            showToast("Fallo en sincronización", "error");
        } finally {
            setSaving(false);
        }
    };

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    };

    const activeColors = {
        accent: '#4f46e5',
        accentGlow: 'rgba(79, 70, 229, 0.4)',
        bg: isDarkMode ? '#0f172a' : '#f8fafc',
        card: isDarkMode ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.8)',
        border: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
            <div className="relative w-20 h-20">
                <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-t-indigo-600 rounded-full animate-spin"></div>
                <div className="absolute inset-4 bg-indigo-600/10 rounded-full animate-pulse"></div>
            </div>
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 animate-pulse">
                Iniciando Kernel Elite...
            </p>
        </div>
    );

    return (
        <div className={`min-h-screen ${isDarkMode ? 'dark' : ''} transition-colors duration-500`} style={{ background: activeColors.bg }}>
            
            {/* Ambient Glows */}
            <div className="fixed top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 dark:bg-indigo-500/5 blur-[120px] pointer-events-none rounded-full"></div>
            <div className="fixed bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-rose-500/10 dark:bg-rose-500/5 blur-[120px] pointer-events-none rounded-full"></div>

            <div className="max-w-5xl mx-auto py-16 px-6 relative z-10">
                
                {/* Header Premium V13.0 */}
                <div className="flex flex-col md:flex-row items-center justify-between mb-16 gap-10">
                    <div className="flex items-center gap-10">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-indigo-600 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                            <div className="relative w-24 h-24 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-[32px] flex items-center justify-center text-white shadow-2xl shadow-indigo-500/40 transform -rotate-3 transition-transform hover:rotate-0 duration-500">
                                <Settings size={44} strokeWidth={2.2} />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <span className="px-3 py-1 bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-lg border border-indigo-500/10">V13.0 ELITE</span>
                                <div className="h-px w-8 bg-slate-200 dark:bg-slate-700"></div>
                            </div>
                            <h1 className="text-4xl font-[1000] tracking-tight text-slate-900 dark:text-white leading-tight">
                                Reglas <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-indigo-400">Operativas</span>
                            </h1>
                            <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">
                                Gestión Centralizada de Inteligencia de Negocio
                            </p>
                        </div>
                    </div>
                    
                    <button 
                        onClick={handleSave}
                        disabled={saving}
                        className="group relative flex items-center gap-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-4 rounded-[22px] font-black text-[10px] uppercase tracking-[0.2em] transition-all overflow-hidden shadow-2xl hover:scale-105 active:scale-95 disabled:grayscale"
                    >
                        <div className="absolute inset-0 bg-indigo-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                        <span className="relative z-10 flex items-center gap-4">
                            {saving ? <div className="animate-spin h-4 w-4 border-2 border-current rounded-full border-t-transparent"></div> : <Save size={18} className="group-hover:rotate-12 transition-transform" />}
                            {saving ? 'Sincronizando' : 'Sincronizar Cloud'}
                        </span>
                    </button>
                </div>

                <div className="grid lg:grid-cols-12 gap-10">
                    
                    {/* Left Column (Main Rules) */}
                    <div className="lg:col-span-8 space-y-10">
                        {/* 1. MOTOR DE ASISTENCIA */}
                        <div className="backdrop-blur-2xl bg-white/40 dark:bg-slate-800/50 p-10 md:p-14 rounded-[60px] border border-white/20 dark:border-white/5 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.1)] relative overflow-hidden group">
                           {/* Background Decorative Icon - Moved and dimmed */}
                           <div className="absolute bottom-[-40px] right-[-40px] opacity-[0.03] group-hover:opacity-[0.06] transition-all duration-1000 pointer-events-none rotate-12">
                                <Database size={240} />
                           </div>
                           
                           <div className="flex items-center gap-6 mb-12">
                                <div className="w-16 h-16 bg-indigo-600/10 dark:bg-indigo-400/10 rounded-3xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                    <Clock size={32} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black dark:text-white tracking-tight">Motor de Asistencia</h2>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Consolidación de Identidad Biométrica</p>
                                </div>
                           </div>

                           <div className="grid sm:grid-cols-2 gap-8">
                                <ModeOption 
                                    active={settings.attendanceMode === 0}
                                    onClick={() => setSettings({...settings, attendanceMode: 0})}
                                    icon={<Smartphone />}
                                    title="Protocolo Min-Max"
                                    description="Algoritmo balanceado que prioriza la primera y última marca. Filtra duplicados orgánicos."
                                    badge="Smart Choice"
                                    color="indigo"
                                />
                                <ModeOption 
                                    active={settings.attendanceMode === 1}
                                    onClick={() => setSettings({...settings, attendanceMode: 1})}
                                    icon={<ListOrdered />}
                                    title="Modo Secuencial"
                                    description="Auditoría total de cada marca. Incluye almuerzos y permisos intermedios en reporte."
                                    color="slate"
                                />
                           </div>
                        </div>

                         {/* 2. FLUJO DE APROBACIÓN */}
                        <div className="backdrop-blur-xl bg-white/40 dark:bg-slate-800/40 p-10 md:p-14 rounded-[50px] border border-white/20 dark:border-white/5 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.1)]">
                           <div className="flex items-center gap-6 mb-12">
                                <div className="w-16 h-16 bg-amber-600/10 dark:bg-amber-400/10 rounded-3xl flex items-center justify-center text-amber-600 dark:text-amber-400">
                                    <Shield size={32} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black dark:text-white tracking-tight">Flujo de Aprobación</h2>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Autoridad Normativa de Turnos</p>
                                </div>
                           </div>

                           <div className="grid sm:grid-cols-2 gap-8">
                                <ModeOption 
                                    active={settings.shiftApprovalMode === 0}
                                    onClick={() => setSettings({...settings, shiftApprovalMode: 0})}
                                    icon={<Users />}
                                    title="RH Central"
                                    description="Control descentralizado total. Un único equipo de gestión aprueba toda la compañía."
                                    color="amber"
                                />
                                <ModeOption 
                                    active={settings.shiftApprovalMode === 1}
                                    onClick={() => setSettings({...settings, shiftApprovalMode: 1})}
                                    icon={<UserCheck />}
                                    title="Nivel Distrital"
                                    description="Escalamiento por jerarquía. Los supervisores validan su propio distrito operativo."
                                    badge="Agile Flow"
                                    color="emerald"
                                />
                           </div>
                        </div>
                    </div>

                    {/* Right Column (Side Rules) */}
                    <div className="lg:col-span-4 space-y-10">
                        
                        {/* 3. NOTIFICACIONES SMART */}
                        <div className="backdrop-blur-xl bg-slate-900/90 dark:bg-slate-800/80 p-10 rounded-[50px] border border-white/10 shadow-2xl text-white">
                            <div className="flex items-center gap-5 mb-10">
                                <div className="w-14 h-14 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400 shadow-inner">
                                    <Bell size={28} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black tracking-tight">Alertas</h3>
                                    <p className="text-[9px] text-indigo-400/60 font-black uppercase tracking-widest mt-0.5">Notificaciones Push/Email</p>
                                </div>
                            </div>

                            <div className="space-y-10">
                                <GlassToggle 
                                    icon={<Mail size={20} />}
                                    title="Reporte vía Email"
                                    active={settings.enableEmailNotifications}
                                    onChange={(val) => setSettings({...settings, enableEmailNotifications: val})}
                                />
                                <div className="h-px bg-white/5"></div>
                                <GlassToggle 
                                    icon={<Smartphone size={20} />}
                                    title="Push App Móvil"
                                    active={settings.enablePushNotifications}
                                    onChange={(val) => setSettings({...settings, enablePushNotifications: val})}
                                />
                            </div>
                            
                            <div className="mt-12 p-6 bg-indigo-600/10 rounded-3xl border border-indigo-500/10">
                                <div className="flex gap-4">
                                    <Zap size={18} className="text-indigo-400 flex-shrink-0" />
                                    <p className="text-[10px] font-bold text-indigo-200/50 leading-relaxed uppercase tracking-wider">
                                        Las notificaciones se envían en milisegundos tras la aprobación de RH.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Audit Note */}
                        <div className="bg-gradient-to-br from-indigo-600/5 to-transparent p-10 rounded-[50px] border border-indigo-500/5">
                            <div className="flex items-start gap-5">
                                <Info className="text-indigo-500 flex-shrink-0" size={24} />
                                <div>
                                    <h4 className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest mb-3">Auditoría Inteligente</h4>
                                    <p className="text-[11px] font-medium text-slate-400 leading-relaxed italic">
                                        "Cualquier modificación en estos parámetros genera una entrada irreversible en el Log de Auditoría para trazabilidad legal."
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Premium Toast */}
            {toast.show && (
                <div className={`fixed bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-5 px-10 py-6 rounded-[30px] backdrop-blur-2xl shadow-[0_30px_100px_rgba(0,0,0,0.3)] animate-in slide-in-from-bottom-10 z-[10000] border border-white/20 ${toast.type === 'error' ? 'bg-rose-600/90 text-white' : 'bg-emerald-600/90 text-white'}`}>
                    <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
                        {toast.type === 'error' ? <AlertCircle size={22} /> : <CheckCircle size={22} />}
                    </div>
                    <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.2em] mb-0.5">{toast.type === 'error' ? 'Fallo de Sistema' : 'Completado'}</p>
                        <p className="text-xs font-bold opacity-90">{toast.message}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

const ModeOption = ({ active, onClick, icon, title, description, badge, color }) => {
    const variants = {
        indigo: 'border-indigo-500/50 bg-indigo-600 shadow-[0_15px_40px_rgba(79,70,229,0.3)] text-white',
        amber: 'border-amber-500/50 bg-amber-500 shadow-[0_15px_40px_rgba(245,158,11,0.3)] text-white',
        emerald: 'border-emerald-500/50 bg-emerald-600 shadow-[0_15px_40px_rgba(16,185,129,0.3)] text-white',
        slate: 'border-slate-800 bg-slate-900 shadow-[0_15px_40px_rgba(15,23,42,0.3)] text-white'
    };

    return (
        <div 
            onClick={onClick}
            className={`group relative p-8 rounded-[40px] border-2 cursor-pointer transition-all duration-500 hover:scale-[1.03] ${active ? variants[color] : 'border-slate-100 dark:border-white/5 bg-white/50 dark:bg-slate-800/30'}`}
        >
            {badge && (
                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest z-20 shadow-2xl border border-white/20 ${active ? 'bg-indigo-900/40 backdrop-blur-md text-white' : 'bg-indigo-600 text-white'}`}>
                    {badge}
                </div>
            )}
            <div className={`flex flex-col h-full gap-8 ${badge ? 'pt-6' : ''}`}>
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 ${active ? 'bg-white/10 scale-110' : 'bg-slate-100/50 dark:bg-slate-700/30 text-slate-400'}`}>
                    {React.cloneElement(icon, { size: 32, strokeWidth: active ? 2.5 : 2 })}
                </div>
                <div>
                    <h3 className={`text-xl font-[1000] tracking-tight mb-3 ${active ? 'text-white' : 'text-slate-800 dark:text-slate-200'}`}>{title}</h3>
                    <p className={`text-[12px] font-bold leading-relaxed transition-opacity ${active ? 'text-white/70' : 'text-slate-400 dark:text-slate-500'}`}>{description}</p>
                </div>
                <div className="mt-auto flex justify-end">
                    <div className={`w-10 h-10 rounded-2xl border-2 transition-all flex items-center justify-center ${active ? 'border-white/40 bg-white/10 text-white' : 'border-slate-200 dark:border-white/5'}`}>
                        {active && <CheckCircle size={20} strokeWidth={3} />}
                    </div>
                </div>
            </div>
        </div>
    );
};

const GlassToggle = ({ icon, title, active, onChange }) => {
    return (
        <div className="flex items-center justify-between group cursor-pointer" onClick={() => onChange(!active)}>
            <div className="flex items-center gap-5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${active ? 'bg-indigo-500 text-white shadow-xl shadow-indigo-500/40 scale-110' : 'bg-white/5 text-slate-500'}`}>
                    {icon}
                </div>
                <span className={`text-[13px] font-black tracking-tight transition-colors ${active ? 'text-white' : 'text-slate-500'}`}>{title}</span>
            </div>
            <div className={`w-16 h-8 rounded-full p-1.5 transition-all duration-500 relative ${active ? 'bg-indigo-500 shadow-lg shadow-indigo-500/30' : 'bg-white/10 bg-inner'}`}>
                <div className={`w-5 h-5 rounded-full bg-white shadow-xl transition-all duration-500 transform ${active ? 'translate-x-8 scale-110' : 'translate-x-0'}`}></div>
            </div>
        </div>
    );
};

export default OperationalSettings;
