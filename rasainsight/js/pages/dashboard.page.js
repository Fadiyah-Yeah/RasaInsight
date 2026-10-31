/**
 * RasaInsight — Dashboard Page (Presentation Layer)
 * Renders KPI cards, charts, and recent transactions.
 */

const DashboardPage = (() => {

  // Chart.js palette
  const CHART_COLORS = {
    primary:  '#5C8B6E',
    accent:   '#C4714A',
    blue:     '#3A6FA8',
    purple:   '#7C5CD8',
    amber:    '#C4903A',
    green:    '#4A8C6A',
    red:      '#B54B3C',
    muted:    '#9C7D66',
  };

  const PALETTE = [
    CHART_COLORS.primary, CHART_COLORS.accent, CHART_COLORS.blue,
    CHART_COLORS.purple, CHART_COLORS.amber, CHART_COLORS.green,
    CHART_COLORS.red, CHART_COLORS.muted,
  ];

  let charts = {};

  function destroyCharts() {
    Object.values(charts).forEach(c => c && c.destroy && c.destroy());
    charts = {};
  }

  function render() {
    destroyCharts();
    const kpis = DashboardService.getKPIs();
    const monthly = DashboardService.getMonthlyRevenue();
    const topProducts = DashboardService.getTopProducts(6);
    const byChannel = DashboardService.getSalesByChannel();
    const byPayment = DashboardService.getSalesByPayment();
    const recent = DashboardService.getRecentTransactions(8);
    const sentiment = DashboardService.getSentimentSummary();

    const content = document.getElementById('page-content');
    content.innerHTML = `
      <div class="page-header">
        <div class="page-header-left">
          <h1 class="page-title">Dashboard</h1>
          <p class="page-subtitle">Ringkasan performa bisnis ADA RASA</p>
        </div>
      </div>

      <!-- KPI Cards -->
      <div class="dashboard-grid" id="kpi-grid">
        ${renderKPICard('revenue',   'Total Revenue',   Utils.formatCurrency(kpis.revenue),
          kpis.txCount + ' transaksi', '#5C8B6E',
          `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>`)}
        ${renderKPICard('aov',       'Rata-Rata Order', Utils.formatCurrency(kpis.aov),
          'per transaksi', '#C4714A',
          `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>`)}
        ${renderKPICard('customers', 'Total Pelanggan', Utils.formatNumber(kpis.custCount),
          kpis.repeatCustomers + ' pelanggan repeat', '#3A6FA8',
          `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`)}
        ${renderKPICard('rating',    'Rating Rata-Rata', kpis.avgRating.toFixed(1) + ' / 5',
          sentiment.positive + ' feedback positif', '#C4903A',
          `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`)}
      </div>

      <!-- Row 1: Revenue Chart + Channel Donut -->
      <div class="dashboard-row main-side" style="margin-bottom:16px">
        <div class="chart-container">
          <div class="chart-header">
            <div>
              <div class="card-title">Tren Revenue Bulanan</div>
              <div class="card-subtitle">Mei – Oktober 2026</div>
            </div>
          </div>
          <div class="chart-body">
            <div class="chart-canvas-wrap" style="height:240px">
              <canvas id="chart-revenue"></canvas>
            </div>
          </div>
        </div>
        <div class="chart-container">
          <div class="chart-header">
            <div class="card-title">Sales Channel</div>
          </div>
          <div class="chart-body">
            <div class="chart-canvas-wrap" style="height:180px">
              <canvas id="chart-channel"></canvas>
            </div>
            <div id="channel-legend" style="margin-top:12px"></div>
          </div>
        </div>
      </div>

      <!-- Row 2: Top Products + Payment Methods -->
      <div class="dashboard-row two-col" style="margin-bottom:16px">
        <div class="chart-container">
          <div class="chart-header">
            <div class="card-title">Produk Terlaris</div>
          </div>
          <div class="chart-body">
            <div class="chart-canvas-wrap" style="height:220px">
              <canvas id="chart-products"></canvas>
            </div>
          </div>
        </div>
        <div class="chart-container">
          <div class="chart-header">
            <div class="card-title">Metode Pembayaran</div>
          </div>
          <div class="chart-body">
            <div class="chart-canvas-wrap" style="height:180px">
              <canvas id="chart-payment"></canvas>
            </div>
            <div id="payment-legend" style="margin-top:12px"></div>
          </div>
        </div>
      </div>

      <!-- Row 3: Recent Transactions + Sentiment -->
      <div class="dashboard-row main-side">
        <div class="card">
          <div class="card-header">
            <div class="card-title">Transaksi Terbaru</div>
            <a href="${Router.link('transactions')}" class="btn btn-ghost btn-sm">Lihat Semua</a>
          </div>
          <div class="table-container" style="border:none;border-radius:0">
            <table class="table">
              <thead><tr>
                <th>ID Transaksi</th>
                <th>Pelanggan</th>
                <th>Channel</th>
                <th>Total</th>
                <th>Status</th>
              </tr></thead>
              <tbody>
                ${recent.map(tx => `
                  <tr style="cursor:pointer" onclick="Router.navigate('/transactions/${tx.transaction_id}')">
                    <td><span class="mono text-xs">${tx.transaction_id}</span></td>
                    <td>
                      <div style="display:flex;align-items:center;gap:8px">
                        <div class="avatar avatar-sm">${Utils.getInitials(tx.customer?.customer_name || '?')}</div>
                        <span>${Utils.truncate(tx.customer?.customer_name || '-', 20)}</span>
                      </div>
                    </td>
                    <td>${tx.sales_channel || '-'}</td>
                    <td style="font-weight:600">${Utils.formatCurrency(tx.total_amount)}</td>
                    <td><span class="badge status-${(tx.transaction_status || '').toLowerCase()} no-dot">${tx.transaction_status}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:16px">
          <!-- Sentiment Card -->
          <div class="card">
            <div class="card-header">
              <div class="card-title">Sentimen Feedback</div>
            </div>
            <div class="card-body">
              <div class="chart-canvas-wrap" style="height:140px">
                <canvas id="chart-sentiment"></canvas>
              </div>
              <div style="margin-top:12px;display:flex;gap:12px;justify-content:center;font-size:12px;flex-wrap:wrap">
                <span style="color:var(--color-success)">● Positif: ${sentiment.positive}</span>
                <span style="color:var(--color-warning)">● Netral: ${sentiment.neutral}</span>
                <span style="color:var(--color-danger)">● Negatif: ${sentiment.negative}</span>
              </div>
            </div>
          </div>

          <!-- Complaint Card -->
          <div class="card">
            <div class="card-header">
              <div class="card-title">Keluhan Aktif</div>
              <a href="${Router.link('complaints')}" class="btn btn-ghost btn-sm">Kelola</a>
            </div>
            <div class="card-body">
              <div class="stat-row">
                <span class="stat-label">Belum Diselesaikan</span>
                <span class="stat-value" style="color:var(--color-danger)">${kpis.pendingComplaints}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Resolution Rate</span>
                <span class="stat-value" style="color:var(--color-success)">${Utils.formatPercent(kpis.resolutionRate)}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Total Keluhan</span>
                <span class="stat-value">${ComplaintRepo.count()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Render charts after DOM is ready
    requestAnimationFrame(() => {
      renderRevenueChart(monthly);
      renderChannelChart(byChannel);
      renderProductChart(topProducts);
      renderPaymentChart(byPayment);
      renderSentimentChart(sentiment);
    });
  }

  function renderKPICard(id, label, value, sub, color, iconSvg) {
    return `
      <div class="kpi-card" style="--kpi-color:${color};--kpi-icon-bg:${color}22">
        <div class="kpi-icon">${iconSvg}</div>
        <div class="kpi-label">${label}</div>
        <div class="kpi-value">${value}</div>
        <div class="text-xs text-muted">${sub}</div>
      </div>
    `;
  }

  function renderRevenueChart(data) {
    const ctx = document.getElementById('chart-revenue');
    if (!ctx || !data.length) return;
    charts.revenue = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map(d => d.monthLabel),
        datasets: [{
          label: 'Revenue',
          data: data.map(d => d.revenue),
          borderColor: CHART_COLORS.primary,
          backgroundColor: CHART_COLORS.primary + '18',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: CHART_COLORS.primary,
          pointRadius: 4,
          borderWidth: 2,
        }, {
          label: 'Transaksi',
          data: data.map(d => d.count * 10000), // scale for visibility
          borderColor: CHART_COLORS.accent + '80',
          backgroundColor: 'transparent',
          fill: false,
          tension: 0.4,
          pointRadius: 3,
          borderWidth: 1.5,
          borderDash: [4, 4],
          yAxisID: 'y2',
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ctx.datasetIndex === 0
                ? ' Revenue: ' + Utils.formatCurrency(ctx.raw)
                : ' Transaksi: ' + (ctx.raw / 10000),
            },
          },
        },
        scales: {
          y:  { ticks: { callback: v => Utils.formatCurrency(v, true), font: { size: 11 } }, grid: { color: '#E2D9CC44' } },
          y2: { display: false },
          x:  { ticks: { font: { size: 11 } }, grid: { display: false } },
        },
      },
    });
  }

  function renderChannelChart(data) {
    const ctx = document.getElementById('chart-channel');
    if (!ctx || !data.length) return;
    charts.channel = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: data.map(d => d.channel),
        datasets: [{ data: data.map(d => d.count), backgroundColor: PALETTE, borderWidth: 0, hoverOffset: 6 }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: ${ctx.raw} transaksi` } },
        },
        cutout: '68%',
      },
    });
    // Custom legend
    const legend = document.getElementById('channel-legend');
    if (legend) {
      legend.innerHTML = data.map((d, i) => `
        <div style="display:flex;align-items:center;justify-content:space-between;font-size:12px;margin:4px 0">
          <div style="display:flex;align-items:center;gap:6px">
            <span style="width:10px;height:10px;border-radius:50%;background:${PALETTE[i]};display:inline-block"></span>
            ${d.channel}
          </div>
          <span style="font-weight:600">${d.count}</span>
        </div>
      `).join('');
    }
  }

  function renderProductChart(data) {
    const ctx = document.getElementById('chart-products');
    if (!ctx || !data.length) return;
    charts.products = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map(d => Utils.truncate(d.product.product_name, 18)),
        datasets: [{
          data: data.map(d => d.revenue),
          backgroundColor: PALETTE.map(c => c + 'CC'),
          borderRadius: 4,
          borderSkipped: false,
        }],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (ctx) => ' ' + Utils.formatCurrency(ctx.raw) } },
        },
        scales: {
          x: { ticks: { callback: v => Utils.formatCurrency(v, true), font: { size: 10 } }, grid: { color: '#E2D9CC44' } },
          y: { ticks: { font: { size: 11 } }, grid: { display: false } },
        },
      },
    });
  }

  function renderPaymentChart(data) {
    const ctx = document.getElementById('chart-payment');
    if (!ctx || !data.length) return;
    charts.payment = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: data.map(d => d.method),
        datasets: [{ data: data.map(d => d.count), backgroundColor: PALETTE, borderWidth: 0, hoverOffset: 6 }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: ${ctx.raw}` } },
        },
        cutout: '68%',
      },
    });
    const legend = document.getElementById('payment-legend');
    if (legend) {
      legend.innerHTML = data.map((d, i) => `
        <div style="display:flex;align-items:center;justify-content:space-between;font-size:12px;margin:4px 0">
          <div style="display:flex;align-items:center;gap:6px">
            <span style="width:10px;height:10px;border-radius:50%;background:${PALETTE[i]};display:inline-block"></span>
            ${d.method}
          </div>
          <span style="font-weight:600">${d.count}</span>
        </div>
      `).join('');
    }
  }

  function renderSentimentChart(data) {
    const ctx = document.getElementById('chart-sentiment');
    if (!ctx) return;
    charts.sentiment = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Positif', 'Netral', 'Negatif'],
        datasets: [{
          data: [data.positive, data.neutral, data.negative],
          backgroundColor: [CHART_COLORS.green + 'CC', CHART_COLORS.amber + 'CC', CHART_COLORS.red + 'CC'],
          borderWidth: 0,
          hoverOffset: 6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        cutout: '65%',
      },
    });
  }

  return { render };
})();

window.DashboardPage = DashboardPage;
