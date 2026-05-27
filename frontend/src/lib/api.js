const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function getToken() {
  return localStorage.getItem('medisync_token');
}

export function setToken(token) {
  if (!token) {
    localStorage.removeItem('medisync_token');
    return;
  }

  localStorage.setItem('medisync_token', token);
}

export async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
}

// Upload a single file to the backend GridFS upload endpoint.
export async function uploadFile(file) {
  const token = getToken();
  const form = new FormData();
  form.append('file', file);

  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const response = await fetch(`${apiBase}/api/uploads`, {
    method: 'POST',
    headers,
    body: form
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Upload failed');
  }

  return data; // { fileId, downloadUrl }
}

// Payments: create checkout session and confirm
export async function createCheckoutSession(orderId) {
  const data = await request('/api/payments/create-session', {
    method: 'POST',
    body: JSON.stringify({ orderId })
  });
  return data; // { url, id }
}

export async function confirmCheckout(sessionId, orderId) {
  const data = await request('/api/payments/confirm', {
    method: 'POST',
    body: JSON.stringify({ sessionId, orderId })
  });
  return data;
}
