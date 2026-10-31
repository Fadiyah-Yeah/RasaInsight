/**
 * RasaInsight — Products Page (Presentation Layer)
 */

const ProductsPage = (() => {
  let state = { query:'', filters:{}, sort:{key:'product_name',dir:'asc'}, page:1, perPage:15 };

  function render(detailId = null) {
    if (detailId) { renderDetail(detailId); return; }
    const categories = ProductRepo.getCategories();

    document.getElementById('page-content').innerHTML = `
      <div class="page-header">
        <div class="page-header-left">
          <h1 class="page-title">Produk</h1>
          <p class="page-subtitle">Katalog produk ADA RASA (${ProductRepo.findAll().length} produk)</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-primary" id="btn-add-product">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Tambah Produk
          </button>
        </div>
      </div>

      <div class="filter-bar">
        <div class="search-bar" style="flex:1;min-width:180px">
          <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input class="form-input" id="prod-search" placeholder="Cari nama atau kategori..." value="${Utils.escapeHtml(state.query)}">
        </div>
        <div class="form-select-wrapper" style="min-width:140px">
          <select class="form-select" id="prod-category">
            <option value="">Semua Kategori</option>
            ${categories.map(c => `<option value="${c}" ${state.filters.category===c?'selected':''}>${c}</option>`).join('')}
          </select>
        </div>
        <div class="form-select-wrapper" style="min-width:120px">
          <select class="form-select" id="prod-type">
            <option value="">Semua Tipe</option>
            <option value="Food"     ${state.filters.type==='Food'?'selected':''}>Food</option>
            <option value="Beverage" ${state.filters.type==='Beverage'?'selected':''}>Beverage</option>
          </select>
        </div>
        <div class="form-select-wrapper" style="min-width:130px">
          <select class="form-select" id="prod-active">
            <option value="">Semua Status</option>
            <option value="true"  ${state.filters.active==='true'?'selected':''}>Aktif</option>
            <option value="false" ${state.filters.active==='false'?'selected':''}>Non-aktif</option>
          </select>
        </div>
        <button class="btn btn-ghost btn-sm" id="prod-clear">Reset</button>
      </div>

      <div class="card"><div id="prod-table-wrap"></div></div>
    `;

    renderTable();
    bindEvents();
  }

  function renderTable() {
    let data = ProductService.search(state.query, state.filters);
    data = Utils.sortBy(data, state.sort.key, state.sort.dir);
    const paged = Utils.paginate(data, state.page, state.perPage);
    const wrap = document.getElementById('prod-table-wrap');
    if (!wrap) return;

    if (!data.length) {
      wrap.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🛍️</div><div class="empty-state-title">Tidak ada produk</div></div>`;
      return;
    }

    const si = (k) => state.sort.key!==k?'↕':(state.sort.dir==='asc'?'↑':'↓');

    wrap.innerHTML = `
      <div class="table-container" style="border:none;border-radius:0">
        <table class="table">
          <thead><tr>
            <th class="sortable" data-sort="product_id">ID ${si('product_id')}</th>
            <th class="sortable" data-sort="product_name">Nama ${si('product_name')}</th>
            <th class="sortable" data-sort="category">Kategori ${si('category')}</th>
            <th class="sortable" data-sort="product_type">Tipe ${si('product_type')}</th>
            <th class="sortable" data-sort="price" style="text-align:right">Harga ${si('price')}</th>
            <th class="sortable" data-sort="cost"  style="text-align:right">HPP ${si('cost')}</th>
            <th style="text-align:right">Margin</th>
            <th>Status</th>
            <th style="text-align:right">Aksi</th>
          </tr></thead>
          <tbody>
            ${paged.items.map(p => {
              const price = Number(p.price), cost = Number(p.cost);
              const margin = price > 0 ? ((price - cost) / price * 100).toFixed(1) : 0;
              const isActive = p.is_active === true || p.is_active === 'True';
              return `<tr data-id="${p.product_id}">
                <td><span class="mono text-xs text-muted">${p.product_id}</span></td>
                <td style="font-weight:500">${Utils.escapeHtml(p.product_name)}</td>
                <td><span class="badge badge-neutral no-dot">${p.category||'-'}</span></td>
                <td><span class="badge type-${(p.product_type||'food').toLowerCase()} no-dot">${p.product_type||'-'}</span></td>
                <td style="text-align:right;font-weight:600">${Utils.formatCurrency(price)}</td>
                <td style="text-align:right">${Utils.formatCurrency(cost)}</td>
                <td style="text-align:right"><span style="color:var(--color-success);font-weight:600">${margin}%</span></td>
                <td>
                  <button class="badge ${isActive?'badge-success':'badge-neutral'} no-dot btn-toggle-active cursor-pointer" data-id="${p.product_id}" style="border:none;cursor:pointer">
                    ${isActive?'Aktif':'Non-aktif'}
                  </button>
                </td>
                <td style="text-align:right">
                  <div style="display:flex;gap:4px;justify-content:flex-end">
                    <button class="btn btn-ghost btn-icon btn-sm btn-edit" data-id="${p.product_id}" title="Edit">✏️</button>
                    <button class="btn btn-ghost btn-icon btn-sm btn-delete" data-id="${p.product_id}" title="Hapus" style="color:var(--color-danger)">🗑️</button>
                  </div>
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
      <div class="pagination">
        <div class="pagination-info">Menampilkan ${paged.start}–${paged.end} dari ${paged.total} produk</div>
        <div class="pagination-controls">
          <button class="pagination-btn" id="prod-prev" ${paged.currentPage<=1?'disabled':''}>‹</button>
          ${Array.from({length:Math.min(paged.totalPages,7)},(_,i)=>{
            const p=paged.totalPages<=7?i+1:Math.max(1,paged.currentPage-3)+i;
            if(p>paged.totalPages)return'';
            return `<button class="pagination-btn ${p===paged.currentPage?'active':''}" data-page="${p}">${p}</button>`;
          }).join('')}
          <button class="pagination-btn" id="prod-next" ${paged.currentPage>=paged.totalPages?'disabled':''}>›</button>
        </div>
      </div>`;

    const wrap2 = document.getElementById('prod-table-wrap');
    Utils.delegate(wrap2,'click','.sortable',(e,th)=>{const k=th.dataset.sort;state.sort.dir=state.sort.key===k?(state.sort.dir==='asc'?'desc':'asc'):'asc';state.sort.key=k;renderTable();});
    Utils.delegate(wrap2,'click','.btn-edit',(e,btn)=>openForm(btn.dataset.id));
    Utils.delegate(wrap2,'click','.btn-delete',(e,btn)=>{
      const p=ProductService.getById(btn.dataset.id);
      Modal.confirm({title:'Hapus Produk',message:`Hapus produk <strong>${Utils.escapeHtml(p?.product_name||btn.dataset.id)}</strong>?`,confirmText:'Hapus',type:'danger',
        onConfirm:()=>{try{ProductService.remove(btn.dataset.id);Toast.success('Produk dihapus.');renderTable();}catch(e){Toast.error(e.message);}}
      });
    });
    Utils.delegate(wrap2,'click','.btn-toggle-active',(e,btn)=>{
      try{ProductService.toggleActive(btn.dataset.id);renderTable();}catch(e){Toast.error(e.message);}
    });
    Utils.delegate(wrap2,'click','.pagination-btn[data-page]',(e,btn)=>{state.page=parseInt(btn.dataset.page);renderTable();});
    document.getElementById('prod-prev')?.addEventListener('click',()=>{state.page--;renderTable();});
    document.getElementById('prod-next')?.addEventListener('click',()=>{state.page++;renderTable();});
  }

  function bindEvents() {
    const pc = document.getElementById('page-content');
    document.getElementById('prod-search')?.addEventListener('input',Utils.debounce(e=>{state.query=e.target.value;state.page=1;renderTable();},300));
    Utils.delegate(pc,'change','#prod-category',e=>{state.filters.category=e.target.value;state.page=1;renderTable();});
    Utils.delegate(pc,'change','#prod-type',    e=>{state.filters.type=e.target.value;state.page=1;renderTable();});
    Utils.delegate(pc,'change','#prod-active',  e=>{state.filters.active=e.target.value;state.page=1;renderTable();});
    document.getElementById('prod-clear')?.addEventListener('click',()=>{
      state.query='';state.filters={};state.page=1;
      document.getElementById('prod-search').value='';
      ['prod-category','prod-type','prod-active'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
      renderTable();
    });
    document.getElementById('btn-add-product')?.addEventListener('click',()=>openForm());
  }

  function renderDetail(id) {
    const p = ProductService.getById(id);
    if (!p) { Router.navigate('/products'); return; }
    const stats = ProductService.getProductStats(id);
    const isActive = p.is_active === true || p.is_active === 'True';
    const margin = Number(p.price) > 0 ? ((Number(p.price)-Number(p.cost))/Number(p.price)*100).toFixed(1) : 0;

    document.getElementById('page-content').innerHTML = `
      <div class="page-header">
        <div class="page-header-left">
          <button class="btn btn-ghost btn-sm" onclick="Router.navigate('/products')" style="margin-bottom:8px">← Kembali</button>
          <h1 class="page-title">${Utils.escapeHtml(p.product_name)}</h1>
          <p class="page-subtitle">${p.product_id} • ${p.category} • ${p.product_type}</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-outline" onclick="ProductsPage.openForm('${id}')">Edit</button>
        </div>
      </div>
      <div class="grid-2">
        <div class="card">
          <div class="card-header"><div class="card-title">Informasi Produk</div></div>
          <div class="card-body">
            <div class="stat-row"><span class="stat-label">Nama</span><span class="stat-value">${Utils.escapeHtml(p.product_name)}</span></div>
            <div class="stat-row"><span class="stat-label">Kategori</span><span class="stat-value">${p.category||'-'}</span></div>
            <div class="stat-row"><span class="stat-label">Tipe</span><span class="stat-value">${p.product_type||'-'}</span></div>
            <div class="stat-row"><span class="stat-label">Harga Jual</span><span class="stat-value" style="font-weight:700">${Utils.formatCurrency(p.price)}</span></div>
            <div class="stat-row"><span class="stat-label">HPP (Harga Pokok)</span><span class="stat-value">${Utils.formatCurrency(p.cost)}</span></div>
            <div class="stat-row"><span class="stat-label">Gross Margin</span><span class="stat-value" style="color:var(--color-success)">${margin}%</span></div>
            <div class="stat-row"><span class="stat-label">Status</span><span class="badge ${isActive?'badge-success':'badge-neutral'} no-dot">${isActive?'Aktif':'Non-aktif'}</span></div>
          </div>
        </div>
        <div class="card">
          <div class="card-header"><div class="card-title">Performa Penjualan</div></div>
          <div class="card-body">
            <div class="stat-row"><span class="stat-label">Total Terjual</span><span class="stat-value" style="font-weight:700">${Utils.formatNumber(stats.totalQty)} unit</span></div>
            <div class="stat-row"><span class="stat-label">Total Revenue</span><span class="stat-value">${Utils.formatCurrency(stats.totalRevenue)}</span></div>
            <div class="stat-row"><span class="stat-label">Jumlah Transaksi</span><span class="stat-value">${Utils.formatNumber(stats.txCount)}</span></div>
            <div class="stat-row"><span class="stat-label">Gross Profit</span><span class="stat-value" style="color:var(--color-success)">${Utils.formatCurrency(stats.grossProfit)}</span></div>
          </div>
        </div>
      </div>`;
  }

  function openForm(id = null) {
    const isEdit = !!id;
    const data = isEdit ? ProductService.getById(id) : {};
    if (isEdit && !data) { Toast.error('Produk tidak ditemukan'); return; }
    const categories = ProductRepo.getCategories();
    const modalId = 'modal-product-form';
    let ex = document.getElementById(modalId); if(ex) ex.remove();
    const isActive = isEdit ? (data.is_active === true || data.is_active === 'True') : true;

    const div = document.createElement('div');
    div.id = modalId; div.className = 'modal-backdrop';
    div.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">${isEdit?'Edit Produk':'Tambah Produk'}</h3>
          <button class="modal-close" onclick="Modal.close('${modalId}')">✕</button>
        </div>
        <div class="modal-body">
          <div class="grid-2">
            <div class="form-group" style="grid-column:span 2">
              <label class="form-label">Nama Produk <span class="required">*</span></label>
              <input class="form-input" id="pf-name" type="text" value="${Utils.escapeHtml(data.product_name||'')}" placeholder="Nama produk">
              <div class="form-error hidden" id="err-pf-name"></div>
            </div>
            <div class="form-group">
              <label class="form-label">Kategori</label>
              <input class="form-input" id="pf-category" type="text" value="${Utils.escapeHtml(data.category||'')}" list="category-list" placeholder="Pastry, Bakery, ...">
              <datalist id="category-list">${categories.map(c=>`<option value="${c}">`).join('')}</datalist>
            </div>
            <div class="form-group">
              <label class="form-label">Tipe Produk</label>
              <div class="form-select-wrapper"><select class="form-select" id="pf-type">
                <option value="Food"     ${(data.product_type||'Food')==='Food'?'selected':''}>Food</option>
                <option value="Beverage" ${data.product_type==='Beverage'?'selected':''}>Beverage</option>
              </select></div>
            </div>
            <div class="form-group">
              <label class="form-label">Harga Jual (Rp) <span class="required">*</span></label>
              <input class="form-input" id="pf-price" type="number" min="0" value="${data.price||0}">
              <div class="form-error hidden" id="err-pf-price"></div>
            </div>
            <div class="form-group">
              <label class="form-label">HPP / Harga Pokok (Rp) <span class="required">*</span></label>
              <input class="form-input" id="pf-cost" type="number" min="0" value="${data.cost||0}">
              <div class="form-error hidden" id="err-pf-cost"></div>
            </div>
            <div class="form-group">
              <label class="form-label">Status</label>
              <label style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:8px 0">
                <input type="checkbox" id="pf-active" ${isActive?'checked':''} style="width:16px;height:16px">
                <span class="text-sm">Produk Aktif</span>
              </label>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="Modal.close('${modalId}')">Batal</button>
          <button class="btn btn-primary" id="btn-save-product">${isEdit?'Simpan Perubahan':'Tambah Produk'}</button>
        </div>
      </div>`;
    document.body.appendChild(div);

    document.getElementById('btn-save-product').addEventListener('click', () => {
      const formData = {
        product_name: document.getElementById('pf-name').value,
        category:     document.getElementById('pf-category').value,
        product_type: document.getElementById('pf-type').value,
        price:        document.getElementById('pf-price').value,
        cost:         document.getElementById('pf-cost').value,
        is_active:    document.getElementById('pf-active').checked,
      };
      ['pf-name','pf-price','pf-cost'].forEach(f=>{const e=document.getElementById(`err-${f}`);if(e){e.textContent='';e.classList.add('hidden');}});
      try {
        if (isEdit) { ProductService.update(id,formData); Toast.success('Produk diperbarui.'); }
        else        { ProductService.create(formData);    Toast.success('Produk ditambahkan.'); }
        Modal.close(modalId); div.remove(); render();
      } catch(e) {
        if (e.validation) Object.entries(e.validation).forEach(([k,msg])=>{const el=document.getElementById(`err-pf-${k==='product_name'?'name':k}`);if(el){el.textContent=msg;el.classList.remove('hidden');}});
        else Toast.error(e.message||'Terjadi kesalahan');
      }
    });
    Modal.open(modalId);
  }

  return { render, openForm };
})();

window.ProductsPage = ProductsPage;
