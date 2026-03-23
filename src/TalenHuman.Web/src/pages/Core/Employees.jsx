import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, X, User as UserIcon, Mail, Tag, Store, FileSpreadsheet, AlertCircle, Hash, Shield, CheckCircle } from 'lucide-react';
import api from '../../services/api';
import BulkImportModal from '../../components/Shared/BulkImportModal';
import SearchableSelect from '../../components/Shared/SearchableSelect';
import { useTableData } from '../../hooks/useTableData';
import Pagination from '../../components/Shared/Pagination';
import { Search, Calendar, ToggleRight, ToggleLeft } from 'lucide-react';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [stores, setStores] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    identificationNumber: '',
    storeId: '',
    profileId: '',
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
      const [empRes, storeRes, profRes] = await Promise.all([
        api.get('/employees'),
        api.get('/stores'),
        api.get('/profiles')
      ]);
      setEmployees(empRes.data);
      setStores(storeRes.data);
      setProfiles(profRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (currentEmployee) {
        await api.put(`/employees/${currentEmployee.id}`, formData);
        showToast("Colaborador actualizado con éxito");
      } else {
        await api.post('/employees', formData);
        showToast("Nuevo colaborador registrado");
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      showToast("Error al procesar el registro", "error");
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/employees/${currentEmployee.id}`);
      showToast("Registro eliminado correctamente");
      setShowConfirm(false);
      fetchData();
    } catch (err) {
      showToast("Error al eliminar colaborador", "error");
    }
  };

  return (
    <div className="page-container animate-in fade-in duration-300">
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="w-full sm:max-w-sm">
          <input 
            type="text" 
            placeholder="Buscar equipo..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2.5 m-0 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm font-medium text-sm transition-all"
            style={{ margin: 0 }}
          />
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
                    identificationNumber: '', storeId: stores[0]?.id || '', 
                    profileId: profiles[0]?.id || '',
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

      <div className="card flex flex-col" style={{ padding: 0, overflow: 'hidden', minHeight: '60vh' }}>
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
              <tr style={{ textAlign: 'left', background: 'var(--bg-main)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Colaborador</th>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Identificación</th>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Sede / Cargo</th>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Fecha Ingreso</th>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', textAlign: 'right' }}>Gestión</th>
              </tr>
            </thead>
            <tbody>
              {currentEmployees.map((emp) => (
                <tr key={emp.id} style={{ borderBottom: '1px solid var(--border)' }} className="hover:bg-slate-50 transition-colors">
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '44px', height: '44px', background: 'linear-gradient(135deg, #4f46e5, #818cf8)', borderRadius: '12px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.85rem' }}>
                        {emp.firstName[0]}{emp.lastName[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>{emp.firstName} {emp.lastName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '500' }}>{emp.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem' }}>{emp.identificationNumber}</td>
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#1e293b' }}>{emp.storeName || 'Sede no asignada'}</div>
                    <div style={{ fontSize: '0.75rem', color: '#6366f1', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.02em', marginTop: '0.1rem' }}>{emp.profileName || 'Sin cargo'}</div>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.8rem' }}>
                    {emp.dateOfEntry ? new Date(emp.dateOfEntry).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                    <button 
                      onClick={() => { setCurrentEmployee(emp); setFormData({ ...emp }); setShowModal(true); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: '1rem', color: '#6366f1' }}
                      className="hover:scale-110 transition-transform"
                    >
                      <Edit size={20} />
                    </button>
                    <button 
                      onClick={() => { setCurrentEmployee(emp); setShowConfirm(true); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                      className="hover:scale-110 transition-transform"
                    >
                      <Trash2 size={20} />
                    </button>
                  </td>
                </tr>
              ))}
              {currentEmployees.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: '5rem', textAlign: 'center' }}>
                    <div className="flex flex-col items-center gap-2 opacity-30">
                      <UserIcon size={58} />
                      <p className="font-bold text-lg">No se encontraron colaboradores.</p>
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
          <div className="modal-content" style={{ maxWidth: '750px' }}>
            <div className="modal-header">
              <h2 className="text-xl font-bold flex items-center gap-2" style={{ margin: 0 }}>
                {currentEmployee ? <Edit size={24} className="text-indigo-500" /> : <Plus size={24} className="text-indigo-500" />}
                {currentEmployee ? 'Editar Colaborador' : 'Nuevo Colaborador'}
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}
              >
                <X size={22} />
              </button>
            </div>
            
            <form onSubmit={handleSave}>
              <div className="modal-body mt-2">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: '1.5rem', rowGap: '2rem', marginBottom: '1.5rem' }}>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nombre <span className="text-red-500">*</span></label>
                    <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', transition: 'box-shadow 0.2s' }}>
                      <span style={{ padding: '0 12px', color: '#94a3b8', display: 'flex', alignItems: 'center', flexShrink: 0 }}><UserIcon size={16} /></span>
                      <input 
                        required 
                        value={formData.firstName} 
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} 
                        style={{ flex: 1, padding: '0.75rem 0.75rem 0.75rem 0', border: 'none', background: 'transparent', fontWeight: '500', outline: 'none', fontSize: '0.9rem', color: '#1e293b', margin: 0 }}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Apellidos <span className="text-red-500">*</span></label>
                    <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                      <span style={{ padding: '0 12px', color: '#94a3b8', display: 'flex', alignItems: 'center', flexShrink: 0 }}><UserIcon size={16} /></span>
                      <input 
                        required 
                        value={formData.lastName} 
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} 
                        style={{ flex: 1, padding: '0.75rem 0.75rem 0.75rem 0', border: 'none', background: 'transparent', fontWeight: '500', outline: 'none', fontSize: '0.9rem', color: '#1e293b', margin: 0 }}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Cédula Ciudadanía <span className="text-red-500">*</span></label>
                    <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                      <span style={{ padding: '0 12px', color: '#94a3b8', display: 'flex', alignItems: 'center', flexShrink: 0 }}><Hash size={16} /></span>
                      <input 
                        required 
                        value={formData.identificationNumber} 
                        onChange={(e) => setFormData({ ...formData, identificationNumber: e.target.value })} 
                        style={{ flex: 1, padding: '0.75rem 0.75rem 0.75rem 0', border: 'none', background: 'transparent', fontWeight: '500', outline: 'none', fontSize: '0.9rem', color: '#1e293b', margin: 0 }}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Fecha de Ingreso <span className="text-red-500">*</span></label>
                    <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                      <span style={{ padding: '0 12px', color: '#94a3b8', display: 'flex', alignItems: 'center', flexShrink: 0 }}><Calendar size={16} /></span>
                      <input 
                        required 
                        type="date" 
                        value={formData.dateOfEntry?.split('T')[0] || ''} 
                        onChange={(e) => setFormData({ ...formData, dateOfEntry: e.target.value })} 
                        style={{ flex: 1, padding: '0.75rem 0.75rem 0.75rem 0', border: 'none', background: 'transparent', fontWeight: '500', outline: 'none', fontSize: '0.9rem', color: '#334155', margin: 0 }}
                      />
                    </div>
                  </div>
                  <div>
                    <SearchableSelect
                      label="Sede Asignada"
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
                      label="Perfil de Cargo"
                      options={profiles.map(p => ({ value: p.id, label: p.name }))}
                      value={formData.profileId}
                      onChange={(val) => setFormData({ ...formData, profileId: val })}
                      placeholder="Seleccionar cargo..."
                      icon={Tag}
                      required
                    />
                  </div>
                </div>

                <hr className="border-slate-100" style={{ margin: '2rem 0' }} />

                <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between shadow-sm">
                  <div>
                      <p className="font-bold text-slate-800 text-base mb-1">Estado del Colaborador</p>
                      <p className="text-xs text-slate-500">Determina si puede acceder a la plataforma</p>
                  </div>
                  <button 
                      type="button"
                      onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                      className={`flex items-center gap-2 font-bold ${formData.isActive ? 'text-indigo-600' : 'text-slate-400'}`}
                      style={{ border: 'none', background: 'none', cursor: 'pointer' }}
                  >
                      {formData.isActive ? <ToggleRight size={38} /> : <ToggleLeft size={38} />}
                      <span className="text-[12px] uppercase tracking-wider">{formData.isActive ? 'Activo' : 'Inactivo'}</span>
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 flex items-start gap-4" style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>
                  <div style={{ width: '36px', height: '36px', background: '#fef3c7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b45309', flexShrink: 0 }}>
                    <AlertCircle size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p className="text-sm font-bold text-amber-900 mb-1">Información de Acceso al Sistema</p>
                    <p className="text-xs text-amber-800 leading-relaxed max-w-[95%]">
                      El sistema habilitará el acceso corporativo usando la <span className="font-bold underline">Cédula</span> para el <strong>Usuario</strong> y la <strong>Contraseña Inicial</strong>. Se forzará actualización de clave.
                    </p>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn-premium btn-premium-secondary">
                  No Guardar
                </button>
                <button type="submit" className="btn-premium btn-premium-primary">
                  {currentEmployee ? 'Actualizar Datos' : 'Registrar Colaborador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showConfirm && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div className="modal-body" style={{ textAlign: 'center', paddingTop: '3.5rem' }}>
              <div className="mb-6" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                <Trash2 size={40} />
              </div>
              <h2 className="text-2xl font-bold mb-3">¿Dar de baja?</h2>
              <p className="text-slate-500 text-sm mb-8 px-6" style={{ lineHeight: '1.6' }}>
                Estás a punto de inactivar a <strong>{currentEmployee.firstName} {currentEmployee.lastName}</strong>. Perderá acceso inmediato a la plataforma pero sus históricos se conservarán.
              </p>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={() => setShowConfirm(false)} className="btn-premium btn-premium-secondary" style={{ flex: 1 }}>
                  Conservar
                </button>
                <button onClick={handleDelete} className="btn-premium btn-premium-danger" style={{ flex: 1 }}>
                  Confirmar Baja
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
