import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, X, Building2, Hash, Shield, AlertCircle, CheckCircle, Boxes } from 'lucide-react';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import SearchableSelect from '../../components/Shared/SearchableSelect';
import ModuleActivationModal from '../../components/SuperAdmin/ModuleActivationModal';

const Companies = () => {
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

  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [currentCompany, setCurrentCompany] = useState(null);
  const [showModulesModal, setShowModulesModal] = useState(false);
  const [activeTab, setActiveTab] = useState('general'); // 'general' or 'firebase'
  const [formData, setFormData] = useState({ 
    id: '', 
    name: '', 
    taxId: '', 
    isActive: true,
    countryCode: 'CO',
    timeZoneId: 'SA Pacific Standard Time',
    // Firebase fields
    firebaseApiKey: '',
    firebaseAuthDomain: '',
    firebaseProjectId: '',
    firebaseStorageBucket: '',
    firebaseMessagingSenderId: '',
    firebaseAppId: '',
    firebaseMeasurementId: '',
    firebaseVapidKey: '',
    privacyPolicyText: ''
  });

  const countries = [
    { code: 'CO', name: 'Colombia', zone: 'SA Pacific Standard Time' },
    { code: 'MX', name: 'México', zone: 'Central Standard Time (Mexico)' },
    { code: 'PA', name: 'Panamá', zone: 'SA Pacific Standard Time' },
    { code: 'EC', name: 'Ecuador', zone: 'SA Pacific Standard Time' },
  ];
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    fetchCompanies();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ ...toast, show: false }), 3000);
  };

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const res = await api.get('/companies');
      setCompanies(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = { ...formData };
    if (!payload.id) delete payload.id;

    try {
      if (formData.id) {
        await api.put(`/companies/${formData.id}`, payload);
        showToast("Empresa actualizada con éxito");
      } else {
        await api.post('/companies', payload);
        showToast("Empresa creada con éxito");
      }
      setShowModal(false);
      fetchCompanies();
      // Elite V12: Notify Layout to refresh header clocks/flags
      window.dispatchEvent(new CustomEvent('tenantSettingsUpdated'));
    } catch (err) {
      console.error("Save error:", err);
      showToast("Error al procesar la solicitud", "error");
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/companies/${currentCompany.id}`);
      showToast("Empresa eliminada correctamente");
      setShowConfirm(false);
      fetchCompanies();
    } catch (err) {
      showToast("Error al eliminar la empresa", "error");
    }
  };

  return (
    <div className="page-container animate-in fade-in duration-500" style={{ padding: '2rem 1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Elite Header & Toolbar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4rem', gap: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: '950', color: activeColors.textMain, margin: 0, letterSpacing: '-0.03em' }}>Gestión de empresas</h1>
          <p style={{ color: activeColors.textMuted, fontSize: '0.9rem', fontWeight: '600', marginTop: '6px' }}>Configuración de inquilinos y clientes corporativos</p>
        </div>

        <button 
          onClick={() => { 
            setFormData({ 
              id: '', name: '', taxId: '', isActive: true, countryCode: 'CO', timeZoneId: 'SA Pacific Standard Time',
              firebaseApiKey: '', firebaseAuthDomain: '', firebaseProjectId: '', firebaseStorageBucket: '',
              firebaseMessagingSenderId: '', firebaseAppId: '', firebaseMeasurementId: '', firebaseVapidKey: '',
              privacyPolicyText: ''
            }); 
            setActiveTab('general');
            setShowModal(true); 
          }}
          className="btn-premium btn-premium-primary"
          style={{ borderRadius: '20px', height: '56px', padding: '0 25px' }}
        >
          <Plus size={20} /> Nueva Empresa
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '6rem', textAlign: 'center' }}>
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              <p className="text-slate-500 font-medium tracking-wide">Cargando empresas...</p>
            </div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', background: 'var(--bg-main)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', trackingWider: '0.1em' }}>Sede/País</th>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', trackingWider: '0.1em' }}>Identificación (NIT)</th>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', trackingWider: '0.1em' }}>Estado</th>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', trackingWider: '0.1em', textAlign: 'right' }}>Gestión</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((c) => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }} className="hover:bg-slate-50/50 transition-colors">
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '44px', height: '44px', background: 'var(--bg-main)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1', border: '1px solid #eef2ff' }}>
                        <Building2 size={22} />
                      </div>
                      <div className="flex flex-col">
                        <div className="font-bold text-slate-800">{c.name}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <img 
                            src={`https://flagcdn.com/w20/${(c.countryCode || 'co').toLowerCase()}.png`} 
                            alt={c.countryCode}
                            className="w-4 h-auto rounded-[2px]" 
                          />
                          <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">
                            {countries.find(con => con.code === c.countryCode)?.name || 'Colombia'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-muted)', fontWeight: '500' }}>{c.taxId || 'N/A'}</td>
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <span style={{ 
                      padding: '0.35rem 0.75rem', 
                      background: c.isActive ? '#ecfdf5' : '#fff1f2', 
                      color: c.isActive ? '#059669' : '#e11d48', 
                      borderRadius: '9999px', 
                      fontSize: '0.7rem', 
                      fontWeight: '800',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      textTransform: 'uppercase'
                    }}>
                      {c.isActive ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                      {c.isActive ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                    <button 
                      onClick={() => { setCurrentCompany(c); setShowModulesModal(true); }}
                      style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', padding: '0.5rem' }}
                      className="hover:scale-110 transition-transform"
                      title="Activar Módulos"
                    >
                      <Boxes size={20} />
                    </button>
                    <button 
                      onClick={() => { 
                        setFormData({ 
                          id: c.id, name: c.name, taxId: c.taxId, isActive: c.isActive, countryCode: c.countryCode || 'CO', timeZoneId: c.timeZoneId || 'SA Pacific Standard Time',
                          firebaseApiKey: c.firebaseApiKey || '', 
                          firebaseAuthDomain: c.firebaseAuthDomain || '', 
                          firebaseProjectId: c.firebaseProjectId || '', 
                          firebaseStorageBucket: c.firebaseStorageBucket || '',
                          firebaseMessagingSenderId: c.firebaseMessagingSenderId || '', 
                          firebaseAppId: c.firebaseAppId || '', 
                          firebaseMeasurementId: c.firebaseMeasurementId || '', 
                          firebaseVapidKey: c.firebaseVapidKey || '',
                          privacyPolicyText: c.privacyPolicyText || ''
                        }); 
                        setActiveTab('general');
                        setShowModal(true); 
                      }}
                      style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', padding: '0.5rem' }}
                      className="hover:scale-110 transition-transform"
                    >
                      <Edit size={20} />
                    </button>
                    {!c.isMaster && (
                      <button 
                        onClick={() => { setCurrentCompany(c); setShowConfirm(true); }}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.5rem' }}
                        className="hover:scale-110 transition-transform"
                      >
                        <Trash2 size={20} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h2 className="text-lg font-bold flex items-center gap-2" style={{ margin: 0 }}>
                {formData.id ? <Edit size={22} className="text-indigo-500" /> : <Plus size={22} className="text-indigo-500" />}
                {formData.id ? 'Editar empresa' : 'Nueva empresa'}
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem' }}
                className="hover:text-slate-600 transition-colors"
              >
                <X size={22} />
              </button>
            </div>

            {/* Tabs Selector */}
            <div className="flex border-b border-slate-100 px-6">
              <button 
                onClick={() => setActiveTab('general')}
                className={`py-3 px-4 text-xs font-bold uppercase tracking-widest transition-all border-b-2 ${activeTab === 'general' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-400'}`}
              >
                Información General
              </button>
              <button 
                onClick={() => setActiveTab('firebase')}
                className={`py-3 px-4 text-xs font-bold uppercase tracking-widest transition-all border-b-2 ${activeTab === 'firebase' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-400'}`}
              >
                Configuración Firebase
              </button>
              <button 
                onClick={() => setActiveTab('legal')}
                className={`py-3 px-4 text-xs font-bold uppercase tracking-widest transition-all border-b-2 ${activeTab === 'legal' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-400'}`}
              >
                Legal / Privacidad
              </button>
            </div>
            
            <form onSubmit={handleSave}>
              <div className="modal-body space-y-6 max-h-[60vh] overflow-y-auto p-6">
                {activeTab === 'general' ? (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nombre Comercial *</label>
                      <div className="relative">
                        <Building2 size={18} className="absolute left-3 top-4 text-slate-400" />
                        <input 
                          required 
                          value={formData.name} 
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                          className="w-full p-3 pl-10 rounded-xl border-slate-200 bg-slate-50 focus:ring-2 focus:ring-indigo-500 transition-all font-medium" 
                          placeholder="Ej. TalenHuman Corp"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">NIT / Tax ID</label>
                      <div className="relative">
                        <Hash size={18} className="absolute left-3 top-4 text-slate-400" />
                        <input 
                          required 
                          value={formData.taxId} 
                          onChange={(e) => setFormData({ ...formData, taxId: e.target.value })} 
                          className="w-full p-3 pl-10 rounded-xl border-slate-200 bg-slate-50 focus:ring-2 focus:ring-indigo-500 transition-all font-medium" 
                          placeholder="Ej. 900.123.456-7"
                        />
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-800 text-sm">Estado de la Empresa</p>
                          <p className="text-xs text-slate-500 mt-1">Habilitar o restringir el logueo.</p>
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
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">País de Operación</label>
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-10 h-8 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center overflow-hidden shadow-inner">
                            <img 
                              src={`https://flagcdn.com/w40/${(formData.countryCode || 'co').toLowerCase()}.png`} 
                              alt="preview"
                              className="w-full h-auto object-cover" 
                            />
                          </div>
                          <div className="flex-1">
                            <SearchableSelect
                                options={countries.map(c => ({ id: c.code, name: c.name }))}
                                value={formData.countryCode}
                                onChange={(val) => {
                                    const country = countries.find(c => c.code === val);
                                    setFormData({ ...formData, countryCode: val, timeZoneId: country.zone });
                                }}
                                placeholder="Seleccionar País..."
                            />
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Zona Horaria (UTC)</label>
                        <input 
                          readOnly
                          value={formData.timeZoneId} 
                          className="w-full p-3 rounded-xl border-slate-200 bg-slate-100 font-bold text-[10px] text-slate-500 uppercase tracking-tighter" 
                        />
                      </div>
                    </div>
                  </>
                ) : activeTab === 'legal' ? (
                  <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                    <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex gap-3 text-indigo-700">
                      <Shield size={20} className="shrink-0" />
                      <p className="text-[10px] font-medium leading-relaxed">
                        Configura la Política de Privacidad específica para este Tenant. Si se deja vacía, se usará la política estándar de TalenHuman. Soporta múltiples líneas.
                      </p>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Cuerpo de la Política de Privacidad</label>
                      <textarea 
                        value={formData.privacyPolicyText} 
                        onChange={(e) => setFormData({ ...formData, privacyPolicyText: e.target.value })} 
                        className="w-full p-3 rounded-xl border-slate-200 bg-slate-50 text-xs min-h-[250px] font-medium leading-relaxed custom-scrollbar" 
                        placeholder="Pegue aquí los términos legales específicos del país..."
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                    <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex gap-3 text-amber-700">
                      <AlertCircle size={20} className="shrink-0" />
                      <p className="text-[10px] font-medium leading-relaxed">
                        Configura aquí los parámetros técnicos de Firebase para este Tenant. Si se dejan vacíos, el sistema usará el proyecto global por defecto.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Firebase API Key</label>
                        <input 
                          value={formData.firebaseApiKey} 
                          onChange={(e) => setFormData({ ...formData, firebaseApiKey: e.target.value })} 
                          className="w-full p-2.5 rounded-lg border-slate-200 bg-slate-50 text-xs font-mono" 
                          placeholder="AIzaSyA..."
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Auth Domain</label>
                          <input 
                            value={formData.firebaseAuthDomain} 
                            onChange={(e) => setFormData({ ...formData, firebaseAuthDomain: e.target.value })} 
                            className="w-full p-2.5 rounded-lg border-slate-200 bg-slate-50 text-xs" 
                            placeholder="tenant.firebaseapp.com"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Project ID</label>
                          <input 
                            value={formData.firebaseProjectId} 
                            onChange={(e) => setFormData({ ...formData, firebaseProjectId: e.target.value })} 
                            className="w-full p-2.5 rounded-lg border-slate-200 bg-slate-50 text-xs" 
                            placeholder="my-project-id"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Messaging Sender ID</label>
                          <input 
                            value={formData.firebaseMessagingSenderId} 
                            onChange={(e) => setFormData({ ...formData, firebaseMessagingSenderId: e.target.value })} 
                            className="w-full p-2.5 rounded-lg border-slate-200 bg-slate-50 text-xs text-center" 
                            placeholder="123456789"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">App ID</label>
                          <input 
                            value={formData.firebaseAppId} 
                            onChange={(e) => setFormData({ ...formData, firebaseAppId: e.target.value })} 
                            className="w-full p-2.5 rounded-lg border-slate-200 bg-slate-50 text-xs text-center" 
                            placeholder="1:123:web:abc"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">VAPID Key (Public Key for Push)</label>
                        <input 
                          value={formData.firebaseVapidKey} 
                          onChange={(e) => setFormData({ ...formData, firebaseVapidKey: e.target.value })} 
                          className="w-full p-2.5 rounded-lg border-slate-200 bg-slate-50 text-[10px] font-mono whitespace-nowrap overflow-hidden text-ellipsis" 
                          placeholder="BEp..."
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn-premium btn-premium-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-premium btn-premium-primary">
                  {formData.id ? 'Guardar Cambios' : 'Crear Empresa'}
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
              <h2 className="text-xl font-bold mb-3">¿Eliminar empresa?</h2>
              <p className="text-slate-500 text-sm mb-8 px-4" style={{ lineHeight: '1.6' }}>
                Estás a punto de eliminar permanentemente a <strong>{currentCompany?.name}</strong> y todos sus datos vinculados. Esta operación es irreversible.
              </p>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={() => setShowConfirm(false)} className="btn-premium btn-premium-secondary" style={{ flex: 1 }}>
                  No, volver
                </button>
                <button onClick={handleDelete} className="btn-premium btn-premium-danger" style={{ flex: 1 }}>
                  Sí, eliminar todo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showModulesModal && currentCompany && (
        <ModuleActivationModal 
           isOpen={showModulesModal}
           onClose={() => setShowModulesModal(false)}
           companyId={currentCompany.id}
           companyName={currentCompany.name}
        />
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

export default Companies;
