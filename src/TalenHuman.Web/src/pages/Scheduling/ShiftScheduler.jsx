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
    
    // Premium Design Tokens (Elite V12)
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
    const [viewMode, setViewMode] = useState('SHIFTS'); // 'SHIFTS' or 'ATTENDANCE'
    const [hoveredShiftData, setHoveredShiftData] = useState(null);
    const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });
    const [bulkData, setBulkData] = useState({
        startTime: '08:00',
        endTime: '17:00',
        days: [true, true, true, true, true, true, false] // Mon-Sun
    });

    // V12.24: Protección de concurrencia
    const fetchIdRef = useRef(0);

    // V13.0 PREMIUM STATES
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
    
    // V13.0 PREDICTIVE INTELLIGENCE STATES
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
        setCurrentWeekStart(prev => {
            if (prev && prev.getTime() === newMonday.getTime()) return prev;
            return newMonday;
        });
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
            } else {
                if (filteredStores.length > 0) setSelectedStore(filteredStores[0].id);
            }
        });

        api.get('/profiles').then(res => setProfiles(res.data));
        api.get('/operationalsettings').then(res => setOperationalSettings(res.data)).catch(() => {});

        const loadScript = (src) => {
            if (document.querySelector(`script[src="${src}"]`)) return;
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            document.head.appendChild(script);
        };
        loadScript("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js");
        loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
        loadScript("https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js");
    }, []);

    const toLocalISO = (date) => {
        if (!date) return null;
        const d = new Date(date);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
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
                if (res.data.storeId && res.data.storeId !== selectedStore) setSelectedStore(res.data.storeId);
            }
            return res.data;
        } catch (err) {
            console.error("Error fetching status", err);
            return null;
        } finally {
            setIsProcessingStatus(false);
        }
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
                ...e,
                id: e.id || e.Id,
                documento: e.identificationNumber || e.IdentificationNumber
            })));

            setShifts(shiftRes.data.map(s => ({
                ...s, id: s.id || s.Id, employeeId: s.employeeId || s.EmployeeId,
                startTime: s.startTime || s.StartTime, endTime: s.endTime || s.EndTime,
                isDescanso: !!(s.isDescanso ?? s.IsDescanso), isFuera: !!(s.isFuera ?? s.IsFuera),
                status: s.status ?? s.Status, observation: s.observation || s.Observation
            })));

            setAttendances((attRes.data || []).map(a => ({
                ...a, id: a.id || a.Id, employeeId: a.employeeId || a.EmployeeId,
                shiftId: a.shiftId || a.ShiftId, clockIn: a.clockIn || a.ClockIn,
                clockOut: a.clockOut || a.ClockOut, status: a.status ?? a.Status ?? 0
            })));

            setNews(newsRes.data);
            const firstComment = shiftRes.data.find(s => s.observation)?.observation || '';
            setLastSaveComment(firstComment);
        } catch (err) {
            console.error("Fetch Data Error", err);
            showToast("Error al cargar datos", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const runFetch = async () => {
            if (!selectedStore && !approvalId) return;
            const currentFetchId = ++fetchIdRef.current;
            setLoading(true); 
            setSyncPhase(20); 
            setDataLoaded(false);
            if (approvalId) {
                const statusData = await fetchWeeklyStatus();
                if (statusData && currentFetchId === fetchIdRef.current) {
                    await fetchData(statusData.storeId, new Date(statusData.weekStartDate));
                }
            } else {
                await Promise.all([fetchData(), fetchWeeklyStatus()]);
            }
            if (currentFetchId === fetchIdRef.current) {
                setDataLoaded(true);
                setSyncPhase(100);
            }
        };
        runFetch();
    }, [selectedStore, currentWeekStart, approvalId]);

    useEffect(() => {
        if (loading && dataLoaded) {
            const timer = setTimeout(() => { setLoading(false); setSyncPhase(0); if (onReady) onReady(); }, 600);
            return () => clearTimeout(timer);
        }
    }, [loading, dataLoaded]);

    const calculateHourlyNeeds = useCallback((dayDate) => {
        const dayStr = toLocalISO(dayDate);
        const dayHistory = historicalAverages[dayStr] || [];
        const needsPerProfile = {};
        if (dayHistory.length === 0 || predictiveRules.length === 0) return {};
        const store = stores.find(s => s.id === selectedStore);
        const opStart = store?.defaultStartTime ? parseInt(store.defaultStartTime.split(':')[0]) : 8;
        const opEndHour = store?.defaultEndTime ? parseInt(store.defaultEndTime.split(':')[0]) : 22;

        predictiveRules.forEach(rule => {
            const ruleNeeds = new Array(24).fill(0);
            const metricKey = rule.metricType === 0 ? 'ventaNetaAvg' : (rule.metricType === 1 ? 'ticketsAvg' : (rule.metricType === 2 ? 'comensalesAvg' : 'ticketPromedioAvg'));
            dayHistory.forEach(h => {
                const hour = parseInt(h.time.split(':')[0]);
                if (hour < opStart || hour > opEndHour) return;
                const forecastValue = h[metricKey] || 0;
                const calculatedStaff = rule.ratio > 0 ? Math.ceil(forecastValue / rule.ratio) : 0;
                ruleNeeds[hour] = Math.max(ruleNeeds[hour], calculatedStaff);
            });
            for (let h = 0; h < 24; h++) {
                if (h >= opStart && h < opStart + 3) ruleNeeds[h] = Math.max(ruleNeeds[h], rule.minStaffOpening);
                if (h > opEndHour - 3 && h <= opEndHour) ruleNeeds[h] = Math.max(ruleNeeds[h], rule.minStaffClosing);
            }
            rule.profiles.forEach(p => {
                if (!needsPerProfile[p.profileId]) needsPerProfile[p.profileId] = new Array(24).fill(0);
                for (let h = 0; h < 24; h++) needsPerProfile[p.profileId][h] = Math.max(needsPerProfile[p.profileId][h], ruleNeeds[h]);
            });
        });
        return needsPerProfile;
    }, [historicalAverages, predictiveRules, stores, selectedStore]);

    useEffect(() => {
        const fetchPredictiveContext = async () => {
            if (!selectedStore || !dataLoaded) return;
            const store = stores.find(s => s.id === selectedStore);
            if (!store?.storeTypeId) return;
            try {
                const rulesRes = await api.get('/PredictiveRules');
                setPredictiveRules(rulesRes.data.filter(r => r.storeTypeId === store.storeTypeId && r.isActive));
                const daysInWeek = Array.from({length: 7}, (_, i) => { const d = new Date(currentWeekStart); d.setDate(d.getDate() + i); return toLocalISO(d); });
                const historyMap = {};
                await Promise.all(daysInWeek.map(async (dayStr) => {
                    try { const res = await api.get(`/sales/analytics/evolution?startDate=${dayStr}&storeId=${selectedStore}`); historyMap[dayStr] = res.data.history; }
                    catch { historyMap[dayStr] = []; }
                }));
                setHistoricalAverages(historyMap);
            } catch (err) { console.error("Predictive Error", err); }
        };
        fetchPredictiveContext();
    }, [selectedStore, currentWeekStart, dataLoaded, stores]);

    const performOptimization = async () => {
        setIsOptimizing(true);
        await new Promise(r => setTimeout(r, 1500));
        try {
            const newShifts = [...shifts];
            const store = stores.find(s => s.id === selectedStore);
            const opStart = store?.defaultStartTime ? parseInt(store.defaultStartTime.split(':')[0]) : 8;
            const opEndHour = store?.defaultEndTime ? parseInt(store.defaultEndTime.split(':')[0]) : 22;

            for(let i=0; i<7; i++) {
                const day = new Date(currentWeekStart); day.setDate(day.getDate() + i);
                const dayStr = day.toDateString();
                const needs = calculateHourlyNeeds(day);
                Object.keys(needs).forEach(pId => {
                    const hourlyNeed = needs[pId];
                    const profilesEmployees = employees.filter(e => e.profileId === pId && e.isActive);
                    for (let h = opStart; h <= opEndHour; h++) {
                        let deficit = hourlyNeed[h] - newShifts.filter(s => {
                            const sd = new Date(s.startTime);
                            if (sd.toDateString() !== dayStr || s.isDescanso) return false;
                            const ss = sd.getHours(); const se = new Date(s.endTime).getHours();
                            const isAtHour = se < ss ? (h >= ss || h < se) : (h >= ss && h < se);
                            return isAtHour && employees.find(e => e.id === s.employeeId)?.profileId === pId;
                        }).length;

                        while (deficit > 0) {
                            const candidates = profilesEmployees.filter(emp => {
                                if (newShifts.some(s => s.employeeId === emp.id && new Date(s.startTime).toDateString() === dayStr)) return false;
                                if (news.some(n => n.empleadoId === emp.id && new Date(n.fechaInicio) <= day && new Date(n.fechaFin) >= day)) return false;
                                return true;
                            }).sort((a, b) => newShifts.filter(s => s.employeeId === a.id).length - newShifts.filter(s => s.employeeId === b.id).length);
                            if (candidates.length === 0) break;
                            const luckyOne = candidates[0];
                            const dailyHours = jornadas.find(j => j.id === luckyOne.jornadaId)?.horasDiarias || 8;
                            let shiftStartHour = Math.max(opStart, Math.min(h, opEndHour - dailyHours));
                            const start = new Date(day); start.setHours(shiftStartHour, 0, 0, 0);
                            const end = new Date(start); end.setHours(shiftStartHour + Math.floor(dailyHours), (dailyHours % 1) * 60, 0, 0);
                            newShifts.push({
                                id: `temp-${Math.random()}`, employeeId: luckyOne.id, storeId: selectedStore,
                                companyId: user.companyId, startTime: start.toISOString(), endTime: end.toISOString(),
                                status: 0, isDescanso: false, isFuera: false, isAutoGenerated: true, observation: 'Opt. por IA'
                            });
                            deficit--;
                        }
                    }
                });
            }
            setShifts(newShifts); showToast(`IA sugirió ${newShifts.length - shifts.length} turnos`, "success");
            setShowPredictiveModal(false); setShowPredictiveOverlay(true);
        } catch (err) { console.error(err); showToast("Error en optimización", "error"); }
        finally { setIsOptimizing(false); }
    };

    const days = useMemo(() => Array.from({length: 7}, (_, i) => { const d = new Date(currentWeekStart); d.setDate(d.getDate() + i); return d; }), [currentWeekStart]);
    const filteredEmployees = useMemo(() => (!selectedProfiles?.length ? employees : employees.filter(e => selectedProfiles.includes(e.profileId))), [employees, selectedProfiles]);

    const showToast = (message, type = 'success') => { setToast({ show: true, message, type }); setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000); };
    const formatHours = (hours) => `${Math.floor(hours)}h ${Math.round((hours - Math.floor(hours)) * 60).toString().padStart(2, '0')}m`;

    const handleDragStart = (e, source, data) => { 
        setHoveredShiftData(null); setIsDragging(true); setDragSource(source); setDraggedData(data);
        const ghost = document.createElement('div');
        ghost.className = 'elite-drag-ghost'; ghost.style.cssText = `width: 110px; height: 48px; background: #4f46e5; border-radius: 14px; display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: 950; text-transform: uppercase; box-shadow: 0 30px 60px rgba(0,0,0,0.5); border: 2px solid rgba(255,255,255,0.4); position: absolute; top: -1000px; z-index: 999999;`;
        ghost.innerText = data.type || 'EVENTO'; document.body.appendChild(ghost); 
        e.dataTransfer.setDragImage(ghost, 55, 24); setTimeout(() => document.body.removeChild(ghost), 100);
        e.dataTransfer.setData("source", source); e.dataTransfer.setData("payload", JSON.stringify(data));
    };

    const handleDropOnGrid = (e, targetEmpId, targetDate) => {
        e.preventDefault(); e.currentTarget.classList.remove('elite-drop-active'); setIsDragging(false);
        const source = e.dataTransfer.getData("source"); 
        const payload = JSON.parse(e.dataTransfer.getData("payload"));
        const today = new Date(); today.setHours(0,0,0,0);
        if (targetDate.getTime() < today.getTime()) { showToast("Día bloqueado", "error"); return; }
        if (news.some(n => n.empleadoId === targetEmpId && new Date(n.fechaInicio) <= targetDate && new Date(n.fechaFin) >= targetDate)) { showToast("Novedad detectada", "error"); return; }
        
        if (source === 'PANEL') {
            if (payload.type === 'Turno') { setPendingEvent({ employeeId: targetEmpId, date: targetDate, type: 'Turno' }); setShowTimeModal(true); }
            else {
                const ns = { employeeId: targetEmpId, startTime: targetDate.toISOString(), endTime: targetDate.toISOString(), status: 0, isDescanso: payload.type === 'Descanso', isFuera: payload.type === 'Turno Fuera' };
                setShifts(prev => [...prev.filter(s => !(s.employeeId === targetEmpId && new Date(s.startTime).toDateString() === targetDate.toDateString())), ns]);
            }
        } else {
            const s = shifts.find(sh => sh.id === payload.shiftId || (sh.employeeId === payload.employeeId && new Date(sh.startTime).toDateString() === new Date(payload.date).toDateString()));
            if (!s) return;
            const start = new Date(targetDate); const os = new Date(s.startTime); start.setHours(os.getHours(), os.getMinutes());
            const end = new Date(targetDate); const oe = new Date(s.endTime); end.setHours(oe.getHours(), oe.getMinutes());
            if (end < start && !s.isDescanso) end.setDate(end.getDate() + 1);
            const ns = { ...s, id: `cl-${Math.random()}`, employeeId: targetEmpId, startTime: start.toISOString(), endTime: end.toISOString() };
            setShifts(prev => [...prev.filter(sh => !(sh.employeeId === targetEmpId && new Date(sh.startTime).toDateString() === targetDate.toDateString())), ns]);
        }
    };

    const performSave = async () => {
        if (saveComment.length < 10) { showToast("Comentario muy corto", "error"); return; }
        try {
            setIsSaving(true); setSyncPhase(1); setShowSaveModal(false);
            const body = { storeId: selectedStore, startDate: toLocalISO(currentWeekStart), endDate: toLocalISO(new Date(currentWeekStart.getTime() + 7*24*60*60*1000)), shifts, comment: saveComment };
            setTimeout(() => setSyncPhase(2), 600);
            await api.post('/shifts/bulk', body);
            setSyncPhase(3); setTimeout(() => { setSyncPhase(4); showToast("Guardado con éxito"); fetchData(); }, 800);
        } catch { showToast("Error al guardar", "error"); }
        finally { setTimeout(() => { setIsSaving(false); setSyncPhase(0); }, 2500); }
    };

    const confirmApprove = async () => {
        try { 
            setIsSaving(true); setSyncPhase(1); setShowApprovalModal(false);
            setTimeout(() => setSyncPhase(2), 600);
            await api.post('/ShiftApproval/approve', { storeId: selectedStore, startDate: toLocalISO(currentWeekStart), comment: approvalComment || "Aprobado" });
            setSyncPhase(3); setTimeout(() => { setSyncPhase(4); showToast("Aprobado"); fetchData(); fetchWeeklyStatus(); }, 800);
        } catch { showToast("Error", "error"); }
        finally { setTimeout(() => { setIsSaving(false); setSyncPhase(0); }, 2500); }
    };

    const confirmReject = async () => {
        if (rejectionComment.length < 5) return;
        try {
            setIsSaving(true); setSyncPhase(1); setShowRejectionModal(false);
            setTimeout(() => setSyncPhase(2), 600);
            await api.post('/ShiftApproval/reject', { storeId: selectedStore, startDate: toLocalISO(currentWeekStart), comment: rejectionComment });
            setSyncPhase(3); setTimeout(() => { setSyncPhase(4); showToast("Rechazado"); fetchData(); fetchWeeklyStatus(); }, 800);
        } catch { showToast("Error", "error"); }
        finally { setTimeout(() => { setIsSaving(false); setSyncPhase(0); }, 2500); }
    };

    const handleExcelExport = useCallback(async () => {
        setIsExporting(true); showToast("Generando Excel...");
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
            const url = URL.createObjectURL(new Blob([buff])); const a = document.createElement('a'); a.href = url; a.download = 'Programacion.xlsx'; a.click();
        } catch { showToast("Error Excel", "error"); }
        finally { setIsExporting(false); }
    }, [days, employees, shifts]);

    const [isDragging, setIsDragging] = useState(false);
    const [dragSource, setDragSource] = useState(null);
    const [draggedData, setDraggedData] = useState(null);

    const getNovedad = (empId, date) => news.find(n => n.empleadoId === empId && new Date(n.fechaInicio).getTime() <= date.getTime() && new Date(n.fechaFin).getTime() >= date.getTime() && n.status === 1);

    return (
        <div id="printable-area" className="p-8 animate-in fade-in duration-500 bg-slate-50 dark:bg-[#060914] min-h-screen">
            <style>{`
                .btn-chiclet { border-top: 2px solid rgba(255,255,255,0.3); box-shadow: 0 10px 20px rgba(0,0,0,0.1); }
                .elite-drop-active { background: rgba(79, 70, 229, 0.1) !important; border: 2px dashed #4f46e5 !important; }
                .grid-event { transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
                @media print { .no-print { display: none !important; } #printable-area { background: white !important; color: black !important; } }
            `}</style>

            {/* Header / Command Center */}
            <div className="no-print space-y-6 mb-12">
                <div className="flex items-center justify-between gap-4 p-4 bg-white dark:bg-slate-900 rounded-[32px] shadow-xl border border-slate-200 dark:border-white/5 sticky top-4 z-[100]">
                    <div className="flex-1 max-w-xs">
                        <SearchableSelect options={stores} value={selectedStore} onChange={setSelectedStore} placeholder="Sede..." icon={Store} variant="minimal" disabled={readOnly} />
                    </div>
                    <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 p-2 rounded-2xl">
                        <button onClick={() => setWeekOffset(v => v - 1)} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-xl"><ChevronLeft size={20}/></button>
                        <div className="text-center min-w-[150px]">
                            <p className="text-[10px] font-black text-indigo-500 uppercase">Semana</p>
                            <p className="text-xs font-black dark:text-white">{currentWeekStart.toLocaleDateString()} - {new Date(currentWeekStart.getTime() + 6*24*60*60*1000).toLocaleDateString()}</p>
                        </div>
                        <button onClick={() => setWeekOffset(v => v + 1)} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-xl"><ChevronRight size={20}/></button>
                    </div>
                    <div className="flex-1 max-w-xs">
                        <SearchableSelect options={profiles} value={selectedProfiles} onChange={setSelectedProfiles} multiple={true} placeholder="Puestos..." icon={ShieldCheck} variant="minimal" />
                    </div>
                </div>

                <div className="flex justify-center gap-6">
                    <div className="flex flex-col items-center p-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-[40px] border border-white/20 shadow-lg group">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Herramientas IA</span>
                        <div className="flex gap-3">
                            <button onClick={() => setShowBulkModal(true)} className="w-12 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center btn-chiclet hover:scale-110 transition-all"><Sparkles size={20}/></button>
                            <button onClick={() => setShowPredictiveModal(true)} className="w-12 h-12 bg-purple-600 text-white rounded-2xl flex items-center justify-center btn-chiclet hover:scale-110 transition-all"><Cpu size={20}/></button>
                        </div>
                    </div>
                    <div className="flex flex-col items-center p-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-[40px] border border-white/20 shadow-lg">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Eventos</span>
                        <div className="flex gap-3">
                            {['Turno', 'Descanso', 'Turno Fuera'].map(t => (
                                <div key={t} draggable onDragStart={e => handleDragStart(e, 'PANEL', {type: t})} className={`w-12 h-12 ${t==='Turno'?'bg-indigo-600':t==='Descanso'?'bg-amber-500':'bg-purple-600'} text-white rounded-2xl flex items-center justify-center cursor-grab btn-chiclet hover:scale-110 transition-all`}>
                                    {t==='Turno'?<Clock size={20}/>:t==='Descanso'?<Calendar size={20}/>:<AlertCircle size={20}/>}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Grid Card */}
            <div className="bg-white dark:bg-slate-900 rounded-[48px] shadow-2xl border-2 dark:border-slate-800 overflow-hidden relative">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/50 border-b-2 dark:border-indigo-500/20">
                            <th className="p-6 text-left sticky left-0 z-20 bg-inherit min-w-[300px]">
                                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Colaborador</span>
                            </th>
                            {days.map(d => (
                                <th key={d.getTime()} className="p-4 text-center border-r dark:border-slate-800">
                                    <p className="text-[10px] font-black text-indigo-500 uppercase">{d.toLocaleDateString('es-CO', {weekday:'short'})}</p>
                                    <p className="text-2xl font-black dark:text-white">{d.getDate()}</p>
                                </th>
                            ))}
                            <th className="p-4 text-center bg-slate-100/30 dark:bg-slate-800/20 text-[10px] font-black text-slate-400 uppercase">Horas</th>
                        </tr>
                        {showPredictiveOverlay && (
                            <tr className="bg-indigo-50/20 dark:bg-indigo-900/10 border-b dark:border-slate-800 animate-in slide-in-from-top duration-500">
                                <td className="p-4 sticky left-0 z-20 bg-inherit flex items-center gap-2"><Cpu size={16} className="text-indigo-500 animate-pulse"/><span className="text-[10px] font-black text-indigo-500">GUÍA IA</span></td>
                                {days.map(d => {
                                    const needs = calculateHourlyNeeds(d); let def = 0;
                                    Object.values(needs).forEach(hn => hn.forEach((n, h) => {
                                        const sch = shifts.filter(s => { const sd = new Date(s.startTime); return sd.toDateString() === d.toDateString() && !s.isDescanso && (new Date(s.endTime).getHours() < sd.getHours() ? (h >= sd.getHours() || h < new Date(s.endTime).getHours()) : (h >= sd.getHours() && h < new Date(s.endTime).getHours())); }).length;
                                        if (n > sch) def += (n - sch);
                                    }));
                                    return <td key={d.getTime()} className="p-2 text-center text-[10px] font-black">{def > 0 ? <span className="p-1 px-2 bg-rose-500 text-white rounded-lg">-{def} STAFF</span> : <span className="text-emerald-500">OK</span>}</td>;
                                })}
                                <td></td>
                            </tr>
                        )}
                    </thead>
                    <tbody>
                        {filteredEmployees.map(emp => {
                            const empShifts = shifts.filter(s => s.employeeId === emp.id);
                            const totalH = empShifts.reduce((acc, s) => { if(s.isDescanso) return acc; const d = (new Date(s.endTime) - new Date(s.startTime))/3600000; return acc + (d<0?d+24:d); }, 0);
                            return (
                                <tr key={emp.id} className="border-b dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                                    <td className="p-6 sticky left-0 z-10 bg-inherit border-r dark:border-slate-800 shadow-xl">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black">{emp.firstName[0]}{emp.lastName[0]}</div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="text-sm font-black dark:text-white uppercase">{emp.firstName} {emp.lastName}</p>
                                                    <span className="text-[9px] font-black bg-slate-100 dark:bg-slate-800 text-slate-500 p-1 px-2 rounded-lg border dark:border-slate-700 uppercase">
                                                        {profiles.find(p => p.id === emp.profileId)?.name || 'N/A'}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] font-bold text-slate-400">{emp.documento}</p>
                                            </div>
                                        </div>
                                    </td>
                                    {days.map(d => {
                                        const s = empShifts.find(sh => new Date(sh.startTime).toDateString() === d.toDateString());
                                        const nov = getNovedad(emp.id, d);
                                        return (
                                            <td key={d.getTime()} onDragOver={e => e.preventDefault()} onDragEnter={e => e.currentTarget.classList.add('elite-drop-active')} onDragLeave={e => e.currentTarget.classList.remove('elite-drop-active')} onDrop={e => handleDropOnGrid(e, emp.id, d)} className="p-2 border-r dark:border-slate-800 min-h-[100px] relative">
                                                {nov ? (
                                                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-2xl text-center">
                                                        <span className="text-[8px] font-black text-blue-500 uppercase">Novedad</span>
                                                    </div>
                                                ) : s ? (
                                                    <div className={`p-2 rounded-2xl text-white text-[9px] font-black text-center shadow-lg transform transition-transform hover:scale-105 cursor-pointer ${s.isDescanso?'bg-amber-500':s.isFuera?'bg-purple-600':'bg-indigo-600'}`}>
                                                        {s.isDescanso ? 'DESCANSO' : `${new Date(s.startTime).getHours().toString().padStart(2,'0')}:${new Date(s.startTime).getMinutes().toString().padStart(2,'0')} - ${new Date(s.endTime).getHours().toString().padStart(2,'0')}:${new Date(s.endTime).getMinutes().toString().padStart(2,'0')}`}
                                                        {s.isAutoGenerated && <Sparkles size={10} className="absolute top-1 right-1"/>}
                                                    </div>
                                                ) : (
                                                    <div onClick={() => { setPendingEvent({employeeId: emp.id, date: d, type: 'Turno'}); setStartTime('08:00'); setEndTime('17:00'); setShowTimeModal(true); }} className="h-12 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-center hover:border-indigo-500 cursor-pointer text-slate-300">
                                                        <Plus size={20}/>
                                                    </div>
                                                )}
                                            </td>
                                        );
                                    })}
                                    <td className="p-4 text-center">
                                        <div className="p-1 px-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-full font-black text-[10px]">{formatHours(totalH)}</div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Print Only Footer */}
            <div className="print-only mt-20 grid grid-cols-2 text-center gap-20">
                <div className="border-t-2 border-slate-900 pt-4 font-black">Firma Jefe de Sede</div>
                <div className="border-t-2 border-slate-900 pt-4 font-black">Firma Talento Humano</div>
            </div>

            {/* PORTALS */}
            {createPortal(
                <>
                    {/* Modal Fondo */}
                    {(loading || isSaving || isExporting || showTimeModal || showBulkModal || showPredictiveModal || showSaveModal || showApprovalModal || showRejectionModal) && (
                        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200000]"/>
                    )}

                    {/* Loading/Saving Overlays */}
                    {(loading || isSaving || isExporting) && (
                        <div className="fixed inset-0 flex items-center justify-center z-[200001] p-8">
                            <div className="bg-white dark:bg-slate-900 p-12 rounded-[50px] shadow-2xl border border-white/10 text-center animate-in zoom-in-95 duration-300 max-w-sm w-full">
                                <div className="relative w-24 h-24 mx-auto mb-8">
                                    <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20 animate-pulse"/>
                                    <div className="w-full h-full border-4 border-slate-100 dark:border-slate-800 border-t-indigo-600 rounded-full animate-spin relative z-10"/>
                                </div>
                                <h3 className="text-xl font-black dark:text-white uppercase tracking-tighter mb-2">
                                    {isSaving ? (syncPhase >= 4 ? "¡Sincronizado!" : "Guardando Datos") : isExporting ? "Generando Reporte" : "Iniciando Consola"}
                                </h3>
                                <p className="text-xs font-bold text-slate-400 leading-relaxed">
                                    {isSaving ? "Enviando programación al servidor central..." : "Sincronizando nómina en tiempo real..."}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Time Modal */}
                    {showTimeModal && (
                        <div className="fixed inset-0 flex items-center justify-center z-[200002] p-8">
                            <div className="bg-white dark:bg-slate-900 p-10 rounded-[48px] shadow-2xl w-full max-w-sm animate-in zoom-in-95">
                                <h3 className="text-xl font-black mb-8 text-center dark:text-white">HORARIO TURNO</h3>
                                <div className="space-y-4 mb-8">
                                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-3xl">
                                        <label className="text-[9px] font-black text-slate-400 block text-center mb-1">ENTRADA</label>
                                        <input type="time" value={startTime} onChange={e=>setStartTime(e.target.value)} className="w-full bg-transparent border-none text-center text-3xl font-black outline-none dark:text-white"/>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-3xl">
                                        <label className="text-[9px] font-black text-slate-400 block text-center mb-1">SALIDA</label>
                                        <input type="time" value={endTime} onChange={e=>setEndTime(e.target.value)} className="w-full bg-transparent border-none text-center text-3xl font-black outline-none dark:text-white"/>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-3">
                                    <button onClick={() => {
                                        const {employeeId, date, type} = pendingEvent;
                                        const sd = new Date(date); const [sh, sm] = startTime.split(':'); sd.setHours(parseInt(sh), parseInt(sm));
                                        const ed = new Date(date); const [eh, em] = endTime.split(':'); ed.setHours(parseInt(eh), parseInt(em));
                                        if (ed < sd) ed.setDate(ed.getDate() + 1);
                                        const ns = { employeeId, startTime: sd.toISOString(), endTime: ed.toISOString(), status: 0, isDescanso: type==='Descanso', isFuera: type==='Turno Fuera' };
                                        setShifts(prev => [...prev.filter(sh => !(sh.employeeId === employeeId && new Date(sh.startTime).toDateString() === date.toDateString())), ns]);
                                        setShowTimeModal(false);
                                    }} className="p-5 bg-indigo-600 text-white rounded-3xl font-black text-xs uppercase shadow-lg shadow-indigo-200">Asignar Horario</button>
                                    <button onClick={()=>setShowTimeModal(false)} className="p-3 text-slate-400 font-black text-[10px] uppercase">Cancelar</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Save Modal */}
                    {showSaveModal && (
                        <div className="fixed inset-0 flex items-center justify-center z-[200002] p-8">
                            <div className="bg-white dark:bg-slate-900 p-12 rounded-[50px] shadow-2xl w-full max-w-lg animate-in zoom-in-95">
                                <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6"><Save size={32}/></div>
                                <h3 className="text-xl font-black text-center mb-2 dark:text-white">PUBLICAR CAMBIOS</h3>
                                <p className="text-center text-xs text-slate-400 font-bold mb-8">Esta acción notificará a todos los colaboradores de la sede.</p>
                                <textarea placeholder="Justificación (Mín. 10 caracteres)..." value={saveComment} onChange={e=>setSaveComment(e.target.value)} className="w-full p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border-none outline-none font-bold text-sm mb-8 min-h-[150px] dark:text-white"/>
                                <div className="flex flex-col gap-3">
                                    <button onClick={performSave} className="p-5 bg-indigo-600 text-white rounded-3xl font-black text-xs uppercase shadow-lg">Finalizar y Enviar</button>
                                    <button onClick={()=>setShowSaveModal(false)} className="p-3 text-slate-400 font-black text-[10px] uppercase">Cerrar</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Predictive Modal */}
                    {showPredictiveModal && (
                        <div className="fixed inset-0 flex items-center justify-center z-[200002] p-8">
                            <div className="bg-white dark:bg-slate-900 p-12 rounded-[60px] shadow-2xl w-full max-w-xl animate-in zoom-in-95">
                                <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl animate-pulse"><Cpu size={40}/></div>
                                <h3 className="text-2xl font-black text-center mb-2 dark:text-white">HUB DE INTELIGENCIA</h3>
                                <p className="text-center text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-10">Optimización Basada en Datos</p>
                                
                                <div className="grid grid-cols-2 gap-4 mb-10">
                                    <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-[32px] text-center border border-slate-100 dark:border-white/5">
                                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Reglas Activas</p>
                                        <p className="text-2xl font-black dark:text-white">{predictiveRules.length}</p>
                                    </div>
                                    <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-[32px] text-center border border-slate-100 dark:border-white/5">
                                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Dato Histórico</p>
                                        <p className="text-2xl font-black dark:text-white">3 Semanas</p>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-4">
                                    <button onClick={performOptimization} disabled={isOptimizing} className="p-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-3xl font-black text-sm uppercase shadow-2xl hover:scale-[1.02] transition-all flex items-center justify-center gap-3">
                                        {isOptimizing ? <div className="loader !w-6 !h-6 !border-white"/> : <><Sparkles size={20}/> OPTIMIZAR AHORA</>}
                                    </button>
                                    <button onClick={()=>{ setShowPredictiveOverlay(!showPredictiveOverlay); setShowPredictiveModal(false); }} className="p-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-black text-[10px] uppercase">
                                        {showPredictiveOverlay ? 'Ocultar Guía Visual' : 'Ver Gaps Operativos'}
                                    </button>
                                    <button onClick={()=>setShowPredictiveModal(false)} className="p-2 text-slate-400 font-black text-[10px] uppercase">Cerrar</button>
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
