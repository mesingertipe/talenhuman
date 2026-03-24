import React, { useState, useEffect } from 'react';
import { 
    Plus, X, User as UserIcon, Search, Calendar, FileText, 
    Paperclip, AlertCircle, CheckCircle, Info, ChevronRight, Layers, ArrowLeft
} from 'lucide-react';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

const NewsRequest = ({ onComplete, onCancel }) => {
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
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const { isDarkMode } = useTheme();

    useEffect(() => {
        setLoading(true);
        Promise.all([
            api.get('/novedadtipos'),
            api.get('/stores'),
            api.get('/brands')
        ]).then(([resTypes, resStores, resBrands]) => {
            setNewsTypes(resTypes.data);
            setStores(resStores.data);
            setBrands(resBrands.data);
        }).catch(err => {
            api.get('/novedadtipos').then(res => setNewsTypes(res.data));
            console.error("Error loading support data", err);
        }).finally(() => setLoading(false));
    }, []);

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    };

    const handleTypeSelection = (typeId) => {
        const type = newsTypes.find(t => t.id === typeId);
        setSelectedType(type);
        setFormData(prev => ({ ...prev, novedadTipoId: typeId }));
        setFormData(prev => ({ ...prev, empleadoId: '', storeId: '', brandId: '', datosDinamicos: {} }));
        setFoundEmployee(null);
        setCedula('');

        if (type && type.camposConfig) {
            try {
                const config = JSON.parse(type.camposConfig);
                setDynamicFields(config);
                const initialValues = {};
                config.forEach(f => initialValues[f.name] = '');
                setFormData(prev => ({ ...prev, datosDinamicos: initialValues }));
            } catch (e) {
                setDynamicFields([]);
            }
        } else {
            setDynamicFields([]);
        }
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
        } catch (err) {
            showToast("Empleado no encontrado o no activo", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.observaciones) {
            showToast("Las observaciones son obligatorias", "error");
            return;
        }
        try {
            setIsSubmitting(true);
            const payload = {
                ...formData,
                empleadoId: formData.empleadoId || null,
                storeId: formData.storeId || null,
                brandId: formData.brandId || null,
                datosDinamicos: JSON.stringify(formData.datosDinamicos)
            };
            await api.post('/novedades', payload);
            showToast("Solicitud registrada con éxito");
            setTimeout(() => {
                if (onComplete) onComplete();
            }, 2000);
        } catch (err) {
            showToast("Error al registrar solicitud", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getEntityName = () => {
        if (!selectedType) return '';
        if (selectedType.categoria === 0 && foundEmployee) return `${foundEmployee.firstName} ${foundEmployee.lastName}`;
        if (selectedType.categoria === 1) return stores.find(s => s.id === formData.storeId)?.name || 'Tienda Seleccionada';
        if (selectedType.categoria === 2) return brands.find(b => b.id === formData.brandId)?.name || 'Marca Seleccionada';
        return '';
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-[48px] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row w-full relative min-h-[600px]">
            {/* Sidebar Left */}
            <div className="bg-indigo-600 md:w-72 p-8 text-white flex shrink-0 relative overflow-hidden" style={{ flexDirection: 'column', justifyContent: 'space-between' }}>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                
                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="p-2.5 bg-white/10 rounded-[20px] backdrop-blur-md border border-white/20 shadow-xl">
                            <Plus size={24} className="text-white" />
                        </div>
                        <div className="flex flex-col" style={{ flexDirection: 'column' }}>
                            <h2 className="text-xl font-black uppercase tracking-tight leading-none">Nueva</h2>
                            <p className="text-indigo-200 text-[9px] font-black uppercase tracking-[0.2em] mt-1 opacity-80">Solicitud</p>
                        </div>
                    </div>
                    
                    <div className="space-y-8">
                        {[1, 2, 3, 4].map(s => (
                            <div key={s} className="flex items-center gap-4 group cursor-default">
                                <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black transition-all duration-500 text-xs ${step === s ? 'bg-white text-indigo-600 shadow-xl scale-110' : step > s ? 'bg-emerald-400 text-white shadow-lg shadow-emerald-500/20' : 'bg-indigo-500/50 text-indigo-100 border border-indigo-400/30'}`}>
                                    {step > s ? <CheckCircle size={18} /> : s}
                                </div>
                                <div className="flex min-w-0" style={{ flexDirection: 'column' }}>
                                    <p className={`text-[8px] font-black uppercase tracking-[0.2em] leading-none ${step >= s ? 'text-white' : 'text-indigo-300/40'}`}>
                                        Paso 0{s}
                                    </p>
                                    <p className={`text-[10px] font-black uppercase tracking-widest mt-1.5 truncate ${step === s ? 'text-white' : step > s ? 'text-emerald-300' : 'text-indigo-300/30'}`}>
                                        {s === 1 ? 'Tipificación' : s === 2 ? 'Entidad' : s === 3 ? 'Parámetros' : 'Finalizar'}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="relative z-10 pt-8 mt-auto">
                    <div className="p-5 bg-indigo-700/40 rounded-[24px] border border-indigo-400/20 backdrop-blur-md overflow-hidden" style={{ minWidth: '160px' }}>
                        <div className="flex items-center gap-2 mb-2">
                            <Info size={14} className="text-indigo-200 opacity-60 flex-shrink-0" />
                            <p className="text-[9px] text-indigo-100 font-black uppercase tracking-wider truncate">Aviso Administrativo</p>
                        </div>
                        <p className="text-[9px] text-indigo-200/80 font-medium leading-relaxed">
                            Asegúrese de adjuntar soportes legibles para evitar rechazos técnicos.
                        </p>
                    </div>
                </div>
            </div>

            {/* Content Area Right */}
            <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 min-w-0 relative">
                {/* Fixed Header within Right Side */}
                <div className="sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-30 p-8 pb-4 border-b border-transparent dark:border-slate-800/50">
                    <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 pr-10">
                            {step === 1 ? (
                                <>
                                    <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight leading-none">Categoría</h3>
                                    <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">Seleccione la naturaleza de la novedad</p>
                                    
                                    <div className="relative mt-5 max-w-md">
                                        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input 
                                            type="text"
                                            placeholder="Filtrar tipos de novedad..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                                        />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight leading-none">
                                        {step === 2 ? 'Identificación' : step === 3 ? 'Parámetros' : 'Finalización'}
                                    </h3>
                                    <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">
                                        {step === 2 ? 'Identifique el destino de la solicitud' : 'Complete la información requerida'}
                                    </p>
                                </>
                            )}
                        </div>

                        {onCancel && (
                            <button 
                                onClick={onCancel} 
                                className="p-2.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400 bg-slate-50 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all shadow-sm border border-slate-200 dark:border-slate-700"
                                title="Cerrar"
                            >
                                <X size={20} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Scrollable Body */}
                <div className="flex-1 overflow-y-auto p-8 pt-6 bespoke-scrollbar max-h-[calc(92vh-140px)]">
                    {step === 1 && (
                        <div className="grid grid-cols-1 gap-4 animate-in slide-in-from-right-8 duration-500 pb-10">
                            {newsTypes
                                .filter(type => 
                                    type.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    (type.descripcion && type.descripcion.toLowerCase().includes(searchTerm.toLowerCase()))
                                )
                                .map((type) => (
                                <button
                                    key={type.id}
                                    onClick={() => handleTypeSelection(type.id)}
                                    className={`group flex items-center p-5 rounded-3xl border-2 transition-all duration-300 text-left ${
                                        formData.novedadTipoId === type.id
                                            ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/40 shadow-xl shadow-indigo-500/10'
                                            : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-200 dark:hover:border-indigo-400/30 hover:shadow-lg'
                                    }`}
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border ${
                                                type.categoria === 0 || type.categoria === '0' ? 'bg-blue-50 border-blue-100 text-blue-600 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400' : 
                                                type.categoria === 1 || type.categoria === '1' ? 'bg-amber-50 border-amber-100 text-amber-600 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-400' : 
                                                'bg-purple-50 border-purple-100 text-purple-600 dark:bg-purple-900/30 dark:border-purple-800 dark:text-purple-400'
                                            }`}>
                                                {type.categoria === 0 || type.categoria === '0' ? 'Empleado' : type.categoria === 1 || type.categoria === '1' ? 'Tienda' : 'Marca'}
                                            </span>
                                        </div>
                                        <h4 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                            {type.nombre}
                                        </h4>
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 font-medium leading-relaxed">
                                            {type.descripcion || 'Registro operativo estandarizado'}
                                        </p>
                                    </div>
                                    <div className="ml-4 w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-600 group-hover:bg-indigo-500 group-hover:text-white group-hover:scale-110 transition-all duration-500 border border-slate-100 dark:border-slate-700 shadow-sm">
                                        <ChevronRight size={20} />
                                    </div>
                                </button>
                            ))}
                            {newsTypes.filter(type => 
                                type.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                (type.descripcion && type.descripcion.toLowerCase().includes(searchTerm.toLowerCase()))
                            ).length === 0 && (
                                <div className="p-16 text-center bg-slate-50 dark:bg-slate-800/20 rounded-[40px] border border-dashed border-slate-200 dark:border-slate-700">
                                    <Search size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                                    <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-xs">Sin coincidencias</p>
                                    <button onClick={() => setSearchTerm('')} className="mt-4 text-indigo-500 text-[10px] font-black uppercase hover:underline">Limpiar búsqueda</button>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 2 && selectedType && (
                        <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                            <div className="mb-10">
                                <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-2">
                                    {selectedType.categoria === 0 ? 'Empleado' : selectedType.categoria === 1 ? 'Tienda' : 'Marca'}
                                </h3>
                                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest">Identifique el destino de la solicitud</p>
                            </div>

                            {selectedType.categoria === 0 ? (
                                <div className="space-y-6">
                                    <div className="p-8 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-[32px] shadow-sm">
                                        <label className="block text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4 ml-1">Cédula del Colaborador</label>
                                        <div className="flex gap-4">
                                            <div className="relative flex-1">
                                                <UserIcon size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input 
                                                    type="text" 
                                                    value={cedula}
                                                    onChange={(e) => setCedula(e.target.value)}
                                                    placeholder="No. Identificación" 
                                                    className="input-premium pl-12 dark:bg-slate-900 w-full h-[56px] !text-base"
                                                    onKeyDown={(e) => e.key === 'Enter' && handleSearchEmployee()}
                                                />
                                            </div>
                                            <button onClick={handleSearchEmployee} disabled={loading || !cedula} className="btn-premium btn-premium-primary px-10 h-[56px] text-xs font-black uppercase tracking-widest">
                                                {loading ? <div className="loader !border-white !w-5 !h-5"></div> : 'Validar'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : selectedType.categoria === 1 ? (
                                <div className="space-y-4">
                                    <label className="block text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 ml-1">Sedes Corporativas</label>
                                    <select 
                                        className="input-premium h-[60px] dark:bg-slate-900 font-bold text-sm"
                                        value={formData.storeId}
                                        onChange={(e) => setFormData({...formData, storeId: e.target.value})}
                                    >
                                        <option value="">Selecciona una tienda...</option>
                                        {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <label className="block text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 ml-1">Unidades de Marca</label>
                                    <select 
                                        className="input-premium h-[60px] dark:bg-slate-900 font-bold text-sm"
                                        value={formData.brandId}
                                        onChange={(e) => setFormData({...formData, brandId: e.target.value})}
                                    >
                                        <option value="">Selecciona una marca...</option>
                                        {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                </div>
                            )}

                            <div className="flex gap-4 pt-12 mt-8 border-t border-slate-100 dark:border-slate-800">
                                <button onClick={() => setStep(1)} className="btn-premium btn-premium-secondary !h-14 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest px-8">
                                    <ArrowLeft size={18} /> Atrás
                                </button>
                                {(selectedType.categoria !== 0 || foundEmployee) && (
                                    <button 
                                        onClick={() => setStep(3)} 
                                        disabled={(selectedType.categoria === 1 && !formData.storeId) || (selectedType.categoria === 2 && !formData.brandId)}
                                        className="btn-premium btn-premium-primary !h-14 flex-1 text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-100 dark:shadow-none"
                                    >
                                        Continuar <ChevronRight size={18} />
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                            <div className="mb-10">
                                <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-2 text-indigo-600 dark:text-indigo-400">Vigencia y Datos</h3>
                                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest">Defina los parámetros operativos</p>
                            </div>
                            
                            <div className="flex items-center gap-5 p-6 bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 rounded-[32px] mb-10">
                                <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-200 dark:shadow-none">
                                    {getEntityName()?.[0] || 'N'}
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1">{selectedType?.nombre}</p>
                                    <p className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight leading-none">{getEntityName()}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 ml-1">Fecha Inicio</label>
                                    <input type="date" required value={formData.fechaInicio} onChange={(e) => setFormData({...formData, fechaInicio: e.target.value})} className="input-premium h-14 dark:bg-slate-900 font-bold" />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 ml-1">Fecha Fin</label>
                                    <input type="date" required value={formData.fechaFin} onChange={(e) => setFormData({...formData, fechaFin: e.target.value})} className="input-premium h-14 dark:bg-slate-900 font-bold" />
                                </div>
                            </div>

                            {dynamicFields.length > 0 && (
                                <div className="space-y-6 pt-10 mt-10 border-t border-slate-100 dark:border-slate-800">
                                    <h3 className="text-[11px] font-black text-slate-800 dark:text-white uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                        <Layers size={18} className="text-indigo-500" /> Atributos Adicionales
                                    </h3>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {dynamicFields.map((field, idx) => (
                                            <div key={idx} className="p-6 bg-white dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50 rounded-[28px] shadow-sm">
                                                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">
                                                    {field.name} {field.required && <span className="text-red-500">*</span>}
                                                </label>
                                                
                                                {field.type === 'check' ? (
                                                    <div className="flex items-center gap-3">
                                                        <input type="checkbox" checked={formData.datosDinamicos[field.name] === 'true'} onChange={(e) => setFormData({ ...formData, datosDinamicos: { ...formData.datosDinamicos, [field.name]: e.target.checked ? 'true' : 'false' }})} className="w-7 h-7 rounded-xl text-indigo-600 border-slate-300 dark:border-slate-700 dark:bg-slate-900 transition-all cursor-pointer" />
                                                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">Habilitar Opción</span>
                                                    </div>
                                                ) : field.type === 'select' ? (
                                                    <select value={formData.datosDinamicos[field.name] || ''} onChange={(e) => setFormData({ ...formData, datosDinamicos: { ...formData.datosDinamicos, [field.name]: e.target.value }})} className="input-premium h-12 dark:bg-slate-900 font-bold">
                                                        <option value="">Selecciona...</option>
                                                        {(field.options || '').split(',').map(opt => <option key={opt} value={opt.trim()}>{opt.trim()}</option>)}
                                                    </select>
                                                ) : field.type === 'radio' ? (
                                                    <div className="flex flex-wrap gap-5">
                                                        {(field.options || '').split(',').map(opt => {
                                                            const trimmedOpt = opt.trim();
                                                            return (
                                                                <label key={trimmedOpt} className="flex items-center gap-3 cursor-pointer group">
                                                                    <input 
                                                                        type="radio" 
                                                                        name={field.name}
                                                                        value={trimmedOpt}
                                                                        checked={formData.datosDinamicos[field.name] === trimmedOpt}
                                                                        onChange={() => setFormData({ ...formData, datosDinamicos: { ...formData.datosDinamicos, [field.name]: trimmedOpt }})}
                                                                        className="w-5 h-5 text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700 dark:bg-slate-900 transition-all cursor-pointer"
                                                                        required={field.required}
                                                                    />
                                                                    <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors uppercase tracking-tight">
                                                                        {trimmedOpt}
                                                                    </span>
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    <input type={field.type || 'text'} value={formData.datosDinamicos[field.name] || ''} onChange={(e) => setFormData({ ...formData, datosDinamicos: { ...formData.datosDinamicos, [field.name]: e.target.value }})} className="input-premium h-12 dark:bg-slate-900 font-bold" placeholder="Escriba aquí..." />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-4 pt-12 mt-10 border-t border-slate-100 dark:border-slate-800">
                                <button onClick={() => setStep(2)} className="btn-premium btn-premium-secondary !h-14 px-10 flex items-center gap-2 text-xs font-black uppercase tracking-widest">
                                    <ArrowLeft size={18} /> Atrás
                                </button>
                                <button onClick={() => setStep(4)} disabled={!formData.fechaInicio || !formData.fechaFin} className="btn-premium btn-premium-primary !h-14 flex-1 text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-50 dark:shadow-none">
                                    Siguiente <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <form onSubmit={handleSubmit} className="animate-in fade-in slide-in-from-right-8 duration-500">
                            <div className="mb-10">
                                <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-2">Observaciones</h3>
                                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest">Aclare los motivos de la solicitud</p>
                            </div>

                            <div className="space-y-8">
                                <div className="p-8 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-[40px] shadow-sm">
                                    <label className="block text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 ml-1">Exposición de Motivos <span className="text-red-500 font-bold">*</span></label>
                                    <textarea 
                                        required
                                        value={formData.observaciones}
                                        onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                                        placeholder="Detalle los pormenores administrativos..."
                                        className="input-premium h-40 dark:bg-slate-900 !py-6 !text-base font-medium leading-relaxed"
                                    />
                                </div>

                                {selectedType && selectedType.requiereAdjunto && (
                                    <div className="p-8 bg-white dark:bg-slate-800/20 border-2 border-dashed border-slate-200 dark:border-slate-700/50 rounded-[40px] text-center">
                                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                            <Paperclip size={32} />
                                        </div>
                                        <label className="block text-[11px] font-black text-slate-800 dark:text-white uppercase tracking-[0.2em] mb-2">Evidencia Documental</label>
                                        <p className="text-xs text-slate-400 dark:text-slate-500 mb-6 font-medium">Adjunte PDF o JPG para validar la solicitud</p>
                                        <input 
                                            type="text" 
                                            value={formData.adjuntoUrl}
                                            onChange={(e) => setFormData({...formData, adjuntoUrl: e.target.value})}
                                            placeholder="URL de archivo soporte..."
                                            className="input-premium dark:bg-slate-900 text-center !h-12 !text-xs font-black uppercase"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-4 pt-12 mt-10 border-t border-slate-100 dark:border-slate-800">
                                <button type="button" onClick={() => setStep(3)} className="btn-premium btn-premium-secondary !h-16 px-10 flex items-center gap-2 text-xs font-black uppercase tracking-widest">
                                    <ArrowLeft size={18} /> Atrás
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={isSubmitting || !formData.observaciones || (selectedType?.requiereAdjunto && !formData.adjuntoUrl)}
                                    className="btn-premium btn-premium-primary flex-1 h-16 text-sm font-black uppercase tracking-[0.2em] shadow-2xl shadow-indigo-100 dark:shadow-none"
                                >
                                    {isSubmitting ? <div className="loader !border-white !w-6 !h-6"></div> : 'Confirmar Registro'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>

            {toast.show && (
                <div className="toast-container">
                    <div className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>
                        {toast.type === 'success' ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
                        <span className="font-black uppercase tracking-tight">{toast.message}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NewsRequest;
