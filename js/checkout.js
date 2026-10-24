/* ============================================================
   AMOUR JEWELS — Checkout (address → payment → success)
   + pincode serviceability · coupons/gift/referral
   + shipping method & rates · GST breakup · order persistence
   ============================================================ */

const ADDR_KEY = 'amour_address_v1';
const COUPON_SESSION_KEY = 'amour_coupon_active_v1';

const getAddr = () => { try { return JSON.parse(localStorage.getItem(ADDR_KEY)) || null; } catch (e) { return null; } };
const saveAddr = a => localStorage.setItem(ADDR_KEY, JSON.stringify(a));

const fieldOk = {
  name:    v => v.trim().length >= 2,
  phone:   v => /^[6-9]\d{9}$/.test(v.trim()),
  email:   v => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.trim()),
  address: v => v.trim().length >= 5,
  pincode: v => /^\d{6}$/.test(v.trim()),
  city:    v => v.trim().length >= 2,
  state:   v => v.trim().length >= 2
};

/* ---------- pincode serviceability ---------- */
function checkPincode() {
  const box = $('#cxShipBox');
  const pin = $('#cxPincode').value.trim();
  if (!/^\d{6}$/.test(pin)) { box.hidden = true; return; }
  const info = pincodeInfo(pin);
  box.hidden = false;
  if (!info.serviceable) {
    box.className = 'ship-widget bad';
    box.innerHTML = `<b>✕ Not serviceable</b><p>Sorry — we don't ship to ${pin} yet. Write to <a href="mailto:${STORE.email}">${STORE.email}</a> and we'll try.</p>`;
  } else {
    box.className = 'ship-widget ok';
    box.innerHTML = `<b>✓ Serviceable — ${info.courier}</b><p>Estimated delivery <b>${info.eta}</b> · Insured, fully tracked.</p>`;
  }
}

/* ---------- shipping method & rates ---------- */
function shipMethod() {
  const r = document.querySelector('#cxPayForm input[name="shipMethod"]:checked');
  return r ? r.value : 'std';
}
function shipCost() {
  return shipMethod() === 'express' ? STORE.ship.express
    : (cartSubtotal() === 0 || cartSubtotal() >= STORE.freeShip ? 0 : STORE.ship.std);
}

/* ---------- coupons ---------- */
function activeCoupon() {
  try { return JSON.parse(sessionStorage.getItem(COUPON_SESSION_KEY)); } catch (e) { return null; }
}
function setActiveCoupon(c) { sessionStorage.setItem(COUPON_SESSION_KEY, JSON.stringify(c)); renderSummary(); renderCouponState(); }
function clearCoupon() { sessionStorage.removeItem(COUPON_SESSION_KEY); renderSummary(); renderCouponState(); }
function applyCoupon() {
  const code = $('#cxCode').value.trim().toUpperCase();
  if (!code) return;
  const c = getCoupons().find(x => x.code.toUpperCase() === code && x.active);
  if (!c) { toast('Invalid or expired code'); return; }
  const sub = cartSubtotal();
  if (sub < c.min) { toast('Add ' + money(c.min - sub) + ' more to use ' + c.code); return; }
  setActiveCoupon(c);
  toast(c.label + ' applied');
}
function renderCouponState() {
  const c = activeCoupon();
  const row = $('#cxApplied');
  if (!c) { row.hidden = true; $('#cxCodeRow').hidden = false; return; }
  row.hidden = false; $('#cxCodeRow').hidden = true;
  row.innerHTML = `<span class="code-chip">✓ ${c.code} — ${c.label}</span><button type="button" id="cxRemoveCode">Remove</button>`;
  $('#cxRemoveCode').addEventListener('click', clearCoupon);
}
function discountFor(c, sub) {
  if (!c) return 0;
  if (c.type === 'pct') return Math.round(sub * c.value / 100);
  if (c.type === 'flat') return Math.min(c.value, sub);
  if (c.type === 'giftcard') return Math.min(c.value, sub);
  return 0;
}

/* ---------- totals & summary ---------- */
function totals() {
  const sub = cartSubtotal();
  const c = activeCoupon();
  const disc = discountFor(c, sub);
  let ship = shipCost();
  if (c && c.type === 'ship') ship = 0;
  const total = Math.max(0, sub - disc) + ship;
  const gst = gstSplit(Math.max(0, sub - disc), STORE.gst.rate, ($('#cxState') || {}).value);
  return { sub, disc, ship, total, gst, coupon: c };
}

function renderSummary() {
  const items = getCart();
  if (!items.length) return;
  const t = totals();
  $('#cxLines').innerHTML = items.map(i => {
    const p = productById(i.id);
    const nm = p ? p.name : 'Amour Gift Card ' + (i.size || '');
    const pr = p ? p.price : (i.amount || 0);
    return `<div class="sum-row"><span>${nm}${i.size && p ? ' · ' + i.size : ''} × ${i.qty}</span><span>${money(pr * i.qty)}</span></div>`;
  }).join('');
  $('#cxSub').textContent = money(t.sub);
  $('#cxDisc').parentElement.hidden = !t.disc;
  $('#cxDisc').textContent = '— ' + money(t.disc);
  $('#cxShip').innerHTML = t.ship === 0 ? '<span class="free">FREE</span>' : money(t.ship);
  const g = t.gst;
  $('#cxGst').innerHTML = `Incl. GST (${Math.round(g.rate * 1000) / 10}%) — ${g.intra ? 'CGST ' + money(g.cgst) + ' + SGST ' + money(g.sgst) : 'IGST ' + money(g.igst)}`;
  $('#cxTotal').textContent = money(t.total);
  $('#cxPayNow').textContent = `Pay ${money(t.total)} Securely`;
}

function setStep(n) {
  $$('#cxStep1,#cxStep2,#cxStep3').forEach(el => el.hidden = true);
  $('#cxStep' + n).hidden = false;
  $$('.step-tab[data-step-tab]').forEach(t => t.classList.toggle('active', +t.dataset.stepTab <= n));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function validateAddress() {
  let firstBad = null;
  Object.keys(fieldOk).forEach(name => {
    const input = $('#cx' + name[0].toUpperCase() + name.slice(1));
    const wrap = input.closest('.field');
    const ok = fieldOk[name](input.value);
    wrap.classList.toggle('invalid', !ok);
    if (!ok && !firstBad) firstBad = input;
  });
  if (firstBad) { firstBad.focus(); toast('Please fix the highlighted fields'); return null; }
  const info = pincodeInfo($('#cxPincode').value.trim());
  if (!info || !info.serviceable) { toast('Sorry — this pincode is not serviceable'); return null; }
  return {
    name: $('#cxName').value.trim(),
    phone: $('#cxPhone').value.trim(),
    email: $('#cxEmail').value.trim(),
    address: $('#cxAddress').value.trim(),
    landmark: $('#cxLandmark').value.trim(),
    pincode: $('#cxPincode').value.trim(),
    city: $('#cxCity').value.trim(),
    state: $('#cxState').value.trim()
  };
}

function prefillAddress() {
  const a = getAddr();
  if (!a) return;
  Object.keys(a).forEach(k => {
    const input = $('#cx' + k[0].toUpperCase() + k.slice(1));
    if (input && a[k]) input.value = a[k];
  });
}

function showShipTo(addr) {
  $('#cxShipTo').innerHTML = `${addr.name}<br>${addr.address}${addr.landmark ? ', ' + addr.landmark : ''}<br>${addr.city}, ${addr.state} — ${addr.pincode}<br>${addr.phone}`;
}

document.addEventListener('DOMContentLoaded', () => {
  if (!$('#cxAddressForm')) return;
  seedOrdersIfEmpty();

  /* empty bag guard */
  if (!getCart().length) {
    $('.checkout-grid').innerHTML = `
      <div class="bento success-wrap" style="grid-column:1/-1">
        <svg class="success-ring" viewBox="0 0 24 24" fill="none" stroke-width="1.2" style="stroke:var(--stone)"><path d="M6 8h12l1 12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1L6 8z"/><path d="M9 10V6a3 3 0 0 1 6 0v4"/></svg>
        <h2>Your bag is empty</h2>
        <p>Add something sparkly before checking out.</p>
        <a class="btn" href="shop.html">Shop the Collections</a>
      </div>`;
    return;
  }

  prefillAddress();
  renderCouponState();
  renderSummary();

  $('#cxPincode').addEventListener('input', () => {
    $('#cxPincode').value = $('#cxPincode').value.replace(/\D/g, '').slice(0, 6);
    if ($('#cxPincode').value.length === 6) checkPincode();
  });
  $('#cxState').addEventListener('input', renderSummary);
  $('#cxPayForm').addEventListener('change', renderSummary);
  $('#cxApply').addEventListener('click', applyCoupon);
  $('#cxCode').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); applyCoupon(); } });

  /* step 1 → 2 */
  $('#cxAddressForm').addEventListener('submit', e => {
    e.preventDefault();
    const addr = validateAddress();
    if (!addr) return;
    saveAddr(addr);
    showShipTo(addr);
    toast('Address saved — choose shipping & payment');
    setStep(2);
  });

  /* step 2 → 3 — prepaid only */
  $('#cxPayForm').addEventListener('submit', e => {
    e.preventDefault();
    const method = ($('#cxPayForm input[name="payMethod"]:checked') || {}).value || 'UPI';
    const btn = $('#cxPayNow');
    btn.disabled = true;
    btn.textContent = 'Processing payment…';

    setTimeout(() => {
      const t = totals();
      const addr = getAddr() || {};
      const orderId = 'AJ' + Date.now().toString().slice(-8);
      const order = {
        id: orderId, date: new Date().toISOString(),
        items: getCart().map(i => {
          const p = productById(i.id);
          return { id: i.id, name: p ? p.name : 'Amour Gift Card ' + (i.size || ''), qty: i.qty, price: p ? p.price : (i.amount || 0) };
        }),
        sub: t.sub, disc: t.disc, ship: t.ship, shipMethod: shipMethod(),
        coupon: t.coupon ? t.coupon.code : null,
        method, total: t.total,
        gst: { rate: t.gst.rate, taxable: Math.round(t.gst.taxable), cgst: Math.round(t.gst.cgst), sgst: Math.round(t.gst.sgst), igst: Math.round(t.gst.igst), intra: t.gst.intra },
        gstin: ($('#cxGstin').value || '').trim(),
        addr, status: 'Placed', courier: '—', awb: '—',
        whatsapp: $('#cxWaOpt').checked
      };
      const orders = getOrders(); orders.unshift(order); saveOrders(orders);
      localStorage.removeItem(CART_KEY);
      sessionStorage.removeItem(COUPON_SESSION_KEY);
      trackEvent('Purchase', { value: t.total, currency: 'INR', transaction_id: orderId });
      syncBadges(); renderDrawer(); renderSummary();
      $('#cxOrderId').textContent = `Order ${orderId} · ${method} paid · ${money(t.total)}`;
      $('#cxWaBtn').href = 'https://wa.me/' + STORE.whatsapp.number + '?text=' + encodeURIComponent('Hi Amour Jewels! Please send me order updates for ' + orderId + ' on WhatsApp.');
      $('#cxSuccessName').textContent = addr.name || 'friend';
      setStep(3);
      toast('Payment successful — order placed ♥');
    }, 1600);
  });

  $('#cxBackToAddress').addEventListener('click', () => setStep(1));

  const saved = getAddr();
  if (saved) showShipTo(saved);
  if (saved && saved.pincode) { $('#cxPincode').value = saved.pincode; checkPincode(); }
});