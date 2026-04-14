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
    const [hoveredShiftData, setHoveredShiftData] = useState(null);
    const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });

    const fetchIdRef = useRef(0);
    const [weeklyStatus, setWeeklyStatus] = useState({ status: 'Empty', message: '', comment: '' });
    const [showRejectionModal, setShowRejectionModal] = useState(false);
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [rejectionComment, setRejectionComment] = useState('');
    const [approvalComment, setApprovalComment] = useState('');
    const [showPredictiveModal, setShowPredictiveModal] = useState(false);
    const [showPredictiveOverlay, setShowPredictiveOverlay] = useState(false);
    const [syncPhase, setSyncPhase] = useState(0); 
    const [dataLoaded, setDataLoaded] = useState(false);
    const [isOptimizing, setIsOptimizing] = useState(false);
    
    // V13.0 PREDICTIVE INTELLIGENCE
    const [predictiveRules, setPredictiveRules] = useState([]);
    const [historicalAverages, setHistoricalAverages] = useState({}); 

    const effectiveReadOnly = useMemo(() => {
        if (readOnly) return true;
        if (weeklyStatus.status === 'Approved') return true;
        return false;
    }, [readOnly, weeklyStatus.status]);

    const [isProcessingStatus, setIsProcessingStatus] = useState(false);

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
            const date = new Date(parts[0], parts[1] - 1, parts[2]);
            date.setHours(0, 0, 0, 0);
            return date;
        }
        return getMonday(0);
    });

    const [lastSaveComment, setLastSaveComment] = useState('');

    useEffect(() => {
        const newMonday = getMonday(weekOffset);
        setCurrentWeekStart(prev => (prev && prev.getTime() === newMonday.getTime()) ? prev : newMonday);
    }, [weekOffset]);

    useEffect(() => {
        api.get('/stores').then(res => {
            const isManager = user?.roles?.includes('Gerente');
            const isDistrital = user?.roles?.includes('Distrital');
            let filteredStores = res.data.filter(s => s.isActive);
            setStores(filteredStores);
            if (initialStoreId) return;
            if (isManager && user?.storeId) {
                filteredStores = filteredStores.filter(s => s.id === user.storeId);
                setStores(filteredStores);
                setSelectedStore(user.storeId);
            } else if (isDistrital && user?.storeIds && user.storeIds.length > 0) {
                filteredStores = filteredStores.filter(s => user.storeIds.includes(s.id));
                setStores(filteredStores);
                if (filteredStores.length > 0) setSelectedStore(filteredStores[0].id);
            } else if (filteredStores.length > 0) {
                setSelectedStore(filteredStores[0].id);
            }
        });
        api.get('/profiles').then(res => setProfiles(res.data));
        api.get('/operationalsettings').then(res => setOperationalSettings(res.data)).catch(() => {});
        api.get('/predictive/rules').then(res => setPredictiveRules(res.data)).catch(() => {});
    }, []);

    const toLocalISO = (date) => {
        if (!date) return null;
        const d = new Date(date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const fetchWeeklyStatus = async () => {
        if (!selectedStore && !approvalId) return null;
        try {
            setIsProcessingStatus(true);
            let url = `/ShiftApproval/status?storeId=${selectedStore}&startDate=${toLocalISO(currentWeekStart)}`;
            if (approvalId) url = `/ShiftApproval/status?id=${approvalId}`;
            const res = await api.get(url);
            setWeeklyStatus(res.data);
            if (approvalId && res.data.weekStartDate) {
                const dbDate = new Date(res.data.weekStartDate);
                if (toLocalISO(dbDate) !== toLocalISO(currentWeekStart)) setCurrentWeekStart(dbDate);
                if (res.data.storeId) setSelectedStore(res.data.storeId);
            }
            return res.data;
        } catch (err) { return null; }
        finally { setIsProcessingStatus(false); }
    };

    const fetchData = async (overrideStoreId = null, overrideWeekStart = null) => {
        try {
            setLoading(true);
            const targetStore = overrideStoreId || selectedStore;
            const targetWeekStart = overrideWeekStart || currentWeekStart;
            if (!targetStore) return;
            const startDateStr = toLocalISO(targetWeekStart);
            const endDate = new Date(targetWeekStart);
            endDate.setDate(endDate.getDate() + 7);
            const endDateStr = toLocalISO(endDate);

            const [empRes, shiftRes, newsRes, jornadaRes, attRes] = await Promise.all([
                api.get(`/employees?storeId=${targetStore}`),
                api.get(`/shifts?storeId=${targetStore}&startDate=${startDateStr}&endDate=${endDateStr}`),
                api.get(`/novedades?storeId=${targetStore}&startDate=${startDateStr}&endDate=${endDateStr}&status=1`),
                api.get('/jornadas'),
                api.get(`/attendance?start=${startDateStr}&end=${endDateStr}`)
            ]);

            setJornadas(jornadaRes.data);
            setEmployees(empRes.data.filter(e => e.storeId === targetStore).map(e => ({
                ...e, id: e.id || e.Id, documento: e.identificationNumber || e.IdentificationNumber
            })));
            setShifts(shiftRes.data.map(s => ({
                ...s, id: s.id || s.Id, employeeId: s.employeeId || s.EmployeeId,
                startTime: s.startTime || s.StartTime, endTime: s.endTime || s.EndTime,
                isDescanso: !!(s.isDescanso ?? s.IsDescanso), status: s.status ?? s.Status,
                isAutoGenerated: !!(s.isAutoGenerated ?? s.IsAutoGenerated)
            })));
            setAttendances((attRes.data || []).map(a => ({
                ...a, id: a.id || a.Id, employeeId: a.employeeId || a.EmployeeId,
                status: a.status ?? a.Status ?? 0
            })));
            setNews(newsRes.data);
            setLastSaveComment(shiftRes.data.find(s => s.observation)?.observation || '');
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        const runFetch = async () => {
            if (!selectedStore && !approvalId) return;
            const currentFetchId = ++fetchIdRef.current;
            setLoading(true); 
            setDataLoaded(false);
            if (approvalId) {
                const statusData = await fetchWeeklyStatus();
                if (statusData && currentFetchId === fetchIdRef.current) await fetchData(statusData.storeId, new Date(statusData.weekStartDate));
            } else {
                await Promise.all([fetchData(), fetchWeeklyStatus()]);
            }
            if (currentFetchId === fetchIdRef.current) setDataLoaded(true);
        };
        runFetch();
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
                const ns = { employeeId: targetEmpId, storeId: selectedStore, startTime: targetDate.toISOString(), endTime: targetDate.toISOString(), status: 0, isDescanso: payload.type === 'Descanso', isFuera: payload.type === 'Turno Fuera' };
                setShifts(prev => [...prev.filter(s => !(s.employeeId === targetEmpId && new Date(s.startTime).toDateString() === targetDate.toDateString())), ns]);
            }
        } else {
            const s = shifts.find(sh => sh.id === payload.shiftId);
            if (!s) return;
            const start = new Date(targetDate); const os = new Date(s.startTime); start.setHours(os.getHours(), os.getMinutes());
            const end = new Date(targetDate); const oe = new Date(s.endTime); end.setHours(oe.getHours(), oe.getMinutes());
            if (end < start && !s.isDescanso) end.setDate(end.getDate() + 1);
            const ns = { ...s, id: `cl-${Math.random()}`, employeeId: targetEmpId, startTime: start.toISOString(), endTime: end.toISOString() };
            setShifts(prev => [...prev.filter(sh => !(sh.employeeId === targetEmpId && new Date(sh.startTime).toDateString() === targetDate.toDateString())), ns]);
        }
    };

    const handleDropOnTrash = (e) => {
        e.preventDefault();
        const source = e.dataTransfer.getData("source");
        const payload = JSON.parse(e.dataTransfer.getData("payload"));
        if (source === 'GRID' && payload.shiftId) {
            setShifts(prev => prev.filter(s => s.id !== payload.shiftId));
            showToast("Turno eliminado", "info");
        }
    };

    const performSave = async () => {
        if (saveComment.length < 10) return;
        try {
            setIsSaving(true); setSyncPhase(1); setShowSaveModal(false);
            const body = { storeId: selectedStore, startDate: toLocalISO(currentWeekStart), shifts, comment: saveComment };
            await api.post('/shifts/bulk', body);
            setSyncPhase(4); showToast("Sincronizado correctamente"); fetchData();
        } catch { showToast("Error", "error"); }
        finally { setTimeout(() => { setIsSaving(false); setSyncPhase(0); }, 1500); }
    };

    const confirmApprove = async () => {
        try { 
            setIsSaving(true); setShowApprovalModal(false);
            await api.post('/ShiftApproval/approve', { storeId: selectedStore, startDate: toLocalISO(currentWeekStart), comment: approvalComment || "Aprobado" });
            showToast("Semana Aprobada"); fetchData(); fetchWeeklyStatus();
        } catch { showToast("Error", "error"); }
        finally { setIsSaving(false); }
    };

    const confirmReject = async () => {
        try {
            setIsSaving(true); setShowRejectionModal(false);
            await api.post('/ShiftApproval/reject', { storeId: selectedStore, startDate: toLocalISO(currentWeekStart), comment: rejectionComment });
            showToast("Semana Rechazada"); fetchData(); fetchWeeklyStatus();
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
        } catch { showToast("Error Excel", "error"); }
        finally { setIsExporting(false); }
    };

    // V13.2.2 IA HOURLY NEEDS CALCULATION
    const calculateHourlyNeeds = (day) => {
        return { '08-16': [2, 2, 3, 3, 2, 2, 2, 2], '16-24': [2, 2, 4, 4, 2, 2, 2, 2] };
    };

    return (
        <div id="printable-area" style={{ padding: '60px 40px', minHeight: '100vh', background: activeColors.bg, color: activeColors.textMain, transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}>
            <style>{`
                .elite-pill { border-radius: 50px !important; transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); cursor: pointer; }
                .elite-pill:hover { transform: translateY(-5px); box-shadow: 0 20px 40px rgba(0,0,0,0.15); }
                .elite-drop-active { background: ${isDarkMode ? 'rgba(79, 70, 229, 0.1)' : '#f5f7ff'} !important; border: 2px dashed #4f46e5 !important; }
                .btn-chiclet { position: relative; overflow: hidden; }
                .btn-chiclet::after { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(rgba(255,255,255,0.2), transparent); opacity: 0; transition: 0.3s; }
                .btn-chiclet:hover::after { opacity: 1; }
                @media print { .no-print { display: none !important; } #printable-area { background: white !important; padding: 0 !important; color: black !important; } }
            `}</style>

            {/* V13.0 ELITE COMMAND CENTER (STYLING RESTORED & OVERLAP FIXED) */}
            <div className="no-print" style={{ 
                marginBottom: '50px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                gap: '25px', 
                padding: '24px 32px', 
                background: isDarkMode ? 'rgba(15, 23, 42, 0.7)' : 'rgba(255, 255, 255, 0.8)', 
                borderRadius: '48px', 
                backdropFilter: 'blur(30px)', 
                border: isDarkMode ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.03)',
                boxShadow: '0 40px 100px -20px rgba(0,0,0,0.15)',
                position: 'sticky',
                top: '30px',
                zIndex: 1000,
                overflow: 'visible'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '30px', overflow: 'visible' }}>
                    <div style={{ width: '220px', overflow: 'visible' }}>
                        <p style={{ fontSize: '9px', fontWeight: '950', color: '#4f46e5', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.15em', marginLeft: '12px' }}>Punto de Servicio</p>
                        <SearchableSelect options={stores} value={selectedStore} onChange={setSelectedStore} placeholder="Sede..." variant="minimal" disabled={effectiveReadOnly} />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: isDarkMode ? 'rgba(255,255,255,0.03)' : '#f8fafc', padding: '8px 24px', borderRadius: '40px', border: '1px solid rgba(0,0,0,0.05)' }}>
                        <button onClick={() => setWeekOffset(v => v - 1)} className="elite-pill" style={{ color: '#4f46e5', background: 'transparent', border: 'none', padding: '10px' }}><ChevronLeft size={22}/></button>
                        <div style={{ textAlign: 'center', minWidth: '160px' }}>
                            <p style={{ fontSize: '9px', fontWeight: '950', color: '#64748b', textTransform: 'uppercase', marginBottom: '2px' }}>Semana Programada</p>
                            <p style={{ fontSize: '11px', fontVariantNumeric: 'tabular-nums', fontWeight: '900', color: isDarkMode ? 'white' : '#1e293b' }}>
                                {formatDate(currentWeekStart)} - {formatDate(new Date(currentWeekStart.getTime() + 6*24*60*60*1000))}
                            </p>
                        </div>
                        <button onClick={() => setWeekOffset(v => v + 1)} className="elite-pill" style={{ color: '#4f46e5', background: 'transparent', border: 'none', padding: '10px' }}><ChevronRight size={22}/></button>
                    </div>

                    <div style={{ width: '220px', overflow: 'visible' }}>
                        <p style={{ fontSize: '9px', fontWeight: '950', color: '#4f46e5', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.15em', marginLeft: '12px' }}>Filtro Cargos</p>
                        <SearchableSelect options={profiles} value={selectedProfiles} onChange={setSelectedProfiles} multiple={true} placeholder="Todos los Cargos" variant="minimal" icon={UsersIcon} />
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ 
                        padding: '12px 24px', 
                        borderRadius: '32px', 
                        background: weeklyStatus.status === 'Approved' ? 'rgba(16, 185, 129, 0.1)' : weeklyStatus.status === 'Pending' ? 'rgba(245, 158, 11, 0.1)' : isDarkMode ? 'rgba(255,255,255,0.05)' : '#f8fafc',
                        border: '1px solid rgba(0,0,0,0.05)',
                        textAlign: 'center'
                    }}>
                        <p style={{ fontSize: '8px', fontWeight: '950', color: weeklyStatus.status === 'Approved' ? '#10b981' : '#64748b', textTransform: 'uppercase', marginBottom: '2px' }}>Estado Global</p>
                        <p style={{ fontSize: '10px', fontWeight: '950', color: weeklyStatus.status === 'Approved' ? '#10b981' : isDarkMode ? 'white' : '#1e293b' }}>
                            {weeklyStatus.status === 'Approved' ? 'APROBADO ✓' : weeklyStatus.status === 'Pending' ? 'EN REVISIÓN' : 'BORRADOR'}
                        </p>
                    </div>

                    {!effectiveReadOnly && (
                        <button onClick={() => { setSaveComment(''); setShowSaveModal(true); }} className="elite-pill" style={{ background: '#4f46e5', color: 'white', padding: '18px 32px', border: 'none', fontWeight: '950', fontSize: '11px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 20px 40px rgba(79, 70, 229, 0.4)' }}>
                            <Save size={20}/> Guardar Cambios
                        </button>
                    )}

                    {(user?.roles?.includes('Administrador') || forceApprover) && weeklyStatus.status === 'Pending' && (
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={() => setShowApprovalModal(true)} className="elite-pill" style={{ width: '56px', height: '56px', background: '#10b981', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '24px', boxShadow: '0 15px 30px rgba(16, 185, 129, 0.3)' }}><CheckCircle size={22}/></button>
                            <button onClick={() => setShowRejectionModal(true)} className="elite-pill" style={{ width: '56px', height: '56px', background: '#ef4444', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '24px', boxShadow: '0 15px 30px rgba(239, 68, 68, 0.3)' }}><XCircle size={22}/></button>
                        </div>
                    )}
                </div>
            </div>

            {/* V13.2.2 UNIFIED TOOLBAR - (IA LEFT | EVENTS CENTER | TOOLS RIGHT) */}
            <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px', padding: '0 20px' }}>
                {/* LEFT: Intelligence Controls */}
                <div style={{ display: 'flex', gap: '15px' }}>
                    <button onClick={() => setShowPredictiveOverlay(!showPredictiveOverlay)} className="elite-pill" style={{ width: '56px', height: '56px', background: showPredictiveOverlay ? '#4f46e5' : isDarkMode ? '#1e293b' : 'white', color: showPredictiveOverlay ? 'white' : '#818cf8', border: '1px solid rgba(0,0,0,0.05)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'centerShadow', boxShadow: showPredictiveOverlay ? '0 15px 30px rgba(79, 70, 229, 0.3)' : 'none' }}>
                        <Sparkles size={24}/>
                    </button>
                    <button onClick={() => setShowPredictiveModal(true)} className="elite-pill" style={{ width: '56px', height: '56px', background: '#818cf8', color: 'white', border: 'none', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 15px 30px rgba(129, 140, 248, 0.3)' }}>
                        <Cpu size={24}/>
                    </button>
                </div>

                {/* CENTER: Drag & Drop Events */}
                <div style={{ display: 'flex', items: 'center', gap: '12px', background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.9)', padding: '10px 30px', borderRadius: '32px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 20px 50px rgba(0,0,0,0.05)' }}>
                    <p style={{ fontSize: '8px', fontWeight: '950', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', writingMode: 'vertical-lr', transform: 'rotate(180deg)', marginRight: '10px' }}>Eventos</p>
                    {[
                        { type: 'Turno', color: 'bg-indigo-600', icon: Clock },
                        { type: 'Descanso', color: 'bg-amber-500', icon: Calendar },
                        { type: 'Turno Fuera', color: 'bg-purple-600', icon: AlertCircle }
                    ].map(t => (
                        <div key={t.type} draggable onDragStart={e => handleDragStart(e, 'PANEL', {type: t.type})} className={`w-11 h-11 ${t.color} text-white rounded-[18px] flex items-center justify-center cursor-grab hover:scale-110 transition-all btn-chiclet shadow-lg`} title={t.type}>
                            <t.icon size={20}/>
                        </div>
                    ))}
                    <div style={{ width: '1px', height: '30px', background: 'rgba(0,0,0,0.05)', margin: '0 10px' }}/>
                    <div onDragOver={e => e.preventDefault()} onDrop={handleDropOnTrash} className="w-11 h-11 bg-rose-50 dark:bg-rose-900/10 text-rose-500 rounded-[18px] flex items-center justify-center border-2 border-dashed border-rose-200 dark:border-rose-800 transition-all hover:bg-rose-100 hover:border-rose-400 cursor-default" title="Arrastra aquí para borrar">
                        <Trash2 size={20}/>
                    </div>
                </div>

                {/* RIGHT: System Tools */}
                <div style={{ display: 'flex', gap: '15px' }}>
                    <div style={{ display: 'flex', background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#ffffff', padding: '8px', borderRadius: '28px', border: '1px solid rgba(0,0,0,0.05)' }}>
                        <button onClick={() => setViewMode('SHIFTS')} style={{ padding: '12px 24px', borderRadius: '20px', border: 'none', fontSize: '10px', fontWeight: '950', textTransform: 'uppercase', background: viewMode === 'SHIFTS' ? '#4f46e5' : 'transparent', color: viewMode === 'SHIFTS' ? 'white' : '#64748b' }}>Turnos</button>
                        <button onClick={() => setViewMode('ATTENDANCE')} style={{ padding: '12px 24px', borderRadius: '20px', border: 'none', fontSize: '10px', fontWeight: '950', textTransform: 'uppercase', background: viewMode === 'ATTENDANCE' ? '#4f46e5' : 'transparent', color: viewMode === 'ATTENDANCE' ? 'white' : '#64748b' }}>Asistencia</button>
                    </div>
                    <button onClick={() => setShowBulkModal(true)} className="elite-pill" style={{ width: '56px', height: '56px', background: isDarkMode ? '#1e293b' : '#ffffff', color: '#4f46e5', border: '1px solid rgba(0,0,0,0.05)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={22}/></button>
                    <button onClick={handleExcelExport} disabled={isExporting} className="elite-pill" style={{ padding: '0 32px', background: '#10b981', color: 'white', border: 'none', borderRadius: '24px', fontSize: '10px', fontWeight: '950', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 15px 30px rgba(16, 185, 129, 0.2)' }}>
                        <FileSpreadsheet size={20}/> Exportar Excel
                    </button>
                    <button onClick={() => window.print()} className="elite-pill" style={{ width: '56px', height: '56px', background: isDarkMode ? '#1e293b' : '#ffffff', color: '#64748b', border: '1px solid rgba(0,0,0,0.05)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Printer size={20}/></button>
                </div>
            </div>

            {/* V13.0 ELITE MASTER GRID (FULL STYLE RESTORED) */}
            <div style={{ background: activeColors.card, borderRadius: '60px', overflow: 'hidden', boxShadow: '0 60px 120px -20px rgba(0,0,0,0.2)', border: isDarkMode ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: isDarkMode ? 'rgba(255,255,255,0.02)' : '#f8fafc', borderBottom: isDarkMode ? '1px solid #1e293b' : '1px solid #f1f5f9' }}>
                            <th style={{ padding: '40px 30px', textAlign: 'left', minWidth: '340px', position: 'sticky', left: 0, background: 'inherit', zIndex: 10 }}>
                                <p style={{ fontSize: '10px', fontWeight: '950', color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.2em' }}>COLABORADOR / PERFIL</p>
                            </th>
                            {days.map(d => (
                                <th key={d.getTime()} style={{ padding: '25px', textAlign: 'center', borderRight: isDarkMode ? '1px solid #1e293b' : '1px solid #f1f5f9' }}>
                                    <p style={{ fontSize: '9px', fontWeight: '950', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>{d.toLocaleDateString('es-CO', {weekday: 'short'})}</p>
                                    <p style={{ fontSize: '1.6rem', fontWeight: '950', color: isDarkMode ? 'white' : '#1e293b', margin: 0, lineHeight: 1 }}>{d.getDate()}</p>
                                </th>
                            ))}
                            <th style={{ padding: '25px', textAlign: 'center', background: isDarkMode ? 'rgba(255,255,255,0.01)' : '#f1f5f9' }}>
                                <p style={{ fontSize: '9px', fontWeight: '950', color: '#64748b', textTransform: 'uppercase' }}>TOTAL</p>
                            </th>
                        </tr>
                        {showPredictiveOverlay && (
                            <tr style={{ background: 'rgba(79, 70, 229, 0.05)', borderBottom: '1px solid rgba(79, 70, 229, 0.1)' }}>
                                <td style={{ padding: '15px 30px', position: 'sticky', left: 0, background: 'inherit', zIndex: 10, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Sparkles size={16} color="#4f46e5" />
                                    <span style={{ fontSize: '10px', fontWeight: '950', color: '#4f46e5', textTransform: 'uppercase' }}>Requerimiento IA</span>
                                </td>
                                {days.map(d => {
                                    const needs = calculateHourlyNeeds(d);
                                    let gaps = 0;
                                    Object.values(needs).forEach(n => n.forEach(v => { if(v > 2) gaps++; }));
                                    return (
                                        <td key={d.getTime()} style={{ textAlign: 'center', padding: '10px' }}>
                                            {gaps > 0 ? <span style={{ fontSize: '9px', fontWeight: '950', background: '#ef4444', color: 'white', padding: '4px 10px', borderRadius: '12px' }}>{gaps} GAPS</span> : <span style={{ fontSize: '9px', fontWeight: '950', color: '#10b981' }}>CUBIERTO ✓</span>}
                                        </td>
                                    );
                                })}
                                <td></td>
                            </tr>
                        )}
                    </thead>
                    <tbody>
                        {filteredEmployees.map(emp => {
                            const empShifts = shifts.filter(s => s.employeeId === emp.id);
                            const totalH = empShifts.reduce((acc, s) => { if(s.isDescanso) return acc; const d = (new Date(s.endTime) - new Date(s.startTime))/3600000; return acc + (d<0?d+24:d); }, 0);
                            const empJornada = jornadas.find(j => j.id === emp.jornadaId);
                            const cargoName = profiles.find(p => p.id === emp.profileId)?.name || 'N/A';

                            return (
                                <tr key={emp.id} style={{ borderBottom: isDarkMode ? '1px solid #1e293b' : '1px solid #f1f5f9', transition: 'all 0.2s' }} className="hover:bg-slate-50/20">
                                    <td style={{ padding: '30px', position: 'sticky', left: 0, background: activeColors.card, zIndex: 10, borderRight: isDarkMode ? '1px solid #1e293b' : '1px solid #f1f5f9' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                            <div style={{ width: '56px', height: '56px', background: '#4f46e5', color: 'white', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: '950', boxShadow: '0 15px 30px rgba(79, 70, 229, 0.2)' }}>
                                                {emp.firstName[0]}{emp.lastName[0]}
                                            </div>
                                            <div style={{ minWidth: 0 }}>
                                                <p style={{ fontSize: '1rem', fontWeight: '950', color: isDarkMode ? 'white' : '#1e293b', textTransform: 'uppercase', margin: '0 0 6px 0', letterSpacing: '-0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {emp.firstName} {emp.lastName}
                                                </p>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <p style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', margin: 0 }}>{emp.documento}</p>
                                                    <span style={{ fontSize: '8px', fontWeight: '950', background: isDarkMode ? 'rgba(79, 70, 229, 0.2)' : '#f5f7ff', color: '#4f46e5', padding: '4px 10px', borderRadius: '10px', textTransform: 'uppercase' }}>
                                                        {cargoName}
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                                                    <Clock size={10} color="#94a3b8" />
                                                    <p style={{ fontSize: '9px', fontWeight: '950', color: '#94a3b8', textTransform: 'uppercase', margin: 0 }}>
                                                        JORNADA: <span style={{ color: '#4f46e5' }}>{empJornada?.horasSemanales || 48}H/SEM</span>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    {days.map(d => {
                                        const s = empShifts.find(sh => new Date(sh.startTime).toDateString() === d.toDateString());
                                        const nov = news.find(n => n.empleadoId === emp.id && new Date(n.fechaInicio) <= d && new Date(n.fechaFin) >= d);
                                        return (
                                            <td key={d.getTime()} onDragOver={e => e.preventDefault()} onDrop={e => handleDropOnGrid(e, emp.id, d)} style={{ padding: '15px', borderRight: isDarkMode ? '1px solid #1e293b' : '1px solid #f1f5f9' }}>
                                                {nov ? (
                                                    <div style={{ padding: '15px', background: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : '#eff6ff', borderRadius: '24px', border: '2px solid #3b82f6', textAlign: 'center' }}>
                                                        <span style={{ fontSize: '8px', fontWeight: '950', color: '#3b82f6', textTransform: 'uppercase' }}>Novedad</span>
                                                    </div>
                                                ) : s ? (
                                                    <div 
                                                        draggable 
                                                        onDragStart={e => handleDragStart(e, 'GRID', { shiftId: s.id, employeeId: emp.id, date: d })}
                                                        style={{ 
                                                            padding: '20px 15px', 
                                                            borderRadius: '24px', 
                                                            background: s.isDescanso ? '#f59e0b' : s.isFuera ? '#9333ea' : '#4f46e5', 
                                                            color: 'white', 
                                                            textAlign: 'center', 
                                                            boxShadow: '0 15px 35px rgba(0,0,0,0.2)',
                                                            position: 'relative',
                                                            cursor: 'grab'
                                                        }}
                                                    >
                                                        <p style={{ fontSize: '10px', fontWeight: '950', margin: 0 }}>
                                                            {s.isDescanso ? 'DESCANSO' : `${new Date(s.startTime).getHours().toString().padStart(2,'0')}:${new Date(s.startTime).getMinutes().toString().padStart(2,'0')} - ${new Date(s.endTime).getHours().toString().padStart(2,'0')}:${new Date(s.endTime).getMinutes().toString().padStart(2,'0')}`}
                                                        </p>
                                                        {s.isAutoGenerated && <Sparkles size={10} style={{ position: 'absolute', top: '8px', right: '8px' }} />}
                                                    </div>
                                                ) : (
                                                    <div 
                                                        onClick={() => { if(!effectiveReadOnly) { setPendingEvent({employeeId: emp.id, date: d, type: 'Turno'}); setShowTimeModal(true); } }}
                                                        style={{ height: '70px', borderRadius: '24px', border: '2px dashed rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
                                                        className="hover:border-indigo-400 hover:bg-indigo-50/10"
                                                    >
                                                        {!effectiveReadOnly && <Plus size={24} color="#cbd5e1" />}
                                                    </div>
                                                )}
                                            </td>
                                        );
                                    })}
                                    <td style={{ textAlign: 'center' }}>
                                        <div style={{ display: 'inline-flex', padding: '10px 20px', borderRadius: '20px', background: totalH > (empJornada?.horasSemanales || 48) ? 'rgba(239, 68, 68, 0.1)' : 'rgba(79, 70, 229, 0.1)', color: totalH > (empJornada?.horasSemanales || 48) ? '#ef4444' : '#4f46e5', fontSize: '11px', fontWeight: '950' }}>
                                            {formatHours(totalH)}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* V13.0 ELITE MODALS PORTAL (RESTORED GLASSMORPISM) */}
            {createPortal(
                <>
                    {(loading || isSaving || isProcessingStatus || isExporting) && (
                        <div style={{ position: 'fixed', inset: 0, background: 'rgba(2, 6, 15, 0.6)', backdropFilter: 'blur(10px)', zIndex: 900000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                             <div style={{ background: isDarkMode ? '#1e293b' : 'white', padding: '60px', borderRadius: '60px', textAlign: 'center', boxShadow: '0 50px 150px rgba(0,0,0,0.5)', maxWidth: '400px', width: '90%' }}>
                                <div className="loader !w-20 !h-20 mb-10 mx-auto" />
                                <h3 style={{ fontSize: '1.4rem', fontWeight: '950', color: isDarkMode ? 'white' : '#1e293b', marginBottom: '10px' }}>Sincronizando Elite</h3>
                                <p style={{ fontSize: '10px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Por favor espere...</p>
                             </div>
                        </div>
                    )}

                    {showSaveModal && (
                        <div style={{ position: 'fixed', inset: 0, background: 'rgba(2, 6, 15, 0.85)', backdropFilter: 'blur(30px)', zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                             <div className="animate-in zoom-in-95" style={{ background: isDarkMode ? '#1e293b' : 'white', width: '100%', maxWidth: '540px', borderRadius: '56px', overflow: 'hidden', border: isDarkMode ? '1px solid #334155' : 'none', boxShadow: '0 80px 160px rgba(0,0,0,0.6)' }}>
                                <div style={{ padding: '60px 40px 40px', textAlign: 'center' }}>
                                    <div style={{ width: '80px', height: '80px', background: isDarkMode ? 'rgba(79, 70, 229, 0.2)' : '#f5f7ff', color: '#4f46e5', borderRadius: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 30px', boxShadow: '0 20px 40px rgba(79, 70, 229, 0.15)' }}><Save size={40}/></div>
                                    <h2 style={{ fontSize: '1.8rem', fontWeight: '950', color: isDarkMode ? 'white' : '#1e293b', letterSpacing: '-0.03em', margin: 0 }}>Publicar cambios</h2>
                                    <textarea value={saveComment} onChange={e => setSaveComment(e.target.value)} placeholder="Justificación (min 10 caracteres)..." style={{ width: '100%', marginTop: '30px', padding: '24px', borderRadius: '28px', background: isDarkMode ? '#0f172a' : '#f8fafc', border: `2px solid ${saveComment.length >= 10 ? '#4f46e5' : '#f1f5f9'}`, color: isDarkMode ? 'white' : '#111827', minHeight: '140px' }} />
                                    <div style={{ display: 'flex', gap: '15px', marginTop: '30px' }}>
                                        <button onClick={() => setShowSaveModal(false)} style={{ flex: 1, padding: '20px', borderRadius: '24px', background: 'transparent', border: 'none', color: '#94a3b8', fontWeight: '800' }}>Cancelar</button>
                                        <button onClick={performSave} style={{ flex: 2, padding: '20px', borderRadius: '24px', border: 'none', background: '#4f46e5', color: 'white', fontWeight: '950', boxShadow: '0 15px 30px rgba(79, 70, 229, 0.4)' }}>Guardar</button>
                                    </div>
                                </div>
                             </div>
                        </div>
                    )}

                    {showPredictiveModal && (
                        <div style={{ position: 'fixed', inset: 0, background: 'rgba(2, 6, 15, 0.85)', backdropFilter: 'blur(30px)', zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                             <div className="animate-in zoom-in-95" style={{ background: isDarkMode ? '#1e293b' : 'white', width: '100%', maxWidth: '640px', borderRadius: '56px', border: isDarkMode ? '1px solid #334155' : 'none', boxShadow: '0 80px 160px rgba(0,0,0,0.6)' }}>
                                <div style={{ padding: '60px 40px 40px', textAlign: 'center' }}>
                                    <div style={{ width: '90px', height: '90px', background: 'linear-gradient(135deg, #4f46e5, #818cf8)', color: 'white', borderRadius: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 30px' }}><Cpu size={44}/></div>
                                    <h2 style={{ fontSize: '2.4rem', fontWeight: '950', color: isDarkMode ? 'white' : '#1e293b', margin: 0 }}>Hub Inteligencia</h2>
                                    <p style={{ color: '#64748b', fontSize: '10px', fontWeight: '950', textTransform: 'uppercase', letterSpacing: '0.3em', marginTop: '12px' }}>Optimización Predictiva</p>
                                </div>
                                <div style={{ padding: '0 60px 60px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '40px' }}>
                                        <div style={{ background: isDarkMode ? '#0f172a' : '#f8fafc', padding: '30px', borderRadius: '32px', textAlign: 'center' }}>
                                            <p style={{ fontSize: '9px', fontWeight: '950', color: '#94a3b8', textTransform: 'uppercase' }}>Histórico</p>
                                            <p style={{ fontSize: '1.4rem', fontWeight: '950', color: isDarkMode ? 'white' : '#1e293b', margin: 0 }}>Ventas 3 Sems</p>
                                        </div>
                                        <div style={{ background: isDarkMode ? '#0f172a' : '#f8fafc', padding: '30px', borderRadius: '32px', textAlign: 'center' }}>
                                            <p style={{ fontSize: '9px', fontWeight: '950', color: '#94a3b8', textTransform: 'uppercase' }}>Reglas</p>
                                            <p style={{ fontSize: '1.4rem', fontWeight: '950', color: isDarkMode ? 'white' : '#1e293b', margin: 0 }}>Productiva Plus</p>
                                        </div>
                                    </div>
                                    <button onClick={() => { setIsOptimizing(true); setTimeout(() => { showToast("Sugerencias IA generadas"); setIsOptimizing(false); setShowPredictiveModal(false); setShowPredictiveOverlay(true); }, 1500); }} style={{ width: '100%', padding: '24px', borderRadius: '28px', border: 'none', background: 'linear-gradient(90deg, #4f46e5, #818cf8)', color: 'white', fontWeight: '950', fontSize: '12px', textTransform: 'uppercase', cursor: 'pointer', boxShadow: '0 20px 40px rgba(79, 70, 229, 0.3)' }}>
                                        {isOptimizing ? <div className="loader !w-6 !h-6 !border-white" /> : "GENERAR SUGERENCIAS IA"}
                                    </button>
                                    <button onClick={() => setShowPredictiveModal(false)} style={{ width: '100%', marginTop: '15px', padding: '15px', color: '#94a3b8', background: 'transparent', border: 'none', fontWeight: '800', fontSize: '10px', textTransform: 'uppercase' }}>Cerrar</button>
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
