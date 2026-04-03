import React from 'react';
import { 
  Info, Calendar, Clock, ChevronRight, 
  Search, Filter, Plus, Inbox 
} from 'lucide-react';
import api from '../../services/api';

const MobileNews = ({ user, theme }) => {
  const [loading, setLoading] = React.useState(true);
  const [news, setNews] = React.useState([]);
  const isDark = theme === 'dark';

  React.useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      try {
        // 💎 ELITE V69: Independent PR Table Connection
        const res = await api.get('/comunicados/my-communications');
        
        // Map ComunicadoDto to the existing UI structure
        const mappedData = res.data.map(c => ({
            id: c.id,
            novedadTipoNombre: 'CORPORATIVO',
            observaciones: c.contenido, // Full HTML
            fechaInicio: c.fechaEnvio,
            status: 1 // Active
        }));
        
        setNews(mappedData || []);
      } catch (err) {
        console.error("Communications Fetch Error", err);
        setNews([]);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  const cardBg = isDark ? 'rgba(15, 23, 42, 0.6)' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)';
  const primaryText = isDark ? '#ffffff' : '#1e293b';
  const mutedText = isDark ? 'rgba(255, 255, 255, 0.4)' : '#64748b';

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid rgba(0,0,0,0.05)', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-5 duration-500">
      
      {/* 🏔️ NATIVE PAGE HEADER */}
      <div style={{ marginBottom: '28px' }}>
         <h1 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px', color: primaryText, margin: 0 }}>Comunicados Elite</h1>
         <p style={{ fontSize: '13px', color: mutedText, marginTop: '4px' }}>Mantente al día con las noticias y anuncios corporativos.</p>
      </div>

      {/* 🔍 SEARCH & FILTER BAR */}
      <div style={{ 
          display: 'flex', gap: '12px', marginBottom: '32px' 
      }}>
         <div style={{ 
            flex: 1, height: '52px', background: cardBg, borderRadius: '18px', 
            border: `1px solid ${cardBorder}`, display: 'flex', alignItems: 'center', padding: '0 16px', gap: '12px' 
         }}>
            <Search size={18} color={mutedText} />
            <input 
                placeholder="Buscar novedad..." 
                style={{ background: 'none', border: 'none', outline: 'none', color: primaryText, fontSize: '14px', width: '100%', fontWeight: '500' }}
            />
         </div>
         <button style={{ 
            width: '52px', height: '52px', background: '#4f46e5', borderRadius: '18px', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', border: 'none', boxShadow: '0 10px 20px rgba(79, 70, 229, 0.2)' 
         }}>
            <Filter size={20} />
         </button>
      </div>

      {/* 📋 NEWS LIST */}
      {news.length > 0 ? (
         <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {news.map((item, idx) => (
               <div 
                 key={idx} 
                 style={{ 
                    background: cardBg, borderRadius: '24px', padding: '20px', 
                    border: `1px solid ${cardBorder}`, display: 'flex', alignItems: 'center', gap: '16px',
                    position: 'relative', transition: 'transform 0.2s', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' 
                 }}
               >
                  <div style={{ 
                      width: '48px', height: '48px', 
                      background: 'rgba(79, 70, 229, 0.05)', 
                      borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5' 
                  }}>
                     <Info size={24} strokeWidth={1.5} />
                  </div>
                  
                  <div style={{ flex: 1, minWidth: 0 }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span style={{ fontSize: '15px', fontWeight: '800', color: primaryText }}>{item.novedadTipoNombre || 'Comunicado'}</span>
                        {item.novedadTipoNombre?.includes('Comunicado') && (
                           <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#4f46e5' }} />
                        )}
                     </div>
                     
                     <div 
                        style={{ 
                          fontSize: '13px', 
                          color: mutedText, 
                          lineHeight: '1.5',
                          maxHeight: '120px',
                          overflow: 'hidden',
                          display: '-webkit-box',
                          WebkitLineClamp: 5,
                          WebkitBoxOrient: 'vertical'
                        }}
                        dangerouslySetInnerHTML={{ __html: item.observaciones || '<span style="opacity:0.5; font-style:italic;">Sin contenido detallado.</span>' }}
                     />
                     
                     <div style={{ display: 'flex', gap: '12px', marginTop: '12px', borderTop: `1px solid ${cardBorder}`, paddingTop: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: item.status === 1 ? '#10b981' : '#f59e0b' }}>
                            <Info size={12} />
                            <span style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase' }}>
                              {item.status === 1 ? 'Vigente' : 'Pendiente'}
                            </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: mutedText }}>
                            <Calendar size={12} />
                            <span style={{ fontSize: '10px', fontWeight: '700' }}>
                              {item.fechaInicio ? new Date(item.fechaInicio).toLocaleDateString() : 'Fecha N/A'}
                            </span>
                        </div>
                     </div>
                  </div>
                  
                  <ChevronRight size={18} color={mutedText} />
               </div>
            ))}
         </div>
      ) : (
         <div style={{ textAlign: 'center', padding: '60px 20px', background: cardBg, borderRadius: '32px', border: `2px dashed ${cardBorder}` }}>
            <Inbox size={48} color={mutedText} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <p style={{ color: primaryText, fontWeight: '700', margin: 0 }}>Sin nuevos comunicados corporativos</p>
            <p style={{ color: mutedText, fontSize: '13px', marginTop: '4px' }}>Todo se ve despejado por aquí ✨</p>
         </div>
      )}

      {/* ➕ FLOATING ACTION BUTTON */}
      <button style={{ 
          position: 'fixed', bottom: '160px', right: '30px', 
          width: '64px', height: '64px', borderRadius: '22px', 
          background: '#4f46e5', color: 'white', display: 'flex', 
          alignItems: 'center', justifyContent: 'center', border: 'none', 
          boxShadow: '0 20px 40px rgba(79, 70, 229, 0.4)', zIndex: 100 
      }}>
         <Plus size={32} strokeWidth={2.5} />
      </button>

    </div>
  );
};

export default MobileNews;
