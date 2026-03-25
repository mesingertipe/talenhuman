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
    Save,
    Download,
    Trash2,
    Plus,
    CheckCircle,
    AlertCircle,
    User,
    Users as UsersIcon,
    Store,
    Info,
    FileDown,
    FileSpreadsheet,
    Copy as CopyIcon,
    ArrowRight
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const ShiftScheduler = ({ user }) => {
    const { isDarkMode } = useTheme();
    const [employees, setEmployees] = useState([]);
    const [shifts, setShifts] = useState([]);
    const [news, setNews] = useState([]);
    const [stores, setStores] = useState([]);
    const [selectedStore, setSelectedStore] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
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
    const [lastSaveComment, setLastSaveComment] = useState('');

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
            let filteredStores = res.data;

            if (isManager && user?.storeId) {
                filteredStores = res.data.filter(s => s.id === user.storeId);
                setStores(filteredStores);
                setSelectedStore(user.storeId);
            } else if (isSupervisor && user?.storeIds && user.storeIds.length > 0) {
                filteredStores = res.data.filter(s => user.storeIds.includes(s.id));
                setStores(filteredStores);
                if (filteredStores.length > 0) setSelectedStore(filteredStores[0].id);
            } else {
                setStores(res.data);
                if (res.data.length > 0) setSelectedStore(res.data[0].id);
            }
        });

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

            const [empRes, shiftRes, newsRes, jornadaRes] = await Promise.all([
                api.get(`/employees?storeId=${selectedStore}`),
                api.get(`/shifts?storeId=${selectedStore}&startDate=${startDateStr}&endDate=${endDateStr}`),
                api.get(`/novedades?storeId=${selectedStore}&startDate=${startDateStr}&endDate=${endDateStr}&status=1`),
                api.get('/jornadas')
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
                status: s.status !== undefined ? s.status : s.Status
            }));

            setShifts(normalizedShifts);
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
                const existingIdx = newShifts.findIndex(s => s.employeeId === targetEmployeeId && new Date(s.startTime).toDateString() === targetDate.toDateString());
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
            const existingIdx = newShifts.findIndex(s => s.employeeId === targetEmployeeId && new Date(s.startTime).toDateString() === targetDate.toDateString());
            if (existingIdx >= 0) newShifts[existingIdx] = newShift;
            else newShifts.push(newShift);
            setShifts(newShifts);
            showToast("Turno copiado");
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
        if (!window.html2canvas || !window.jspdf) { showToast("Iniciando motor PDF...", "info"); return; }
        const element = document.getElementById('printable-area');
        const storeName = stores.find(s => s.id === selectedStore)?.name || 'Sede';
        const fileName = `Turnos_${storeName}_${currentWeekStart.toISOString().split('T')[0]}.pdf`;
        const style = document.createElement('style');
        style.innerHTML = `
            #printable-area .print-only { display: block !important; }
            #printable-area .no-print { display: none !important; }
            #printable-area { background: #fff !important; padding: 30px !important; width: 1400px !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            #printable-area table { border-collapse: collapse !important; width: 100% !important; }
            #printable-area th, #printable-area td { border: 1px solid #cbd5e1 !important; padding: 6px !important; font-size: 8.5pt !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .grid-event-turno { background-color: #4f46e5 !important; color: #ffffff !important; -webkit-print-color-adjust: exact !important; font-weight: 800 !important; }
            .grid-event-descanso { background-color: #f59e0b !important; color: #ffffff !important; -webkit-print-color-adjust: exact !important; font-weight: 800 !important; }
            .grid-event-fuera { background-color: #9333ea !important; color: #ffffff !important; -webkit-print-color-adjust: exact !important; font-weight: 800 !important; }
            .print-comment-box { border: 1px solid #000 !important; padding: 10px !important; margin-top: 20px !important; background: #f8fafc !important; }
        `;
        document.head.appendChild(style);
        window.html2canvas(element, {
            scale: 3,
            useCORS: true,
            backgroundColor: '#ffffff',
            logging: false,
            allowTaint: true,
            windowWidth: 1400,
            onclone: (clonedDoc) => {
                const ce = clonedDoc.getElementById('printable-area');
                ce.style.width = '1400px';
                ce.style.padding = '40px';
                ce.style.background = '#ffffff';
                // Force visibility of print-only elements in the clone
                const po = ce.querySelectorAll('.print-only');
                po.forEach(el => el.style.display = 'block !important');
            }
        }).then(canvas => {
            const imgData = canvas.toDataURL('image/png', 0.95);
            const jsPDF = window.jspdf?.jsPDF || window.jspdf;
            // PDF en puntos para mayor precisión
            const pdf = new jsPDF('l', 'pt', [canvas.width, canvas.height]);
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save(fileName);
            document.head.removeChild(style);
        });
    };

    const exportToExcel = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Programación');
        const storeName = (stores.find(s => s.id === selectedStore)?.name || 'Sede').toUpperCase();
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

        // 1. Título Principal
        worksheet.mergeCells('A1:J1');
        const titleRow = worksheet.getRow(1);
        titleRow.getCell(1).value = 'PROGRAMACION DE LA SEMANA';
        titleRow.getCell(1).font = { name: 'Segoe UI', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
        titleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
        titleRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
        titleRow.height = 40;

        // 2. Metadatos (Sede y Periodo)
        worksheet.addRow([]); // Espacio

        const sedeRow = worksheet.addRow([`SEDE: ${storeName}`]);
        worksheet.mergeCells(`A3:J3`);
        sedeRow.getCell(1).font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF475569' } };
        sedeRow.getCell(1).alignment = { horizontal: 'center' };

        const periodRow = worksheet.addRow([`PERIODO: ${dateRange}`]);
        worksheet.mergeCells(`A4:J4`);
        periodRow.getCell(1).font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF475569' } };
        periodRow.getCell(1).alignment = { horizontal: 'center' };

        worksheet.addRow([]); // Espacio

        // 3. Encabezados de Tabla
        const headerRow = worksheet.addRow(['ID/CÉDULA', 'COLABORADOR', ...days.map(d => d.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric' }).toUpperCase()), 'TOTAL HRS']);
        headerRow.eachCell((cell) => {
            cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.border = { top: { style: 'thin', color: { argb: 'FFFFFFFF' } }, left: { style: 'thin', color: { argb: 'FFFFFFFF' } }, bottom: { style: 'thin', color: { argb: 'FFFFFFFF' } }, right: { style: 'thin', color: { argb: 'FFFFFFFF' } } };
        });
        headerRow.height = 25;

        // 4. Datos de Empleados
        const getShiftHours = (s) => {
            if (!s || s.isDescanso) return 0;
            const start = new Date(s.startTime);
            const end = new Date(s.endTime);
            let diff = (end - start) / (1000 * 60 * 60);
            if (diff < 0) diff += 24; 
            return diff;
        };

        employees.forEach((emp, idx) => {
            const empShifts = shifts.filter(s => s.employeeId === emp.id);
            const totalHours = empShifts.reduce((acc, s) => acc + getShiftHours(s), 0);
            
            const rowValues = [
                emp.documento || '---',
                `${emp.firstName} ${emp.lastName}`.toUpperCase()
            ];

            days.forEach(day => {
                const shift = empShifts.find(s => new Date(s.startTime).toDateString() === day.toDateString());
                if (shift) {
                    if (shift.isDescanso) rowValues.push("DESCANSO");
                    else if (shift.isFuera) rowValues.push("FUERA");
                    else {
                        const sTime = new Date(shift.startTime);
                        const eTime = new Date(shift.endTime);
                        rowValues.push(`${sTime.getHours().toString().padStart(2, '0')}:${sTime.getMinutes().toString().padStart(2, '0')} - ${eTime.getHours().toString().padStart(2, '0')}:${eTime.getMinutes().toString().padStart(2, '0')}`);
                    }
                } else {
                    rowValues.push("—");
                }
            });

            rowValues.push(formatHours(totalHours));
            
            const dataRow = worksheet.addRow(rowValues);
            
            // Zebra striping y bordes
            const isEven = idx % 2 === 0;
            dataRow.eachCell((cell, colNumber) => {
                cell.font = { name: 'Segoe UI', size: 8, bold: colNumber === 2 };
                cell.alignment = { vertical: 'middle', horizontal: colNumber === 2 ? 'left' : 'center' };
                cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                if (!isEven) {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
                }
                // Highlight total
                if (colNumber === days.length + 3) {
                    cell.font = { bold: true, color: { argb: 'FF4F46E5' } };
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
                }
            });
            dataRow.height = 22;
        });

        // 5. Sección de Firmas
        worksheet.addRow([]);
        worksheet.addRow([]);
        const signRow = worksheet.addRow(['', '_______________________', '', '', '', '', '', '', '_______________________']);
        const signTextRow = worksheet.addRow(['', 'FIRMA JEFE DE SEDE', '', '', '', '', '', '', 'FIRMA TALENTO HUMANO']);
        
        signTextRow.eachCell((cell) => {
            cell.font = { name: 'Segoe UI', size: 9, bold: true };
            cell.alignment = { horizontal: 'center' };
        });

        // Generar Archivo
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Programacion_${storeName}_${new Date().getTime()}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
        showToast("Excel .xlsx corporativo generado");
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
                            <p className="text-slate-500 font-bold mt-1">Elite V12 - Gestión de Capital Humano</p>
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
                <div className="no-print flex flex-col gap-6 mb-10">
                    {/* Fila 1: Selectores y Navegación (Legacy Elite V12) */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center bg-white dark:bg-slate-800 border-2 dark:border-slate-700 h-[56px] shadow-lg rounded-2xl overflow-hidden p-1">
                            <div className="flex items-center px-6 gap-3 border-r dark:border-slate-700 h-full hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                <Store size={18} className="text-indigo-500" />
                                <select
                                    value={selectedStore}
                                    onChange={(e) => setSelectedStore(e.target.value)}
                                    className="bg-transparent border-none font-black text-[12px] uppercase focus:ring-0 min-w-[200px] cursor-pointer text-slate-800 dark:text-slate-100"
                                >
                                    {stores.map(s => <option key={s.id} value={s.id} className="dark:bg-slate-800">{s.name}</option>)}
                                </select>
                            </div>
                            <div className="flex items-center px-2 min-w-[280px] h-full">
                                <button onClick={() => setWeekOffset(prev => prev - 1)} className="p-2 text-slate-400 hover:text-indigo-500 transition-all active:scale-90"><ChevronLeft size={20} strokeWidth={3} /></button>
                                <span className="text-[11px] font-[950] uppercase tracking-widest text-slate-700 dark:text-slate-200 text-center flex-1 whitespace-nowrap px-4">
                                    {currentWeekStart.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })} — {new Date(new Date(currentWeekStart).getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                                </span>
                                <button onClick={() => setWeekOffset(prev => prev + 1)} className="p-2 text-slate-400 hover:text-indigo-500 transition-all active:scale-90"><ChevronRight size={20} strokeWidth={3} /></button>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="px-5 py-2.5 bg-slate-100/50 dark:bg-slate-800/50 rounded-xl border dark:border-slate-700 flex items-center gap-3">
                                <UsersIcon size={14} className="text-indigo-500" />
                                <span className="text-[10px] font-[950] text-slate-600 dark:text-slate-400 uppercase tracking-widest">{employees.length} Colaboradores Activos</span>
                            </div>
                        </div>
                    {/* Fila 2: Command Center Ultra-Visibilidad V12 (Espaciado e Impacto) */}
                    <div className="w-full flex flex-col xl:flex-row items-center justify-between gap-16 bg-white dark:bg-slate-900 shadow-xl p-8 border-[1px] border-slate-200 dark:border-slate-800 mb-32" style={{ borderRadius: '48px' }}>
                        {/* Izquierda: Toolkit de Operaciones (Ultra-Espaciado) */}
                        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-16 p-4 bg-slate-50/50 dark:bg-slate-800/20 border-[1px] border-slate-200 dark:border-slate-700/50" style={{ borderRadius: '24px' }}>
                            {[
                                { type: 'Turno', color: 'bg-indigo-600', icon: Clock, label: 'TURNO' },
                                { type: 'Descanso', color: 'bg-amber-500', icon: Calendar, label: 'DESC' },
                                { type: 'Turno Fuera', color: 'bg-purple-600', icon: AlertCircle, label: 'FUERA' }
                            ].map((tool, idx) => (
                                <div key={idx} draggable onDragStart={(e) => handleDragStart(e, 'PANEL', { type: tool.type })} 
                                    className={`flex-shrink-0 ${tool.color} text-white flex flex-col items-center justify-center cursor-grab shadow-sm hover:scale-105 active:scale-95 transition-all group relative`}
                                    style={{ width: '96px', height: '64px', borderRadius: '16px' }}
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
                                style={{ width: '120px', height: '64px', borderRadius: '16px' }}
                            >
                                <Trash2 size={22} strokeWidth={2.5} />
                                <span className="text-[8px] font-black uppercase tracking-widest text-center">BORRAR</span>
                            </div>
                        </div>

                        {/* Derecha: Acciones Globales (Ultra-Visibility & Gap-16) */}
                        <div className="flex flex-wrap items-center justify-center lg:justify-end gap-16 p-4 bg-slate-50/50 dark:bg-slate-800/20 border-[1px] border-slate-200 dark:border-slate-700/50" style={{ borderRadius: '24px' }}>
                            <button onClick={exportToExcel} className="flex-shrink-0 bg-emerald-600 text-white flex flex-col items-center justify-center gap-1 hover:bg-emerald-700 transition-all group shadow-md" style={{ width: '96px', height: '64px', borderRadius: '16px' }}>
                                <FileSpreadsheet size={22} className="group-hover:scale-110 transition-transform" />
                                <span className="text-[9px] font-black uppercase tracking-widest">EXCEL</span>
                            </button>
                            <button onClick={exportToPDF} className="flex-shrink-0 flex flex-col items-center justify-center gap-1 hover:brightness-110 transition-all group shadow-md" style={{ width: '96px', height: '64px', borderRadius: '16px', backgroundColor: '#dc2626', color: 'white' }}>
                                <FileDown size={22} className="group-hover:scale-110 transition-transform" />
                                <span className="text-[9px] font-black uppercase tracking-widest">PDF</span>
                            </button>
                            <button onClick={copyFromPreviousWeek} className="flex-shrink-0 bg-indigo-600 text-white flex flex-col items-center justify-center gap-1 hover:bg-indigo-700 transition-all group shadow-md" style={{ width: '96px', height: '64px', borderRadius: '16px' }}>
                                <CopyIcon size={22} className="group-hover:scale-110 transition-transform" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-center">CLONAR</span>
                            </button>
                            <button onClick={handleSave} className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white flex flex-col items-center justify-center gap-1 shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.05] active:scale-95 group" style={{ width: '96px', height: '64px', borderRadius: '16px' }}>
                                {isSaving ? <div className="loader !w-5 !h-5 !border-white"></div> : <><Save size={22} /><span className="text-[9px] font-black uppercase tracking-widest">GUARDAR</span></>}
                            </button>
                        </div>
                    </div>
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
                                    <tr className="bg-slate-50 dark:bg-slate-800/90 border-b dark:border-slate-700">
                                        <th className="p-8 text-left sticky left-0 z-10 bg-slate-50 dark:bg-slate-800 border-r dark:border-slate-700" style={{ width: '320px' }}>
                                            <span className="text-[11px] font-[950] uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Colaborador (Cédula) / Jornada</span>
                                        </th>
                                        {days.map((day, i) => (
                                            <th key={i} className="p-4 text-center border-r dark:border-slate-700 min-w-[140px]">
                                                <p className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-[0.2em] mb-1">{day.toLocaleDateString('es-CO', { weekday: 'short' })}</p>
                                                <p className="text-2xl font-[950] text-slate-800 dark:text-white leading-none tracking-tighter">{day.getDate()}</p>
                                            </th>
                                        ))}
                                        <th className="p-4 text-center bg-slate-100/30 dark:bg-slate-800/20 w-[160px] min-w-[160px] font-[950] text-[11px] uppercase text-slate-400 tracking-[0.2em] border-l dark:border-slate-700">Hrs</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {employees.map((emp) => {
                                        const total = shifts.filter(s => s.employeeId === emp.id).reduce((acc, s) => {
                                            if (s.isDescanso) return acc;
                                            const start = new Date(s.startTime);
                                            const end = new Date(s.endTime);
                                            let diff = (end - start) / (1000 * 60 * 60);
                                            if (diff < 0) diff += 24; // Corrección cruce medianoche
                                            return acc + diff;
                                        }, 0);
                                        return (
                                            <tr key={emp.id} className="border-b dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors group">
                                                <td className="sticky left-0 z-10 bg-white dark:bg-slate-900 p-6 pl-10 border-r dark:border-slate-800 shadow-[10px_0_20px_rgba(0,0,0,0.03)]">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center font-black text-white text-sm shadow-lg shadow-indigo-100 dark:shadow-none translate-y-[-2px]">
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
                                                    const shift = shifts.find(s => s.employeeId === emp.id && new Date(s.startTime).toDateString() === day.toDateString());
                                                    const nov = getNovedad(emp.id, day);
                                                    return (
                                                        <td
                                                            key={di}
                                                            onDragOver={e => e.preventDefault()}
                                                            onDrop={e => handleDropOnGrid(e, emp.id, day)}
                                                            onClick={() => {
                                                                if (!nov) {
                                                                    if (shift) {
                                                                        setPendingEvent({ employeeId: emp.id, date: day, type: shift.isDescanso ? 'Descanso' : shift.isFuera ? 'Turno Fuera' : 'Turno' });
                                                                        if (!shift.isDescanso && !shift.isFuera) {
                                                                            const sd = new Date(shift.startTime);
                                                                            const ed = new Date(shift.endTime);
                                                                            setStartTime(`${String(sd.getHours()).padStart(2, '0')}:${String(sd.getMinutes()).padStart(2, '0')}`);
                                                                            setEndTime(`${String(ed.getHours()).padStart(2, '0')}:${String(ed.getMinutes()).padStart(2, '0')}`);
                                                                            setShowTimeModal(true);
                                                                        }
                                                                    } else {
                                                                        setPendingEvent({ employeeId: emp.id, date: day, type: 'Turno' });
                                                                        setStartTime('08:00');
                                                                        setEndTime('17:00');
                                                                        setShowTimeModal(true);
                                                                    }
                                                                } else {
                                                                    setSelectedNov({ ...nov, empName: `${emp.firstName} ${emp.lastName}` });
                                                                    setShowNovModal(true);
                                                                }
                                                            }}
                                                            className="p-1 border-r dark:border-slate-800"
                                                        >
                                                            {nov ? (
                                                                <div className="rounded-2xl h-24 flex flex-col items-center justify-center cursor-pointer hover:shadow-md transition-all group relative border-2 border-blue-200 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-800">
                                                                    <span className="text-[9px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-1 leading-none">NOVEDAD</span>
                                                                    <div className="h-6 w-6 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center text-blue-500">
                                                                        <Info size={14} strokeWidth={3} />
                                                                    </div>
                                                                </div>
                                                            ) : shift ? (
                                                                <div
                                                                    draggable
                                                                    onDragStart={e => handleDragStart(e, 'GRID', { employeeId: emp.id, date: day })}
                                                                    className={`rounded-2xl p-2 h-24 flex flex-col items-center justify-center text-white shadow-lg shadow-black/10 transition-all cursor-grab active:cursor-grabbing hover:scale-[1.02] ${shift.isDescanso ? 'grid-event-descanso' :
                                                                            shift.isFuera ? 'grid-event-fuera' :
                                                                                'grid-event-turno'
                                                                        }`}
                                                                >
                                                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-80 mb-1">
                                                                        {shift.isDescanso ? 'DESC' : shift.isFuera ? 'FUERA' : 'TURNO'}
                                                                    </span>
                                                                    <span className="text-[10px] font-black tracking-tighter whitespace-nowrap">
                                                                        {shift.isDescanso ? '00:00 - 00:00' : `${new Date(shift.startTime).getHours().toString().padStart(2, '0')}:${new Date(shift.startTime).getMinutes().toString().padStart(2, '0')} - ${new Date(shift.endTime).getHours().toString().padStart(2, '0')}:${new Date(shift.endTime).getMinutes().toString().padStart(2, '0')}`}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <div className="h-24 w-full group/cell flex items-center justify-center border-2 border-slate-100 dark:border-slate-800/50 rounded-2xl transition-all hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                                                    <div className="opacity-0 group-hover/cell:opacity-100 h-8 w-8 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 transition-all">
                                                                        <Plus size={16} />
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                                <td className="p-4 text-center bg-slate-50/50 dark:bg-slate-800/40 border-l dark:border-slate-700">
                                                    <div className="inline-flex items-center justify-center px-4 py-2 bg-white dark:bg-slate-800 rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-sm min-w-[100px]">
                                                        <span className="text-[13px] font-black text-slate-800 dark:text-slate-200 whitespace-nowrap">
                                                            {formatHours(total)}
                                                        </span>
                                                    </div>
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
                {lastSaveComment && (
                    <div className="print-only mt-8 bg-slate-50 p-6 rounded-2xl border-2 border-slate-900">
                        <p className="text-[10px] font-black uppercase text-slate-500 mb-2">Observaciones de la programación:</p>
                        <p className="text-sm font-bold text-slate-800 leading-relaxed italic">"{lastSaveComment}"</p>
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
                </>,
                document.getElementById('modal-root') || document.body
            )}
        </>
    );
};

export default ShiftScheduler;
