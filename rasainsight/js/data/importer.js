/**
 * RasaInsight — Data Importer (Data Layer)
 * Handles CSV file reading via File API and loading into Storage.
 * Works with file:// protocol — no fetch() required.
 */

const DataImporter = (() => {

  // Expected CSV files and their mapping to Storage table names
  const FILE_MAP = [
    { filename: 'customers.csv',           tableName: 'customers',          required: true  },
    { filename: 'products.csv',            tableName: 'products',           required: true  },
    { filename: 'transactions.csv',        tableName: 'transactions',       required: true  },
    { filename: 'transaction_details.csv', tableName: 'transactionDetails', required: true  },
    { filename: 'feedbacks.csv',           tableName: 'feedbacks',          required: false },
    { filename: 'complaints.csv',          tableName: 'complaints',         required: false },
    { filename: 'loyalty_points.csv',      tableName: 'loyaltyPoints',      required: false },
    { filename: 'users_demo.csv',          tableName: 'usersDemo',          required: false },
  ];

  const EXPECTED_FILENAMES = new Set(FILE_MAP.map(f => f.filename));

  // ─── Type Coercion Per Table ────────────────────────────────
  // CSV reads everything as strings — cast to appropriate types
  const COERCE = {
    products: (row) => ({
      ...row,
      price: parseFloat(row.price) || 0,
      cost:  parseFloat(row.cost)  || 0,
      is_active: row.is_active === 'True' || row.is_active === 'true' || row.is_active === true,
    }),
    transactions: (row) => ({
      ...row,
      subtotal:        parseFloat(row.subtotal) || 0,
      discount_amount: parseFloat(row.discount_amount) || 0,
      tax_amount:      parseFloat(row.tax_amount) || 0,
      total_amount:    parseFloat(row.total_amount) || 0,
    }),
    transactionDetails: (row) => ({
      ...row,
      quantity:         parseInt(row.quantity) || 0,
      unit_price:       parseFloat(row.unit_price) || 0,
      discount_percent: parseFloat(row.discount_percent) || 0,
      line_total:       parseFloat(row.line_total) || 0,
    }),
    feedbacks: (row) => ({
      ...row,
      rating: parseInt(row.rating) || 0,
    }),
    loyaltyPoints: (row) => ({
      ...row,
      points_earned:   parseInt(row.points_earned) || 0,
      points_redeemed: parseInt(row.points_redeemed) || 0,
    }),
  };

  function coerceRow(tableName, row) {
    const fn = COERCE[tableName];
    return fn ? fn(row) : row;
  }

  // ─── Read File as Text ─────────────────────────────────────
  function readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
      reader.readAsText(file, 'UTF-8');
    });
  }

  // ─── Identify File Table Name ──────────────────────────────
  function getTableName(filename) {
    const clean = filename.toLowerCase().trim();
    const match = FILE_MAP.find(f => f.filename === clean);
    return match ? match.tableName : null;
  }

  // ─── Process a Single File ─────────────────────────────────
  async function processFile(file) {
    const tableName = getTableName(file.name.toLowerCase());
    if (!tableName) {
      return { file: file.name, status: 'skipped', message: 'File tidak dikenali', count: 0 };
    }

    try {
      const text = await readFileAsText(file);
      const rawRows = Utils.csvToJSON(text);
      const rows = rawRows.map(row => coerceRow(tableName, row));

      return { file: file.name, tableName, status: 'ok', count: rows.length, data: rows };
    } catch (e) {
      return { file: file.name, tableName, status: 'error', message: e.message, count: 0 };
    }
  }

  // ─── Process Multiple Files ────────────────────────────────
  async function processFiles(fileList, onProgress = null) {
    const files = Array.from(fileList);
    const results = [];
    const dataMap = {};

    for (let i = 0; i < files.length; i++) {
      const result = await processFile(files[i]);
      results.push(result);
      if (result.status === 'ok' && result.data) {
        dataMap[result.tableName] = result.data;
      }
      if (onProgress) onProgress(i + 1, files.length, result);
    }

    return { results, dataMap };
  }

  // ─── Validate Import ───────────────────────────────────────
  function validateImport(dataMap) {
    const errors = [];
    const warnings = [];

    // Check required tables
    for (const { filename, tableName, required } of FILE_MAP) {
      if (required && !dataMap[tableName]) {
        errors.push(`File wajib tidak ditemukan: ${filename}`);
      }
    }

    // Basic referential integrity checks
    if (dataMap.transactions && dataMap.customers) {
      const custIds = new Set(dataMap.customers.map(c => c.customer_id));
      const orphans = dataMap.transactions.filter(t => !custIds.has(t.customer_id));
      if (orphans.length) warnings.push(`${orphans.length} transaksi dengan customer_id tidak valid`);
    }

    if (dataMap.transactionDetails && dataMap.transactions) {
      const txIds = new Set(dataMap.transactions.map(t => t.transaction_id));
      const orphans = dataMap.transactionDetails.filter(d => !txIds.has(d.transaction_id));
      if (orphans.length) warnings.push(`${orphans.length} detail transaksi dengan transaction_id tidak valid`);
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  // ─── Full Import Flow ──────────────────────────────────────
  async function importFromFiles(fileList, onProgress = null) {
    const { results, dataMap } = await processFiles(fileList, onProgress);

    const validation = validateImport(dataMap);

    if (!validation.valid) {
      return {
        success: false,
        results,
        errors: validation.errors,
        warnings: validation.warnings,
      };
    }

    // Save to Storage
    const saved = Storage.loadAllTables(dataMap);

    return {
      success: saved,
      results,
      errors: saved ? [] : ['Gagal menyimpan data ke LocalStorage'],
      warnings: validation.warnings,
      summary: buildSummary(results),
    };
  }

  function buildSummary(results) {
    const summary = {};
    results.forEach(r => {
      if (r.status === 'ok') summary[r.tableName] = r.count;
    });
    return summary;
  }

  // ─── Import from JSON string (backup restore) ───────────────
  function importFromJSON(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (data._meta) delete data._meta;
      return Storage.importBackup(data);
    } catch (e) {
      console.error('[DataImporter] JSON import failed:', e);
      return false;
    }
  }

  // Public API
  return {
    FILE_MAP,
    EXPECTED_FILENAMES,
    processFiles,
    importFromFiles,
    importFromJSON,
    validateImport,
    getTableName,
  };
})();

window.DataImporter = DataImporter;
