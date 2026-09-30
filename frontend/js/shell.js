/**
 * Renders the sidebar shell into #sidebarMount on every logged-in page,
 * and highlights the current page's nav link.
 */
function renderShell(activePage) {
  requireAuthOrRedirect();
  const user = getUser();
  const mount = document.getElementById('sidebarMount');
  if (!mount) return;

  const links = [
    { key: 'dashboard', href: '/dashboard.html', label: 'Dashboard' },
    { key: 'campaigns', href: '/campaigns.html', label: 'Campaigns' },
    { key: 'ai', href: '/ai-insights.html', label: 'AI Insights' },
  ];
  if (user && user.role === 'admin') {
    links.push({ key: 'admin', href: '/admin.html', label: 'Admin Panel' });
  }

  mount.innerHTML = `
    <div class="brand">Marketing<span>IQ</span></div>
    ${links.map(l => `<div class="nav-link ${l.key === activePage ? 'active' : ''}" onclick="window.location.href='${l.href}'">${l.label}</div>`).join('')}
    <div class="sidebar-footer">
      <div class="user-chip">${user ? `${user.name} · ${user.role}` : ''}</div>
      <button class="btn btn-ghost btn-block" id="logoutBtn">Log Out</button>
    </div>
  `;

  document.getElementById('logoutBtn').addEventListener('click', () => {
    clearSession();
    window.location.href = '/index.html';
  });
}
