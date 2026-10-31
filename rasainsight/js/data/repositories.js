/**
 * RasaInsight — Repositories (Data Layer)
 * One repository per table. All data access goes through here.
 * Services call repositories. UI never calls repositories directly.
 */

// ─── Base Repository Factory ────────────────────────────────
function createRepository(tableName, primaryKey) {
  return {
    // Read all
    findAll() {
      return Storage.getTable(tableName);
    },

    // Read by primary key
    findById(id) {
      return this.findAll().find(r => r[primaryKey] === id) || null;
    },

    // Read with filter function
    findWhere(predicate) {
      return this.findAll().filter(predicate);
    },

    // Read first match
    findOne(predicate) {
      return this.findAll().find(predicate) || null;
    },

    // Create
    create(data) {
      const all = this.findAll();
      // Check duplicate PK
      if (all.find(r => r[primaryKey] === data[primaryKey])) {
        throw new Error(`Duplicate ${primaryKey}: ${data[primaryKey]}`);
      }
      const newRecord = { ...data };
      all.push(newRecord);
      Storage.setTable(tableName, all);
      return newRecord;
    },

    // Update
    update(id, changes) {
      const all = this.findAll();
      const idx = all.findIndex(r => r[primaryKey] === id);
      if (idx === -1) throw new Error(`Record not found: ${id}`);
      all[idx] = { ...all[idx], ...changes };
      Storage.setTable(tableName, all);
      return all[idx];
    },

    // Delete
    delete(id) {
      const all = this.findAll();
      const idx = all.findIndex(r => r[primaryKey] === id);
      if (idx === -1) throw new Error(`Record not found: ${id}`);
      const [deleted] = all.splice(idx, 1);
      Storage.setTable(tableName, all);
      return deleted;
    },

    // Bulk operations
    bulkCreate(dataArray) {
      const all = this.findAll();
      const existing = new Set(all.map(r => r[primaryKey]));
      const toAdd = dataArray.filter(d => !existing.has(d[primaryKey]));
      const combined = [...all, ...toAdd];
      Storage.setTable(tableName, combined);
      return toAdd.length;
    },

    // Count
    count(predicate) {
      const all = this.findAll();
      return predicate ? all.filter(predicate).length : all.length;
    },

    // Replace all (used for reset)
    replaceAll(dataArray) {
      Storage.setTable(tableName, dataArray);
    },

    // Get table name (for debugging)
    getTableName() { return tableName; },
    getPrimaryKey() { return primaryKey; },
  };
}

// ─── Concrete Repositories ──────────────────────────────────

const CustomerRepo = {
  ...createRepository('customers', 'customer_id'),

  findByName(query) {
    const q = query.toLowerCase();
    return this.findAll().filter(c =>
      c.customer_name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.customer_id?.toLowerCase().includes(q)
    );
  },

  findByCity(city) {
    return this.findWhere(c => c.city === city);
  },

  findActive() {
    return this.findWhere(c => c.customer_status === 'Active');
  },
};

const ProductRepo = {
  ...createRepository('products', 'product_id'),

  findActive() {
    return this.findWhere(p => p.is_active === 'True' || p.is_active === true);
  },

  findByCategory(category) {
    return this.findWhere(p => p.category === category);
  },

  findByType(type) {
    return this.findWhere(p => p.product_type === type);
  },

  getCategories() {
    return [...new Set(this.findAll().map(p => p.category))].filter(Boolean).sort();
  },
};

const TransactionRepo = {
  ...createRepository('transactions', 'transaction_id'),

  findByCustomer(customerId) {
    return this.findWhere(t => t.customer_id === customerId);
  },

  findByStatus(status) {
    return this.findWhere(t => t.transaction_status === status);
  },

  findByDateRange(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return this.findWhere(t => {
      const d = new Date(t.transaction_datetime);
      return d >= start && d <= end;
    });
  },

  findCompleted() {
    return this.findByStatus('Completed');
  },

  getByMonth(monthKey) {
    return this.findWhere(t => Utils.getMonthKey(t.transaction_datetime) === monthKey);
  },
};

const TransactionDetailRepo = {
  ...createRepository('transactionDetails', 'detail_id'),

  findByTransaction(transactionId) {
    return this.findWhere(d => d.transaction_id === transactionId);
  },

  findByProduct(productId) {
    return this.findWhere(d => d.product_id === productId);
  },

  // Get enriched details for a transaction (with product info)
  getEnrichedByTransaction(transactionId) {
    const details = this.findByTransaction(transactionId);
    return details.map(d => ({
      ...d,
      product: ProductRepo.findById(d.product_id) || {},
    }));
  },
};

const FeedbackRepo = {
  ...createRepository('feedbacks', 'feedback_id'),

  findByCustomer(customerId) {
    return this.findWhere(f => f.customer_id === customerId);
  },

  findByTransaction(transactionId) {
    return this.findWhere(f => f.transaction_id === transactionId);
  },

  findBySentiment(sentiment) {
    return this.findWhere(f => f.sentiment_label === sentiment);
  },

  findBySource(source) {
    return this.findWhere(f => f.source === source);
  },

  getAvgRating() {
    const all = this.findAll();
    if (!all.length) return 0;
    return all.reduce((sum, f) => sum + (Number(f.rating) || 0), 0) / all.length;
  },
};

const ComplaintRepo = {
  ...createRepository('complaints', 'complaint_id'),

  findByCustomer(customerId) {
    return this.findWhere(c => c.customer_id === customerId);
  },

  findByStatus(status) {
    return this.findWhere(c => c.status === status);
  },

  findByPriority(priority) {
    return this.findWhere(c => c.priority === priority);
  },

  findByCategory(category) {
    return this.findWhere(c => c.category === category);
  },

  findPending() {
    return this.findWhere(c => c.status !== 'Resolved');
  },

  getResolutionRate() {
    const all = this.findAll();
    if (!all.length) return 0;
    const resolved = all.filter(c => c.status === 'Resolved').length;
    return (resolved / all.length) * 100;
  },
};

const LoyaltyRepo = {
  ...createRepository('loyaltyPoints', 'loyalty_transaction_id'),

  findByCustomer(customerId) {
    return this.findWhere(lp => lp.customer_id === customerId);
  },

  findByTransaction(transactionId) {
    return this.findWhere(lp => lp.transaction_id === transactionId);
  },

  getTotalPointsEarned(customerId) {
    return this.findByCustomer(customerId)
      .reduce((sum, lp) => sum + (parseInt(lp.points_earned) || 0), 0);
  },

  getTotalPointsRedeemed(customerId) {
    return this.findByCustomer(customerId)
      .reduce((sum, lp) => sum + (parseInt(lp.points_redeemed) || 0), 0);
  },

  getBalance(customerId) {
    return this.getTotalPointsEarned(customerId) - this.getTotalPointsRedeemed(customerId);
  },
};

const UserRepo = {
  ...createRepository('usersDemo', 'user_id'),

  findByRole(role) {
    return this.findWhere(u => u.role === role);
  },
};

// ─── Export all repositories ────────────────────────────────
window.CustomerRepo = CustomerRepo;
window.ProductRepo = ProductRepo;
window.TransactionRepo = TransactionRepo;
window.TransactionDetailRepo = TransactionDetailRepo;
window.FeedbackRepo = FeedbackRepo;
window.ComplaintRepo = ComplaintRepo;
window.LoyaltyRepo = LoyaltyRepo;
window.UserRepo = UserRepo;
