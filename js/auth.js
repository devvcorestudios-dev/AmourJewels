/* ============================================================
   AMOUR JEWELS — Login & Register (login.html · register.html)
   Three ways in, one black-and-gold screen:
     1. Email  → password  (register requires + confirms one)
     2. Phone  → 6-digit OTP (demo code shown on screen)
     3. Google → OAuth via Google Identity Services
   Layout/skin: css/auth.css (body.auth-dark).
   ------------------------------------------------------------
   SETUP: paste your OAuth Web Client ID into GOOGLE_CLIENT_ID
   below and whitelist this site's origin in Google Cloud
   Console → Authorised JavaScript origins.
   ------------------------------------------------------------
   Storage: same key as main.js (amour_account_v1) so orders,
   addresses and checkout keep working. Passwords are kept as a
   demo hash — production MUST verify server-side (bcrypt/argon2)
   and send OTPs through an SMS gateway.
   ============================================================ */

const GOOGLE_CLIENT_ID = 'YOUR_CLIENT_ID.apps.googleusercontent.com';

const AUTH_MODE = document.body.dataset.authMode === 'register' ? 'register' : 'login';
const AUTH_AKEY = 'amour_account_v1';                 /* = ACCT_KEY in main.js */
const AUTH_NEEDS_ID = /^YOUR_CLIENT_ID\./.test(GOOGLE_CLIENT_ID);
const AUTH_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const AUTH_PHONE_RE = /^[6-9]\d{9}$/;                 /* Indian mobile */
const auPending = { phone: null, code: null };        /* OTP challenge in flight */

/* demo hash (djb2) — fine for a static demo, NOT real security */
function auHash(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return ('0000000' + (h >>> 0).toString(16)).slice(-8);
}

/* ---------- tiny DOM helpers ---------- */
const auVal = id => { const el = document.getElementById(id); return el ? String(el.value || '').trim() : ''; };
const auShow = (id, show) => { const el = document.getElementById(id); if (el) el.hidden = !show; };
function auErr(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg || '';
  el.hidden = !msg;
}
function auBad(id, on) {
  const el = document.getElementById(id);
  if (el && el.classList) el.classList.toggle('bad', !!on);
}
function auClearErrs() {
  ['auErrEmail', 'auErrPhone', 'auErrOtp'].forEach(id => auErr(id, ''));
  ['auEmail', 'auPass', 'auPass2', 'auPhone', 'auOtp'].forEach(id => auBad(id, false));
}

/* ---------- profile (same key/shape main.js uses) ---------- */
function authProfile() {
  try { return JSON.parse(localStorage.getItem(AUTH_AKEY)) || null; } catch (e) { return null; }
}
function authSetProfile(p) {
  p ? localStorage.setItem(AUTH_AKEY, JSON.stringify(p)) : localStorage.removeItem(AUTH_AKEY);
}

/* ---------- Google ID-token (JWT) payload decode — GIS checks the signature ---------- */
function authDecode(token) {
  try {
    const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(atob(b64).split('').map(c =>
      '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
    return JSON.parse(json);
  } catch (e) { return null; }
}

/* ---------- redirect target: same-site relative ?next= only ---------- */
function authNext() {
  const next = new URLSearchParams(location.search).get('next');
  if (next && /^[a-z0-9][a-z0-9.\-_]*(\.html)?([?#].*)?$/i.test(next)) return next;
  return 'index.html';
}

/* ---------- status line under the buttons ---------- */
function authMsg(text, kind) {
  const el = document.getElementById('authMsg');
  if (!el) return;
  el.hidden = !text;
  el.className = 'auth-msg' + (kind ? ' ' + kind : '');
  el.textContent = text || '';
}

/* ---------- gate (forms) vs. signed-in panel ---------- */
function authRenderState() {
  const gate = document.getElementById('authGate');
  const done = document.getElementById('authDone');
  if (!gate || !done) return false;
  const me = authProfile();
  if (!me) { gate.hidden = false; done.hidden = true; return false; }

  const initials = me.name
    ? me.name.trim().slice(0, 2).toUpperCase()
    : (me.contact || 'AM').slice(0, 2).toUpperCase();
  const ava = document.getElementById('authAva');
  if (ava) ava.innerHTML = me.picture
    ? `<img src="${me.picture}" alt="" referrerpolicy="no-referrer">`
    : initials;
  const who = document.getElementById('authWho');
  if (who) who.textContent = AUTH_MODE === 'register'
    ? (me.name ? `Welcome, ${me.name.split(' ')[0]}` : 'You already have an account')
    : (me.name ? `Signed in, ${me.name.split(' ')[0]}` : 'Signed in');
  const em = document.getElementById('authEmail');
  if (em) em.textContent = me.contact || '';
  gate.hidden = true; done.hidden = false;
  return true;
}

/* ---------- Email ⇄ Phone tabs ---------- */
function auSwitchTab(mode) {
  ['email', 'phone'].forEach(m => {
    const tab = document.getElementById('tab' + m.charAt(0).toUpperCase() + m.slice(1));
    if (tab && tab.classList) tab.classList.toggle('active', m === mode);
  });
  auShow('pnlEmail', mode === 'email');
  auShow('pnlPhone', mode === 'phone');
  auShow('pnlOtp', false);
  auClearErrs();
  authMsg();
}

/* ---------- success: save session, celebrate, redirect ---------- */
function auComplete(profile) {
  if (profile) authSetProfile(profile);
  authMsg();
  if (typeof toast === 'function') {
    toast(AUTH_MODE === 'register'
      ? 'Account created — welcome to Amour Jewels'
      : 'Signed in — welcome back to Amour Jewels');
  }
  authRenderState();
  setTimeout(() => { location.href = authNext(); }, 700);
}

/* ---------- EMAIL path: register = set password · login = check it ---------- */
function auSubmitEmail() {
  const email = auVal('auEmail').toLowerCase();
  const pass = auVal('auPass');
  auErr('auErrEmail', ''); auBad('auEmail', false); auBad('auPass', false); auBad('auPass2', false);

  if (!AUTH_EMAIL_RE.test(email)) { auErr('auErrEmail', 'Enter a valid email address.'); auBad('auEmail', true); return false; }
  if (pass.length < 8) { auErr('auErrEmail', 'Password must be at least 8 characters.'); auBad('auPass', true); return false; }
  const me = authProfile();

  if (AUTH_MODE === 'register') {
    const pass2 = auVal('auPass2');
    if (pass !== pass2) { auErr('auErrEmail', 'The two passwords don’t match.'); auBad('auPass2', true); return false; }
    if (me && me.type === 'email' && me.contact === email) {
      auErr('auErrEmail', 'An account already exists for this email — sign in instead.');
      return false;
    }
    auComplete({
      type: 'email', provider: 'form', contact: email, name: '', picture: '',
      pwHash: auHash(pass), since: new Date().toISOString()
    });
    return true;
  }

  /* login */
  if (!me || me.type !== 'email' || me.contact !== email) {
    auErr('auErrEmail', 'No account for this email — create one first.');
    return false;
  }
  if (me.provider === 'google' || !me.pwHash) {
    auErr('auErrEmail', 'You signed up with Google — use “Continue with Google” below.');
    return false;
  }
  if (me.pwHash !== auHash(pass)) {
    auErr('auErrEmail', 'Wrong password — please try again.');
    auBad('auPass', true);
    return false;
  }
  auComplete(null);
  return true;
}

/* ---------- PHONE path — send the OTP (demo code shown on screen) ---------- */
function auSendOtp() {
  const phone = auVal('auPhone').replace(/\D/g, '');
  auErr('auErrPhone', ''); auBad('auPhone', false);
  if (!AUTH_PHONE_RE.test(phone)) {
    auErr('auErrPhone', 'Enter a valid 10-digit Indian mobile number.');
    auBad('auPhone', true);
    return false;
  }
  const me = authProfile();
  const exists = !!(me && me.type === 'phone' && me.contact === phone);
  if (AUTH_MODE === 'register' && exists) {
    auErr('auErrPhone', 'This number already has an account — sign in instead.');
    return false;
  }
  if (AUTH_MODE === 'login' && !exists) {
    auErr('auErrPhone', 'No account for this number — create one first.');
    return false;
  }

  auPending.phone = phone;
  auPending.code = String(Math.floor(100000 + Math.random() * 900000));
  auShow('pnlPhone', false);
  auShow('pnlOtp', true);
  const otp = document.getElementById('auOtp');
  if (otp) otp.value = '';
  authMsg('Demo OTP — your 6-digit code is ' + auPending.code + '. On production this arrives by SMS.', 'note');
  return true;
}

/* ---------- PHONE path — verify the OTP ---------- */
function auVerifyOtp() {
  const code = auVal('auOtp').replace(/\D/g, '');
  auErr('auErrOtp', ''); auBad('auOtp', false);
  if (code.length !== 6) { auErr('auErrOtp', 'Enter the 6-digit code.'); auBad('auOtp', true); return false; }
  if (code !== auPending.code) {
    auErr('auErrOtp', 'That code is not right — check the digits and try again.');
    auBad('auOtp', true);
    return false;
  }
  if (AUTH_MODE === 'register') {
    auComplete({
      type: 'phone', provider: 'form', contact: auPending.phone, name: '', picture: '',
      pwHash: '', since: new Date().toISOString()
    });
  } else {
    auComplete(null);            /* number was verified to exist when the OTP was sent */
  }
  return true;
}

/* ---------- Google credential callback ---------- */
function authHandleCredential(resp) {
  const p = authDecode(resp.credential || '');
  if (!p || !p.email) { authMsg('Google did not return an account. Please try again.', 'bad'); return; }
  if (!AUTH_NEEDS_ID && p.aud && p.aud !== GOOGLE_CLIENT_ID) {
    authMsg('This sign-in token was not issued for this site.', 'bad');
    return;
  }
  const prev = authProfile();
  auComplete({
    type: 'email', provider: 'google',
    contact: String(p.email).toLowerCase(),
    name: p.name || p.given_name || '',
    picture: p.picture || '', sub: p.sub || '', pwHash: '',
    since: (prev && prev.since) || new Date().toISOString()
  });
}

/* ---------- official Google button — filled_black suits this page ---------- */
function authRenderButton() {
  const box = document.getElementById('authGoogle');
  if (!box) return true;
  if (!window.google || !window.google.accounts || !window.google.accounts.id) return false;

  window.google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: authHandleCredential,
    auto_select: false,
    cancel_on_tap_outside: true,
    error_callback: () => authMsg('Google sign-in was cancelled or blocked. Please try again.', 'bad')
  });
  window.google.accounts.id.renderButton(box, {
    theme: 'filled_black',
    size: 'large',
    shape: 'rectangular',
    text: AUTH_MODE === 'register' ? 'signup_with' : 'signin_with',
    width: Math.max(220, Math.min(300, box.clientWidth || 260))
  });
  return true;
}

/* ---------- boot ---------- */
document.addEventListener('DOMContentLoaded', () => {
  const signedIn = authRenderState();

  const out = document.getElementById('authSignOut');
  out && out.addEventListener('click', () => {
    authSetProfile(null);
    authRenderState();
    if (typeof toast === 'function') toast('Signed out — see you soon');
  });

  document.querySelectorAll('[data-au-tab]').forEach(btn =>
    btn.addEventListener('click', () => auSwitchTab(btn.dataset.auTab)));

  const back = document.getElementById('otpBack');
  back && back.addEventListener('click', () => {
    auShow('pnlOtp', false); auShow('pnlPhone', true); auClearErrs(); authMsg();
  });

  const bind = (id, fn) => {
    const f = document.getElementById(id);
    f && f.addEventListener('submit', e => { e.preventDefault(); fn(); });
  };
  bind('pnlEmail', auSubmitEmail);
  bind('pnlPhone', auSendOtp);
  bind('pnlOtp', auVerifyOtp);

  if (signedIn) return;
  if (AUTH_NEEDS_ID) {
    authMsg('Setup needed: paste your Google OAuth Client ID into js/auth.js (GOOGLE_CLIENT_ID).', 'note');
  }

  /* the GIS script loads async — poll briefly, then give up loudly */
  let tries = 0;
  (function waitGsi() {
    if (authRenderButton()) return;
    if (++tries > 40) {
      authMsg("Google sign-in couldn't load. Check your connection and refresh the page.", 'bad');
      return;
    }
    setTimeout(waitGsi, 250);
  })();
});


