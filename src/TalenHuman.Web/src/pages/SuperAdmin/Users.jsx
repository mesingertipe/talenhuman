import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, X, Shield, User as UserIcon, Mail, Lock, Building2, CheckCircle, AlertCircle, ToggleLeft, ToggleRight, MapPin } from 'lucide-react';
import api from '../../services/api';
import SearchableSelect from '../../components/Shared/SearchableSelect';
import MultiSearchableSelect from '../../components/Shared/MultiSearchableSelect';
import { useTableData } from '../../hooks/useTableData';
import Pagination from '../../components/Shared/Pagination';
import { Search } from 'lucide-react';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    companyId: '',
    roles: ['Admin'],
    isActive: true,
    mustChangePassword: true,
    storeIds: []
  });

  const availableRoles = ["Admin", "Gerente", "Supervisor", "RH", "SuperAdmin"];
  
  // Get current user info to restrict role assignment
  const currentUserRole = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).roles : [];
  const isSuperAdminUser = currentUserRole.includes('SuperAdmin');
  
  const filteredRoles = isSuperAdminUser 
    ? availableRoles 
    : availableRoles.filter(r => r !== 'SuperAdmin');

  const { 
    data: currentUsers, 
    searchTerm, 
    setSearchTerm, 
    currentPage, 
    setCurrentPage, 
    totalPages, 
    totalItems, 
    itemsPerPage, 
    setItemsPerPage 
  } = useTableData(users, ['fullName', 'email', 'companyName', 'storeNames']);

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
      const [usersRes, compRes, storesRes] = await Promise.all([
        api.get('/users'),
        api.get('/companies'),
        api.get('/stores')
      ]);
      setUsers(usersRes.data);
      setCompanies(compRes.data);
      setStores(storesRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = { ...formData };
    
    // SuperAdmin always maps to the primary tenant if no company selected
    if (payload.roles.includes('SuperAdmin') && !payload.companyId) {
        payload.companyId = companies[0]?.id;
    }

    try {
      if (currentUser) {
        const updateData = {
            fullName: payload.fullName,
            companyId: payload.companyId,
            isActive: payload.isActive,
            mustChangePassword: payload.mustChangePassword,
            roles: payload.roles,
            storeIds: payload.storeIds,
            newPassword: payload.password || null
        };
        await api.put(`/users/${currentUser.id}`, updateData);
        showToast("Usuario actualizado");
      } else {
        await api.post('/users', payload);
        showToast("Usuario creado con éxito");
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      console.error("User save error:", err);
      let errorMsg = "Error al procesar la solicitud";
      
      if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          errorMsg = err.response.data;
        } else if (err.response.data.message) {
          errorMsg = err.response.data.message;
        } else if (Array.isArray(err.response.data)) {
          errorMsg = err.response.data[0]?.description || JSON.stringify(err.response.data);
        } else {
          errorMsg = JSON.stringify(err.response.data);
        }
      }
      
      showToast(errorMsg, "error");
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/users/${currentUser.id}`);
      showToast("Usuario eliminado");
      setShowConfirm(false);
      fetchData();
    } catch (err) {
      showToast("No se pudo eliminar el usuario", "error");
    }
  };

  const toggleRole = (role) => {
    const newRoles = formData.roles.includes(role)
      ? formData.roles.filter(r => r !== role)
      : [...formData.roles, role];
    setFormData({ ...formData, roles: newRoles });
  };

  const handleSyncEmployees = async () => {
    try {
        setLoading(true);
        const res = await api.post('/auth/sync-employee-users');
        showToast(res.data.message);
        fetchData();
    } catch (err) {
        showToast("Error al sincronizar usuarios", "error");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="page-container animate-in fade-in duration-300">
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="w-full sm:max-w-sm">
          <input 
            type="text" 
            placeholder="Buscar usuarios..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2.5 m-0 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm font-medium text-sm transition-all"
            style={{ margin: 0 }}
          />
        </div>
        
        <div className="flex items-center gap-3 flex-shrink-0">
          {isSuperAdminUser && (
            <button 
              onClick={handleSyncEmployees}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 font-bold text-sm hover:bg-indigo-100 transition-colors flex items-center gap-2"
            >
              <CheckCircle size={18} /> Sincronizar Empleados
            </button>
          )}
          <button 
            onClick={() => {
              setCurrentUser(null);
              const selectedTenant = localStorage.getItem('tenantId');
              const defaultTenant = '11111111-1111-1111-1111-111111111111';
              setFormData({ 
                  fullName: '', email: '', password: '', 
                  companyId: isSuperAdminUser 
                    ? (selectedTenant && selectedTenant !== defaultTenant ? selectedTenant : '') 
                    : (JSON.parse(localStorage.getItem('user'))?.companyId || ''), 
                  roles: ['Admin'], isActive: true, mustChangePassword: true,
                  storeIds: []
              });
              setShowModal(true);
            }}
            className="btn-premium btn-premium-primary whitespace-nowrap"
          >
            <Plus size={20} /> Nuevo Usuario
          </button>
        </div>
      </div>

      <div className="card flex flex-col" style={{ padding: 0, overflow: 'hidden', minHeight: '60vh' }}>
        {loading ? (
          <div style={{ padding: '6rem', textAlign: 'center' }}>
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-slate-500 font-medium">Cargando base de usuarios...</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', background: 'var(--bg-main)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', trackingWider: '0.1em' }}>Usuario</th>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', trackingWider: '0.1em' }}>Empresa</th>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', trackingWider: '0.1em' }}>Roles</th>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', trackingWider: '0.1em' }}>Estado</th>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', trackingWider: '0.1em', textAlign: 'right' }}>Gestión</th>
              </tr>
            </thead>
            <tbody>
              {currentUsers.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }} className="hover:bg-slate-50 transition-colors">
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '40px', height: '40px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <UserIcon size={20} className="text-slate-400" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">{u.fullName}</div>
                        <div className="text-xs text-slate-500 font-medium">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-slate-600 font-bold text-sm">
                            <Building2 size={14} className="text-slate-400" />
                            {u.companyName}
                        </div>
                        {u.storeNames?.length > 0 && (
                            <div className="flex items-center gap-2 text-indigo-600 font-medium text-[11px]">
                                <MapPin size={12} />
                                {u.storeNames.join(', ')}
                            </div>
                        )}
                    </div>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <div className="flex flex-wrap gap-1">
                      {u.roles?.map(r => (
                        <span key={r} style={{ padding: '0.2rem 0.5rem', background: r === 'SuperAdmin' ? '#eef2ff' : '#f8fafc', color: r === 'SuperAdmin' ? '#4f46e5' : '#64748b', borderRadius: '6px', fontSize: '0.65rem', fontWeight: '800', border: '1px solid currentColor', borderOpacity: 0.2, textTransform: 'uppercase' }}>
                          {r}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <span style={{ 
                        padding: '0.25rem 0.6rem', 
                        background: u.isActive ? '#ecfdf5' : '#fff1f2', 
                        color: u.isActive ? '#059669' : '#e11d48', 
                        borderRadius: '999px', fontSize: '0.7rem', fontWeight: '700' 
                    }}>
                      {u.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                    <button 
                      onClick={() => {
                        setCurrentUser(u);
                        setFormData({ 
                            fullName: u.fullName, email: u.email, 
                            password: '', companyId: u.companyId, 
                            roles: u.roles, isActive: u.isActive,
                            mustChangePassword: u.mustChangePassword,
                            storeIds: u.storeIds || []
                        });
                        setShowModal(true);
                      }}
                      style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', padding: '0.5rem' }}
                      className="hover:scale-110 transition-transform"
                    >
                      <Edit size={18} />
                    </button>
                    {!u.roles?.includes('SuperAdmin') && (
                        <button 
                            onClick={() => { setCurrentUser(u); setShowConfirm(true); }}
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.5rem' }}
                            className="hover:scale-110 transition-transform"
                        >
                            <Trash2 size={18} />
                        </button>
                    )}
                  </td>
                </tr>
              ))}
              {currentUsers.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: '4rem', textAlign: 'center' }}>
                    <div className="flex flex-col items-center gap-2 opacity-40">
                      <UserIcon size={48} />
                      <p className="font-medium">No se encontraron usuarios.</p>
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
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2 className="text-xl font-bold flex items-center gap-2" style={{ margin: 0 }}>
                {currentUser ? <Edit size={24} className="text-indigo-500" /> : <Plus size={24} className="text-indigo-500" />}
                {currentUser ? 'Editar Usuario' : 'Nuevo Usuario Administrativo'}
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
              <div className="modal-body space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nombre Completo</label>
                    <div className="relative">
                      <UserIcon size={18} className="absolute left-3 top-3.5 text-slate-400" />
                      <input required value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} className="w-full p-3 pl-10 rounded-xl border-slate-200 bg-slate-50 focus:ring-2 focus:ring-indigo-500 transition-all font-medium" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Correo Electrónico</label>
                    <div className="relative">
                      <Mail size={18} className="absolute left-3 top-3.5 text-slate-400" />
                      <input 
                        required 
                        disabled={!!currentUser}
                        type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                        className="w-full p-3 pl-10 rounded-xl border-slate-200 bg-slate-50 focus:ring-2 focus:ring-indigo-500 transition-all font-medium disabled:opacity-50" 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{currentUser ? 'Nueva Contraseña (Opcional)' : 'Contraseña'}</label>
                    <div className="relative">
                      <Lock size={18} className="absolute left-3 top-3.5 text-slate-400" />
                      <input 
                        required={!currentUser}
                        type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
                        className="w-full p-3 pl-10 rounded-xl border-slate-200 bg-slate-50 focus:ring-2 focus:ring-indigo-500 transition-all font-medium" 
                      />
                    </div>
                  </div>
                  {isSuperAdminUser && (
                    <div className="col-span-2">
                        <SearchableSelect
                            label="Asignar a Empresa / Tenant"
                            options={companies}
                            value={formData.companyId}
                            onChange={(val) => setFormData({ ...formData, companyId: val, storeIds: [] })}
                            icon={Building2}
                            placeholder="Seleccionar empresa..."
                            required
                        />
                    </div>
                  )}

                  {/* Store Selector - Only for Gerente or Supervisor */}
                  {(formData.roles.includes('Gerente') || formData.roles.includes('Supervisor')) && (
                    <div className="col-span-2 animate-in slide-in-from-top-2 duration-300">
                      {formData.roles.includes('Supervisor') ? (
                        <MultiSearchableSelect
                            label="Tiendas bajo Supervisión"
                            options={stores.filter(s => s.companyId === formData.companyId)}
                            value={formData.storeIds}
                            onChange={(val) => setFormData({ ...formData, storeIds: val })}
                            placeholder="Seleccionar tiendas..."
                            required
                        />
                      ) : (
                        <SearchableSelect
                            label="Tienda Asignada"
                            options={stores.filter(s => s.companyId === formData.companyId)}
                            value={formData.storeIds[0] || ""}
                            onChange={(val) => setFormData({ ...formData, storeIds: [val] })}
                            icon={MapPin}
                            placeholder="Seleccionar tienda..."
                            required
                        />
                      )}
                    </div>
                  )}
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Roles y Permisos</label>
                    <div className="flex flex-wrap gap-2">
                        {filteredRoles.map(role => (
                            <button
                                key={role}
                                type="button"
                                onClick={() => toggleRole(role)}
                                style={{ 
                                    padding: '0.5rem 1rem', 
                                    borderRadius: '10px', 
                                    fontSize: '0.8rem', 
                                    fontWeight: '700',
                                    border: '1px solid',
                                    transition: 'all 0.2s',
                                    background: formData.roles.includes(role) ? '#4f46e5' : 'white',
                                    color: formData.roles.includes(role) ? 'white' : '#64748b',
                                    borderColor: formData.roles.includes(role) ? '#4f46e5' : '#e2e8f0'
                                }}
                            >
                                {role}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                        <div>
                            <p className="font-bold text-slate-800 text-sm">Estado de la cuenta</p>
                            <p className="text-xs text-slate-500">Permitir o denegar el acceso</p>
                        </div>
                        <button 
                            type="button"
                            onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                            className="flex items-center gap-2 text-indigo-600 font-bold"
                            style={{ border: 'none', background: 'none', cursor: 'pointer' }}
                        >
                            {formData.isActive ? <ToggleRight size={32} /> : <ToggleLeft size={32} className="text-slate-300" />}
                            <span className="text-[10px] uppercase font-bold">{formData.isActive ? 'Activo' : 'Inactivo'}</span>
                        </button>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                        <div>
                            <p className="font-bold text-slate-800 text-sm">Cambio Obligatorio</p>
                            <p className="text-xs text-slate-500">Forzar cambio al ingresar</p>
                        </div>
                        <button 
                            type="button"
                            onClick={() => setFormData({ ...formData, mustChangePassword: !formData.mustChangePassword })}
                            className="flex items-center gap-2 text-orange-600 font-bold"
                            style={{ border: 'none', background: 'none', cursor: 'pointer' }}
                        >
                            {formData.mustChangePassword ? <ToggleRight size={32} /> : <ToggleLeft size={32} className="text-slate-300" />}
                            <span className="text-[10px] uppercase font-bold">{formData.mustChangePassword ? 'SI' : 'NO'}</span>
                        </button>
                    </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn-premium btn-premium-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-premium btn-premium-primary">
                  {currentUser ? 'Guardar Cambios' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showConfirm && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '420px' }}>
            <div className="modal-body" style={{ textAlign: 'center', paddingTop: '3rem' }}>
              <div className="mb-6" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                <Trash2 size={40} />
              </div>
              <h2 className="text-2xl font-bold mb-3">¿Eliminar Usuario?</h2>
              <p className="text-slate-500 text-sm mb-8" style={{ lineHeight: '1.6' }}>
                ¿Estás seguro de que deseas eliminar permanentemente a <strong>{currentUser?.fullName}</strong>? Esta acción no se puede deshacer.
              </p>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={() => setShowConfirm(false)} className="btn-premium btn-premium-secondary" style={{ flex: 1 }}>
                  Conservar
                </button>
                <button onClick={handleDelete} className="btn-premium btn-premium-danger" style={{ flex: 1 }}>
                  Eliminar
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
    </div>
  );
};

export default Users;
