import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
    Plus, 
    Trash2, 
    X, 
    Layers, 
    CheckCircle, 
    AlertCircle,
    Save,
    Search,
    Edit3,
    UserCircle2,
    Layout,
    Globe
} from 'lucide-react';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import SearchableSelect from '../../components/Shared/SearchableSelect';

const NewsTemplateDesigner = () => {
    const { isDarkMode } = useTheme();
    const [newsTypes, setNewsTypes] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [currentType, setCurrentType] = useState(null);
    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        categoria: 0,
        requiereAdjunto: false,
        rolAprobador: 'RH',
        esPlantilla: true // Default for this view
    });
    const [fields, setFields] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const activeColors = {
        bg: isDarkMode ? '#0f172a' : '#f8fafc',
        card: isDarkMode ? '#1e293b' : '#ffffff',
        border: isDarkMode ? '#334155' : '#f1f5f9',
        textMain: isDarkMode ? '#f1f5f9' : '#1e293b',
        textMuted: isDarkMode ? '#94a3b8' : '#64748b',
        accent: '#6366f1',
        accentSoft: isDarkMode ? 'rgba(99, 102, 241, 0.15)' : '#eef2ff'
    };

    useEffect(() => { fetchTemplates(); }, []);

    const fetchTemplates = async () => {
        try {
            setLoading(true);
            const response = await api.get('/NovedadTipos');
            // Show only templates in this view
            setNewsTypes(response.data.filter(t => t.esPlantilla));
        } catch (error) { 
            showToast('Error al sincronizar catálogo global', 'error'); 
        } finally { 
            setLoading(false); 
        }
    };

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3500);
    };

    const handleOpenModal = (type = null) => {
        if (type) {
            setCurrentType(type);
            setFormData({
                nombre: type.nombre,
                descripcion: type.descripcion || '',
                categoria: type.categoria || 0,
                requiereAdjunto: type.requiereAdjunto || false,
                rolAprobador: type.rolAprobador || 'RH',
                esPlantilla: true
            });
            setFields(type.camposConfig ? JSON.parse(type.camposConfig) : []);
        } else {
            setCurrentType(null);
            setFormData({ nombre: '', descripcion: '', categoria: 0, requiereAdjunto: false, rolAprobador: 'RH', esPlantilla: true });
            setFields([]);
        }
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = { ...formData, camposConfig: JSON.stringify(fields) };
            if (currentType) {
                await api.put(`/NovedadTipos/${currentType.id}`, payload);
                showToast('Plantilla global actualizada');
            } else {
                await api.post('/NovedadTipos', payload);
                showToast('Plantilla global creada');
            }
            setShowModal(false);
            fetchTemplates();
        } catch (error) {
            showToast('Error al persistir cambios', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await api.delete(`/NovedadTipos/${currentType.id}`);
            showToast('Plantilla eliminada');
            setShowConfirm(false);
            fetchTemplates();
        } catch (error) {
            showToast('Error en la eliminación', 'error');
        } finally {
            setIsDeleting(false);
        }
    };

    const filteredTypes = newsTypes.filter(t => t.nombre.toLowerCase().includes(searchTerm.toLowerCase()));

    if (loading) return (
        <div style={{ display: 'flex', height: '80vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px' }}>
            <div className="animate-spin" style={{ width: '40px', height: '40px', border: `4px solid ${activeColors.accentSoft}`, borderTopColor: activeColors.accent, borderRadius: '50%' }}></div>
            <span style={{ fontSize: '0.7rem', fontWeight: '900', color: activeColors.textMuted, textTransform: 'uppercase', letterSpacing: '0.2em' }}>Cargando catálogo global...</span>
        </div>
    );

    return (
        <div style={{ padding: '2rem 1.5rem', maxWidth: '1400px', margin: '0 auto', animation: 'fadeIn 0.5s ease-out' }}>
            {/* Elite Header & Toolbar */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4rem', gap: '2rem' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                         <Globe size={24} className="text-indigo-500" />
                         <span style={{ fontSize: '0.7rem', fontWeight: '900', color: activeColors.accent, textTransform: 'uppercase', letterSpacing: '0.1em' }}>SuperAdmin Toolbox</span>
                    </div>
                    <h1 style={{ fontSize: '2.2rem', fontWeight: '950', color: activeColors.textMain, margin: 0, letterSpacing: '-0.03em' }}>Diseñador de Plantillas</h1>
                    <p style={{ color: activeColors.textMuted, fontSize: '0.9rem', fontWeight: '600', marginTop: '6px' }}>Definición de novedades estándar para todos los Tenants</p>
                </div>

                <div style={{ display: 'flex', gap: '15px', alignItems: 'center', width: '100%', maxWidth: '700px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search style={{ position: 'absolute', left: '18px', top: '18px', color: '#94a3b8' }} size={18} />
                        <input 
                            type="text" 
                            placeholder="Buscar en catálogo global..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ width: '100%', padding: '16px 20px 16px 52px', borderRadius: '20px', background: activeColors.card, border: `1px solid ${activeColors.border}`, color: activeColors.textMain, fontSize: '0.9rem', fontWeight: '600', boxSizing: 'border-box', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}
                        />
                    </div>
                    <button 
                        onClick={() => handleOpenModal()} 
                        style={{ background: activeColors.accent, color: 'white', padding: '16px 36px', borderRadius: '20px', border: 'none', fontWeight: '800', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.15em', cursor: 'pointer', boxShadow: '0 10px 25px rgba(99, 102, 241, 0.3)', display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.3s' }}
                        className="hover:scale-105 active:scale-95"
                    >
                        <Plus size={18} strokeWidth={3} /> Nueva Plantilla
                    </button>
                </div>
            </div>

            {/* Elite Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '2.5rem', paddingBottom: '100px' }}>
                {filteredTypes.map(type => (
                    <div key={type.id} style={{ background: activeColors.card, borderRadius: '36px', border: `1px solid ${activeColors.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 15px 35px rgba(0,0,0,0.03)', transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }} className="hover:shadow-2xl hover:translate-y-[-8px]">
                        <div style={{ height: '8px', background: `linear-gradient(90deg, #6366f1 0%, #a855f7 100%)` }}></div>
                        
                        <div style={{ padding: '2.5rem', flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', alignItems: 'flex-start' }}>
                                <div style={{ width: '56px', height: '56px', background: activeColors.accentSoft, borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: activeColors.accent }}>
                                    <Globe size={24} />
                                </div>
                                <div style={{ fontSize: '9px', fontWeight: '950', padding: '8px 16px', borderRadius: '99px', background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.12em', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                                    Plantilla Global
                                </div>
                            </div>
                            
                            <h3 style={{ fontSize: '1.35rem', fontWeight: '950', color: activeColors.textMain, textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '-0.02em' }}>{type.nombre}</h3>
                            <p style={{ fontSize: '0.85rem', fontWeight: '600', color: activeColors.textMuted, marginBottom: '2rem', lineHeight: '1.6', minHeight: '3em' }}>{type.descripcion || 'Plantilla predefinida para uso general.'}</p>
                            
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', paddingTop: '1.5rem', borderTop: `1px solid ${activeColors.border}` }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '10px', fontWeight: '900', color: activeColors.textMuted, textTransform: 'uppercase' }}>
                                    <UserCircle2 size={16} style={{ color: activeColors.accent }} /> <span style={{ opacity: 0.6 }}>Auditor Sugerido:</span> <span style={{ color: activeColors.textMain }}>{type.rolAprobador}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '10px', fontWeight: '900', color: activeColors.textMuted, textTransform: 'uppercase' }}>
                                    <Layers size={16} style={{ color: '#10b981' }} /> <span style={{ opacity: 0.6 }}>Campos:</span> <span style={{ color: activeColors.textMain }}>{type.camposConfig ? JSON.parse(type.camposConfig).length : 0}</span>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div style={{ padding: '0 2.5rem 2.5rem 2.5rem', display: 'flex', gap: '15px' }}>
                            <button 
                                onClick={() => handleOpenModal(type)} 
                                style={{ flex: 1, padding: '16px', borderRadius: '18px', border: 'none', background: isDarkMode ? '#334155' : '#f1f5f9', color: isDarkMode ? 'white' : activeColors.accent, fontWeight: '900', fontSize: '10px', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'all 0.2s' }}
                                className="hover:bg-indigo-600 hover:text-white"
                            >
                                <Edit3 size={16} /> Editar Plantilla
                            </button>
                            <button 
                                onClick={() => { setCurrentType(type); setShowConfirm(true); }}
                                style={{ width: '52px', height: '52px', borderRadius: '18px', border: 'none', background: isDarkMode ? '#451a1a' : '#fef2f2', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                                className="hover:bg-red-600 hover:text-white"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal & Overlays code follows similar structure to NewsDesigner but with Template context */}
            {showModal && createPortal(
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(2, 6, 15, 0.85)', backdropFilter: 'blur(30px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: activeColors.card, width: '100%', maxWidth: '950px', maxHeight: '92vh', borderRadius: '48px', overflow: 'hidden', display: 'flex', flexDirection: 'column', border: isDarkMode ? '1px solid #334155' : 'none', boxShadow: '0 50px 100px rgba(0,0,0,0.5)', animation: 'modalSlideUp 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)' }}>
                        <div style={{ padding: '35px 50px', background: isDarkMode ? '#1e293b' : '#ffffff', borderBottom: `1px solid ${activeColors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
                            <div>
                                <h2 style={{ color: activeColors.textMain, fontWeight: '950', fontSize: '1.4rem', margin: 0, letterSpacing: '-0.02em' }}>{currentType ? 'Editar Plantilla' : 'Nueva Plantilla'}</h2>
                                <p style={{ fontSize: '0.8rem', color: activeColors.textMuted, fontWeight: '600', marginTop: '4px' }}>Esta configuración será elegible por todos los clientes</p>
                            </div>
                            <button onClick={() => setShowModal(false)} style={{ background: activeColors.accentSoft, border: 'none', width: '48px', height: '48px', borderRadius: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: activeColors.accent }}>
                                <X size={24} strokeWidth={3} />
                            </button>
                        </div>

                        <div style={{ padding: '40px 50px', flex: 1, overflowY: 'auto', background: activeColors.bg }}>
                            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '30px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '10px', fontWeight: '950', color: activeColors.textMuted, textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.1em' }}>Nombre de la Plantilla *</label>
                                        <input 
                                            required 
                                            value={formData.nombre} 
                                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} 
                                            placeholder="Ej. Incapacidad Médica General..."
                                            style={{ width: '100%', padding: '18px 24px', borderRadius: '18px', border: `2px solid ${activeColors.border}`, background: activeColors.card, color: activeColors.textMain, fontWeight: '700', boxSizing: 'border-box', outline: 'none' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '10px', fontWeight: '950', color: activeColors.textMuted, textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.1em' }}>Sugerencia de Uso</label>
                                        <textarea 
                                            value={formData.descripcion || ''} 
                                            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} 
                                            placeholder="Indique al cliente para qué sirve esta plantilla..."
                                            style={{ width: '100%', padding: '18px 24px', borderRadius: '18px', border: `2px solid ${activeColors.border}`, background: activeColors.card, color: activeColors.textMain, fontWeight: '700', minHeight: '80px', boxSizing: 'border-box' }}
                                        />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                                        <SearchableSelect
                                            label="Auditor Sugerido *"
                                            options={[
                                                { id: 'RH', name: 'Talento Humano (RH)' },
                                                { id: 'Admin', name: 'Administrador Master' }
                                            ]}
                                            value={formData.rolAprobador}
                                            onChange={(val) => setFormData({ ...formData, rolAprobador: val })}
                                            placeholder="Seleccionar..."
                                        />
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '18px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                            <div>
                                                <span style={{ display: 'block', fontSize: '10px', fontWeight: '950', color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Adjunto por Defecto</span>
                                                <span style={{ fontSize: '0.7rem', color: activeColors.textMuted, fontWeight: '600' }}>Exigir soporte documental</span>
                                            </div>
                                            <input 
                                                type="checkbox" 
                                                checked={formData.requiereAdjunto} 
                                                onChange={(e) => setFormData({ ...formData, requiereAdjunto: e.target.checked })} 
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Field Editor - Simplified but complete */}
                                <div style={{ borderTop: `2px dashed ${activeColors.border}`, paddingTop: '40px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '25px' }}>
                                        <h3 style={{ fontSize: '1rem', fontWeight: '950', color: activeColors.textMain, textTransform: 'uppercase', margin: 0 }}>Campos de la Plantilla</h3>
                                        <button 
                                            type="button" 
                                            onClick={() => setFields([...fields, { name: '', type: 'text', required: true }])}
                                            style={{ padding: '10px 20px', background: activeColors.accent, color: 'white', border: 'none', borderRadius: '14px', fontWeight: '900', fontSize: '9px', textTransform: 'uppercase', cursor: 'pointer' }}
                                        >
                                            + Agregar Campo
                                        </button>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                        {fields.map((f, idx) => (
                                            <div key={idx} style={{ background: activeColors.card, padding: '20px', borderRadius: '24px', border: `1px solid ${activeColors.border}`, display: 'grid', gridTemplateColumns: '1fr 180px 50px', gap: '20px', alignItems: 'end' }}>
                                                <input 
                                                    value={f.name} 
                                                    onChange={(e) => { const n = [...fields]; n[idx].name = e.target.value; setFields(n); }}
                                                    placeholder="Nombre del campo (ej. Días de incapacidad)"
                                                    style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: `1px solid ${activeColors.border}`, background: activeColors.bg, color: activeColors.textMain, fontWeight: '700' }}
                                                />
                                                <select 
                                                    value={f.type} 
                                                    onChange={(e) => { const n = [...fields]; n[idx].type = e.target.value; setFields(n); }}
                                                    style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: `1px solid ${activeColors.border}`, background: activeColors.bg, color: activeColors.textMain, fontWeight: '700' }}
                                                >
                                                    <option value="text">Texto</option>
                                                    <option value="number">Número</option>
                                                    <option value="date">Fecha</option>
                                                </select>
                                                <button type="button" onClick={() => setFields(fields.filter((_, i) => i !== idx))} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '20px', paddingTop: '20px' }}>
                                    <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '18px', borderRadius: '18px', border: `2px solid ${activeColors.border}`, background: 'transparent', color: activeColors.textMuted, fontWeight: '900', fontSize: '11px', textTransform: 'uppercase' }}>Cerrar</button>
                                    <button type="submit" disabled={isSubmitting} style={{ flex: 2, padding: '18px', borderRadius: '18px', border: 'none', background: activeColors.accent, color: 'white', fontWeight: '950', fontSize: '11px', textTransform: 'uppercase', boxShadow: '0 15px 30px rgba(99, 102, 241, 0.3)' }}>
                                        {isSubmitting ? 'Guardando...' : 'Publicar Plantilla Global'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>,
                document.getElementById('modal-root')
            )}

            {showConfirm && createPortal(
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(2, 6, 15, 0.95)', backdropFilter: 'blur(20px)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: activeColors.card, padding: '50px', borderRadius: '48px', textAlign: 'center', maxWidth: '450px', width: '90%' }}>
                         <h2 style={{ fontSize: '1.4rem', fontWeight: '950', color: activeColors.textMain }}>¿Eliminar plantilla global?</h2>
                         <p style={{ color: activeColors.textMuted, margin: '20px 0 40px' }}>Esta definición ya no estará disponible para nuevos clientes.</p>
                         <div style={{ display: 'flex', gap: '15px' }}>
                             <button onClick={() => setShowConfirm(false)} style={{ flex: 1, padding: '18px', borderRadius: '18px', border: `2px solid ${activeColors.border}`, background: 'transparent', color: activeColors.textMuted }}>Cancelar</button>
                             <button onClick={handleDelete} disabled={isDeleting} style={{ flex: 1, padding: '18px', borderRadius: '18px', border: 'none', background: '#ef4444', color: 'white' }}>ELIMINAR</button>
                         </div>
                    </div>
                </div>,
                document.getElementById('modal-root')
            )}

            {toast.show && (
                <div style={{ position: 'fixed', bottom: '50px', right: '50px', zIndex: 11000, background: toast.type === 'success' ? '#10b981' : '#ef4444', color: 'white', padding: '20px 40px', borderRadius: '24px', fontWeight: '950', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', animation: 'slideInRight 0.4s' }}>
                    {toast.message}
                </div>
            )}
            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes modalSlideUp { from { transform: translateY(50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
                @keyframes spin { to { transform: rotate(360deg); } }
                .animate-spin { animation: spin 1s linear infinite; }
            `}</style>
        </div>
    );
};

export default NewsTemplateDesigner;
