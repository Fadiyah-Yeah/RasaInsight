/**
 * RasaInsight — Product Service (Application Layer)
 */

const ProductService = (() => {

  function getAll() { return ProductRepo.findAll(); }
  function getById(id) { return ProductRepo.findById(id); }

  function search(query, filters = {}) {
    let results = ProductRepo.findAll();
    if (query?.trim()) {
      const q = query.toLowerCase();
      results = results.filter(p =>
        (p.product_name || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q) ||
        (p.product_id || '').toLowerCase().includes(q)
      );
    }
    if (filters.category) results = results.filter(p => p.category === filters.category);
    if (filters.type)     results = results.filter(p => p.product_type === filters.type);
    if (filters.active === 'true')  results = results.filter(p => p.is_active === true || p.is_active === 'True');
    if (filters.active === 'false') results = results.filter(p => p.is_active === false || p.is_active === 'False');
    return results;
  }

  function getProductStats(productId) {
    const details = TransactionDetailRepo.findByProduct(productId);
    const completedTxIds = new Set(TransactionRepo.findCompleted().map(t => t.transaction_id));
    const completedDetails = details.filter(d => completedTxIds.has(d.transaction_id));
    const totalQty  = Utils.sumBy(completedDetails, 'quantity');
    const totalRevenue = Utils.sumBy(completedDetails, 'line_total');
    const txCount   = new Set(completedDetails.map(d => d.transaction_id)).size;
    const product   = ProductRepo.findById(productId);
    const grossProfit = product ? (Number(product.price) - Number(product.cost)) * totalQty : 0;
    const margin = product && Number(product.price) > 0 ? ((Number(product.price) - Number(product.cost)) / Number(product.price)) * 100 : 0;

    return { totalQty, totalRevenue, txCount, grossProfit, margin };
  }

  function create(data) {
    const errors = _validate(data);
    if (Object.keys(errors).length) throw { validation: errors };

    const existingIds = ProductRepo.findAll().map(p => p.product_id);
    const id = Utils.generateId('PRD', existingIds);

    return ProductRepo.create({
      product_id:   id,
      product_name: data.product_name.trim(),
      category:     data.category?.trim() || '',
      product_type: data.product_type || 'Food',
      price:        parseFloat(data.price) || 0,
      cost:         parseFloat(data.cost)  || 0,
      is_active:    !(data.is_active === false || String(data.is_active).toLowerCase() === 'false'),
    });
  }

  function update(id, data) {
    if (!ProductRepo.findById(id)) throw new Error('Produk tidak ditemukan');
    const errors = _validate(data);
    if (Object.keys(errors).length) throw { validation: errors };

    return ProductRepo.update(id, {
      product_name: data.product_name.trim(),
      category:     data.category?.trim() || '',
      product_type: data.product_type || 'Food',
      price:        parseFloat(data.price) || 0,
      cost:         parseFloat(data.cost)  || 0,
      is_active:    !(data.is_active === false || String(data.is_active).toLowerCase() === 'false'),
    });
  }

  function toggleActive(id) {
    const p = ProductRepo.findById(id);
    if (!p) throw new Error('Produk tidak ditemukan');
    const newState = !(p.is_active === true || p.is_active === 'True');
    return ProductRepo.update(id, { is_active: newState });
  }

  function remove(id) {
    if (!ProductRepo.findById(id)) throw new Error('Produk tidak ditemukan');
    const used = TransactionDetailRepo.findByProduct(id).length > 0;
    if (used) throw new Error('Produk sudah tercatat dalam transaksi. Nonaktifkan produk agar histori transaksi tetap utuh.');
    return ProductRepo.delete(id);
  }

  function _validate(data) {
    const errors = {};
    if (!data.product_name?.trim()) errors.product_name = 'Nama produk wajib diisi';
    const price = Number(data.price);
    const cost = Number(data.cost);
    if (!Number.isFinite(price) || price < 0) errors.price = 'Harga harus berupa angka nol atau lebih';
    if (!Number.isFinite(cost) || cost < 0) errors.cost = 'HPP harus berupa angka nol atau lebih';
    return errors;
  }

  return { getAll, getById, search, getProductStats, create, update, toggleActive, remove };
})();

window.ProductService = ProductService;
