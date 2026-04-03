import React, { useState, useEffect } from 'react';
import { 
    AlertCircle, CheckCircle, Send, History, 
    X, Plus, Megaphone, Clock, User as UserIcon,
    ChevronRight, Eye, Trash2, Mail
} from 'lucide-react';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import HelpIcon from '../../components/Shared/HelpIcon';
import EliteRichEditor from '../../components/Shared/EliteRichEditor';

const CommunicationsCenter = ({ user }) => {
    const [communications, setCommunications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showNewModal, setShowNewModal] = useState(false);
    const [newData, setNewData] = useState({ title: '', body: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
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

    useEffect(() => { fetchHistory(); }, []);

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    };

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const res = await api.get('/comunicados');
            setCommunications(res.data);
        } catch (err) {
            showToast("Error al sincronizar historial", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleBroadcast = async (e) => {
        e.preventDefault();
        if (!newData.title.trim() || !newData.body.trim()) {
            showToast("Complete todos los campos", "error");
            return;
        }

        try {
            setIsSubmitting(true);
            await api.post('/comunicados/broadcast', newData);
            showToast("📢 Comunicado Elite enviado con éxito");
            setShowNewModal(false);
            setNewData({ title: '', body: '' });
            fetchHistory();
        } catch (err) {
            showToast("Error al disparar comunicado", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto', animation: 'fadeIn 0.5s ease-out' }}>
            {/* Header V69 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '8px' }}>
                        <div style={{ width: '40px', height: '40px', background: activeColors.accent, color: 'white', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 20px rgba(79, 70, 229, 0.2)' }}>
                            <Megaphone size={22} />
                        </div>
                        <h1 style={{ fontSize: '2.4rem', fontWeight: '950', color: activeColors.textMain, margin: 0, letterSpacing: '-0.03em' }}>Centro de Comunicados PR</h1>
                    </div>
                    <p style={{ color: activeColors.textMuted, fontWeight: '700', fontSize: '1rem' }}>Difusión estratégica y masiva de cultura corporativa</p>
                </div>

                <button 
                    onClick={() => setShowNewModal(true)} 
                    className="btn-premium btn-premium-primary" 
                    style={{ height: '56px', padding: '0 35px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}
                >
                    <Plus size={22} /> Emitir Nuevo PR
                </button>
            </div>

            {/* Quick Stats Banner */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '25px', marginBottom: '40px' }}>
                <StatCard icon={<Mail color="#6366f1" />} label="Total Difundidos" value={communications.length} bgColor="rgba(99, 102, 241, 0.1)" />
                <StatCard icon={<Eye color="#10b981" />} label="Alcance Estimado" value="100% de la Cía" bgColor="rgba(16, 185, 129, 0.1)" />
                <StatCard icon={<Send color="#f59e0b" />} label="Canales Activos" value="Push + App" bgColor="rgba(245, 158, 11, 0.1)" />
            </div>

            {/* History Table/List */}
            <h3 style={{ fontSize: '11px', fontWeight: '950', color: activeColors.textMuted, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <History size={16} /> Registro Histórico de Difusión
            </h3>

            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', gap: '20px' }}>
                    <div className="loader-v12"></div>
                    <p style={{ fontSize: '11px', fontWeight: '900', color: activeColors.textMuted, textTransform: 'uppercase', letterSpacing: '0.2em' }}>Auditando Canales...</p>
                </div>
            ) : communications.length === 0 ? (
                <div style={{ background: activeColors.card, borderRadius: '40px', padding: '80px', textAlign: 'center', border: `1px solid ${activeColors.border}` }}>
                    <div style={{ width: '80px', height: '80px', background: isDarkMode ? '#1e293b' : '#f8fafc', borderRadius: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 25px', color: '#cbd5e1' }}>
                        <Megaphone size={40} />
                    </div>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: '950', color: activeColors.textMain, margin: '0 0 10px' }}>Sin Comunicados Previos</h3>
                    <p style={{ color: activeColors.textMuted, fontWeight: '700', fontSize: '1rem', maxWidth: '400px', margin: '0 auto' }}>Comience a conectar con su equipo emitiendo su primer comunicado premium.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '20px' }}>
                    {communications.map(c => (
                        <div key={c.id} style={{ background: activeColors.card, borderRadius: '30px', padding: '25px 35px', border: `1px solid ${activeColors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.3s ease' }} className="hover:shadow-xl hover:border-indigo-500">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '25px', flex: 1 }}>
                                <div style={{ width: '52px', height: '52px', background: isDarkMode ? '#1e293b' : '#f8fafc', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: activeColors.accent }}>
                                    <AlertCircle size={24} />
                                </div>
                                <div>
                                    <h4 style={{ fontSize: '1.15rem', fontWeight: '950', color: activeColors.textMain, margin: '0 0 4px' }}>{c.titulo}</h4>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: activeColors.textMuted, fontSize: '0.8rem', fontWeight: '700' }}>
                                            <Clock size={14} /> {new Date(c.fechaEnvio).toLocaleString()}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: activeColors.textMuted, fontSize: '0.8rem', fontWeight: '700' }}>
                                            <UserIcon size={14} /> {c.createdByName}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                <div style={{ textAlign: 'right', paddingRight: '20px', borderRight: `1px solid ${activeColors.border}` }}>
                                    <p style={{ fontSize: '0.7rem', fontWeight: '950', color: activeColors.textMuted, textTransform: 'uppercase', marginBottom: '2px' }}>Estado</p>
                                    <p style={{ fontSize: '0.85rem', fontWeight: '950', color: '#10b981' }}>DIFUNDIDO</p>
                                </div>
                                <button style={{ width: '44px', height: '44px', borderRadius: '14px', background: isDarkMode ? '#1e293b' : '#f8fafc', border: `1px solid ${activeColors.border}`, color: activeColors.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="hover:text-indigo-500 hover:bg-slate-100 transition-colors">
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* New Broadcast Modal V69 */}
            {showNewModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(2, 6, 23, 0.85)', backdropFilter: 'blur(20px)', zIndex: 11000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: activeColors.card, width: '100%', maxWidth: '750px', borderRadius: '48px', border: `1px solid ${activeColors.border}`, boxShadow: '0 50px 100px rgba(0,0,0,0.5)', animation: 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)', overflow: 'hidden' }}>
                        <div style={{ padding: '35px 50px', borderBottom: `1px solid ${activeColors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isDarkMode ? '#1e293b' : '#ffffff' }}>
                             <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                                <div style={{ width: '56px', height: '56px', borderRadius: '18px', background: 'rgba(79, 70, 229, 0.1)', color: activeColors.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    < Megaphone size={28} />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1.4rem', fontWeight: '950', color: activeColors.textMain, margin: 0, letterSpacing: '-0.02em' }}>Elite PR Designer</h3>
                                    <p style={{ fontSize: '0.8rem', color: activeColors.textMuted, fontWeight: '700', margin: 0 }}>Redacte comunicaciones masivas de alto impacto</p>
                                </div>
                             </div>
                             <button onClick={() => setShowNewModal(false)} style={{ border: 'none', background: 'none', color: activeColors.textMuted }}><X size={28} /></button>
                        </div>
                        
                        <form onSubmit={handleBroadcast} style={{ padding: '45px 50px 50px' }}>
                            <div style={{ marginBottom: '30px' }}>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: '950', color: activeColors.textMuted, textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.15em' }}>Título del Comunicado *</label>
                                <input 
                                    required
                                    value={newData.title}
                                    onChange={(e) => setNewData({ ...newData, title: e.target.value })}
                                    placeholder="Ej: Transformación Digital TalentHuman 2026..."
                                    style={{ width: '100%', padding: '20px 25px', borderRadius: '20px', border: `2px solid ${activeColors.border}`, background: activeColors.bg, color: activeColors.textMain, fontWeight: '750', boxSizing: 'border-box', outline: 'none', fontSize: '1rem' }}
                                />
                            </div>

                            <div style={{ marginBottom: '40px' }}>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: '950', color: activeColors.textMuted, textTransform: 'uppercase', marginBottom: '15px', letterSpacing: '0.15em' }}>Contenido Estratégico (Media Rich) *</label>
                                <EliteRichEditor 
                                    value={newData.body}
                                    onChange={(html) => setNewData({ ...newData, body: html })}
                                    placeholder="Use el editor Elite para dar formato e insertar imágenes desde su nube..."
                                    isDarkMode={isDarkMode}
                                    accentColor={activeColors.accent}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '20px' }}>
                                <button type="button" onClick={() => setShowNewModal(false)} style={{ flex: 1, padding: '22px', borderRadius: '22px', border: `2px solid ${activeColors.border}`, background: 'transparent', color: activeColors.textMuted, fontWeight: '950', fontSize: '11px', textTransform: 'uppercase' }}>Descartar</button>
                                <button 
                                    type="submit" 
                                    disabled={isSubmitting}
                                    style={{ flex: 2, padding: '22px', borderRadius: '22px', border: 'none', background: activeColors.accent, color: 'white', fontWeight: '980', fontSize: '11px', textTransform: 'uppercase', boxShadow: '0 20px 40px rgba(79, 70, 229, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}
                                >
                                    {isSubmitting ? 'Ejecutando Difusión...' : 'DISPARAR COMUNICADO ELITE'}
                                    {!isSubmitting && <Send size={22} />}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Toasts V69 */}
            {toast.show && (
                <div style={{ position: 'fixed', bottom: '40px', right: '40px', zIndex: 12000, background: toast.type === 'success' ? '#10b981' : '#ef4444', color: 'white', padding: '20px 35px', borderRadius: '24px', fontWeight: '950', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.15em', display: 'flex', alignItems: 'center', gap: '15px', boxShadow: '0 25px 50px rgba(0,0,0,0.3)', animation: 'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                    {toast.type === 'success' ? <CheckCircle size={22} /> : <AlertCircle size={22} />}
                    {toast.message}
                </div>
            )}
        </div>
    );
};

const StatCard = ({ icon, label, value, bgColor }) => (
    <div style={{ background: 'white', borderRadius: '32px', padding: '30px', border: '1px solid rgba(0,0,0,0.04)', display: 'flex', gap: '20px', alignItems: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }} className="isDarkMode:bg-slate-800">
        <div style={{ width: '60px', height: '60px', borderRadius: '20px', background: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {icon}
        </div>
        <div>
            <p style={{ fontSize: '10px', fontWeight: '950', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>{label}</p>
            <p style={{ fontSize: '1.4rem', fontWeight: '980', color: '#1e293b', margin: 0 }}>{value}</p>
        </div>
    </div>
);

export default CommunicationsCenter;
