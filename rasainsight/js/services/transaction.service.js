/**
 * RasaInsight — Transaction Service (Application Layer)
 */

const TransactionService = (() => {

  function getAll() { return TransactionRepo.findAll(); }
  function getById(id) { return TransactionRepo.findById(id); }

  function search(query, filters = {}) {
    let results = TransactionRepo.findAll();

    if (query?.trim()) {
      const q = query.toLowerCase();
      results = results.filter(t =>
        (t.transaction_id || '').toLowerCase().includes(q) ||
        (t.customer_id || '').toLowerCase().includes(q) ||
        (() => {
          const c = CustomerRepo.findById(t.customer_id);
          return (c?.customer_name || '').toLowerCase().includes(q);
        })()
      );
    }

    if (filters.status)  results = results.filter(t => t.transaction_status === filters.status);
    if (filters.channel) results = results.filter(t => t.sales_channel === filters.channel);
    if (filters.payment) results = results.filter(t => t.payment_method === filters.payment);
    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom);
      results = results.filter(t => new Date(t.transaction_datetime) >= from);
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo);
      to.setHours(23, 59, 59);
      results = results.filter(t => new Date(t.transaction_datetime) <= to);
    }

    return results;
  }

  function getDetail(transactionId) {
    const tx = TransactionRepo.findById(transactionId);
    if (!tx) return null;
    const customer = CustomerRepo.findById(tx.customer_id);
    const details = TransactionDetailRepo.getEnrichedByTransaction(transactionId);
    return { ...tx, customer, details };
  }

  function getChannels()  { return [...new Set(TransactionRepo.findAll().map(t => t.sales_channel).filter(Boolean))]; }
  function getPayments()  { return [...new Set(TransactionRepo.findAll().map(t => t.payment_method).filter(Boolean))]; }

  // ─── Create new transaction ─────────────────────────────────
  function create(txData, items) {
    // Validate
    if (!txData.customer_id) throw new Error('Pilih pelanggan terlebih dahulu');
    if (!CustomerRepo.findById(txData.customer_id)) throw new Error('Pelanggan tidak ditemukan');
    if (!items || !items.length) throw new Error('Tambahkan minimal satu produk');

    // Validate all products exist
    for (const item of items) {
      const product = ProductRepo.findById(item.product_id);
      if (!product) throw new Error(`Produk ${item.product_id} tidak ditemukan`);
      if (!(product.is_active === true || product.is_active === 'True')) throw new Error(`Produk ${product.product_name} sedang nonaktif`);
      if (!Number.isInteger(Number(item.quantity)) || Number(item.quantity) < 1) throw new Error('Quantity harus berupa bilangan bulat lebih dari 0');
      const discount = Number(item.discount_percent) || 0;
      if (discount < 0 || discount > 1) throw new Error('Diskon produk harus berada di antara 0% dan 100%');
    }

    // Generate transaction ID
    const existingIds = TransactionRepo.findAll().map(t => t.transaction_id);
    const txId = Utils.generateId('TRX', existingIds);

    // Build detail rows and calculate totals
    const detailIds = TransactionDetailRepo.findAll().map(d => d.detail_id);
    let detailCounter = 0;
    const detailRecords = [];
    let subtotal = 0;

    for (const item of items) {
      const product = ProductRepo.findById(item.product_id);
      const discPct = Number(item.discount_percent) || 0;
      const lineTotal = Number(item.quantity) * Number(product.price) * (1 - discPct);
      subtotal += lineTotal;

      detailCounter++;
      const detailId = `DTL${txId.replace('TRX', '')}${String(detailCounter).padStart(2, '0')}`;
      detailRecords.push({
        detail_id:        detailId,
        transaction_id:   txId,
        product_id:       item.product_id,
        quantity:         item.quantity,
        unit_price:       product.price,
        discount_percent: discPct,
        line_total:       Utils.round(lineTotal, 2),
      });
    }

    const discountAmount = Number(txData.discount_amount) || 0;
    const taxAmount      = Number(txData.tax_amount) || 0;
    if (discountAmount < 0 || taxAmount < 0) throw new Error('Diskon dan pajak tidak boleh bernilai negatif');
    const totalAmount = Utils.round(subtotal - discountAmount + taxAmount, 2);
    if (totalAmount < 0) throw new Error('Total transaksi tidak boleh negatif');

    const txRecord = {
      transaction_id:      txId,
      customer_id:         txData.customer_id,
      transaction_datetime: txData.transaction_datetime || new Date().toISOString().slice(0, 16).replace('T', ' '),
      sales_channel:       txData.sales_channel || 'Dine-in',
      payment_method:      txData.payment_method || 'Cash',
      subtotal:            Utils.round(subtotal, 2),
      discount_amount:     discountAmount,
      tax_amount:          taxAmount,
      total_amount:        totalAmount,
      transaction_status:  txData.transaction_status || 'Completed',
    };

    // Save transaction header
    TransactionRepo.create(txRecord);

    // Save detail rows
    detailRecords.forEach(d => TransactionDetailRepo.create(d));

    // Create loyalty record if Completed
    if (txRecord.transaction_status === 'Completed') {
      _createLoyaltyRecord(txRecord);
    }

    return txRecord;
  }

  function _createLoyaltyRecord(txRecord) {
    const existing = LoyaltyRepo.findByTransaction(txRecord.transaction_id);
    if (existing.length) return; // Prevent duplicate

    const existingLpIds = LoyaltyRepo.findAll().map(lp => lp.loyalty_transaction_id);
    const lpId = Utils.generateId('LP', existingLpIds);
    const pointsEarned = Math.floor(txRecord.total_amount / 10000);

    LoyaltyRepo.create({
      loyalty_transaction_id: lpId,
      customer_id:      txRecord.customer_id,
      transaction_id:   txRecord.transaction_id,
      transaction_date: txRecord.transaction_datetime,
      points_earned:    pointsEarned,
      points_redeemed:  0,
      description:      'Poin dari transaksi',
    });
  }

  function updateStatus(id, newStatus) {
    const tx = TransactionRepo.findById(id);
    if (!tx) throw new Error('Transaksi tidak ditemukan');
    const allowed = ['Completed', 'Pending', 'Cancelled'];
    if (!allowed.includes(newStatus)) throw new Error('Status transaksi tidak valid');
    const updated = TransactionRepo.update(id, { transaction_status: newStatus });
    if (newStatus === 'Completed') {
      _createLoyaltyRecord(updated);
    } else {
      // Revoke only points earned from this transaction when it is no longer completed.
      LoyaltyRepo.findByTransaction(id)
        .filter(lp => Number(lp.points_earned) > 0 && Number(lp.points_redeemed) === 0)
        .forEach(lp => LoyaltyRepo.delete(lp.loyalty_transaction_id));
    }
    return updated;
  }

  function update(id, data) {
    const existing = TransactionRepo.findById(id);
    if (!existing) throw new Error('Transaksi tidak ditemukan');
    if (data.customer_id && !CustomerRepo.findById(data.customer_id)) throw new Error('Pelanggan tidak ditemukan');
    const patch = {};
    ['customer_id', 'transaction_datetime', 'sales_channel', 'payment_method'].forEach(key => {
      if (data[key] !== undefined) patch[key] = data[key];
    });
    if (patch.transaction_datetime && Number.isNaN(new Date(patch.transaction_datetime).getTime())) {
      throw new Error('Tanggal transaksi tidak valid');
    }
    const updated = TransactionRepo.update(id, patch);
    // Keep automatically-earned loyalty points attached to the edited customer/date.
    LoyaltyRepo.findByTransaction(id)
      .filter(lp => Number(lp.points_earned) > 0 && Number(lp.points_redeemed) === 0)
      .forEach(lp => LoyaltyRepo.update(lp.loyalty_transaction_id, {
        customer_id: updated.customer_id,
        transaction_date: updated.transaction_datetime,
      }));
    return updated;
  }

  function remove(id) {
    // Also remove details and loyalty record
    const details = TransactionDetailRepo.findByTransaction(id);
    details.forEach(d => {
      try { TransactionDetailRepo.delete(d.detail_id); } catch {}
    });
    const lpRecords = LoyaltyRepo.findByTransaction(id);
    lpRecords.forEach(lp => {
      try { LoyaltyRepo.delete(lp.loyalty_transaction_id); } catch {}
    });
    return TransactionRepo.delete(id);
  }

  return { getAll, getById, search, getDetail, getChannels, getPayments, create, update, updateStatus, remove };
})();

window.TransactionService = TransactionService;
