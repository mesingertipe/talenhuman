import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5001/api' // Default for development
});

// Store current tenant ID
let dynamicTenantId = localStorage.getItem('selectedTenantId');

export const setApiTenantId = (tenantId) => {
    dynamicTenantId = tenantId;
    localStorage.setItem('selectedTenantId', tenantId);
};

api.interceptors.request.use((config) => {
    const savedUser = localStorage.getItem('user');
    let tenantIdFromUser = null;

    if (savedUser) {
        try {
            const user = JSON.parse(savedUser);
            if (user.token) {
                config.headers.Authorization = `Bearer ${user.token}`;
            }
            tenantIdFromUser = user.companyId || user.CompanyId;
        } catch (e) {
            console.error("Error parsing user from localStorage", e);
        }
    }

    // Priority: dynamic (from switcher) > user profile
    const finalTenantId = dynamicTenantId || tenantIdFromUser;
    
    if (finalTenantId) {
        config.headers['X-Tenant-Id'] = finalTenantId;
    }

    return config;
});

export default api;
