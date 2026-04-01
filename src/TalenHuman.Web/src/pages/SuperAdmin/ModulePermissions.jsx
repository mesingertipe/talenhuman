import React, { useState, useEffect } from 'react';
import { Shield, Building2, Save, CheckCircle, XCircle, ChevronRight, Activity, Boxes, Settings, Clock, Layout, Fingerprint, MapPin, Users, Briefcase, FileText, Monitor, Palette, Terminal, Search, ArrowLeft, ChevronDown, Check, X } from 'lucide-react';
import api from '../../services/api';
import SearchableSelect from '../../components/Shared/SearchableSelect';

const ModulePermissions = ({ user }) => {
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [modules, setModules] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Navigation State
  const [selectedModule, setSelectedModule] = useState(null); 
  const [selectedSubModule, setSelectedSubModule] = useState(null); 
  const [expandedRoles, setExpandedRoles] = useState([]);

  // Definimos los sub-módulos para cada categoría principal.
  // Incluimos tanto los códigos nuevos (OPERATIONS, SYSTEM) como los legacy (ATTENDANCE, ADMIN) 
  // para mayor resiliencia.
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
    'ATTENDANCE': [
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
    ],
    'ADMIN': [
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
        console.error("Error loading initial data", err);
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
      p.roleId === roleId && p.moduleId === moduleId && 
      p.subModuleCode === subModuleCode && p.action === action.value
    );
    
    if (index >= 0) {
      updatedPerms[index].isAllowed = newStatus;
    } else {
      updatedPerms.push({ roleId, moduleId, subModuleCode, action: action.value, isAllowed: newStatus });
    }
    setPermissions(updatedPerms);

    try {
      await api.post('/system/permissions', {
        companyId: selectedCompanyId, roleId, moduleId, subModuleCode, action: action.value, isAllowed: newStatus
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

  const ModuleCard = ({ mod }) => {
    const subCount = subModulesByModule[mod.code]?.length || 0;
    const Icon = (mod.code === 'CORE') ? Boxes : 
                 (mod.code === 'OPERATIONS' || mod.code === 'ATTENDANCE') ? Activity : 
                 (mod.code === 'SYSTEM' || mod.code === 'ADMIN') ? Settings : Shield;
    
    return (
      <button 
        onClick={() => setSelectedModule(mod)}
        className="group card p-8 text-left hover:-translate-y-2 transition-all duration-300 border-2 border-transparent hover:border-indigo-500/30 flex flex-col gap-4"
        style={{ background: 'var(--card-bg)' }}
      >
        <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-100 dark:shadow-none transition-transform group-hover:scale-110">
          <Icon size={28}/>
        </div>
        <div>
          <h3 className="text-lg font-black uppercase tracking-tight mb-1 dark:text-white">{mod.name}</h3>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{subCount} OPCIONES</span>
            <ChevronRight size={18} className="text-indigo-500 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="page-container animate-in fade-in duration-500" style={{ padding: '2rem 1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between mb-10 gap-8">
        <div>
           {selectedModule && (
             <button 
                onClick={() => { setSelectedModule(null); setSelectedSubModule(null); }}
                className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest mb-4 hover:gap-3 transition-all"
             >
                <ArrowLeft size={16}/> Volver a Módulos
             </button>
           )}
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
            {selectedModule ? selectedModule.name : 'Matriz de Permisos'}
          </h1>
          <p className="text-xs font-bold text-slate-400 mt-1">
             {selectedModule ? `Gestionando: ${selectedModule.code}` : 'Gestión granular por empresa y rol'}
          </p>
        </div>

        <div className="w-[320px]">
          <label className="block text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2 ml-1">Empresa Destino</label>
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
        <div className="card text-center py-24 bg-slate-50/50 dark:bg-slate-900/50 border-dashed border-2 flex flex-col items-center">
          <Shield size={64} className="text-slate-200 mb-4" />
          <p className="text-xl font-black text-slate-300 uppercase tracking-tighter">Seleccione una empresa para editar permisos</p>
        </div>
      ) : (
        <>
          {!selectedModule ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {modules.map(mod => <ModuleCard key={mod.id} mod={mod} />)}
            </div>
          ) : (
            <div className="flex gap-8 flex-col lg:flex-row animate-in slide-in-from-right-4 duration-500">
              {/* Opción Lateral */}
              <div className="lg:w-72 flex-shrink-0 space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-2">Sub-módulos Disponibles</p>
                {subModulesByModule[selectedModule.code]?.map(sub => (
                  <button
                    key={sub.code}
                    onClick={() => setSelectedSubModule(sub)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${selectedSubModule?.code === sub.code ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-none' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700'}`}
                  >
                    <div className="flex items-center gap-3">
                      <sub.icon size={18} className={selectedSubModule?.code === sub.code ? 'text-white' : 'text-indigo-500'} />
                      <span className="font-black text-xs uppercase tracking-wide">{sub.name}</span>
                    </div>
                    {selectedSubModule?.code === sub.code && <Check size={16} />}
                  </button>
                ))}
              </div>

              {/* Contenido Central */}
              <div className="flex-1 space-y-6">
                {!selectedSubModule ? (
                  <div className="card h-full flex flex-col items-center justify-center p-20 text-center opacity-30 border-dashed border-2 border-slate-300">
                    <Search size={40} className="mb-4" />
                    <h4 className="text-lg font-black uppercase tracking-tight">Seleccione una opción</h4>
                    <p className="text-[10px] font-bold text-slate-500 mt-1">Elija un sub-módulo de la izquierda para gestionar sus perfiles</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="card p-6 bg-slate-900 text-white border-0">
                       <div className="flex items-center gap-4 mb-1">
                          <selectedSubModule.icon size={22} className="text-indigo-400" />
                          <h2 className="text-xl font-black uppercase tracking-tight">{selectedSubModule.name}</h2>
                       </div>
                       <p className="text-slate-400 text-[10px] font-bold tracking-widest">{selectedSubModule.desc?.toUpperCase()}</p>
                    </div>

                    <div className="space-y-3">
                      {roles.map(role => {
                        const isExpanded = expandedRoles.includes(role.id);
                        return (
                          <div key={role.id} className="card p-0 overflow-hidden border border-slate-100 dark:border-slate-800 transition-all">
                             <button
                               onClick={() => toggleRoleAccordion(role.id)}
                               className="w-full flex items-center justify-between p-5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                             >
                                <div className="flex items-center gap-4">
                                   <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isExpanded ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                      <Users size={18} />
                                   </div>
                                   <div className="text-left">
                                      <h4 className="font-black text-xs uppercase tracking-wider dark:text-white">{role.name}</h4>
                                      <span className="text-[9px] font-bold text-slate-400 tracking-tighter uppercase">Rol operativo</span>
                                   </div>
                                </div>
                                <ChevronDown size={18} className={`text-slate-300 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                             </button>

                             {isExpanded && (
                               <div className="p-5 bg-slate-50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-800">
                                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
                                     {actions.map(action => {
                                       const isAllowed = getPermStatus(role.id, selectedModule.id, selectedSubModule.code, action.value);
                                       return (
                                         <button
                                           key={action.code}
                                           onClick={() => togglePermission(role.id, selectedModule.id, selectedSubModule.code, action)}
                                           className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${isAllowed ? 'bg-white dark:bg-slate-900 border-emerald-500/20 text-emerald-600 shadow-sm' : 'bg-transparent border-slate-100 dark:border-slate-800 text-slate-400 opacity-50 hover:bg-white dark:hover:bg-slate-800'}`}
                                         >
                                            {isAllowed ? <Check size={14} strokeWidth={3} /> : <X size={14} strokeWidth={3} />}
                                            <span className="font-black text-[9px] uppercase tracking-widest">{action.label}</span>
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
