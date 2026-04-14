import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, X, Layout, CheckCircle, AlertCircle, Search, Info } from 'lucide-react';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import PermissionGate from '../../components/Shared/PermissionGate';

const StoreTypes = ({ user }) => {
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
    try {
      setIsSubmitting(true);
      if (currentType) {
        await api.put(`/storetypes/${currentType.id}`, formData);
        showToast("Categoría actualizada");
      } else {
        await api.post('/storetypes', formData);
        showToast("Categoría creada");
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      showToast(err.response?.data || "Error al guardar", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar este tipo de tienda?")) return;
    try {
      await api.delete(`/storetypes/${id}`);
      showToast("Categoría eliminada");
      fetchData();
    } catch (err) {
      showToast(err.response?.data || "Error al eliminar", "error");
    }
  };

  const filteredTypes = types.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="page-container animate-in fade-in duration-500" style={{ padding: '2rem 1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
           <div className="flex items-center gap-3 mb-1">
             <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white shadow-lg">
                <Layout size={18} />
             </div>
             <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Parámetros Core</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Tipos de Tienda</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Categorización estratégica para reglas predictivas y de carga.</p>
        </div>

        <PermissionGate module="CORE" sub="STORE_TYPES" action="C" user={user}>
          <button 
            onClick={() => { setCurrentType(null); setFormData({ name: '', isActive: true }); setShowModal(true); }}
            className="btn-premium btn-premium-primary h-14 px-8 rounded-2xl flex items-center gap-3"
          >
            <Plus size={20} strokeWidth={3} /> Nueva Categoría
          </button>
        </PermissionGate>
      </header>

      <div className="bg-white dark:bg-slate-800 rounded-[40px] shadow-sm border border-slate-50 dark:border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-50 dark:border-slate-900">
           <div className="relative group">
              <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                placeholder="Buscar por nombre..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-4 pl-14 rounded-2xl bg-slate-50 dark:bg-slate-900/50 font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all border-none"
              />
           </div>
        </div>

        {loading ? (
          <div className="p-20 text-center animate-pulse">Cargando parámetros...</div>
        ) : (
          <div className="divide-y divide-slate-50 dark:divide-slate-900">
            {filteredTypes.map(t => (
              <div key={t.id} className="p-8 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-all">
                <div className="flex items-center gap-6">
                   <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                      <Layout size={28} />
                   </div>
                   <div>
                      <h4 className="font-black text-lg text-slate-800 dark:text-white">{t.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                         <div className={`w-2 h-2 rounded-full ${t.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.isActive ? 'Activo' : 'Inactivo'}</span>
                      </div>
                   </div>
                </div>
                <div className="flex items-center gap-3">
                   <PermissionGate module="CORE" sub="STORE_TYPES" action="U" user={user}>
                      <button onClick={() => { setCurrentType(t); setFormData({ name: t.name, isActive: t.isActive }); setShowModal(true); }} className="p-3 bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 rounded-xl hover:scale-110 transition-all">
                        <Edit size={18} />
                      </button>
                   </PermissionGate>
                   <PermissionGate module="CORE" sub="STORE_TYPES" action="D" user={user}>
                      <button onClick={() => handleDelete(t.id)} className="p-3 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-xl hover:scale-110 transition-all">
                        <Trash2 size={18} />
                      </button>
                   </PermissionGate>
                </div>
              </div>
            ))}
            {filteredTypes.length === 0 && (
              <div className="p-20 text-center text-slate-400 opacity-40 italic">No se encontraron categorías.</div>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-3xl z-[9999] flex items-center justify-center p-6">
           <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-[48px] overflow-hidden shadow-2xl animate-in zoom-in duration-300">
              <div className="p-10 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                 <h2 className="text-2xl font-black text-slate-900 dark:text-white">{currentType ? 'Editar' : 'Nuevo'} Tipo</h2>
                 <button onClick={() => setShowModal(false)} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 hover:rotate-90 transition-all">
                   <X size={20} />
                 </button>
              </div>
              <form onSubmit={handleSave} className="p-10 space-y-8">
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Nombre de Categoría</label>
                    <input 
                      required autoFocus
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Ej. Tienda Express, Flagship..."
                      className="w-full p-5 rounded-3xl bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-500 outline-none font-bold text-lg transition-all"
                    />
                 </div>
                 <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
                    <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Disponibilidad</p>
                       <p className="font-bold text-sm dark:text-white">{formData.isActive ? 'Activo en el sistema' : 'Inactivo / Oculto'}</p>
                    </div>
                    <div 
                        onClick={() => setFormData({...formData, isActive: !formData.isActive})}
                        className={`w-14 h-8 rounded-full relative cursor-pointer transition-all ${formData.isActive ? 'bg-indigo-500' : 'bg-slate-300'}`}
                    >
                        <div className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-all ${formData.isActive ? 'left-7' : 'left-1'} shadow-md`}></div>
                    </div>
                 </div>
                 <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-500/10 text-amber-600 rounded-2xl">
                    <Info size={18} className="shrink-0" />
                    <p className="text-[10px] font-bold leading-tight uppercase">Los tipos de tienda permiten segmentar las reglas de personal por formato de local.</p>
                 </div>
                 <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full p-6 bg-indigo-600 text-white rounded-3xl font-black text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-indigo-600/20"
                 >
                   {isSubmitting ? 'Guardando...' : 'Confirmar'}
                 </button>
              </form>
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

export default StoreTypes;
