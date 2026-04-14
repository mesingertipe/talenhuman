import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, X, Layout, CheckCircle, AlertCircle, Search, Info, Target, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import PermissionGate from '../../components/Shared/PermissionGate';

const StoreTypes = ({ user }) => {
  const { isDarkMode } = useTheme();
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentType, setCurrentType] = useState(null);
  const [formData, setFormData] = useState({ name: '', isActive: true });
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/storetypes');
      setTypes(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    
    try {
      setIsSubmitting(true);
      if (currentType) {
        await api.put(`/storetypes/${currentType.id}`, formData);
        showToast("Categoría actualizada con éxito");
      } else {
        await api.post('/storetypes', formData);
        showToast("Nueva categoría registrada");
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      showToast(err.response?.data || "Error al procesar solicitud", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Deseas eliminar permanentemente esta categoría?")) return;
    try {
      await api.delete(`/storetypes/${id}`);
      showToast("Categoría eliminada del sistema");
      fetchData();
    } catch (err) {
       // Check if message contains "sede" or related
      const errorMsg = typeof err.response?.data === 'string' ? err.response.data : "Restricción: Tipo en uso";
      showToast(errorMsg, "error");
    }
  };

  const filteredTypes = types.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="min-h-screen animate-in fade-in duration-700" style={{ padding: '3.5rem 2rem', background: isDarkMode ? '#0f172a' : '#f8faff' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header Elite Section - Elevated */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 mb-20 px-4">
          <div className="space-y-5">
            <div className="flex items-center gap-6">
               <div className="w-16 h-16 rounded-[24px] bg-indigo-600 flex items-center justify-center text-white shadow-[0_25px_50px_-12px_rgba(79,70,229,0.5)] transform -rotate-3">
                  <Target size={32} strokeWidth={2.5} />
               </div>
               <div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-[1000] text-indigo-500 uppercase tracking-[0.4em] bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1 rounded-lg">Módulo Core</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                    <span className="text-[10px] font-[1000] text-slate-400 uppercase tracking-[0.4em]">v13.0 Platinum</span>
                  </div>
                  <h1 className="text-5xl font-[1000] text-slate-900 dark:text-white tracking-tighter leading-tight mt-1">
                    Tipos de Tienda
                  </h1>
               </div>
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-bold max-w-xl text-base leading-relaxed opacity-80">
              Gestión estratégica de formatos operativos para la optimización del motor predictivo de carga laboral.
            </p>
          </div>

          <PermissionGate module="CORE" sub="STORE_TYPES" action="C" user={user}>
            <motion.button 
              whileHover={{ scale: 1.05, y: -4, boxShadow: '0 30px 60px -12px rgba(79,70,229,0.5)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { setCurrentType(null); setFormData({ name: '', isActive: true }); setShowModal(true); }}
              className="h-20 px-12 rounded-[32px] bg-indigo-600 text-white font-[1000] text-sm flex items-center gap-5 shadow-[0_20px_40px_-10px_rgba(79,70,229,0.5)] hover:bg-indigo-700 transition-all group"
            >
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center group-hover:rotate-90 transition-transform duration-500">
                <Plus size={22} strokeWidth={3} />
              </div>
              <span className="tracking-[0.2em] pt-0.5">NUEVA CATEGORÍA</span>
            </motion.button>
          </PermissionGate>
        </header>

        {/* Premium Search Bar - Floating Glass */}
        <div className="mb-14 px-4 sticky top-10 z-50">
           <div className="relative group max-w-2xl mx-auto shadow-2xl shadow-indigo-500/10">
              <Search size={22} className="absolute left-8 top-1/2 -translate-y-1/2 text-indigo-400 group-focus-within:text-indigo-600 transition-colors z-10" />
              <input 
                placeholder="FILTRAR POR NOMBRE O FORMATO OPERATIVO..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-20 pl-20 pr-10 rounded-full bg-white/60 dark:bg-slate-800/60 backdrop-blur-2xl border-2 border-white dark:border-slate-700 focus:border-indigo-500/50 focus:bg-white dark:focus:bg-slate-900 font-black text-xs tracking-[0.1em] outline-none transition-all placeholder:text-slate-400 uppercase shadow-inner"
              />
              <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-3">
                <div className="w-px h-8 bg-slate-200 dark:bg-slate-700"></div>
                <Layout size={20} className="text-slate-300" />
              </div>
           </div>
        </div>

        {/* List Section - Dynamic Master Tiles */}
        <div className="px-4">
          {loading ? (
            <div className="py-40 flex flex-col items-center gap-8 animate-pulse">
              <div className="w-20 h-20 rounded-[32px] border-4 border-indigo-500 border-t-transparent animate-spin"></div>
              <span className="font-black text-[12px] tracking-[0.4em] uppercase text-indigo-500/60">Sincronizando Modelos Maestros...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {filteredTypes.map((t, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: idx * 0.1, type: "spring", stiffness: 100 }}
                  key={t.id} 
                  className="group relative p-10 rounded-[48px] bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white dark:border-slate-700 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] flex items-center justify-between hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-2 transition-all duration-500 overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-bl-[100px] -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700"></div>
                  
                  <div className="flex items-center gap-10 z-10">
                     <div className="w-24 h-24 rounded-[36px] bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                        <Target size={44} strokeWidth={1.2} />
                     </div>
                     <div>
                        <div className="flex items-center gap-3 mb-2">
                           <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Categoría v13</span>
                        </div>
                        <h4 className="font-[1000] text-3xl text-slate-900 dark:text-white tracking-tighter leading-none">{t.name}</h4>
                        <div className="flex items-center gap-3 mt-4">
                           <div className={`px-5 py-2 rounded-full flex items-center gap-3 ${t.isActive ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
                              <div className={`w-2.5 h-2.5 rounded-full ${t.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></div>
                              <span className="text-[11px] font-black uppercase tracking-widest">{t.isActive ? 'OPERATIVO' : 'DESACTIVADO'}</span>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="flex flex-col gap-3 z-10">
                     <PermissionGate module="CORE" sub="STORE_TYPES" action="U" user={user}>
                        <button 
                          onClick={() => { setCurrentType(t); setFormData({ name: t.name, isActive: t.isActive }); setShowModal(true); }}
                          className="w-16 h-16 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-[20px] shadow-lg flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all transform hover:-rotate-12"
                        >
                          <Edit size={24} />
                        </button>
                     </PermissionGate>
                     <PermissionGate module="CORE" sub="STORE_TYPES" action="D" user={user}>
                        <button 
                          onClick={() => handleDelete(t.id)}
                          className="w-16 h-16 bg-slate-50 dark:bg-slate-700 text-red-500 rounded-[20px] shadow-lg flex items-center justify-center hover:bg-red-600 hover:text-white transition-all transform hover:rotate-12"
                        >
                          <Trash2 size={24} />
                        </button>
                     </PermissionGate>
                  </div>
                </motion.div>
              ))}
              
              {filteredTypes.length === 0 && (
                <div className="col-span-full py-60 flex flex-col items-center text-slate-300 dark:text-slate-700">
                  <div className="relative mb-10">
                    <Target size={120} strokeWidth={0.2} className="opacity-10" />
                    <Info size={40} className="absolute inset-0 m-auto text-indigo-500 opacity-20" />
                  </div>
                  <p className="font-black text-sm uppercase tracking-[0.8em] opacity-40 italic">SIN REGISTROS ACTIVOS</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal Elite Design - command Center Style */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-8 bg-slate-900/95 backdrop-blur-3xl">
             <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 100 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 100 }}
               className="relative bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[64px] shadow-[0_80px_160px_-40px_rgba(0,0,0,0.7)] border border-white/20 overflow-hidden"
             >
                <div className="p-16 pb-10 flex items-center justify-between bg-gradient-to-b from-indigo-500/5 to-transparent">
                   <div>
                      <div className="flex items-center gap-3 mb-4">
                         <span className="w-10 h-1 border-t-4 border-indigo-600 rounded-full"></span>
                         <span className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.4em] font-mono">Maestro de Formatos</span>
                      </div>
                      <h2 className="text-5xl font-[1000] text-slate-900 dark:text-white tracking-tighter mt-2 leading-none">
                        {currentType ? 'Actualizar' : 'Registrar'} Tipo
                      </h2>
                   </div>
                   <button onClick={() => setShowModal(false)} className="w-16 h-16 rounded-full bg-white dark:bg-slate-800 shadow-xl flex items-center justify-center text-slate-400 hover:text-red-500 transition-all transform hover:rotate-90">
                     <X size={32} strokeWidth={3} />
                   </button>
                </div>

                <form onSubmit={handleSave} className="p-16 pt-6 space-y-16">
                   <div className="space-y-6">
                      <div className="flex items-center gap-4 px-4">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black">01</div>
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] font-mono">Nombre de Categoría *</label>
                      </div>
                      <div className="relative">
                        <Layout size={24} className="absolute left-10 top-1/2 -translate-y-1/2 text-indigo-500" />
                        <input 
                          required 
                          autoFocus
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          placeholder="EJ: RESTAURANTE TRADICIONAL, EXPRESS..."
                          className="w-full h-28 px-20 rounded-[40px] bg-slate-50 dark:bg-slate-800 border-4 border-transparent focus:border-indigo-500/40 outline-none font-[1000] text-3xl tracking-tighter transition-all uppercase placeholder:text-slate-200 dark:placeholder:text-slate-700 shadow-inner"
                        />
                      </div>
                   </div>

                   <div 
                      onClick={() => setFormData({...formData, isActive: !formData.isActive})}
                      className="flex items-center justify-between bg-slate-100/40 dark:bg-slate-800/20 p-12 rounded-[56px] border-2 border-slate-50 dark:border-slate-800/50 cursor-pointer group hover:border-indigo-500/30 transition-all shadow-sm"
                   >
                      <div className="flex items-center gap-8">
                         <div className={`w-20 h-20 rounded-[30px] flex items-center justify-center transition-all ${formData.isActive ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-600/40' : 'bg-slate-200 text-slate-400'}`}>
                            <CheckCircle size={32} />
                         </div>
                         <div className="space-y-1">
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Habilitación de Reglas</p>
                            <p className={`font-[1000] text-2xl tracking-tighter ${formData.isActive ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                              {formData.isActive ? 'ESTADO OPERATIVO' : 'DESHABILITADO'}
                            </p>
                         </div>
                      </div>
                      <div className={`w-22 h-12 rounded-full relative transition-all duration-500 p-1 ${formData.isActive ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                          <motion.div 
                            animate={{ x: formData.isActive ? 40 : 0 }}
                            className="w-10 h-10 bg-white rounded-full shadow-2xl"
                          />
                      </div>
                   </div>

                   <div className="p-10 rounded-[40px] bg-indigo-600 text-white flex flex-col md:flex-row items-center gap-8 shadow-[0_30px_60px_-15px_rgba(79,70,229,0.5)]">
                      <div className="flex-1">
                         <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-2">Confirmar Configuración</p>
                         <h4 className="text-xl font-black tracking-tight leading-tight">Implementar este formato en el motor de inteligencia predictiva.</h4>
                      </div>
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="submit" 
                        disabled={isSubmitting}
                        className="h-20 px-10 bg-white text-indigo-600 rounded-[28px] font-[1000] text-sm tracking-widest flex items-center gap-4 shadow-xl whitespace-nowrap"
                      >
                        {isSubmitting ? 'GUARDANDO...' : (
                          <>
                            CONFIRMAR
                            <ArrowRight size={22} strokeWidth={3} />
                          </>
                        )}
                      </motion.button>
                   </div>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Premium Toast - Elite Dark */}
      <AnimatePresence>
        {toast.show && (
          <motion.div 
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className="fixed bottom-16 left-1/2 -translate-x-1/2 z-[20000]"
          >
             <div className={`px-12 py-7 rounded-[40px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] flex items-center gap-6 font-[1000] text-sm tracking-[0.1em] border-t-8 ${toast.type === 'success' ? 'bg-indigo-950 text-white border-indigo-500' : 'bg-red-950 text-white border-red-500'}`}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${toast.type === 'success' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-red-500/20 text-red-400'}`}>
                   {toast.type === 'success' ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
                </div>
                <span className="uppercase text-slate-100">{toast.message}</span>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StoreTypes;
