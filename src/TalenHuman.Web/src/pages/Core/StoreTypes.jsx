import React, { useState, useEffect } from 'react';
import { 
    Plus, Trash2, Edit, X, Layout, CheckCircle, AlertCircle, 
    Search, Store, Settings, Sparkles, Activity, Layers, Info, Shield, LayoutGrid
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import PermissionGate from '../../components/Shared/PermissionGate';
import { useTableData } from '../../hooks/useTableData';
import Pagination from '../../components/Shared/Pagination';

const StoreTypes = ({ user }) => {
  const { isDarkMode } = useTheme();
  
  // Elite Design Tokens - Unified for Absolute Reliability
  const activeColors = {
    bg: isDarkMode ? '#060914' : '#f8fafc',
    card: isDarkMode ? '#1e293b' : '#ffffff',
    border: isDarkMode ? '#334155' : '#f1f5f9',
    textMain: isDarkMode ? '#f1f5f9' : '#1e293b',
    textMuted: isDarkMode ? '#94a3b8' : '#64748b',
    accent: '#4f46e5',
    accentSoft: isDarkMode ? 'rgba(79, 70, 229, 0.15)' : '#eef2ff'
  };

  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentType, setCurrentType] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', isActive: true });
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { 
    data: filteredTypes, 
    searchTerm, 
    setSearchTerm, 
    currentPage, 
    setCurrentPage, 
    totalPages, 
    totalItems, 
    itemsPerPage, 
    setItemsPerPage 
  } = useTableData(types, ['name', 'description']);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/storetypes');
      setTypes(res.data);
    } catch (err) {
      console.error(err);
      showToast("Error al sincronizar catálogo", "error");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name) {
        showToast("Nombre obligatorio", "error");
        return;
    }

    try {
      setIsSubmitting(true);
      if (currentType) {
        await api.put(`/storetypes/${currentType.id}`, formData);
        showToast("Actualizado con éxito");
      } else {
        await api.post('/storetypes', formData);
        showToast("Formato registrado");
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      showToast("Error en la persistencia", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (type) => {
    if (!window.confirm(`¿Desea eliminar el formato "${type.name}"?`)) return;
    try {
      await api.delete(`/storetypes/${type.id}`);
      showToast("Formato eliminado");
      fetchData();
    } catch (err) {
      showToast("Error al eliminar", "error");
    }
  };

  return (
    <div style={{ background: activeColors.bg, padding: '2rem 1.5rem', maxWidth: '1400px', margin: '0 auto', minHeight: '100vh' }}>
      
      {/* Elite Header - Mirroring Stores.jsx layout exactly */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4rem', gap: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: '950', color: activeColors.textMain, margin: 0, letterSpacing: '-0.03em' }}>Formatos de tienda</h1>
          <p style={{ color: activeColors.textMuted, fontSize: '0.9rem', fontWeight: '600', marginTop: '6px' }}>Clasificación y arquitectura de red operativa</p>
        </div>

        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', width: '100%', maxWidth: '850px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '16px', top: '19px', color: '#94a3b8', zIndex: 10 }} />
            <input 
              type="text" 
              placeholder="Filtrar formatos por nombre o descripción..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-premium"
              style={{ paddingLeft: '50px', borderRadius: '20px', height: '56px', margin: 0, border: `1.5px solid ${activeColors.border}` }}
            />
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <PermissionGate module="CORE" sub="STORE_TYPES" action="C" user={user}>
              <button 
                onClick={() => { 
                  setCurrentType(null); 
                  setFormData({ name: '', description: '', isActive: true }); 
                  setShowModal(true); 
                }}
                className="btn-premium btn-premium-primary"
                style={{ borderRadius: '20px', height: '56px', padding: '0 25px', whiteSpace: 'nowrap' }}
              >
                <Plus size={20} /> Nuevo Formato
              </button>
            </PermissionGate>
          </div>
        </div>
      </div>

      {/* Table Container - Mirroring Stores.jsx layout exactly */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', minHeight: '60vh', background: activeColors.card, border: `1px solid ${activeColors.border}`, borderRadius: '20px' }}>
        {loading ? (
          <div style={{ padding: '6rem', textAlign: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '48px', height: '48px', border: '4px solid rgba(79, 70, 229, 0.1)', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              <p style={{ color: activeColors.textMuted, fontWeight: '500' }}>Sincronizando formatos...</p>
            </div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', background: isDarkMode ? '#1e293b50' : '#f8fafc', borderBottom: `1px solid ${activeColors.border}` }}>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '800', color: activeColors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Formato / Clasificación</th>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '800', color: activeColors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Descripción Operativa</th>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '800', color: activeColors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estatus</th>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '800', color: activeColors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Gestión</th>
              </tr>
            </thead>
            <tbody>
              {filteredTypes.map((type) => (
                <tr key={type.id} style={{ borderBottom: `1px solid ${activeColors.border}` }} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '38px', height: '38px', background: isDarkMode ? 'rgba(79, 70, 229, 0.15)' : '#eef2ff', color: '#4f46e5', border: `1px solid ${activeColors.border}`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <LayoutGrid size={20} />
                      </div>
                      <div style={{ fontWeight: '700', color: activeColors.textMain }}>{type.name}</div>
                    </div>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <p style={{ fontSize: '0.85rem', color: activeColors.textMuted, margin: 0, fontWeight: '500' }}>{type.description || 'Sin descripción técnica.'}</p>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <span style={{ 
                      padding: '0.35rem 0.75rem', 
                      background: type.isActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                      color: type.isActive ? '#10b981' : '#ef4444', 
                      borderRadius: '9999px', 
                      fontSize: '0.7rem', 
                      fontWeight: '800',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}>
                      {type.isActive ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                      {type.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <PermissionGate module="CORE" sub="STORE_TYPES" action="U" user={user}>
                        <button 
                            onClick={() => { 
                                setCurrentType(type);
                                setFormData({ name: type.name, description: type.description || '', isActive: type.isActive });
                                setShowModal(true);
                            }}
                            style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', padding: '0.5rem' }}
                        >
                            <Edit size={18} />
                        </button>
                        </PermissionGate>
                        <PermissionGate module="CORE" sub="STORE_TYPES" action="D" user={user}>
                        <button 
                            onClick={() => handleDelete(type)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '0.5rem' }}
                        >
                            <Trash2 size={18} />
                        </button>
                        </PermissionGate>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTypes.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ padding: '4rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', opacity: 0.4 }}>
                      <Layers size={48} />
                      <p style={{ fontWeight: '500' }}>No se encontraron formatos.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
        {!loading && (
          <div style={{ padding: '1rem 1.5rem', borderTop: `1px solid ${activeColors.border}` }}>
            <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onItemsPerPageChange={setItemsPerPage}
            />
          </div>
        )}
      </div>

      {/* MODAL REAL - Mirroring Stores.jsx layout exactly */}
      <AnimatePresence>
        {showModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(2, 6, 23, 0.85)', backdropFilter: 'blur(30px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 30 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 30 }}
               style={{ background: activeColors.card, width: '100%', maxWidth: '720px', maxHeight: '92vh', borderRadius: '48px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 50px 100px rgba(0,0,0,0.4)', border: `1px solid ${activeColors.border}` }}
            >
                {/* Header Elite */}
                <div style={{ padding: '40px 60px', borderBottom: `1px solid ${activeColors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isDarkMode ? '#1e293b' : '#ffffff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <div style={{ width: '64px', height: '64px', background: activeColors.accentSoft, borderRadius: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: activeColors.accent }}>
                        {currentType ? <Edit size={28} strokeWidth={2.5} /> : <Plus size={28} strokeWidth={2.5} />}
                    </div>
                    <div>
                      <h2 style={{ fontSize: '1.8rem', fontWeight: '950', color: activeColors.textMain, margin: 0, letterSpacing: '-0.03em' }}>
                        {currentType ? 'Actualizar Formato' : 'Registrar Formato'}
                      </h2>
                      <p style={{ fontSize: '0.85rem', color: activeColors.textMuted, fontWeight: '700', marginTop: '4px', letterSpacing: '0.02em' }}>
                        Arquitectura de Red V13.0 Platinum
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowModal(false)}
                    style={{ background: activeColors.accentSoft, border: 'none', width: '52px', height: '52px', borderRadius: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: activeColors.accent, transition: 'all 0.2s' }}
                  >
                    <X size={28} strokeWidth={3} />
                  </button>
                </div>
                
                <form onSubmit={handleSave} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div style={{ padding: '50px 60px', flex: 1, overflowY: 'auto' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                            <div style={{ position: 'relative' }}>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: activeColors.textMuted, marginBottom: '14px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Nombre del Formato *</label>
                                <div style={{ position: 'relative' }}>
                                    <LayoutGrid size={20} style={{ position: 'absolute', left: '20px', top: '22px', color: '#94a3b8' }} />
                                    <input 
                                        required 
                                        autoFocus
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value.toUpperCase()})}
                                        placeholder="Ej. RESTAURANTE, KIOSCO, EXPRESS..." 
                                        style={{ width: '100%', padding: '18px 24px 18px 60px', borderRadius: '24px', border: `2px solid ${activeColors.border}`, background: activeColors.card, color: activeColors.textMain, fontWeight: '700', fontSize: '1rem', outline: 'none' }}
                                    />
                                </div>
                            </div>

                            <div style={{ position: 'relative' }}>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: activeColors.textMuted, marginBottom: '14px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Descripción Operativa</label>
                                <textarea 
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    placeholder="Detalle el alcance de este formato..." 
                                    style={{ width: '100%', minHeight: '120px', padding: '22px', borderRadius: '24px', border: `2px solid ${activeColors.border}`, background: activeColors.card, color: activeColors.textMain, fontWeight: '600', fontSize: '0.95rem', outline: 'none', resize: 'none' }}
                                />
                            </div>

                            <div style={{ background: isDarkMode ? 'rgba(79, 70, 229, 0.05)' : '#f8faff', padding: '30px', borderRadius: '32px', border: `1px solid ${activeColors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <div 
                                        onClick={() => setFormData({...formData, isActive: !formData.isActive})}
                                        style={{ width: '56px', height: '28px', background: formData.isActive ? '#10b981' : '#cbd5e1', borderRadius: '20px', position: 'relative', cursor: 'pointer', transition: 'all 0.3s' }}
                                    >
                                        <div style={{ width: '22px', height: '22px', background: 'white', borderRadius: '50%', position: 'absolute', top: '3px', left: formData.isActive ? '31px' : '3px', transition: 'all 0.3s', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}></div>
                                    </div>
                                    <div>
                                        <span style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: activeColors.textMuted, textTransform: 'uppercase' }}>Estado del Formato</span>
                                        <span style={{ fontSize: '0.8rem', fontWeight: '950', color: formData.isActive ? '#10b981' : activeColors.textMuted }}>{formData.isActive ? 'ACTIVO' : 'INACTIVO'}</span>
                                    </div>
                                </div>
                                <Shield size={24} style={{ color: activeColors.accent, opacity: 0.3 }} />
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '20px 30px', background: isDarkMode ? 'rgba(79, 70, 229, 0.1)' : '#f1f5f9', borderRadius: '24px', color: activeColors.textMuted }}>
                                <Info size={18} />
                                <p style={{ fontSize: '0.75rem', fontWeight: '700', margin: 0 }}>
                                    Este catálogo permite agrupar sedes para aplicar reglas predictivas de carga laboral masivamente.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div style={{ padding: '40px 60px', background: isDarkMode ? '#1e293b' : '#ffffff', borderTop: `1px solid ${activeColors.border}`, display: 'flex', gap: '20px' }}>
                        <button 
                            type="button" 
                            onClick={() => setShowModal(false)}
                            style={{ flex: 1, padding: '22px', borderRadius: '24px', border: `2px solid ${activeColors.border}`, background: 'white', color: activeColors.textMuted, fontWeight: '900', fontSize: '1rem', cursor: 'pointer' }}
                        >
                            Descartar
                        </button>
                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            style={{ flex: 2, padding: '22px', borderRadius: '24px', border: 'none', background: activeColors.accent, color: 'white', fontWeight: '950', fontSize: '1rem', cursor: 'pointer', boxShadow: '0 15px 35px rgba(79, 70, 229, 0.4)' }}
                        >
                            {isSubmitting ? 'Guardando...' : currentType ? 'Guardar Cambios' : 'Confirmar Registro'}
                        </button>
                    </div>
                </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Local Toast - Simplified but Functional */}
      <AnimatePresence>
        {toast.show && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            style={{ position: 'fixed', bottom: '40px', right: '40px', zIndex: 11000, background: toast.type === 'success' ? '#10b981' : '#ef4444', color: 'white', padding: '16px 30px', borderRadius: '20px', fontWeight: '900', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.15em', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 15px 30px rgba(0,0,0,0.2)' }}
          >
            {toast.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .input-premium:focus { border-color: #4f46e5 !important; box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1) !important; translate: translateY(-1px); transition: all 0.2s; }
      `}</style>

    </div>
  );
};

export default StoreTypes;
