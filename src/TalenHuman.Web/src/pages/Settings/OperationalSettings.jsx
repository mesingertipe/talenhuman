import React, { useState, useEffect } from 'react';
import { 
    Settings, Shield, Bell, Mail, Smartphone, Save, 
    CheckCircle, Clock, ListOrdered, UserCheck, Users, Info, AlertCircle,
    Zap
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
            showToast("Configuraciones actualizadas exitosamente", "success");
        } catch (err) {
            showToast("Error al guardar configuraciones", "error");
        } finally {
            setSaving(false);
        }
    };

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Cargando...</p>
        </div>
    );

    return (
        <div className={`min-h-screen ${isDarkMode ? 'dark' : ''} bg-slate-50 dark:bg-slate-900 transition-colors duration-300`}>
            
            <div className="max-w-5xl mx-auto py-12 px-6 relative z-10">
                
                {/* Header: Clean Corporate */}
                <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-8 border-b border-slate-200 dark:border-slate-800 pb-8">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-sm">
                            <Settings size={32} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                                Configuraciones Operativas
                            </h1>
                            <p className="text-sm font-medium text-slate-500 mt-1">
                                Gestión de reglas y parámetros generales del sistema.
                            </p>
                        </div>
                    </div>
                    
                    <button 
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2.5 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-600/20 active:scale-95 disabled:grayscale"
                    >
                        {saving ? <div className="animate-spin h-5 w-5 border-2 border-white rounded-full border-t-transparent"></div> : <Save size={18} />}
                        {saving ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </div>

                <div className="grid lg:grid-cols-12 gap-10">
                    
                    {/* Left Column (Main Rules) */}
                    <div className="lg:col-span-8 space-y-8">
                        
                        {/* 1. MOTOR DE ASISTENCIA */}
                        <div className="bg-white dark:bg-slate-800/40 p-8 md:p-10 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
                           <div className="flex items-center gap-5 mb-10">
                                <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30">
                                    <Clock size={28} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold dark:text-white">Motor de Asistencia</h2>
                                    <p className="text-xs text-slate-500 font-medium">Consolidación de marcas biométricas.</p>
                                </div>
                           </div>

                           <div className="grid sm:grid-cols-2 gap-6">
                                <ModeOption 
                                    active={settings.attendanceMode === 0}
                                    onClick={() => setSettings({...settings, attendanceMode: 0})}
                                    icon={<Smartphone />}
                                    title="Protocolo Min-Max"
                                    description="Algoritmo que prioriza la primera y última marca. Filtra duplicados."
                                    color="indigo"
                                />
                                <ModeOption 
                                    active={settings.attendanceMode === 1}
                                    onClick={() => setSettings({...settings, attendanceMode: 1})}
                                    icon={<ListOrdered />}
                                    title="Modo Secuencial"
                                    description="Auditoría total de cada marca. Incluye permisos intermedios."
                                    color="slate"
                                />
                           </div>
                        </div>

                         {/* 2. FLUJO DE APROBACIÓN */}
                        <div className="bg-white dark:bg-slate-800/40 p-8 md:p-10 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
                           <div className="flex items-center gap-5 mb-10">
                                <div className="w-14 h-14 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30">
                                    <Shield size={28} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold dark:text-white">Flujo de Aprobación</h2>
                                    <p className="text-xs text-slate-500 font-medium">Validación normativa de mallas de turnos.</p>
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
                                    description="Validación regional por Supervisores y Distritales."
                                    color="emerald"
                                />
                           </div>
                        </div>
                    </div>

                    {/* Right Column (Side Rules) */}
                    <div className="lg:col-span-4 space-y-8">
                        
                        {/* 3. NOTIFICACIONES */}
                        <div className="bg-slate-900 dark:bg-slate-950 p-8 rounded-3xl border border-slate-800 shadow-xl text-white">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-indigo-400">
                                    <Bell size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold">Notificaciones</h3>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Alertas automáticas</p>
                                </div>
                            </div>

                            <div className="space-y-6">
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
                            
                            <div className="mt-8 p-5 bg-indigo-500/5 rounded-2xl border border-indigo-500/10">
                                <div className="flex gap-4">
                                    <Zap size={16} className="text-indigo-500/60 flex-shrink-0 mt-0.5" />
                                    <p className="text-[11px] font-medium text-slate-500 leading-relaxed uppercase tracking-wider">
                                        Las alertas se sincronizan en tiempo real tras la validación administrativa.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Audit Note */}
                        <div className="bg-white dark:bg-slate-800/20 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <div className="flex items-start gap-4">
                                <Info className="text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-1" size={20} />
                                <div>
                                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest mb-2">Auditoría</h4>
                                    <p className="text-[11px] font-medium text-slate-500 leading-relaxed italic">
                                        Los cambios operativos se registran para trazabilidad histórica.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Corporate Toast */}
            {toast.show && (
                <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 px-8 py-5 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-10 z-[1000] border ${toast.type === 'error' ? 'bg-rose-600 text-white border-rose-500 shadow-rose-600/20' : 'bg-slate-900 text-white border-slate-800 shadow-slate-900/20'}`}>
                    {toast.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} className="text-emerald-400" />}
                    <p className="text-sm font-bold tracking-tight">{toast.message}</p>
                </div>
            )}
        </div>
    );
};

const ModeOption = ({ active, onClick, icon, title, description, color }) => {
    const variants = {
        indigo: 'border-indigo-600 ring-4 ring-indigo-600/5 bg-indigo-50/30 dark:bg-indigo-900/10',
        amber: 'border-amber-500 ring-4 ring-amber-500/5 bg-amber-50/30 dark:bg-amber-900/10',
        emerald: 'border-emerald-600 ring-4 ring-emerald-600/5 bg-emerald-50/30 dark:bg-emerald-900/10',
        slate: 'border-slate-800 ring-4 ring-slate-800/5 bg-slate-50 dark:bg-slate-800/30'
    };

    return (
        <div 
            onClick={onClick}
            className={`group relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${active ? variants[color] : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:border-slate-200 dark:hover:border-slate-700'}`}
        >
            <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'}`}>
                    {React.cloneElement(icon, { size: 24 })}
                </div>
                <div className="flex-1">
                    <h3 className={`text-base font-bold mb-1 ${active ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>{title}</h3>
                    <p className={`text-[11px] font-medium leading-relaxed ${active ? 'text-slate-600 dark:text-slate-400' : 'text-slate-500'}`}>{description}</p>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-1 transition-all duration-300 ${active ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 dark:border-slate-700'}`}>
                    {active && <CheckCircle size={14} strokeWidth={3} />}
                </div>
            </div>
        </div>
    );
};

const GlassToggle = ({ icon, title, active, onChange }) => {
    return (
        <div className="flex items-center justify-between group cursor-pointer" onClick={() => onChange(!active)}>
            <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-white/5 text-slate-500 group-hover:text-slate-400'}`}>
                    {icon}
                </div>
                <span className={`text-[13px] font-bold tracking-tight transition-colors ${active ? 'text-white' : 'text-slate-400'}`}>{title}</span>
            </div>
            <div className={`w-14 h-7 rounded-full p-1 transition-all duration-300 relative ${active ? 'bg-indigo-600' : 'bg-white/10'}`}>
                <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 transform ${active ? 'translate-x-7' : 'translate-x-0'}`}></div>
            </div>
        </div>
    );
};

export default OperationalSettings;
