import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { createPortal } from 'react-dom';
import api from '../../services/api';
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
    ArrowDown
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import HelpIcon from '../../components/Shared/HelpIcon';
import { formatTenantDate } from '../../utils/localization';
import SearchableSelect from '../../components/Shared/SearchableSelect';

const ShiftScheduler = ({ user, tenantSettings }) => {
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
    const [selectedStore, setSelectedStore] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [exportUrl, setExportUrl] = useState('');
    const [exportFileName, setExportFileName] = useState('');
    const [jornadas, setJornadas] = useState([]);
    const [weekOffset, setWeekOffset] = useState(0);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

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
    const [selectedProfile, setSelectedProfile] = useState('');
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

    const getMonday = (offset = 0) => {
        const now = new Date();
        const day = now.getDay() || 7;
        const monday = new Date(now);
        monday.setDate(now.getDate() - day + 1 + (offset * 7));
        monday.setHours(0, 0, 0, 0);
        return monday;
    };

    const [currentWeekStart, setCurrentWeekStart] = useState(getMonday(0));

    useEffect(() => {
        setCurrentWeekStart(getMonday(weekOffset));
    }, [weekOffset]);

    useEffect(() => {
        api.get('/stores').then(res => {
            const isManager = user?.roles?.includes('Gerente');
            const isSupervisor = user?.roles?.includes('Supervisor');
            let filteredStores = res.data.filter(s => s.isActive);

            if (isManager && user?.storeId) {
                filteredStores = filteredStores.filter(s => s.id === user.storeId);
                setStores(filteredStores);
                setSelectedStore(user.storeId);
            } else if (isSupervisor && user?.storeIds && user.storeIds.length > 0) {
                filteredStores = filteredStores.filter(s => user.storeIds.includes(s.id));
                setStores(filteredStores);
                if (filteredStores.length > 0) setSelectedStore(filteredStores[0].id);
            } else {
                setStores(filteredStores);
                if (filteredStores.length > 0) setSelectedStore(filteredStores[0].id);
            }
        });

        api.get('/profiles').then(res => setProfiles(res.data));

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
        if (selectedStore) fetchData();
    }, [selectedStore, currentWeekStart]);

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    };

    const toLocalISO = (date) => {
        if (!date) return null;
        const d = new Date(date);
        const offset = d.getTimezoneOffset() * 60000;
        return new Date(d - offset).toISOString().slice(0, -1);
    };

    const formatHours = (hours) => {
        const h = Math.floor(hours);
        const m = Math.round((hours - h) * 60);
        return `${h}h ${String(m).padStart(2, '0')}m`;
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const startDateStr = toLocalISO(currentWeekStart);
            const endDate = new Date(currentWeekStart);
            endDate.setDate(endDate.getDate() + 7);
            const endDateStr = toLocalISO(endDate);

            const [empRes, shiftRes, newsRes, jornadaRes, attRes] = await Promise.all([
                api.get(`/employees?storeId=${selectedStore}`),
                api.get(`/shifts?storeId=${selectedStore}&startDate=${startDateStr}&endDate=${endDateStr}`),
                api.get(`/novedades?storeId=${selectedStore}&startDate=${startDateStr}&endDate=${endDateStr}&status=1`),
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

            setShifts(normalizedShifts);
            setAttendances(attRes.data);
            setNews(newsRes.data);

            // Extract the common observation/comment for this week
            const firstComment = normalizedShifts.find(s => s.observation)?.observation || '';
            setLastSaveComment(firstComment);
        } catch (err) {
            showToast("Error al cargar datos", "error");
        } finally {
            setLoading(false);
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

    const filteredEmployees = useMemo(() => {
        if (!selectedProfile) return employees;
        return employees.filter(e => e.profileId === selectedProfile);
    }, [employees, selectedProfile]);

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
        e.dataTransfer.setData("source", source);
        e.dataTransfer.setData("payload", JSON.stringify(data));
        e.dataTransfer.effectAllowed = source === 'GRID' ? "copy" : "move";
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
        const source = e.dataTransfer.getData("source");
        const payload = JSON.parse(e.dataTransfer.getData("payload"));

        if (hasNovedad(targetEmployeeId, targetDate)) {
            showToast("Día bloqueado por novedad", "error");
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

                const newShifts = [...shifts];
                // Check if there is already a shift of the SAME TYPE or if we should just add it
                // For Descanso/Fuera, usually one per day. 
                const existingIdx = newShifts.findIndex(s => s.employeeId === targetEmployeeId && new Date(s.startTime).toDateString() === targetDate.toDateString() && (s.isDescanso || s.isFuera));
                
                if (existingIdx >= 0) newShifts[existingIdx] = newShift;
                else newShifts.push(newShift);
                
                setShifts(newShifts);
                showToast(`${payload.type} asignado`);
            } else {
                setPendingEvent({ employeeId: targetEmployeeId, date: targetDate, type: payload.type });
                setStartTime('08:00'); setEndTime('17:00'); setShowTimeModal(true);
            }
        } else if (source === 'GRID') {
            const sourceShift = shifts.find(s => s.employeeId === payload.employeeId && new Date(s.startTime).toDateString() === new Date(payload.date).toDateString());
            if (!sourceShift) return;

            const newStart = new Date(targetDate);
            const os = new Date(sourceShift.startTime);
            newStart.setHours(os.getHours(), os.getMinutes(), 0);

            const newEnd = new Date(targetDate);
            const oe = new Date(sourceShift.endTime);
            newEnd.setHours(oe.getHours(), oe.getMinutes(), 0);

            const newShift = {
                employeeId: targetEmployeeId,
                startTime: newStart.toISOString(),
                endTime: newEnd.toISOString(),
                status: 0,
                isDescanso: !!sourceShift.isDescanso,
                isFuera: !!sourceShift.isFuera
            };

            const newShifts = [...shifts];
            // Add as a new shift instead of replacing, unless it exactly overlaps
            const isOverlap = newShifts.some(s => s.employeeId === targetEmployeeId && s.startTime === newShift.startTime && s.endTime === newShift.endTime);
            
            if (!isOverlap) {
                newShifts.push(newShift);
                setShifts(newShifts);
                showToast("Turno copiado");
            }
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
            const endDate = new Date(currentWeekStart); endDate.setDate(endDate.getDate() + 7);
            const localizedShifts = shifts.map(s => ({ ...s, startTime: toLocalISO(s.startTime), endTime: toLocalISO(s.endTime) }));

            await api.post('/shifts/bulk', {
                storeId: selectedStore,
                startDate: toLocalISO(currentWeekStart),
                endDate: toLocalISO(endDate),
                shifts: localizedShifts,
                comment: saveComment
            });
            setLastSaveComment(saveComment);
            showToast("Programación guardada exitosamente");
            setShowSaveModal(false); fetchData();
        } catch (err) { showToast(err.response?.data?.message || "Error al guardar", "error"); } finally { setIsSaving(false); }
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

    const exportToPDF = () => {
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
    };

    const exportToExcel = async () => {
        if (isExporting) return;
        try {
            setIsExporting(true);
            showToast("Preparando Excel Corporativo...", "success");
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Programación');
            const storeNameOrg = stores.find(s => s.id === selectedStore)?.name || 'Sede';
            const safeStoreName = storeNameOrg.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20);
            const fileNameExcel = `Programacion_${safeStoreName}.xlsx`;
            const dateRange = `${currentWeekStart.toLocaleDateString()} — ${new Date(new Date(currentWeekStart).getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString()}`;

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

            // 1. Título V12
            worksheet.mergeCells('A1:J1');
            const titleRow = worksheet.getRow(1);
            titleRow.getCell(1).value = 'PROGRAMACION DE TURNOS ELITE';
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
    };

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
                        
                        .v12-badge { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 9999px; font-weight: 950; font-size: 9px; text-transform: uppercase; }
                        .v12-badge-hours { background: #f8fafc; color: #64748b; border: 1px solid #e2e8f0; }
                        .dark .v12-badge-hours { background: #1e293b; color: #94a3b8; border: 1px solid #334155; }
                    `}
                </style>

                {/* 1. Header para Impresión (Solo Visible al Imprimir) */}
                <div className="print-only mb-12 border-b-4 border-slate-900 pb-6">
                    <div className="flex justify-between items-end">
                        <div>
                            <h1 className="text-4xl font-[950] uppercase text-slate-900 tracking-tighter">Programación de Turnos</h1>
                            <p className="text-slate-500 font-bold mt-2 text-xs uppercase tracking-widest">
                                Generado por: {user?.fullName || user?.name || 'ADMINISTRADOR'} | {formatTenantDate(new Date(), tenantSettings?.countryCode, tenantSettings?.timeZoneId, { hour12: true })}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-xl font-[950] text-slate-900">{stores.find(s => s.id === selectedStore)?.name}</p>
                            <p className="text-slate-500 font-black text-xs uppercase tracking-widest mt-1">
                                {currentWeekStart.toLocaleDateString()} — {new Date(new Date(currentWeekStart).getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 2. UI Principal (V12 Elite Command Center) */}
                <div className="no-print space-y-32 mb-32">
                    {/* 2. UI Principal: COMANDO CENTRAL V12 (Floating Glassmorphism Dock) */}
                    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-8 sticky top-4 z-[50] transition-all duration-500">
                        
                        {/* 2.1 Dock de Filtros (Glassmorphism) */}
                        <div className="flex-1 flex flex-col md:flex-row items-center gap-3 p-4 bg-white/70 dark:bg-slate-900/60 backdrop-blur-3xl border border-white/20 dark:border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.1)]"
                             style={{ borderRadius: '32px' }}>
                            
                            <div className="w-full md:w-[260px]" data-v12-tooltip="Filtrar por Sede Operativa">
                                <SearchableSelect
                                    options={stores}
                                    value={selectedStore}
                                    onChange={(val) => setSelectedStore(val)}
                                    placeholder="SELECCIONAR SEDE..."
                                    icon={Store}
                                    variant="minimal"
                                />
                            </div>

                            <div className="hidden md:block w-[1px] h-8 bg-slate-200/50 dark:bg-slate-700/50"></div>

                            <div className="w-full md:w-[240px]" data-v12-tooltip="Filtrar por Puesto (Hacer clic sobre el seleccionado para desmarcar)">
                                <SearchableSelect
                                    options={profiles.map(p => ({ id: p.id, name: p.name }))}
                                    value={selectedProfile}
                                    onChange={(val) => setSelectedProfile(prev => prev === val ? '' : val)}
                                    placeholder="TODOS LOS PUESTOS..."
                                    icon={ShieldCheck}
                                    variant="minimal"
                                />
                            </div>
                        </div>

                        {/* 2.2 Comando Central Unificado (Smart Center) */}
                        <div className="flex items-center justify-between gap-4 p-2 bg-white dark:bg-slate-900 shadow-2xl border border-slate-100 dark:border-slate-800 w-full" 
                             style={{ borderRadius: '40px' }}>
                            
                            {/* Lado Izquierdo: Acciones Masivas (flex-1 para empujar) */}
                            <div className="flex-1 flex justify-start pl-2">
                                <button onClick={() => setShowBulkModal(true)}
                                        disabled={selectedEmployees.length === 0}
                                        className={`flex items-center gap-3 px-6 h-[56px] rounded-[30px] transition-all active:scale-95 group relative overflow-hidden ${selectedEmployees.length === 0 ? 'bg-slate-50 dark:bg-slate-800/50 text-slate-400 opacity-40' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-200/50 dark:shadow-none hover:bg-indigo-700'}`}
                                        data-v12-tooltip="Programar turno masivo para seleccionados">
                                    <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                                    <div className="relative flex items-center gap-3">
                                        <Clock size={18} strokeWidth={2.5} />
                                        <div className="hidden xl:flex flex-col items-start leading-none">
                                            <span className="text-[10px] font-black uppercase tracking-widest">Acciones Masivas</span>
                                            <span className="text-[9px] font-bold opacity-80 uppercase">{selectedEmployees.length} Seleccionados</span>
                                        </div>
                                    </div>
                                </button>
                            </div>

                            {/* Centro: Navegación Central (Ancho Fijo para Centrado Real) */}
                            <div className="flex-shrink-0 flex items-center">
                                <div className="w-[1px] h-8 bg-slate-100 dark:bg-slate-800 mr-4"></div>
                                <button onClick={() => setWeekOffset(prev => prev - 1)} 
                                        className="p-3 text-slate-400 hover:text-indigo-500 hover:bg-slate-100/50 dark:hover:bg-slate-800/30 rounded-2xl transition-all active:scale-90" 
                                        data-v12-tooltip="Semana Anterior"><ChevronLeft size={22} strokeWidth={3} /></button>
                                
                                <div className="flex flex-col items-center px-6 min-w-[200px]">
                                    <span className="text-[9px] font-black uppercase text-indigo-500 tracking-[0.3em] mb-1 leading-none">Período Vigente</span>
                                    <span className="text-[14px] font-[1000] uppercase tracking-tight text-slate-800 dark:text-white text-center whitespace-nowrap">
                                        {currentWeekStart.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })} — {new Date(new Date(currentWeekStart).getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                                    </span>
                                </div>

                                <button onClick={() => setWeekOffset(prev => prev + 1)} 
                                        className="p-3 text-slate-400 hover:text-indigo-500 hover:bg-slate-100/50 dark:hover:bg-slate-800/30 rounded-2xl transition-all active:scale-90" 
                                        data-v12-tooltip="Semana Siguiente"><ChevronRight size={22} strokeWidth={3} /></button>
                                <div className="w-[1px] h-8 bg-slate-100 dark:bg-slate-800 ml-4"></div>
                            </div>

                            {/* Lado Derecho: Switch de Vista + Carga Inteligente + Ayuda */}
                            <div className="flex-1 flex justify-end items-center gap-6 pr-2">
                                
                                {/* Elite View Mode Switch */}
                                <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-full border border-slate-200 dark:border-slate-700/50 shadow-inner gap-1">
                                    <button 
                                        onClick={() => setViewMode('SHIFTS')}
                                        className={`w-12 h-12 flex items-center justify-center rounded-full transition-all ${viewMode === 'SHIFTS' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/40 scale-105' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                        data-v12-tooltip="VISTA PROGRAMACIÓN (AGENDA)"
                                    >
                                        <Calendar size={20} strokeWidth={2.5} />
                                    </button>
                                    <button 
                                        onClick={() => setViewMode('ATTENDANCE')}
                                        className={`w-12 h-12 flex items-center justify-center rounded-full transition-all ${viewMode === 'ATTENDANCE' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/40 scale-105' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                        data-v12-tooltip="VISTA BIOMETRÍA (RELOJ)"
                                    >
                                        <Clock size={20} strokeWidth={2.5} />
                                    </button>
                                </div>

                                <div className="w-[1px] h-8 bg-slate-100 dark:bg-slate-800 hidden xl:block"></div>

                                <button className="flex items-center gap-3 px-6 h-[56px] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-[30px] transition-all active:scale-95 hover:bg-white dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-100 dark:hover:border-indigo-900 group"
                                        data-v12-tooltip="Carga Inteligente de Turnos Proyectados">
                                    <Sparkles size={18} strokeWidth={2.5} className="group-hover:rotate-12 transition-transform" />
                                    <span className="hidden xl:inline text-[10px] font-black uppercase tracking-widest">Carga</span>
                                </button>

                                <div className="hidden xl:flex items-center">
                                    <HelpIcon text="Comando Central V12: Configure filtros, navegue por semanas y use acciones masivas para optimizar tiempos operativos." />
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Fila Opcional: Contador Flotante Minimalista */}
                    <div className="flex justify-end pr-8 -mt-4 mb-4">
                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-100/50 dark:bg-slate-800/30 backdrop-blur-md rounded-full border border-slate-200/50 dark:border-slate-700/50">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                            <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">
                                {employees.length} Colaboradores Activos en esta Sede
                            </span>
                        </div>
                        </div>
                    </div>

                    {lastSaveComment && (
                        <div className="no-print flex items-center gap-4 p-5 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/50 rounded-3xl animate-in slide-in-from-top-2 duration-500">
                            <div className="flex-shrink-0 w-10 h-10 bg-white dark:bg-indigo-950 rounded-2xl flex items-center justify-center shadow-sm">
                                <FileText size={18} className="text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-black uppercase text-indigo-500 tracking-widest mb-0.5">Observaciones vigentes de la programación:</p>
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate">{lastSaveComment}</p>
                            </div>
                            <div className="flex-shrink-0">
                                <div className="text-[10px] font-black px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full uppercase tracking-tighter">
                                    Sincronizado con Reporte PDF
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Fila 2: Command Center Ultra-Visibilidad V12 (Espaciado e Impacto) */}
                    <div className="no-print w-full flex flex-col xl:flex-row items-center justify-between gap-16 bg-white dark:bg-slate-900 shadow-xl p-8 border-[1px] border-slate-200 dark:border-slate-800" style={{ borderRadius: '48px' }}>
                        {/* Izquierda: Toolkit de Operaciones (Ultra-Espaciado) */}
                        <div className="flex flex-wrap items-center justify-center lg:justify-start p-8 bg-slate-50/50 dark:bg-slate-800/20 border-[1px] border-slate-200 dark:border-slate-700/50" 
                             style={{ borderRadius: '24px', gap: '2rem' }}>
                            {[
                                { type: 'Turno', color: 'bg-indigo-600', icon: Clock, label: 'TURNO', tip: 'Turno de Trabajo (Arrastrar al grid)' },
                                { type: 'Descanso', color: 'bg-amber-500', icon: Calendar, label: 'DESC', tip: 'Descanso (Arrastrar al grid)' },
                                { type: 'Turno Fuera', color: 'bg-purple-600', icon: AlertCircle, label: 'FUERA', tip: 'Turno Fuera de Sede (Arrastrar al grid)' }
                            ].map((tool, idx) => (
                                <div key={idx} draggable onDragStart={(e) => handleDragStart(e, 'PANEL', { type: tool.type })} 
                                    className={`flex-shrink-0 ${tool.color} text-white flex flex-col items-center justify-center cursor-grab shadow-sm hover:scale-105 active:scale-95 transition-all group relative`}
                                    style={{ width: '96px', height: '64px', borderRadius: '16px' }}
                                    data-v12-tooltip={tool.tip}
                                >
                                    <tool.icon size={22} strokeWidth={2.5} className="mb-1" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-center">
                                        {tool.label}
                                    </span>
                                </div>
                            ))}
                            <div className="hidden 2xl:block w-[1px] h-10 bg-slate-200 dark:bg-slate-700 flex-shrink-0"></div>
                            <div onDragOver={(e) => e.preventDefault()} onDrop={handleDropOnTrash} 
                                className="flex-shrink-0 bg-rose-50 dark:bg-rose-900/10 text-rose-500 flex flex-col items-center justify-center gap-1 border-2 border-dashed border-rose-200 dark:border-rose-900/40 hover:bg-rose-600 hover:text-white hover:border-solid transition-all cursor-pointer group relative"
                                style={{ width: '120px', height: '64px', borderRadius: '16px', marginLeft: '0.5rem' }}
                                data-v12-tooltip="Arrastra un turno aquí para eliminarlo"
                            >
                                <Trash2 size={22} strokeWidth={2.5} />
                                <span className="text-[8px] font-black uppercase tracking-widest text-center">BORRAR</span>
                            </div>
                        </div>

                        {/* Derecha: Acciones Globales (Ultra-Visibility & Gap-16) */}
                        <div className="no-print flex flex-wrap items-center justify-center lg:justify-end p-8 bg-slate-50/50 dark:bg-slate-800/20 border-[1px] border-slate-200 dark:border-slate-700/50" 
                             style={{ borderRadius: '24px', gap: '2rem' }}>
                            <button 
                                onClick={exportToExcel} 
                                disabled={isExporting}
                                className={`flex-shrink-0 bg-emerald-600 text-white flex flex-col items-center justify-center gap-1 hover:bg-emerald-700 transition-all group shadow-md ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`} 
                                style={{ width: '96px', height: '64px', borderRadius: '16px' }} 
                                data-v12-tooltip="Exportar programación a Excel .xlsx"
                            >
                                <FileSpreadsheet size={22} className="group-hover:scale-110 transition-transform" />
                                <span className="text-[9px] font-black uppercase tracking-widest">EXCEL</span>
                            </button>
                            <button 
                                onClick={exportToPDF} 
                                disabled={isExporting}
                                className={`flex-shrink-0 flex flex-col items-center justify-center gap-1 hover:brightness-110 transition-all group shadow-md ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`} 
                                style={{ width: '96px', height: '64px', borderRadius: '16px', backgroundColor: '#dc2626', color: 'white' }} 
                                data-v12-tooltip="Generar reporte PDF para impresión"
                            >
                                <FileDown size={22} className="group-hover:scale-110 transition-transform" />
                                <span className="text-[9px] font-black uppercase tracking-widest">PDF</span>
                            </button>
                            <button onClick={copyFromPreviousWeek} className="flex-shrink-0 bg-indigo-600 text-white flex flex-col items-center justify-center gap-1 hover:bg-indigo-700 transition-all group shadow-md" style={{ width: '96px', height: '64px', borderRadius: '16px' }} data-v12-tooltip="Copiar toda la programación de la semana anterior">
                                <CopyIcon size={22} className="group-hover:scale-110 transition-transform" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-center">CLONAR</span>
                            </button>
                            <button onClick={handleSave} disabled={isExporting} className={`flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white flex flex-col items-center justify-center gap-1 shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.05] active:scale-95 group ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`} style={{ width: '96px', height: '64px', borderRadius: '16px' }} data-v12-tooltip="Guardar todos los cambios en el servidor">
                                {isSaving ? <div className="loader !w-5 !h-5 !border-white"></div> : <><Save size={22} /><span className="text-[9px] font-black uppercase">GUARDAR</span></>}
                            </button>
                        </div>
                    </div>
                
                {/* 3. Grid V12 Elite Classic */}
                <div className="card shadow-[0_40px_100px_rgba(0,0,0,0.12)] bg-white dark:bg-slate-900 border-2 dark:border-slate-800" style={{ borderRadius: '48px', overflow: 'hidden' }}>
                    {loading ? (
                        <div className="py-48 text-center text-slate-400">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-8"></div>
                            <p className="font-black text-[12px] uppercase tracking-[0.4em] animate-pulse">Sincronizando Nómina V12...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-800 border-b-2 dark:border-indigo-500/20">
                                        <th className="p-8 text-left sticky left-0 z-10 border-r dark:border-slate-800" 
                                            style={{ backgroundColor: isDarkMode ? '#060914' : '#f8fafc', width: '320px' }}>
                                            <div className="flex items-center gap-4">
                                                <button 
                                                    onClick={handleSelectAll}
                                                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors"
                                                >
                                                    {selectedEmployees.length === filteredEmployees.length && filteredEmployees.length > 0 ? (
                                                        <CheckSquare size={18} className="text-indigo-500" />
                                                    ) : (
                                                        <Square size={18} className="text-slate-400" />
                                                    )}
                                                </button>
                                                <span className="text-[11px] font-[1000] uppercase tracking-[0.2em]"
                                                      style={{ color: isDarkMode ? '#cbd5e1' : '#64748b' }}>
                                                    Colaborador / Jornada
                                                </span>
                                            </div>
                                        </th>
                                        {days.map((day, i) => (
                                            <th key={i} className="p-4 text-center border-r dark:border-slate-700 min-w-[140px]">
                                                <p className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-[0.2em] mb-1">{day.toLocaleDateString('es-CO', { weekday: 'short' })}</p>
                                                <p className="text-2xl font-[950] text-slate-800 dark:text-white leading-none tracking-tighter">{day.getDate()}</p>
                                            </th>
                                        ))}
                                        <th className="p-4 text-center bg-slate-100/30 dark:bg-slate-800/40 w-[160px] min-w-[160px] font-[950] text-[11px] uppercase text-slate-400 dark:text-indigo-300 tracking-[0.2em] border-l dark:border-slate-700">Hrs</th>
                                    </tr>
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
                                        const isSelected = selectedEmployees.includes(emp.id);
                                        return (
                                            <tr key={emp.id} className="border-b dark:border-slate-800 transition-colors group">
                                                <td className="sticky left-0 z-10 p-6 pl-10 border-r dark:border-slate-800 shadow-[10px_0_20px_rgba(0,0,0,0.03)]"
                                                    style={{ backgroundColor: isDarkMode ? '#060914' : '#ffffff' }}>
                                                    <div className="flex items-center gap-4">
                                                        <button 
                                                            onClick={() => handleSelectEmployee(emp.id)}
                                                            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors"
                                                        >
                                                            {isSelected ? (
                                                                <CheckSquare size={18} className="text-indigo-500" />
                                                            ) : (
                                                                <Square size={18} className="text-slate-400" />
                                                            )}
                                                        </button>
                                                        <div className={`w-12 h-12 ${isSelected ? 'bg-indigo-600' : 'bg-slate-400'} rounded-2xl flex items-center justify-center font-black text-white text-sm shadow-lg shadow-indigo-100 dark:shadow-none translate-y-[-2px] transition-colors`}>
                                                            {emp.firstName[0]}{emp.lastName[0]}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[15px] font-[950] text-slate-800 dark:text-white leading-tight mb-1">{emp.firstName} {emp.lastName}</span>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">{emp.documento}</span>
                                                                <span className="text-[10px] text-slate-300 dark:text-slate-700 font-black">|</span>
                                                                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-black text-[10px] uppercase">
                                                                    <Clock size={12} strokeWidth={3} />
                                                                    {jornadas.find(j => j.id === emp.jornadaId)?.horasSemanales || 48}h
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                {days.map((day, di) => {
                                                    const dayShifts = shifts.filter(s => s.employeeId === emp.id && new Date(s.startTime).toDateString() === day.toDateString());
                                                    const nov = getNovedad(emp.id, day);
                                                    const isLockedDay = new Date(day) < new Date(new Date().setHours(0,0,0,0));

                                                    return (
                                                        <td
                                                            key={di}
                                                            onDragOver={e => e.preventDefault()}
                                                            onDrop={e => handleDropOnGrid(e, emp.id, day)}
                                                            className="p-1 border-r dark:border-slate-800"
                                                        >
                                                            <div className="flex flex-col gap-1 min-h-[96px] justify-center">
                                                                {nov && (
                                                                    <div onClick={() => { setSelectedNov({ ...nov, empName: `${emp.firstName} ${emp.lastName}` }); setShowNovModal(true); }}
                                                                         className="rounded-2xl h-12 flex flex-col items-center justify-center cursor-pointer hover:shadow-md transition-all border-2 border-blue-200 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-800 shrink-0">
                                                                        <span className="text-[8px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-1 leading-none">NOVEDAD</span>
                                                                        <div className="h-4 w-4 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center text-blue-500">
                                                                            <Info size={10} strokeWidth={3} />
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {dayShifts.map((shift, si) => {
                                                                    const att = attendances.find(a => String(a.shiftId) === String(shift.id) && shift.id);
                                                                    let bgColor = '#4f46e5';
                                                                    
                                                                    if (att) {
                                                                        if (att.status === 0) bgColor = '#10b981';
                                                                        else if (att.status === 1) bgColor = '#f59e0b';
                                                                        else if (att.status === 3) bgColor = '#ef4444';
                                                                        else bgColor = '#f97316';
                                                                    } else if (!shift.isDescanso && !shift.isFuera && new Date(shift.startTime) < new Date()) {
                                                                        bgColor = '#ef4444';
                                                                    }

                                                                    if (shift.isDescanso) bgColor = '#94a3b8';
                                                                    if (shift.isFuera) bgColor = '#8b5cf6';

                                                                    const shiftTime = `${new Date(shift.startTime).getHours().toString().padStart(2, '0')}:${new Date(shift.startTime).getMinutes().toString().padStart(2, '0')}-${new Date(shift.endTime).getHours().toString().padStart(2, '0')}:${new Date(shift.endTime).getMinutes().toString().padStart(2, '0')}`;
                                                                    const attTime = att ? `${new Date(att.clockIn).getHours().toString().padStart(2, '0')}:${new Date(att.clockIn).getMinutes().toString().padStart(2, '0')}—${att.clockOut ? new Date(att.clockOut).getHours().toString().padStart(2, '0') + ':' + new Date(att.clockOut).getMinutes().toString().padStart(2, '0') : '...'}` : 'S/MARCAR';
                                                                    const displayText = viewMode === 'SHIFTS' ? (shift.isDescanso ? 'REST' : shiftTime) : (shift.isDescanso ? 'REST' : attTime);
                                                                    const isLocked = !!att || isLockedDay;
                                                                     
                                                                     return (
                                                                         <div key={si} 
                                                                              draggable={!isLocked} 
                                                                              onDragStart={e => {
                                                                                  if (isLocked) { e.preventDefault(); return; }
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
                                                                                 setHoveredShiftData({ ...shift, att, shiftTime, attTime, isLocked });
                                                                                 setHoverPos({ x: rect.left + rect.width / 2, y: rect.top });
                                                                              }}
                                                                              onMouseLeave={() => setHoveredShiftData(null)}
                                                                              className={`group rounded-xl p-1.5 flex flex-col items-center justify-center text-white shadow-md transition-all relative ${isLocked ? (att ? 'cursor-help hover:ring-2 ring-white/50 scale-105' : 'cursor-default opacity-[0.9]') : 'cursor-grab active:cursor-grabbing hover:scale-[1.05] hover:z-50'}`}
                                                                              style={{ background: bgColor, minWidth: '85px', minHeight: '42px', filter: isLocked ? 'contrast(0.9) saturate(0.8)' : 'none' }}
                                                                         >
                                                                             <div className="flex items-center gap-2 mb-0.5">
                                                                                 {isLocked && <Lock size={11} className="text-white opacity-70" />}
                                                                                 {att && <Activity size={12} className="text-white opacity-100 animate-pulse" />}
                                                                                 <span className="text-[7px] font-black uppercase tracking-[0.1em] opacity-80 leading-none">
                                                                                    {viewMode === 'SHIFTS' ? (shift.isDescanso ? 'DESC' : shift.isFuera ? 'FUERA' : 'TURNO') : 'MARCACIÓN'}
                                                                                 </span>
                                                                             </div>
                                                                             <span className={`text-[8px] font-[1000] tracking-tighter whitespace-nowrap mt-0.5 ${viewMode === 'ATTENDANCE' && !att ? 'opacity-40 animate-pulse' : ''}`}>
                                                                                 {displayText}
                                                                             </span>
                                                                             
                                                                             {att && (
                                                                                 <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-slate-800 ${att.status === 0 ? 'bg-emerald-400' : 'bg-rose-400'} flex items-center justify-center shadow-md animate-bounce`}>
                                                                                     {att.status === 0 ? <CheckCircle size={8} /> : <AlertCircle size={8} />}
                                                                                 </div>
                                                                             )}
                                                                         </div>
                                                                     );
                                                                 })}
                                                                {!nov && dayShifts.length === 0 && (
                                                                    <div onClick={() => {
                                                                                 if (isLockedDay) {
                                                                                     showToast("Turno bloqueado: Dato histórico", "info");
                                                                                     return;
                                                                                 }
                                                                                 setPendingEvent({ employeeId: emp.id, date: day, type: 'Turno', existingShift: null });
                                                                                 setStartTime('08:00');
                                                                                 setEndTime('17:00');
                                                                                 setShowTimeModal(true);
                                                                             }} 
                                                                             className={`h-12 border-2 border-dashed rounded-2xl flex items-center justify-center transition-all ${isLockedDay ? 'border-slate-100 dark:border-slate-800 cursor-not-allowed opacity-[0.4]' : 'border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 cursor-pointer group'}`}
                                                                    >
                                                                        <Plus size={16} className={`${isLockedDay ? 'text-slate-300' : 'text-slate-400 group-hover:text-indigo-500 group-hover:scale-125'} transition-all`} />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                                <td className="p-4 text-center bg-slate-50/50 dark:bg-slate-900/50 border-l dark:border-slate-800">
                                                    <strong className="text-[14px] font-[950] block" style={{ color: isDarkMode ? '#ffffff' : '#1e293b' }}>
                                                        {formatHours(total)}
                                                    </strong>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Justificación de la semana (Print) */}
                {(saveComment || lastSaveComment) && (
                    <div className="print-only print-comment-box mt-10 p-6 bg-slate-50 border-2 border-slate-200 rounded-3xl">
                        <p className="text-[10px] font-black uppercase text-indigo-600 mb-2 tracking-widest">Observaciones de la programación:</p>
                        <p className="text-[13px] font-bold text-slate-800 leading-relaxed italic">
                            "{saveComment || lastSaveComment}"
                        </p>
                    </div>
                )}

                {/* Print Footer */}
                <div className="print-only mt-12 grid grid-cols-2 gap-16 border-t-2 border-slate-900 pt-8">
                    <div className="text-center"><p className="text-xs font-black uppercase">Firma Jefe de Sede</p></div>
                    <div className="text-center"><p className="text-xs font-black uppercase">Firma Talento Humano</p></div>
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
                                                                                 if (isLocked) {
                                                                                     showToast("Turno bloqueado: Ya procesado o histórico", "info");
                                                                                     return;
                                                                                 }
                                                                                 
                                                                                 if (isLocked) {
                                                                                     showToast("Turno bloqueado: Ya procesado o histórico", "info");
                                                                                     return;
                                                                                 }
                                                                                 
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
                                                                                 if (isLocked) {
                                                                                     showToast("Turno bloqueado: Ya procesado o histórico", "info");
                                                                                     return;
                                                                                 }
                                                                                 
                                                                                 if (isLocked) {
                                                                                     showToast("Turno bloqueado: Ya procesado o histórico", "info");
                                                                                     return;
                                                                                 }
                                                                                 
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
                                border: `1px solid ${isDarkMode ? '#334155' : '#f1f5f9'}`,
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
                                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Estado Elite V12</span>
                                        <span className={`text-[11px] font-[1000] tracking-tight ${hoveredShiftData.att ? (hoveredShiftData.att.status === 0 ? 'text-emerald-500' : 'text-amber-500') : 'text-slate-500'}`}>
                                            {hoveredShiftData.att ? `ASISTENCIA ${hoveredShiftData.att.status === 0 ? 'CORRECTA' : 'CON NOVEDAD'}` : (hoveredShiftData.isDescanso ? 'DESCANSO' : 'PENDIENTE')}
                                        </span>
                                    </div>
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${hoveredShiftData.att ? (hoveredShiftData.att.status === 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500') : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                        {hoveredShiftData.att ? (hoveredShiftData.att.status === 0 ? <CheckCircle size={16} /> : <AlertCircle size={16} />) : <Clock size={16} />}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <Calendar size={14} className="text-indigo-500" />
                                        <div className="flex flex-col text-left">
                                            <span className="text-[7px] font-black uppercase text-slate-400">Turno Plan</span>
                                            <span className="text-[12px] font-bold tracking-tight">{hoveredShiftData.shiftTime}</span>
                                        </div>
                                    </div>

                                    {!hoveredShiftData.isDescanso && (
                                        <div className="flex items-center justify-between gap-4 p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/5">
                                            <div className="flex flex-col text-left">
                                                <div className="flex items-center gap-1.5 mb-0.5">
                                                    <LogIn size={11} className="text-emerald-500" />
                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Entry</span>
                                                </div>
                                                <span className="text-[12px] font-[1000]">
                                                    {hoveredShiftData.att ? new Date(hoveredShiftData.att.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : '--:--'}
                                                </span>
                                            </div>
                                            <div className="w-[1px] h-6 bg-slate-200 dark:bg-white/10"></div>
                                            <div className="flex flex-col text-left">
                                                <div className="flex items-center gap-1.5 mb-0.5">
                                                    <LogOut size={11} className="text-rose-500" />
                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Exit</span>
                                                </div>
                                                <span className="text-[12px] font-[1000]">
                                                    {hoveredShiftData.att && hoveredShiftData.att.clockOut ? new Date(hoveredShiftData.att.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : (hoveredShiftData.att ? 'ACTIVE' : '--:--')}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                {/* TRIANGULO (ARROW) */}
                                <div 
                                    className={`absolute left-1/2 -translate-x-1/2 w-4 h-4 ${isDarkMode ? 'bg-[#1e293b]' : 'bg-white'} rotate-45 border ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}
                                    style={{ 
                                        bottom: hoverPos.y < 350 ? 'auto' : '-8px',
                                        top: hoverPos.y < 350 ? '-8px' : 'auto',
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
                document.getElementById('modal-root') || document.body
            )}
            {isExporting && (
                <div className="fixed inset-0 z-[999999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[3.5rem] shadow-2xl border border-white/10 flex flex-col items-center max-w-md w-full text-center animate-in zoom-in-95 duration-300">
                        <div className="relative mb-8">
                            <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20 animate-pulse"></div>
                            <div className="w-20 h-20 border-4 border-slate-100 dark:border-slate-800 border-t-indigo-600 rounded-full animate-spin relative z-10"></div>
                        </div>
                        <h3 className="text-xl font-[950] text-slate-800 dark:text-white mb-2 uppercase tracking-tight">Generando Reporte Elite</h3>
                        <p className="text-sm font-bold text-slate-400 leading-relaxed px-4">Optimizando calidad HD y preparando datos seguros. Esto puede tardar unos segundos...</p>
                    </div>
                </div>
            )}
        </>
    );
};

export default ShiftScheduler;
