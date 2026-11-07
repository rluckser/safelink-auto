// ==UserScript==
// @name         SafelinkEarn Auto - Skip + Percepat Timer (1 Script)
// @namespace    https://emu.local/safelink-auto-combined
// @version      3.0.0
// @description  Gabungan Timer Speeder v1.1 + Skipper v2.4 dalam 1 script, otomatis penuh: percepat timer 10x, blokir popup iklan, klik Continue / Click to Verify 2x, tunggu timer (yang sudah dipercepat), scroll otomatis, klik Next, Go to Next Step / Click Here to Continue, sampai Open Link. Ringan untuk Firefox (tanpa MutationObserver berat).
// @author       Emu untuk Jil
// @match        *://*/*
// @grant        none
// @run-at       document-start
// @license      MIT
// @updateURL    https://github.com/rluckser/safelink-auto/raw/main/safelink-auto-combined.user.js
// @downloadURL  https://github.com/rluckser/safelink-auto/raw/main/safelink-auto-combined.user.js
// ==/UserScript==
//
// GABUNGAN v3.0.0 - dibuat 2026-11-07 atas permintaan Jil setelah kedua
// script terpisah (Timer Speeder v1.1 + Skipper v2.4) sudah bisa jalan.
// Satu script ini = kedua fungsi itu, otomatis, tanpa perlu 2 script aktif.
//
// ALUR OTOMATIS (sudah diverifikasi live di demo 2026-11-07):
//  Start (/v/start): "Please wait 3" -> "Click here to continue" / "Continue →"
//    Klik 2x (klik 1 popup iklan Shopee/Stake diblokir, klik 2 maju).
//  Step 1/3, 2/3, 3/3 (atau "Step 1 of 3"):
//    "Click to Verify >>" / "Click to Continue" -> timer 11 / 7 detik (KALAU ADA,
//    dipercepat 10x jadi ~1 detik) -> "Scroll down to continue"
//    -> scroll ke bawah -> "Next" -> timer 5 detik (dipercepat) ->
//    "Go to the Next Step" / "Click Here to Continue" -> Step berikutnya.
//    Tombol "DOWNLOAD CLICK 2X" TIDAK PERNAH diklik (decoy/iklan).
//  Step 3 akhir: bisa pindah domain (crm -> insurance.cekresi.me), tanpa tombol
//    Verify, langsung "Scroll down to continue", tombol akhir oranye "Open Link"
//    (JS, tanpa href). Script mengkliknya juga (2x, seperti tombol lain).
//
// DOMAIN BEROTASI (terkonfirmasi): link sfe.ad yang sama bisa mendarat di
//  invest.datapendidikan.com atau crm.urlwebsite.com, dan Step 3 bisa pindah
//  lagi ke insurance.cekresi.me. Script ini TIDAK mengunci domain - aktif
//  kalau halaman cocok pola SafelinkEarn (judul / /v/start / Step X/3 / Step X of 3).
//
// PERFORMA (pelajaran dari crash Firefox v1.0):
//  - Override timer HANYA dipasang setelah halaman terbukti SafelinkEarn.
//    Di situs lain script langsung berhenti.
//  - Timer internal (polling, jeda klik) memakai fungsi ASLI, tidak ikut dipercepat.
//  - Tanpa MutationObserver berat. Polling 1 detik saja.
//  - Hanya delay >= 1000ms yang dipercepat. Delay cepat dibiarkan normal.
//  - Date.now HANYA di-override kalau Jil menyalakan "Jam dipercepat" di panel.
//  - killAdblockModal maksimal 1x per 2 detik, hanya untuk modal fixed.
//
// PANEL (kiri bawah): status + timer yang terdeteksi + tombol:
//  [Percepat: ON/OFF] [Auto-klik: ON/OFF] [2x] [5x] [10x] [Jam: OFF/ON]
//  - Matikan "Percepat" kalau mau timer normal tapi tetap auto-klik.
//  - Matikan "Auto-klik" kalau mau klik sendiri tapi timer tetap dipercepat.
//  - Default: keduanya ON, kecepatan 10x.

(function () {
  'use strict';

  // Simpan fungsi ASLI dulu. Semua timer internal HARUS pakai ini.
  const origSetTimeout = window.setTimeout.bind(window);
  const origSetInterval = window.setInterval.bind(window);
  const origClearTimeout = window.clearTimeout.bind(window);
  const origClearInterval = window.clearInterval.bind(window);
  const origDateNow = Date.now.bind(Date);
  const origPerfNow = (window.performance && performance.now) ? performance.now.bind(performance) : null;

  let SPEED = 10;
  let speedEnabled = true;   // percepat timer
  let autoEnabled = true;    // auto-klik lanjut
  let clockEnabled = false;  // percepat Date.now (eksperimental, default OFF)
  let overrideInstalled = false;
  let started = false;

  const DEBUG = false;
  const log = (...a) => { if (DEBUG) console.log('[SafelinkEarn Auto]', ...a); };
  const sleepOrig = (ms) => new Promise(r => origSetTimeout(r, ms));

  // ------------------------------------------------------------
  // 0. DETEKSI POLA (murah, tanpa innerText seluruh body)
  // ------------------------------------------------------------
  function bodySnippet() {
    return document.body ? (document.body.textContent || '').slice(0, 8000) : '';
  }
  function isSafelinkEarnPage() {
    const host = location.hostname.toLowerCase();
    if (host.includes('sfe.ad')) return true;
    if (location.pathname.includes('/v/start')) return true;
    if (/safelinkearn/i.test(document.title || '')) return true;
    if (!document.body) return false;
    const t = bodySnippet();
    if (/Step\s*\d+\s*(?:\/|of)\s*\d+/i.test(t) &&
        /click to (verify|continue)|click here to continue|go to the next step|open link|scroll down to continue|please wait/i.test(t)) return true;
    if (/verify you are human/i.test(t)) return true;
    if (/please wait a moment to get your link/i.test(t)) return true;
    return false;
  }

  // ------------------------------------------------------------
  // 1. PERCEPAT TIMER - pasang hanya kalau SafelinkEarn
  // ------------------------------------------------------------
  function scaleDelay(delay) {
    if (!speedEnabled || !overrideInstalled) return delay;
    if (typeof delay !== 'number' || isNaN(delay)) return delay;
    if (delay < 1000) return delay;
    return Math.max(100, Math.floor(delay / SPEED));
  }
  function installOverride() {
    if (overrideInstalled) return;
    overrideInstalled = true;
    log('Timer override dipasang di', location.hostname);
    window.setTimeout = function (fn, delay, ...args) {
      return origSetTimeout(fn, scaleDelay(delay), ...args);
    };
    window.setInterval = function (fn, delay, ...args) {
      return origSetInterval(fn, scaleDelay(delay), ...args);
    };
    window.clearTimeout = function (id) { return origClearTimeout(id); };
    window.clearInterval = function (id) { return origClearInterval(id); };
  }

  const realStart = origDateNow();
  const perfStart = origPerfNow ? origPerfNow() : 0;
  let clockInstalled = false;
  function setClockEnabled(on) {
    clockEnabled = on;
    if (on && !clockInstalled) {
      clockInstalled = true;
      try {
        Date.now = function () { return realStart + Math.floor((origDateNow() - realStart) * SPEED); };
        if (window.performance && origPerfNow) {
          performance.now = function () { return Math.floor((origPerfNow() - perfStart) * SPEED); };
        }
      } catch (e) { log('Gagal override Date', e); }
    } else if (!on && clockInstalled) {
      clockInstalled = false;
      try {
        Date.now = origDateNow;
        if (window.performance && origPerfNow) performance.now = origPerfNow;
      } catch (e) {}
    }
  }

  // Blokir popup iklan HANYA di halaman SafelinkEarn.
  const _open = window.open.bind(window);
  window.open = function (url) {
    if (isSafelinkEarnPage()) {
      log('Popup diblokir:', url);
      setStatus('Popup iklan diblokir');
      return null;
    }
    return _open(url, ...Array.prototype.slice.call(arguments, 1));
  };

  // ------------------------------------------------------------
  // 2. HELPERS - tombol & klik
  // ------------------------------------------------------------
  const norm = (s) => (s || '').toLowerCase().trim().replace(/\s+/g, ' ');
  const txtOf = (el) => norm(el.textContent || el.value || el.getAttribute('aria-label') || el.title || '');
  const isWaitingText = (t) => /please wait|wait \d|waiting|tunggu|memuat/i.test(t);
  const isDisabled = (el) => el.disabled || el.getAttribute('disabled') !== null || el.getAttribute('aria-disabled') === 'true';

  function visible(el) {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return false;
    const cs = getComputedStyle(el);
    return cs.display !== 'none' && cs.visibility !== 'hidden' && cs.opacity !== '0';
  }
  function findButtons() {
    return Array.from(document.querySelectorAll('button, a, input[type="button"], input[type="submit"], [role="button"]')).filter(visible);
  }
  function findButtonByNeedles(needles, excludeNeedles) {
    const els = findButtons();
    for (const el of els) {
      const t = txtOf(el);
      if (!t) continue;
      if (excludeNeedles && excludeNeedles.some(x => t.includes(x))) continue;
      if (needles.some(n => t.includes(n))) return el;
    }
    return null;
  }
  const EXCLUDE = ['download click', 'download'];

  function getStepInfo() {
    const t = bodySnippet();
    const m = t.match(/Step\s*(\d+)\s*(?:\/|of)\s*(\d+)/i);
    const isStart = location.pathname.includes('/v/start') ||
      /please wait a moment to get your link/i.test(t) ||
      (/verify you are human/i.test(t) && /continue to your destination/i.test(t));
    return {
      step: m ? parseInt(m[1], 10) : (isStart ? 0 : null),
      total: m ? parseInt(m[2], 10) : null,
      isStart
    };
  }

  function clickSmart(el) {
    if (!el) return;
    setStatus('Mengklik: ' + (el.textContent || el.value || txtOf(el)).trim().slice(0, 40));
    try { el.focus(); } catch (e) {}
    try { el.click(); } catch (e) {}
    // Fallback koordinat (tombol tertutup overlay) - pakai timer asli.
    origSetTimeout(() => {
      if (!document.contains(el)) return;
      try {
        const r = el.getBoundingClientRect();
        const x = r.left + r.width / 2, y = r.top + r.height / 2;
        const target = document.elementFromPoint(x, y) || el;
        for (const type of ['mousedown', 'mouseup', 'click']) {
          target.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, view: window }));
        }
      } catch (e) {}
    }, 350);
  }
  async function clickTwice(el, gapMs) {
    clickSmart(el);
    await sleepOrig(gapMs || 900);
    if (document.contains(el)) clickSmart(el);
  }
  async function scrollToBottomStepwise() {
    setStatus('Scroll ke bawah…');
    const h = document.documentElement.scrollHeight || document.body.scrollHeight;
    for (let y = window.scrollY; y < h; y += Math.max(600, window.innerHeight * 0.8)) {
      window.scrollTo({ top: y, behavior: 'auto' });
      await sleepOrig(250);
    }
    window.scrollTo(0, document.documentElement.scrollHeight);
    await sleepOrig(600);
  }

  // ------------------------------------------------------------
  // 3. PANEL - status + timer + kontrol
  // ------------------------------------------------------------
  let statusEl = null;
  let timerEl = null;
  let lastTimerText = '';
  function setStatus(msg) {
    if (statusEl) statusEl.textContent = 'Auto: ' + msg;
    log(msg);
  }
  function showToast(msg) {
    if (!document.body || document.getElementById('se-auto-toast')) return;
    const el = document.createElement('div');
    el.id = 'se-auto-toast';
    el.textContent = msg;
    el.style.cssText = 'position:fixed;bottom:150px;left:16px;z-index:999999;background:#111827;color:#fff;padding:9px 12px;border-radius:10px;font:13px system-ui;box-shadow:0 4px 20px rgba(0,0,0,.3);max-width:320px;';
    document.body.appendChild(el);
    origSetTimeout(() => el.remove(), 3000);
  }
  function addPanel() {
    if (!document.body || document.getElementById('se-auto-panel')) return;
    const box = document.createElement('div');
    box.id = 'se-auto-panel';
    box.style.cssText = 'position:fixed;bottom:16px;left:16px;z-index:999999;background:#fff;border:1px solid #e5e7eb;border-radius:12px;box-shadow:0 6px 24px rgba(0,0,0,.18);padding:10px 12px;font:13px system-ui;color:#111827;max-width:310px;';
    box.innerHTML =
      '<div style="font-weight:700;margin-bottom:2px;">↗ SafelinkEarn Auto v3.0</div>' +
      '<div id="se-auto-status" style="color:#374151;">Menunggu halaman…</div>' +
      '<div id="se-auto-timer" style="color:#0f766e;font-weight:600;margin-top:2px;">Belum ada timer</div>' +
      '<div style="display:flex;gap:6px;margin-top:8px;">' +
      '<button id="se-auto-toggle-speed" style="flex:1;background:#0f766e;color:#fff;border:none;padding:7px 6px;border-radius:8px;cursor:pointer;font-weight:600;">Percepat: ON 10x</button>' +
      '<button id="se-auto-toggle-auto" style="flex:1;background:#0f766e;color:#fff;border:none;padding:7px 6px;border-radius:8px;cursor:pointer;font-weight:600;">Auto-klik: ON</button>' +
      '</div>' +
      '<div style="display:flex;gap:6px;margin-top:6px;">' +
      '<button data-speed="2" style="flex:1;background:#f3f4f6;border:1px solid #d1d5db;padding:6px;border-radius:8px;cursor:pointer;">2x</button>' +
      '<button data-speed="5" style="flex:1;background:#f3f4f6;border:1px solid #d1d5db;padding:6px;border-radius:8px;cursor:pointer;">5x</button>' +
      '<button data-speed="10" style="flex:1;background:#0f766e;color:#fff;border:none;padding:6px;border-radius:8px;cursor:pointer;font-weight:600;">10x</button>' +
      '<button id="se-auto-next" style="flex:1;background:#f3f4f6;border:1px solid #d1d5db;padding:6px;border-radius:8px;cursor:pointer;">Lanjut</button>' +
      '</div>' +
      '<button id="se-auto-clock" style="width:100%;margin-top:6px;background:#fef3c7;border:1px solid #f59e0b;padding:6px;border-radius:8px;cursor:pointer;">Jam dipercepat: OFF</button>' +
      '<div style="font-size:11px;color:#6b7280;margin-top:6px;">Otomatis: timer dipercepat → klik 2x → scroll → Next → Go / Open Link. Popup iklan diblokir.</div>';
    document.body.appendChild(box);
    statusEl = box.querySelector('#se-auto-status');
    timerEl = box.querySelector('#se-auto-timer');

    const speedBtn = box.querySelector('#se-auto-toggle-speed');
    const autoBtn = box.querySelector('#se-auto-toggle-auto');
    speedBtn.addEventListener('click', () => {
      speedEnabled = !speedEnabled;
      if (!speedEnabled) setClockEnabled(false);
      speedBtn.textContent = speedEnabled ? 'Percepat: ON ' + SPEED + 'x' : 'Percepat: OFF';
      speedBtn.style.background = speedEnabled ? '#0f766e' : '#f3f4f6';
      speedBtn.style.color = speedEnabled ? '#fff' : '#111827';
      setStatus(speedEnabled ? 'Percepat timer ON ' + SPEED + 'x' : 'Percepat timer OFF — timer normal');
    });
    autoBtn.addEventListener('click', () => {
      autoEnabled = !autoEnabled;
      autoBtn.textContent = autoEnabled ? 'Auto-klik: ON' : 'Auto-klik: OFF';
      autoBtn.style.background = autoEnabled ? '#0f766e' : '#f3f4f6';
      autoBtn.style.color = autoEnabled ? '#fff' : '#111827';
      setStatus(autoEnabled ? 'Auto-klik ON' : 'Auto-klik OFF — klik manual, timer tetap dipercepat');
    });
    box.querySelectorAll('[data-speed]').forEach(btn => {
      btn.addEventListener('click', () => {
        SPEED = parseInt(btn.getAttribute('data-speed'), 10);
        speedEnabled = true;
        speedBtn.textContent = 'Percepat: ON ' + SPEED + 'x';
        speedBtn.style.background = '#0f766e'; speedBtn.style.color = '#fff';
        box.querySelectorAll('[data-speed]').forEach(b => {
          b.style.background = '#f3f4f6'; b.style.color = '#111827'; b.style.fontWeight = '400';
        });
        btn.style.background = '#0f766e'; btn.style.color = '#fff'; btn.style.fontWeight = '600';
      });
    });
    box.querySelector('#se-auto-clock').addEventListener('click', (e) => {
      setClockEnabled(!clockEnabled);
      e.target.textContent = 'Jam dipercepat: ' + (clockEnabled ? 'ON' : 'OFF');
    });
    box.querySelector('#se-auto-next').addEventListener('click', () => { manualAdvance(); });
  }

  // ------------------------------------------------------------
  // 4. ANTI-ADBLOCK MODAL (dibatasi 1x/2 detik, hanya modal fixed)
  // ------------------------------------------------------------
  let lastKillAt = 0;
  function killAdblockModal() {
    if (!document.body) return;
    const now = origDateNow();
    if (now - lastKillAt < 2000) return;
    lastKillAt = now;
    const bad = /ad\s*block|adblock|disable.*ad|matikan.*iklan|please disable|detected.*ad/i;
    const candidates = Array.from(document.querySelectorAll('div[style*="fixed"], div[class*="modal"], div[class*="overlay"]'));
    for (const el of candidates) {
      const t = (el.textContent || '').slice(0, 300);
      if (!bad.test(t)) continue;
      const cs = getComputedStyle(el);
      if (cs.position === 'fixed' && parseInt(cs.zIndex || '0', 10) > 1000) {
        el.remove();
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
        setStatus('Modal anti-adblock ditutup');
        showToast('Modal anti-adblock ditutup');
        return;
      }
    }
  }
  function addBait() {
    if (!document.body || document.getElementById('se-ad-bait')) return;
    const bait = document.createElement('div');
    bait.id = 'se-ad-bait';
    bait.className = 'adsbygoogle ad ads advertisement';
    bait.style.cssText = 'position:absolute;left:-9999px;top:0;width:300px;height:250px;';
    document.body.appendChild(bait);
  }

  // ------------------------------------------------------------
  // 5. STATE MACHINE - polling 1 detik (timer asli)
  // ------------------------------------------------------------
  let lastActionAt = 0;
  let lastActionKey = '';
  let running = false;
  function cooldown(key, ms) {
    const now = origDateNow();
    if (lastActionKey === key && now - lastActionAt < ms) return true;
    lastActionKey = key; lastActionAt = now;
    return false;
  }
  async function manualAdvance() {
    const top = findButtonByNeedles(['click to verify', 'click to continue', 'click here to continue', 'continue', 'go to the next step', 'open link', 'next'], EXCLUDE);
    if (top && !isDisabled(top) && !isWaitingText(txtOf(top))) {
      await clickTwice(top, 900);
    } else {
      showToast('Belum ada tombol yang bisa diklik (masih timer / perlu scroll).');
    }
  }
  function updateTimerDisplay() {
    if (!timerEl) return;
    const btns = document.querySelectorAll('button');
    let found = '';
    for (let i = 0; i < btns.length; i++) {
      const t = (btns[i].textContent || '').trim();
      if (/please wait/i.test(t)) { found = t; break; }
    }
    let msg;
    if (found) {
      const m = found.match(/(\d+)/);
      const n = m ? parseInt(m[1], 10) : null;
      msg = n !== null && speedEnabled
        ? 'Timer: ' + found + ' — ' + SPEED + 'x, kira-kira ' + Math.max(1, Math.ceil(n / SPEED)) + ' detik lagi'
        : 'Timer: ' + found;
    } else {
      msg = 'Tidak ada timer aktif';
    }
    if (msg !== lastTimerText) { lastTimerText = msg; timerEl.textContent = msg; }
  }

  async function tick() {
    if (running) return;
    if (!document.body) return;
    if (!isSafelinkEarnPage()) return;
    running = true;
    try {
      killAdblockModal();
      updateTimerDisplay();
      if (!autoEnabled) {
        setStatus('Auto-klik OFF — timer ' + (speedEnabled ? 'dipercepat ' + SPEED + 'x' : 'normal') + ', klik manual');
        return;
      }
      const info = getStepInfo();

      if (info.isStart && info.step === 0) {
        const btn = findButtonByNeedles(['continue', 'click here to continue'], EXCLUDE);
        if (!btn) { setStatus('Start: menunggu tombol Continue…'); return; }
        const t = txtOf(btn);
        if (isWaitingText(t) || isDisabled(btn)) {
          setStatus('Start: menunggu timer — ' + (btn.textContent || t).trim());
          return;
        }
        if (cooldown('start-continue', 4000)) return;
        setStatus('Start: klik Continue (2x)');
        await clickTwice(btn, 900);
        return;
      }

      if (info.step !== null) {
        const label = 'Step ' + info.step + '/' + (info.total || '?');

        const openBtn = findButtonByNeedles(['open link'], EXCLUDE);
        if (openBtn && !isDisabled(openBtn) && !isWaitingText(txtOf(openBtn))) {
          if (cooldown('open-link-' + info.step, 4000)) return;
          setStatus(label + ': klik Open Link (tombol akhir)');
          await clickTwice(openBtn, 900);
          return;
        }
        if (openBtn && (isDisabled(openBtn) || isWaitingText(txtOf(openBtn)))) {
          setStatus(label + ': menunggu timer — ' + (openBtn.textContent || '').trim());
          return;
        }

        const goBtn = findButtonByNeedles(['go to the next step', 'click here to continue'], EXCLUDE);
        // Hati-hati: "click here to continue" juga dipakai di Start, tapi di sini
        // kita sudah lewat Start (info.step !== null), jadi aman.
        if (goBtn && !isDisabled(goBtn) && !isWaitingText(txtOf(goBtn))) {
          // Pastikan ini bukan tombol atas "Click to Verify" yang kebetulan
          // mengandung kata continue - goBtn dicari dengan frasa lengkap dulu.
          const gt = txtOf(goBtn);
          if (gt.includes('go to the next step') || gt === 'click here to continue') {
            if (cooldown('go-next-' + info.step, 4000)) return;
            setStatus(label + ': klik ' + (goBtn.textContent || gt).trim());
            await clickTwice(goBtn, 900);
            return;
          }
        }
        if (goBtn && (isDisabled(goBtn) || isWaitingText(txtOf(goBtn)))) {
          setStatus(label + ': menunggu timer — ' + (goBtn.textContent || '').trim());
          return;
        }

        const topBtn = findButtonByNeedles(['click to verify', 'click to continue', 'scroll down to continue', 'continue'], EXCLUDE);
        if (topBtn) {
          const tt = txtOf(topBtn);
          if (tt.includes('scroll down to continue')) {
            setStatus(label + ': scroll ke bawah untuk tombol Next…');
            await scrollToBottomStepwise();
            const nextBtn = findButtons().find(el => txtOf(el) === 'next' || txtOf(el) === 'next →' || txtOf(el) === 'next »');
            if (nextBtn) {
              if (isDisabled(nextBtn) || isWaitingText(txtOf(nextBtn))) {
                setStatus(label + ': tombol Next masih timer…');
                return;
              }
              if (cooldown('next-' + info.step, 4000)) return;
              setStatus(label + ': klik Next (bawah artikel)');
              clickSmart(nextBtn);
              return;
            }
            const openBtn2 = findButtonByNeedles(['open link'], EXCLUDE);
            if (openBtn2 && !isDisabled(openBtn2) && !isWaitingText(txtOf(openBtn2))) {
              if (cooldown('open-link-scroll-' + info.step, 4000)) return;
              setStatus(label + ': klik Open Link (bawah artikel)');
              clickSmart(openBtn2);
              return;
            }
            setStatus(label + ': tombol Next / Open Link belum ketemu, scroll lagi…');
            window.scrollTo(0, document.documentElement.scrollHeight);
            return;
          }
          if (isWaitingText(tt) || isDisabled(topBtn)) {
            setStatus(label + ': menunggu timer — ' + (topBtn.textContent || tt).trim());
            return;
          }
          if (cooldown('top-' + info.step + '-' + tt, 4000)) return;
          setStatus(label + ': klik ' + (topBtn.textContent || tt).trim() + ' (2x)');
          await clickTwice(topBtn, 900);
          return;
        }

        const bottomNext = findButtons().find(el => txtOf(el) === 'next');
        if (bottomNext && !isDisabled(bottomNext) && !isWaitingText(txtOf(bottomNext))) {
          if (cooldown('bottom-next-' + info.step, 4000)) return;
          setStatus(label + ': klik Next (bawah)');
          clickSmart(bottomNext);
          return;
        }

        setStatus(label + ': menunggu tombol / timer…');
        return;
      }

      setStatus('Halaman SafelinkEarn, menunggu tombol…');
    } catch (e) {
      log('tick error', e);
    } finally {
      running = false;
    }
  }

  // ------------------------------------------------------------
  // 6. JALANKAN - sekali saja
  // ------------------------------------------------------------
  function startActive() {
    addPanel();
    addBait();
    setStatus('Aktif di ' + location.hostname + ' — percepat ' + SPEED + 'x, auto-klik ON');
    origSetInterval(tick, 1000);
  }
  function init() {
    if (started) return;
    if (location.pathname.includes('/v/start') || location.hostname.includes('sfe.ad')) {
      installOverride();
    }
    if (!document.body) {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
      }
      return;
    }
    if (!isSafelinkEarnPage()) return;
    started = true;
    installOverride();
    startActive();
  }

  init();
  origSetTimeout(() => { if (!started) init(); }, 2000);
})();
