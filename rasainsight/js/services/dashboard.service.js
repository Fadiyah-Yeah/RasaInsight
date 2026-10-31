/**
 * RasaInsight — Dashboard Service (Application Layer)
 * All KPI calculations sourced from actual data via repositories.
 */

const DashboardService = (() => {

  function getKPIs() {
    const completedTx = TransactionRepo.findCompleted();
    const customers   = CustomerRepo.findAll();
    const products    = ProductRepo.findAll();
    const complaints  = ComplaintRepo.findAll();
    const feedbacks   = FeedbackRepo.findAll();

    const revenue    = Utils.sumBy(completedTx, 'total_amount');
    const txCount    = completedTx.length;
    const custCount  = customers.length;
    const aov        = txCount > 0 ? revenue / txCount : 0;
    const avgRating  = FeedbackRepo.getAvgRating();
    const resRate    = ComplaintRepo.getResolutionRate();
    const pendingCmp = ComplaintRepo.count(c => c.status !== 'Resolved');

    // Repeat customers
    const txPerCust = Utils.groupBy(completedTx, 'customer_id');
    const repeatCount = Object.values(txPerCust).filter(txs => txs.length > 1).length;
    const repeatRate = custCount > 0 ? (repeatCount / custCount) * 100 : 0;

    return {
      revenue,
      txCount,
      custCount,
      productCount: products.length,
      aov,
      avgRating,
      resolutionRate: resRate,
      pendingComplaints: pendingCmp,
      repeatCustomers: repeatCount,
      repeatRate,
    };
  }

  function getMonthlyRevenue() {
    const completedTx = TransactionRepo.findCompleted();
    const grouped = Utils.groupBy(completedTx, tx => Utils.getMonthKey(tx.transaction_datetime));
    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([monthKey, txs]) => ({
        month: monthKey,
        monthLabel: Utils.getMonthLabel(monthKey),
        revenue: Utils.sumBy(txs, 'total_amount'),
        count: txs.length,
      }));
  }

  function getTopProducts(limit = 5) {
    const details = TransactionDetailRepo.findAll();
    const byProduct = Utils.groupBy(details, 'product_id');
    return Object.entries(byProduct)
      .map(([productId, rows]) => ({
        product: ProductRepo.findById(productId) || { product_name: productId, product_id: productId },
        revenue: Utils.sumBy(rows, 'line_total'),
        quantity: Utils.sumBy(rows, 'quantity'),
        txCount: new Set(rows.map(r => r.transaction_id)).size,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  }

  function getSalesByChannel() {
    const completedTx = TransactionRepo.findCompleted();
    const grouped = Utils.countBy(completedTx, 'sales_channel');
    const revenueMap = {};
    completedTx.forEach(tx => {
      revenueMap[tx.sales_channel] = (revenueMap[tx.sales_channel] || 0) + Number(tx.total_amount);
    });
    return Object.entries(grouped).map(([channel, count]) => ({
      channel,
      count,
      revenue: revenueMap[channel] || 0,
    })).sort((a, b) => b.revenue - a.revenue);
  }

  function getSalesByPayment() {
    const completedTx = TransactionRepo.findCompleted();
    const grouped = Utils.countBy(completedTx, 'payment_method');
    const revenueMap = {};
    completedTx.forEach(tx => {
      revenueMap[tx.payment_method] = (revenueMap[tx.payment_method] || 0) + Number(tx.total_amount);
    });
    return Object.entries(grouped).map(([method, count]) => ({
      method,
      count,
      revenue: revenueMap[method] || 0,
    })).sort((a, b) => b.count - a.count);
  }

  function getRecentTransactions(limit = 10) {
    const all = TransactionRepo.findAll();
    return Utils.sortBy(all, 'transaction_datetime', 'desc')
      .slice(0, limit)
      .map(tx => ({
        ...tx,
        customer: CustomerRepo.findById(tx.customer_id) || { customer_name: 'Unknown' },
      }));
  }

  function getSentimentSummary() {
    const feedbacks = FeedbackRepo.findAll();
    const grouped = Utils.countBy(feedbacks, 'sentiment_label');
    return {
      positive: grouped['Positive'] || 0,
      neutral:  grouped['Neutral']  || 0,
      negative: grouped['Negative'] || 0,
      total:    feedbacks.length,
    };
  }

  return {
    getKPIs,
    getMonthlyRevenue,
    getTopProducts,
    getSalesByChannel,
    getSalesByPayment,
    getRecentTransactions,
    getSentimentSummary,
  };
})();

window.DashboardService = DashboardService;
