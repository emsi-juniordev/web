/* ==========================================================
   Aurora Login – script.js
   1. Animated sky (stars, shooting stars, pine trees) – adapts to any screen
   2. Show / hide password
   3. Form validation with animated errors
   4. Sign up / log in / log out (demo, saved in the browser)
   ========================================================== */

(() => {
  'use strict';

  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ========================================================
     1. SKY BACKGROUND
     ======================================================== */

  function initSky() {
    const sky    = $('#sky');
    const canvas = $('#skyCanvas');
    const ctx    = canvas.getContext('2d');

    let w = 0, h = 0, dpr = 1;
    let stars = [];
    let treeLayer = null;
    let shooting = null;
    let nextShot = performance.now() + 3000;

    // seeded random so the sky doesn't reshuffle every time the window resizes
    function rng(seed) {
      return function () {
        seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }

    function buildStars() {
      const rand  = rng(42);
      const count = Math.min(420, Math.floor((w * h) / 5500));
      stars = Array.from({ length: count }, () => ({
        x: rand() * w,
        y: rand() * h * 0.82,
        r: rand() * 1.3 + 0.25,
        phase: rand() * Math.PI * 2,
        speed: 0.4 + rand() * 1.6,
      }));
    }

    function drawTree(c, x, baseY, height, rand) {
      const tiers = 7;
      const width = height * 0.26;
      c.beginPath();
      c.moveTo(x, baseY - height);
      for (let i = 0; i < tiers; i++) {                      // right side
        const y  = baseY - height + (height * (i + 1.2)) / (tiers + 0.4);
        const hw = (width * (i + 1)) / tiers * (0.85 + rand() * 0.3);
        c.lineTo(x + hw * 0.55, y - height * 0.03);
        c.lineTo(x + hw, y);
        c.lineTo(x + hw * 0.45, y - height * 0.005);
      }
      c.lineTo(x + 3, baseY);
      c.lineTo(x - 3, baseY);
      for (let i = tiers - 1; i >= 0; i--) {                 // left side
        const y  = baseY - height + (height * (i + 1.2)) / (tiers + 0.4);
        const hw = (width * (i + 1)) / tiers * (0.85 + rand() * 0.3);
        c.lineTo(x - hw * 0.45, y - height * 0.005);
        c.lineTo(x - hw, y);
        c.lineTo(x - hw * 0.55, y - height * 0.03);
      }
      c.closePath();
      c.fill();
    }

    function buildTrees() {
      treeLayer = document.createElement('canvas');
      treeLayer.width  = w * dpr;
      treeLayer.height = h * dpr;
      const c = treeLayer.getContext('2d');
      c.scale(dpr, dpr);

      const rand  = rng(7);
      const scale = Math.min(Math.max(Math.min(w, h * 1.1) / 900, 0.55), 1.5);

      // faint treeline hills so the bottom never looks empty
      c.fillStyle = '#020a10';
      c.beginPath();
      c.moveTo(0, h);
      for (let x = 0; x <= w; x += 20) {
        c.lineTo(x, h - (10 + Math.sin(x / 120) * 6 + Math.sin(x / 47) * 3) * scale);
      }
      c.lineTo(w, h);
      c.closePath();
      c.fill();

      // pine trees – taller toward the edges, like the design
      c.fillStyle = '#01070c';
      for (let x = -10; x < w + 30; ) {
        const edge   = Math.abs(x / w - 0.5) * 2;           // 0 middle … 1 edges
        const tall   = (60 + rand() * 90) * (0.45 + edge * 1.25) * scale;
        const baseY  = h + 6 * scale;
        drawTree(c, x, baseY, tall, rand);
        x += (16 + rand() * 30) * scale * (1.1 - edge * 0.45);
      }
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width  = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildStars();
      buildTrees();
      if (reduceMotion) frame(performance.now());
    }

    function frame(now) {
      ctx.clearRect(0, 0, w, h);

      // twinkling stars
      const t = now / 1000;
      ctx.fillStyle = '#fff';
      for (const s of stars) {
        const a = reduceMotion ? 0.7 : 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * s.speed + s.phase));
        ctx.globalAlpha = a;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // shooting star every few seconds
      if (!reduceMotion) {
        if (!shooting && now > nextShot) {
          shooting = {
            x: Math.random() * w * 0.8,
            y: Math.random() * h * 0.3,
            vx: 6 + Math.random() * 4,
            vy: 2.5 + Math.random() * 2,
            life: 1,
          };
          nextShot = now + 5000 + Math.random() * 7000;
        }
        if (shooting) {
          const s = shooting;
          const g = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * 9, s.y - s.vy * 9);
          g.addColorStop(0, `rgba(255,255,255,${s.life})`);
          g.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.strokeStyle = g;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(s.x - s.vx * 9, s.y - s.vy * 9);
          ctx.stroke();
          s.x += s.vx; s.y += s.vy; s.life -= 0.015;
          if (s.life <= 0 || s.x > w || s.y > h) shooting = null;
        }
      }

      if (treeLayer) ctx.drawImage(treeLayer, 0, 0, w, h);
      if (!reduceMotion) requestAnimationFrame(frame);
    }

    // gentle parallax: aurora drifts with the mouse / finger
    function parallax(e) {
      const p = e.touches ? e.touches[0] : e;
      sky.style.setProperty('--px', ((p.clientX / w) * 2 - 1).toFixed(3));
      sky.style.setProperty('--py', ((p.clientY / h) * 2 - 1).toFixed(3));
    }

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 100);
    });
    if (!reduceMotion) {
      window.addEventListener('pointermove', parallax, { passive: true });
    }

    resize();
    if (!reduceMotion) requestAnimationFrame(frame);
  }

  /* ========================================================
     2. HELPERS: storage, hashing, toast, validation
     ======================================================== */

  const USERS_KEY   = 'aurora_users';
  const SESSION_KEY = 'aurora_session';

  const store = {
    get(key, fallback) {
      try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
      catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage blocked */ }
    },
    remove(key) {
      try { localStorage.removeItem(key); } catch { /* ignore */ }
    },
  };

  // SHA-256 when available (https / localhost); simple fallback for file://
  async function hash(text) {
    try {
      if (window.crypto && crypto.subtle) {
        const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
        return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
      }
    } catch { /* fall through */ }
    let h1 = 5381;
    for (const ch of text) h1 = ((h1 << 5) + h1 + ch.charCodeAt(0)) | 0;
    return 'x' + h1;
  }

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  let toastTimer;
  function toast(message, isError = false) {
    const el = $('#toast');
    el.textContent = message;
    el.classList.toggle('error-toast', isError);
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
  }

  const isEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

  function setError(input, message) {
    const group = input.closest('.group');
    const box   = $('.error', group);
    group.classList.remove('valid');
    if (message) {
      box.textContent = message;
      group.classList.remove('invalid');
      void group.offsetWidth;               // restart the shake animation
      group.classList.add('invalid');
    } else {
      group.classList.remove('invalid');
      box.textContent = '';
    }
    return !message;
  }

  function markValid(input) {
    input.closest('.group').classList.add('valid');
  }

  function setLoading(form, on) {
    const btn = $('.btn', form);
    btn.classList.toggle('loading', on);
    btn.disabled = on;
  }

  /* ========================================================
     3. VIEWS (login / signup / home)
     ======================================================== */

  function showView(name) {
    $$('.view').forEach(v => v.classList.toggle('active', v.dataset.view === name));
    const first = $(`.view[data-view="${name}"] input`);
    if (first && window.matchMedia('(hover: hover)').matches) first.focus({ preventScroll: true });
    if (name === 'home') startClock(); else stopClock();
  }

  document.addEventListener('click', e => {
    const link = e.target.closest('[data-goto]');
    if (!link) return;
    e.preventDefault();
    $$('.form-msg').forEach(m => (m.textContent = ''));
    showView(link.dataset.goto);
  });

  /* ---------- show / hide password ---------- */

  $$('.eye').forEach(btn => {
    btn.addEventListener('click', () => {
      const input   = $('input', btn.closest('.field'));
      const showing = input.type === 'text';
      input.type = showing ? 'password' : 'text';
      btn.setAttribute('aria-pressed', String(!showing));
      btn.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
      input.focus({ preventScroll: true });
    });
  });

  /* ---------- clear errors while typing ---------- */

  $$('.field input').forEach(input => {
    input.addEventListener('input', () => {
      setError(input, '');
      input.closest('.group').classList.remove('valid');
      const msg = $('.form-msg', input.closest('form'));
      if (msg) msg.textContent = '';
    });
  });

  /* ---------- clock on the home view ---------- */

  let clockTimer;
  function startClock() {
    const tick = () => {
      const now = new Date();
      $('#homeClock').textContent =
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };
    tick();
    clearInterval(clockTimer);
    clockTimer = setInterval(tick, 1000);
  }
  function stopClock() { clearInterval(clockTimer); }

  function greeting() {
    const hr = new Date().getHours();
    return hr < 12 ? 'Good morning' : hr < 18 ? 'Good afternoon' : 'Good evening';
  }

  function enterHome(user) {
    $('#homeName').textContent = `${greeting()}, ${user.username}!`;
    showView('home');
  }

  /* ========================================================
     4. LOG IN
     ======================================================== */

  const loginForm = $('#loginForm');

  loginForm.addEventListener('submit', async e => {
    e.preventDefault();
    const userInput = $('#loginUser');
    const passInput = $('#loginPass');
    const idValue   = userInput.value.trim();
    const msg       = $('#loginMsg');
    msg.textContent = '';

    let ok = true;
    if (!idValue) ok = setError(userInput, 'Enter your username or email.') && ok;
    else if (idValue.includes('@') && !isEmail(idValue)) ok = setError(userInput, 'That email doesn’t look right.') && ok;
    if (!passInput.value) ok = setError(passInput, 'Enter your password.') && ok;
    if (!ok) return;

    setLoading(loginForm, true);
    await sleep(900);                                     // pretend to contact a server

    const users = store.get(USERS_KEY, []);
    const id    = idValue.toLowerCase();
    const user  = users.find(u => u.username.toLowerCase() === id || u.email.toLowerCase() === id);
    const pass  = await hash(passInput.value);

    setLoading(loginForm, false);

    if (!user || user.pass !== pass) {
      msg.textContent = 'Wrong username/email or password.';
      passInput.value = '';
      setError(passInput, '');
      passInput.closest('.group').classList.add('invalid');
      $('.error', passInput.closest('.group')).textContent = 'Check your password and try again.';
      return;
    }

    store.set(SESSION_KEY, { username: user.username });
    loginForm.reset();
    toast(`Logged in as ${user.username}`);
    enterHome(user);
  });

  /* ========================================================
     5. SIGN UP
     ======================================================== */

  const signupForm = $('#signupForm');
  const signupPass = $('#signupPass');

  function passwordScore(p) {
    let s = 0;
    if (p.length >= 8) s++;
    if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s++;
    if (/\d/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p) || p.length >= 12) s++;
    return s;                                             // 0 – 4
  }

  signupPass.addEventListener('input', () => {
    const score = passwordScore(signupPass.value);
    const bar   = $('#strength span');
    const colors = ['#ff6b6b', '#ff6b6b', '#ffb454', '#c8e05a', '#3ddc97'];
    bar.style.width      = signupPass.value ? `${Math.max(1, score) * 25}%` : '0';
    bar.style.background = colors[score];
  });

  signupForm.addEventListener('submit', async e => {
    e.preventDefault();
    const nameI = $('#signupUser');
    const mailI = $('#signupEmail');
    const passI = signupPass;
    const confI = $('#signupConfirm');

    const username = nameI.value.trim();
    const email    = mailI.value.trim();
    const users    = store.get(USERS_KEY, []);

    let ok = true;
    if (!/^[A-Za-z0-9_.]{3,20}$/.test(username))
      ok = setError(nameI, 'Use 3–20 letters, numbers, _ or .') && ok;
    else if (users.some(u => u.username.toLowerCase() === username.toLowerCase()))
      ok = setError(nameI, 'That username is taken.') && ok;

    if (!isEmail(email))
      ok = setError(mailI, 'Enter a valid email address.') && ok;
    else if (users.some(u => u.email.toLowerCase() === email.toLowerCase()))
      ok = setError(mailI, 'That email is already registered.') && ok;

    if (passI.value.length < 8 || !/\d/.test(passI.value) || !/[A-Za-z]/.test(passI.value))
      ok = setError(passI, 'At least 8 characters with a letter and a number.') && ok;

    if (confI.value !== passI.value)
      ok = setError(confI, 'Passwords don’t match.') && ok;

    if (!ok) return;

    setLoading(signupForm, true);
    await sleep(1000);
    users.push({ username, email, pass: await hash(passI.value) });
    store.set(USERS_KEY, users);
    setLoading(signupForm, false);

    signupForm.reset();
    $('#strength span').style.width = '0';
    toast('Account created! You can log in now.');
    showView('login');
    $('#loginUser').value = username;
    $('#loginPass').focus({ preventScroll: true });
  });

  /* ========================================================
     6. LOG OUT + keep session on reload
     ======================================================== */

  $('#logoutBtn').addEventListener('click', () => {
    store.remove(SESSION_KEY);
    toast('You’ve been logged out.');
    showView('login');
  });

  function restoreSession() {
    const session = store.get(SESSION_KEY, null);
    if (session && session.username) enterHome(session);
  }

  /* ========================================================
     START
     ======================================================== */

  initSky();
  restoreSession();
})();