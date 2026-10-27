// Shared header tools (search, help, notifications, account), onboarding tour and demo sign-out
// for the Branchline prototype (client: North & Oak). Loaded by every accepted screen.
(function () {
  if (window.OpShell) return;
  const ACC = 'oklch(54% 0.19 258)';
  const NARROW = '(max-width: 719px)';
  const ss = {
    get(k, d) { try { const v = sessionStorage.getItem('opShell.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { sessionStorage.setItem('opShell.' + k, JSON.stringify(v)); } catch (e) {} },
    del(k) { try { sessionStorage.removeItem('opShell.' + k); } catch (e) {} },
  };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // Demo records reused from Operations.dc.html (ISSUES, open at the 16:05 demo start)
  // and Inventory.dc.html (FIXED stock points). Links use each screen's existing query parameters.
  const NOTIFS = [
    { id: 'ops:berlin-staff', group: 'ops', title: 'Dinner shift is 2 people short', meta: 'Berlin \u00b7 Staffing', href: 'Operations.dc.html?issue=berlin-staff' },
    { id: 'ops:lisbon-sync', group: 'ops', title: 'Till system has not synced', meta: 'Lisbon \u00b7 Connection', href: 'Operations.dc.html?issue=lisbon-sync' },
    { id: 'ops:hamburg-pos', group: 'ops', title: '2 card terminals are offline', meta: 'Hamburg \u00b7 Equipment', href: 'Operations.dc.html?issue=hamburg-pos' },
    { id: 'inv:takeaway-cups@amsterdam', group: 'stock', title: 'Takeaway cups', meta: 'Amsterdam \u00b7 Out of stock', href: 'Inventory.dc.html?product=takeaway-cups&location=amsterdam' },
    { id: 'inv:espresso-beans@copenhagen', group: 'stock', title: 'Espresso beans', meta: 'Copenhagen \u00b7 Critical \u00b7 2.1 kg on hand', href: 'Inventory.dc.html?product=espresso-beans&location=copenhagen' },
    { id: 'inv:oat-milk@amsterdam', group: 'stock', title: 'Oat milk', meta: 'Amsterdam \u00b7 Low \u00b7 11 L on hand', href: 'Inventory.dc.html?product=oat-milk&location=amsterdam' },
  ];
  const GROUPS = [{ id: 'ops', label: 'Operations issues', all: 'Operations.dc.html', allLabel: 'Open Operations' }, { id: 'stock', label: 'Low stock', all: 'Inventory.dc.html', allLabel: 'Open Inventory' }];
  const USER = { name: 'Anna Weber', initials: 'AW', role: 'Owner \u00b7 North & Oak' };

  const listeners = new Set();
  const notifState = () => ({ read: ss.get('read', []), cleared: ss.get('cleared', []) });
  const emit = () => listeners.forEach(fn => fn());

  const BASE_CSS = `
    *{box-sizing:border-box}
    [hidden]{display:none!important}
    :focus-visible{outline:2px solid ${ACC};outline-offset:2px}
    button{font-family:inherit}
    .pop{position:fixed;z-index:60;background:#fff;border:1px solid oklch(90% 0.006 270);border-radius:14px;box-shadow:0 12px 32px oklch(20% 0.02 270 / 0.12);padding:8px;display:flex;flex-direction:column;gap:1px;max-height:calc(100vh - 72px);overflow-y:auto;color:oklch(22% 0.012 270)}
    .mi{display:flex;align-items:center;gap:8px;width:100%;min-height:36px;padding:7px 9px;border:0;border-radius:9px;background:transparent;font-size:12.5px;font-weight:500;line-height:1.3;color:oklch(26% 0.012 270);text-align:left;text-decoration:none;cursor:pointer}
    .mi:hover{background:oklch(96.5% 0.004 270);color:oklch(18% 0.012 270)}
    .mi:focus-visible{outline-offset:-2px;background:oklch(96.5% 0.004 270)}
    .mi[aria-disabled="true"]{color:oklch(50% 0.012 270);cursor:default}
    .mi[aria-disabled="true"]:hover{background:transparent;color:oklch(50% 0.012 270)}
    .tag{margin-left:auto;font-size:11px;font-weight:500;color:oklch(46% 0.013 270);background:oklch(95% 0.004 270);border-radius:5px;padding:1px 6px;white-space:nowrap}
    .sep{height:1px;background:oklch(95% 0.004 270);margin:5px 2px}
    .head{font-size:10px;font-weight:600;letter-spacing:.09em;text-transform:uppercase;color:oklch(50% 0.013 270);padding:8px 9px 5px}
    .primary{height:36px;padding:0 16px;border-radius:8px;border:1px solid ${ACC};background:${ACC};color:#fff;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap}
    .primary:hover{background:oklch(48% 0.19 258);border-color:oklch(48% 0.19 258)}
    .ghost{height:36px;padding:0 14px;border-radius:8px;border:1px solid oklch(89% 0.006 270);background:#fff;color:oklch(30% 0.012 270);font-size:12.5px;font-weight:500;cursor:pointer;white-space:nowrap;text-decoration:none;display:inline-flex;align-items:center}
    .ghost:hover{border-color:oklch(78% 0.008 270)}
    .ghost:disabled{color:oklch(62% 0.008 270);cursor:default}
    .ghost:disabled:hover{border-color:oklch(89% 0.006 270)}
    .x{width:28px;height:28px;flex-shrink:0;border:0;border-radius:7px;background:transparent;font-size:17px;line-height:1;color:oklch(48% 0.012 270);cursor:pointer}
    .x:hover{background:oklch(95% 0.004 270);color:oklch(22% 0.012 270)}
  `;
  const ICON = {
    search: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="oklch(47% 0.013 270)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex-shrink:0"><circle cx="7" cy="7" r="4.6"></circle><line x1="10.4" y1="10.4" x2="14" y2="14"></line></svg>',
    bell: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="oklch(48% 0.012 270)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex-shrink:0"><path d="M4 6.6a4 4 0 0 1 8 0c0 2.4.5 3.6 1.2 4.4H2.8C3.5 10.2 4 9 4 6.6Z"></path><path d="M6.6 13.2a1.6 1.6 0 0 0 2.8 0"></path></svg>',
  };

  // ---------- Overlays (tour + demo sign-out) live in one body-level host ----------
  let overlayRoot = null;
  function overlay() {
    if (overlayRoot) return overlayRoot;
    const host = document.createElement('op-shell-overlay');
    host.style.cssText = 'position:relative;z-index:1000';
    document.body.appendChild(host);
    overlayRoot = host.attachShadow({ mode: 'open' });
    overlayRoot.innerHTML = '<style>' + BASE_CSS + `
      .card{position:fixed;z-index:1002;width:min(360px,calc(100vw - 24px));background:#fff;border:1px solid oklch(90% 0.006 270);border-radius:14px;box-shadow:0 24px 60px -12px oklch(20% 0.02 270 / 0.3),0 2px 6px oklch(20% 0.02 270 / 0.08);font-family:'Inter',system-ui,sans-serif;color:oklch(22% 0.012 270);-webkit-font-smoothing:antialiased}
      .ring{position:fixed;z-index:1001;border-radius:10px;box-shadow:0 0 0 3px ${ACC},0 0 0 9999px oklch(20% 0.02 270 / 0.32);pointer-events:none;transition:all .2s ease}
      .dim{position:fixed;inset:0;z-index:1001;background:oklch(20% 0.02 270 / 0.32)}
      .out{position:fixed;inset:0;z-index:1003;background:oklch(94.6% 0.004 270);display:flex;align-items:center;justify-content:center;padding:16px;font-family:'Inter',system-ui,sans-serif;color:oklch(22% 0.012 270);-webkit-font-smoothing:antialiased}
    </style><div id="tour"></div><div id="out"></div>`;
    return overlayRoot;
  }
  const focusables = el => [...el.querySelectorAll('a[href],button:not([disabled]),input,[tabindex="0"]')];
  function trap(e, el) {
    if (e.key !== 'Tab') return;
    const f = focusables(el); if (!f.length) return;
    const a = el.getRootNode().activeElement;
    if (e.shiftKey && a === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && a === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  }

  // ---------- Tour ----------
  const STEPS = [
    { title: 'Welcome to Branchline', body: 'A short tour of where things live. Close it at any time and restart it from the help menu.' },
    { sel: 'aside a[href="Overview.dc.html"]', title: 'Overview', body: 'The group-wide summary of performance across all 12 locations.', href: 'Overview.dc.html' },
    { sel: 'aside a[href="Operations.dc.html"]', title: 'Operations', body: 'Live issues by location, such as staffing, stock, equipment, deliveries and connectivity, with owners and next actions.', href: 'Operations.dc.html' },
    { sel: 'aside a[href="Inventory.dc.html"]', title: 'Inventory', body: 'Stock by product and location, checked against reorder levels and the next delivery.', href: 'Inventory.dc.html' },
    { sel: 'aside a[href="Location Analytics.dc.html"]', title: 'Location analytics and Reports', body: 'Look at one location in depth, or open the sales, location and category reports.', href: 'Reports.dc.html', hrefLabel: 'Open Reports' },
    { sel: 'aside a[href="Employees.dc.html"]', title: 'Employees, Locations and Customers', body: 'Manage your team and their access, the location roster and customer records.', href: 'Employees.dc.html', hrefLabel: 'Open Employees' },
    { sel: 'op-header-tools', title: 'Search, help and notifications', body: 'Search the platform, reopen this tour from the help menu, review open issues and low stock, and manage your account.' },
    { sel: 'aside a[href="Settings.dc.html"]', title: 'Settings', body: 'Your business profile, regional defaults and receipt settings.', href: 'Settings.dc.html' },
  ];
  let tourIdx = -1, tourReturn = null;
  const visibleRect = el => { if (!el) return null; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight ? r : null; };
  function renderTour() {
    const root = overlay(), box = root.getElementById('tour');
    if (tourIdx < 0) { box.innerHTML = ''; return; }
    const st = STEPS[tourIdx], n = STEPS.length, last = tourIdx === n - 1;
    const target = st.sel ? document.querySelector(st.sel) : null, r = visibleRect(target);
    const link = st.href && !location.pathname.endsWith('/' + encodeURI(st.href)) && decodeURIComponent(location.pathname).split('/').pop() !== st.href;
    box.innerHTML = (r ? `<div class="ring" style="left:${r.left - 4}px;top:${r.top - 4}px;width:${r.width + 8}px;height:${r.height + 8}px"></div>` : '<div class="dim"></div>') +
      `<div class="card" role="dialog" aria-modal="true" aria-labelledby="tour-t" aria-describedby="tour-b">
        <div style="display:flex;align-items:flex-start;gap:10px;padding:16px 16px 0 18px">
          <div style="display:flex;flex-direction:column;gap:4px;flex:1;min-width:0">
            <span style="font-size:11px;font-weight:600;color:oklch(50% 0.013 270);font-variant-numeric:tabular-nums">Step ${tourIdx + 1} of ${n}</span>
            <h2 id="tour-t" style="margin:0;font-size:16px;font-weight:600;letter-spacing:-.014em;line-height:1.3">${esc(st.title)}</h2>
          </div>
          <button type="button" class="x" data-act="close" aria-label="Close tour">&#215;</button>
        </div>
        <p id="tour-b" style="margin:8px 18px 0;font-size:13px;line-height:1.55;color:oklch(38% 0.012 270);text-wrap:pretty">${esc(st.body)}</p>
        ${link ? `<a href="${esc(st.href)}" data-act="go" style="display:inline-flex;margin:10px 18px 0;font-size:12.5px;font-weight:500;color:${ACC};text-decoration:none">${esc(st.hrefLabel || 'Open ' + st.title)} &#8594;</a>` : ''}
        <div style="display:flex;align-items:center;gap:8px;padding:14px 16px 16px 18px;margin-top:6px">
          <div aria-hidden="true" style="display:flex;gap:4px;margin-right:auto">${STEPS.map((_, i) => `<span style="width:6px;height:6px;border-radius:50%;background:${i === tourIdx ? ACC : 'oklch(88% 0.006 270)'}"></span>`).join('')}</div>
          ${tourIdx > 0 ? '<button type="button" class="ghost" data-act="back">Back</button>' : ''}
          <button type="button" class="primary" data-act="${last ? 'close' : 'next'}">${last ? 'Finish' : 'Next'}</button>
        </div>
      </div>`;
    const card = box.querySelector('.card');
    const W = card.offsetWidth, H = card.offsetHeight, vw = innerWidth, vh = innerHeight;
    let left, top;
    if (r && r.right + 16 + W <= vw - 12) { left = r.right + 16; top = Math.min(Math.max(12, r.top + r.height / 2 - H / 2), vh - H - 12); }
    else if (r && r.bottom + 12 + H <= vh - 12) { left = Math.min(Math.max(12, r.right - W), vw - W - 12); top = r.bottom + 12; }
    else { left = (vw - W) / 2; top = Math.max(12, vh - H - 24); }
    card.style.left = left + 'px'; card.style.top = top + 'px';
    card.onclick = e => {
      const a = e.target.closest('[data-act]'); if (!a) return;
      const act = a.dataset.act;
      if (act === 'next') { tourIdx++; renderTour(); focusPrimary(); }
      else if (act === 'back') { tourIdx--; renderTour(); focusPrimary(); }
      else if (act === 'close') endTour();
      else if (act === 'go') { tourIdx = -1; }
    };
    card.onkeydown = e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); endTour(); } else trap(e, card); };
  }
  function focusPrimary() { const p = overlay().querySelector('#tour .primary'); if (p) p.focus(); }
  function startTour() {
    closeAllMenus();
    tourReturn = document.activeElement && document.activeElement !== document.body ? document.activeElement : null;
    const deep = active => { let a = active; while (a && a.shadowRoot && a.shadowRoot.activeElement) a = a.shadowRoot.activeElement; return a; };
    tourReturn = deep(tourReturn) || tourReturn;
    tourIdx = 0; renderTour(); focusPrimary();
  }
  function endTour() { tourIdx = -1; renderTour(); const r = tourReturn; tourReturn = null; if (r && r.isConnected) r.focus(); }
  addEventListener('resize', () => { if (tourIdx >= 0) renderTour(); });
  addEventListener('scroll', () => { if (tourIdx >= 0) renderTour(); }, { passive: true });
  document.addEventListener('click', e => {
    const t = e.target.closest && e.target.closest('[data-op-tour]');
    if (!t) return;
    e.preventDefault(); startTour();
  });

  // ---------- Demo sign-out ----------
  function renderSignedOut() {
    const root = overlay(), box = root.getElementById('out');
    if (!ss.get('signedOut', false)) { box.innerHTML = ''; document.documentElement.style.overflow = ''; return; }
    document.documentElement.style.overflow = 'hidden';
    box.innerHTML = `<div class="out" role="dialog" aria-modal="true" aria-labelledby="out-t" aria-describedby="out-b">
      <div style="width:100%;max-width:400px;background:#fff;border:1px solid oklch(90.5% 0.006 270);border-radius:14px;box-shadow:0 1px 2px oklch(25% 0.02 265 / 0.05),0 10px 28px -12px oklch(25% 0.02 265 / 0.14);padding:28px 24px 24px;display:flex;flex-direction:column;gap:14px">
        <div style="display:flex;align-items:center;gap:9px"><svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" style="flex-shrink:0;display:block"><rect width="24" height="24" rx="6" fill="oklch(54% 0.19 258)"></rect><path d="M9 7v10M9 14.5c0-3.5 2.4-5.5 6.5-5.5" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"></path><circle cx="9" cy="6.5" r="2.2" fill="#fff"></circle><circle cx="9" cy="17.5" r="2.2" fill="#fff"></circle><circle cx="16" cy="9" r="2.2" fill="#fff"></circle></svg><span style="font-size:13.5px;font-weight:700;letter-spacing:-.01em;color:oklch(28% 0.012 270)">Branchline</span></div>
        <h1 id="out-t" style="margin:6px 0 0;font-size:21px;font-weight:600;letter-spacing:-.024em;line-height:1.2;color:oklch(16% 0.012 270)">You\u2019re signed out</h1>
        <p id="out-b" style="margin:0;font-size:13px;line-height:1.55;color:oklch(40% 0.012 270);text-wrap:pretty">This is a demonstration sign-out. The prototype has no real accounts or sessions, so nothing was ended or sent anywhere.</p>
        <div style="display:flex;padding-top:4px"><button type="button" class="primary" data-act="back">Return to the demo workspace</button></div>
      </div></div>`;
    const d = box.querySelector('.out');
    d.onclick = e => { if (e.target.closest('[data-act="back"]')) { ss.del('signedOut'); renderSignedOut(); const t = document.querySelector('op-header-tools'); if (t && t.focusAvatar) t.focusAvatar(); } };
    d.onkeydown = e => trap(e, d);
    const b = d.querySelector('.primary'); if (b) b.focus();
  }
  function signOut() { closeAllMenus(); if (tourIdx >= 0) { tourIdx = -1; renderTour(); } ss.set('signedOut', true); renderSignedOut(); }

  // ---------- Header tools ----------
  const instances = new Set();
  function closeAllMenus() { instances.forEach(i => i.close(null, false)); }

  class OpHeaderTools extends HTMLElement {
    connectedCallback() {
      if (this._root) return;
      instances.add(this);
      // The import wrapper is the header's flex item: let it fill the row but never shrink below the controls.
      const w = this.parentElement; if (w && w.tagName !== 'HEADER') { w.style.flex = '1 0 auto'; w.style.display = 'flex'; w.style.alignItems = 'center'; }
      this._mq = matchMedia(NARROW);
      const root = this._root = this.attachShadow({ mode: 'open' });
      root.innerHTML = '<style>' + BASE_CSS + `
        :host{display:flex;align-items:center;gap:16px;width:100%;min-width:0;height:52px}
        .search{flex:1;min-width:0;max-width:420px;display:flex;align-items:center;gap:8px;background:#fff;border:1px solid oklch(91% 0.006 270);border-radius:9px;padding:6px 11px}
        .search:focus-within{border-color:oklch(80% 0.04 258);box-shadow:0 0 0 3px oklch(54% 0.19 258 / 0.14)}
        .search input{border:none;outline:none;background:transparent;font-family:inherit;font-size:12.5px;color:oklch(22% 0.012 270);width:100%;min-width:0}
        .search input::placeholder{color:oklch(66% 0.008 270)}
        .kbd{font-size:10.5px;background:oklch(96.5% 0.004 270);border-radius:5px;padding:1px 5px;flex-shrink:0;color:oklch(52% 0.012 270)}
        .tools{margin-left:auto;display:flex;align-items:center;gap:8px;flex-shrink:0}
        .ib{position:relative;width:32px;height:32px;border-radius:9px;background:#fff;border:1px solid oklch(91% 0.006 270);display:inline-flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;color:oklch(50% 0.01 270);cursor:pointer;padding:0}
        .ib:hover{border-color:oklch(84% 0.008 270);color:oklch(28% 0.012 270)}
        .ib[aria-expanded="true"]{border-color:oklch(80% 0.01 270);background:oklch(98.4% 0.003 270)}
        .dot{position:absolute;top:5px;right:6px;width:6px;height:6px;border-radius:50%;background:${ACC};border:1.5px solid #fff;box-sizing:content-box}
        .av{display:inline-flex;align-items:center;gap:8px;height:32px;padding:0 4px 0 2px;border:0;border-radius:9px;background:transparent;cursor:pointer}
        .av:hover{background:oklch(92% 0.005 270)}
        .av[aria-expanded="true"]{background:oklch(91.5% 0.005 270)}
        .avc{width:28px;height:28px;flex-shrink:0;border-radius:50%;background:oklch(86% 0.014 265);box-shadow:inset 0 0 0 1px oklch(80% 0.014 265);display:inline-flex;align-items:center;justify-content:center;font-size:10.5px;font-weight:600;letter-spacing:.01em;color:oklch(32% 0.02 265)}
        .vr{width:1px;height:20px;background:oklch(90.5% 0.006 270);margin:0 2px}
        .sover{position:fixed;left:0;right:0;top:0;height:52px;z-index:40;background:oklch(94.6% 0.004 270);border-bottom:1px solid oklch(90.5% 0.006 270);display:flex;align-items:center;gap:8px;padding:0 12px}
        .ni{display:grid;grid-template-columns:8px minmax(0,1fr);column-gap:10px;align-items:start;width:100%;padding:8px 9px;border-radius:9px;text-decoration:none;color:inherit}
        .ni:hover{background:oklch(96.5% 0.004 270)}
        .ni:focus-visible{outline-offset:-2px;background:oklch(96.5% 0.004 270)}
        .nd{width:7px;height:7px;border-radius:50%;margin-top:5px}
        .lnk{font-size:11.5px;font-weight:500;color:${ACC};text-decoration:none;border-radius:5px;padding:2px 4px}
        .lnk:hover{color:oklch(46% 0.19 258)}
        .tb{height:28px;padding:0 8px;border:0;border-radius:7px;background:transparent;font-size:12px;font-weight:500;color:${ACC};cursor:pointer;white-space:nowrap}
        .tb:hover{background:oklch(96.5% 0.012 258)}
        .tb:disabled{color:oklch(62% 0.008 270);cursor:default;background:transparent}
      </style>
      <label class="search" id="sfull"><span style="display:contents">${ICON.search}</span><input type="text" id="sinput" aria-label="Search" placeholder="Search locations, products, employees"><span class="kbd" aria-hidden="true">&#8984;K</span></label>
      <div class="tools">
        <button type="button" class="ib" id="sbtn" aria-label="Search" aria-expanded="false" hidden>${ICON.search}</button>
        <button type="button" class="ib" id="help" aria-label="Help" aria-haspopup="menu" aria-expanded="false" aria-controls="m-help">?</button>
        <button type="button" class="ib" id="notif" aria-haspopup="dialog" aria-expanded="false" aria-controls="m-notif">${ICON.bell}<span class="dot" id="ndot" hidden></span></button>
        <div class="vr" aria-hidden="true"></div>
        <button type="button" class="av" id="acct" aria-label="Account menu, ${USER.name}" aria-haspopup="menu" aria-expanded="false" aria-controls="m-acct"><span class="avc" aria-hidden="true">${USER.initials}</span><span aria-hidden="true" style="font-size:11px;color:oklch(45% 0.012 270)">&#9662;</span></button>
      </div>
      <div id="pops"></div>`;
      this.$ = id => root.getElementById(id);
      this._open = null;
      this.$('help').onclick = () => this.toggle('help');
      this.$('notif').onclick = () => this.toggle('notif');
      this.$('acct').onclick = () => this.toggle('acct');
      this.$('sbtn').onclick = () => this.toggle('search');
      ['help', 'notif', 'acct'].forEach(k => this.$(k).addEventListener('keydown', e => { if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && this._open !== k) { e.preventDefault(); this.open(k); } }));
      this._onMq = () => { this.applyNarrow(); };
      this._mq.addEventListener('change', this._onMq);
      this._onDown = e => { if (!this._open) return; const p = e.composedPath(); const pop = this.$('pops').firstElementChild, btn = this.btnFor(this._open); if ((pop && p.includes(pop)) || (btn && p.includes(btn))) return; this.close(null, false); };
      document.addEventListener('mousedown', this._onDown);
      this._onKey = e => {
        if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); if (this._mq.matches) this.open('search'); else this.$('sinput').focus(); }
      };
      document.addEventListener('keydown', this._onKey);
      this._onResize = () => { if (this._open) this.place(); };
      addEventListener('resize', this._onResize);
      this._onNotif = () => this.renderDot();
      listeners.add(this._onNotif);
      this.applyNarrow(); this.renderDot();
    }
    disconnectedCallback() {
      instances.delete(this); listeners.delete(this._onNotif);
      document.removeEventListener('mousedown', this._onDown); document.removeEventListener('keydown', this._onKey); removeEventListener('resize', this._onResize);
      if (this._mq) this._mq.removeEventListener('change', this._onMq);
    }
    focusAvatar() { const b = this.$('acct'); if (b) b.focus(); }
    applyNarrow() { const n = this._mq.matches; this.$('sfull').hidden = n; this.$('sfull').style.display = n ? 'none' : ''; this.$('sbtn').hidden = !n; if (!n && this._open === 'search') this.close(null, false); }
    btnFor(k) { return this.$({ help: 'help', notif: 'notif', acct: 'acct', search: 'sbtn' }[k]); }
    unread() { const s = notifState(); return NOTIFS.filter(n => !s.cleared.includes(n.id) && !s.read.includes(n.id)); }
    renderDot() {
      const u = this.unread().length;
      this.$('ndot').hidden = u === 0;
      this.$('notif').setAttribute('aria-label', u ? 'Notifications, ' + u + ' unread' : 'Notifications, none unread');
      if (this._open === 'notif') this.renderNotif(true);
    }
    toggle(k) { if (this._open === k) this.close(null, true); else this.open(k); }
    open(k) {
      closeAllMenus();
      this._open = k; const b = this.btnFor(k); b.setAttribute('aria-expanded', 'true');
      if (k === 'help') this.renderHelp(); else if (k === 'acct') this.renderAcct(); else if (k === 'notif') this.renderNotif(); else this.renderSearch();
      if (k !== 'search') { this.place(); const f = this.items()[0]; if (f) f.focus(); }
    }
    close(_, refocus) {
      const k = this._open; if (!k) return;
      this._open = null; const b = this.btnFor(k); if (b) b.setAttribute('aria-expanded', 'false');
      this.$('pops').innerHTML = '';
      if (refocus && b) b.focus();
    }
    items() { const p = this.$('pops').firstElementChild; return p ? [...p.querySelectorAll('[data-nav]')].filter(el => !el.disabled) : []; }
    place() {
      const p = this.$('pops').firstElementChild, b = this.btnFor(this._open); if (!p || !b || this._open === 'search') return;
      const r = b.getBoundingClientRect(), vw = document.documentElement.clientWidth, w = Math.min(p.offsetWidth, vw - 16);
      p.style.maxWidth = (vw - 16) + 'px';
      p.style.top = (r.bottom + 8) + 'px';
      p.style.left = Math.max(8, Math.min(r.right - w, vw - w - 8)) + 'px';
    }
    menuKeys(el) {
      el.addEventListener('keydown', e => {
        const items = this.items(), a = this._root.activeElement, i = items.indexOf(a), n = items.length;
        const go = j => { e.preventDefault(); if (n) items[(j + n) % n].focus(); };
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); this.close(null, true); }
        else if (e.key === 'Tab' && el.getAttribute('role') === 'menu') { this.close(null, false); }
        else if (e.key === 'ArrowDown') go(i < 0 ? 0 : i + 1);
        else if (e.key === 'ArrowUp') go(i < 0 ? n - 1 : i - 1);
        else if (e.key === 'Home') go(0);
        else if (e.key === 'End') go(n - 1);
        else if (e.key === 'Tab' && !e.shiftKey && a === items[n - 1]) { this.close(null, false); }
      });
    }
    renderHelp() {
      const box = this.$('pops');
      box.innerHTML = `<div class="pop" id="m-help" role="menu" aria-label="Help" style="width:248px">
        <button type="button" class="mi" role="menuitem" data-nav data-act="tour" tabindex="-1">Take the tour</button>
        <div class="sep" role="separator"></div>
        <div class="mi" role="menuitem" aria-disabled="true" data-nav tabindex="-1">Help center<span class="tag">Planned</span></div>
        <div class="mi" role="menuitem" aria-disabled="true" data-nav tabindex="-1">Contact support<span class="tag">Planned</span></div>
      </div>`;
      const m = box.firstElementChild; this.menuKeys(m);
      m.addEventListener('click', e => { const t = e.target.closest('[data-act="tour"]'); if (t) { this.close(null, false); startTour(); } });
      m.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && this._root.activeElement && this._root.activeElement.getAttribute('aria-disabled') === 'true') e.preventDefault(); });
    }
    renderAcct() {
      const box = this.$('pops');
      box.innerHTML = `<div class="pop" id="m-acct" role="menu" aria-label="Account" style="width:248px">
        <div style="display:flex;align-items:center;gap:10px;padding:8px 9px 10px">
          <span class="avc" aria-hidden="true" style="width:32px;height:32px;border-radius:50%;background:oklch(86% 0.014 265);box-shadow:inset 0 0 0 1px oklch(80% 0.014 265);display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;color:oklch(32% 0.02 265);flex-shrink:0">${USER.initials}</span>
          <span style="display:flex;flex-direction:column;gap:2px;min-width:0"><span style="font-size:13px;font-weight:600;color:oklch(18% 0.012 270)">${esc(USER.name)}</span><span style="font-size:11.5px;color:oklch(48% 0.013 270)">${esc(USER.role)}</span></span>
        </div>
        <div class="sep" role="separator"></div>
        <a class="mi" role="menuitem" data-nav tabindex="-1" href="Settings.dc.html?section=account">Account settings</a>
        <button type="button" class="mi" role="menuitem" data-nav data-act="out" tabindex="-1">Sign out<span class="tag">Demo</span></button>
      </div>`;
      const m = box.firstElementChild; this.menuKeys(m);
      m.addEventListener('click', e => { if (e.target.closest('[data-act="out"]')) { this.close(null, false); signOut(); } });
    }
    renderNotif(keepFocus) {
      const box = this.$('pops'), s = notifState(), list = NOTIFS.filter(n => !s.cleared.includes(n.id));
      const prevId = keepFocus && this._root.activeElement ? this._root.activeElement.dataset.id || this._root.activeElement.id : null;
      const unread = list.filter(n => !s.read.includes(n.id)).length, anyRead = list.some(n => s.read.includes(n.id));
      const groups = GROUPS.map(g => {
        const items = list.filter(n => n.group === g.id); if (!items.length) return '';
        return `<div role="group" aria-label="${g.label}" style="display:flex;flex-direction:column;gap:1px">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 9px 4px"><span class="head" style="padding:0">${g.label}</span><a class="lnk" data-nav href="${g.all}">${g.allLabel}</a></div>
          ${items.map(n => { const isRead = s.read.includes(n.id); return `<a class="ni" data-nav data-id="${esc(n.id)}" href="${esc(n.href)}" aria-label="${esc((isRead ? '' : 'Unread. ') + n.title + ', ' + n.meta)}">
            <span class="nd" style="background:${isRead ? 'transparent' : ACC}"></span>
            <span style="display:flex;flex-direction:column;gap:2px;min-width:0"><span style="font-size:12.5px;line-height:1.35;font-weight:${isRead ? 500 : 600};color:${isRead ? 'oklch(40% 0.012 270)' : 'oklch(18% 0.012 270)'}">${esc(n.title)}</span><span style="font-size:11.5px;color:oklch(50% 0.013 270)">${esc(n.meta)}</span></span></a>`; }).join('')}
        </div>`;
      }).join('<div class="sep"></div>');
      const empty = `<div style="display:flex;flex-direction:column;gap:8px;padding:14px 9px 10px"><span style="font-size:13px;font-weight:600;color:oklch(22% 0.012 270)">No notifications</span><span style="font-size:12px;line-height:1.5;color:oklch(46% 0.013 270);text-wrap:pretty">Open issues from Operations and low stock from Inventory appear here.</span>
        <div style="display:flex;gap:6px;flex-wrap:wrap;padding-top:2px"><a class="lnk" data-nav href="Operations.dc.html">Open Operations</a><a class="lnk" data-nav href="Inventory.dc.html">Open Inventory</a><button type="button" class="tb" data-nav data-act="reset">Restore demo notifications</button></div></div>`;
      box.innerHTML = `<div class="pop" id="m-notif" role="dialog" aria-label="Notifications" style="width:340px;padding:6px 6px 8px">
        <div style="display:flex;align-items:center;gap:8px;padding:6px 6px 6px 9px"><span style="font-size:13.5px;font-weight:600;color:oklch(18% 0.012 270)">Notifications</span><span style="font-size:11.5px;color:oklch(50% 0.013 270)">${unread ? unread + ' unread' : ''}</span>
          <button type="button" class="tb" data-nav data-act="all" style="margin-left:auto" ${unread ? '' : 'disabled'}>Mark all as read</button></div>
        <div class="sep" style="margin-top:2px"></div>
        ${list.length ? groups : empty}
        ${list.length ? `<div class="sep"></div><div style="display:flex;align-items:center;gap:8px;padding:4px 3px 0 9px"><span style="font-size:11px;line-height:1.4;color:oklch(52% 0.012 270);flex:1;min-width:0">Demo data from Operations and Inventory. Read state lasts for this browser session.</span><button type="button" class="tb" data-nav data-act="clear" ${anyRead ? '' : 'disabled'}>Clear read</button></div>` : ''}
      </div>`;
      const m = box.firstElementChild; this.menuKeys(m);
      m.addEventListener('click', e => {
        const a = e.target.closest('[data-act]'), it = e.target.closest('a.ni');
        if (it) { const st = notifState(); if (!st.read.includes(it.dataset.id)) { ss.set('read', st.read.concat(it.dataset.id)); emit(); } return; }
        if (!a) return;
        const st = notifState();
        if (a.dataset.act === 'all') ss.set('read', NOTIFS.map(n => n.id));
        else if (a.dataset.act === 'clear') ss.set('cleared', st.cleared.concat(st.read.filter(id => !st.cleared.includes(id))));
        else if (a.dataset.act === 'reset') { ss.del('read'); ss.del('cleared'); }
        this.renderNotif(); emit(); this.place();
        const f = this.items()[0]; if (f) f.focus();
      });
      if (keepFocus) { this.place(); const el = prevId && (m.querySelector('[data-id="' + prevId + '"]')); if (el) el.focus(); }
    }
    renderSearch() {
      const box = this.$('pops');
      box.innerHTML = `<div class="sover" role="search">
        <label class="search" style="max-width:none;flex:1">${ICON.search}<input type="text" id="sinput2" aria-label="Search" placeholder="Search locations, products, employees"></label>
        <button type="button" class="ghost" data-act="cancel" style="height:34px">Cancel</button></div>`;
      const o = box.firstElementChild;
      o.addEventListener('click', e => { if (e.target.closest('[data-act="cancel"]')) this.close(null, true); });
      o.addEventListener('keydown', e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); this.close(null, true); } });
      const i = this.$('sinput2'); i.focus();
    }
  }
  customElements.define('op-header-tools', OpHeaderTools);

  window.OpShell = { startTour, signOut, NOTIFS };
  const boot = () => { if (ss.get('signedOut', false)) renderSignedOut(); };
  if (document.body) boot(); else document.addEventListener('DOMContentLoaded', boot);
})();
