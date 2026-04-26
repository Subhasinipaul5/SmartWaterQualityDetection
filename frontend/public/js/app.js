// ════════════════════════════════════════════════════════════
//  AquaMonitor – Main App JS
// ════════════════════════════════════════════════════════════

// ── Toast ──────────────────────────────────────────────────
function toast(msg, type = 'default', duration = 3500) {
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span style="flex:1">${msg}</span><button onclick="this.parentElement.remove()" style="background:none;border:none;color:inherit;cursor:pointer;font-size:16px;line-height:1;padding:0;margin-left:4px">×</button>`;
  container.appendChild(el);
  setTimeout(() => {
    el.style.animation = 'slideOut .25s ease forwards';
    setTimeout(() => el.remove(), 250);
  }, duration);
}

// ── Loading overlay ────────────────────────────────────────
function showLoading(show) {
  document.getElementById('loading-overlay').classList.toggle('show', show);
}

// ── Modal ──────────────────────────────────────────────────
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
// Close on backdrop click
document.querySelectorAll('.modal-overlay').forEach(o => {
  o.addEventListener('click', e => { if (e.target === o) o.classList.remove('open'); });
});

// ── Page navigation ────────────────────────────────────────
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.page === id));
  document.querySelectorAll('.side-item').forEach(s => s.classList.toggle('active', s.dataset.page === id));

  const page = document.getElementById('page-' + id);
  if (page) page.classList.add('active');

  // Lazy-load page data
  if (id === 'dashboard') loadDashboard();
  if (id === 'stations')  loadStations();
  if (id === 'analytics') loadAnalytics();
  if (id === 'alerts')    loadAlerts();
  if (id === 'reports')   loadReports();
  if (id === 'payment')   loadPayment();
  if (id === 'account')   loadAccount();
  if (id === 'contact')   loadContact();
  if (id === 'about')     {} // static page, no load needed
}

// ── Mobile sidebar (hamburger) ──────────────────────────────
function openSidebar() {
  document.getElementById('mobile-sidebar')?.classList.add('open');
  document.getElementById('sidebar-backdrop')?.classList.add('open');
  document.getElementById('hamburger-btn')?.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
}
function closeSidebar() {
  document.getElementById('mobile-sidebar')?.classList.remove('open');
  document.getElementById('sidebar-backdrop')?.classList.remove('open');
  document.getElementById('hamburger-btn')?.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}
function toggleSidebar() {
  const open = document.getElementById('mobile-sidebar')?.classList.contains('open');
  open ? closeSidebar() : openSidebar();
}
// expose for inline onclick handlers
window.toggleSidebar = toggleSidebar;
window.closeSidebar  = closeSidebar;

// Close the slide-in sidebar if the screen grows past the breakpoint
window.addEventListener('resize', () => {
  if (window.innerWidth > 1024) closeSidebar();
});
// Close on Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeSidebar();
});

// ── Wire all nav buttons ────────────────────────────────────
document.querySelectorAll('[data-page]').forEach(el => {
  el.addEventListener('click', () => {
    const id = el.dataset.page;
    if ((id === 'dashboard' || id === 'stations' || id === 'analytics' || id === 'alerts' || id === 'reports') && !getToken()) {
      toast('Please log in to access this page', 'warning');
      showPage('account');
      closeSidebar();
      return;
    }
    showPage(id);
    closeSidebar(); // auto-close mobile menu after navigating
  });
});

// ── Auth logout listener ────────────────────────────────────
window.addEventListener('auth:logout', () => {
  updateNav();
  showPage('account');
  toast('Session expired. Please log in again.', 'warning');
});

// ── Update topbar avatar ────────────────────────────────────
function updateNav() {
  const user = getUser();
  const avatarEl = document.getElementById('top-avatar');
  if (avatarEl && user) {
    avatarEl.textContent = user.name.slice(0, 2).toUpperCase();
  }
}

// ════════════════════════════════════════════════════════════
//  AUTH PAGE
// ════════════════════════════════════════════════════════════
let authMode = 'login'; // 'login' | 'register'

// ── Login mode toggle (admin / user) ───────────────────────
let currentLoginMode = 'admin'; // default shows admin tab

function setLoginMode(mode) {
  currentLoginMode = mode;
  const adminBtn  = document.getElementById('toggle-admin-btn');
  const userBtn   = document.getElementById('toggle-user-btn');
  const adminNote = document.getElementById('admin-mode-notice');
  const userNote  = document.getElementById('user-mode-notice');
  const banner    = document.getElementById('admin-block-banner');

  // Always hide the block banner when switching modes
  if (banner) banner.style.display = 'none';
  clearFormErrors();

  if (mode === 'admin') {
    // Admin tab active
    if (adminBtn) { adminBtn.style.background = 'var(--primary)'; adminBtn.style.color = '#fff'; }
    if (userBtn)  { userBtn.style.background  = 'transparent';    userBtn.style.color  = 'var(--text2)'; }
    if (adminNote) adminNote.style.display = 'flex';
    if (userNote)  userNote.style.display  = 'none';
    document.getElementById('login-btn').textContent = 'Sign In as Admin';
  } else {
    // User tab active
    if (userBtn)  { userBtn.style.background  = 'var(--success)'; userBtn.style.color  = '#fff'; }
    if (adminBtn) { adminBtn.style.background = 'transparent';    adminBtn.style.color = 'var(--text2)'; }
    if (userNote)  userNote.style.display  = 'flex';
    if (adminNote) adminNote.style.display = 'none';
    document.getElementById('login-btn').textContent = 'Sign In as User';
  }
}

function setAuthMode(mode) {
  authMode = mode;
  document.getElementById('auth-login-form').style.display    = mode === 'login'    ? 'block' : 'none';
  document.getElementById('auth-register-form').style.display = mode === 'register' ? 'block' : 'none';
  document.getElementById('auth-title').textContent = mode === 'login' ? 'Sign in to AquaMonitor' : 'Create your account';
  document.getElementById('auth-sub').textContent   = mode === 'login' ? 'Water Quality Monitoring System' : 'Join AquaMonitor and start monitoring';
  clearFormErrors();
  // When showing login, default to user tab so anyone can log in easily
  if (mode === 'login') setLoginMode('user');
}

function clearFormErrors() {
  document.querySelectorAll('.form-error').forEach(e => e.textContent = '');
  document.querySelectorAll('.form-input').forEach(e => e.classList.remove('error'));
}

function showFieldError(fieldId, msg) {
  const field = document.getElementById(fieldId);
  if (field) {
    field.classList.add('error');
    const err = field.parentElement.querySelector('.form-error');
    if (err) err.textContent = msg;
  }
}

// Login
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  clearFormErrors();
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  if (!email)    { showFieldError('login-email',    'Email is required');    return; }
  if (!password) { showFieldError('login-password', 'Password is required'); return; }

  const btn = document.getElementById('login-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Signing in...';

  // Only send panel:'admin' when admin tab is selected
  // User tab sends no panel flag → server allows any valid account
  const loginBody = { email, password };
  if (currentLoginMode === 'admin') loginBody.panel = 'admin';

  const { ok, data } = await AuthAPI.login(loginBody);
  btn.disabled = false;
  btn.textContent = currentLoginMode === 'admin' ? 'Sign In as Admin' : 'Sign In as User';

  if (ok && data.success) {
    setToken(data.token);
    setUser(data.user);
    updateNav();
    toast(`Welcome back, ${data.user.name}! (${data.user.role.toUpperCase()})`, 'success');
    showPage('dashboard');
  } else {
    if (data.isAdminPanel) {
      // Non-admin tried the admin tab → show block banner + hint to switch
      const banner = document.getElementById('admin-block-banner');
      if (banner) {
        banner.style.display = 'flex';
        setTimeout(() => { banner.style.display = 'none'; }, 8000);
      }
      // Auto-switch to user tab after 2s so they can try again easily
      setTimeout(() => setLoginMode('user'), 2000);
      toast('Not an admin. Switching to User Login for you...', 'warning', 3000);
    } else {
      toast(data.message || 'Login failed', 'error');
      if (data.message?.toLowerCase().includes('password')) showFieldError('login-password', data.message);
      else if (data.message?.toLowerCase().includes('email')) showFieldError('login-email', data.message);
    }
  }
});

// Register
document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  clearFormErrors();
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const confirm = document.getElementById('reg-confirm').value;
  const phone = document.getElementById('reg-phone').value.trim();
  const organization = document.getElementById('reg-org').value.trim();

  let valid = true;
  if (!name || name.length < 2) { showFieldError('reg-name', 'Name must be at least 2 characters'); valid = false; }
  if (!email || !/\S+@\S+\.\S+/.test(email)) { showFieldError('reg-email', 'Enter a valid email address'); valid = false; }
  if (!password || password.length < 6) { showFieldError('reg-password', 'Password must be at least 6 characters'); valid = false; }
  if (password !== confirm) { showFieldError('reg-confirm', 'Passwords do not match'); valid = false; }
  if (!valid) return;

  const btn = document.getElementById('register-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Creating account...';

  const { ok, data } = await AuthAPI.register({ name, email, password, phone, organization });
  btn.disabled = false;
  btn.textContent = 'Create Account';

  if (ok && data.success) {
    setToken(data.token);
    setUser(data.user);
    updateNav();
    toast(`Account created! Welcome, ${data.user.name}!`, 'success');
    showPage('dashboard');
  } else {
    const msg = data.message || 'Registration failed';
    toast(msg, 'error');
    if (data.errors) data.errors.forEach(err => {
      if (err.path === 'email') showFieldError('reg-email', err.msg);
      if (err.path === 'password') showFieldError('reg-password', err.msg);
      if (err.path === 'name') showFieldError('reg-name', err.msg);
    });
  }
});

// ════════════════════════════════════════════════════════════
//  DASHBOARD
// ════════════════════════════════════════════════════════════
let dashboardChartTrend = null;

async function loadDashboard() {
  if (!getToken()) return;

  // Load latest station readings
  const { ok, data } = await WaterAPI.getLatest();
  if (ok && data.success && data.data.length > 0) {
    const stations = data.data;
    const avg = (key) => {
      const vals = stations.map(s => s.readings[key]).filter(v => v !== undefined);
      return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : '--';
    };
    document.getElementById('dash-ph').textContent    = avg('ph');
    document.getElementById('dash-turb').textContent  = avg('turbidity');
    document.getElementById('dash-temp').textContent  = avg('temperature');
    document.getElementById('dash-do').textContent    = avg('dissolvedOxygen');
    document.getElementById('dash-tds').textContent   = avg('tds');

    renderDashboardRings(stations);
    renderDashboardMap(stations);
  } else {
    // Show demo data if no real data
    renderDemoStats();
  }

  // Load alerts
  const { ok: aOk, data: aData } = await WaterAPI.getAlerts({ limit: 4 });
  if (aOk && aData.success) renderDashAlerts(aData.data);

  // Draw trend chart
  renderTrendChart();
}

function renderDemoStats() {
  const demo = { ph: 7.2, turbidity: 68, temperature: 28.3, dissolvedOxygen: 7.8, tds: 520 };
  document.getElementById('dash-ph').textContent    = demo.ph;
  document.getElementById('dash-turb').textContent  = demo.turbidity;
  document.getElementById('dash-temp').textContent  = demo.temperature;
  document.getElementById('dash-do').textContent    = demo.dissolvedOxygen;
  document.getElementById('dash-tds').textContent   = demo.tds;
}

function renderDashboardRings(stations) {
  const container = document.getElementById('wqi-rings');
  container.innerHTML = '';
  stations.forEach((s, i) => {
    const wqi = s.wqi || 72;
    const circumference = 2 * Math.PI * 30;
    const dash = (wqi / 100) * circumference;
    const color = wqi >= 70 ? '#24A148' : wqi >= 50 ? '#D4A017' : '#DA1E28';
    const tagClass = wqi >= 70 ? 'safe' : wqi >= 50 ? 'warn' : 'danger';
    const tagText = wqi >= 70 ? 'Safe' : wqi >= 50 ? 'Caution' : 'Unsafe';
    container.innerHTML += `
      <div class="gauge-group" style="flex:0 0 auto;min-width:110px;scroll-snap-align:start">
        <div class="ring-wrap">
          <svg viewBox="0 0 80 80"><circle cx="40" cy="40" r="30" fill="none" stroke="#DDE3EE" stroke-width="8"/>
          <circle cx="40" cy="40" r="30" fill="none" stroke="${color}" stroke-width="8" stroke-dasharray="${dash.toFixed(1)} ${circumference.toFixed(1)}" stroke-linecap="round"/></svg>
          <div class="ring-val" style="color:${color}">${wqi}</div>
        </div>
        <div class="gauge-lbl">${s.stationName || 'Station ' + (i + 1)}</div>
        <span class="tag tag-${tagClass}" style="margin-top:4px">${tagText}</span>
      </div>`;
  });
  if (container.innerHTML === '') container.innerHTML = '<div style="font-size:12px;color:var(--text3)">No station data yet. Add readings to see quality index.</div>';

  // Update count badges on dashboard
  const count = stations.length;
  const setText = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  setText('wqi-station-count', count);
  setText('dash-active-count', count);
  setText('map-station-count', count);
}

function renderDashboardMap(stations) {
  // Base seed positions; for any extra stations we generate deterministic positions
  const basePositions = [
    { top: '45%', left: '30%' }, { top: '30%', left: '60%' }, { top: '65%', left: '72%' },
    { top: '20%', left: '20%' }, { top: '55%', left: '50%' }, { top: '75%', left: '35%' },
    { top: '40%', left: '85%' }, { top: '15%', left: '75%' }, { top: '80%', left: '15%' },
    { top: '60%', left: '15%' }
  ];
  const mapArea = document.getElementById('map-pins');
  mapArea.innerHTML = '';
  stations.forEach((s, i) => {
    const pos = basePositions[i] || {
      top: (15 + ((i * 37) % 70)) + '%',
      left: (12 + ((i * 53) % 76)) + '%'
    };
    const color = s.status === 'safe' ? '#24A148' : s.status === 'caution' ? '#D4A017' : '#DA1E28';
    mapArea.innerHTML += `<div class="map-pin" style="background:${color};top:${pos.top};left:${pos.left}"><div class="pin-tooltip">${s.stationName || 'Station ' + (i + 1)}</div></div>`;
  });

  // Update map count badge (in case rings render path didn't run)
  const mc = document.getElementById('map-station-count');
  if (mc) mc.textContent = stations.length;
}

function renderDashAlerts(alerts) {
  const list = document.getElementById('dash-alert-list');
  if (!alerts.length) {
    list.innerHTML = '<p style="font-size:12px;color:var(--text3);text-align:center;padding:16px">No recent alerts</p>';
    return;
  }

  // Filter out alerts for deleted/removed stations by cross-referencing active stations
  const activeStationNames = allRiversCache.map(r => r.stationName);

  // Show all alerts but grey out ones from deleted stations
  list.innerHTML = alerts.slice(0, 5).map(a => {
    const isDeleted = activeStationNames.length > 0 && !activeStationNames.includes(a.stationName);
    const cls  = a.severity === 'critical' ? 'danger' : a.severity === 'warning' ? 'warning' : 'info';
    const time = timeAgo(new Date(a.createdAt));
    if (isDeleted) {
      // Greyed out — station was deleted
      return `<div class="alert-item" style="opacity:.4;filter:grayscale(1)">
        <div>
          <div class="alert-msg" style="text-decoration:line-through">${a.message}</div>
          <div class="alert-time">${time} · Station removed</div>
        </div>
      </div>`;
    }
    return `<div class="alert-item ${cls}">
      <div>
        <div class="alert-msg">${a.message}</div>
        <div class="alert-time">${time}</div>
      </div>
    </div>`;
  }).join('');
}

function renderTrendChart() {
  const ctx = document.getElementById('chart-trend');
  if (!ctx) return;
  if (dashboardChartTrend) { dashboardChartTrend.destroy(); dashboardChartTrend = null; }
  const hrs = ['00','02','04','06','08','10','12','14','16','18','20','22'];
  const phData    = [7.1,7.0,6.9,7.2,7.4,7.8,7.9,7.7,7.5,7.3,7.2,7.1];
  const turbData  = [45,42,50,55,68,71,77,72,65,60,58,55];
  dashboardChartTrend = new Chart(ctx, {
    type: 'line',
    data: { labels: hrs, datasets: [
      { label: 'pH', data: phData, borderColor: '#0F62FE', backgroundColor: 'rgba(15,98,254,.06)', tension: .4, pointRadius: 2, yAxisID: 'y' },
      { label: 'Turbidity (NTU)', data: turbData, borderColor: '#D4A017', backgroundColor: 'rgba(212,160,23,.06)', tension: .4, pointRadius: 2, borderDash: [4, 4], yAxisID: 'y1' },
    ]},
    options: { responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y:  { min: 5, max: 10, grid: { color: 'rgba(0,0,0,.04)' }, ticks: { font: { size: 10 } } },
        y1: { position: 'right', min: 0, max: 150, grid: { display: false }, ticks: { font: { size: 10 } } },
      }
    }
  });
}

// ════════════════════════════════════════════════════════════
//  STATIONS PAGE
// ════════════════════════════════════════════════════════════
let selectedStation = null;

async function loadStations() {
  if (!getToken()) return;

  // Show/hide Add Reading button based on role
  const user = getUser();
const addBtn = document.getElementById('stations-add-btn');

if (addBtn) {
  addBtn.style.display = (user?.role === 'admin') ? 'inline-flex' : 'none';
}


  const { ok, data } = await WaterAPI.getLatest();
  const grid = document.getElementById('station-cards');
  if (!grid) return;

  if (ok && data.success && data.data.length > 0) {
    grid.innerHTML = data.data.map((s, i) => stationCardHTML(s, i, user)).join('');
  } else {
    const hint = (user && user.role === 'admin')
      ? `<button class="btn btn-primary btn-sm" onclick="openModal('modal-add-reading')">Add first reading</button>`
      : `<span style="color:var(--text3)">No station data available yet.</span>`;
    grid.innerHTML = `<div style="flex:1 0 100%;text-align:center;padding:40px;font-size:13px">${hint}</div>`;
  }

  // Load reading history table (admin sees all, user sees own)
  loadReadingsHistory();

  if (ok && data.success && data.data.length) loadStationDetail(data.data[0]);
}
function openModal(id) {
  const user = getUser();

  if (id === 'modal-add-reading' && user?.role !== 'admin') {
    toast('Only admin can add readings', 'error');
    return;
  }

  document.getElementById(id)?.classList.add('open');
}

function stationCardHTML(s, i, user) {
  const r = s.readings;
  const tagCls = s.status === 'safe' ? 'tag-safe' : s.status === 'caution' ? 'tag-warn' : 'tag-danger';
  const tagTxt = s.status === 'safe' ? 'Safe' : s.status === 'caution' ? 'Caution' : 'Unsafe';
  const colorTurb = r.turbidity > 70 ? 'var(--warning)' : 'inherit';
  const colorTDS  = r.tds > 500 ? 'var(--danger)' : 'inherit';
  const isAdmin   = user && user.role === 'admin';

  // Admin-only action buttons
  const adminBtns = isAdmin ? `
    <div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border);display:flex;gap:6px">
      <button
        class="btn btn-sm"
        style="flex:1;background:var(--primary-light);color:var(--primary);border:1px solid rgba(15,98,254,.2);font-size:11px"
        onclick="event.stopPropagation();openEditModal('${s._id}','${s.stationName}',${JSON.stringify(s.readings).replace(/"/g,'&quot;')},${JSON.stringify(s.location||{}).replace(/"/g,'&quot;')})"
        title="Edit this reading">
        ✏️ Edit
      </button>
      <button
        class="btn btn-sm"
        style="flex:1;background:var(--danger-light);color:var(--danger);border:1px solid rgba(218,30,40,.2);font-size:11px"
        onclick="event.stopPropagation();confirmDeleteReading('${s._id}','${s.stationName}',this,'card')"
        title="Delete this reading">
        🗑 Delete
      </button>
    </div>` : '';

  return `
  <div class="station-card${i === 0 ? ' selected' : ''}" onclick="selectStationCard(this, '${s._id}')">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:3px">
      <div class="station-name">${s.stationName}</div>
      <span style="font-size:10px;color:var(--text3)">WQI: ${s.wqi}</span>
    </div>
    <div class="station-loc">${s.location?.name || 'Location not set'}</div>
    <div class="metric-grid">
      <div class="metric-mini"><div class="metric-mini-val">${r.ph}</div><div class="metric-mini-lbl">pH</div></div>
      <div class="metric-mini"><div class="metric-mini-val" style="color:${colorTurb}">${r.turbidity}</div><div class="metric-mini-lbl">Turbidity</div></div>
      <div class="metric-mini"><div class="metric-mini-val">${r.temperature}°C</div><div class="metric-mini-lbl">Temp</div></div>
      <div class="metric-mini"><div class="metric-mini-val" style="color:${colorTDS}">${r.tds}</div><div class="metric-mini-lbl">TDS ppm</div></div>
    </div>
    <div style="margin-top:10px;display:flex;justify-content:space-between;align-items:center">
      <span class="tag ${tagCls}">${tagTxt}</span>
      <span style="font-size:10px;color:var(--text3)">${new Date(s.recordedAt || Date.now()).toLocaleTimeString()}</span>
    </div>
    ${adminBtns}
  </div>`;
}

function selectStationCard(el, id) {
  document.querySelectorAll('.station-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
}

function loadStationDetail(station) {
  const table = document.getElementById('station-detail-table');
  if (!table) return;
  const r = station.readings;
  const rows = [
    ['ph', r.ph, '—', '6.5 – 8.5', r.ph >= 6.5 && r.ph <= 8.5],
    ['Turbidity', r.turbidity, 'NTU', '0 – 100', r.turbidity <= 100],
    ['Temperature', r.temperature, '°C', '10 – 35', r.temperature >= 10 && r.temperature <= 35],
    ['Dissolved O₂', r.dissolvedOxygen, 'mg/L', '6.0 – 12.0', r.dissolvedOxygen >= 6],
    ['TDS', r.tds, 'ppm', '0 – 500', r.tds <= 500],
    ['Conductivity', r.conductivity || '--', 'µS/cm', '100 – 800', true],
  ];
  table.innerHTML = rows.map(([name, val, unit, range, safe]) => `
    <tr><td>${name}</td><td><strong>${val}</strong></td><td>${unit}</td><td>${range}</td>
    <td><span class="tag ${safe ? 'tag-safe' : 'tag-danger'}">${safe ? 'Safe' : 'Alert'}</span></td>
    <td style="color:var(--text3);font-size:11px">just now</td></tr>`).join('');
  document.getElementById('station-detail-name').textContent = `Real-time Feed – ${station.stationName}`;
}

// ── Reading history table with delete (admin only) ──────────
async function loadReadingsHistory() {
  const user = getUser();
  const section = document.getElementById('readings-history-section');
  if (!section) return;
  section.style.display = 'block';

  const { ok, data } = await WaterAPI.getAll({ limit: 50 });
  const tbody = document.getElementById('readings-history-body');
  const isAdmin = user && user.role === 'admin';

  // Show/hide the admin header column
  document.querySelectorAll('.th-delete').forEach(th => {
    th.style.display = isAdmin ? '' : 'none';
  });

  if (!ok || !data.success || !data.data.length) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:24px;color:var(--text3)">No readings yet</td></tr>`;
    return;
  }

  tbody.innerHTML = data.data.map(r => {
    const rd = r.readings;
    const tagCls = r.status === 'safe' ? 'tag-safe' : r.status === 'caution' ? 'tag-warn' : 'tag-danger';
    const time = new Date(r.recordedAt).toLocaleString();
    const deleteCell = isAdmin
      ? `<td><button class="btn btn-danger btn-sm" onclick="confirmDeleteReading('${r._id}','${r.stationName}',this,'table')">🗑 Delete</button></td>`
      : `<td style="display:none"></td>`;
    return `<tr id="row-${r._id}">
      <td style="font-size:11px;color:var(--text3)">${time}</td>
      <td><strong>${r.stationName}</strong></td>
      <td>${rd.ph}</td><td>${rd.turbidity}</td>
      <td>${rd.temperature}°C</td><td>${rd.tds}</td>
      <td><span class="tag ${tagCls}">${r.status}</span></td>
      ${deleteCell}
    </tr>`;
  }).join('');
}

// ── Delete with undo toast ───────────────────────────────────
// source: 'card' = clicked from station card
//         'table' = clicked from reading history table
function confirmDeleteReading(id, stationName, triggerBtn, source) {
  // Visually grey out the trigger element immediately
  const cardEl  = source === 'card'  ? triggerBtn.closest('.station-card') : null;
  const rowEl   = source === 'table' ? document.getElementById('row-' + id) : null;
  const targetEl = cardEl || rowEl;

  if (targetEl) {
    targetEl.style.opacity = '0.35';
    targetEl.style.pointerEvents = 'none';
  }
  if (triggerBtn) {
    triggerBtn.disabled = true;
    triggerBtn.textContent = 'Deleting...';
  }

  let undone    = false;
  let undoTimer = null;

  // ── Build undo toast ────────────────────────────────────────
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = 'toast';
  el.style.cssText = [
    'background:#1a2035',
    'min-width:320px',
    'max-width:380px',
    'display:flex',
    'align-items:center',
    'gap:12px',
    'padding:12px 14px',
    'border-left:3px solid var(--danger)',
  ].join(';');

  el.innerHTML = `
    <div style="flex:1">
      <div style="font-size:13px;font-weight:500;margin-bottom:2px">
        🗑 Reading deleted — <span style="color:rgba(255,255,255,.6)">${stationName}</span>
      </div>
      <div style="font-size:11px;color:rgba(255,255,255,.45)">Permanently removes in <span id="undo-countdown-${id}">5</span>s</div>
    </div>
    <button id="undo-btn-${id}"
      style="background:var(--warning);color:#000;border:none;padding:6px 14px;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap;flex-shrink:0">
      ↩ Undo
    </button>`;

  container.appendChild(el);

  // Countdown
  let secs = 5;
  const countEl = document.getElementById(`undo-countdown-${id}`);
  const interval = setInterval(() => {
    secs--;
    if (countEl && secs > 0) countEl.textContent = secs;
  }, 1000);

  // Progress bar inside toast (shrinks over 5s)
  const bar = document.createElement('div');
  bar.style.cssText = 'position:absolute;bottom:0;left:0;height:3px;background:var(--danger);border-radius:0 0 0 8px;width:100%;transition:width 5s linear';
  el.style.position = 'relative';
  el.style.overflow = 'hidden';
  el.appendChild(bar);
  // Trigger the shrink on next frame
  requestAnimationFrame(() => { requestAnimationFrame(() => { bar.style.width = '0%'; }); });

  // ── Undo handler ────────────────────────────────────────────
  const undoBtn = document.getElementById(`undo-btn-${id}`);
  if (undoBtn) {
    undoBtn.addEventListener('click', async () => {
      undone = true;
      clearTimeout(undoTimer);
      clearInterval(interval);
      el.style.animation = 'slideOut .2s ease forwards';
      setTimeout(() => el.remove(), 200);

      // Restore element visibility
      if (targetEl) { targetEl.style.opacity = '1'; targetEl.style.pointerEvents = ''; }
      if (triggerBtn) { triggerBtn.disabled = false; triggerBtn.textContent = '🗑 Delete this reading'; }

      const { ok, data } = await WaterAPI.restoreReading(id);
      if (ok && data.success) {
        toast(`Reading from ${stationName} restored`, 'success');
      } else {
        toast('Could not restore — please refresh', 'error');
        loadStations();
      }
    });
  }

  // ── After 5s — actually delete ──────────────────────────────
  undoTimer = setTimeout(async () => {
    clearInterval(interval);
    if (undone) return;

    el.style.animation = 'slideOut .25s ease forwards';
    setTimeout(() => el.remove(), 250);

    const { ok, data } = await WaterAPI.deleteReading(id);
    if (ok && data.success) {
      // Remove the element from DOM
      if (source === 'card') {
        // Reload stations so the card disappears cleanly
        allRiversCache = []; // refresh river dropdown so deleted river disappears
        loadStations();
      } else if (rowEl) {
        rowEl.style.transition = 'all .3s';
        rowEl.style.height = '0';
        rowEl.style.padding = '0';
        rowEl.style.opacity = '0';
        setTimeout(() => rowEl.remove(), 300);
      }
    } else {
      toast('Delete failed — ' + (data.message || 'server error'), 'error');
      if (targetEl) { targetEl.style.opacity = '1'; targetEl.style.pointerEvents = ''; }
      if (triggerBtn) { triggerBtn.disabled = false; triggerBtn.textContent = '🗑 Delete this reading'; }
    }
  }, 5000);
}

// Add Reading form (admin only)
document.getElementById('add-reading-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const user = getUser();
  if (!user || user.role !== 'admin') {
    toast('Only administrators can add readings', 'error');
    closeModal('modal-add-reading');
    return;
  }
  const body = {
    stationId: document.getElementById('r-stationId').value.trim(),
    stationName: document.getElementById('r-stationName').value.trim(),
    location: {
      name: document.getElementById('r-locName').value.trim(),
      lat: parseFloat(document.getElementById('r-lat').value) || 0,
      lng: parseFloat(document.getElementById('r-lng').value) || 0,
    },
    readings: {
      ph:               parseFloat(document.getElementById('r-ph').value),
      turbidity:        parseFloat(document.getElementById('r-turbidity').value),
      temperature:      parseFloat(document.getElementById('r-temperature').value),
      dissolvedOxygen:  parseFloat(document.getElementById('r-do').value),
      tds:              parseFloat(document.getElementById('r-tds').value),
      conductivity:     parseFloat(document.getElementById('r-conductivity').value) || 0,
    },
    source: 'manual',
  };

  const btn = document.getElementById('add-reading-btn');
  btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Saving...';

  const { ok, data } = await WaterAPI.addReading(body);
  btn.disabled = false; btn.textContent = 'Save Reading';

  if (ok && data.success) {
    closeModal('modal-add-reading');
    document.getElementById('add-reading-form').reset();

    // Show a rich success toast with an immediate "Delete this reading" option
    const savedId   = data.data._id;
    const savedName = data.data.stationName;
    const container = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = 'toast success';
    el.style.cssText = 'min-width:320px;display:flex;flex-direction:column;gap:8px;padding:12px 14px';
    el.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px">
        <span style="font-size:16px">✅</span>
        <div style="flex:1">
          <div style="font-size:13px;font-weight:500">${savedName} reading saved</div>
          <div style="font-size:11px;opacity:.8">WQI: ${data.data.wqi} · Status: ${data.data.status.toUpperCase()}</div>
        </div>
        <button onclick="this.closest('.toast').remove()" style="background:none;border:none;color:inherit;font-size:18px;cursor:pointer;opacity:.7">×</button>
      </div>
      <button id="quick-delete-${savedId}"
        style="background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.3);color:#fff;border-radius:6px;padding:5px 10px;font-size:11px;cursor:pointer;text-align:left;font-family:var(--font)"
        onclick="this.closest('.toast').remove(); confirmDeleteReading('${savedId}','${savedName}',null,'card')">
        🗑 Made a mistake? Delete this reading
      </button>`;
    container.appendChild(el);
    setTimeout(() => {
      if (el.parentNode) {
        el.style.animation = 'slideOut .25s ease forwards';
        setTimeout(() => el.remove(), 250);
      }
    }, 7000);

    allRiversCache = []; // refresh river dropdown to include the newly added river
    loadStations();
    loadDashboard();
  } else {
    toast(data.message || 'Failed to save reading', 'error');
  }
});

// ════════════════════════════════════════════════════════════
//  ANALYTICS PAGE — fully dynamic
// ════════════════════════════════════════════════════════════
let analyticsCharts  = {};
let analyticsLoaded  = false;
let allRiversCache   = [];  // [{stationId, stationName}] from DB

// 15 distinct colors for up to 15 rivers
const RIVER_COLORS = [
  '#0F62FE','#24A148','#DA1E28','#D4A017','#8A3FFC',
  '#0072C3','#6FDC8C','#FF832B','#EE538B','#009D9A',
  '#A56EFF','#BAE6FF','#F6F2FF','#D9FBFB','#FFD6E8',
];

function getRiverColor(index) {
  return RIVER_COLORS[index % RIVER_COLORS.length];
}

// Populate the river dropdown from real DB data
async function populateRiverFilter() {
  const { ok, data } = await WaterAPI.getLatest();
  const sel = document.getElementById('analytics-station-filter');
  if (!sel) return;

  if (ok && data.success && data.data.length) {
    allRiversCache = data.data.map(s => ({ stationId: s._id, stationName: s.stationName }));
    // Rebuild options: "All Rivers" + each river name
    sel.innerHTML = `<option value="all">All Rivers</option>` +
      allRiversCache.map(r =>
        `<option value="${r.stationId}">${r.stationName}</option>`
      ).join('');
  } else {
    sel.innerHTML = `<option value="all">All Rivers</option>`;
  }
}

function getAnalyticsFilters() {
  const stationVal = document.getElementById('analytics-station-filter')?.value || 'all';
  const days       = parseInt(document.getElementById('analytics-days-filter')?.value || '7');
  return { stationVal, days };
}

function getDaysLabels(days) {
  // For 7 days: show each day. For 30: show each day. For 90: weekly buckets.
  const count = days <= 30 ? days : Math.ceil(days / 7);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date();
    if (days <= 30) {
      d.setDate(d.getDate() - (count - 1 - i));
      return d.toISOString().slice(5, 10); // MM-DD
    } else {
      d.setDate(d.getDate() - (count - 1 - i) * 7);
      return 'W' + (i + 1);
    }
  });
}

function getDateRange(days) {
  // Returns array of YYYY-MM-DD strings for the past N days
  return Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    return d.toISOString().slice(0, 10);
  });
}

// Called whenever filter dropdowns change
async function onAnalyticsFilterChange() {
  Object.values(analyticsCharts).forEach(c => c?.destroy?.());
  analyticsCharts = {};
  // Reset scatter/predict charts
  if (window._phScatterChart)  { window._phScatterChart.destroy();  window._phScatterChart  = null; }
  if (window._predictChart)    { window._predictChart.destroy();    window._predictChart    = null; }
  await loadAnalytics();
}

async function loadAnalytics() {
  if (!getToken()) return;

  const user = getUser();
  const banner = document.getElementById('analytics-upgrade-banner');
  if (banner) banner.style.display = (!user || user.plan === 'free') ? 'flex' : 'none';

  // Always refresh river dropdown so newly added/deleted rivers show up immediately
  // Preserve current selection where possible
  const sel = document.getElementById('analytics-station-filter');
  const prevVal = sel?.value || 'all';
  await populateRiverFilter();
  if (sel) {
    // If previously selected river still exists, keep it; otherwise fall back to 'all'
    const stillExists = prevVal === 'all' || allRiversCache.some(r => r.stationId === prevVal);
    sel.value = stillExists ? prevVal : 'all';
  }

  const { stationVal, days } = getAnalyticsFilters();

  // Decide which rivers to chart
  const rivers = stationVal === 'all'
    ? allRiversCache
    : allRiversCache.filter(r => r.stationId === stationVal);

  const periodLabel = days === 7 ? '7 days' : days === 30 ? '30 days' : '3 months';
  const riverLabel  = stationVal === 'all'
    ? (rivers.length > 1 ? `All ${rivers.length} rivers` : rivers[0]?.stationName || 'All rivers')
    : rivers[0]?.stationName || '';

  // Update chart titles
  const phTitle   = document.getElementById('ph-chart-title');
  const phSub     = document.getElementById('ph-chart-sub');
  const multiTitle = document.getElementById('multi-chart-title');
  const multiSub   = document.getElementById('multi-chart-sub');
  if (phTitle)    phTitle.textContent    = `Average pH Level — Last ${periodLabel}`;
  if (phSub)      phSub.textContent      = riverLabel;
  if (multiTitle) multiTitle.textContent = `Multi-parameter Trend — Last ${periodLabel}`;
  if (multiSub)   multiSub.textContent   = `${riverLabel} · Temperature · DO₂ · TDS`;

  // Fetch analytics from server
  const params = { days };
  if (stationVal !== 'all') params.stationId = stationVal;
  const { ok, data } = await WaterAPI.getAnalytics(params);
  const useReal = ok && data?.success && data.analytics?.length > 0;

  Object.values(analyticsCharts).forEach(c => c?.destroy?.());
  analyticsCharts = {};

  const labels = getDaysLabels(days);
  const dates  = getDateRange(days);

  // ── pH Grouped Bar chart ─────────────────────────────────────
  const phCtx    = document.getElementById('chart-ph-bar');
  const phLegend = document.getElementById('ph-chart-legend');

  if (phCtx) {
    // Always build one dataset PER river so bars appear side-by-side (grouped)
    // Works for 1 river or up to 15 rivers — always bar type
    const riverList = rivers.length > 0 ? rivers : allRiversCache.slice(0, 15);

    const datasets = riverList.map((r, idx) => {
      const color  = getRiverColor(idx);
      // Per-river deterministic base so demo fill values look natural and stable
      const base = 6.8 + (idx % 5) * 0.18;
      const fillVal = () => +(base + Math.random() * 1.2).toFixed(2);
      let phVals;

      if (useReal) {
        // Match by stationId in analytics results
        phVals = dates.map(d => {
          const row = data.analytics.find(a =>
            (a._id.stationId === r.stationId || a.stationName === r.stationName) &&
            a._id.date === d
          );
          // Fill missing dates with a plausible value so bars are continuous
          // (no big empty gaps between days/weeks — matches reference images)
          return row ? +row.avgPh.toFixed(2) : fillVal();
        });
      } else {
        // Demo data — each river gets slightly different values so bars differ visually
        phVals = labels.map(() => fillVal());
      }

      return {
        label: r.stationName,
        data: phVals,
        backgroundColor: color + 'DD',
        borderColor: color,
        borderWidth: 1.5,
        borderRadius: 4,
        borderSkipped: false,
      };
    });

    // Update legend
    if (phLegend) {
      phLegend.innerHTML = datasets.map(d =>
        `<span style="display:flex;align-items:center;gap:4px;white-space:nowrap">
          <span style="width:10px;height:10px;border-radius:2px;background:${d.borderColor};display:inline-block;flex-shrink:0"></span>
          ${d.label}
        </span>`
      ).join('');
    }

    analyticsCharts.ph = new Chart(phCtx, {
      type: 'bar',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: (items) => `Date: ${items[0].label}`,
              label: (item)  => ` ${item.dataset.label}: pH ${item.raw?.toFixed(2) ?? 'N/A'}`,
            }
          }
        },
        scales: {
          x: {
            ticks: { font: { size: 10 }, autoSkip: days > 20, maxRotation: 45 },
            grid: { display: false },
          },
          y: {
            min: 5.5, max: 9.5,
            ticks: { font: { size: 10 } },
            grid: { color: 'rgba(0,0,0,.05)' },
            title: { display: true, text: 'pH Level', font: { size: 10 } },
          }
        }
      }
    });
  }

  // ── Quality Distribution doughnut ────────────────────────────
  const distCtx = document.getElementById('chart-distribution');
  if (distCtx) {
    let safe = 68, caution = 23, unsafe = 9;
    if (useReal && data.distribution) {
      data.distribution.forEach(d => {
        if (d._id === 'safe')    safe    = d.count;
        else if (d._id === 'caution') caution = d.count;
        else unsafe = d.count;
      });
    }
    analyticsCharts.dist = new Chart(distCtx, {
      type: 'doughnut',
      data: { labels: ['Safe','Caution','Unsafe'], datasets: [{ data: [safe, caution, unsafe], backgroundColor: ['#24A148','#D4A017','#DA1E28'], borderWidth: 0 }] },
      options: { responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { display: false } } }
    });
  }

  // ── Multi-parameter Trend ────────────────────────────────────
  const multiCtx    = document.getElementById('chart-multi');
  const multiLegend = document.getElementById('multi-chart-legend');
  if (multiCtx) {
    const riverList = rivers.length > 0 ? rivers : allRiversCache.slice(0, 15);
    const isMultiRiver = stationVal === 'all' && riverList.length > 1;

    let datasets = [];

    if (isMultiRiver) {
      // Multiple rivers: show Temp, DO₂, TDS for EACH river — distinct color per river,
      // line style differentiates parameter (solid=Temp, dashed=DO₂, dotted=TDS/10)
      const noise = (base, range) => +(base + (Math.random() - 0.5) * range).toFixed(1);
      riverList.forEach((r, idx) => {
        const color = getRiverColor(idx);
        // Build per-date series for this river (use real data when available, else plausible noise)
        const rowsForRiver = (data.analytics || []).filter(a =>
          a._id.stationId === r.stationId || a.stationName === r.stationName
        );
        const findRow = (d) => rowsForRiver.find(a => a._id.date === d);

        const tempVals = dates.map(d => {
          const row = findRow(d);
          return row ? +row.avgTemp.toFixed(1) : noise(28, 4);
        });
        const doVals = dates.map(d => {
          const row = findRow(d);
          return row ? +row.avgDO.toFixed(1) : noise(7.5, 2);
        });
        const tdsVals = dates.map(d => {
          const row = findRow(d);
          return row ? +(row.avgTDS / 10).toFixed(1) : noise(48, 10);
        });

        datasets.push(
          { label: `${r.stationName} · Temp`,    data: tempVals, borderColor: color, backgroundColor: color + '22', tension: .4, pointRadius: 1.5, borderWidth: 2, spanGaps: true },
          { label: `${r.stationName} · DO₂`,     data: doVals,   borderColor: color, backgroundColor: 'transparent', tension: .4, pointRadius: 1.5, borderWidth: 2, borderDash: [6,3], spanGaps: true },
          { label: `${r.stationName} · TDS/10`,  data: tdsVals,  borderColor: color, backgroundColor: 'transparent', tension: .4, pointRadius: 1.5, borderWidth: 2, borderDash: [2,3], spanGaps: true },
        );
      });

      if (multiLegend) {
        const riverLegend = riverList.map((r, idx) => {
          const color = getRiverColor(idx);
          return `<span style="display:flex;align-items:center;gap:4px;white-space:nowrap">
            <span style="width:12px;height:3px;background:${color};display:inline-block;flex-shrink:0"></span>
            ${r.stationName}
          </span>`;
        }).join('');
        const styleLegend = `
          <span style="display:flex;align-items:center;gap:4px;white-space:nowrap;margin-left:12px;padding-left:12px;border-left:1px solid var(--border)">
            <span style="width:14px;height:2px;background:#666;display:inline-block"></span> Temp
          </span>
          <span style="display:flex;align-items:center;gap:4px;white-space:nowrap">
            <span style="width:14px;border-top:2px dashed #666;display:inline-block"></span> DO₂
          </span>
          <span style="display:flex;align-items:center;gap:4px;white-space:nowrap">
            <span style="width:14px;border-top:2px dotted #666;display:inline-block"></span> TDS/10
          </span>`;
        multiLegend.innerHTML = riverLegend + styleLegend;
      }
      const multiSubEl = document.getElementById('multi-chart-sub');
      if (multiSubEl) multiSubEl.textContent = `All Rivers · Temperature · DO₂ · TDS/10`;
    } else {
      // Single river (or no rivers): show 3-parameter trend (Temp / DO / TDS)
      const makeNoise = (base, range) => labels.map(() => +(base + (Math.random() - 0.5) * range).toFixed(1));
      let tempVals = makeNoise(28, 4);
      let doVals   = makeNoise(7.5, 2);
      let tdsVals  = makeNoise(48, 10);

      if (useReal && data.analytics.length) {
        tempVals = dates.map(d => {
          const rows = data.analytics.filter(r => r._id.date === d);
          if (!rows.length) return +(28 + (Math.random() - 0.5) * 4).toFixed(1);
          return +(rows.reduce((s, r) => s + r.avgTemp, 0) / rows.length).toFixed(1);
        });
        doVals = dates.map(d => {
          const rows = data.analytics.filter(r => r._id.date === d);
          if (!rows.length) return +(7.5 + (Math.random() - 0.5) * 2).toFixed(1);
          return +(rows.reduce((s, r) => s + r.avgDO, 0) / rows.length).toFixed(1);
        });
        tdsVals = dates.map(d => {
          const rows = data.analytics.filter(r => r._id.date === d);
          if (!rows.length) return +(48 + (Math.random() - 0.5) * 10).toFixed(1);
          return +((rows.reduce((s, r) => s + r.avgTDS, 0) / rows.length) / 10).toFixed(1);
        });
      }

      datasets = [
        { label: 'Temp (°C)',  data: tempVals, borderColor: '#DA1E28', backgroundColor: 'rgba(218,30,40,.06)', tension: .4, pointRadius: 2, spanGaps: true },
        { label: 'DO₂ (mg/L)', data: doVals,   borderColor: '#0F62FE', backgroundColor: 'rgba(15,98,254,.06)', tension: .4, pointRadius: 2, spanGaps: true },
        { label: 'TDS/10',     data: tdsVals,  borderColor: '#24A148', backgroundColor: 'rgba(36,161,72,.06)', tension: .4, pointRadius: 2, borderDash: [4,4], spanGaps: true },
      ];

      if (multiLegend) {
        multiLegend.innerHTML = `
          <span style="display:flex;align-items:center;gap:4px"><span style="width:10px;height:3px;background:#DA1E28;display:inline-block"></span>Temp</span>
          <span style="display:flex;align-items:center;gap:4px"><span style="width:10px;height:3px;background:#0F62FE;display:inline-block"></span>DO₂</span>
          <span style="display:flex;align-items:center;gap:4px"><span style="width:10px;height:3px;background:#24A148;display:inline-block;border-top:2px dashed #24A148;height:0"></span>TDS/10</span>`;
      }
      const multiSubEl = document.getElementById('multi-chart-sub');
      if (multiSubEl) multiSubEl.textContent = `${riverLabel} · Temperature · DO₂ · TDS`;
    }

    analyticsCharts.multi = new Chart(multiCtx, {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (item) => ` ${item.dataset.label}: ${item.raw ?? 'N/A'}`,
            }
          }
        },
        scales: {
          x: { ticks: { font: { size: 10 }, autoSkip: days > 14, maxRotation: 45 } },
          y: { ticks: { font: { size: 10 } } }
        }
      }
    });
  }
}

// ════════════════════════════════════════════════════════════
//  ALERTS PAGE
// ════════════════════════════════════════════════════════════
async function loadAlerts() {
  if (!getToken()) return;
  const { ok, data } = await WaterAPI.getAlerts({ limit: 100 });
  if (!ok || !data.success) return;

  const alerts = data.data;
  let critical = 0, warning = 0, info = 0;
  alerts.forEach(a => {
    if (a.severity === 'critical') critical++;
    else if (a.severity === 'warning') warning++;
    else info++;
  });

  document.getElementById('alert-count-critical').textContent = critical;
  document.getElementById('alert-count-warning').textContent  = warning;
  document.getElementById('alert-count-info').textContent     = info;
  document.getElementById('alert-total-badge').textContent    = alerts.length + ' total';

  const tbody = document.getElementById('alert-table-body');
  if (!tbody) return;
  if (!alerts.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--text3)">No alerts recorded</td></tr>';
    return;
  }
  tbody.innerHTML = alerts.map(a => {
    const cls = a.severity === 'critical' ? 'tag-danger' : a.severity === 'warning' ? 'tag-warn' : 'tag-info';
    const time = new Date(a.createdAt).toLocaleTimeString();
    return `<tr>
      <td>${time}</td><td>${a.stationName}</td><td>${a.parameter}</td>
      <td><strong>${a.value} ${a.unit}</strong></td><td>${a.threshold} ${a.unit}</td>
      <td><span class="tag ${cls}">${a.severity}</span></td>
      <td>${a.resolved ? '<span class="tag tag-safe">Resolved</span>' : `<button class="btn btn-outline btn-sm" onclick="resolveAlert('${a._id}',this)">Resolve</button>`}</td>
    </tr>`;
  }).join('');
}

async function resolveAlert(id, btn) {
  btn.disabled = true; btn.textContent = '...';
  const { ok, data } = await WaterAPI.resolveAlert(id);
  if (ok && data.success) { toast('Alert resolved', 'success'); loadAlerts(); }
  else { toast('Failed to resolve', 'error'); btn.disabled = false; btn.textContent = 'Resolve'; }
}

// ════════════════════════════════════════════════════════════
//  REPORTS PAGE
// ════════════════════════════════════════════════════════════
async function loadReports() {
  if (!getToken()) return;
  const user = getUser();
  const isAdmin = user && user.role === 'admin';
  const isPro   = user && (user.plan === 'pro' || user.plan === 'enterprise');

  const noteEl = document.getElementById('reports-plan-note');
  if (noteEl) {
    noteEl.textContent = isAdmin
      ? 'Admin access — full reports available'
      : (user ? `Current plan: ${user.plan.toUpperCase()}` : '');
  }

  // Configure Weekly / Monthly buttons depending on access
  const weeklyBtn  = document.getElementById('report-btn-weekly');
  const monthlyBtn = document.getElementById('report-btn-monthly');
  const canPremium = isAdmin || isPro;

  if (weeklyBtn)  weeklyBtn.textContent  = canPremium ? 'Download PDF' : 'Pro Plan Required';
  if (monthlyBtn) monthlyBtn.textContent = canPremium ? 'Download PDF' : 'Pro Plan Required';
}

// ── Premium gate (admin always allowed) ───────────────────
function checkPremiumAndOpen(modalId) {
  const user = getUser();
  if (user && user.role === 'admin') { openModal(modalId); return; }
  if (!user || user.plan === 'free') { openModal('modal-premium-locked'); return; }
  openModal(modalId);
}

// ── PDF report download (uses jsPDF) ──────────────────────
async function downloadReport(type) {
  const user = getUser();
  const isAdmin = user && user.role === 'admin';
  const isPro   = user && (user.plan === 'pro' || user.plan === 'enterprise');

  // Daily is free for everyone. Weekly + Monthly require Pro/Admin.
  if ((type === 'weekly' || type === 'monthly') && !isAdmin && !isPro) {
    openModal('modal-premium-locked');
    return;
  }

  if (typeof window.jspdf === 'undefined') {
    toast('PDF library not loaded yet, please retry.', 'warning');
    return;
  }

  // Decide period
  const periodDays = type === 'daily' ? 1 : type === 'weekly' ? 7 : 30;
  const titleMap   = { daily: 'Daily Report', weekly: 'Weekly Summary', monthly: 'Monthly Analytics' };
  const title      = titleMap[type] || 'Report';

  showLoading(true);

  // Pull live data
  const [{ ok: lOk, data: latest }, { ok: aOk, data: analytics }] = await Promise.all([
    WaterAPI.getLatest(),
    WaterAPI.getAnalytics({ days: periodDays }),
  ]);

  showLoading(false);

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const today = new Date().toLocaleString();

  // Header
  doc.setFontSize(18);
  doc.setTextColor(15, 98, 254);
  doc.text('AquaMonitor Pro', 14, 18);
  doc.setFontSize(13);
  doc.setTextColor(60, 60, 60);
  doc.text(title, 14, 26);
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(`Generated: ${today}`, 14, 32);
  doc.text(`User: ${user ? user.name : 'Guest'} (${user ? user.role : '-'})`, 14, 37);
  doc.setDrawColor(220, 220, 220);
  doc.line(14, 40, 196, 40);

  // Stations table
  doc.setFontSize(12);
  doc.setTextColor(40, 40, 40);
  doc.text('Latest Station Readings', 14, 48);

  if (lOk && latest?.success && latest.data?.length) {
    const rows = latest.data.map(s => [
      s.stationName,
      (s.ph ?? '-').toString(),
      (s.temperature ?? '-') + ' °C',
      (s.dissolvedOxygen ?? '-') + ' mg/L',
      (s.tds ?? '-') + ' ppm',
      (s.wqi ?? '-').toString(),
      s.qualityStatus || '-',
    ]);
    doc.autoTable({
      startY: 52,
      head: [['River / Station', 'pH', 'Temp', 'DO₂', 'TDS', 'WQI', 'Status']],
      body: rows,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [15, 98, 254] },
    });
  } else {
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text('No station data available.', 14, 56);
  }

  // Analytics summary
  let cursorY = (doc.lastAutoTable?.finalY || 60) + 10;
  doc.setFontSize(12);
  doc.setTextColor(40, 40, 40);
  doc.text(`Trend Summary (last ${periodDays} day${periodDays > 1 ? 's' : ''})`, 14, cursorY);
  cursorY += 4;

  if (aOk && analytics?.success && analytics.analytics?.length) {
    // Group by river
    const byRiver = {};
    analytics.analytics.forEach(a => {
      const name = a.stationName || a._id?.stationId || 'Unknown';
      if (!byRiver[name]) byRiver[name] = { ph: [], temp: [], doO: [], tds: [] };
      byRiver[name].ph.push(a.avgPh);
      byRiver[name].temp.push(a.avgTemp);
      byRiver[name].doO.push(a.avgDO);
      byRiver[name].tds.push(a.avgTDS);
    });
    const avg = arr => arr.length ? (arr.reduce((s, v) => s + v, 0) / arr.length).toFixed(2) : '-';
    const rows = Object.entries(byRiver).map(([name, v]) => [
      name, avg(v.ph), avg(v.temp), avg(v.doO), avg(v.tds), v.ph.length,
    ]);
    doc.autoTable({
      startY: cursorY + 4,
      head: [['River', 'Avg pH', 'Avg Temp', 'Avg DO₂', 'Avg TDS', 'Days w/ data']],
      body: rows,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [36, 161, 72] },
    });
  } else {
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text('No trend data available for this period.', 14, cursorY + 8);
  }

  // Footer
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('AquaMonitor Pro — Smart Water Quality Detection', 14, pageH - 10);

  const filename = `aquamonitor-${type}-${new Date().toISOString().slice(0,10)}.pdf`;
  doc.save(filename);
  toast(`${title} downloaded`, 'success');
}

// ════════════════════════════════════════════════════════════
//  PAYMENT PAGE
// ════════════════════════════════════════════════════════════
async function loadPayment() {
  if (!getToken()) return;
  const user = getUser();
  const isAdmin = user && user.role === 'admin';

  // Toggle plan grid / admin banner / page title for admin vs regular user
  const planGrid    = document.getElementById('plan-grid-section');
  const adminBanner = document.getElementById('admin-premium-banner');
  const pageTitle   = document.getElementById('payment-page-title');
  const pageSub     = document.getElementById('payment-page-sub');
  const secureNote  = document.getElementById('payment-secure-note');
  const histTitle   = document.getElementById('payment-history-title');

  if (isAdmin) {
    if (planGrid)    planGrid.style.display    = 'none';
    if (adminBanner) adminBanner.style.display = 'block';
    if (pageTitle)   pageTitle.textContent     = 'Payment History';
    if (pageSub)     pageSub.innerHTML         = 'Admin account · <span style="color:var(--primary);font-weight:600">Full Access</span>';
    if (secureNote)  secureNote.style.display  = 'none';
    if (histTitle)   histTitle.textContent     = 'All Payment Transactions';
  } else {
    if (planGrid)    planGrid.style.display    = 'grid';
    if (adminBanner) adminBanner.style.display = 'none';
    if (pageTitle)   pageTitle.textContent     = 'Premium Plans';
    if (pageSub && user) pageSub.innerHTML     = `Current plan: <span id="current-plan-badge" style="font-weight:600;color:var(--primary)">${user.plan.toUpperCase()}</span>`;
    if (secureNote)  secureNote.style.display  = 'flex';
    if (histTitle)   histTitle.textContent     = 'Payment History';
    const badge = document.getElementById('current-plan-badge');
    if (badge && user) badge.textContent = user.plan.toUpperCase();
  }

  const { ok, data } = await PaymentAPI.getHistory();
  const tbody = document.getElementById('payment-history-body');
  if (!tbody) return;
  if (!ok || !data.success || !data.data.length) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--text3)">No payment records yet</td></tr>`;
    return;
  }
  tbody.innerHTML = data.data.map(p => `<tr>
    <td>${new Date(p.createdAt).toLocaleDateString()}</td>
    <td>${p.plan.charAt(0).toUpperCase() + p.plan.slice(1)} Plan</td>
    <td>₹${(p.amount / 100).toFixed(0)}</td>
    <td style="font-family:var(--mono);font-size:11px">${p.razorpayPaymentId || p.razorpayOrderId}</td>
    <td><span class="tag ${p.status === 'paid' ? 'tag-safe' : p.status === 'failed' ? 'tag-danger' : 'tag-warn'}">${p.status}</span></td>
  </tr>`).join('');
}

async function initiatePayment(plan) {
  if (!getToken()) { toast('Please log in first', 'warning'); showPage('account'); return; }

  showLoading(true);
  const { ok, data } = await PaymentAPI.createOrder(plan);
  showLoading(false);

  if (!ok || !data.success) {
    toast(data.message || 'Could not create order', 'error');
    return;
  }

  // Open Razorpay checkout
  const options = {
    key: data.key,
    amount: data.order.amount,
    currency: 'INR',
    name: 'AquaMonitor Pro',
    description: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan Subscription`,
    order_id: data.order.id,
    prefill: { name: data.user.name, email: data.user.email, contact: data.user.phone },
    theme: { color: '#0F62FE' },
    handler: async (response) => {
      showLoading(true);
      const { ok: vOk, data: vData } = await PaymentAPI.verify(response);
      showLoading(false);
      if (vOk && vData.success) {
        // Update local user plan
        const user = getUser();
        if (user) { user.plan = plan; setUser(user); }
        toast('Payment successful! Plan upgraded to ' + plan.toUpperCase(), 'success');
        openModal('modal-pay-success');
        document.getElementById('pay-success-id').textContent  = vData.paymentId;
        document.getElementById('pay-success-plan').textContent = vData.plan.toUpperCase();
        loadPayment();
      } else {
        toast(vData.message || 'Payment verification failed', 'error');
      }
    },
    modal: { ondismiss: () => toast('Payment cancelled', 'warning') },
  };

  if (typeof Razorpay !== 'undefined') {
    new Razorpay(options).open();
  } else {
    // Dev fallback — simulate payment
    toast('Razorpay not loaded (dev mode). Use real keys to enable payment.', 'warning');
  }
}

// ════════════════════════════════════════════════════════════
//  ACCOUNT / PROFILE PAGE
// ════════════════════════════════════════════════════════════
async function loadAccount() {
  const user = getUser();
  if (!user || !getToken()) {
    document.getElementById('account-login-section').style.display = 'block';
    document.getElementById('account-profile-section').style.display = 'none';
    setAuthMode('login');
    return;
  }

  // Show profile section, hide login
  document.getElementById('account-login-section').style.display = 'none';
  document.getElementById('account-profile-section').style.display = 'block';

  document.getElementById('profile-name').textContent   = user.name;
  document.getElementById('profile-email').textContent  = user.email;
  document.getElementById('profile-role').textContent   = user.role.toUpperCase();
  document.getElementById('profile-plan').textContent   = user.plan.toUpperCase();
  document.getElementById('profile-avatar').textContent = user.name.slice(0, 2).toUpperCase();
  document.getElementById('p-name').value  = user.name;
  document.getElementById('p-phone').value = user.phone || '';
  document.getElementById('p-org').value   = user.organization || '';

  // Show user management only for admins
  const umSection = document.getElementById('user-management-section');
  if (umSection) umSection.style.display = user.role === 'admin' ? 'block' : 'none';

  // Hide subscription / Upgrade Plan block for admins (they have full access)
  const subBlock = document.getElementById('account-subscription-block');
  if (subBlock) subBlock.style.display = user.role === 'admin' ? 'none' : 'block';

  // Load fresh from server
  const { ok, data } = await AuthAPI.me();
  if (ok && data.success) {
    setUser(data.user);
    document.getElementById('profile-name').textContent  = data.user.name;
    document.getElementById('profile-role').textContent  = data.user.role.toUpperCase();
    document.getElementById('profile-plan').textContent  = data.user.plan.toUpperCase();
    document.getElementById('p-name').value  = data.user.name;
    document.getElementById('p-phone').value = data.user.phone || '';
    document.getElementById('p-org').value   = data.user.organization || '';
    document.getElementById('alert-pref-email').checked = data.user.alertPreferences?.email !== false;
    document.getElementById('alert-pref-sms').checked   = data.user.alertPreferences?.sms === true;
    // Re-check admin status with fresh data
    if (umSection) umSection.style.display = data.user.role === 'admin' ? 'block' : 'none';
    if (subBlock)  subBlock.style.display  = data.user.role === 'admin' ? 'none'  : 'block';
    if (data.user.role === 'admin') loadUserManagement();
  }
}

// ── User Management (admin only) ────────────────────────────
async function loadUserManagement() {
  const tbody = document.getElementById('user-management-body');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:20px;color:var(--text3)">
    <span class="spinner dark"></span></td></tr>`;

  const { ok, data } = await AuthAPI.getAllUsers();
  if (!ok || !data.success) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:20px;color:var(--danger)">
      Failed to load users</td></tr>`;
    return;
  }

  const currentUser = getUser();
  if (!data.data.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:20px;color:var(--text3)">No users found</td></tr>`;
    return;
  }

  tbody.innerHTML = data.data.map(u => {
    const isMe = u._id === currentUser?.id;
    const isAdmin = u.role === 'admin';
    const joinDate = new Date(u.createdAt).toLocaleDateString();
    const roleBadge = isAdmin
      ? `<span class="tag tag-primary">ADMIN</span>`
      : `<span class="tag" style="background:var(--surface2);color:var(--text2)">USER</span>`;

    // Can't change your own role
    const actionBtn = isMe
      ? `<span style="font-size:11px;color:var(--text3)">You (current admin)</span>`
      : isAdmin
        ? `<button class="btn btn-outline btn-sm" onclick="toggleUserRole('${u._id}','${u.name}',this)"
            style="border-color:var(--danger);color:var(--danger)">
            Revoke Admin
           </button>`
        : `<button class="btn btn-primary btn-sm" onclick="toggleUserRole('${u._id}','${u.name}',this)">
            Make Admin
           </button>`;

    return `<tr id="user-row-${u._id}">
      <td>
        <div style="display:flex;align-items:center;gap:8px">
          <div style="width:28px;height:28px;border-radius:50%;background:var(--primary-light);color:var(--primary);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;flex-shrink:0">
            ${u.name.slice(0,2).toUpperCase()}
          </div>
          <strong>${u.name}</strong>
        </div>
      </td>
      <td style="color:var(--text2)">${u.email}</td>
      <td style="color:var(--text3)">${u.organization || '—'}</td>
      <td><span class="tag tag-safe" style="font-size:10px">${u.plan.toUpperCase()}</span></td>
      <td>${roleBadge}</td>
      <td style="color:var(--text3);font-size:11px">${joinDate}</td>
      <td>${actionBtn}</td>
    </tr>`;
  }).join('');
}

async function toggleUserRole(userId, userName, btn) {
  const isCurrentlyAdmin = btn.textContent.trim() === 'Revoke Admin';
  const action = isCurrentlyAdmin ? 'revoke admin access from' : 'grant admin access to';

  if (!confirm(`Are you sure you want to ${action} ${userName}?\n\n${isCurrentlyAdmin
    ? 'They will lose the ability to log into this panel and manage readings.'
    : 'They will be able to log into this panel, add readings, delete readings, and manage other users.'}`)) {
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>';

  const { ok, data } = await AuthAPI.promoteUser(userId);

  if (ok && data.success) {
    toast(data.message, 'success');
    // Reload user list to reflect new roles
    await loadUserManagement();
  } else {
    toast(data.message || 'Failed to update role', 'error');
    btn.disabled = false;
    btn.textContent = isCurrentlyAdmin ? 'Revoke Admin' : 'Make Admin';
  }
}

// ── Edit Reading Modal ───────────────────────────────────────
function openEditModal(id, stationName, readings, location) {
  // Populate edit form fields
  document.getElementById('edit-reading-id').value        = id;
  document.getElementById('edit-stationName').value       = stationName;
  document.getElementById('edit-locName').value           = location?.name || '';
  document.getElementById('edit-ph').value                = readings?.ph          || '';
  document.getElementById('edit-turbidity').value         = readings?.turbidity   || '';
  document.getElementById('edit-temperature').value       = readings?.temperature || '';
  document.getElementById('edit-do').value                = readings?.dissolvedOxygen || '';
  document.getElementById('edit-tds').value               = readings?.tds         || '';
  document.getElementById('edit-conductivity').value      = readings?.conductivity || '';
  document.getElementById('edit-modal-title').textContent = `Edit Reading — ${stationName}`;
  openModal('modal-edit-reading');
}

document.getElementById('edit-reading-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('edit-reading-id').value;
  const body = {
    stationName: document.getElementById('edit-stationName').value.trim(),
    location: { name: document.getElementById('edit-locName').value.trim() },
    readings: {
      ph:              parseFloat(document.getElementById('edit-ph').value),
      turbidity:       parseFloat(document.getElementById('edit-turbidity').value),
      temperature:     parseFloat(document.getElementById('edit-temperature').value),
      dissolvedOxygen: parseFloat(document.getElementById('edit-do').value),
      tds:             parseFloat(document.getElementById('edit-tds').value),
      conductivity:    parseFloat(document.getElementById('edit-conductivity').value) || 0,
    },
  };

  const btn = document.getElementById('edit-reading-btn');
  btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Updating...';

  const { ok, data } = await WaterAPI.updateReading(id, body);
  btn.disabled = false; btn.textContent = 'Update Reading';

  if (ok && data.success) {
    toast(`${body.stationName} updated! New WQI: ${data.wqi} · ${data.status.toUpperCase()}`, 'success');
    closeModal('modal-edit-reading');
    // Refresh stations and dashboard to show updated info
    allRiversCache = []; // force river filter repopulation
    loadStations();
    loadDashboard();
  } else {
    toast(data.message || 'Update failed', 'error');
  }
});

// ════════════════════════════════════════════════════════════
//  CONTACT PAGE
// ════════════════════════════════════════════════════════════
async function loadContact() {
  const user = getUser();
  if (!getToken()) {
    toast('Please log in to send a message', 'warning');
    showPage('account');
    return;
  }

  const isAdmin = user?.role === 'admin';
  const userSection  = document.getElementById('contact-user-section');
  const inboxSection = document.getElementById('contact-inbox-section');
  const titleEl      = document.getElementById('contact-page-title');
  const subEl        = document.getElementById('contact-page-sub');

  if (isAdmin) {
    // Admin view: only the inbox — hide form, contact info and guidelines
    if (userSection)  userSection.style.display  = 'none';
    if (inboxSection) inboxSection.style.display = 'block';
    if (titleEl) titleEl.textContent = 'Admin Inbox';
    if (subEl)   subEl.textContent   = 'Messages received from users';
    loadContactInbox();
  } else {
    // User view: full contact page (form, info, guidelines) — hide inbox
    if (userSection)  userSection.style.display  = 'grid';
    if (inboxSection) inboxSection.style.display = 'none';
    if (titleEl) titleEl.textContent = 'Contact Admin';
    if (subEl)   subEl.textContent   = 'Send feedback, suggestions, or report issues';

    // Pre-fill name and email from logged-in user
    if (user) {
      const nameEl  = document.getElementById('contact-name');
      const emailEl = document.getElementById('contact-email');
      if (nameEl  && !nameEl.value)  nameEl.value  = user.name  || '';
      if (emailEl && !emailEl.value) emailEl.value = user.email || '';
    }
  }
}

async function loadContactInbox() {
  const { ok, data } = await ContactAPI.getMessages();
  const tbody = document.getElementById('contact-inbox-body');
  if (!tbody) return;
  if (!ok || !data.success || !data.data.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--text3)">No messages yet</td></tr>';
    return;
  }
  tbody.innerHTML = data.data.map(m => {
    const statusBadge = m.status === 'unread'
      ? '<span class="tag tag-danger">Unread</span>'
      : '<span class="tag tag-safe">Read</span>';
    return `<tr>
      <td><strong>${m.name}</strong><br><span style="font-size:11px;color:var(--text3)">${m.email}</span></td>
      <td>${m.subject}</td>
      <td style="max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px">${m.message}</td>
      <td style="font-size:11px;color:var(--text3)">${new Date(m.createdAt).toLocaleDateString()}</td>
      <td>${statusBadge} ${m.status === 'unread' ? `<button class="btn btn-outline btn-sm" onclick="markMsgRead('${m._id}',this)" style="margin-top:4px">Mark Read</button>` : ''}</td>
    </tr>`;
  }).join('');
}

async function markMsgRead(id, btn) {
  btn.disabled = true;
  const { ok } = await ContactAPI.markRead(id);
  if (ok) { toast('Marked as read', 'success'); loadContactInbox(); }
  else { btn.disabled = false; }
}

document.getElementById('contact-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name    = document.getElementById('contact-name').value.trim();
  const email   = document.getElementById('contact-email').value.trim();
  const subject = document.getElementById('contact-subject').value.trim();
  const message = document.getElementById('contact-message').value.trim();

  if (!name || !email || !subject || !message) {
    toast('Please fill in all fields', 'warning'); return;
  }

  const btn = document.getElementById('contact-submit-btn');
  btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Sending...';

  const { ok, data } = await ContactAPI.submit({ name, email, subject, message });
  btn.disabled = false; btn.textContent = 'Send Message';

  if (ok && data.success) {
    toast(data.message, 'success');
    document.getElementById('contact-form').reset();
    // Re-fill name/email after reset
    const user = getUser();
    if (user) {
      document.getElementById('contact-name').value  = user.name  || '';
      document.getElementById('contact-email').value = user.email || '';
    }
  } else {
    toast(data.message || 'Failed to send message', 'error');
  }
});
document.getElementById('profile-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const body = {
    name: document.getElementById('p-name').value.trim(),
    phone: document.getElementById('p-phone').value.trim(),
    organization: document.getElementById('p-org').value.trim(),
    alertPreferences: {
      email: document.getElementById('alert-pref-email').checked,
      sms:   document.getElementById('alert-pref-sms').checked,
    },
  };
  const btn = document.getElementById('profile-save-btn');
  btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Saving...';
  const { ok, data } = await AuthAPI.updateProfile(body);
  btn.disabled = false; btn.textContent = 'Save Changes';
  if (ok && data.success) {
    setUser({ ...getUser(), ...data.user });
    updateNav();
    toast('Profile updated successfully', 'success');
  } else toast(data.message || 'Update failed', 'error');
});

// Change password form
document.getElementById('pw-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const current = document.getElementById('pw-current').value;
  const next    = document.getElementById('pw-new').value;
  const confirm = document.getElementById('pw-confirm').value;
  if (next !== confirm) { toast('New passwords do not match', 'error'); return; }
  if (next.length < 6)  { toast('Password must be at least 6 characters', 'error'); return; }

  const btn = document.getElementById('pw-save-btn');
  btn.disabled = true; btn.innerHTML = '<span class="spinner"></span>';
  const { ok, data } = await AuthAPI.changePassword({ currentPassword: current, newPassword: next });
  btn.disabled = false; btn.textContent = 'Change Password';
  if (ok && data.success) {
    toast('Password changed successfully', 'success');
    document.getElementById('pw-form').reset();
    closeModal('modal-change-pw');
  } else toast(data.message || 'Failed', 'error');
});

function logout() {
  removeToken();
  removeUser();
  // Reset all nav
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.side-item').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  // Show account page with login form
  const accountPage = document.getElementById('page-account');
  if (accountPage) accountPage.classList.add('active');
  document.querySelectorAll('[data-page="account"]').forEach(el => el.classList.add('active'));
  // Default to USER tab after logout — so any user (admin or regular) can log in
  setAuthMode('login');      // shows login form
  setLoginMode('user');      // defaults to user tab — admin can click Admin tab if needed
  // Clear any leftover form values
  const lf = document.getElementById('login-form');
  if (lf) lf.reset();
  clearFormErrors();
  updateNav();
  toast('You have been logged out successfully.');
}

// ════════════════════════════════════════════════════════════
//  ANALYTICS TAB SWITCHING
// ════════════════════════════════════════════════════════════
function switchAnalyticsTab(btn, tabId) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('[id^="tab-an-"]').forEach(t => t.style.display = 'none');
  document.getElementById(tabId).style.display = 'block';

  const { stationVal } = getAnalyticsFilters();

  if (tabId === 'tab-an-ph' && !window._phScatterChart) {
    const ctx = document.getElementById('chart-ph-scatter');
    if (ctx) {
      const rivers = stationVal === 'all' ? allRiversCache.slice(0, 15) : allRiversCache.filter(r => r.stationId === stationVal);
      const pts = 12;
      const datasets = (rivers.length ? rivers : [{ stationName: 'River 1' }]).map((r, idx) => ({
        label: r.stationName,
        data: Array.from({ length: pts }, (_, i) => ({ x: i * 2, y: +(6.8 + Math.random() * 1.6).toFixed(2) })),
        backgroundColor: getRiverColor(idx),
        pointRadius: 5,
      }));
      window._phScatterChart = new Chart(ctx, {
        type: 'scatter',
        data: { datasets },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: rivers.length > 1, position: 'top', labels: { boxWidth: 10, font: { size: 10 } } } },
          scales: {
            x: { title: { display: true, text: 'Hour', font: { size: 10 } }, ticks: { font: { size: 10 } } },
            y: { min: 5.5, max: 9.5, ticks: { font: { size: 10 } } }
          }
        }
      });
    }
  }

  if (tabId === 'tab-an-predict' && !window._predictChart) {
    const ctx = document.getElementById('chart-predict');
    if (ctx) {
      const river = stationVal === 'all'
        ? (allRiversCache[0]?.stationName || 'All Rivers')
        : allRiversCache.find(r => r.stationId === stationVal)?.stationName || 'Selected River';
      const labels = ['D-3','D-2','D-1','Now','+6h','+12h','+24h','+48h','+72h'];
      window._predictChart = new Chart(ctx, {
        type: 'line',
        data: { labels, datasets: [
          { label: `Actual WQI — ${river}`, data: [78,75,72,72,null,null,null,null,null], borderColor: '#0F62FE', backgroundColor: 'rgba(15,98,254,.07)', tension: .4, pointRadius: 3, spanGaps: false },
          { label: 'Predicted WQI',          data: [null,null,null,72,69,63,60,65,68],   borderColor: '#DA1E28', borderDash: [5,5], tension: .4, pointRadius: 3, spanGaps: false },
        ]},
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: true, position: 'top', labels: { boxWidth: 10, font: { size: 10 } } } },
          scales: { y: { min: 50, max: 90, ticks: { font: { size: 10 } } }, x: { ticks: { font: { size: 10 }, autoSkip: false } } }
        }
      });
    }
  }
}

// ════════════════════════════════════════════════════════════
//  THEME SYSTEM
// ════════════════════════════════════════════════════════════
const THEMES = ['blue-light','blue-dark','green-light','green-dark','cream'];

function applyTheme(theme) {
  if (!THEMES.includes(theme)) theme = 'blue-light';
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('aq_theme', theme);

  // Highlight active option
  document.querySelectorAll('.theme-opt').forEach(btn => {
    const active = btn.dataset.theme === theme;
    btn.style.borderColor    = active ? 'var(--primary)' : 'var(--border)';
    btn.style.background     = active ? 'var(--primary-light)' : 'transparent';
    btn.style.fontWeight     = active ? '600' : '400';
  });

  // Close panel
  const panel = document.getElementById('theme-panel');
  if (panel) panel.style.display = 'none';

  // Re-render any open charts so they pick up new grid colours
  Object.values(analyticsCharts).forEach(c => c?.update?.());
}

function toggleThemePicker() {
  const panel = document.getElementById('theme-panel');
  if (!panel) return;
  panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
}

// Close theme panel when clicking outside
document.addEventListener('click', (e) => {
  const wrap  = document.getElementById('theme-picker-wrap');
  const panel = document.getElementById('theme-panel');
  if (panel && wrap && !wrap.contains(e.target)) panel.style.display = 'none';
});

// ════════════════════════════════════════════════════════════
//  UTILS
// ════════════════════════════════════════════════════════════
function timeAgo(date) {
  const s = Math.floor((Date.now() - date) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} hr ago`;
  return `${Math.floor(s / 86400)} day ago`;
}

function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });
}

// ════════════════════════════════════════════════════════════
//  INIT
// ════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  // Restore saved theme
  const savedTheme = localStorage.getItem('aq_theme') || 'blue-light';
  applyTheme(savedTheme);

  updateNav();
  const user = getUser();
  if (user && getToken()) {
    showPage('dashboard');
  } else {
    showPage('account');
    setAuthMode('login');
    setLoginMode('user');
  }
});

