import React, { useState, useEffect } from 'react';
import { X, Megaphone, CheckCircle, ChevronRight, Award } from 'lucide-react';

const MobileCommunicationModal = ({ communication, onDismiss }) => {
    const [isClosing, setIsClosing] = useState(false);

    if (!communication) return null;

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(onDismiss, 400); // Wait for animation
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(7, 10, 25, 0.96)',
            backdropFilter: 'blur(15px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            animation: isClosing ? 'fadeOut 0.4s ease-in forwards' : 'fadeIn 0.5s ease-out'
        }}>
            <div style={{
                width: '100%',
                maxHeight: '85vh',
                background: 'white',
                borderRadius: '3rem',
                overflow: 'hidden',
                boxShadow: '0 40px 100px rgba(0,0,0,0.4)',
                position: 'relative',
                animation: isClosing ? 'slideDown 0.4s ease-in forwards' : 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {/* 🎨 HEADER & IMAGE */}
                <div style={{ position: 'relative', height: '200px', background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', flexShrink: 0 }}>
                    {communication.imagenUrl ? (
                        <img 
                            src={communication.imagenUrl} 
                            alt="Header" 
                            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }}
                        />
                    ) : (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                            <Megaphone size={60} strokeWidth={1} />
                        </div>
                    )}
                    
                    <button 
                        onClick={handleClose}
                        style={{
                            position: 'absolute', top: '24px', right: '24px',
                            width: '44px', height: '44px', borderRadius: '15px',
                            background: 'rgba(0,0,0,0.3)', border: 'none', color: 'white',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            backdropFilter: 'blur(10px)'
                        }}
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* 📝 CONTENT */}
                <div style={{ padding: '32px', overflowY: 'auto', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                        <div style={{ background: '#4f46e5', width: '24px', height: '4px', borderRadius: '2px' }} />
                        <span style={{ fontSize: '10px', fontWeight: '950', color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Comunicado Corporativo</span>
                    </div>
                    
                    <h2 style={{ fontSize: '1.8rem', fontWeight: '950', color: '#0f172a', lineHeight: '1.2', margin: '0 0 20px', letterSpacing: '-0.03em' }}>
                        {communication.titulo}
                    </h2>

                    <div 
                        className="pr-content-lite"
                        dangerouslySetInnerHTML={{ __html: communication.contenido }}
                        style={{ color: '#475569', fontSize: '1.05rem', lineHeight: '1.6', fontWeight: '500' }}
                    />
                </div>

                {/* 🚀 ACTION */}
                <div style={{ padding: '32px', background: '#f8fafc', borderTop: '1px solid #f1f5f9' }}>
                    <button 
                        onClick={handleClose}
                        style={{
                            width: '100%', padding: '20px', borderRadius: '1.5rem',
                            background: '#4f46e5', color: 'white', border: 'none',
                            fontWeight: '950', fontSize: '12px', textTransform: 'uppercase',
                            letterSpacing: '0.1em', boxShadow: '0 15px 30px rgba(79, 70, 229, 0.3)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px'
                        }}
                    >
                        Entendido, continuar <ChevronRight size={18} />
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
                @keyframes slideUp { from { transform: translateY(100px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                @keyframes slideDown { from { transform: translateY(0); opacity: 1; } to { transform: translateY(50px); opacity: 0; } }
                .pr-content-lite img { width: 100%; border-radius: 20px; margin: 15px 0; }
                .pr-content-lite b, .pr-content-lite strong { color: #4f46e5; }
            `}</style>
        </div>
    );
};

export default MobileCommunicationModal;
