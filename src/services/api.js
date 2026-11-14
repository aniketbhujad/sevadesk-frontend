// Resolve Backend API Base URL:
// 1. In production on Vercel: reads VITE_API_URL environment variable (e.g. http://<EC2_PUBLIC_IP>:5000 or https://api.yourdomain.com)
// 2. In local development: defaults to '/api' (proxied by Vite to http://localhost:5000)
const envApiUrl = (import.meta.env.VITE_API_URL || '').trim();
const cleanApiBase = envApiUrl.replace(/\/+$/, '');
const API_BASE = cleanApiBase
  ? (cleanApiBase.endsWith('/api') ? cleanApiBase : `${cleanApiBase}/api`)
  : '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('sevadesk_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include', // sends HTTP-only cookie
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Authentication
  auth: {
    login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
    logout: () => request('/auth/logout', { method: 'POST' }),
    me: () => request('/auth/me'),
  },

  // Dashboard
  dashboard: {
    getSummary: () => request('/dashboard/summary'),
  },

  // Customers
  customers: {
    list: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/customers?${qs}`);
    },
    checkMobile: (mobile) => request(`/customers/check-mobile?mobile=${encodeURIComponent(mobile)}`),
    create: (data) => request('/customers', { method: 'POST', body: JSON.stringify(data) }),
    getById: (id) => request(`/customers/${id}`),
    update: (id, data) => request(`/customers/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    getHistory: (id) => request(`/customers/${id}/history`),
  },

  // Service Catalogue
  services: {
    list: () => request('/services'),
    create: (data) => request('/services', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/services/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    toggleArchive: (id) => request(`/services/${id}/archive`, { method: 'PATCH' }),
  },

  // Service Records
  serviceRecords: {
    list: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/service-records?${qs}`);
    },
    create: (data) => request('/service-records', { method: 'POST', body: JSON.stringify(data) }),
    getById: (id) => request(`/service-records/${id}`),
    getReceipt: (id) => request(`/service-records/${id}/receipt`),
    sendReceipt: (id) => request(`/service-records/${id}/send-receipt`, { method: 'POST' }),
  },

  // Payments
  payments: {
    add: (serviceRecordId, data) =>
      request(`/service-records/${serviceRecordId}/payments`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    listForRecord: (serviceRecordId) => request(`/service-records/${serviceRecordId}/payments`),
  },

  // Notifications (SMS Outbox)
  notifications: {
    list: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/notifications?${qs}`);
    },
    retry: (id) => request(`/notifications/${id}/retry`, { method: 'POST' }),
  },

  // Reports
  reports: {
    getCollections: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/reports/collections?${qs}`);
    },
    getOutstanding: () => request('/reports/outstanding'),
    getServices: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/reports/services?${qs}`);
    },
    getExportUrl: (type = 'collections', from = '', to = '') => {
      const token = localStorage.getItem('sevadesk_token');
      const tokenQuery = token ? `&token=${encodeURIComponent(token)}` : '';
      return `${API_BASE}/reports/export.csv?type=${type}&from=${from}&to=${to}${tokenQuery}`;
    },
  },

  // Settings
  settings: {
    get: () => request('/settings'),
    update: (data) => request('/settings', { method: 'PATCH', body: JSON.stringify(data) }),
  },
};
