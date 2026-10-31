/**
 * RasaInsight — App Shell (Application Layer)
 * Renders the sidebar, topbar, and manages layout state.
 * Initializes the application on startup.
 */

const AppShell = (() => {

  // SVG icons for navigation (inline Lucide-style)
  const ICONS = {
    dashboard:    `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>`,
    customers:    `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`,
    transactions: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`,
    products:     `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>`,
    loyalty:      `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`,
    feedback:     `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`,
    complaints:   `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0"></path></svg>`,
    bi:           `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>`,
    aiInsights:   `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`,
    settings:     `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M4.93 19.07l1.41-1.41M19.07 19.07l-1.41-1.41M12 2v2M12 20v2M2 12h2M20 12h2"></path></svg>`,
    chevronLeft:  `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>`,
    menu:         `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>`,
    download:     `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`,
    reset:        `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 .49-3.5"></path></svg>`,
  };

  // ─── Navigation Config ──────────────────────────────────────
  const NAV_SECTIONS = [
    {
      label: 'Beranda',
      items: [
        { route: 'dashboard',    label: 'Dashboard',   icon: 'dashboard' },
      ],
    },
    {
      label: 'CRM',
      items: [
        { route: 'customers',    label: 'Pelanggan',   icon: 'customers' },
        { route: 'transactions', label: 'Transaksi',   icon: 'transactions' },
        { route: 'products',     label: 'Produk',      icon: 'products' },
        { route: 'loyalty',      label: 'Loyalitas',   icon: 'loyalty' },
        { route: 'feedback',     label: 'Feedback',    icon: 'feedback' },
        { route: 'complaints',   label: 'Keluhan',     icon: 'complaints',  badgeId: 'complaints-badge' },
      ],
    },
    {
      label: 'Analitik',
      items: [
        { route: 'bi',           label: 'BI Analytics', icon: 'bi' },
        { route: 'ai-insights',  label: 'AI Insights',  icon: 'aiInsights' },
      ],
    },
  ];

  // ─── Render Sidebar ─────────────────────────────────────────
  function renderSidebar() {
    const sectionsHtml = NAV_SECTIONS.map(section => `
      <div class="sidebar-nav-section">
        <div class="sidebar-nav-label">${section.label}</div>
        ${section.items.map(item => `
          <a class="nav-item" data-route="${item.route}" href="${Router.link(item.route)}">
            <span class="nav-icon">${ICONS[item.icon] || ''}</span>
            <span class="nav-label">${item.label}</span>
            ${item.badgeId ? `<span class="nav-badge hidden" id="${item.badgeId}">0</span>` : ''}
          </a>
        `).join('')}
      </div>
    `).join('');

    return `
      <div class="sidebar" id="sidebar">
        <div class="sidebar-brand">
          <div class="sidebar-brand-logo">AR</div>
          <div class="sidebar-brand-text">
            <div class="brand-name">RasaInsight</div>
            <div class="brand-sub">ADA RASA F&amp;B</div>
          </div>
        </div>
        <nav class="sidebar-nav">${sectionsHtml}</nav>
        <div class="sidebar-footer">
          <a class="nav-item" data-route="settings" href="${Router.link('settings')}">
            <span class="nav-icon">${ICONS.settings}</span>
            <span class="nav-label">Pengaturan</span>
          </a>
        </div>
      </div>
    `;
  }

  // ─── Render Topbar ──────────────────────────────────────────
  function renderTopbar() {
    return `
      <header class="topbar">
        <button class="btn btn-ghost btn-icon hide-desktop" id="mobile-menu-btn" aria-label="Menu">
          ${ICONS.menu}
        </button>
        <div class="topbar-breadcrumb" id="breadcrumb">
          <span>ADA RASA</span>
          <span class="breadcrumb-sep">›</span>
          <span class="breadcrumb-current">Dashboard</span>
        </div>
        <div class="topbar-actions">
          <button class="btn btn-ghost btn-sm" id="btn-export-backup" title="Export Backup">
            ${ICONS.download} <span class="hide-mobile">Backup</span>
          </button>
          <button class="btn btn-ghost btn-sm" id="btn-reset-data" title="Reset Data">
            ${ICONS.reset} <span class="hide-mobile">Reset</span>
          </button>
        </div>
      </header>
    `;
  }

  // ─── Render Full App Shell ──────────────────────────────────
  function render() {
    const app = document.getElementById('app');
    if (!app) return;

    app.innerHTML = `
      ${renderSidebar()}
      <button class="sidebar-toggle" id="sidebar-toggle" title="Sembunyikan sidebar">
        <span class="toggle-icon">${ICONS.chevronLeft}</span>
      </button>
      <div class="sidebar-overlay" id="sidebar-overlay"></div>
      <div class="main-wrapper" id="main-wrapper">
        ${renderTopbar()}
        <main class="page-content" id="page-content">
          <div class="flex items-center justify-center" style="height:60vh">
            <div class="spinner spinner-lg"></div>
          </div>
        </main>
      </div>
    `;

    bindLayoutEvents();
  }

  // ─── Layout Events ──────────────────────────────────────────
  function bindLayoutEvents() {
    // Desktop sidebar toggle
    const toggleBtn = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    const mainWrapper = document.getElementById('main-wrapper');

    if (toggleBtn && sidebar) {
      toggleBtn.addEventListener('click', () => {
        const collapsed = sidebar.classList.toggle('collapsed');
        toggleBtn.classList.toggle('collapsed', collapsed);
        if (mainWrapper) mainWrapper.classList.toggle('sidebar-collapsed', collapsed);
        localStorage.setItem('rasainsight_sidebar_collapsed', collapsed);
      });

      // Restore state
      const wasCollapsed = localStorage.getItem('rasainsight_sidebar_collapsed') === 'true';
      if (wasCollapsed) {
        sidebar.classList.add('collapsed');
        toggleBtn.classList.add('collapsed');
        if (mainWrapper) mainWrapper.classList.add('sidebar-collapsed');
      }
    }

    // Mobile menu
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const overlay = document.getElementById('sidebar-overlay');

    if (mobileBtn && sidebar) {
      mobileBtn.addEventListener('click', () => {
        sidebar.classList.toggle('mobile-open');
        overlay && overlay.classList.toggle('active');
      });
    }

    if (overlay) {
      overlay.addEventListener('click', () => {
        sidebar && sidebar.classList.remove('mobile-open');
        overlay.classList.remove('active');
      });
    }

    // Export Backup
    const exportBtn = document.getElementById('btn-export-backup');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const backup = Storage.exportBackup();
        Utils.downloadJSON(backup, `rasainsight-backup-${Utils.toISODate(new Date())}.json`);
        Toast.success('Backup data berhasil diunduh.', 'Export Berhasil');
      });
    }

    // Reset Data
    const resetBtn = document.getElementById('btn-reset-data');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        Modal.confirm({
          title: 'Reset Data',
          message: 'Seluruh perubahan data akan dihapus dan diganti dengan dataset awal. Proses ini tidak dapat dibatalkan.',
          confirmText: 'Reset Sekarang',
          type: 'danger',
          onConfirm: () => {
            // Clear and reload
            Storage.clearAll();
            window.location.reload();
          },
        });
      });
    }
  }

  // ─── Update Complaints Badge ────────────────────────────────
  function updateComplaintsBadge() {
    const badge = document.getElementById('complaints-badge');
    if (!badge) return;
    const count = ComplaintRepo.count(c => c.status !== 'Resolved');
    if (count > 0) {
      badge.textContent = count > 99 ? '99+' : count;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }

  return { render, updateComplaintsBadge, ICONS };
})();

window.AppShell = AppShell;
