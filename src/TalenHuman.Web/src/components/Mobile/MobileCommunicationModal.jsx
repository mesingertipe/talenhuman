import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Megaphone, CheckCircle, ChevronRight, Award } from 'lucide-react';

const MobileCommunicationModal = ({ communication, onDismiss }) => {
    const [isClosing, setIsClosing] = useState(false);

    if (!communication) return null;

    // 🎨 ABSOLUTE URL HANDLER (V63.7.3)
    const getSafeUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        // In mobile PWA, sometimes relative paths fail. Force origin.
        const origin = window.location.origin;
        return `${origin}${url.startsWith('/') ? '' : '/'}${url}`;
    };

    const handleClose = (e) => {
        if (e) e.stopPropagation();
        setIsClosing(true);
        // Robust dismiss logic
        setTimeout(() => {
            onDismiss();
        }, 350); 
    };

    return createPortal(
        <div 
            onClick={handleClose} 
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 999999999, // 🚀 ABSOLUTE GLOBAL PRIORITY (V64.2)
                background: 'rgba(7, 10, 25, 0.95)',
                backdropFilter: 'blur(20px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px env(safe-area-inset-bottom, 20px)',
                animation: isClosing ? 'fadeOut-v12 0.3s forwards' : 'fadeIn-v12 0.4s ease-out'
            }}
        >
            <div 
                onClick={(e) => e.stopPropagation()} 
                style={{
                    width: '100%',
                    maxHeight: '90vh',
                    background: 'white',
                    borderRadius: '2.5rem',
                    overflow: 'hidden',
                    boxShadow: '0 40px 100px rgba(0,0,0,0.6)',
                    position: 'relative',
                    marginTop: '20px', // Notch safety
                    animation: isClosing ? 'slideDown-v12 0.3s forwards' : 'slideUp-v12 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                {/* 🎨 HEADER & IMAGE */}
                <div style={{ position: 'relative', height: '180px', background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', flexShrink: 0 }}>
                    {communication.imagenUrl ? (
                        <img 
                            src={getSafeUrl(communication.imagenUrl)} 
                            alt="Header" 
                            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9 }}
                            onError={(e) => { e.target.style.display = 'none'; }} 
                        />
                    ) : (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                            <Megaphone size={50} strokeWidth={1} />
                        </div>
                    )}
                    
                    <button 
                        onClick={handleClose}
                        style={{
                            position: 'absolute', top: '20px', right: '20px',
                            width: '48px', height: '48px', borderRadius: '16px',
                            background: 'rgba(0,0,0,0.4)', border: 'none', color: 'white',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            backdropFilter: 'blur(8px)', zIndex: 10, cursor: 'pointer'
                        }}
                    >
                        <X size={26} />
                    </button>
                </div>

                <div style={{ padding: '24px 30px', overflowY: 'auto', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <div style={{ background: '#4f46e5', width: '20px', height: '3px', borderRadius: '2px' }} />
                        <span style={{ fontSize: '9px', fontWeight: '950', color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Comunicado Elite V12</span>
                    </div>
                    
                    <h2 style={{ fontSize: '1.6rem', fontWeight: '950', color: '#0f172a', lineHeight: '1.2', margin: '0 0 15px', letterSpacing: '-0.02em' }}>
                        {communication.titulo}
                    </h2>

                    <div 
                        className="pr-content-v12"
                        dangerouslySetInnerHTML={{ __html: communication.contenido }}
                        style={{ color: '#475569', fontSize: '1rem', lineHeight: '1.6', fontWeight: '500' }}
                    />
                </div>

                <div style={{ padding: '24px', background: '#f8fafc', borderTop: '1px solid #f1f5f9' }}>
                    <button 
                        onClick={handleClose}
                        style={{
                            width: '100%', padding: '18px', borderRadius: '1.4rem',
                            background: '#4f46e5', color: 'white', border: 'none',
                            fontWeight: '950', fontSize: '12px', textTransform: 'uppercase',
                            letterSpacing: '0.1em', boxShadow: '0 12px 25px rgba(79, 70, 229, 0.25)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
                        }}
                    >
                        Entendido, continuar <ChevronRight size={18} />
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes fadeIn-v12 { from { opacity: 0; } to { opacity: 1; } }
                @keyframes fadeOut-v12 { from { opacity: 1; } to { opacity: 0; } }
                @keyframes slideUp-v12 { from { transform: translateY(60px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                @keyframes slideDown-v12 { from { transform: translateY(0); opacity: 1; } to { transform: translateY(40px); opacity: 0; } }
                .pr-content-v12 img { width: 100%; border-radius: 16px; margin: 12px 0; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
                .pr-content-v12 b, .pr-content-v12 strong { color: #4338ca; font-weight: 900; }
            `}</style>
        </div>,
        document.body
    );
};

export default MobileCommunicationModal;
