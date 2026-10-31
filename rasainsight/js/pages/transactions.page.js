/**
 * RasaInsight — Transactions Page (Presentation Layer)
 */

const TransactionsPage = (() => {
  let state = {
    query: '', filters: {},
    sort: { key: 'transaction_datetime', dir: 'desc' },
    page: 1, perPage: 15,
  };

  function render(detailId = null) {
    if (detailId) { renderDetail(detailId); return; }

    const channels = TransactionService.getChannels();
    const payments = TransactionService.getPayments();

    document.getElementById('page-content').innerHTML = `
      <div class="page-header">
        <div class="page-header-left">
          <h1 class="page-title">Transaksi</h1>
          <p class="page-subtitle">Riwayat dan manajemen transaksi</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-primary" id="btn-new-tx">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Transaksi Baru
          </button>
        </div>
      </div>

      <div class="filter-bar">
        <div class="search-bar" style="flex:1;min-width:200px">
          <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input class="form-input" id="tx-search" placeholder="Cari ID atau nama pelanggan..." value="${Utils.escapeHtml(state.query)}">
        </div>
        <input class="form-input" id="tx-from" type="date" value="${state.filters.dateFrom || ''}" style="width:140px" title="Dari tanggal">
        <input class="form-input" id="tx-to"   type="date" value="${state.filters.dateTo || ''}"   style="width:140px" title="Sampai tanggal">
        <div class="form-select-wrapper" style="min-width:130px">
          <select class="form-select" id="tx-channel">
            <option value="">Semua Channel</option>
            ${channels.map(c => `<option value="${c}" ${state.filters.channel === c ? 'selected' : ''}>${c}</option>`).join('')}
          </select>
        </div>
        <div class="form-select-wrapper" style="min-width:130px">
          <select class="form-select" id="tx-payment">
            <option value="">Semua Pembayaran</option>
            ${payments.map(p => `<option value="${p}" ${state.filters.payment === p ? 'selected' : ''}>${p}</option>`).join('')}
          </select>
        </div>
        <div class="form-select-wrapper" style="min-width:120px">
          <select class="form-select" id="tx-status">
            <option value="">Semua Status</option>
            <option value="Completed" ${state.filters.status === 'Completed' ? 'selected' : ''}>Completed</option>
            <option value="Pending"   ${state.filters.status === 'Pending'   ? 'selected' : ''}>Pending</option>
            <option value="Cancelled" ${state.filters.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
        </div>
        <button class="btn btn-ghost btn-sm" id="tx-clear">Reset</button>
      </div>

      <div class="card"><div id="tx-table-wrap"></div></div>
    `;

    renderTable();
    bindListEvents();
  }

  function renderTable() {
    let data = TransactionService.search(state.query, state.filters);
    data = Utils.sortBy(data, state.sort.key, state.sort.dir);
    const paged = Utils.paginate(data, state.page, state.perPage);
    const wrap = document.getElementById('tx-table-wrap');
    if (!wrap) return;

    if (!data.length) {
      wrap.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🧾</div><div class="empty-state-title">Tidak ada transaksi</div></div>`;
      return;
    }

    const si = (k) => state.sort.key !== k ? '↕' : (state.sort.dir === 'asc' ? '↑' : '↓');

    wrap.innerHTML = `
      <div class="table-container" style="border:none;border-radius:0">
        <table class="table">
          <thead><tr>
            <th class="sortable" data-sort="transaction_id">ID ${si('transaction_id')}</th>
            <th class="sortable" data-sort="transaction_datetime">Tanggal ${si('transaction_datetime')}</th>
            <th>Pelanggan</th>
            <th class="sortable" data-sort="sales_channel">Channel ${si('sales_channel')}</th>
            <th class="sortable" data-sort="payment_method">Pembayaran ${si('payment_method')}</th>
            <th class="sortable" data-sort="total_amount" style="text-align:right">Total ${si('total_amount')}</th>
            <th class="sortable" data-sort="transaction_status">Status ${si('transaction_status')}</th>
            <th style="text-align:right">Aksi</th>
          </tr></thead>
          <tbody>
            ${paged.items.map(tx => {
              const cust = CustomerRepo.findById(tx.customer_id);
              return `<tr data-id="${tx.transaction_id}">
                <td><span class="mono text-xs">${tx.transaction_id}</span></td>
                <td class="text-sm">${Utils.formatDatetime(tx.transaction_datetime)}</td>
                <td>
                  <div style="display:flex;align-items:center;gap:6px">
                    <div class="avatar avatar-sm">${Utils.getInitials(cust?.customer_name || '?')}</div>
                    <div>
                      <div class="text-sm font-medium">${Utils.escapeHtml(cust?.customer_name || tx.customer_id)}</div>
                      <div class="text-xs text-muted">${tx.customer_id}</div>
                    </div>
                  </div>
                </td>
                <td class="text-sm">${tx.sales_channel || '-'}</td>
                <td class="text-sm">${tx.payment_method || '-'}</td>
                <td style="text-align:right;font-weight:600">${Utils.formatCurrency(tx.total_amount)}</td>
                <td><span class="badge status-${(tx.transaction_status || '').toLowerCase()} no-dot">${tx.transaction_status}</span></td>
                <td style="text-align:right">
                  <div style="display:flex;gap:4px;justify-content:flex-end">
                    <button class="btn btn-ghost btn-icon btn-sm btn-view" data-id="${tx.transaction_id}" title="Detail">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    </button>
                    <button class="btn btn-ghost btn-icon btn-sm btn-delete" data-id="${tx.transaction_id}" title="Hapus" style="color:var(--color-danger)">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path></svg>
                    </button>
                  </div>
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
      <div class="pagination">
        <div class="pagination-info">Menampilkan ${paged.start}–${paged.end} dari ${paged.total} transaksi</div>
        <div class="pagination-controls">
          <button class="pagination-btn" id="tx-prev" ${paged.currentPage<=1?'disabled':''}>‹</button>
          ${Array.from({length:Math.min(paged.totalPages,7)},(_,i)=>{
            const p=paged.totalPages<=7?i+1:Math.max(1,paged.currentPage-3)+i;
            if(p>paged.totalPages)return'';
            return `<button class="pagination-btn ${p===paged.currentPage?'active':''}" data-page="${p}">${p}</button>`;
          }).join('')}
          <button class="pagination-btn" id="tx-next" ${paged.currentPage>=paged.totalPages?'disabled':''}>›</button>
        </div>
      </div>`;
    bindTableEvents();
  }

  function bindListEvents() {
    const pc = document.getElementById('page-content');
    document.getElementById('tx-search')?.addEventListener('input', Utils.debounce(e => { state.query = e.target.value; state.page = 1; renderTable(); }, 300));
    ['tx-from','tx-to'].forEach(id => document.getElementById(id)?.addEventListener('change', e => { state.filters[id==='tx-from'?'dateFrom':'dateTo'] = e.target.value; state.page = 1; renderTable(); }));
    Utils.delegate(pc,'change','#tx-channel', e => { state.filters.channel = e.target.value; state.page=1; renderTable(); });
    Utils.delegate(pc,'change','#tx-payment', e => { state.filters.payment = e.target.value; state.page=1; renderTable(); });
    Utils.delegate(pc,'change','#tx-status',  e => { state.filters.status  = e.target.value; state.page=1; renderTable(); });
    document.getElementById('tx-clear')?.addEventListener('click', () => {
      state.query = ''; state.filters = {}; state.page = 1;
      ['tx-search','tx-from','tx-to'].forEach(id => { const el = document.getElementById(id); if(el) el.value=''; });
      ['tx-channel','tx-payment','tx-status'].forEach(id => { const el = document.getElementById(id); if(el) el.value=''; });
      renderTable();
    });
    document.getElementById('btn-new-tx')?.addEventListener('click', () => openNewTxForm());
  }

  function bindTableEvents() {
    const wrap = document.getElementById('tx-table-wrap');
    if (!wrap) return;
    Utils.delegate(wrap,'click','.sortable', (e,th) => { const k=th.dataset.sort; state.sort.dir = state.sort.key===k?(state.sort.dir==='asc'?'desc':'asc'):'asc'; state.sort.key=k; renderTable(); });
    Utils.delegate(wrap,'click','.btn-view',   (e,btn) => Router.navigate('/transactions/'+btn.dataset.id));
    Utils.delegate(wrap,'click','.btn-delete', (e,btn) => {
      const id = btn.dataset.id;
      Modal.confirm({ title:'Hapus Transaksi', message:`Hapus transaksi <strong>${id}</strong>? Semua detail dan poin loyalitas terkait juga akan dihapus.`, confirmText:'Hapus', type:'danger',
        onConfirm: () => { try { TransactionService.remove(id); Toast.success('Transaksi berhasil dihapus.'); renderTable(); AppShell.updateComplaintsBadge(); } catch(e){ Toast.error(e.message); } }
      });
    });
    Utils.delegate(wrap,'click','tbody tr', (e,row) => { if(!e.target.closest('button')) Router.navigate('/transactions/'+row.dataset.id); });
    Utils.delegate(wrap,'click','.pagination-btn[data-page]', (e,btn) => { state.page=parseInt(btn.dataset.page); renderTable(); });
    document.getElementById('tx-prev')?.addEventListener('click',()=>{state.page--;renderTable();});
    document.getElementById('tx-next')?.addEventListener('click',()=>{state.page++;renderTable();});
  }

  // ─── Detail View ────────────────────────────────────────────
  function renderDetail(id) {
    const detail = TransactionService.getDetail(id);
    if (!detail) { Router.navigate('/transactions'); Toast.error('Transaksi tidak ditemukan'); return; }
    const { customer, details: items } = detail;

    document.getElementById('page-content').innerHTML = `
      <div class="page-header">
        <div class="page-header-left">
          <button class="btn btn-ghost btn-sm" onclick="Router.navigate('/transactions')" style="margin-bottom:8px">← Kembali</button>
          <h1 class="page-title">${detail.transaction_id}</h1>
          <p class="page-subtitle">${Utils.formatDatetime(detail.transaction_datetime)}</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-outline btn-sm" id="btn-edit-tx">Edit Informasi</button>
          <span class="badge status-${(detail.transaction_status||'').toLowerCase()} no-dot" style="font-size:14px;padding:4px 12px">${detail.transaction_status}</span>
        </div>
      </div>
      <div class="grid-2">
        <div class="card">
          <div class="card-header"><div class="card-title">Informasi Transaksi</div></div>
          <div class="card-body">
            <div class="stat-row"><span class="stat-label">Pelanggan</span>
              <span class="stat-value" style="cursor:pointer;color:var(--color-primary)" onclick="Router.navigate('/customers/${detail.customer_id}')">${Utils.escapeHtml(customer?.customer_name || detail.customer_id)}</span>
            </div>
            <div class="stat-row"><span class="stat-label">Sales Channel</span><span class="stat-value">${detail.sales_channel||'-'}</span></div>
            <div class="stat-row"><span class="stat-label">Metode Pembayaran</span><span class="stat-value">${detail.payment_method||'-'}</span></div>
            <div class="stat-row"><span class="stat-label">Subtotal</span><span class="stat-value">${Utils.formatCurrency(detail.subtotal)}</span></div>
            <div class="stat-row"><span class="stat-label">Diskon</span><span class="stat-value">${Utils.formatCurrency(detail.discount_amount)}</span></div>
            <div class="stat-row"><span class="stat-label">Pajak</span><span class="stat-value">${Utils.formatCurrency(detail.tax_amount)}</span></div>
            <div class="stat-row" style="border-top:2px solid var(--color-border);padding-top:12px;margin-top:4px">
              <span class="stat-label font-bold">TOTAL</span>
              <span class="stat-value" style="font-size:1.1rem;font-weight:700;color:var(--color-primary)">${Utils.formatCurrency(detail.total_amount)}</span>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-header"><div class="card-title">Update Status</div></div>
          <div class="card-body">
            <div class="form-group">
              <label class="form-label">Status Transaksi</label>
              <div class="form-select-wrapper">
                <select class="form-select" id="tx-status-select">
                  <option value="Completed" ${detail.transaction_status==='Completed'?'selected':''}>Completed</option>
                  <option value="Pending"   ${detail.transaction_status==='Pending'?'selected':''}>Pending</option>
                  <option value="Cancelled" ${detail.transaction_status==='Cancelled'?'selected':''}>Cancelled</option>
                </select>
              </div>
            </div>
            <button class="btn btn-primary" id="btn-update-tx-status">Simpan Status</button>
            <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--color-border)">
              <button class="btn btn-danger-outline btn-sm" onclick="TransactionsPage.confirmDelete('${id}')">Hapus Transaksi</button>
            </div>
          </div>
        </div>
      </div>
      <div class="card" style="margin-top:16px">
        <div class="card-header"><div class="card-title">Item Transaksi</div><span class="badge badge-neutral no-dot">${items.length} item</span></div>
        <div class="table-container" style="border:none;border-radius:0">
          <table class="table">
            <thead><tr><th>Produk</th><th>Kategori</th><th style="text-align:right">Harga</th><th style="text-align:center">Qty</th><th style="text-align:right">Diskon</th><th style="text-align:right">Subtotal</th></tr></thead>
            <tbody>
              ${items.map(item => `<tr>
                <td>
                  <div style="font-weight:500">${Utils.escapeHtml(item.product?.product_name||item.product_id)}</div>
                  <div class="text-xs text-muted">${item.product_id}</div>
                </td>
                <td><span class="badge type-${(item.product?.product_type||'food').toLowerCase()} no-dot">${item.product?.category||'-'}</span></td>
                <td style="text-align:right">${Utils.formatCurrency(item.unit_price)}</td>
                <td style="text-align:center;font-weight:600">${item.quantity}</td>
                <td style="text-align:right">${item.discount_percent>0?Utils.formatPercent(item.discount_percent*100):'-'}</td>
                <td style="text-align:right;font-weight:600">${Utils.formatCurrency(item.line_total)}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    document.getElementById('btn-edit-tx')?.addEventListener('click', () => openEditTxForm(detail));

    document.getElementById('btn-update-tx-status')?.addEventListener('click', () => {
      const newStatus = document.getElementById('tx-status-select').value;
      try { TransactionService.updateStatus(id, newStatus); Toast.success('Status transaksi diperbarui.'); renderDetail(id); }
      catch(e) { Toast.error(e.message); }
    });
  }


  function openEditTxForm(detail) {
    const modalId = 'modal-edit-tx';
    document.getElementById(modalId)?.remove();
    const customers = CustomerService.getAll();
    const div = document.createElement('div');
    div.id = modalId;
    div.className = 'modal-backdrop';
    const localDate = String(detail.transaction_datetime || '').replace(' ', 'T').slice(0, 16);
    div.innerHTML = `
      <div class="modal">
        <div class="modal-header"><h3 class="modal-title">Edit Informasi Transaksi</h3><button class="modal-close" onclick="Modal.close('${modalId}')">✕</button></div>
        <div class="modal-body">
          <div class="form-group"><label class="form-label">Pelanggan</label><div class="form-select-wrapper"><select class="form-select" id="etx-customer">${customers.map(c => `<option value="${c.customer_id}" ${c.customer_id === detail.customer_id ? 'selected' : ''}>${Utils.escapeHtml(c.customer_name)} (${c.customer_id})</option>`).join('')}</select></div></div>
          <div class="form-group"><label class="form-label">Tanggal & Waktu</label><input class="form-input" id="etx-date" type="datetime-local" value="${localDate}"></div>
          <div class="form-group"><label class="form-label">Sales Channel</label><div class="form-select-wrapper"><select class="form-select" id="etx-channel">${['Dine-in','Takeaway','Pickup','Delivery','Online'].map(v => `<option ${detail.sales_channel === v ? 'selected' : ''}>${v}</option>`).join('')}</select></div></div>
          <div class="form-group"><label class="form-label">Metode Pembayaran</label><div class="form-select-wrapper"><select class="form-select" id="etx-payment">${['Cash','QRIS','E-Wallet','Debit Card','Credit Card','Transfer'].map(v => `<option ${detail.payment_method === v ? 'selected' : ''}>${v}</option>`).join('')}</select></div></div>
          <p class="text-xs text-muted">Perubahan ini tidak mengubah item, harga, maupun total transaksi.</p>
        </div>
        <div class="modal-footer"><button class="btn btn-secondary" onclick="Modal.close('${modalId}')">Batal</button><button class="btn btn-primary" id="etx-save">Simpan Perubahan</button></div>
      </div>`;
    document.body.appendChild(div);
    document.getElementById('etx-save').addEventListener('click', () => {
      try {
        TransactionService.update(detail.transaction_id, {
          customer_id: document.getElementById('etx-customer').value,
          transaction_datetime: document.getElementById('etx-date').value.replace('T', ' '),
          sales_channel: document.getElementById('etx-channel').value,
          payment_method: document.getElementById('etx-payment').value,
        });
        Modal.close(modalId);
        div.remove();
        Toast.success('Informasi transaksi diperbarui.');
        renderDetail(detail.transaction_id);
      } catch (error) { Toast.error(error.message || 'Gagal memperbarui transaksi'); }
    });
    Modal.open(modalId);
  }

  function confirmDelete(id) {
    Modal.confirm({ title:'Hapus Transaksi', message:`Hapus transaksi <strong>${id}</strong>?`, confirmText:'Hapus', type:'danger',
      onConfirm: () => { try { TransactionService.remove(id); Toast.success('Transaksi dihapus.'); Router.navigate('/transactions'); } catch(e){ Toast.error(e.message); } }
    });
  }

  // ─── New Transaction Form ───────────────────────────────────
  function openNewTxForm() {
    const customers = CustomerService.getAll();
    const products  = ProductRepo.findActive();
    const modalId   = 'modal-new-tx';
    let existingModal = document.getElementById(modalId);
    if (existingModal) existingModal.remove();

    const cartItems = []; // { product_id, qty, discount_percent }

    const div = document.createElement('div');
    div.id = modalId;
    div.className = 'modal-backdrop';
    div.innerHTML = `
      <div class="modal modal-xl">
        <div class="modal-header">
          <h3 class="modal-title">Transaksi Baru</h3>
          <button class="modal-close" onclick="Modal.close('${modalId}')">✕</button>
        </div>
        <div class="modal-body" style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
          <!-- Left: Customer + Info -->
          <div>
            <div class="form-group">
              <label class="form-label">Pelanggan <span class="required">*</span></label>
              <div class="form-select-wrapper">
                <select class="form-select" id="ntx-customer">
                  <option value="">-- Pilih Pelanggan --</option>
                  ${customers.map(c => `<option value="${c.customer_id}">${Utils.escapeHtml(c.customer_name)} (${c.customer_id})</option>`).join('')}
                </select>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Tanggal & Waktu</label>
              <input class="form-input" id="ntx-datetime" type="datetime-local" value="${(() => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0,16); })()}">
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
              <div class="form-group">
                <label class="form-label">Sales Channel</label>
                <div class="form-select-wrapper"><select class="form-select" id="ntx-channel">
                  <option>Dine-in</option><option>Takeaway</option><option>Pickup</option>
                </select></div>
              </div>
              <div class="form-group">
                <label class="form-label">Pembayaran</label>
                <div class="form-select-wrapper"><select class="form-select" id="ntx-payment">
                  <option>Cash</option><option>QRIS</option><option>E-Wallet</option><option>Debit Card</option>
                </select></div>
              </div>
            </div>
          </div>
          <!-- Right: Product Picker + Cart -->
          <div>
            <div class="form-group">
              <label class="form-label">Tambah Produk</label>
              <div style="display:flex;gap:8px">
                <div class="form-select-wrapper" style="flex:1">
                  <select class="form-select" id="ntx-product">
                    <option value="">-- Pilih Produk --</option>
                    ${products.map(p => `<option value="${p.product_id}" data-price="${p.price}">${Utils.escapeHtml(p.product_name)} — ${Utils.formatCurrency(p.price)}</option>`).join('')}
                  </select>
                </div>
                <input class="form-input" id="ntx-qty" type="number" min="1" value="1" style="width:64px;text-align:center">
                <button class="btn btn-primary btn-sm" id="ntx-add-item">Tambah</button>
              </div>
            </div>
            <div id="ntx-cart" style="border:1px solid var(--color-border);border-radius:8px;min-height:120px;padding:8px;background:var(--color-surface-alt)">
              <div class="empty-state" style="padding:24px"><div class="empty-state-desc">Belum ada produk dipilih</div></div>
            </div>
            <div style="margin-top:12px;padding:12px;background:var(--color-primary-50);border-radius:8px">
              <div style="display:flex;justify-content:space-between;font-weight:700;font-size:1rem">
                <span>Total</span><span id="ntx-total" style="color:var(--color-primary)">Rp 0</span>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="Modal.close('${modalId}')">Batal</button>
          <button class="btn btn-primary" id="ntx-save">Simpan Transaksi</button>
        </div>
      </div>`;

    document.body.appendChild(div);

    function updateCart() {
      const cartEl = document.getElementById('ntx-cart');
      const totalEl = document.getElementById('ntx-total');
      if (!cartEl) return;
      if (!cartItems.length) {
        cartEl.innerHTML = '<div class="empty-state" style="padding:24px"><div class="empty-state-desc">Belum ada produk</div></div>';
        if (totalEl) totalEl.textContent = 'Rp 0';
        return;
      }
      let total = 0;
      cartEl.innerHTML = cartItems.map((item, idx) => {
        const product = ProductRepo.findById(item.product_id);
        const lineTotal = item.qty * (product?.price || 0);
        total += lineTotal;
        return `<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--color-border-light);font-size:13px">
          <div style="flex:1">${Utils.escapeHtml(product?.product_name||item.product_id)}</div>
          <div style="margin:0 8px;color:var(--color-text-muted)">${Utils.formatCurrency(product?.price||0)} × ${item.qty}</div>
          <div style="font-weight:600;min-width:80px;text-align:right">${Utils.formatCurrency(lineTotal)}</div>
          <button class="btn btn-ghost btn-icon btn-sm" style="color:var(--color-danger);margin-left:4px" data-remove="${idx}">✕</button>
        </div>`;
      }).join('');
      if (totalEl) totalEl.textContent = Utils.formatCurrency(total);
    }

    document.getElementById('ntx-add-item').addEventListener('click', () => {
      const sel = document.getElementById('ntx-product');
      const prodId = sel.value;
      const qty = parseInt(document.getElementById('ntx-qty').value) || 1;
      if (!prodId) { Toast.warning('Pilih produk terlebih dahulu'); return; }
      const existing = cartItems.find(i => i.product_id === prodId);
      if (existing) existing.qty += qty;
      else cartItems.push({ product_id: prodId, qty, discount_percent: 0 });
      sel.value = '';
      document.getElementById('ntx-qty').value = 1;
      updateCart();
    });

    Utils.delegate(div, 'click', '[data-remove]', (e, btn) => {
      cartItems.splice(parseInt(btn.dataset.remove), 1);
      updateCart();
    });

    document.getElementById('ntx-save').addEventListener('click', () => {
      const custId = document.getElementById('ntx-customer').value;
      const datetime = document.getElementById('ntx-datetime').value.replace('T', ' ');
      const channel  = document.getElementById('ntx-channel').value;
      const payment  = document.getElementById('ntx-payment').value;

      if (!custId) { Toast.warning('Pilih pelanggan terlebih dahulu'); return; }
      if (!cartItems.length) { Toast.warning('Tambahkan minimal satu produk'); return; }

      try {
        const items = cartItems.map(i => ({ product_id: i.product_id, quantity: i.qty, discount_percent: i.discount_percent }));
        const tx = TransactionService.create({
          customer_id: custId,
          transaction_datetime: datetime,
          sales_channel: channel,
          payment_method: payment,
          transaction_status: 'Completed',
        }, items);
        Modal.close(modalId); div.remove();
        Toast.success(`Transaksi ${tx.transaction_id} berhasil disimpan.`);
        render();
      } catch(e) { Toast.error(e.message || 'Gagal menyimpan transaksi'); }
    });

    Modal.open(modalId);
  }

  return { render, confirmDelete };
})();

window.TransactionsPage = TransactionsPage;
