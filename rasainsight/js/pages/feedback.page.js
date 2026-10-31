/**
 * RasaInsight — Feedback Page (Presentation Layer)
 * Customer feedback list, sentiment analysis, CRUD.
 */

const FeedbackPage = (() => {

  let _currentPage = 1;
  const _perPage   = 15;
  let _filtered    = [];
  let _sortField   = 'feedback_date';
  let _sortDir     = 'desc';

  // ─── Main Render ─────────────────────────────────────────────
  function render() {
    const main = document.getElementById('page-content');
    if (!main) return;

    const stats = FeedbackService.getStats();

    main.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Feedback Pelanggan</h1>
          <p class="page-subtitle">Ulasan dan sentimen pelanggan</p>
        </div>
        <button class="btn btn-primary" id="btn-add-feedback">+ Tambah Feedback</button>
      </div>

      <!-- KPI Cards -->
      <div class="kpi-grid" style="grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:16px;margin-bottom:24px;">
        ${_kpiCard('Total Feedback', stats.total, '💬')}
        ${_kpiCard('Rating Rata-rata', Utils.round(stats.avgRating, 2) + ' / 5', '⭐')}
        ${_kpiCard('Positif', stats.positive, '😊', 'success')}
        ${_kpiCard('Negatif', stats.negative, '😞', 'danger')}
        ${_kpiCard('Netral', stats.neutral, '😐', 'warning')}
      </div>

      <!-- Rating Distribution -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px;">
        <div class="card">
          <div class="card-header"><h3 class="card-title">Distribusi Rating</h3></div>
          <div style="padding:16px 16px 0;">
            ${[5,4,3,2,1].map(r => {
              const count = stats.ratingDist[r] || 0;
              const pct   = stats.total ? Utils.round((count / stats.total) * 100, 1) : 0;
              return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
                <span style="width:32px;font-size:12px;font-weight:600;">${r}★</span>
                <div style="flex:1;height:12px;background:var(--surface-2);border-radius:6px;overflow:hidden;">
                  <div style="height:100%;width:${pct}%;background:${r >= 4 ? 'var(--success)' : r === 3 ? 'var(--warning)' : 'var(--danger)'};border-radius:6px;"></div>
                </div>
                <span style="width:48px;font-size:12px;color:var(--text-muted);">${count} (${pct}%)</span>
              </div>`;
            }).join('')}
          </div>
        </div>
        <div class="card">
          <div class="card-header"><h3 class="card-title">Distribusi Sumber</h3></div>
          <div style="padding:16px;">
            ${Object.entries(stats.sourceDist).map(([src, count]) => {
              const pct = stats.total ? Utils.round((count / stats.total) * 100, 1) : 0;
              return `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                <span style="font-size:13px;">${Utils.escapeHtml(src)}</span>
                <div style="display:flex;align-items:center;gap:8px;">
                  <div style="width:80px;height:8px;background:var(--surface-2);border-radius:4px;overflow:hidden;">
                    <div style="height:100%;width:${pct}%;background:var(--primary);border-radius:4px;"></div>
                  </div>
                  <span style="font-size:12px;color:var(--text-muted);min-width:40px;">${count}</span>
                </div>
              </div>`;
            }).join('')}
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Semua Feedback</h3>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <input type="search" id="fb-search" class="input" placeholder="Cari teks / pelanggan…" style="width:200px;">
            <select id="fb-sentiment" class="input select" style="width:130px;">
              <option value="">Semua Sentimen</option>
              <option>Positive</option><option>Neutral</option><option>Negative</option>
            </select>
            <select id="fb-source" class="input select" style="width:130px;">
              <option value="">Semua Sumber</option>
              ${FeedbackService.getSources().map(s => `<option>${Utils.escapeHtml(s)}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="table-wrapper">
          <table class="table" id="fb-table">
            <thead>
              <tr>
                <th class="sortable" data-field="feedback_id">ID</th>
                <th class="sortable" data-field="customer_id">Pelanggan</th>
                <th class="sortable" data-field="feedback_date">Tanggal</th>
                <th class="sortable" data-field="source">Sumber</th>
                <th class="sortable text-center" data-field="rating">Rating</th>
                <th class="sortable text-center" data-field="sentiment_label">Sentimen</th>
                <th>Teks</th>
                <th class="text-center">Aksi</th>
              </tr>
            </thead>
            <tbody id="fb-tbody"></tbody>
          </table>
        </div>
        <div id="fb-pagination" class="pagination-wrapper"></div>
      </div>
    `;

    _bindEvents();
    _loadTable();
  }

  function _kpiCard(label, value, icon, color = 'primary') {
    return `<div class="kpi-card"><div class="kpi-icon">${icon}</div><div class="kpi-value" style="color:var(--${color})">${value}</div><div class="kpi-label">${label}</div></div>`;
  }

  function _bindEvents() {
    document.getElementById('fb-search')?.addEventListener('input', Utils.debounce(_applyFilters, 300));
    document.getElementById('fb-sentiment')?.addEventListener('change', _applyFilters);
    document.getElementById('fb-source')?.addEventListener('change',   _applyFilters);
    document.getElementById('btn-add-feedback')?.addEventListener('click', () => _showForm());

    document.querySelectorAll('#fb-table th.sortable').forEach(th => {
      th.addEventListener('click', () => {
        const f = th.dataset.field;
        if (_sortField === f) _sortDir = _sortDir === 'asc' ? 'desc' : 'asc';
        else { _sortField = f; _sortDir = 'desc'; }
        _loadTable();
      });
    });

    document.getElementById('fb-tbody')?.addEventListener('click', e => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const id = btn.dataset.id;
      if (btn.dataset.action === 'edit')   _showForm(id);
      if (btn.dataset.action === 'delete') _confirmDelete(id);
      if (btn.dataset.action === 'detail') _showDetail(id);
    });
  }

  function _applyFilters() {
    const query    = document.getElementById('fb-search')?.value    || '';
    const sentiment = document.getElementById('fb-sentiment')?.value || '';
    const source    = document.getElementById('fb-source')?.value   || '';
    _currentPage = 1;
    _filtered = FeedbackService.search(query, { sentiment, source });
    _renderTable();
  }

  function _loadTable() {
    _filtered = FeedbackService.getAll();
    _renderTable();
  }

  function _renderTable() {
    const sorted   = Utils.sortBy(_filtered, _sortField, _sortDir);
    const enriched = FeedbackService.getEnriched(sorted);
    const total    = enriched.length;
    const start    = (_currentPage - 1) * _perPage;
    const page     = enriched.slice(start, start + _perPage);

    const tbody = document.getElementById('fb-tbody');
    if (!tbody) return;

    if (!page.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">Tidak ada feedback</td></tr>';
    } else {
      tbody.innerHTML = page.map(f => {
        const sentimentClass = f.sentiment_label === 'Positive' ? 'success'
                             : f.sentiment_label === 'Negative' ? 'danger' : 'warning';
        const stars = '★'.repeat(Number(f.rating) || 0) + '☆'.repeat(5 - (Number(f.rating) || 0));
        return `
          <tr>
            <td><span class="badge badge-info" style="font-size:10px;">${f.feedback_id}</span></td>
            <td>
              <div style="font-weight:600;font-size:13px;">${Utils.escapeHtml(f.customer?.customer_name || f.customer_id)}</div>
              <div style="font-size:11px;color:var(--text-muted);">${f.customer_id}</div>
            </td>
            <td>${Utils.formatDate(f.feedback_date)}</td>
            <td><span class="badge badge-default">${Utils.escapeHtml(f.source || '—')}</span></td>
            <td class="text-center"><span style="color:#f59e0b;letter-spacing:1px;font-size:13px;" title="${f.rating}/5">${stars}</span></td>
            <td class="text-center"><span class="badge badge-${sentimentClass}">${f.sentiment_label || '—'}</span></td>
            <td style="max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;" title="${Utils.escapeHtml(f.feedback_text || '')}">${Utils.escapeHtml(f.feedback_text || '—')}</td>
            <td class="text-center" style="white-space:nowrap;">
              <button class="btn btn-sm btn-ghost" data-action="detail" data-id="${f.feedback_id}" title="Lihat">👁</button>
              <button class="btn btn-sm btn-ghost" data-action="edit"   data-id="${f.feedback_id}" title="Edit">✏</button>
              <button class="btn btn-sm btn-ghost" data-action="delete" data-id="${f.feedback_id}" title="Hapus" style="color:var(--danger)">🗑</button>
            </td>
          </tr>`;
      }).join('');
    }

    const pager = document.getElementById('fb-pagination');
    if (pager) pager.innerHTML = Utils.renderPagination(total, _currentPage, _perPage, pg => {
      _currentPage = pg;
      _renderTable();
    });
  }

  // ─── Detail Modal ─────────────────────────────────────────────
  function _showDetail(id) {
    const f = FeedbackService.getDetail(id);
    if (!f) return;
    const sentimentClass = f.sentiment_label === 'Positive' ? 'success'
                         : f.sentiment_label === 'Negative' ? 'danger' : 'warning';
    const stars = '★'.repeat(Number(f.rating) || 0) + '☆'.repeat(5 - (Number(f.rating) || 0));
    Modal.open({
      title: `Feedback — ${f.feedback_id}`,
      body: `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
          <div><span class="form-label">Pelanggan</span><div>${Utils.escapeHtml(f.customer?.customer_name || f.customer_id)}</div></div>
          <div><span class="form-label">Transaksi</span><div>${f.transaction_id || '—'}</div></div>
          <div><span class="form-label">Tanggal</span><div>${Utils.formatDate(f.feedback_date)}</div></div>
          <div><span class="form-label">Sumber</span><div>${Utils.escapeHtml(f.source || '—')}</div></div>
          <div><span class="form-label">Rating</span><div style="color:#f59e0b;">${stars} (${f.rating}/5)</div></div>
          <div><span class="form-label">Sentimen</span><div><span class="badge badge-${sentimentClass}">${f.sentiment_label}</span></div></div>
        </div>
        <div class="form-group">
          <span class="form-label">Teks Feedback</span>
          <div style="background:var(--surface-2);border-radius:8px;padding:12px;font-size:13px;line-height:1.6;">${Utils.escapeHtml(f.feedback_text || 'Tidak ada teks')}</div>
        </div>
      `,
      hideConfirm: true,
      cancelLabel: 'Tutup',
    });
  }

  // ─── Add/Edit Form ─────────────────────────────────────────────
  function _showForm(id = null) {
    const fb   = id ? FeedbackService.getById(id) : null;
    const customers = CustomerRepo.findAll().sort((a, b) => a.customer_name.localeCompare(b.customer_name));

    Modal.open({
      title: id ? 'Edit Feedback' : 'Tambah Feedback Baru',
      body: `
        <div class="form-group">
          <label class="form-label">Pelanggan *</label>
          <select id="fb-form-customer" class="input select">
            <option value="">-- Pilih Pelanggan --</option>
            ${customers.map(c => `<option value="${c.customer_id}" ${fb?.customer_id === c.customer_id ? 'selected' : ''}>${Utils.escapeHtml(c.customer_name)}</option>`).join('')}
          </select>
          <div class="form-error" id="err-fb-customer"></div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div class="form-group">
            <label class="form-label">Tanggal</label>
            <input type="date" id="fb-form-date" class="input" value="${fb?.feedback_date?.slice(0,10) || Utils.toISODate(new Date())}">
          </div>
          <div class="form-group">
            <label class="form-label">Sumber</label>
            <select id="fb-form-source" class="input select">
              ${['Google Review','Instagram','WhatsApp','Manual','Email','Kunjungan Langsung'].map(s =>
                `<option ${fb?.source === s ? 'selected' : ''}>${s}</option>`
              ).join('')}
            </select>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div class="form-group">
            <label class="form-label">Rating (1–5) *</label>
            <input type="number" id="fb-form-rating" class="input" min="1" max="5" value="${fb?.rating || ''}">
            <div class="form-error" id="err-fb-rating"></div>
          </div>
          <div class="form-group">
            <label class="form-label">Sentimen</label>
            <select id="fb-form-sentiment" class="input select">
              ${['Positive','Neutral','Negative'].map(s =>
                `<option ${fb?.sentiment_label === s ? 'selected' : ''}>${s}</option>`
              ).join('')}
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Teks Feedback</label>
          <textarea id="fb-form-text" class="input" rows="3" placeholder="Tulis feedback pelanggan…">${Utils.escapeHtml(fb?.feedback_text || '')}</textarea>
        </div>
      `,
      confirmLabel: id ? 'Simpan Perubahan' : 'Tambah Feedback',
      onConfirm() {
        const data = {
          customer_id:     document.getElementById('fb-form-customer')?.value,
          feedback_date:   document.getElementById('fb-form-date')?.value,
          source:          document.getElementById('fb-form-source')?.value,
          rating:          document.getElementById('fb-form-rating')?.value,
          sentiment_label: document.getElementById('fb-form-sentiment')?.value,
          feedback_text:   document.getElementById('fb-form-text')?.value,
        };
        try {
          if (id) FeedbackService.update(id, data);
          else    FeedbackService.create(data);
          Modal.close();
          Toast.success(id ? 'Feedback diperbarui!' : 'Feedback ditambahkan!');
          _loadTable();
        } catch (err) {
          if (err.validation) {
            if (err.validation.customer_id) {
              const el = document.getElementById('err-fb-customer');
              if (el) el.textContent = err.validation.customer_id;
            }
            if (err.validation.rating) {
              const el = document.getElementById('err-fb-rating');
              if (el) el.textContent = err.validation.rating;
            }
          } else {
            Toast.error(err.message || 'Gagal menyimpan');
          }
        }
      },
    });
  }

  // ─── Delete ─────────────────────────────────────────────────
  function _confirmDelete(id) {
    const fb = FeedbackService.getById(id);
    if (!fb) return;
    Modal.confirm(
      `Hapus feedback ${id}? Tindakan ini tidak dapat dibatalkan.`,
      () => {
        try {
          FeedbackService.remove(id);
          Toast.success('Feedback dihapus');
          _loadTable();
        } catch (e) {
          Toast.error(e.message);
        }
      }
    );
  }

  return { render };
})();

window.FeedbackPage = FeedbackPage;
