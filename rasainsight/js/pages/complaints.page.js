/**
 * RasaInsight — Complaints Page (Presentation Layer)
 * Complaint list, status management, priority tracking.
 */

const ComplaintsPage = (() => {

  let _currentPage = 1;
  const _perPage   = 15;
  let _filtered    = [];
  let _sortField   = 'complaint_date';
  let _sortDir     = 'desc';

  // ─── Main Render ─────────────────────────────────────────────
  function render() {
    const main = document.getElementById('page-content');
    if (!main) return;

    const stats = ComplaintService.getStats();

    main.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Komplain Pelanggan</h1>
          <p class="page-subtitle">Kelola dan tindaklanjuti keluhan pelanggan</p>
        </div>
        <button class="btn btn-primary" id="btn-add-complaint">+ Tambah Komplain</button>
      </div>

      <!-- KPI Cards -->
      <div class="kpi-grid" style="grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:16px;margin-bottom:24px;">
        ${_kpiCard('Total Komplain', stats.total, '📋')}
        ${_kpiCard('Terbuka', stats.open, '🔴', 'danger')}
        ${_kpiCard('Dalam Proses', stats.pending, '🟡', 'warning')}
        ${_kpiCard('Terselesaikan', stats.resolved, '🟢', 'success')}
        ${_kpiCard('Resolution Rate', stats.resolutionRate + '%', '✅', 'primary')}
      </div>

      <!-- Priority & Category breakdown -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px;">
        <div class="card">
          <div class="card-header"><h3 class="card-title">Berdasarkan Prioritas</h3></div>
          <div style="padding:16px;">
            ${Object.entries(stats.priorityDist).map(([p, count]) => {
              const pct = stats.total ? Utils.round((count / stats.total) * 100, 1) : 0;
              const color = p === 'High' ? 'var(--danger)' : p === 'Medium' ? 'var(--warning)' : 'var(--success)';
              return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
                <span style="min-width:64px;font-size:12px;font-weight:600;color:${color};">${p}</span>
                <div style="flex:1;height:10px;background:var(--surface-2);border-radius:5px;overflow:hidden;">
                  <div style="height:100%;width:${pct}%;background:${color};border-radius:5px;"></div>
                </div>
                <span style="min-width:36px;font-size:12px;color:var(--text-muted);">${count}</span>
              </div>`;
            }).join('')}
          </div>
        </div>
        <div class="card">
          <div class="card-header"><h3 class="card-title">Berdasarkan Kategori</h3></div>
          <div style="padding:16px;">
            ${Object.entries(stats.categoryDist).map(([cat, count]) => {
              const pct = stats.total ? Utils.round((count / stats.total) * 100, 1) : 0;
              return `<div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:13px;">
                <span>${Utils.escapeHtml(cat)}</span>
                <span style="color:var(--text-muted);">${count} (${pct}%)</span>
              </div>`;
            }).join('')}
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Semua Komplain</h3>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <input type="search" id="comp-search" class="input" placeholder="Cari deskripsi / pelanggan…" style="width:200px;">
            <select id="comp-status" class="input select" style="width:130px;">
              <option value="">Semua Status</option>
              <option>Open</option><option>In Progress</option><option>Resolved</option>
            </select>
            <select id="comp-priority" class="input select" style="width:120px;">
              <option value="">Semua Prioritas</option>
              <option>High</option><option>Medium</option><option>Low</option>
            </select>
            <select id="comp-category" class="input select" style="width:150px;">
              <option value="">Semua Kategori</option>
              ${ComplaintService.getCategories().map(c => `<option>${Utils.escapeHtml(c)}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="table-wrapper">
          <table class="table" id="comp-table">
            <thead>
              <tr>
                <th class="sortable" data-field="complaint_id">ID</th>
                <th class="sortable" data-field="customer_id">Pelanggan</th>
                <th class="sortable" data-field="complaint_date">Tanggal</th>
                <th class="sortable" data-field="category">Kategori</th>
                <th class="sortable text-center" data-field="priority">Prioritas</th>
                <th class="sortable text-center" data-field="status">Status</th>
                <th>Deskripsi</th>
                <th class="text-center">Aksi</th>
              </tr>
            </thead>
            <tbody id="comp-tbody"></tbody>
          </table>
        </div>
        <div id="comp-pagination" class="pagination-wrapper"></div>
      </div>
    `;

    _bindEvents();
    _loadTable();
  }

  function _kpiCard(label, value, icon, color = 'primary') {
    return `<div class="kpi-card"><div class="kpi-icon">${icon}</div><div class="kpi-value" style="color:var(--${color})">${value}</div><div class="kpi-label">${label}</div></div>`;
  }

  function _bindEvents() {
    document.getElementById('comp-search')?.addEventListener('input', Utils.debounce(_applyFilters, 300));
    document.getElementById('comp-status')?.addEventListener('change',   _applyFilters);
    document.getElementById('comp-priority')?.addEventListener('change', _applyFilters);
    document.getElementById('comp-category')?.addEventListener('change', _applyFilters);
    document.getElementById('btn-add-complaint')?.addEventListener('click', () => _showForm());

    document.querySelectorAll('#comp-table th.sortable').forEach(th => {
      th.addEventListener('click', () => {
        const f = th.dataset.field;
        if (_sortField === f) _sortDir = _sortDir === 'asc' ? 'desc' : 'asc';
        else { _sortField = f; _sortDir = 'desc'; }
        _loadTable();
      });
    });

    document.getElementById('comp-tbody')?.addEventListener('click', e => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const id = btn.dataset.id;
      if (btn.dataset.action === 'detail')  _showDetail(id);
      if (btn.dataset.action === 'edit')    _showForm(id);
      if (btn.dataset.action === 'resolve') _showResolveModal(id);
      if (btn.dataset.action === 'delete')  _confirmDelete(id);
    });
  }

  function _applyFilters() {
    const query    = document.getElementById('comp-search')?.value   || '';
    const status   = document.getElementById('comp-status')?.value   || '';
    const priority = document.getElementById('comp-priority')?.value || '';
    const category = document.getElementById('comp-category')?.value || '';
    _currentPage = 1;
    _filtered = ComplaintService.search(query, { status, priority, category });
    _renderTable();
  }

  function _loadTable() {
    _filtered = ComplaintService.getAll();
    _renderTable();
  }

  function _renderTable() {
    const sorted   = Utils.sortBy(_filtered, _sortField, _sortDir);
    const enriched = ComplaintService.getEnriched(sorted);
    const total    = enriched.length;
    const start    = (_currentPage - 1) * _perPage;
    const page     = enriched.slice(start, start + _perPage);

    const tbody = document.getElementById('comp-tbody');
    if (!tbody) return;

    if (!page.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">Tidak ada komplain</td></tr>';
      document.getElementById('comp-pagination').innerHTML = '';
      return;
    }

    tbody.innerHTML = page.map(c => {
      const priorityColor = c.priority === 'High' ? 'danger'
                          : c.priority === 'Medium' ? 'warning' : 'success';
      const statusColor   = c.status === 'Resolved' ? 'success'
                          : c.status === 'In Progress' ? 'warning' : 'danger';
      return `
        <tr>
          <td><span class="badge badge-info" style="font-size:10px;">${c.complaint_id}</span></td>
          <td>
            <div style="font-weight:600;font-size:13px;">${Utils.escapeHtml(c.customer?.customer_name || c.customer_id)}</div>
            <div style="font-size:11px;color:var(--text-muted);">${c.customer_id}</div>
          </td>
          <td>${Utils.formatDate(c.complaint_date)}</td>
          <td><span class="badge badge-default" style="font-size:11px;">${Utils.escapeHtml(c.category || '—')}</span></td>
          <td class="text-center"><span class="badge badge-${priorityColor}">${c.priority}</span></td>
          <td class="text-center"><span class="badge badge-${statusColor}">${c.status}</span></td>
          <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;" title="${Utils.escapeHtml(c.description || '')}">${Utils.escapeHtml(c.description || '—')}</td>
          <td class="text-center" style="white-space:nowrap;">
            <button class="btn btn-sm btn-ghost" data-action="detail"  data-id="${c.complaint_id}" title="Lihat">👁</button>
            <button class="btn btn-sm btn-ghost" data-action="edit"    data-id="${c.complaint_id}" title="Edit">✏</button>
            ${c.status !== 'Resolved'
              ? `<button class="btn btn-sm btn-ghost" data-action="resolve" data-id="${c.complaint_id}" title="Selesaikan" style="color:var(--success)">✔</button>`
              : ''}
            <button class="btn btn-sm btn-ghost" data-action="delete"  data-id="${c.complaint_id}" title="Hapus" style="color:var(--danger)">🗑</button>
          </td>
        </tr>`;
    }).join('');

    const pager = document.getElementById('comp-pagination');
    if (pager) pager.innerHTML = Utils.renderPagination(total, _currentPage, _perPage, pg => {
      _currentPage = pg;
      _renderTable();
    });
  }

  // ─── Detail Modal ─────────────────────────────────────────────
  function _showDetail(id) {
    const c = ComplaintService.getDetail(id);
    if (!c) return;
    const priorityColor = c.priority === 'High' ? 'danger'
                        : c.priority === 'Medium' ? 'warning' : 'success';
    const statusColor   = c.status === 'Resolved' ? 'success'
                        : c.status === 'In Progress' ? 'warning' : 'danger';
    Modal.open({
      title: `Komplain — ${c.complaint_id}`,
      body: `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
          <div><span class="form-label">Pelanggan</span><div>${Utils.escapeHtml(c.customer?.customer_name || c.customer_id)}</div></div>
          <div><span class="form-label">Transaksi</span><div>${c.transaction_id || '—'}</div></div>
          <div><span class="form-label">Tanggal</span><div>${Utils.formatDate(c.complaint_date)}</div></div>
          <div><span class="form-label">Kategori</span><div>${Utils.escapeHtml(c.category || '—')}</div></div>
          <div><span class="form-label">Prioritas</span><div><span class="badge badge-${priorityColor}">${c.priority}</span></div></div>
          <div><span class="form-label">Status</span><div><span class="badge badge-${statusColor}">${c.status}</span></div></div>
        </div>
        <div class="form-group">
          <span class="form-label">Deskripsi</span>
          <div style="background:var(--surface-2);border-radius:8px;padding:12px;font-size:13px;line-height:1.6;">${Utils.escapeHtml(c.description || '—')}</div>
        </div>
        ${c.resolution_notes ? `
        <div class="form-group">
          <span class="form-label">Catatan Penyelesaian</span>
          <div style="background:#f0fdf4;border-radius:8px;padding:12px;font-size:13px;line-height:1.6;border:1px solid #bbf7d0;">${Utils.escapeHtml(c.resolution_notes)}</div>
        </div>` : ''}
      `,
      hideConfirm: true,
      cancelLabel: 'Tutup',
    });
  }

  // ─── Add/Edit Form ─────────────────────────────────────────────
  function _showForm(id = null) {
    const c = id ? ComplaintService.getById(id) : null;
    const customers = CustomerRepo.findAll().sort((a, b) => a.customer_name.localeCompare(b.customer_name));

    Modal.open({
      title: id ? 'Edit Komplain' : 'Tambah Komplain Baru',
      body: `
        <div class="form-group">
          <label class="form-label">Pelanggan *</label>
          <select id="comp-form-customer" class="input select">
            <option value="">-- Pilih Pelanggan --</option>
            ${customers.map(cu => `<option value="${cu.customer_id}" ${c?.customer_id === cu.customer_id ? 'selected' : ''}>${Utils.escapeHtml(cu.customer_name)}</option>`).join('')}
          </select>
          <div class="form-error" id="err-comp-customer"></div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div class="form-group">
            <label class="form-label">Tanggal</label>
            <input type="date" id="comp-form-date" class="input" value="${c?.complaint_date?.slice(0,10) || Utils.toISODate(new Date())}">
          </div>
          <div class="form-group">
            <label class="form-label">Kategori</label>
            <select id="comp-form-category" class="input select">
              ${['Pelayanan','Makanan & Minuman','Kebersihan','Antrian','Harga','Fasilitas','Lainnya'].map(cat =>
                `<option ${c?.category === cat ? 'selected' : ''}>${cat}</option>`
              ).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Prioritas</label>
            <select id="comp-form-priority" class="input select">
              ${['High','Medium','Low'].map(p => `<option ${c?.priority === p ? 'selected' : ''}>${p}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Status</label>
            <select id="comp-form-status" class="input select">
              ${['Open','In Progress','Resolved'].map(s => `<option ${c?.status === s ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Deskripsi *</label>
          <textarea id="comp-form-desc" class="input" rows="3" placeholder="Jelaskan keluhan pelanggan…">${Utils.escapeHtml(c?.description || '')}</textarea>
          <div class="form-error" id="err-comp-desc"></div>
        </div>
        <div class="form-group">
          <label class="form-label">Catatan Penyelesaian</label>
          <textarea id="comp-form-notes" class="input" rows="2" placeholder="Tindakan yang sudah diambil…">${Utils.escapeHtml(c?.resolution_notes || '')}</textarea>
        </div>
      `,
      confirmLabel: id ? 'Simpan Perubahan' : 'Tambah Komplain',
      onConfirm() {
        const data = {
          customer_id:      document.getElementById('comp-form-customer')?.value,
          complaint_date:   document.getElementById('comp-form-date')?.value,
          category:         document.getElementById('comp-form-category')?.value,
          priority:         document.getElementById('comp-form-priority')?.value,
          status:           document.getElementById('comp-form-status')?.value,
          description:      document.getElementById('comp-form-desc')?.value,
          resolution_notes: document.getElementById('comp-form-notes')?.value,
        };
        try {
          if (id) ComplaintService.update(id, data);
          else    ComplaintService.create(data);
          Modal.close();
          Toast.success(id ? 'Komplain diperbarui!' : 'Komplain ditambahkan!');
          render(); // Full re-render to update stats
        } catch (err) {
          if (err.validation) {
            const ec = document.getElementById('err-comp-customer');
            const ed = document.getElementById('err-comp-desc');
            if (ec && err.validation.customer_id) ec.textContent = err.validation.customer_id;
            if (ed && err.validation.description) ed.textContent = err.validation.description;
          } else {
            Toast.error(err.message || 'Gagal menyimpan');
          }
        }
      },
    });
  }

  // ─── Resolve Modal ────────────────────────────────────────────
  function _showResolveModal(id) {
    Modal.open({
      title: 'Selesaikan Komplain',
      body: `
        <p style="margin-bottom:12px;">Tambahkan catatan penyelesaian untuk komplain <strong>${id}</strong>:</p>
        <textarea id="resolve-notes" class="input" rows="3" placeholder="Tindakan yang sudah diambil untuk menyelesaikan keluhan…"></textarea>
      `,
      confirmLabel: 'Tandai Selesai',
      onConfirm() {
        const notes = document.getElementById('resolve-notes')?.value || '';
        try {
          ComplaintService.resolve(id, notes);
          Modal.close();
          AppShell.updateComplaintsBadge();
          Toast.success('Komplain telah diselesaikan');
          render();
        } catch (e) {
          Toast.error(e.message);
        }
      },
    });
  }

  // ─── Delete ────────────────────────────────────────────────
  function _confirmDelete(id) {
    Modal.confirm(
      `Hapus komplain ${id}? Tindakan ini tidak dapat dibatalkan.`,
      () => {
        try {
          ComplaintService.remove(id);
          AppShell.updateComplaintsBadge();
          Toast.success('Komplain dihapus');
          render();
        } catch (e) {
          Toast.error(e.message);
        }
      }
    );
  }

  return { render };
})();

window.ComplaintsPage = ComplaintsPage;
