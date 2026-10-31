/**
 * RasaInsight — Storage Manager (Data Layer)
 * Handles all LocalStorage operations with error safety.
 * No UI component should access LocalStorage directly.
 */

const Storage = (() => {
  const PREFIX = 'rasainsight_';
  const VERSION_KEY = PREFIX + 'version';
  const CURRENT_VERSION = '1.0.0';

  const KEYS = {
    customers:           PREFIX + 'customers',
    products:            PREFIX + 'products',
    transactions:        PREFIX + 'transactions',
    transactionDetails:  PREFIX + 'transaction_details',
    feedbacks:           PREFIX + 'feedbacks',
    complaints:          PREFIX + 'complaints',
    loyaltyPoints:       PREFIX + 'loyalty_points',
    usersDemo:           PREFIX + 'users_demo',
    // Metadata
    initialized:         PREFIX + 'initialized',
    lastImport:          PREFIX + 'last_import',
  };

  // ─── Core Read/Write ───────────────────────────────────────
  function get(key) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return null;
      return JSON.parse(raw);
    } catch (e) {
      console.warn(`[Storage] Failed to parse key "${key}":`, e);
      return null;
    }
  }

  function set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error(`[Storage] Failed to write key "${key}":`, e);
      if (e.name === 'QuotaExceededError') {
        Toast && Toast.error('Penyimpanan browser penuh. Harap hapus data lama.', 'Storage Penuh');
      }
      return false;
    }
  }

  function remove(key) {
    try { localStorage.removeItem(key); return true; }
    catch (e) { return false; }
  }

  // ─── Table Operations ──────────────────────────────────────
  function getTable(tableName) {
    const key = KEYS[tableName];
    if (!key) { console.warn(`[Storage] Unknown table: ${tableName}`); return []; }
    const data = get(key);
    if (!Array.isArray(data)) return [];
    return data;
  }

  function setTable(tableName, data) {
    const key = KEYS[tableName];
    if (!key) return false;
    return set(key, Array.isArray(data) ? data : []);
  }

  // ─── Initialization Check ──────────────────────────────────
  function isInitialized() {
    return get(KEYS.initialized) === true;
  }

  function markInitialized() {
    set(KEYS.initialized, true);
    set(VERSION_KEY, CURRENT_VERSION);
    set(KEYS.lastImport, new Date().toISOString());
  }

  // ─── Bulk Load (from CSV import) ───────────────────────────
  function loadAllTables(dataMap) {
    // dataMap: { customers: [...], products: [...], ... }
    let success = true;
    const tableKeys = Object.keys(KEYS).filter(k => !['initialized', 'lastImport'].includes(k));

    for (const tableName of tableKeys) {
      if (dataMap[tableName]) {
        const ok = setTable(tableName, dataMap[tableName]);
        if (!ok) { success = false; }
      }
    }

    if (success) markInitialized();
    return success;
  }

  // ─── Reset ─────────────────────────────────────────────────
  function resetToInitial(initialDataMap) {
    // Remove all app data
    Object.values(KEYS).forEach(k => remove(k));
    remove(VERSION_KEY);
    // Reload
    return loadAllTables(initialDataMap);
  }

  function clearAll() {
    Object.values(KEYS).forEach(k => remove(k));
    remove(VERSION_KEY);
  }

  // ─── Export Backup ─────────────────────────────────────────
  function exportBackup() {
    const backup = {};
    const tableNames = Object.keys(KEYS).filter(k => !['initialized', 'lastImport'].includes(k));
    tableNames.forEach(name => {
      backup[name] = getTable(name);
    });
    backup._meta = {
      version: CURRENT_VERSION,
      exportedAt: new Date().toISOString(),
      app: 'RasaInsight',
    };
    return backup;
  }

  function importBackup(backupData) {
    if (!backupData || typeof backupData !== 'object') return false;
    const tableNames = Object.keys(KEYS).filter(k => !['initialized', 'lastImport'].includes(k));
    let ok = true;
    tableNames.forEach(name => {
      if (Array.isArray(backupData[name])) {
        if (!setTable(name, backupData[name])) ok = false;
      }
    });
    if (ok) markInitialized();
    return ok;
  }

  // ─── Storage Info ──────────────────────────────────────────
  function getStats() {
    const tableNames = Object.keys(KEYS).filter(k => !['initialized', 'lastImport'].includes(k));
    const stats = {};
    tableNames.forEach(name => {
      stats[name] = getTable(name).length;
    });
    stats._initialized = isInitialized();
    stats._lastImport = get(KEYS.lastImport);
    return stats;
  }

  function getStorageSize() {
    let total = 0;
    for (const key of Object.values(KEYS)) {
      const item = localStorage.getItem(key);
      if (item) total += item.length * 2; // UTF-16
    }
    return total;
  }

  // ─── Extras needed by SettingsPage ─────────────────────────
  // Alias for exportBackup
  function exportAll() { return exportBackup(); }

  // Full reset (wipes data + initialized flag) — used by SettingsPage
  function reset() { clearAll(); }

  // Generic flag setter (used for force_reimport)
  function setFlag(name, value) { set(PREFIX + 'flag_' + name, value); }
  function getFlag(name) { return get(PREFIX + 'flag_' + name); }
  function clearFlag(name) { remove(PREFIX + 'flag_' + name); }

  return {
    KEYS,
    get, set, remove,
    getTable, setTable,
    isInitialized, markInitialized,
    loadAllTables, resetToInitial, clearAll,
    exportBackup, importBackup,
    exportAll, reset,
    setFlag, getFlag, clearFlag,
    getStats, getStorageSize,
  };
})();

window.Storage = Storage;
