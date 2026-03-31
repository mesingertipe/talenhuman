import React, { useState, useEffect } from 'react';
import { Shield, Building2, Save, CheckCircle, XCircle, ChevronRight, Activity, Boxes, Settings } from 'lucide-react';
import api from '../../services/api';
import SearchableSelect from '../../components/Shared/SearchableSelect';

const ModulePermissions = () => {
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [modules, setModules] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const actions = [
    { code: 'Read', label: 'Leer', short: 'R' },
    { code: 'Create', label: 'Crear', short: 'C' },
    { code: 'Update', label: 'Editar', short: 'U' },
    { code: 'Delete', label: 'Eliminar', short: 'D' },
    { code: 'Export', label: 'Exportar', short: 'E' },
    { code: 'Approve', label: 'Aprobar', short: 'A' }
  ];

  useEffect(() => {
    const initLoad = async () => {
      try {
        const [compRes, modRes] = await Promise.all([
          api.get('/companies'),
          api.get('/system/modules')
        ]);
        setCompanies(compRes.data);
        setModules(modRes.data);
        
        // Simple roles list for now (could be fetched from API if needed)
        setRoles(['Admin', 'Gerente', 'Distrital', 'RH', 'Empleado']);
      } catch (err) {
        console.error("Error loading initial permission data", err);
      }
    };
    initLoad();
  }, []);

  useEffect(() => {
    if (selectedCompanyId) {
      loadPermissions();
    }
  }, [selectedCompanyId]);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/system/permissions/${selectedCompanyId}`);
      setPermissions(res.data);
    } catch (err) {
      console.error("Error loading permissions", err);
    } finally {
      setLoading(false);
    }
  };

  const getPermStatus = (roleName, moduleId, actionCode) => {
    // Role matching by simple string for this UI
    // In a real scenario, we'd match by RoleId
    const perm = permissions.find(p => p.moduleId === moduleId && p.action === actionCode);
    return perm?.isAllowed || false;
  };

  const togglePermission = async (roleName, moduleId, actionCode) => {
    const currentStatus = getPermStatus(roleName, moduleId, actionCode);
    // Find RoleId from some lookup or just use roleName logic
    // For now, we'll assume we need to handle RoleId correctly from Backend Roles
    // Simplified: we'll fetch roles list with IDs first
    alert("Funcionalidad de guardado en desarrollo - Use el panel de Empresas para activar módulos base.");
  };

  return (
    <div className="page-container animate-in fade-in duration-500" style={{ padding: '2rem 1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3rem', gap: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: '950', color: 'var(--text-main)', margin: 0, letterSpacing: '-0.03em' }}>Matriz de Permisos</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '600', marginTop: '6px' }}>Control granular de acciones por rol y tenant</p>
        </div>

        <div style={{ width: '320px' }}>
          <label className="block text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2 ml-1">Seleccionar Tenant (Empresa)</label>
          <SearchableSelect 
            options={companies}
            value={selectedCompanyId}
            onChange={setSelectedCompanyId}
            placeholder="ELEGIR EMPRESA..."
            icon={Building2}
          />
        </div>
      </div>

      {!selectedCompanyId ? (
        <div className="card text-center" style={{ padding: '8rem 2rem' }}>
          <div className="flex flex-col items-center gap-4 opacity-40">
            <Shield size={64} className="text-indigo-400" />
            <p className="font-black text-xl uppercase tracking-tighter">Seleccione una empresa para gestionar su matriz</p>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
           {modules.map(mod => (
              <div key={mod.id} className="card p-0 overflow-hidden border-2 border-slate-100 dark:border-slate-800">
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                        {mod.code === 'CORE' ? <Boxes size={20}/> : mod.code === 'ATTENDANCE' ? <Activity size={20}/> : <Settings size={20}/>}
                      </div>
                      <div>
                        <h3 className="font-black text-sm uppercase tracking-wider dark:text-white">{mod.name}</h3>
                        <span className="text-[10px] font-bold text-indigo-500">{mod.code}</span>
                      </div>
                   </div>
                   <div className="flex gap-1">
                      {actions.map(a => (
                        <div key={a.short} className="w-8 h-8 rounded-lg bg-slate-200/50 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-500" title={a.label}>{a.short}</div>
                      ))}
                   </div>
                </div>

                <div className="p-4">
                   <table className="w-full">
                      <thead>
                        <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">
                          <th className="pb-4 pl-2">Perfil / Rol</th>
                          {actions.map(a => (
                            <th key={a.code} className="pb-4 text-center">{a.label}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {roles.map(role => (
                          <tr key={role} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                            <td className="py-4 font-black text-sm text-slate-700 dark:text-slate-300 pl-2 flex items-center gap-2">
                              <ChevronRight size={14} className="text-indigo-400" />
                              {role}
                            </td>
                            {actions.map((action, idx) => (
                              <td key={action.code} className="py-4 text-center">
                                <button 
                                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${idx % 2 === 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'} opacity-50 cursor-not-allowed`}
                                  title={`${mod.code} / ${role} / ${action.label}`}
                                >
                                  {idx % 2 === 0 ? <CheckCircle size={18} /> : <XCircle size={18} />}
                                </button>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                   </table>
                </div>
              </div>
           ))}
        </div>
      )}
    </div>
  );
};

export default ModulePermissions;
