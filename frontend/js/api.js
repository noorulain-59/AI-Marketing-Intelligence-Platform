/**
 * Tiny fetch wrapper: attaches the JWT from localStorage, prefixes /api,
 * and throws a readable Error on non-2xx responses so callers can just
 * try/catch.
 */
const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('token');
}

function setSession(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

function getUser() {
  const raw = localStorage.getItem('user');
  return raw ? JSON.parse(raw) : null;
}

function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

function requireAuthOrRedirect() {
  if (!getToken()) {
    window.location.href = '/index.html';
  }
}

async function api(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401) {
      clearSession();
      window.location.href = '/index.html';
    }
    throw new Error(data.message || `Request failed (${res.status})`);
  }

  return data;
}

function money(n) {
  return `$${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function pct(n) {
  return `${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}%`;
}

function toast(message, isError = false) {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.className = `toast show ${isError ? 'toast-error' : 'toast-ok'}`;
  setTimeout(() => el.classList.remove('show'), 3000);
}
