import React, { useState, useEffect } from 'react';
import { Shield, Building2, Save, CheckCircle, XCircle, ChevronRight, Activity, Boxes, Settings, Clock, Layout, Fingerprint, MapPin, Users, Briefcase, FileText, Monitor, Palette, Terminal, Search, ArrowLeft, ChevronDown, Check, X } from 'lucide-react';
import api from '../../services/api';
import SearchableSelect from '../../components/Shared/SearchableSelect';

const ModulePermissions = () => {
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [modules, setModules] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Navigation State
  const [selectedModule, setSelectedModule] = useState(null); // { id, code, name }
  const [selectedSubModule, setSelectedSubModule] = useState(null); // { code, name, icon }
  const [expandedRoles, setExpandedRoles] = useState([]);

  const subModulesByModule = {
    'CORE': [
      { code: 'BRANDS', name: 'Marcas', icon: Palette, desc: 'Gestión de marcas corporativas' },
      { code: 'CITIES', name: 'Ciudades', icon: MapPin, desc: 'Configuración geográfica de ciudades' },
      { code: 'DISTRICTS', name: 'Distritos', icon: Layout, desc: 'Zonificación y distritos de ventas' },
      { code: 'PROFILES', name: 'Cargos/Perfiles', icon: Briefcase, desc: 'Definición de cargos operativos' },
      { code: 'STORES', name: 'Tiendas', icon: Building2, desc: 'Administración de puntos de venta' },
      { code: 'EMPLOYEES', name: 'Empleados', icon: Users, desc: 'Base de datos de capital humano' },
      { code: 'SCHEDULES', name: 'Jornadas Base', icon: Clock, desc: 'Configuración de horarios estándar' }
    ],
    'OPERATIONS': [
      { code: 'SHIFTS', name: 'Programación Turnos', icon: Activity, desc: 'Malla horaria y asignaciones' },
      { code: 'RECORDS', name: 'Marcaciones/Asistencia', icon: Fingerprint, desc: 'Registro de entradas y salidas' },
      { code: 'NOVELTIES', name: 'Gestión Novedades', icon: FileText, desc: 'Procesamiento de novedades e incidencias' }
    ],
    'ADVANCED': [
      { code: 'MONITORING', name: 'Monitoreo Tiempo Real', icon: Monitor, desc: 'Panel de control de asistencia viva' },
      { code: 'TEMPLATES', name: 'Plantillas Novedades', icon: Palette, desc: 'Diseño de tipos de novedades' },
      { code: 'NOVELTY_CONFIG', name: 'Configuración Novedades', icon: Settings, desc: 'Reglas de negocio para incidencias' }
    ],
    'SYSTEM': [
      { code: 'USERS', name: 'Usuarios Sistema', icon: Users, desc: 'Cuentas de acceso a la plataforma' },
      { code: 'PERMISSIONS', name: 'Matriz Permisos', icon: Shield, desc: 'Configuración de seguridad granular' },
      { code: 'AUDIT', name: 'Logs Auditoría', icon: Terminal, desc: 'Trazabilidad de acciones del sistema' },
      { code: 'COMPANIES', name: 'Gestión Empresas', icon: Building2, desc: 'Configuración de tenants multi-empresa' },
      { code: 'SYSTEM_CONFIG', name: 'Configuración Global', icon: Settings, desc: 'Parámetros técnicos del núcleo' }
    ]
  };

  const actions = [
    { code: 'Read', label: 'Leer', short: 'R', value: 0 },
    { code: 'Create', label: 'Crear', short: 'C', value: 1 },
    { code: 'Update', label: 'Editar', short: 'U', value: 2 },
    { code: 'Delete', label: 'Eliminar', short: 'D', value: 3 },
    { code: 'Export', label: 'Exportar', short: 'E', value: 4 },
    { code: 'Approve', label: 'Aprobar', short: 'A', value: 5 }
  ];

  useEffect(() => {
    const initLoad = async () => {
      try {
        const [compRes, modRes, roleRes] = await Promise.all([
          api.get('/companies'),
          api.get('/system/modules'),
          api.get('/system/roles')
        ]);
        setCompanies(compRes.data);
        setModules(modRes.data);
        setRoles(roleRes.data.filter(r => r.name !== 'SuperAdmin'));
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

  const getPermStatus = (roleId, moduleId, subModuleCode, actionValue) => {
    const perm = permissions.find(p => 
      p.roleId === roleId && 
      p.moduleId === moduleId && 
      p.subModuleCode === subModuleCode && 
      p.action === actionValue
    );
    return perm?.isAllowed || false;
  };

  const togglePermission = async (roleId, moduleId, subModuleCode, action) => {
    const currentStatus = getPermStatus(roleId, moduleId, subModuleCode, action.value);
    const newStatus = !currentStatus;

    const updatedPerms = [...permissions];
    const index = updatedPerms.findIndex(p => 
      p.roleId === roleId && 
      p.moduleId === moduleId && 
      p.subModuleCode === subModuleCode && 
      p.action === action.value
    );
    
    if (index >= 0) {
      updatedPerms[index].isAllowed = newStatus;
    } else {
      updatedPerms.push({ roleId, moduleId, subModuleCode, action: action.value, isAllowed: newStatus });
    }
    setPermissions(updatedPerms);

    try {
      await api.post('/system/permissions', {
        companyId: selectedCompanyId,
        roleId,
        moduleId,
        subModuleCode,
        action: action.value,
        isAllowed: newStatus
      });
    } catch (err) {
      console.error("Error updating permission", err);
      loadPermissions();
    }
  };

  const toggleRoleAccordion = (roleId) => {
    setExpandedRoles(prev => 
      prev.includes(roleId) ? prev.filter(id => id !== roleId) : [...prev, roleId]
    );
  };

  // UI Components
  const ModuleCard = ({ mod }) => {
    const subCount = subModulesByModule[mod.code]?.length || 0;
    return (
      <button 
        onClick={() => setSelectedModule(mod)}
        className="group relative overflow-hidden card p-8 text-left hover:-translate-y-2 transition-all duration-300 border-2 border-transparent hover:border-indigo-500/30"
        style={{ background: 'var(--card-bg)' }}
      >
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
          {mod.code === 'CORE' ? <Boxes size={120}/> : mod.code === 'OPERATIONS' ? <Activity size={120}/> : mod.code === 'SYSTEM' ? <Settings size={120}/> : <Shield size={120}/>}
        </div>
        <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xl shadow-indigo-200 dark:shadow-none mb-6 group-hover:scale-110 transition-transform">
          {mod.code === 'CORE' ? <Boxes size={32}/> : mod.code === 'OPERATIONS' ? <Activity size={32}/> : mod.code === 'SYSTEM' ? <Settings size={32}/> : <Shield size={32}/>}
        </div>
        <h3 className="text-xl font-black uppercase tracking-tight mb-2 dark:text-white">{mod.name}</h3>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-black bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-slate-500 uppercase tracking-widest">{subCount} OPCIONES</span>
          <ArrowLeft size={16} className="rotate-180 text-indigo-500 group-hover:translate-x-2 transition-transform" />
        </div>
      </button>
    );
  };

  return (
    <div className="page-container animate-in fade-in duration-500" style={{ padding: '2rem 1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between mb-12 gap-8">
        <div>
           {selectedModule ? (
             <button 
                onClick={() => { setSelectedModule(null); setSelectedSubModule(null); }}
                className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest mb-4 hover:gap-3 transition-all"
             >
                <ArrowLeft size={16}/> Volver a Módulos
             </button>
           ) : null}
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
            {selectedModule ? selectedModule.name : 'Configuración de Permisos'}
          </h1>
          <p className="text-sm font-bold text-slate-400 mt-2">
            Matriz de Seguridad Elite V12 <span className="mx-2">/</span> 
            {selectedModule ? `Gestionando: ${selectedModule.code}` : 'Seleccione un módulo principal'}
          </p>
        </div>

        <div className="w-[340px]">
          <label className="block text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2 ml-1">Tenant Destino</label>
          <SearchableSelect 
            options={companies}
            value={selectedCompanyId}
            onChange={setSelectedCompanyId}
            placeholder="SELECCIONAR EMPRESA..."
            icon={Building2}
          />
        </div>
      </div>

      {!selectedCompanyId ? (
        <div className="card text-center py-32 opacity-50 flex flex-col items-center">
          <Shield size={80} className="text-indigo-200 mb-6" />
          <p className="text-2xl font-black text-slate-300 uppercase tracking-tighter">Debe seleccionar una empresa para comenzar</p>
        </div>
      ) : (
        <>
          {/* Vista 1: Tarjetas de Módulos */}
          {!selectedModule && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {modules.map(mod => <ModuleCard key={mod.id} mod={mod} />)}
            </div>
          )}

          {/* Vista 2 & 3: Detalle de Módulo y Sub-módulos */}
          {selectedModule && (
            <div className="flex gap-10 animate-in slide-in-from-right-10 duration-500">
              {/* Sidebar de Sub-módulos */}
              <div className="w-80 flex-shrink-0 space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 px-2">Sub-módulos Disponibles</p>
                {subModulesByModule[selectedModule.code]?.map(sub => (
                  <button
                    key={sub.code}
                    onClick={() => setSelectedSubModule(sub)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${selectedSubModule?.code === sub.code ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                  >
                    <div className="flex items-center gap-3">
                      <sub.icon size={18} className={selectedSubModule?.code === sub.code ? 'text-white' : 'text-indigo-500'} />
                      <span className="font-black text-sm uppercase tracking-wide">{sub.name}</span>
                    </div>
                    {selectedSubModule?.code === sub.code && <ArrowLeft size={16} className="rotate-180" />}
                  </button>
                ))}
              </div>

              {/* Detalle Central: Roles y Acordeones */}
              <div className="flex-1 space-y-6">
                {!selectedSubModule ? (
                  <div className="card h-full flex flex-col items-center justify-center p-20 text-center opacity-40 border-dashed border-4 border-slate-200 dark:border-slate-800">
                    <Search size={48} className="mb-4" />
                    <h4 className="text-xl font-black uppercase tracking-tight">Seleccione una Opción</h4>
                    <p className="text-xs font-bold text-slate-500 mt-2">Elija un sub-módulo de la izquierda para gestionar sus perfiles</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="card p-8 bg-gradient-to-br from-indigo-600 to-indigo-900 text-white border-0 shadow-2xl shadow-indigo-200 dark:shadow-none">
                       <div className="flex items-center gap-4 mb-2">
                          <selectedSubModule.icon size={28} />
                          <h2 className="text-2xl font-black uppercase tracking-tight">{selectedSubModule.name}</h2>
                       </div>
                       <p className="indigo-100/70 text-xs font-bold tracking-wider">{selectedSubModule.desc}</p>
                    </div>

                    <div className="space-y-4">
                      {roles.map(role => {
                        const isExpanded = expandedRoles.includes(role.id);
                        return (
                          <div key={role.id} className="card p-0 overflow-hidden border-2 border-slate-100 dark:border-slate-800 hover:border-indigo-100 dark:hover:border-indigo-900 transition-all">
                             <button
                               onClick={() => toggleRoleAccordion(role.id)}
                               className="w-full flex items-center justify-between p-6 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                             >
                                <div className="flex items-center gap-4">
                                   <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isExpanded ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                      <Users size={20} />
                                   </div>
                                   <div className="text-left">
                                      <h4 className="font-black text-sm uppercase tracking-wider dark:text-white">{role.name}</h4>
                                      <span className="text-[10px] font-bold text-slate-400 tracking-widest">PERFIL OPERATIVO</span>
                                   </div>
                                </div>
                                <ChevronDown size={20} className={`text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                             </button>

                             {isExpanded && (
                               <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-2">
                                  <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-6">Configuración de Acciones (CRUD+)</p>
                                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                     {actions.map(action => {
                                       const isAllowed = getPermStatus(role.id, selectedModule.id, selectedSubModule.code, action.value);
                                       return (
                                         <button
                                           key={action.code}
                                           onClick={() => togglePermission(role.id, selectedModule.id, selectedSubModule.code, action)}
                                           className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${isAllowed ? 'bg-white dark:bg-slate-900 border-emerald-500/20 text-emerald-600 shadow-sm' : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-400 opacity-60'}`}
                                         >
                                            <div className="flex items-center gap-3">
                                               <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isAllowed ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'}`}>
                                                  {isAllowed ? <Check size={16} strokeWidth={3} /> : <X size={16} strokeWidth={3} />}
                                               </div>
                                               <span className="font-black text-[10px] uppercase tracking-widest">{action.label}</span>
                                            </div>
                                         </button>
                                       );
                                     })}
                                  </div>
                               </div>
                             )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ModulePermissions;
