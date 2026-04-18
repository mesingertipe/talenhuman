import React, { useState, useEffect } from 'react';
import { 
  Calendar, Plus, Trash2, Search, Info, CheckCircle, AlertTriangle, 
  MapPin, Globe, Filter, X, ChevronRight, Sparkles, Database, RotateCcw
} from 'lucide-react';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

const SpecialDates = ({ user }) => {
  const [dates, setDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // ALL, SYSTEM, MANUAL
  const [newDate, setNewDate] = useState({
    date: new Date().toISOString().split('T')[0],
    name: '',
    type: 1 // ManualEvent
  });

  const { isDarkMode } = useTheme();

  // Active Colors for Premium Design
  const activeColors = {
    bg: isDarkMode ? '#0f172a' : '#f8fafc',
    card: isDarkMode ? '#1e293b' : '#ffffff',
    border: isDarkMode ? '#334155' : '#f1f5f9',
    textMain: isDarkMode ? '#f8fafc' : '#1e293b',
    textMuted: isDarkMode ? '#94a3b8' : '#64748b',
    accent: '#4f46e5',
    accentSoft: isDarkMode ? 'rgba(79, 70, 229, 0.1)' : '#eef2ff'
  };

  const fetchDates = async (triggerSync = false) => {
    try {
      setLoading(true);
      const res = await api.get('/predictiveholidays');
      setDates(res.data);
      
      // V21.0: Auto-Sync Logic - If no system holidays exist, trigger sync
      if (res.data.filter(d => d.isSystem).length === 0 && triggerSync) {
        handleAutoSync();
      }
    } catch (err) {
      console.error('Error fetching special dates', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoSync = async () => {
    try {
      setIsSyncing(true);
      await api.post('/predictiveholidays/sync-defaults');
      const res = await api.get('/predictiveholidays');
      setDates(res.data);
    } catch (err) {
      console.error('Error in auto-sync', err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchDates(true);
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await api.post('/predictiveholidays', newDate);
      setShowAddModal(false);
      setNewDate({ date: new Date().toISOString().split('T')[0], name: '', type: 1 });
      fetchDates();
    } catch (err) {
      console.error('Error adding special date', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este evento personalizado?')) return;
    try {
      await api.delete(`/predictiveholidays/${id}`);
      fetchDates();
    } catch (err) {
      console.error('Error deleting special date', err);
    }
  };

  const filteredDates = dates.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'ALL' || 
                         (filterType === 'SYSTEM' && d.isSystem) || 
                         (filterType === 'MANUAL' && !d.isSystem);
    return matchesSearch && matchesFilter;
  });

  return (
    <div style={{ background: activeColors.bg, minHeight: '100vh', transition: 'all 0.4s ease' }}>
      <div style={{ padding: '60px', maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* Header Section (Elite Style) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'between', marginBottom: '60px', gap: '40px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '15px' }}>
              <div style={{ width: '56px', height: '56px', background: 'linear-gradient(135deg, #4f46e5 0%, #312e81 100%)', borderRadius: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 15px 30px rgba(79, 70, 229, 0.3)' }}>
                <Calendar className="text-white" size={28} />
              </div>
              <div>
                <h2 style={{ fontSize: '2.5rem', fontWeight: '950', color: activeColors.textMain, margin: 0, letterSpacing: '-0.04em' }}>
                  Estacionalidad
                </h2>
                <p style={{ fontSize: '10px', fontWeight: '800', color: activeColors.textMuted, textTransform: 'uppercase', margin: '4px 0 0', letterSpacing: '0.2em' }}>
                  Gestión Inteligente de Festivos & Eventos
                </p>
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => setShowAddModal(true)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '15px', padding: '20px 35px', 
              background: activeColors.accent, color: 'white', borderRadius: '24px', 
              border: 'none', fontWeight: '950', fontSize: '13px', textTransform: 'uppercase', 
              cursor: 'pointer', boxShadow: '0 15px 35px rgba(79, 70, 229, 0.4)',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-3px)'}
            onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <Plus size={20} strokeWidth={3} />
            Registrar Evento
          </button>
        </div>

        {/* Syncing Overlay / Loader */}
        <AnimatePresence>
          {isSyncing && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, background: 'rgba(2, 6, 23, 0.85)', backdropFilter: 'blur(20px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '120px', height: '120px', position: 'relative', margin: '0 auto 30px' }}>
                    <motion.div 
                        animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                        style={{ position: 'absolute', inset: 0, border: '4px solid rgba(79, 70, 229, 0.1)', borderRadius: '40px' }}
                    />
                    <motion.div 
                        animate={{ rotate: -360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        style={{ position: 'absolute', inset: '15px', border: '4px solid transparent', borderTopColor: '#4f46e5', borderRadius: '30px' }}
                    />
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5' }}>
                        <Sparkles size={40} />
                    </div>
                </div>
                <h3 style={{ color: 'white', fontSize: '1.4rem', fontWeight: '950', letterSpacing: '-0.02em' }}>Sincronizando Festivos de Ley</h3>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.15em', marginTop: '10px' }}>Preparando motor predictivo para {new Date().getFullYear() + ' - ' + (new Date().getFullYear()+1)}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Summary (Premium) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', marginBottom: '50px' }}>
          <div style={{ background: activeColors.card, padding: '35px', borderRadius: '40px', border: `1px solid ${activeColors.border}`, boxShadow: '0 20px 40px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
              <div style={{ width: '64px', height: '64px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Globe size={32} />
              </div>
              <div>
                <h4 style={{ fontSize: '2.5rem', fontWeight: '950', color: activeColors.textMain, margin: 0 }}>{dates.filter(d => d.isSystem).length}</h4>
                <p style={{ fontSize: '10px', fontWeight: '900', color: activeColors.textMuted, textTransform: 'uppercase', margin: 0, letterSpacing: '0.1em' }}>Festivos de Ley</p>
              </div>
            </div>
          </div>
          <div style={{ background: activeColors.card, padding: '35px', borderRadius: '40px', border: `1px solid ${activeColors.border}`, boxShadow: '0 20px 40px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
              <div style={{ width: '64px', height: '64px', background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={32} />
              </div>
              <div>
                <h4 style={{ fontSize: '2.5rem', fontWeight: '950', color: activeColors.textMain, margin: 0 }}>{dates.filter(d => !d.isSystem).length}</h4>
                <p style={{ fontSize: '10px', fontWeight: '900', color: activeColors.textMuted, textTransform: 'uppercase', margin: 0, letterSpacing: '0.1em' }}>Eventos Manuales</p>
              </div>
            </div>
          </div>
          <div style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #312e81 100%)', padding: '35px', borderRadius: '40px', color: 'white', boxShadow: '0 30px 60px rgba(79, 70, 229, 0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
              <div style={{ width: '64px', height: '64px', background: 'rgba(255, 255, 255, 0.15)', color: 'white', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Database size={32} />
              </div>
              <div>
                <h4 style={{ fontSize: '1.2rem', fontWeight: '950', margin: 0, letterSpacing: '-0.02em' }}>Motor Activo</h4>
                <p style={{ fontSize: '9px', fontWeight: '800', opacity: 0.6, textTransform: 'uppercase', margin: '4px 0 0', letterSpacing: '0.15em' }}>Temporada Detectada</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Area */}
        <div style={{ background: activeColors.card, padding: '25px', borderRadius: '35px', border: `1px solid ${activeColors.border}`, marginBottom: '40px', display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div style={{ flex: 1, position: 'relative' }}>
                <Search size={22} style={{ position: 'absolute', left: '25px', top: '50%', transform: 'translateY(-50%)', color: activeColors.textMuted }} />
                <input 
                    type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Filtrar por nombre de evento..."
                    style={{ width: '100%', padding: '18px 25px 18px 65px', borderRadius: '24px', border: `2px solid ${activeColors.border}`, background: activeColors.bg, color: activeColors.textMain, fontWeight: '700', fontSize: '0.95rem', outline: 'none' }}
                />
            </div>
            <div style={{ display: 'flex', background: activeColors.bg, padding: '6px', borderRadius: '22px' }}>
                {['ALL', 'SYSTEM', 'MANUAL'].map(t => (
                    <button 
                        key={t} onClick={() => setFilterType(t)}
                        style={{ padding: '12px 25px', borderRadius: '18px', border: 'none', background: filterType === t ? activeColors.card : 'transparent', color: filterType === t ? activeColors.accent : activeColors.textMuted, fontWeight: '950', fontSize: '10px', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.3s', boxShadow: filterType === t ? '0 5px 15px rgba(0,0,0,0.05)' : 'none' }}
                    >
                        {t === 'ALL' ? 'Todos' : t === 'SYSTEM' ? 'Festivos' : 'Manuales'}
                    </button>
                ))}
            </div>
        </div>

        {/* Malla de Eventos (Grid) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '30px' }}>
          {loading ? (
            [...Array(6)].map((_, i) => (
              <div key={i} style={{ height: '220px', background: activeColors.card, borderRadius: '40px', border: `1px solid ${activeColors.border}`, animation: 'pulse 2s infinite ease-in-out' }} />
            ))
          ) : filteredDates.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '120px 0' }}>
              <div style={{ width: '110px', height: '110px', background: activeColors.accentSoft, color: activeColors.accent, borderRadius: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 30px' }}>
                <Calendar size={50} />
              </div>
              <h3 style={{ fontSize: '1.8rem', fontWeight: '950', color: activeColors.textMain, margin: '0 0 10px', letterSpacing: '-0.02em' }}>Sin resultados</h3>
              <p style={{ color: activeColors.textMuted, fontSize: '0.9rem', fontWeight: '700' }}>No se encontraron eventos con los filtros aplicados</p>
            </div>
          ) : (
            filteredDates.map((d) => (
              <motion.div 
                key={d.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                style={{ background: activeColors.card, borderRadius: '45px', padding: '40px', border: `1px solid ${d.isSystem ? 'rgba(79, 70, 229, 0.2)' : activeColors.border}`, position: 'relative', overflow: 'hidden', boxShadow: '0 15px 35px rgba(0,0,0,0.02)' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '25px' }}>
                    <div style={{ px: '14px', py: '6px', background: d.isSystem ? activeColors.accent : 'rgba(168, 85, 247, 0.1)', color: d.isSystem ? 'white' : '#a855f7', borderRadius: '12px', fontSize: '9px', fontWeight: '950', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        {d.isSystem ? 'Festivo Oficial' : 'Evento de Negocio'}
                    </div>
                    {!d.isSystem && (
                        <button onClick={() => handleDelete(d.id)} style={{ padding: '10px', borderRadius: '14px', border: 'none', background: 'rgba(239, 68, 68, 0.05)', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={18} /></button>
                    )}
                </div>
                
                <h5 style={{ fontSize: '1.4rem', fontWeight: '950', color: activeColors.textMain, margin: '0 0 15px', lineHeight: '1.2' }}>{d.name}</h5>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: activeColors.textMuted }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: activeColors.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: activeColors.accent }}><Calendar size={16} /></div>
                    <span style={{ fontSize: '13px', fontWeight: '800', textTransform: 'capitalize' }}>
                        {new Date(d.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                </div>

                {d.isSystem && (
                    <div style={{ position: 'absolute', right: '-20px', bottom: '-20px', opacity: 0.05, transform: 'rotate(-15deg)' }}>
                        <Globe size={120} />
                    </div>
                )}
              </motion.div>
            ))
          )}
        </div>

        {/* Modal de Registro (Premium) */}
        <AnimatePresence>
            {showAddModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(2, 6, 23, 0.85)', backdropFilter: 'blur(35px)', zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                        style={{ background: activeColors.card, width: '100%', maxWidth: '500px', borderRadius: '52px', overflow: 'hidden', border: isDarkMode ? `1px solid ${activeColors.border}` : 'none', boxShadow: '0 60px 120px rgba(0,0,0,0.5)' }}
                    >
                        <div style={{ padding: '50px 50px 40px', textAlign: 'center' }}>
                            <div style={{ width: '80px', height: '80px', background: activeColors.accentSoft, color: activeColors.accent, borderRadius: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 30px' }}>
                                <Sparkles size={40} />
                            </div>
                            <h2 style={{ fontSize: '2.2rem', fontWeight: '950', color: activeColors.textMain, margin: '0 0 10px', letterSpacing: '-0.04em' }}>Nuevo Evento</h2>
                            <p style={{ color: activeColors.textMuted, fontSize: '0.9rem', fontWeight: '700' }}>Añade una fecha especial para la IA</p>
                        </div>

                        <div style={{ padding: '0 50px 50px' }}>
                            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '9px', fontWeight: '900', color: activeColors.textMuted, textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.1em' }}>Nombre del Evento *</label>
                                    <input 
                                        required autoFocus value={newDate.name} onChange={e => setNewDate({...newDate, name: e.target.value})}
                                        placeholder="Ej. Black Friday, Concierto local..."
                                        style={{ width: '100%', padding: '20px 25px', borderRadius: '22px', border: `2px solid ${activeColors.border}`, background: activeColors.bg, color: activeColors.textMain, fontWeight: '700', fontSize: '1rem', outline: 'none' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '9px', fontWeight: '900', color: activeColors.textMuted, textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.1em' }}>Fecha del Evento *</label>
                                    <input 
                                        required type="date" value={newDate.date} onChange={e => setNewDate({...newDate, date: e.target.value})}
                                        style={{ width: '100%', padding: '20px 25px', borderRadius: '22px', border: `2px solid ${activeColors.border}`, background: activeColors.bg, color: activeColors.textMain, fontWeight: '700', fontSize: '1rem', outline: 'none' }}
                                    />
                                </div>

                                <div style={{ background: 'rgba(245, 158, 11, 0.08)', padding: '22px', borderRadius: '24px', border: '1px solid rgba(245, 158, 11, 0.2)', display: 'flex', gap: '15px' }}>
                                    <AlertTriangle size={24} style={{ color: '#f59e0b', shrink: 0 }} />
                                    <p style={{ fontSize: '11px', fontWeight: '700', color: '#f59e0b', margin: 0, lineHeight: '1.4' }}>
                                        Este evento afectará los promedios de venta y proyecciones de toda la compañía.
                                    </p>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                                    <button type="submit" style={{ width: '100%', padding: '22px', borderRadius: '22px', border: 'none', background: activeColors.accent, color: 'white', fontWeight: '950', fontSize: '12px', textTransform: 'uppercase', cursor: 'pointer', boxShadow: '0 15px 30px rgba(79, 70, 229, 0.3)' }}>Guardar Evento</button>
                                    <button onClick={() => setShowAddModal(false)} type="button" style={{ width: '100%', padding: '15px', borderRadius: '15px', border: 'none', background: 'transparent', color: activeColors.textMuted, fontWeight: '800', fontSize: '10px', textTransform: 'uppercase', cursor: 'pointer' }}>Cerrar</button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default SpecialDates;
