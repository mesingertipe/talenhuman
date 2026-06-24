import React, { useState, useEffect } from 'react';
import { 
  Clock, ArrowUpRight, ArrowDownLeft, MapPin, 
  ChevronLeft, ChevronRight, 
  CalendarDays, CalendarRange, ListTodo, Sparkles 
} from 'lucide-react';
import { formatDate } from '../../utils/formatters';
import { formatTenantDate } from '../../utils/localization';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

// 🛡️ Helper to prevent timezone shifting for "pure" local dates from API
const parsePureDate = (dateStr) => {
    if (!dateStr) return null;
    if (typeof dateStr === 'string' && dateStr.includes('T') && !dateStr.includes('Z') && !dateStr.includes('+')) {
        const [datePart, timePart] = dateStr.split('T');
        const [y, m, d] = datePart.split('-').map(Number);
        const [hh, mm, ss] = timePart.split(':').map(Number);
        return new Date(y, m - 1, d, hh, mm, ss || 0);
    }
    return new Date(dateStr);
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const MobileAttendance = ({ user }) => {
  const { isDarkMode } = useTheme();
  const isDark = isDarkMode;
  const [view, setView] = useState('day'); // 'day', 'week', 'month'
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  const [storeSettings, setStoreSettings] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [clockLoading, setClockLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [geoPermission, setGeoPermission] = useState('prompt'); // 'prompt', 'granted', 'denied', 'unsupported'
  const [coords, setCoords] = useState(null);
  const [accuracy, setAccuracy] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  useEffect(() => {
    fetchStoreSettings();
  }, []);

  const updateLocation = () => {
    if (!navigator.geolocation) {
      setGeoPermission('unsupported');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        setGeoPermission('granted');
        setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setAccuracy(pos.coords.accuracy);
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoPermission('denied');
        } else {
          showToast("Error de GPS: " + err.message, "error");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    if (storeSettings?.mobileClockEnabled) {
      if (navigator.permissions && navigator.permissions.query) {
        navigator.permissions.query({ name: 'geolocation' }).then(status => {
          setGeoPermission(status.state);
          status.onchange = () => {
            setGeoPermission(status.state);
            if (status.state === 'granted') {
              updateLocation();
            }
          };
        }).catch(() => {});
      }
      updateLocation();
    }
  }, [storeSettings]);

  const fetchStoreSettings = async () => {
    try {
      const res = await api.get('/attendance/my-store-settings');
      setStoreSettings(res.data);
    } catch (err) {
      console.error("Error fetching store settings", err);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [view, currentDate]);

  const handleMobileClock = () => {
    if (!navigator.geolocation) {
      showToast("Tu dispositivo no soporta geolocalización.", "error");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setIsLocating(false);
        setCoords({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        setAccuracy(position.coords.accuracy);
        setGeoPermission('granted');

        setClockLoading(true);
        try {
          const payload = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };

          const res = await api.post('/attendance/mobile-clock', payload);
          
          if (navigator.vibrate) {
             navigator.vibrate([100, 50, 100]);
          }

          showToast(res.data.message || "Marcación registrada con éxito.", "success");
          fetchAttendance();
        } catch (err) {
          console.error("Mobile clock error", err);
          const errorMsg = err.response?.data?.message || err.response?.data || "Error al registrar la asistencia.";
          showToast(errorMsg, "error");
        } finally {
          setClockLoading(false);
        }
      },
      (error) => {
        setIsLocating(false);
        console.error("Geolocation error", error);
        let msg = "No se pudo obtener tu ubicación. Por favor, activa el GPS.";
        if (error.code === error.PERMISSION_DENIED) {
          setGeoPermission('denied');
          msg = "Permiso denegado. Activa el acceso al GPS en la configuración de tu navegador o celular.";
        }
        showToast(msg, "error");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      let start, end;
      const d = new Date(currentDate);
      
      if (view === 'day') {
        start = new Date(d.setHours(0,0,0,0)).toISOString();
        end = new Date(d.setHours(23,59,59,999)).toISOString();
      } else if (view === 'week') {
        const startOfWeek = new Date(d);
        const day = d.getDay();
        const offset = day === 0 ? 6 : day - 1; // MON=0, SUN=6
        startOfWeek.setDate(d.getDate() - offset);
        startOfWeek.setHours(0,0,0,0);
        start = startOfWeek.toISOString();

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23,59,59,999);
        end = endOfWeek.toISOString();
      } else {
        start = new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
        end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).toISOString();
      }

      const res = await api.get('/attendance/my-attendance', { params: { start, end } });
      setData(res.data);
    } catch (err) {
      console.error("Fetch attendance error", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrev = () => {
    const d = new Date(currentDate);
    if (view === 'day') d.setDate(d.getDate() - 1);
    else if (view === 'week') d.setDate(d.getDate() - 7);
    else d.setMonth(d.getMonth() - 1);
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (view === 'day') d.setDate(d.getDate() + 1);
    else if (view === 'week') d.setDate(d.getDate() + 7);
    else d.setMonth(d.getMonth() + 1);
    setCurrentDate(d);
  };

  const formatDateLabel = () => {
    if (view === 'day') return currentDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    if (view === 'week') {
      const startOfWeek = new Date(currentDate);
      const day = currentDate.getDay();
      const offset = day === 0 ? 6 : day - 1; 
      startOfWeek.setDate(currentDate.getDate() - offset);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      const options = { month: 'short' };
      if (startOfWeek.getMonth() !== endOfWeek.getMonth()) {
         return `${startOfWeek.getDate()} ${startOfWeek.toLocaleDateString('es-ES', options)} - ${endOfWeek.getDate()} ${endOfWeek.toLocaleDateString('es-ES', options)}`;
      }
      return `${startOfWeek.getDate()} - ${endOfWeek.getDate()} ${endOfWeek.toLocaleDateString('es-ES', options)}`;
    }
    return currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  };

  // Premium Visual Tokens
  const primaryText = isDark ? '#ffffff' : '#1e293b';
  const mutedText = isDark ? 'rgba(255, 255, 255, 0.45)' : '#64748b';
  const cardBg = isDark ? 'rgba(30, 41, 59, 0.4)' : 'rgba(255, 255, 255, 0.8)';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)';
  const glassEffect = { backdropFilter: 'blur(20px)', border: `1px solid ${cardBorder}` };
  const shadow = isDark ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' : '0 20px 40px rgba(0, 0, 0, 0.06)';

  const currentDistance = coords && storeSettings?.latitude && storeSettings?.longitude
    ? calculateDistance(coords.latitude, coords.longitude, storeSettings.latitude, storeSettings.longitude)
    : null;

  const isWithinGeofence = currentDistance !== null && storeSettings?.geofenceRadius !== null
    ? currentDistance <= storeSettings.geofenceRadius
    : false;

  return (
    <div style={{ paddingBottom: '100px' }} className="animate-in fade-in slide-in-from-right-10 duration-700 no-select">
      
      {/* 🏔️ PREMIUM HEADER */}
      <div style={{ padding: '24px 8px 32px' }}>
         <h2 style={{ fontSize: '32px', fontWeight: '950', letterSpacing: '-1.5px', color: primaryText, margin: 0 }}>Mi Actividad</h2>
         <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
            <Sparkles size={12} color="#10b981" />
            <p style={{ color: mutedText, fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: '10px', margin: 0 }}>Historial Biometrizado</p>
         </div>

         {/* 📅 VIEW SWITCHER */}
         <div style={{ 
            display: 'flex', background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', 
            padding: '6px', borderRadius: '24px', marginTop: '24px', gap: '4px' 
         }}>
            <TabButton active={view === 'day'} onClick={() => setView('day')} label="Día" isDark={isDark} color="#10b981" />
            <TabButton active={view === 'week'} onClick={() => setView('week')} label="Semana" isDark={isDark} color="#10b981" />
            <TabButton active={view === 'month'} onClick={() => setView('month')} label="Mes" isDark={isDark} color="#10b981" />
         </div>
      </div>

      {/* 📍 ASISTENCIA MÓVIL (GEOFENCING CARD) */}
      {storeSettings?.mobileClockEnabled && (
        <div style={{ 
          margin: '0 8px 32px', padding: '32px', borderRadius: '48px',
          background: cardBg, ...glassEffect, boxShadow: shadow,
          display: 'flex', flexDirection: 'column', gap: '24px',
          position: 'relative', overflow: 'hidden'
        }}>
          {/* Header of Geofence Card */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ 
                width: '44px', height: '44px', borderRadius: '16px', 
                background: 'rgba(16, 185, 129, 0.1)', display: 'flex', 
                alignItems: 'center', justifyContent: 'center', color: '#10b981' 
              }}>
                <MapPin size={20} />
              </div>
              <div>
                <p style={{ fontSize: '15px', fontWeight: '900', color: primaryText, margin: 0 }}>
                  Asistencia Móvil
                </p>
                <p style={{ fontSize: '10px', fontWeight: '800', color: mutedText, textTransform: 'uppercase', margin: 0 }}>
                  Sede: {storeSettings.storeName}
                </p>
              </div>
            </div>
            {geoPermission !== 'denied' && coords && (
              <button 
                onClick={updateLocation} 
                disabled={isLocating || clockLoading}
                style={{
                  background: 'none', border: 'none', color: '#10b981', 
                  fontSize: '11px', fontWeight: '900', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px',
                  opacity: isLocating ? 0.5 : 1
                }}
              >
                <span className={isLocating ? 'animate-spin' : ''} style={{ display: 'inline-block' }}>🔄</span>
                {isLocating ? 'Ubicando...' : 'Actualizar'}
              </button>
            )}
          </div>

          {/* Conditional Geofence Content */}
          {geoPermission === 'denied' ? (
            <div style={{ 
              background: 'rgba(239, 68, 68, 0.08)', borderRadius: '28px', 
              padding: '24px', border: '1px solid rgba(239, 68, 68, 0.15)',
              display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'center', textAlign: 'center'
            }}>
              <span style={{ fontSize: '32px' }}>📍❌</span>
              <div>
                <p style={{ fontSize: '13px', fontWeight: '900', color: '#ef4444', margin: '0 0 6px' }}>
                  GPS Bloqueado o Denegado
                </p>
                <p style={{ fontSize: '11px', fontWeight: '700', color: mutedText, margin: 0, lineHeight: '1.5' }}>
                  Para registrar tu asistencia, debes permitir el acceso al GPS. Revisa los permisos en la barra de direcciones o la configuración del navegador.
                </p>
              </div>
              <button 
                onClick={updateLocation}
                style={{
                  background: '#ef4444', color: '#ffffff', border: 'none',
                  borderRadius: '16px', padding: '10px 20px', fontSize: '12px',
                  fontWeight: '900', cursor: 'pointer', boxShadow: '0 4px 12px rgba(239,68,68,0.2)'
                }}
              >
                Reintentar Ubicación
              </button>
            </div>
          ) : isLocating && !coords ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '24px 0' }}>
              <div style={{ width: '32px', height: '32px', border: '3px solid #10b981', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              <p style={{ fontSize: '12px', fontWeight: '800', color: mutedText, margin: 0 }}>
                Obteniendo ubicación del satélite...
              </p>
            </div>
          ) : coords ? (
            <>
              {/* Range Status Circle */}
              <div style={{ 
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
                background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                padding: '24px', borderRadius: '32px', border: `1px solid ${cardBorder}`
              }}>
                <div style={{ 
                  width: '16px', height: '16px', borderRadius: '50%',
                  background: isWithinGeofence ? '#10b981' : '#f59e0b',
                  boxShadow: isWithinGeofence ? '0 0 0 8px rgba(16, 185, 129, 0.15)' : '0 0 0 8px rgba(245, 158, 11, 0.15)',
                  animation: 'pulse-slow 2s infinite'
                }} />
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '16px', fontWeight: '950', color: primaryText, margin: '0 0 4px' }}>
                    {isWithinGeofence ? 'Dentro del Rango' : 'Fuera de Rango'}
                  </p>
                  <p style={{ fontSize: '12px', fontWeight: '800', color: mutedText, margin: 0 }}>
                    Distancia actual: <strong style={{ color: isWithinGeofence ? '#10b981' : '#f59e0b' }}>{currentDistance.toFixed(1)}m</strong> (Permitido: {storeSettings.geofenceRadius}m)
                  </p>
                </div>
              </div>

              {/* Accuracy warning if > 50 meters */}
              {accuracy > 50 && (
                <div style={{ 
                  background: 'rgba(245, 158, 11, 0.08)', borderRadius: '24px', 
                  padding: '16px 20px', border: '1px solid rgba(245, 158, 11, 0.15)',
                  display: 'flex', alignItems: 'flex-start', gap: '10px'
                }}>
                  <span style={{ fontSize: '16px', marginTop: '-2px' }}>⚠️</span>
                  <p style={{ fontSize: '10px', fontWeight: '700', color: '#f59e0b', margin: 0, lineHeight: '1.4' }}>
                    Precisión del GPS baja ({accuracy.toFixed(0)}m). Intenta salir a un espacio abierto o activar tu Wi-Fi para que el satélite te localice mejor.
                  </p>
                </div>
              )}

              {/* Check-In / Check-Out Button */}
              <button
                onClick={handleMobileClock}
                disabled={!isWithinGeofence || clockLoading}
                style={{
                  width: '100%',
                  padding: '18px',
                  borderRadius: '24px',
                  border: 'none',
                  background: isWithinGeofence 
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                    : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'),
                  color: isWithinGeofence ? '#ffffff' : mutedText,
                  fontSize: '14px',
                  fontWeight: '950',
                  letterSpacing: '0.5px',
                  cursor: isWithinGeofence ? 'pointer' : 'not-allowed',
                  boxShadow: isWithinGeofence ? '0 10px 25px rgba(16,185,129,0.3)' : 'none',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px'
                }}
              >
                {clockLoading ? (
                  <div style={{ width: '20px', height: '20px', border: '3px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                ) : (
                  <>
                    <Clock size={18} />
                    <span>Registrar Marcación</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '24px 0' }}>
              <button 
                onClick={updateLocation}
                style={{
                  background: '#10b981', color: '#ffffff', border: 'none',
                  borderRadius: '16px', padding: '12px 24px', fontSize: '13px',
                  fontWeight: '900', cursor: 'pointer', boxShadow: '0 4px 12px rgba(16,185,129,0.2)'
                }}
              >
                Activar GPS para Registrar Asistencia
              </button>
            </div>
          )}
        </div>
      )}

      {/* 📅 DATE SELECTOR */}
      <div style={{ 
          margin: '0 8px 32px', padding: '20px 24px', borderRadius: '32px',
          background: cardBg, ...glassEffect, boxShadow: shadow,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
         <button onClick={handlePrev} style={navButtonStyle}><ChevronLeft size={24} /></button>
         <p style={{ fontSize: '15px', fontWeight: '900', color: primaryText, margin: 0, textTransform: 'capitalize' }}>{formatDateLabel()}</p>
         <button onClick={handleNext} style={navButtonStyle}><ChevronRight size={24} /></button>
      </div>

      {/* 📜 ACTIVITY LIST */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '0 8px' }}>
        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center' }}>
            <div style={{ width: '40px', height: '40px', border: '4px solid #10b981', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
          </div>
        ) : data.filter(item => view !== 'day' || (parsePureDate(item.clockIn || (item.shift ? item.shift.startTime : null))?.toDateString() === currentDate.toDateString())).length > 0 ? (
          data
            .filter(item => view !== 'day' || (parsePureDate(item.clockIn || (item.shift ? item.shift.startTime : null))?.toDateString() === currentDate.toDateString()))
            .map((item, idx) => (
            <AttendanceCard key={idx} item={item} isDark={isDark} primaryText={primaryText} mutedText={mutedText} cardBg={cardBg} glassEffect={glassEffect} shadow={shadow} cardBorder={cardBorder} parsePureDate={parsePureDate} />
          ))
        ) : (
          <div style={{ background: cardBg, borderRadius: '48px', padding: '64px 32px', ...glassEffect, boxShadow: shadow, textAlign: 'center' }}>
             <ListTodo size={32} color={mutedText} style={{ marginBottom: '16px' }} />
             <p style={{ fontSize: '16px', fontWeight: '900', color: primaryText, margin: '0 0 8px' }}>Sin registros en este periodo</p>
          </div>
        )}
      </div>

      {toast.show && (
        <div style={{
            position: 'fixed', bottom: '90px', left: '50%', transform: 'translateX(-50%)',
            background: toast.type === 'success' ? 'rgba(16, 185, 129, 0.95)' : 'rgba(239, 68, 68, 0.95)',
            color: 'white', padding: '14px 28px', borderRadius: '24px', zIndex: 99999,
            display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
            fontSize: '13px', fontWeight: '900', backdropFilter: 'blur(10px)', width: '90%', maxWidth: '380px'
        }}>
            <span>{toast.message}</span>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .animate-spin { display: inline-block; animation: spin 1s linear infinite; }
        @keyframes pulse-slow {
           0%, 100% { opacity: 1; transform: scale(1); }
           50% { opacity: 0.8; transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
};

const TabButton = ({ active, onClick, label, isDark, color }) => (
   <button onClick={onClick} style={{
     flex: 1, padding: '12px 10px', borderRadius: '18px', border: 'none',
     background: active ? (isDark ? 'rgba(255,255,255,0.1)' : '#ffffff') : 'transparent',
     boxShadow: active ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
     color: active ? color : (isDark ? 'rgba(255,255,255,0.45)' : '#64748b'),
     fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer'
   }}>{label}</button>
);

const AttendanceCard = ({ item, isDark, primaryText, mutedText, cardBg, glassEffect, shadow, cardBorder, parsePureDate }) => (
   <div style={{ 
       background: cardBg, borderRadius: '40px', padding: '32px', 
       ...glassEffect, boxShadow: shadow
   }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '18px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
               <Clock size={22} />
            </div>
            <div>
               <p style={{ fontSize: '15px', fontWeight: '900', color: primaryText, margin: 0 }}>{item.storeName || 'Sede Principal'}</p>
               <p style={{ fontSize: '9px', fontWeight: '800', color: mutedText, textTransform: 'uppercase', opacity: 0.6 }}>{formatDate(parsePureDate(item.clockIn))}</p>
            </div>
         </div>
         <div style={{ 
             padding: '6px 14px', borderRadius: '30px', 
             background: item.status === -1 ? 'rgba(79, 70, 229, 0.15)' : (item.status === 0 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)'),
             color: item.status === -1 ? '#4f46e5' : (item.status === 0 ? '#10b981' : '#f59e0b'),
             fontSize: '9px', fontWeight: '950', textTransform: 'uppercase'
         }}>{item.statusText || 'Procesado'}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', padding: '24px', borderRadius: '32px', border: `1px solid ${cardBorder}` }}>
         <TimeBlock label="Entrada" time={parsePureDate(item.clockIn)} icon={<ArrowUpRight size={16} />} color="#10b981" mutedText={mutedText} primaryText={primaryText} />
         <TimeBlock label="Salida" time={parsePureDate(item.clockOut)} icon={<ArrowDownLeft size={16} />} color="#4f46e5" mutedText={mutedText} primaryText={primaryText} />
      </div>
   </div>
);

const TimeBlock = ({ label, time, icon, color, mutedText, primaryText }) => (
   <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: color }}>
         {icon}
         <span style={{ fontSize: '18px', fontWeight: '950' }}>{time ? new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
      </div>
      <p style={{ fontSize: '9px', fontWeight: '800', color: mutedText, textTransform: 'uppercase', marginLeft: '24px', margin: 0 }}>{label}</p>
   </div>
);

const navButtonStyle = {
  width: '44px', height: '44px', borderRadius: '14px', border: 'none',
  background: 'rgba(16, 185, 129, 0.05)', color: '#10b981',
  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
};

export default MobileAttendance;
