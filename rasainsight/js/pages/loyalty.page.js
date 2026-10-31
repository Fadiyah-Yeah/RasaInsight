/**
 * RasaInsight — Loyalty Page (Presentation Layer)
 * Loyalty points list, customer summary, and redemption management.
 */

const LoyaltyPage = (() => {

  let _currentPage  = 1;
  const _perPage    = 15;
  let _filtered     = [];
  let _sortField    = 'transaction_date';
  let _sortDir      = 'desc';

  // ─── Main Render ─────────────────────────────────────────────
  function render() {
    const main = document.getElementById('page-content');
    if (!main) return;

    const stats = LoyaltyService.getStats();
    const top   = LoyaltyService.getTopLoyalCustomers(5);

    main.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Loyalty Points</h1>
          <p class="page-subtitle">Kelola poin loyalitas pelanggan</p>
        </div>
        <button class="btn btn-primary" id="btn-redeem-points">
          &#10006; Tukar Poin
        </button>
      </div>

      <!-- KPI Cards -->
      <div class="kpi-grid" style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;margin-bottom:24px;">
        ${_kpiCard('Total Poin Terkumpul', Utils.formatNumber(stats.totalEarned), '🏆')}
        ${_kpiCard('Total Poin Ditukar', Utils.formatNumber(stats.totalRedeemed), '🎁')}
        ${_kpiCard('Saldo Aktif', Utils.formatNumber(stats.balance), '✨')}
        ${_kpiCard('Pelanggan Aktif', Utils.formatNumber(stats.customersWithPoints), '👥')}
      </div>

      <div style="display:grid;grid-template-columns:1fr 300px;gap:20px;align-items:start;">
        <!-- Main Table -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Riwayat Poin</h3>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <input type="search" id="loyalty-search" class="input" placeholder="Cari pelanggan / transaksi…" style="width:200px;">
              <input type="date" id="loyalty-from" class="input" style="width:145px;" title="Dari tanggal">
              <input type="date" id="loyalty-to"   class="input" style="width:145px;" title="Sampai tanggal">
            </div>
          </div>
          <div class="table-wrapper">
            <table class="table" id="loyalty-table">
              <thead>
                <tr>
                  <th class="sortable" data-field="loyalty_transaction_id">ID</th>
                  <th class="sortable" data-field="customer_id">Pelanggan</th>
                  <th class="sortable" data-field="transaction_date">Tanggal</th>
                  <th class="sortable" data-field="transaction_id">Transaksi</th>
                  <th class="sortable text-right" data-field="points_earned">Diperoleh</th>
                  <th class="sortable text-right" data-field="points_redeemed">Ditukar</th>
                  <th class="sortable text-right" data-field="balance">Saldo</th>
                  <th>Keterangan</th>
                </tr>
              </thead>
              <tbody id="loyalty-tbody"></tbody>
            </table>
          </div>
          <div id="loyalty-pagination" class="pagination-wrapper"></div>
        </div>

        <!-- Top Loyal Customers -->
        <div class="card">
          <div class="card-header"><h3 class="card-title">Top Pelanggan Loyal</h3></div>
          <div id="top-loyal-list">
            ${top.map((c, i) => `
              <div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border);">
                <span style="width:24px;height:24px;border-radius:50%;background:var(--primary);color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;">${i+1}</span>
                <div style="flex:1;min-width:0;">
                  <div style="font-weight:600;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${Utils.escapeHtml(c.customer_name)}</div>
                  <div style="font-size:11px;color:var(--text-muted);">${c.customer_id}</div>
                </div>
                <div style="text-align:right;">
                  <div style="font-weight:700;color:var(--primary);">${Utils.formatNumber(c.balance)}</div>
                  <div style="font-size:10px;color:var(--text-muted);">poin</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    _bindEvents();
    _loadTable();
  }

  function _kpiCard(label, value, icon) {
    return `<div class="kpi-card"><div class="kpi-icon">${icon}</div><div class="kpi-value">${value}</div><div class="kpi-label">${label}</div></div>`;
  }

  function _bindEvents() {
    document.getElementById('loyalty-search')?.addEventListener('input',  Utils.debounce(_applyFilters, 300));
    document.getElementById('loyalty-from')?.addEventListener('change', _applyFilters);
    document.getElementById('loyalty-to')?.addEventListener('change',   _applyFilters);

    document.querySelectorAll('#loyalty-table th.sortable').forEach(th => {
      th.addEventListener('click', () => {
        const field = th.dataset.field;
        if (_sortField === field) _sortDir = _sortDir === 'asc' ? 'desc' : 'asc';
        else { _sortField = field; _sortDir = 'desc'; }
        _loadTable();
      });
    });

    document.getElementById('btn-redeem-points')?.addEventListener('click', _showRedeemModal);
  }

  function _applyFilters() {
    const query   = document.getElementById('loyalty-search')?.value || '';
    const dateFrom = document.getElementById('loyalty-from')?.value || '';
    const dateTo   = document.getElementById('loyalty-to')?.value || '';
    _currentPage = 1;
    _filtered = LoyaltyService.search(query, { dateFrom, dateTo });
    _renderTable();
  }

  function _loadTable() {
    _filtered = LoyaltyService.getAll();
    _renderTable();
  }

  function _renderTable() {
    const sorted = Utils.sortBy(_filtered, _sortField, _sortDir);
    const enriched = LoyaltyService.getEnriched(sorted);
    const total  = enriched.length;
    const start  = (_currentPage - 1) * _perPage;
    const page   = enriched.slice(start, start + _perPage);

    const tbody = document.getElementById('loyalty-tbody');
    if (!tbody) return;

    if (!page.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">Tidak ada data</td></tr>';
    } else {
      tbody.innerHTML = page.map(lp => `
        <tr>
          <td><span class="badge badge-info" style="font-size:10px;">${lp.loyalty_transaction_id}</span></td>
          <td>
            <div style="font-weight:600;font-size:13px;">${Utils.escapeHtml(lp.customer?.customer_name || lp.customer_id)}</div>
            <div style="font-size:11px;color:var(--text-muted);">${lp.customer_id} · ${lp.tier?.name || 'Member'}</div>
          </td>
          <td>${Utils.formatDate(lp.transaction_date)}</td>
          <td><span style="font-size:11px;color:var(--text-muted);">${lp.transaction_id || '—'}</span></td>
          <td class="text-right"><span style="color:var(--success);font-weight:600;">+${Utils.formatNumber(lp.points_earned)}</span></td>
          <td class="text-right"><span style="color:${lp.points_redeemed > 0 ? 'var(--danger)' : 'var(--text-muted)'};">${lp.points_redeemed > 0 ? '-' + Utils.formatNumber(lp.points_redeemed) : '—'}</span></td>
          <td class="text-right"><strong>${Utils.formatNumber(lp.balance)}</strong></td>
          <td style="font-size:12px;color:var(--text-muted);">${Utils.escapeHtml(lp.description || '')}</td>
        </tr>
      `).join('');
    }

    // Pagination
    const pager = document.getElementById('loyalty-pagination');
    if (pager) pager.innerHTML = Utils.renderPagination(total, _currentPage, _perPage, page => {
      _currentPage = page;
      _renderTable();
    });
  }

  // ─── Redeem Modal ─────────────────────────────────────────────
  function _showRedeemModal() {
    const customers = CustomerRepo.findAll().map(c => ({
      ...c,
      balance: LoyaltyRepo.getBalance(c.customer_id),
    })).filter(c => c.balance > 0).sort((a, b) => b.balance - a.balance);

    const opts = customers.map(c =>
      `<option value="${c.customer_id}">${Utils.escapeHtml(c.customer_name)} (${Utils.formatNumber(c.balance)} poin)</option>`
    ).join('');

    Modal.open({
      title: 'Tukar Poin Loyalitas',
      body: `
        <div class="form-group">
          <label class="form-label">Pelanggan *</label>
          <select id="redeem-customer" class="input select">
            <option value="">-- Pilih Pelanggan --</option>
            ${opts}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Jumlah Poin *</label>
          <input type="number" id="redeem-points" class="input" placeholder="e.g. 100" min="1">
          <div id="redeem-balance-info" style="font-size:12px;color:var(--text-muted);margin-top:4px;"></div>
        </div>
        <div class="form-group">
          <label class="form-label">Keterangan</label>
          <input type="text" id="redeem-desc" class="input" placeholder="Penukaran poin untuk diskon" value="Penukaran poin untuk diskon">
        </div>
      `,
      confirmLabel: 'Tukar Poin',
      onConfirm() {
        const custId = document.getElementById('redeem-customer')?.value;
        const pts    = parseInt(document.getElementById('redeem-points')?.value || '0');
        const desc   = document.getElementById('redeem-desc')?.value || '';
        try {
          LoyaltyService.redeem(custId, pts, desc);
          Modal.close();
          Toast.success('Poin berhasil ditukar!');
          _loadTable();
        } catch (e) {
          Toast.error(e.message || 'Gagal menukar poin');
        }
      },
    });

    // Show balance on customer select
    document.getElementById('redeem-customer')?.addEventListener('change', e => {
      const bal = LoyaltyRepo.getBalance(e.target.value);
      const info = document.getElementById('redeem-balance-info');
      if (info) info.textContent = `Saldo tersedia: ${Utils.formatNumber(bal)} poin`;
    });
  }

  return { render };
})();

window.LoyaltyPage = LoyaltyPage;
