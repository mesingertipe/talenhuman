import React, { useState, useEffect } from 'react';
// TalenHuman Communications Center (V63.7 Elite)
import { 
    AlertCircle, CheckCircle, Send, History, 
    X, Plus, Megaphone, Clock, User as UserIcon,
    ChevronRight, Eye, Trash2, Mail, Edit3, Calendar, ToggleLeft, ToggleRight
} from 'lucide-react';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import EliteRichEditor from '../../components/Shared/EliteRichEditor';

const CommunicationsCenter = ({ user }) => {
    const [communications, setCommunications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    
    const [formData, setFormData] = useState({ 
        title: '', 
        body: '', 
        imageUrl: '',
        fechaInicio: '',
        fechaFin: '',
        isActive: true
    });
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const { isDarkMode } = useTheme();

    const colors = {
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

    const handleOpenCreate = () => {
        setIsEditing(false);
        setEditingId(null);
        setFormData({ title: '', body: '', imageUrl: '', fechaInicio: '', fechaFin: '', isActive: true });
        setShowModal(true);
    };

    const handleOpenEdit = (c) => {
        setIsEditing(true);
        setEditingId(c.id);
        setFormData({ 
            title: c.titulo, 
            body: c.contenido, 
            imageUrl: c.imagenUrl || '',
            fechaInicio: c.fechaInicio ? c.fechaInicio.split('T')[0] : '',
            fechaFin: c.fechaFin ? c.fechaFin.split('T')[0] : '',
            isActive: c.isActive 
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title.trim() || !formData.body.trim()) {
            showToast("Complete todos los campos obligatorios", "error");
            return;
        }

        try {
            setIsSubmitting(true);
            if (isEditing) {
                await api.put(`/comunicados/${editingId}`, {
                    title: formData.title,
                    body: formData.body,
                    imageUrl: formData.imageUrl,
                    fechaInicio: formData.fechaInicio || null,
                    fechaFin: formData.fechaFin || null,
                    isActive: formData.isActive
                });
                showToast("Comunicado actualizado correctamente");
            } else {
                await api.post('/comunicados/broadcast', {
                    title: formData.title,
                    body: formData.body,
                    imageUrl: formData.imageUrl,
                    fechaInicio: formData.fechaInicio || null,
                    fechaFin: formData.fechaFin || null,
                    isActive: true
                });
                showToast("🚀 Comunicado disparado con éxito");
            }
            setShowModal(false);
            fetchHistory();
        } catch (err) {
            showToast("Error en la operación", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("¿Estás seguro de eliminar este comunicado? Esta acción no se puede deshacer.")) return;
        
        try {
            await api.delete(`/comunicados/${id}`);
            showToast("Comunicado eliminado definitivamente");
            fetchHistory();
        } catch (err) {
            showToast("Error al eliminar el comunicado", "error");
        }
    };

    return (
        <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto', animation: 'fadeIn 0.5s ease-out' }}>
            {/* Header V63.7 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '8px' }}>
                        <div style={{ width: '40px', height: '40px', background: colors.accent, color: 'white', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 20px rgba(79, 70, 229, 0.2)' }}>
                            <Megaphone size={22} />
                        </div>
                        <h1 style={{ fontSize: '2.4rem', fontWeight: '950', color: colors.textMain, margin: 0, letterSpacing: '-0.03em' }}>Comunicaciones PR</h1>
                    </div>
                    <p style={{ color: colors.textMuted, fontWeight: '700', fontSize: '1rem' }}>Gestión estratégica de vigencia y visibilidad corporativa</p>
                </div>

                <button 
                    onClick={handleOpenCreate} 
                    className="btn-premium btn-premium-primary" 
                    style={{ height: '56px', padding: '0 35px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}
                >
                    <Plus size={22} /> Nueva Difusión
                </button>
            </div>

            {/* List */}
            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', gap: '20px' }}>
                    <div className="loader-v12"></div>
                </div>
            ) : communications.length === 0 ? (
                <div style={{ background: colors.card, borderRadius: '40px', padding: '80px', textAlign: 'center', border: `1px solid ${colors.border}` }}>
                    <Megaphone size={40} style={{ margin: '0 auto 25px', color: '#cbd5e1' }} />
                    <h3 style={{ fontSize: '1.4rem', fontWeight: '950', color: colors.textMain }}>Sin registro de difusión</h3>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '15px' }}>
                    {communications.map(c => (
                        <div key={c.id} style={{ background: colors.card, borderRadius: '30px', padding: '20px 30px', border: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.3s ease' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1 }}>
                                <div style={{ width: '48px', height: '48px', background: c.isActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.isActive ? '#10b981' : '#ef4444' }}>
                                    <AlertCircle size={22} />
                                </div>
                                <div>
                                    <h4 style={{ fontSize: '1.1rem', fontWeight: '950', color: colors.textMain, margin: '0 0 4px' }}>{c.titulo}</h4>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <Badge icon={<Clock size={12}/>} text={new Date(c.fechaEnvio).toLocaleDateString()} />
                                        {c.fechaFin && <Badge icon={<Calendar size={12}/>} text={`Hasta: ${new Date(c.fechaFin).toLocaleDateString()}`} color="#4f46e5" />}
                                        <Badge icon={<UserIcon size={12}/>} text={c.isActive ? 'ACTIVO' : 'INACTIVO'} color={c.isActive ? '#10b981' : '#ef4444'} />
                                    </div>
                                </div>
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <button 
                                    onClick={() => handleOpenEdit(c)}
                                    title="Editar"
                                    style={{ width: '40px', height: '40px', borderRadius: '12px', background: isDarkMode ? '#1e293b' : '#f8fafc', border: `1px solid ${colors.border}`, color: colors.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                    <Edit3 size={18} />
                                </button>
                                <button 
                                    onClick={() => handleDelete(c.id)}
                                    title="Eliminar"
                                    style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(2, 6, 23, 0.85)', backdropFilter: 'blur(20px)', zIndex: 11000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: colors.card, width: '100%', maxWidth: '850px', borderRadius: '48px', border: `1px solid ${colors.border}`, boxShadow: '0 50px 100px rgba(0,0,0,0.5)', animation: 'scaleIn 0.3s ease', overflow: 'hidden' }}>
                        <div style={{ padding: '30px 40px', borderBottom: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                             <h3 style={{ fontSize: '1.4rem', fontWeight: '950', color: colors.textMain, margin: 0 }}>{isEditing ? 'Editar Comunicación' : 'Nueva Difusión Elite'}</h3>
                             <button onClick={() => setShowModal(false)} style={{ border: 'none', background: 'none', color: colors.textMuted }}><X size={28} /></button>
                        </div>
                        
                        <form onSubmit={handleSubmit} style={{ padding: '30px 40px 40px', maxHeight: '80vh', overflowY: 'auto' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                <div>
                                    <label className="label-lite">Título del Comunicado *</label>
                                    <input 
                                        required
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="input-lite"
                                        placeholder="Ej: Mensaje del CEO..."
                                    />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', paddingTop: '25px' }}>
                                    <label className="label-lite" style={{ marginBottom: 0 }}>Estado Activo</label>
                                    <button 
                                        type="button"
                                        onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: formData.isActive ? '#10b981' : '#94a3b8' }}
                                    >
                                        {formData.isActive ? <ToggleRight size={38} /> : <ToggleLeft size={38} />}
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                <div>
                                    <label className="label-lite">Fecha Inicio (Vigencia)</label>
                                    <input type="date" value={formData.fechaInicio} onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })} className="input-lite" />
                                </div>
                                <div>
                                    <label className="label-lite">Fecha Fin (Expiración)</label>
                                    <input type="date" value={formData.fechaFin} onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })} className="input-lite" />
                                </div>
                            </div>

                            <div style={{ marginBottom: '30px' }}>
                                <label className="label-lite">Contenido Rico (Media Support) *</label>
                                <EliteRichEditor 
                                    value={formData.body}
                                    onChange={(html) => setFormData({ ...formData, body: html })}
                                    isDarkMode={isDarkMode}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '15px' }}>
                                <button type="submit" disabled={isSubmitting} className="btn-premium btn-premium-primary" style={{ flex: 1 }}>
                                    {isSubmitting ? 'Procesando...' : (isEditing ? 'Guardar Cambios' : 'Emitir y Sincronizar')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Styles Hook */}
            <style>{`
                .label-lite { display: block; fontSize: 10px; fontWeight: 950; color: #94a3b8; textTransform: uppercase; marginBottom: 10px; letterSpacing: 0.1em; }
                .input-lite { width: 100%; padding: 15px 20px; borderRadius: 16px; border: 2px solid ${colors.border}; background: ${colors.bg}; color: ${colors.textMain}; fontWeight: 700; outline: none; }
                @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
            `}</style>

            {/* Toast */}
            {toast.show && (
                <div style={{ position: 'fixed', bottom: '40px', right: '40px', zIndex: 12000, background: toast.type === 'success' ? '#10b981' : '#ef4444', color: 'white', padding: '15px 30px', borderRadius: '20px', fontWeight: '900', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {toast.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    {toast.message}
                </div>
            )}
        </div>
    );
};

const Badge = ({ icon, text, color = '#64748b' }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color, fontSize: '0.75rem', fontWeight: '800' }}>
        {icon} {text}
    </div>
);

export default CommunicationsCenter;
