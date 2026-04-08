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
            showToast("Protocolos sincronizados exitosamente", "success");
        } catch (err) {
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
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Kernel V14 Sync</p>
        </div>
    );

    return (
        <div className={`min-h-screen ${isDarkMode ? 'dark' : ''} bg-[#f9fafb] dark:bg-[#030712] p-4 md:p-8 transition-all duration-500`}>
            
            <div className="max-w-6xl mx-auto space-y-6">
                
                {/* Minimalist Action Bar - Integrated & Precise */}
                <div className="flex items-center justify-between bg-white dark:bg-slate-900 px-8 py-5 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                            <Settings size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Opciones Operativas</h2>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Protocolos de Kernel V14</p>
                        </div>
                    </div>
                    
                    <button 
                        onClick={handleSaveRequest}
                        disabled={saving}
                        className="group flex items-center gap-2 bg-indigo-600 hover:bg-black dark:hover:bg-white dark:hover:text-black text-white px-8 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/10 active:scale-95 disabled:grayscale"
                    >
                        {saving ? (
                            <div className="animate-spin h-3.5 w-3.5 border-2 border-white rounded-full border-t-transparent"></div>
                        ) : (
                            <Save size={14} />
                        )}
                        {saving ? 'Procesando' : 'Aplicar'}
                    </button>
                </div>

                <div className="grid lg:grid-cols-12 gap-6">
                    
                    {/* Main Settings Grid */}
                    <div className="lg:col-span-8 space-y-6">
                        
                        {/* 1. MOTOR DE ASISTENCIA */}
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-white/5 space-y-6">
                            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-white/5 pb-4">
                                <Clock size={16} className="text-indigo-600" />
                                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Motor de Asistencia</h3>
                            </div>
                            
                            <div className="grid md:grid-cols-2 gap-4">
                                <MinimalistCard 
                                    active={settings.attendanceMode === 0}
                                    onClick={() => setSettings({...settings, attendanceMode: 0})}
                                    title="Protocolo Min-Max"
                                    description="Basado en los extremos de la jornada."
                                    icon={<Smartphone size={16} />}
                                />
                                <MinimalistCard 
                                    active={settings.attendanceMode === 1}
                                    onClick={() => setSettings({...settings, attendanceMode: 1})}
                                    title="Modo Secuencial"
                                    description="Auditoría total de todos los registros."
                                    icon={<ListOrdered size={16} />}
                                />
                            </div>
                        </div>

                        {/* 2. FLUJO DE APROBACIÓN */}
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-white/5 space-y-6">
                            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-white/5 pb-4">
                                <Shield size={16} className="text-amber-500" />
                                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Flujo de Aprobación</h3>
                            </div>
                            
                            <div className="grid md:grid-cols-2 gap-4">
                                <MinimalistCard 
                                    active={settings.shiftApprovalMode === 0}
                                    onClick={() => setSettings({...settings, shiftApprovalMode: 0})}
                                    title="Nivel Central (RH)"
                                    description="Validación unificada en administración."
                                    icon={<Users size={16} />}
                                />
                                <MinimalistCard 
                                    active={settings.shiftApprovalMode === 1}
                                    onClick={() => setSettings({...settings, shiftApprovalMode: 1})}
                                    title="Nivel Distrital"
                                    description="Delegación regional y supervisores."
                                    icon={<UserCheck size={16} />}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Configuration */}
                    <div className="lg:col-span-4 space-y-6">
                        
                        {/* 3. ALERTAS SMART */}
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-white/5 space-y-8">
                            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-white/5 pb-4">
                                <Bell size={16} className="text-indigo-600" />
                                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Alertas Smart</h3>
                            </div>
                            
                            <div className="space-y-6">
                                <SimpleToggle 
                                    icon={<Mail size={16} />}
                                    title="Email Sync"
                                    active={settings.enableEmailNotifications}
                                    onChange={(val) => setSettings({...settings, enableEmailNotifications: val})}
                                />
                                <SimpleToggle 
                                    icon={<Smartphone size={16} />}
                                    title="Push App"
                                    active={settings.enablePushNotifications}
                                    onChange={(val) => setSettings({...settings, enablePushNotifications: val})}
                                />
                            </div>
                            
                            <div className="mt-8 p-6 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5">
                                <div className="flex items-start gap-4">
                                    <ShieldCheck size={18} className="text-indigo-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-900 dark:text-white">Audit Enabled</h4>
                                        <p className="text-[9px] font-bold text-slate-400 leading-normal mt-1 italic">
                                            Logs de sistema activos 24/7.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirmation Modal - Precise Minimalist */}
            {showConfirm && (
                <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-[#0f172a] w-full max-w-sm rounded-2xl border border-slate-200 dark:border-white/10 animate-in zoom-in-95 duration-200 shadow-2xl">
                        <div className="p-8 text-center">
                            <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle size={24} />
                            </div>
                            <h3 className="text-lg font-black dark:text-white tracking-tight mb-2">¿Sincronizar cambios?</h3>
                            <p className="text-xs font-bold text-slate-500 leading-relaxed">
                                Los protocolos operativos se actualizarán de forma irreversible.
                            </p>
                        </div>
                        <div className="flex border-t border-slate-100 dark:border-white/5">
                            <button 
                                onClick={() => setShowConfirm(false)}
                                className="flex-1 px-8 py-4 font-black text-[9px] uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={confirmSave}
                                className="flex-1 px-8 py-4 bg-indigo-600 text-white font-black text-[9px] uppercase tracking-widest hover:bg-black transition-all"
                            >
                                Aplicar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Precision Toast */}
            {toast.show && (
                <div className={`fixed bottom-6 right-6 flex items-center gap-3 px-6 py-4 rounded-xl shadow-xl animate-in slide-in-from-right-10 z-[3000] border border-white/5 ${toast.type === 'error' ? 'bg-rose-600 text-white shadow-rose-600/20' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-950'}`}>
                    {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} className={isDarkMode ? 'text-indigo-600' : 'text-emerald-400'} />}
                    <span className="text-[9px] font-black uppercase tracking-widest">{toast.message}</span>
                </div>
            )}
        </div>
    );
};

const MinimalistCard = ({ active, onClick, title, description, icon }) => {
    return (
        <div 
            onClick={onClick}
            className={`group p-6 rounded-xl border-[1.5px] cursor-pointer transition-all duration-200 flex flex-col gap-3 ${active ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-600/10' : 'border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10'}`}
        >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${active ? 'bg-indigo-600 text-white' : 'bg-slate-50 dark:bg-white/5 text-slate-400'}`}>
                {icon}
            </div>
            <div>
                <h4 className={`text-[13px] font-black tracking-tight mb-1 ${active ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-400'}`}>{title}</h4>
                <p className={`text-[10px] font-bold leading-normal ${active ? 'text-indigo-600/80 dark:text-indigo-400/80' : 'text-slate-400'}`}>{description}</p>
            </div>
        </div>
    );
};

const SimpleToggle = ({ icon, title, active, onChange }) => {
    return (
        <div className="flex items-center justify-between group cursor-pointer" onClick={() => onChange(!active)}>
            <div className="flex items-center gap-3">
                <div className={`transition-all ${active ? 'text-indigo-600' : 'text-slate-400'}`}>
                    {icon}
                </div>
                <span className={`text-[10px] font-black tracking-widest uppercase transition-colors ${active ? 'text-slate-900 dark:text-white' : 'text-slate-400 group-hover:text-slate-600'}`}>{title}</span>
            </div>
            <div className={`w-8 h-4 rounded-full p-0.5 transition-all duration-300 relative ${active ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-white/10'}`}>
                <div className={`w-3 h-3 rounded-full bg-white shadow-sm transition-all duration-300 transform ${active ? 'translate-x-4' : 'translate-x-0'}`}></div>
            </div>
        </div>
    );
};

export default OperationalSettings;
