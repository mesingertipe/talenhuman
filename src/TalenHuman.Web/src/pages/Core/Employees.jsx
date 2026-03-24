import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, X, User as UserIcon, Mail, Tag, Store, FileSpreadsheet, AlertCircle, Hash, Shield, CheckCircle } from 'lucide-react';
import api from '../../services/api';
import BulkImportModal from '../../components/Shared/BulkImportModal';
import SearchableSelect from '../../components/Shared/SearchableSelect';
import { useTableData } from '../../hooks/useTableData';
import Pagination from '../../components/Shared/Pagination';
import { Search, Calendar, ToggleRight, ToggleLeft, Briefcase, Clock } from 'lucide-react';

const Employees = () => {
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
    isActive: true
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
  } = useTableData(employees, ['firstName', 'lastName', 'identificationNumber', 'storeName', 'profileName']);

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
      const [empRes, storeRes, profRes, jorRes] = await Promise.all([
        api.get('/employees'),
        api.get('/stores'),
        api.get('/profiles'),
        api.get('/jornadas')
      ]);
      setEmployees(empRes.data);
      setStores(storeRes.data);
      setProfiles(profRes.data);
      setJornadas(jorRes.data);
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
      fetchData();
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
      fetchData();
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data || "Error al eliminar colaborador";
      showToast(errorMsg, "error");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="page-container animate-in fade-in duration-300">
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="w-full sm:max-w-sm">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-3 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar personal..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-premium pl-10"
              style={{ margin: 0 }}
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-shrink-0">
          <button 
            onClick={() => setShowImport(true)}
            className="btn-premium btn-premium-secondary whitespace-nowrap"
          >
            <FileSpreadsheet size={18} /> Importar
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
                    dateOfEntry: new Date().toISOString().split('T')[0],
                    isActive: true
                }); 
                setShowModal(true); 
            }}
            className="btn-premium btn-premium-primary whitespace-nowrap"
          >
            <Plus size={20} /> Nuevo Colaborador
          </button>
        </div>
      </div>

      <div className="card flex flex-col dark:bg-slate-900" style={{ padding: 0, overflow: 'hidden', minHeight: '60vh' }}>
        {loading ? (
          <div style={{ padding: '6rem', textAlign: 'center' }}>
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              <p className="text-slate-500 font-medium">Buscando personal activo...</p>
            </div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }} className="bg-slate-50 dark:bg-slate-800/80">
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', trackingWider: '0.1em' }}>Colaborador</th>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', trackingWider: '0.1em' }}>Identificación</th>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', trackingWider: '0.1em' }}>Sede / Cargo / Jornada</th>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', trackingWider: '0.1em' }}>Fecha Ingreso</th>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', trackingWider: '0.1em', textAlign: 'right' }}>Gestión</th>
              </tr>
            </thead>
            <tbody>
              {currentEmployees.map((emp) => (
                <tr key={emp.id} style={{ borderBottom: '1px solid var(--border)' }} className="hover:bg-slate-50 dark:hover:bg-slate-800/10 transition-colors">
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-black text-xs shadow-lg shadow-indigo-500/20 uppercase">
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
                    <div className="text-slate-600 dark:text-slate-400 font-bold text-sm">
                      {emp.dateOfEntry ? new Date(emp.dateOfEntry).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'}
                    </div>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                    <button 
                      onClick={() => { setCurrentEmployee(emp); setFormData({ ...emp }); setShowModal(true); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: '1rem', color: '#6366f1' }}
                      className="hover:scale-110 transition-transform dark:text-indigo-400"
                      title="Editar Colaborador"
                    >
                      <Edit size={18} />
                    </button>
                    <button 
                      onClick={() => { setCurrentEmployee(emp); setShowConfirm(true); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                      className="hover:scale-110 transition-transform dark:text-red-400"
                      title="Eliminar Colaborador"
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
          <div className="modal-content shadow-2xl" style={{ maxWidth: '800px', borderRadius: '24px' }}>
            <div className="modal-header">
              <h2 className="text-xl font-bold flex items-center gap-2 dark:text-white" style={{ margin: 0 }}>
                {currentEmployee ? <Edit size={24} className="text-indigo-500" /> : <Plus size={24} className="text-indigo-500" />}
                {currentEmployee ? 'Editar Perfil del Colaborador' : 'Registro de Nuevo Colaborador'}
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors bg-transparent border-none cursor-pointer p-2 rounded-full"
              >
                <X size={22} />
              </button>
            </div>
            
            <form onSubmit={handleSave}>
              <div className="modal-body space-y-6 p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Nombre Completo <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <UserIcon size={18} className="absolute left-3 top-3.5 text-slate-400" />
                      <input 
                        required 
                        value={formData.firstName} 
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} 
                        placeholder="Nombres..."
                        className="input-premium pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Apellidos <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <UserIcon size={18} className="absolute left-3 top-3.5 text-slate-400" />
                      <input 
                        required 
                        value={formData.lastName} 
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} 
                        placeholder="Apellidos..."
                        className="input-premium pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Identificación <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Hash size={18} className="absolute left-3 top-3.5 text-slate-400" />
                      <input 
                        required 
                        value={formData.identificationNumber} 
                        onChange={(e) => setFormData({ ...formData, identificationNumber: e.target.value })} 
                        placeholder="Cédula o ID..."
                        className="input-premium pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Fecha Nacimiento <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Calendar size={18} className="absolute left-3 top-3.5 text-slate-400" />
                      <input 
                        required 
                        type="date" 
                        value={formData.birthDate?.split('T')[0] || ''} 
                        onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })} 
                        className="input-premium pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Fecha Ingreso <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Calendar size={18} className="absolute left-3 top-3.5 text-slate-400" />
                      <input 
                        required 
                        type="date" 
                        value={formData.dateOfEntry?.split('T')[0] || ''} 
                        onChange={(e) => setFormData({ ...formData, dateOfEntry: e.target.value })} 
                        className="input-premium pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <SearchableSelect
                      label="Sede / Centro de Costos"
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
                      label="Perfil Laboral"
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
                      label="Jornada Semanal"
                      options={jornadas.map(j => ({ value: j.id, label: j.nombre }))}
                      value={formData.jornadaId}
                      onChange={(val) => setFormData({ ...formData, jornadaId: val })}
                      placeholder="Seleccionar jornada..."
                      icon={Clock}
                      required
                    />
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-sm">
                  <div>
                      <p className="font-bold text-slate-800 dark:text-white text-sm mb-1">Vinculación Activa</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Determina si el colaborador está vigente en la nómina</p>
                  </div>
                  <div 
                      onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                      className={`premium-switch ${formData.isActive ? 'active' : ''}`}
                  />
                </div>

                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 flex items-start gap-3">
                  <AlertCircle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-800 dark:text-amber-400 font-medium leading-relaxed">
                    <strong>Gestión de Credenciales:</strong> Al guardar, el sistema generará automáticamente las credenciales de acceso basadas en la identificación del colaborador.
                  </p>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn-premium btn-premium-secondary" disabled={isSubmitting}>
                  Cancelar
                </button>
                <button type="submit" className="btn-premium btn-premium-primary" disabled={isSubmitting}>
                  {isSubmitting ? <div className="loader"></div> : (currentEmployee ? 'Actualizar Ficha' : 'Vincular Colaborador')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showConfirm && (
        <div className="modal-overlay">
          <div className="modal-content shadow-2xl" style={{ maxWidth: '440px', borderRadius: '24px' }}>
            <div className="modal-body p-8" style={{ textAlign: 'center' }}>
              <div className="mb-6" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                <Trash2 size={40} />
              </div>
              <h2 className="text-2xl font-bold mb-3 dark:text-white">¿Desvincular Equipo?</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-8" style={{ lineHeight: '1.6' }}>
                Estás a punto de inactivar a <strong>{currentEmployee?.firstName} {currentEmployee?.lastName}</strong>. Se conservará su histórico laboral.
              </p>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={() => setShowConfirm(false)} className="btn-premium btn-premium-secondary" style={{ flex: 1 }} disabled={isDeleting}>
                  Cancelar
                </button>
                <button onClick={handleDelete} className="btn-premium btn-premium-danger" style={{ flex: 1 }} disabled={isDeleting}>
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
        onComplete={fetchData} 
      />
    </div>
  );
};

export default Employees;
