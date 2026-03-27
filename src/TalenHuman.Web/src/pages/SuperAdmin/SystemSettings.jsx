import React, { useState, useEffect } from 'react';
import { 
    Settings, Save, Shield, HardDrive, Mail, 
    RefreshCw, CheckCircle, AlertCircle, Info,
    Key, Globe, Database, Cpu
} from 'lucide-react';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

const SystemSettings = () => {
    const [settings, setSettings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const { isDarkMode } = useTheme();

    const activeColors = {
        bg: isDarkMode ? '#0f172a' : '#f8fafc',
        card: isDarkMode ? '#1e293b' : '#ffffff',
        border: isDarkMode ? '#334155' : '#f1f5f9',
        textMain: isDarkMode ? '#f1f5f9' : '#1e293b',
        textMuted: isDarkMode ? '#94a3b8' : '#64748b',
        accent: '#4f46e5'
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
        <div key={s.key} className="space-y-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">
                {s.key.replace(/_/g, ' ')}
            </label>
            <div className="relative">
                <input 
                    type={s.key.includes('SECRET') || s.key.includes('KEY') ? 'password' : 'text'}
                    value={s.value}
                    onChange={(e) => handleChange(s.key, e.target.value)}
                    className="w-full p-4 rounded-2xl border-slate-200 bg-slate-50/50 focus:ring-2 focus:ring-indigo-500 transition-all font-mono text-sm"
                    placeholder={`Ingrese ${s.key}...`}
                />
            </div>
            {s.description && <p className="text-[10px] text-slate-400 font-medium italic">{s.description}</p>}
        </div>
    );

    const settingGroups = [...new Set(settings.map(s => s.group))];

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <RefreshCw className="animate-spin text-indigo-500" size={40} />
            <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Sincronizando Nucleo...</p>
        </div>
    );

    return (
        <div className="page-container animate-in fade-in duration-500" style={{ padding: '2rem 1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div className="flex flex-wrap items-center justify-between mb-12 gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter" style={{ margin: 0 }}>Parámetros del Sistema</h1>
                    <p className="text-slate-500 font-bold text-sm mt-2">Configuración crítica de infraestructura y servicios externos</p>
                </div>
                <div className="flex items-center gap-3 bg-red-50 border border-red-100 p-4 rounded-2xl">
                    <Shield className="text-red-500" size={24} />
                    <div className="text-left">
                        <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">Zona Restringida</p>
                        <p className="text-[11px] font-bold text-red-400">Solo SuperAdministradores</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* DigitalOcean Section */}
                <div className="card scroll-reveal" style={{ padding: '2rem' }}>
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm">
                                <HardDrive size={24} />
                            </div>
                            <div>
                                <h3 className="font-black text-slate-800 uppercase tracking-tight">DigitalOcean Spaces</h3>
                                <p className="text-xs text-slate-400 font-bold">Almacenamiento S3 Compatible</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => handleSave('Storage')}
                            disabled={saving}
                            className="btn-premium btn-premium-primary"
                            style={{ height: '40px', padding: '0 20px', borderRadius: '12px' }}
                        >
                            {saving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
                        </button>
                    </div>

                    <div className="space-y-6">
                        {settings.filter(s => s.group === 'Storage').map(renderSettingInput)}
                        {settings.filter(s => s.group === 'Storage').length === 0 && (
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
                                className="w-full p-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold text-sm hover:border-indigo-400 hover:text-indigo-400 transition-all"
                            >
                                + Inicializar parámetros de Storage
                            </button>
                        )}
                    </div>
                </div>

                {/* Email Section */}
                <div className="card scroll-reveal" style={{ padding: '2rem' }}>
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm">
                                <Mail size={24} />
                            </div>
                            <div>
                                <h3 className="font-black text-slate-800 uppercase tracking-tight">Resend Email</h3>
                                <p className="text-xs text-slate-400 font-bold">Servicio de Notificaciones</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => handleSave('Email')}
                            disabled={saving}
                            className="btn-premium btn-premium-primary"
                            style={{ height: '40px', padding: '0 20px', borderRadius: '12px' }}
                        >
                            {saving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
                        </button>
                    </div>

                    <div className="space-y-6">
                        {settings.filter(s => s.group === 'Email').map(renderSettingInput)}
                        {settings.filter(s => s.group === 'Email').length === 0 && (
                            <button 
                                onClick={async () => {
                                    const defaults = [
                                        { key: 'RESEND_API_KEY', value: '', group: 'Email', description: 'API Key de Resend.com' },
                                        { key: 'EMAIL_FROM', value: 'no-reply@talenhuman.com', group: 'Email', description: 'Remitente autorizado' }
                                    ];
                                    await api.post('/SystemSettings/batch', defaults);
                                    fetchSettings();
                                }}
                                className="w-full p-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold text-sm hover:border-indigo-400 hover:text-indigo-400 transition-all"
                            >
                                + Inicializar parámetros de Email
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {toast.show && (
                <div className="toast-container">
                    <div className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>
                        {toast.type === 'success' ? <CheckCircle size={20} className="text-emerald-500" /> : <AlertCircle size={20} className="text-red-500" />}
                        {toast.message}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SystemSettings;
