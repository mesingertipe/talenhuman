import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Boxes, ShieldAlert, Activity } from 'lucide-react';
import api from '../../services/api';

const ModuleActivationModal = ({ isOpen, onClose, companyId, companyName }) => {
  const [modules, setModules] = useState([]);
  const [activeIds, setActiveIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && companyId) {
      loadData();
    }
  }, [isOpen, companyId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [allRes, activeRes] = await Promise.all([
        api.get('/system/modules'),
        api.get(`/system/companies/${companyId}/modules`)
      ]);
      setModules(allRes.data);
      setActiveIds(activeRes.data);
    } catch (error) {
      console.error("Error loading modular data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (moduleId) => {
    setActiveIds(prev => 
      prev.includes(moduleId) 
        ? prev.filter(id => id !== moduleId) 
        : [...prev, moduleId]
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.post(`/system/companies/${companyId}/modules`, activeIds);
      onClose();
    } catch (error) {
      console.error("Error saving modules", error);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <h2 className="text-lg font-bold flex items-center gap-2" style={{ margin: 0 }}>
            <Boxes size={22} className="text-indigo-500" />
            Configuración de Módulos
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer">
            <X size={22} />
          </button>
        </div>

        <div className="modal-body">
          <div className="mb-6">
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 px-2 py-1 rounded">Empresa Seleccionada</span>
            <div className="text-xl font-black mt-1">{companyName}</div>
          </div>

          <p className="text-xs text-slate-500 mb-6 font-bold uppercase tracking-tight">Active los módulos que este tenant tiene permitidos:</p>

          {loading ? (
            <div className="flex justify-center p-8"><div className="loader"></div></div>
          ) : (
            <div className="space-y-3">
              {modules.map(mod => (
                <div 
                  key={mod.id} 
                  onClick={() => handleToggle(mod.id)}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${activeIds.includes(mod.id) ? 'border-indigo-500 bg-indigo-50/30 shadow-md shadow-indigo-100' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeIds.includes(mod.id) ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                      {mod.code === 'CORE' && <Boxes size={20} />}
                      {mod.code === 'ATTENDANCE' && <Activity size={20} />}
                      {mod.code === 'ADMIN' && <ShieldAlert size={20} />}
                    </div>
                    <div>
                      <div className={`font-bold text-sm ${activeIds.includes(mod.id) ? 'text-indigo-900' : 'text-slate-700'}`}>{mod.name}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{mod.code}</div>
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${activeIds.includes(mod.id) ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'}`}>
                    {activeIds.includes(mod.id) && <CheckCircle size={14} />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-premium btn-premium-secondary" disabled={saving}>Cancelar</button>
          <button onClick={handleSave} className="btn-premium btn-premium-primary" disabled={saving || loading}>
            {saving ? <div className="loader"></div> : 'Guardar Activaciones'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModuleActivationModal;
