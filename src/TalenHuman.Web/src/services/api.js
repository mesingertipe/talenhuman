import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

// Request interceptor to add tenant ID and token
api.interceptors.request.use((config) => {
  const defaultTenant = '11111111-1111-1111-1111-111111111111';
  let tenantId = localStorage.getItem('tenantId');
  
  // Clear common invalid/empty values
  if (!tenantId || 
      tenantId === 'undefined' || 
      tenantId === 'null' || 
      tenantId === '00000000-0000-0000-0000-000000000000' ||
      tenantId === '') {
    tenantId = defaultTenant;
  }

  const token = localStorage.getItem('token');
  
  if (tenantId) config.headers['X-Tenant-Id'] = tenantId;
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  
  return config;
});

export default api;
