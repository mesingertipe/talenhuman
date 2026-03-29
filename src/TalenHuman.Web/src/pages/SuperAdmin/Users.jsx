import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, X, Shield, User as UserIcon, Mail, Lock, Building2, CheckCircle, AlertCircle, ToggleLeft, ToggleRight, MapPin } from 'lucide-react';
import api from '../../services/api';
import SearchableSelect from '../../components/Shared/SearchableSelect';
import MultiSearchableSelect from '../../components/Shared/MultiSearchableSelect';
import { useTableData } from '../../hooks/useTableData';
import Pagination from '../../components/Shared/Pagination';
import { Search } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import HelpIcon from '../../components/Shared/HelpIcon';

const Users = () => {
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

  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [stores, setStores] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    companyId: '',
    roles: ['Admin'],
    isActive: true,
    mustChangePassword: true,
    storeIds: [],
    districtId: ''
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
      const [usersRes, compRes, storesRes, districtsRes] = await Promise.all([
        api.get('/users'),
        api.get('/companies'),
        api.get('/stores'),
        api.get('/districts')
      ]);
      setUsers(usersRes.data);
      setCompanies(compRes.data);
      setStores(storesRes.data);
      setDistricts(districtsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
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
            districtId: payload.districtId || null,
            newPassword: payload.password || null
        };
        await api.put(`/users/${currentUser.id}`, updateData);
        showToast("Usuario actualizado");
      } else {
        await api.post('/users', payload);
        showToast("Usuario creado con éxito");
      }
      showModal && setShowModal(false);
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/users/${currentUser.id}`);
      showToast("Usuario eliminado correctamente");
      setShowConfirm(false);
      fetchData();
    } catch (err) {
      showToast("Error al eliminar el usuario", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleRole = (role) => {
    const newRoles = formData.roles.includes(role)
      ? formData.roles.filter(r => r !== role)
      : [...formData.roles, role];
    setFormData({ ...formData, roles: newRoles });
  };

  const handleSyncEmployees = async () => {
    setSyncLoading(true);
    try {
        const res = await api.post('/auth/sync-employee-users');
        showToast(res.data.message);
        fetchData();
    } catch (err) {
        showToast("Error al sincronizar usuarios", "error");
    } finally {
        setSyncLoading(false);
    }
  };

  return (    <div className="page-container animate-in fade-in duration-500" style={{ padding: '2rem 1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Elite Header & Toolbar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4rem', gap: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: '950', color: activeColors.textMain, margin: 0, letterSpacing: '-0.03em' }}>Gestión de usuarios</h1>
          <p style={{ color: activeColors.textMuted, fontSize: '0.9rem', fontWeight: '600', marginTop: '6px' }}>Administración de accesos y roles del sistema</p>
        </div>

        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', width: '100%', maxWidth: '800px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} className="absolute left-4 top-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Filtrar usuarios..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-premium pl-12"
              style={{ margin: 0, borderRadius: '20px', height: '56px' }}
            />
          </div>
          <div className="flex gap-3">
            {isSuperAdminUser && (
              <button 
                onClick={handleSyncEmployees}
                disabled={syncLoading}
                className="btn-premium btn-premium-secondary"
                style={{ borderRadius: '20px', height: '56px', padding: '0 25px' }}
              >
                {syncLoading ? <div className="loader loader-indigo"></div> : <CheckCircle size={18} />} Sincronizar
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
              className="btn-premium btn-premium-primary"
              style={{ borderRadius: '20px', height: '56px', padding: '0 25px' }}
            >
              <Plus size={20} /> Nuevo Usuario
            </button>
          </div>
        </div>
      </div>


      <div className="card flex flex-col" style={{ padding: 0, overflow: 'hidden', minHeight: '60vh' }}>
        {loading ? (
          <div style={{ padding: '6rem', textAlign: 'center' }}>
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Sincronizando Usuarios...</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', background: 'var(--bg-main)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', trackingWider: '0.1em' }}>Usuario</th>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', trackingWider: '0.1em' }}>Empresa / Sede</th>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', trackingWider: '0.1em' }}>Roles de Acceso</th>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', trackingWider: '0.1em' }}>Estado</th>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', trackingWider: '0.1em', textAlign: 'right' }}>Gestión</th>
              </tr>
            </thead>
            <tbody>
              {currentUsers.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm">
                        <UserIcon size={20} className="text-indigo-500 dark:text-indigo-400" />
                      </div>
                      <div>
                        <div className="font-bold leading-tight" style={{ color: isDarkMode ? '#ffffff' : '#1e293b' }}>{u.fullName}</div>
                        <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: isDarkMode ? '#cbd5e1' : '#64748b' }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-bold text-sm leading-none">
                            <Building2 size={14} className="text-indigo-500 opacity-70" />
                            {u.companyName}
                        </div>
                        {u.storeNames?.length > 0 && (
                            <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold text-[10px] uppercase tracking-widest bg-indigo-50/50 dark:bg-indigo-500/10 px-2.5 py-1 rounded-full w-fit border border-indigo-100/50 dark:border-indigo-500/20">
                                <MapPin size={10} className="opacity-70" />
                                {u.storeNames.join(', ')}
                            </div>
                        )}
                        {u.districtName && (
                            <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold text-[10px] uppercase tracking-widest bg-indigo-50/50 dark:bg-indigo-500/10 px-2.5 py-1 rounded-full w-fit border border-indigo-100/50 dark:border-indigo-500/20">
                                <Building2 size={10} className="opacity-70" />
                                Distrito: {u.districtName}
                            </div>
                        )}
                    </div>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <div className="flex flex-wrap gap-1.5">
                      {u.roles?.map(r => (
                        <div key={r} className={`flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest ${
                            r === 'SuperAdmin' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${r === 'SuperAdmin' ? 'bg-indigo-500' : 'bg-slate-400'}`}></div>
                          {r}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <span style={{ 
                      padding: '0.35rem 0.75rem', 
                      background: u.isActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                      color: u.isActive ? '#10b981' : '#ef4444', 
                      borderRadius: '9999px', 
                      fontSize: '0.7rem', 
                      fontWeight: '800',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      textTransform: 'uppercase'
                    }}>
                      {u.isActive ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                      {u.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                    <button 
                      onClick={() => { 
                        setCurrentUser(u); 
                        setFormData({ 
                          fullName: u.fullName, 
                          email: u.email, 
                          password: '', 
                          roles: u.roles || [], 
                          companyId: u.companyId || '',
                          storeIds: u.storeIds || [],
                          districtId: u.districtId || '',
                          isActive: u.isActive,
                          mustChangePassword: u.mustChangePassword
                        }); 
                        setShowModal(true); 
                      }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: '1rem', color: '#6366f1' }}
                      className="hover:scale-110 transition-transform dark:text-indigo-400"
                      data-v12-tooltip="Modificar permisos y datos del usuario"
                    >
                      <Edit size={18} />
                    </button>
                    {!u.roles?.includes('SuperAdmin') && (
                        <button 
                            onClick={() => { setCurrentUser(u); setShowConfirm(true); }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                            className="hover:scale-110 transition-transform dark:text-red-400"
                            data-v12-tooltip="Desactivar acceso administrativo"
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
                      <UserIcon size={48} className="text-slate-400" />
                      <p className="font-medium text-slate-500">No se encontraron usuarios.</p>
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
          <div className="modal-content shadow-2xl" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2 className="text-lg font-bold flex items-center gap-2 dark:text-white" style={{ margin: 0 }}>
                {currentUser ? <Edit size={22} className="text-indigo-500" /> : <Plus size={22} className="text-indigo-500" />}
                {currentUser ? 'Editar usuario' : 'Nuevo usuario administrativo'}
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Nombre Completo *</label>
                    <div className="relative">
                      <UserIcon size={18} className="absolute left-3 top-3.5 text-slate-400" />
                      <input required value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} className="input-premium pl-10" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Correo Electrónico *</label>
                    <div className="relative">
                      <Mail size={18} className="absolute left-3 top-3.5 text-slate-400" />
                      <input 
                        required 
                        disabled={!!currentUser}
                        type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                        className="input-premium pl-10 disabled:opacity-50" 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{currentUser ? 'Nueva Contraseña (Opcional)' : 'Contraseña *'}</label>
                    <div className="relative">
                      <Lock size={18} className="absolute left-3 top-3.5 text-slate-400" />
                      <input 
                        required={!currentUser}
                        type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
                        className="input-premium pl-10" 
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

                  {formData.roles.includes('Supervisor') && (
                    <div className="col-span-2">
                        <SearchableSelect
                            label="Distrito Asignado"
                            options={districts.map(d => ({ value: d.id, label: d.name }))}
                            value={formData.districtId}
                            onChange={(val) => setFormData({ ...formData, districtId: val })}
                            icon={Building2}
                            placeholder="Seleccionar distrito..."
                        />
                    </div>
                  )}
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Roles y Permisos</label>
                    <div className="flex flex-wrap gap-2">
                        {filteredRoles.map(role => (
                            <button
                                key={role}
                                type="button"
                                onClick={() => toggleRole(role)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                                    formData.roles.includes(role) 
                                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-indigo-300'
                                }`}
                            >
                                {role}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Usuario Activo</span>
                            <HelpIcon text="Habilita o deshabilitar el acceso total de este usuario al sistema" />
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

                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Forzar cambio de clave</span>
                            <HelpIcon text="Obliga al usuario a actualizar su contraseña en el próximo inicio de sesión por seguridad" />
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
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn-premium btn-premium-secondary" disabled={isSubmitting}>
                  Cancelar
                </button>
                <button type="submit" className="btn-premium btn-premium-primary" disabled={isSubmitting}>
                  {isSubmitting ? <div className="loader"></div> : (currentUser ? 'Guardar Cambios' : 'Crear Usuario')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showConfirm && (
        <div className="modal-overlay">
          <div className="modal-content shadow-2xl" style={{ maxWidth: '420px', borderRadius: '24px' }}>
            <div className="modal-body p-8" style={{ textAlign: 'center' }}>
              <div className="mb-6" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                <Trash2 size={40} />
              </div>
              <h2 className="text-xl font-bold mb-3 dark:text-white">¿Eliminar usuario?</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-8" style={{ lineHeight: '1.6' }}>
                ¿Estás seguro de que deseas eliminar permanentemente a <strong>{currentUser?.fullName}</strong>? Esta acción no se puede deshacer.
              </p>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={() => setShowConfirm(false)} className="btn-premium btn-premium-secondary" style={{ flex: 1 }} disabled={isDeleting}>
                  Cancelar
                </button>
                <button onClick={handleDelete} className="btn-premium btn-premium-danger" style={{ flex: 1 }} disabled={isDeleting}>
                  {isDeleting ? <div className="loader"></div> : 'Confirmar Eliminación'}
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
