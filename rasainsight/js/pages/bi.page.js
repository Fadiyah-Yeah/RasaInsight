/**
 * RasaInsight — Business Intelligence Page (Presentation Layer)
 * RFM segmentation table, revenue charts, product analytics, customer analytics.
 * All data from BIService — zero hardcoded values.
 */

const BIPage = (() => {

  let _chartInstances = {};
  let _rfmData        = [];
  let _rfmPage        = 1;
  const _rfmPerPage   = 15;
  let _rfmSort        = 'rfm_score';
  let _rfmSortDir     = 'desc';
  let _rfmFilter      = '';
  let _rfmSegFilter   = '';

  // ─── Segment colour map ─────────────────────────────────────
  const SEG_COLORS = {
    'Champions':          '#16a34a',
    'Loyal Customers':    '#2563eb',
    'New Customers':      '#7c3aed',
    'Potential Loyalists':'#0891b2',
    'Promising':          '#065f46',
    'At Risk':            '#dc2626',
    'Needs Attention':    '#ea580c',
    'Cant Lose Them':     '#9f1239',
    'Hibernating':        '#6b7280',
    'Others':             '#a3a3a3',
  };

  // ─── Tab definitions ────────────────────────────────────────
  const TABS = [
    { id: 'rfm',       label: 'RFM Segmentasi' },
    { id: 'revenue',   label: 'Revenue' },
    { id: 'products',  label: 'Produk' },
    { id: 'customers', label: 'Pelanggan' },
  ];

  let _activeTab = 'rfm';

  // ─── Main Render ─────────────────────────────────────────────
  function render() {
    const main = document.getElementById('page-content');
    if (!main) return;

    // Destroy old charts to free memory
    _destroyCharts();

    main.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Business Intelligence</h1>
          <p class="page-subtitle">Analisis data mendalam untuk keputusan bisnis</p>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tab-bar" style="display:flex;gap:4px;border-bottom:2px solid var(--border);margin-bottom:24px;">
        ${TABS.map(t => `
          <button class="tab-btn ${t.id === _activeTab ? 'active' : ''}" data-tab="${t.id}"
            style="padding:10px 20px;background:none;border:none;cursor:pointer;font-weight:${t.id === _activeTab ? '600' : '400'};color:${t.id === _activeTab ? 'var(--primary)' : 'var(--text-muted)'};border-bottom:${t.id === _activeTab ? '2px solid var(--primary)' : '2px solid transparent'};margin-bottom:-2px;font-size:14px;">
            ${t.label}
          </button>`).join('')}
      </div>

      <!-- Tab Content -->
      <div id="bi-tab-content"></div>
    `;

    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        _activeTab = btn.dataset.tab;
        _destroyCharts();
        render();
      });
    });

    // Render active tab
    if (_activeTab === 'rfm')       _renderRFMTab();
    if (_activeTab === 'revenue')   _renderRevenueTab();
    if (_activeTab === 'products')  _renderProductsTab();
    if (_activeTab === 'customers') _renderCustomersTab();
  }

  // ═══════════════════════════════════════════════════════════
  // TAB 1 — RFM SEGMENTATION
  // ═══════════════════════════════════════════════════════════
  function _renderRFMTab() {
    const { data, segmentCounts, total } = BIService.getRFMSummary();
    _rfmData = data;

    const segEntries = Object.entries(segmentCounts).sort((a, b) => b[1] - a[1]);

    const container = document.getElementById('bi-tab-content');
    container.innerHTML = `
      <!-- Segment pills summary -->
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px;">
        <button class="seg-filter-btn ${_rfmSegFilter === '' ? 'active-seg' : ''}" data-seg=""
          style="padding:6px 14px;border-radius:20px;border:2px solid ${_rfmSegFilter === '' ? 'var(--primary)' : 'var(--border)'};background:${_rfmSegFilter === '' ? 'var(--primary)' : 'transparent'};color:${_rfmSegFilter === '' ? '#fff' : 'var(--text)'};cursor:pointer;font-size:12px;">
          Semua (${total})
        </button>
        ${segEntries.map(([seg, count]) => `
          <button class="seg-filter-btn ${_rfmSegFilter === seg ? 'active-seg' : ''}" data-seg="${seg}"
            style="padding:6px 14px;border-radius:20px;border:2px solid ${_rfmSegFilter === seg ? SEG_COLORS[seg] : 'var(--border)'};background:${_rfmSegFilter === seg ? SEG_COLORS[seg] : 'transparent'};color:${_rfmSegFilter === seg ? '#fff' : 'var(--text)'};cursor:pointer;font-size:12px;">
            ${seg} (${count})
          </button>`).join('')}
      </div>

      <div style="display:grid;grid-template-columns:1fr 280px;gap:20px;align-items:start;">
        <!-- Table -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Tabel RFM</h3>
            <div style="display:flex;gap:8px;">
              <input type="search" id="rfm-search" class="input" placeholder="Cari pelanggan…" style="width:200px;" value="${_rfmFilter}">
            </div>
          </div>
          <div class="table-wrapper">
            <table class="table" id="rfm-table">
              <thead>
                <tr>
                  <th class="sortable" data-field="customer_name">Pelanggan</th>
                  <th class="sortable text-right" data-field="recency">Recency (hari)</th>
                  <th class="sortable text-right" data-field="frequency">Frequency</th>
                  <th class="sortable text-right" data-field="monetary">Monetary</th>
                  <th class="sortable text-center" data-field="r_score">R</th>
                  <th class="sortable text-center" data-field="f_score">F</th>
                  <th class="sortable text-center" data-field="m_score">M</th>
                  <th class="sortable text-center" data-field="rfm_score">Total</th>
                  <th class="sortable" data-field="segment">Segmen</th>
                </tr>
              </thead>
              <tbody id="rfm-tbody"></tbody>
            </table>
          </div>
          <div id="rfm-pagination" class="pagination-wrapper"></div>
        </div>

        <!-- Donut chart -->
        <div class="card">
          <div class="card-header"><h3 class="card-title">Distribusi Segmen</h3></div>
          <canvas id="chart-rfm-seg" height="250"></canvas>
          <div style="padding:8px 16px 16px;">
            ${segEntries.map(([seg, count]) => `
              <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;">
                <span><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${SEG_COLORS[seg]};margin-right:6px;"></span>${seg}</span>
                <span style="color:var(--text-muted);">${count} (${total ? Utils.round(count/total*100,1) : 0}%)</span>
              </div>`).join('')}
          </div>
        </div>
      </div>
    `;

    // Bind segment filter buttons
    document.querySelectorAll('.seg-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        _rfmSegFilter = btn.dataset.seg;
        _rfmPage = 1;
        _renderRFMTable();
        render(); // Re-render to update active button styles
      });
    });

    document.getElementById('rfm-search')?.addEventListener('input', Utils.debounce(e => {
      _rfmFilter = e.target.value;
      _rfmPage = 1;
      _renderRFMTable();
    }, 300));

    document.querySelectorAll('#rfm-table th.sortable').forEach(th => {
      th.addEventListener('click', () => {
        const f = th.dataset.field;
        if (_rfmSort === f) _rfmSortDir = _rfmSortDir === 'asc' ? 'desc' : 'asc';
        else { _rfmSort = f; _rfmSortDir = 'desc'; }
        _renderRFMTable();
      });
    });

    _renderRFMTable();

    // Donut chart
    setTimeout(() => {
      const ctx = document.getElementById('chart-rfm-seg');
      if (!ctx) return;
      _chartInstances['rfm-seg'] = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: segEntries.map(([s]) => s),
          datasets: [{ data: segEntries.map(([, c]) => c), backgroundColor: segEntries.map(([s]) => SEG_COLORS[s] || '#ccc'), borderWidth: 2 }],
        },
        options: { responsive: true, plugins: { legend: { display: false } } },
      });
    }, 50);
  }

  function _renderRFMTable() {
    let data = _rfmData;
    if (_rfmSegFilter) data = data.filter(d => d.segment === _rfmSegFilter);
    if (_rfmFilter)    data = data.filter(d =>
      d.customer_name?.toLowerCase().includes(_rfmFilter.toLowerCase()) ||
      d.customer_id?.toLowerCase().includes(_rfmFilter.toLowerCase())
    );
    data = Utils.sortBy(data, _rfmSort, _rfmSortDir);
    const total = data.length;
    const start = (_rfmPage - 1) * _rfmPerPage;
    const page  = data.slice(start, start + _rfmPerPage);

    const tbody = document.getElementById('rfm-tbody');
    if (!tbody) return;

    if (!page.length) {
      tbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted">Tidak ada data</td></tr>';
    } else {
      tbody.innerHTML = page.map(d => {
        const sc = SEG_COLORS[d.segment] || '#999';
        return `
          <tr>
            <td>
              <div style="font-weight:600;font-size:13px;">${Utils.escapeHtml(d.customer_name)}</div>
              <div style="font-size:11px;color:var(--text-muted);">${d.customer_id}</div>
            </td>
            <td class="text-right">${d.recency}</td>
            <td class="text-right">${d.frequency}</td>
            <td class="text-right">${Utils.formatCurrency(d.monetary)}</td>
            <td class="text-center"><span class="badge" style="background:#dbeafe;color:#1d4ed8;">${d.r_score}</span></td>
            <td class="text-center"><span class="badge" style="background:#dcfce7;color:#15803d;">${d.f_score}</span></td>
            <td class="text-center"><span class="badge" style="background:#fef3c7;color:#92400e;">${d.m_score}</span></td>
            <td class="text-center"><strong>${d.rfm_score}</strong></td>
            <td><span class="badge" style="background:${sc}20;color:${sc};border:1px solid ${sc}40;font-size:11px;">${d.segment}</span></td>
          </tr>`;
      }).join('');
    }

    const pager = document.getElementById('rfm-pagination');
    if (pager) pager.innerHTML = Utils.renderPagination(total, _rfmPage, _rfmPerPage, pg => {
      _rfmPage = pg;
      _renderRFMTable();
    });
  }

  // ═══════════════════════════════════════════════════════════
  // TAB 2 — REVENUE ANALYTICS
  // ═══════════════════════════════════════════════════════════
  function _renderRevenueTab() {
    const monthly  = BIService.getRevenueByMonth();
    const byChannel = BIService.getRevenueByChannel();
    const byPayment = BIService.getRevenueByPayment();
    const byDay     = BIService.getRevenueByDay();

    const totalRev  = Utils.sumBy(monthly, 'revenue');
    const totalOrd  = Utils.sumBy(monthly, 'orders');
    const avgMonthly = monthly.length ? Utils.round(totalRev / monthly.length, 0) : 0;

    document.getElementById('bi-tab-content').innerHTML = `
      <!-- KPI Row -->
      <div class="kpi-grid" style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;margin-bottom:24px;">
        ${_kpi('Total Revenue', Utils.formatCurrency(totalRev))}
        ${_kpi('Total Transaksi', Utils.formatNumber(totalOrd))}
        ${_kpi('Rata-rata / Bulan', Utils.formatCurrency(avgMonthly))}
        ${_kpi('Avg Order Value', Utils.formatCurrency(totalOrd ? totalRev / totalOrd : 0))}
      </div>

      <!-- Monthly Revenue Line Chart -->
      <div class="card" style="margin-bottom:20px;">
        <div class="card-header"><h3 class="card-title">Revenue Bulanan</h3></div>
        <canvas id="chart-rev-monthly" height="80" style="padding:16px;"></canvas>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;">
        <!-- By Channel -->
        <div class="card">
          <div class="card-header"><h3 class="card-title">Revenue per Channel</h3></div>
          <canvas id="chart-rev-channel" height="220" style="padding:12px;"></canvas>
        </div>
        <!-- By Payment -->
        <div class="card">
          <div class="card-header"><h3 class="card-title">Revenue per Metode Pembayaran</h3></div>
          <canvas id="chart-rev-payment" height="220" style="padding:12px;"></canvas>
        </div>
      </div>

      <!-- By Day of Week -->
      <div class="card">
        <div class="card-header"><h3 class="card-title">Revenue per Hari (rata-rata)</h3></div>
        <canvas id="chart-rev-day" height="80" style="padding:16px;"></canvas>
      </div>
    `;

    const palette = ['#5C8B6E','#C4713E','#3b82f6','#8b5cf6','#f59e0b','#06b6d4','#ec4899'];

    setTimeout(() => {
      // Monthly line chart
      const ctxM = document.getElementById('chart-rev-monthly');
      if (ctxM) {
        _chartInstances['rev-monthly'] = new Chart(ctxM, {
          type: 'line',
          data: {
            labels: monthly.map(m => m.month),
            datasets: [{
              label: 'Revenue (Rp)',
              data:  monthly.map(m => m.revenue),
              borderColor: '#5C8B6E', backgroundColor: 'rgba(92,139,110,0.1)',
              fill: true, tension: 0.4, pointRadius: 4,
            }],
          },
          options: { responsive: true, plugins: { legend: { display: false } },
            scales: { y: { ticks: { callback: v => Utils.formatCurrencyShort(v) } } } },
        });
      }

      // Channel doughnut
      const ctxCh = document.getElementById('chart-rev-channel');
      if (ctxCh) {
        _chartInstances['rev-channel'] = new Chart(ctxCh, {
          type: 'doughnut',
          data: {
            labels: byChannel.map(c => c.channel),
            datasets: [{ data: byChannel.map(c => c.revenue), backgroundColor: palette, borderWidth: 2 }],
          },
          options: { responsive: true, plugins: { legend: { position: 'bottom' } } },
        });
      }

      // Payment doughnut
      const ctxPay = document.getElementById('chart-rev-payment');
      if (ctxPay) {
        _chartInstances['rev-payment'] = new Chart(ctxPay, {
          type: 'doughnut',
          data: {
            labels: byPayment.map(p => p.method),
            datasets: [{ data: byPayment.map(p => p.revenue), backgroundColor: palette.slice(2), borderWidth: 2 }],
          },
          options: { responsive: true, plugins: { legend: { position: 'bottom' } } },
        });
      }

      // Day bar chart
      const ctxDay = document.getElementById('chart-rev-day');
      if (ctxDay) {
        _chartInstances['rev-day'] = new Chart(ctxDay, {
          type: 'bar',
          data: {
            labels: byDay.map(d => d.day),
            datasets: [{
              label: 'Revenue',
              data:  byDay.map(d => d.revenue),
              backgroundColor: '#5C8B6E',
              borderRadius: 6,
            }],
          },
          options: { responsive: true, plugins: { legend: { display: false } },
            scales: { y: { ticks: { callback: v => Utils.formatCurrencyShort(v) } } } },
        });
      }
    }, 50);
  }

  // ═══════════════════════════════════════════════════════════
  // TAB 3 — PRODUCT ANALYTICS
  // ═══════════════════════════════════════════════════════════
  function _renderProductsTab() {
    const perf     = BIService.getProductPerformance().sort((a, b) => b.revenue - a.revenue);
    const byCategory = BIService.getProductByCategory();
    const top10rev = perf.slice(0, 10);
    const top10qty = [...perf].sort((a, b) => b.qty_sold - a.qty_sold).slice(0, 10);

    document.getElementById('bi-tab-content').innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;">
        <div class="card">
          <div class="card-header"><h3 class="card-title">Top 10 Produk — Revenue</h3></div>
          <canvas id="chart-prod-rev" height="260" style="padding:12px;"></canvas>
        </div>
        <div class="card">
          <div class="card-header"><h3 class="card-title">Top 10 Produk — Qty Terjual</h3></div>
          <canvas id="chart-prod-qty" height="260" style="padding:12px;"></canvas>
        </div>
      </div>

      <div class="card" style="margin-bottom:20px;">
        <div class="card-header"><h3 class="card-title">Revenue per Kategori</h3></div>
        <canvas id="chart-prod-cat" height="80" style="padding:16px;"></canvas>
      </div>

      <!-- Full table -->
      <div class="card">
        <div class="card-header"><h3 class="card-title">Performa Semua Produk</h3></div>
        <div class="table-wrapper">
          <table class="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Produk</th>
                <th>Kategori</th>
                <th class="text-right">Harga</th>
                <th class="text-right">Qty Terjual</th>
                <th class="text-right">Revenue</th>
                <th class="text-right">Transaksi</th>
              </tr>
            </thead>
            <tbody>
              ${perf.map((p, i) => `
                <tr>
                  <td style="color:var(--text-muted);">${i+1}</td>
                  <td><strong>${Utils.escapeHtml(p.product_name)}</strong></td>
                  <td><span class="badge badge-default">${Utils.escapeHtml(p.category)}</span></td>
                  <td class="text-right">${Utils.formatCurrency(p.price)}</td>
                  <td class="text-right">${Utils.formatNumber(p.qty_sold)}</td>
                  <td class="text-right">${Utils.formatCurrency(p.revenue)}</td>
                  <td class="text-right">${p.tx_count}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    const palette = ['#5C8B6E','#C4713E','#3b82f6','#8b5cf6','#f59e0b','#06b6d4','#ec4899','#10b981','#f43f5e','#84cc16'];

    setTimeout(() => {
      // Top 10 revenue horizontal bar
      const ctxRev = document.getElementById('chart-prod-rev');
      if (ctxRev) {
        _chartInstances['prod-rev'] = new Chart(ctxRev, {
          type: 'bar',
          data: {
            labels: top10rev.map(p => p.product_name),
            datasets: [{ label: 'Revenue', data: top10rev.map(p => p.revenue), backgroundColor: '#5C8B6E', borderRadius: 4 }],
          },
          options: {
            indexAxis: 'y', responsive: true,
            plugins: { legend: { display: false } },
            scales: { x: { ticks: { callback: v => Utils.formatCurrencyShort(v) } } },
          },
        });
      }

      // Top 10 qty
      const ctxQty = document.getElementById('chart-prod-qty');
      if (ctxQty) {
        _chartInstances['prod-qty'] = new Chart(ctxQty, {
          type: 'bar',
          data: {
            labels: top10qty.map(p => p.product_name),
            datasets: [{ label: 'Qty', data: top10qty.map(p => p.qty_sold), backgroundColor: '#C4713E', borderRadius: 4 }],
          },
          options: {
            indexAxis: 'y', responsive: true,
            plugins: { legend: { display: false } },
          },
        });
      }

      // Category bar
      const ctxCat = document.getElementById('chart-prod-cat');
      if (ctxCat) {
        _chartInstances['prod-cat'] = new Chart(ctxCat, {
          type: 'bar',
          data: {
            labels: byCategory.map(c => c.category),
            datasets: [{ label: 'Revenue', data: byCategory.map(c => c.revenue), backgroundColor: palette, borderRadius: 6 }],
          },
          options: {
            responsive: true, plugins: { legend: { display: false } },
            scales: { y: { ticks: { callback: v => Utils.formatCurrencyShort(v) } } },
          },
        });
      }
    }, 50);
  }

  // ═══════════════════════════════════════════════════════════
  // TAB 4 — CUSTOMER ANALYTICS
  // ═══════════════════════════════════════════════════════════
  function _renderCustomersTab() {
    const growth  = BIService.getCustomerGrowthByMonth();
    const byCity  = BIService.getCustomersByCity();
    const byGender = BIService.getCustomersByGender();
    const ageDist = BIService.getAgeDistribution();
    const cohort  = BIService.getCohortData();

    document.getElementById('bi-tab-content').innerHTML = `
      <!-- Customer Growth -->
      <div class="card" style="margin-bottom:20px;">
        <div class="card-header"><h3 class="card-title">Pertumbuhan Pelanggan Bulanan</h3></div>
        <canvas id="chart-cust-growth" height="80" style="padding:16px;"></canvas>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;margin-bottom:20px;">
        <!-- By Gender -->
        <div class="card">
          <div class="card-header"><h3 class="card-title">Berdasarkan Gender</h3></div>
          <canvas id="chart-cust-gender" height="200" style="padding:12px;"></canvas>
        </div>
        <!-- Age Distribution -->
        <div class="card">
          <div class="card-header"><h3 class="card-title">Distribusi Usia</h3></div>
          <canvas id="chart-cust-age" height="200" style="padding:12px;"></canvas>
        </div>
        <!-- Cohort -->
        <div class="card">
          <div class="card-header"><h3 class="card-title">Akuisisi per Bulan (Cohort)</h3></div>
          <canvas id="chart-cust-cohort" height="200" style="padding:12px;"></canvas>
        </div>
      </div>

      <!-- By City -->
      <div class="card">
        <div class="card-header"><h3 class="card-title">Pelanggan per Kota</h3></div>
        <canvas id="chart-cust-city" height="80" style="padding:16px;"></canvas>
      </div>
    `;

    const palette = ['#5C8B6E','#C4713E','#3b82f6','#8b5cf6','#f59e0b','#06b6d4','#ec4899'];

    setTimeout(() => {
      // Growth line + bar combo
      const ctxG = document.getElementById('chart-cust-growth');
      if (ctxG) {
        _chartInstances['cust-growth'] = new Chart(ctxG, {
          type: 'bar',
          data: {
            labels: growth.map(g => g.month),
            datasets: [
              { type: 'bar', label: 'Pelanggan Baru', data: growth.map(g => g.new_customers), backgroundColor: '#5C8B6E80', borderRadius: 4 },
              { type: 'line', label: 'Kumulatif', data: growth.map(g => g.cumulative), borderColor: '#C4713E', backgroundColor: 'transparent', yAxisID: 'y1', tension: 0.4, pointRadius: 3 },
            ],
          },
          options: {
            responsive: true,
            scales: {
              y:  { title: { display: true, text: 'Baru' } },
              y1: { position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'Kumulatif' } },
            },
          },
        });
      }

      // Gender pie
      const ctxGen = document.getElementById('chart-cust-gender');
      if (ctxGen) {
        _chartInstances['cust-gender'] = new Chart(ctxGen, {
          type: 'pie',
          data: {
            labels: byGender.map(g => g.gender),
            datasets: [{ data: byGender.map(g => g.count), backgroundColor: palette, borderWidth: 2 }],
          },
          options: { responsive: true, plugins: { legend: { position: 'bottom' } } },
        });
      }

      // Age bar
      const ctxAge = document.getElementById('chart-cust-age');
      if (ctxAge) {
        _chartInstances['cust-age'] = new Chart(ctxAge, {
          type: 'bar',
          data: {
            labels: ageDist.map(a => a.bracket),
            datasets: [{ label: 'Pelanggan', data: ageDist.map(a => a.count), backgroundColor: '#3b82f6', borderRadius: 4 }],
          },
          options: { responsive: true, plugins: { legend: { display: false } } },
        });
      }

      // Cohort bar
      const ctxCoh = document.getElementById('chart-cust-cohort');
      if (ctxCoh) {
        _chartInstances['cust-cohort'] = new Chart(ctxCoh, {
          type: 'bar',
          data: {
            labels: cohort.map(c => c.month),
            datasets: [{ label: 'Pelanggan', data: cohort.map(c => c.customers), backgroundColor: '#8b5cf6', borderRadius: 4 }],
          },
          options: { responsive: true, plugins: { legend: { display: false } } },
        });
      }

      // City bar
      const ctxCity = document.getElementById('chart-cust-city');
      if (ctxCity) {
        _chartInstances['cust-city'] = new Chart(ctxCity, {
          type: 'bar',
          data: {
            labels: byCity.map(c => c.city),
            datasets: [{ label: 'Pelanggan', data: byCity.map(c => c.count), backgroundColor: '#C4713E', borderRadius: 4 }],
          },
          options: { responsive: true, plugins: { legend: { display: false } } },
        });
      }
    }, 50);
  }

  // ─── Helpers ─────────────────────────────────────────────────
  function _kpi(label, value) {
    return `<div class="kpi-card"><div class="kpi-value">${value}</div><div class="kpi-label">${label}</div></div>`;
  }

  function _destroyCharts() {
    Object.values(_chartInstances).forEach(ch => { try { ch.destroy(); } catch {} });
    _chartInstances = {};
  }

  return { render };
})();

window.BIPage = BIPage;
