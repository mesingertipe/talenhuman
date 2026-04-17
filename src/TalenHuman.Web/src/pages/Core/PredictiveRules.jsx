import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Edit, X, Layout, CheckCircle, AlertCircle, 
  Search, Info, Settings2, Users, BarChart3, ChevronRight, 
  ChevronLeft, Target, Layers, DollarSign, Hash, Clock, Ticket,
  Store, Hash as HashIcon, Activity, TrendingUp, Sparkles,
  ArrowRight, ShieldCheck, Cpu, Send, RefreshCw, Paperclip
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
    metricType: 0, 
    ratio: 1000000,
    minStaffOpening: 1,
    minStaffClosing: 1,
    isActive: true,
    weeklyRestDays: 1,
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
  } = useTableData(rules, ['name', 'description']);

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileSearch, setProfileSearch] = useState('');

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
        showToast("Complete los campos obligatorios", "error");
        return;
    }

    try {
      setIsSubmitting(true);
      if (currentRule) {
        await api.put(`/predictiverules/${currentRule.id}`, formData);
        showToast("Regla actualizada");
      } else {
        await api.post('/predictiverules', formData);
        showToast("Motor activado");
      }
      setShowWizard(false);
      fetchData();
    } catch (err) {
      showToast("Error en la persistencia", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (rule) => {
    if (!window.confirm(`¿Desea desmantelar la regla "${rule.name}"?`)) return;
    try {
      await api.delete(`/predictiverules/${rule.id}`);
      showToast("Regla eliminada");
      fetchData();
    } catch (err) {
      showToast("Error al eliminar", "error");
    }
  };

  const metricTypes = [
    { value: 0, label: 'Venta Neta', icon: DollarSign, suffix: '$' },
    { value: 1, label: 'Tickets', icon: Ticket, suffix: '#' },
    { value: 2, label: 'Comensales', icon: Users, suffix: 'Px' },
    { value: 3, label: 'Ticket Promedio', icon: BarChart3, suffix: '$' }
  ];

  return (
    <div style={{ background: activeColors.bg, padding: '2rem 1.5rem', maxWidth: '1400px', margin: '0 auto', minHeight: '100vh' }}>
      
      {/* Elite Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4rem', gap: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: '950', color: activeColors.textMain, margin: 0, letterSpacing: '-0.03em' }}>Diseño de reglas</h1>
          <p style={{ color: activeColors.textMuted, fontSize: '0.9rem', fontWeight: '600', marginTop: '6px' }}>Configuración de inteligencia para carga operativa</p>
        </div>

        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', width: '100%', maxWidth: '850px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '16px', top: '19px', color: '#94a3b8', zIndex: 10 }} />
            <input 
              type="text" 
              placeholder="Buscar reglas maestras..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-premium"
              style={{ paddingLeft: '50px', borderRadius: '20px', height: '56px', margin: 0, border: `1.5px solid ${activeColors.border}` }}
            />
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <PermissionGate module="ADVANCED" sub="PREDICTIVE_RULES" action="C" user={user}>
              <button 
                onClick={() => { 
                  setCurrentRule(null); 
                  setFormData({ 
                    name: '', description: '', storeTypeId: '', metricType: 0, ratio: 1000000, 
                    minStaff: 1, minStaffOpening: 1, minStaffClosing: 1, isActive: true, weeklyRestDays: 1, profileIds: [] 
                  }); 
                  setWizardStep(1);
                  setShowWizard(true); 
                }}
                className="btn-premium btn-premium-primary"
                style={{ borderRadius: '20px', height: '56px', padding: '0 25px', whiteSpace: 'nowrap' }}
              >
                <Plus size={20} /> Nueva Regla
              </button>
            </PermissionGate>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', minHeight: '60vh', background: activeColors.card, border: `1px solid ${activeColors.border}`, borderRadius: '20px' }}>
        {loading ? (
          <div style={{ padding: '6rem', textAlign: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '48px', height: '48px', border: '4px solid rgba(79, 70, 229, 0.1)', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              <p style={{ color: activeColors.textMuted, fontWeight: '500' }}>Iniciando motores...</p>
            </div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', background: isDarkMode ? '#1e293b50' : '#f8fafc', borderBottom: `1px solid ${activeColors.border}` }}>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '800', color: activeColors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Regla / Propósito</th>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '800', color: activeColors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Formato</th>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '800', color: activeColors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Métrica / Ratio</th>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '800', color: activeColors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Descansos</th>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '800', color: activeColors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Gestión</th>
              </tr>
            </thead>
            <tbody>
              {filteredRules.map((rule) => {
                const metric = metricTypes.find(m => m.value === rule.metricType);
                return (
                  <tr key={rule.id} style={{ borderBottom: `1px solid ${activeColors.border}` }} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '38px', height: '38px', background: isDarkMode ? 'rgba(79, 70, 229, 0.15)' : '#eef2ff', color: '#4f46e5', border: `1px solid ${activeColors.border}`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Target size={20} />
                        </div>
                        <div>
                            <div style={{ fontWeight: '700', color: activeColors.textMain }}>{rule.name}</div>
                            <div style={{ fontSize: '0.75rem', color: activeColors.textMuted }}>{rule.profiles?.length || 0} cargos asociados</div>
                        </div>
                      </div>
                    </td>
                     <td style={{ padding: '1.25rem 1.5rem' }}>
                       <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#6366f1', padding: '4px 10px', background: '#eef2ff', borderRadius: '8px', textTransform: 'uppercase' }}>
                         {rule.storeTypeName || 'General'}
                       </span>
                     </td>
                     <td style={{ padding: '1.25rem 1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '1.1rem', fontWeight: '900', color: activeColors.textMain }}>{metric?.suffix}{new Intl.NumberFormat('es-CO').format(rule.ratio)}</span>
                            <span style={{ fontSize: '0.7rem', fontWeight: '700', color: activeColors.textMuted, textTransform: 'uppercase' }}>per {metric?.label}</span>
                        </div>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '1.1rem', fontWeight: '900', color: activeColors.textMain }}>{rule.weeklyRestDays}</span>
                            <span style={{ fontSize: '0.7rem', fontWeight: '700', color: activeColors.textMuted, textTransform: 'uppercase' }}>semanal</span>
                        </div>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <PermissionGate module="ADVANCED" sub="PREDICTIVE_RULES" action="U" user={user}>
                            <button 
                                onClick={() => { 
                                    setCurrentRule(rule);
                                    setFormData({
                                        name: rule.name,
                                        description: rule.description || '',
                                        storeTypeId: rule.storeTypeId,
                                        metricType: rule.metricType,
                                        ratio: rule.ratio,
                                        minStaff: rule.minStaff || 1,
                                        minStaffOpening: rule.minStaffOpening || 1,
                                        minStaffClosing: rule.minStaffClosing || 1,
                                        isActive: rule.isActive,
                                        weeklyRestDays: rule.weeklyRestDays || 1,
                                        profileIds: rule.profiles.map(p => p.profileId)
                                    });
                                    setWizardStep(1);
                                    setShowWizard(true);
                                }}
                                style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', padding: '0.5rem' }}
                            >
                                <Edit size={18} />
                            </button>
                          </PermissionGate>
                          <PermissionGate module="ADVANCED" sub="PREDICTIVE_RULES" action="D" user={user}>
                            <button 
                                onClick={() => handleDelete(rule)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '0.5rem' }}
                            >
                                <Trash2 size={18} />
                            </button>
                          </PermissionGate>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredRules.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ padding: '4rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', opacity: 0.4 }}>
                      <Sparkles size={48} />
                      <p style={{ fontWeight: '500' }}>Inicie el motor creando una regla.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* WIZARD MODAL - NewsRequest Styled (Deep Blur) */}
      <AnimatePresence>
        {showWizard && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(2, 6, 23, 0.9)', backdropFilter: 'blur(40px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
            <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 30 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 30 }}
               style={{ display: 'flex', flexDirection: 'row', background: activeColors.card, borderRadius: '48px', overflow: 'hidden', minHeight: '750px', width: '100%', maxWidth: '1200px', border: isDarkMode ? `1px solid ${activeColors.border}` : 'none', boxShadow: '0 50px 100px rgba(0,0,0,0.5)' }}
            >
                {/* Sidebar Wizard (Elite Pattern) */}
                <div style={{ width: '340px', background: 'linear-gradient(180deg, #4f46e5 0%, #312e81 100%)', padding: '60px 45px', display: 'flex', flexDirection: 'column', color: 'white' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '60px' }}>
                        <div style={{ padding: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.2)' }}><Plus size={24} /></div>
                        <div>
                            <h2 style={{ fontSize: '1.4rem', fontWeight: '950', margin: 0, letterSpacing: '-0.02em' }}>Nuevo Motor</h2>
                            <p style={{ fontSize: '9px', fontWeight: '800', opacity: 0.6, textTransform: 'uppercase', margin: '4px 0 0', letterSpacing: '0.15em' }}>Configuración Predictiva</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                        {[
                            { s: 1, t: 'Identidad', d: 'Nombre y Sede' },
                            { s: 2, t: 'Alcance', d: 'Cargos Impactados' },
                            { s: 3, t: 'Motor', d: 'Métricas y Ratios' }
                        ].map(step => (
                            <div key={step.s} style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                <div style={{ width: '44px', height: '44px', borderRadius: '15px', background: wizardStep === step.s ? 'white' : wizardStep > step.s ? '#10b981' : 'rgba(255,255,255,0.1)', color: wizardStep === step.s ? '#4f46e5' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '950', fontSize: '15px', transition: 'all 0.3s' }}>
                                    {wizardStep > step.s ? <CheckCircle size={22} /> : step.s}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontSize: '8px', fontWeight: '900', opacity: 0.4, textTransform: 'uppercase', margin: 0 }}>Fase 0{step.s}</p>
                                    <p style={{ fontSize: '12px', fontWeight: '950', textTransform: 'uppercase', margin: '2px 0 0', color: wizardStep === step.s ? 'white' : 'rgba(255,255,255,0.3)' }}>{step.t}</p>
                                    <p style={{ fontSize: '9px', fontWeight: '700', margin: 0, color: wizardStep === step.s ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.1)' }}>{step.d}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ marginTop: 'auto', padding: '30px', background: 'rgba(0,0,0,0.2)', borderRadius: '28px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', fontWeight: '600', lineHeight: '1.6', margin: 0, fontStyle: 'italic' }}>
                            "La precisión del motor depende de un ratio bien balanceado según el histórico de ventas."
                        </p>
                    </div>
                </div>

                {/* Content Area */}
                <div style={{ flex: 1, padding: '70px', background: activeColors.bg, position: 'relative', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                    <button onClick={() => setShowWizard(false)} style={{ position: 'absolute', right: '40px', top: '40px', background: activeColors.card, border: `1px solid ${activeColors.border}`, width: '44px', height: '44px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: activeColors.textMuted }}>
                        <X size={24} />
                    </button>

                    {wizardStep === 1 && (
                        <div style={{ animation: 'fadeIn 0.5s ease-out', flex: 1, display: 'flex', flexDirection: 'column', gap: '40px' }}>
                            <div>
                                <h3 style={{ fontSize: '2.5rem', fontWeight: '950', color: activeColors.textMain, margin: 0, letterSpacing: '-0.04em' }}>Identidad de Regla</h3>
                                <p style={{ color: activeColors.textMuted, fontSize: '0.9rem', fontWeight: '700', marginTop: '10px' }}>Defina el alcance jerárquico del motor</p>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                                <div style={{ position: 'relative' }}>
                                    <label style={{ display: 'block', fontSize: '10px', fontWeight: '900', color: activeColors.textMuted, textTransform: 'uppercase', marginBottom: '12px' }}>Nombre Maestro *</label>
                                    <input 
                                        autoFocus
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value.toUpperCase()})}
                                        placeholder="EJ: ALGORITMO PREDICTIVO RESTAURANTES..."
                                        style={{ width: '100%', padding: '22px 30px', borderRadius: '24px', border: `2px solid ${activeColors.border}`, background: activeColors.card, color: activeColors.textMain, fontWeight: '900', fontSize: '1.1rem', outline: 'none' }}
                                    />
                                </div>

                                <SearchableSelect
                                    label="Formato de Tienda Asociado *"
                                    options={storeTypes.map(st => ({ id: st.id, name: st.name }))}
                                    value={formData.storeTypeId}
                                    onChange={(val) => setFormData({...formData, storeTypeId: val})}
                                    placeholder="Vincular a un formato..."
                                    icon={Store}
                                />
                                
                                <div style={{ position: 'relative' }}>
                                    <label style={{ display: 'block', fontSize: '10px', fontWeight: '900', color: activeColors.textMuted, textTransform: 'uppercase', marginBottom: '12px' }}>Memoria Descriptiva</label>
                                    <textarea 
                                        value={formData.description}
                                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                                        placeholder="Detalle la lógica de negocio aplicada..."
                                        style={{ width: '100%', height: '120px', padding: '25px', borderRadius: '24px', border: `2px solid ${activeColors.border}`, background: activeColors.card, color: activeColors.textMain, fontWeight: '600', fontSize: '0.95rem', outline: 'none', resize: 'none' }}
                                    />
                                </div>
                            </div>

                            <div style={{ marginTop: 'auto', display: 'flex', gap: '20px' }}>
                                <button onClick={() => setWizardStep(2)} disabled={!formData.name || !formData.storeTypeId} style={{ flex: 1, padding: '24px', borderRadius: '24px', background: activeColors.accent, color: 'white', border: 'none', fontWeight: '950', fontSize: '13px', textTransform: 'uppercase', cursor: 'pointer', boxShadow: '0 15px 30px rgba(79, 70, 229, 0.3)' }}>Continuar a configuración de cargos</button>
                            </div>
                        </div>
                    )}

                    {wizardStep === 2 && (
                        <div style={{ animation: 'fadeIn 0.5s ease-out', flex: 1, display: 'flex', flexDirection: 'column', gap: '40px' }}>
                            <div>
                                <h3 style={{ fontSize: '2.5rem', fontWeight: '950', color: activeColors.textMain, margin: 0, letterSpacing: '-0.04em' }}>Cargos Impactados</h3>
                                <p style={{ color: activeColors.textMuted, fontSize: '0.9rem', fontWeight: '700', marginTop: '10px' }}>Seleccione los perfiles que el motor dimensionará</p>
                            </div>

                            {/* Search Filter for agility */}
                            <div style={{ position: 'relative' }}>
                                <Search size={18} style={{ position: 'absolute', left: '20px', top: '22px', color: '#94a3b8' }} />
                                <input 
                                    type="text"
                                    placeholder="Filtrar cargos por nombre (ej. Mesero, Cocinero...)"
                                    value={profileSearch}
                                    onChange={(e) => setProfileSearch(e.target.value)}
                                    style={{ width: '100%', padding: '18px 24px 18px 54px', borderRadius: '20px', border: `2px solid ${activeColors.border}`, background: activeColors.card, color: activeColors.textMain, fontWeight: '700', fontSize: '0.95rem', outline: 'none' }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px', overflowY: 'auto', maxHeight: '420px', padding: '10px' }}>
                                {profiles.filter(p => p.name.toLowerCase().includes(profileSearch.toLowerCase())).map(p => {
                                    const isSelected = formData.profileIds.includes(p.id);
                                    return (
                                        <div 
                                            key={p.id}
                                            onClick={() => {
                                                const ids = isSelected ? formData.profileIds.filter(id => id !== p.id) : [...formData.profileIds, p.id];
                                                setFormData({...formData, profileIds: ids});
                                            }}
                                            style={{ padding: '20px 25px', borderRadius: '24px', background: isSelected ? activeColors.accent : activeColors.card, border: `2px solid ${isSelected ? activeColors.accent : activeColors.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '15px', transition: 'all 0.2s' }}
                                        >
                                            <div style={{ width: '40px', height: '40px', background: isSelected ? 'rgba(255,255,255,0.2)' : activeColors.accentSoft, color: isSelected ? 'white' : activeColors.accent, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '950' }}>{p.name.charAt(0)}</div>
                                            <div style={{ flex: 1 }}>
                                                <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: '900', color: isSelected ? 'white' : activeColors.textMain }}>{p.name}</p>
                                                <p style={{ margin: 0, fontSize: '0.7rem', color: isSelected ? 'rgba(255,255,255,0.6)' : activeColors.textMuted, fontWeight: '700' }}>Perfil {isSelected ? 'seleccionado' : 'disponible'}</p>
                                            </div>
                                            {isSelected && <CheckCircle size={20} color="white" />}
                                        </div>
                                    )
                                })}
                            </div>

                            <div style={{ marginTop: 'auto', display: 'flex', gap: '20px' }}>
                                <button onClick={() => setWizardStep(1)} style={{ padding: '24px 40px', borderRadius: '24px', background: 'transparent', border: `2px solid ${activeColors.border}`, color: activeColors.textMuted, fontWeight: '950', fontSize: '11px', textTransform: 'uppercase', cursor: 'pointer' }}>Atrás</button>
                                <button onClick={() => setWizardStep(3)} disabled={formData.profileIds.length === 0} style={{ flex: 1, padding: '24px', borderRadius: '24px', background: activeColors.accent, color: 'white', border: 'none', fontWeight: '950', fontSize: '13px', textTransform: 'uppercase', cursor: 'pointer', boxShadow: '0 15px 30px rgba(79, 70, 229, 0.3)' }}>Configurar matriz de productividad</button>
                            </div>
                        </div>
                    )}

                    {wizardStep === 3 && (
                        <div style={{ animation: 'fadeIn 0.5s ease-out', flex: 1, display: 'flex', flexDirection: 'column', gap: '40px' }}>
                            <div>
                                <h3 style={{ fontSize: '2.5rem', fontWeight: '950', color: activeColors.textMain, margin: 0, letterSpacing: '-0.04em' }}>Algoritmo Maestro</h3>
                                <p style={{ color: activeColors.textMuted, fontSize: '0.9rem', fontWeight: '700', marginTop: '10px' }}>Ratios técnicos y mínimos operativos</p>
                            </div>

                            <div style={{ background: activeColors.card, padding: '40px', borderRadius: '40px', border: `1px solid ${activeColors.border}` }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '40px' }}>
                                     <div>
                                        <label style={{ display: 'block', fontSize: '10px', fontWeight: '900', color: activeColors.textMuted, textTransform: 'uppercase', marginBottom: '15px' }}>Métrica de Carga *</label>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                            {metricTypes.map(m => (
                                                <button 
                                                    key={m.value}
                                                    onClick={() => setFormData({...formData, metricType: m.value})}
                                                    style={{ flex: 1, padding: '15px', borderRadius: '15px', border: `2px solid ${formData.metricType === m.value ? activeColors.accent : activeColors.border}`, background: formData.metricType === m.value ? activeColors.accentSoft : 'transparent', color: formData.metricType === m.value ? activeColors.accent : activeColors.textMain, fontWeight: '900', fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                                >
                                                    <m.icon size={16} /> {m.label}
                                                </button>
                                            ))}
                                        </div>
                                     </div>
                                     <div>
                                        <label style={{ display: 'block', fontSize: '10px', fontWeight: '900', color: activeColors.textMuted, textTransform: 'uppercase', marginBottom: '15px' }}>Ratio Objetivo ({metricTypes.find(m => m.value === formData.metricType)?.suffix}) *</label>
                                        <input 
                                            type="number"
                                            value={formData.ratio}
                                            onChange={(e) => setFormData({...formData, ratio: parseInt(e.target.value) || 0})}
                                            style={{ width: '100%', padding: '15px 25px', borderRadius: '18px', border: `2px solid ${activeColors.accent}`, background: activeColors.accentSoft, color: activeColors.accent, fontWeight: '950', fontSize: '1.4rem', outline: 'none', textAlign: 'right' }}
                                        />
                                     </div>
                                </div>


                                <div style={{ marginTop: '40px', padding: '25px', background: isDarkMode ? 'rgba(79, 70, 229, 0.1)' : '#fdf2f8', borderRadius: '24px', border: `2px dashed ${activeColors.accent}` }}>
                                    <label style={{ display: 'block', fontSize: '10px', fontWeight: '900', color: activeColors.textMuted, textTransform: 'uppercase', marginBottom: '15px' }}>Descansos Semanales Obligatorios</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
                                        <div style={{ flex: 1 }}>
                                            <input 
                                                type="range" 
                                                min="1" 
                                                max="6" 
                                                step="1"
                                                value={formData.weeklyRestDays}
                                                onChange={(e) => setFormData({...formData, weeklyRestDays: parseInt(e.target.value)})}
                                                style={{ width: '100%', accentColor: activeColors.accent }}
                                            />
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                                                <span style={{ fontSize: '10px', fontWeight: '800', color: activeColors.textMuted }}>1 DÍA</span>
                                                <span style={{ fontSize: '10px', fontWeight: '800', color: activeColors.textMuted }}>6 DÍAS</span>
                                            </div>
                                        </div>
                                        <div style={{ width: '80px', height: '80px', background: activeColors.accent, borderRadius: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                            <span style={{ fontSize: '1.8rem', fontWeight: '950' }}>{formData.weeklyRestDays}</span>
                                            <span style={{ fontSize: '8px', fontWeight: '800' }}>DÍAS</span>
                                        </div>
                                    </div>
                                    <p style={{ marginTop: '15px', fontSize: '11px', color: activeColors.textMuted, fontWeight: '600' }}>
                                        El motor garantizará que cada colaborador tenga al menos {formData.weeklyRestDays} día(s) de descanso propuestos en la malla.
                                    </p>
                                </div>

                            <div style={{ marginTop: 'auto', display: 'flex', gap: '20px' }}>
                                <button onClick={() => setWizardStep(2)} style={{ padding: '24px 40px', borderRadius: '24px', background: 'transparent', border: `2px solid ${activeColors.border}`, color: activeColors.textMuted, fontWeight: '950', fontSize: '11px', textTransform: 'uppercase', cursor: 'pointer' }}>Atrás</button>
                                <button onClick={handleSave} disabled={isSubmitting} style={{ flex: 1, padding: '24px', borderRadius: '24px', background: '#10b981', color: 'white', border: 'none', fontWeight: '950', fontSize: '14px', textTransform: 'uppercase', cursor: 'pointer', boxShadow: '0 15px 30px rgba(16, 185, 129, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                                    {isSubmitting ? 'Sincronizando...' : <><Sparkles size={20} /> Activar Algoritmo Predictivo</>}
                                </button>
                            </div>
                        </div>
                        </div>
                    )}
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Local Toast */}
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

export default PredictiveRules;
