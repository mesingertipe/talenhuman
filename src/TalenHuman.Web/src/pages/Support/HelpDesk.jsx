import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Plus, Search, CheckCircle, Clock, AlertCircle, Activity, Filter, Ticket as TicketIcon, Paperclip, ArrowLeft, Users, AlertTriangle } from 'lucide-react';
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
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [supportUsers, setSupportUsers] = useState([]); // Agents list
  const typingTimeoutRef = useRef(null);
  
  const messagesEndRef = useRef(null);
  const { isDarkMode, activeColors } = useTheme();
  
  const isSupport = user?.roles?.includes('SuperAdmin') || user?.roles?.includes('Soporte');

  useEffect(() => {
    fetchTickets();
    if (isSupport) {
      fetchSupportUsers();
    }
  }, []);

  const fetchSupportUsers = async () => {
    try {
      const response = await api.get('/Users/support'); // We might need this endpoint, or we just rely on current user for now.
      setSupportUsers(response.data);
    } catch {
      // Fallback if endpoint doesn't exist yet
    }
  };

  useEffect(() => {
    let newConnection = null;
    let isCancelled = false;

    const setupSignalR = async (ticketId) => {
      newConnection = new signalR.HubConnectionBuilder()
        .withUrl((import.meta.env.VITE_API_URL || '') + '/hubs/ticket')
        .withAutomaticReconnect()
        .build();

      newConnection.on('ReceiveMessage', (message) => {
        setMessages(prev => [...prev, message]);
      });

      newConnection.on('UserJoinedRoom', (joinedUserId) => {
        if (joinedUserId !== user?.id) {
          setOnlineUsers(prev => new Set(prev).add(joinedUserId));
          newConnection.invoke('UserJoinedRoom', ticketId, user?.id).catch(() => {});
        }
      });

      newConnection.on('UserLeftRoom', (leftUserId) => {
        setOnlineUsers(prev => {
          const next = new Set(prev);
          next.delete(leftUserId);
          return next;
        });
        setTypingUsers(prev => {
          const next = new Set(prev);
          next.delete(leftUserId);
          return next;
        });
      });

      newConnection.on('OnTyping', (typingUserId, isTyping) => {
        if (typingUserId === user?.id) return;
        setTypingUsers(prev => {
          const next = new Set(prev);
          if (isTyping) next.add(typingUserId);
          else next.delete(typingUserId);
          return next;
        });
      });

      try {
        await newConnection.start();
        if (!isCancelled) {
          await newConnection.invoke('JoinTicketRoom', ticketId, user?.id || 'Unknown');
          setHubConnection(newConnection);
        } else {
          await newConnection.stop();
        }
      } catch (e) {
        if (!isCancelled) console.error('SignalR Connection Error: ', e);
      }
    };

    if (selectedTicket) {
      fetchMessages(selectedTicket.id);
      setupSignalR(selectedTicket.id);
    }
    
    return () => {
      isCancelled = true;
      if (newConnection) {
        if (newConnection.state === signalR.HubConnectionState.Connected) {
          newConnection.invoke('LeaveTicketRoom', selectedTicket?.id, user?.id || 'Unknown').catch(console.error);
        }
        newConnection.stop();
      }
    };
  }, [selectedTicket?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  const handlePriorityChange = async (newPriority) => {
    try {
      await api.put(`/Tickets/${selectedTicket.id}/priority`, newPriority, {
        headers: { 'Content-Type': 'application/json' }
      });
      setSelectedTicket(prev => ({ ...prev, priority: newPriority }));
      fetchTickets();
    } catch (error) {
      console.error('Error updating priority:', error);
    }
  };

  const handleAssignChange = async (newUserId) => {
    try {
      const val = newUserId === '' ? null : `"${newUserId}"`;
      await api.put(`/Tickets/${selectedTicket.id}/assign`, newUserId === '' ? null : newUserId, {
        headers: { 'Content-Type': 'application/json' }
      });
      setSelectedTicket(prev => ({ ...prev, assignedToUserId: newUserId === '' ? null : newUserId }));
      fetchTickets();
    } catch (error) {
      console.error('Error updating assignment:', error);
    }
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 0: return { label: 'Abierto', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)', icon: Clock };
      case 1: return { label: 'En Proceso', color: '#eab308', bg: 'rgba(234, 179, 8, 0.1)', icon: Activity };
      case 2: return { label: 'Resuelto', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', icon: CheckCircle };
      case 3: return { label: 'Cerrado', color: '#64748b', bg: 'rgba(100, 116, 139, 0.1)', icon: AlertCircle };
      default: return { label: 'Desconocido', color: '#64748b', bg: 'rgba(100, 116, 139, 0.1)', icon: AlertCircle };
    }
  };

  const getPriorityConfig = (priority) => {
    switch (priority) {
      case 0: return { label: 'Baja', color: '#94a3b8', bg: '#f1f5f9' };
      case 1: return { label: 'Media', color: '#3b82f6', bg: '#eff6ff' };
      case 2: return { label: 'Alta', color: '#f97316', bg: '#fff7ed' };
      case 3: return { label: 'Crítica', color: '#ef4444', bg: '#fef2f2' };
      default: return { label: 'N/A', color: '#94a3b8', bg: '#f1f5f9' };
    }
  };

  const filteredTickets = statusFilter === 'all' 
    ? tickets 
    : tickets.filter(t => {
        if (statusFilter === 'pending') return t.status === 0 || t.status === 1;
        if (statusFilter === 'resolved') return t.status === 2 || t.status === 3;
        return t.status.toString() === statusFilter;
      });

  const totalTickets = tickets.length;
  const pendingTickets = tickets.filter(t => t.status === 0 || t.status === 1).length;
  const resolvedTickets = tickets.filter(t => t.status === 2 || t.status === 3).length;
  const criticalTickets = tickets.filter(t => t.priority === 3 || t.priority === 2).length;

  if (loading && tickets.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ width: '40px', height: '40px', border: `3px solid ${activeColors.border}`, borderTopColor: activeColors.accent, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: '15px', color: activeColors.textMuted, fontWeight: '800', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Cargando Centro de Soporte...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '0 20px 20px 20px', animation: 'fadeIn 0.4s ease-out', maxWidth: '1400px', margin: '0 auto' }}>
      
      {!selectedTicket ? (
        /* DASHBOARD VIEW */
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <div>
              <h1 style={{ fontSize: '1.8rem', fontWeight: '950', color: activeColors.accent, margin: '0 0 5px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <TicketIcon size={24} /> Centro de Soporte Técnico
              </h1>
              <p style={{ margin: 0, color: activeColors.textMuted, fontSize: '0.95rem', fontWeight: '500' }}>
                Reporta problemas, solicita cambios o realiza preguntas sobre la plataforma.
              </p>
            </div>
            {!isSupport && (
              <button 
                onClick={() => setIsModalOpen(true)}
                style={{ padding: '12px 24px', background: activeColors.accent, color: 'white', borderRadius: '12px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '800', fontSize: '0.9rem', boxShadow: '0 8px 16px rgba(79, 70, 229, 0.25)', transition: 'transform 0.1s' }}
                onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
                onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <Plus size={18} /> Levantar Nuevo Ticket
              </button>
            )}
          </div>

          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '30px' }}>
            <div style={{ background: activeColors.card, border: `1px solid ${activeColors.border}`, borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TicketIcon size={24} />
              </div>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '0.85rem', fontWeight: '700', color: activeColors.textMuted }}>Total Casos</p>
                <h3 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '900', color: activeColors.textMain }}>{totalTickets}</h3>
              </div>
            </div>
            <div style={{ background: activeColors.card, border: `1px solid ${activeColors.border}`, borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(234, 179, 8, 0.1)', color: '#eab308', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={24} />
              </div>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '0.85rem', fontWeight: '700', color: activeColors.textMuted }}>Pendientes / En Proceso</p>
                <h3 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '900', color: activeColors.textMain }}>{pendingTickets}</h3>
              </div>
            </div>
            <div style={{ background: activeColors.card, border: `1px solid ${activeColors.border}`, borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle size={24} />
              </div>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '0.85rem', fontWeight: '700', color: activeColors.textMuted }}>Resueltos / Cerrados</p>
                <h3 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '900', color: activeColors.textMain }}>{resolvedTickets}</h3>
              </div>
            </div>
            <div style={{ background: activeColors.card, border: `1px solid ${activeColors.border}`, borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={24} />
              </div>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '0.85rem', fontWeight: '700', color: activeColors.textMuted }}>Críticos / Alta Prioridad</p>
                <h3 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '900', color: activeColors.textMain }}>{criticalTickets}</h3>
              </div>
            </div>
          </div>

          {/* Table Area */}
          <div style={{ background: activeColors.card, borderRadius: '24px', border: `1px solid ${activeColors.border}`, overflow: 'hidden' }}>
            {/* Table Header Controls */}
            <div style={{ padding: '20px', borderBottom: `1px solid ${activeColors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '900', color: activeColors.textMain, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Activity size={20} color={activeColors.accent} /> Listado de Casos
              </h3>
              
              <div style={{ display: 'flex', gap: '10px', background: isDarkMode ? 'rgba(0,0,0,0.2)' : '#f8fafc', padding: '4px', borderRadius: '12px' }}>
                {[
                  { id: 'all', label: 'Todos' },
                  { id: '0', label: 'Abiertos' },
                  { id: 'pending', label: 'En Proceso' },
                  { id: 'resolved', label: 'Resueltos/Cerrados' }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setStatusFilter(f.id)}
                    style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: statusFilter === f.id ? activeColors.accent : 'transparent', color: statusFilter === f.id ? 'white' : activeColors.textMuted, fontSize: '0.85rem', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s' }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
                <thead>
                  <tr style={{ background: isDarkMode ? 'rgba(255,255,255,0.02)' : '#f8fafc', borderBottom: `1px solid ${activeColors.border}` }}>
                    <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: '900', color: activeColors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Código</th>
                    <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: '900', color: activeColors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Asunto</th>
                    <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: '900', color: activeColors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Empresa / Sede</th>
                    <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: '900', color: activeColors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Creado Por</th>
                    <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: '900', color: activeColors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Prioridad</th>
                    <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: '900', color: activeColors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estado</th>
                    <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: '900', color: activeColors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Asignado A</th>
                    <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: '900', color: activeColors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.map(ticket => {
                    const statusConfig = getStatusConfig(ticket.status);
                    const priorityConfig = getPriorityConfig(ticket.priority);
                    
                    return (
                      <tr key={ticket.id} style={{ borderBottom: `1px solid ${activeColors.border}`, transition: 'background 0.2s', ':hover': { background: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' } }}>
                        <td style={{ padding: '16px 20px', fontSize: '0.85rem', fontWeight: '900', color: activeColors.accent }}>{ticket.ticketNumber}</td>
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ fontSize: '0.9rem', fontWeight: '800', color: activeColors.textMain, marginBottom: '4px', maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ticket.subject}</div>
                          <div style={{ fontSize: '0.75rem', color: activeColors.textMuted, fontWeight: '500' }}>Registrado: {new Date(ticket.createdAt).toLocaleString()}</div>
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: '700', color: activeColors.textMain }}>{ticket.company?.name || '---'}</div>
                          <div style={{ fontSize: '0.75rem', color: activeColors.textMuted, fontWeight: '500' }}>{ticket.createdByUser?.employee?.store?.name || ticket.createdByUser?.supervisorStores?.[0]?.store?.name || '---'}</div>
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: '700', color: activeColors.textMain }}>{ticket.createdByUser?.fullName || 'Usuario'}</div>
                          <div style={{ fontSize: '0.75rem', color: activeColors.textMuted, fontWeight: '500' }}>{ticket.createdByUser?.email || '---'}</div>
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <span style={{ padding: '4px 10px', background: priorityConfig.bg, color: priorityConfig.color, borderRadius: '100px', fontSize: '0.75rem', fontWeight: '800' }}>
                            {priorityConfig.label}
                          </span>
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: statusConfig.bg, color: statusConfig.color, borderRadius: '8px', fontSize: '0.75rem', fontWeight: '900', textTransform: 'uppercase' }}>
                            <statusConfig.icon size={12} /> {statusConfig.label}
                          </span>
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: '600', color: activeColors.textMuted }}>
                            <Users size={14} /> 
                            {isSupport ? (ticket.assignedToUser?.fullName || 'Sin Asignar') : (ticket.assignedToUser ? 'Soporte Técnico' : 'En Espera')}
                          </div>
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                          <button 
                            onClick={() => setSelectedTicket(ticket)}
                            style={{ padding: '8px 16px', background: 'transparent', border: `1px solid ${activeColors.border}`, color: activeColors.textMain, borderRadius: '8px', fontSize: '0.85rem', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s' }}
                          >
                            Entrar / Detalle
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredTickets.length === 0 && (
                    <tr>
                      <td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: activeColors.textMuted, fontWeight: '600' }}>
                        No se encontraron tickets con estos filtros.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* TICKET DETAIL VIEW */
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 140px)' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
            <button 
              onClick={() => setSelectedTicket(null)}
              style={{ width: '40px', height: '40px', borderRadius: '50%', background: activeColors.card, border: `1px solid ${activeColors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: activeColors.textMain, cursor: 'pointer' }}
            >
              <ArrowLeft size={20} />
            </button>
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '950', color: activeColors.textMain, display: 'flex', alignItems: 'center', gap: '10px' }}>
                Ticket {selectedTicket.ticketNumber}: {selectedTicket.subject}
                <span style={{ padding: '4px 8px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '900', textTransform: 'uppercase' }}>Soporte</span>
              </h2>
              <div style={{ fontSize: '0.85rem', color: activeColors.textMuted, fontWeight: '600', marginTop: '4px' }}>
                Levantado por {selectedTicket.createdByUser?.fullName || 'Usuario'} ({selectedTicket.company?.name || 'N/A'}) | {new Date(selectedTicket.createdAt).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Split View */}
          <div style={{ display: 'flex', gap: '25px', flex: 1, overflow: 'hidden' }}>
            
            {/* Left: Chat Thread */}
            <div style={{ flex: 1, background: activeColors.card, borderRadius: '24px', border: `1px solid ${activeColors.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: isDarkMode ? '0 10px 30px rgba(0,0,0,0.1)' : '0 10px 30px rgba(0,0,0,0.03)' }}>
              <div style={{ padding: '20px', borderBottom: `1px solid ${activeColors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isDarkMode ? 'rgba(255,255,255,0.02)' : '#f8fafc' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '900', color: activeColors.textMain, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <MessageSquare size={18} /> Hilo de Discusión
                </h3>
                {onlineUsers.size > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: '800', color: '#10b981' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div>
                    Conectado en vivo
                  </div>
                )}
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px' }} className="custom-scrollbar">
                {/* Original Description as first message */}
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{ maxWidth: '85%', background: isDarkMode ? 'rgba(255,255,255,0.03)' : '#f8fafc', border: `1px solid ${activeColors.border}`, borderRadius: '24px', padding: '20px', borderTopLeftRadius: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: activeColors.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '900', color: 'white' }}>
                        {(selectedTicket.createdByUser?.fullName || 'US').substring(0,2).toUpperCase()}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: '900', color: activeColors.textMain }}>{selectedTicket.createdByUser?.fullName || 'Usuario'}</p>
                        <p style={{ margin: 0, fontSize: '10px', fontWeight: '700', color: activeColors.textMuted }}>{new Date(selectedTicket.createdAt).toLocaleString()} (Creador)</p>
                      </div>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.95rem', color: activeColors.textMuted, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                      {selectedTicket.description}
                    </p>
                  </div>
                </div>

                {/* Messages */}
                {messages.map((msg, idx) => {
                  const isMine = (user?.id && msg.userId?.toLowerCase() === user.id.toLowerCase()) || (msg.user?.fullName === user?.fullName);
                  
                  let senderName = msg.user?.fullName || 'Usuario';
                  if (!isSupport && msg.isFromSupport) {
                    senderName = 'Soporte Técnico';
                  } else if (msg.isFromSupport && !msg.user?.fullName) {
                    senderName = 'Soporte V12';
                  }

                  if (msg.isSystemMessage) {
                    return (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'center', margin: '10px 0' }}>
                        <div style={{ padding: '8px 16px', background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f1f5f9', borderRadius: '100px', fontSize: '0.8rem', fontWeight: '700', color: activeColors.textMuted }}>
                          {msg.message}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={idx} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', animation: 'fadeInUp 0.3s ease-out' }}>
                      <div style={{ maxWidth: '85%', background: isMine ? activeColors.accent : (isDarkMode ? 'rgba(255,255,255,0.03)' : '#f8fafc'), border: isMine ? 'none' : `1px solid ${activeColors.border}`, borderRadius: '24px', padding: '20px', borderTopRightRadius: isMine ? '4px' : '24px', borderTopLeftRadius: isMine ? '24px' : '4px', color: isMine ? 'white' : activeColors.textMuted, boxShadow: isMine ? '0 10px 20px rgba(79, 70, 229, 0.2)' : 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', gap: '20px' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: '900' }}>{isMine ? 'Tú' : senderName}</span>
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

              {/* Typing Indicator */}
              {typingUsers.size > 0 && (
                <div style={{ padding: '0 25px 15px 25px', display: 'flex', alignItems: 'center', gap: '5px', color: activeColors.textMuted, fontSize: '0.75rem', fontWeight: '800', fontStyle: 'italic' }}>
                  <div className="typing-dot" style={{width: '5px', height: '5px', background: activeColors.textMuted, borderRadius: '50%'}}></div>
                  <div className="typing-dot" style={{width: '5px', height: '5px', background: activeColors.textMuted, borderRadius: '50%', animationDelay: '0.2s'}}></div>
                  <div className="typing-dot" style={{width: '5px', height: '5px', background: activeColors.textMuted, borderRadius: '50%', animationDelay: '0.4s'}}></div>
                  <span style={{ marginLeft: '5px' }}>Alguien está escribiendo...</span>
                </div>
              )}

              {/* Chat Input */}
              {selectedTicket.status !== 3 ? (
                <div style={{ padding: '25px', borderTop: `1px solid ${activeColors.border}`, background: isDarkMode ? 'rgba(255,255,255,0.02)' : '#f8fafc' }}>
                  <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={(e) => setAttachment(e.target.files[0])} />
                    <button type="button" onClick={() => fileInputRef.current?.click()} style={{ padding: '16px', background: attachment ? activeColors.accent : 'transparent', color: attachment ? 'white' : activeColors.textMuted, border: `1px solid ${activeColors.border}`, borderRadius: '20px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Paperclip size={18} />
                    </button>
                    <input 
                      type="text" 
                      value={newMessage}
                      onChange={(e) => { 
                        setNewMessage(e.target.value); 
                        if (hubConnection && hubConnection.state === signalR.HubConnectionState.Connected) { 
                          hubConnection.invoke('Typing', selectedTicket.id, user?.id || 'Unknown', true).catch(() => {}); 
                          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current); 
                          typingTimeoutRef.current = setTimeout(() => { hubConnection.invoke('Typing', selectedTicket.id, user?.id || 'Unknown', false).catch(() => {}); }, 2000); 
                        } 
                      }}
                      placeholder={attachment ? `Archivo: ${attachment.name}` : "Escribe un mensaje aquí..."}
                      style={{ flex: 1, background: isDarkMode ? 'rgba(15, 23, 42, 0.6)' : 'white', border: `1px solid ${activeColors.border}`, borderRadius: '20px', padding: '0 25px', color: activeColors.textMain, fontSize: '0.95rem', fontWeight: '600', outline: 'none', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}
                    />
                    <button type="submit" disabled={(!newMessage.trim() && !attachment) || uploading} style={{ padding: '16px 30px', background: activeColors.accent, color: 'white', border: 'none', borderRadius: '20px', fontWeight: '900', fontSize: '0.85rem', textTransform: 'uppercase', cursor: ((newMessage.trim() || attachment) && !uploading) ? 'pointer' : 'not-allowed', opacity: ((newMessage.trim() || attachment) && !uploading) ? 1 : 0.5, display: 'flex', alignItems: 'center', gap: '10px' }}>
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
            </div>

            {/* Right Sidebar: Ticket Info & Management */}
            <div style={{ width: '380px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }} className="custom-scrollbar">
              
              {/* Management Block */}
              <div style={{ background: activeColors.card, borderRadius: '24px', border: `1px solid ${activeColors.border}`, padding: '20px' }}>
                <h4 style={{ margin: '0 0 20px 0', fontSize: '1.05rem', fontWeight: '900', color: activeColors.textMain, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Activity size={18} color={activeColors.accent} /> Gestión e Incidencias (Soporte)
                </h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: '900', color: activeColors.textMuted, textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Estado del Caso</label>
                    <select 
                      value={selectedTicket.status}
                      disabled={!isSupport}
                      onChange={(e) => handleStatusChange(parseInt(e.target.value))}
                      style={{ width: '100%', background: isDarkMode ? 'rgba(15, 23, 42, 0.6)' : '#f8fafc', border: `1px solid ${activeColors.border}`, color: activeColors.textMain, fontSize: '0.9rem', fontWeight: '700', borderRadius: '12px', padding: '12px 16px', outline: 'none', cursor: isSupport ? 'pointer' : 'not-allowed', opacity: isSupport ? 1 : 0.7 }}
                    >
                      <option value={0}>Abierto</option>
                      <option value={1}>En Proceso</option>
                      <option value={2}>Resuelto</option>
                      <option value={3}>Cerrado</option>
                    </select>
                  </div>
                  
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: '900', color: activeColors.textMuted, textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Prioridad</label>
                    <select 
                      value={selectedTicket.priority}
                      disabled={!isSupport}
                      onChange={(e) => handlePriorityChange(parseInt(e.target.value))}
                      style={{ width: '100%', background: isDarkMode ? 'rgba(15, 23, 42, 0.6)' : '#f8fafc', border: `1px solid ${activeColors.border}`, color: activeColors.textMain, fontSize: '0.9rem', fontWeight: '700', borderRadius: '12px', padding: '12px 16px', outline: 'none', cursor: isSupport ? 'pointer' : 'not-allowed', opacity: isSupport ? 1 : 0.7 }}
                    >
                      <option value={0}>Baja</option>
                      <option value={1}>Media</option>
                      <option value={2}>Alta</option>
                      <option value={3}>Crítica</option>
                    </select>
                  </div>

                  {isSupport && (
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: '900', color: activeColors.textMuted, textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Agente Asignado</label>
                      <select 
                        value={selectedTicket.assignedToUserId || ''}
                        onChange={(e) => handleAssignChange(e.target.value)}
                        style={{ width: '100%', background: isDarkMode ? 'rgba(15, 23, 42, 0.6)' : '#f8fafc', border: `1px solid ${activeColors.border}`, color: activeColors.textMain, fontSize: '0.9rem', fontWeight: '700', borderRadius: '12px', padding: '12px 16px', outline: 'none', cursor: 'pointer' }}
                      >
                        <option value="">Sin Asignar</option>
                        {supportUsers.map(su => (
                          <option key={su.id} value={su.id}>{su.fullName}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {!isSupport && (
                    <div style={{ marginTop: '10px' }}>
                      <button style={{ width: '100%', padding: '12px', background: activeColors.accent, color: 'white', border: 'none', borderRadius: '12px', fontWeight: '900', cursor: 'default' }}>Actualizar Caso</button>
                    </div>
                  )}
                </div>
              </div>

              {/* Ticket Details Block */}
              <div style={{ background: activeColors.card, borderRadius: '24px', border: `1px solid ${activeColors.border}`, padding: '20px' }}>
                <h4 style={{ margin: '0 0 20px 0', fontSize: '1.05rem', fontWeight: '900', color: activeColors.textMain, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <AlertCircle size={18} color={activeColors.textMuted} /> Detalles del ticket
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '15px 10px', fontSize: '0.85rem' }}>
                  <span style={{ color: activeColors.textMuted, fontWeight: '700' }}>Tipo:</span>
                  <span style={{ color: activeColors.textMain, fontWeight: '800' }}>Soporte Técnico</span>
                  
                  <span style={{ color: activeColors.textMuted, fontWeight: '700' }}>Prioridad:</span>
                  <span style={{ color: activeColors.textMain, fontWeight: '800' }}>{getPriorityConfig(selectedTicket.priority).label}</span>
                  
                  {(isSupport || selectedTicket.assignedToUser) && (
                    <>
                      <span style={{ color: activeColors.textMuted, fontWeight: '700' }}>Asignado a:</span>
                      <span style={{ color: activeColors.textMain, fontWeight: '800' }}>{isSupport ? (selectedTicket.assignedToUser?.fullName || 'Sin Asignar') : 'Soporte Técnico'}</span>
                    </>
                  )}
                  
                  <span style={{ color: activeColors.textMuted, fontWeight: '700' }}>Empresa:</span>
                  <span style={{ color: activeColors.textMain, fontWeight: '800' }}>{selectedTicket.company?.name || 'N/A'}</span>
                  
                  <span style={{ color: activeColors.textMuted, fontWeight: '700' }}>Creador:</span>
                  <span style={{ color: activeColors.textMain, fontWeight: '800' }}>{selectedTicket.createdByUser?.fullName || 'Usuario'}</span>
                </div>
              </div>

              {/* Traceability Block */}
              <div style={{ background: activeColors.card, borderRadius: '24px', border: `1px solid ${activeColors.border}`, padding: '20px' }}>
                <h4 style={{ margin: '0 0 20px 0', fontSize: '1.05rem', fontWeight: '900', color: activeColors.textMain, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Clock size={18} color={activeColors.textMuted} /> Historial de Trazabilidad
                </h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '7px', top: '5px', bottom: '5px', width: '2px', background: activeColors.border }}></div>
                  
                  {/* Creation event */}
                  <div style={{ display: 'flex', gap: '15px', position: 'relative', zIndex: 1 }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: activeColors.accent, border: `4px solid ${activeColors.card}`, flexShrink: 0, marginTop: '2px' }}></div>
                    <div>
                      <p style={{ margin: '0 0 4px 0', fontSize: '0.85rem', fontWeight: '900', color: activeColors.textMain }}>Creación</p>
                      <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: '600', color: activeColors.textMuted }}>{new Date(selectedTicket.createdAt).toLocaleString()}</p>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', fontWeight: '600', color: activeColors.textMuted }}>Ticket creado por {selectedTicket.createdByUser?.fullName}</p>
                    </div>
                  </div>

                  {/* System Messages Event */}
                  {messages.filter(m => m.isSystemMessage).map((msg, idx) => (
                    <div key={`sys-${idx}`} style={{ display: 'flex', gap: '15px', position: 'relative', zIndex: 1 }}>
                      <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#3b82f6', border: `4px solid ${activeColors.card}`, flexShrink: 0, marginTop: '2px' }}></div>
                      <div>
                        <p style={{ margin: '0 0 4px 0', fontSize: '0.85rem', fontWeight: '900', color: activeColors.textMain }}>Actualización</p>
                        <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: '600', color: activeColors.textMuted }}>{new Date(msg.createdAt).toLocaleString()}</p>
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', fontWeight: '600', color: activeColors.textMuted }}>{msg.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Creation Modal (same as before) */}
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
                <input type="file" ref={createTicketFileInputRef} style={{ display: 'none' }} onChange={(e) => setCreateTicketAttachment(e.target.files[0])} />
                <button type="button" onClick={() => createTicketFileInputRef.current?.click()} style={{ padding: '12px 20px', background: createTicketAttachment ? activeColors.accent : 'transparent', color: createTicketAttachment ? 'white' : activeColors.textMuted, border: `1px dashed ${activeColors.border}`, borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: '700' }}>
                  <Paperclip size={16} /> {createTicketAttachment ? createTicketAttachment.name : 'Subir Archivo'}
                </button>
                {createTicketAttachment && (
                  <button type="button" onClick={() => setCreateTicketAttachment(null)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>Quitar</button>
                )}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', marginTop: '10px', paddingTop: '20px', borderTop: `1px solid ${activeColors.border}` }}>
            <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '12px 24px', borderRadius: '12px', background: 'transparent', color: activeColors.textMuted, border: 'none', fontWeight: '900', fontSize: '0.85rem', cursor: 'pointer' }}>
              Cancelar
            </button>
            <button type="submit" disabled={isCreating} style={{ padding: '12px 24px', borderRadius: '12px', background: activeColors.accent, color: 'white', border: 'none', fontWeight: '900', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
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
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .typing-dot {
          animation: bounce 1s infinite;
        }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: ${activeColors.border}; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: ${activeColors.textMuted}; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default HelpDesk;
