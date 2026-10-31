/**
 * RasaInsight — Loyalty Service (Application Layer)
 * Business logic for loyalty points management.
 */

const LoyaltyService = (() => {

  function getAll() { return LoyaltyRepo.findAll(); }
  function getById(id) { return LoyaltyRepo.findById(id); }

  function search(query, filters = {}) {
    let results = LoyaltyRepo.findAll();

    if (query?.trim()) {
      const q = query.toLowerCase();
      results = results.filter(lp => {
        const c = CustomerRepo.findById(lp.customer_id);
        return (
          (lp.customer_id || '').toLowerCase().includes(q) ||
          (lp.transaction_id || '').toLowerCase().includes(q) ||
          (c?.customer_name || '').toLowerCase().includes(q)
        );
      });
    }

    if (filters.customerId) results = results.filter(lp => lp.customer_id === filters.customerId);
    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom);
      results = results.filter(lp => new Date(lp.transaction_date) >= from);
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo);
      to.setHours(23, 59, 59);
      results = results.filter(lp => new Date(lp.transaction_date) <= to);
    }

    return results;
  }

  // Enriched record: attach customer name and transaction info
  function getEnriched(records) {
    // Build balances from the complete ledger, then return only requested rows.
    const running = new Map();
    const balances = new Map();
    const ordered = [...LoyaltyRepo.findAll()].sort((a, b) => {
      const dateCompare = new Date(a.transaction_date || 0) - new Date(b.transaction_date || 0);
      return dateCompare || String(a.loyalty_transaction_id).localeCompare(String(b.loyalty_transaction_id));
    });
    ordered.forEach(lp => {
      const balance = (running.get(lp.customer_id) || 0)
        + (Number(lp.points_earned) || 0) - (Number(lp.points_redeemed) || 0);
      running.set(lp.customer_id, balance);
      balances.set(lp.loyalty_transaction_id, balance);
    });
    return records.map(lp => ({
      ...lp,
      customer: CustomerRepo.findById(lp.customer_id) || {},
      balance: balances.get(lp.loyalty_transaction_id) ?? 0,
      tier: getTier(LoyaltyRepo.getBalance(lp.customer_id)),
    }));
  }

  // Membership tiers are based on the customer's current available balance.
  function getTier(balance) {
    const points = Math.max(0, Number(balance) || 0);
    if (points >= 2000) return { name: 'Platinum', minPoints: 2000, nextTier: null, pointsToNext: 0 };
    if (points >= 1000) return { name: 'Gold', minPoints: 1000, nextTier: 'Platinum', pointsToNext: 2000 - points };
    if (points >= 300) return { name: 'Silver', minPoints: 300, nextTier: 'Gold', pointsToNext: 1000 - points };
    return { name: 'Member', minPoints: 0, nextTier: 'Silver', pointsToNext: 300 - points };
  }

  // Summary per customer
  function getCustomerLoyaltySummary(customerId) {
    const records = LoyaltyRepo.findByCustomer(customerId);
    const customer = CustomerRepo.findById(customerId);
    return {
      customer,
      records: Utils.sortBy(records, 'transaction_date', 'desc'),
      totalEarned:   LoyaltyRepo.getTotalPointsEarned(customerId),
      totalRedeemed: LoyaltyRepo.getTotalPointsRedeemed(customerId),
      balance:       LoyaltyRepo.getBalance(customerId),
    };
  }

  // Top customers by loyalty balance
  function getTopLoyalCustomers(limit = 10) {
    const customers = CustomerRepo.findAll();
    return customers
      .map(c => ({
        ...c,
        balance:  LoyaltyRepo.getBalance(c.customer_id),
        earned:   LoyaltyRepo.getTotalPointsEarned(c.customer_id),
        redeemed: LoyaltyRepo.getTotalPointsRedeemed(c.customer_id),
      }))
      .filter(c => c.earned > 0)
      .sort((a, b) => b.balance - a.balance)
      .slice(0, limit);
  }

  // Global stats for KPI cards
  function getStats() {
    const all = LoyaltyRepo.findAll();
    const totalEarned   = Utils.sumBy(all, 'points_earned');
    const totalRedeemed = Utils.sumBy(all, 'points_redeemed');
    const customersWithPoints = new Set(all.map(lp => lp.customer_id)).size;
    return { totalEarned, totalRedeemed, balance: totalEarned - totalRedeemed, customersWithPoints };
  }

  // Redeem points for a customer
  function redeem(customerId, points, description = 'Penukaran poin') {
    const amount = Number(points);
    if (!customerId || !CustomerRepo.findById(customerId)) throw new Error('Pelanggan tidak ditemukan');
    if (!Number.isInteger(amount) || amount <= 0) throw new Error('Jumlah poin harus berupa bilangan bulat lebih dari 0');
    const balance = LoyaltyRepo.getBalance(customerId);
    if (amount > balance) throw new Error(`Saldo poin tidak cukup. Saldo: ${balance}`);
    const existingIds = LoyaltyRepo.findAll().map(lp => lp.loyalty_transaction_id);
    const lpId = Utils.generateId('LP', existingIds);
    return LoyaltyRepo.create({
      loyalty_transaction_id: lpId,
      customer_id:     customerId,
      transaction_id:  '',
      transaction_date: Utils.toISODate(new Date()),
      points_earned:   0,
      points_redeemed: points,
      description,
    });
  }

  return { getAll, getById, search, getEnriched, getCustomerLoyaltySummary, getTopLoyalCustomers, getStats, getTier, redeem };
})();

window.LoyaltyService = LoyaltyService;
