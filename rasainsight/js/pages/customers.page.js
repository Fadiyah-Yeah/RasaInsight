/**
 * RasaInsight — Customers Page (Presentation Layer)
 * Full CRUD: list, search, filter, detail, add, edit, delete.
 */

const CustomersPage = (() => {

  // State
  let state = {
    query: '',
    filters: {},
    sort: { key: 'customer_name', dir: 'asc' },
    page: 1,
    perPage: 15,
    viewingId: null,
  };

  // ─── Render List View ───────────────────────────────────────
  function render(detailId = null) {
    if (detailId) { renderDetail(detailId); return; }
    state.viewingId = null;

    const cities = CustomerService.getCities();
    const content = document.getElementById('page-content');

    content.innerHTML = `
      <div class="page-header">
        <div class="page-header-left">
          <h1 class="page-title">Pelanggan</h1>
          <p class="page-subtitle">Kelola data pelanggan ADA RASA</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-primary" id="btn-add-customer">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Tambah Pelanggan
          </button>
        </div>
      </div>

      <!-- Filter Bar -->
      <div class="filter-bar">
        <div class="search-bar" style="flex:1;min-width:200px">
          <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input class="form-input" id="cust-search" type="text" placeholder="Cari nama, email, telepon, ID..." value="${Utils.escapeHtml(state.query)}">
        </div>
        <div class="form-select-wrapper" style="min-width:140px">
          <select class="form-select" id="cust-filter-city">
            <option value="">Semua Kota</option>
            ${cities.map(c => `<option value="${c}" ${state.filters.city === c ? 'selected' : ''}>${c}</option>`).join('')}
          </select>
        </div>
        <div class="form-select-wrapper" style="min-width:130px">
          <select class="form-select" id="cust-filter-gender">
            <option value="">Semua Gender</option>
            <option value="Male" ${state.filters.gender === 'Male' ? 'selected' : ''}>Laki-laki</option>
            <option value="Female" ${state.filters.gender === 'Female' ? 'selected' : ''}>Perempuan</option>
          </select>
        </div>
        <button class="btn btn-ghost btn-sm" id="cust-clear-filter">Reset</button>
      </div>

      <!-- Table -->
      <div class="card">
        <div id="cust-table-wrap"></div>
      </div>
    `;

    renderTable();
    bindListEvents();
  }

  function renderTable() {
    let data = CustomerService.search(state.query, state.filters);
    data = Utils.sortBy(data, state.sort.key, state.sort.dir);
    const paged = Utils.paginate(data, state.page, state.perPage);

    const wrap = document.getElementById('cust-table-wrap');
    if (!wrap) return;

    if (!data.length) {
      wrap.innerHTML = `<div class="empty-state">
        <div class="empty-state-icon"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg></div>
        <div class="empty-state-title">Tidak ada pelanggan ditemukan</div>
        <div class="empty-state-desc">Coba ubah filter atau tambah pelanggan baru.</div>
      </div>`;
      return;
    }

    const sortIcon = (key) => {
      if (state.sort.key !== key) return '<span class="sort-icon">↕</span>';
      return state.sort.dir === 'asc' ? '<span class="sort-icon" style="color:var(--color-primary)">↑</span>' : '<span class="sort-icon" style="color:var(--color-primary)">↓</span>';
    };

    wrap.innerHTML = `
      <div class="table-container" style="border:none;border-radius:0">
        <table class="table">
          <thead><tr>
            <th class="sortable" data-sort="customer_id">ID ${sortIcon('customer_id')}</th>
            <th class="sortable" data-sort="customer_name">Nama ${sortIcon('customer_name')}</th>
            <th class="sortable" data-sort="email">Email ${sortIcon('email')}</th>
            <th class="sortable" data-sort="city">Kota ${sortIcon('city')}</th>
            <th class="sortable" data-sort="gender">Gender ${sortIcon('gender')}</th>
            <th class="sortable" data-sort="joined_at">Bergabung ${sortIcon('joined_at')}</th>
            <th class="sortable" data-sort="customer_status">Status ${sortIcon('customer_status')}</th>
            <th style="text-align:right">Aksi</th>
          </tr></thead>
          <tbody>
            ${paged.items.map(c => `
              <tr data-id="${c.customer_id}">
                <td><span class="mono text-xs text-muted">${c.customer_id}</span></td>
                <td>
                  <div style="display:flex;align-items:center;gap:8px">
                    <div class="avatar avatar-sm">${Utils.getInitials(c.customer_name)}</div>
                    <div>
                      <div style="font-weight:500">${Utils.escapeHtml(c.customer_name)}</div>
                      <div class="text-xs text-muted">${Utils.escapeHtml(c.phone || '-')}</div>
                    </div>
                  </div>
                </td>
                <td class="text-sm">${Utils.escapeHtml(c.email || '-')}</td>
                <td class="text-sm">${Utils.escapeHtml(c.city || '-')}</td>
                <td><span class="badge ${c.gender === 'Female' ? 'badge-accent' : 'badge-primary'} no-dot">${c.gender || '-'}</span></td>
                <td class="text-sm">${Utils.formatDate(c.joined_at)}</td>
                <td><span class="badge ${c.customer_status === 'Active' ? 'badge-success' : 'badge-neutral'} no-dot">${c.customer_status || '-'}</span></td>
                <td style="text-align:right">
                  <div style="display:flex;gap:4px;justify-content:flex-end">
                    <button class="btn btn-ghost btn-icon btn-sm btn-view" data-id="${c.customer_id}" title="Lihat Detail">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    </button>
                    <button class="btn btn-ghost btn-icon btn-sm btn-edit" data-id="${c.customer_id}" title="Edit">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button class="btn btn-ghost btn-icon btn-sm btn-delete" data-id="${c.customer_id}" title="Hapus" style="color:var(--color-danger)">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path></svg>
                    </button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <div class="pagination">
        <div class="pagination-info">
          Menampilkan ${paged.start}–${paged.end} dari ${paged.total} pelanggan
        </div>
        <div class="pagination-controls">
          <button class="pagination-btn" id="page-prev" ${paged.currentPage <= 1 ? 'disabled' : ''}>‹</button>
          ${Array.from({ length: Math.min(paged.totalPages, 7) }, (_, i) => {
            const p = paged.totalPages <= 7 ? i + 1 : (paged.currentPage <= 4 ? i + 1 : paged.currentPage - 3 + i);
            return `<button class="pagination-btn ${p === paged.currentPage ? 'active' : ''}" data-page="${p}">${p}</button>`;
          }).join('')}
          <button class="pagination-btn" id="page-next" ${paged.currentPage >= paged.totalPages ? 'disabled' : ''}>›</button>
        </div>
      </div>
    `;

    bindTableEvents();
  }

  function bindListEvents() {
    const searchEl = document.getElementById('cust-search');
    if (searchEl) {
      searchEl.addEventListener('input', Utils.debounce(e => {
        state.query = e.target.value;
        state.page = 1;
        renderTable();
      }, 300));
    }

    Utils.delegate(document.getElementById('page-content'), 'change', '#cust-filter-city', (e) => {
      state.filters.city = e.target.value || '';
      state.page = 1;
      renderTable();
    });

    Utils.delegate(document.getElementById('page-content'), 'change', '#cust-filter-gender', (e) => {
      state.filters.gender = e.target.value || '';
      state.page = 1;
      renderTable();
    });

    const clearBtn = document.getElementById('cust-clear-filter');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        state.query = ''; state.filters = {}; state.page = 1;
        document.getElementById('cust-search').value = '';
        document.getElementById('cust-filter-city').value = '';
        document.getElementById('cust-filter-gender').value = '';
        renderTable();
      });
    }

    const addBtn = document.getElementById('btn-add-customer');
    if (addBtn) addBtn.addEventListener('click', () => openForm());
  }

  function bindTableEvents() {
    const wrap = document.getElementById('cust-table-wrap');
    if (!wrap) return;

    // Sort
    Utils.delegate(wrap, 'click', '.sortable', (e, th) => {
      const key = th.dataset.sort;
      if (state.sort.key === key) state.sort.dir = state.sort.dir === 'asc' ? 'desc' : 'asc';
      else { state.sort.key = key; state.sort.dir = 'asc'; }
      renderTable();
    });

    // View
    Utils.delegate(wrap, 'click', '.btn-view', (e, btn) => {
      Router.navigate('/customers/' + btn.dataset.id);
    });

    // Edit
    Utils.delegate(wrap, 'click', '.btn-edit', (e, btn) => {
      openForm(btn.dataset.id);
    });

    // Delete
    Utils.delegate(wrap, 'click', '.btn-delete', (e, btn) => {
      const id = btn.dataset.id;
      const cust = CustomerService.getById(id);
      Modal.confirm({
        title: 'Hapus Pelanggan',
        message: `Hapus pelanggan <strong>${Utils.escapeHtml(cust?.customer_name || id)}</strong>?<br>Data terkait (transaksi, feedback, dll.) tidak akan terhapus.`,
        confirmText: 'Hapus',
        type: 'danger',
        onConfirm: () => {
          try {
            CustomerService.remove(id);
            Toast.success(`Pelanggan ${cust?.customer_name} berhasil dihapus.`);
            renderTable();
          } catch (e) { Toast.error(e.message); }
        },
      });
    });

    // Pagination
    Utils.delegate(wrap, 'click', '.pagination-btn[data-page]', (e, btn) => {
      state.page = parseInt(btn.dataset.page);
      renderTable();
    });

    document.getElementById('page-prev')?.addEventListener('click', () => { state.page--; renderTable(); });
    document.getElementById('page-next')?.addEventListener('click', () => { state.page++; renderTable(); });

    // Row click → detail
    Utils.delegate(wrap, 'click', 'tbody tr', (e, row) => {
      if (!e.target.closest('button')) {
        Router.navigate('/customers/' + row.dataset.id);
      }
    });
  }

  // ─── Detail View ────────────────────────────────────────────
  function renderDetail(id) {
    const customer = CustomerService.getById(id);
    if (!customer) {
      Router.navigate('/customers');
      Toast.error('Pelanggan tidak ditemukan');
      return;
    }

    const stats = CustomerService.getCustomerStats(id);
    const txs = CustomerService.getCustomerTransactions(id).slice(0, 10);
    const rfm = CustomerService.getCustomerRFM(id);
    const age = Utils.getAge(customer.birth_date);

    const content = document.getElementById('page-content');
    content.innerHTML = `
      <div class="page-header">
        <div class="page-header-left">
          <button class="btn btn-ghost btn-sm" onclick="Router.navigate('/customers')" style="margin-bottom:8px">
            ← Kembali ke Daftar
          </button>
          <h1 class="page-title">${Utils.escapeHtml(customer.customer_name)}</h1>
          <p class="page-subtitle">${customer.customer_id} • Bergabung ${Utils.formatDate(customer.joined_at)}</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-outline" onclick="CustomersPage.openForm('${id}')">Edit</button>
          <button class="btn btn-danger-outline" onclick="CustomersPage.confirmDelete('${id}')">Hapus</button>
        </div>
      </div>

      <div class="grid-2" style="margin-bottom:16px">
        <!-- Profile Card -->
        <div class="card">
          <div class="card-header"><div class="card-title">Profil Pelanggan</div></div>
          <div class="card-body">
            <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px">
              <div class="avatar" style="width:64px;height:64px;font-size:1.5rem">${Utils.getInitials(customer.customer_name)}</div>
              <div>
                <div style="font-size:1.25rem;font-weight:700">${Utils.escapeHtml(customer.customer_name)}</div>
                <div class="text-sm text-muted">${customer.customer_id}</div>
                <span class="badge ${customer.customer_status === 'Active' ? 'badge-success' : 'badge-neutral'} no-dot">${customer.customer_status}</span>
              </div>
            </div>
            <div class="stat-row"><span class="stat-label">Email</span><span class="stat-value">${Utils.escapeHtml(customer.email || '-')}</span></div>
            <div class="stat-row"><span class="stat-label">Telepon</span><span class="stat-value">${Utils.escapeHtml(customer.phone || '-')}</span></div>
            <div class="stat-row"><span class="stat-label">Kota</span><span class="stat-value">${Utils.escapeHtml(customer.city || '-')}</span></div>
            <div class="stat-row"><span class="stat-label">Gender</span><span class="stat-value">${customer.gender || '-'}</span></div>
            <div class="stat-row"><span class="stat-label">Tanggal Lahir</span><span class="stat-value">${Utils.formatDate(customer.birth_date)} ${age !== null ? `(${age} tahun)` : ''}</span></div>
            <div class="stat-row"><span class="stat-label">Bergabung</span><span class="stat-value">${Utils.formatDate(customer.joined_at)}</span></div>
          </div>
        </div>

        <!-- Stats Card -->
        <div class="card">
          <div class="card-header"><div class="card-title">Statistik Pelanggan</div></div>
          <div class="card-body">
            <div class="grid-2" style="margin-bottom:16px">
              <div style="background:var(--color-primary-50);border-radius:8px;padding:12px;text-align:center">
                <div style="font-size:1.5rem;font-weight:700;color:var(--color-primary)">${Utils.formatNumber(stats.completedTxCount)}</div>
                <div class="text-xs text-muted">Transaksi</div>
              </div>
              <div style="background:var(--color-accent-50);border-radius:8px;padding:12px;text-align:center">
                <div style="font-size:1.25rem;font-weight:700;color:var(--color-accent)">${Utils.formatCurrency(stats.totalSpend, true)}</div>
                <div class="text-xs text-muted">Total Belanja</div>
              </div>
              <div style="background:var(--color-success-bg);border-radius:8px;padding:12px;text-align:center">
                <div style="font-size:1.5rem;font-weight:700;color:var(--color-success)">${Utils.formatNumber(stats.loyaltyBalance)}</div>
                <div class="text-xs text-muted">Poin Loyalitas</div>
              </div>
              <div style="background:var(--color-warning-bg);border-radius:8px;padding:12px;text-align:center">
                <div style="font-size:1.5rem;font-weight:700;color:var(--color-warning)">${stats.avgRating ? stats.avgRating.toFixed(1) : '-'}</div>
                <div class="text-xs text-muted">Rating Rata-Rata</div>
              </div>
            </div>
            ${rfm ? `
              <div style="background:var(--color-surface-alt);border-radius:8px;padding:12px">
                <div class="text-xs font-semibold text-muted" style="margin-bottom:8px;text-transform:uppercase;letter-spacing:.05em">RFM Score</div>
                <div class="stat-row"><span class="stat-label">Recency</span><span class="stat-value">${rfm.recency} hari lalu</span></div>
                <div class="stat-row"><span class="stat-label">Frequency</span><span class="stat-value">${rfm.frequency} transaksi</span></div>
                <div class="stat-row"><span class="stat-label">Monetary</span><span class="stat-value">${Utils.formatCurrency(rfm.monetary)}</span></div>
              </div>
            ` : '<p class="text-sm text-muted">Belum ada transaksi.</p>'}
          </div>
        </div>
      </div>

      <!-- Transaction History -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">Riwayat Transaksi</div>
          <span class="badge badge-neutral no-dot">${stats.completedTxCount} transaksi</span>
        </div>
        <div class="table-container" style="border:none;border-radius:0">
          ${txs.length ? `
            <table class="table">
              <thead><tr>
                <th>ID</th><th>Tanggal</th><th>Channel</th><th>Pembayaran</th><th>Total</th><th>Status</th>
              </tr></thead>
              <tbody>
                ${txs.map(tx => `
                  <tr style="cursor:pointer" onclick="Router.navigate('/transactions/${tx.transaction_id}')">
                    <td><span class="mono text-xs">${tx.transaction_id}</span></td>
                    <td class="text-sm">${Utils.formatDatetime(tx.transaction_datetime)}</td>
                    <td class="text-sm">${tx.sales_channel || '-'}</td>
                    <td class="text-sm">${tx.payment_method || '-'}</td>
                    <td style="font-weight:600">${Utils.formatCurrency(tx.total_amount)}</td>
                    <td><span class="badge status-${(tx.transaction_status || '').toLowerCase()} no-dot">${tx.transaction_status}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : '<div class="empty-state" style="padding:32px"><div class="empty-state-title">Belum ada transaksi</div></div>'}
        </div>
      </div>
    `;
  }

  // ─── Form (Add / Edit) ──────────────────────────────────────
  function openForm(id = null) {
    const isEdit = !!id;
    const data = isEdit ? CustomerService.getById(id) : {};
    if (isEdit && !data) { Toast.error('Pelanggan tidak ditemukan'); return; }

    const modalId = 'modal-customer-form';
    let existing = document.getElementById(modalId);
    if (existing) existing.remove();

    const div = document.createElement('div');
    div.id = modalId;
    div.className = 'modal-backdrop';
    div.innerHTML = `
      <div class="modal modal-lg">
        <div class="modal-header">
          <h3 class="modal-title">${isEdit ? 'Edit Pelanggan' : 'Tambah Pelanggan'}</h3>
          <button class="modal-close" onclick="Modal.close('${modalId}')">✕</button>
        </div>
        <div class="modal-body">
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Nama Lengkap <span class="required">*</span></label>
              <input class="form-input" id="f-name" type="text" value="${Utils.escapeHtml(data.customer_name || '')}" placeholder="Nama pelanggan">
              <div class="form-error hidden" id="err-name"></div>
            </div>
            <div class="form-group">
              <label class="form-label">Email</label>
              <input class="form-input" id="f-email" type="email" value="${Utils.escapeHtml(data.email || '')}" placeholder="email@contoh.com">
              <div class="form-error hidden" id="err-email"></div>
            </div>
            <div class="form-group">
              <label class="form-label">Nomor Telepon</label>
              <input class="form-input" id="f-phone" type="text" value="${Utils.escapeHtml(data.phone || '')}" placeholder="08xxxxxxxxxx">
              <div class="form-error hidden" id="err-phone"></div>
            </div>
            <div class="form-group">
              <label class="form-label">Kota</label>
              <input class="form-input" id="f-city" type="text" value="${Utils.escapeHtml(data.city || '')}" placeholder="Yogyakarta">
            </div>
            <div class="form-group">
              <label class="form-label">Gender</label>
              <div class="form-select-wrapper">
                <select class="form-select" id="f-gender">
                  <option value="">-- Pilih --</option>
                  <option value="Male" ${data.gender === 'Male' ? 'selected' : ''}>Laki-laki</option>
                  <option value="Female" ${data.gender === 'Female' ? 'selected' : ''}>Perempuan</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Tanggal Lahir</label>
              <input class="form-input" id="f-birth" type="date" value="${data.birth_date || ''}">
            </div>
            <div class="form-group">
              <label class="form-label">Status</label>
              <div class="form-select-wrapper">
                <select class="form-select" id="f-status">
                  <option value="Active" ${(data.customer_status || 'Active') === 'Active' ? 'selected' : ''}>Active</option>
                  <option value="Inactive" ${data.customer_status === 'Inactive' ? 'selected' : ''}>Inactive</option>
                </select>
              </div>
            </div>
            ${!isEdit ? `<div class="form-group">
              <label class="form-label">Tanggal Bergabung</label>
              <input class="form-input" id="f-joined" type="date" value="${Utils.toISODate(new Date())}">
            </div>` : ''}
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="Modal.close('${modalId}')">Batal</button>
          <button class="btn btn-primary" id="btn-save-customer">
            ${isEdit ? 'Simpan Perubahan' : 'Tambah Pelanggan'}
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(div);

    document.getElementById('btn-save-customer').addEventListener('click', () => {
      const formData = {
        customer_name: document.getElementById('f-name').value,
        email:         document.getElementById('f-email').value,
        phone:         document.getElementById('f-phone').value,
        city:          document.getElementById('f-city').value,
        gender:        document.getElementById('f-gender').value,
        birth_date:    document.getElementById('f-birth').value,
        customer_status: document.getElementById('f-status').value,
        joined_at:     isEdit ? data.joined_at : (document.getElementById('f-joined')?.value || Utils.toISODate(new Date())),
      };

      // Clear errors
      ['name','email','phone'].forEach(f => {
        const el = document.getElementById(`err-${f}`);
        if (el) { el.textContent = ''; el.classList.add('hidden'); }
        const inp = document.getElementById(`f-${f}`);
        if (inp) inp.classList.remove('error');
      });

      try {
        if (isEdit) { CustomerService.update(id, formData); Toast.success('Data pelanggan berhasil diperbarui.'); }
        else        { CustomerService.create(formData);     Toast.success('Pelanggan baru berhasil ditambahkan.'); }
        Modal.close(modalId);
        div.remove();
        // Refresh view
        if (isEdit && state.viewingId) renderDetail(id);
        else render();
      } catch (e) {
        if (e.validation) {
          Object.entries(e.validation).forEach(([field, msg]) => {
            const key = field === 'customer_name' ? 'name' : field;
            const errEl = document.getElementById(`err-${key}`);
            const inpEl = document.getElementById(`f-${key}`);
            if (errEl) { errEl.textContent = msg; errEl.classList.remove('hidden'); }
            if (inpEl) inpEl.classList.add('error');
          });
        } else { Toast.error(e.message || 'Terjadi kesalahan'); }
      }
    });

    Modal.open(modalId);
  }

  function confirmDelete(id) {
    const cust = CustomerService.getById(id);
    Modal.confirm({
      title: 'Hapus Pelanggan',
      message: `Hapus pelanggan <strong>${Utils.escapeHtml(cust?.customer_name || id)}</strong>?`,
      confirmText: 'Hapus',
      type: 'danger',
      onConfirm: () => {
        try {
          CustomerService.remove(id);
          Toast.success('Pelanggan berhasil dihapus.');
          Router.navigate('/customers');
        } catch (e) { Toast.error(e.message); }
      },
    });
  }

  return { render, openForm, confirmDelete };
})();

window.CustomersPage = CustomersPage;
