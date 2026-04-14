import React, { useState, useEffect } from 'react';
import { 
    Plus, Trash2, Edit, X, Layout, CheckCircle, AlertCircle, 
    Search, Store, Settings, Sparkles, Activity, Layers, Info, Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import PermissionGate from '../../components/Shared/PermissionGate';
import { useTableData } from '../../hooks/useTableData';
import Pagination from '../../components/Shared/Pagination';

const StoreTypes = ({ user }) => {
  const { isDarkMode } = useTheme();
  
  // Elite Design Tokens
  const activeColors = {
    bg: isDarkMode ? '#060914' : '#f8fafc',
    card: isDarkMode ? '#1e293b' : '#ffffff',
    border: isDarkMode ? '#1e293b' : '#f1f5f9',
    textMain: isDarkMode ? '#f1f5f9' : '#1e293b',
    textMuted: isDarkMode ? '#94a3b8' : '#64748b',
    accent: '#4f46e5',
    accentSoft: isDarkMode ? 'rgba(79, 70, 229, 0.15)' : '#eef2ff',
    emerald: '#10b981',
    rose: '#f43f5e'
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
        showToast("Arquitectura actualizada");
      } else {
        await api.post('/storetypes', formData);
        showToast("Nuevo formato registrado");
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
    <div className="min-h-screen animate-in fade-in duration-700" style={{ background: activeColors.bg, padding: '3.5rem 2rem' }}>
      <div className="max-w-7xl mx-auto">
        
        {/* Elite Header */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 mb-16 px-4">
          <div className="space-y-4">
            <div className="flex items-center gap-6">
               <div className="w-16 h-16 rounded-[24px] bg-indigo-600 flex items-center justify-center text-white shadow-[0_25px_50px_-12px_rgba(79,70,229,0.5)] transform -rotate-3 hover:rotate-0 transition-transform duration-500">
                  <Layout size={32} strokeWidth={2.5} />
               </div>
               <div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-[1000] text-indigo-500 uppercase tracking-[0.4em] bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1 rounded-lg">Configuración de Red</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                    <span className="text-[10px] font-[1000] text-slate-400 uppercase tracking-[0.4em]">Elite v13.0 Platinum</span>
                  </div>
                  <h1 className="text-5xl font-[1000] text-slate-900 dark:text-white tracking-tighter leading-tight mt-1">
                    Tipos de Tienda
                  </h1>
               </div>
            </div>
          </div>

          <div className="flex gap-6 items-center w-full lg:w-auto">
            <div className="relative flex-1 lg:w-96 group">
                <Search size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors z-10" />
                <input 
                    placeholder="BÚSQUEDA DE FORMATOS..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full h-16 pl-16 pr-6 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 focus:border-indigo-500/50 outline-none font-black text-xs tracking-widest transition-all uppercase placeholder:text-slate-300 shadow-sm"
                />
            </div>

            <PermissionGate module="CORE" sub="STORE_TYPES" action="C" user={user}>
                <motion.button 
                    whileHover={{ scale: 1.05, y: -4, boxShadow: '0 30px 60px -12px rgba(79,70,229,0.5)' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { setCurrentType(null); setFormData({ name: '', description: '', isActive: true }); setShowModal(true); }}
                    className="h-16 px-10 rounded-2xl bg-indigo-600 text-white font-[1000] text-xs flex items-center gap-4 shadow-xl hover:bg-indigo-700 transition-all group outline-none whitespace-nowrap"
                >
                    <Plus size={20} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-500" />
                    <span className="tracking-[0.2em]">NUEVO FORMATO</span>
                </motion.button>
            </PermissionGate>
          </div>
        </header>

        {/* Master Table Layout */}
        <div className="bg-white dark:bg-slate-900 rounded-[40px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.08)] border border-slate-100 dark:border-slate-800 overflow-hidden">
             {loading ? (
                <div className="py-40 flex flex-col items-center gap-8 animate-pulse">
                    <div className="w-20 h-20 rounded-[32px] border-4 border-indigo-500 border-t-transparent animate-spin"></div>
                    <span className="font-black text-[10px] tracking-[0.5em] uppercase text-indigo-500/60">Analizando Catálogos...</span>
                </div>
             ) : (
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="text-left bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                            <th className="px-12 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Formato / Clasificación</th>
                            <th className="px-12 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Descripción Estratégica</th>
                            <th className="px-12 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Estatus Nubular</th>
                            <th className="px-12 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] text-right">Gestión</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTypes.map((type, idx) => (
                            <motion.tr 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                key={type.id} 
                                className="group border-b border-slate-50 dark:border-slate-800/50 hover:bg-indigo-50/30 transition-all duration-300"
                            >
                                <td className="px-12 py-8">
                                    <div className="flex items-center gap-6">
                                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                                            <Store size={22} />
                                        </div>
                                        <h4 className="font-[1000] text-lg text-slate-900 dark:text-white tracking-tighter leading-none mb-1 uppercase bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400 italic">{type.name}</h4>
                                    </div>
                                </td>
                                <td className="px-12 py-8">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none truncate max-w-[350px]">{type.description || 'SIN DESCRIPCIÓN TÉCNICA.'}</p>
                                </td>
                                <td className="px-12 py-8">
                                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black tracking-widest inline-flex items-center gap-2 border ${type.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'}`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${type.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
                                        {type.isActive ? 'NÚCLEO ACTIVO' : 'FORMATO INACTIVO'}
                                    </span>
                                </td>
                                <td className="px-12 py-8 text-right">
                                    <div className="flex items-center justify-end gap-3 translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                                        <PermissionGate module="CORE" sub="STORE_TYPES" action="U" user={user}>
                                            <button 
                                                onClick={() => { 
                                                    setCurrentType(type);
                                                    setFormData({ name: type.name, description: type.description, isActive: type.isActive });
                                                    setShowModal(true);
                                                }}
                                                className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 text-indigo-600 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all flex items-center justify-center shadow-sm"
                                            >
                                                <Edit size={18} strokeWidth={2.5} />
                                            </button>
                                        </PermissionGate>
                                        <PermissionGate module="CORE" sub="STORE_TYPES" action="D" user={user}>
                                            <button 
                                                onClick={() => handleDelete(type)}
                                                className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 text-rose-500 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all flex items-center justify-center shadow-sm"
                                            >
                                                <Trash2 size={18} strokeWidth={2.5} />
                                            </button>
                                        </PermissionGate>
                                    </div>
                                </td>
                            </motion.tr>
                        ))}
                        {filteredTypes.length === 0 && (
                            <tr>
                                <td colSpan="4" className="py-40 text-center">
                                    <div className="flex flex-col items-center gap-6 opacity-30">
                                        <Layers size={80} strokeWidth={0.5} />
                                        <p className="font-black text-sm uppercase tracking-[0.5em]">Sin formatos registrados</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
             )}
             {!loading && (
                <div className="border-t border-slate-100 dark:border-slate-800 px-10 py-6">
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
      </div>

      {/* MODAL REAL - ELITE STYLE (STORES) */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[10000] bg-slate-900/80 backdrop-blur-3xl flex items-center justify-center p-8 animate-in fade-in duration-300">
             <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 30 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 30 }}
               className="bg-white dark:bg-slate-950 w-full max-w-2xl rounded-[48px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.6)] border border-white/5 overflow-hidden"
             >
                {/* Modal Header */}
                <div className="px-12 py-10 bg-indigo-600 text-white flex justify-between items-center relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                   <div className="flex items-center gap-6 relative z-10">
                      <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
                         {currentType ? <Edit size={28} /> : <Plus size={28} />}
                      </div>
                      <div>
                         <h3 className="text-2xl font-[1000] tracking-tighter leading-none italic uppercase">{currentType ? 'Editar Formato' : 'Nuevo Formato'}</h3>
                         <p className="text-[10px] font-black uppercase tracking-[0.4em] mt-2 opacity-60 italic">Arquitectura CORE v13</p>
                      </div>
                   </div>
                   <button onClick={() => setShowModal(false)} className="w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all relative z-10">
                      <X size={24} strokeWidth={3} />
                   </button>
                </div>

                <form onSubmit={handleSave}>
                   <div className="p-16 space-y-12">
                      <div className="space-y-10">
                         <div className="relative group">
                            <label className="absolute -top-4 left-6 bg-white dark:bg-slate-950 px-3 py-1 text-[9px] font-black text-indigo-500 uppercase tracking-widest z-10 rounded-full border border-indigo-50">Identificador del Formato *</label>
                            <input 
                               autoFocus
                               value={formData.name}
                               onChange={(e) => setFormData({...formData, name: e.target.value.toUpperCase()})}
                               placeholder="EJ: RESTAURANTE, EXPRESS, KIOSKO..."
                               className="w-full h-20 px-10 rounded-[24px] bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 focus:border-indigo-500 outline-none font-[1000] text-xl tracking-tighter transition-all"
                            />
                         </div>

                         <div className="relative group">
                            <label className="absolute -top-4 left-6 bg-white dark:bg-slate-950 px-3 py-1 text-[9px] font-black text-indigo-500 uppercase tracking-widest z-10 rounded-full border border-indigo-50">Descripción Operativa</label>
                            <textarea 
                               value={formData.description}
                               onChange={(e) => setFormData({...formData, description: e.target.value})}
                               placeholder="Detalle el alcance de este formato..."
                               className="w-full h-32 p-8 rounded-[24px] bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 focus:border-indigo-500 outline-none font-bold text-sm leading-relaxed resize-none transition-all"
                            />
                         </div>

                         <div className="flex items-center justify-between p-8 bg-slate-50 dark:bg-slate-900 rounded-[30px] border border-slate-100 dark:border-slate-800">
                             <div className="flex items-center gap-4">
                                <div className={`w-3 h-3 rounded-full ${formData.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></div>
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Activar formato para nuevas sedes</span>
                             </div>
                             <div 
                                onClick={() => setFormData({...formData, isActive: !formData.isActive})}
                                className={`w-14 h-8 rounded-full p-1 cursor-pointer transition-all duration-300 ${formData.isActive ? 'bg-indigo-600' : 'bg-slate-300'}`}
                             >
                                <div className={`w-6 h-6 bg-white rounded-full shadow-lg transform transition-transform duration-300 ${formData.isActive ? 'translate-x-6' : 'translate-x-0'}`}></div>
                             </div>
                         </div>
                      </div>

                      <div className="flex gap-4 p-6 bg-indigo-50/50 dark:bg-indigo-500/5 rounded-3xl border border-indigo-100 dark:border-indigo-500/10">
                         <Shield className="text-indigo-400 shrink-0" size={20} />
                         <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-tight italic">
                            Los cambios en este catálogo impactan directamente en la lógica de cálculo de reglas predictivas vinculadas.
                         </p>
                      </div>
                   </div>

                   <div className="px-16 py-10 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex gap-6">
                      <button 
                         type="button"
                         onClick={() => setShowModal(false)}
                         className="flex-1 h-16 rounded-[20px] bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 font-black text-[11px] uppercase tracking-widest text-slate-400 hover:text-rose-500"
                      >
                         Descartar
                      </button>
                      <button 
                         type="submit"
                         disabled={isSubmitting}
                         className="flex-[2] h-16 rounded-[20px] bg-indigo-600 text-white font-[1000] text-[11px] uppercase tracking-widest shadow-xl shadow-indigo-600/30 hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all"
                      >
                         {isSubmitting ? 'Sincronizando...' : 'Confirmar Cambios'}
                      </button>
                   </div>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Elite Toast */}
      <AnimatePresence>
        {toast.show && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[20000]"
          >
             <div className={`px-12 py-6 rounded-full shadow-2xl backdrop-blur-xl flex items-center gap-6 border-b-4 ${toast.type === 'success' ? 'bg-indigo-950/90 text-white border-indigo-500' : 'bg-rose-950/90 text-white border-rose-500'}`}>
                <Activity size={20} className={toast.type === 'success' ? 'text-indigo-400' : 'text-rose-400'} />
                <span className="font-black text-[10px] uppercase tracking-[0.2em]">{toast.message}</span>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default StoreTypes;
