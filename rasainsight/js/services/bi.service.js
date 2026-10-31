/**
 * RasaInsight — Business Intelligence Service (Application Layer)
 * RFM segmentation, revenue analytics, product performance, cohort data.
 * All values computed from real LocalStorage data — nothing hardcoded.
 */

const BIService = (() => {

  // ═══════════════════════════════════════════════════════════
  // RFM SEGMENTATION ENGINE
  // ═══════════════════════════════════════════════════════════

  /**
   * Compute RFM scores and segments for all customers who have
   * at least one completed transaction.
   */
  function computeRFM() {
    const customers  = CustomerRepo.findAll();
    const allTxs     = TransactionRepo.findCompleted();

    // Build per-customer aggregates
    const customerMap = {};
    customers.forEach(c => {
      customerMap[c.customer_id] = {
        customer: c,
        txs: [],
      };
    });
    allTxs.forEach(t => {
      if (customerMap[t.customer_id]) {
        customerMap[t.customer_id].txs.push(t);
      }
    });

    // Raw R / F / M values
    const rawData = [];
    Object.values(customerMap).forEach(({ customer, txs }) => {
      if (!txs.length) return;
      const sorted    = Utils.sortBy(txs, 'transaction_datetime', 'desc');
      const recency   = Utils.daysSince(sorted[0].transaction_datetime);
      const frequency = txs.length;
      const monetary  = Utils.sumBy(txs, 'total_amount');
      rawData.push({ customer, recency, frequency, monetary });
    });

    if (!rawData.length) return [];

    // Score each dimension into 1–5 quintiles
    // Recency: lower days = better = higher score
    const rScores = _quintileScores(rawData.map(d => d.recency), true);
    // Frequency: higher = better
    const fScores = _quintileScores(rawData.map(d => d.frequency), false);
    // Monetary: higher = better
    const mScores = _quintileScores(rawData.map(d => d.monetary), false);

    return rawData.map((d, i) => {
      const rScore = rScores[i];
      const fScore = fScores[i];
      const mScore = mScores[i];
      const rfmScore = rScore + fScore + mScore;
      const segment = _classifySegment(rScore, fScore, mScore);
      return {
        customer_id:   d.customer.customer_id,
        customer_name: d.customer.customer_name,
        city:          d.customer.city,
        status:        d.customer.customer_status,
        recency:       d.recency,
        frequency:     d.frequency,
        monetary:      d.monetary,
        r_score:       rScore,
        f_score:       fScore,
        m_score:       mScore,
        rfm_score:     rfmScore,
        segment,
      };
    });
  }

  /**
   * Map RFM scores to a named segment.
   * Priority order matters — first match wins.
   */
  function _classifySegment(r, f, m) {
    const avg = (r + f + m) / 3;
    if (r >= 4 && f >= 4 && m >= 4) return 'Champions';
    if (r >= 3 && f >= 3 && avg >= 3.5) return 'Loyal Customers';
    if (r >= 4 && f <= 2) return 'New Customers';
    if (r >= 3 && f >= 2 && m >= 3) return 'Potential Loyalists';
    if (r >= 4 && f >= 2 && m >= 2) return 'Promising';
    if (r <= 2 && f >= 4 && m >= 4) return 'At Risk';
    if (r <= 2 && f >= 2 && m >= 2) return 'Needs Attention';
    if (r <= 1 && f >= 3) return 'Cant Lose Them';
    if (r <= 2 && f <= 2) return 'Hibernating';
    return 'Others';
  }

  /** Assign quintile scores 1–5 to an array of values */
  function _quintileScores(values, invertHigher) {
    const sorted = [...values].sort((a, b) => a - b);
    const n = sorted.length;
    return values.map(v => {
      // Percentile rank (0–1)
      let rank = sorted.filter(x => x < v).length / n;
      // Convert to 1–5
      let score = Math.ceil(rank * 5) || 1;
      if (score > 5) score = 5;
      // Invert: for recency, lower value = better = higher score
      return invertHigher ? 6 - score : score;
    });
  }

  function getRFMSummary() {
    const data = computeRFM();
    const segmentCounts = {};
    data.forEach(d => {
      segmentCounts[d.segment] = (segmentCounts[d.segment] || 0) + 1;
    });
    return { data, segmentCounts, total: data.length };
  }

  // ═══════════════════════════════════════════════════════════
  // REVENUE ANALYTICS
  // ═══════════════════════════════════════════════════════════

  function getRevenueByMonth() {
    const txs = TransactionRepo.findCompleted();
    const byMonth = {};
    txs.forEach(t => {
      const key = Utils.getMonthKey(t.transaction_datetime);
      if (!byMonth[key]) byMonth[key] = { revenue: 0, orders: 0 };
      byMonth[key].revenue += Number(t.total_amount) || 0;
      byMonth[key].orders++;
    });
    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, d]) => ({ month, ...d }));
  }

  function getRevenueByChannel() {
    const txs = TransactionRepo.findCompleted();
    const dist = {};
    txs.forEach(t => {
      const ch = t.sales_channel || 'Unknown';
      if (!dist[ch]) dist[ch] = { revenue: 0, orders: 0 };
      dist[ch].revenue += Number(t.total_amount) || 0;
      dist[ch].orders++;
    });
    return Object.entries(dist).map(([channel, d]) => ({ channel, ...d }));
  }

  function getRevenueByPayment() {
    const txs = TransactionRepo.findCompleted();
    const dist = {};
    txs.forEach(t => {
      const pm = t.payment_method || 'Unknown';
      if (!dist[pm]) dist[pm] = { revenue: 0, orders: 0 };
      dist[pm].revenue += Number(t.total_amount) || 0;
      dist[pm].orders++;
    });
    return Object.entries(dist).map(([method, d]) => ({ method, ...d }));
  }

  function getRevenueByDay() {
    const txs = TransactionRepo.findCompleted();
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const dist = Array(7).fill(null).map((_, i) => ({ day: days[i], revenue: 0, orders: 0 }));
    txs.forEach(t => {
      const d = new Date(t.transaction_datetime).getDay();
      dist[d].revenue += Number(t.total_amount) || 0;
      dist[d].orders++;
    });
    return dist;
  }

  // ═══════════════════════════════════════════════════════════
  // PRODUCT PERFORMANCE
  // ═══════════════════════════════════════════════════════════

  function getProductPerformance() {
    const completedIds = new Set(TransactionRepo.findCompleted().map(t => t.transaction_id));
    const details  = TransactionDetailRepo.findAll().filter(d => completedIds.has(d.transaction_id));
    const products = ProductRepo.findAll();

    const perfMap = {};
    products.forEach(p => {
      perfMap[p.product_id] = {
        product:  p,
        qty_sold: 0,
        revenue:  0,
        tx_count: 0,
        txSet:    new Set(),
      };
    });

    details.forEach(d => {
      if (!perfMap[d.product_id]) return;
      perfMap[d.product_id].qty_sold += Number(d.quantity) || 0;
      perfMap[d.product_id].revenue  += Number(d.line_total) || 0;
      perfMap[d.product_id].txSet.add(d.transaction_id);
    });

    return Object.values(perfMap).map(({ product, qty_sold, revenue, txSet }) => ({
      product_id:   product.product_id,
      product_name: product.product_name,
      category:     product.category,
      product_type: product.product_type,
      price:        product.price,
      qty_sold,
      revenue:      Utils.round(revenue, 2),
      tx_count:     txSet.size,
      avg_order_qty: txSet.size ? Utils.round(qty_sold / txSet.size, 2) : 0,
    }));
  }

  function getTopProducts(limit = 10, sortBy = 'revenue') {
    return getProductPerformance()
      .sort((a, b) => b[sortBy] - a[sortBy])
      .slice(0, limit);
  }

  function getProductByCategory() {
    const perf = getProductPerformance();
    const dist = {};
    perf.forEach(p => {
      const cat = p.category || 'Other';
      if (!dist[cat]) dist[cat] = { revenue: 0, qty_sold: 0, product_count: 0 };
      dist[cat].revenue    += p.revenue;
      dist[cat].qty_sold   += p.qty_sold;
      dist[cat].product_count++;
    });
    return Object.entries(dist).map(([category, d]) => ({ category, ...d }));
  }

  // ═══════════════════════════════════════════════════════════
  // CUSTOMER ANALYTICS
  // ═══════════════════════════════════════════════════════════

  function getCustomerGrowthByMonth() {
    const customers = CustomerRepo.findAll();
    const byMonth = {};
    customers.forEach(c => {
      const key = Utils.getMonthKey(c.joined_at);
      if (!key) return;
      byMonth[key] = (byMonth[key] || 0) + 1;
    });
    // Cumulative
    let cumulative = 0;
    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, new_customers]) => {
        cumulative += new_customers;
        return { month, new_customers, cumulative };
      });
  }

  function getCustomersByCity() {
    const customers = CustomerRepo.findAll();
    const dist = {};
    customers.forEach(c => {
      const city = c.city || 'Unknown';
      dist[city] = (dist[city] || 0) + 1;
    });
    return Object.entries(dist)
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count);
  }

  function getCustomersByGender() {
    const customers = CustomerRepo.findAll();
    const dist = {};
    customers.forEach(c => {
      const g = c.gender || 'Unknown';
      dist[g] = (dist[g] || 0) + 1;
    });
    return Object.entries(dist).map(([gender, count]) => ({ gender, count }));
  }

  function getAgeDistribution() {
    const customers = CustomerRepo.findAll();
    const brackets = {
      '<20':   0,
      '20–29': 0,
      '30–39': 0,
      '40–49': 0,
      '50+':   0,
    };
    customers.forEach(c => {
      if (!c.birth_date) return;
      const age = Utils.ageFromDate(c.birth_date);
      if (age < 20)       brackets['<20']++;
      else if (age < 30)  brackets['20–29']++;
      else if (age < 40)  brackets['30–39']++;
      else if (age < 50)  brackets['40–49']++;
      else                brackets['50+']++;
    });
    return Object.entries(brackets).map(([bracket, count]) => ({ bracket, count }));
  }

  // ═══════════════════════════════════════════════════════════
  // FEEDBACK & SENTIMENT ANALYTICS
  // ═══════════════════════════════════════════════════════════

  function getSentimentTrend() {
    const feedbacks = FeedbackRepo.findAll();
    const byMonth = {};
    feedbacks.forEach(f => {
      const key = Utils.getMonthKey(f.feedback_date);
      if (!key) return;
      if (!byMonth[key]) byMonth[key] = { Positive: 0, Neutral: 0, Negative: 0 };
      const s = f.sentiment_label;
      if (byMonth[key][s] !== undefined) byMonth[key][s]++;
    });
    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, d]) => ({ month, ...d }));
  }

  function getRatingDistribution() {
    return FeedbackService.getStats().ratingDist;
  }

  // ═══════════════════════════════════════════════════════════
  // COHORT / RETENTION (simplified: first-transaction month)
  // ═══════════════════════════════════════════════════════════

  function getCohortData() {
    const txs = TransactionRepo.findCompleted();

    // Find each customer's first transaction month
    const firstTx = {};
    txs.forEach(t => {
      const month = Utils.getMonthKey(t.transaction_datetime);
      if (!firstTx[t.customer_id] || month < firstTx[t.customer_id]) {
        firstTx[t.customer_id] = month;
      }
    });

    // Count customers per cohort (acquisition month)
    const cohortSize = {};
    Object.entries(firstTx).forEach(([_, month]) => {
      cohortSize[month] = (cohortSize[month] || 0) + 1;
    });

    return Object.entries(cohortSize)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, customers]) => ({ month, customers }));
  }

  // ═══════════════════════════════════════════════════════════
  // OVERALL BI SUMMARY (for AI Insights)
  // ═══════════════════════════════════════════════════════════

  function getSummary() {
    const txs      = TransactionRepo.findCompleted();
    const revenue  = Utils.sumBy(txs, 'total_amount');
    const customers = CustomerRepo.findAll();
    const avgOrder = txs.length ? revenue / txs.length : 0;
    const topProducts = getTopProducts(5, 'revenue');
    const rfm = getRFMSummary();

    const feedStats = FeedbackService.getStats();
    const compStats = ComplaintService.getStats();
    const loyStats  = LoyaltyService.getStats();
    const revenueMonthly = getRevenueByMonth();
    const lastMonth = revenueMonthly.length >= 2
      ? revenueMonthly[revenueMonthly.length - 1]
      : null;
    const prevMonth = revenueMonthly.length >= 2
      ? revenueMonthly[revenueMonthly.length - 2]
      : null;
    const revGrowth = (lastMonth && prevMonth && prevMonth.revenue > 0)
      ? ((lastMonth.revenue - prevMonth.revenue) / prevMonth.revenue) * 100
      : null;

    return {
      revenue, avgOrder,
      totalOrders:   txs.length,
      totalCustomers: customers.length,
      topProducts,
      rfmSegments:   rfm.segmentCounts,
      avgRating:     feedStats.avgRating,
      positiveSentimentPct: feedStats.total
        ? Utils.round((feedStats.positive / feedStats.total) * 100, 1) : 0,
      complaintResolutionRate: compStats.resolutionRate,
      openComplaints: compStats.open,
      loyaltyPoints:  loyStats.totalEarned,
      revGrowth,
      lastMonth:      lastMonth?.month,
    };
  }

  return {
    // RFM
    computeRFM, getRFMSummary,
    // Revenue
    getRevenueByMonth, getRevenueByChannel, getRevenueByPayment, getRevenueByDay,
    // Products
    getProductPerformance, getTopProducts, getProductByCategory,
    // Customers
    getCustomerGrowthByMonth, getCustomersByCity, getCustomersByGender, getAgeDistribution,
    // Feedback
    getSentimentTrend, getRatingDistribution,
    // Cohort
    getCohortData,
    // Summary
    getSummary,
  };
})();

window.BIService = BIService;
