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
      setMessages(prev => [...prev, { role: 'assistant', text: 'Disculpa, tuve un problema procesando tu solicitud.' }]);
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
        className={`fixed bottom-6 right-6 p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 z-[9000] ${
          isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
        }`}
        style={{
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        <Sparkles size={28} />
      </button>

      {/* Ventana de Chat */}
      <div
        className={`fixed bottom-6 right-6 flex flex-col shadow-2xl transition-all duration-300 z-[9000] overflow-hidden ${
          isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'
        } ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}
        style={{
          width: '380px',
          height: '600px',
          maxHeight: '80vh',
          borderRadius: '24px',
          borderWidth: '1px',
          transformOrigin: 'bottom right',
        }}
      >
        {/* Cabecera */}
        <div 
          className="flex justify-between items-center p-4 text-white"
          style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}
        >
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">TalentIA</h3>
              <p className="text-xs opacity-80 font-medium">Tu Asistente Operativo</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
                onClick={clearChat} 
                disabled={isClearing}
                className="hover:bg-white/20 p-2 rounded-full transition-colors border-none bg-transparent text-white cursor-pointer"
                title="Limpiar chat"
            >
                <MessageSquare size={20} />
            </button>
            <button 
              onClick={() => setIsOpen(false)} 
              className="hover:bg-white/20 p-2 rounded-full transition-colors border-none bg-transparent text-white cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Mensajes */}
        <div className={`flex-1 overflow-y-auto p-4 flex flex-col gap-4 ${isDarkMode ? 'custom-scrollbar' : ''}`}>
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                  msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-sm' 
                    : isDarkMode 
                      ? 'bg-slate-800 text-white rounded-tl-sm border border-slate-700' 
                      : 'bg-slate-100 text-slate-800 rounded-tl-sm border border-slate-200'
                }`}
                style={{ lineHeight: '1.5' }}
              >
                {formatText(msg.text)}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className={`px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1 ${
                isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-slate-100 border border-slate-200'
              }`}>
                <div className="flex gap-1 items-center h-4">
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Sugerencias */}
        {suggestions.length > 0 && !isLoading && (
          <div className={`px-4 pb-2 flex gap-2 overflow-x-auto custom-scrollbar ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
            {suggestions.map((sug, i) => (
              <button
                key={i}
                onClick={() => sendMessage(sug)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer border transition-colors flex-shrink-0 ${
                  isDarkMode 
                    ? 'bg-slate-800 border-indigo-500/30 text-indigo-300 hover:bg-slate-700' 
                    : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                }`}
              >
                {sug}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className={`p-3 border-t ${isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
          <form 
            onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pregúntale a TalentIA..."
              disabled={isLoading}
              className={`flex-1 px-4 py-2 rounded-xl text-sm outline-none border focus:border-indigo-500 transition-colors ${
                isDarkMode 
                  ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400' 
                  : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
              }`}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className={`p-2 rounded-xl border-none cursor-pointer flex items-center justify-center transition-colors ${
                !input.trim() || isLoading
                  ? isDarkMode ? 'bg-slate-800 text-slate-600' : 'bg-slate-100 text-slate-400'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-500/20'
              }`}
              style={{ width: '42px', height: '42px' }}
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </>
  );

  return createPortal(chatWidget, document.body);
};

export default TalentIAChat;
