/**
 * RasaInsight — Customer Service (Application Layer)
 * Business logic for customer management and CRM operations.
 */

const CustomerService = (() => {

  // ─── Read Operations ────────────────────────────────────────
  function getAll() {
    return CustomerRepo.findAll();
  }

  function getById(id) {
    return CustomerRepo.findById(id);
  }

  function search(query, filters = {}) {
    let results = CustomerRepo.findAll();

    if (query && query.trim()) {
      const q = query.toLowerCase();
      results = results.filter(c =>
        (c.customer_name || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.phone || '').includes(q) ||
        (c.customer_id || '').toLowerCase().includes(q)
      );
    }

    if (filters.city) results = results.filter(c => c.city === filters.city);
    if (filters.gender) results = results.filter(c => c.gender === filters.gender);
    if (filters.status) results = results.filter(c => c.customer_status === filters.status);

    return results;
  }

  function getCities() {
    return [...new Set(CustomerRepo.findAll().map(c => c.city).filter(Boolean))].sort();
  }

  // ─── Customer Detail / Stats ────────────────────────────────
  function getCustomerStats(customerId) {
    const txs = TransactionRepo.findByCustomer(customerId);
    const completed = txs.filter(t => t.transaction_status === 'Completed');
    const totalSpend = Utils.sumBy(completed, 'total_amount');
    const avgOrderValue = completed.length ? totalSpend / completed.length : 0;
    const loyaltyBalance = LoyaltyRepo.getBalance(customerId);
    const feedbacks = FeedbackRepo.findByCustomer(customerId);
    const avgRating = feedbacks.length
      ? feedbacks.reduce((s, f) => s + (Number(f.rating) || 0), 0) / feedbacks.length
      : null;
    const complaints = ComplaintRepo.findByCustomer(customerId);

    // Last transaction date
    const sorted = Utils.sortBy(completed, 'transaction_datetime', 'desc');
    const lastTxDate = sorted.length ? sorted[0].transaction_datetime : null;

    return {
      txCount: txs.length,
      completedTxCount: completed.length,
      totalSpend,
      avgOrderValue,
      loyaltyBalance,
      loyaltyEarned: LoyaltyRepo.getTotalPointsEarned(customerId),
      feedbackCount: feedbacks.length,
      avgRating,
      complaintCount: complaints.length,
      lastTxDate,
    };
  }

  function getCustomerTransactions(customerId) {
    const txs = TransactionRepo.findByCustomer(customerId);
    return Utils.sortBy(txs, 'transaction_datetime', 'desc');
  }

  // ─── RFM for single customer ────────────────────────────────
  function getCustomerRFM(customerId) {
    const txs = TransactionRepo.findByCustomer(customerId)
      .filter(t => t.transaction_status === 'Completed');
    if (!txs.length) return null;

    const sorted = Utils.sortBy(txs, 'transaction_datetime', 'desc');
    const recency = Utils.daysSince(sorted[0].transaction_datetime);
    const frequency = txs.length;
    const monetary = Utils.sumBy(txs, 'total_amount');
    return { recency, frequency, monetary };
  }

  // ─── Create / Update / Delete ───────────────────────────────
  function create(data) {
    const errors = _validate(data);
    if (Object.keys(errors).length) throw { validation: errors };

    const existingIds = CustomerRepo.findAll().map(c => c.customer_id);
    const id = Utils.generateId('CUST', existingIds);

    const record = {
      customer_id: id,
      customer_name: data.customer_name.trim(),
      email: data.email?.trim() || '',
      phone: data.phone?.trim() || '',
      city: data.city?.trim() || '',
      gender: data.gender || '',
      birth_date: data.birth_date || '',
      joined_at: data.joined_at || Utils.toISODate(new Date()),
      customer_status: data.customer_status || 'Active',
    };

    return CustomerRepo.create(record);
  }

  function update(id, data) {
    const existing = CustomerRepo.findById(id);
    if (!existing) throw new Error('Pelanggan tidak ditemukan');

    const errors = _validate(data);
    if (Object.keys(errors).length) throw { validation: errors };

    return CustomerRepo.update(id, {
      customer_name: data.customer_name.trim(),
      email: data.email?.trim() || '',
      phone: data.phone?.trim() || '',
      city: data.city?.trim() || '',
      gender: data.gender || '',
      birth_date: data.birth_date || '',
      customer_status: data.customer_status || 'Active',
    });
  }

  function remove(id) {
    const existing = CustomerRepo.findById(id);
    if (!existing) throw new Error('Pelanggan tidak ditemukan');
    return CustomerRepo.delete(id);
  }

  // ─── Validation ─────────────────────────────────────────────
  function _validate(data) {
    const errors = {};
    if (!data.customer_name?.trim()) errors.customer_name = 'Nama wajib diisi';
    if (data.email && !Utils.isEmail(data.email)) errors.email = 'Format email tidak valid';
    if (data.phone && !Utils.isPhone(data.phone)) errors.phone = 'Format nomor telepon tidak valid';
    return errors;
  }

  return {
    getAll, getById, search, getCities,
    getCustomerStats, getCustomerTransactions, getCustomerRFM,
    create, update, remove,
  };
})();

window.CustomerService = CustomerService;
