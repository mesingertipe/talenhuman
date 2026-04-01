import React, { useState, useEffect } from 'react';
import { 
    Settings, Save, Shield, HardDrive, Mail, 
    RefreshCw, CheckCircle, AlertCircle, Info,
    Key, Globe, Database, Cpu, Layout, ChevronRight,
    Lock, Terminal, Server, Bell, Activity, UserCircle2
} from 'lucide-react';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import IntegrationsManager from './IntegrationsManager';

const SystemSettings = () => {
    const [settings, setSettings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('infrastructure'); // 'infrastructure', 'email', 'security', 'integrations'
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const { isDarkMode } = useTheme();

    const activeColors = {
        bg: isDarkMode ? '#020617' : '#f8fafc',
        card: isDarkMode ? 'rgba(30, 41, 59, 0.7)' : '#ffffff',
        border: isDarkMode ? 'rgba(51, 65, 85, 0.5)' : '#f1f5f9',
        textMain: isDarkMode ? '#f1f5f9' : '#1e293b',
        textMuted: isDarkMode ? '#94a3b8' : '#64748b',
        accent: '#6366f1',
        accentSoft: 'rgba(99, 102, 241, 0.1)'
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const res = await api.get('/SystemSettings');
            setSettings(res.data);
        } catch (err) {
            showToast("Error al cargar configuraciones", "error");
        } finally {
            setLoading(false);
        }
    };

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ ...toast, show: false }), 3000);
    };

    const handleChange = (key, value) => {
        setSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s));
    };

    const handleSave = async (group) => {
        try {
            setSaving(true);
            const groupSettings = settings.filter(s => s.group === group);
            await api.post('/SystemSettings/batch', groupSettings);
            showToast(`Configuración de ${group} actualizada`);
        } catch (err) {
            showToast("Error al guardar cambios", "error");
        } finally {
            setSaving(false);
        }
    };

    const renderSettingInput = (s) => (
        <div key={s.key} className="space-y-3 group/field">
            <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 group-hover/field:text-indigo-400 transition-colors">
                    {s.key.replace(/_/g, ' ')}
                </label>
                {s.key.includes('SECRET') || s.key.includes('KEY') ? (
                    <Lock size={12} className="text-slate-300" />
                ) : null}
            </div>
            <div className="relative">
                <input 
                    type={s.key.includes('SECRET') || s.key.includes('KEY') ? 'password' : 'text'}
                    value={s.value}
                    onChange={(e) => handleChange(s.key, e.target.value)}
                    className="w-full p-4 rounded-2xl border-slate-200 bg-white/50 backdrop-blur-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-mono text-sm shadow-sm"
                    placeholder={`Ingrese ${s.key}...`}
                    style={{ border: `1px solid ${activeColors.border}` }}
                />
            </div>
            {s.description && (
                <div className="flex items-start gap-2 px-1">
                    <Info size={12} className="mt-0.5 text-indigo-400 shrink-0" />
                    <p className="text-[11px] text-slate-400 font-bold leading-relaxed">{s.description}</p>
                </div>
            )}
        </div>
    );

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
            <div className="relative">
                <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                <Cpu className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-600" size={24} />
            </div>
            <div className="text-center">
                <p className="text-slate-800 font-black uppercase tracking-widest text-sm">Sincronizando Núcleo</p>
                <p className="text-slate-400 font-bold text-[10px] mt-1">Cargando parámetros de alta disponibilidad...</p>
            </div>
        </div>
    );

    const navItems = [
        { id: 'infrastructure', label: 'Infraestructura', icon: Server, color: 'text-blue-500', bg: 'bg-blue-50' },
        { id: 'email', label: 'Email & Notificaciones', icon: Mail, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        { id: 'firebase', label: 'Firebase / PWA', icon: Activity, color: 'text-orange-500', bg: 'bg-orange-50' },
        { id: 'security', label: 'Seguridad & Auditoría', icon: Shield, color: 'text-rose-500', bg: 'bg-rose-50' },
        { id: 'integrations', label: 'Integraciones Externas', icon: Globe, color: 'text-indigo-500', bg: 'bg-indigo-50' }
    ];

    return (
        <div className="page-container animate-in fade-in duration-700" style={{ padding: '2rem 1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
            {/* Elite Header */}
            <div className="flex flex-wrap items-center justify-between mb-12 gap-8">
                <div className="space-y-2">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                            <Settings size={22} className="animate-pulse" />
                        </div>
                        <h1 className="text-4xl font-black text-slate-800 tracking-tighter" style={{ margin: 0 }}>Parámetros de Sistema</h1>
                    </div>
                    <p className="text-slate-400 font-bold text-sm">Gestión centralizada de infraestructura crítica y servicios de alta disponibilidad</p>
                </div>
                
                <div className="flex items-center gap-3 bg-red-50/50 backdrop-blur-md border border-red-100 p-5 rounded-[24px]">
                    <div className="w-10 h-10 bg-red-500 text-white rounded-xl flex items-center justify-center">
                        <Lock size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">Zona de Seguridad Nivel 4</p>
                        <p className="text-[11px] font-bold text-red-400">Restringido a SuperAdministradores</p>
                    </div>
                </div>
            </div>

            {/* Premium Tab Navigation */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-12">
                <div className="lg:col-span-1 space-y-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 mb-4">Módulos de Configuración</p>
                    <div className="flex flex-col gap-2 bg-slate-100/50 p-2 rounded-3xl border border-slate-100">
                        {navItems.map(item => (
                            <button 
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`flex items-center justify-between group p-4 rounded-2xl transition-all duration-300 ${activeTab === item.id ? 'bg-white text-indigo-600 shadow-xl shadow-indigo-100/50 translate-x-1' : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-2.5 rounded-xl transition-all ${activeTab === item.id ? item.bg : 'bg-slate-200/50 group-hover:bg-slate-200'}`}>
                                        <item.icon size={18} className={activeTab === item.id ? item.color : 'text-slate-400'} />
                                    </div>
                                    <span className="text-[11px] font-black uppercase tracking-tight">{item.label}</span>
                                </div>
                                <ChevronRight size={14} className={`transition-transform duration-300 ${activeTab === item.id ? 'rotate-90 translate-x-1' : 'opacity-0 group-hover:opacity-100'}`} />
                            </button>
                        ))}
                    </div>
                    
                    <div className="p-6 bg-indigo-600 rounded-3xl mt-8 text-white relative overflow-hidden shadow-2xl shadow-indigo-200 group">
                        <Activity className="absolute -right-4 -bottom-4 text-indigo-500 opacity-20 scale-150 group-hover:rotate-12 transition-transform duration-700" size={120} />
                        <h4 className="font-black text-lg mb-2 relative z-10">Estado del Núcleo</h4>
                        <div className="flex items-center gap-2 mb-4 relative z-10">
                            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></span>
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Online & Estable</span>
                        </div>
                        <p className="text-[10px] leading-relaxed opacity-70 relative z-10 font-bold">Todos los microsistemas operativos. Latencia de base de datos óptima.</p>
                    </div>
                </div>

                {/* Content Panel */}
                <div className="lg:col-span-3">
                    <div className="bg-white/70 backdrop-blur-xl rounded-[40px] border border-white shadow-2xl shadow-slate-200/50 min-h-[600px] flex flex-col overflow-hidden">
                        
                        {activeTab === 'infrastructure' && (
                            <div className="p-10 flex-1 animate-in slide-in-from-right-8 duration-500">
                                <div className="flex items-center justify-between mb-12">
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
                                            <HardDrive size={28} />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-slate-800 tracking-tight uppercase">DigitalOcean Spaces</h3>
                                            <p className="text-xs text-slate-400 font-bold">Infraestructura de Almacenamiento S3 Privada</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleSave('Storage')}
                                        disabled={saving}
                                        className="flex items-center gap-3 px-8 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50"
                                    >
                                        {saving ? <RefreshCw className="animate-spin" size={16} /> : <><Save size={16} /> Aplicar Cambios</>}
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                                    {settings.filter(s => s.group === 'Storage').length > 0 ? (
                                        settings.filter(s => s.group === 'Storage').map(renderSettingInput)
                                    ) : (
                                        <div className="col-span-2">
                                            <button 
                                                onClick={async () => {
                                                    const defaults = [
                                                        { key: 'DO_ACCESS_KEY', value: '', group: 'Storage', description: 'Access Key ID de DigitalOcean' },
                                                        { key: 'DO_SECRET_KEY', value: '', group: 'Storage', description: 'Secret Access Key de DigitalOcean' },
                                                        { key: 'DO_BUCKET_NAME', value: '', group: 'Storage', description: 'Nombre del Space' },
                                                        { key: 'DO_ENDPOINT', value: 'https://nyc3.digitaloceanspaces.com', group: 'Storage', description: 'Endpoint regional' }
                                                    ];
                                                    await api.post('/SystemSettings/batch', defaults);
                                                    fetchSettings();
                                                }}
                                                className="w-full p-12 border-2 border-dashed border-slate-200 rounded-[32px] text-slate-400 font-bold text-sm hover:border-indigo-400 hover:text-indigo-400 hover:bg-indigo-50/30 transition-all group"
                                            >
                                                <Database size={40} className="mx-auto mb-4 opacity-30 group-hover:scale-110 transition-transform" />
                                                + Inicializar parámetros de Storage Premium
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'email' && (
                            <div className="p-10 flex-1 animate-in slide-in-from-right-8 duration-500">
                                <div className="flex items-center justify-between mb-12">
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner">
                                            <Mail size={28} />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Resend Network</h3>
                                            <p className="text-xs text-slate-400 font-bold">Motor de Notificaciones y SMTP para Empresas</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleSave('Email')}
                                        disabled={saving}
                                        className="flex items-center gap-3 px-8 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50"
                                    >
                                        {saving ? <RefreshCw className="animate-spin" size={16} /> : <><Save size={16} /> Validar & Guardar</>}
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                                    {settings.filter(s => s.group === 'Email').length > 0 ? (
                                        settings.filter(s => s.group === 'Email').map(renderSettingInput)
                                    ) : (
                                        <div className="col-span-2">
                                            <button 
                                                onClick={async () => {
                                                    const defaults = [
                                                        { key: 'RESEND_API_KEY', value: '', group: 'Email', description: 'API Key de Resend.com para envío de correos' },
                                                        { key: 'EMAIL_FROM', value: 'no-reply@talenhuman.com', group: 'Email', description: 'Correo remitente autorizado' }
                                                    ];
                                                    await api.post('/SystemSettings/batch', defaults);
                                                    fetchSettings();
                                                }}
                                                className="w-full p-12 border-2 border-dashed border-slate-200 rounded-[32px] text-slate-400 font-bold text-sm hover:border-indigo-400 hover:text-indigo-400 hover:bg-emerald-50/30 transition-all group"
                                            >
                                                <Mail size={40} className="mx-auto mb-4 opacity-30 group-hover:scale-110 transition-transform" />
                                                + Configurar Canal de Comunicación
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'firebase' && (
                            <div className="p-10 flex-1 animate-in slide-in-from-right-8 duration-500">
                                <div className="flex items-center justify-between mb-12">
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center shadow-inner">
                                            <Activity size={28} />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Firebase Infrastructure</h3>
                                            <p className="text-xs text-slate-400 font-bold">Push Notifications & Biometrics Core</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleSave('Firebase')}
                                        disabled={saving}
                                        className="flex items-center gap-3 px-8 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50"
                                    >
                                        {saving ? <RefreshCw className="animate-spin" size={16} /> : <><Save size={16} /> Guardar Configuración</>}
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                                    {settings.filter(s => s.group === 'Firebase').length > 0 ? (
                                        settings.filter(s => s.group === 'Firebase').map(renderSettingInput)
                                    ) : (
                                        <div className="col-span-2">
                                            <button 
                                                onClick={async () => {
                                                    const defaults = [
                                                        { key: 'FIREBASE_API_KEY', value: '', group: 'Firebase', description: 'API Key de Firebase' },
                                                        { key: 'FIREBASE_AUTH_DOMAIN', value: '', group: 'Firebase', description: 'Dominio de autenticación' },
                                                        { key: 'FIREBASE_PROJECT_ID', value: '', group: 'Firebase', description: 'ID del Proyecto' },
                                                        { key: 'FIREBASE_STORAGE_BUCKET', value: '', group: 'Firebase', description: 'Bucket de Storage' },
                                                        { key: 'FIREBASE_MESSAGING_SENDER_ID', value: '', group: 'Firebase', description: 'Sender ID para mensajes' },
                                                        { key: 'FIREBASE_APP_ID', value: '', group: 'Firebase', description: 'App ID (Web)' },
                                                        { key: 'FIREBASE_MEASUREMENT_ID', value: '', group: 'Firebase', description: 'ID de Analytics' },
                                                        { key: 'FIREBASE_VAPID_KEY', value: '', group: 'Firebase', description: 'Clave pública VAPID para Push' }
                                                    ];
                                                    await api.post('/SystemSettings/batch', defaults);
                                                    fetchSettings();
                                                }}
                                                className="w-full p-12 border-2 border-dashed border-slate-200 rounded-[32px] text-slate-400 font-bold text-sm hover:border-indigo-400 hover:text-indigo-400 hover:bg-orange-50/30 transition-all group"
                                            >
                                                <Activity size={40} className="mx-auto mb-4 opacity-30 group-hover:scale-110 transition-transform" />
                                                + Inicializar parámetros de Firebase Global
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="p-10 flex-1 animate-in slide-in-from-right-8 duration-500">
                                <div className="flex items-center justify-between mb-12">
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shadow-inner">
                                            <Shield size={28} />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Seguridad del Núcleo</h3>
                                            <p className="text-xs text-slate-400 font-bold">Gestión de Identidad y Auditoría de Acceso</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col gap-4">
                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-rose-600 shadow-sm">
                                            <Terminal size={20} />
                                        </div>
                                        <div>
                                            <h5 className="font-bold text-slate-800 text-sm">Sesiones Globales</h5>
                                            <p className="text-[11px] text-slate-500 font-medium">Control de expiración de tokens JWT.</p>
                                        </div>
                                        <div className="mt-auto">
                                            <span className="text-[10px] font-black text-indigo-600 uppercase">PRÓXIMA VERSIÓN V13</span>
                                        </div>
                                    </div>
                                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col gap-4">
                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-rose-600 shadow-sm">
                                            <Bell size={20} />
                                        </div>
                                        <div>
                                            <h5 className="font-bold text-slate-800 text-sm">Alertas de Intrusión</h5>
                                            <p className="text-[11px] text-slate-500 font-medium">Notificar sobre accesos desde IPs desconocidas.</p>
                                        </div>
                                        <div className="mt-auto">
                                            <span className="text-[10px] font-black text-indigo-600 uppercase">PRÓXIMA VERSIÓN V13</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'integrations' && (
                            <div className="flex-1 animate-in slide-in-from-right-8 duration-500">
                                <IntegrationsManager showToast={showToast} />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Premium Toasts */}
            {toast.show && (
                <div className="fixed bottom-10 right-10 z-[1000] animate-in slide-in-from-bottom-10">
                    <div className={`flex items-center gap-4 px-8 py-4 rounded-[28px] shadow-2xl backdrop-blur-md border ${toast.type === 'success' ? 'bg-emerald-500/90 border-emerald-400 text-white' : 'bg-red-500/90 border-red-400 text-white'}`}>
                        {toast.type === 'success' ? <CheckCircle size={22} /> : <AlertCircle size={22} />}
                        <span className="text-[11px] font-black uppercase tracking-widest">{toast.message}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SystemSettings;
