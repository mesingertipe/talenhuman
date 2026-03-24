import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, X, FileText, CheckCircle, AlertCircle, Settings, Layers, Paperclip, User as UserIcon } from 'lucide-react';
import api from '../../services/api';

const NewsDesigner = () => {
    const [newsTypes, setNewsTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [currentType, setCurrentType] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [formData, setFormData] = useState({ 
        nombre: '', 
        descripcion: '', 
        requiereAdjunto: true,
        categoria: 0,
        rolAprobador: 'Admin'
    });
    const [fields, setFields] = useState([]); // Array of { name, type, required }
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    useEffect(() => {
        fetchNewsTypes();
    }, []);

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    };

    const fetchNewsTypes = async () => {
        try {
            setLoading(true);
            const res = await api.get('/novedadtipos');
            setNewsTypes(res.data);
        } catch (err) {
            console.error(err);
            showToast("Error al cargar tipos de novedad", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        // fields is already an array, payload will stringify it

        try {
            setIsSubmitting(true);
            const payload = { ...formData, camposConfig: JSON.stringify(fields) };
            if (currentType) {
                await api.put(`/novedadtipos/${currentType.id}`, payload);
                showToast("Configuración actualizada");
            } else {
                await api.post('/novedadtipos', payload);
                showToast("Tipo de novedad creado");
            }
            setShowModal(false);
            fetchNewsTypes();
        } catch (err) {
            showToast("Error al guardar configuración", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        try {
            setIsDeleting(true);
            await api.delete(`/novedadtipos/${currentType.id}`);
            showToast("Eliminado correctamente");
            setShowConfirm(false);
            fetchNewsTypes();
        } catch (err) {
            const errorMsg = err.response?.data || "Error al eliminar";
            showToast(errorMsg, "error");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="page-container animate-in fade-in duration-300">
            <div className="page-header flex justify-end mb-8">
                <button 
                    onClick={() => { 
                        setCurrentType(null); 
                        setFormData({ 
                            nombre: '', 
                            descripcion: '', 
                            requiereAdjunto: true, 
                            categoria: 0, 
                            rolAprobador: 'Admin' 
                        }); 
                        setFields([]);
                        setShowModal(true); 
                    }}
                    className="btn-premium btn-premium-primary whitespace-nowrap h-[52px] px-8"
                >
                    <Plus size={20} className="mr-2" /> Nuevo Tipo
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
                {loading ? (
                    <div className="py-24 text-center w-full col-span-full">
                        <div className="loader !border-indigo-600 !w-12 !h-12 mx-auto"></div>
                    </div>
                ) : (
                    newsTypes.map((type) => (
                        <div key={type.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:shadow-2xl transition-all" style={{ borderRadius: '28px', padding: '1.5rem', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', position: 'relative' }}>
                            {/* Top row: Icon & Title Header */}
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
                                <div style={{ width: '56px', height: '56px', flexShrink: 0, backgroundColor: 'rgba(79, 70, 229, 0.1)', color: '#4f46e5', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="dark:bg-indigo-900/30 dark:text-indigo-400 shadow-sm">
                                    <Layers size={28} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, minWidth: 0 }}>
                                     <span style={{ width: 'max-content', padding: '0.125rem 0.625rem', marginBottom: '0.375rem', borderRadius: '0.375rem', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.05em' }} className={`
                                         ${(type.categoria === 0 || type.categoria === '0') ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 
                                         (type.categoria === 1 || type.categoria === '1') ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' : 
                                         'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'}
                                     `}>
                                         { (type.categoria === 0 || type.categoria === '0') ? 'Empleado' : 
                                           (type.categoria === 1 || type.categoria === '1') ? 'Tienda' : 
                                           'Marca' }
                                     </span>
                                     <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '-0.025em', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} className="text-slate-800 dark:text-white" title={type.nombre}>
                                        {type.nombre}
                                     </h3>
                                </div>
                            </div>
                            
                            {/* Middle: Description */}
                            <div style={{ marginBottom: '1.25rem', flex: 1, padding: '0.875rem', borderRadius: '0.75rem', border: '1px solid var(--border)' }} className="bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800/50">
                                <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: '500', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }} className="text-slate-500 dark:text-slate-400">
                                    {type.description || type.descripcion || 'Sin descripción detallada.'}
                                </p>
                            </div>

                            {/* Bottom: Technical Badges */}
                            <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, marginBottom: '1.25rem' }}>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }} className="bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.25rem' }} className="text-slate-500 dark:text-slate-400">
                                        <Paperclip size={12} />
                                        <span style={{ fontSize: '10px', fontWeight: '700' }}>Soporte</span>
                                    </div>
                                    <span style={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase' }} className={`${type.requiereAdjunto ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`}>
                                        {type.requiereAdjunto ? 'OBLIG' : 'OPC'}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0.5rem 1.5rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }} className="bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.25rem' }} className="text-slate-500 dark:text-slate-400">
                                        <Settings size={12} />
                                        <span style={{ fontSize: '10px', fontWeight: '700' }}>Campos</span>
                                    </div>
                                    <span style={{ fontSize: '12px', fontWeight: '900' }} className="text-indigo-600 dark:text-indigo-400">
                                        {JSON.parse(type.camposConfig || '[]').length}
                                    </span>
                                </div>
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '1rem', borderTop: '1px solid var(--border)', marginTop: 'auto' }} className="border-slate-100 dark:border-slate-800">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '11px', fontWeight: '700', minWidth: 0 }} className="text-slate-500 dark:text-slate-400">
                                    <CheckCircle size={14} className="text-emerald-500" style={{ minWidth: 'max-content' }} /> Audita:
                                    <span style={{ fontWeight: '900', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '80px' }} className="text-slate-700 dark:text-slate-200" title={type.rolAprobador || 'Admin'}>{type.rolAprobador || 'Admin'}</span>
                                </div>

                                {/* Action Buttons: EXACTLY like Users */}
                                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', flexShrink: 0 }}>
                                    <button 
                                        onClick={() => { 
                                            setCurrentType(type); 
                                            setFormData({ 
                                                ...type, 
                                                categoria: type.categoria ?? 0, 
                                                rolAprobador: type.rolAprobador || 'Admin' 
                                            }); 
                                            try { setFields(JSON.parse(type.camposConfig || '[]')); } catch(e) { setFields([]); }
                                            setShowModal(true); 
                                        }}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: '1rem', color: '#6366f1' }}
                                        className="hover:scale-110 transition-transform dark:text-indigo-400"
                                        title="Editar Novedad"
                                    >
                                        <Edit size={18} />
                                    </button>
                                    <button 
                                        onClick={() => { setCurrentType(type); setShowConfirm(true); }}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                                        className="hover:scale-110 transition-transform dark:text-red-400"
                                        title="Eliminar Novedad"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
                {!loading && newsTypes.length === 0 && (
                    <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-dashed border-slate-200 dark:border-slate-800 py-24 text-center text-slate-400 font-black uppercase tracking-widest w-full">
                        <FileText size={64} className="mx-auto mb-6 opacity-10" />
                        No hay tipos de novedades diseñados
                    </div>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content shadow-2xl dark:bg-slate-900 border dark:border-slate-800" style={{ maxWidth: '700px', borderRadius: '48px' }}>
                        <div className="modal-header border-b dark:border-slate-800 px-10 py-8">
                            <h2 className="text-2xl font-black flex items-center gap-3 dark:text-white uppercase tracking-tight" style={{ margin: 0 }}>
                                <Settings size={28} className="text-indigo-500" />
                                {currentType ? 'Configurar Novedad' : 'Diseñador de Novedad'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-all p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                                <X size={28} />
                            </button>
                        </div>
                        <form onSubmit={handleSave}>
                            <div className="modal-body p-10 space-y-8" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="col-span-2">
                                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 ml-1">Nombre del Tipo de Novedad</label>
                                        <input 
                                            required 
                                            value={formData.nombre} 
                                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} 
                                            placeholder="Ej. Incapacidad, Permiso Especial, Vacaciones..."
                                            className="input-premium dark:bg-slate-900"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 ml-1">Descripción para el Usuario</label>
                                        <textarea 
                                            value={formData.descripcion || ''} 
                                            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} 
                                            placeholder="Describe cuándo y cómo debe usarse este tipo de novedad..."
                                            className="input-premium dark:bg-slate-900 min-h-[100px]"
                                        />
                                    </div>

                                    <div className="col-span-1">
                                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 ml-1">Se aplica a:</label>
                                        <select 
                                            value={formData.categoria} 
                                            onChange={(e) => setFormData({ ...formData, categoria: parseInt(e.target.value) })} 
                                            className="input-premium dark:bg-slate-900"
                                        >
                                            <option value={0}>Colaborador (Personal)</option>
                                            <option value={1}>Tiendas (Ubicaciones)</option>
                                            <option value={2}>Marcas (Unidades)</option>
                                        </select>
                                    </div>

                                    <div className="col-span-1">
                                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 ml-1">Aprobación requerida por:</label>
                                        <select 
                                            value={formData.rolAprobador} 
                                            onChange={(e) => setFormData({ ...formData, rolAprobador: e.target.value })} 
                                            className="input-premium dark:bg-slate-900"
                                        >
                                            <option value="Admin">Administrador General</option>
                                            <option value="RH">Talento Humano (RH)</option>
                                            <option value="Supervisor">Operaciones / Supervisor</option>
                                            <option value="Gerente">Gerencia / Finanzas</option>
                                        </select>
                                    </div>
                                    
                                    <div className="flex items-center justify-between p-6 bg-slate-50/50 dark:bg-slate-800/30 rounded-3xl border border-slate-200/50 dark:border-slate-800 col-span-2">
                                        <div>
                                            <p className="font-black text-slate-800 dark:text-white text-sm mb-1 uppercase tracking-tight">Carga de Soporte</p>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">Obligatorio adjuntar documento/foto</p>
                                        </div>
                                        <div 
                                            onClick={() => setFormData({ ...formData, requiereAdjunto: !formData.requiereAdjunto })}
                                            className={`premium-switch ${formData.requiereAdjunto ? 'active' : ''}`}
                                        />
                                    </div>

                                    <div className="col-span-2 pt-4">
                                        <div className="flex items-center justify-between mb-6 border-b dark:border-slate-800 pb-4">
                                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Campos Personalizados</label>
                                            <button 
                                                type="button" 
                                                onClick={() => setFields([...fields, { name: '', type: 'text', required: false }])}
                                                className="btn-premium btn-premium-primary !h-10 !px-4 !text-[10px] !rounded-xl"
                                            >
                                                <Plus size={16} className="mr-2" /> Agregar Campo
                                            </button>
                                        </div>
                                        
                                        <div className="space-y-4">
                                            {fields.map((f, idx) => (
                                                <div key={idx} className="bg-slate-50 dark:bg-slate-800/20 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 animate-in slide-in-from-right-4 duration-300 shadow-sm">
                                                    <div className="flex flex-wrap md:flex-nowrap gap-4 items-end">
                                                        <div className="flex-1 min-w-[200px]">
                                                            <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Etiqueta del Campo</label>
                                                            <input 
                                                                value={f.name} 
                                                                onChange={(e) => {
                                                                    const newFields = [...fields];
                                                                    newFields[idx].name = e.target.value;
                                                                    setFields(newFields);
                                                                }}
                                                                placeholder="Ej. Entidad, ¿Autorizado?..."
                                                                className="input-premium dark:bg-slate-900 !h-11 !text-xs !font-bold"
                                                            />
                                                        </div>
                                                        <div className="w-full md:w-[160px]">
                                                            <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Tipo de Campo</label>
                                                            <select 
                                                                value={f.type}
                                                                onChange={(e) => {
                                                                    const newFields = [...fields];
                                                                    newFields[idx].type = e.target.value;
                                                                    if ((e.target.value === 'select' || e.target.value === 'radio') && !newFields[idx].options) {
                                                                        newFields[idx].options = '';
                                                                    }
                                                                    setFields(newFields);
                                                                }}
                                                                className="input-premium dark:bg-slate-900 !h-11 !text-xs !font-bold"
                                                            >
                                                                <option value="text">Texto Corto</option>
                                                                <option value="number">Número</option>
                                                                <option value="date">Fecha / Hora</option>
                                                                <option value="check">Checkbox / Switch</option>
                                                                <option value="select">Lista (Select)</option>
                                                                <option value="radio">Radio Buttons</option>
                                                            </select>
                                                        </div>
                                                        <div className="flex flex-col items-center gap-2 mb-1 px-4 border-l dark:border-slate-800">
                                                            <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Oblig.</label>
                                                            <input 
                                                                type="checkbox" 
                                                                checked={f.required}
                                                                onChange={(e) => {
                                                                    const newFields = [...fields];
                                                                    newFields[idx].required = e.target.checked;
                                                                    setFields(newFields);
                                                                }}
                                                                className="w-5 h-5 rounded-lg text-indigo-600 border-slate-300 dark:border-slate-700 dark:bg-slate-900 transition-all cursor-pointer"
                                                            />
                                                        </div>
                                                        <button 
                                                            type="button"
                                                            onClick={() => setFields(fields.filter((_, i) => i !== idx))}
                                                            className="p-3 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/40 rounded-xl transition-all"
                                                        >
                                                            <Trash2 size={20} />
                                                        </button>
                                                    </div>
                                                    
                                                    {(f.type === 'select' || f.type === 'radio') && (
                                                        <div className="mt-5 p-5 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 animate-in slide-in-from-top-2">
                                                            <label className="block text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2">Opciones de la Lista (separadas por coma)</label>
                                                            <input 
                                                                value={f.options || ''}
                                                                onChange={(e) => {
                                                                    const newFields = [...fields];
                                                                    newFields[idx].options = e.target.value;
                                                                    setFields(newFields);
                                                                }}
                                                                placeholder="Opción 1, Opción 2, Opción 3"
                                                                className="input-premium !bg-white dark:!bg-slate-900 !h-10 !text-xs !font-bold"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            {fields.length === 0 && (
                                                <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/50 border border-dashed border-slate-200 dark:border-slate-800 rounded-[32px]">
                                                    <p className="text-[10px] text-slate-400 dark:text-slate-600 font-black uppercase tracking-widest">Diseña el formulario personalizado aquí</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer border-t dark:border-slate-800 px-10 py-8 gap-4">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-premium btn-premium-secondary !h-[56px] flex-1 text-sm font-black uppercase tracking-widest" disabled={isSubmitting}>
                                    Descartar
                                </button>
                                <button type="submit" className="btn-premium btn-premium-primary !h-[56px] flex-1 text-sm font-black uppercase tracking-widest shadow-xl shadow-indigo-100 dark:shadow-none" disabled={isSubmitting}>
                                    {isSubmitting ? <div className="loader !border-white !w-5 !h-5"></div> : (currentType ? 'Actualizar Novedad' : 'Guardar Diseño')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showConfirm && (
                <div className="modal-overlay">
                    <div className="modal-content dark:bg-slate-900 border dark:border-slate-800 shadow-2xl" style={{ maxWidth: '440px', borderRadius: '40px', padding: '3rem' }}>
                        <div className="text-center">
                            <div className="mb-8 mx-auto bg-red-50 dark:bg-red-900/30 text-red-500 w-24 h-24 rounded-[32px] flex items-center justify-center shadow-lg shadow-red-50 dark:shadow-none animate-bounce-subtle">
                                <Trash2 size={48} />
                            </div>
                            <h2 className="text-2xl font-black mb-3 dark:text-white uppercase tracking-tight">¿Eliminar Diseño?</h2>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-bold mb-10 px-4 leading-relaxed tracking-tight">
                                Esta acción es irreversible. Se eliminará permanentemente la configuración para <span className="text-slate-800 dark:text-white underline decoration-red-500 decoration-2 underline-offset-4">{currentType?.nombre}</span>.
                            </p>
                            <div className="flex gap-4">
                                <button onClick={() => setShowConfirm(false)} className="btn-premium btn-premium-secondary h-[60px] flex-1 text-xs font-black uppercase tracking-widest" disabled={isDeleting}>
                                    Volver
                                </button>
                                <button onClick={handleDelete} className="btn-premium btn-premium-danger h-[60px] flex-1 text-xs font-black uppercase tracking-widest" disabled={isDeleting}>
                                    {isDeleting ? <div className="loader !border-white !w-5 !h-5"></div> : 'Confirmar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {toast.show && (
                <div className="toast-container !z-[10001]">
                    <div className={`toast shadow-2xl ${toast.type === 'success' ? 'toast-success bg-emerald-500 text-white' : 'toast-error bg-red-500 text-white'}`}>
                        {toast.type === 'success' ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
                        <span className="font-black uppercase tracking-tight">{toast.message}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NewsDesigner;
