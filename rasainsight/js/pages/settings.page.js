/**
 * RasaInsight — Settings Page (Presentation Layer)
 * Data import/export, storage management, reset options.
 */

const SettingsPage = (() => {

  function render() {
    const main = document.getElementById('page-content');
    if (!main) return;

    const stats  = Storage.getStats();
    const tables = [
      { key: 'customers',          label: 'Customers',             icon: '👥' },
      { key: 'products',           label: 'Products',              icon: '🍽' },
      { key: 'transactions',       label: 'Transactions',          icon: '🧾' },
      { key: 'transactionDetails', label: 'Transaction Details',   icon: '📦' },
      { key: 'feedbacks',          label: 'Feedbacks',             icon: '💬' },
      { key: 'complaints',         label: 'Complaints',            icon: '📋' },
      { key: 'loyaltyPoints',      label: 'Loyalty Points',        icon: '🏆' },
      { key: 'usersDemo',          label: 'Users Demo',            icon: '👤' },
    ];

    main.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Pengaturan</h1>
          <p class="page-subtitle">Kelola data, impor / ekspor, dan reset aplikasi</p>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">

        <!-- Storage Info -->
        <div class="card">
          <div class="card-header"><h3 class="card-title">📊 Status Data</h3></div>
          <div style="padding:16px;">
            ${tables.map(t => {
              const count = Storage.getTable(t.key).length;
              return `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border);">
                <span style="font-size:13px;">${t.icon} ${t.label}</span>
                <span class="badge badge-info">${Utils.formatNumber(count)} records</span>
              </div>`;
            }).join('')}
            <div style="margin-top:12px;padding:10px;background:var(--surface-2);border-radius:8px;font-size:12px;color:var(--text-muted);">
              <div>Initialized: <strong>${stats._initialized ? 'Ya' : 'Tidak'}</strong></div>
              <div>LocalStorage digunakan untuk semua data.</div>
            </div>
          </div>
        </div>

        <!-- Export & Backup -->
        <div class="card">
          <div class="card-header"><h3 class="card-title">💾 Ekspor & Backup</h3></div>
          <div style="padding:16px;display:flex;flex-direction:column;gap:12px;">
            <div>
              <div style="font-weight:600;font-size:13px;margin-bottom:4px;">Ekspor Semua Data (JSON)</div>
              <div style="font-size:12px;color:var(--text-muted);margin-bottom:8px;">Unduh backup lengkap seluruh data dari LocalStorage dalam format JSON.</div>
              <button class="btn btn-primary" id="btn-export-json">⬇ Unduh Backup JSON</button>
            </div>
            <hr style="border:none;border-top:1px solid var(--border);">
            <div>
              <div style="font-weight:600;font-size:13px;margin-bottom:4px;">Ekspor per Tabel (CSV)</div>
              <div style="font-size:12px;color:var(--text-muted);margin-bottom:8px;">Unduh data satu tabel dalam format CSV.</div>
              <div style="display:flex;flex-wrap:wrap;gap:8px;">
                ${tables.map(t => `<button class="btn btn-sm btn-outline btn-export-csv" data-table="${t.key}" data-label="${t.label}">${t.icon} ${t.label}</button>`).join('')}
              </div>
            </div>
          </div>
        </div>

        <!-- Import CSV -->
        <div class="card">
          <div class="card-header"><h3 class="card-title">📥 Import Data CSV</h3></div>
          <div style="padding:16px;">
            <p style="font-size:13px;color:var(--text-muted);margin-bottom:12px;">
              Import ulang file CSV untuk memperbarui data. Data yang sudah ada akan digabung (merge by primary key).
            </p>
            <button class="btn btn-outline" id="btn-goto-import">Buka Layar Import</button>
          </div>
        </div>

        <!-- Danger Zone -->
        <div class="card" style="border-color:#fca5a5;">
          <div class="card-header" style="background:#fef2f2;"><h3 class="card-title" style="color:#dc2626;">⚠️ Zona Berbahaya</h3></div>
          <div style="padding:16px;display:flex;flex-direction:column;gap:12px;">
            <div>
              <div style="font-weight:600;font-size:13px;margin-bottom:4px;color:#dc2626;">Reset Semua Data</div>
              <div style="font-size:12px;color:var(--text-muted);margin-bottom:8px;">Menghapus seluruh data dari LocalStorage. Aplikasi akan kembali ke layar import. Tindakan ini <strong>tidak dapat dibatalkan</strong>.</div>
              <button class="btn" style="background:#dc2626;color:#fff;" id="btn-reset-all">🗑 Reset Semua Data</button>
            </div>
          </div>
        </div>

      </div>

      <!-- About -->
      <div class="card" style="margin-top:20px;">
        <div class="card-header"><h3 class="card-title">ℹ️ Tentang RasaInsight</h3></div>
        <div style="padding:16px;display:grid;grid-template-columns:1fr 1fr;gap:16px;font-size:13px;">
          <div><strong>Aplikasi:</strong> RasaInsight CRM & BI</div>
          <div><strong>Bisnis:</strong> ADA RASA F&B</div>
          <div><strong>Versi:</strong> 1.0.0</div>
          <div><strong>Platform:</strong> Browser (file://)</div>
          <div><strong>Stack:</strong> HTML5 + CSS3 + Vanilla JS + Chart.js</div>
          <div><strong>Storage:</strong> LocalStorage</div>
          <div style="grid-column:1/-1;color:var(--text-muted);">
            RasaInsight berjalan sepenuhnya di browser tanpa server, database, atau koneksi backend.
            Semua data disimpan di LocalStorage perangkat Anda.
          </div>
        </div>
      </div>
    `;

    _bindEvents();
  }

  function _bindEvents() {
    // Export JSON
    document.getElementById('btn-export-json')?.addEventListener('click', () => {
      try {
        const data = Storage.exportAll();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        _download(blob, `rasainsight_backup_${Utils.toISODate(new Date())}.json`);
        Toast.success('Backup JSON berhasil diunduh');
      } catch (e) {
        Toast.error('Gagal mengekspor data: ' + e.message);
      }
    });

    // Export per table CSV
    document.querySelectorAll('.btn-export-csv').forEach(btn => {
      btn.addEventListener('click', () => {
        const key   = btn.dataset.table;
        const label = btn.dataset.label;
        try {
          const rows = Storage.getTable(key);
          if (!rows.length) { Toast.warning('Tabel kosong, tidak ada data untuk diekspor'); return; }
          const csv  = Utils.toCSV(rows);
          const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
          _download(blob, `${key}_${Utils.toISODate(new Date())}.csv`);
          Toast.success(`${label} berhasil diekspor (${rows.length} baris)`);
        } catch (e) {
          Toast.error('Gagal mengekspor: ' + e.message);
        }
      });
    });

    // Go to import screen
    document.getElementById('btn-goto-import')?.addEventListener('click', () => {
      Modal.confirm(
        'Membuka layar import akan meminta Anda memilih file CSV baru. Data yang sudah ada akan digabung. Lanjutkan?',
        () => {
          Storage.setFlag('force_reimport', true);
          window.location.reload();
        }
      );
    });

    // Reset all
    document.getElementById('btn-reset-all')?.addEventListener('click', () => {
      Modal.open({
        title: '⚠️ Konfirmasi Reset',
        body: `
          <p style="color:#dc2626;font-weight:600;margin-bottom:8px;">Tindakan ini akan menghapus SEMUA data secara permanen.</p>
          <p style="font-size:13px;margin-bottom:12px;">Pastikan Anda sudah melakukan backup sebelum melanjutkan. Data yang dihapus tidak dapat dipulihkan.</p>
          <p style="font-size:13px;">Ketik <strong>RESET</strong> untuk mengkonfirmasi:</p>
          <input type="text" id="reset-confirm-input" class="input" placeholder="Ketik RESET" style="margin-top:8px;">
        `,
        confirmLabel: 'Hapus Semua Data',
        confirmClass: 'btn-danger',
        onConfirm() {
          const val = document.getElementById('reset-confirm-input')?.value?.trim();
          if (val !== 'RESET') {
            Toast.error('Konfirmasi tidak sesuai. Ketik RESET untuk melanjutkan.');
            return;
          }
          Storage.reset();
          Toast.success('Semua data telah dihapus. Memuat ulang...');
          setTimeout(() => window.location.reload(), 1500);
        },
      });
    });
  }

  function _download(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href     = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return { render };
})();

window.SettingsPage = SettingsPage;
