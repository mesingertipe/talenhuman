import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Edit, X, Layout, CheckCircle, AlertCircle, 
  Search, Info, Settings2, Users, BarChart3, ChevronRight, 
  ChevronLeft, Target, Layers, DollarSign, Hash, Clock, Ticket,
  Store, Hash as HashIcon, Activity, TrendingUp, Sparkles,
  ArrowRight, ShieldCheck, Cpu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import PermissionGate from '../../components/Shared/PermissionGate';
import SearchableSelect from '../../components/Shared/SearchableSelect';
import { useTableData } from '../../hooks/useTableData';
import Pagination from '../../components/Shared/Pagination';

const PredictiveRules = ({ user }) => {
  const { isDarkMode } = useTheme();
  
  // Elite Design Tokens
  const activeColors = {
    bg: isDarkMode ? '#060914' : '#f8fafc',
    card: isDarkMode ? '#0f172a' : '#ffffff',
    border: isDarkMode ? '#1e293b' : '#f1f5f9',
    textMain: isDarkMode ? '#f1f5f9' : '#1e293b',
    textMuted: isDarkMode ? '#94a3b8' : '#64748b',
    accent: '#4f46e5',
    accentSoft: isDarkMode ? 'rgba(79, 70, 229, 0.15)' : '#eef2ff',
    emerald: '#10b981',
    rose: '#f43f5e'
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

  const { 
    data: filteredRules, 
    searchTerm, 
    setSearchTerm, 
    currentPage, 
    setCurrentPage, 
    totalPages, 
    totalItems, 
    itemsPerPage, 
    setItemsPerPage 
  } = useTableData(rules, []);

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
      showToast("Error de conexión con el motor", "error");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.storeTypeId || formData.profileIds.length === 0) {
        showToast("Complete los campos obligatorios y perfiles", "error");
        return;
    }

    try {
      setIsSubmitting(true);
      if (currentRule) {
        await api.put(`/predictiverules/${currentRule.id}`, formData);
        showToast("Arquitectura de regla actualizada");
      } else {
        await api.post('/predictiverules', formData);
        showToast("Motor predictivo activado para el formato");
      }
      setShowWizard(false);
      fetchData();
    } catch (err) {
      showToast("Falla en la persistencia del motor", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (rule) => {
    if (!window.confirm(`¿Desea desmantelar la regla "${rule.name}"? Los cálculos predictivos se detendrán.`)) return;
    try {
      await api.delete(`/predictiverules/${rule.id}`);
      showToast("Regla deshabilitada y eliminada");
      fetchData();
    } catch (err) {
      showToast("Error al eliminar la regla", "error");
    }
  };

  const metricTypes = [
    { value: 0, label: 'Venta Neta', icon: DollarSign, suffix: '$' },
    { value: 1, label: 'Tickets', icon: Ticket, suffix: '#' },
    { value: 2, label: 'Comensales', icon: Users, suffix: 'Px' },
    { value: 3, label: 'Ticket Promedio', icon: BarChart3, suffix: '$' }
  ];

  const renderWizardStep = () => {
    switch (wizardStep) {
      case 1:
        return (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-10 duration-700 pb-10">
            <div className="space-y-10">
               <div className="relative group">
                  <label className="absolute -top-4 left-10 bg-white dark:bg-slate-900 px-4 py-1 text-[10px] font-black text-indigo-600 uppercase tracking-widest z-10 rounded-full border border-indigo-100">Nombre de la Regla Maestra *</label>
                  <div className="relative flex items-center">
                     <Target size={32} className="absolute left-10 text-indigo-400 opacity-40" />
                     <input 
                        autoFocus
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value.toUpperCase()})}
                        placeholder="EJ: MOTOR PREDICTIVO RESTAURANTES..."
                        className="w-full h-32 px-24 rounded-[48px] bg-white dark:bg-slate-800 border-4 border-slate-100 dark:border-slate-800 focus:border-indigo-600/40 outline-none font-[1000] text-3xl tracking-tighter transition-all placeholder:text-slate-200 shadow-inner"
                     />
                  </div>
               </div>

               <div className="relative group">
                  <label className="absolute -top-4 left-10 bg-white dark:bg-slate-900 px-4 py-1 text-[10px] font-black text-indigo-600 uppercase tracking-widest z-10 rounded-full border border-indigo-100">Descripción Estratégica</label>
                  <textarea 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Detalle la finalidad de esta configuración..."
                    className="w-full h-32 p-10 rounded-[32px] bg-white dark:bg-slate-800 border-4 border-slate-100 dark:border-slate-800 focus:border-indigo-600/40 outline-none font-bold text-lg leading-relaxed transition-all placeholder:text-slate-200 shadow-inner resize-none"
                  />
               </div>

               <div className="space-y-6">
                   <p className="px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo de Sede Vinculada *</p>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {storeTypes.map(st => (
                         <div 
                            key={st.id} 
                            onClick={() => setFormData({...formData, storeTypeId: st.id})}
                            className={`p-8 rounded-[40px] border-4 cursor-pointer transition-all flex flex-col items-center gap-6 group hover:translate-y--2 ${formData.storeTypeId === st.id ? 'bg-indigo-600 border-indigo-500 text-white shadow-2xl shadow-indigo-600/40 border-b-8' : 'bg-white dark:bg-slate-800 border-slate-50 dark:border-slate-800 text-slate-400 hover:border-indigo-500/20'}`}
                         >
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${formData.storeTypeId === st.id ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-700 shadow-inner'}`}>
                               <Store size={28} className={formData.storeTypeId === st.id ? 'text-white' : 'text-indigo-600'} />
                            </div>
                            <span className="font-[1000] text-sm tracking-tighter text-center uppercase">{st.name}</span>
                         </div>
                      ))}
                   </div>
               </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-10 duration-700 pb-10">
             <div className="space-y-10">
                <div className="flex items-center justify-between px-6">
                   <div className="flex flex-col">
                      <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] mb-2">Escalabilidad</span>
                      <h4 className="text-4xl font-[1000] text-slate-900 dark:text-white tracking-tighter uppercase">Perfiles Impactados</h4>
                   </div>
                   <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 px-6 py-3 rounded-2xl uppercase tracking-[0.2em] border border-indigo-100">
                      {formData.profileIds.length} Cargos Seleccionados
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
                           className={`p-10 rounded-[48px] border-4 cursor-pointer transition-all flex items-center justify-between group ${isSelected ? 'bg-indigo-600 border-indigo-500 text-white shadow-xl shadow-indigo-600/30 border-b-8' : 'bg-white dark:bg-slate-800 border-slate-50 dark:border-slate-800 hover:border-indigo-500/20 shadow-sm'}`}
                        >
                           <div className="flex items-center gap-8">
                              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-[1000] text-xl transition-all ${isSelected ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-700 text-indigo-600 shadow-inner'}`}>
                                 {p.name.charAt(0)}
                              </div>
                              <div>
                                 <h5 className={`font-[1000] text-xl tracking-tighter leading-none ${isSelected ? 'text-white' : 'text-slate-800 dark:text-white'}`}>{p.name}</h5>
                                 <p className={`text-[10px] font-black mt-2 uppercase tracking-widest ${isSelected ? 'text-white/60' : 'text-slate-400'}`}>Perfil Operativo</p>
                              </div>
                           </div>
                           <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isSelected ? 'bg-white text-indigo-600 shadow-2xl scale-110' : 'bg-slate-100 text-slate-300 group-hover:bg-indigo-500 group-hover:text-white group-hover:scale-110'}`}>
                              {isSelected ? <CheckCircle size={28} strokeWidth={3} /> : <Plus size={24} strokeWidth={3} />}
                           </div>
                        </div>
                      );
                   })}
                </div>
             </div>
          </div>
        );
      case 3:
        const currentMetric = metricTypes.find(m => m.value === formData.metricType);
        return (
          <div className="space-y-16 animate-in fade-in slide-in-from-bottom-10 duration-700 pb-10">
             <div className="bg-gradient-to-br from-indigo-700 to-indigo-900 p-16 rounded-[64px] text-white shadow-2xl shadow-indigo-600/30 flex flex-col md:flex-row items-center gap-16 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-bl-full -mr-32 -mt-32 backdrop-blur-3xl"></div>
                
                <div className="w-40 h-40 rounded-[48px] bg-white/15 backdrop-blur-md flex items-center justify-center shrink-0 border-2 border-white/20 z-10 shadow-2xl">
                   <TrendingUp size={80} strokeWidth={1} />
                </div>
                
                <div className="z-10 flex-1 space-y-10">
                   <div>
                      <p className="text-[11px] font-[1000] uppercase tracking-[0.5em] mb-4 opacity-60">Matriz de Eficiencia</p>
                      <h4 className="text-5xl font-[1000] tracking-tighter leading-tight italic">Factor de Carga Maestro</h4>
                   </div>
                   <div className="flex flex-wrap items-center gap-6">
                      {metricTypes.map(m => (
                        <button 
                           key={m.value}
                           onClick={() => setFormData({...formData, metricType: m.value})}
                           className={`px-8 py-5 rounded-[28px] flex items-center gap-4 transition-all font-black text-[10px] tracking-widest border-2 flex-1 min-w-[180px] ${formData.metricType === m.value ? 'bg-white text-indigo-600 border-white shadow-2xl' : 'bg-white/5 text-white border-white/10 hover:bg-white/15 hover:border-white/20'}`}
                        >
                           <m.icon size={20} strokeWidth={3} /> {m.label.toUpperCase()}
                        </button>
                      ))}
                   </div>
                </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                <div className="space-y-8">
                   <div className="flex items-center gap-4 px-6">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Meta de Productividad por Colaborador</p>
                   </div>
                   <div className="relative group text-slate-900 dark:text-white">
                      <div className="absolute left-12 top-1/2 -translate-y-1/2 text-5xl font-[1000] text-indigo-500 opacity-20">{currentMetric?.suffix}</div>
                      <input 
                        type="number"
                        value={formData.ratio}
                        onChange={(e) => setFormData({...formData, ratio: parseInt(e.target.value) || 0})}
                        className="w-full h-40 px-16 text-right rounded-[56px] bg-white dark:bg-slate-800 border-4 border-slate-100 dark:border-slate-800 focus:border-indigo-600/40 outline-none font-[1000] text-6xl tracking-tighter transition-all shadow-inner tabular-nums pr-20"
                      />
                      <p className="absolute left-16 bottom-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Ratio {currentMetric?.label}</p>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                   <div className="space-y-6">
                      <p className="px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mínimo Apertura</p>
                      <div className="flex items-center gap-6 bg-white dark:bg-slate-800 p-6 rounded-[48px] shadow-sm border border-slate-50 dark:border-slate-800">
                         <button onClick={() => setFormData({...formData, minStaffOpening: Math.max(0, formData.minStaffOpening-1)})} className="w-16 h-16 bg-white dark:bg-slate-700 rounded-2xl flex items-center justify-center text-indigo-600 shadow-xl border border-slate-100 dark:border-slate-600 hover:scale-110 active:scale-95 transition-all outline-none">
                            <ChevronLeft size={28} strokeWidth={3} />
                         </button>
                         <span className="flex-1 text-center text-5xl font-[1000] text-slate-900 dark:text-white tabular-nums tracking-tighter">{formData.minStaffOpening}</span>
                         <button onClick={() => setFormData({...formData, minStaffOpening: formData.minStaffOpening+1})} className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-2xl hover:scale-110 active:scale-95 transition-all outline-none">
                            <Plus size={28} strokeWidth={3} />
                         </button>
                      </div>
                   </div>

                   <div className="space-y-6">
                      <p className="px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mínimo Cierre</p>
                      <div className="flex items-center gap-6 bg-white dark:bg-slate-800 p-6 rounded-[48px] shadow-sm border border-slate-50 dark:border-slate-800">
                         <button onClick={() => setFormData({...formData, minStaffClosing: Math.max(0, formData.minStaffClosing-1)})} className="w-16 h-16 bg-white dark:bg-slate-700 rounded-2xl flex items-center justify-center text-indigo-600 shadow-xl border border-slate-100 dark:border-slate-600 hover:scale-110 active:scale-95 transition-all outline-none">
                            <ChevronLeft size={28} strokeWidth={3} />
                         </button>
                         <span className="flex-1 text-center text-5xl font-[1000] text-slate-900 dark:text-white tabular-nums tracking-tighter">{formData.minStaffClosing}</span>
                         <button onClick={() => setFormData({...formData, minStaffClosing: formData.minStaffClosing+1})} className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-2xl hover:scale-110 active:scale-95 transition-all outline-none">
                            <Plus size={28} strokeWidth={3} />
                         </button>
                      </div>
                   </div>
                </div>
             </div>

             <div className="flex items-center gap-8 p-10 bg-indigo-50/50 dark:bg-indigo-500/5 rounded-[48px] border-2 border-indigo-100 dark:border-indigo-500/10">
                <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-[24px] flex items-center justify-center text-indigo-600 shadow-xl shrink-0">
                    <Sparkles size={28} />
                </div>
                <div>
                   <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Simulación de Motor</p>
                   <p className="text-sm font-bold text-slate-600 dark:text-slate-300 italic leading-relaxed">
                      "Para una venta de <span className="text-indigo-600 font-black">{new Intl.NumberFormat('es-CO').format(formData.ratio * 10)}</span> pesos, el motor calculará una asignación ideal de <span className="text-indigo-600 font-black">10 colaboradores</span> sumados a los perfiles fijos no calculados."
                   </p>
                </div>
             </div>
          </div>
        );
      default: return null;
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
                  <Cpu size={32} strokeWidth={2.5} />
               </div>
               <div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-[1000] text-indigo-500 uppercase tracking-[0.4em] bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1 rounded-lg">Inteligencia Operativa</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                    <span className="text-[10px] font-[1000] text-slate-400 uppercase tracking-[0.4em]">Algorithm v13.0 Platinum</span>
                  </div>
                  <h1 className="text-5xl font-[1000] text-slate-900 dark:text-white tracking-tighter leading-tight mt-1 italic">
                    Configurador de Reglas
                  </h1>
               </div>
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-bold max-w-xl text-base leading-relaxed opacity-80">
              Arquitecte el cerebro predictivo para sincronizar la demanda operacional con el talento humano ideal.
            </p>
          </div>

          <div className="flex gap-6 items-center w-full lg:w-auto">
            <div className="relative flex-1 lg:w-96 group">
                <Search size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors z-10" />
                <input 
                    placeholder="BÚSQUEDA DE REGLAS..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full h-16 pl-16 pr-6 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 focus:border-indigo-500/50 outline-none font-black text-xs tracking-widest transition-all uppercase placeholder:text-slate-300 shadow-sm"
                />
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
                    className="h-16 px-10 rounded-2xl bg-indigo-600 text-white font-[1000] text-xs flex items-center gap-4 shadow-xl hover:bg-indigo-700 transition-all group outline-none whitespace-nowrap"
                >
                    <Plus size={20} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-500" />
                    <span className="tracking-[0.2em]">ACTIVAR NUEVA REGLA</span>
                </motion.button>
            </PermissionGate>
          </div>
        </header>

        {/* Master Table Layout */}
        <div className="bg-white dark:bg-slate-900 rounded-[40px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.08)] border border-slate-100 dark:border-slate-800 overflow-hidden">
             {loading ? (
                <div className="py-40 flex flex-col items-center gap-8 animate-pulse">
                    <div className="w-20 h-20 rounded-[32px] border-4 border-indigo-500 border-t-transparent animate-spin"></div>
                    <span className="font-black text-[10px] tracking-[0.5em] uppercase text-indigo-500/60">Analizando Algoritmos Maestros...</span>
                </div>
             ) : (
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="text-left bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                            <th className="px-12 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Nombre de Regla / Objetivo</th>
                            <th className="px-12 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Formato Vinculado</th>
                            <th className="px-12 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Ratio de Carga</th>
                            <th className="px-12 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] text-right">Acciones de Motor</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRules.map((rule, idx) => {
                            const metric = metricTypes.find(m => m.value === rule.metricType);
                            return (
                                <motion.tr 
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.05 }}
                                    key={rule.id} 
                                    className="group border-b border-slate-50 dark:border-slate-800/50 hover:bg-indigo-50/30 transition-all duration-300"
                                >
                                    <td className="px-12 py-8">
                                        <div className="flex items-center gap-6">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-inner">
                                                <Target size={22} />
                                            </div>
                                            <div>
                                                <h4 className="font-[1000] text-lg text-slate-900 dark:text-white tracking-tighter leading-none mb-1 uppercase bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400">{rule.name}</h4>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none truncate max-w-[200px]">{rule.description || 'Sin descripción estratégica.'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-12 py-8">
                                        <span className="px-4 py-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded-xl font-black text-[10px] tracking-widest border border-indigo-100 flex items-center gap-2 w-fit">
                                            <Store size={12} strokeWidth={3} /> {rule.storeTypeName?.toUpperCase() || 'GENERAL'}
                                        </span>
                                    </td>
                                    <td className="px-12 py-8">
                                        <div className="flex flex-col">
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-xs font-black text-indigo-400">{metric?.suffix}</span>
                                                <span className="text-2xl font-[1000] text-indigo-600 tracking-tighter tabular-nums">
                                                    {new Intl.NumberFormat('es-CO').format(rule.ratio)}
                                                </span>
                                            </div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">per {metric?.label}</p>
                                        </div>
                                    </td>
                                    <td className="px-12 py-8 text-right">
                                        <div className="flex items-center justify-end gap-3 translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                                            <PermissionGate module="ADVANCED" sub="PREDICTIVE_RULES" action="U" user={user}>
                                                <button 
                                                    onClick={() => { 
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
                                                    }}
                                                    className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 text-indigo-600 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all flex items-center justify-center shadow-sm"
                                                >
                                                    <Edit size={18} strokeWidth={2.5} />
                                                </button>
                                            </PermissionGate>
                                            <PermissionGate module="ADVANCED" sub="PREDICTIVE_RULES" action="D" user={user}>
                                                <button 
                                                    onClick={() => handleDelete(rule)}
                                                    className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 text-rose-500 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all flex items-center justify-center shadow-sm"
                                                >
                                                    <Trash2 size={18} strokeWidth={2.5} />
                                                </button>
                                            </PermissionGate>
                                        </div>
                                    </td>
                                </motion.tr>
                            );
                        })}
                        {filteredRules.length === 0 && (
                            <tr>
                                <td colSpan="4" className="py-40 text-center">
                                    <div className="flex flex-col items-center gap-6 opacity-30">
                                        <Layers size={80} strokeWidth={0.5} />
                                        <p className="font-black text-sm uppercase tracking-[0.5em]">Sin reglas configuradas</p>
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

      {/* MODAL COMMAND CENTER - WIZARD LAYOUT */}
      <AnimatePresence>
        {showWizard && (
          <div className="fixed inset-0 z-[10000] bg-slate-900/95 backdrop-blur-3xl flex items-center justify-center p-8 overflow-hidden animate-in fade-in duration-500">
             <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 100 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 100 }}
               className="bg-white dark:bg-slate-950 w-full max-w-7xl flex flex-col md:flex-row rounded-[64px] shadow-[0_100px_200px_-50px_rgba(0,0,0,0.8)] border border-white/10 overflow-hidden min-h-[850px] max-h-[95vh]"
             >
                {/* Sidebar Flow (Elite Indigo Gradient) */}
                <div className="w-full md:w-[420px] bg-gradient-to-br from-indigo-700 via-indigo-900 to-slate-900 p-16 flex flex-col gap-14 text-white relative">
                   <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-bl-full -mr-20 -mt-20 blur-3xl"></div>
                   
                   <div className="flex items-center gap-8 relative z-10">
                      <div className="w-24 h-24 rounded-[32px] bg-white/15 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-2xl">
                         <Settings2 size={44} className="text-white animate-[spin_8s_linear_infinite]" />
                      </div>
                      <div>
                         <h2 className="text-3xl font-[1000] tracking-tighter leading-none mb-3 italic">Wizard</h2>
                         <p className="text-[11px] font-black uppercase tracking-[0.4em] opacity-60">Rule Designer v13.0</p>
                      </div>
                   </div>

                   <nav className="flex flex-col gap-12 mt-10 relative z-10">
                        {[
                          { step: 1, label: 'Estrategia y Sede', sub: 'Destino de la regla' },
                          { step: 2, label: 'Impacto Operativo', sub: 'Cargos que calculan' },
                          { step: 3, label: 'Algoritmo Maestro', sub: 'Configuración del motor' }
                        ].map((item, idx) => (
                          <div key={item.step} className="flex items-center gap-8 group">
                             <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center text-xl font-[1000] transition-all duration-700 ${wizardStep === item.step ? 'bg-white text-indigo-600 shadow-2xl scale-110' : wizardStep > item.step ? 'bg-emerald-400 text-indigo-950' : 'bg-white/10 text-white/40'}`}>
                                {wizardStep > item.step ? <CheckCircle size={32} strokeWidth={3} /> : `0${item.step}`}
                             </div>
                             <div className="flex flex-col">
                                <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${wizardStep === item.step ? 'text-white' : 'text-white/40'}`}>FASE 0{item.step}</span>
                                <span className={`text-lg font-[1000] uppercase tracking-tighter leading-tight ${wizardStep === item.step ? 'text-white shadow-sm' : 'text-white/40'}`}>{item.label}</span>
                                <span className={`text-[11px] font-bold ${wizardStep === item.step ? 'text-indigo-200' : 'text-white/20'}`}>{item.sub}</span>
                             </div>
                          </div>
                        ))}
                   </nav>

                   <div className="mt-auto p-12 bg-black/30 rounded-[48px] border border-white/10 backdrop-blur-3xl relative overflow-hidden group">
                      <div className="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="flex items-center gap-4 mb-4 text-indigo-300">
                         <ShieldCheck size={20} />
                         <span className="text-[10px] font-black uppercase tracking-[0.3em]">Validación de Regla</span>
                      </div>
                      <p className="text-[12px] font-bold text-indigo-50/80 leading-relaxed italic relative z-10">
                         "Asegúrese de vincular todos los perfiles que perciben carga según la venta, como meseros y cocineros, para una precisión del 98%."
                      </p>
                   </div>
                </div>

                {/* Main Action Area */}
                <div className="flex-1 bg-slate-50 dark:bg-slate-900 p-24 overflow-y-auto relative custom-scrollbar">
                   <header className="flex justify-between items-start mb-24 animate-in slide-in-from-top-12 duration-700">
                      <div className="space-y-4">
                         <div className="flex items-center gap-3">
                            <span className="w-8 h-1 bg-indigo-500 rounded-full"></span>
                            <span className="text-[11px] font-[1000] text-indigo-500 uppercase tracking-[0.4em]">Configuración Platinum</span>
                         </div>
                         <h3 className="text-6xl font-[1000] text-slate-900 dark:text-white tracking-tighter leading-none italic uppercase">
                            {wizardStep === 1 ? 'Arquitectura' : wizardStep === 2 ? 'Colaboradores' : 'Matriz de Motor'}
                         </h3>
                         <p className="text-slate-500 dark:text-slate-400 font-bold text-xl max-w-2xl opacity-80 leading-relaxed">
                            {wizardStep === 1 ? 'Defina la identidad de la regla y vincúlela al formato de tienda correspondiente.' : 
                             wizardStep === 2 ? 'Seleccione los perfiles operativos que el motor debe dimensionar calculando la carga laboral.' : 
                             'Ajuste los ratios de productividad y los mínimos base necesarios para iniciar y cerrar operación.'}
                         </p>
                      </div>
                      <button onClick={() => setShowWizard(false)} className="w-20 h-20 rounded-[32px] bg-white dark:bg-slate-800 shadow-2xl flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all transform hover:rotate-90 hover:scale-110 active:scale-90 shadow-black/5 dark:shadow-black/20">
                         <X size={40} strokeWidth={3} />
                      </button>
                   </header>

                   <div className="min-h-[500px]">
                      <AnimatePresence mode="wait">
                         <motion.div 
                            key={wizardStep}
                            initial={{ opacity: 0, x: 50, filter: 'blur(20px)' }}
                            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, x: -50, filter: 'blur(20px)' }}
                            transition={{ type: "spring", damping: 25, stiffness: 120 }}
                         >
                            {renderWizardStep()}
                         </motion.div>
                      </AnimatePresence>
                   </div>

                   {/* Footer Controls */}
                   <div className="mt-24 pt-12 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <button 
                         onClick={() => setWizardStep(wizardStep - 1)}
                         disabled={wizardStep === 1}
                         className="px-12 py-7 rounded-[28px] bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 text-[12px] font-[1000] uppercase tracking-[0.3em] text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all disabled:opacity-0 outline-none shadow-sm flex items-center gap-6"
                      >
                         <ChevronLeft size={24} strokeWidth={3} /> ATRÁS
                      </button>
                      
                      <div className="flex items-center gap-8">
                         {wizardStep < 3 ? (
                            <button 
                               onClick={() => setWizardStep(wizardStep + 1)}
                               disabled={wizardStep === 1 && (!formData.name || !formData.storeTypeId)}
                               className="px-16 py-7 rounded-[28px] bg-indigo-600 text-white text-[12px] font-[1000] uppercase tracking-[0.3em] shadow-[0_30px_60px_-10px_rgba(79,70,229,0.5)] hover:bg-indigo-700 hover:scale-[1.05] active:scale-95 transition-all outline-none flex items-center gap-6 group"
                            >
                               SIGUIENTE FASE
                               <ArrowRight size={24} strokeWidth={3} className="group-hover:translate-x-2 transition-transform duration-500" />
                            </button>
                         ) : (
                            <button 
                               onClick={handleSave}
                               disabled={isSubmitting || formData.profileIds.length === 0}
                               className="px-20 py-7 rounded-[28px] bg-emerald-500 text-white text-[13px] font-[1000] uppercase tracking-[0.3em] shadow-[0_30px_60px_-10px_rgba(16,185,129,0.5)] hover:bg-emerald-600 hover:scale-[1.05] active:scale-95 transition-all outline-none flex items-center gap-6 group"
                            >
                               {isSubmitting ? 'SINCRONIZANDO MOTOR...' : (
                                  <>
                                     <Sparkles size={24} strokeWidth={3} className="group-hover:rotate-12" />
                                     ACTIVAR REGLA MAESTRA
                                  </>
                               )}
                            </button>
                         )}
                      </div>
                   </div>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Premium Toast Layer */}
      <AnimatePresence>
        {toast.show && (
          <motion.div 
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className="fixed bottom-16 left-1/2 -translate-x-1/2 z-[20000]"
          >
             <div className={`px-16 py-8 rounded-[48px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.6)] backdrop-blur-3xl flex items-center gap-8 font-[1000] text-sm tracking-[0.2em] border-t-8 border-b-8 ${toast.type === 'success' ? 'bg-indigo-950/95 text-white border-indigo-500 shadow-indigo-500/20' : 'bg-rose-950/95 text-white border-rose-500 shadow-rose-500/20'}`}>
                <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center ${toast.type === 'success' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-rose-500/20 text-rose-400'}`}>
                   {toast.type === 'success' ? <CheckCircle size={32} /> : <AlertCircle size={32} />}
                </div>
                <div>
                   <span className="uppercase text-slate-100 block mb-1">Estatus del núcleo</span>
                   <span className="uppercase text-indigo-200/60 font-black text-xs">{toast.message}</span>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default PredictiveRules;
