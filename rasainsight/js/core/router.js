/**
 * RasaInsight — SPA Router (Application Layer)
 * Hash-based routing: works with file:// protocol
 * Route format: #/page or #/page/id
 */

const Router = (() => {
  const routes = {};
  let currentRoute = null;
  let onNavigateCallback = null;

  // ─── Register Route ─────────────────────────────────────────
  function register(path, handler) {
    routes[path] = handler;
  }

  // ─── Navigate ───────────────────────────────────────────────
  function navigate(path) {
    window.location.hash = '#' + path;
  }

  // ─── Parse Hash ─────────────────────────────────────────────
  function parseHash(hash) {
    const path = hash.replace(/^#\/?/, '') || 'dashboard';
    const parts = path.split('/');
    return {
      path: '/' + parts[0],
      segment: parts[0],
      id: parts[1] || null,
      subPage: parts[2] || null,
      full: '/' + path,
    };
  }

  // ─── Match route (supports dynamic :id segments) ────────────
  function matchRoute(fullPath) {
    // Try exact match first
    if (routes[fullPath]) return { handler: routes[fullPath], params: {} };

    // Try pattern match: /customers/:id
    for (const [pattern, handler] of Object.entries(routes)) {
      const patternParts = pattern.split('/');
      const pathParts = fullPath.split('/');
      if (patternParts.length !== pathParts.length) continue;

      const params = {};
      const match = patternParts.every((part, i) => {
        if (part.startsWith(':')) {
          params[part.slice(1)] = pathParts[i];
          return true;
        }
        return part === pathParts[i];
      });

      if (match) return { handler, params };
    }

    return null;
  }

  // ─── Handle Navigation ──────────────────────────────────────
  function handleRoute() {
    const parsed = parseHash(window.location.hash);
    const matched = matchRoute(parsed.full) || matchRoute(parsed.path);

    currentRoute = parsed;

    // Close the mobile drawer after navigation so the page is immediately usable.
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar) sidebar.classList.remove('mobile-open');
    if (overlay) overlay.classList.remove('active');

    // Update active nav item
    updateActiveNav(parsed.segment);

    // Update breadcrumb
    updateBreadcrumb(parsed.segment, parsed.id);

    if (matched) {
      const params = { ...matched.params, id: parsed.id };
      matched.handler(params);
    } else if (routes['/404']) {
      routes['/404']({});
    } else {
      // Default fallback
      const content = document.getElementById('page-content');
      if (content) {
        content.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            </div>
            <div class="empty-state-title">Halaman Tidak Ditemukan</div>
            <div class="empty-state-desc">Route "${parsed.full}" tidak tersedia.</div>
            <button class="btn btn-primary" onclick="Router.navigate('/dashboard')">Kembali ke Dashboard</button>
          </div>
        `;
      }
    }

    if (onNavigateCallback) onNavigateCallback(parsed);
    window.scrollTo(0, 0);
  }

  function updateActiveNav(segment) {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
      if (item.dataset.route === segment) {
        item.classList.add('active');
      }
    });
  }

  const PAGE_TITLES = {
    dashboard:    { title: 'Dashboard',            icon: '📊' },
    customers:    { title: 'Pelanggan',             icon: '👥' },
    transactions: { title: 'Transaksi',             icon: '🧾' },
    products:     { title: 'Produk',                icon: '🛍️' },
    loyalty:      { title: 'Loyalitas',             icon: '⭐' },
    feedback:     { title: 'Feedback',              icon: '💬' },
    complaints:   { title: 'Keluhan',               icon: '🔔' },
    bi:           { title: 'Business Intelligence', icon: '📈' },
    'ai-insights':{ title: 'AI Insights',           icon: '🤖' },
    settings:     { title: 'Pengaturan',            icon: '⚙️' },
  };

  function updateBreadcrumb(segment, id) {
    const bc = document.getElementById('breadcrumb');
    if (!bc) return;

    const info = PAGE_TITLES[segment] || { title: segment, icon: '📄' };
    let html = `<span>ADA RASA</span>
      <span class="breadcrumb-sep">›</span>
      <span class="breadcrumb-current">${info.title}</span>`;

    if (id) {
      html += `<span class="breadcrumb-sep">›</span>
        <span class="breadcrumb-current">Detail</span>`;
    }

    bc.innerHTML = html;
    document.title = `${info.title} — RasaInsight`;
  }

  // ─── Listen ────────────────────────────────────────────────
  function listen() {
    window.addEventListener('hashchange', handleRoute);
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        document.getElementById('sidebar')?.classList.remove('mobile-open');
        document.getElementById('sidebar-overlay')?.classList.remove('active');
      }
    });
    handleRoute(); // Handle initial route
  }

  function onNavigate(fn) {
    onNavigateCallback = fn;
  }

  function getCurrentRoute() { return currentRoute; }

  // ─── Link Helper ──────────────────────────────────────────
  function link(segment, id = null) {
    return id ? `#/${segment}/${id}` : `#/${segment}`;
  }

  return {
    register,
    navigate,
    listen,
    onNavigate,
    getCurrentRoute,
    link,
    parseHash,
    PAGE_TITLES,
  };
})();

window.Router = Router;
