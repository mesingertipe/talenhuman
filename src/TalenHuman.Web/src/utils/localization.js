// Mapeo de Windows TimeZone IDs a IANA para compatibilidad con Intl API
const tzMapping = {
    'SA Pacific Standard Time': 'America/Bogota',
    'Central Standard Time (Mexico)': 'America/Mexico_City',
    'SA Western Standard Time': 'America/Guayaquil', // Ecuador usa Guayaquil
    'Eastern Standard Time': 'America/Panama'
};

const countryToIANA = {
    'CO': 'America/Bogota',
    'MX': 'America/Mexico_City',
    'PA': 'America/Panama',
    'EC': 'America/Guayaquil'
};

export const getTenantLocale = (countryCode = 'CO') => {
    const locales = {
        'CO': 'es-CO',
        'MX': 'es-MX',
        'PA': 'es-PA',
        'EC': 'es-EC'
    };
    return locales[countryCode] || 'es-CO';
};

export const getTenantTimeZone = (countryCode = 'CO', windowsTzId = '') => {
    // Prioridad 1: Mapeo de Windows ID si existe
    if (windowsTzId && tzMapping[windowsTzId]) {
        return tzMapping[windowsTzId];
    }
    
    // Prioridad 2: Mapeo por Código de País
    if (countryCode && countryToIANA[countryCode]) {
        return countryToIANA[countryCode];
    }

    // Default
    return 'America/Bogota';
};

export const formatTenantDate = (date, countryCode, windowsTzId, options = {}) => {
    const locale = getTenantLocale(countryCode);
    const timeZone = getTenantTimeZone(countryCode, windowsTzId);
    
    return new Date(date).toLocaleString(locale, {
        timeZone,
        ...options
    });
};
