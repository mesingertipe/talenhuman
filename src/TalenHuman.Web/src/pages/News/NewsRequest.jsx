import React, { useState, useEffect } from 'react';
import { 
    Plus, X, User as UserIcon, Search, Calendar, FileText, 
    Paperclip, AlertCircle, CheckCircle, Info, ChevronRight, Layers, ArrowLeft,
    Building2, Store, Briefcase, Smile, Send, Upload, File, RefreshCw, Lock, Terminal, Server, Bell, Activity, UserCircle2
} from 'lucide-react';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import SearchableSelect from '../../components/Shared/SearchableSelect';

const NewsRequest = ({ onComplete, onCancel, user }) => {
    const [step, setStep] = useState(1); 
    const [loading, setLoading] = useState(false);
    const [cedula, setCedula] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [foundEmployee, setFoundEmployee] = useState(null);
    const [newsTypes, setNewsTypes] = useState([]);
    const [stores, setStores] = useState([]);
    const [brands, setBrands] = useState([]);
    const [selectedType, setSelectedType] = useState(null);
    
    const [formData, setFormData] = useState({
        empleadoId: '',
        storeId: '',
        brandId: '',
        novedadTipoId: '',
        fechaInicio: '',
        fechaFin: '',
        adjuntoUrl: '',
        observaciones: '',
        datosDinamicos: {}
    });
    const [dynamicFields, setDynamicFields] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadedFile, setUploadedFile] = useState(null);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [attachments, setAttachments] = useState([]); // List of { url, fileName }
    const { isDarkMode } = useTheme();

    // Unified Premium Colors
    const activeColors = {
        bg: isDarkMode ? '#0f172a' : '#f8fafc',
        card: isDarkMode ? '#1e293b' : '#ffffff',
        border: isDarkMode ? '#334155' : '#f1f5f9',
        textMain: isDarkMode ? '#f1f5f9' : '#1e293b',
        textMuted: isDarkMode ? '#94a3b8' : '#64748b',
        accent: '#4f46e5',
        accentHighlight: isDarkMode ? '#6366f1' : '#4f46e5'
    };

    useEffect(() => {
        setLoading(true);
        Promise.all([
            api.get('/novedadtipos'),
            api.get('/stores'),
            api.get('/brands')
        ]).then(([resTypes, resStores, resBrands]) => {
            setNewsTypes(resTypes.data);
            
            const isManager = user?.roles?.includes('Gerente');
            const isSupervisor = user?.roles?.includes('Supervisor');
            let filteredStores = resStores.data.filter(s => s.isActive);

            if (isManager && user?.storeId) {
                filteredStores = filteredStores.filter(s => s.id === user.storeId);
            } else if (isSupervisor && user?.storeIds && user.storeIds.length > 0) {
                filteredStores = filteredStores.filter(s => user.storeIds.includes(s.id));
            }
            
            setStores(filteredStores);
            setBrands(resBrands.data);
            
            if (filteredStores.length === 1) {
                setFormData(prev => ({ ...prev, storeId: filteredStores[0].id }));
            }
        }).catch(() => {
            api.get('/novedadtipos').then(res => setNewsTypes(res.data));
        }).finally(() => setLoading(false));
    }, []);

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    };

    const handleTypeSelection = (typeId) => {
        const type = newsTypes.find(t => t.id === typeId);
        setSelectedType(type);
        setFormData(prev => ({ ...prev, novedadTipoId: typeId, empleadoId: '', storeId: '', brandId: '', datosDinamicos: {} }));
        setFoundEmployee(null);
        setCedula('');

        if (type?.camposConfig) {
            try {
                const config = JSON.parse(type.camposConfig);
                setDynamicFields(config);
                const initialValues = {};
                config.forEach(f => initialValues[f.name] = '');
                setFormData(prev => ({ ...prev, datosDinamicos: initialValues }));
            } catch (e) { setDynamicFields([]); }
        } else { setDynamicFields([]); }
        setStep(2);
    };

    const handleSearchEmployee = async () => {
        if (!cedula) return;
        try {
            setLoading(true);
            const res = await api.get(`/employees/by-cedula/${cedula}`);
            setFoundEmployee(res.data);
            setFormData(prev => ({ ...prev, empleadoId: res.data.id }));
            setStep(3);
        } catch (err) { showToast("Empleado no encontrado", "error"); }
        finally { setLoading(false); }
    };
    
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setIsUploading(true);
            setUploadProgress(10);
            
            const formDataUpload = new FormData();
            formDataUpload.append('file', file);
            
            // Simulating progress since fetch doesn't easily support it without XHR
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => prev < 90 ? prev + 10 : prev);
            }, 300);

            const res = await api.post('/Files/upload?folder=novedades', formDataUpload, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            clearInterval(progressInterval);
            setUploadProgress(100);
            
            const newAttachment = { url: res.data.url, fileName: file.name };
            setAttachments(prev => [...prev, newAttachment]);
            showToast("Archivo añadido correctamente");
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.message || "Error al subir archivo";
            showToast(msg, "error");
        } finally {
            setIsUploading(false);
            setTimeout(() => setUploadProgress(0), 1000);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.observaciones) { showToast("Las observaciones son obligatorias", "error"); return; }
        try {
            setIsSubmitting(true);
            const payload = {
                ...formData,
                empleadoId: formData.empleadoId || null,
                storeId: formData.storeId || null,
                brandId: formData.brandId || null,
                adjuntos: attachments,
                datosDinamicos: JSON.stringify(formData.datosDinamicos)
            };
            await api.post('/novedades', payload);
            showToast("Solicitud registrada");
            setTimeout(() => { if (onComplete) onComplete(); }, 2000);
        } catch (err) { showToast("Error al registrar", "error"); }
        finally { setIsSubmitting(false); }
    };

    const getEntityName = () => {
        if (!selectedType) return '';
        if (selectedType.categoria === 0 && foundEmployee) return `${foundEmployee.firstName} ${foundEmployee.lastName}`;
        if (selectedType.categoria === 1) return stores.find(s => s.id === formData.storeId)?.name || 'Tienda';
        if (selectedType.categoria === 2) return brands.find(b => b.id === formData.brandId)?.name || 'Marca';
        return '';
    };

    const renderContextHeader = () => {
        if (!selectedType) return null;
        
        let title = "";
        let subtitle = "";
        let detail = "";
        let icon = null;

        if (selectedType.categoria === 0 && foundEmployee) {
            title = `${foundEmployee.firstName} ${foundEmployee.lastName}`;
            subtitle = foundEmployee.profileName || 'Colaborador';
            detail = `CC: ${foundEmployee.identificationNumber} • ${foundEmployee.storeName || ''}`;
            icon = <UserIcon size={24} />;
        } else if (selectedType.categoria === 1) {
            const store = stores.find(s => s.id === formData.storeId);
            title = store?.name || 'Tienda Seleccionada';
            subtitle = 'Gestión por Sede';
            detail = store?.externalId ? `ID: ${store.externalId}` : 'Ubicación operativa';
            icon = <Store size={24} />;
        } else if (selectedType.categoria === 2) {
            const brand = brands.find(b => b.id === formData.brandId);
            title = brand?.name || 'Marca Seleccionada';
            subtitle = 'Gestión por Marca';
            detail = 'Estrategia corporativa';
            icon = <Building2 size={24} />;
        } else {
            return null;
        }

        return (
            <div style={{ background: isDarkMode ? '#1e293b' : '#f8fafc', padding: '25px 35px', borderRadius: '32px', border: `1px solid ${activeColors.border}`, marginBottom: '35px', display: 'flex', alignItems: 'center', gap: '25px', animation: 'fadeIn 0.5s ease-out' }}>
                <div style={{ width: '60px', height: '60px', background: activeColors.accent, color: 'white', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 20px rgba(79, 70, 229, 0.2)' }}>
                    {icon}
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <h4 style={{ fontSize: '1.25rem', fontWeight: '950', color: activeColors.textMain, margin: 0, letterSpacing: '-0.02em' }}>{title}</h4>
                        <span style={{ fontSize: '8px', padding: '3px 10px', background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#ffffff', border: `1px solid ${activeColors.border}`, borderRadius: '6px', fontWeight: '900', color: activeColors.accent, textTransform: 'uppercase' }}>Validado</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                        <p style={{ fontSize: '0.85rem', fontWeight: '800', color: activeColors.textMuted, margin: 0 }}>{subtitle}</p>
                        <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#cbd5e1' }}></div>
                        <p style={{ fontSize: '0.8rem', fontWeight: '900', color: activeColors.accent, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{detail}</p>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'row', background: activeColors.card, borderRadius: '48px', overflow: 'hidden', minHeight: '650px', width: '100%', border: isDarkMode ? `1px solid ${activeColors.border}` : 'none' }}>
            {/* Sidebar Flow (Premium Elite) */}
            <div style={{ width: '320px', background: 'linear-gradient(180deg, #4f46e5 0%, #312e81 100%)', padding: '50px 40px', display: 'flex', flexDirection: 'column', color: 'white' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '60px' }}>
                    <div style={{ padding: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.2)' }}><Plus size={24} /></div>
                    <div>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: '950', margin: 0, letterSpacing: '-0.02em' }}>Nueva solicitud</h2>
                        <p style={{ fontSize: '9px', fontWeight: '800', opacity: 0.6, textTransform: 'uppercase', margin: '4px 0 0', letterSpacing: '0.15em' }}>Proceso Guiado V12</p>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '35px' }}>
                    {[1, 2, 3, 4].map(s => (
                        <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '15px', background: step === s ? 'white' : step > s ? '#10b981' : 'rgba(255,255,255,0.1)', color: step === s ? '#4f46e5' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '950', fontSize: '14px', transition: 'all 0.3s' }}>
                                {step > s ? <CheckCircle size={20} /> : s}
                            </div>
                            <div>
                                <p style={{ fontSize: '8px', fontWeight: '900', opacity: 0.4, textTransform: 'uppercase', margin: 0 }}>Paso 0{s}</p>
                                <p style={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', margin: '2px 0 0', color: step === s ? 'white' : 'rgba(255,255,255,0.3)' }}>
                                    {s === 1 ? 'Concepto' : s === 2 ? 'Entidad' : s === 3 ? 'Datos' : 'Finalizar'}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ marginTop: 'auto', padding: '25px', background: 'rgba(255,255,255,0.05)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', fontWeight: '600', lineHeight: '1.6', margin: 0, fontStyle: 'italic' }}>
                        "Recuerde validar los datos antes de confirmar para asegurar un proceso de auditoría ágil."
                    </p>
                </div>
            </div>

            {/* Content Area (Robust V12) */}
            <div style={{ flex: 1, padding: '60px', overflowY: 'auto', maxHeight: '90vh', background: activeColors.bg, position: 'relative' }}>
                <button onClick={onCancel} style={{ position: 'absolute', right: '40px', top: '40px', background: activeColors.card, border: `1px solid ${activeColors.border}`, width: '44px', height: '44px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: activeColors.textMuted }}>
                    <X size={24} />
                </button>

                {step === 1 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                        <div>
                            <h3 style={{ fontSize: '2rem', fontWeight: '950', color: activeColors.textMain, margin: 0 }}>Concepto operativo</h3>
                            <p style={{ color: activeColors.textMuted, fontSize: '0.85rem', fontWeight: '700', marginTop: '8px' }}>Categorice la naturaleza de su requerimiento</p>
                        </div>

                        <div style={{ position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '16px', top: '16px', color: '#94a3b8' }} />
                            <input 
                                type="text" 
                                placeholder="Filtrar tipos de novedad..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ width: '100%', padding: '14px 20px 14px 50px', borderRadius: '18px', background: activeColors.card, border: `1px solid ${activeColors.border}`, color: activeColors.textMain, fontSize: '0.9rem', fontWeight: '700', boxSizing: 'border-box' }}
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {newsTypes.filter(t => t.nombre.toLowerCase().includes(searchTerm.toLowerCase())).map(type => (
                                <button key={type.id} onClick={() => handleTypeSelection(type.id)} style={{ display: 'flex', alignItems: 'center', padding: '25px', borderRadius: '28px', border: `1px solid ${activeColors.border}`, background: activeColors.card, textAlign: 'left', cursor: 'pointer', transition: 'all 0.3s' }} className="hover:border-indigo-500 hover:shadow-xl group">
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                            <span style={{ fontSize: '8px', padding: '4px 10px', borderRadius: '6px', background: '#eef2ff', color: '#4f46e5', fontWeight: '950', textTransform: 'uppercase' }}>
                                                {type.categoria === 0 ? 'Empleado' : type.categoria === 1 ? 'Tienda' : 'Marca'}
                                            </span>
                                        </div>
                                        <h4 style={{ fontSize: '1.2rem', fontWeight: '950', color: activeColors.textMain, textTransform: 'uppercase', margin: 0 }} className="group-hover:text-indigo-600 transition-colors">{type.nombre}</h4>
                                        <p style={{ fontSize: '0.75rem', fontWeight: '600', color: activeColors.textMuted, marginTop: '5px' }}>{type.descripcion || 'Registro estándar operativo.'}</p>
                                    </div>
                                    <div style={{ width: '44px', height: '44px', background: isDarkMode ? '#1e293b' : '#f8fafc', borderRadius: '14px', border: `1px solid ${activeColors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1' }} className="group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                        <ChevronRight size={20} />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {step === 2 && selectedType && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                        <div>
                            <h3 style={{ fontSize: '2rem', fontWeight: '950', color: activeColors.textMain, margin: 0 }}>Identificación</h3>
                            <p style={{ color: activeColors.textMuted, fontSize: '0.85rem', fontWeight: '700', marginTop: '8px' }}>Identifique el {selectedType.categoria === 0 ? 'colaborador' : 'entorno'} afectado</p>
                        </div>

                        <div style={{ background: activeColors.card, padding: '40px', borderRadius: '32px', border: `1px solid ${activeColors.border}` }}>
                            {selectedType.categoria === 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <label style={{ fontSize: '10px', fontWeight: '950', color: activeColors.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Número de Cédula *</label>
                                    <div style={{ display: 'flex', gap: '15px' }}>
                                        <input 
                                            type="text" 
                                            value={cedula} 
                                            onChange={(e) => setCedula(e.target.value)} 
                                            placeholder="Ingresa la CC..." 
                                            style={{ flex: 1, padding: '16px', borderRadius: '16px', border: `1px solid ${activeColors.border}`, background: isDarkMode ? '#0f172a' : '#fff', color: activeColors.textMain, fontSize: '1.1rem', fontWeight: '900', textAlign: 'center' }}
                                        />
                                        <button onClick={handleSearchEmployee} disabled={loading || !cedula} style={{ padding: '0 30px', borderRadius: '16px', background: activeColors.accent, color: 'white', border: 'none', fontWeight: '900', fontSize: '12px', textTransform: 'uppercase', cursor: 'pointer' }}>
                                            {loading ? '...' : 'Validar'}
                                        </button>
                                    </div>
                                </div>
                            ) : selectedType.categoria === 1 ? (
                                <SearchableSelect
                                    label="Selecciona la Tienda *"
                                    options={stores}
                                    value={formData.storeId}
                                    onChange={(val) => setFormData({...formData, storeId: val})}
                                    placeholder="Buscar tienda..."
                                    icon={Store}
                                />
                            ) : (
                                <SearchableSelect
                                    label="Selecciona la Marca *"
                                    options={brands}
                                    value={formData.brandId}
                                    onChange={(val) => setFormData({...formData, brandId: val})}
                                    placeholder="Buscar marca..."
                                    icon={Building2}
                                />
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '15px', marginTop: 'auto' }}>
                            <button onClick={() => setStep(1)} style={{ padding: '16px 30px', borderRadius: '16px', background: 'transparent', border: `1px solid ${activeColors.border}`, color: activeColors.textMuted, fontWeight: '950', fontSize: '11px', textTransform: 'uppercase', cursor: 'pointer' }}>Atrás</button>
                            {(selectedType.categoria !== 0 || foundEmployee) && (
                                <button onClick={() => setStep(3)} style={{ flex: 1, padding: '16px', borderRadius: '16px', background: activeColors.accent, color: 'white', border: 'none', fontWeight: '950', fontSize: '11px', textTransform: 'uppercase', cursor: 'pointer', boxShadow: '0 10px 15px rgba(79, 70, 229, 0.2)' }}>Continuar</button>
                            )}
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                        <div>
                            <h3 style={{ fontSize: '2rem', fontWeight: '950', color: activeColors.textMain, margin: 0 }}>Vigencia y detalles</h3>
                            <p style={{ color: activeColors.textMuted, fontSize: '0.85rem', fontWeight: '700', marginTop: '8px' }}>Especifique los parámetros técnicos de la novedad</p>
                        </div>

                        {renderContextHeader()}

                        <div style={{ background: activeColors.card, padding: '30px', borderRadius: '32px', border: `1px solid ${activeColors.border}` }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '9px', fontWeight: '950', color: activeColors.textMuted, textTransform: 'uppercase', marginBottom: '10px' }}>Desde *</label>
                                    <input type="date" value={formData.fechaInicio} onChange={(e) => setFormData({...formData, fechaInicio: e.target.value})} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: `1px solid ${activeColors.border}`, background: isDarkMode ? '#0f172a' : '#fff', color: activeColors.textMain, fontWeight: '800' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '9px', fontWeight: '950', color: activeColors.textMuted, textTransform: 'uppercase', marginBottom: '10px' }}>Hasta *</label>
                                    <input type="date" value={formData.fechaFin} onChange={(e) => setFormData({...formData, fechaFin: e.target.value})} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: `1px solid ${activeColors.border}`, background: isDarkMode ? '#0f172a' : '#fff', color: activeColors.textMain, fontWeight: '800' }} />
                                </div>
                            </div>

                            {dynamicFields.length > 0 && (
                                <div style={{ borderTop: `1px solid ${activeColors.border}`, paddingTop: '30px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                                    {dynamicFields.map((f, i) => (
                                        <div key={i}>
                                            {f.type === 'select' || f.type === 'radio' ? (
                                                <SearchableSelect
                                                    label={`${f.name} *`}
                                                    options={f.options.split(',').map(o => ({ id: o.trim(), name: o.trim() }))}
                                                    value={formData.datosDinamicos[f.name]}
                                                    onChange={(val) => setFormData({...formData, datosDinamicos: {...formData.datosDinamicos, [f.name]: val}})}
                                                    placeholder="Seleccionar..."
                                                />
                                            ) : (
                                                <>
                                                    <label style={{ display: 'block', fontSize: '9px', fontWeight: '950', color: activeColors.textMuted, textTransform: 'uppercase', marginBottom: '10px' }}>{f.name} *</label>
                                                    <input type={f.type} value={formData.datosDinamicos[f.name]} onChange={(e) => setFormData({...formData, datosDinamicos: {...formData.datosDinamicos, [f.name]: e.target.value}})} placeholder="..." style={{ width: '100%', padding: '14px', borderRadius: '12px', border: `1px solid ${activeColors.border}`, background: isDarkMode ? '#0f172a' : '#fff', color: activeColors.textMain, fontWeight: '800' }} />
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '15px' }}>
                            <button onClick={() => setStep(2)} style={{ padding: '16px 30px', borderRadius: '16px', background: 'transparent', border: `1px solid ${activeColors.border}`, color: activeColors.textMuted, fontWeight: '950', fontSize: '11px', textTransform: 'uppercase', cursor: 'pointer' }}>Atrás</button>
                            <button onClick={() => setStep(4)} disabled={!formData.fechaInicio || !formData.fechaFin} style={{ flex: 1, padding: '16px', borderRadius: '16px', background: activeColors.accent, color: 'white', border: 'none', fontWeight: '950', fontSize: '11px', textTransform: 'uppercase', cursor: 'pointer', boxShadow: '0 10px 15px rgba(79, 70, 229, 0.2)' }}>Continuar</button>
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                        <div>
                            <h3 style={{ fontSize: '2rem', fontWeight: '950', color: activeColors.textMain, margin: 0 }}>Finalización</h3>
                            <p style={{ color: activeColors.textMuted, fontSize: '0.85rem', fontWeight: '700', marginTop: '8px' }}>Exposición de motivos y carga de archivos</p>
                        </div>

                        {renderContextHeader()}

                        <div style={{ background: activeColors.card, padding: '40px', borderRadius: '40px', border: `1px solid ${activeColors.border}` }}>
                            <label style={{ display: 'block', fontSize: '10px', fontWeight: '950', color: activeColors.textMuted, textTransform: 'uppercase', marginBottom: '15px' }}>Comentarios Administrativos *</label>
                            <textarea 
                                required 
                                value={formData.observaciones} 
                                onChange={(e) => setFormData({...formData, observaciones: e.target.value})} 
                                placeholder="Especifique los detalles de la solicitud..." 
                                style={{ width: '100%', minHeight: '150px', padding: '20px', borderRadius: '24px', border: `1px solid ${activeColors.border}`, background: isDarkMode ? '#0f172a' : '#fff', color: activeColors.textMain, fontSize: '1rem', fontWeight: '600', lineHeight: '1.6', boxSizing: 'border-box' }}
                            />
                        </div>

                        {selectedType?.requiereAdjunto && (
                            <div style={{ background: isDarkMode ? '#1e293b50' : '#f8fafc', padding: '40px', borderRadius: '32px', border: `2px dashed ${activeColors.border}`, textAlign: 'center', transition: 'all 0.3s' }} className="hover:border-indigo-400">
                                <div style={{ width: '60px', height: '60px', background: activeColors.accent, color: 'white', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 10px 20px rgba(79, 70, 229, 0.2)' }}>
                                    {isUploading ? <RefreshCw className="animate-spin" size={28} /> : <Paperclip size={28} />}
                                </div>
                                <h4 style={{ fontSize: '11px', fontWeight: '950', color: activeColors.textMain, textTransform: 'uppercase', margin: 0 }}>Documentación de Soporte</h4>
                                <p style={{ fontSize: '10px', color: activeColors.textMuted, fontWeight: '700', margin: '8px 0 25px' }}>Adjunte evidencia en formato PDF o Imagen (Máx 10MB)</p>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                                    {attachments.map((file, idx) => (
                                        <div key={idx} style={{ background: isDarkMode ? '#0f172a' : '#fff', padding: '12px 20px', borderRadius: '16px', border: `1px solid ${activeColors.border}`, display: 'flex', alignItems: 'center', justifyBetween: 'space-between', gap: '15px', animation: 'fadeIn 0.3s' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                                                <div style={{ width: '24px', height: '24px', background: '#10b98120', color: '#10b981', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <File size={14} />
                                                </div>
                                                <p style={{ fontSize: '11px', fontWeight: '900', color: activeColors.textMain, margin: 0 }}>{file.fileName}</p>
                                            </div>
                                            <button type="button" onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '5px' }}>
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <div style={{ position: 'relative', display: 'inline-block' }}>
                                    <input 
                                        type="file" 
                                        onChange={handleFileUpload}
                                        disabled={isUploading}
                                        style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
                                    />
                                    <div style={{ padding: '12px 30px', background: activeColors.card, border: `1px solid ${activeColors.border}`, borderRadius: '14px', color: activeColors.textMain, fontWeight: '950', fontSize: '11px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <Upload size={16} /> {isUploading ? 'Subiendo...' : 'Añadir Archivo'}
                                    </div>
                                </div>

                                {uploadProgress > 0 && uploadProgress < 100 && (
                                    <div style={{ width: '200px', height: '6px', background: '#e2e8f0', borderRadius: '3px', margin: '20px auto 0', overflow: 'hidden' }}>
                                        <div style={{ width: `${uploadProgress}%`, height: '100%', background: activeColors.accent, transition: 'width 0.3s ease' }}></div>
                                    </div>
                                )}
                                
                                {selectedType?.requiereAdjunto && attachments.length === 0 && (
                                    <p style={{ color: '#ef4444', fontSize: '10px', fontWeight: '900', marginTop: '15px' }}>* ES OBLIGATORIO CARGAR AL MENOS UN ARCHIVO PARA ESTA NOVEDAD</p>
                                )}
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                            <button type="button" onClick={() => setStep(3)} style={{ padding: '16px 30px', borderRadius: '16px', background: 'transparent', border: `1px solid ${activeColors.border}`, color: activeColors.textMuted, fontWeight: '950', fontSize: '11px', textTransform: 'uppercase', cursor: 'pointer' }}>Atrás</button>
                            <button 
                                type="submit" 
                                disabled={isSubmitting || !formData.observaciones || (selectedType?.requiereAdjunto && attachments.length === 0)} 
                                style={{ flex: 1, padding: '16px', borderRadius: '20px', background: activeColors.accent, color: 'white', border: 'none', fontWeight: '950', fontSize: '12px', textTransform: 'uppercase', cursor: 'pointer', boxShadow: '0 20px 40px rgba(79, 70, 229, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}
                            >
                                {isSubmitting ? 'Procesando...' : <><Send size={20} /> Confirmar Solicitud</>}
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {/* Local Toast V12 */}
            {toast.show && (
                <div style={{ position: 'fixed', bottom: '40px', right: '40px', zIndex: 11000, background: toast.type === 'success' ? '#10b981' : '#ef4444', color: 'white', padding: '16px 30px', borderRadius: '20px', fontWeight: '900', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.15em', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 15px 30px rgba(0,0,0,0.2)' }}>
                    {toast.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    {toast.message}
                </div>
            )}
        </div>
    );
};

export default NewsRequest;
