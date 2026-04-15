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
    Cpu,
    CalendarSearch
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
    const [exportUrl, setExportUrl] = useState('');
    const [exportFileName, setExportFileName] = useState('');
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
    const [snapshotData, setSnapshotData] = useState(null);
    const [showSnapshotModal, setShowSnapshotModal] = useState(false);
    const [lastSaveComment, setLastSaveComment] = useState('');
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

    // V18.8 Logic for initial date alignment
    useEffect(() => {
        if (initialDate) {
            // V19.5: PARSEO LITERAL - Usar la 'Llave Maestra' del padre sin transformaciones
            const parts = initialDate.split('T')[0].split('-');
            const requestedMonday = new Date(parts[0], parts[1] - 1, parts[2]);
            requestedMonday.setHours(0, 0, 0, 0);
            
            // Establecer como estado actual inmediatamente para evitar discrepancias
            setCurrentWeekStart(requestedMonday);
            
            // Hallar el lunes de hoy para sincronizar el offset UI
            const todayMonday = getMonday(0);
            todayMonday.setHours(0, 0, 0, 0);

            const diffTime = requestedMonday - todayMonday;
            const diffWeeks = Math.round(diffTime / (1000 * 60 * 60 * 24 * 7));
            setWeekOffset(diffWeeks);
        }
    }, [initialDate]);

    // V13.0 PREMIUM STATES
    const [weeklyStatus, setWeeklyStatus] = useState({ status: 'Empty', message: '', comment: '' });
    const [showRejectionModal, setShowRejectionModal] = useState(false);
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [rejectionComment, setRejectionComment] = useState('');
    const [approvalComment, setApprovalComment] = useState('');
    const [showPredictiveModal, setShowPredictiveModal] = useState(false);
    const [syncPhase, setSyncPhase] = useState(0); // 0: Init, 1: Validating, 2: Syncing, 3: Notifying, 4: Done
    const [dataLoaded, setDataLoaded] = useState(false);
    
    // V13.0 PREDICTIVE INTELLIGENCE STATES
    const [predictiveRules, setPredictiveRules] = useState([]);
    const [historicalAverages, setHistoricalAverages] = useState({}); // { 'ISO_DATE': [ { time, value } ] }
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [showPredictiveOverlay, setShowPredictiveOverlay] = useState(false);
    const [selectedCoverageDay, setSelectedCoverageDay] = useState(null); // V13.5

    // V19.2: BLINDAJE DE SEGURIDAD PREMIUM - Modo Inspección Auditoría
    const effectiveReadOnly = useMemo(() => {
        if (readOnly) return true;
        if (weeklyStatus.status === 'Approved') return true;
        return false;
    }, [readOnly, weeklyStatus.status]);
    const [isDragging, setIsDragging] = useState(false);
    const [dragSource, setDragSource] = useState(null);
    const [draggedData, setDraggedData] = useState(null);
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

            // V12.24: BLINDAJE DE INSPECCIÓN - Evitar sobreescritura automática de la sede
            if (initialStoreId) {
                // No llamamos a setSelectedStore si ya es el valor inicial
                return;
            }

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
        
        // Load Operational Settings (V13.0)
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

    useEffect(() => {
        const runFetch = async () => {
            if (!selectedStore && !approvalId) return;
            
            const currentFetchId = ++fetchIdRef.current;
            setLoading(true);
            setSyncPhase(20);
            setDataLoaded(false);
            setWeeklyStatus({ status: 'Empty', message: '', comment: '' }); 

            try {
                if (approvalId) {
                    // V12.26: FLUJO SECUENCIAL AUTORITARIO (Un solo set de llamados)
                    const statusData = await fetchWeeklyStatus();
                    if (statusData && currentFetchId === fetchIdRef.current) {
                        const confirmedDate = statusData.weekStartDate ? new Date(statusData.weekStartDate) : null;
                        await fetchData(statusData.storeId, confirmedDate);
                    }
                } else {
                    // FLUJO PARALELO NORMAL (Modo Gerente)
                    await Promise.all([
                        fetchData(),
                        fetchWeeklyStatus()
                    ]);
                }

                if (currentFetchId === fetchIdRef.current) {
                    setSyncPhase(100);
                    setDataLoaded(true);
                }
            } catch (err) {
                console.error("Error in fetch sequence", err);
            }
        };

        runFetch();
    }, [selectedStore, currentWeekStart, approvalId]);

    // V12.24: CIERRE FLASH DEL OVERLAY (600ms de gracia para pintura)
    useEffect(() => {
        if (loading && dataLoaded) {
            const timer = setTimeout(() => {
                setLoading(false);
                setSyncPhase(0);
                if (onReady) onReady();
            }, 600);
            return () => clearTimeout(timer);
        }
    }, [loading, dataLoaded, onReady]); 

    const fetchWeeklyStatus = async () => {
        if (!selectedStore && !approvalId) return null;
        try {
            setIsProcessingStatus(true);
            
            let url = `/ShiftApproval/status?storeId=${selectedStore}&startDate=${toLocalISO(currentWeekStart)}`;
            if (approvalId) {
                url = `/ShiftApproval/status?id=${approvalId}`;
            }

            const res = await api.get(url);
            setWeeklyStatus(res.data);

            // V19.8: Sincronización Maestra - Si consultamos por ID, la fecha de la DB es la LEY
            if (approvalId && res.data.weekStartDate) {
                const dbDate = new Date(res.data.weekStartDate);
                // Usamos comparación segura de fecha ISO para evitar re-triggers innecesarios
                const currentISO = toLocalISO(currentWeekStart);
                const dbISO = toLocalISO(dbDate);

                if (dbISO !== currentISO) {
                    setCurrentWeekStart(dbDate);
                }
                if (res.data.storeId && res.data.storeId !== selectedStore) {
                    setSelectedStore(res.data.storeId);
                }
            }
            return res.data;
        } catch (err) {
            console.error("Error fetching status", err);
            return null;
        } finally {
            setIsProcessingStatus(false);
        }
    };

    // V13.0: PREDICTIVE DATA ORCHESTRATOR
    useEffect(() => {
        const fetchPredictiveContext = async () => {
            if (!selectedStore || !dataLoaded) return;
            
            const store = stores.find(s => s.id === selectedStore);
            if (!store || !store.storeTypeId) return;

            try {
                // 1. Fetch Rules for this Store Type
                const rulesRes = await api.get('/PredictiveRules');
                const filteredRules = rulesRes.data.filter(r => r.storeTypeId === store.storeTypeId && r.isActive);
                setPredictiveRules(filteredRules);

                // 2. Fetch Historical Averages for each day of the week
                const daysInWeek = [];
                for (let i = 0; i < 7; i++) {
                    const d = new Date(currentWeekStart);
                    d.setDate(d.getDate() + i);
                    daysInWeek.push(toLocalISO(d));
                }

                const historyMap = {};
                await Promise.all(daysInWeek.map(async (dayStr) => {
                    try {
                        const res = await api.get(`/sales/analytics/evolution?startDate=${dayStr}&storeId=${selectedStore}`);
                        historyMap[dayStr] = res.data.history;
                    } catch (e) {
                        historyMap[dayStr] = [];
                    }
                }));
                setHistoricalAverages(historyMap);
            } catch (err) {
                console.error("Error fetching predictive context", err);
            }
        };

        fetchPredictiveContext();
    }, [selectedStore, currentWeekStart, dataLoaded, stores]);

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    };

    const toLocalISO = (date) => {
        if (!date) return null;
        const d = new Date(date);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        // V19.5: Retornar solo la llave de fecha (YYYY-MM-DD) para alineación con backend
        return `${y}-${m}-${day}`;
    };

    const formatHours = (hours) => {
        const h = Math.floor(hours);
        const m = Math.round((hours - h) * 60);
        return `${h}h ${String(m).padStart(2, '0')}m`;
    };

    const isApprover = useMemo(() => {
        // V18.10.1: BLINDAJE DE AUDITORÍA - Forzar permisos si viene de la consola
        if (forceApprover) return true;

        if (!user || !operationalSettings) return false;
        
        // Admin / SuperAdmin can always approve
        if (user.roles?.includes('Admin') || user.roles?.includes('SuperAdmin')) return true;

        const mode = operationalSettings.shiftApprovalMode; // 0: HR, 1: District

        if (mode === 0) { // HR Mode
            return user.roles?.includes('RH');
        } else { // District Mode
            // User must be a Supervisor and belong to the same district as the selected store
            const currentStoreObj = stores.find(s => s.id === selectedStore);
            return user.roles?.includes('Supervisor') && user.districtId === currentStoreObj?.districtId;
        }
    }, [user, operationalSettings, selectedStore, stores, forceApprover]);

    const fetchData = async (overrideStoreId = null, overrideWeekStart = null) => {
        try {
            setLoading(true);
            
            // V12.26: Priorizar parámetros autoritarios (Secuencialidad)
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
            setEmployees(empRes.data.filter(e => e.storeId === selectedStore).map(e => ({
                ...e,
                id: e.id || e.Id,
                documento: e.identificationNumber || e.IdentificationNumber
            })));

            const normalizedShifts = shiftRes.data.map(s => ({
                ...s,
                id: s.id || s.Id,
                employeeId: s.employeeId || s.EmployeeId,
                startTime: s.startTime || s.StartTime,
                endTime: s.endTime || s.EndTime,
                isDescanso: s.isDescanso !== undefined ? s.isDescanso : s.IsDescanso,
                isFuera: s.isFuera !== undefined ? s.isFuera : s.IsFuera,
                status: s.status !== undefined ? s.status : s.Status,
                observation: s.observation || s.Observation
            }));

            const normalizedAttendances = (attRes.data || []).map(a => ({
                ...a,
                id: a.id || a.Id,
                employeeId: a.employeeId || a.EmployeeId,
                shiftId: a.shiftId || a.ShiftId,
                clockIn: a.clockIn || a.ClockIn || a.clock_in,
                clockOut: a.clockOut || a.ClockOut || a.clock_out,
                status: a.status !== undefined ? a.status : (a.Status !== undefined ? a.Status : 0)
            }));

            setShifts(normalizedShifts);
            setAttendances(normalizedAttendances);
            setNews(newsRes.data);

            // Extract the common observation/comment for this week
            const firstComment = normalizedShifts.find(s => s.observation)?.observation || '';
            setLastSaveComment(firstComment);
        } catch (err) {
            console.error("Fetch Data Error", err);
            showToast("Error al cargar datos", "error");
        } finally {
            setLoading(false);
        }
    };

    // V13.0.1: PREDICTIVE CALCULATION ENGINE (Strict store hours)
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
            const metricKey = rule.metricType === 0 ? 'ventaNetaAvg' : 
                               (rule.metricType === 1 ? 'ticketsAvg' : 
                               (rule.metricType === 2 ? 'comensalesAvg' : 'ticketPromedioAvg'));

            dayHistory.forEach(h => {
                const hour = parseInt(h.time.split(':')[0]);
                // Only count demand within store hours
                if (hour < opStart || hour > opEndHour) return;

                const forecastValue = h[metricKey] || 0;
                const calculatedStaff = rule.ratio > 0 ? Math.ceil(forecastValue / rule.ratio) : 0;
                ruleNeeds[hour] = Math.max(ruleNeeds[hour], calculatedStaff);
            });

            // Apply MinStaffOpening / MinStaffClosing based on STORE DOORS
            for (let h = 0; h < 24; h++) {
                if (h >= opStart && h < opStart + 3) {
                    ruleNeeds[h] = Math.max(ruleNeeds[h], rule.minStaffOpening);
                }
                if (h > opEndHour - 3 && h <= opEndHour) {
                    ruleNeeds[h] = Math.max(ruleNeeds[h], rule.minStaffClosing);
                }
            }

            rule.profiles.forEach(p => {
                const pId = p.profileId;
                if (!needsPerProfile[pId]) needsPerProfile[pId] = new Array(24).fill(0);
                for (let h = 0; h < 24; h++) {
                    needsPerProfile[pId][h] = Math.max(needsPerProfile[pId][h], ruleNeeds[h]);
                }
            });
        });

        return needsPerProfile;
    }, [historicalAverages, predictiveRules, stores, selectedStore]);

    const performOptimization = async () => {
        setIsOptimizing(true);
        await new Promise(r => setTimeout(r, 1500)); 

        try {
            const newShifts = [...shifts];
            const daysInWeek = [];
            for(let i=0; i<7; i++) {
                const d = new Date(currentWeekStart);
                d.setDate(d.getDate() + i);
                daysInWeek.push(d);
            }

            const store = stores.find(s => s.id === selectedStore);
            const opStart = store?.defaultStartTime ? parseInt(store.defaultStartTime.split(':')[0]) : 8;
            const opEndHour = store?.defaultEndTime ? parseInt(store.defaultEndTime.split(':')[0]) : 22;

            daysInWeek.forEach(day => {
                const needs = calculateHourlyNeeds(day);
                const dayStr = day.toDateString();

                Object.keys(needs).forEach(pId => {
                    const hourlyNeed = needs[pId];
                    const profilesEmployees = employees.filter(e => e.profileId === pId && e.isActive);
                    
                    for (let h = opStart; h <= opEndHour; h++) {
                        if (hourlyNeed[h] <= 0) continue;

                        const scheduledAtHour = newShifts.filter(s => {
                            const sDate = new Date(s.startTime);
                            if (sDate.toDateString() !== dayStr || s.isDescanso) return false;
                            const sStart = sDate.getHours();
                            const sEnd = new Date(s.endTime).getHours();
                            if (sEnd < sStart) return h >= sStart || h < sEnd;
                            return h >= sStart && h < sEnd;
                        }).filter(s => {
                            const emp = employees.find(e => e.id === s.employeeId);
                            return emp?.profileId === pId;
                        }).length;

                        let deficit = hourlyNeed[h] - scheduledAtHour;

                        while (deficit > 0) {
                            const candidates = profilesEmployees.filter(emp => {
                                const hasDayShift = newShifts.some(s => s.employeeId === emp.id && new Date(s.startTime).toDateString() === dayStr);
                                if (hasDayShift) return false;
                                const hasNov = news.some(n => n.empleadoId === emp.id && new Date(n.fechaInicio) <= day && new Date(n.fechaFin) >= day);
                                if (hasNov) return false;
                                return true;
                            }).sort((a, b) => {
                                const hoursA = newShifts.filter(s => s.employeeId === a.id).length; 
                                const hoursB = newShifts.filter(s => s.employeeId === b.id).length;
                                return hoursA - hoursB;
                            });

                            if (candidates.length === 0) break;

                            const luckyOne = candidates[0];
                            const jornada = jornadas.find(j => j.id === luckyOne.jornadaId);
                            const dailyHours = jornada?.horasDiarias || 8;

                            // Final constraint: Ensure shift fits in store hours
                            let shiftStartHour = h;
                            if (shiftStartHour + dailyHours > opEndHour) {
                                shiftStartHour = Math.max(opStart, opEndHour - dailyHours);
                            }

                            const start = new Date(day);
                            start.setHours(shiftStartHour, 0, 0, 0);
                            const end = new Date(start);
                            end.setHours(shiftStartHour + Math.floor(dailyHours), (dailyHours % 1) * 60, 0, 0);

                            newShifts.push({
                                id: `temp-${Math.random()}`,
                                employeeId: luckyOne.id,
                                storeId: selectedStore,
                                companyId: user.companyId,
                                startTime: start.toISOString(),
                                endTime: end.toISOString(),
                                status: 0,
                                isDescanso: false,
                                isFuera: false,
                                isAutoGenerated: true,
                                observation: 'Opt. por IA (Horario Sede)'
                            });

                            deficit--;
                        }
                    }
                });
            });

            const createdCount = newShifts.length - shifts.length;
            
            // Calculate total deficits AGAIN to see if we left anything uncovered
            let totalRemainingDeficit = 0;
            daysInWeek.forEach(day => {
                const needs = calculateHourlyNeeds(day);
                const dayStr = day.toDateString();
                Object.keys(needs).forEach(pId => {
                    needs[pId].forEach((need, h) => {
                        const scheduled = newShifts.filter(s => {
                            const sDate = new Date(s.startTime);
                            if (sDate.toDateString() !== dayStr || s.isDescanso) return false;
                            const emp = employees.find(e => e.id === s.employeeId);
                            if (emp?.profileId !== pId) return false;
                            const sStart = sDate.getHours();
                            const sEnd = new Date(s.endTime).getHours();
                            return sEnd < sStart ? (h >= sStart || h < sEnd) : (h >= sStart && h < sEnd);
                        }).length;
                        if (need > scheduled) totalRemainingDeficit += (need - scheduled);
                    });
                });
            });

            if (createdCount > 0) {
                setShifts(newShifts);
                if (totalRemainingDeficit > 0) {
                    showToast(`IA: Sugeridos ${createdCount} turnos, pero aún faltan ${totalRemainingDeficit} posiciones por cubrir (sin personal disponible).`, "warning");
                } else {
                    showToast(`¡Optimización completa! IA sugirió ${createdCount} turnos para cubrir toda la demanda.`, "success");
                }
            } else {
                if (totalRemainingDeficit > 0) {
                    showToast(`IA: No se pueden cubrir los ${totalRemainingDeficit} huecos detectados porque todo el personal ya tiene turnos asignados.`, "warning");
                } else {
                    showToast("IA: Tu malla ya está optimizada según la demanda histórica.", "info");
                }
            }

            setShowPredictiveModal(false);
            setShowPredictiveOverlay(true); // Forzar que se vea la Guía IA para validar resultados
        } catch (err) {
            console.error("Optimization failed", err);
            showToast("Error en la optimización IA", "error");
        } finally {
            setIsOptimizing(false);
        }
    };


    const days = useMemo(() => {
        const d = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(currentWeekStart);
            date.setDate(date.getDate() + i);
            d.push(date);
        }
        return d;
    }, [currentWeekStart]);

    const handleJumpToDate = (targetDate) => {
        if (!targetDate) return;
        const selectedDate = new Date(targetDate);
        // Normalize to local midnight to avoid timezone shifts
        selectedDate.setHours(0,0,0,0);
        
        const todayMonday = getMonday(0);
        // Find the Monday of the selected week
        const day = selectedDate.getDay() || 7;
        const selectedMonday = new Date(selectedDate);
        selectedMonday.setDate(selectedDate.getDate() - day + 1);
        selectedMonday.setHours(0,0,0,0);
        
        const diffTime = selectedMonday - todayMonday;
        const diffWeeks = Math.round(diffTime / (1000 * 60 * 60 * 24 * 7));
        setWeekOffset(diffWeeks);
    };

    const filteredEmployees = useMemo(() => {
        if (!selectedProfiles || selectedProfiles.length === 0) return employees;
        return employees.filter(e => selectedProfiles.includes(e.profileId));
    }, [employees, selectedProfiles]);

    const handleSelectEmployee = (id) => {
        setSelectedEmployees(prev => 
            prev.includes(id) ? prev.filter(eid => eid !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (selectedEmployees.length === filteredEmployees.length && filteredEmployees.length > 0) setSelectedEmployees([]);
        else setSelectedEmployees(filteredEmployees.map(e => e.id));
    };

    const handleBulkApply = () => {
        const newShifts = [...shifts];
        const { startTime: bStart, endTime: bEnd, days: activeDays } = bulkData;

        selectedEmployees.forEach(empId => {
            days.forEach((day, index) => {
                if (activeDays[index]) {
                    const start = new Date(day);
                    const [sh, sm] = bStart.split(':');
                    start.setHours(parseInt(sh), parseInt(sm), 0);

                    const end = new Date(day);
                    const [eh, em] = bEnd.split(':');
                    end.setHours(parseInt(eh), parseInt(em), 0);
                    if (end < start) end.setDate(end.getDate() + 1);

                    const newShift = {
                        employeeId: empId,
                        startTime: start.toISOString(),
                        endTime: end.toISOString(),
                        status: 0,
                        isDescanso: false,
                        isFuera: false
                    };

                    // Check for overlap to avoid exact duplicates
                    const isOverlap = newShifts.some(s => 
                        s.employeeId === empId && 
                        s.startTime === newShift.startTime && 
                        s.endTime === newShift.endTime
                    );
                    
                    if (!isOverlap) newShifts.push(newShift);
                }
            });
        });

        setShifts(newShifts);
        setShowBulkModal(false);
        setSelectedEmployees([]);
        showToast("Turnos pre-cargados correctamente");
    };

    const handleDragStart = (e, source, data) => {
        // V17.2 PREMIUM CLEANUP: Desactivar tooltips inmediatamente para que no se vean en el arrastre
        setHoveredShiftData(null);
        
        setIsDragging(true);
        setDragSource(source);
        setDraggedData(data);

        // V13.0 PREMIUM HIGH-FIDELITY GHOST IMAGE
        const ghost = document.createElement('div');
        ghost.className = 'elite-drag-ghost';
        
        // Determinar estilo basado en tipo
        let typeLabel = data.type || 'TURNO';
        let bgColor = '#4f46e5'; // Indigo
        if (typeLabel === 'Descanso') bgColor = '#94a3b8'; // Slate
        if (typeLabel === 'Turno Fuera') bgColor = '#8b5cf6'; // Purple
        
        // Si viene del grid, intentar obtener el color real
        if (source === 'GRID' && data.shiftId) {
             const s = shifts.find(sh => sh.id === data.shiftId);
             if (s?.isDescanso) { bgColor = '#94a3b8'; typeLabel = 'DESC'; }
             else if (s?.isFuera) { bgColor = '#8b5cf6'; typeLabel = 'FUERA'; }
             else typeLabel = 'TURNO';
        }

        ghost.style.cssText = `
            width: 110px;
            height: 48px;
            background: ${bgColor};
            border-radius: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 10px;
            font-weight: 950;
            text-transform: uppercase;
            box-shadow: 0 30px 60px rgba(0,0,0,0.5);
            border: 2px solid rgba(255,255,255,0.4);
            position: absolute;
            top: -1000px;
            left: -1000px;
            z-index: 999999;
            letter-spacing: 0.1em;
            pointer-events: none;
        `;
        ghost.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> ${typeLabel}`;
        
        document.body.appendChild(ghost);
        e.dataTransfer.setDragImage(ghost, 55, 24);
        
        // Limpieza diferida
        setTimeout(() => { if (document.body.contains(ghost)) document.body.removeChild(ghost); }, 100);

        e.dataTransfer.setData("source", source);
        e.dataTransfer.setData("payload", JSON.stringify(data));
        e.dataTransfer.effectAllowed = "copyMove";
    };

    const handleDragEnd = () => {
        setIsDragging(false);
        setDragSource(null);
        setDraggedData(null);
    };

    const hasNovedad = (employeeId, date) => {
        return news.some(n =>
            n.empleadoId === employeeId &&
            new Date(n.fechaInicio).getTime() <= date.getTime() &&
            new Date(n.fechaFin).getTime() >= date.getTime() &&
            n.status === 1
        );
    };

    const getNovedad = (employeeId, date) => {
        return news.find(n =>
            n.empleadoId === employeeId &&
            new Date(n.fechaInicio).getTime() <= date.getTime() &&
            new Date(n.fechaFin).getTime() >= date.getTime() &&
            n.status === 1
        );
    };

    const handleDropOnGrid = (e, targetEmployeeId, targetDate) => {
        e.preventDefault();
        e.currentTarget.classList.remove('elite-drop-active');
        setIsDragging(false);
        const source = e.dataTransfer.getData("source");
        const rawPayload = e.dataTransfer.getData("payload");
        
        if (!source || !rawPayload) return;
        
        let payload;
        try {
            payload = JSON.parse(rawPayload);
        } catch (err) {
            console.error("Error parsing drag payload", err);
            return;
        }

        if (hasNovedad(targetEmployeeId, targetDate)) {
            showToast("Día bloqueado por novedad", "error");
            return;
        }

        const today = new Date();
        today.setHours(0,0,0,0);
        if (new Date(targetDate).getTime() < today.getTime()) {
            showToast("Día bloqueado: Dato histórico", "error");
            return;
        }

        const existingDayShifts = shifts.filter(s => s.employeeId === targetEmployeeId && new Date(s.startTime).toDateString() === targetDate.toDateString());
        if (existingDayShifts.some(s => attendances.some(a => String(a.shiftId) === String(s.id)))) {
            showToast("Día bloqueado: Ya existe marcación", "warning");
            return;
        }

        if (source === 'PANEL') {
            if (payload.type === 'Descanso' || payload.type === 'Turno Fuera') {
                const start = new Date(targetDate); start.setHours(0, 0, 0, 0);
                const end = new Date(targetDate); end.setHours(0, 0, 0, 0);

                const newShift = {
                    employeeId: targetEmployeeId,
                    startTime: start.toISOString(),
                    endTime: end.toISOString(),
                    status: 0,
                    isDescanso: payload.type === 'Descanso',
                    isFuera: payload.type === 'Turno Fuera'
                };
                
                setShifts(prev => {
                    const filtered = prev.filter(s => !(s.employeeId === targetEmployeeId && new Date(s.startTime).toDateString() === targetDate.toDateString() && (s.isDescanso || s.isFuera)));
                    return [...filtered, newShift];
                });
                showToast(`${payload.type} asignado`);
            } else {
                setPendingEvent({ employeeId: targetEmployeeId, date: targetDate, type: payload.type });
                setStartTime('08:00'); setEndTime('17:00'); setShowTimeModal(true);
            }
        } else if (source === 'GRID') {
            // Lógica de COPIADO entre celdas
            const sourceShift = shifts.find(s => s.id === payload.shiftId || (s.employeeId === payload.employeeId && new Date(s.startTime).toDateString() === new Date(payload.date).toDateString()));
            if (!sourceShift) return;

            const newStart = new Date(targetDate);
            const os = new Date(sourceShift.startTime);
            newStart.setHours(os.getHours(), os.getMinutes(), 0);

            const newEnd = new Date(targetDate);
            const oe = new Date(sourceShift.endTime);
            newEnd.setHours(oe.getHours(), oe.getMinutes(), 0);
            if (newEnd < newStart && !sourceShift.isDescanso && !sourceShift.isFuera) newEnd.setDate(newEnd.getDate() + 1);

            const newShift = {
                employeeId: targetEmployeeId,
                startTime: newStart.toISOString(),
                endTime: newEnd.toISOString(),
                status: 0,
                isDescanso: !!sourceShift.isDescanso,
                isFuera: !!sourceShift.isFuera
            };

            setShifts(prev => {
                // V13.9.42: Limpiar destino para evitar "pegado" de turnos anteriores
                const filtered = prev.filter(s => !(s.employeeId === targetEmployeeId && new Date(s.startTime).toDateString() === targetDate.toDateString()));
                return [...filtered, newShift];
            });
            showToast(newShift.isDescanso ? "Descanso clonado" : "Turno clonado");
        }
    };

    const handleDropOnTrash = (e) => {
        e.preventDefault();
        const source = e.dataTransfer.getData("source");
        const payload = JSON.parse(e.dataTransfer.getData("payload"));
        if (source === 'GRID') {
            const ns = shifts.filter(s => !(s.employeeId === payload.employeeId && new Date(s.startTime).toDateString() === new Date(payload.date).toDateString()));
            setShifts(ns); showToast("Evento eliminado", "success");
        }
    };

    const confirmTimeModal = () => {
        const { employeeId, date, type } = pendingEvent;
        const start = new Date(date); const [sh, sm] = startTime.split(':'); start.setHours(parseInt(sh), parseInt(sm), 0);
        const end = new Date(date); const [eh, em] = endTime.split(':'); end.setHours(parseInt(eh), parseInt(em), 0);

        const newShift = {
            employeeId,
            startTime: start.toISOString(),
            endTime: end.toISOString(),
            status: 0,
            isDescanso: type === 'Descanso',
            isFuera: type === 'Turno Fuera'
        };

        const newShifts = [...shifts];
        const existingIdx = newShifts.findIndex(s => s.employeeId === employeeId && new Date(s.startTime).toDateString() === date.toDateString());
        if (existingIdx >= 0) newShifts[existingIdx] = newShift;
        else newShifts.push(newShift);
        setShifts(newShifts); setShowTimeModal(false); setPendingEvent(null);
    };

    const handleSave = () => {
        if (shifts.length === 0) { showToast("No hay turnos para guardar", "warning"); return; }
        setSaveComment(''); setShowSaveModal(true);
    };

    const performSave = async () => {
        if (!saveComment || saveComment.trim().length < 10) {
            showToast("Ingresa un comentario descriptivo (mínimo 10 caracteres)", "error");
            return;
        }
        try {
            setIsSaving(true);
            setSyncPhase(1); // Fase: Validando
            setShowSaveModal(false); // V17.3: Cerrar modal inmediatamente para ver progreso
            
            const endDate = new Date(currentWeekStart); 
            endDate.setDate(endDate.getDate() + 7);
            const localizedShifts = shifts.map(s => ({ ...s, startTime: toLocalISO(s.startTime), endTime: toLocalISO(s.endTime) }));

            // Simular ritual de seguridad para fluidez visual
            setTimeout(() => setSyncPhase(2), 600); // Fase: Sincronizando core

            const response = await api.post('/shifts/bulk', {
                storeId: selectedStore,
                startDate: toLocalISO(currentWeekStart),
                endDate: toLocalISO(endDate),
                shifts: localizedShifts,
                comment: saveComment
            });

            setSyncPhase(3); // Fase: Notificando Gerencia
            setTimeout(() => {
                setSyncPhase(4);
                setLastSaveComment(saveComment);
                showToast("Programación guardada exitosamente");
                setShowSaveModal(false); 
                fetchData();
            }, 800);
            
        } catch (err) { 
            showToast(err.response?.data?.message || "Error al guardar", "error"); 
            setIsSaving(false);
        } finally { 
            // El setSaving(false) se maneja tras la animación 'Done'
            setTimeout(() => {
                setIsSaving(false);
                setSyncPhase(0);
            }, 2500);
        }
    };

    const handleApproveAll = () => {
        setApprovalComment('');
        setShowApprovalModal(true);
    };

    const confirmApprove = async () => {
        try {
            setIsSaving(true);
            setSyncPhase(1); // Fase: Validando
            setShowApprovalModal(false); 
            
            const endDate = new Date(currentWeekStart);
            endDate.setDate(endDate.getDate() + 7);

            // Simular ritual de seguridad para fluidez visual
            setTimeout(() => setSyncPhase(2), 600); // Fase: Sincronizando Core

            await api.post('/ShiftApproval/approve', {
                storeId: selectedStore,
                startDate: toLocalISO(currentWeekStart),
                endDate: toLocalISO(endDate),
                comment: approvalComment || "Aprobación desde panel de inspección"
            });

            setSyncPhase(3); // Fase: Notificando
            setTimeout(() => {
                setSyncPhase(4);
                showToast("Semana aprobada correctamente");
                setWeeklyStatus({ status: 'Approved', date: new Date() });
                fetchData();
                fetchWeeklyStatus();
            }, 800);
        } catch (err) {
            showToast("Error al aprobar la semana", "error");
            setIsSaving(false);
            setSyncPhase(0);
        } finally {
            setTimeout(() => {
                setIsSaving(false);
                setSyncPhase(0);
            }, 2500);
        }
    };

    const handleRejectAll = () => {
        setRejectionComment('');
        setShowRejectionModal(true);
    };

    const confirmReject = async () => {
        if (!rejectionComment || rejectionComment.trim().length < 5) {
            showToast("Debes indicar un motivo válido (mínimo 5 caracteres)", "warning");
            return;
        }

        try {
            setIsSaving(true);
            setSyncPhase(1); // Fase: Validando
            setShowRejectionModal(false);

            const endDate = new Date(currentWeekStart);
            endDate.setDate(endDate.getDate() + 7);

            // Simular ritual de seguridad para fluidez visual
            setTimeout(() => setSyncPhase(2), 600); // Fase: Sincronizando Core

            await api.post('/ShiftApproval/reject', {
                storeId: selectedStore,
                startDate: toLocalISO(currentWeekStart),
                endDate: toLocalISO(endDate),
                comment: rejectionComment
            });

            setSyncPhase(3); // Fase: Notificando
            setTimeout(() => {
                setSyncPhase(4);
                showToast("Programación rechazada y gerente notificado");
                setWeeklyStatus({ status: 'Rejected', comment: rejectionComment, date: new Date() });
                fetchData();
                fetchWeeklyStatus();
            }, 800);
        } catch (err) {
            showToast("Error al procesar el rechazo", "error");
            setIsSaving(false);
            setSyncPhase(0);
        } finally {
            setTimeout(() => {
                setIsSaving(false);
                setSyncPhase(0);
            }, 2500);
        }
    };

    const copyFromPreviousWeek = async () => {
        try {
            setLoading(true);
            const ps = getMonday(weekOffset - 1);
            const pe = new Date(ps); pe.setDate(pe.getDate() + 7);
            const res = await api.get(`/shifts?storeId=${selectedStore}&startDate=${toLocalISO(ps)}&endDate=${toLocalISO(pe)}`);
            if (res.data.length === 0) { showToast("No se encontraron turnos previos", "error"); return; }
            const clonedShifts = [...shifts];
            let copiedCount = 0;
            res.data.forEach(psh => {
                const s = { ...psh, employeeId: psh.employeeId || psh.EmployeeId, startTime: psh.startTime || psh.StartTime, endTime: psh.endTime || psh.EndTime, isDescanso: psh.isDescanso ?? psh.IsDescanso, isFuera: psh.isFuera ?? psh.IsFuera };
                const shiftDate = new Date(s.startTime); const dayIndex = (shiftDate.getDay() || 7) - 1;
                const targetDate = new Date(currentWeekStart); targetDate.setDate(targetDate.getDate() + dayIndex);
                if (!getNovedad(s.employeeId, targetDate)) {
                    const ns = new Date(targetDate); const os = new Date(s.startTime); ns.setHours(os.getHours(), os.getMinutes(), 0);
                    const ne = new Date(targetDate); const oe = new Date(s.endTime); ne.setHours(oe.getHours(), oe.getMinutes(), 0);
                    const newShift = { employeeId: s.employeeId, startTime: ns.toISOString(), endTime: ne.toISOString(), status: 0, isDescanso: !!s.isDescanso, isFuera: !!s.isFuera };
                    const existingIdx = clonedShifts.findIndex(cs => cs.employeeId === s.employeeId && new Date(cs.startTime).toDateString() === targetDate.toDateString());
                    if (existingIdx >= 0) clonedShifts[existingIdx] = newShift;
                    else clonedShifts.push(newShift);
                    copiedCount++;
                }
            });
            setShifts(clonedShifts); showToast(`Se precargaron ${copiedCount} turnos`);
        } catch (err) { showToast("Error al clonar semana", "error"); } finally { setLoading(false); }
    };

    const handlePdfExport = useCallback(() => {
        const element = document.getElementById('printable-area');
        if (!element) {
            showToast("No se encontró el área de impresión", "error");
            return;
        }

        if (!window.html2pdf) {
            showToast("Cargando motor de PDF... Reintente en 3 segundos", "info");
            return;
        }

        if (isExporting) return;
        setIsExporting(true);
        showToast("Generando reporte PDF HD... Espere por favor", "success");
        const storeName = stores.find(s => s.id === selectedStore)?.name || 'Sede';
        const safeName = storeName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20);
        const fileName = `Programacion_${safeName}.pdf`;
        
        const style = document.createElement('style');
        style.innerHTML = `
            #printable-area { 
                background: white !important; 
                padding: 20px 40px !important; 
                width: 1700px !important; 
                color: black !important;
            }
            #printable-area .print-only { display: block !important; visibility: visible !important; }
            #printable-area .no-print { display: none !important; height: 0 !important; margin: 0 !important; padding: 0 !important; }
            
            /* Elite V12 PDF Contrast Fix */
            #printable-area * { 
                backdrop-filter: none !important; 
                -webkit-backdrop-filter: none !important;
                text-shadow: none !important;
                box-shadow: none !important;
            }
            
            #printable-area h1, #printable-area h2, #printable-area h3, #printable-area h4, #printable-area p, #printable-area span {
                color: #000000 !important;
                opacity: 1 !important;
            }

            #printable-area .card, #printable-area .bg-white, #printable-area .bg-slate-50, #printable-area .bg-indigo-50 {
                background: #ffffff !important;
                border: 1px solid #e2e8f0 !important;
                opacity: 1 !important;
            }

            #printable-area .turno-bubble { 
                padding: 6px 10px !important; 
                font-size: 11px !important; 
                font-weight: 800 !important;
                min-width: 100px !important;
                white-space: nowrap !important;
                border-radius: 8px !important;
                color: white !important;
                opacity: 1 !important;
                -webkit-print-color-adjust: exact;
            }

            #printable-area .bg-indigo-600 { background-color: #4f46e5 !important; }
            #printable-area .bg-amber-500 { background-color: #f59e0b !important; }
            #printable-area .bg-purple-600 { background-color: #9333ea !important; }

            #printable-area th { 
                background-color: #f8fafc !important;
                color: #1e293b !important;
                font-weight: 900 !important;
                text-transform: uppercase !important;
                border: 1px solid #e2e8f0 !important;
            }

            #printable-area td { 
                border: 1px solid #f1f5f9 !important;
                padding: 12px 8px !important;
            }

            #printable-area .grid-container { width: 100% !important; }
        `;
        document.head.appendChild(style);

        const opt = {
            margin: 0,
            filename: fileName,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { 
                scale: 2, 
                useCORS: true, 
                logging: false,
                width: 1700,
                backgroundColor: '#ffffff'
            },
            jsPDF: { unit: 'px', format: [1700, 1200], orientation: 'landscape' }
        };

        window.html2pdf().from(element).set(opt).outputPdf('blob').then((blob) => {
            const fileNameFinal = `Turnos_${safeName}_${Math.floor(Date.now()/1000)}.pdf`;
            const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/octet-stream' }));
            const a = document.createElement('a');
            a.href = url;
            a.download = fileNameFinal;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }, 5000);
            
            document.head.removeChild(style);
            setIsExporting(false);
            showToast("PDF generado con éxito");
        }).catch(err => {
            console.error("PDF Error:", err);
            setIsExporting(false);
            showToast("Error al generar PDF", "error");
            document.head.removeChild(style);
        });
    }, [isExporting, stores, selectedStore]);

    const handleExcelExport = useCallback(async () => {
        if (isExporting) return;
        try {
            setIsExporting(true);
            showToast("Preparando Excel Corporativo...", "success");
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Programación');
            const storeNameOrg = stores.find(s => s.id === selectedStore)?.name || 'Sede';
            const safeStoreName = storeNameOrg.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20);
            const fileNameExcel = `Programacion_${safeStoreName}.xlsx`;
            const dateRange = `${formatDate(currentWeekStart)} — ${formatDate(new Date(new Date(currentWeekStart).getTime() + 6 * 24 * 60 * 60 * 1000))}`;

            // Configuración de Columnas
            worksheet.columns = [
                { header: 'ID/CÉDULA', key: 'id', width: 18 },
                { header: 'COLABORADOR', key: 'name', width: 35 },
                ...days.map((day, i) => ({ 
                    header: day.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric' }).toUpperCase(), 
                    key: `day_${i}`, 
                    width: 15 
                })),
                { header: 'TOTAL HRS', key: 'total', width: 15 }
            ];

            // 1. Título TalenHuman
            worksheet.mergeCells('A1:J1');
            const titleRow = worksheet.getRow(1);
            titleRow.getCell(1).value = 'PROGRAMACION DE TURNOS TALENHUMAN';
            titleRow.getCell(1).font = { name: 'Segoe UI', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
            titleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
            titleRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
            titleRow.height = 40;

            // 2. Metadatos
            worksheet.addRow([]);
            const sedeRow = worksheet.addRow([`SEDE: ${storeNameOrg.toUpperCase()}`]);
            worksheet.mergeCells(`A3:J3`);
            sedeRow.getCell(1).font = { bold: true };
            sedeRow.getCell(1).alignment = { horizontal: 'center' };

            const periodRow = worksheet.addRow([`PERIODO: ${dateRange}`]);
            worksheet.mergeCells(`A4:J4`);
            periodRow.getCell(1).alignment = { horizontal: 'center' };
            worksheet.addRow([]);

            // 3. Encabezados
            const headerRow = worksheet.addRow(['ID/CÉDULA', 'COLABORADOR', ...days.map(d => d.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric' }).toUpperCase()), 'TOTAL HRS']);
            headerRow.eachCell((cell) => {
                cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
                cell.alignment = { horizontal: 'center' };
                cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            });

            // 4. Datos con Zebra
            const getShiftHours = (s) => {
                if (!s || s.isDescanso) return 0;
                const start = new Date(s.startTime); const end = new Date(s.endTime);
                let diff = (end - start) / (1000 * 60 * 60);
                if (diff < 0) diff += 24; return diff;
            };

            employees.forEach((emp, idx) => {
                const empShifts = shifts.filter(s => s.employeeId === emp.id);
                const totalHours = empShifts.reduce((acc, s) => acc + getShiftHours(s), 0);
                const rowValues = [emp.documento || '---', `${emp.firstName} ${emp.lastName}`.toUpperCase()];
                days.forEach(day => {
                    const shift = empShifts.find(s => new Date(s.startTime).toDateString() === day.toDateString());
                    if (shift) {
                        if (shift.isDescanso) rowValues.push("DESCANSO");
                        else if (shift.isFuera) rowValues.push("FUERA");
                        else {
                            const st = new Date(shift.startTime); const et = new Date(shift.endTime);
                            rowValues.push(`${String(st.getHours()).padStart(2, '0')}:${String(st.getMinutes()).padStart(2, '0')} - ${String(et.getHours()).padStart(2, '0')}:${String(et.getMinutes()).padStart(2, '0')}`);
                        }
                    } else rowValues.push("—");
                });
                rowValues.push(formatHours(totalHours));
                const dr = worksheet.addRow(rowValues);
                if (idx % 2 !== 0) dr.eachCell(c => c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } });
                dr.eachCell(c => c.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } });
            });

            // 5. Firma y Descarga
            worksheet.addRow([]); worksheet.addRow([]);
            const signRow = worksheet.addRow(['', '_______________________', '', '', '', '', '', '', '_______________________']);
            const signText = worksheet.addRow(['', 'FIRMA JEFE DE SEDE', '', '', '', '', '', '', 'FIRMA TALENTO HUMANO']);
            signText.eachCell(c => { c.font = { bold: true }; c.alignment = { horizontal: 'center' }; });

            const buffer = await workbook.xlsx.writeBuffer();
            const fileNameFinal = `Excel_${safeStoreName}_${Math.floor(Date.now()/1000)}.xlsx`;
            const url = window.URL.createObjectURL(new Blob([buffer], { type: 'application/octet-stream' }));
            const a = document.createElement('a');
            a.href = url;
            a.download = fileNameFinal;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }, 5000);
            
            setIsExporting(false);
            showToast("Excel generado con éxito");
        } catch (error) {
            console.error("Excel Error:", error);
            setIsExporting(false);
            showToast("Error al generar Excel", "error");
        }
    }, [isExporting, stores, selectedStore, currentWeekStart, days, employees, shifts]);

    const exportToExcel = handleExcelExport;
    const exportToPDF = handlePdfExport;

    return (
        <>
            <div id="printable-area" className="page-container animate-in fade-in duration-500" style={{ padding: '2rem' }}>
                <style>
                    {`
                        @media print {
                            @page { size: landscape; margin: 1cm; }
                            .no-print { display: none !important; }
                            .print-only { display: block !important; }
                            body { background: white !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                            table { width: 100% !important; border-collapse: collapse !important; }
                            th, td { border: 1px solid #cbd5e1 !important; padding: 6px !important; font-size: 8.5pt !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                        }
                        .print-only { display: none; }
                        
                        .grid-event-turno { background: #4f46e5 !important; color: #ffffff !important; border: none !important; }
                        .grid-event-descanso { background: #f59e0b !important; color: #ffffff !important; border: none !important; }
                        .grid-event-fuera { background: #9333ea !important; color: #ffffff !important; border: none !important; }
                        .grid-event-incapacidad { background: #f1f7ff !important; color: #3b82f6 !important; border: 1px solid #3b82f6 !important; }
                        
                        .th-badge { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 9999px; font-weight: 950; font-size: 9px; }
                        .th-badge-hours { background: #f8fafc; color: #64748b; border: 1px solid #e2e8f0; }
                        .dark .th-badge-hours { background: #1e293b; color: #94a3b8; border: 1px solid #334155; }
                        
                        .elite-drop-active { background-color: rgba(79, 70, 229, 0.08) !important; border: 2px dashed #4f46e5 !important; transition: all 0.2s ease; }
                        .dark .elite-drop-active { background-color: rgba(79, 70, 229, 0.15) !important; border-color: #6366f1 !important; }

                        /* Premium Glow Effects */
                        .shadow-glow-amber { box-shadow: inset 0 2px 4px rgba(255,255,255,0.4), 0 10px 25px -5px rgba(245, 158, 11, 0.4), 0 8px 10px -6px rgba(245, 158, 11, 0.4); }
                        .shadow-glow-indigo { box-shadow: inset 0 2px 4px rgba(255,255,255,0.4), 0 10px 25px -5px rgba(79, 70, 229, 0.4), 0 8px 10px -6px rgba(79, 70, 229, 0.4); }
                        .shadow-glow-purple { box-shadow: inset 0 2px 4px rgba(255,255,255,0.4), 0 10px 25px -5px rgba(147, 51, 234, 0.4), 0 8px 10px -6px rgba(147, 51, 234, 0.4); }
                        .shadow-glow-emerald { box-shadow: inset 0 2px 4px rgba(255,255,255,0.4), 0 10px 25px -5px rgba(16, 185, 129, 0.4), 0 8px 10px -6px rgba(16, 185, 129, 0.4); }
                        .shadow-glow-rose { box-shadow: inset 0 2px 4px rgba(255,255,255,0.4), 0 10px 25px -5px rgba(225, 29, 72, 0.4), 0 8px 10px -6px rgba(225, 29, 72, 0.4); }
                        
                        .btn-chiclet { position: relative; border: 1px solid rgba(255,255,255,0.1); border-top: 2px solid rgba(255,255,255,0.3); }
                        .btn-chiclet-trash { box-shadow: inset 0 2px 4px rgba(255,255,255,0.1); }
                    `}
                </style>

                {/* 1. Header para Impresión (Solo Visible al Imprimir) */}
                <div className="print-only mb-12 border-b-4 border-slate-900 pb-6">
                    <div className="flex justify-between items-end">
                        <div>
                            <h1 className="text-4xl font-[950] text-slate-900 tracking-tighter">Programación de Turnos</h1>
                            <p className="text-slate-500 font-bold mt-2 text-xs tracking-widest">
                                Generado por: {user?.fullName || user?.name || 'Administrador'} | {formatTenantDate(new Date(), tenantSettings?.countryCode, tenantSettings?.timeZoneId, { hour12: true })}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-xl font-[950] text-slate-900">{stores.find(s => s.id === selectedStore)?.name}</p>
                            <p className="text-slate-500 font-black text-xs tracking-widest mt-1">
                                {formatDate(currentWeekStart)} — {formatDate(new Date(new Date(currentWeekStart).getTime() + 6 * 24 * 60 * 60 * 1000))}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 2. Centro de Comando Premium (v13.0) */}
                <div className="no-print space-y-4 mb-32">
                    
                    {/* 2.1 Fila 1: Selectores Maestros Compactos */}
                    <div className="flex flex-row items-center justify-between gap-3 p-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200/50 dark:border-white/5 sticky top-4 z-[100000] shadow-xl" style={{ borderRadius: '32px', overflow: 'visible' }}>
                        
                        {/* Sedes */}
                        <div className="flex-1 min-w-[200px]">
                            <SearchableSelect
                                options={stores}
                                value={selectedStore}
                                onChange={(val) => setSelectedStore(val)}
                                placeholder="Seleccionar Sede..."
                                icon={Store}
                                variant="minimal"
                                disabled={readOnly}
                            />
                        </div>

                        {/* Semana (Navegación Compacta) */}
                        <div className="flex-1 flex items-center justify-center gap-3 bg-slate-50/50 dark:bg-slate-800/40 p-1.5 rounded-2xl border border-slate-100 dark:border-white/5 mx-2">
                            <button onClick={() => setWeekOffset(prev => prev - 1)} 
                                    disabled={readOnly}
                                    className={`p-1.5 rounded-xl transition-all active:scale-90 ${readOnly ? 'text-slate-200 pointer-events-none opacity-20' : 'text-slate-400 hover:text-indigo-500 hover:bg-white dark:hover:bg-slate-700 shadow-sm'}`} 
                                    title="Anterior"><ChevronLeft size={18} strokeWidth={3} /></button>
                            
                            <div className="flex flex-col items-center min-w-[160px] relative group/jumper">
                                <span className="text-[9px] font-bold text-indigo-500/70 tracking-tight mb-0">Programación Semanal</span>
                                <div className="flex items-center gap-2">
                                    <span className={`text-[12px] font-black text-center whitespace-nowrap ${readOnly ? 'text-slate-400' : 'text-slate-800 dark:text-white'}`}>
                                        {currentWeekStart.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })} — {new Date(new Date(currentWeekStart).getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                                    </span>
                                    {!readOnly && (
                                        <div className="relative">
                                            <CalendarSearch 
                                                size={14} 
                                                className="text-slate-300 hover:text-indigo-500 cursor-pointer transition-colors" 
                                                onClick={() => document.getElementById('week-jumper').showPicker()}
                                            />
                                            <input 
                                                type="date" 
                                                id="week-jumper"
                                                className="absolute inset-0 opacity-0 cursor-pointer w-4 h-4"
                                                onChange={(e) => handleJumpToDate(e.target.value)}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button onClick={() => setWeekOffset(prev => prev + 1)} 
                                    disabled={readOnly}
                                    className={`p-1.5 rounded-xl transition-all active:scale-90 ${readOnly ? 'text-slate-200 pointer-events-none opacity-20' : 'text-slate-400 hover:text-indigo-500 hover:bg-white dark:hover:bg-slate-700 shadow-sm'}`} 
                                    title="Siguiente"><ChevronRight size={18} strokeWidth={3} /></button>
                        </div>

                        {/* Puestos (Compacto) */}
                        <div className="flex-1 min-w-[200px] relative" style={{ zIndex: 1000000, overflow: 'visible' }}>
                            <SearchableSelect
                                options={profiles.map(p => ({ id: p.id, name: p.name }))}
                                value={selectedProfiles}
                                onChange={setSelectedProfiles}
                                placeholder="Todos los Puestos..."
                                icon={ShieldCheck}
                                variant="minimal"
                                multiple={true}
                            />
                        </div>
                    </div>

                    {/* 2.2 Fila 2: Barra de Herramientas Premium (Módulos de Control Pods) */}
                    <div className="flex flex-row items-stretch justify-center gap-6 w-full mt-4 no-print overflow-x-auto pb-6 px-2 relative z-[1]">
                        
                        {/* Módulo A: Inteligencia (Glass Pod) */}
                        <div className="flex flex-col gap-2 p-4 px-8 bg-white/50 dark:bg-slate-900/40 backdrop-blur-xl border border-white/40 dark:border-slate-800/80 rounded-[2.8rem] shadow-[0_20px_50px_rgba(0,0,0,0.06)] transition-all hover:shadow-[0_30px_70px_rgba(0,0,0,0.1)] group/pod min-w-[280px]">
                            <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 tracking-wider mb-1 group-hover/pod:text-indigo-500 transition-colors text-center w-full block">Inteligencia</span>
                            <div className="flex items-center gap-3">
                                <button onClick={() => setShowPredictiveOverlay(!showPredictiveOverlay)}
                                    className={`w-11 h-11 transition-all rounded-[18px] flex items-center justify-center shadow-lg active:scale-95 btn-chiclet ${showPredictiveOverlay ? 'bg-indigo-600 text-white shadow-glow-indigo' : 'bg-white text-indigo-400 border border-indigo-100 hover:bg-slate-50'}`} title={showPredictiveOverlay ? 'Ocultar Guía IA' : 'Ver Guía IA'}>
                                    <Sparkles size={20} strokeWidth={2.5} />
                                </button>
                                {!effectiveReadOnly && (
                                    <>
                                        <button onClick={() => setShowBulkModal(true)}
                                            className="w-11 h-11 bg-amber-500 text-white rounded-[18px] flex items-center justify-center hover:bg-amber-600 transition-all shadow-glow-amber active:scale-95 btn-chiclet" title="Programación Masiva">
                                            <Calendar size={20} strokeWidth={2.5} />
                                        </button>
                                        <button onClick={copyFromPreviousWeek} 
                                            className="w-11 h-11 bg-indigo-500 text-white rounded-[18px] flex items-center justify-center hover:bg-indigo-600 transition-all shadow-glow-indigo active:scale-95 btn-chiclet" title="Clonar Semana">
                                            <CopyIcon size={20} strokeWidth={2.5} />
                                        </button>
                                    </>
                                )}
                                <button onClick={() => setShowPredictiveModal(true)}
                                    className="w-11 h-11 bg-purple-600 text-white rounded-[18px] flex items-center justify-center hover:bg-purple-700 transition-all shadow-glow-purple active:scale-95 btn-chiclet" title="Hub de Inteligencia">
                                    <Cpu size={20} strokeWidth={2.5} />
                                </button>
                            </div>
                        </div>

                        {/* Módulo B: Centro de Eventos (Glass Pod) */}
                        <div className="flex flex-col gap-2 p-4 px-8 bg-white/50 dark:bg-slate-900/40 backdrop-blur-xl border border-white/40 dark:border-slate-800/80 rounded-[2.8rem] shadow-[0_20px_50px_rgba(0,0,0,0.06)] transition-all hover:shadow-[0_30px_70px_rgba(0,0,0,0.1)] group/pod items-center min-w-[300px]">
                            <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 tracking-wider mb-1 group-hover/pod:text-indigo-500 transition-colors text-center w-full block">Centro de Eventos</span>
                            <div className="flex items-center gap-3">
                                {!effectiveReadOnly ? (
                                    <>
                                        {[
                                            { type: 'Turno', shadow: 'shadow-glow-indigo', color: 'bg-indigo-600', icon: Clock, title: 'Nuevo Turno' },
                                            { type: 'Descanso', shadow: 'shadow-glow-amber', color: 'bg-amber-500', icon: Calendar, title: 'Día de Descanso' },
                                            { type: 'Turno Fuera', shadow: 'shadow-glow-purple', color: 'bg-purple-600', icon: AlertCircle, title: 'Asignación Fuera' }
                                        ].map((tool, idx) => (
                                            <div key={idx} draggable onDragStart={(e) => handleDragStart(e, 'PANEL', { type: tool.type })} 
                                                className={`w-11 h-11 ${tool.color} text-white rounded-[18px] flex items-center justify-center cursor-grab hover:scale-110 hover:shadow-2xl transition-all ${tool.shadow} active:scale-95 btn-chiclet`} title={tool.title}>
                                                <tool.icon size={20} strokeWidth={2.5} />
                                            </div>
                                        ))}
                                        <div onDragOver={(e) => e.preventDefault()} onDrop={handleDropOnTrash} 
                                            className="w-11 h-11 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-[18px] flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700 hover:bg-rose-600 hover:text-white hover:border-solid hover:shadow-glow-rose transition-all cursor-pointer active:scale-95 btn-chiclet-trash" title="Borrar Turno">
                                            <Trash2 size={20} strokeWidth={2.5} />
                                        </div>
                                    </>
                                ) : (
                                    <div className="h-11 flex items-center text-slate-400 font-bold text-[10px] tracking-[0.1em] px-6 bg-slate-100/50 dark:bg-slate-800/40 rounded-full border border-slate-200 dark:border-slate-700 italic">Semana cerrada</div>
                                )}
                            </div>
                        </div>

                        {/* Módulo C: Utilidades (Glass Pod) */}
                        <div className="flex flex-col gap-2 p-4 px-8 bg-white/50 dark:bg-slate-900/40 backdrop-blur-xl border border-white/40 dark:border-slate-800/80 rounded-[2.8rem] shadow-[0_20px_50px_rgba(0,0,0,0.06)] transition-all hover:shadow-[0_30px_70px_rgba(0,0,0,0.1)] group/pod min-w-[280px]">
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider mb-1 px-1 group-hover/pod:text-indigo-500 transition-colors text-center w-full block">Utilidades</span>
                            <div className="flex items-center gap-3">
                                <button onClick={handleExcelExport} disabled={isExporting} 
                                    className="w-11 h-11 bg-emerald-600 text-white rounded-[18px] flex items-center justify-center hover:bg-emerald-700 transition-all shadow-glow-emerald active:scale-95 btn-chiclet" title="Exportar Excel">
                                    <FileSpreadsheet size={20} strokeWidth={2.5} />
                                </button>
                                <button onClick={handlePdfExport} disabled={isExporting}
                                    className="w-11 h-11 bg-rose-600 text-white rounded-[18px] flex items-center justify-center hover:bg-rose-700 transition-all shadow-glow-rose active:scale-95 btn-chiclet" title="Exportar Pdf">
                                    <FileDown size={20} strokeWidth={2.5} />
                                </button>
                                {!effectiveReadOnly && (
                                    <button onClick={handleSave} disabled={isExporting} 
                                        className="w-11 h-11 bg-indigo-600 text-white rounded-[18px] flex items-center justify-center hover:bg-indigo-700 transition-all shadow-glow-indigo active:scale-95 btn-chiclet" title="Guardar Cambios">
                                        {isSaving ? <div className="loader !w-5 !h-5 !border-white"></div> : <Save size={20} strokeWidth={2.5} />}
                                    </button>
                                )}
                                <div className="w-[1.5px] h-8 bg-slate-200/50 dark:bg-slate-700/50 mx-1"></div>
                                <div className="flex items-center bg-white/60 dark:bg-slate-800/60 p-1 rounded-full border border-slate-200/50 dark:border-white/5 gap-1 shadow-sm">
                                    <button onClick={() => setViewMode('SHIFTS')} className={`w-[34px] h-[34px] flex items-center justify-center rounded-full transition-all ${viewMode === 'SHIFTS' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>
                                        <Calendar size={16} strokeWidth={2.5} />
                                    </button>
                                    <button onClick={() => setViewMode('ATTENDANCE')} className={`w-[34px] h-[34px] flex items-center justify-center rounded-full transition-all ${viewMode === 'ATTENDANCE' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>
                                        <Clock size={16} strokeWidth={2.5} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                    {/* Fila Opcional: Contador Flotante Minimalista */}
                    <div className="flex justify-end pr-8 -mt-4 mb-4">
                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-100/50 dark:bg-slate-800/30 backdrop-blur-md rounded-full border border-slate-200/50 dark:border-slate-700/50">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                            <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 tracking-[0.2em]">
                                {employees.length} colaboradores activos en esta sede
                            </span>
                        </div>
                    </div>


                    <div className="flex flex-wrap items-center gap-3 mb-4 no-print">
                        {/* Status Badge Chiclet */}
                        <div className={`px-4 py-2 rounded-[20px] flex items-center gap-2 shadow-sm border transition-all animate-in zoom-in-95 duration-500 btn-chiclet ${
                            weeklyStatus.status === 'Approved' ? 'bg-emerald-600 border-emerald-400/30 text-white shadow-glow-emerald' :
                            weeklyStatus.status === 'Rejected' ? 'bg-rose-600 border-rose-400/30 text-white shadow-glow-rose' :
                            'bg-amber-500 border-amber-400/30 text-white shadow-glow-amber'
                        }`}>
                            {weeklyStatus.status === 'Approved' ? <CheckCircle size={16} strokeWidth={3} /> :
                             weeklyStatus.status === 'Rejected' ? <XCircle size={16} strokeWidth={3} /> :
                             <Clock size={16} strokeWidth={3} className="animate-pulse" />}
                            <span className="text-[10px] font-black tracking-[0.1em] uppercase">
                                {weeklyStatus.status === 'Approved' ? 'Semana Aprobada' :
                                 weeklyStatus.status === 'Rejected' ? 'Semana Rechazada' :
                                 'Estado: Pendiente de Aprobación'}
                            </span>
                        </div>

                        {lastSaveComment && (
                            <div className="flex-1 flex items-center gap-3 p-2.5 px-4 bg-white/60 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200/50 dark:border-white/5 rounded-[22px] shadow-sm">
                                <FileText size={14} className="text-indigo-500" />
                                <p className="text-[11px] font-bold text-slate-500 leading-none m-0 truncate">
                                    <span className="text-indigo-600 font-black text-[9px] mr-2 italic tracking-tighter">ÚLTIMA OBSERVACIÓN:</span>
                                    {lastSaveComment}
                                </p>
                            </div>
                        )}
                    </div>
                
                <div className="card shadow-[0_40px_100px_rgba(0,0,0,0.12)] bg-white dark:bg-slate-900 border-2 dark:border-slate-800 relative" style={{ borderRadius: '48px', overflow: 'hidden', minHeight: '600px' }}>
                    <div className="overflow-x-auto">
                            <footer className="absolute bottom-4 right-8 z-[100] opacity-30 select-none pointer-events-none">
                                <div className="text-[8px] font-black tracking-[0.2em] text-slate-400 uppercase">V13.9.46-ELITE</div>
                            </footer>
                            <table className="border-collapse" style={{ tableLayout: 'fixed', width: '1120px', borderSpacing: 0, minWidth: '1120px' }}>
                                <colgroup>
                                    <col style={{ width: '230px' }} />
                                    {days.map((_, i) => <col key={i} style={{ width: '110px' }} />)}
                                    <col style={{ width: '120px' }} />
                                </colgroup>
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-800 border-b-2 dark:border-indigo-500/20">
                                        <th className="p-4 py-8 text-left sticky left-0 z-[160] border-r dark:border-slate-800" 
                                            style={{ backgroundColor: isDarkMode ? '#060914' : '#ffffff', width: '230px', minWidth: '230px', maxWidth: '230px' }}>
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    onClick={handleSelectAll}
                                                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors"
                                                >
                                                    {selectedEmployees.length === filteredEmployees.length && filteredEmployees.length > 0 ? (
                                                        <CheckSquare size={16} className="text-indigo-500" />
                                                    ) : (
                                                        <Square size={16} className="text-slate-400" />
                                                    )}
                                                </button>
                                                <span className="text-[8.5px] font-bold tracking-wider uppercase opacity-60"
                                                      style={{ color: isDarkMode ? '#cbd5e1' : '#64748b' }}>
                                                    Colaborador
                                                </span>
                                            </div>
                                        </th>
                                        {days.map((day, i) => (
                                            <th key={i} className="p-2 text-center border-r dark:border-slate-700 w-[110px] min-w-[110px]" style={{ backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc' }}>
                                                <p className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 tracking-[0.2em] mb-0.5 uppercase drop-shadow-sm">{day.toLocaleDateString('es-CO', { weekday: 'short' })}</p>
                                                <p className="text-xl font-[1000] text-slate-800 dark:text-white leading-none tracking-tighter">{day.getDate()}</p>
                                            </th>
                                        ))}
                                        <th className="p-4 text-center w-[120px] min-w-[120px] font-[950] text-[10px] text-slate-500 dark:text-indigo-300 tracking-[0.2em] border-l dark:border-slate-700 sticky right-0 z-[160]"
                                            style={{ backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc' }}>
                                            Total
                                        </th>
                                    </tr>
                                    
                                    {/* V13.0 COORDINATED GAP ANALYSIS ROW */}
                                    {showPredictiveOverlay && (
                                        <tr className="border-b dark:border-slate-800 bg-indigo-50/10 dark:bg-indigo-900/10 animate-in slide-in-from-top duration-500">
                                            <th className="p-3 sticky left-0 z-[160] border-r dark:border-slate-800" 
                                                style={{ backgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9', width: '230px', minWidth: '230px' }}>
                                                <div className="flex items-center gap-2">
                                                    <Sparkles size={12} className="text-indigo-500 animate-pulse" />
                                                    <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest leading-none">Previsión IA</span>
                                                </div>
                                            </th>
                                            {days.map((day, di) => {
                                                const needs = calculateHourlyNeeds(day);
                                                const dayStr = day.toDateString();
                                                
                                                let totalDeficit = 0;
                                                Object.values(needs).forEach(hourlyNeed => {
                                                    hourlyNeed.forEach((need, hour) => {
                                                        const scheduledAtHour = shifts.filter(s => {
                                                            const sDate = new Date(s.startTime);
                                                            if (sDate.toDateString() !== dayStr || s.isDescanso) return false;
                                                            const sStart = sDate.getHours();
                                                            const sEnd = new Date(s.endTime).getHours();
                                                            if (sEnd < sStart) return hour >= sStart || hour < sEnd;
                                                            return sStart <= hour && sEnd > hour;
                                                        }).length;
                                                        if (need > scheduledAtHour) totalDeficit += (need - scheduledAtHour);
                                                    });
                                                });

                                                return (
                                                    <td key={di} className="p-1 border-r dark:border-slate-800 text-center align-middle cursor-pointer hover:bg-rose-500/5 group/gap transition-colors" 
                                                        style={{ height: '60px' }}
                                                        onClick={() => { if (totalDeficit > 0) setSelectedCoverageDay({ day, needs, totalDeficit }); }}
                                                    >
                                                        {totalDeficit > 0 ? (
                                                            <div className="flex flex-col items-center gap-1">
                                                                <div className="px-2 py-0.5 bg-rose-500 text-white rounded-full text-[8.5px] font-black shadow-sm group-hover/gap:scale-110 transition-transform">
                                                                    -{totalDeficit} Staff
                                                                </div>
                                                                <div className="flex items-center gap-1 opacity-60 group-hover/gap:opacity-100">
                                                                    <Sparkles size={10} className="text-rose-400" />
                                                                    <span className="text-[7.5px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter">Analizar</span>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col items-center gap-1 opacity-30">
                                                                <div className="px-2 py-0.5 bg-slate-400 text-white rounded-full text-[8.5px] font-black">
                                                                    OK
                                                                </div>
                                                            </div>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                            <td className="p-2 border-l dark:border-slate-800 sticky right-0 z-[160]" 
                                                style={{ width: '120px', minWidth: '120px', maxWidth: '120px', backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc' }}></td>
                                        </tr>
                                    )}
                                </thead>
                                <tbody>
                                    {filteredEmployees.map((emp) => {
                                        const total = shifts.filter(s => s.employeeId === emp.id).reduce((acc, s) => {
                                            if (s.isDescanso) return acc;
                                            const start = new Date(s.startTime);
                                            const end = new Date(s.endTime);
                                            let diff = (end - start) / (1000 * 60 * 60);
                                            if (diff < 0) diff += 24; // Corrección cruce medianoche
                                            return acc + diff;
                                        }, 0);
                                        const empTotalHours = Math.round(total);
                                        const isSelected = selectedEmployees.includes(emp.id);
                                        return (
                                            <tr key={emp.id} className="border-b dark:border-slate-800 hover:bg-slate-50/10 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="p-4 border-r dark:border-slate-800 sticky left-0 z-[160] shadow-[10px_0_30px_rgba(0,0,0,0.03)]" 
                                                style={{ backgroundColor: isDarkMode ? '#060914' : '#ffffff', width: '230px', minWidth: '230px' }}>
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="flex items-start gap-3 overflow-hidden">
                                                        <input type="checkbox" checked={isSelected} onChange={() => handleSelectEmployee(emp.id)} className="mt-1 w-4 h-4 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer" />
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="text-[9.5px] font-black text-slate-800 dark:text-indigo-50 tracking-tight leading-none truncate uppercase">
                                                                {emp.firstName} {emp.lastName}
                                                            </span>
                                                            <div className="flex flex-col gap-1 mt-1.5">
                                                                <span className="text-[8px] font-bold text-indigo-600 dark:text-indigo-400 tracking-wider">#{emp.documento}</span>
                                                                <span className="text-[7.5px] font-[900] text-slate-500 dark:text-slate-400 uppercase leading-none truncate">
                                                                    {profiles.find(p => p.id === emp.profileId)?.name || 'N/A'}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 mt-2 bg-emerald-500/10 dark:bg-emerald-500/20 px-2 py-0.5 rounded-full w-fit">
                                                                <Clock size={8} className="text-emerald-500" />
                                                                <span className="text-[8px] font-black text-emerald-600 dark:text-emerald-400 tracking-tighter">TOTAL: {empTotalHours}H</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                                {days.map((day, di) => {
                                                    const dayShifts = shifts.filter(s => s.employeeId === emp.id && new Date(s.startTime).toDateString() === day.toDateString());
                                                    const nov = getNovedad(emp.id, day);
                                                    const today = new Date();
                                                    today.setHours(0,0,0,0);
                                                    const isLockedDay = new Date(day).getTime() < today.getTime();

                                                    return (
                                                        <td
                                                            key={di}
                                                            onDragOver={e => !effectiveReadOnly && e.preventDefault()}
                                                            onDragEnter={e => !effectiveReadOnly && e.currentTarget.classList.add('elite-drop-active')}
                                                            onDragLeave={e => !effectiveReadOnly && e.currentTarget.classList.remove('elite-drop-active')}
                                                            onDrop={e => !effectiveReadOnly && handleDropOnGrid(e, emp.id, day)}
                                                            className="p-1 border-r dark:border-slate-800 transition-colors"
                                                        >
                                                            <div className="flex flex-col gap-1 min-h-[96px] justify-center">
                                                                {nov && (
                                                                    <div onClick={() => { setSelectedNov({ ...nov, empName: `${emp.firstName} ${emp.lastName}` }); setShowNovModal(true); }}
                                                                         className="rounded-2xl h-12 flex flex-col items-center justify-center cursor-pointer hover:shadow-md transition-all border-2 border-blue-200 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-800 shrink-0">
                                                                        <span className="text-[8px] font-black tracking-widest text-blue-600 dark:text-blue-400 mb-1 leading-none">Novedad</span>
                                                                        <div className="h-4 w-4 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center text-blue-500">
                                                                            <Info size={10} strokeWidth={3} />
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {dayShifts.reduce((acc, current) => { const hasAtt = (attendances || []).some(a => String(a.shiftId) === String(current.id)); const existing = acc.find(s => s.startTime === current.startTime); if (!existing) return [...acc, current]; if (hasAtt && !attendances.some(a => String(a.shiftId) === String(existing.id))) { return acc.map(s => s.startTime === current.startTime ? current : s); } return acc; }, []).map((shift, si) => {
                                                                    const att = attendances.find(a => String(a.shiftId) === String(shift.id) && shift.id);
                                                                    let bgColor = '#4f46e5';
                                                                    
                                                                    if (att) {
                                                                        if (att.status === 3) {
                                                                            bgColor = '#f97316'; // Naranja Brillante (Incompleto)
                                                                        } else if (att.clockIn && !att.clockOut) {
                                                                            bgColor = '#f97316'; // Naranja (Pendiente)
                                                                        } else if (att.status === 0) {
                                                                            bgColor = '#10b981'; // Verde (Correcto)
                                                                        } else if (att.status === 1) {
                                                                            bgColor = '#eab308'; // Amarillo Vibrante (Desfasado)
                                                                        } else if (att.status === 2) {
                                                                            bgColor = '#3b82f6'; // Azul (Errado)
                                                                        } else {
                                                                            bgColor = '#f97316'; // Default a Naranja si no cuadra
                                                                        }
                                                                    } else if (!shift.isDescanso && !shift.isFuera && new Date(shift.startTime) < new Date()) {
                                                                        bgColor = '#ef4444'; // Rojo Brillante (Sin Marcación)
                                                                    }

                                                                    if (shift.isDescanso) bgColor = '#94a3b8';
                                                                    if (shift.isFuera) bgColor = '#8b5cf6';

                                                                    const shiftTime = `${new Date(shift.startTime).getHours().toString().padStart(2, '0')}:${new Date(shift.startTime).getMinutes().toString().padStart(2, '0')}-${new Date(shift.endTime).getHours().toString().padStart(2, '0')}:${new Date(shift.endTime).getMinutes().toString().padStart(2, '0')}`;
                                                                    const attTime = att ? `${new Date(att.clockIn).getHours().toString().padStart(2, '0')}:${new Date(att.clockIn).getMinutes().toString().padStart(2, '0')}—${att.clockOut ? new Date(att.clockOut).getHours().toString().padStart(2, '0') + ':' + new Date(att.clockOut).getMinutes().toString().padStart(2, '0') : '...'}` : 'S/MARCAR';
                                                                    const displayText = viewMode === 'SHIFTS' ? (shift.isDescanso ? '00:00-00:00' : shiftTime) : (shift.isDescanso ? '00:00-00:00' : attTime);
                                                                    const isLocked = !!att || isLockedDay;
                                                                     
                                                                    return (
                                                                         <div key={si} 
                                                                              draggable={!effectiveReadOnly && !isLocked} 
                                                                              onDragStart={e => {
                                                                                  if (effectiveReadOnly || isLocked) {
                                                                                      e.preventDefault();
                                                                                      return;
                                                                                  }
                                                                                  handleDragStart(e, 'GRID', { employeeId: emp.id, date: day, shiftId: shift.id });
                                                                              }}
                                                                              onClick={() => {
                                                                                  if (isLocked) {
                                                                                      if (!att) showToast("Turno bloqueado: Dato histórico", "info");
                                                                                      return;
                                                                                  }
                                                                                  setPendingEvent({ employeeId: emp.id, date: day, type: shift.isDescanso ? 'Descanso' : shift.isFuera ? 'Turno Fuera' : 'Turno', existingShift: shift });
                                                                                  if (!shift.isDescanso && !shift.isFuera) {
                                                                                      const sd = new Date(shift.startTime);
                                                                                      const ed = new Date(shift.endTime);
                                                                                      setStartTime(`${String(sd.getHours()).padStart(2, '0')}:${String(sd.getMinutes()).padStart(2, '0')}`);
                                                                                      setEndTime(`${String(ed.getHours()).padStart(2, '0')}:${String(ed.getMinutes()).padStart(2, '0')}`);
                                                                                      setShowTimeModal(true);
                                                                                  }
                                                                              }}
                                                                              onMouseEnter={e => {
                                                                                 const rect = e.currentTarget.getBoundingClientRect();
                                                                                 setHoveredShiftData({ ...shift, att, shiftTime, attTime, isLocked, borderCol: bgColor });
                                                                                 setHoverPos({ x: rect.left + rect.width / 2, y: rect.top });
                                                                              }}
                                                                              onMouseLeave={() => setHoveredShiftData(null)}
                                                                              className={`group rounded-xl p-1.5 flex flex-col items-center justify-center text-white shadow-md transition-all relative ${isLocked ? (att ? 'cursor-help hover:ring-2 ring-white/50 scale-105' : 'cursor-default opacity-[0.9]') : 'cursor-grab active:cursor-grabbing hover:scale-[1.05] hover:z-50'}`}
                                                                               style={{ 
                                                                                  background: bgColor, 
                                                                                  minWidth: '72px', 
                                                                                  minHeight: '28px', 
                                                                                  filter: isLocked ? 'contrast(0.9) saturate(0.8)' : 'none',
                                                                                  borderLeft: shift.status === 1 ? '4px solid #10b981' : (shift.status === 2 ? '4px solid #ef4444' : 'none')
                                                                              }}
                                                                         >
                                                                             <div className="flex items-center gap-2 mb-0.5">
                                                                                 {shift.status === 6 && <CheckCircle size={10} className="text-white" />}
                                                                                 {shift.status === 7 && <XCircle size={10} className="text-white" />}
                                                                                 {shift.status === 5 && <Clock size={10} className="text-white opacity-70" />}
                                                                                 {isLocked && <Lock size={11} className="text-white opacity-70" />}
                                                                                 {att && <Activity size={12} className="text-white opacity-100 animate-pulse" />}
                                                                                 <span className="text-[6.5px] font-black uppercase tracking-[0.1em] opacity-80 leading-none">
                                                                                   {viewMode === 'SHIFTS' ? (shift.isDescanso ? 'DESC' : shift.isFuera ? 'FUERA' : 'TURNO') : 'MARCACIÓN'}
                                                                                 </span>
                                                                             </div>
                                                                             {shift.isAutoGenerated && (
                                                                                 <div className="absolute top-1 right-1 animate-bounce">
                                                                                     <Sparkles size={10} className="text-yellow-300" />
                                                                                 </div>
                                                                             )}
                                                                             <span className={`text-[7.5px] font-[1000] tracking-tighter whitespace-nowrap mt-0.5 ${viewMode === 'ATTENDANCE' && !att ? 'opacity-40 animate-pulse' : ''}`}>
                                                                                 {displayText}
                                                                             </span>
                                                                             
                                                                             {att && (
                                                                                 <div className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center shadow-md animate-in zoom-in duration-300`} style={{ backgroundColor: bgColor, color: 'white' }}>
                                                                                     {att.status === 0 ? <CheckCircle size={9} strokeWidth={4} /> : (att.status === 2 ? <XCircle size={9} strokeWidth={4} /> : (att.status === 3 ? <AlertTriangle size={9} strokeWidth={4} /> : (!att.clockOut ? <Clock size={9} strokeWidth={4} /> : <AlertCircle size={9} strokeWidth={4} />)))}
                                                                                 </div>
                                                                             )}
                                                                         </div>
                                                                     );
                                                                 })}
                                                                {!nov && dayShifts.length === 0 && (
                                                                    <div onClick={() => {
                                                                                 if (effectiveReadOnly || isLockedDay) {
                                                                                     showToast(isLockedDay ? "Dato histórico bloqueado" : "Control de cambios bloqueado (Semana Validada)", "info");
                                                                                     return;
                                                                                 }
                                                                                 setPendingEvent({ employeeId: emp.id, date: day, type: 'Turno', existingShift: null });
                                                                                 setStartTime('08:00');
                                                                                 setEndTime('17:00');
                                                                                 setShowTimeModal(true);
                                                                             }} 
                                                                             className={`h-10 border-2 border-dashed rounded-2xl flex items-center justify-center transition-all ${isLockedDay ? 'border-slate-100 dark:border-slate-800 cursor-not-allowed opacity-[0.4]' : 'border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 cursor-pointer group'}`}
                                                                    >
                                                                        <Plus size={14} className={`${isLockedDay ? 'text-slate-300' : 'text-slate-400 group-hover:text-indigo-500 group-hover:scale-125'} transition-all`} />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                                <td className="p-2 border-l dark:border-slate-800 sticky right-0 z-[160] shadow-[-15px_0_40px_rgba(0,0,0,0.15)]" 
                                                    style={{ width: '120px', minWidth: '120px', maxWidth: '120px', backgroundColor: isDarkMode ? '#0f172a' : '#ffffff' }}>
                                                    <div className="flex flex-col items-center justify-center gap-1.5">
                                                        <div className="flex items-center gap-2 bg-indigo-50/50 dark:bg-indigo-900/20 px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-800/50">
                                                            <Calendar size={12} className="text-indigo-500" strokeWidth={3} />
                                                            <strong className="text-[11px] font-[950] text-indigo-700 dark:text-indigo-300">
                                                                {formatHours(total)}
                                                            </strong>
                                                        </div>
                                                                           {(() => {
                                                            // Calculate total worked hours by looking up attendances for each shift in the current week
                                                            const workedTotal = shifts
                                                                .filter(s => s.employeeId === emp.id && !s.isDescanso)
                                                                .reduce((acc, s) => {
                                                                    const att = (attendances || []).find(a => String(a.shiftId) === String(s.id));
                                                                    if (!att || !att.clockIn || !att.clockOut) return acc;
                                                                    
                                                                    const status = Number(att.status);
                                                                    if (status !== 0 && status !== 1) return acc;
                                                                    
                                                                    const start = new Date(att.clockIn);
                                                                    const end = new Date(att.clockOut);
                                                                    if (isNaN(start.getTime()) || isNaN(end.getTime())) return acc;
                                                                    
                                                                    let diff = (end - start) / (1000 * 60 * 60);
                                                                    if (diff < 0) diff += 24;
                                                                    return acc + (isNaN(diff) ? 0 : diff);
                                                                }, 0);
                                                            
                                                            // Always show if there are shifts or if there's worked time
                                                            const hasShifts = shifts.some(s => s.employeeId === emp.id && !s.isDescanso);

                                                            if (hasShifts || workedTotal > 0) {
                                                                return (
                                                                    <div className="flex items-center gap-2 bg-emerald-50/50 dark:bg-emerald-900/20 px-3 py-1 rounded-full border border-emerald-100 dark:border-emerald-800/50 animate-in slide-in-from-bottom-1 duration-300">
                                                                        <Clock size={12} className="text-emerald-500" strokeWidth={3} />
                                                                        <div className="flex flex-col items-start leading-[1] py-0.5">
                                                                            <strong className="text-[11px] font-[950] text-emerald-700 dark:emerald-300">
                                                                                {(() => {
                                                                                    const h = Math.floor(workedTotal);
                                                                                    const m = Math.round((workedTotal - h) * 60);
                                                                                    return `${h}h ${m.toString().padStart(2, '0')}m`;
                                                                                })()}
                                                                            </strong>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            }
                                                            return null;
                                                        })()}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                </div>

                {/* Justificación de la semana (Print) */}
                {(saveComment || lastSaveComment) && (
                    <div className="print-only print-comment-box mt-10 p-6 bg-slate-50 border-2 border-slate-200 rounded-3xl">
                        <p className="text-[10px] font-black text-indigo-600 mb-2 tracking-widest">Observaciones de la programación:</p>
                        <p className="text-[13px] font-bold text-slate-800 leading-relaxed italic">
                            "{saveComment || lastSaveComment}"
                        </p>
                    </div>
                )}

                {/* Print Footer */}
                <div className="print-only mt-12 grid grid-cols-2 gap-16 border-t-2 border-slate-900 pt-8">
                    <div className="text-center"><p className="text-xs font-black">Firma Jefe de Sede</p></div>
                    <div className="text-center"><p className="text-xs font-black">Firma Talento Humano</p></div>
                </div>
            </div>

            {/* Toast V12 */}
            {toast.show && (
                <div className="toast-container" style={{ zIndex: 100000, pointerEvents: 'auto' }}>
                    <div className={`toast ${toast.type === 'error' ? 'toast-error' : 'toast-success'}`}>
                        {toast.type === 'success' ? <CheckCircle size={20} className="text-emerald-500" /> : <AlertCircle size={20} className="text-rose-500" />}
                        <span className="uppercase tracking-widest">{toast.message}</span>
                    </div>
                </div>
            )}

            {/* Global Portals */}
            {createPortal(
                <>
                    {/* V13.0 PREMIUM APPROVAL MODAL */}
                    {showApprovalModal && (
                        <div style={{ position: 'fixed', inset: 0, zIndex: 200000, background: 'rgba(6, 9, 20, 0.6)', backdropFilter: 'blur(15px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} className="animate-in fade-in duration-300">
                            <div style={{ background: activeColors.card, width: '100%', maxWidth: '500px', borderRadius: '40px', padding: '50px', border: `1px solid ${activeColors.border}`, boxShadow: '0 30px 100px rgba(0,0,0,0.4)', textAlign: 'center' }} className="animate-in zoom-in-95 duration-500">
                                <div style={{ width: '80px', height: '80px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', margin: '0 auto 30px' }}>
                                    <ShieldCheck size={40} />
                                </div>
                                <h3 style={{ fontSize: '1.8rem', fontWeight: '950', color: activeColors.textMain, marginBottom: '15px' }}>Confirmar Aprobación</h3>
                                <p style={{ color: activeColors.textMuted, fontSize: '0.95rem', fontWeight: '600', marginBottom: '35px', lineHeight: '1.6' }}>
                                    Estás a punto de validar administrativamente la programación de la sede <span style={{ color: activeColors.accent, fontWeight: '900' }}>{stores.find(s => s.id === selectedStore)?.name}</span>. Una vez aprobado, los colaboradores podrán ver sus turnos de forma oficial.
                                </p>
                                
                                <div style={{ marginBottom: '35px' }}>
                                    <textarea 
                                        placeholder="Comentarios opcionales para el gerente..."
                                        value={approvalComment}
                                        onChange={(e) => setApprovalComment(e.target.value)}
                                        style={{ width: '100%', padding: '20px', borderRadius: '24px', border: `2px solid ${activeColors.border}`, background: isDarkMode ? 'rgba(255,255,255,0.03)' : '#f8fafc', color: activeColors.textMain, fontSize: '0.9rem', fontWeight: '700', minHeight: '100px', outline: 'none', resize: 'none' }}
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '15px' }}>
                                    <button 
                                        onClick={() => setShowApprovalModal(false)}
                                        style={{ flex: 1, padding: '20px', borderRadius: '20px', border: `2px solid ${activeColors.border}`, background: 'transparent', color: activeColors.textMuted, fontWeight: '900', fontSize: '0.8rem', uppercase: 'true', letterSpacing: '1px' }}
                                    >CANCELAR</button>
                                    <button 
                                        onClick={confirmApprove}
                                        disabled={loading}
                                        style={{ flex: 2, padding: '20px', borderRadius: '20px', border: 'none', background: activeColors.accent, color: 'white', fontWeight: '950', fontSize: '0.8rem', boxShadow: '0 15px 30px rgba(79, 70, 229, 0.4)' }}
                                    >{loading ? 'PROCESANDO...' : 'APROBAR SEMANA'}</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* V13.0 PREMIUM REJECTION MODAL */}
                    {showRejectionModal && (
                        <div style={{ position: 'fixed', inset: 0, zIndex: 200000, background: 'rgba(6, 9, 20, 0.6)', backdropFilter: 'blur(15px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} className="animate-in fade-in duration-300">
                             <div style={{ background: isDarkMode ? '#1e293b' : '#ffffff', width: '100%', maxWidth: '500px', borderRadius: '48px', overflow: 'hidden', border: isDarkMode ? '1px solid #334155' : 'none', boxShadow: '0 50px 100px rgba(0,0,0,0.5)', animation: 'modalSlideUp 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)' }}>
                                <div style={{ padding: '50px', textAlign: 'center' }}>
                                    <div style={{ width: '84px', height: '84px', background: '#fee2e2', color: '#ef4444', borderRadius: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 30px', transform: 'rotate(-5deg)', boxShadow: '0 20px 40px rgba(239, 68, 68, 0.15)' }}>
                                        <XCircle size={44} strokeWidth={2.5} />
                                    </div>
                                    <h2 style={{ fontSize: '1.6rem', fontWeight: '950', color: isDarkMode ? 'white' : '#1e293b', letterSpacing: '-0.03em', margin: '0 0 10px' }}>Rechazar Turno</h2>
                                    <p style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Solicitar corrección inmediata</p>
                                </div>
                                <div style={{ padding: '0 50px 50px' }}>
                                    <div style={{ marginBottom: '35px' }}>
                                        <label style={{ display: 'block', fontSize: '10px', fontWeight: '950', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '15px', letterSpacing: '0.1em' }}>Motivo del rechazo (obligatorio) *</label>
                                        <textarea
                                            value={rejectionComment}
                                            onChange={e => setRejectionComment(e.target.value)}
                                            placeholder="Indica qué debe corregir el gerente..."
                                            rows={4}
                                            style={{ width: '100%', padding: '24px', borderRadius: '24px', border: `2px solid ${isDarkMode ? '#334155' : '#f1f5f9'}`, background: isDarkMode ? '#0f172a' : '#f8fafc', color: isDarkMode ? 'white' : '#1e293b', fontWeight: '700', minHeight: '130px', boxSizing: 'border-box', outline: 'none', resize: 'none', transition: 'border-color 0.3s' }}
                                            className="focus:border-rose-500"
                                        />
                                        {rejectionComment.length > 0 && rejectionComment.length < 5 && (
                                            <p className="text-rose-500 text-[10px] font-black uppercase mt-2 px-2 tracking-widest">Mínimo 5 caracteres</p>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                        <button 
                                            onClick={confirmReject}
                                            disabled={loading}
                                            style={{ width: '100%', padding: '24px', borderRadius: '22px', border: 'none', background: '#ef4444', color: 'white', fontWeight: '950', fontSize: '12px', cursor: 'pointer', boxShadow: '0 15px 35px rgba(239, 68, 68, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', transition: 'all 0.2s' }}
                                            className="hover:scale-[1.02] active:scale-95"
                                        >
                                            {loading ? <div className="loader !w-5 !h-5 !border-white"></div> : 'Confirmar Rechazo'}
                                        </button>
                                        <button 
                                            onClick={() => setShowRejectionModal(false)}
                                            style={{ width: '100%', padding: '15px', borderRadius: '20px', border: 'none', background: 'transparent', color: '#94a3b8', fontWeight: '800', fontSize: '10px', textTransform: 'uppercase', cursor: 'pointer', letterSpacing: '0.2em' }}
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Guardar Cambios Elite Modal */}
                    {showSaveModal && (
                        <div className="no-print" style={{ position: 'fixed', inset: 0, background: 'rgba(2, 6, 15, 0.85)', backdropFilter: 'blur(30px)', zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                            <div style={{ background: isDarkMode ? '#1e293b' : '#ffffff', width: '100%', maxWidth: '550px', borderRadius: '48px', overflow: 'hidden', border: isDarkMode ? '1px solid #334155' : 'none', boxShadow: '0 50px 100px rgba(0,0,0,0.5)', animation: 'modalSlideUp 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)' }}>
                                <div style={{ padding: '40px 50px', textAlign: 'center' }}>
                                    <div style={{ width: '80px', height: '80px', background: '#4f46e5', color: 'white', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 30px', boxShadow: '0 20px 40px rgba(79, 70, 229, 0.3)', transform: 'rotate(-6deg)' }}>
                                        <Save size={36} />
                                    </div>
                                    <h2 style={{ fontSize: '1.4rem', fontWeight: '950', color: isDarkMode ? 'white' : '#1e293b', letterSpacing: '-0.02em', margin: '0 0 8px' }}>Publicar cambios</h2>
                                    <p style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Programación Semanal</p>
                                    {lastSaveComment && (
                                        <div style={{ marginTop: '20px', padding: '15px', background: isDarkMode ? 'rgba(79, 70, 229, 0.1)' : '#f5f7ff', borderRadius: '16px', textAlign: 'left', border: '1px dashed #4f46e5' }}>
                                            <p style={{ fontSize: '9px', fontWeight: '950', color: '#4f46e5', textTransform: 'uppercase', marginBottom: '5px' }}>Comentario anterior:</p>
                                            <p style={{ fontSize: '11px', fontWeight: '700', color: isDarkMode ? '#cbd5e1' : '#475569', margin: 0 }}>{lastSaveComment}</p>
                                        </div>
                                    )}
                                </div>
                                <div style={{ padding: '0 50px 50px' }}>
                                    <div style={{ marginBottom: '30px' }}>
                                        <label style={{ display: 'block', fontSize: '10px', fontWeight: '950', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.1em' }}>Justificación / Comentarios *</label>
                                        <textarea
                                            value={saveComment}
                                            onChange={e => setSaveComment(e.target.value)}
                                            placeholder="Detalle los motivos del cambio (mínimo 10 caracteres)..."
                                            style={{ width: '100%', padding: '24px', borderRadius: '24px', border: `2px solid ${isDarkMode ? (saveComment.trim().length >= 10 ? '#334155' : '#ef4444') : (saveComment.trim().length >= 10 ? '#f1f5f9' : '#fee2e2')}`, background: isDarkMode ? '#0f172a' : '#f8fafc', color: isDarkMode ? 'white' : '#1e293b', fontWeight: '700', minHeight: '120px', boxSizing: 'border-box', outline: 'none', resize: 'none', fontSize: '1rem' }}
                                        />
                                        <div className="flex justify-between mt-2 px-2">
                                            <span style={{ fontSize: '9px', fontWeight: '950', color: saveComment.trim().length >= 10 ? '#10b981' : '#f43f5e', textTransform: 'uppercase' }}>
                                                {saveComment.trim().length < 10 ? `Faltan ${10 - saveComment.trim().length} caracteres` : 'Comentario válido'}
                                            </span>
                                            <span style={{ fontSize: '9px', fontWeight: '950', color: '#94a3b8', textTransform: 'uppercase' }}>
                                                {saveComment.length} caracteres
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <button onClick={performSave} disabled={isSaving} style={{ width: '100%', padding: '22px', borderRadius: '22px', border: 'none', background: '#4f46e5', color: 'white', fontWeight: '950', fontSize: '12px', textTransform: 'uppercase', cursor: 'pointer', boxShadow: '0 15px 30px rgba(79, 70, 229, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', transition: 'all 0.2s' }} className="hover:scale-[1.02] active:scale-95">
                                            {isSaving ? <div className="loader !w-5 !h-5 !border-white"></div> : <><CheckCircle size={20} /> Finalizar y Enviar</>}
                                        </button>
                                        <button onClick={() => setShowSaveModal(false)} style={{ width: '100%', padding: '18px', borderRadius: '20px', border: 'none', background: 'transparent', color: '#94a3b8', fontWeight: '800', fontSize: '10px', textTransform: 'uppercase', cursor: 'pointer', letterSpacing: '0.2em' }}>Cancelar Operación</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Programar Turno Elite Modal */}
                    {showTimeModal && (
                        <div style={{ position: 'fixed', inset: 0, background: 'rgba(2, 6, 15, 0.85)', backdropFilter: 'blur(30px)', zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                            <div style={{ background: isDarkMode ? '#1e293b' : '#ffffff', width: '100%', maxWidth: '400px', borderRadius: '48px', overflow: 'hidden', border: isDarkMode ? '1px solid #334155' : 'none', boxShadow: '0 50px 100px rgba(0,0,0,0.5)', animation: 'modalSlideUp 0.3s ease-out' }}>
                                <div style={{ padding: '40px', textAlign: 'center' }}>
                                    <div style={{ width: '64px', height: '64px', background: isDarkMode ? 'rgba(79, 70, 229, 0.2)' : '#f5f7ff', color: '#4f46e5', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 25px' }}>
                                        <Clock size={32} />
                                    </div>
                                    <h2 style={{ fontSize: '1.4rem', fontWeight: '950', color: isDarkMode ? 'white' : '#1e293b', letterSpacing: '-0.02em', margin: 0 }}>Fijar horario</h2>
                                </div>
                                <div style={{ padding: '0 40px 40px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px' }}>
                                        <div style={{ background: isDarkMode ? '#0f172a' : '#f8fafc', padding: '20px', borderRadius: '24px', border: `2px solid ${isDarkMode ? '#334155' : '#f1f5f9'}` }}>
                                            <label style={{ display: 'block', fontSize: '9px', fontWeight: '950', color: '#94a3b8', textTransform: 'uppercase', textAlign: 'center', marginBottom: '10px', letterSpacing: '0.1em' }}>Hora Entrada *</label>
                                            <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={{ width: '100%', background: 'transparent', border: 'none', textAlign: 'center', fontSize: '1.8rem', fontWeight: '950', color: isDarkMode ? 'white' : '#1e293b', outline: 'none' }} />
                                        </div>
                                        <div style={{ background: isDarkMode ? '#0f172a' : '#f8fafc', padding: '20px', borderRadius: '24px', border: `2px solid ${isDarkMode ? '#334155' : '#f1f5f9'}` }}>
                                            <label style={{ display: 'block', fontSize: '9px', fontWeight: '950', color: '#94a3b8', textTransform: 'uppercase', textAlign: 'center', marginBottom: '10px', letterSpacing: '0.1em' }}>Hora Salida *</label>
                                            <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} style={{ width: '100%', background: 'transparent', border: 'none', textAlign: 'center', fontSize: '1.8rem', fontWeight: '950', color: isDarkMode ? 'white' : '#1e293b', outline: 'none' }} />
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <button onClick={confirmTimeModal} style={{ width: '100%', padding: '20px', borderRadius: '20px', border: 'none', background: '#4f46e5', color: 'white', fontWeight: '950', fontSize: '11px', textTransform: 'uppercase', cursor: 'pointer', boxShadow: '0 12px 24px rgba(79, 70, 229, 0.3)' }}>Asignar Turno</button>
                                        <button onClick={() => setShowTimeModal(false)} style={{ width: '100%', padding: '15px', borderRadius: '15px', border: 'none', background: 'transparent', color: '#94a3b8', fontWeight: '800', fontSize: '9px', textTransform: 'uppercase', cursor: 'pointer' }}>Cerrar</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Acciones Masivas Elite Modal */}
                    {showBulkModal && (
                        <div style={{ position: 'fixed', inset: 0, background: 'rgba(2, 6, 15, 0.9)', backdropFilter: 'blur(30px)', zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                            <div style={{ background: isDarkMode ? '#1e293b' : '#ffffff', width: '100%', maxWidth: '500px', borderRadius: '48px', overflow: 'hidden', border: isDarkMode ? '1px solid #334155' : 'none', boxShadow: '0 50px 100px rgba(0,0,0,0.5)', animation: 'modalSlideUp 0.3s' }}>
                                <div style={{ padding: '40px', textAlign: 'center' }}>
                                    <div style={{ width: '64px', height: '64px', background: 'rgba(79, 70, 229, 0.1)', color: '#4f46e5', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 25px' }}>
                                        <UsersIcon size={32} />
                                    </div>
                                    <h2 style={{ fontSize: '1.4rem', fontWeight: '950', color: isDarkMode ? 'white' : '#1e293b', letterSpacing: '-0.02em', margin: 0 }}>Acciones masivas</h2>
                                    <p style={{ color: '#94a3b8', fontSize: '10px', fontWeight: '950', textTransform: 'uppercase', mt: '8px', letterSpacing: '0.1em' }}>Programar {selectedEmployees.length} colaboradores</p>
                                </div>
                                
                                <div style={{ padding: '0 40px 40px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
                                        <div style={{ background: isDarkMode ? '#0f172a' : '#f8fafc', padding: '15px', borderRadius: '20px', border: `1px solid ${activeColors.border}` }}>
                                            <label style={{ display: 'block', fontSize: '9px', fontWeight: '950', color: '#94a3b8', textTransform: 'uppercase', textAlign: 'center', marginBottom: '8px' }}>E</label>
                                            <input type="time" value={bulkData.startTime} onChange={e => setBulkData({...bulkData, startTime: e.target.value})} style={{ width: '100%', background: 'transparent', border: 'none', textAlign: 'center', fontSize: '1.4rem', fontWeight: '950', color: isDarkMode ? 'white' : '#1e293b', outline: 'none' }} />
                                        </div>
                                        <div style={{ background: isDarkMode ? '#0f172a' : '#f8fafc', padding: '15px', borderRadius: '20px', border: `1px solid ${activeColors.border}` }}>
                                            <label style={{ display: 'block', fontSize: '9px', fontWeight: '950', color: '#94a3b8', textTransform: 'uppercase', textAlign: 'center', marginBottom: '8px' }}>S</label>
                                            <input type="time" value={bulkData.endTime} onChange={e => setBulkData({...bulkData, endTime: e.target.value})} style={{ width: '100%', background: 'transparent', border: 'none', textAlign: 'center', fontSize: '1.4rem', fontWeight: '950', color: isDarkMode ? 'white' : '#1e293b', outline: 'none' }} />
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: '30px' }}>
                                        <label style={{ display: 'block', fontSize: '9px', fontWeight: '950', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '15px', letterSpacing: '0.1em', textAlign: 'center' }}>Aplicar a los días:</label>
                                        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                            {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => {
                                                        const newDays = [...bulkData.days];
                                                        newDays[i] = !newDays[i];
                                                        setBulkData({...bulkData, days: newDays});
                                                    }}
                                                    style={{ width: '36px', height: '36px', borderRadius: '12px', border: 'none', background: bulkData.days[i] ? '#4f46e5' : (isDarkMode ? '#334155' : '#f1f5f9'), color: bulkData.days[i] ? 'white' : '#94a3b8', fontWeight: '950', fontSize: '11px', cursor: 'pointer', transition: 'all 0.2s' }}
                                                >
                                                    {d}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <button onClick={handleBulkApply} style={{ width: '100%', padding: '20px', borderRadius: '20px', border: 'none', background: '#4f46e5', color: 'white', fontWeight: '950', fontSize: '11px', textTransform: 'uppercase', cursor: 'pointer', boxShadow: '0 12px 24px rgba(79, 70, 229, 0.3)' }}>Pre-cargar Turnos</button>
                                        <button onClick={() => {
                                            const newShifts = [...shifts].filter(s => !selectedEmployees.includes(s.employeeId));
                                            setShifts(newShifts);
                                            setShowBulkModal(false);
                                            setSelectedEmployees([]);
                                            showToast("Turnos limpiados para seleccionados");
                                        }} style={{ width: '100%', padding: '15px', borderRadius: '20px', border: `1px solid ${activeColors.danger}`, background: 'transparent', color: activeColors.danger, fontWeight: '800', fontSize: '10px', textTransform: 'uppercase', cursor: 'pointer' }}>Limpiar Semana</button>
                                        <button onClick={() => setShowBulkModal(false)} style={{ width: '100%', padding: '15px', borderRadius: '15px', border: 'none', background: 'transparent', color: '#94a3b8', fontWeight: '800', fontSize: '9px', textTransform: 'uppercase', cursor: 'pointer' }}>Cerrar</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Novedad Activa Elite Modal */}
                    {showNovModal && selectedNov && (
                        <div style={{ position: 'fixed', inset: 0, background: 'rgba(2, 6, 15, 0.85)', backdropFilter: 'blur(30px)', zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                            <div style={{ background: isDarkMode ? '#1e293b' : '#ffffff', width: '100%', maxWidth: '400px', borderRadius: '48px', overflow: 'hidden', border: isDarkMode ? '1px solid #334155' : 'none', boxShadow: '0 50px 100px rgba(0,0,0,0.5)', animation: 'modalSlideUp 0.3s ease-out' }}>
                                <div style={{ padding: '40px', textAlign: 'center' }}>
                                    <div style={{ width: '64px', height: '64px', background: isDarkMode ? 'rgba(59, 130, 246, 0.2)' : '#eff6ff', color: '#3b82f6', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 25px' }}>
                                        <Info size={32} />
                                    </div>
                                    <h2 style={{ fontSize: '1.4rem', fontWeight: '950', color: isDarkMode ? 'white' : '#1e293b', letterSpacing: '-0.02em', margin: 0 }}>Novedad activa</h2>
                                </div>
                                <div style={{ padding: '0 40px 40px', textAlign: 'center' }}>
                                    <div style={{ marginBottom: '20px' }}>
                                        <p style={{ fontSize: '9px', fontWeight: '950', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.1em' }}>Colaborador</p>
                                        <p style={{ fontSize: '1.1rem', fontWeight: '800', color: isDarkMode ? 'white' : '#1e293b', margin: 0 }}>{selectedNov.empName}</p>
                                        <p style={{ fontSize: '10px', fontWeight: '900', color: '#3b82f6', marginTop: '4px', textTransform: 'uppercase' }}>Radicado: #ND-{selectedNov.idSolicitud}</p>
                                    </div>
                                    <div style={{ marginBottom: '25px' }}>
                                        <p style={{ fontSize: '9px', fontWeight: '950', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.1em' }}>Tipo de Novedad</p>
                                        <div style={{ display: 'inline-flex', padding: '10px 20px', background: isDarkMode ? '#1e3a8a' : '#ebf5ff', color: '#3b82f6', borderRadius: '14px', fontSize: '11px', fontWeight: '950', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            {selectedNov.novedadTipoNombre}
                                        </div>
                                    </div>
                                    <div style={{ marginBottom: '35px', padding: '20px', background: isDarkMode ? '#0f172a' : '#f8fafc', borderRadius: '24px', border: `1px solid ${isDarkMode ? '#334155' : '#f1f5f9'}` }}>
                                        <p style={{ fontSize: '9px', fontWeight: '950', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.1em' }}>Vigencia de Novedad</p>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
                                            <div style={{ textAlign: 'center' }}>
                                                <p style={{ fontSize: '12px', fontWeight: '950', color: isDarkMode ? 'white' : '#1e293b' }}>{new Date(selectedNov.fechaInicio).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}</p>
                                            </div>
                                            <ArrowRight size={14} className="text-slate-300" />
                                            <div style={{ textAlign: 'center' }}>
                                                <p style={{ fontSize: '12px', fontWeight: '950', color: isDarkMode ? 'white' : '#1e293b' }}>{new Date(selectedNov.fechaFin).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={() => setShowNovModal(false)} style={{ width: '100%', padding: '20px', borderRadius: '20px', border: 'none', background: '#3b82f6', color: 'white', fontWeight: '950', fontSize: '11px', textTransform: 'uppercase', cursor: 'pointer', boxShadow: '0 12px 24px rgba(59, 130, 246, 0.3)' }}>Entendido</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Elite SnapShot Bubble Tooltip (Fidelity Style) */}
                    {hoveredShiftData && (
                        <div 
                            className="no-print"
                            style={{ 
                                position: 'fixed', 
                                zIndex: 1000000, 
                                left: `${hoverPos.x}px`, 
                                top: `${hoverPos.y}px`, 
                                transform: hoverPos.y < 350 ? 'translate(-50%, 45px)' : 'translate(-50%, -100%) translateY(-25px)',
                                transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                pointerEvents: 'none'
                            }}
                        >
                            {/* Card Container */}
                            <div style={{ 
                                background: isDarkMode ? '#1e293b' : '#ffffff', 
                                border: `2px solid ${hoveredShiftData.borderCol}`,
                                borderRadius: '32px',
                                padding: '16px 20px',
                                minWidth: '240px',
                                boxShadow: '0 30px 60px rgba(0,0,0,0.15)',
                                color: isDarkMode ? 'white' : '#1e293b',
                                position: 'relative'
                            }}>
                                {/* Header (Status) */}
                                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-white/5">
                                    <div className="flex flex-col text-left">
                                        <span className={`text-[12px] font-[1000] tracking-tight`} style={{ color: hoveredShiftData.borderCol }}>
                                            {hoveredShiftData.status === 6 ? 'TURNO APROBADO' : (hoveredShiftData.status === 7 ? 'TURNO RECHAZADO' : (hoveredShiftData.status === 5 ? 'PENDIENTE VALIDACIÓN' : (hoveredShiftData.att ? `TURNO ${hoveredShiftData.att.status === 0 ? 'CORRECTO' : (hoveredShiftData.att.status === 3 ? 'INCOMPLETO' : 'DESFASADO')}` : (hoveredShiftData.isDescanso ? 'DESCANSO' : (hoveredShiftData.isLocked ? 'SIN MARCACIONES' : 'REGISTRADO')))))}
                                        </span>
                                    </div>
                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg`} style={{ backgroundColor: hoveredShiftData.borderCol, color: 'white' }}>
                                        {hoveredShiftData.att ? (hoveredShiftData.att.status === 0 ? <CheckCircle size={22} strokeWidth={3} /> : (hoveredShiftData.att.status === 3 ? <AlertTriangle size={22} strokeWidth={3} /> : <AlertCircle size={22} strokeWidth={3} />)) : <Clock size={20} />}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <Calendar size={14} className="text-indigo-500" />
                                        <div className="flex flex-col text-left">
                                            <span className="text-[12px] font-[1000] tracking-tight uppercase">
                                                {hoveredShiftData.shiftTime}
                                                {!hoveredShiftData.isDescanso && (
                                                    <span className="ml-1.5 text-indigo-400 font-bold lowercase">
                                                        {(() => {
                                                            const start = new Date(hoveredShiftData.startTime);
                                                            const end = new Date(hoveredShiftData.endTime);
                                                            let diff = (end - start) / (1000 * 60 * 60);
                                                            if (diff < 0) diff += 24;
                                                            const h = Math.floor(diff);
                                                            const m = Math.round((diff - h) * 60);
                                                            return `(${h}h ${m.toString().padStart(2, '0')}m)`;
                                                        })()}
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                    </div>

                                    {!hoveredShiftData.isDescanso && (
                                        <div className="flex flex-col gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/5">
                                            <div className="flex items-center justify-between">
                                                <div className="flex flex-col text-left">
                                                    <div className="flex items-center gap-1.5 mb-1.5">
                                                        <LogIn size={13} className="text-emerald-500" />
                                                        <span className="text-[12px] font-black text-slate-700 dark:text-slate-200 uppercase">
                                                            ENTRADA: <span className="text-emerald-600 dark:text-emerald-400">{hoveredShiftData.att && hoveredShiftData.att.clockIn ? new Date(hoveredShiftData.att.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '---'}</span>
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <LogOut size={13} className="text-rose-500" />
                                                        <span className="text-[12px] font-black text-slate-700 dark:text-slate-200 uppercase">
                                                            SALIDA: <span className="text-rose-600 dark:text-rose-400">{hoveredShiftData.att && hoveredShiftData.att.clockOut ? new Date(hoveredShiftData.att.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (hoveredShiftData.att ? 'ACTIVE' : '---')}</span>
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {hoveredShiftData.att && hoveredShiftData.att.clockIn && hoveredShiftData.att.clockOut && (
                                                <div className="mt-1 pt-2 border-t border-slate-200 dark:border-white/10 flex items-center gap-2">
                                                    <Activity size={12} className="text-indigo-500" strokeWidth={3} />
                                                    <span className="text-[11px] font-[950] text-indigo-700 dark:text-indigo-300 uppercase tracking-tight">
                                                        REAL: {(() => {
                                                            const start = new Date(hoveredShiftData.att.clockIn);
                                                            const end = new Date(hoveredShiftData.att.clockOut);
                                                            let diff = (end - start) / (1000 * 60 * 60);
                                                            if (diff < 0) diff += 24;
                                                            const h = Math.floor(diff);
                                                            const m = Math.round((diff - h) * 60);
                                                            return `${h}h ${m.toString().padStart(2, '0')}m`;
                                                        })()}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                
                                {/* TRIANGULO (ARROW) */}
                                <div 
                                    className={`absolute left-1/2 -translate-x-1/2 w-4 h-4 ${isDarkMode ? 'bg-[#1e293b]' : 'bg-white'} rotate-45 border`}
                                    style={{ 
                                        borderColor: hoveredShiftData.borderCol,
                                        bottom: hoverPos.y < 350 ? 'auto' : '-9px',
                                        top: hoverPos.y < 350 ? '-9px' : 'auto',
                                        borderTop: hoverPos.y < 350 ? '' : 'none',
                                        borderLeft: hoverPos.y < 350 ? '' : 'none',
                                        borderBottom: hoverPos.y < 350 ? 'none' : '',
                                        borderRight: hoverPos.y < 350 ? 'none' : '',
                                        zIndex: -1
                                    }}
                                ></div>
                            </div>
                        </div>
                    )}
                </>,
                document.body
            )}

                    {/* ========================================================================= */}
                    {/* 🧠 ELITE LAYER: OVERLAYS, MODALS & GLOBAL MONITORS                      */}
                    {/* ========================================================================= */}

                    {/* 1. PREDICTIVE IQ HUB (PURPLE BUTTON MODAL) */}
                    {showPredictiveModal && createPortal(
                        <div style={{ position: 'fixed', inset: 0, zIndex: 100000000, background: 'rgba(6, 9, 20, 0.85)', backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                            <div style={{ background: isDarkMode ? '#1e293b' : '#ffffff', width: '100%', maxWidth: '650px', borderRadius: '4rem', overflow: 'hidden', border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)', boxShadow: '0 50px 100px rgba(0,0,0,0.6)', position: 'relative' }} className="animate-in zoom-in-95 duration-500">
                                <div style={{ padding: '50px', textAlign: 'center' }}>
                                    <div style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, #4f46e5, #9333ea)', color: 'white', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 25px', boxShadow: '0 20px 40px rgba(79, 70, 229, 0.3)', transform: 'rotate(-5deg)' }}>
                                        <Cpu size={40} className={isOptimizing ? "animate-spin" : "animate-pulse"} />
                                    </div>
                                    <h2 style={{ fontSize: '2.2rem', fontWeight: '950', color: isDarkMode ? 'white' : '#1e293b', letterSpacing: '-0.04em', margin: 0 }}>Hub de Inteligencia</h2>
                                    <p style={{ color: '#6366f1', fontSize: '11px', fontWeight: '950', textTransform: 'uppercase', letterSpacing: '0.2em', marginTop: '10px' }}>Optimización Basada en Demanda</p>
                                </div>

                                <div style={{ padding: '0 50px 50px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '40px' }}>
                                        <div style={{ padding: '24px', background: isDarkMode ? 'rgba(255,255,255,0.03)' : '#f8fafc', borderRadius: '32px', border: '1px solid rgba(0,0,0,0.05)' }}>
                                            <p style={{ fontSize: '10px', fontWeight: '950', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '5px' }}>Reglas Operativas</p>
                                            <p style={{ fontSize: '1.6rem', fontWeight: '950', color: isDarkMode ? 'white' : '#1e293b' }}>{predictiveRules.length}</p>
                                        </div>
                                        <div style={{ padding: '24px', background: isDarkMode ? 'rgba(255,255,255,0.03)' : '#f8fafc', borderRadius: '32px', border: '1px solid rgba(0,0,0,0.05)' }}>
                                            <p style={{ fontSize: '10px', fontWeight: '950', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '5px' }}>Data Histórica</p>
                                            <p style={{ fontSize: '1.6rem', fontWeight: '950', color: isDarkMode ? 'white' : '#1e293b' }}>3 SEMANAS</p>
                                        </div>
                                    </div>

                                    {/* V13.5 PREMIUM: BALANCE OPERATIVO OVERVIEW */}
                                    <div style={{ marginBottom: '40px', padding: '30px', background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.1), rgba(147, 51, 234, 0.1))', borderRadius: '40px', border: '1px solid rgba(79, 70, 229, 0.2)' }}>
                                        <div className="flex justify-between items-center mb-6">
                                            <h4 style={{ fontSize: '11px', fontWeight: '950', color: '#6366f1', textTransform: 'uppercase', tracking: '0.15em', margin: 0 }}>Balance Operativo Semanal</h4>
                                            <div className="px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded-full text-[9px] font-black uppercase">Análisis en Vivo</div>
                                        </div>
                                        
                                        <div className="grid grid-cols-3 gap-6">
                                            <div className="text-center">
                                                <p className="text-[9px] font-bold text-slate-500 mb-1 uppercase">Sugeridos</p>
                                                <p className="text-xl font-black text-indigo-500">
                                                    {(() => {
                                                        let totalNewReq = 0;
                                                        days.forEach(day => {
                                                            const needs = calculateHourlyNeeds(day);
                                                            const dayStr = day.toDateString();
                                                            Object.keys(needs).forEach(pId => {
                                                                needs[pId].forEach((need, h) => {
                                                                    const scheduled = shifts.filter(s => {
                                                                        const sD = new Date(s.startTime);
                                                                        if (sD.toDateString() !== dayStr || s.isDescanso) return false;
                                                                        const emp = employees.find(e => e.id === s.employeeId);
                                                                        if (emp?.profileId !== pId) return false;
                                                                        const sS = sD.getHours();
                                                                        const sE = new Date(s.endTime).getHours();
                                                                        return sE < sS ? (h >= sS || h < sE) : (h >= sS && h < sE);
                                                                    }).length;
                                                                    if (need > scheduled) totalNewReq += (need - scheduled);
                                                                });
                                                            });
                                                        });
                                                        return totalNewReq;
                                                    })()}
                                                </p>
                                                <p className="text-[8px] font-black text-slate-400 mt-1 uppercase">Eventos</p>
                                            </div>
                                            <div className="text-center border-x border-indigo-500/10">
                                                <p className="text-[9px] font-bold text-slate-500 mb-1 uppercase">Eficiencia</p>
                                                <p className="text-xl font-black text-emerald-500">
                                                    {(() => {
                                                        let totalNeeds = 0;
                                                        let totalScheduled = 0;
                                                        days.forEach(day => {
                                                            const needs = calculateHourlyNeeds(day);
                                                            const dayStr = day.toDateString();
                                                            Object.keys(needs).forEach(pId => {
                                                                needs[pId].forEach((need, h) => {
                                                                    totalNeeds += need;
                                                                    totalScheduled += Math.min(need, shifts.filter(s => {
                                                                        const sD = new Date(s.startTime);
                                                                        if (sD.toDateString() !== dayStr || s.isDescanso) return false;
                                                                        const emp = employees.find(e => e.id === s.employeeId);
                                                                        if (emp?.profileId !== pId) return false;
                                                                        const sS = sD.getHours();
                                                                        const sE = new Date(s.endTime).getHours();
                                                                        return sE < sS ? (h >= sS || h < sE) : (h >= sS && h < sE);
                                                                    }).length);
                                                                });
                                                            });
                                                        });
                                                        return totalNeeds > 0 ? Math.round((totalScheduled / totalNeeds) * 100) : 100;
                                                    })()}%
                                                </p>
                                                <p className="text-[8px] font-black text-slate-400 mt-1 uppercase">Cobertura</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[9px] font-bold text-slate-500 mb-1 uppercase">Crítico</p>
                                                <p className="text-xl font-black text-rose-500">
                                                    {(() => {
                                                        const hourDeltas = new Array(24).fill(0);
                                                        days.forEach(day => {
                                                            const needs = calculateHourlyNeeds(day);
                                                            const dayStr = day.toDateString();
                                                            Object.values(needs).forEach(hourlyNeed => {
                                                                hourlyNeed.forEach((n, h) => {
                                                                    const sched = shifts.filter(s => {
                                                                        const sD = new Date(s.startTime);
                                                                        if (sD.toDateString() !== dayStr || s.isDescanso) return false;
                                                                        const sS = sD.getHours();
                                                                        const sE = new Date(s.endTime).getHours();
                                                                        return sE < sS ? (h >= sS || h < sE) : (h >= sS && h < sE);
                                                                    }).length;
                                                                    if (n > sched) hourDeltas[h] += (n - sched);
                                                                });
                                                            });
                                                        });
                                                        const worstHour = hourDeltas.indexOf(Math.max(...hourDeltas));
                                                        return `${worstHour}:00`;
                                                    })()}
                                                </p>
                                                <p className="text-[8px] font-black text-slate-400 mt-1 uppercase">Hora Pico</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                        <button 
                                            onClick={performOptimization}
                                            disabled={isOptimizing || !selectedStore || predictiveRules.length === 0}
                                            className="group relative overflow-hidden active:scale-95 transition-all text-white font-[950] text-[14px] uppercase tracking-wider"
                                            style={{ width: '100%', padding: '24px', borderRadius: '24px', border: 'none', background: 'linear-gradient(90deg, #4f46e5, #9333ea)', cursor: 'pointer', boxShadow: '0 20px 40px rgba(79, 70, 229, 0.4)' }}
                                        >
                                            {isOptimizing ? <><div className="loader !border-white mr-3 inline-block"></div> CALCULANDO...</> : <><Sparkles size={20} className="inline mr-2" /> OPTIMIZAR AHORA</>}
                                        </button>

                                        {shifts.some(s => s.isAutoGenerated) && (
                                            <button 
                                                onClick={() => { setShifts(prev => prev.filter(s => !s.isAutoGenerated)); setShowPredictiveOverlay(false); }}
                                                style={{ width: '100%', padding: '18px', borderRadius: '18px', border: '1px solid #ef4444', background: 'rgba(239, 68, 68, 0.05)', color: '#ef4444', fontWeight: '900', fontSize: '11px', textTransform: 'uppercase', cursor: 'pointer' }}
                                            >
                                                <Trash2 size={16} className="inline mr-2" /> Eliminar Sugerencias
                                            </button>
                                        )}

                                        <button onClick={() => setShowPredictiveModal(false)} style={{ width: '100%', padding: '15px', borderRadius: '15px', border: 'none', background: 'transparent', color: '#94a3b8', fontWeight: '900', fontSize: '11px', textTransform: 'uppercase', cursor: 'pointer' }}>Cerrar Sistema</button>
                                    </div>
                                </div>
                            </div>
                        </div>,
                        document.body
                    )}

                    {/* 2. SLEDGEHAMMER LOADING MONITOR (BULLETPROOF) */}
                    {(loading || isProcessingStatus || isSaving || isExporting) && createPortal(
                        <div style={{ position: 'fixed', inset: 0, zIndex: 99999999, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(15px)', WebkitBackdropFilter: 'blur(15px)', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'all' }}>
                            <div className="animate-in zoom-in-95 duration-300 mx-auto" style={{ background: isDarkMode ? '#0f172a' : '#ffffff', padding: '3.5rem', borderRadius: '4.5rem', boxShadow: '0 60px 120px -20px rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.1)', width: '100%', maxWidth: '440px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div style={{ position: 'relative', width: '90px', height: '90px', marginBottom: '2.5rem' }}>
                                    <svg style={{ transform: 'rotate(-90deg)', width: '90px', height: '90px' }}>
                                        <circle cx="45" cy="45" r="40" stroke={isDarkMode ? 'rgba(255,255,255,0.05)' : '#f1f5f9'} strokeWidth="6" fill="transparent" />
                                        <circle cx="45" cy="45" r="40" stroke="#4f46e5" strokeWidth="6" fill="transparent" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * (syncPhase || (loading ? 45 : (isExporting ? 25 : 65)))) / 100} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
                                    </svg>
                                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5' }}>
                                        <Cpu size={36} className="animate-pulse" />
                                    </div>
                                </div>
                                <h3 style={{ fontSize: '1.7rem', fontWeight: '1000', color: isDarkMode ? '#f8fafc' : '#0f172a', margin: '0 0 0.5rem 0', letterSpacing: '-0.03em' }}>
                                    {isSaving ? "Publicando Cambios" : (isExporting ? "Preparando Reporte" : "Sincronizando Core")}
                                </h3>
                                <p style={{ fontSize: '0.9rem', fontWeight: '800', color: '#64748b', margin: 0, lineHeight: '1.4' }}>Optimizando datos HD en la nube segura...</p>
                            </div>
                        </div>,
                        document.body
                    )}
            {/* V13.5 ANALYTIC COVERAGE MODAL (PORTAL) */}
            {selectedCoverageDay && createPortal(
                <div 
                    style={{ 
                        position: 'fixed', 
                        top: 0, 
                        left: 0, 
                        right: 0, 
                        bottom: 0, 
                        zIndex: 9999999, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        padding: '1rem', 
                        backgroundColor: 'rgba(15, 23, 42, 0.85)', // bg-slate-900/85
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)'
                    }}
                    onClick={() => setSelectedCoverageDay(null)}
                >
                    <div 
                        className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.5)] overflow-hidden border border-white/20 dark:border-white/5 animate-in zoom-in-95 duration-500"
                        onClick={e => e.stopPropagation()}
                        style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                        {/* Header */}
                        <div className="p-8 bg-gradient-to-br from-indigo-700 to-purple-800 text-white flex justify-between items-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl animate-pulse"></div>
                            <div className="relative z-10">
                                <h3 className="text-2xl font-[1000] tracking-tighter mb-1 drop-shadow-lg text-white">Análisis de Cobertura IA</h3>
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-glow-emerald animate-pulse"></div>
                                    <p className="text-indigo-100 text-[11px] font-black uppercase tracking-widest opacity-95">
                                        {selectedCoverageDay.day.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setSelectedCoverageDay(null)}
                                className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border-2 border-white/20 flex items-center justify-center transition-all relative z-10 active:scale-90"
                            >
                                <XCircle size={24} strokeWidth={3} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-10 space-y-8 bg-white dark:bg-slate-900">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-2 gap-6">
                                <div className="p-6 bg-rose-500/5 dark:bg-rose-500/10 rounded-[2rem] border border-rose-500/20 shadow-inner">
                                    <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-2 opacity-80">Déficit Crítico</p>
                                    <p className="text-4xl font-[950] text-rose-600 dark:text-rose-500 tracking-tighter">-{selectedCoverageDay.totalDeficit} <span className="text-lg opacity-60">Staff</span></p>
                                </div>
                                <div className="p-6 bg-slate-200/20 dark:bg-white/5 rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-inner">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 opacity-80">Recomendación IA</p>
                                    <p className="text-lg font-black text-slate-700 dark:text-slate-200 tracking-tight leading-tight">Optimizar jornada vespertina</p>
                                </div>
                            </div>

                            {/* 24-HOUR HEATMAP */}
                            <div>
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Mapa de Calor (Demanda x Hora)</h4>
                                <div className="flex items-center gap-4 text-[9px] font-black">
                                    <div className="flex items-center gap-1.5 text-rose-500"><div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div> Déficit</div>
                                    <div className="flex items-center gap-1.5 text-emerald-500"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div> Cubierto</div>
                                </div>
                            </div>
                            <div className="flex gap-1 h-32 items-end bg-slate-50 dark:bg-slate-800/80 p-6 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-inner">
                                {Array.from({ length: 24 }).map((_, h) => {
                                    const needs = selectedCoverageDay.needs;
                                    const hourNeeds = Object.values(needs).reduce((acc, n) => acc + (n[h] || 0), 0);
                                    const scheduled = shifts.filter(s => {
                                        const sD = new Date(s.startTime);
                                        if (sD.toDateString() !== selectedCoverageDay.day.toDateString() || s.isDescanso) return false;
                                        const sS = sD.getHours();
                                        const sE = new Date(s.endTime).getHours();
                                        return sE < sS ? (h >= sS || h < sE) : (h >= sS && h < sE);
                                    }).length;
                                    
                                    const isDeficit = hourNeeds > scheduled;
                                    const isOptimal = hourNeeds > 0 && scheduled >= hourNeeds;

                                    return (
                                        <div key={h} className="flex-1 flex flex-col gap-2 items-center group/h relative">
                                            <div 
                                                className={`w-full rounded-full transition-all ${isDeficit ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)]' : isOptimal ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'bg-slate-300 dark:bg-slate-700'}`}
                                                style={{ height: hourNeeds > 0 ? `${Math.min(100, (scheduled/Math.max(1, hourNeeds))*100)}%` : '6px', minHeight: hourNeeds > 0 ? '8px' : '4px' }}
                                            ></div>
                                            {h % 6 === 0 && <span className="text-[7px] font-black text-slate-400 absolute -bottom-6">{h}:00</span>}
                                        </div>
                                    );
                                })}
                            </div>
                            </div>

                            {/* ROLE BREAKDOWN */}
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest pl-1">Personal Faltante</h4>
                                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2 thin-scrollbar">
                                        {(() => {
                                            const needs = selectedCoverageDay.needs;
                                            const groupedGaps = {};
                                            Object.keys(needs).forEach(pId => {
                                                const p = profiles.find(pr => pr.id === pId);
                                                const pName = p?.name || '---';
                                                const pDeficit = needs[pId].reduce((acc, n, h) => {
                                                    const scheduled = shifts.filter(s => {
                                                        const sD = new Date(s.startTime);
                                                        if (sD.toDateString() !== selectedCoverageDay.day.toDateString() || s.isDescanso) return false;
                                                        const emp = employees.find(e => e.id === s.employeeId);
                                                        const sS = sD.getHours();
                                                        const sE = new Date(s.endTime).getHours();
                                                        const isAtHour = sE < sS ? (h >= sS || h < sE) : (sS <= h && sE > h);
                                                        return emp?.profileId === pId && isAtHour;
                                                    }).length;
                                                    return acc + Math.max(0, n - scheduled);
                                                }, 0);
                                                if (pDeficit > 0) groupedGaps[pName] = (groupedGaps[pName] || 0) + pDeficit;
                                            });
                                            if (Object.keys(groupedGaps).length === 0) return <p className="text-[11px] text-slate-400 italic">No hay faltantes registrados.</p>;
                                            return Object.entries(groupedGaps).map(([name, deficit]) => (
                                                <div key={name} className="flex justify-between items-center bg-rose-500/5 p-4 rounded-3xl border border-rose-500/10 shadow-sm">
                                                    <span className="text-[10px] font-[950] text-slate-800 dark:text-indigo-100 leading-tight uppercase max-w-[140px] truncate">{name}</span>
                                                    <span className="px-3 py-1 bg-rose-500 text-white text-[9px] font-black rounded-full shadow-sm">-{deficit} HRS</span>
                                                </div>
                                            ));
                                        })()}
                                    </div>
                                </div>
                                <div className="space-y-4">
                                     <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest pl-1">Recomendación IA</h4>
                                     <div className="p-6 bg-slate-900 rounded-[2.5rem] text-white relative overflow-hidden">
                                         <Sparkles className="absolute -right-4 -bottom-4 w-24 h-24 text-white/5" />
                                         <p className="text-[11px] leading-relaxed font-medium text-slate-300 relative z-10">
                                             "Se detecta una brecha crítica durante la hora pico. Se recomienda asignar al menos **1 colaborador adicional** para cubrir el déficit de horas."
                                         </p>
                                         <button 
                                            onClick={() => { performOptimization(); setSelectedCoverageDay(null); }}
                                            className="mt-4 w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-2xl text-[10px] font-black uppercase transition-all active:scale-95"
                                         >
                                             Ejecutar Optimización Ahora
                                         </button>
                                     </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

export default ShiftScheduler;
