/* ============================================================
   AMOUR JEWELS — Store configuration (shared commerce layer)
   Shipping · GST · Coupons · Couriers · Legal
   Frontend demo config — in production this is served/managed
   by the backend & Admin panel.
   ============================================================ */

const STORE = {
  brand: 'Amour Jewels',
  legalName: 'Amour Jewels Retail LLP',
  gstin: '08AAGCA1234K1ZP',
  pan: 'AAGCA1234K',
  address: '2nd Floor, Gopalbari Lane, Johari Bazaar, Jaipur, Rajasthan — 302003',
  email: 'care@amourjewels.in',
  phone: '+91 90000 40000',
  sellerState: 'Rajasthan',
  hours: 'Mon–Sat · 11 am – 8 pm IST',
  grievance: {
    name: 'Meera Kothari',
    designation: 'Grievance Officer — Customer Experience',
    email: 'grievance@amourjewels.in',
    phone: '+91 90000 40011',
    sla: 'Acknowledgement within 48 hrs · resolution within 30 days'
  },
  freeShip: 2500,
  ship: { std: 99, express: 249, codFee: 0, codLimit: 5000 },
  couriers: ['Delhivery', 'Blue Dart', 'XpressBees', 'Ecom Express'],
  metroPrefixes: ['11','40','56','60','70','50','38','41','60','64'],
  gst: { rate: 0.03, inclusive: true, hsnDefault: '7117', roundOff: true },
  whatsapp: { number: '919000040000', enabled: true }
};

/* ---------- coupons (defaults + admin-created) ---------- */
const DEFAULT_COUPONS = [
  { code: 'FIRST10',   type: 'pct',      value: 10,  min: 1500, label: '10% off your first order',    active: true },
  { code: 'FESTIVE15', type: 'pct',      value: 15,  min: 5000, label: '15% off above ₹5,000',        active: true },
  { code: 'AMOUR250',  type: 'flat',     value: 250, min: 2000, label: '₹250 off above ₹2,000',       active: true },
  { code: 'FREESHIP',  type: 'ship',     value: 0,   min: 0,    label: 'Free express shipping',       active: true },
  { code: 'AJ-GIFT-1000', type: 'giftcard', value: 1000, min: 0, label: 'Gift card — ₹1,000 balance', active: true },
  { code: 'AJ-GIFT-2500', type: 'giftcard', value: 2500, min: 0, label: 'Gift card — ₹2,500 balance', active: true },
  { code: 'REF-MEERA10',  type: 'referral', value: 10,  min: 1000, label: 'Referral — 10% off (Meera)', active: true }
];
const COUPONS_KEY = 'amour_coupons_v1';
const RETURNS_KEY  = 'amour_returns_v1';   /* return/exchange requests (track.html → admin)       */
const CARTS_KEY    = 'amour_abandoned_carts_v1'; /* abandoned carts, recoverable by marketing      */
const ALERTS_KEY   = 'amour_stock_alerts_v1';    /* low-stock alerts raised by the admin console   */
const BCAST_KEY    = 'amour_broadcasts_v1';      /* admin broadcast log (audience + message)       */

/* ---------- pincode serviceability (deterministic demo) ----------
   In production: courier-serviceability API. Here: realistic rules —
   serviceable unless it starts with 9 (army/foreign POS),
   COD blocked on a deterministic subset, ETA by zone.               */
function pincodeInfo(pin) {
  if (!/^\d{6}$/.test(pin)) return null;
  const prefix = pin.slice(0, 2);
  const sum = pin.split('').reduce((a, d) => a + (+d), 0);
  const serviceable = pin[0] !== '9';
  const isRaj = pin.startsWith('30');
  return {
    pin,
    serviceable,
    cod: serviceable && sum % 7 !== 0,
    eta: isRaj ? '1–2 days' : STORE.metroPrefixes.includes(prefix) ? '2–3 days' : '3–6 days',
    courier: isRaj ? 'Delhivery' : (sum % 2 ? 'Delhivery' : 'Blue Dart'),
    express: serviceable
  };
}

/* ---------- GST helpers (buyer-state aware) ---------- */
function gstSplit(amountInclTax, rate, buyerState) {
  const taxable = amountInclTax / (1 + rate);
  const tax = amountInclTax - taxable;
  const intra = String(buyerState || '').trim().toLowerCase() === STORE.sellerState.toLowerCase();
  return {
    rate, taxable, tax, intra,
    cgst: intra ? tax / 2 : 0,
    sgst: intra ? tax / 2 : 0,
    igst: intra ? 0 : tax
  };
}
const hsnFor = p => (p && p.hsn) || STORE.gst.hsnDefault;

/* ---------- order store (shared by checkout/track/invoice/admin) ---------- */
const ORDERS_KEY = 'amour_orders_v1';
function getOrders() { try { return JSON.parse(localStorage.getItem(ORDERS_KEY)) || []; } catch (e) { return []; } }
function saveOrders(o) { localStorage.setItem(ORDERS_KEY, JSON.stringify(o)); }

/* demo orders for tracking/admin demo when no real order exists */
function seedOrdersIfEmpty() {
  if (getOrders().length) return;
  const mk = (id, name, city, state, pin, method, status, daysAgo, itemIdx) => {
    const p = PRODUCTS[itemIdx];
    return {
      id, date: new Date(Date.now() - daysAgo * 864e5).toISOString(),
      items: [{ id: p.id, name: p.name, qty: 1, price: p.price }],
      sub: p.price, ship: status === 'Placed' ? 99 : 0, method, status,
      courier: status === 'Placed' ? '—' : 'Delhivery',
      awb: status === 'Placed' ? '—' : 'DL' + (23456000 + daysAgo * 911),
      customer: { name, city, state, pin },
      whatsapp: true
    };
  };
  saveOrders([
    mk('AJ20260001', 'Ananya Sharma', 'Jaipur', 'Rajasthan', '302001', 'UPI', 'Delivered', 9, 0),
    mk('AJ20260002', 'Rhea Kapoor', 'Mumbai', 'Maharashtra', '400001', 'COD', 'In Transit', 2, 2),
    mk('AJ20260003', 'Meher Deol', 'Ludhiana', 'Punjab', '141001', 'UPI', 'Placed', 0, 4)
  ]);
}

/* ---------- marketing / analytics loader (gated) ---------- */
const ANALYTICS = {
  // TODO (client): replace IDs, then set enabled:true — snippets load only when enabled.
  enabled: false,
  ga4: 'G-XXXXXXXXXX',
  metaPixel: '000000000000000'
};
function loadAnalytics() {
  const A = getSettings().analytics;
  if (!A.enabled) return;
  if (A.ga4) {
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + A.ga4;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    gtag('js', new Date());
    gtag('config', A.ga4);
  }
  if (A.metaPixel) {
    window.fbq = window.fbq || function () { (window.fbq.queue = window.fbq.queue || []).push(arguments); };
    window.fbq.queue = window.fbq.queue || [];
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(s);
    fbq('init', A.metaPixel);
    fbq('track', 'PageView');
  }
}
/* conversion events — fire through this everywhere */
function trackEvent(name, data) {
  const A = getSettings().analytics;
  if (A.enabled && A.conversion && window.gtag) gtag('event', name, data || {});
  if (A.enabled && A.conversion && window.fbq) fbq('track', name, data || {});
}
const SETTINGS_KEY = 'amour_settings_v2'; /* v2 — COD limit moved ₹10,000 → ₹5,000; old saved settings ignored */
const DEFAULT_SETTINGS = {
  shipping: { freeShip: STORE.freeShip, std: STORE.ship.std, express: STORE.ship.express, codFee: STORE.ship.codFee, codLimit: STORE.ship.codLimit },
  gst: { rate: STORE.gst.rate, inclusive: STORE.gst.inclusive, hsnDefault: STORE.gst.hsnDefault, roundOff: STORE.gst.roundOff },
  analytics: { enabled: false, ga4: 'G-XXXXXXXXXX', metaPixel: '000000000000000', searchConsole: '', merchantCenter: '', metaCatalogue: '', conversion: true },
  whatsapp: { enabled: true, number: STORE.whatsapp.number, stages: { placed: true, paid: true, packed: true, shipped: true, ofd: true, delivered: true, review: true } },
  security: { admin2fa: true, customerOtp: true, captcha: true, waf: true, ssl: true, backups: 'Daily 03:00 IST', retention: '30 days', lockout: 5, sessionMins: 60 },
  seo: { suffix: STORE.brand, sitemap: true, robots: true, cleanUrls: true, canonical: true, schema: true },
  marketing: { firstOrder: 10, referral: 10, abandoned: { nudge: '60 min', follow: '24 hrs (+5% code)', final: '72 hrs' }, recovered: {}, broadcast: {} }
};
const GIFT_KEY = 'amour_giftcards_v1';

/* deep-merge stored settings over the defaults above */
function deepMerge(base, over) {
  const out = Array.isArray(base) ? base.slice() : Object.assign({}, base);
  Object.keys(over || {}).forEach(k => {
    const v = over[k];
    out[k] = (v && typeof v === 'object' && !Array.isArray(v) && base[k] && typeof base[k] === 'object')
      ? deepMerge(base[k], v) : v;
  });
  return out;
}
function getSettings() {
  let stored = {};
  try { stored = JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}; } catch (e) { stored = {}; }
  return deepMerge(DEFAULT_SETTINGS, stored);
}
function saveSettings(patch) {
  let stored = {};
  try { stored = JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}; } catch (e) { stored = {}; }
  const next = deepMerge(stored, patch);
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(next)); } catch (e) {}
  applyStoreSettings();
  return getSettings();
}
/* push the saved settings into STORE — runs at load, so anything the
   admin console changes is immediately live on checkout / cart / track */
function applyStoreSettings() {
  const s = getSettings();
  STORE.freeShip = +s.shipping.freeShip;
  STORE.ship = { std: +s.shipping.std, express: +s.shipping.express, codFee: +s.shipping.codFee, codLimit: +s.shipping.codLimit };
  STORE.gst = { rate: +s.gst.rate, inclusive: !!s.gst.inclusive, hsnDefault: s.gst.hsnDefault, roundOff: !!s.gst.roundOff };
  STORE.whatsapp = { number: s.whatsapp.number, enabled: !!s.whatsapp.enabled };
  ANALYTICS.enabled = !!s.analytics.enabled;
  ANALYTICS.ga4 = s.analytics.ga4;
  ANALYTICS.metaPixel = s.analytics.metaPixel;
  return s;
}
applyStoreSettings();

/* ---------- coupon engine (defaults + admin-created) ---------- */
function getCoupons() {
  let custom = [];
  try { custom = JSON.parse(localStorage.getItem(COUPONS_KEY)) || []; } catch (e) { custom = []; }
  const map = {};
  DEFAULT_COUPONS.forEach(c => map[c.code.toUpperCase()] = c);
  custom.forEach(c => map[c.code.toUpperCase()] = c);
  return Object.values(map);
}

/* ---------- shared readers used by the admin console ---------- */
function readList(key) { try { return JSON.parse(localStorage.getItem(key)) || []; } catch (e) { return []; } }
function writeList(key, list) { try { localStorage.setItem(key, JSON.stringify(list)); } catch (e) {} }
function getReturns()  { return readList(RETURNS_KEY); }
function saveReturns(l) { writeList(RETURNS_KEY, l); }
function getCarts()    { return readList(CARTS_KEY); }
function saveCarts(l)  { writeList(CARTS_KEY, l); }
function getAlerts()   { return readList(ALERTS_KEY); }
function saveAlerts(l) { writeList(ALERTS_KEY, l); }
function getGiftCards() { return readList(GIFT_KEY); }
function saveGiftCards(l) { writeList(GIFT_KEY, l); }
function getBroadcasts() { return readList(BCAST_KEY); }
function saveBroadcasts(l) { writeList(BCAST_KEY, l); }
function getOverrides() { return readList('amour_product_overrides_v1'); }
function saveOverrides(l) { writeList('amour_product_overrides_v1', l); }

/* catalog = PRODUCTS with the admin overlay applied */
function getCatalog() {
  const ov = getOverrides();
  return PRODUCTS.map(p => {
    const o = ov.find(x => x.id === p.id);
    return o ? Object.assign({}, p, o) : p;
  });
}
