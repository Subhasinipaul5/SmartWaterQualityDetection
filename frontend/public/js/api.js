// ─── API Configuration ──────────────────────────────────────────
// const BASE_URL = "https://smartwaterqualitydetection-1.onrender.com";
const API_BASE = "https://smartwaterqualitydetection-1.onrender.com";
// ─── Token helpers ──────────────────────────────────────────────
const getToken = () => localStorage.getItem('aq_token');
const setToken = (t) => localStorage.setItem('aq_token', t);
const removeToken = () => localStorage.removeItem('aq_token');

const getUser = () => {
  try { return JSON.parse(localStorage.getItem('aq_user')) || null; } catch { return null; }
};
const setUser = (u) => localStorage.setItem('aq_user', JSON.stringify(u));
const removeUser = () => localStorage.removeItem('aq_user');

// ─── Core fetch wrapper ──────────────────────────────────────────
async function apiFetch(endpoint, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    const data = await res.json();

    if (res.status === 401) {
      removeToken(); removeUser();
      window.dispatchEvent(new Event('auth:logout'));
    }
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    return { ok: false, status: 0, data: { success: false, message: 'Network error — is the server running?' } };
  }
}

// ─── Auth API ────────────────────────────────────────────────────
const AuthAPI = {
  register:    (body) => apiFetch('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login:       (body) => apiFetch('/api/auth/login',    { method: 'POST', body: JSON.stringify(body) }),
  me:          ()     => apiFetch('/api/auth/me'),
  updateProfile: (body) => apiFetch('/api/auth/profile',         { method: 'PUT', body: JSON.stringify(body) }),
  changePassword:(body) => apiFetch('/api/auth/change-password', { method: 'PUT', body: JSON.stringify(body) }),
  getAllUsers:  ()     => apiFetch('/api/auth/users'),
  promoteUser: (id)   => apiFetch(`/api/auth/promote/${id}`,    { method: 'PUT' }),
};

// ─── Water API ───────────────────────────────────────────────────
const WaterAPI = {
  addReading:      (body)    => apiFetch('/water',            { method: 'POST', body: JSON.stringify(body) }),
  getAll:          (params)  => apiFetch(`/water?${new URLSearchParams(params)}`),
  getLatest:       ()        => apiFetch('/water/latest'),
  getStation:      (id, p)   => apiFetch(`/water/station/${id}?${new URLSearchParams(p || {})}`),
  getAnalytics:    (params)  => apiFetch(`/water/analytics?${new URLSearchParams(params)}`),
  getAlerts:       (params)  => apiFetch(`/water/alerts?${new URLSearchParams(params || {})}`),
  resolveAlert:    (id)      => apiFetch(`/water/alerts/${id}/resolve`, { method: 'PUT' }),
  deleteReading:   (id)      => apiFetch(`/water/${id}`,                { method: 'DELETE' }),
  restoreReading:  (id)      => apiFetch(`/water/${id}/restore`,        { method: 'PUT' }),
  updateReading:   (id,body) => apiFetch(`/water/${id}`,                { method: 'PUT', body: JSON.stringify(body) }),
};

// ─── Contact API ─────────────────────────────────────────────────
const ContactAPI = {
  submit:      (body) => apiFetch('/contact',          { method: 'POST', body: JSON.stringify(body) }),
  getMessages: ()     => apiFetch('/contact'),
  markRead:    (id)   => apiFetch(`/contact/${id}/read`, { method: 'PUT' }),
};

// ─── Payment API ─────────────────────────────────────────────────
const PaymentAPI = {
  createOrder: (plan) => apiFetch('/payment/create-order', { method: 'POST', body: JSON.stringify({ plan }) }),
  verify:      (body) => apiFetch('/payment/verify',       { method: 'POST', body: JSON.stringify(body) }),
  getHistory:  ()     => apiFetch('/payment/history'),
};
