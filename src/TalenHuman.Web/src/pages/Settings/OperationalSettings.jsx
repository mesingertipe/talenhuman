import React, { useState, useEffect } from 'react';
import { 
    Settings, Shield, Bell, Mail, Smartphone, Save, 
    CheckCircle, Clock, ListOrdered, UserCheck, Users, Info, AlertCircle
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
            showToast("Configuraciones guardadas con éxito");
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
        <div className="flex flex-col items-center justify-center h-96 gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Cargando reglas operativas...</p>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto py-12 px-6 animate-in fade-in duration-700">
            {/* Elite Header V13.0 */}
            <div className="bg-white dark:bg-slate-800 rounded-[40px] p-10 mb-12 border border-indigo-100 dark:border-slate-700/50 shadow-xl shadow-indigo-100/20 dark:shadow-none flex flex-col md:flex-row items-center justify-between gap-8 animate-in slide-in-from-top-6 duration-700">
                <div className="flex items-center gap-8">
                    <div className="w-20 h-20 bg-indigo-600 rounded-[28px] flex items-center justify-center text-white shadow-2xl shadow-indigo-500/40 transform -rotate-3">
                        <Settings size={36} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-[950] tracking-tight text-slate-900 dark:text-white leading-none">
                            Configuraciones <span className="text-indigo-600">Operativas</span>
                        </h1>
                        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mt-3">Elite V13.0 Evolution: Control de asistencia</p>
                    </div>
                </div>
                
                <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="group flex items-center justify-center gap-4 bg-indigo-600 hover:bg-black disabled:bg-slate-300 text-white px-10 py-5 rounded-[22px] font-black text-xs uppercase tracking-widest transition-all shadow-2xl shadow-indigo-200 dark:shadow-none hover:scale-105 active:scale-95"
                >
                    {saving ? <div className="animate-spin h-5 w-5 border-3 border-white rounded-full border-t-transparent"></div> : <Save size={20} className="group-hover:rotate-12 transition-transform" />}
                    {saving ? 'Sincronizando' : 'Guardar Cambios'}
                </button>
            </div>

            <div className="grid gap-10">
                {/* Attendance Mode Section */}
                <div className="bg-white dark:bg-slate-800 p-8 md:p-12 rounded-[40px] border border-slate-100 dark:border-slate-700/50 shadow-sm">
                    <div className="flex items-center gap-5 mb-10">
                        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-3xl">
                            <Clock className="text-indigo-600 dark:text-indigo-400" size={28} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black dark:text-white tracking-tight">Motor de Asistencia</h2>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Algoritmo de consolidación de marcaciones</p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <ModeCard 
                            active={settings.attendanceMode === 0}
                            onClick={() => setSettings({...settings, attendanceMode: 0})}
                            icon={<Smartphone size={28} />}
                            title="Resumen Min-Max Absoluto"
                            description="Toma solo la primera y última marca. Ideal para ignorar marcas de almuerzos o salidas cortas."
                            badge="Recomendado"
                            color="indigo"
                        />
                        <ModeCard 
                            active={settings.attendanceMode === 1}
                            onClick={() => setSettings({...settings, attendanceMode: 1})}
                            icon={<ListOrdered size={28} />}
                            title="Consolidación Secuencial"
                            description="Registra cada par de entrada y salida cronológicamente. Reporte de tiempo total detallado."
                            color="slate"
                        />
                    </div>
                </div>

                {/* Approval Flow Section */}
                <div className="bg-white dark:bg-slate-800 p-8 md:p-12 rounded-[40px] border border-slate-100 dark:border-slate-700/50 shadow-sm">
                    <div className="flex items-center gap-5 mb-10">
                        <div className="p-4 bg-amber-50 dark:bg-amber-900/30 rounded-3xl">
                            <Shield className="text-amber-600 dark:text-amber-400" size={28} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black dark:text-white tracking-tight">Flujo de Aprobación</h2>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Autoridad validante de la programación semanal</p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <ModeCard 
                            active={settings.shiftApprovalMode === 0}
                            onClick={() => setSettings({...settings, shiftApprovalMode: 0})}
                            icon={<Users size={28} />}
                            title="RH Nacional"
                            description="Un único usuario o equipo de Recursos Humanos aprueba los turnos de todas las sedes."
                            color="amber"
                        />
                        <ModeCard 
                            active={settings.shiftApprovalMode === 1}
                            onClick={() => setSettings({...settings, shiftApprovalMode: 1})}
                            icon={<UserCheck size={28} />}
                            title="Gerencia Distrital"
                            description="Cada supervisor de distrito valida exclusivamente la malla de sus tiendas asignadas."
                            color="emerald"
                        />
                    </div>
                </div>

                {/* Notifications Section */}
                <div className="bg-white dark:bg-slate-800 p-8 md:p-12 rounded-[40px] border border-slate-100 dark:border-slate-700/50 shadow-sm">
                    <div className="flex items-center gap-5 mb-10">
                        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/30 rounded-3xl">
                            <Bell className="text-emerald-600 dark:text-emerald-400" size={28} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black dark:text-white tracking-tight">Reglas de Notificación</h2>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Automatización de correos y alertas push</p>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <ToggleItem 
                            icon={<Mail size={22} />}
                            title="Notificaciones vía Email"
                            description="Aviso inmediato a gerentes al momento de aprobación o rechazo de su programación."
                            active={settings.enableEmailNotifications}
                            onChange={(val) => setSettings({...settings, enableEmailNotifications: val})}
                        />
                        <div className="h-px bg-slate-100 dark:bg-slate-700/50"></div>
                        <ToggleItem 
                            icon={<Smartphone size={22} />}
                            title="Push Masivo (App Mobile)"
                            description="Envío de alerta inmediata a los empleados cuando sus turnos han sido aprobados."
                            active={settings.enablePushNotifications}
                            onChange={(val) => setSettings({...settings, enablePushNotifications: val})}
                        />
                    </div>
                </div>
            </div>

            {/* Help Note Case Josefina */}
            <div className="mt-12 p-8 bg-slate-900 text-slate-400 rounded-[32px] flex items-start gap-5 border-l-8 border-indigo-500">
                <Info size={32} className="text-indigo-400 flex-shrink-0" />
                <div>
                    <h4 className="text-white font-black text-xs uppercase tracking-widest mb-1">Match Inteligente V13 Activo</h4>
                    <p className="text-[11px] font-medium leading-relaxed opacity-80 uppercase tracking-tight">
                        El sistema normaliza automáticamente las identificaciones (Cédulas) eliminando ceros redundantes. 
                        Esto asegura que colaboradores como Josefine (ID 97707) sincronicen correctamente aunque el biométrico envíe 097707.
                    </p>
                </div>
            </div>

            {/* Toast System */}
            {toast.show && (
                <div className={`fixed bottom-12 right-12 flex items-center gap-4 px-10 py-6 rounded-[32px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] animate-in slide-in-from-bottom-10 font-black text-[11px] uppercase tracking-widest z-[9999] ${toast.type === 'error' ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'}`}>
                    {toast.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
                    {toast.message}
                </div>
            )}
        </div>
    );
};

const ModeCard = ({ active, onClick, icon, title, description, badge, color }) => {
    const themeCols = {
        indigo: 'border-indigo-600 bg-indigo-500/5 ring-8 ring-indigo-500/5 text-indigo-600',
        amber: 'border-amber-500 bg-amber-500/5 ring-8 ring-amber-500/5 text-amber-600',
        emerald: 'border-emerald-500 bg-emerald-500/5 ring-8 ring-emerald-500/5 text-emerald-600',
        slate: 'border-slate-500 bg-slate-500/5 ring-8 ring-slate-500/5 text-slate-600'
    };

    return (
        <div 
            onClick={onClick}
            className={`group relative p-8 rounded-[35px] border-3 cursor-pointer transition-all duration-500 hover:scale-[1.02] ${active ? themeCols[color] : 'border-slate-100 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-800/20'}`}
        >
            {badge && (
                <span className="absolute -top-4 left-6 px-4 py-2 bg-indigo-600 text-[9px] font-black tracking-widest text-white rounded-xl shadow-lg shadow-indigo-500/30 z-10">
                    {badge}
                </span>
            )}
            <div className="flex flex-col gap-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110 flex-shrink-0 ${active ? 'bg-current text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
                    {icon}
                </div>
                <div>
                    <h3 className={`text-lg font-black tracking-tight mb-2 ${active ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>{title}</h3>
                    <p className={`text-xs font-bold leading-relaxed ${active ? 'text-slate-700 dark:text-slate-400' : 'text-slate-500'}`}>{description}</p>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center ${active ? 'bg-current border-current' : 'border-slate-300 dark:border-slate-600'}`}>
                    {active && <CheckCircle size={14} className="text-white" />}
                </div>
            </div>
        </div>
    );
};

const ToggleItem = ({ icon, title, description, active, onChange }) => {
    return (
        <div className="flex items-center justify-between gap-6 group w-full">
            <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className={`p-4 rounded-2xl transition-all duration-300 flex-shrink-0 ${active ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20 scale-105' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
                    {icon}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-[950] text-slate-900 dark:text-white text-base tracking-tight mb-0.5 truncate">{title}</h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest line-clamp-2">{description}</p>
                </div>
            </div>
            <button 
                onClick={() => onChange(!active)}
                className={`w-20 h-10 rounded-full p-1.5 transition-all duration-500 shadow-inner relative flex-shrink-0 ${active ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}
            >
                <div className={`w-7 h-7 rounded-full bg-white shadow-2xl transition-all duration-500 transform ${active ? 'translate-x-10 scale-110' : 'translate-x-0'}`}></div>
            </button>
        </div>
    );
};

export default OperationalSettings;
