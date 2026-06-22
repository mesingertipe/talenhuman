import React, { useRef } from 'react';
import { Calendar } from 'lucide-react';

/**
 * TalenHumanDatePicker
 * Componente premium que fuerza el formato dd/mm/yyyy visualmente
 * pero permite usar el calendario nativo y se comunica en ISO (yyyy-mm-dd)
 */
const TalenHumanDatePicker = ({ 
    value, 
    onChange, 
    placeholder = "dd/mm/yyyy", 
    required = false,
    isDarkMode = false,
    className = "",
    style = {}
}) => {
    const dateInputRef = useRef(null);

    // Convert ISO (yyyy-mm-dd) to Display (dd/mm/yyyy)
    const toDisplay = (iso) => {
        if (!iso) return '';
        const parts = iso.split('T')[0].split('-');
        if (parts.length !== 3) return iso;
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    };

    // Handle visible text change (basic validation)
    const handleTextChange = (e) => {
        const val = e.target.value;
        setRawText(val); // Mantener lo que el usuario escribe primero
        
        // If it matches dd/mm/yyyy, try to convert to ISO for the parent
        const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
        const match = val.match(regex);
        if (match) {
            const iso = `${match[3]}-${match[2]}-${match[1]}`;
            onChange(iso);
        } else if (val === '') {
            onChange('');
        }
    };

    const triggerNativePicker = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (dateInputRef.current) {
            // Some browsers require showPicker()
            if (dateInputRef.current.showPicker) {
                dateInputRef.current.showPicker();
            } else {
                dateInputRef.current.click();
            }
        }
    };

    const [isMobile, setIsMobile] = React.useState(false);

    React.useEffect(() => {
        const checkMobile = () => {
            const mobile = typeof window !== 'undefined' && (
                /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || 
                window.innerWidth < 768
            );
            setIsMobile(mobile);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const colors = {
        bg: isDarkMode ? 'rgba(255,255,255,0.02)' : '#f8fafc',
        border: isDarkMode ? 'rgba(255,255,255,0.1)' : '#e2e8f0',
        text: isDarkMode ? '#f1f5f9' : '#1e293b',
        accent: '#4f46e5'
    };

    const [rawText, setRawText] = React.useState(toDisplay(value));

    React.useEffect(() => {
        setRawText(toDisplay(value));
    }, [value]);

    return (
        <div style={{ position: 'relative', width: '100%', ...style }} className={className}>
            {/* Visible Text Input Group */}
            <div 
                style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    background: colors.bg,
                    borderRadius: '16px',
                    border: `2px solid ${colors.border}`,
                    transition: 'all 0.2s',
                    overflow: 'hidden',
                    pointerEvents: isMobile ? 'none' : 'auto'
                }}
                className="talenhuman-datepicker-container"
            >
                <div style={{ padding: '0 0 0 16px', display: 'flex', alignItems: 'center', color: colors.accent }}>
                    <Calendar size={18} />
                </div>
                
                <input 
                    type="text"
                    required={required}
                    placeholder={placeholder}
                    value={rawText}
                    onChange={handleTextChange}
                    style={{
                        width: '100%',
                        padding: '15px 12px',
                        background: 'transparent',
                        border: 'none',
                        color: colors.text,
                        fontWeight: '700',
                        fontSize: '14px',
                        outline: 'none'
                    }}
                />

                <button 
                    type="button"
                    onClick={triggerNativePicker}
                    style={{
                        height: '100%',
                        padding: '0 16px',
                        background: 'none',
                        border: 'none',
                        color: colors.accent,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderLeft: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                        opacity: 0.8
                    }}
                    className="hover:opacity-100 hover:bg-slate-50 transition-all"
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '950' }}>
                        <span style={{ opacity: 0.5 }}>Elegir</span>
                        <Calendar size={18} />
                    </div>
                </button>
            </div>

            {/* Hidden native input to trigger calendar */}
            <input 
                ref={dateInputRef}
                type="date"
                value={value ? value.split('T')[0] : ''}
                onChange={(e) => onChange(e.target.value)}
                style={{
                    position: 'absolute',
                    opacity: 0,
                    width: isMobile ? '100%' : '0',
                    height: isMobile ? '100%' : '0',
                    left: 0,
                    top: 0,
                    zIndex: isMobile ? 10 : -1,
                    cursor: 'pointer',
                    pointerEvents: isMobile ? 'auto' : 'none'
                }}
            />
        </div>
    );
};

export default TalenHumanDatePicker;
