import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, X, Clock, Calendar, CheckCircle, AlertCircle, Info } from 'lucide-react';
import api from '../../services/api';

const Jornadas = () => {
    const [jornadas, setJornadas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [currentJornada, setCurrentJornada] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [formData, setFormData] = useState({ 
        nombre: '', 
        horasDiarias: 8, 
        horasSemanales: 48 
    });
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    useEffect(() => {
        fetchJornadas();
    }, []);

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    };

    const fetchJornadas = async () => {
        try {
            setLoading(true);
            const res = await api.get('/jornadas');
            setJornadas(res.data);
        } catch (err) {
            console.error(err);
            showToast("Error al cargar jornadas", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            setIsSubmitting(true);
            if (currentJornada) {
                await api.put(`/jornadas/${currentJornada.id}`, formData);
                showToast("Jornada actualizada con éxito");
            } else {
                await api.post('/jornadas', formData);
                showToast("Jornada creada con éxito");
            }
            setShowModal(false);
            fetchJornadas();
        } catch (err) {
            showToast("Error al guardar la jornada", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        try {
            setIsDeleting(true);
            await api.delete(`/jornadas/${currentJornada.id}`);
            showToast("Jornada eliminada correctamente");
            setShowConfirm(false);
            fetchJornadas();
        } catch (err) {
            const errorMsg = err.response?.data || "Error al eliminar la jornada";
            showToast(errorMsg, "error");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="page-container animate-in fade-in duration-300">
            <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Jornadas Laborales</h1>
                    <p className="text-slate-500 font-medium">Define los estándares de tiempo para la programación de turnos</p>
                </div>
                <button 
                    onClick={() => { 
                        setCurrentJornada(null); 
                        setFormData({ nombre: '', horasDiarias: 8, horasSemanales: 48 }); 
                        setShowModal(true); 
                    }}
                    className="btn-premium btn-premium-primary whitespace-nowrap"
                >
                    <Plus size={20} /> Nueva Jornada
                </button>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '6rem', textAlign: 'center' }}>
                         <div className="flex flex-col items-center gap-4">
                            <div className="loader loader-indigo" style={{ width: '40px', height: '40px' }}></div>
                            <p className="text-slate-500 font-medium">Cargando estándares...</p>
                        </div>
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', background: 'var(--bg-main)', borderBottom: '1px solid var(--border)' }}>
                                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Nombre / Tipo</th>
                                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Horas Diarias</th>
                                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Horas Semanales</th>
                                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', textAlign: 'right' }}>Gestión</th>
                            </tr>
                        </thead>
                        <tbody>
                            {jornadas.map((j) => (
                                <tr key={j.id} style={{ borderBottom: '1px solid var(--border)' }} className="hover:bg-slate-50 transition-colors">
                                    <td style={{ padding: '1.25rem 1.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{ width: '38px', height: '38px', background: '#e0e7ff', color: '#4f46e5', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Calendar size={20} />
                                            </div>
                                            <div className="font-bold text-slate-800">{j.nombre}</div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1.25rem 1.5rem' }}>
                                        <div className="flex items-center gap-2 font-medium text-slate-600">
                                            <Clock size={16} className="text-slate-400" />
                                            {j.horasDiarias}h
                                        </div>
                                    </td>
                                    <td style={{ padding: '1.25rem 1.5rem' }}>
                                        <div className="flex items-center gap-2 font-medium text-slate-600">
                                            <Calendar size={16} className="text-slate-400" />
                                            {j.horasSemanales}h
                                        </div>
                                    </td>
                                    <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                                        <button 
                                            onClick={() => { 
                                                setCurrentJornada(j); 
                                                setFormData({ nombre: j.nombre, horasDiarias: j.horasDiarias, horasSemanales: j.horasSemanales }); 
                                                setShowModal(true); 
                                            }}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: '1rem', color: '#6366f1' }}
                                            className="hover:scale-110 transition-transform"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button 
                                            onClick={() => { setCurrentJornada(j); setShowConfirm(true); }}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                                            className="hover:scale-110 transition-transform"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {jornadas.length === 0 && (
                                <tr>
                                    <td colSpan="4" style={{ padding: '4rem', textAlign: 'center' }}>
                                        <div className="flex flex-col items-center gap-2 opacity-40">
                                            <Calendar size={48} />
                                            <p className="font-medium">No se han definido jornadas aún.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h2 className="text-xl font-bold flex items-center gap-2" style={{ margin: 0 }}>
                                {currentJornada ? <Edit size={24} className="text-indigo-500" /> : <Plus size={24} className="text-indigo-500" />}
                                {currentJornada ? 'Editar Jornada' : 'Nueva Jornada'}
                            </h2>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSave}>
                            <div className="modal-body space-y-5">
                                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex gap-3 text-indigo-700">
                                    <Info size={20} className="flex-shrink-0" />
                                    <p className="text-sm font-medium">
                                        Estos parámetros se usarán para calcular sobretiempos y alertar choques en el programador de turnos.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nombre de la Jornada</label>
                                    <input 
                                        required 
                                        value={formData.nombre} 
                                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} 
                                        placeholder="Ej. Administrativa 8-5"
                                        className="w-full"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Horas Diarias</label>
                                        <input 
                                            type="number"
                                            step="0.5"
                                            required 
                                            value={formData.horasDiarias} 
                                            onChange={(e) => setFormData({ ...formData, horasDiarias: parseFloat(e.target.value) })} 
                                            className="w-full"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Horas Semanales</label>
                                        <input 
                                            type="number"
                                            step="0.5"
                                            required 
                                            value={formData.horasSemanales} 
                                            onChange={(e) => setFormData({ ...formData, horasSemanales: parseFloat(e.target.value) })} 
                                            className="w-full"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-premium btn-premium-secondary" disabled={isSubmitting}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-premium btn-premium-primary" disabled={isSubmitting}>
                                    {isSubmitting ? <div className="loader"></div> : (currentJornada ? 'Actualizar' : 'Guardar')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showConfirm && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '420px' }}>
                        <div className="modal-body" style={{ textAlign: 'center', paddingTop: '3rem' }}>
                            <div className="mb-6" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                                <Trash2 size={40} />
                            </div>
                            <h2 className="text-2xl font-bold mb-3">¿Eliminar Jornada?</h2>
                            <p className="text-slate-500 text-sm mb-8 px-4" style={{ lineHeight: '1.6' }}>
                                Estás por descartar permanentemente la jornada <strong>{currentJornada?.nombre}</strong>. Asegúrate de que no haya empleados vinculados.
                            </p>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button onClick={() => setShowConfirm(false)} className="btn-premium btn-premium-secondary" style={{ flex: 1 }} disabled={isDeleting}>
                                    Conservar
                                </button>
                                <button onClick={handleDelete} className="btn-premium btn-premium-danger" style={{ flex: 1 }} disabled={isDeleting}>
                                    {isDeleting ? <div className="loader"></div> : 'Si, eliminar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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

export default Jornadas;
