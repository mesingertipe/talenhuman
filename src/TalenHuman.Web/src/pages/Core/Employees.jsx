import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Edit, X, User as UserIcon, Mail, Tag, Store, 
  FileSpreadsheet, AlertCircle, Hash, Shield, CheckCircle,
  Search, Calendar, ToggleRight, ToggleLeft, Briefcase, Clock, UserPlus, Download, MapPin, Globe
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
    mustChangePassword: false,
    dateOfTermination: ''
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
  } = useTableData(employees, ['firstName', 'lastName', 'identificationNumber', 'storeName', 'profileName', 'jornadaNombre', 'email']);

  const isAdmin = user?.roles?.includes('Admin') || user?.roles?.includes('SuperAdmin');

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
      Número: emp.identificationNumber,
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
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', trackingWider: '0.1em' }}>Número</th>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', trackingWider: '0.1em' }}>Sede / Cargo / Jornada</th>
                {isAdmin && <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', trackingWider: '0.1em' }}>Salario</th>}
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
                  {isAdmin && (
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <div className="font-black text-indigo-600 dark:text-indigo-400 text-sm">
                        ${emp.dailySalary?.toLocaleString('es-CO')}
                      </div>
                      <div className="text-[10px] uppercase font-black opacity-40">Salario Diario</div>
                    </td>
                  )}
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(2, 6, 23, 0.85)', backdropFilter: 'blur(30px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: activeColors.card, width: '100%', maxWidth: '850px', maxHeight: '92vh', borderRadius: '48px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 50px 100px rgba(0,0,0,0.4)', animation: 'modalFadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            
            {/* Header Elite v3 */}
            <div style={{ padding: '40px 60px', borderBottom: `1px solid ${activeColors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isDarkMode ? '#1e293b' : '#ffffff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <div style={{ width: '64px', height: '64px', background: activeColors.accentSoft, borderRadius: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: activeColors.accent }}>
                    <UserPlus size={28} strokeWidth={2.5} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.8rem', fontWeight: '950', color: activeColors.textMain, margin: 0, letterSpacing: '-0.03em' }}>
                    {currentEmployee ? 'Actualizar Colaborador' : 'Vincular Colaborador'}
                  </h2>
                  <p style={{ fontSize: '0.85rem', color: activeColors.textMuted, fontWeight: '700', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Gestión de Talento y Nómina Administrativa
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                style={{ background: activeColors.accentSoft, border: 'none', width: '52px', height: '52px', borderRadius: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: activeColors.accent, transition: 'all 0.2s' }}
                className="hover:rotate-90"
              >
                <X size={28} strokeWidth={3} />
              </button>
            </div>

            <div style={{ padding: '50px 60px', flex: 1, overflowY: 'auto', background: isDarkMode ? '#0f172a' : '#fcfdfe' }}>
              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '56px' }}>
                
                {/* Sección 01 */}
                <div style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '36px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '950', color: activeColors.accent, background: activeColors.accentSoft, padding: '4px 12px', borderRadius: '8px' }}>01</span>
                    <h3 style={{ fontSize: '0.75rem', fontWeight: '900', color: activeColors.textMain, textTransform: 'uppercase', letterSpacing: '0.15em', margin: 0 }}>Identificación y Datos Personales</h3>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px 36px' }}>
                    <div className="group">
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: activeColors.textMuted, textTransform: 'uppercase', marginBottom: '14px', letterSpacing: '0.1em' }}>Nombres *</label>
                      <div style={{ position: 'relative' }}>
                        <UserIcon size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input 
                          required value={formData.firstName}
                          onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                          placeholder="Nombres completo..." 
                          style={{ width: '100%', padding: '22px 24px 22px 60px', borderRadius: '24px', border: `2px solid ${activeColors.border}`, background: activeColors.card, color: activeColors.textMain, fontWeight: '700', fontSize: '0.95rem', outline: 'none', transition: 'all 0.3s' }}
                          className="focus:border-indigo-500 focus:shadow-xl"
                        />
                      </div>
                    </div>
                    <div className="group">
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: activeColors.textMuted, textTransform: 'uppercase', marginBottom: '14px', letterSpacing: '0.1em' }}>Apellidos *</label>
                      <div style={{ position: 'relative' }}>
                        <UserIcon size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input 
                          required value={formData.lastName}
                          onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                          placeholder="Apellidos completo..." 
                          style={{ width: '100%', padding: '22px 24px 22px 60px', borderRadius: '24px', border: `2px solid ${activeColors.border}`, background: activeColors.card, color: activeColors.textMain, fontWeight: '700', fontSize: '0.95rem', outline: 'none', transition: 'all 0.3s' }}
                          className="focus:border-indigo-500 focus:shadow-xl"
                        />
                      </div>
                    </div>
                    <div className="group">
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: activeColors.textMuted, textTransform: 'uppercase', marginBottom: '14px', letterSpacing: '0.1em' }}>Número *</label>
                      <div style={{ position: 'relative' }}>
                        <Hash size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input 
                          required value={formData.identificationNumber}
                          onChange={(e) => setFormData({...formData, identificationNumber: e.target.value})}
                          placeholder="Número de identificación..." 
                          style={{ width: '100%', padding: '22px 24px 22px 60px', borderRadius: '24px', border: `2px solid ${activeColors.border}`, background: activeColors.card, color: activeColors.textMain, fontWeight: '700', fontSize: '0.95rem', outline: 'none', transition: 'all 0.3s' }}
                          className="focus:border-indigo-500 focus:shadow-xl"
                        />
                      </div>
                    </div>
                    <div className="group">
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: activeColors.textMuted, textTransform: 'uppercase', marginBottom: '14px', letterSpacing: '0.1em' }}>Cumpleaños</label>
                      <div style={{ position: 'relative' }}>
                        <Calendar size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input 
                          type="date"
                          value={formData.birthDate ? formData.birthDate.split('T')[0] : ''}
                          onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
                          style={{ width: '100%', padding: '22px 24px 22px 60px', borderRadius: '24px', border: `2px solid ${activeColors.border}`, background: activeColors.card, color: activeColors.textMain, fontWeight: '700', fontSize: '0.95rem', outline: 'none', transition: 'all 0.3s' }}
                          className="focus:border-indigo-500 focus:shadow-xl"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sección 02 */}
                <div style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '36px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '950', color: activeColors.accent, background: activeColors.accentSoft, padding: '4px 12px', borderRadius: '8px' }}>02</span>
                    <h3 style={{ fontSize: '0.75rem', fontWeight: '900', color: activeColors.textMain, textTransform: 'uppercase', letterSpacing: '0.15em', margin: 0 }}>Cargos, Sedes y Nómina</h3>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px 36px' }}>
                    {isAdmin && (
                      <div className="group">
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: activeColors.textMuted, textTransform: 'uppercase', marginBottom: '14px', letterSpacing: '0.1em' }}>Salario Diario</label>
                        <div style={{ position: 'relative' }}>
                          <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                          <input 
                            type="number"
                            value={formData.dailySalary}
                            onChange={(e) => setFormData({...formData, dailySalary: parseFloat(e.target.value)})}
                            style={{ width: '100%', padding: '22px 24px 22px 60px', borderRadius: '24px', border: `2px solid ${activeColors.border}`, background: activeColors.card, color: activeColors.textMain, fontWeight: '700', fontSize: '0.95rem', outline: 'none', transition: 'all 0.3s' }}
                            className="focus:border-indigo-500 focus:shadow-xl"
                          />
                        </div>
                      </div>
                    )}
                    <div className="group">
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: activeColors.textMuted, textTransform: 'uppercase', marginBottom: '14px', letterSpacing: '0.1em' }}>Fecha de Ingreso *</label>
                      <div style={{ position: 'relative' }}>
                        <Calendar size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                          type="date" value={formData.dateOfEntry?.split('T')[0] || ''}
                          onChange={(e) => setFormData({...formData, dateOfEntry: e.target.value})}
                          style={{ width: '100%', padding: '22px 24px 22px 60px', borderRadius: '24px', border: `2px solid ${activeColors.border}`, background: activeColors.card, color: activeColors.textMain, fontWeight: '700' }}
                          className="focus:border-indigo-500"
                        />
                      </div>
                    </div>
                    
                    <SearchableSelect
                      label="Sede / C. Costos *"
                      options={stores.map(s => ({ value: s.id, label: s.name }))}
                      value={formData.storeId}
                      onChange={(val) => setFormData({...formData, storeId: val})}
                      placeholder="Seleccionar sede..."
                      icon={Store}
                    />

                    <SearchableSelect
                      label="Cargo *"
                      options={profiles.map(p => ({ value: p.id, label: p.name }))}
                      value={formData.profileId}
                      onChange={(val) => setFormData({...formData, profileId: val})}
                      placeholder="Asignar función..."
                      icon={Shield}
                    />

                    <SearchableSelect
                      label="Jornada *"
                      options={jornadas.map(j => ({ value: j.id, label: j.nombre }))}
                      value={formData.jornadaId}
                      onChange={(val) => setFormData({...formData, jornadaId: val})}
                      placeholder="Tipo de horario..."
                      icon={Clock}
                    />
                  </div>
                </div>

                {/* Footer Actions Elite */}
                <div style={{ background: isDarkMode ? 'rgba(79, 70, 229, 0.05)' : '#f8faff', padding: '36px', borderRadius: '32px', border: `1px solid ${activeColors.border}`, display: 'flex', flexWrap: 'wrap', gap: '30px', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', gap: '40px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <div 
                        onClick={() => setFormData({...formData, isActive: !formData.isActive})}
                        style={{ width: '56px', height: '28px', background: formData.isActive ? '#10b981' : '#cbd5e1', borderRadius: '20px', position: 'relative', cursor: 'pointer', transition: 'all 0.3s' }}
                      >
                        <div style={{ width: '22px', height: '22px', background: 'white', borderRadius: '50%', position: 'absolute', top: '3px', left: formData.isActive ? '31px' : '3px', transition: 'all 0.3s', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}></div>
                      </div>
                      <div>
                        <span style={{ display: 'block', fontSize: '10px', fontWeight: '900', color: activeColors.textMuted, textTransform: 'uppercase' }}>Estado Activo</span>
                        <span style={{ fontSize: '0.8rem', fontWeight: '950', color: formData.isActive ? '#10b981' : activeColors.textMuted }}>{formData.isActive ? 'VIGENCIA EN NÓMINA' : 'RETIRADO / INACTIVO'}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div 
                          onClick={() => setFormData({...formData, mustChangePassword: !formData.mustChangePassword})}
                          style={{ width: '56px', height: '28px', background: formData.mustChangePassword ? '#4f46e5' : '#cbd5e1', borderRadius: '20px', position: 'relative', cursor: 'pointer', transition: 'all 0.3s' }}
                        >
                          <div style={{ width: '22px', height: '22px', background: 'white', borderRadius: '50%', position: 'absolute', top: '3px', left: formData.mustChangePassword ? '31px' : '3px', transition: 'all 0.3s', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}></div>
                        </div>
                        <div>
                          <span style={{ display: 'block', fontSize: '10px', fontWeight: '900', color: activeColors.textMuted, textTransform: 'uppercase' }}>Reset de Clave</span>
                          <span style={{ fontSize: '0.8rem', fontWeight: '950', color: formData.mustChangePassword ? '#4f46e5' : activeColors.textMuted }}>{formData.mustChangePassword ? 'SOLICITAR AL INGRESAR' : 'MANTENER ACTUAL'}</span>
                        </div>
                    </div>
                    </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px', color: activeColors.textMuted }}>
                     <Shield size={20} />
                     <p style={{ fontSize: '0.75rem', fontWeight: '700', maxWidth: '300px', margin: 0 }}>
                       <span style={{ fontWeight: '950', color: activeColors.textMain }}>SEGURIDAD:</span> Al vincular al colaborador, se le asignará acceso automático basado en su identificación.
                     </p>
                  </div>
                </div>

                {/* Baja Date picker if inactive */}
                {!formData.isActive && (
                  <div style={{ padding: '30px', background: isDarkMode ? '#451a1a' : '#fef2f2', borderRadius: '24px', border: '1px solid #fee2e2', animation: 'fadeIn 0.4s' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: '#ef4444', textTransform: 'uppercase', marginBottom: '14px', letterSpacing: '0.1em' }}>Fecha de Baja / Desvinculación *</label>
                    <div style={{ position: 'relative' }}>
                      <Calendar size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-red-400" />
                      <input 
                        required={!formData.isActive}
                        type="date" value={formData.dateOfTermination?.split('T')[0] || ''}
                        onChange={(e) => setFormData({...formData, dateOfTermination: e.target.value})}
                        style={{ width: '100%', padding: '20px 24px 20px 60px', borderRadius: '20px', border: '2px solid #fecaca', background: 'white', color: '#b91c1c', fontWeight: '700' }}
                      />
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '24px', paddingTop: '20px' }}>
                  <button 
                    type="button" 
                    onClick={() => setShowModal(false)}
                    style={{ flex: 1, padding: '24px', borderRadius: '28px', border: `2px solid ${activeColors.border}`, background: 'white', color: activeColors.textMuted, fontWeight: '900', fontSize: '1rem', cursor: 'pointer', transition: 'all 0.2s' }}
                    className="hover:bg-slate-50"
                  >
                    Cerrar
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    style={{ flex: 2, padding: '24px', borderRadius: '28px', border: 'none', background: activeColors.accent, color: 'white', fontWeight: '950', fontSize: '1rem', cursor: 'pointer', boxShadow: '0 15px 35px rgba(79, 70, 229, 0.4)', transition: 'all 0.3s' }}
                    className="hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {isSubmitting ? 'Procesando...' : currentEmployee ? 'Guardar Cambios' : 'Confirmar Vinculación'}
                  </button>
                </div>
              </form>
            </div>
          </div>
          <style>{`
            @keyframes modalFadeIn {
              from { opacity: 0; transform: scale(0.95) translateY(20px); }
              to { opacity: 1; transform: scale(1) translateY(0); }
            }
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          `}</style>
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
