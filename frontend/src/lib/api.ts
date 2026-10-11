// ECLYPETECH PBX - Frontend API Client

const API_BASE = '/api';

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('eclypetech_token') || localStorage.getItem('eclype_token');
}

export function setAuthToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('eclypetech_token', token);
    localStorage.setItem('eclype_token', token);
  }
}

export function clearAuthToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('eclypetech_token');
    localStorage.removeItem('eclypetech_user');
    localStorage.removeItem('eclype_token');
    localStorage.removeItem('eclype_user');
  }
}

export function getStoredUser(): any | null {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem('eclypetech_user') || localStorage.getItem('eclype_user');
  return user ? JSON.parse(user) : null;
}

export function setStoredUser(user: any): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('eclypetech_user', JSON.stringify(user));
    localStorage.setItem('eclype_user', JSON.stringify(user));
  }
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (res.status === 401 && typeof window !== 'undefined') {
    if (!window.location.pathname.startsWith('/login')) {
      clearAuthToken();
      window.location.href = '/login?expired=1';
    }
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || data.details || `API Request failed (${res.status})`);
  }

  return data as T;
}

// Convenient API methods
export const api = {
  // Auth
  login: (credentials?: { username?: string; email?: string; password?: string }) =>
    apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(credentials || {}) }),
  getMe: () => apiRequest('/auth/me'),

  // Dashboard
  getDashboardSummary: () => apiRequest('/dashboard/summary'),
  getLiveChannels: () => apiRequest('/dashboard/live-channels'),

  // Extensions
  getExtensions: () => apiRequest('/extensions'),
  createExtension: (data: any) =>
    apiRequest('/extensions', { method: 'POST', body: JSON.stringify(data) }),
  updateExtension: (id: string, data: any) =>
    apiRequest(`/extensions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  resetExtensionSecret: (id: string) =>
    apiRequest(`/extensions/${id}/reset-secret`, { method: 'POST' }),
  deleteExtension: (id: string) =>
    apiRequest(`/extensions/${id}`, { method: 'DELETE' }),

  // Calls
  getActiveCalls: () => apiRequest('/calls/active'),
  originateCall: (data: { callerExtension: string; destination: string }) =>
    apiRequest('/calls/originate', { method: 'POST', body: JSON.stringify(data) }),
  terminateCall: (uuid: string) =>
    apiRequest(`/calls/${uuid}/terminate`, { method: 'POST' }),
  transferCall: (uuid: string, target: string) =>
    apiRequest(`/calls/${uuid}/transfer`, { method: 'POST', body: JSON.stringify({ target }) }),
  eavesdropCall: (uuid: string, supervisorExt: string, mode?: 'SPY' | 'WHISPER' | 'BARGE') =>
    apiRequest(`/calls/${uuid}/eavesdrop`, { method: 'POST', body: JSON.stringify({ supervisorExt, mode }) }),

  // Trunks
  getTrunks: () => apiRequest('/trunks'),
  createTrunk: (data: any) =>
    apiRequest('/trunks', { method: 'POST', body: JSON.stringify(data) }),
  updateTrunk: (id: string, data: any) =>
    apiRequest(`/trunks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTrunk: (id: string) =>
    apiRequest(`/trunks/${id}`, { method: 'DELETE' }),
  testTrunk: (id: string) =>
    apiRequest(`/trunks/${id}/test`, { method: 'POST' }),
  bulkActionTrunks: (action: string, trunkIds?: string[]) =>
    apiRequest('/trunks/bulk', { method: 'POST', body: JSON.stringify({ action, trunkIds }) }),
  pushTrunkConfiguration: () =>
    apiRequest('/trunks/push-config', { method: 'POST' }),

  // Routes
  getInboundRoutes: () => apiRequest('/routes/inbound'),
  createInboundRoute: (data: any) =>
    apiRequest('/routes/inbound', { method: 'POST', body: JSON.stringify(data) }),
  updateInboundRoute: (id: string, data: any) =>
    apiRequest(`/routes/inbound/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteInboundRoute: (id: string) =>
    apiRequest(`/routes/inbound/${id}`, { method: 'DELETE' }),

  getOutboundRoutes: () => apiRequest('/routes/outbound'),
  createOutboundRoute: (data: any) =>
    apiRequest('/routes/outbound', { method: 'POST', body: JSON.stringify(data) }),
  updateOutboundRoute: (id: string, data: any) =>
    apiRequest(`/routes/outbound/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteOutboundRoute: (id: string) =>
    apiRequest(`/routes/outbound/${id}`, { method: 'DELETE' }),

  // IVR
  getIvrMenus: () => apiRequest('/ivr'),
  createIvrMenu: (data: any) =>
    apiRequest('/ivr', { method: 'POST', body: JSON.stringify(data) }),
  updateIvrMenu: (id: string, data: any) =>
    apiRequest(`/ivr/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteIvrMenu: (id: string) =>
    apiRequest(`/ivr/${id}`, { method: 'DELETE' }),

  // Ring Groups
  getRingGroups: () => apiRequest('/ring-groups'),
  createRingGroup: (data: any) =>
    apiRequest('/ring-groups', { method: 'POST', body: JSON.stringify(data) }),
  updateRingGroup: (id: string, data: any) =>
    apiRequest(`/ring-groups/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRingGroup: (id: string) =>
    apiRequest(`/ring-groups/${id}`, { method: 'DELETE' }),

  // Queues
  getQueues: () => apiRequest('/queues'),
  createQueue: (data: any) =>
    apiRequest('/queues', { method: 'POST', body: JSON.stringify(data) }),
  updateQueue: (id: string, data: any) =>
    apiRequest(`/queues/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteQueue: (id: string) =>
    apiRequest(`/queues/${id}`, { method: 'DELETE' }),
  updateAgentStatus: (queueId: string, extId: string, status: string) =>
    apiRequest(`/queues/${queueId}/agents/${extId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  // CDR & Recordings
  getCdr: (query?: Record<string, string>) => {
    const qs = query ? '?' + new URLSearchParams(query).toString() : '';
    return apiRequest(`/cdr${qs}`);
  },
  getRecordings: (page = 1) => apiRequest(`/recordings?page=${page}`),
  authorizeRecordingDownload: (id: string) =>
    apiRequest(`/recordings/${id}/authorize-download`, { method: 'POST' }),
  deleteRecording: (id: string) =>
    apiRequest(`/recordings/${id}`, { method: 'DELETE' }),

  // Audio Prompts & Sound Library
  getAudioPrompts: () => apiRequest('/audio'),
  uploadAudioPrompt: async (formData: FormData) => {
    const token = getAuthToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}/audio/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.message || 'Upload failed');
    }
    return res.json();
  },
  deleteAudioPrompt: (id: string) =>
    apiRequest(`/audio/${id}`, { method: 'DELETE' }),

  // Voicemail
  getVoicemailBoxes: () => apiRequest('/voicemail'),
  updateVoicemailBox: (id: string, data: any) =>
    apiRequest(`/voicemail/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Users & Departments
  getUsers: () => apiRequest('/users'),
  createUser: (data: any) =>
    apiRequest('/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id: string, data: any) =>
    apiRequest(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteUser: (id: string) =>
    apiRequest(`/users/${id}`, { method: 'DELETE' }),
  getDepartments: () => apiRequest('/departments'),
  createDepartment: (data: any) =>
    apiRequest('/departments', { method: 'POST', body: JSON.stringify(data) }),
  deleteDepartment: (id: string) =>
    apiRequest(`/departments/${id}`, { method: 'DELETE' }),

  // System & Security
  getSystemHealth: () => apiRequest('/system/health'),
  getSettings: () => apiRequest('/system/settings'),
  updateSetting: (key: string, value: string) =>
    apiRequest(`/system/settings/${key}`, { method: 'PUT', body: JSON.stringify({ value }) }),
  reloadTelephonyConfig: () =>
    apiRequest('/system/reload-telephony', { method: 'POST' }),
  getBackups: () => apiRequest('/system/backups'),
  triggerBackup: () => apiRequest('/system/backups/create', { method: 'POST' }),

  getSecurityEvents: () => apiRequest('/security/events'),
  getAuditLogs: (page = 1) => apiRequest(`/security/audit-logs?page=${page}`),
  resolveSecurityEvent: (id: string) =>
    apiRequest(`/security/events/${id}/resolve`, { method: 'POST' }),
};
