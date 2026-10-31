/**
 * RasaInsight — Complaint Service (Application Layer)
 * Business logic for customer complaints management.
 */

const ComplaintService = (() => {

  function getAll() { return ComplaintRepo.findAll(); }
  function getById(id) { return ComplaintRepo.findById(id); }

  function search(query, filters = {}) {
    let results = ComplaintRepo.findAll();

    if (query?.trim()) {
      const q = query.toLowerCase();
      results = results.filter(c => {
        const cust = CustomerRepo.findById(c.customer_id);
        return (
          (c.complaint_id || '').toLowerCase().includes(q) ||
          (c.customer_id || '').toLowerCase().includes(q) ||
          (c.description || '').toLowerCase().includes(q) ||
          (cust?.customer_name || '').toLowerCase().includes(q)
        );
      });
    }

    if (filters.status)   results = results.filter(c => c.status === filters.status);
    if (filters.priority) results = results.filter(c => c.priority === filters.priority);
    if (filters.category) results = results.filter(c => c.category === filters.category);
    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom);
      results = results.filter(c => new Date(c.complaint_date) >= from);
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo);
      to.setHours(23, 59, 59);
      results = results.filter(c => new Date(c.complaint_date) <= to);
    }

    return results;
  }

  function getEnriched(records) {
    return records.map(c => ({
      ...c,
      customer:    CustomerRepo.findById(c.customer_id) || {},
      transaction: TransactionRepo.findById(c.transaction_id) || {},
    }));
  }

  function getDetail(complaintId) {
    const c = ComplaintRepo.findById(complaintId);
    if (!c) return null;
    return {
      ...c,
      customer:    CustomerRepo.findById(c.customer_id) || {},
      transaction: TransactionRepo.findById(c.transaction_id) || {},
    };
  }

  function getStats() {
    const all = ComplaintRepo.findAll();
    const total    = all.length;
    const open     = all.filter(c => c.status === 'Open').length;
    const resolved = all.filter(c => c.status === 'Resolved').length;
    const pending  = all.filter(c => c.status === 'In Progress').length;
    const resolutionRate = total ? Utils.round((resolved / total) * 100, 1) : 0;

    const priorityDist = { High: 0, Medium: 0, Low: 0 };
    all.forEach(c => { if (priorityDist[c.priority] !== undefined) priorityDist[c.priority]++; });

    const categoryDist = {};
    all.forEach(c => {
      const cat = c.category || 'Other';
      categoryDist[cat] = (categoryDist[cat] || 0) + 1;
    });

    return { total, open, resolved, pending, resolutionRate, priorityDist, categoryDist };
  }

  function getCategories() {
    return [...new Set(ComplaintRepo.findAll().map(c => c.category).filter(Boolean))].sort();
  }

  function create(data) {
    const errors = _validate(data);
    if (Object.keys(errors).length) throw { validation: errors };

    const existingIds = ComplaintRepo.findAll().map(c => c.complaint_id);
    const id = Utils.generateId('COMP', existingIds);

    return ComplaintRepo.create({
      complaint_id:     id,
      customer_id:      data.customer_id,
      transaction_id:   data.transaction_id || '',
      complaint_date:   data.complaint_date || Utils.toISODate(new Date()),
      category:         data.category || 'Other',
      description:      data.description?.trim() || '',
      priority:         data.priority || 'Medium',
      status:           data.status || 'Open',
      resolution_notes: data.resolution_notes?.trim() || '',
    });
  }

  function update(id, data) {
    if (!ComplaintRepo.findById(id)) throw new Error('Komplain tidak ditemukan');
    const errors = _validate(data);
    if (Object.keys(errors).length) throw { validation: errors };

    return ComplaintRepo.update(id, {
      category:         data.category || 'Other',
      description:      data.description?.trim() || '',
      priority:         data.priority || 'Medium',
      status:           data.status || 'Open',
      resolution_notes: data.resolution_notes?.trim() || '',
    });
  }

  function resolve(id, notes) {
    if (!ComplaintRepo.findById(id)) throw new Error('Komplain tidak ditemukan');
    return ComplaintRepo.update(id, {
      status: 'Resolved',
      resolution_notes: notes?.trim() || 'Telah diselesaikan',
    });
  }

  function remove(id) {
    if (!ComplaintRepo.findById(id)) throw new Error('Komplain tidak ditemukan');
    return ComplaintRepo.delete(id);
  }

  function _validate(data) {
    const errors = {};
    if (!data.customer_id || !CustomerRepo.findById(data.customer_id)) errors.customer_id = 'Pilih pelanggan yang valid';
    if (!data.description?.trim()) errors.description = 'Deskripsi wajib diisi';
    if (data.priority && !['High', 'Medium', 'Low'].includes(data.priority)) errors.priority = 'Prioritas tidak valid';
    if (data.status && !['Open', 'In Progress', 'Resolved'].includes(data.status)) errors.status = 'Status tidak valid';
    return errors;
  }

  return { getAll, getById, search, getEnriched, getDetail, getStats, getCategories, create, update, resolve, remove };
})();

window.ComplaintService = ComplaintService;
