import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Edit, X, Layout, CheckCircle, AlertCircle, 
  Search, Info, Settings2, Users, BarChart3, ChevronRight, 
  ChevronLeft, Target, Layers, DollarSign, Hash, Clock, Ticket,
  Store, Hash as HashIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import PermissionGate from '../../components/Shared/PermissionGate';
import SearchableSelect from '../../components/Shared/SearchableSelect';

const PredictiveRules = ({ user }) => {
  const { isDarkMode } = useTheme();
  const activeColors = {
    bg: isDarkMode ? '#0f172a' : '#f8fafc',
    card: isDarkMode ? '#1e293b' : '#ffffff',
    border: isDarkMode ? '#334155' : '#f1f5f9',
    textMain: isDarkMode ? '#f1f5f9' : '#1e293b',
    textMuted: isDarkMode ? '#94a3b8' : '#64748b',
    accent: '#4f46e5',
    accentSoft: isDarkMode ? 'rgba(79, 70, 229, 0.15)' : '#eef2ff'
  };

  const [rules, setRules] = useState([]);
  const [storeTypes, setStoreTypes] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [currentRule, setCurrentRule] = useState(null);
  
  const [formData, setFormData] = useState({ 
    name: '', 
    description: '',
    storeTypeId: '',
    metricType: 0, // NetSales
    ratio: 1000000,
    minStaffOpening: 1,
    minStaffClosing: 1,
    isActive: true,
    profileIds: []
  });

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rulesRes, typesRes, profilesRes] = await Promise.all([
        api.get('/predictiverules'),
        api.get('/storetypes'),
        api.get('/profiles')
      ]);
      setRules(rulesRes.data);
      setStoreTypes(typesRes.data);
      setProfiles(profilesRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleSave = async () => {
    try {
      setIsSubmitting(true);
      if (currentRule) {
        await api.put(`/predictiverules/${currentRule.id}`, formData);
        showToast("Regla actualizada con éxito");
      } else {
        await api.post('/predictiverules', formData);
        showToast("Nueva regla predictiva activada");
      }
      setShowWizard(false);
      fetchData();
    } catch (err) {
      showToast("Error al guardar la configuración", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Desea eliminar esta configuración de motor?")) return;
    try {
      await api.delete(`/predictiverules/${id}`);
      showToast("Regla eliminada");
      fetchData();
    } catch (err) {
      showToast("Error al eliminar", "error");
    }
  };

  const toggleProfile = (id) => {
    const current = [...formData.profileIds];
    const index = current.indexOf(id);
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(id);
    }
    setFormData({ ...formData, profileIds: current });
  };

  const metricTypes = [
    { value: 0, label: 'Venta Neta', icon: DollarSign },
    { value: 1, label: 'Tickets', icon: Ticket },
    { value: 2, label: 'Comensales', icon: Users },
    { value: 3, label: 'Ticket Promedio', icon: BarChart3 }
  ];

  const renderWizardStep = () => {
    switch (wizardStep) {
      case 1:
        return (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom duration-500 pb-10">
            <div className="space-y-6">
               <div className="flex items-center gap-4 px-4 font-black text-slate-400 text-[11px] uppercase tracking-widest">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">01</div>
                  Identificación de la Regla
               </div>
               <div className="relative group">
                  <Layout size={24} className="absolute left-10 top-1/2 -translate-y-1/2 text-indigo-400 group-focus-within:text-indigo-600 transition-colors" />
                  <input 
                    required 
                    autoFocus
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="EJ: MOTOR PREDICTIVO RESTAURANTES..."
                    className="w-full h-28 px-20 rounded-[40px] bg-slate-50 dark:bg-slate-800 border-4 border-transparent focus:border-indigo-500/40 outline-none font-[1000] text-3xl tracking-tighter transition-all uppercase placeholder:text-slate-200 dark:placeholder:text-slate-700 shadow-inner"
                  />
               </div>
            </div>

            <div className="space-y-6">
               <div className="flex items-center gap-4 px-4 font-black text-slate-400 text-[11px] uppercase tracking-widest">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">02</div>
                  Descripción Estratégica
               </div>
               <textarea 
                  required 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Detalle la finalidad de esta configuración..."
                  className="w-full h-40 p-12 rounded-[40px] bg-slate-50 dark:bg-slate-800 border-4 border-transparent focus:border-indigo-500/40 outline-none font-bold text-lg leading-relaxed transition-all placeholder:text-slate-300 dark:placeholder:text-slate-700 shadow-inner resize-none"
               />
            </div>

            <div className="space-y-6 text-slate-900 dark:text-white">
               <div className="flex items-center gap-4 px-4 font-black text-slate-400 text-[11px] uppercase tracking-widest">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">03</div>
                  Tipo de Sede Vinculada
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {storeTypes.map(st => (
                     <div 
                        key={st.id} 
                        onClick={() => setFormData({...formData, storeTypeId: st.id})}
                        className={`p-10 rounded-[40px] border-4 cursor-pointer transition-all flex flex-col items-center gap-6 group hover:translate-y--2 ${formData.storeTypeId === st.id ? 'bg-indigo-600 border-indigo-500 text-white shadow-2xl shadow-indigo-600/40' : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-400 hover:border-indigo-500/20'}`}
                     >
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${formData.storeTypeId === st.id ? 'bg-white/20' : 'bg-white'}`}>
                           <Store size={28} className={formData.storeTypeId === st.id ? 'text-white' : 'text-indigo-600'} />
                        </div>
                        <span className="font-[1000] text-xl tracking-tighter text-center uppercase">{st.name}</span>
                     </div>
                  ))}
               </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom duration-500 pb-10">
             <div className="space-y-10">
                <div className="flex items-center justify-between px-4">
                   <div className="flex items-center gap-4 font-black text-slate-400 text-[11px] uppercase tracking-widest">
                      <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">04</div>
                      Perfiles Impactados
                   </div>
                   <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 px-4 py-2 rounded-full uppercase tracking-widest">
                      {formData.profileIds.length} Perfiles Seleccionados
                   </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {profiles.map(p => {
                      const isSelected = formData.profileIds.includes(p.id);
                      return (
                        <div 
                           key={p.id} 
                           onClick={() => {
                              const newIds = isSelected ? formData.profileIds.filter(id => id !== p.id) : [...formData.profileIds, p.id];
                              setFormData({...formData, profileIds: newIds});
                           }}
                           className={`p-10 rounded-[48px] border-4 cursor-pointer transition-all flex items-center justify-between group ${isSelected ? 'bg-indigo-600 border-indigo-500 text-white shadow-xl shadow-indigo-600/30' : 'bg-slate-50 dark:bg-slate-800 border-transparent hover:border-indigo-500/20'}`}
                        >
                           <div className="flex items-center gap-8 text-slate-900 dark:text-white">
                              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-[1000] text-lg ${isSelected ? 'bg-white/20' : 'bg-white text-indigo-600 shadow-sm'}`}>
                                 {p.name.charAt(0)}
                              </div>
                              <div>
                                 <h5 className="font-[1000] text-xl tracking-tighter leading-none">{p.name}</h5>
                                 <p className={`text-[10px] font-bold mt-2 uppercase tracking-widest ${isSelected ? 'text-white/60' : 'text-slate-400'}`}>Perfil Operativo</p>
                              </div>
                           </div>
                           <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isSelected ? 'bg-white text-indigo-600' : 'bg-slate-200 text-slate-300 group-hover:bg-indigo-500 group-hover:text-white'}`}>
                              {isSelected ? <CheckCircle size={24} strokeWidth={3} /> : <Plus size={20} strokeWidth={3} />}
                           </div>
                        </div>
                      );
                   })}
                </div>
             </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-16 animate-in fade-in slide-in-from-bottom duration-500 pb-10">
             <div className="bg-indigo-600 p-12 rounded-[56px] text-white shadow-2xl shadow-indigo-600/30 flex flex-col md:flex-row items-center gap-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-bl-full -mr-20 -mt-20"></div>
                <div className="w-32 h-32 rounded-[40px] bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30 z-10">
                   <Target size={64} strokeWidth={1} />
                </div>
                <div className="z-10 flex-1 space-y-6">
                   <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.4em] mb-3 opacity-60">Metodología de Predicción</p>
                      <h4 className="text-4xl font-[1000] tracking-tighter leading-tight">Configuración del Ratio Maestro</h4>
                   </div>
                   <div className="flex items-center gap-4">
                      {metricTypes.slice(0, 2).map(m => (
                        <button 
                           key={m.value}
                           onClick={() => setFormData({...formData, metricType: m.value})}
                           className={`px-8 py-5 rounded-3xl flex items-center gap-4 transition-all font-black text-xs tracking-widest border-2 ${formData.metricType === m.value ? 'bg-white text-indigo-600 border-white' : 'bg-white/10 text-white border-white/20 hover:bg-white/20'}`}
                        >
                           {m.icon === DollarSign ? <DollarSign size={18} strokeWidth={3} /> : <Ticket size={18} strokeWidth={3} />} {m.label.toUpperCase()}
                        </button>
                      ))}
                   </div>
                </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-6">
                   <div className="flex items-center gap-4 px-4 font-black text-slate-400 text-[11px] uppercase tracking-widest">
                      <p>Valor por cada Colaborador</p>
                   </div>
                   <div className="relative group text-slate-900 dark:text-white">
                      <div className="absolute left-10 top-1/2 -translate-y-1/2 text-5xl font-[1000] text-indigo-500 opacity-20">{formData.metricType === 0 ? '$' : '#'}</div>
                      <input 
                        type="number"
                        value={formData.ratio}
                        onChange={(e) => setFormData({...formData, ratio: parseInt(e.target.value) || 0})}
                        className="w-full h-32 px-12 text-right rounded-[48px] bg-slate-50 dark:bg-slate-800 border-4 border-transparent focus:border-indigo-500/40 outline-none font-[1000] text-5xl tracking-tighter transition-all shadow-inner tabular-nums"
                      />
                      <p className="absolute left-10 bottom-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ratio de Carga</p>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-4">
                      <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mínimo Apertura</p>
                      <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800 p-3 rounded-[32px] shadow-inner">
                         <button onClick={() => setFormData({...formData, minStaffOpening: Math.max(0, formData.minStaffOpening-1)})} className="w-16 h-16 bg-white dark:bg-slate-700 rounded-2xl flex items-center justify-center text-indigo-600 shadow-md transform hover:scale-110 active:scale-95 transition-all outline-none">
                            <ChevronLeft size={24} strokeWidth={3} />
                         </button>
                         <span className="flex-1 text-center text-4xl font-[1000] text-slate-900 dark:text-white tabular-nums tracking-tighter">{formData.minStaffOpening}</span>
                         <button onClick={() => setFormData({...formData, minStaffOpening: formData.minStaffOpening+1})} className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl transform hover:scale-110 active:scale-95 transition-all outline-none">
                            <Plus size={24} strokeWidth={3} />
                         </button>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mínimo Cierre</p>
                      <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800 p-3 rounded-[32px] shadow-inner">
                         <button onClick={() => setFormData({...formData, minStaffClosing: Math.max(0, formData.minStaffClosing-1)})} className="w-16 h-16 bg-white dark:bg-slate-700 rounded-2xl flex items-center justify-center text-indigo-600 shadow-md transform hover:scale-110 active:scale-95 transition-all outline-none">
                            <ChevronLeft size={24} strokeWidth={3} />
                         </button>
                         <span className="flex-1 text-center text-4xl font-[1000] text-slate-900 dark:text-white tabular-nums tracking-tighter">{formData.minStaffClosing}</span>
                         <button onClick={() => setFormData({...formData, minStaffClosing: formData.minStaffClosing+1})} className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl transform hover:scale-110 active:scale-95 transition-all outline-none">
                            <Plus size={24} strokeWidth={3} />
                         </button>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="page-container animate-in fade-in duration-700" style={{ padding: '3.5rem 2rem', background: isDarkMode ? '#0f172a' : '#f8faff', minHeight: '100vh' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header Elite Section - Elevated */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 mb-16 px-4">
          <div className="space-y-5">
            <div className="flex items-center gap-6">
               <div className="w-16 h-16 rounded-[24px] bg-indigo-600 flex items-center justify-center text-white shadow-[0_25px_50px_-12px_rgba(79,70,229,0.5)] transform -rotate-3">
                  <Settings2 size={32} strokeWidth={2.5} />
               </div>
               <div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-[1000] text-indigo-500 uppercase tracking-[0.4em] bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1 rounded-lg">Predicción v13.0</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                    <span className="text-[10px] font-[1000] text-slate-400 uppercase tracking-[0.4em]">Optimización de Carga</span>
                  </div>
                  <h1 className="text-5xl font-[1000] text-slate-900 dark:text-white tracking-tighter leading-tight mt-1">
                    Diseñador de Reglas
                  </h1>
               </div>
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-bold max-w-xl text-base leading-relaxed opacity-80">
              Configure la inteligencia del motor de carga operacional por tipo de sede para una asignación de personal óptima.
            </p>
          </div>

          <PermissionGate module="ADVANCED" sub="PREDICTIVE_RULES" action="C" user={user}>
            <motion.button 
              whileHover={{ scale: 1.05, y: -4, boxShadow: '0 30px 60px -12px rgba(79,70,229,0.5)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { 
                  setCurrentRule(null); 
                  setFormData({ 
                     name: '', description: '', storeTypeId: '', metricType: 0, ratio: 1000000, 
                     minStaffOpening: 1, minStaffClosing: 1, isActive: true, profileIds: [] 
                  }); 
                  setWizardStep(1);
                  setShowWizard(true); 
              }}
              className="h-20 px-12 rounded-[32px] bg-indigo-600 text-white font-[1000] text-sm flex items-center gap-5 shadow-[0_20px_40px_-10px_rgba(79,70,229,0.5)] group outline-none"
            >
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center group-hover:rotate-90 transition-transform duration-500">
                <Plus size={22} strokeWidth={3} />
              </div>
              <span className="tracking-[0.2em] pt-0.5 uppercase">NUEVA REGLA</span>
            </motion.button>
          </PermissionGate>
        </header>

        {loading ? (
          <div className="py-60 text-center flex flex-col items-center gap-8 animate-pulse">
             <div className="w-20 h-20 border-4 border-indigo-600 border-t-transparent rounded-[32px] animate-spin"></div>
             <p className="font-black text-sm tracking-[0.4em] text-indigo-500/60 uppercase">Analizando Motor Maestro...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 px-4">
             {rules.map((rule, idx) => (
               <motion.div 
                 initial={{ opacity: 0, y: 30, scale: 0.9 }}
                 animate={{ opacity: 1, y: 0, scale: 1 }}
                 transition={{ delay: idx * 0.1, type: "spring", stiffness: 100 }}
                 key={rule.id} 
                 className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl p-10 rounded-[56px] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] border border-white dark:border-slate-700 relative group overflow-hidden hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-2 transition-all duration-500"
               >
                  <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-600/5 rounded-bl-[120px] -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700"></div>
                  
                  <div className="flex items-center justify-between mb-10 z-10 relative">
                     <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-500/10 rounded-[28px] flex items-center justify-center text-indigo-600 shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                        <Target size={30} />
                     </div>
                     <div className="flex items-center gap-3">
                        <button onClick={() => {
                           setCurrentRule(rule);
                           setFormData({
                              name: rule.name,
                              description: rule.description,
                              storeTypeId: rule.storeTypeId,
                              metricType: rule.metricType,
                              ratio: rule.ratio,
                              minStaffOpening: rule.minStaffOpening,
                              minStaffClosing: rule.minStaffClosing,
                              isActive: rule.isActive,
                              profileIds: rule.profiles.map(p => p.profileId)
                           });
                           setWizardStep(1);
                           setShowWizard(true);
                        }} className="w-12 h-12 bg-white dark:bg-slate-700 rounded-xl text-slate-400 hover:text-indigo-600 hover:shadow-lg transition-all flex items-center justify-center shadow-sm">
                           <Edit size={18} />
                        </button>
                        <button onClick={() => handleDelete(rule.id)} className="w-12 h-12 bg-white dark:bg-slate-700 rounded-xl text-red-400 hover:bg-red-500 hover:text-white hover:shadow-lg transition-all flex items-center justify-center shadow-sm">
                           <Trash2 size={18} />
                        </button>
                     </div>
                  </div>

                  <div className="mb-10 z-10 relative">
                     <div className="flex items-center gap-2 mb-3">
                        <span className="w-6 h-0.5 bg-indigo-500 rounded-full"></span>
                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{rule.storeTypeName || 'FORMATO BASE'}</span>
                     </div>
                     <h3 className="text-3xl font-[1000] text-slate-900 dark:text-white mb-3 leading-none tracking-tighter truncate">{rule.name}</h3>
                     <p className="text-sm font-bold text-slate-400 line-clamp-2 leading-relaxed h-10 opacity-70">{rule.description || 'Sin descripción detallada.'}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-6 pt-10 border-t border-slate-100 dark:border-slate-700/50 z-10 relative">
                     <div className="space-y-3">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Alcance Operativo</p>
                        <div className="flex -space-x-3">
                           {rule.profiles.slice(0, 3).map((p, i) => (
                             <div key={i} title={p.name} className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-700 border-4 border-white dark:border-slate-800 flex items-center justify-center text-[10px] font-[1000] text-slate-600 dark:text-slate-300 shadow-sm uppercase">
                                {p.name.charAt(0)}
                             </div>
                           ))}
                           {rule.profiles.length > 3 && (
                              <div className="w-10 h-10 rounded-full bg-indigo-600 border-4 border-white dark:border-slate-800 flex items-center justify-center text-[10px] font-black text-white shadow-lg">
                                +{rule.profiles.length - 3}
                              </div>
                           )}
                        </div>
                     </div>
                     <div className="text-right flex flex-col justify-end">
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Ratio de Carga</p>
                         <div className="flex items-baseline justify-end gap-1">
                            <span className="text-xs font-black text-indigo-400">{rule.metricType === 0 ? '$' : '#'}</span>
                            <span className="text-2xl font-[1000] text-indigo-600 tracking-tighter tabular-nums">
                               {new Intl.NumberFormat('es-CO').format(rule.ratio)}
                            </span>
                         </div>
                     </div>
                  </div>
               </motion.div>
             ))}

             {rules.length === 0 && (
                <div className="col-span-full py-60 bg-white/40 dark:bg-slate-800/40 backdrop-blur-3xl rounded-[64px] border-4 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-slate-300">
                   <div className="relative mb-8">
                      <Settings2 size={120} strokeWidth={0.2} className="opacity-10" />
                      <Plus size={40} className="absolute inset-0 m-auto text-indigo-500 opacity-20" />
                   </div>
                   <p className="font-black text-sm uppercase tracking-[0.5em] text-center max-w-sm leading-relaxed opacity-40">No hay reglas activas. Inicie el asistente v13.0 para definir su arquitectura.</p>
                </div>
             )}
          </div>
        )}
      </div>

      {/* Wizard Modal - HOMOLOGATED WITH NEWS REQUEST */}
      <AnimatePresence>
        {showWizard && (
          <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-3xl z-[10000] flex items-center justify-center p-8">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 100 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 100 }}
              className="flex flex-row bg-white dark:bg-slate-900 w-full max-w-7xl rounded-[64px] overflow-hidden shadow-[0_80px_160px_-40px_rgba(0,0,0,0.7)] border border-white/20 min-h-[750px] max-h-[92vh]"
            >
                {/* Sidebar Flow (Elite Indigo Gradient) */}
                <div style={{ width: '380px', background: 'linear-gradient(180deg, #4f46e5 0%, #312e81 100%)', padding: '60px 40px', display: 'flex', flexDirection: 'column', color: 'white' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '80px' }}>
                        <div style={{ padding: '16px', background: 'rgba(255,255,255,0.15)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 15px 30px rgba(0,0,0,0.1)' }}>
                          <Settings2 size={32} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: '1000', margin: 0, letterSpacing: '-0.04em', lineHeight: '1.1' }}>Wizard Predictivo</h2>
                            <p style={{ fontSize: '10px', fontWeight: '900', opacity: 0.6, textTransform: 'uppercase', margin: '4px 0 0', letterSpacing: '0.2em' }}>Algoritmo Maestro V13</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '45px', flex: 1 }}>
                        {[1, 2, 3].map(s => (
                            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '25px', position: 'relative' }}>
                                <div style={{ width: '52px', height: '52px', borderRadius: '20px', background: wizardStep === s ? 'white' : wizardStep > s ? '#10b981' : 'rgba(255,255,255,0.1)', color: wizardStep === s ? '#4f46e5' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '1000', fontSize: '18px', transition: 'all 0.5s', boxShadow: wizardStep === s ? '0 15px 30px rgba(255,255,255,0.2)' : 'none' }}>
                                    {wizardStep > s ? <CheckCircle size={24} strokeWidth={3} /> : s}
                                </div>
                                <div>
                                    <p style={{ fontSize: '9px', fontWeight: '1000', opacity: 0.4, textTransform: 'uppercase', margin: 0, letterSpacing: '0.1em' }}>Etapa 0{s}</p>
                                    <p style={{ fontSize: '14px', fontWeight: '1000', textTransform: 'uppercase', margin: '4px 0 0', letterSpacing: '0.05em', color: wizardStep === s ? 'white' : 'rgba(255,255,255,0.3)' }}>
                                        {s === 1 ? 'Propósito y Sede' : s === 2 ? 'Cargos Impactados' : 'Cálculo de Carga'}
                                    </p>
                                </div>
                                {s < 3 && <div style={{ position: 'absolute', left: '25px', top: '52px', width: '2px', height: '45px', background: 'rgba(255,255,255,0.1)' }}></div>}
                            </div>
                        ))}
                    </div>

                    <div style={{ padding: '30px', background: 'rgba(255,255,255,0.08)', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.15)' }}>
                        <div className="flex items-center gap-3 mb-3 text-indigo-300">
                           <Info size={16} />
                           <span className="text-[10px] font-black uppercase tracking-widest">Tip Operativo</span>
                        </div>
                        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)', fontWeight: '700', lineHeight: '1.6', margin: 0 }}>
                          "Valide los mínimos de apertura para asegurar que siempre haya el personal base necesario para iniciar operación."
                        </p>
                    </div>
                </div>

                {/* Content Area */}
                <div style={{ flex: 1, padding: '80px', overflowY: 'auto', background: activeColors.bg, position: 'relative' }} className="custom-scrollbar">
                    <header className="mb-14 flex justify-between items-start">
                       <div>
                          <h3 style={{ fontSize: '3rem', fontWeight: '1000', color: activeColors.textMain, margin: 0, tracking: '-0.05em', lineHeight: '1' }}>
                             {wizardStep === 1 ? 'Estrategia' : wizardStep === 2 ? 'Impacto' : 'Parámetros'}
                          </h3>
                          <p style={{ color: activeColors.textMuted, fontSize: '1rem', fontWeight: '800', marginTop: '15px' }}>
                             {wizardStep === 1 ? 'Nombre su regla y seleccione a qué formato de tienda se aplicará.' : 
                              wizardStep === 2 ? 'Seleccione todos los perfiles que el algoritmo debe calcular.' : 
                              'Configure el ratio de venta o tickets necesario por cada colaborador.'}
                          </p>
                       </div>
                       <button onClick={() => setShowWizard(false)} style={{ background: activeColors.card, border: `1px solid ${activeColors.border}`, width: '64px', height: '64px', borderRadius: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: activeColors.textMuted, transition: 'all 0.3s' }} className="hover:rotate-90 hover:text-red-500 hover:shadow-xl shadow-sm outline-none">
                          <X size={32} strokeWidth={2.5} />
                       </button>
                    </header>

                    <div className="min-h-[450px]">
                      <AnimatePresence mode="wait">
                         <motion.div 
                            key={wizardStep}
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            transition={{ type: "spring", damping: 30, stiffness: 200 }}
                         >
                            {renderWizardStep()}
                         </motion.div>
                      </AnimatePresence>
                    </div>

                    {/* Navigation Footer */}
                    <div className="mt-20 pt-10 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                       <button 
                          onClick={() => setWizardStep(wizardStep - 1)}
                          disabled={wizardStep === 1}
                          style={{ padding: '24px 40px', borderRadius: '28px', background: activeColors.card, border: `2px solid ${activeColors.border}`, color: activeColors.textMuted, fontWeight: '1000', fontSize: '14px', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.3s' }}
                          className="hover:bg-slate-50 disabled:opacity-0 flex items-center gap-6 shadow-sm outline-none"
                       >
                          <ChevronLeft size={24} strokeWidth={3} /> Atrás
                       </button>
                       
                       <div className="flex items-center gap-6">
                          {wizardStep < 3 ? (
                             <button 
                                onClick={() => setWizardStep(wizardStep + 1)}
                                style={{ padding: '24px 60px', borderRadius: '28px', background: activeColors.accent, color: 'white', border: 'none', fontWeight: '1000', fontSize: '14px', textTransform: 'uppercase', cursor: 'pointer', boxShadow: '0 25px 50px rgba(79, 70, 229, 0.3)', transition: 'all 0.3s' }}
                                className="hover:scale-[1.05] flex items-center gap-6 outline-none"
                             >
                                Continuar <ChevronRight size={24} strokeWidth={3} />
                             </button>
                          ) : (
                             <button 
                                onClick={handleSave}
                                disabled={isSubmitting || formData.profileIds.length === 0}
                                style={{ padding: '24px 80px', borderRadius: '28px', background: '#10b981', color: 'white', border: 'none', fontWeight: '1000', fontSize: '15px', textTransform: 'uppercase', cursor: 'pointer', boxShadow: '0 25px 50px rgba(16, 185, 129, 0.3)', transition: 'all 0.3s' }}
                                className="hover:scale-[1.05] flex items-center gap-6 outline-none disabled:opacity-50"
                             >
                                {isSubmitting ? 'PROCESANDO...' : <><Plus size={24} strokeWidth={3} /> ACTIVAR MOTOR</>}
                             </button>
                          )}
                       </div>
                    </div>
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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

export default PredictiveRules;
