import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { MessageSquare, X, Send, Loader2, Sparkles } from 'lucide-react';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

const TalentIAChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [isClearing, setIsClearing] = useState(false);
  const messagesEndRef = useRef(null);
  const { isDarkMode } = useTheme();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      initChat();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const initChat = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/aichat/init');
      
      const historyMsg = res.data.history?.map(h => ({ role: h.role, text: h.text })) || [];
      if (historyMsg.length === 0) {
          setMessages([{ role: 'assistant', text: res.data.greeting }]);
      } else {
          setMessages(historyMsg);
      }
      
      setSuggestions(res.data.suggestions || []);
    } catch (error) {
      setMessages([{ role: 'assistant', text: 'Hola, soy TalentIA. Parece que hay un problema de conexión temporal.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    
    setMessages(prev => [...prev, { role: 'user', text }]);
    setInput('');
    setIsLoading(true);
    setSuggestions([]); // Ocultar sugerencias tras preguntar

    try {
      const res = await api.post('/aichat/send', { message: text });
      setMessages(prev => [...prev, { role: 'assistant', text: res.data.response }]);
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Disculpa, tuve un problema procesando tu solicitud.';
      setMessages(prev => [...prev, { role: 'assistant', text: errorMsg }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = async () => {
    if (!window.confirm("¿Estás seguro de limpiar tu conversación actual con TalentIA?")) return;
    try {
        setIsClearing(true);
        await api.delete('/aichat/clear');
        setMessages([]);
        initChat();
    } catch(err) {
        console.error(err);
    } finally {
        setIsClearing(false);
    }
  };

  const formatText = (text) => {
    return text.split('\n').map((str, index) => (
      <span key={index}>
        {str}
        <br />
      </span>
    ));
  };

  const chatWidget = (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setIsOpen(true)}
        className="z-50"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #0066FF 0%, #4f46e5 100%)',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          boxShadow: '0 10px 25px rgba(0, 102, 255, 0.4)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isOpen ? 'scale(0)' : 'scale(1)',
          opacity: isOpen ? 0 : 1,
          zIndex: 99999
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = isOpen ? 'scale(0)' : 'scale(1.1)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = isOpen ? 'scale(0)' : 'scale(1)'}
      >
        <Sparkles size={28} />
      </button>

      {/* Ventana de Chat */}
      <div
        className={isDarkMode ? 'dark' : ''}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '380px',
          height: '600px',
          maxHeight: '85vh',
          backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
          borderRadius: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          transformOrigin: 'bottom right',
          transform: isOpen ? 'scale(1) translateY(0)' : 'scale(0.8) translateY(20px)',
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          border: isDarkMode ? '1px solid #334155' : '1px solid #e2e8f0',
        }}
      >
        {/* Cabecera */}
        <div 
          style={{ 
            background: 'linear-gradient(135deg, #0066FF 0%, #4f46e5 100%)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem',
            color: 'white'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '0.5rem', borderRadius: '50%', backdropFilter: 'blur(4px)' }}>
              <Sparkles size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontWeight: 'bold', fontSize: '1.125rem', lineHeight: '1.2' }}>TalentIA</h3>
              <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.8, fontWeight: 500 }}>Tu Asistente Operativo</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
                onClick={clearChat} 
                disabled={isClearing}
                style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: '0.5rem', borderRadius: '50%', display: 'flex' }}
                title="Limpiar chat"
            >
                <MessageSquare size={20} />
            </button>
            <button 
              onClick={() => setIsOpen(false)} 
              style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: '0.5rem', borderRadius: '50%', display: 'flex' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Mensajes */}
        <div 
          className={isDarkMode ? 'custom-scrollbar' : ''}
          style={{ 
            flex: 1, 
            overflowY: 'auto', 
            padding: '1rem', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '1rem' 
          }}
        >
          {messages.map((msg, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div 
                style={{ 
                  maxWidth: '85%', 
                  padding: '0.75rem', 
                  fontSize: '0.875rem',
                  lineHeight: '1.5',
                  backgroundColor: msg.role === 'user' ? '#0066FF' : (isDarkMode ? '#0f172a' : '#f1f5f9'),
                  color: msg.role === 'user' ? 'white' : (isDarkMode ? 'white' : '#1e293b'),
                  border: msg.role === 'user' ? 'none' : (isDarkMode ? '1px solid #334155' : '1px solid #e2e8f0'),
                  borderRadius: msg.role === 'user' ? '16px 16px 0px 16px' : '16px 16px 16px 0px'
                }}
              >
                {formatText(msg.text)}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{ 
                padding: '0.75rem 1rem', 
                backgroundColor: isDarkMode ? '#0f172a' : '#f1f5f9',
                border: isDarkMode ? '1px solid #334155' : '1px solid #e2e8f0',
                borderRadius: '16px 16px 16px 0px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center', height: '16px' }}>
                  <div style={{ width: '6px', height: '6px', backgroundColor: '#0066FF', borderRadius: '50%', animation: 'bounce 1s infinite 0ms' }}></div>
                  <div style={{ width: '6px', height: '6px', backgroundColor: '#0066FF', borderRadius: '50%', animation: 'bounce 1s infinite 150ms' }}></div>
                  <div style={{ width: '6px', height: '6px', backgroundColor: '#0066FF', borderRadius: '50%', animation: 'bounce 1s infinite 300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Sugerencias */}
        {suggestions.length > 0 && !isLoading && (
          <div 
            style={{ 
              padding: '0 1rem 0.5rem 1rem', 
              display: 'flex', 
              flexDirection: 'column',
              gap: '0.5rem'
            }}
          >
            {suggestions.map((sug, i) => (
              <button
                key={i}
                onClick={() => sendMessage(sug)}
                style={{
                  padding: '0.6rem 0.8rem',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  textAlign: 'left',
                  cursor: 'pointer',
                  border: isDarkMode ? '1px solid rgba(0, 102, 255, 0.3)' : '1px solid #bfdbfe',
                  backgroundColor: isDarkMode ? '#0f172a' : '#eff6ff',
                  color: isDarkMode ? '#60a5fa' : '#1d4ed8',
                  width: '100%',
                  lineHeight: '1.4'
                }}
              >
                {sug}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div style={{ 
          padding: '0.75rem', 
          borderTop: isDarkMode ? '1px solid #334155' : '1px solid #e2e8f0',
          backgroundColor: isDarkMode ? '#0f172a' : 'white' 
        }}>
          <form 
            onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
            style={{ display: 'flex', gap: '0.5rem' }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pregúntale a TalentIA..."
              disabled={isLoading}
              style={{
                flex: 1,
                padding: '0.5rem 1rem',
                borderRadius: '12px',
                fontSize: '0.875rem',
                outline: 'none',
                border: isDarkMode ? '1px solid #475569' : '1px solid #e2e8f0',
                backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc',
                color: isDarkMode ? 'white' : '#1e293b',
                marginTop: 0
              }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              style={{
                padding: '0.5rem',
                borderRadius: '12px',
                border: 'none',
                cursor: (!input.trim() || isLoading) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '42px',
                height: '42px',
                backgroundColor: (!input.trim() || isLoading) ? (isDarkMode ? '#334155' : '#f1f5f9') : '#0066FF',
                color: (!input.trim() || isLoading) ? (isDarkMode ? '#94a3b8' : '#94a3b8') : 'white',
                boxShadow: (!input.trim() || isLoading) ? 'none' : '0 4px 12px rgba(0, 102, 255, 0.3)'
              }}
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
      <style>
        {`
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-4px); }
          }
        `}
      </style>
    </>
  );

  return createPortal(chatWidget, document.body);
};

export default TalentIAChat;
