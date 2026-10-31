/**
 * RasaInsight — AI Insights Page (Presentation Layer)
 * Data-driven business narrative. No fake AI — all insights computed from real data.
 */

const AIInsightsPage = (() => {

  function render() {
    const main = document.getElementById('page-content');
    if (!main) return;

    const summary = BIService.getSummary();

    main.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">AI Insights</h1>
          <p class="page-subtitle">Ringkasan bisnis otomatis berdasarkan data nyata</p>
        </div>
        <button class="btn btn-outline" id="btn-refresh-insights">↺ Perbarui</button>
      </div>
      <div id="insights-body"></div>
    `;

    document.getElementById('btn-refresh-insights')?.addEventListener('click', render);

    _renderInsights(summary);
  }

  function _renderInsights(s) {
    const body = document.getElementById('insights-body');
    if (!body) return;

    const insights = _generateInsights(s);
    const rfm      = BIService.getRFMSummary();
    const topProds = BIService.getTopProducts(5, 'revenue');
    const sentTrend = BIService.getSentimentTrend();
    const feedback = FeedbackService.getStats();

    body.innerHTML = `
      <!-- Health Score -->
      <div class="card" style="margin-bottom:20px;border-left:4px solid var(--primary);">
        <div style="padding:20px;">
          <div style="display:flex;align-items:center;gap:16px;">
            <div style="width:64px;height:64px;border-radius:50%;background:${_scoreColor(s._healthScore)};display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;color:#fff;flex-shrink:0;">${s._healthScore}</div>
            <div>
              <div style="font-size:18px;font-weight:700;margin-bottom:4px;">Business Health Score</div>
              <div style="color:var(--text-muted);font-size:14px;">${_scoreLabel(s._healthScore)} — berdasarkan revenue, kepuasan pelanggan, dan penanganan komplain.</div>
            </div>
          </div>
        </div>
      </div>

      <!-- KPI Summary Row -->
      <div class="kpi-grid" style="grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:16px;margin-bottom:24px;">
        ${_kpi('Total Revenue', Utils.formatCurrency(s.revenue))}
        ${_kpi('Total Transaksi', Utils.formatNumber(s.totalOrders))}
        ${_kpi('Total Pelanggan', Utils.formatNumber(s.totalCustomers))}
        ${_kpi('Avg Order Value', Utils.formatCurrency(s.avgOrder))}
        ${_kpi('Rating Rata-rata', Utils.round(s.avgRating, 2) + ' / 5')}
        ${_kpi('Sentimen Positif', s.positiveSentimentPct + '%')}
        ${_kpi('Resolution Rate', s.complaintResolutionRate + '%')}
        ${_kpi('Poin Loyalty', Utils.formatNumber(s.loyaltyPoints))}
      </div>

      <!-- Insight Cards -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;">
        ${insights.map(ins => `
          <div class="card" style="border-left:4px solid ${ins.color};">
            <div style="padding:16px;">
              <div style="display:flex;align-items:flex-start;gap:12px;">
                <span style="font-size:28px;flex-shrink:0;">${ins.icon}</span>
                <div>
                  <div style="font-weight:700;font-size:14px;margin-bottom:4px;color:${ins.color};">${ins.title}</div>
                  <div style="font-size:13px;line-height:1.6;color:var(--text);">${ins.body}</div>
                  ${ins.action ? `<div style="margin-top:8px;font-size:12px;background:${ins.color}15;color:${ins.color};padding:6px 10px;border-radius:6px;">💡 ${ins.action}</div>` : ''}
                </div>
              </div>
            </div>
          </div>`).join('')}
      </div>

      <!-- RFM Snapshot -->
      <div class="card" style="margin-bottom:20px;">
        <div class="card-header"><h3 class="card-title">Snapshot RFM Segmentasi</h3></div>
        <div style="display:flex;flex-wrap:wrap;gap:10px;padding:16px;">
          ${Object.entries(rfm.segmentCounts).sort((a,b) => b[1]-a[1]).map(([seg, count]) => {
            const pct = rfm.total ? Utils.round(count/rfm.total*100,1) : 0;
            return `<div style="padding:10px 16px;border-radius:8px;background:var(--surface-2);min-width:140px;">
              <div style="font-weight:700;font-size:18px;">${count}</div>
              <div style="font-size:12px;font-weight:600;">${seg}</div>
              <div style="font-size:11px;color:var(--text-muted);">${pct}% dari total</div>
            </div>`;
          }).join('')}
        </div>
      </div>

      <!-- Top 5 Products -->
      <div class="card" style="margin-bottom:20px;">
        <div class="card-header"><h3 class="card-title">Top 5 Produk Terlaris (Revenue)</h3></div>
        <div style="padding:16px;">
          ${topProds.map((p, i) => {
            const maxRev = topProds[0].revenue || 1;
            const pct    = Utils.round((p.revenue / maxRev) * 100, 0);
            return `<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
              <span style="width:20px;font-weight:700;color:var(--text-muted);">${i+1}</span>
              <span style="min-width:160px;font-size:13px;font-weight:600;">${Utils.escapeHtml(p.product_name)}</span>
              <div style="flex:1;height:12px;background:var(--surface-2);border-radius:6px;overflow:hidden;">
                <div style="height:100%;width:${pct}%;background:var(--primary);border-radius:6px;"></div>
              </div>
              <span style="min-width:100px;text-align:right;font-size:13px;">${Utils.formatCurrency(p.revenue)}</span>
            </div>`;
          }).join('')}
        </div>
      </div>

      <!-- Sentiment Trend Table -->
      <div class="card">
        <div class="card-header"><h3 class="card-title">Tren Sentimen Bulanan</h3></div>
        <div class="table-wrapper">
          <table class="table">
            <thead>
              <tr><th>Bulan</th><th class="text-center">Positif</th><th class="text-center">Netral</th><th class="text-center">Negatif</th><th class="text-right">Sentimen Positif %</th></tr>
            </thead>
            <tbody>
              ${sentTrend.map(t => {
                const total = t.Positive + t.Neutral + t.Negative || 1;
                const pct   = Utils.round((t.Positive / total) * 100, 1);
                return `<tr>
                  <td>${t.month}</td>
                  <td class="text-center"><span class="badge badge-success">${t.Positive}</span></td>
                  <td class="text-center"><span class="badge badge-warning">${t.Neutral}</span></td>
                  <td class="text-center"><span class="badge badge-danger">${t.Negative}</span></td>
                  <td class="text-right">${pct}%</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // ─── Generate contextual insights ─────────────────────────
  function _generateInsights(s) {
    const insights = [];

    // Revenue growth
    if (s.revGrowth !== null) {
      const growing = s.revGrowth >= 0;
      insights.push({
        icon:   growing ? '📈' : '📉',
        title:  growing ? 'Revenue Tumbuh Positif' : 'Revenue Menurun',
        body:   `Bulan ${s.lastMonth || 'terakhir'} menunjukkan perubahan revenue sebesar ${s.revGrowth >= 0 ? '+' : ''}${Utils.round(s.revGrowth, 1)}% dibanding bulan sebelumnya.`,
        action: growing ? 'Pertahankan momentum dengan program promosi rutin.' : 'Evaluasi strategi penjualan dan tingkatkan kampanye marketing.',
        color:  growing ? '#16a34a' : '#dc2626',
      });
    }

    // Average order value
    insights.push({
      icon:  '🛒',
      title: 'Rata-rata Nilai Transaksi',
      body:  `Nilai rata-rata setiap transaksi adalah ${Utils.formatCurrency(s.avgOrder)}. Dengan total ${Utils.formatNumber(s.totalOrders)} transaksi dari ${Utils.formatNumber(s.totalCustomers)} pelanggan.`,
      action: s.avgOrder < 50000
        ? 'Pertimbangkan strategi upselling atau bundling produk.'
        : 'Avg order value sudah baik. Fokus pada peningkatan frekuensi pembelian.',
      color: '#2563eb',
    });

    // Customer satisfaction
    const goodSat = s.avgRating >= 4 && s.positiveSentimentPct >= 60;
    insights.push({
      icon:  goodSat ? '⭐' : '⚠️',
      title: goodSat ? 'Kepuasan Pelanggan Tinggi' : 'Kepuasan Perlu Ditingkatkan',
      body:  `Rating rata-rata: ${Utils.round(s.avgRating, 2)}/5 dengan ${s.positiveSentimentPct}% sentimen positif dari total feedback yang masuk.`,
      action: !goodSat
        ? 'Tinjau feedback negatif dan identifikasi pola keluhan untuk perbaikan layanan.'
        : 'Manfaatkan ulasan positif untuk promosi social proof.',
      color: goodSat ? '#f59e0b' : '#ea580c',
    });

    // Complaint resolution
    const goodResolution = s.complaintResolutionRate >= 80;
    insights.push({
      icon:  goodResolution ? '✅' : '🚨',
      title: goodResolution ? 'Penanganan Komplain Efektif' : 'Komplain Belum Terselesaikan',
      body:  `Resolution rate: ${s.complaintResolutionRate}%. ${s.openComplaints > 0
        ? `Masih ada ${s.openComplaints} komplain yang belum diselesaikan.`
        : 'Semua komplain telah ditangani.'}`,
      action: !goodResolution
        ? 'Prioritaskan penyelesaian komplain dengan status "High" segera.'
        : null,
      color: goodResolution ? '#16a34a' : '#dc2626',
    });

    // Loyalty
    insights.push({
      icon:  '🏆',
      title: 'Program Loyalitas',
      body:  `Total ${Utils.formatNumber(s.loyaltyPoints)} poin terkumpul dari seluruh transaksi. Program loyalitas aktif mendorong pembelian berulang.`,
      action: 'Pertimbangkan tier reward (Silver/Gold/Platinum) untuk meningkatkan engagement.',
      color: '#7c3aed',
    });

    // RFM champion insight
    const rfmSum = BIService.getRFMSummary();
    const champions  = rfmSum.segmentCounts['Champions']     || 0;
    const atRisk     = rfmSum.segmentCounts['At Risk']        || 0;
    const cantLose   = rfmSum.segmentCounts['Cant Lose Them'] || 0;
    const urgent     = atRisk + cantLose;
    if (urgent > 0) {
      insights.push({
        icon:  '🔔',
        title: 'Pelanggan Berisiko Churn',
        body:  `${urgent} pelanggan masuk segmen "At Risk" atau "Can't Lose Them". Mereka dulu aktif berbelanja namun kini jarang kembali.`,
        action: 'Kirim penawaran eksklusif atau voucher diskon untuk reaktivasi pelanggan ini.',
        color: '#dc2626',
      });
    }
    if (champions > 0) {
      insights.push({
        icon:  '🥇',
        title: `${champions} Pelanggan Champions`,
        body:  `Anda memiliki ${champions} pelanggan kategori Champions — paling sering, paling baru, dan paling besar pengeluarannya.`,
        action: 'Berikan apresiasi khusus atau akses early access produk baru untuk mempertahankan mereka.',
        color: '#16a34a',
      });
    }

    // Compute health score (store in summary for display)
    s._healthScore = _computeHealthScore(s);
    return insights;
  }

  function _computeHealthScore(s) {
    let score = 0;
    // Revenue growth (max 20)
    if (s.revGrowth !== null) score += s.revGrowth > 0 ? 20 : (s.revGrowth > -5 ? 10 : 5);
    else score += 10;
    // Avg rating (max 25)
    score += Math.round((s.avgRating / 5) * 25);
    // Sentiment positive % (max 20)
    score += Math.round((s.positiveSentimentPct / 100) * 20);
    // Resolution rate (max 20)
    score += Math.round((s.complaintResolutionRate / 100) * 20);
    // Open complaints penalty (max -10)
    if (s.openComplaints > 10) score -= 10;
    else if (s.openComplaints > 5) score -= 5;
    return Math.min(100, Math.max(0, score));
  }

  function _scoreColor(score) {
    if (score >= 75) return '#16a34a';
    if (score >= 50) return '#f59e0b';
    return '#dc2626';
  }

  function _scoreLabel(score) {
    if (score >= 75) return 'Bisnis Sehat';
    if (score >= 50) return 'Perlu Perhatian';
    return 'Butuh Tindakan Segera';
  }

  function _kpi(label, value) {
    return `<div class="kpi-card"><div class="kpi-value">${value}</div><div class="kpi-label">${label}</div></div>`;
  }

  return { render };
})();

window.AIInsightsPage = AIInsightsPage;
