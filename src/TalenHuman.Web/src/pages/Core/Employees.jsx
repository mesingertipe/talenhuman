import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Edit, X, User as UserIcon, Mail, Tag, Store, 
  FileSpreadsheet, AlertCircle, Hash, Shield, CheckCircle,
  Search, Calendar, ToggleRight, ToggleLeft, Briefcase, Clock, UserPlus, Download, MapPin
} from 'lucide-react';
import * as XLSX from 'xlsx';
import api from '../../services/api';
import BulkImportModal from '../../components/Shared/BulkImportModal';
import SearchableSelect from '../../components/Shared/SearchableSelect';
import { useTableData } from '../../hooks/useTableData';
import Pagination from '../../components/Shared/Pagination';
import { useTheme } from '../../context/ThemeContext';
import HelpIcon from '../../components/Shared/HelpIcon';

const Employees = ({ user }) => {
  const { isDarkMode } = useTheme();
  const activeColors = {
    bg: isDarkMode ? '#0f172a' : '#f8fafc',
    card: isDarkMode ? '#1e293b' : '#ffffff',
    border: isDarkMode ? '#334155' : '#f1f5f9',
    textMain: isDarkMode ? '#f1f5f9' : '#1e293b',
    textMuted: isDarkMode ? '#94a3b8' : '#64748b',
    accent: '#4f46e5',
    accentSoft: isDarkMode ? 'rgba(79, 70, 229, 0.15)' : '#eef2ff'
  };

  const [employees, setEmployees] = useState([]);
  const [stores, setStores] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [jornadas, setJornadas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    identificationNumber: '',
    birthDate: '',
    storeId: '',
    profileId: '',
    jornadaId: '',
    dateOfEntry: new Date().toISOString().split('T')[0],
    dailySalary: 0,
    isActive: true,
    mustChangePassword: false
  });

  const { 
    data: currentEmployees, 
    searchTerm, 
    setSearchTerm, 
    currentPage, 
    setCurrentPage, 
    totalPages, 
    totalItems, 
    itemsPerPage, 
    setItemsPerPage 
  } = useTableData(employees, ['firstName', 'lastName', 'identificationNumber', 'storeName', 'profileName', 'jornadaNombre', 'email']);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [empRes, storeRes, profileRes, jornadaRes] = await Promise.all([
        api.get('/employees'),
        api.get('/stores'),
        api.get('/profiles'),
        api.get('/jornadas')
      ]);
      
      setEmployees(empRes.data);
      
      const isManager = user?.roles?.includes('Gerente');
      const isSupervisor = user?.roles?.includes('Supervisor');
      let filteredStores = storeRes.data;

      if (isManager && user?.storeId) {
          filteredStores = storeRes.data.filter(s => s.id === user.storeId);
      } else if (isSupervisor && user?.storeIds && user.storeIds.length > 0) {
          filteredStores = storeRes.data.filter(s => user.storeIds.includes(s.id));
      }

      setStores(filteredStores);
      setProfiles(profileRes.data);
      setJornadas(jornadaRes.data);
    } catch (err) {
      setToast({ show: true, message: 'Error al cargar datos iniciales', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      if (currentEmployee) {
        const payload = { ...formData };
        if (payload.jornadaId === '') payload.jornadaId = null;
        if (payload.profileId === '') payload.profileId = null;
        if (payload.storeId === '') payload.storeId = null;
        
        await api.put(`/employees/${currentEmployee.id}`, payload);
        showToast("Colaborador actualizado con éxito");
      } else {
        await api.post('/employees', formData);
        showToast("Nuevo colaborador registrado");
      }
      setShowModal(false);
      fetchInitialData();
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data || "Error al procesar el registro";
      showToast(errorMsg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await api.delete(`/employees/${currentEmployee.id}`);
      showToast("Registro inactivado correctamente");
      setShowConfirm(false);
      fetchInitialData();
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data || "Error al eliminar colaborador";
      showToast(errorMsg, "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportExcel = () => {
    const dataToExport = employees.map(emp => ({
      Nombre: emp.firstName,
      Apellidos: emp.lastName,
      Identificación: emp.identificationNumber,
      Sede: emp.storeName,
      Cargo: emp.profileName,
      Jornada: emp.jornadaNombre,
      'F. Ingreso': emp.dateOfEntry?.split('T')[0],
      Estado: emp.isActive ? 'Activo' : 'Inactivo',
      Email: emp.email || 'N/A'
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Colaboradores");
    XLSX.writeFile(wb, `Reporte_Empleados_${new Date().toISOString().split('T')[0]}.xlsx`);
    showToast("Reporte de nómina generado");
  };

  return (
    <div className="page-container animate-in fade-in duration-500" style={{ padding: '2rem 1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Elite Header & Toolbar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4rem', gap: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: '950', color: activeColors.textMain, margin: 0, letterSpacing: '-0.03em' }}>Gestión de empleados</h1>
          <p style={{ color: activeColors.textMuted, fontSize: '0.9rem', fontWeight: '600', marginTop: '6px' }}>Administración de nómina y ficha de colaboradores</p>
        </div>

        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', width: '100%', maxWidth: '850px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} className="absolute left-4 top-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por nombre, ID, sede, cargo o correo..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-premium pl-12"
              style={{ margin: 0, borderRadius: '20px', height: '56px' }}
            />
          </div>
          <div className="flex gap-3">
            <button 
                onClick={handleExportExcel}
                className="btn-premium btn-premium-secondary"
                style={{ borderRadius: '20px', height: '56px', padding: '0 20px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b' }}
                title="Descargar Reporte"
            >
                <Download size={18} />
            </button>
            <button 
              onClick={() => setShowImport(true)}
              className="btn-premium btn-premium-secondary"
              style={{ borderRadius: '20px', height: '56px', padding: '0 20px' }}
              title="Carga masiva"
            >
              <FileSpreadsheet size={18} />
            </button>
            <button 
              onClick={() => { 
                  setCurrentEmployee(null); 
                  setFormData({ 
                      firstName: '', lastName: '', 
                      identificationNumber: '', birthDate: '',
                      storeId: stores[0]?.id || '', 
                      profileId: profiles[0]?.id || '',
                      jornadaId: jornadas[0]?.id || '',
                      email: '', isActive: true, mustChangePassword: false
                  }); 
                  setShowModal(true); 
              }}
              className="btn-premium btn-premium-primary whitespace-nowrap"
              style={{ borderRadius: '20px', height: '56px', padding: '0 25px' }}
            >
              <UserPlus size={18} /> <span className="hidden md:inline">Nuevo Colaborador</span>
            </button>
          </div>
        </div>
      </div>

      <div className="card flex flex-col" style={{ padding: 0, overflow: 'hidden', minHeight: '60vh' }}>
        {loading ? (
          <div style={{ padding: '6rem', textAlign: 'center' }}>
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Sincronizando Nómina...</p>
            </div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', background: 'var(--bg-main)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', trackingWider: '0.1em' }}>Colaborador</th>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', trackingWider: '0.1em' }}>Identificación</th>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', trackingWider: '0.1em' }}>Sede / Cargo / Jornada</th>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', trackingWider: '0.1em' }}>Estado</th>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', trackingWider: '0.1em', textAlign: 'right' }}>Gestión</th>
              </tr>
            </thead>
            <tbody>
              {currentEmployees.map((emp) => (
                <tr key={emp.id} style={{ borderBottom: '1px solid var(--border)' }} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div className="w-11 h-11 rounded-2xl bg-indigo-600 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-black text-xs shadow-lg shadow-indigo-500/20 uppercase">
                        {emp.firstName[0]}{emp.lastName[0]}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 dark:text-white leading-tight">{emp.firstName} {emp.lastName}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">{emp.email || 'Sin correo registrado'}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-muted)', fontWeight: '700', fontSize: '0.85rem' }}>{emp.identificationNumber}</td>
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <div className="font-bold text-slate-700 dark:text-slate-200 text-sm leading-none mb-1.5">{emp.storeName || 'Sede no asignada'}</div>
                    <div className="flex flex-col gap-1.5 mt-1">
                        <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                          <Briefcase size={12} className="opacity-70" />
                          {emp.profileName || 'Sin cargo'}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                          <Calendar size={12} className="opacity-70" />
                          {emp.jornadaNombre || 'Sin jornada'}
                        </div>
                    </div>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <span style={{ 
                      padding: '0.35rem 0.75rem', 
                      background: emp.isActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                      color: emp.isActive ? '#10b981' : '#ef4444', 
                      borderRadius: '9999px', 
                      fontSize: '0.72rem', 
                      fontWeight: '800',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      textTransform: 'uppercase'
                    }}>
                      {emp.isActive ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                      {emp.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                    <button 
                      onClick={() => { 
                        setCurrentEmployee(emp); 
                        setFormData({ 
                          ...emp, 
                          dailySalary: emp.dailySalary || 0,
                          mustChangePassword: false 
                        }); 
                        setShowModal(true); 
                      }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: '1rem', color: '#6366f1' }}
                      className="hover:scale-110 transition-transform dark:text-indigo-400"
                    >
                      <Edit size={18} />
                    </button>
                    <button 
                      onClick={() => { setCurrentEmployee(emp); setShowConfirm(true); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                      className="hover:scale-110 transition-transform dark:text-red-400 font-bold"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {currentEmployees.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: '5rem', textAlign: 'center' }}>
                    <div className="flex flex-col items-center gap-2 opacity-30">
                      <UserIcon size={58} className="text-slate-400" />
                      <p className="font-bold text-lg dark:text-slate-400">No se encontraron colaboradores.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
        {!loading && (
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content shadow-2xl animate-in zoom-in duration-300" style={{ maxWidth: '820px', borderRadius: '32px' }}>
            <div className="modal-header" style={{ padding: '2.5rem 2.5rem 1rem', border: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div style={{ width: '52px', height: '52px', background: activeColors.accentSoft, color: activeColors.accent, borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', shadow: '0 4px 12px rgba(79, 70, 229, 0.1)' }}>
                  {currentEmployee ? <Edit size={24} /> : <UserPlus size={24} />}
                </div>
                <div>
                  <h2 className="text-2xl font-black dark:text-white" style={{ margin: 0, letterSpacing: '-0.03em' }}>
                    {currentEmployee ? 'Ficha de Colaborador' : 'Vincular Colaborador'}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Gestión de talento y nómina administrativa</p>
                </div>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-all bg-slate-50 dark:bg-slate-800 border-none cursor-pointer p-2.5 rounded-full hover:rotate-90"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSave}>
              <div className="modal-body" style={{ padding: '1.5rem 2.5rem 2.5rem' }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-10">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3.5 px-1">Nombres del Colaborador *</label>
                    <div className="relative group">
                      <UserIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                      <input 
                        required 
                        value={formData.firstName} 
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} 
                        className="w-full p-4 pl-12 rounded-2xl border-slate-200 bg-slate-50/50 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-sm shadow-sm"
                        placeholder="Nombres..."
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3.5 px-1">Apellidos Completos *</label>
                    <div className="relative group">
                      <UserIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                      <input 
                        required 
                        value={formData.lastName} 
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} 
                        className="w-full p-4 pl-12 rounded-2xl border-slate-200 bg-slate-50/50 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-sm shadow-sm"
                        placeholder="Apellidos..."
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3.5 px-1">Documento Identidad *</label>
                    <div className="relative group">
                      <Hash size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                      <input 
                        required 
                        value={formData.identificationNumber} 
                        onChange={(e) => setFormData({ ...formData, identificationNumber: e.target.value })} 
                        className="w-full p-4 pl-12 rounded-2xl border-slate-200 bg-slate-50/50 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-sm shadow-sm"
                        placeholder="Cédula o ID..."
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3.5 px-1">Fecha de Nacimiento *</label>
                    <div className="relative group">
                      <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                      <input 
                        required 
                        type="date" 
                        value={formData.birthDate?.split('T')[0] || ''} 
                        onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })} 
                        className="w-full p-4 pl-12 rounded-2xl border-slate-200 bg-slate-50/50 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-sm shadow-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3.5 px-1">Fecha de Ingreso *</label>
                    <div className="relative group">
                      <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                      <input 
                        required 
                        type="date" 
                        value={formData.dateOfEntry?.split('T')[0] || ''} 
                        onChange={(e) => setFormData({ ...formData, dateOfEntry: e.target.value })} 
                        className="w-full p-4 pl-12 rounded-2xl border-slate-200 bg-slate-50/50 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-sm shadow-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <SearchableSelect
                      label="Sede Principal / Centro de Costos"
                      options={stores.map(s => ({ value: s.id, label: s.name }))}
                      value={formData.storeId}
                      onChange={(val) => setFormData({ ...formData, storeId: val })}
                      placeholder="Seleccionar sede..."
                      icon={Store}
                      required
                    />
                  </div>
                  <div>
                    <SearchableSelect
                      label="Cargo u Ocupación"
                      options={profiles.map(p => ({ value: p.id, label: p.name }))}
                      value={formData.profileId}
                      onChange={(val) => setFormData({ ...formData, profileId: val })}
                      placeholder="Seleccionar perfil..."
                      icon={Shield}
                      required
                    />
                  </div>
                  <div>
                    <SearchableSelect
                      label="Esquema de Jornada"
                      options={jornadas.map(j => ({ value: j.id, label: j.nombre }))}
                      value={formData.jornadaId}
                      onChange={(val) => setFormData({ ...formData, jornadaId: val })}
                      placeholder="Seleccionar jornada..."
                      icon={Clock}
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3.5 px-1">Salario Diario (Moneda Local) *</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-600 font-black text-lg">$</div>
                      <input 
                        type="number"
                        required 
                        value={formData.dailySalary} 
                        onChange={(e) => setFormData({ ...formData, dailySalary: e.target.value })} 
                        placeholder="0.00"
                        className="w-full p-4 pl-10 rounded-2xl border-slate-200 bg-slate-50/50 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-black text-sm shadow-sm"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
                  <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-inner">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${formData.isActive ? 'bg-emerald-500 text-white' : 'bg-slate-200'}`}>
                           {formData.isActive ? <CheckCircle size={22} /> : <AlertCircle size={22} />}
                        </div>
                        <div>
                          <p className="font-black text-slate-800 dark:text-white text-sm">Estado Activo</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-tighter">Vigencia en nómina</p>
                        </div>
                    </div>
                    <label className="premium-switch">
                        <input 
                            type="checkbox" 
                            checked={formData.isActive}
                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        />
                        <span className="premium-switch-slider"></span>
                    </label>
                  </div>

                  <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-inner">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${formData.mustChangePassword ? 'bg-indigo-500 text-white' : 'bg-slate-200'}`}>
                           <Clock size={22} />
                        </div>
                        <div>
                          <p className="font-black text-slate-800 dark:text-white text-sm">Reset de Clave</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-tighter">Obligar al ingresar</p>
                        </div>
                    </div>
                    <label className="premium-switch">
                        <input 
                            type="checkbox" 
                            checked={formData.mustChangePassword}
                            onChange={(e) => setFormData({ ...formData, mustChangePassword: e.target.checked })}
                        />
                        <span className="premium-switch-slider"></span>
                    </label>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex items-start gap-4 mt-8">
                  <Shield size={22} className="text-indigo-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-indigo-700 dark:text-indigo-400 font-bold leading-relaxed uppercase tracking-wider">
                    <strong>SEGURIDAD:</strong> Al vincular al colaborador, se le asignará acceso automático al portal de autoservicio basado en su número de identificación como usuario inicial.
                  </p>
                </div>
              </div>

              <div className="modal-footer" style={{ padding: '1rem 2.5rem 2.5rem', border: 'none' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-premium btn-premium-secondary" style={{ height: '56px', borderRadius: '20px', flex: 1 }} disabled={isSubmitting}>
                  Cerrar
                </button>
                <button type="submit" className="btn-premium btn-premium-primary" style={{ height: '56px', borderRadius: '20px', flex: 2 }} disabled={isSubmitting}>
                  {isSubmitting ? <div className="loader"></div> : (currentEmployee ? 'Guardar Cambios' : 'Confirmar Vinculación')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showConfirm && (
        <div className="modal-overlay">
          <div className="modal-content shadow-2xl" style={{ maxWidth: '440px', borderRadius: '32px' }}>
            <div className="modal-body p-10 text-center">
              <div className="mb-8 bg-red-50 dark:bg-red-500/20 text-red-500 w-24 h-24 rounded-full flex items-center justify-center mx-auto shadow-lg">
                <Trash2 size={48} />
              </div>
              <h2 className="text-2xl font-black mb-3 dark:text-white">¿Desvincular colaborador?</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-10 font-medium leading-relaxed">
                Estás a punto de inactivar a <strong>{currentEmployee?.firstName} {currentEmployee?.lastName}</strong>. Se conservará su histórico laboral para fines legales y auditoría.
              </p>
              <div className="flex gap-4">
                <button onClick={() => setShowConfirm(false)} className="btn-premium btn-premium-secondary flex-1" style={{ borderRadius: '16px' }} disabled={isDeleting}>
                  Cancelar
                </button>
                <button onClick={handleDelete} className="btn-premium btn-premium-danger flex-1" style={{ borderRadius: '16px' }} disabled={isDeleting}>
                  {isDeleting ? <div className="loader"></div> : 'Confirmar Baja'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast.show && (
        <div className="toast-container">
          <div className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>
            {toast.type === 'success' ? <CheckCircle size={20} className="text-emerald-500" /> : <AlertCircle size={20} className="text-red-500" />}
            {toast.message}
          </div>
        </div>
      )}
      
      <BulkImportModal 
        isOpen={showImport} 
        onClose={() => setShowImport(false)} 
        type="employees" 
        onComplete={fetchInitialData} 
      />
    </div>
  );
};

export default Employees;
