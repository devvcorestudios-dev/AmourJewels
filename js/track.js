/* ============================================================
   AMOUR JEWELS — Order tracking, cancellation, returns/exchange
   ============================================================ */

const RETURNS_KEY = 'amour_returns_v1';
const STAGES = [
  { key: 'Placed',           label: 'Order Placed',      note: 'Order confirmed. Payment verified.' },
  { key: 'Packed',           label: 'Packed at Atelier', note: 'Hand-finished, quality-checked and packed in the signature keepsake box.' },
  { key: 'Shipped',          label: 'Shipped',           note: 'Picked up by courier. Fully insured in transit.' },
  { key: 'In Transit',       label: 'In Transit',        note: 'Moving through the courier network towards you.' },
  { key: 'Out for Delivery', label: 'Out for Delivery',  note: 'Arriving today. Keep your phone handy.' },
  { key: 'Delivered',        label: 'Delivered',         note: 'Enjoy your sparkle! Exchange window: 7 days from delivery.' }
];
const stageIndex = s => Math.max(0, STAGES.findIndex(x => x.key === s));
const fmtDate = iso => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
const addDays = (iso, n) => new Date(new Date(iso).getTime() + n * 864e5).toISOString();

function findOrder(id) {
  return getOrders().find(o => o.id.toUpperCase() === String(id || '').trim().toUpperCase());
}

function timelineHTML(order) {
  const idx = stageIndex(order.status);
  const terminal = ['Cancelled', 'Return Requested', 'RTO'].includes(order.status);
  return '<div class="tl">' + STAGES.map((s, i) => `
    <div class="tl-step ${i < idx ? 'done' : ''} ${i === idx && !terminal ? 'now' : ''}">
      <span class="tl-dot">${i < idx ? '✓' : (i + 1)}</span>
      <div class="tl-body">
        <b>${s.label}</b>
        <p>${s.note}</p>
        ${i <= idx ? `<span class="tl-date">${fmtDate(addDays(order.date, i))}</span>` : ''}
      </div>
    </div>`).join('') + '</div>';
}

function waInline(text) {
  return `<a class="wa-inline" target="_blank" rel="noopener" href="https://wa.me/${STORE.whatsapp.number}?text=${encodeURIComponent(text)}">
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2zm5.5 14.1c-.2.7-1.2 1.3-1.7 1.3-.4.1-1 .1-1.6-.1-.4-.1-.9-.3-1.5-.5-2.6-1.1-4.3-3.7-4.4-3.9-.1-.2-1-1.4-1-2.6s.6-1.8.9-2c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.4l.9 2.1c.1.2.1.4 0 .6l-.4.6-.5.5c-.2.2-.3.4-.1.7.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.7-.1l1-1.2c.2-.3.4-.2.7-.1l2 1c.3.1.5.2.6.3.1.2.1.8-.1 1.4z"/></svg>
    Updates on WhatsApp</a>`;
}

function actionsHTML(order) {
  const early = ['Placed', 'Packed'].includes(order.status);
  const live = ['Shipped', 'In Transit', 'Out for Delivery'].includes(order.status);
  const inWindow = order.status === 'Delivered' && (Date.now() - new Date(order.date).getTime()) < 12 * 864e5;
  let html = '<div class="trk-actions">';
  if (early) html += '<button class="btn ghost" data-act="cancel">Cancel Order</button>';
  if (live) html += `<a class="btn ghost" target="_blank" rel="noopener" href="https://www.delhivery.com/track/${order.awb}">Track on ${order.courier} ↗</a>`;
  if (inWindow) {
    html += '<button class="btn ghost" data-act="return">Request Return &amp; Refund</button>';
    html += '<button class="btn ghost" data-act="exchange">Request Exchange</button>';
  }
  html += `<a class="btn ghost" href="invoice.html?order=${order.id}">GST Invoice</a>`;
  html += waInline('Updates for order ' + order.id + ' please');
  html += '</div>';
  if (live) html += '<p class="sub-hint" style="margin-top:16px">Undelivered after 7 attempts? The shipment returns to us (RTO) and prepaid orders are auto-refunded within 48 hrs.</p>';
  if (early) html += '<p class="sub-hint" style="margin-top:16px">Cancel free of charge before dispatch — refunds land in 3–5 working days.</p>';
  return html;
}

/* courier scan trail — "where is my product right now" */
function scanTrail(order) {
  const idx = stageIndex(order.status);
  const dest = (order.customer && order.customer.city) || 'your city';
  const locs = ['Jaipur — Amour Atelier', 'Jaipur — Amour Atelier', 'Jaipur — Courier facility',
    'Regional hub — moving towards ' + dest, dest + ' — with delivery executive', 'Delivered at ' + dest];
  const evts = ['Order placed', 'Packed at the atelier', 'Shipped — picked up by courier',
    'In transit', 'Out for delivery', 'Delivered — signed at doorstep'];
  return evts.slice(0, idx + 1).map((evt, i) => ({ evt, loc: locs[i], when: fmtDate(addDays(order.date, i)) }));
}

function renderOrder(order) {
  const items = order.items.map(i => {
    const p = productById(i.id);
    return `<div class="trk-item">
      <img src="${p ? p.img : IMG('1599643478518-a784e5dc4c8f', 400)}" alt="${i.name}" loading="lazy" onerror="this.style.display='none'">
      <div class="trk-item-info">
        <b>${i.name}</b>
        <span>Qty ${i.qty}</span>
        <span class="trk-item-status">${order.status}</span>
      </div>
      <span class="trk-item-price">${money(i.price * i.qty)}</span>
    </div>`;
  }).join('');
  /* shipment state strip — shipped or not, and where it is right now */
  const LAST = scanTrail(order).slice(-1)[0];
  let shipHTML = '';
  if (order.status === 'Placed' || order.status === 'Packed') {
    shipHTML = `<div class="ship-state pre"><span class="ss-ico">📦</span><div><b>Not shipped yet</b>
      <span>${order.status === 'Placed' ? 'Payment verified — packing at our Jaipur atelier. Ships within 24–48 hrs.' : 'Packed in the signature keepsake box — courier pickup scheduled.'}</span></div></div>`;
  } else if (['Shipped', 'In Transit', 'Out for Delivery'].includes(order.status)) {
    shipHTML = `<div class="ship-state"><span class="ss-ico">🚚</span><div><b>Shipped — ${order.status}</b>
      <span>Currently: ${LAST.loc} · AWB ${order.awb} with ${order.courier}.</span></div></div>`;
  } else if (order.status === 'Delivered') {
    shipHTML = `<div class="ship-state done"><span class="ss-ico">✅</span><div><b>Product delivered</b>
      <span>Signed for on ${LAST.when} — 7-day exchange window open till ${fmtDate(addDays(order.date, 12))}.</span></div></div>`;
  }

  /* courier scan activity */
  const scanHTML = order.awb && order.awb !== '—' ? `
    <div class="trk-items-head" style="border:0;padding:0;margin-top:18px">Tracking activity — AWB ${order.awb} · ${order.courier}</div>
    <div class="scan-list">${scanTrail(order).map(s => `
      <div class="scan"><div class="scan-main"><b>${s.evt}</b><p>${s.loc}</p></div><span class="scan-date">${s.when}</span></div>`).join('')}</div>` : '';

  /* delivered → celebration banner with Shop More + review section */
  const delivHTML = order.status === 'Delivered' ? `
    <div class="deliv-banner">
      <span class="ss-ico">🎉</span>
      <b>Product delivered — we hope you love it!</b>
      <a class="btn" href="shop.html">Shop More</a>
    </div>
    <div class="rv" id="rvSec">
      <h4>Review your purchase</h4>
      <p class="sub-hint">Your review helps other shoppers — and helps our karigars improve.</p>
      <div class="rv-stars" role="radiogroup" aria-label="Rating">${[1,2,3,4,5].map(n => `<button type="button" class="rv-star" data-star="${n}" aria-label="${n} star">★</button>`).join('')}</div>
      <div class="rv-row">
        <input id="rvName" type="text" placeholder="Your name" autocomplete="name">
        <input id="rvTitle" type="text" placeholder="Review title — e.g. “Exquisite craft”">
      </div>
      <textarea id="rvText" placeholder="Tell us about the finish, sparkle, comfort…"></textarea>
      <div class="rv-foot">
        <button class="btn" type="button" id="rvSubmit">Submit Review</button>
        <p class="sub-hint">Reviews are moderated before publishing.</p>
      </div>
    </div>` : '';

  $('#trkResult').innerHTML = `
  <div class="bento">
    <div style="display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;align-items:flex-start">
      <div>
        <h3 style="margin-bottom:4px">Order ${order.id}</h3>
        <p class="sub-hint">Placed ${fmtDate(order.date)} · ${order.method}${order.whatsapp ? ' · WhatsApp updates on' : ''}</p>
      </div>
      <span class="badge-ver">${order.status}</span>
    </div>
    <div class="trk-meta">
      <div class="tm"><span>Courier</span><b>${order.courier || '—'}</b></div>
      <div class="tm"><span>Tracking ID (AWB)</span><b>${order.awb || '—'}</b></div>
      <div class="tm"><span>Shipping to</span><b>${order.customer ? order.customer.city + ', ' + order.customer.state : '—'}</b></div>
      <div class="tm"><span>Total</span><b>${money(order.total != null ? order.total : order.sub + (order.ship || 0))}</b></div>
    </div>
    ${order.status === 'Cancelled' ? '<p class="sub-hint">This order was cancelled. Prepaid refunds reflect in 3–5 working days.</p>'
      : order.status === 'Return Requested' ? '<p class="sub-hint">Return/exchange request received — we will arrange a reverse pickup within 24 hrs.</p>'
      : shipHTML + scanHTML + timelineHTML(order)}
    <div class="trk-items-head">Products in this order</div>
    <div class="trk-items">${items}</div>
    ${delivHTML}
    ${actionsHTML(order)}
  </div>`;

  $$('#trkResult [data-act]').forEach(b => b.addEventListener('click', () => orderAction(order.id, b.dataset.act)));
  wireReview(order);
}

/* ---------- post-delivery review (stored in amour_reviews_v1) ---------- */
const REVIEWS_KEY = 'amour_reviews_v1';

function reviewsAll() {
  try { return JSON.parse(localStorage.getItem(REVIEWS_KEY)) || []; } catch (e) { return []; }
}

function wireReview(order) {
  const sec = $('#rvSec');
  if (!sec) return;
  const stars = $$('#rvSec .rv-star');
  stars.forEach(s => s.addEventListener('click', () => {
    const v = +s.dataset.star;
    stars.forEach(x => x.classList.toggle('on', +x.dataset.star <= v));
    sec.dataset.rating = v;
  }));
  const saved = reviewsAll().find(r => r.orderId === order.id);
  if (saved) {
    sec.innerHTML = `<div class="rv-thanks">
      <span class="rv-show">${'★'.repeat(saved.rating)}${'☆'.repeat(5 - saved.rating)}</span>
      <div><b style="font-weight:500">Thank you, ${saved.name}! Your review has been submitted.</b>
      <p class="sub-hint" style="margin-top:2px">${saved.title} — ${saved.text.length > 90 ? saved.text.slice(0, 90) + '…' : saved.text}</p></div>
    </div>`;
    return;
  }
  $('#rvSubmit').addEventListener('click', () => {
    const rating = +sec.dataset.rating || 0;
    const name = $('#rvName').value.trim();
    const title = $('#rvTitle').value.trim();
    const text = $('#rvText').value.trim();
    if (!rating) { toast('Please choose a star rating'); return; }
    if (!name) { toast('Please add your name'); return; }
    if (text.length < 10) { toast('Review must be at least 10 characters'); return; }
    const list = reviewsAll();
    order.items.forEach(i => list.unshift({
      orderId: order.id, productId: i.id, productName: i.name,
      productImg: (productById(i.id) || {}).img || '',
      rating, name, title, text, date: new Date().toISOString()
    }));
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(list));
    toast('Thank you — review submitted');
    renderOrder(order);
  });
}

function orderAction(id, act) {
  const orders = getOrders();
  const o = orders.find(x => x.id === id);
  if (!o) return;
  if (act === 'cancel') {
    if (!confirm('Cancel order ' + id + '? This cannot be undone.')) return;
    o.status = 'Cancelled';
    saveOrders(orders);
    toast('Order cancelled — refund initiated for prepaid orders');
    renderOrder(o);
    return;
  }
  const kind = act === 'return' ? 'Return & Refund' : 'Exchange';
  const reason = prompt('Reason for ' + kind.toLowerCase() + '?\n1. Size issue\n2. Changed mind\n3. Damaged in transit\n4. Not as described\nType 1–4:');
  if (!reason) return;
  const req = { orderId: id, type: kind, reason: ['Size issue', 'Changed mind', 'Damaged in transit', 'Not as described'][+reason - 1] || 'Other', date: new Date().toISOString() };
  try {
    const list = JSON.parse(localStorage.getItem(RETURNS_KEY)) || [];
    list.unshift(req); localStorage.setItem(RETURNS_KEY, JSON.stringify(list));
  } catch (e) { localStorage.setItem(RETURNS_KEY, JSON.stringify([req])); }
  o.status = 'Return Requested';
  saveOrders(orders);
  toast(kind + ' request received — pickup within 24 hrs');
  renderOrder(o);
}

document.addEventListener('DOMContentLoaded', () => {
  seedOrdersIfEmpty();
  const pre = new URLSearchParams(window.location.search).get('order');
  if (pre) { $('#trkId').value = pre; const o = findOrder(pre); if (o) renderOrder(o); }

  $('#trkForm').addEventListener('submit', e => {
    e.preventDefault();
    const o = findOrder($('#trkId').value);
    if (!o) { toast('No order found — try a demo ID below'); $('#trkResult').innerHTML = ''; return; }
    renderOrder(o);
  });
  $$('.trk-demo').forEach(b => b.addEventListener('click', () => {
    $('#trkId').value = b.dataset.id;
    const o = findOrder(b.dataset.id);
    if (o) renderOrder(o);
  }));
});