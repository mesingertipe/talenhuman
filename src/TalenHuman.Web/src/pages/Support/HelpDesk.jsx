import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Plus, Search, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import Modal from '../../components/Shared/Modal';
import * as signalR from '@microsoft/signalr';

const HelpDesk = ({ user }) => {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hubConnection, setHubConnection] = useState(null);
  
  const messagesEndRef = useRef(null);
  const isSupport = user?.roles?.includes('SuperAdmin') || user?.roles?.includes('Soporte');

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
      .withUrl(import.meta.env.VITE_API_URL + '/hubs/ticket')
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
      const response = await api.get('/api/Tickets');
      setTickets(response.data);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (ticketId) => {
    try {
      const response = await api.get(`/api/Tickets/${ticketId}`);
      setMessages(response.data.messages || []);
      // Also update selected ticket details in case status changed
      setSelectedTicket(prev => ({ ...prev, ...response.data, messages: undefined }));
    } catch (error) {
      console.error('Error fetching ticket details:', error);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      subject: formData.get('subject'),
      description: formData.get('description'),
      priority: parseInt(formData.get('priority'))
    };

    try {
      await api.post('/api/Tickets', data);
      setIsModalOpen(false);
      fetchTickets();
    } catch (error) {
      console.error('Error creating ticket:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedTicket) return;

    try {
      await api.post(`/api/Tickets/${selectedTicket.id}/messages`, { message: newMessage });
      setNewMessage('');
      // SignalR will broadcast the message to this client and append it
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await api.put(`/api/Tickets/${selectedTicket.id}/status`, newStatus, {
        headers: { 'Content-Type': 'application/json' }
      });
      setSelectedTicket(prev => ({ ...prev, status: newStatus }));
      fetchTickets(); // Refresh list to reflect new status
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 0: return <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs flex items-center gap-1"><Clock size={12} /> Abierto</span>;
      case 1: return <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs flex items-center gap-1"><Activity size={12} /> En Progreso</span>;
      case 2: return <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs flex items-center gap-1"><CheckCircle size={12} /> Resuelto</span>;
      case 3: return <span className="px-2 py-1 bg-slate-500/20 text-slate-400 rounded text-xs flex items-center gap-1"><AlertCircle size={12} /> Cerrado</span>;
      default: return null;
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 0: return <span className="text-slate-400 text-xs">Baja</span>;
      case 1: return <span className="text-blue-400 text-xs">Media</span>;
      case 2: return <span className="text-orange-400 text-xs">Alta</span>;
      case 3: return <span className="text-red-400 text-xs font-bold">Crítica</span>;
      default: return null;
    }
  };

  if (loading) return <div className="text-slate-400">Cargando tickets...</div>;

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">
      {/* Sidebar: Ticket List */}
      <div className="w-1/3 bg-slate-800/50 rounded-xl border border-slate-700/50 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-700/50 flex justify-between items-center bg-slate-800">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <MessageSquare className="text-indigo-400" /> Mesa de Ayuda
          </h2>
          {!isSupport && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              title="Nuevo Ticket"
            >
              <Plus size={16} />
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {tickets.map(ticket => (
            <div 
              key={ticket.id} 
              onClick={() => setSelectedTicket(ticket)}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedTicket?.id === ticket.id ? 'bg-indigo-500/10 border-indigo-500/50' : 'bg-slate-900/50 border-slate-700/50 hover:bg-slate-800'}`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-mono text-xs text-indigo-400">{ticket.ticketNumber}</span>
                {getStatusBadge(ticket.status)}
              </div>
              <h4 className="font-medium text-slate-200 text-sm mb-1 truncate">{ticket.subject}</h4>
              <div className="flex justify-between items-center text-xs text-slate-500">
                <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                {getPriorityBadge(ticket.priority)}
              </div>
            </div>
          ))}
          {tickets.length === 0 && (
            <div className="text-center text-slate-500 mt-10">No hay tickets activos</div>
          )}
        </div>
      </div>

      {/* Main Area: Chat/Messages */}
      <div className="flex-1 bg-slate-800/50 rounded-xl border border-slate-700/50 flex flex-col overflow-hidden">
        {selectedTicket ? (
          <>
            <div className="p-4 border-b border-slate-700/50 bg-slate-800 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-white text-lg">{selectedTicket.subject}</h3>
                <div className="flex items-center gap-3 text-sm text-slate-400 mt-1">
                  <span>{selectedTicket.ticketNumber}</span>
                  <span>•</span>
                  <span>Creado por: {selectedTicket.createdByUser?.fullName || 'Usuario'}</span>
                </div>
              </div>
              {isSupport && (
                <div className="flex gap-2">
                  <select 
                    value={selectedTicket.status}
                    onChange={(e) => handleStatusChange(parseInt(e.target.value))}
                    className="bg-slate-900 border border-slate-700 text-white text-sm rounded-lg px-3 py-1.5 focus:border-indigo-500 outline-none"
                  >
                    <option value={0}>Abierto</option>
                    <option value={1}>En Progreso</option>
                    <option value={2}>Resuelto</option>
                    <option value={3}>Cerrado</option>
                  </select>
                </div>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="bg-slate-900/40 p-4 rounded-lg border border-slate-700/30 text-slate-300 text-sm">
                <strong>Descripción original:</strong>
                <p className="mt-2 whitespace-pre-wrap">{selectedTicket.description}</p>
              </div>

              {messages.map((msg, idx) => {
                const isMine = msg.userId === user.id;
                return (
                  <div key={idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] p-3 rounded-lg ${isMine ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-200'}`}>
                      <div className="text-xs opacity-70 mb-1 flex justify-between">
                        <span>{msg.user?.fullName || (msg.isFromSupport ? 'Soporte' : 'Usuario')}</span>
                        <span className="ml-4">{new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                      <div className="whitespace-pre-wrap text-sm">{msg.message}</div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {selectedTicket.status !== 3 && (
              <div className="p-4 border-t border-slate-700/50 bg-slate-800">
                <form onSubmit={handleSendMessage} className="flex gap-3">
                  <input 
                    type="text" 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Escribe un mensaje..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                  <button type="submit" disabled={!newMessage.trim()} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                    <Send size={16} /> Enviar
                  </button>
                </form>
              </div>
            )}
            {selectedTicket.status === 3 && (
              <div className="p-4 border-t border-slate-700/50 bg-slate-900/50 text-center text-slate-400 text-sm">
                Este ticket está cerrado y no admite más respuestas.
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
            <MessageSquare size={48} className="opacity-20 mb-4" />
            <p>Selecciona un ticket para ver los detalles</p>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Crear Ticket de Soporte">
        <form onSubmit={handleCreateTicket} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Asunto</label>
            <input name="subject" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white" required placeholder="Ej: Problema con marcación" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Prioridad</label>
            <select name="priority" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white">
              <option value="0">Baja (Consultas generales)</option>
              <option value="1">Media (Problemas no bloqueantes)</option>
              <option value="2">Alta (Funcionalidad principal afectada)</option>
              <option value="3">Crítica (Sistema caído o bloqueo total)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Descripción</label>
            <textarea name="description" rows={5} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white" required placeholder="Detalla tu problema o consulta..." />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-400 hover:text-white">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2">
              <Send size={16} /> Enviar Ticket
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default HelpDesk;
