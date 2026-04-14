import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { createPortal } from 'react-dom';
import api from '../../services/api';
import { formatDate } from '../../utils/formatters';
import {
    Calendar,
    Clock,
    ChevronLeft,
    ChevronRight,
    Search,
    Save,
    Download,
    Trash2,
    Plus,
    Printer,
    Sparkles,
    CheckCircle,
    AlertCircle,
    User,
    Users as UsersIcon,
    Store,
    Info,
    FileDown,
    FileSpreadsheet,
    Copy as CopyIcon,
    ArrowRight,
    FileText,
    ShieldCheck,
    CheckSquare,
    Square,
    Activity,
    Lock,
    LogIn,
    LogOut,
    ArrowDown,
    XCircle,
    AlertTriangle,
    Cpu
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import HelpIcon from '../../components/Shared/HelpIcon';
import { formatTenantDate } from '../../utils/localization';
import SearchableSelect from '../../components/Shared/SearchableSelect';

const ShiftScheduler = ({ user, tenantSettings, readOnly = false, initialStoreId = null, initialDate = null, forceApprover = false, approvalId = null, onReady = null, suppressOverlay = false }) => {
    const { isDarkMode } = useTheme();
    
    // V13.0 PREMIUM ELITE TOKENS - RESTORED PIXEL PERFECT
    const activeColors = {
        bg: isDarkMode ? '#060914' : '#f8fafc',
        card: isDarkMode ? '#0f172a' : '#ffffff',
        border: isDarkMode ? '#1e293b' : '#f1f5f9',
        textMain: isDarkMode ? '#f1f5f9' : '#1e293b',
        textMuted: isDarkMode ? '#94a3b8' : '#64748b',
        accent: '#4f46e5',
        accentSoft: isDarkMode ? 'rgba(79, 70, 229, 0.1)' : '#f5f7ff',
        danger: '#ef4444'
    };

    const [employees, setEmployees] = useState([]);
    const [shifts, setShifts] = useState([]);
    const [attendances, setAttendances] = useState([]);
    const [news, setNews] = useState([]);
    const [stores, setStores] = useState([]);
    const [selectedStore, setSelectedStore] = useState(initialStoreId || '');
    const [loading, setLoading] = useState(!!initialStoreId || !!approvalId);
    const [isSaving, setIsSaving] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [jornadas, setJornadas] = useState([]);
    const [weekOffset, setWeekOffset] = useState(0);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [operationalSettings, setOperationalSettings] = useState(null);

    const [showTimeModal, setShowTimeModal] = useState(false);
    const [showNovModal, setShowNovModal] = useState(false);
    const [selectedNov, setSelectedNov] = useState(null);
    const [pendingEvent, setPendingEvent] = useState(null);
    const [startTime, setStartTime] = useState('08:00');
    const [endTime, setEndTime] = useState('17:00');
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [saveComment, setSaveComment] = useState('');
    const [profiles, setProfiles] = useState([]);
    const [selectedProfiles, setSelectedProfiles] = useState([]); 
    const [selectedEmployees, setSelectedEmployees] = useState([]);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [viewMode, setViewMode] = useState('SHIFTS');

    const fetchIdRef = useRef(0);
    const [weeklyStatus, setWeeklyStatus] = useState({ status: 'Empty', message: '', comment: '' });
    const [showRejectionModal, setShowRejectionModal] = useState(false);
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [rejectionComment, setRejectionComment] = useState('');
    const [approvalComment, setApprovalComment] = useState('');
    const [showPredictiveModal, setShowPredictiveModal] = useState(false);
    const [showPredictiveOverlay, setShowPredictiveOverlay] = useState(false);
    
    // V13.0 PREDICTIVE INTELLIGENCE
    const [predictiveRules, setPredictiveRules] = useState([]);

    const effectiveReadOnly = useMemo(() => {
        if (readOnly) return true;
        if (weeklyStatus.status === 'Approved') return true;
        return false;
    }, [readOnly, weeklyStatus.status]);

    const getMonday = (offset = 0) => {
        const now = new Date();
        const day = now.getDay() || 7;
        const monday = new Date(now);
        monday.setDate(now.getDate() - day + 1 + (offset * 7));
        monday.setHours(0, 0, 0, 0);
        return monday;
    };

    const [currentWeekStart, setCurrentWeekStart] = useState(() => {
        if (initialDate) {
            const parts = initialDate.split('T')[0].split('-');
            return new Date(parts[0], parts[1] - 1, parts[2]);
        }
        return getMonday(0);
    });

    useEffect(() => {
        const newMonday = getMonday(weekOffset);
        setCurrentWeekStart(newMonday);
    }, [weekOffset]);

    useEffect(() => {
        api.get('/stores').then(res => {
            const list = res.data.filter(s => s.isActive);
            setStores(list);
            if (!initialStoreId && list.length > 0) setSelectedStore(list[0].id);
        });
        api.get('/profiles').then(res => setProfiles(res.data));
        api.get('/jornadas').then(res => setJornadas(res.data));
        api.get('/predictive/rules').then(res => setPredictiveRules(res.data)).catch(() => {});
    }, []);

    const toLocalISO = (date) => {
        if (!date) return null;
        const d = new Date(date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const fetchWeeklyStatus = async () => {
        if (!selectedStore && !approvalId) return;
        try {
            let url = `/ShiftApproval/status?storeId=${selectedStore}&startDate=${toLocalISO(currentWeekStart)}`;
            if (approvalId) url = `/ShiftApproval/status?id=${approvalId}`;
            const res = await api.get(url);
            setWeeklyStatus(res.data);
            if (approvalId && res.data.weekStartDate) {
                setCurrentWeekStart(new Date(res.data.weekStartDate));
                setSelectedStore(res.data.storeId);
            }
        } catch {}
    };

    const fetchData = async () => {
        if (!selectedStore) return;
        setLoading(true);
        try {
            const startDateStr = toLocalISO(currentWeekStart);
            const endDate = new Date(currentWeekStart);
            endDate.setDate(endDate.getDate() + 7);
            const endDateStr = toLocalISO(endDate);

            const [empRes, shiftRes, newsRes, attRes] = await Promise.all([
                api.get(`/employees?storeId=${selectedStore}`),
                api.get(`/shifts?storeId=${selectedStore}&startDate=${startDateStr}&endDate=${endDateStr}`),
                api.get(`/novedades?storeId=${selectedStore}&startDate=${startDateStr}&endDate=${endDateStr}&status=1`),
                api.get(`/attendance?start=${startDateStr}&end=${endDateStr}`)
            ]);

            setEmployees(empRes.data.filter(e => e.storeId === selectedStore).map(e => ({
                ...e, id: e.id || e.Id, documento: e.identificationNumber || e.IdentificationNumber
            })));
            setShifts(shiftRes.data.map(s => ({ ...s, id: s.id || s.Id, employeeId: s.employeeId || s.EmployeeId, isDescanso: !!(s.isDescanso ?? s.IsDescanso) })));
            setAttendances((attRes.data || []).map(a => ({ ...a, id: a.id || a.Id, employeeId: a.employeeId || a.EmployeeId })));
            setNews(newsRes.data);
        } catch {}
        finally { setLoading(false); }
    };

    useEffect(() => {
        fetchData(); fetchWeeklyStatus();
    }, [selectedStore, currentWeekStart, approvalId]);

    const days = useMemo(() => Array.from({length: 7}, (_, i) => { const d = new Date(currentWeekStart); d.setDate(d.getDate() + i); return d; }), [currentWeekStart]);
    const filteredEmployees = useMemo(() => (!selectedProfiles?.length ? employees : employees.filter(e => selectedProfiles.includes(e.profileId))), [employees, selectedProfiles]);

    const showToast = (message, type = 'success') => { setToast({ show: true, message, type }); setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000); };
    const formatHours = (hours) => `${Math.floor(hours)}h ${Math.round((hours - Math.floor(hours)) * 60).toString().padStart(2, '0')}m`;

    const handleDragStart = (e, source, data) => { 
        e.dataTransfer.setData("source", source);
        e.dataTransfer.setData("payload", JSON.stringify(data));
    };

    const handleDropOnGrid = (e, targetEmpId, targetDate) => {
        e.preventDefault(); e.currentTarget.classList.remove('elite-drop-active');
        const source = e.dataTransfer.getData("source"); 
        const payload = JSON.parse(e.dataTransfer.getData("payload"));
        if (targetDate.getTime() < new Date().setHours(0,0,0,0)) return;
        
        if (source === 'PANEL') {
            if (payload.type === 'Turno') { setPendingEvent({ employeeId: targetEmpId, date: targetDate, type: 'Turno' }); setShowTimeModal(true); }
            else {
                const ns = { employeeId: targetEmpId, storeId: selectedStore, startTime: targetDate.toISOString(), endTime: targetDate.toISOString(), isDescanso: payload.type === 'Descanso', isFuera: payload.type === 'Turno Fuera' };
                setShifts(prev => [...prev.filter(s => !(s.employeeId === targetEmpId && new Date(s.startTime).toDateString() === targetDate.toDateString())), ns]);
            }
        } else {
            const s = shifts.find(sh => sh.id === payload.shiftId);
            if (!s) return;
            const start = new Date(targetDate); const os = new Date(s.startTime); start.setHours(os.getHours(), os.getMinutes());
            const end = new Date(targetDate); const oe = new Date(s.endTime); end.setHours(oe.getHours(), oe.getMinutes());
            const ns = { ...s, id: `cl-${Math.random()}`, employeeId: targetEmpId, startTime: start.toISOString(), endTime: end.toISOString() };
            setShifts(prev => [...prev.filter(sh => !(sh.employeeId === targetEmpId && new Date(sh.startTime).toDateString() === targetDate.toDateString())), ns]);
        }
    };

    const handleDropOnTrash = (e) => {
        e.preventDefault();
        const source = e.dataTransfer.getData("source");
        const payload = JSON.parse(e.dataTransfer.getData("payload"));
        if (source === 'GRID' && payload.shiftId) { setShifts(prev => prev.filter(s => s.id !== payload.shiftId)); showToast("Turno eliminado", "info"); }
    };

    const performSave = async () => {
        if (saveComment.length < 10) return;
        try {
            setIsSaving(true); setShowSaveModal(false);
            await api.post('/shifts/bulk', { storeId: selectedStore, startDate: toLocalISO(currentWeekStart), shifts, comment: saveComment });
            showToast("Sincronizado"); fetchData();
        } catch { showToast("Error", "error"); }
        finally { setIsSaving(false); }
    };

    const handleExcelExport = async () => {
        setIsExporting(true);
        try {
            const workbook = new ExcelJS.Workbook(); const worksheet = workbook.addWorksheet('Programación');
            worksheet.columns = [{header: 'CÉDULA', key: 'id'}, {header: 'NOMBRE', key: 'name'}, ...days.map((d, i) => ({header: d.toLocaleDateString(), key: `d${i}`}))];
            employees.forEach(e => {
                const row = { id: e.documento, name: `${e.firstName} ${e.lastName}` };
                days.forEach((d, i) => {
                    const s = shifts.find(sh => sh.employeeId === e.id && new Date(sh.startTime).toDateString() === d.toDateString());
                    row[`d${i}`] = s ? (s.isDescanso ? 'DESC' : `${new Date(s.startTime).getHours()}:${new Date(s.startTime).getMinutes()}`) : '---';
                });
                worksheet.addRow(row);
            });
            const buff = await workbook.xlsx.writeBuffer();
            const url = URL.createObjectURL(new Blob([buff])); const a = document.createElement('a'); a.href = url; a.download = `Programacion_${toLocalISO(currentWeekStart)}.xlsx`; a.click();
        } finally { setIsExporting(false); }
    };

    return (
        <div id="printable-area" style={{ padding: '60px 40px', minHeight: '100vh', background: activeColors.bg, color: activeColors.textMain }}>
            <style>{`
                .elite-pill { border-radius: 50px !important; transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
                .elite-drop-active { background: rgba(79, 70, 229, 0.1) !important; border: 2px dashed #4f46e5 !important; }
                .btn-chiclet { transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
                .btn-chiclet:hover { transform: scale(1.1); box-shadow: 0 10px 20px rgba(0,0,0,0.1); }
                @media print { .no-print { display: none !important; } #printable-area { background: white !important; } }
            `}</style>

            {/* V13.0 ELITE COMMAND CENTER (STABLE) */}
            <div className="no-print" style={{ marginBottom: '50px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 32px', background: isDarkMode ? 'rgba(15,23,42,0.7)' : 'white', borderRadius: '48px', backdropFilter: 'blur(30px)', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 40px 100px -20px rgba(0,0,0,0.15)', position: 'sticky', top: '30px', zIndex: 1000, overflow: 'visible' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '30px', overflow: 'visible' }}>
                    <div style={{ width: '220px', overflow: 'visible' }}>
                        <p style={{ fontSize: '9px', fontWeight: '950', color: '#4f46e5', textTransform: 'uppercase', marginBottom: '8px', marginLeft: '12px' }}>Punto de Servicio</p>
                        <SearchableSelect options={stores} value={selectedStore} onChange={setSelectedStore} placeholder="Sede..." variant="minimal" disabled={effectiveReadOnly} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: isDarkMode ? 'rgba(255,255,255,0.03)' : '#f8fafc', padding: '8px 24px', borderRadius: '40px', border: '1px solid rgba(0,0,0,0.05)' }}>
                        <button onClick={() => setWeekOffset(v => v - 1)} className="elite-pill" style={{ color: '#4f46e5', background: 'transparent', border: 'none' }}><ChevronLeft size={22}/></button>
                        <div style={{ textAlign: 'center', minWidth: '160px' }}>
                            <p style={{ fontSize: '11px', fontWeight: '900', color: isDarkMode ? 'white' : '#1e293b' }}>{formatDate(currentWeekStart)} - {formatDate(new Date(currentWeekStart.getTime() + 6*24*60*60*1000))}</p>
                        </div>
                        <button onClick={() => setWeekOffset(v => v + 1)} className="elite-pill" style={{ color: '#4f46e5', background: 'transparent', border: 'none' }}><ChevronRight size={22}/></button>
                    </div>
                    <div style={{ width: '220px', overflow: 'visible' }}>
                        <p style={{ fontSize: '9px', fontWeight: '950', color: '#4f46e5', textTransform: 'uppercase', marginBottom: '8px', marginLeft: '12px' }}>Filtro Cargos</p>
                        <SearchableSelect options={profiles} value={selectedProfiles} onChange={setSelectedProfiles} multiple={true} placeholder="Todos los Cargos" variant="minimal" icon={UsersIcon} />
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ padding: '12px 24px', borderRadius: '32px', background: weeklyStatus.status === 'Approved' ? 'rgba(16, 185, 129, 0.1)' : '#f8fafc', border: '1px solid rgba(0,0,0,0.05)', textAlign: 'center' }}>
                        <p style={{ fontSize: '8px', fontWeight: '950', color: '#64748b', textTransform: 'uppercase' }}>Estado Global</p>
                        <p style={{ fontSize: '10px', fontWeight: '950', color: weeklyStatus.status === 'Approved' ? '#10b981' : '#1e293b' }}>{weeklyStatus.status === 'Approved' ? 'APROBADO ✓' : 'BORRADOR'}</p>
                    </div>
                    {!effectiveReadOnly && (
                        <button onClick={() => { setSaveComment(''); setShowSaveModal(true); }} className="elite-pill" style={{ background: '#4f46e5', color: 'white', padding: '18px 32px', border: 'none', fontWeight: '950', fontSize: '11px', textTransform: 'uppercase', boxShadow: '0 20px 40px rgba(79, 70, 229, 0.4)' }}>
                            <Save size={20}/> Guardar Cambios
                        </button>
                    )}
                </div>
            </div>

            {/* V13.2.3 CHICLET TOOLBAR - (IA LEFT | EVENTS CENTER | TOOLS RIGHT - NO PILLS) */}
            <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px', padding: '0 20px' }}>
                {/* LEFT: Intelligence Controls */}
                <div style={{ display: 'flex', gap: '15px' }}>
                    <button onClick={() => setShowPredictiveOverlay(!showPredictiveOverlay)} className="btn-chiclet" style={{ width: '44px', height: '44px', background: showPredictiveOverlay ? '#4f46e5' : 'white', color: showPredictiveOverlay ? 'white' : '#818cf8', border: '1px solid rgba(0,0,0,0.05)', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Sparkles size={20}/>
                    </button>
                    <button onClick={() => setShowPredictiveModal(true)} className="btn-chiclet" style={{ width: '44px', height: '44px', background: '#818cf8', color: 'white', border: 'none', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Cpu size={20}/>
                    </button>
                </div>

                {/* CENTER: Events chiclets from 7f106fc */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'white', padding: '8px 20px', borderRadius: '24px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 20px 50px rgba(0,0,0,0.05)' }}>
                    {[
                        { type: 'Turno', color: 'bg-indigo-600', icon: Clock },
                        { type: 'Descanso', color: 'bg-amber-500', icon: Calendar },
                        { type: 'Turno Fuera', color: 'bg-purple-600', icon: AlertCircle }
                    ].map(t => (
                        <div key={t.type} draggable onDragStart={e => handleDragStart(e, 'PANEL', {type: t.type})} className={`w-11 h-11 ${t.color} text-white rounded-[18px] flex items-center justify-center cursor-grab btn-chiclet shadow-lg`} title={t.type}><t.icon size={20}/></div>
                    ))}
                    <div style={{ width: '1px', height: '24px', background: 'rgba(0,0,0,0.05)', margin: '0 8px' }}/>
                    <div onDragOver={e => e.preventDefault()} onDrop={handleDropOnTrash} className="w-11 h-11 bg-rose-50 text-rose-500 rounded-[18px] flex items-center justify-center border-2 border-dashed border-rose-200 btn-chiclet" title="Eliminar"><Trash2 size={20}/></div>
                </div>

                {/* RIGHT: System Tools - ALL CHICLETS - NO LONG PILLS */}
                <div style={{ display: 'flex', gap: '15px' }}>
                    <div style={{ display: 'flex', background: 'white', padding: '6px', borderRadius: '18px', border: '1px solid rgba(0,0,0,0.05)' }}>
                        <button onClick={() => setViewMode('SHIFTS')} className="btn-chiclet" style={{ width: '44px', height: '44px', border: 'none', borderRadius: '14px', background: viewMode === 'SHIFTS' ? '#4f46e5' : 'transparent', color: viewMode === 'SHIFTS' ? 'white' : '#64748b' }}><Calendar size={18}/></button>
                        <button onClick={() => setViewMode('ATTENDANCE')} className="btn-chiclet" style={{ width: '44px', height: '44px', border: 'none', borderRadius: '14px', background: viewMode === 'ATTENDANCE' ? '#4f46e5' : 'transparent', color: viewMode === 'ATTENDANCE' ? 'white' : '#64748b' }}><Clock size={18}/></button>
                    </div>
                    <button onClick={handleExcelExport} disabled={isExporting} className="btn-chiclet" style={{ width: '44px', height: '44px', background: '#10b981', color: 'white', border: 'none', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 20px rgba(16, 185, 129, 0.2)' }}>
                        <FileSpreadsheet size={20}/>
                    </button>
                    <button onClick={() => window.print()} className="btn-chiclet" style={{ width: '44px', height: '44px', background: 'white', color: '#64748b', border: '1px solid rgba(0,0,0,0.05)', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Printer size={20}/></button>
                </div>
            </div>

            {/* V13.0 MASTER GRID (RE-STABILIZED PADDING) */}
            <div style={{ background: activeColors.card, borderRadius: '60px', overflow: 'hidden', boxShadow: '0 60px 120px -20px rgba(0,0,0,0.2)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                            <th style={{ padding: '30px', textAlign: 'left', minWidth: '340px', position: 'sticky', left: 0, background: 'inherit', zIndex: 10 }}>
                                <p style={{ fontSize: '10px', fontWeight: '950', color: '#4f46e5', textTransform: 'uppercase' }}>COLABORADOR</p>
                            </th>
                            {days.map(d => (
                                <th key={d.getTime()} style={{ padding: '20px', textAlign: 'center', borderRight: '1px solid #f1f5f9' }}>
                                    <p style={{ fontSize: '1.4rem', fontWeight: '950', color: '#1e293b' }}>{d.getDate()}</p>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredEmployees.map(emp => {
                            const empShifts = shifts.filter(s => s.employeeId === emp.id);
                            const cargoName = profiles.find(p => p.id === emp.profileId)?.name || 'N/A';
                            const empJornada = jornadas.find(j => j.id === emp.jornadaId);

                            return (
                                <tr key={emp.id} style={{ borderBottom: '1px solid #f1f5f9' }} className="hover:bg-slate-50/50">
                                    <td style={{ padding: '24px 30px', position: 'sticky', left: 0, background: activeColors.card, zIndex: 10 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                            <div style={{ width: '48px', height: '48px', background: '#4f46e5', color: 'white', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '950' }}>{emp.firstName[0]}{emp.lastName[0]}</div>
                                            <div>
                                                <p style={{ fontSize: '11px', fontWeight: '950', color: '#1e293b', textTransform: 'uppercase', margin: 0 }}>{emp.firstName} {emp.lastName}</p>
                                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '4px' }}>
                                                    <span style={{ fontSize: '7px', fontWeight: '950', background: '#f5f7ff', color: '#4f46e5', padding: '2px 8px', borderRadius: '6px', textTransform: 'uppercase' }}>{cargoName}</span>
                                                    <p style={{ fontSize: '8px', color: '#94a3b8', margin: 0 }}>{empJornada?.horasSemanales || 48}H</p>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    {days.map(d => {
                                        const s = empShifts.find(sh => new Date(sh.startTime).toDateString() === d.toDateString());
                                        return (
                                            <td key={d.getTime()} onDragOver={e => e.preventDefault()} onDrop={e => handleDropOnGrid(e, emp.id, d)} style={{ padding: '10px' }}>
                                                {s && (
                                                    <div draggable onDragStart={e => handleDragStart(e, 'GRID', {shiftId: s.id})} style={{ padding: '15px 10px', borderRadius: '18px', background: s.isDescanso ? '#f59e0b' : '#4f46e5', color: 'white', textAlign: 'center', fontSize: '10px', fontWeight: '950' }}>
                                                        {s.isDescanso ? 'DESC' : `${new Date(s.startTime).getHours()}:${new Date(s.startTime).getMinutes().toString().padStart(2,'0')}`}
                                                    </div>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {createPortal(
                <>
                    {(loading || isSaving) && (
                        <div style={{ position: 'fixed', inset: 0, background: 'rgba(2, 6, 15, 0.6)', backdropFilter: 'blur(10px)', zIndex: 900000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                             <div className="loader !w-20 !h-20" />
                        </div>
                    )}
                    {showSaveModal && (
                        <div style={{ position: 'fixed', inset: 0, background: 'rgba(2, 6, 15, 0.85)', backdropFilter: 'blur(30px)', zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                             <div style={{ background: 'white', padding: '60px', borderRadius: '56px', width: '90%', maxWidth: '540px', textAlign: 'center' }}>
                                <h2 style={{ fontSize: '1.8rem', fontWeight: '950' }}>Guardar Cambios</h2>
                                <textarea value={saveComment} onChange={e => setSaveComment(e.target.value)} placeholder="Comentario obligatorio..." style={{ width: '100%', marginTop: '30px', padding: '24px', borderRadius: '28px', minHeight: '140px' }} />
                                <div style={{ display: 'flex', gap: '15px', marginTop: '30px' }}>
                                    <button onClick={() => setShowSaveModal(false)} style={{ flex: 1, padding: '20px', borderRadius: '24px', background: '#f1f5f9', border: 'none' }}>Cancelar</button>
                                    <button onClick={performSave} style={{ flex: 1, padding: '20px', borderRadius: '24px', background: '#4f46e5', color: 'white', fontWeight: '950' }}>Confirmar</button>
                                </div>
                             </div>
                        </div>
                    )}
                </>,
                document.body
            )}
        </div>
    );
};

export default ShiftScheduler;
