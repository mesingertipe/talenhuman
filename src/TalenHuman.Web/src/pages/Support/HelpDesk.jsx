import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Plus, Search, CheckCircle, Clock, AlertCircle, Activity, Filter, Ticket as TicketIcon, Paperclip } from 'lucide-react';
import api from '../../services/api';
import Modal from '../../components/Shared/Modal';
import * as signalR from '@microsoft/signalr';
import { useTheme } from '../../context/ThemeContext';

const HelpDesk = ({ user }) => {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const createTicketFileInputRef = useRef(null);
  const [createTicketAttachment, setCreateTicketAttachment] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hubConnection, setHubConnection] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  
  const messagesEndRef = useRef(null);
  const { isDarkMode, activeColors } = useTheme();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  const isSupport = user?.roles?.includes('SuperAdmin') || user?.roles?.includes('Soporte');

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    if (selectedTicket) {
      fetchMessages(selectedTicket.id);
      setupSignalR(selectedTicket.id);
    }
    return () => {
      if (hubConnection) {
        hubConnection.invoke('LeaveTicketRoom', selectedTicket?.id).catch(console.error);
        hubConnection.stop();
      }
    };
  }, [selectedTicket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const setupSignalR = async (ticketId) => {
    if (hubConnection) {
      await hubConnection.stop();
    }

      const newConnection = new signalR.HubConnectionBuilder()
        .withUrl((import.meta.env.VITE_API_URL || '') + '/hubs/ticket')
      .withAutomaticReconnect()
      .build();

    newConnection.on('ReceiveMessage', (message) => {
      setMessages(prev => [...prev, message]);
    });

    try {
      await newConnection.start();
      await newConnection.invoke('JoinTicketRoom', ticketId);
      setHubConnection(newConnection);
    } catch (e) {
      console.error('SignalR Connection Error: ', e);
    }
  };

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await api.get('/Tickets');
      setTickets(response.data);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (ticketId) => {
    try {
      const response = await api.get(`/Tickets/${ticketId}`);
      setMessages(response.data.messages || []);
      setSelectedTicket(prev => ({ ...prev, ...response.data, messages: undefined }));
    } catch (error) {
      console.error('Error fetching ticket details:', error);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (isCreating) return;

    setIsCreating(true);
    const formData = new FormData(e.target);
    const data = {
      subject: formData.get('subject'),
      description: formData.get('description'),
      priority: parseInt(formData.get('priority'))
    };

    try {
      const response = await api.post('/Tickets', data);
      const ticket = response.data;
      
      if (createTicketAttachment) {
        const fileData = new FormData();
        fileData.append('file', createTicketAttachment);
        const res = await api.post('/Files/upload?folder=tickets', fileData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        const attachmentUrl = res.data.url;
        
        await api.post(`/Tickets/${ticket.id}/messages`, { 
          message: 'Archivo adjunto inicial',
          attachmentUrl: attachmentUrl 
        });
      }

      setIsModalOpen(false);
      setCreateTicketAttachment(null);
      fetchTickets();
    } catch (error) {
      console.error('Error creating ticket:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !attachment) || !selectedTicket || uploading) return;

    try {
      setUploading(true);
      let attachmentUrl = null;
      if (attachment) {
        const formData = new FormData();
        formData.append('file', attachment);
        const res = await api.post('/Files/upload?folder=tickets', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        attachmentUrl = res.data.url;
      }

      await api.post(`/Tickets/${selectedTicket.id}/messages`, { 
        message: newMessage,
        attachmentUrl: attachmentUrl 
      });
      setNewMessage('');
      setAttachment(null);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await api.put(`/Tickets/${selectedTicket.id}/status`, newStatus, {
        headers: { 'Content-Type': 'application/json' }
      });
      setSelectedTicket(prev => ({ ...prev, status: newStatus }));
      fetchTickets();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 0: return { label: 'Abierto', color: '#eab308', bg: 'rgba(234, 179, 8, 0.1)', icon: Clock };
      case 1: return { label: 'En Progreso', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)', icon: Activity };
      case 2: return { label: 'Resuelto', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', icon: CheckCircle };
      case 3: return { label: 'Cerrado', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.1)', icon: AlertCircle };
      default: return { label: 'Desconocido', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.1)', icon: AlertCircle };
    }
  };

  const getPriorityConfig = (priority) => {
    switch (priority) {
      case 0: return { label: 'Baja', color: '#94a3b8' };
      case 1: return { label: 'Media', color: '#3b82f6' };
      case 2: return { label: 'Alta', color: '#f97316' };
      case 3: return { label: 'Crítica', color: '#ef4444' };
      default: return { label: 'N/A', color: '#94a3b8' };
    }
  };

  const filteredTickets = statusFilter === 'all' 
    ? tickets 
    : tickets.filter(t => t.status.toString() === statusFilter);

  if (loading && tickets.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ width: '40px', height: '40px', border: `3px solid ${activeColors.border}`, borderTopColor: activeColors.accent, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: '15px', color: activeColors.textMuted, fontWeight: '800', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Cargando Mesa de Ayuda...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 120px)', gap: '25px', animation: 'fadeIn 0.4s ease-out', maxWidth: '1400px', margin: '0 auto', flexDirection: isMobile ? 'column' : 'row' }}>
      
      {/* Sidebar: Ticket List */}
      <div style={{ width: isMobile ? '100%' : '400px', background: activeColors.card, borderRadius: '32px', border: `1px solid ${activeColors.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: isDarkMode ? '0 20px 40px rgba(0,0,0,0.1)' : '0 10px 30px rgba(0,0,0,0.03)', flexShrink: 0, height: isMobile ? (selectedTicket ? '250px' : '100%') : '100%' }}>
        
        {/* Header */}
        <div style={{ padding: '25px', borderBottom: `1px solid ${activeColors.border}`, background: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '950', color: activeColors.textMain, margin: 0, display: 'flex', alignItems: 'center', gap: '10px', letterSpacing: '-0.02em' }}>
              <div style={{ width: '36px', height: '36px', background: activeColors.accent, color: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px rgba(79, 70, 229, 0.25)' }}>
                <TicketIcon size={18} />
              </div>
              Tickets
            </h2>
            {!isSupport && (
              <button 
                onClick={() => setIsModalOpen(true)}
                style={{ width: '36px', height: '36px', background: activeColors.accent, color: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', boxShadow: '0 8px 16px rgba(79, 70, 229, 0.25)', transition: 'transform 0.1s' }}
                onMouseDown={e => e.currentTarget.style.transform = 'scale(0.9)'}
                onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                title="Nuevo Ticket"
              >
                <Plus size={18} />
              </button>
            )}
          </div>
          
          {/* Filters */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '5px' }} className="scrollbar-hide">
            {[
              { id: 'all', label: 'Todos' },
              { id: '0', label: 'Abiertos' },
              { id: '1', label: 'En Progreso' },
              { id: '2', label: 'Resueltos' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                style={{ padding: '8px 16px', borderRadius: '100px', border: `1px solid ${statusFilter === f.id ? activeColors.accent : activeColors.border}`, background: statusFilter === f.id ? activeColors.accent : 'transparent', color: statusFilter === f.id ? 'white' : activeColors.textMuted, fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '15px' }} className="custom-scrollbar">
          {filteredTickets.map(ticket => {
            const isSelected = selectedTicket?.id === ticket.id;
            const statusConfig = getStatusConfig(ticket.status);
            const priorityConfig = getPriorityConfig(ticket.priority);
            const StatusIcon = statusConfig.icon;

            return (
              <div 
                key={ticket.id} 
                onClick={() => setSelectedTicket(ticket)}
                style={{ padding: '20px', borderRadius: '20px', border: `1px solid ${isSelected ? activeColors.accent : activeColors.border}`, background: isSelected ? (isDarkMode ? 'rgba(79, 70, 229, 0.1)' : 'rgba(79, 70, 229, 0.05)') : 'transparent', cursor: 'pointer', marginBottom: '12px', transition: 'all 0.2s', transform: isSelected ? 'scale(1.02)' : 'scale(1)', position: 'relative', overflow: 'hidden' }}
              >
                {isSelected && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: activeColors.accent }} />}
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <span style={{ fontSize: '10px', fontWeight: '950', color: activeColors.accent, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{ticket.ticketNumber}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 8px', background: statusConfig.bg, color: statusConfig.color, borderRadius: '8px', fontSize: '9px', fontWeight: '900', textTransform: 'uppercase' }}>
                    <StatusIcon size={10} /> {statusConfig.label}
                  </div>
                </div>
                
                <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', fontWeight: '800', color: isSelected ? activeColors.textMain : activeColors.textMuted, lineHeight: 1.4 }}>{ticket.subject}</h4>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: activeColors.textMuted }}>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: priorityConfig.color }} />
                    <span style={{ fontSize: '10px', fontWeight: '900', color: priorityConfig.color, textTransform: 'uppercase' }}>{priorityConfig.label}</span>
                  </div>
                </div>
              </div>
            );
          })}
          {filteredTickets.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: activeColors.textMuted }}>
              <div style={{ width: '48px', height: '48px', margin: '0 auto 15px', borderRadius: '50%', border: `1px dashed ${activeColors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                <TicketIcon size={20} />
              </div>
              <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: '800' }}>No hay tickets en esta vista</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Area: Chat/Messages */}
      <div style={{ flex: 1, background: activeColors.card, borderRadius: '32px', border: `1px solid ${activeColors.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: isDarkMode ? '0 20px 40px rgba(0,0,0,0.1)' : '0 10px 30px rgba(0,0,0,0.03)' }}>
        {selectedTicket ? (
          <>
            {/* Chat Header */}
            <div style={{ padding: '25px', borderBottom: `1px solid ${activeColors.border}`, background: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
              <div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: '950', color: activeColors.textMain, margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>{selectedTicket.subject}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', fontSize: '11px', fontWeight: '800', color: activeColors.textMuted, textTransform: 'uppercase' }}>
                  <span style={{ color: activeColors.accent }}>{selectedTicket.ticketNumber}</span>
                  <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: activeColors.border }} />
                  <span>Creado por: {selectedTicket.createdByUser?.fullName || 'Usuario'}</span>
                </div>
              </div>
              
              {isSupport && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '10px', fontWeight: '900', color: activeColors.textMuted, textTransform: 'uppercase' }}>Estado:</span>
                  <select 
                    value={selectedTicket.status}
                    onChange={(e) => handleStatusChange(parseInt(e.target.value))}
                    style={{ background: isDarkMode ? 'rgba(15, 23, 42, 0.6)' : '#f8fafc', border: `1px solid ${activeColors.border}`, color: activeColors.textMain, fontSize: '0.85rem', fontWeight: '800', borderRadius: '12px', padding: '10px 16px', outline: 'none', cursor: 'pointer' }}
                  >
                    <option value={0}>Abierto</option>
                    <option value={1}>En Progreso</option>
                    <option value={2}>Resuelto</option>
                    <option value={3}>Cerrado</option>
                  </select>
                </div>
              )}
            </div>
            
            {/* Chat Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px' }} className="custom-scrollbar">
              
              {/* Original Description */}
              <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '10px' }}>
                <div style={{ maxWidth: '85%', background: isDarkMode ? 'rgba(255,255,255,0.03)' : '#f8fafc', border: `1px solid ${activeColors.border}`, borderRadius: '24px', padding: '20px', borderTopLeftRadius: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: activeColors.border, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '900', color: activeColors.textMain }}>
                      {(selectedTicket.createdByUser?.fullName || 'US').substring(0,2).toUpperCase()}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: '900', color: activeColors.textMain }}>{selectedTicket.createdByUser?.fullName || 'Usuario'}</p>
                      <p style={{ margin: 0, fontSize: '10px', fontWeight: '700', color: activeColors.textMuted }}>{new Date(selectedTicket.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.95rem', color: activeColors.textMuted, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                    {selectedTicket.description}
                  </p>
                </div>
              </div>

              {/* Messages */}
              {messages.map((msg, idx) => {
                const isMine = msg.userId === user.id;
                return (
                  <div key={idx} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', animation: 'fadeInUp 0.3s ease-out' }}>
                    <div style={{ maxWidth: '85%', background: isMine ? activeColors.accent : (isDarkMode ? 'rgba(255,255,255,0.03)' : '#f8fafc'), border: isMine ? 'none' : `1px solid ${activeColors.border}`, borderRadius: '24px', padding: '20px', borderTopRightRadius: isMine ? '4px' : '24px', borderTopLeftRadius: isMine ? '24px' : '4px', color: isMine ? 'white' : activeColors.textMuted, boxShadow: isMine ? '0 10px 20px rgba(79, 70, 229, 0.2)' : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', gap: '20px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: '900' }}>{msg.user?.fullName || (msg.isFromSupport ? 'Soporte V12' : 'Usuario')}</span>
                        <span style={{ fontSize: '10px', fontWeight: '700', opacity: 0.7 }}>{new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                      <div style={{ fontSize: '0.95rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{msg.message}</div>
                      {msg.attachmentUrl && (
                        <div style={{ marginTop: '10px' }}>
                          <a href={msg.attachmentUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: isMine ? 'rgba(255,255,255,0.2)' : (isDarkMode ? 'rgba(255,255,255,0.05)' : '#f1f5f9'), borderRadius: '12px', color: isMine ? 'white' : activeColors.textMain, textDecoration: 'none', fontSize: '0.85rem', fontWeight: '700' }}>
                            <Paperclip size={14} /> Ver Archivo Adjunto
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            {selectedTicket.status !== 3 ? (
              <div style={{ padding: '25px', borderTop: `1px solid ${activeColors.border}`, background: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
                <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    style={{ display: 'none' }} 
                    onChange={(e) => setAttachment(e.target.files[0])}
                  />
                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()}
                    style={{ padding: '16px', background: attachment ? activeColors.accent : 'transparent', color: attachment ? 'white' : activeColors.textMuted, border: `1px solid ${activeColors.border}`, borderRadius: '20px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Paperclip size={18} />
                  </button>
                  <input 
                    type="text" 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={attachment ? `Archivo: ${attachment.name}` : "Escribe una respuesta aquí..."}
                    style={{ flex: 1, background: isDarkMode ? 'rgba(15, 23, 42, 0.6)' : 'white', border: `1px solid ${activeColors.border}`, borderRadius: '20px', padding: '0 25px', color: activeColors.textMain, fontSize: '0.95rem', fontWeight: '600', outline: 'none', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}
                  />
                  <button 
                    type="submit" 
                    disabled={(!newMessage.trim() && !attachment) || uploading} 
                    style={{ padding: '16px 30px', background: activeColors.accent, color: 'white', border: 'none', borderRadius: '20px', fontWeight: '900', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: ((newMessage.trim() || attachment) && !uploading) ? 'pointer' : 'not-allowed', opacity: ((newMessage.trim() || attachment) && !uploading) ? 1 : 0.5, display: 'flex', alignItems: 'center', gap: '10px', boxShadow: (newMessage.trim() || attachment) ? '0 10px 20px rgba(79, 70, 229, 0.3)' : 'none', transition: 'all 0.2s' }}
                  >
                    <Send size={18} /> {uploading ? 'Enviando...' : 'Enviar'}
                  </button>
                </form>
              </div>
            ) : (
              <div style={{ padding: '25px', borderTop: `1px solid ${activeColors.border}`, background: isDarkMode ? 'rgba(239, 68, 68, 0.05)' : 'rgba(239, 68, 68, 0.02)', textAlign: 'center' }}>
                <p style={{ margin: 0, color: '#ef4444', fontSize: '0.85rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                  <AlertCircle size={16} /> Este ticket se encuentra cerrado.
                </p>
              </div>
            )}
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: activeColors.textMuted, padding: '40px', textAlign: 'center' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '25px', border: `1px dashed ${activeColors.border}` }}>
              <MessageSquare size={32} style={{ opacity: 0.5 }} />
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: '950', color: activeColors.textMain, margin: '0 0 10px 0' }}>Soporte Elite V12</h3>
            <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: '600', maxWidth: '300px' }}>Selecciona un ticket en el panel lateral para ver los detalles y conversar con el equipo.</p>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Crear Ticket de Soporte">
        <form onSubmit={handleCreateTicket} style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '10px 0' }}>
          <div>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: '950', color: activeColors.textMuted, textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>Asunto *</label>
            <input name="subject" required placeholder="Ej: Problema con marcación..." style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: `1px solid ${activeColors.border}`, background: isDarkMode ? 'rgba(15, 23, 42, 0.6)' : '#f8fafc', color: activeColors.textMain, fontSize: '0.95rem', fontWeight: '600', outline: 'none' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: '950', color: activeColors.textMuted, textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>Prioridad *</label>
            <select name="priority" required style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: `1px solid ${activeColors.border}`, background: isDarkMode ? 'rgba(15, 23, 42, 0.6)' : '#f8fafc', color: activeColors.textMain, fontSize: '0.95rem', fontWeight: '600', outline: 'none', cursor: 'pointer' }}>
              <option value="0">Baja (Consultas generales)</option>
              <option value="1">Media (Problemas no bloqueantes)</option>
              <option value="2">Alta (Funcionalidad principal afectada)</option>
              <option value="3">Crítica (Sistema caído o bloqueo total)</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: '950', color: activeColors.textMuted, textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>Descripción Detallada *</label>
            <textarea name="description" rows={5} required placeholder="Explícanos tu situación con el mayor detalle posible..." style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: `1px solid ${activeColors.border}`, background: isDarkMode ? 'rgba(15, 23, 42, 0.6)' : '#f8fafc', color: activeColors.textMain, fontSize: '0.95rem', fontWeight: '600', outline: 'none', resize: 'vertical' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: '950', color: activeColors.textMuted, textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>Archivo Adjunto (Opcional)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <input 
                  type="file" 
                  ref={createTicketFileInputRef} 
                  style={{ display: 'none' }} 
                  onChange={(e) => setCreateTicketAttachment(e.target.files[0])}
                />
                <button 
                  type="button" 
                  onClick={() => createTicketFileInputRef.current?.click()}
                  style={{ padding: '12px 20px', background: createTicketAttachment ? activeColors.accent : 'transparent', color: createTicketAttachment ? 'white' : activeColors.textMuted, border: `1px dashed ${activeColors.border}`, borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: '700' }}
                >
                  <Paperclip size={16} /> {createTicketAttachment ? createTicketAttachment.name : 'Subir Archivo'}
                </button>
                {createTicketAttachment && (
                  <button type="button" onClick={() => setCreateTicketAttachment(null)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>Quitar</button>
                )}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', marginTop: '10px', paddingTop: '20px', borderTop: `1px solid ${activeColors.border}` }}>
            <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '12px 24px', borderRadius: '12px', background: 'transparent', color: activeColors.textMuted, border: 'none', fontWeight: '900', fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = activeColors.textMain} onMouseOut={(e) => e.currentTarget.style.color = activeColors.textMuted}>
              Cancelar
            </button>
            <button type="submit" disabled={isCreating} style={{ padding: '12px 24px', borderRadius: '12px', background: activeColors.accent, color: 'white', border: 'none', fontWeight: '900', fontSize: '0.85rem', boxShadow: '0 8px 15px rgba(79, 70, 229, 0.3)', cursor: isCreating ? 'not-allowed' : 'pointer', opacity: isCreating ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '10px', transition: 'transform 0.1s' }} onMouseDown={(e) => { if(!isCreating) e.currentTarget.style.transform = 'scale(0.95)' }} onMouseUp={(e) => { if(!isCreating) e.currentTarget.style.transform = 'scale(1)' }}>
              <Send size={16} /> {isCreating ? 'Enviando...' : 'Enviar Ticket'}
            </button>
          </div>
        </form>
      </Modal>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${activeColors.border};
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${activeColors.textMuted};
        }
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default HelpDesk;
