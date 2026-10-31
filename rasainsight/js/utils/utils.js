/**
 * RasaInsight — Utility Functions
 * Currency, Date, String, Validation helpers
 */

const Utils = (() => {

  // ─── Currency ──────────────────────────────────────────────
  function formatCurrency(value, compact = false) {
    const num = Number(value) || 0;
    if (compact && num >= 1_000_000) {
      return 'Rp' + (num / 1_000_000).toFixed(1) + 'Jt';
    }
    if (compact && num >= 1_000) {
      return 'Rp' + (num / 1_000).toFixed(0) + 'Rb';
    }
    return 'Rp' + num.toLocaleString('id-ID');
  }

  // Compact alias used by BI charts (axis ticks)
  function formatCurrencyShort(value) {
    return formatCurrency(value, true);
  }

  function parseCurrency(str) {
    return parseFloat(String(str).replace(/[^\d.,-]/g, '').replace(',', '.')) || 0;
  }

  // ─── Numbers ───────────────────────────────────────────────
  function formatNumber(value, decimals = 0) {
    return Number(value || 0).toLocaleString('id-ID', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  function formatPercent(value, decimals = 1) {
    return Number(value || 0).toFixed(decimals) + '%';
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(Number(value), min), max);
  }

  function round(value, decimals = 2) {
    return Math.round(Number(value) * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }

  // ─── Dates ─────────────────────────────────────────────────
  function formatDate(dateStr, format = 'short') {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d)) return '-';
    const opts = {
      short:    { day: '2-digit', month: 'short', year: 'numeric' },
      long:     { day: '2-digit', month: 'long',  year: 'numeric' },
      datetime: { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' },
      time:     { hour: '2-digit', minute: '2-digit' },
      monthYear:{ month: 'short', year: 'numeric' },
    };
    return d.toLocaleDateString('id-ID', opts[format] || opts.short);
  }

  function formatDatetime(dateStr) {
    return formatDate(dateStr, 'datetime');
  }

  function toISODate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d)) return '';
    return d.toISOString().split('T')[0];
  }

  function diffDays(dateA, dateB) {
    const a = new Date(dateA);
    const b = new Date(dateB);
    return Math.round((b - a) / (1000 * 60 * 60 * 24));
  }

  function daysSince(dateStr) {
    return diffDays(dateStr, new Date());
  }

  function getMonthKey(dateStr) {
    const d = new Date(dateStr);
    if (isNaN(d)) return '';
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  function getMonthLabel(monthKey) {
    const [year, month] = monthKey.split('-');
    const d = new Date(year, Number(month) - 1, 1);
    return d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
  }

  function isValidDate(dateStr) {
    return dateStr && !isNaN(new Date(dateStr));
  }

  function getAge(birthDateStr) {
    if (!birthDateStr) return null;
    const today = new Date();
    const birth = new Date(birthDateStr);
    if (isNaN(birth)) return null;
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }

  // Alias used by BIService
  function ageFromDate(birthDateStr) { return getAge(birthDateStr); }

  // ─── Strings ───────────────────────────────────────────────
  function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  function titleCase(str) {
    if (!str) return '';
    return str.split(' ').map(w => capitalize(w)).join(' ');
  }

  function truncate(str, maxLen = 40, suffix = '…') {
    if (!str) return '';
    return str.length <= maxLen ? str : str.slice(0, maxLen) + suffix;
  }

  function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function slugify(str) {
    return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }

  function highlight(text, query) {
    if (!query || !text) return escapeHtml(text || '');
    const escaped = escapeHtml(text);
    const escapedQ = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return escaped.replace(new RegExp(escapedQ, 'gi'), m => `<mark>${m}</mark>`);
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  // ─── ID Generation ─────────────────────────────────────────
  function generateId(prefix = 'ID', existingIds = []) {
    // Find highest existing number for this prefix
    const nums = existingIds
      .filter(id => id && id.startsWith(prefix))
      .map(id => parseInt(id.slice(prefix.length)) || 0);
    const max = nums.length > 0 ? Math.max(...nums) : 0;
    const next = max + 1;
    const padLen = Math.max(3, String(max + 1).length);
    return prefix + String(next).padStart(padLen, '0');
  }

  // ─── Array Helpers ─────────────────────────────────────────
  function groupBy(arr, key) {
    return arr.reduce((acc, item) => {
      const k = typeof key === 'function' ? key(item) : item[key];
      if (!acc[k]) acc[k] = [];
      acc[k].push(item);
      return acc;
    }, {});
  }

  function sumBy(arr, key) {
    return arr.reduce((sum, item) => sum + (Number(typeof key === 'function' ? key(item) : item[key]) || 0), 0);
  }

  function maxBy(arr, key) {
    if (!arr.length) return null;
    return arr.reduce((max, item) => {
      const v = typeof key === 'function' ? key(item) : item[key];
      return v > (typeof key === 'function' ? key(max) : max[key]) ? item : max;
    });
  }

  function sortBy(arr, key, dir = 'asc') {
    return [...arr].sort((a, b) => {
      const va = typeof key === 'function' ? key(a) : a[key];
      const vb = typeof key === 'function' ? key(b) : b[key];
      if (va === vb) return 0;
      const cmp = va < vb ? -1 : 1;
      return dir === 'asc' ? cmp : -cmp;
    });
  }

  function unique(arr, key) {
    if (!key) return [...new Set(arr)];
    const seen = new Set();
    return arr.filter(item => {
      const k = typeof key === 'function' ? key(item) : item[key];
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }

  function countBy(arr, key) {
    return arr.reduce((acc, item) => {
      const k = typeof key === 'function' ? key(item) : item[key];
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});
  }

  function paginate(arr, page = 1, perPage = 20) {
    const total = arr.length;
    const totalPages = Math.ceil(total / perPage);
    const currentPage = clamp(page, 1, totalPages || 1);
    const start = (currentPage - 1) * perPage;
    const items = arr.slice(start, start + perPage);
    return { items, total, totalPages, currentPage, perPage, start: start + 1, end: start + items.length };
  }

  // ─── Object Helpers ────────────────────────────────────────
  function pick(obj, keys) {
    return keys.reduce((acc, k) => { if (k in obj) acc[k] = obj[k]; return acc; }, {});
  }

  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  // ─── Validation ────────────────────────────────────────────
  function isEmail(str) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
  }

  function isPhone(str) {
    return /^[0-9+\-\s]{8,15}$/.test(str);
  }

  function isEmpty(val) {
    return val === null || val === undefined || val === '' || (Array.isArray(val) && !val.length);
  }

  function validateRequired(obj, fields) {
    const errors = {};
    fields.forEach(f => {
      if (isEmpty(obj[f])) errors[f] = 'Field ini wajib diisi';
    });
    return errors;
  }

  // ─── DOM Helpers ───────────────────────────────────────────
  function el(selector) { return document.querySelector(selector); }
  function els(selector) { return [...document.querySelectorAll(selector)]; }

  function show(element) {
    if (typeof element === 'string') element = el(element);
    if (element) element.classList.remove('hidden');
  }

  function hide(element) {
    if (typeof element === 'string') element = el(element);
    if (element) element.classList.add('hidden');
  }

  function toggle(element, force) {
    if (typeof element === 'string') element = el(element);
    if (element) element.classList.toggle('hidden', force !== undefined ? !force : undefined);
  }

  function html(element, content) {
    if (typeof element === 'string') element = el(element);
    if (element) element.innerHTML = content;
  }

  function setText(element, text) {
    if (typeof element === 'string') element = el(element);
    if (element) element.textContent = text;
  }

  function on(element, event, handler) {
    if (typeof element === 'string') element = el(element);
    if (element) element.addEventListener(event, handler);
    return element;
  }

  function delegate(parent, event, selector, handler) {
    const p = typeof parent === 'string' ? el(parent) : parent;
    if (!p) return;
    p.addEventListener(event, e => {
      const target = e.target.closest(selector);
      if (target && p.contains(target)) handler.call(target, e, target);
    });
  }

  // ─── CSV Parser ────────────────────────────────────────────
  function parseCSV(text) {
    const lines = text.trim().split('\n');
    if (!lines.length) return [];
    // Handle BOM
    const headerLine = lines[0].replace(/^\uFEFF/, '');
    const headers = parseCSVRow(headerLine);
    return lines.slice(1).map(line => {
      const values = parseCSVRow(line);
      const obj = {};
      headers.forEach((h, i) => { obj[h.trim()] = (values[i] || '').trim(); });
      return obj;
    }).filter(row => Object.values(row).some(v => v !== ''));
  }

  function parseCSVRow(line) {
    const result = [];
    let current = '';
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuote && line[i + 1] === '"') { current += '"'; i++; }
        else { inQuote = !inQuote; }
      } else if (ch === ',' && !inQuote) {
        result.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current);
    return result;
  }

  function csvToJSON(text) {
    return parseCSV(text);
  }

  // Convert array of objects → CSV string (used by SettingsPage)
  function toCSV(data) {
    if (!data || !data.length) return '';
    const headers = Object.keys(data[0]);
    const rows = data.map(row => headers.map(h => {
      const v = String(row[h] ?? '');
      return v.includes(',') || v.includes('"') || v.includes('\n') ? `"${v.replace(/"/g, '""')}"` : v;
    }).join(','));
    return [headers.join(','), ...rows].join('\n');
  }

  // ─── Export ────────────────────────────────────────────────
  function downloadJSON(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadCSV(data, filename) {
    if (!data || !data.length) return;
    const headers = Object.keys(data[0]);
    const rows = data.map(row => headers.map(h => {
      const v = String(row[h] || '');
      return v.includes(',') || v.includes('"') || v.includes('\n') ? `"${v.replace(/"/g, '""')}"` : v;
    }).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ─── Pagination Renderer ────────────────────────────────────
  /**
   * Renders pagination HTML.
   * @param {number} total - Total number of items
   * @param {number} currentPage - 1-based current page
   * @param {number} perPage - Items per page
   * @param {function} onPageClick - Callback called with new page number
   * @returns {string} HTML string (or empty if no pagination needed)
   */
  function renderPagination(total, currentPage, perPage, onPageClick) {
    const totalPages = Math.ceil(total / perPage);
    if (totalPages <= 1) return '';

    const pages = [];
    // Always show first, last, current ±2
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '…') {
        pages.push('…');
      }
    }

    const id = 'pg_' + Math.random().toString(36).slice(2, 7);
    const btnClass = (pg) => pg === currentPage
      ? 'btn btn-sm btn-primary'
      : 'btn btn-sm btn-outline';

    const html = `
      <div class="pagination" id="${id}" style="display:flex;align-items:center;gap:4px;padding:12px 16px;flex-wrap:wrap;">
        <button class="btn btn-sm btn-ghost" ${currentPage === 1 ? 'disabled' : ''} data-pg="${currentPage - 1}">&#8249;</button>
        ${pages.map(pg => pg === '…'
          ? `<span style="padding:0 4px;color:var(--text-muted);">…</span>`
          : `<button class="${btnClass(pg)}" data-pg="${pg}">${pg}</button>`
        ).join('')}
        <button class="btn btn-sm btn-ghost" ${currentPage === totalPages ? 'disabled' : ''} data-pg="${currentPage + 1}">&#8250;</button>
        <span style="margin-left:8px;font-size:12px;color:var(--text-muted);">${total} item</span>
      </div>`;

    // Wire up after a microtask (DOM must exist)
    setTimeout(() => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('click', e => {
        const btn = e.target.closest('[data-pg]');
        if (!btn || btn.disabled) return;
        const pg = parseInt(btn.dataset.pg);
        if (!isNaN(pg) && pg >= 1 && pg <= totalPages && typeof onPageClick === 'function') {
          onPageClick(pg);
        }
      });
    }, 0);

    return html;
  }

  // ─── Debounce ──────────────────────────────────────────────
  function debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }

  function throttle(fn, limit = 200) {
    let last = 0;
    return (...args) => {
      const now = Date.now();
      if (now - last >= limit) { last = now; fn(...args); }
    };
  }

  // Public API
  return {
    // Currency
    formatCurrency, parseCurrency, formatCurrencyShort,
    // Numbers
    formatNumber, formatPercent, clamp, round,
    // Dates
    formatDate, formatDatetime, toISODate, diffDays, daysSince,
    getMonthKey, getMonthLabel, isValidDate, getAge, ageFromDate,
    // Strings
    capitalize, titleCase, truncate, getInitials, slugify,
    highlight, escapeHtml,
    // ID
    generateId,
    // Array
    groupBy, sumBy, maxBy, sortBy, unique, countBy, paginate,
    // Object
    pick, deepClone,
    // Validation
    isEmail, isPhone, isEmpty, validateRequired,
    // DOM
    el, els, show, hide, toggle, html, setText, on, delegate,
    // CSV
    parseCSV, csvToJSON, toCSV,
    // Export
    downloadJSON, downloadCSV,
    // Pagination
    renderPagination,
    // Misc
    debounce, throttle,
  };
})();

// Make globally available
window.Utils = Utils;
