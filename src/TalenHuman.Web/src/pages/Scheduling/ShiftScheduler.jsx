import React, { useState, useEffect } from 'react';
import { 
    Search, Store, Info, Briefcase, Boxes, X, 
    Calendar, User, Clock, Save, AlertCircle, CheckCircle, ChevronLeft, ChevronRight,
    Printer, Copy, FileSpreadsheet, FileDown, Trash2, Plus, Users as UsersIcon
} from 'lucide-react';
import api from '../../services/api';

const ShiftScheduler = () => {
    const [stores, setStores] = useState([]);
    const [selectedStore, setSelectedStore] = useState('');
    const [employees, setEmployees] = useState([]);
    const [shifts, setShifts] = useState([]);
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [weekOffset, setWeekOffset] = useState(0);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    
    // Modal & Drag States
    const [showTimeModal, setShowTimeModal] = useState(false);
    const [showNovModal, setShowNovModal] = useState(false);
    const [selectedNov, setSelectedNov] = useState(null);
    const [pendingEvent, setPendingEvent] = useState(null); // { employeeId, date, type }
    const [startTime, setStartTime] = useState('08:00');
    const [endTime, setEndTime] = useState('17:00');

    // Colombia Time Helpers
    const getMonday = (offset = 0) => {
        const now = new Date();
        const day = now.getDay() || 7; // Sunday is 7
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
            setStores(res.data);
            if (res.data.length > 0) setSelectedStore(res.data[0].id);
        });

        // Load PDF libraries explicitly for high-fidelity manual export
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
        if (selectedStore) {
            fetchData();
        }
    }, [selectedStore, currentWeekStart]);

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    };

    // Helper for Colombia Local Time (avoiding UTC 'Z' suffix)
    const toLocalISO = (date) => {
        if (!date) return null;
        const d = new Date(date);
        const offset = d.getTimezoneOffset() * 60000;
        return new Date(d - offset).toISOString().slice(0, -1);
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const startDateStr = toLocalISO(currentWeekStart);
            const endDate = new Date(currentWeekStart);
            endDate.setDate(endDate.getDate() + 7);
            const endDateStr = toLocalISO(endDate);

            const [empRes, shiftRes, newsRes] = await Promise.all([
                api.get(`/employees?storeId=${selectedStore}`),
                api.get(`/shifts?storeId=${selectedStore}&startDate=${startDateStr}&endDate=${endDateStr}`),
                api.get(`/novedades?storeId=${selectedStore}&startDate=${startDateStr}&endDate=${endDateStr}&status=1`)
            ]);

            setEmployees(empRes.data.filter(e => e.storeId === selectedStore).map(e => ({
                ...e,
                id: e.id || e.Id,
                documento: e.identificationNumber || e.IdentificationNumber
            })));
            
            // Normalize PascalCase from .NET to camelCase for React
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
        } catch (err) {
            showToast("Error al cargar datos", "error");
        } finally {
            setLoading(false);
        }
    };

    const getDaysOfWeek = () => {
        const days = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(currentWeekStart);
            date.setDate(date.getDate() + i);
            days.push(date);
        }
        return days;
    };

    const days = getDaysOfWeek();

    const handleDragStart = (e, source, data) => {
        e.dataTransfer.setData("source", source);
        e.dataTransfer.setData("payload", JSON.stringify(data));
        e.dataTransfer.effectAllowed = source === 'GRID' ? "copy" : "move";
    };

    const handleDropOnGrid = (e, targetEmployeeId, targetDate) => {
        e.preventDefault();
        const source = e.dataTransfer.getData("source");
        const payload = JSON.parse(e.dataTransfer.getData("payload"));

        if (hasNovedad(targetEmployeeId, targetDate)) {
            showToast("Día bloqueado por novedad aprobada", "error");
            return;
        }

        if (source === 'PANEL') {
            if (payload.type === 'Descanso' || payload.type === 'Turno Fuera') {
                const start = new Date(targetDate);
                start.setHours(0, 0, 0, 0);
                const end = new Date(targetDate);
                end.setHours(0, 0, 0, 0);

                const newShift = {
                    employeeId: targetEmployeeId,
                    startTime: start.toISOString(),
                    endTime: end.toISOString(),
                    status: 0,
                    isDescanso: payload.type === 'Descanso',
                    isFuera: payload.type === 'Turno Fuera'
                };

                const newShifts = [...shifts];
                const existingIdx = newShifts.findIndex(s => 
                    s.employeeId === targetEmployeeId && 
                    new Date(s.startTime).toDateString() === targetDate.toDateString()
                );

                if (existingIdx >= 0) newShifts[existingIdx] = newShift;
                else newShifts.push(newShift);

                setShifts(newShifts);
                showToast(`${payload.type} asignado`);
            } else {
                setPendingEvent({ employeeId: targetEmployeeId, date: targetDate, type: payload.type });
                setStartTime('08:00');
                setEndTime('17:00');
                setShowTimeModal(true);
            }
        } else if (source === 'GRID') {
            const sourceShift = shifts.find(s => 
                s.employeeId === payload.employeeId && 
                new Date(s.startTime).toDateString() === new Date(payload.date).toDateString()
            );

            if (!sourceShift) return;

            const newStart = new Date(targetDate);
            const originalStart = new Date(sourceShift.startTime);
            newStart.setHours(originalStart.getHours(), originalStart.getMinutes(), 0);

            const newEnd = new Date(targetDate);
            const originalEnd = new Date(sourceShift.endTime);
            newEnd.setHours(originalEnd.getHours(), originalEnd.getMinutes(), 0);

            const newShift = {
                employeeId: targetEmployeeId,
                startTime: newStart.toISOString(),
                endTime: newEnd.toISOString(),
                status: 0,
                isDescanso: !!sourceShift.isDescanso,
                isFuera: !!sourceShift.isFuera
            };

            const newShifts = [...shifts];
            const existingIdx = newShifts.findIndex(s => 
                s.employeeId === targetEmployeeId && 
                new Date(s.startTime).toDateString() === targetDate.toDateString()
            );

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
            const newShifts = shifts.filter(s => 
                !(s.employeeId === payload.employeeId && 
                  new Date(s.startTime).toDateString() === new Date(payload.date).toDateString())
            );
            setShifts(newShifts);
            showToast("Evento eliminado", "success");
        }
    };

    const confirmTimeModal = () => {
        const { employeeId, date, type } = pendingEvent;
        
        const start = new Date(date);
        const [sh, sm] = startTime.split(':');
        start.setHours(parseInt(sh), parseInt(sm), 0);

        const end = new Date(date);
        const [eh, em] = endTime.split(':');
        end.setHours(parseInt(eh), parseInt(em), 0);

        const newShift = {
            employeeId,
            startTime: start.toISOString(),
            endTime: end.toISOString(),
            status: 0,
            isDescanso: type === 'Descanso',
            isFuera: type === 'Turno Fuera'
        };

        const newShifts = [...shifts];
        const existingIdx = newShifts.findIndex(s => 
            s.employeeId === employeeId && 
            new Date(s.startTime).toDateString() === date.toDateString()
        );

        if (existingIdx >= 0) newShifts[existingIdx] = newShift;
        else newShifts.push(newShift);

        setShifts(newShifts);
        setShowTimeModal(false);
        setPendingEvent(null);
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            const endDate = new Date(currentWeekStart);
            endDate.setDate(endDate.getDate() + 7);
            
            // Format shifts to Local Time (Colombia)
            const localizedShifts = shifts.map(s => ({
                ...s,
                startTime: toLocalISO(s.startTime),
                endTime: toLocalISO(s.endTime)
            }));

            await api.post('/shifts/bulk', {
                storeId: selectedStore,
                startDate: toLocalISO(currentWeekStart),
                endDate: toLocalISO(endDate),
                shifts: localizedShifts
            });
            showToast("Programación guardada");
        } catch (err) {
            showToast(err.response?.data?.message || "Error al guardar", "error");
        } finally {
            setIsSaving(false);
        }
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

    const copyFromPreviousWeek = async () => {
        try {
            setLoading(true);
            const prevStart = getMonday(weekOffset - 1);
            const prevEnd = new Date(prevStart);
            prevEnd.setDate(prevEnd.getDate() + 7);
            
            const res = await api.get(`/shifts?storeId=${selectedStore}&startDate=${toLocalISO(prevStart)}&endDate=${toLocalISO(prevEnd)}`);
            const prevShifts = res.data;
            
            if (prevShifts.length === 0) {
                showToast("No se encontraron turnos en la semana anterior", "error");
                return;
            }

            const clonedShifts = [...shifts];
            let copiedCount = 0;

            prevShifts.forEach(ps => {
                // Normalize ps (previous shift)
                const s = {
                    ...ps,
                    employeeId: ps.employeeId || ps.EmployeeId,
                    startTime: ps.startTime || ps.StartTime,
                    endTime: ps.endTime || ps.EndTime,
                    isDescanso: ps.isDescanso !== undefined ? ps.isDescanso : ps.IsDescanso,
                    isFuera: ps.isFuera !== undefined ? ps.isFuera : ps.IsFuera
                };

                const shiftDate = new Date(s.startTime);
                const dayIndex = (shiftDate.getDay() || 7) - 1;
                
                const targetDate = new Date(currentWeekStart);
                targetDate.setDate(targetDate.getDate() + dayIndex);
                
                if (!getNovedad(s.employeeId, targetDate)) {
                    const newStart = new Date(targetDate);
                    const oldStart = new Date(s.startTime);
                    newStart.setHours(oldStart.getHours(), oldStart.getMinutes(), 0);
                    
                    const newEnd = new Date(targetDate);
                    const oldEnd = new Date(s.endTime);
                    newEnd.setHours(oldEnd.getHours(), oldEnd.getMinutes(), 0);

                    const newShift = {
                        employeeId: s.employeeId,
                        startTime: newStart.toISOString(),
                        endTime: newEnd.toISOString(),
                        status: 0,
                        isDescanso: !!s.isDescanso,
                        isFuera: !!s.isFuera
                    };

                    const existingIdx = clonedShifts.findIndex(cs => 
                        cs.employeeId === s.employeeId && 
                        new Date(cs.startTime).toDateString() === targetDate.toDateString()
                    );

                    if (existingIdx >= 0) clonedShifts[existingIdx] = newShift;
                    else clonedShifts.push(newShift);
                    copiedCount++;
                }
            });

            setShifts(clonedShifts);
            showToast(`Se precargaron ${copiedCount} turnos`);
        } catch (err) {
            showToast("Error al clonar semana", "error");
        } finally {
            setLoading(false);
        }
    };

    const exportToPDF = () => {
        // html2pdf.bundle.min.js includes both html2canvas and jspdf
        if (!window.html2canvas || !window.jspdf) {
            showToast("Iniciando motor PDF de alta fidelidad... Intenta de nuevo", "info");
            return;
        }

        const element = document.getElementById('printable-area');
        const storeName = stores.find(s => s.id === selectedStore)?.name || 'Sede';
        const fileName = `Turnos_${storeName}_${currentWeekStart.toISOString().split('T')[0]}.pdf`;

        // Temporary styles for capture at fixed width
        const style = document.createElement('style');
        style.innerHTML = `
            #printable-area .print-only { display: block !important; }
            #printable-area .no-print { display: none !important; }
            #printable-area { 
                background: #fff !important; 
                padding: 30px !important; 
                width: 1400px !important; 
                margin: 0 !important;
                position: relative !important;
                left: 0 !important;
                top: 0 !important;
            }
            #printable-area table { border-collapse: collapse !important; width: 100% !important; table-layout: fixed !important; min-width: 0 !important; }
            #printable-area th, #printable-area td { border: 1px solid #cbd5e1 !important; padding: 4px !important; font-size: 8pt !important; overflow: hidden; }
            #printable-area .shift-token { padding: 4px !important; margin: 2px !important; font-size: 7.5pt !important; height: auto !important; width: auto !important; min-width: 0 !important; }
        `;
        document.head.appendChild(style);

        // Manual Image-to-PDF Capture (Ultra-HD Nitidez)
        window.html2canvas(element, { 
            scale: 2.5, // Retina-level sharpness
            useCORS: true, 
            logging: false,
            scrollX: 0,
            scrollY: 0,
            x: 0,
            y: 0,
            windowWidth: 1400,
            backgroundColor: '#ffffff' // Solid white background
        }).then(canvas => {
            const imgData = canvas.toDataURL('image/png'); // PNG for lossless text
            
            const jsPDF = window.jspdf?.jsPDF || window.jspdf;
            const pdf = new jsPDF('l', 'in', 'letter');
            
            const pageWidth = pdf.internal.pageSize.getWidth();
            const margin = 0.3; 
            const targetWidth = pageWidth - (margin * 2);
            const targetHeight = (canvas.height * targetWidth) / canvas.width;
            
            // Draw image using PNG for maximum contrast and sharpness
            pdf.addImage(imgData, 'PNG', margin, margin, targetWidth, targetHeight, undefined, 'FAST');
            pdf.save(fileName);
            
            document.head.removeChild(style);
        }).catch(err => {
            console.error(err);
            showToast("Error en nitidez PDF. Reintenta en 2 segundos.", "error");
            document.head.removeChild(style);
        });
    };

    const exportToExcel = () => {
        const xmlHeader = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Title">
   <Font ss:Bold="1" ss:Size="18" ss:Color="#1E293B"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="Label">
   <Font ss:Bold="1" ss:Size="10" ss:Color="#64748B"/>
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="Value">
   <Font ss:Bold="1" ss:Size="11" ss:Color="#1E293B"/>
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="Header">
   <Font ss:Bold="1" ss:Color="#FFFFFF" ss:Size="10"/>
   <Interior ss:Color="#4F46E5" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="Default">
   <Alignment ss:Vertical="Center"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Programacion">
  <Table ss:ExpandedColumnCount="10" x:FullColumns="1" x:FullRows="1">
   <Column ss:AutoFitWidth="1" ss:Width="180"/>
   <Column ss:AutoFitWidth="1" ss:Width="100" ss:Span="7"/>
   <Column ss:AutoFitWidth="1" ss:Width="80"/>`;

        const xmlFooter = `  </Table>
 </Worksheet>
</Workbook>`;

        const storeName = stores.find(s => s.id === selectedStore)?.name || 'Sede';
        const weekRange = `${currentWeekStart.toLocaleDateString('es-CO')} - ${new Date(new Date(currentWeekStart).setDate(currentWeekStart.getDate() + 6)).toLocaleDateString('es-CO')}`;
        const userJson = localStorage.getItem('user');
        const userName = userJson ? JSON.parse(userJson).firstName + ' ' + JSON.parse(userJson).lastName : 'Administrador';
        const now = new Date().toLocaleString();

        let headerRows = `
            <Row ss:Height="40">
                <Cell ss:MergeAcross="8" ss:StyleID="Title"><Data ss:Type="String">PROGRAMACIÓN DE TURNOS SEMANAL</Data></Cell>
            </Row>
            <Row ss:Height="25">
                <Cell ss:StyleID="Label"><Data ss:Type="String">Sede:</Data></Cell>
                <Cell ss:StyleID="Value" ss:MergeAcross="2"><Data ss:Type="String">${storeName}</Data></Cell>
                <Cell ss:StyleID="Label"><Data ss:Type="String">Semana:</Data></Cell>
                <Cell ss:StyleID="Value" ss:MergeAcross="3"><Data ss:Type="String">${weekRange}</Data></Cell>
            </Row>
            <Row ss:Height="25">
                <Cell ss:StyleID="Label"><Data ss:Type="String">Emitido por:</Data></Cell>
                <Cell ss:StyleID="Value" ss:MergeAcross="2"><Data ss:Type="String">${userName}</Data></Cell>
                <Cell ss:StyleID="Label"><Data ss:Type="String">Fecha Exportación:</Data></Cell>
                <Cell ss:StyleID="Value" ss:MergeAcross="3"><Data ss:Type="String">${now}</Data></Cell>
            </Row>
            <Row ss:Height="15"></Row>
        `;

        let tableRows = `<Row ss:Height="30">
            <Cell ss:StyleID="Header"><Data ss:Type="String">ID / CÉDULA</Data></Cell>
            <Cell ss:StyleID="Header"><Data ss:Type="String">COLABORADOR</Data></Cell>`;
        
        days.forEach(d => {
            tableRows += `<Cell ss:StyleID="Header"><Data ss:Type="String">${d.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric' }).toUpperCase()}</Data></Cell>`;
        });
        tableRows += `<Cell ss:StyleID="Header"><Data ss:Type="String">TOTAL HRS</Data></Cell></Row>`;

        employees.forEach(emp => {
            const empShifts = shifts.filter(s => s.employeeId === emp.id);
            const totalHours = empShifts.filter(s => !s.isDescanso).reduce((acc, s) => acc + (new Date(s.endTime) - new Date(s.startTime)) / (1000 * 60 * 60), 0);
            
            tableRows += `<Row ss:Height="25">
                <Cell><Data ss:Type="String">${emp.documento || '---'}</Data></Cell>
                <Cell><Data ss:Type="String">${emp.firstName} ${emp.lastName}</Data></Cell>`;
            
            days.forEach(day => {
                const shift = empShifts.find(s => new Date(s.startTime).toDateString() === day.toDateString());
                let data = "—";
                if (shift) {
                    if (shift.isDescanso) data = "DESCANSO";
                    else if (shift.isFuera) data = "FUERA";
                    else {
                        const s = new Date(shift.startTime);
                        const e = new Date(shift.endTime);
                        data = `${s.getHours()}:${String(s.getMinutes()).padStart(2, '0')} - ${e.getHours()}:${String(e.getMinutes()).padStart(2, '0')}`;
                    }
                }
                tableRows += `<Cell><Data ss:Type="String">${data}</Data></Cell>`;
            });
            tableRows += `<Cell><Data ss:Type="Number">${Math.round(totalHours)}</Data></Cell></Row>`;
        });

        const blob = new Blob([xmlHeader + headerRows + tableRows + xmlFooter], { type: 'application/vnd.ms-excel' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Turnos_${storeName}_${currentWeekStart.toISOString().split('T')[0]}.xls`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <div id="printable-area" className="page-container animate-in fade-in duration-500" style={{ padding: '2rem' }}>
            <style>
                {`
                    @media print {
                        @page { size: landscape; margin: 1cm; }
                        /* Hide app layout elements */
                        .sidebar, .header, .main-footer, .no-print { display: none !important; }
                        .main-content { margin-left: 0 !important; padding: 0 !important; width: 100% !important; }
                        .content-body { padding: 0 !important; }
                        
                        .page-container { padding: 0 !important; background: white !important; margin: 0 !important; }
                        .print-only { display: block !important; }
                        
                        table { border: 1px solid #1e293b !important; width: 100% !important; border-collapse: collapse !important; table-layout: fixed !important; }
                        th, td { border: 1px solid #cbd5e1 !important; padding: 4px !important; font-size: 8pt !important; color: #000 !important; overflow: hidden; }
                        th { background-color: #f8fafc !important; font-weight: 800 !important; }
                        
                        .custom-scrollbar { overflow: visible !important; }
                        body { background: white !important; -webkit-print-color-adjust: exact; }
                        
                        /* Quality markers for print */
                        tr { page-break-inside: avoid; }
                    }
                    .print-only { display: none; }
                `}
            </style>

            {/* Header V12.0 Print Only Header */}
            <div className="print-only" style={{ marginBottom: '2rem', borderBottom: '3px solid #1e293b', paddingBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#1e293b', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>Programación de Turnos</h1>
                        <p style={{ fontSize: '14px', fontWeight: '700', color: '#64748b', margin: '4px 0' }}>
                            Sede: <span style={{ color: '#000' }}>{stores.find(s => s.id === selectedStore)?.name || 'Sede No Seleccionada'}</span>
                        </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '16px', fontWeight: '800', margin: 0 }}>
                            Semana: {currentWeekStart.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })} — {new Date(new Date(currentWeekStart).setDate(currentWeekStart.getDate() + 6)).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </p>
                        <p style={{ fontSize: '10px', color: '#94a3b8', margin: '4px 0' }}>Expedido el: {new Date().toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* Header V9.3 - Expert Productivity Toolbar */}
            {/* Header V10.0 - Unified Premium Toolbar */}
            <div className="no-print flex flex-col xl:flex-row items-center justify-between mb-8 gap-4 bg-slate-50/50 dark:bg-slate-800/30 p-4 rounded-[32px] border border-slate-200/60 dark:border-slate-700/50 shadow-sm">
                
                {/* Left: Configuration & Navigation */}
                <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                    <button 
                        onClick={copyFromPreviousWeek}
                        className="h-[48px] px-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm group"
                        title="Proyectar turnos de la semana anterior"
                    >
                        <Copy size={18} className="text-indigo-500 group-hover:scale-110 transition-transform" />
                        <span className="font-black text-[10px] uppercase tracking-wider text-slate-700 dark:text-slate-200">Clonar</span>
                    </button>
                    
                    <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl h-[48px] shadow-sm">
                        <div className="flex items-center px-4 gap-3 border-r border-slate-100 dark:border-slate-700">
                            <Store size={16} className="text-indigo-500" />
                            <select 
                                value={selectedStore} 
                                onChange={(e) => setSelectedStore(e.target.value)}
                                className="bg-transparent border-none font-black text-[11px] text-slate-700 dark:text-slate-200 focus:ring-0 min-w-[110px] cursor-pointer uppercase [&>option]:bg-white [&>option]:dark:bg-slate-800"
                            >
                                <option value="">Sede...</option>
                                {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div className="flex items-center px-1">
                            <button onClick={() => setWeekOffset(prev => prev - 1)} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-all text-slate-400"><ChevronLeft size={18} /></button>
                            <div className="px-2 text-center min-w-[100px]">
                                <span className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-tighter">
                                    {currentWeekStart.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit' })} — {new Date(new Date(currentWeekStart).setDate(currentWeekStart.getDate() + 6)).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit' })}
                                </span>
                            </div>
                            <button onClick={() => setWeekOffset(prev => prev + 1)} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-all text-slate-400"><ChevronRight size={18} /></button>
                        </div>
                    </div>
                </div>

                {/* Right: Expert Toolbox & Final Actions */}
                <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto justify-end">
                    {/* Draggable Toolbox */}
                    <div className="flex items-center bg-white/80 dark:bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-700 p-1.5 gap-2 shadow-inner">
                        <div 
                            draggable
                            onDragStart={(e) => handleDragStart(e, 'PANEL', { type: 'Turno' })}
                            className="h-[40px] px-5 bg-indigo-600 text-white rounded-2xl flex items-center gap-2 cursor-grab shadow-lg shadow-indigo-500/20 active:scale-95 transition-all hover:bg-indigo-700 font-bold"
                        >
                            <Clock size={16} /> <span className="text-[9px] font-black uppercase tracking-wider">Turno</span>
                        </div>
                        <div 
                            draggable
                            onDragStart={(e) => handleDragStart(e, 'PANEL', { type: 'Descanso' })}
                            className="h-[40px] px-5 bg-amber-500 text-white rounded-2xl flex items-center gap-2 cursor-grab shadow-lg shadow-amber-500/20 active:scale-95 transition-all hover:bg-amber-600 font-bold"
                        >
                            <Calendar size={16} /> <span className="text-[9px] font-black uppercase tracking-wider">Desc</span>
                        </div>
                        <div 
                            draggable
                            onDragStart={(e) => handleDragStart(e, 'PANEL', { type: 'Turno Fuera' })}
                            className="h-[40px] px-5 bg-purple-600 text-white rounded-2xl flex items-center gap-2 cursor-grab shadow-lg shadow-purple-500/20 active:scale-95 transition-all hover:bg-purple-700 font-bold"
                        >
                            <AlertCircle size={16} /> <span className="text-[9px] font-black uppercase tracking-wider">Fuera</span>
                        </div>
                        <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                        <div 
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleDropOnTrash}
                            className="h-[44px] w-[44px] bg-red-50 dark:bg-red-900/30 text-red-500 border-2 border-dashed border-red-200 dark:border-red-800 rounded-2xl flex items-center justify-center cursor-pointer transition-all hover:bg-red-500 hover:text-white hover:border-solid hover:scale-110 group shadow-lg shadow-red-100 dark:shadow-none"
                            title="Arrastra un turno aquí para eliminarlo"
                        >
                            <Trash2 size={20} className="group-hover:animate-bounce" />
                        </div>
                    </div>

                    {/* Final Actions */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={exportToExcel} 
                                title="Exportar a Excel" 
                                className="flex items-center gap-2 h-[44px] px-4 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95"
                            >
                                <FileSpreadsheet size={18} />
                                <span className="text-[10px] font-black uppercase tracking-widest hidden lg:inline">Excel</span>
                            </button>
                            <button 
                                onClick={exportToPDF} 
                                title="Exportar a PDF" 
                                className="flex items-center gap-2 h-[44px] px-4 bg-rose-600 text-white rounded-2xl hover:bg-rose-700 transition-all shadow-lg shadow-rose-500/20 hover:scale-105 active:scale-95"
                            >
                                <FileDown size={18} />
                                <span className="text-[10px] font-black uppercase tracking-widest hidden lg:inline">PDF</span>
                            </button>
                        </div>
                        <button 
                            onClick={handleSave} 
                            disabled={isSaving || loading}
                            className="btn-premium btn-premium-primary h-[44px] px-8 text-[11px] font-black tracking-[0.1em] disabled:opacity-50 shadow-xl shadow-indigo-500/20 flex items-center gap-2"
                        >
                            {isSaving ? <div className="loader !w-4 !h-4 !border-white"></div> : <><Save size={18} /> GUARDAR</>}
                        </button>
                    </div>
                </div>
            </div>

            <div className="relative">
                <div className="card shadow-2xl relative overflow-hidden dark:bg-slate-900" style={{ padding: 0, borderRadius: '40px', border: '1px solid var(--border)' }}>
                    {loading ? (
                        <div className="py-32 text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Sincronizando cuadrante...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full border-collapse min-w-[1000px]">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                                        <th className="p-6 text-left w-[320px] sticky left-0 z-10 bg-slate-50 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                                                    <UsersIcon size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1">Colaborador /</p>
                                                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Jornada</p>
                                                </div>
                                            </div>
                                        </th>
                                        {days.map((day, i) => {
                                            const isToday = day.toDateString() === new Date().toDateString();
                                            return (
                                                <th key={i} className={`p-4 text-center border-r dark:border-slate-700 transition-colors min-w-[130px] ${isToday ? 'bg-indigo-50/50 dark:bg-indigo-900/20' : ''}`}>
                                                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1">{day.toLocaleDateString('es-CO', { weekday: 'short' })}</p>
                                                    <p className={`text-xl font-black ${isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}>{day.getDate()}</p>
                                                </th>
                                            );
                                        })}
                                        <th className="p-6 text-center border-l-2 border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 w-[90px]">
                                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total</p>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {employees.length === 0 ? (
                                        <tr>
                                            <td colSpan={days.length + 2} className="py-32 text-center">
                                                <User size={64} className="mx-auto mb-4 opacity-10" />
                                                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">No hay colaboradores para mostrar</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        employees.map(emp => {
                                            const totalHours = shifts
                                                .filter(s => s.employeeId === emp.id && !s.isDescanso)
                                                .reduce((acc, s) => acc + (new Date(s.endTime) - new Date(s.startTime)) / (1000 * 60 * 60), 0);

                                            return (
                                                <tr key={emp.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group">
                                                    <td className="sticky left-0 z-10 bg-white dark:bg-slate-900 p-4 pl-6 border-r border-slate-100 dark:border-slate-800 group-hover:bg-slate-50/80 dark:group-hover:bg-slate-800/40 transition-colors">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-lg shadow-indigo-100 dark:shadow-none">
                                                                {emp.firstName[0]}{emp.lastName[0]}
                                                            </div>
                                                            <div className="overflow-hidden">
                                                                <p className="text-[13px] font-black text-slate-800 dark:text-white leading-tight uppercase truncate">{emp.firstName} {emp.lastName}</p>
                                                                <div className="flex items-center gap-2 mt-0.5">
                                                                    <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">ID: {emp.documento || '---'}</p>
                                                                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                                                                    <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-black text-[9px]">
                                                                        <Clock size={10} /> {emp.jornadaHorasSemanales || 48}H
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    {days.map((day, i) => {
                                                        const isLocked = getNovedad(emp.id, day);
                                                        const shift = shifts.find(s => 
                                                            s.employeeId === emp.id && 
                                                            new Date(s.startTime).toDateString() === day.toDateString()
                                                        );

                                                        return (
                                                            <td 
                                                                key={i} 
                                                                className={`p-2 border-r dark:border-slate-800 relative transition-all cursor-pointer ${day.toDateString() === new Date().toDateString() ? 'bg-indigo-50/20 dark:bg-indigo-900/10' : ''}`}
                                                                onDragOver={(e) => e.preventDefault()}
                                                                onDrop={(e) => handleDropOnGrid(e, emp.id, day)}
                                                            >
                                                                {isLocked ? (
                                                                    <div 
                                                                        onClick={() => {
                                                                            setSelectedNov({
                                                                                empName: `${emp.firstName} ${emp.lastName}`,
                                                                                type: isLocked.novedadTipoNombre || 'Novedad',
                                                                                start: isLocked.fechaInicio,
                                                                                end: isLocked.fechaFin
                                                                            });
                                                                            setShowNovModal(true);
                                                                        }}
                                                                        className="animate-in zoom-in-95 duration-200 h-[54px] bg-blue-50 border border-blue-200 dark:border-blue-800 rounded-2xl flex flex-col items-center justify-center p-1 text-center group shadow-sm hover:scale-[1.02] transition-transform border-dashed"
                                                                    >
                                                                        <span className="text-[8.5px] font-bold text-blue-700 dark:text-blue-400 uppercase leading-tight line-clamp-1">{isLocked.novedadTipoNombre || 'LOCK'}</span>
                                                                        <Info size={14} className="text-blue-500 mt-1 opacity-60" />
                                                                    </div>
                                                                ) : (
                                                                    <div 
                                                                        draggable={shift ? true : false}
                                                                        onDragStart={(e) => handleDragStart(e, 'GRID', { employeeId: emp.id, date: day })}
                                                                        className={`animate-in zoom-in-95 duration-200 h-[54px] rounded-2xl flex flex-col items-center justify-center p-1 text-center border transition-all shadow-md ${
                                                                            shift ? (
                                                                                shift.isDescanso ? 'bg-amber-500 border-amber-500 text-white shadow-amber-500/20 hover:scale-[1.05]' : 
                                                                                shift.isFuera ? 'bg-purple-600 border-purple-600 text-white shadow-purple-500/20 hover:scale-[1.05]' : 
                                                                                'bg-indigo-600 border-indigo-600 text-white shadow-indigo-500/20 hover:scale-[1.05]'
                                                                            ) : 'border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30 text-slate-300 dark:text-slate-700 hover:border-indigo-400 dark:hover:border-indigo-600'
                                                                        }`}
                                                                    >
                                                                        {shift ? (
                                                                            <>
                                                                                <span className="text-[9px] font-black uppercase leading-none mb-1 opacity-80">{shift.isDescanso ? 'DESC' : shift.isFuera ? 'FUERA' : 'TURNO'}</span>
                                                                                <span className="text-[8.5px] font-bold leading-none whitespace-nowrap opacity-100">
                                                                                    {new Date(shift.startTime).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false })} - {new Date(shift.endTime).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                                                                </span>
                                                                            </>
                                                                        ) : (
                                                                            <Plus size={16} className="opacity-20 group-hover:opacity-100 transition-opacity" />
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </td>
                                                        );
                                                    })}
                                                        <td className="p-4 text-center border-l-2 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                                                            <div className={`inline-flex items-center justify-center min-w-[54px] h-12 rounded-2xl font-black shadow-sm border px-3 gap-1.5 transition-all ${
                                                                totalHours > (emp.jornadaHorasSemanales || 48) 
                                                                    ? 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800' 
                                                                    : 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-800'
                                                            }`}>
                                                                <span className="text-[15px]">{Math.round(totalHours)}</span>
                                                                <span className="text-[8px] uppercase opacity-70 mt-1">Hrs</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>


            {/* Modals & Dialogs */}
            {showTimeModal && (
                <div className="modal-overlay">
                    <div className="modal-content shadow-2xl dark:bg-slate-900 border dark:border-slate-800" style={{ maxWidth: '420px', borderRadius: '48px', padding: '3rem' }}>
                        <div className="text-center mb-10">
                            <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-100 dark:shadow-none">
                                <Clock size={40} />
                            </div>
                            <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Programar Horario</h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Asignando {pendingEvent?.type}</p>
                        </div>
                        
                        <div className="space-y-4 mb-10">
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-3xl border border-slate-200 dark:border-slate-700">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Hora de Inicio</label>
                                <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full bg-transparent border-none text-2xl font-black text-slate-800 dark:text-white focus:ring-0 p-0" />
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-3xl border border-slate-200 dark:border-slate-700">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Hora de Finalización</label>
                                <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full bg-transparent border-none text-2xl font-black text-slate-800 dark:text-white focus:ring-0 p-0" />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <button onClick={confirmTimeModal} className="btn-premium btn-premium-primary w-full h-[64px] rounded-[24px] text-lg">Asignar Turno</button>
                            <button onClick={() => setShowTimeModal(false)} className="w-full py-4 text-slate-400 dark:text-slate-500 font-black text-sm uppercase tracking-widest hover:text-slate-600 dark:hover:text-slate-300 transition-colors">Cancelar</button>
                        </div>
                    </div>
                </div>
            )}

            {showNovModal && selectedNov && (
                <div className="modal-overlay">
                    <div className="modal-content shadow-2xl dark:bg-slate-900 border dark:border-slate-800" style={{ maxWidth: '420px', borderRadius: '48px', padding: '3rem' }}>
                        <div className="text-center mb-10">
                            <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-[32px] flex items-center justify-center mx-auto mb-6">
                                <Info size={40} />
                            </div>
                            <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Detalle de Bloqueo</h2>
                        </div>
                        
                        <div className="space-y-6 mb-10">
                            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Colaborador</p>
                                <p className="text-base font-black text-slate-800 dark:text-white uppercase">{selectedNov.empName}</p>
                            </div>
                            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Motivo de Novedad</p>
                                <div className="inline-block px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-black uppercase">{selectedNov.type}</div>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Vigencia del Bloqueo</p>
                                <p className="text-xs font-bold text-slate-600 dark:text-slate-400">{new Date(selectedNov.start).toLocaleDateString()} — {new Date(selectedNov.end).toLocaleDateString()}</p>
                            </div>
                        </div>

                        <button onClick={() => setShowNovModal(false)} className="btn-premium btn-premium-primary w-full h-[64px] rounded-[24px] text-lg bg-blue-600 hover:bg-blue-700 border-blue-600">Entendido</button>
                    </div>
                </div>
            )}

            {toast.show && (
                <div className="toast-container">
                    <div className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>
                        {toast.type === 'success' ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
                        <span className="font-black uppercase tracking-tight">{toast.message}</span>
                    </div>
                </div>
            )}

            {/* Print Footer */}
            <div className="print-only mt-12">
                <div className="grid grid-cols-2 gap-16 mb-12">
                    <div className="border-t-2 border-slate-900 text-center pt-2">
                        <p className="text-xs font-black uppercase">Firma Jefe de Sede</p>
                    </div>
                    <div className="border-t-2 border-slate-900 text-center pt-2">
                        <p className="text-xs font-black uppercase">Firma Coordinador Talento Humano</p>
                    </div>
                </div>
                
                <div className="flex gap-6 text-[10px] font-black text-slate-500 border-t border-slate-100 pt-4 uppercase">
                    <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-md bg-indigo-600"></div> Turno Regular</span>
                    <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-md bg-amber-500"></div> Descanso</span>
                    <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-md bg-purple-600"></div> Turno Fuera</span>
                    <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-md border-2 border-blue-400 bg-blue-50"></div> Novedad / Bloqueo</span>
                </div>
            </div>
        </div>
    );
};

export default ShiftScheduler;
