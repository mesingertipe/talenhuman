import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
    Plus, 
    Trash2, 
    Settings, 
    X, 
    FileText, 
    Layers, 
    CheckCircle, 
    AlertCircle,
    Save,
    Paperclip,
    Search,
    ChevronRight,
    LucideSettings,
    Edit3,
    UserCircle2,
    Layout
} from 'lucide-react';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import HelpIcon from '../../components/Shared/HelpIcon';
import SearchableSelect from '../../components/Shared/SearchableSelect';

const NewsDesigner = () => {
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
        rolAprobador: 'RH'
    });
    const [fields, setFields] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    // Elite V12 Design System
    const activeColors = {
        bg: isDarkMode ? '#0f172a' : '#f8fafc',
        card: isDarkMode ? '#1e293b' : '#ffffff',
        border: isDarkMode ? '#334155' : '#f1f5f9',
        textMain: isDarkMode ? '#f1f5f9' : '#1e293b',
        textMuted: isDarkMode ? '#94a3b8' : '#64748b',
        accent: '#4f46e5',
        accentSoft: isDarkMode ? 'rgba(79, 70, 229, 0.15)' : '#eef2ff'
    };

    useEffect(() => { fetchNewsTypes(); }, []);

    const fetchNewsTypes = async () => {
        try {
            setLoading(true);
            const response = await api.get('/NovedadTipos');
            setNewsTypes(response.data);
        } catch (error) { 
            showToast('Error al sincronizar estructuras', 'error'); 
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
                rolAprobador: type.rolAprobador || 'RH'
            });
            setFields(type.camposConfig ? JSON.parse(type.camposConfig) : []);
        } else {
            setCurrentType(null);
            setFormData({ nombre: '', descripcion: '', categoria: 0, requiereAdjunto: false, rolAprobador: 'RH' });
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
                showToast('Estructura actualizada');
            } else {
                await api.post('/NovedadTipos', payload);
                showToast('Estructura creada con éxito');
            }
            setShowModal(false);
            fetchNewsTypes();
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
            showToast('Estructura eliminada');
            setShowConfirm(false);
            fetchNewsTypes();
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
            <span style={{ fontSize: '0.7rem', fontWeight: '900', color: activeColors.textMuted, textTransform: 'uppercase', letterSpacing: '0.2em' }}>Sincronizando...</span>
        </div>
    );

    return (
        <div style={{ padding: '2rem 1.5rem', maxWidth: '1400px', margin: '0 auto', animation: 'fadeIn 0.5s ease-out' }}>
            {/* Elite Header & Toolbar */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4rem', gap: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.2rem', fontWeight: '950', color: activeColors.textMain, margin: 0, letterSpacing: '-0.03em' }}>Diseñador de novedades</h1>
                    <p style={{ color: activeColors.textMuted, fontSize: '0.9rem', fontWeight: '600', marginTop: '6px' }}>Gestión de estructuras y campos dinámicos</p>
                </div>

                <div style={{ display: 'flex', gap: '15px', alignItems: 'center', width: '100%', maxWidth: '700px' }}>
                    <div style={{ position: 'relative', flex: 1 }} data-v12-tooltip="Filtrar estructuras de novedades por nombre">
                        <Search style={{ position: 'absolute', left: '18px', top: '18px', color: '#94a3b8' }} size={18} />
                        <input 
                            type="text" 
                            placeholder="Filtrar estructuras..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ width: '100%', padding: '16px 20px 16px 52px', borderRadius: '20px', background: activeColors.card, border: `1px solid ${activeColors.border}`, color: activeColors.textMain, fontSize: '0.9rem', fontWeight: '600', boxSizing: 'border-box', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}
                        />
                    </div>
                    <button 
                        onClick={() => handleOpenModal()} 
                        style={{ background: activeColors.accent, color: 'white', padding: '16px 36px', borderRadius: '20px', border: 'none', fontWeight: '800', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.15em', cursor: 'pointer', boxShadow: '0 10px 25px rgba(79, 70, 229, 0.3)', display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.3s' }}
                        className="hover:scale-105 active:scale-95"
                        data-v12-tooltip="Crear una nueva configuración de novedad"
                    >
                        <Plus size={18} strokeWidth={3} /> Nueva Estructura
                    </button>
                </div>
            </div>

            {/* Elite Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '2.5rem', paddingBottom: '100px' }}>
                {filteredTypes.map(type => (
                    <div key={type.id} style={{ background: activeColors.card, borderRadius: '36px', border: `1px solid ${activeColors.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 15px 35px rgba(0,0,0,0.03)', transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }} className="hover:shadow-2xl hover:translate-y-[-8px]">
                        <div style={{ height: '8px', background: `linear-gradient(90deg, ${activeColors.accent} 0%, ${activeColors.accent}cc 100%)` }}></div>
                        
                        <div style={{ padding: '2.5rem', flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', alignItems: 'flex-start' }}>
                                <div style={{ width: '56px', height: '56px', background: activeColors.accentSoft, borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: activeColors.accent }}>
                                    <Layout size={24} />
                                </div>
                                {type.requiereAdjunto && (
                                    <div 
                                        style={{ fontSize: '9px', fontWeight: '950', padding: '8px 16px', borderRadius: '99px', background: isDarkMode ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5', color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.12em', border: `1px solid ${isDarkMode ? 'rgba(16, 185, 129, 0.3)' : '#d1fae5'}` }}
                                        data-v12-tooltip="El colaborador deberá adjuntar un soporte documental"
                                    >
                                        Adjunto Obligatorio
                                    </div>
                                )}
                            </div>
                            
                            <h3 style={{ fontSize: '1.35rem', fontWeight: '950', color: activeColors.textMain, textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '-0.02em' }}>{type.nombre}</h3>
                            <p style={{ fontSize: '0.85rem', fontWeight: '600', color: activeColors.textMuted, marginBottom: '2rem', lineHeight: '1.6', minHeight: '3em' }}>{type.descripcion || 'Sin descripción corporativa definida.'}</p>
                            
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', paddingTop: '1.5rem', borderTop: `1px solid ${activeColors.border}` }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '10px', fontWeight: '900', color: activeColors.textMuted, textTransform: 'uppercase' }}>
                                    <UserCircle2 size={16} style={{ color: activeColors.accent }} /> <span style={{ opacity: 0.6 }}>Auditor:</span> <span style={{ color: activeColors.textMain }}>{type.rolAprobador}</span>
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
                                data-v12-tooltip="Editar los campos y reglas de aprobación"
                            >
                                <Edit3 size={16} /> Configurar
                            </button>
                            <button 
                                onClick={() => { setCurrentType(type); setShowConfirm(true); }}
                                style={{ width: '52px', height: '52px', borderRadius: '18px', border: 'none', background: isDarkMode ? '#451a1a' : '#fef2f2', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                                className="hover:bg-red-600 hover:text-white"
                                data-v12-tooltip="Eliminar esta estructura"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Configuration Modal Boutique */}
            {showModal && createPortal(
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(2, 6, 15, 0.85)', backdropFilter: 'blur(30px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: activeColors.card, width: '100%', maxWidth: '950px', maxHeight: '92vh', borderRadius: '48px', overflow: 'hidden', display: 'flex', flexDirection: 'column', border: isDarkMode ? '1px solid #334155' : 'none', boxShadow: '0 50px 100px rgba(0,0,0,0.5)', animation: 'modalSlideUp 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)' }}>
                        {/* Header */}
                        <div style={{ padding: '35px 50px', background: isDarkMode ? '#1e293b' : '#ffffff', borderBottom: `1px solid ${activeColors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
                            <div>
                                <h2 style={{ color: activeColors.textMain, fontWeight: '950', fontSize: '1.4rem', margin: 0, letterSpacing: '-0.02em' }}>{currentType ? 'Editar estructura' : 'Nueva configuración'}</h2>
                                <p style={{ fontSize: '0.8rem', color: activeColors.textMuted, fontWeight: '600', marginTop: '4px' }}>Defina los atributos técnicos de esta novedad</p>
                            </div>
                            <button onClick={() => setShowModal(false)} style={{ background: activeColors.accentSoft, border: 'none', width: '48px', height: '48px', borderRadius: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: activeColors.accent, transition: 'all 0.2s' }} className="hover:rotate-90">
                                <X size={24} strokeWidth={3} />
                            </button>
                        </div>

                        {/* Body */}
                        <div style={{ padding: '40px 50px', flex: 1, overflowY: 'auto', background: activeColors.bg }}>
                            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                                {/* General Info Block */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <label style={{ display: 'block', fontSize: '10px', fontWeight: '950', color: activeColors.textMuted, textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.1em' }}>Nombre de la Estructura *</label>
                                        <input 
                                            required 
                                            value={formData.nombre} 
                                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} 
                                            placeholder="Ej. Licencia Remunerada..."
                                            style={{ width: '100%', padding: '18px 24px', borderRadius: '18px', border: `2px solid ${activeColors.border}`, background: activeColors.card, color: activeColors.textMain, fontWeight: '700', boxSizing: 'border-box', outline: 'none', transition: 'border-color 0.2s' }}
                                            className="focus:border-indigo-500"
                                        />
                                    </div>
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <label style={{ display: 'block', fontSize: '10px', fontWeight: '950', color: activeColors.textMuted, textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.1em' }}>Manual de Usuario (Instrucciones)</label>
                                        <textarea 
                                            value={formData.descripcion || ''} 
                                            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} 
                                            placeholder="Describa brevemente cuándo aplicar esta novedad..."
                                            style={{ width: '100%', padding: '18px 24px', borderRadius: '18px', border: `2px solid ${activeColors.border}`, background: activeColors.card, color: activeColors.textMain, fontWeight: '700', minHeight: '100px', boxSizing: 'border-box', outline: 'none', resize: 'vertical' }}
                                            className="focus:border-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <SearchableSelect
                                            label="Nivel de Autoridad (Aprobador) *"
                                            options={[
                                                { id: 'RH', name: 'Talento Humano (RH)' },
                                                { id: 'Admin', name: 'Administrador Master' },
                                                { id: 'Supervisor', name: 'Supervisor Directo' }
                                            ]}
                                            value={formData.rolAprobador}
                                            onChange={(val) => setFormData({ ...formData, rolAprobador: val })}
                                            placeholder="Seleccionar autoridad..."
                                            icon={UserCircle2}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', background: activeColors.accentSoft, borderRadius: '18px', border: `1px solid ${isDarkMode ? 'rgba(79, 70, 229, 0.2)' : '#d1daff'}` }}>
                                        <div>
                                            <span style={{ display: 'block', fontSize: '10px', fontWeight: '950', color: activeColors.accent, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Adjunto Requerido</span>
                                            <span style={{ fontSize: '0.7rem', color: activeColors.textMuted, fontWeight: '600' }}>Exigir soporte documental</span>
                                        </div>
                                        <label className="premium-switch">
                                            <input 
                                                type="checkbox" 
                                                checked={formData.requiereAdjunto} 
                                                onChange={(e) => setFormData({ ...formData, requiereAdjunto: e.target.checked })} 
                                            />
                                            <span className="premium-switch-slider"></span>
                                        </label>
                                    </div>
                                </div>

                                {/* Dynamic Fields Modular Block */}
                                <div style={{ borderTop: `2px dashed ${activeColors.border}`, paddingTop: '40px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '25px' }}>
                                        <div>
                                            <h3 style={{ fontSize: '1rem', fontWeight: '950', color: activeColors.textMain, textTransform: 'uppercase', margin: 0 }}>Campos Personalizados</h3>
                                            <p style={{ fontSize: '0.75rem', color: activeColors.textMuted, fontWeight: '600' }}>Capture datos específicos para esta novedad</p>
                                        </div>
                                        <button 
                                            type="button" 
                                            onClick={() => setFields([...fields, { name: '', type: 'text', required: false, options: '' }])}
                                            style={{ padding: '12px 24px', background: activeColors.accent, color: 'white', border: 'none', borderRadius: '16px', fontWeight: '900', fontSize: '9px', textTransform: 'uppercase', cursor: 'pointer', boxShadow: '0 8px 15px rgba(79, 70, 229, 0.2)', display: 'flex', alignItems: 'center', gap: '8px' }}
                                        >
                                            <Plus size={14} strokeWidth={3} /> Agregar Requerimiento
                                        </button>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        {fields.length === 0 && (
                                            <div style={{ padding: '60px', textAlign: 'center', border: `2px dashed ${activeColors.border}`, borderRadius: '32px' }}>
                                                <Layers size={48} style={{ color: activeColors.border, marginBottom: '15px' }} />
                                                <p style={{ color: activeColors.textMuted, fontSize: '0.85rem', fontWeight: '600' }}>Sin campos adicionales configurados.</p>
                                            </div>
                                        )}
                                        {fields.map((f, idx) => (
                                            <div key={idx} style={{ background: activeColors.card, padding: '30px', borderRadius: '28px', border: `1px solid ${activeColors.border}`, display: 'grid', gridTemplateColumns: '1fr 200px 60px', gap: '25px', alignItems: 'end', animation: 'fadeIn 0.3s ease-in-out' }}>
                                                <div>
                                                    <label style={{ display: 'block', fontSize: '9px', fontWeight: '950', color: activeColors.textMuted, textTransform: 'uppercase', marginBottom: '10px' }}>Etiqueta del Campo *</label>
                                                    <input 
                                                        value={f.name} 
                                                        onChange={(e) => { const n = [...fields]; n[idx].name = e.target.value; setFields(n); }}
                                                        placeholder="Ej: Número de Radicado"
                                                        style={{ width: '100%', padding: '14px 20px', borderRadius: '14px', border: `1px solid ${activeColors.border}`, background: activeColors.bg, color: activeColors.textMain, fontWeight: '700', boxSizing: 'border-box', outline: 'none' }}
                                                    />
                                                </div>
                                                <div>
                                                    <SearchableSelect
                                                        label="Tipo de Dato *"
                                                        options={[
                                                            { id: 'text', name: 'Texto Libre' },
                                                            { id: 'number', name: 'Número' },
                                                            { id: 'date', name: 'Fecha' },
                                                            { id: 'select', name: 'Lista Desplegable' },
                                                            { id: 'radio', name: 'Selección Única' }
                                                        ]}
                                                        value={f.type}
                                                        onChange={(val) => { const n = [...fields]; n[idx].type = val; setFields(n); }}
                                                        placeholder="Tipo..."
                                                    />
                                                </div>
                                                <button 
                                                    type="button" 
                                                    onClick={() => setFields(fields.filter((_, i) => i !== idx))}
                                                    style={{ width: '56px', height: '56px', borderRadius: '16px', border: 'none', background: '#fef2f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
                                                    className="hover:bg-red-600 hover:text-white"
                                                >
                                                    <Trash2 size={22} />
                                                </button>
                                                
                                                {(f.type === 'select' || f.type === 'radio') && (
                                                    <div style={{ gridColumn: '1 / -1', padding: '25px', background: activeColors.accentSoft, borderRadius: '20px', border: `1px dashed ${activeColors.accent}` }}>
                                                        <label style={{ display: 'block', fontSize: '9px', fontWeight: '950', color: activeColors.accent, textTransform: 'uppercase', marginBottom: '10px' }}>Opciones Disponibles (Separar por comas) *</label>
                                                        <input 
                                                            value={f.options || ''} 
                                                            onChange={(e) => { const n = [...fields]; n[idx].options = e.target.value; setFields(n); }}
                                                            placeholder="Opción 1, Opción 2, Opción 3..."
                                                            style={{ width: '100%', padding: '14px 20px', borderRadius: '12px', border: 'none', background: activeColors.card, color: activeColors.textMain, fontWeight: '700', boxSizing: 'border-box', outline: 'none' }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                
                                <div style={{ display: 'flex', gap: '20px', paddingTop: '20px', position: 'sticky', bottom: 0, background: activeColors.bg, paddingBottom: '10px' }}>
                                    <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '20px', borderRadius: '20px', border: `2px solid ${activeColors.border}`, background: 'transparent', color: activeColors.textMuted, fontWeight: '900', fontSize: '11px', textTransform: 'uppercase', cursor: 'pointer' }}>Cancelar</button>
                                    <button type="submit" disabled={isSubmitting} style={{ flex: 2, padding: '20px', borderRadius: '20px', border: 'none', background: activeColors.accent, color: 'white', fontWeight: '950', fontSize: '11px', textTransform: 'uppercase', cursor: 'pointer', boxShadow: '0 15px 30px rgba(79, 70, 229, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
                                        {isSubmitting ? 'Procesando Transacción...' : 'Finalizar Estructura V12'}
                                        {!isSubmitting && <CheckCircle size={20} />}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>,
                document.getElementById('modal-root')
            )}

            {/* Confirmation Overlay Elite */}
            {showConfirm && createPortal(
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(2, 6, 15, 0.95)', backdropFilter: 'blur(20px)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: activeColors.card, padding: '50px', borderRadius: '48px', textAlign: 'center', maxWidth: '450px', width: '90%', border: isDarkMode ? '1px solid #334155' : 'none', boxShadow: '0 50px 100px rgba(0,0,0,0.5)' }}>
                        <div style={{ width: '90px', height: '90px', background: '#fef2f2', color: '#ef4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 30px' }}>
                            <Trash2 size={42} />
                        </div>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: '950', color: activeColors.textMain, letterSpacing: '-0.02em' }}>¿Eliminar estructura?</h2>
                        <p style={{ color: activeColors.textMuted, fontSize: '0.9rem', fontWeight: '600', marginBottom: '40px', lineHeight: '1.6' }}>Se revocará permanentemente la estructura:<br/><strong style={{ color: activeColors.textMain, fontSize: '1.1rem' }}>{currentType?.nombre}</strong></p>
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <button onClick={() => setShowConfirm(false)} style={{ flex: 1, padding: '18px', borderRadius: '18px', border: `2px solid ${activeColors.border}`, background: 'transparent', color: activeColors.textMuted, fontWeight: '800', textTransform: 'uppercase', fontSize: '10px' }}>Cerrar</button>
                            <button onClick={handleDelete} disabled={isDeleting} style={{ flex: 1, padding: '18px', borderRadius: '18px', border: 'none', background: '#ef4444', color: 'white', fontWeight: '900', textTransform: 'uppercase', fontSize: '10px', boxShadow: '0 10px 20px rgba(239, 68, 68, 0.3)' }}>
                                {isDeleting ? 'Borrando...' : 'Confirmar'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.getElementById('modal-root')
            )}

            {/* Premium Toast System */}
            {toast.show && (
                <div style={{ position: 'fixed', bottom: '50px', right: '50px', zIndex: 11000, background: toast.type === 'success' ? '#10b981' : '#ef4444', color: 'white', padding: '20px 40px', borderRadius: '24px', fontWeight: '950', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.15em', display: 'flex', alignItems: 'center', gap: '15px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', animation: 'slideInRight 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
                    {toast.type === 'success' ? <CheckCircle size={22} /> : <AlertCircle size={22} />}
                    {toast.message}
                </div>
            )}

            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes modalSlideUp { from { transform: translateY(50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
                @keyframes spin { to { transform: rotate(360deg); } }
                
                .animate-spin { animation: spin 1s linear infinite; }
                .hover\\:scale-105:hover { transform: scale(1.05); }
                .hover\\:scale-110:hover { transform: scale(1.10); }
                .active\\:scale-95:active { transform: scale(0.95); }
                .hover\\:rotate-90:hover { transform: rotate(90deg); }
                .hover\\:shadow-2xl:hover { box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); }
                .hover\\:translate-y-\\[-8px\\]:hover { transform: translateY(-8px); }
                .hover\\:bg-indigo-600:hover { background-color: #4f46e5 !important; }
                .hover\\:bg-red-600:hover { background-color: #ef4444 !important; }
                .hover\\:text-white:hover { color: #ffffff !important; }
                .focus\\:border-indigo-500:focus { border-color: #4f46e5 !important; }
            `}</style>
        </div>
    );
};

export default NewsDesigner;
