/**
 * RasaInsight — Feedback Service (Application Layer)
 * Business logic for customer feedback management.
 */

const FeedbackService = (() => {

  function getAll() { return FeedbackRepo.findAll(); }
  function getById(id) { return FeedbackRepo.findById(id); }

  function search(query, filters = {}) {
    let results = FeedbackRepo.findAll();

    if (query?.trim()) {
      const q = query.toLowerCase();
      results = results.filter(f => {
        const c = CustomerRepo.findById(f.customer_id);
        return (
          (f.feedback_id || '').toLowerCase().includes(q) ||
          (f.customer_id || '').toLowerCase().includes(q) ||
          (f.feedback_text || '').toLowerCase().includes(q) ||
          (c?.customer_name || '').toLowerCase().includes(q)
        );
      });
    }

    if (filters.sentiment)   results = results.filter(f => f.sentiment_label === filters.sentiment);
    if (filters.source)      results = results.filter(f => f.source === filters.source);
    if (filters.ratingMin)   results = results.filter(f => Number(f.rating) >= Number(filters.ratingMin));
    if (filters.ratingMax)   results = results.filter(f => Number(f.rating) <= Number(filters.ratingMax));
    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom);
      results = results.filter(f => new Date(f.feedback_date) >= from);
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo);
      to.setHours(23, 59, 59);
      results = results.filter(f => new Date(f.feedback_date) <= to);
    }

    return results;
  }

  // Enriched with customer + transaction info
  function getEnriched(records) {
    return records.map(f => ({
      ...f,
      customer:    CustomerRepo.findById(f.customer_id) || {},
      transaction: TransactionRepo.findById(f.transaction_id) || {},
    }));
  }

  function getDetail(feedbackId) {
    const f = FeedbackRepo.findById(feedbackId);
    if (!f) return null;
    return {
      ...f,
      customer:    CustomerRepo.findById(f.customer_id) || {},
      transaction: TransactionRepo.findById(f.transaction_id) || {},
    };
  }

  // Aggregate stats for KPI cards
  function getStats() {
    const all = FeedbackRepo.findAll();
    const total = all.length;
    const avgRating = FeedbackRepo.getAvgRating();
    const positive  = all.filter(f => f.sentiment_label === 'Positive').length;
    const negative  = all.filter(f => f.sentiment_label === 'Negative').length;
    const neutral   = all.filter(f => f.sentiment_label === 'Neutral').length;

    // Rating distribution
    const ratingDist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    all.forEach(f => { const r = Number(f.rating); if (r >= 1 && r <= 5) ratingDist[r]++; });

    // Source distribution
    const sourceDist = {};
    all.forEach(f => {
      const s = f.source || 'Unknown';
      sourceDist[s] = (sourceDist[s] || 0) + 1;
    });

    return { total, avgRating, positive, negative, neutral, ratingDist, sourceDist };
  }

  function getSources() {
    return [...new Set(FeedbackRepo.findAll().map(f => f.source).filter(Boolean))].sort();
  }

  // Create new feedback
  function create(data) {
    const errors = _validate(data);
    if (Object.keys(errors).length) throw { validation: errors };

    const existingIds = FeedbackRepo.findAll().map(f => f.feedback_id);
    const id = Utils.generateId('FB', existingIds);

    return FeedbackRepo.create({
      feedback_id:     id,
      customer_id:     data.customer_id,
      transaction_id:  data.transaction_id || '',
      feedback_date:   data.feedback_date || Utils.toISODate(new Date()),
      source:          data.source || 'Manual',
      rating:          Number(data.rating),
      feedback_text:   data.feedback_text?.trim() || '',
      sentiment_label: data.sentiment_label || _autoSentiment(Number(data.rating)),
    });
  }

  function update(id, data) {
    if (!FeedbackRepo.findById(id)) throw new Error('Feedback tidak ditemukan');
    const errors = _validate(data);
    if (Object.keys(errors).length) throw { validation: errors };

    return FeedbackRepo.update(id, {
      rating:          Number(data.rating),
      feedback_text:   data.feedback_text?.trim() || '',
      sentiment_label: data.sentiment_label || _autoSentiment(Number(data.rating)),
      source:          data.source || 'Manual',
    });
  }

  function remove(id) {
    if (!FeedbackRepo.findById(id)) throw new Error('Feedback tidak ditemukan');
    return FeedbackRepo.delete(id);
  }

  // Auto-label sentiment from rating
  function _autoSentiment(rating) {
    if (rating >= 4) return 'Positive';
    if (rating === 3) return 'Neutral';
    return 'Negative';
  }

  function _validate(data) {
    const errors = {};
    if (!data.customer_id || !CustomerRepo.findById(data.customer_id)) errors.customer_id = 'Pilih pelanggan yang valid';
    const rating = Number(data.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) errors.rating = 'Rating harus bilangan bulat 1–5';
    return errors;
  }

  return { getAll, getById, search, getEnriched, getDetail, getStats, getSources, create, update, remove };
})();

window.FeedbackService = FeedbackService;
