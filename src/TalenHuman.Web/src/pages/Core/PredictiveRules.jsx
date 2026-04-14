import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Edit, X, Layout, CheckCircle, AlertCircle, 
  Search, Info, Settings2, Users, BarChart3, ChevronRight, 
  ChevronLeft, Target, Layers, DollarSign, Hash, Clock
} from 'lucide-react';
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
    accent: '#6366f1',
    accentSoft: isDarkMode ? 'rgba(99, 102, 241, 0.15)' : '#eef2ff'
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
    { value: 1, label: 'Tickets', icon: Hash },
    { value: 2, label: 'Comensales', icon: Users },
    { value: 3, label: 'Ticket Promedio', icon: BarChart3 }
  ];

  const renderWizardStep = () => {
    switch (wizardStep) {
      case 1:
        return (
          <div className="space-y-10 animate-in fade-in slide-in-from-right duration-500">
             <div className="grid grid-cols-1 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Identificador de la Regla</label>
                  <input 
                    required autoFocus
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Ej. Regla Base Ventas - Tienda Normal"
                    className="w-full p-6 rounded-3xl bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-500 outline-none font-bold text-lg transition-all"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Descripción Estratégica</label>
                  <textarea 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Explique el objetivo de esta segmentación de personal..."
                    className="w-full p-6 rounded-3xl bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-500 outline-none font-bold text-sm h-32 transition-all resize-none"
                  />
                </div>
                <div className="md:col-span-1">
                   <SearchableSelect
                      label="Aplicar a Tipo de Tienda"
                      options={storeTypes.map(st => ({ value: st.id, label: st.name }))}
                      value={formData.storeTypeId}
                      onChange={(val) => setFormData({...formData, storeTypeId: val})}
                      placeholder="Seleccione el formato..."
                      icon={Layout}
                      required
                   />
                </div>
             </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-right duration-500">
             <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Cargos Impactados</h3>
                <p className="text-sm font-medium text-slate-500">Seleccione los cargos (profiles) cuyas necesidades de personal serán dictadas por esta regla.</p>
             </div>
             
             <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {profiles.map(p => {
                  const isSelected = formData.profileIds.includes(p.id);
                  return (
                    <button 
                      key={p.id}
                      onClick={() => toggleProfile(p.id)}
                      className={`p-6 rounded-3xl border-2 text-left transition-all ${
                        isSelected 
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-600/20' 
                          : 'bg-white dark:bg-slate-900 border-slate-50 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-indigo-500/30'
                      }`}
                    >
                      <Users size={20} className={`mb-3 ${isSelected ? 'text-indigo-200' : 'text-indigo-500'}`} />
                      <span className="font-black text-sm block leading-tight">{p.name}</span>
                    </button>
                  );
                })}
             </div>
             
             {formData.profileIds.length === 0 && (
                <div className="p-10 bg-red-50 dark:bg-red-500/10 rounded-3xl border border-red-100 dark:border-red-900 flex items-center gap-4 text-red-600">
                   <AlertCircle size={24} />
                   <p className="text-xs font-black uppercase tracking-widest">Debe seleccionar al menos un cargo para continuar.</p>
                </div>
             )}
          </div>
        );
      case 3:
        return (
          <div className="space-y-10 animate-in fade-in slide-in-from-right duration-500">
             <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Lógica del Motor Predictivo</h3>
                <p className="text-sm font-medium text-slate-500">Defina la variable maestra y el ratio de personal requerido.</p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Variable de Medición</label>
                   <div className="grid grid-cols-2 gap-3">
                      {metricTypes.map(m => {
                        const Icon = m.icon;
                        const isActive = formData.metricType === m.value;
                        return (
                          <button 
                            key={m.value}
                            onClick={() => setFormData({...formData, metricType: m.value})}
                            className={`p-5 rounded-2xl flex flex-col items-center gap-3 transition-all border-2 ${
                              isActive 
                                ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-500 text-indigo-600' 
                                : 'bg-transparent border-slate-100 dark:border-slate-800 text-slate-400'
                            }`}
                          >
                            <Icon size={24} />
                            <span className="text-[10px] font-black uppercase">{m.label}</span>
                          </button>
                        );
                      })}
                   </div>
                </div>

                <div className="space-y-4">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Ratio de Productividad</label>
                   <div className="relative">
                      <Target size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-500" />
                      <input 
                        type="number"
                        value={formData.ratio}
                        onChange={(e) => setFormData({...formData, ratio: parseFloat(e.target.value)})}
                        className="w-full p-6 pl-14 rounded-3xl bg-white dark:bg-slate-900 border-2 border-indigo-500/20 focus:border-indigo-500 outline-none font-black text-2xl transition-all"
                      />
                   </div>
                   <p className="text-[10px] font-bold text-indigo-400 leading-tight px-2 italic uppercase">
                      "Se requiere 1 persona adicional por cada {new Intl.NumberFormat('es-CO').format(formData.ratio)} unidades de {metricTypes.find(m => m.value === formData.metricType).label}"
                   </p>
                </div>

                <div className="space-y-4">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Dotación Mínima Apertura</label>
                   <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-2 rounded-3xl border border-slate-100 dark:border-slate-800">
                      <button onClick={() => setFormData({...formData, minStaffOpening: Math.max(0, formData.minStaffOpening-1)})} className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-600 dark:text-white font-black hover:bg-slate-200 transition-all">-</button>
                      <span className="flex-1 text-center text-2xl font-black dark:text-white">{formData.minStaffOpening}</span>
                      <button onClick={() => setFormData({...formData, minStaffOpening: formData.minStaffOpening+1})} className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black hover:scale-110 transition-all">+</button>
                   </div>
                </div>

                <div className="space-y-4">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Dotación Mínima Cierre</label>
                   <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-2 rounded-3xl border border-slate-100 dark:border-slate-800">
                      <button onClick={() => setFormData({...formData, minStaffClosing: Math.max(0, formData.minStaffClosing-1)})} className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-600 dark:text-white font-black hover:bg-slate-200 transition-all">-</button>
                      <span className="flex-1 text-center text-2xl font-black dark:text-white">{formData.minStaffClosing}</span>
                      <button onClick={() => setFormData({...formData, minStaffClosing: formData.minStaffClosing+1})} className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black hover:scale-110 transition-all">+</button>
                   </div>
                </div>
             </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="page-container animate-in fade-in duration-500" style={{ padding: '2rem 1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
           <div className="flex items-center gap-3 mb-1">
             <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white shadow-lg">
                <Settings2 size={18} />
             </div>
             <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Predicción v13.0</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Diseñador de Reglas</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Configure la inteligencia del motor de carga operacional por tipo de sede.</p>
        </div>

        <PermissionGate module="ADVANCED" sub="PREDICTIVE_RULES" action="C" user={user}>
          <button 
            onClick={() => { 
                setCurrentRule(null); 
                setFormData({ 
                   name: '', description: '', storeTypeId: '', metricType: 0, ratio: 1000000, 
                   minStaffOpening: 1, minStaffClosing: 1, isActive: true, profileIds: [] 
                }); 
                setWizardStep(1);
                setShowWizard(true); 
            }}
            className="btn-premium btn-premium-primary h-14 px-8 rounded-2xl flex items-center gap-3"
          >
            <Plus size={20} strokeWidth={3} /> Nueva Regla
          </button>
        </PermissionGate>
      </header>

      {loading ? (
        <div className="p-20 text-center animate-pulse">Analizando motor de reglas...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {rules.map(rule => (
             <div key={rule.id} className="bg-white dark:bg-slate-800 p-8 rounded-[48px] shadow-sm border border-slate-50 dark:border-slate-800 relative group overflow-hidden hover:scale-[1.03] transition-all">
                <div className="flex items-center justify-between mb-8">
                   <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500">
                      <Target size={24} />
                   </div>
                   <div className="flex items-center gap-2">
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
                      }} className="p-3 bg-slate-100 dark:bg-slate-700/50 rounded-xl text-slate-500 hover:text-indigo-500 transition-all">
                         <Edit size={16} />
                      </button>
                      <button onClick={() => handleDelete(rule.id)} className="p-3 bg-red-50 dark:bg-red-500/10 rounded-xl text-red-500 transition-all">
                         <Trash2 size={16} />
                      </button>
                   </div>
                </div>

                <div className="mb-8">
                   <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest block mb-1">{rule.storeTypeName}</span>
                   <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 leading-tight">{rule.name}</h3>
                   <p className="text-xs font-medium text-slate-500 line-clamp-2">{rule.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-10 border-t border-slate-100 dark:border-slate-800">
                   <div className="space-y-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em]">Cargo/Perfiles</p>
                      <div className="flex -space-x-2">
                         {rule.profiles.slice(0, 3).map((p, i) => (
                           <div key={i} title={p.name} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 border-2 border-white dark:border-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-500">
                              {p.name.charAt(0)}
                           </div>
                         ))}
                         {rule.profiles.length > 3 && (
                            <div className="w-8 h-8 rounded-full bg-indigo-500 border-2 border-white dark:border-slate-800 flex items-center justify-center text-[10px] font-bold text-white">
                               +{rule.profiles.length - 3}
                            </div>
                         )}
                      </div>
                   </div>
                   <div className="text-right">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em]">1 pax / cada</p>
                       <p className="text-lg font-black text-indigo-500 leading-none mt-1">
                          {rule.metricType === 0 ? '$' : ''}{new Intl.NumberFormat('es-CO').format(rule.ratio)}
                       </p>
                   </div>
                </div>
             </div>
           ))}

           {rules.length === 0 && (
              <div className="col-span-full p-20 bg-slate-100/50 dark:bg-slate-900/50 rounded-[48px] border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-slate-400">
                 <Settings2 size={64} className="mb-6 opacity-20" />
                 <p className="font-black text-[11px] uppercase tracking-[0.3em] text-center max-w-xs leading-relaxed">No hay reglas configuradas. Inicie el asistente para definir su estrategia de personal.</p>
              </div>
           )}
        </div>
      )}

      {/* Wizard Modal */}
      {showWizard && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-3xl z-[9999] flex items-center justify-center p-6">
           <div className="bg-white dark:bg-slate-800 w-full max-w-4xl rounded-[56px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in duration-300">
              {/* Wizard Status Bar */}
              <div className="bg-slate-50 dark:bg-slate-900/50 p-10 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                 <div className="flex items-center gap-10">
                    {[1, 2, 3].map(step => (
                      <div key={step} className="flex items-center gap-4 group">
                         <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black transition-all ${
                            wizardStep === step 
                              ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 scale-110' 
                              : wizardStep > step ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                         }`}>
                            {wizardStep > step ? <CheckCircle size={20} /> : step}
                         </div>
                         <div className="hidden md:block">
                            <p className={`text-[9px] font-black uppercase tracking-widest ${wizardStep === step ? 'text-indigo-600' : 'text-slate-400'}`}>Paso 0{step}</p>
                            <p className={`text-xs font-black ${wizardStep === step ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                               {step === 1 ? 'Configuración' : step === 2 ? 'Cargos' : 'Lógica Motor'}
                            </p>
                         </div>
                         {step < 3 && <ChevronRight size={16} className="text-slate-200 ml-4 hidden md:block" />}
                      </div>
                    ))}
                 </div>
                 <button onClick={() => setShowWizard(false)} className="w-12 h-12 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:rotate-90 transition-all">
                    <X size={20} strokeWidth={3} />
                 </button>
              </div>

              {/* Wizard Content */}
              <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                 {renderWizardStep()}
              </div>

              {/* Wizard Footer */}
              <div className="p-10 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                 <button 
                  onClick={() => setWizardStep(wizardStep - 1)}
                  disabled={wizardStep === 1}
                  className="px-8 py-5 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-black text-sm flex items-center gap-3 hover:bg-slate-100 disabled:opacity-0 transition-all shadow-sm"
                 >
                    <ChevronLeft size={20} /> Anterior
                 </button>
                 
                 <div className="flex items-center gap-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right hidden md:block">
                       {wizardStep === 3 ? 'Finalizar Configuración' : 'Siguiente Paso'}
                    </p>
                    {wizardStep < 3 ? (
                      <button 
                        onClick={() => setWizardStep(wizardStep + 1)}
                        className="px-10 py-5 rounded-2xl bg-indigo-600 text-white font-black text-sm flex items-center gap-3 hover:scale-[1.05] active:scale-[0.98] transition-all shadow-xl shadow-indigo-600/20"
                      >
                         Continuar <ChevronRight size={20} />
                      </button>
                    ) : (
                      <button 
                        onClick={handleSave}
                        disabled={isSubmitting || formData.profileIds.length === 0}
                        className="px-12 py-5 rounded-2xl bg-emerald-500 text-white font-black text-sm flex items-center gap-3 hover:scale-[1.05] active:scale-[0.98] transition-all shadow-xl shadow-emerald-500/20 disabled:opacity-50 disabled:grayscale"
                      >
                         {isSubmitting ? 'Activando Motor...' : 'Activar Regla'} <CheckCircle size={20} />
                      </button>
                    )}
                 </div>
              </div>
           </div>
        </div>
      )}

      {toast.show && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[10000] animate-in slide-in-from-bottom duration-300">
           <div className={`px-8 py-4 rounded-full shadow-2xl flex items-center gap-3 font-black text-sm ${toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
              {toast.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
              {toast.message}
           </div>
        </div>
      )}
    </div>
  );
};

export default PredictiveRules;
