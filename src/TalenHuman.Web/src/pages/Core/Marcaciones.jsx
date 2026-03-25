import React, { useState } from 'react';
import { 
    Clock, Search, Filter, Calendar, User as UserIcon, 
    CheckCircle, AlertCircle, ArrowUpRight, ArrowDownLeft,
    Download, RefreshCw, LayoutGrid, ListTodo
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const Marcaciones = () => {
    const { isDarkMode } = useTheme();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('Todos');

    // Premium Color System (V12 Elite)
    const activeColors = {
        bg: isDarkMode ? '#0f172a' : '#f8fafc',
        card: isDarkMode ? '#1e293b' : '#ffffff',
        border: isDarkMode ? '#334155' : '#f1f5f9',
        textMain: isDarkMode ? '#f1f5f9' : '#1e293b',
        textMuted: isDarkMode ? '#94a3b8' : '#64748b',
        accent: '#4f46e5',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444'
    };

    // Mock Data for V12 Preview
    const mockMarcaciones = [
        { id: 1, empleado: 'Tito Pedraza', cedula: '10203040', fecha: '2026-03-24', horaEntrada: '08:02 AM', horaSalida: '05:15 PM', sede: 'Sede Norte', estado: 'Normal' },
        { id: 2, empleado: 'Andrea Gomez', cedula: '52678123', fecha: '2026-03-24', horaEntrada: '08:15 AM', horaSalida: '05:30 PM', sede: 'Sede Sur', estado: 'Retraso' },
        { id: 3, empleado: 'Carlos Ramirez', cedula: '79456123', fecha: '2026-03-24', horaEntrada: '07:55 AM', horaSalida: '--:-- --', sede: 'Centro', estado: 'En Turno' },
        { id: 4, empleado: 'Sofia Lopez', cedula: '1110456123', fecha: '2026-03-23', horaEntrada: '08:00 AM', horaSalida: '05:00 PM', sede: 'Sede Norte', estado: 'Normal' },
    ];

    const getStatusStyle = (status) => {
        switch(status) {
            case 'Normal': return { bg: '#ecfdf5', text: '#059669', border: '#d1fae5' };
            case 'Retraso': return { bg: '#fffbeb', text: '#d97706', border: '#fef3c7' };
            case 'En Turno': return { bg: '#eef2ff', text: '#4f46e5', border: '#e0e7ff' };
            default: return { bg: '#f8fafc', text: '#64748b', border: '#e2e8f0' };
        }
    };

    return (
        <div style={{ padding: '2rem 1rem', maxWidth: '1400px', margin: '0 auto' }}>
            {/* Elite Header & Toolbar */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4rem', gap: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.2rem', fontWeight: '950', color: activeColors.textMain, margin: 0, letterSpacing: '-0.03em' }}>Gestión de asistencia</h1>
                    <p style={{ color: activeColors.textMuted, fontSize: '0.9rem', fontWeight: '600', marginTop: '6px' }}>Control de marcaciones y trazabilidad de ingresos</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button style={{ background: activeColors.card, color: activeColors.textMain, padding: '12px 20px', borderRadius: '16px', border: `1px solid ${activeColors.border}`, fontWeight: '800', fontSize: '0.7rem', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Download size={18} /> Exportar Excel
                    </button>
                    <button style={{ background: activeColors.accent, color: 'white', padding: '12px 25px', borderRadius: '16px', border: 'none', fontWeight: '800', fontSize: '0.7rem', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 8px 15px rgba(79, 70, 229, 0.2)' }}>
                        <RefreshCw size={18} /> Sincronizar
                    </button>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                {[
                    { label: 'Presentes Hoy', val: '128', icon: UserIcon, color: activeColors.accent, bg: '#eef2ff' },
                    { label: 'Llegadas Tarde', val: '12', icon: Clock, color: activeColors.warning, bg: '#fffbeb' },
                    { label: 'Ausencias', val: '3', icon: AlertCircle, color: activeColors.danger, bg: '#fef2f2' },
                    { label: 'Promedio Entrada', val: '08:04 AM', icon: CheckCircle, color: activeColors.success, bg: '#ecfdf5' }
                ].map((s, idx) => (
                    <div key={idx} style={{ background: activeColors.card, padding: '1.5rem', borderRadius: '28px', border: `1px solid ${activeColors.border}`, display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        <div style={{ width: '50px', height: '50px', background: s.bg, color: s.color, borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <s.icon size={24} />
                        </div>
                        <div>
                            <p style={{ fontSize: '9px', fontWeight: '900', color: activeColors.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '2px' }}>{s.label}</p>
                            <p style={{ fontSize: '1.5rem', fontWeight: '950', color: activeColors.textMain, lineHeight: 1 }}>{s.val}</p>
                        </div>
                    </div>
                ))}
            </div>


            {/* Toolbar V12 */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ position: 'relative', flex: '1 1 400px', maxWidth: '600px' }}>
                    <Search style={{ position: 'absolute', left: '16px', top: '16px', color: '#94a3b8' }} size={18} />
                    <input 
                        type="text" 
                        placeholder="Buscar por colaborador o cédula..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ width: '100%', padding: '14px 20px 14px 50px', borderRadius: '18px', background: activeColors.card, border: `1px solid ${activeColors.border}`, color: activeColors.textMain, fontSize: '0.9rem', fontWeight: '600', boxSizing: 'border-box' }}
                    />
                </div>
                <div style={{ position: 'relative', width: '200px' }}>
                    <Calendar style={{ position: 'absolute', left: '16px', top: '16px', color: '#94a3b8' }} size={16} />
                    <input type="date" style={{ width: '100%', padding: '14px 15px 14px 45px', borderRadius: '18px', background: activeColors.card, border: `1px solid ${activeColors.border}`, color: activeColors.textMain, fontSize: '0.9rem', fontWeight: '700', cursor: 'pointer', appearance: 'none', boxSizing: 'border-box' }} />
                </div>
            </div>

            {/* Table Elite V12 */}
            <div style={{ background: activeColors.card, borderRadius: '40px', border: `1px solid ${activeColors.border}`, overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: isDarkMode ? '#1e293b' : '#f8fafc', textAlign: 'left', borderBottom: `1px solid ${activeColors.border}` }}>
                                <th style={{ padding: '1.5rem 2.5rem', fontSize: '0.7rem', fontWeight: '900', textTransform: 'uppercase', color: activeColors.textMuted, letterSpacing: '0.1em' }}>Colaborador</th>
                                <th style={{ padding: '1.5rem', fontSize: '0.7rem', fontWeight: '900', textTransform: 'uppercase', color: activeColors.textMuted, letterSpacing: '0.1em' }}>Sede</th>
                                <th style={{ padding: '1.5rem', fontSize: '0.7rem', fontWeight: '900', textTransform: 'uppercase', color: activeColors.textMuted, letterSpacing: '0.1em' }}>Entrada</th>
                                <th style={{ padding: '1.5rem', fontSize: '0.7rem', fontWeight: '900', textTransform: 'uppercase', color: activeColors.textMuted, letterSpacing: '0.1em' }}>Salida</th>
                                <th style={{ padding: '1.5rem 2.5rem', fontSize: '0.7rem', fontWeight: '900', textTransform: 'uppercase', color: activeColors.textMuted, letterSpacing: '0.1em', textAlign: 'right' }}>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {mockMarcaciones.map(m => {
                                const st = getStatusStyle(m.estado);
                                return (
                                    <tr key={m.id} style={{ borderBottom: `1px solid ${activeColors.border}` }} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                        <td style={{ padding: '1.5rem 2.5rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{ width: '42px', height: '42px', background: activeColors.accent + '15', color: activeColors.accent, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '950', fontSize: '1rem' }}>
                                                    {m.empleado[0]}
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '0.9rem', fontWeight: '800', color: activeColors.textMain, textTransform: 'uppercase' }}>{m.empleado}</div>
                                                    <p style={{ fontSize: '0.75rem', fontWeight: '600', color: activeColors.textMuted, margin: 0 }}>C.C. {m.cedula}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1.5rem' }}>
                                            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: activeColors.textMain }}>{m.sede}</span>
                                        </td>
                                        <td style={{ padding: '1.5rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: activeColors.success, fontWeight: '900', fontSize: '0.85rem' }}>
                                                <ArrowUpRight size={16} /> {m.horaEntrada}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1.5rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: m.horaSalida === '--:-- --' ? activeColors.textMuted : activeColors.accent, fontWeight: '900', fontSize: '0.85rem' }}>
                                                <ArrowDownLeft size={16} /> {m.horaSalida}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1.5rem 2.5rem', textAlign: 'right' }}>
                                            <span style={{ padding: '6px 14px', borderRadius: '99px', background: st.bg, color: st.text, fontSize: '0.7rem', fontWeight: '950', textTransform: 'uppercase', border: `1px solid ${st.border}` }}>
                                                {m.estado}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Marcaciones;
