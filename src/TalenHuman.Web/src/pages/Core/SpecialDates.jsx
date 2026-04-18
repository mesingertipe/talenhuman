import React, { useState, useEffect } from 'react';
import { 
  Calendar, Plus, Trash2, Search, Info, CheckCircle, AlertTriangle, 
  MapPin, Globe, Filter, X, ChevronRight, Sparkles, Database
} from 'lucide-react';
import api from '../../services/api';

const SpecialDates = ({ user }) => {
  const [dates, setDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // ALL, SYSTEM, MANUAL
  const [newDate, setNewDate] = useState({
    date: new Date().toISOString().split('T')[0],
    name: '',
    type: 1 // ManualEvent
  });

  useEffect(() => {
    fetchDates();
  }, []);

  const fetchDates = async () => {
    try {
      setLoading(true);
      const res = await api.get('/predictiveholidays');
      setDates(res.data);
    } catch (err) {
      console.error('Error fetching special dates', err);
    } finally {
      setLoading(false);
    }
  };

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
    <div className="p-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-[1000] tracking-tighter text-slate-900 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Calendar className="text-white" size={24} />
            </div>
            Días Especiales y Festivos
          </h2>
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest pl-1">
            Gestión de estacionalidad para predicción inteligente
          </p>
        </div>
        
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-sm transition-all active:scale-95 shadow-xl shadow-indigo-600/20"
        >
          <Plus size={18} strokeWidth={3} />
          REGISTRAR EVENTO
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-[32px] border border-slate-100 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500">
              <Globe size={24} />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {dates.filter(d => d.isSystem).length}
              </div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Festivos de Ley</div>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-[32px] border border-slate-100 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-500">
              <Sparkles size={24} />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {dates.filter(d => !d.isSystem).length}
              </div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Eventos de Negocio</div>
            </div>
          </div>
        </div>
        <div className="bg-indigo-600 p-6 rounded-[32px] shadow-xl shadow-indigo-600/20 text-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <Database size={24} />
            </div>
            <div>
              <div className="text-2xl font-black">Activo</div>
              <div className="text-[10px] font-black opacity-80 uppercase tracking-widest">Motor de Estacionalidad</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
          <input 
            type="text"
            placeholder="Buscar por nombre de evento..."
            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex bg-slate-50 dark:bg-slate-900 p-1 rounded-2xl">
          <button 
            onClick={() => setFilterType('ALL')}
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterType === 'ALL' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
          >Todos</button>
          <button 
            onClick={() => setFilterType('SYSTEM')}
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterType === 'SYSTEM' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
          >Festivos</button>
          <button 
            onClick={() => setFilterType('MANUAL')}
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterType === 'MANUAL' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
          >Personalizados</button>
        </div>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="h-40 bg-slate-100 dark:bg-slate-800 rounded-3xl animate-pulse" />
          ))
        ) : filteredDates.length === 0 ? (
          <div className="col-span-full py-20 text-center">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-[40px] flex items-center justify-center mx-auto mb-4 text-slate-300">
              <Filter size={40} />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">Sin resultados</h3>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">No hay fechas que coincidan con los filtros</p>
          </div>
        ) : (
          filteredDates.map((d) => (
            <div key={d.id} className={`group bg-white dark:bg-slate-800 rounded-[32px] border transition-all hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1 ${d.isSystem ? 'border-indigo-100 dark:border-indigo-500/20' : 'border-slate-100 dark:border-slate-700'}`}>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${d.isSystem ? 'bg-indigo-500 text-white' : 'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400'}`}>
                    {d.isSystem ? 'Festivo de Ley' : 'Evento Manual'}
                  </div>
                  {!d.isSystem && (
                    <button 
                      onClick={() => handleDelete(d.id)}
                      className="p-2 text-slate-300 hover:text-red-500 transition-colors bg-slate-50 dark:bg-slate-900 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                
                <h4 className="text-lg font-black text-slate-900 dark:text-white leading-tight mb-2 group-hover:text-indigo-600 transition-colors">
                  {d.name}
                </h4>
                
                <div className="flex items-center gap-3 text-slate-400 dark:text-slate-500">
                  <Calendar size={14} className="text-indigo-500" />
                  <span className="text-xs font-black uppercase tracking-widest">
                    {new Date(d.date).toLocaleDateString('es-ES', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </span>
                </div>
              </div>
              
              <div className={`px-6 py-4 bg-slate-50 dark:bg-slate-900/50 rounded-b-[32px] border-t flex items-center justify-between ${d.isSystem ? 'border-indigo-50 dark:border-indigo-500/10' : 'border-slate-100 dark:border-slate-700'}`}>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${d.isSystem ? 'bg-indigo-500 animate-pulse' : 'bg-purple-500'}`} />
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    {d.isSystem ? 'Sincronizado' : 'Personalizado'}
                  </span>
                </div>
                <ChevronRight size={14} className="text-slate-300" />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Info Banner */}
      <div className="mt-12 bg-indigo-500/5 rounded-[40px] p-8 border border-indigo-500/10 flex flex-col md:flex-row items-center gap-6">
        <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-[24px] flex items-center justify-center text-indigo-500 shadow-lg">
          <Info size={32} />
        </div>
        <div>
          <h5 className="text-lg font-black text-indigo-600 dark:text-indigo-400">¿Cómo afecta esto a la IA?</h5>
          <p className="text-sm font-bold text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl">
            El motor predictivo utiliza estas fechas para evitar comparaciones erróneas. Al marcar un día como festivo o especial, la IA buscará datos de otros festivos similares en lugar de usar promedios de días normales, garantizando que tus necesidades de personal sean precisas incluso en picos de demanda.
          </p>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-[40px] shadow-2xl relative z-[1001] animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-[1000] tracking-tighter text-slate-900 dark:text-white">Registrar Evento</h3>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl transition-all">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAdd} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">Nombre del Evento</label>
                  <input 
                    required
                    type="text"
                    placeholder="Ej. Black Friday, Concierto Local, Apertura..."
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white dark:focus:bg-slate-800 transition-all border border-transparent focus:border-indigo-500"
                    value={newDate.name}
                    onChange={(e) => setNewDate({...newDate, name: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">Fecha del Evento</label>
                  <input 
                    required
                    type="date"
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white dark:focus:bg-slate-800 transition-all border border-transparent focus:border-indigo-500"
                    value={newDate.date}
                    onChange={(e) => setNewDate({...newDate, date: e.target.value})}
                  />
                </div>

                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3">
                  <AlertTriangle className="text-amber-500 shrink-0" size={18} />
                  <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 leading-tight">
                    Este evento será visible para toda la compañía y afectará los promedios predictivos de toda la operación.
                  </p>
                </div>

                <div className="pt-2">
                  <button 
                    type="submit"
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-sm transition-all active:scale-95 shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={20} />
                    GUARDAR EVENTO
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpecialDates;
