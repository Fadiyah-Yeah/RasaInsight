/**
 * RasaInsight — Import Screen (Presentation Layer)
 * Shown when no data exists in LocalStorage.
 * Uses File API — works with file:// protocol.
 */

const ImportScreen = (() => {

  const FILE_LABELS = {
    'customers.csv':           { label: 'Pelanggan',           icon: '👥', required: true },
    'products.csv':            { label: 'Produk',              icon: '🛍️', required: true },
    'transactions.csv':        { label: 'Transaksi',           icon: '🧾', required: true },
    'transaction_details.csv': { label: 'Detail Transaksi',    icon: '📋', required: true },
    'feedbacks.csv':           { label: 'Feedback',            icon: '💬', required: false },
    'complaints.csv':          { label: 'Keluhan',             icon: '🔔', required: false },
    'loyalty_points.csv':      { label: 'Poin Loyalitas',      icon: '⭐', required: false },
    'users_demo.csv':          { label: 'Pengguna Demo',       icon: '👤', required: false },
  };

  function render() {
    const app = document.getElementById('app');
    if (!app) return;

    app.innerHTML = `
      <div class="import-screen">
        <div class="import-card">
          <div class="import-logo">AR</div>
          <h1 class="import-title">RasaInsight</h1>
          <p class="import-subtitle">CRM & Business Intelligence untuk ADA RASA F&B</p>
          <p style="font-size:13px;color:var(--color-text-muted);margin-bottom:24px;line-height:1.6">
            Selamat datang! Untuk memulai, pilih semua file CSV dataset yang telah dibersihkan.
            Data akan disimpan di browser dan tidak perlu diimpor ulang setiap sesi.
          </p>

          <div class="file-drop-zone" id="drop-zone">
            <div style="margin-bottom:12px;font-size:32px">📂</div>
            <p style="font-weight:600;margin-bottom:4px">Pilih atau Drop File CSV</p>
            <p style="font-size:12px;color:var(--color-text-muted);margin-bottom:16px">
              Pilih semua 8 file CSV sekaligus dari folder dataset
            </p>
            <input type="file" id="csv-input" accept=".csv" multiple
              style="display:none">
            <label for="csv-input" class="btn btn-primary" style="cursor:pointer">
              Pilih File CSV
            </label>
          </div>

          <div id="import-file-list" class="import-progress-list" style="display:none"></div>

          <div id="import-status" style="display:none;margin-top:16px;padding:12px;border-radius:8px;font-size:13px"></div>

          <div id="import-actions" style="display:none;margin-top:16px">
            <button class="btn btn-primary w-full" id="btn-import-start">
              Impor Dataset
            </button>
          </div>

          <div style="margin-top:24px;padding:16px;background:var(--color-surface-alt);border-radius:8px;text-align:left">
            <p style="font-size:12px;font-weight:600;color:var(--color-text-secondary);margin-bottom:8px">
              📁 File yang diperlukan:
            </p>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px">
              ${Object.entries(FILE_LABELS).map(([fn, info]) => `
                <div style="font-size:11px;color:var(--color-text-muted);display:flex;align-items:center;gap:4px">
                  <span>${info.icon}</span>
                  <span>${fn.replace('.csv', '')}</span>
                  ${info.required ? '<span style="color:var(--color-danger)">*</span>' : ''}
                </div>
              `).join('')}
            </div>
            <p style="font-size:11px;color:var(--color-text-muted);margin-top:8px">
              * File wajib
            </p>
          </div>

          <div style="margin-top:16px">
            <p style="font-size:12px;color:var(--color-text-muted);margin-bottom:8px">
              Sudah punya file backup JSON?
            </p>
            <label class="btn btn-secondary btn-sm" style="cursor:pointer;width:100%;justify-content:center" for="json-backup-input">
              Pulihkan dari Backup JSON
            </label>
            <input type="file" id="json-backup-input" accept=".json" style="display:none">
          </div>
        </div>
      </div>
    `;

    bindEvents();
  }

  function bindEvents() {
    const csvInput = document.getElementById('csv-input');
    const dropZone = document.getElementById('drop-zone');
    const importBtn = document.getElementById('btn-import-start');
    const jsonInput = document.getElementById('json-backup-input');

    let selectedFiles = null;

    // File input change
    csvInput.addEventListener('change', (e) => {
      selectedFiles = e.target.files;
      showFileList(selectedFiles);
    });

    // Drag & Drop
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      selectedFiles = e.dataTransfer.files;
      showFileList(selectedFiles);
    });

    // Import button
    importBtn.addEventListener('click', async () => {
      if (!selectedFiles || !selectedFiles.length) return;
      importBtn.disabled = true;
      importBtn.innerHTML = '<span class="spinner"></span> Mengimpor...';

      try {
        const result = await DataImporter.importFromFiles(selectedFiles, (done, total, lastResult) => {
          updateFileStatus(lastResult.file, lastResult.status, lastResult.count);
        });

        if (result.success) {
          showStatus('success', `✅ Import berhasil! ${Object.values(result.summary || {}).reduce((a,b)=>a+b,0)} record dimuat.`);
          setTimeout(() => window.location.reload(), 1500);
        } else {
          const errMsg = result.errors.join('<br>');
          showStatus('error', `❌ Import gagal:<br>${errMsg}`);
          importBtn.disabled = false;
          importBtn.innerHTML = 'Impor Dataset';
        }
      } catch (e) {
        showStatus('error', `❌ Error: ${e.message}`);
        importBtn.disabled = false;
        importBtn.innerHTML = 'Impor Dataset';
      }
    });

    // JSON backup restore
    jsonInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const ok = DataImporter.importFromJSON(ev.target.result);
        if (ok) {
          showStatus('success', '✅ Backup berhasil dipulihkan!');
          setTimeout(() => window.location.reload(), 1500);
        } else {
          showStatus('error', '❌ File backup tidak valid atau rusak.');
        }
      };
      reader.readAsText(file);
    });
  }

  function showFileList(files) {
    const listEl = document.getElementById('import-file-list');
    const actionsEl = document.getElementById('import-actions');

    const arr = Array.from(files);
    const recognized = arr.filter(f => DataImporter.EXPECTED_FILENAMES.has(f.name.toLowerCase()));
    const unrecognized = arr.filter(f => !DataImporter.EXPECTED_FILENAMES.has(f.name.toLowerCase()));

    listEl.innerHTML = `
      <p style="font-size:12px;font-weight:600;color:var(--color-text-secondary);margin-bottom:8px">
        ${arr.length} file dipilih (${recognized.length} dikenali):
      </p>
      ${arr.map(f => {
        const isKnown = DataImporter.EXPECTED_FILENAMES.has(f.name.toLowerCase());
        return `
          <div class="import-progress-item" id="import-item-${f.name.replace('.', '-')}">
            <span class="import-status-icon" style="font-size:16px">${isKnown ? '📄' : '⚠️'}</span>
            <span style="flex:1;font-size:13px">${f.name}</span>
            <span style="font-size:11px;color:var(--color-text-muted)">${(f.size / 1024).toFixed(1)} KB</span>
            <span class="badge ${isKnown ? 'badge-success' : 'badge-warning'} no-dot" style="font-size:10px">
              ${isKnown ? 'Siap' : 'Skip'}
            </span>
          </div>
        `;
      }).join('')}
    `;

    listEl.style.display = 'block';
    actionsEl.style.display = 'block';
  }

  function updateFileStatus(filename, status, count) {
    const id = 'import-item-' + filename.replace('.', '-');
    const item = document.getElementById(id);
    if (!item) return;
    const badge = item.querySelector('.badge');
    if (!badge) return;

    if (status === 'ok') {
      badge.className = 'badge badge-success no-dot';
      badge.textContent = `✓ ${count}`;
    } else if (status === 'error') {
      badge.className = 'badge badge-danger no-dot';
      badge.textContent = 'Error';
    }
  }

  function showStatus(type, message) {
    const el = document.getElementById('import-status');
    const colors = {
      success: { bg: 'var(--color-success-bg)', color: 'var(--color-success)' },
      error:   { bg: 'var(--color-danger-bg)',  color: 'var(--color-danger)' },
    };
    const c = colors[type] || colors.success;
    el.style.background = c.bg;
    el.style.color = c.color;
    el.innerHTML = message;
    el.style.display = 'block';
  }

  return { render };
})();

window.ImportScreen = ImportScreen;
