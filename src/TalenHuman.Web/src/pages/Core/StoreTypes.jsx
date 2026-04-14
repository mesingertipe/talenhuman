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
    <div className="min-h-screen animate-in fade-in duration-700" style={{ padding: '2.5rem 2rem' }}>
      <div className="max-w-5xl mx-auto">
        {/* Header Elite Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 px-4">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
               <div className="w-14 h-14 rounded-[22px] bg-indigo-600 flex items-center justify-center text-white shadow-2xl shadow-indigo-600/40">
                  <Target size={28} strokeWidth={2.5} />
               </div>
               <div>
                  <span className="text-[11px] font-[900] text-indigo-500 uppercase tracking-[0.25em]">Módulo • Núcleo</span>
                  <h1 className="text-4xl font-[1000] text-slate-900 dark:text-white tracking-tighter leading-none mt-2">
                    Tipos de Tienda
                  </h1>
               </div>
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-bold max-w-md text-sm leading-relaxed">
              Configura los formatos operativos de tus sedes para habilitar el motor predictivo de carga laboral.
            </p>
          </div>

          <PermissionGate module="CORE" sub="STORE_TYPES" action="C" user={user}>
            <motion.button 
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { setCurrentType(null); setFormData({ name: '', isActive: true }); setShowModal(true); }}
              className="h-16 px-10 rounded-[28px] bg-indigo-600 text-white font-black text-sm flex items-center gap-4 shadow-[0_20px_40px_-10px_rgba(79,70,229,0.5)] hover:bg-indigo-700 transition-all"
            >
              <Plus size={20} strokeWidth={4} />
              <span className="tracking-widest">NUEVA CATEGORÍA</span>
            </motion.button>
          </PermissionGate>
        </header>

        {/* List Section with Glassmorphism */}
        <div className="bg-white/60 dark:bg-slate-800/40 backdrop-blur-3xl rounded-[56px] border border-white dark:border-slate-700/50 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.1)] overflow-hidden">
          <div className="p-10 border-b border-slate-100 dark:border-slate-700/50 bg-white/40 dark:bg-slate-900/20">
             <div className="relative group max-w-lg">
                <Search size={20} className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input 
                  placeholder="FILTRAR POR NOMBRE O FORMATO..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-16 pl-16 pr-8 rounded-3xl bg-slate-100/50 dark:bg-slate-900/50 border-2 border-transparent focus:border-indigo-500/30 focus:bg-white dark:focus:bg-slate-900 font-black text-[11px] tracking-[0.1em] outline-none transition-all placeholder:text-slate-400 uppercase"
                />
             </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="py-40 flex flex-col items-center gap-6 opacity-40">
                <div className="w-16 h-16 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
                <span className="font-black text-[11px] tracking-[0.3em] uppercase">Sincronizando modelos...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredTypes.map((t, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={t.id} 
                    className="group relative p-8 rounded-[40px] bg-white/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/30 flex items-center justify-between hover:bg-white dark:hover:bg-slate-800 hover:shadow-2xl hover:shadow-indigo-900/10 transition-all duration-500"
                  >
                    <div className="flex items-center gap-10">
                       <div className="w-20 h-20 rounded-[30px] bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 dark:from-indigo-500/20 dark:to-indigo-600/10 flex items-center justify-center text-indigo-600 shadow-inner group-hover:scale-110 transition-transform duration-500">
                          <Target size={38} strokeWidth={1.2} />
                       </div>
                       <div>
                          <h4 className="font-[1000] text-2xl text-slate-900 dark:text-white tracking-tighter leading-none">{t.name}</h4>
                          <div className="flex items-center gap-3 mt-3">
                             <div className={`px-4 py-1.5 rounded-full flex items-center gap-2.5 ${t.isActive ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
                                <div className={`w-2 h-2 rounded-full ${t.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></div>
                                <span className="text-[10px] font-black uppercase tracking-widest">{t.isActive ? 'OPERATIVO' : 'SIN ACCESO'}</span>
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                       <PermissionGate module="CORE" sub="STORE_TYPES" action="U" user={user}>
                          <button 
                            onClick={() => { setCurrentType(t); setFormData({ name: t.name, isActive: t.isActive }); setShowModal(true); }}
                            className="w-14 h-14 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl shadow-lg flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all transform hover:-rotate-6"
                          >
                            <Edit size={20} />
                          </button>
                       </PermissionGate>
                       <PermissionGate module="CORE" sub="STORE_TYPES" action="D" user={user}>
                          <button 
                            onClick={() => handleDelete(t.id)}
                            className="w-14 h-14 bg-slate-50 dark:bg-slate-700 text-red-500 rounded-2xl shadow-lg flex items-center justify-center hover:bg-red-600 hover:text-white transition-all transform hover:rotate-6"
                          >
                            <Trash2 size={20} />
                          </button>
                       </PermissionGate>
                    </div>
                  </motion.div>
                ))}
                
                {filteredTypes.length === 0 && (
                  <div className="py-40 flex flex-col items-center text-slate-300 dark:text-slate-700">
                    <Target size={80} strokeWidth={0.5} className="mb-6 opacity-10" />
                    <p className="font-black text-[11px] uppercase tracking-[0.5em] opacity-40 italic">SIN COINCIDENCIAS</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Elite Design */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-3xl">
             <motion.div 
               initial={{ opacity: 0, scale: 0.8, y: 50 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.8, y: 50 }}
               className="relative bg-white dark:bg-slate-900 w-full max-w-xl rounded-[64px] shadow-[0_64px_128px_-32px_rgba(0,0,0,0.6)] border border-white/20 overflow-hidden"
             >
                <div className="p-12 pb-6 flex items-center justify-between">
                   <div>
                      <span className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.3em] font-mono">DICCIONARIO DE FORMATOS</span>
                      <h2 className="text-4xl font-[1000] text-slate-900 dark:text-white tracking-tighter mt-2">
                        {currentType ? 'Actualizar' : 'Registrar'} Tipo
                      </h2>
                   </div>
                   <button onClick={() => setShowModal(false)} className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:bg-red-500 hover:text-white transition-all transform hover:rotate-90">
                     <X size={28} />
                   </button>
                </div>

                <form onSubmit={handleSave} className="p-12 pt-6 space-y-12">
                   <div className="space-y-4 px-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-4 font-mono">Etiqueta del Formato</label>
                      <input 
                        required 
                        autoFocus
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="EJ: FLAGSHIP, EXPRESS, TAKE-OUT..."
                        className="w-full h-24 px-10 rounded-[40px] bg-slate-50 dark:bg-slate-800 border-4 border-transparent focus:border-indigo-500/40 outline-none font-[1000] text-2xl tracking-tighter transition-all uppercase placeholder:text-slate-200 dark:placeholder:text-slate-700 shadow-inner"
                      />
                   </div>

                   <div 
                      onClick={() => setFormData({...formData, isActive: !formData.isActive})}
                      className="flex items-center justify-between bg-slate-100/50 dark:bg-slate-800/30 p-10 rounded-[48px] border-2 border-slate-100 dark:border-slate-800 cursor-pointer group hover:border-indigo-500/20 transition-all"
                   >
                      <div className="space-y-1">
                         <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Estado Operacional</p>
                         <p className={`font-[1000] text-2xl tracking-tighter ${formData.isActive ? 'text-indigo-600' : 'text-slate-400'}`}>
                           {formData.isActive ? 'LISTO PARA USO' : 'DESHABILITADO'}
                         </p>
                      </div>
                      <div className={`w-20 h-12 rounded-full relative transition-all duration-500 ${formData.isActive ? 'bg-indigo-600 shadow-xl shadow-indigo-600/40' : 'bg-slate-300 dark:bg-slate-700'}`}>
                          <motion.div 
                            animate={{ x: formData.isActive ? 36 : 4 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            className="w-10 h-10 bg-white rounded-full absolute top-1 shadow-2xl"
                          />
                      </div>
                   </div>

                   <div className="p-8 rounded-[36px] bg-indigo-500/5 border-2 border-indigo-500/10 border-dashed flex items-start gap-6">
                      <div className="w-12 h-12 rounded-3xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0">
                         <Info size={22} />
                      </div>
                      <p className="text-[12px] font-bold text-slate-500 dark:text-slate-400 leading-relaxed uppercase tracking-widest opacity-80">
                        Los formatos permiten al motor predictivo diferenciar entre una tienda de gran volumen y un formato express para la asignación de personal.
                      </p>
                   </div>

                   <div className="flex gap-4">
                      <motion.button 
                        whileHover={{ scale: 1.02, y: -4 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit" 
                        disabled={isSubmitting}
                        className="flex-1 h-24 bg-indigo-600 text-white rounded-[40px] font-[1000] text-xl tracking-wide hover:bg-indigo-500 transition-all shadow-3xl shadow-indigo-600/40 flex items-center justify-center gap-6"
                      >
                        {isSubmitting ? 'PROCESANDO...' : (
                          <>
                            CONFIRMAR CAMBIOS
                            <ArrowRight size={24} strokeWidth={3} />
                          </>
                        )}
                      </motion.button>
                   </div>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Premium Toast Container */}
      <AnimatePresence>
        {toast.show && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-16 left-1/2 -translate-x-1/2 z-[20000]"
          >
             <div className={`px-12 py-6 rounded-[32px] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.5)] flex items-center gap-6 font-black text-sm tracking-widest border-b-8 ${toast.type === 'success' ? 'bg-indigo-950 text-white border-indigo-500' : 'bg-red-950 text-white border-red-500'}`}>
                {toast.type === 'success' ? <CheckCircle size={28} className="text-indigo-400" /> : <AlertCircle size={28} className="text-red-400" />}
                <span className="uppercase">{toast.message}</span>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StoreTypes;
