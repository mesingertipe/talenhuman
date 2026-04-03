import React from 'react';
import { Users, Clock, Calendar, AlertCircle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const Dashboard = () => {
    const { isDarkMode } = useTheme();
    
    const activeColors = {
        bg: isDarkMode ? '#0f172a' : '#f8fafc',
        card: isDarkMode ? '#1e293b' : '#ffffff',
        border: isDarkMode ? '#334155' : '#f1f5f9',
        textMain: isDarkMode ? '#f1f5f9' : '#1e293b',
        textMuted: isDarkMode ? '#94a3b8' : '#64748b',
        accent: '#4f46e5'
    };

    const stats = [
        { label: 'Empleados Activos', value: '142', icon: <Users size={20} color="var(--primary)" />, trend: '+4 esta semana' },
        { label: 'Turnos Hoy', value: '48', icon: <Calendar size={20} color="var(--secondary)" />, trend: '6 pendientes' },
        { label: 'Marcaciones Recientes', value: '32', icon: <Clock size={20} color="#f59e0b" />, trend: 'Última hace 5 min' },
        { label: 'Novedades/Incapacidades', value: '5', icon: <AlertCircle size={20} color="#ef4444" />, trend: '2 requieren aprobación' },
    ];

    return (
        <div className="page-container animate-in fade-in duration-500" style={{ padding: '2rem 1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
            {/* Dashboard Header */}
            <div style={{ marginBottom: '4rem' }}>
                <h1 style={{ fontSize: '2.2rem', fontWeight: '950', color: activeColors.textMain, margin: 0, letterSpacing: '-0.03em' }}>Hola, Tito 👋</h1>
                <p style={{ color: activeColors.textMuted, fontSize: '0.9rem', fontWeight: '600', marginTop: '6px' }}>Bienvenido al centro de mando de TalenHuman</p>
            </div>
            
            <div className="stat-grid" style={{ marginBottom: '3rem' }}>
                {stats.map((stat, idx) => (
                    <div key={idx} className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <div style={{ padding: '0.5rem', background: 'rgba(0,0,0,0.03)', borderRadius: '8px' }}>
                                {stat.icon}
                            </div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{stat.trend}</span>
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{stat.label}</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>{stat.value}</div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                <div className="card">
                    <h3 style={{ marginBottom: '1.5rem' }}>Próximos Turnos</h3>
                    <div className="table-placeholder" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {[1, 2, 3].map(i => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ width: '32px', height: '32px', background: '#e2e8f0', borderRadius: '50%' }}></div>
                                    <div>
                                        <div style={{ fontSize: '0.875rem', fontWeight: '600' }}>Mesero {i}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Restaurante El Portal</div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.875rem', fontWeight: '600' }}>12:00 PM - 8:00 PM</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>Programado</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="card">
                    <h3 style={{ marginBottom: '1.5rem' }}>Alertas de Marcación</h3>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '2rem 1rem' }}>
                        <AlertCircle size={32} style={{ marginBottom: '1rem', color: '#f59e0b' }} />
                        <p>No hay alertas críticas en este momento.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
