import React, { useEffect, useState } from 'react';
import { X, Bell, Calendar, Sparkles, MessageSquare, CheckCircle2, AlertCircle } from 'lucide-react';

const TalenHumanToast = ({ title, body, type = 'info', onClose, theme }) => {
  const isDark = theme === 'dark';
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Entrance animation
    const timer = setTimeout(() => setIsVisible(true), 100);
    // Auto-close after 6 seconds
    const autoClose = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 500);
    }, 6000);

    return () => {
      clearTimeout(timer);
      clearTimeout(autoClose);
    };
  }, [onClose]);

  const config = {
    shift: {
      icon: <Calendar size={20} />,
      color: '#4f46e5',
      bg: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
      lightBg: 'rgba(79, 70, 229, 0.1)'
    },
    broadcast: {
      icon: <MessageSquare size={20} />,
      color: '#f59e0b',
      bg: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
      lightBg: 'rgba(245, 158, 11, 0.1)'
    },
    success: {
      icon: <CheckCircle2 size={20} />,
      color: '#10b981',
      bg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      lightBg: 'rgba(16, 185, 129, 0.1)'
    },
    info: {
      icon: <Bell size={20} />,
      color: '#6366f1',
      bg: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
      lightBg: 'rgba(99, 102, 241, 0.1)'
    }
  };

  const current = config[type] || config.info;

  return (
    <div 
      style={{
        position: 'fixed',
        top: '20px',
        left: '20px',
        right: '20px',
        zIndex: 9999,
        transform: isVisible ? 'translateY(0)' : 'translateY(-120%)',
        opacity: isVisible ? 1 : 0,
        transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '16px 20px',
        background: isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: '24px',
        boxShadow: isDark ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' : '0 20px 40px rgba(0, 0, 0, 0.08)',
        border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)'}`,
      }}
    >
      {/* 🔮 VIBRANT ICON CONTAINER */}
      <div style={{ 
        width: '48px', 
        height: '48px', 
        borderRadius: '16px', 
        background: current.bg,
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        color: 'white',
        boxShadow: `0 8px 16px ${current.color}30`
      }}>
        {current.icon}
      </div>

      <div style={{ flex: 1 }}>
        <p style={{ 
          fontSize: '15px', 
          fontWeight: '800', 
          margin: '0 0 2px', 
          color: isDark ? 'white' : '#1e293b',
          letterSpacing: '-0.3px'
        }}>
          {title}
        </p>
        <p style={{ 
          fontSize: '12px', 
          color: isDark ? 'rgba(255, 255, 255, 0.5)' : '#64748b', 
          margin: 0,
          lineHeight: '1.4'
        }}>
          {body}
        </p>
      </div>

      <button 
        onClick={() => {
          setIsVisible(false);
          setTimeout(onClose, 500);
        }}
        style={{ 
          border: 'none', 
          background: 'none', 
          color: isDark ? 'rgba(255, 255, 255, 0.3)' : '#cbd5e1',
          cursor: 'pointer',
          padding: '4px'
        }}
      >
        <X size={18} />
      </button>

      {/* ✨ UNDER-GLOW DECORATION */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: '20%',
        right: '20%',
        height: '2px',
        background: current.bg,
        opacity: 0.3,
        filter: 'blur(4px)',
        borderRadius: '100%'
      }} />
    </div>
  );
};

export default TalenHumanToast;
