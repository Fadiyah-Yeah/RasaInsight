/**
 * RasaInsight — Toast Notification System
 * Application Layer: UI feedback component
 */

const Toast = (() => {
  let container = null;

  function getContainer() {
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    return container;
  }

  const ICONS = {
    success: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
    error:   `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`,
    warning: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
    info:    `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`,
  };

  function show(message, type = 'info', duration = 3500, title = null) {
    const c = getContainer();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const typeLabels = { success: 'Berhasil', error: 'Error', warning: 'Perhatian', info: 'Info' };

    toast.innerHTML = `
      <span class="toast-icon">${ICONS[type] || ICONS.info}</span>
      <div class="toast-body">
        <div class="toast-title">${title || typeLabels[type]}</div>
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close" aria-label="Tutup">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
    `;

    toast.querySelector('.toast-close').addEventListener('click', () => dismiss(toast));
    c.appendChild(toast);

    const timer = setTimeout(() => dismiss(toast), duration);
    toast._timer = timer;

    return toast;
  }

  function dismiss(toast) {
    clearTimeout(toast._timer);
    toast.style.animation = 'none';
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.25s ease';
    setTimeout(() => toast.remove(), 250);
  }

  function success(message, title) { return show(message, 'success', 3500, title); }
  function error(message, title)   { return show(message, 'error',   5000, title); }
  function warning(message, title) { return show(message, 'warning', 4000, title); }
  function info(message, title)    { return show(message, 'info',    3500, title); }

  return { show, success, error, warning, info, dismiss };
})();

window.Toast = Toast;

/* ──────────────────────────────────────────────────────────── */

/**
 * RasaInsight — Modal System
 * Programmatic modal API:
 *   Modal.open({ title, body, confirmLabel, cancelLabel, onConfirm, hideConfirm, confirmClass })
 *   Modal.confirm(message, onConfirm, options)
 *   Modal.close()
 *   Modal.closeAll()
 */
const Modal = (() => {
  const _modals = [];

  // ─── Low-level show/hide by element ──────────────────────
  function _show(el) {
    el.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function _hide(el) {
    el.classList.remove('active');
    setTimeout(() => {
      el.remove();
      _modals.splice(_modals.indexOf(el), 1);
      if (!_modals.length) document.body.style.overflow = '';
    }, 200);
  }

  // ─── Main programmatic open ───────────────────────────────
  /**
   * @param {Object} options
   * @param {string}   options.title
   * @param {string}   options.body         - HTML string for modal body
   * @param {string}   [options.confirmLabel] - Confirm button text (default: 'Simpan')
   * @param {string}   [options.cancelLabel]  - Cancel button text (default: 'Batal')
   * @param {Function} [options.onConfirm]  - Called when confirm button clicked
   * @param {Function} [options.onCancel]   - Called when cancelled
   * @param {boolean}  [options.hideConfirm] - Hide confirm button entirely
   * @param {string}   [options.confirmClass] - Extra CSS class for confirm button
   * @param {string}   [options.size]       - 'sm' | 'md' (default) | 'lg'
   */
  function open(options = {}) {
    const {
      title        = '',
      body         = '',
      confirmLabel = 'Simpan',
      cancelLabel  = 'Tutup',
      onConfirm    = null,
      onCancel     = null,
      hideConfirm  = false,
      confirmClass = 'btn-primary',
      size         = 'md',
    } = options;

    const id  = 'modal-' + Date.now();
    const div = document.createElement('div');
    div.id    = id;
    div.className = 'modal-backdrop';

    div.innerHTML = `
      <div class="modal modal-${size}" role="dialog" aria-modal="true">
        <div class="modal-header">
          <h3 class="modal-title">${title}</h3>
          <button class="modal-close btn btn-ghost" aria-label="Tutup">&times;</button>
        </div>
        <div class="modal-body">${body}</div>
        <div class="modal-footer">
          <button class="btn btn-secondary btn-cancel">${cancelLabel}</button>
          ${!hideConfirm ? `<button class="btn ${confirmClass} btn-confirm">${confirmLabel}</button>` : ''}
        </div>
      </div>`;

    document.body.appendChild(div);
    _modals.push(div);
    _show(div);

    // Close handlers
    const _doClose = (cb) => {
      _hide(div);
      if (cb) cb();
    };

    div.querySelector('.modal-close').addEventListener('click', () => _doClose(onCancel));
    div.querySelector('.btn-cancel').addEventListener('click',  () => _doClose(onCancel));
    div.addEventListener('click', e => { if (e.target === div) _doClose(onCancel); });

    if (!hideConfirm) {
      div.querySelector('.btn-confirm').addEventListener('click', () => {
        // Call onConfirm — it is responsible for calling Modal.close() on success,
        // or displaying inline errors and keeping the modal open on failure.
        // If no onConfirm supplied, just close.
        if (onConfirm) {
          onConfirm();
        } else {
          _doClose(null);
        }
      });
    }

    return div;
  }

  // ─── Simple confirm dialog ────────────────────────────────
  /**
   * Modal.confirm(messageOrOpts, onConfirmFn?, opts?)
   * Supports both new API:  Modal.confirm('Are you sure?', () => {})
   * And old API:            Modal.confirm({ title, message, confirmText, type, onConfirm })
   */
  function confirm(messageOrOpts, onConfirmFn, opts = {}) {
    // Legacy API: called with an options object as first argument
    if (messageOrOpts && typeof messageOrOpts === 'object') {
      const o = messageOrOpts;
      const wrappedConfirm = o.onConfirm ? () => { close(); o.onConfirm(); } : null;
      const wrappedCancel  = o.onCancel  ? () => { close(); o.onCancel();  } : null;
      _origOpen({
        title:        o.title        || 'Konfirmasi',
        body:         `<p style="font-size:14px;line-height:1.6;color:var(--text-muted);">${o.message || ''}</p>`,
        confirmLabel: o.confirmText  || 'Ya, Lanjutkan',
        cancelLabel:  o.cancelText   || 'Batal',
        confirmClass: o.type === 'danger' ? 'btn-danger' : 'btn-primary',
        onConfirm:    wrappedConfirm,
        onCancel:     wrappedCancel,
      });
      return;
    }

    // New API: Modal.confirm(message, callback, opts?)
    const {
      title        = 'Konfirmasi',
      confirmLabel = 'Ya, Lanjutkan',
      cancelLabel  = 'Batal',
    } = opts;

    const wrappedNew = onConfirmFn ? () => { close(); onConfirmFn(); } : null;
    _origOpen({
      title,
      body: `<p style="font-size:14px;line-height:1.6;color:var(--text-muted);">${messageOrOpts}</p>`,
      confirmLabel,
      cancelLabel,
      confirmClass: 'btn-danger',
      onConfirm: wrappedNew,
    });
  }

  // ─── Programmatic close (closes topmost modal, or by DOM id) ─
  /**
   * close() closes the topmost modal.
   * close(backdropId) closes a specific modal by DOM id (legacy compat).
   */
  function close(backdropId) {
    if (backdropId) {
      const el = document.getElementById(backdropId);
      if (el) {
        el.classList.remove('active');
        const idx = _modals.indexOf(el);
        if (idx > -1) { _modals.splice(idx, 1); }
        if (!_modals.length) document.body.style.overflow = '';
      }
      return;
    }
    if (_modals.length) _hide(_modals[_modals.length - 1]);
  }

  // ─── Legacy open(backdropId) compat ───────────────────────
  // The new open() takes an options object.
  // The old pages called Modal.open('some-modal-id') to show a pre-built DOM modal.
  // We detect which usage and handle accordingly.
  const _origOpen = open;
  function openCompat(optionsOrId) {
    if (typeof optionsOrId === 'string') {
      // Legacy: show existing DOM element by id
      const el = document.getElementById(optionsOrId);
      if (!el) return;
      _show(el);
      if (!_modals.includes(el)) _modals.push(el);
      el.addEventListener('click', function _oc(e) {
        if (e.target === el) { close(optionsOrId); el.removeEventListener('click', _oc); }
      });
      return;
    }
    return _origOpen(optionsOrId);
  }

  function closeAll() {
    [..._modals].reverse().forEach(_hide);
  }

  // ESC key → close topmost
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && _modals.length) close();
  });

  return { open: openCompat, confirm, close, closeAll };
})();

window.Modal = Modal;
