/* ============================================================
   AMOUR JEWELS — Product detail page
   ============================================================ */

const SHIP_COPY = 'Dispatched in 24–48 hrs from our atelier via Delhivery / BlueDart, fully insured. Metro delivery in 2–3 days, rest of India in 3–6 days. All orders are prepaid (UPI, cards, net-banking).';

let pdp = { size: null, qty: 1 };

function galleryHTML(p) {
  const imgs = [...new Set([p.img, p.alt])];
  return `
  <div class="pdp-gallery">
    <div class="pdp-main">
      ${p.tag === 'New' ? '<span class="p-tag new">New In</span>' : p.tag === 'Bestseller' ? '<span class="p-tag">Bestseller</span>' : ''}
      <img id="pdpMainImg" src="${imgs[0]}" alt="${p.name}">
    </div>
    <div class="pdp-thumbs">
      ${imgs.map((src, i) => `<button class="${i === 0 ? 'active' : ''}" data-thumb="${src}"><img src="${src}" alt=""></button>`).join('')}
    </div>
  </div>`;
}

function infoHTML(p) {
  const off = Math.round((1 - p.price / p.mrp) * 100);
  const sizes = p.sizes ? `
    <div class="opt-label"><span>Select Size ${p.sizes.length <= 4 ? '· US' : '· Inches'}</span><a href="contact.html">Size help</a></div>
    <div class="size-row" id="sizeRow">
      ${p.sizes.map(s => `<button data-size="${s}">${s}</button>`).join('')}
    </div>` : '';
  return `
  <div class="pdp-info">
    <p class="crumbs"><a href="index.html">Home</a> &nbsp;/&nbsp; <a href="shop.html">Shop</a> &nbsp;/&nbsp; <span>${catLabel(p)}</span></p>
    <h1>${p.name}</h1>
    ${starHTML(p.rating, p.reviews)}
    <div class="pdp-price">
      <span class="now">${money(p.price)}</span>
      ${p.mrp > p.price ? `<s>${money(p.mrp)}</s><span class="save">Save ${off}%</span>` : ''}
    </div>
    <p class="pdp-tax">Inclusive of all taxes · SKU ${p.sku}</p>
    <p class="pdp-desc">${p.desc}</p>
    ${sizes}
    <div class="pdp-actions">
      <button class="btn" id="pdpAdd">Add to Bag — ${money(p.price)}</button>
      <button class="wish-toggle ${isWished(p.id) ? 'active' : ''}" id="pdpWish" aria-label="Add to wishlist">
        <svg viewBox="0 0 24 24" stroke-width="1.5"><path d="M12 20.5c-5.2-3.9-8.5-7-8.5-10.6C3.5 7 5.5 5 8 5c1.6 0 3.1.9 4 2.2C12.9 5.9 14.4 5 16 5c2.5 0 4.5 2 4.5 4.9 0 3.6-3.3 6.7-8.5 10.6z"/></svg>
      </button>
    </div>
    <button class="btn ghost" id="buyNow" style="margin-top:12px">Buy Now — Express Checkout</button>
    <a class="wa-inline" id="pdpWa" target="_blank" rel="noopener">
      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2zm5.5 14.1c-.2.7-1.2 1.3-1.7 1.3-.4.1-1 .1-1.6-.1-.4-.1-.9-.3-1.5-.5-2.6-1.1-4.3-3.7-4.4-3.9-.1-.2-1-1.4-1-2.6s.6-1.8.9-2c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.4l.9 2.1c.1.2.1.4 0 .6l-.4.6-.5.5c-.2.2-.3.4-.1.7.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.7-.1l1-1.2c.2-.3.4-.2.7-.1l2 1c.3.1.5.2.6.3.1.2.1.8-.1 1.4z"/></svg>
      Order on WhatsApp</a>
    <div class="ship-widget" id="pdpShipCheck" style="margin-top:18px">
      <b>Delivery &amp; Prepaid Checkout</b>
      <div class="coupon-row">
        <input id="pdpPin" placeholder="Enter pincode" inputmode="numeric" maxlength="6" style="text-transform:none">
        <button class="btn ghost" id="pdpPinBtn" type="button">Check</button>
      </div>
      <p id="pdpPinResult" style="margin-top:8px"></p>
    </div>
    <div class="pdp-trust">
      <div>
        <svg viewBox="0 0 24 24" fill="none" stroke-width="1.4"><path d="M2 7h11v10H2zM13 10h4l3 3v4h-7z"/><circle cx="6" cy="17" r="1.8"/><circle cx="16.5" cy="17" r="1.8"/></svg>
        <span>Insured, tracked shipping</span>
      </div>
      <div>
        <svg viewBox="0 0 24 24" fill="none" stroke-width="1.4"><path d="M12 3l7 3v5c0 5-3 8.5-7 10-4-1.5-7-5-7-10V6l7-3z"/><path d="M9 12l2 2 4-4"/></svg>
        <span>7-day easy exchange</span>
      </div>
      <div>
        <svg viewBox="0 0 24 24" fill="none" stroke-width="1.4"><rect x="2" y="6" width="20" height="12" rx="1"/><path d="M2 10h20"/></svg>
        <span>Secure prepaid payments</span>
      </div>
    </div>
    <div class="accordions" id="pdpAcc">
      <div class="acc">
        <button class="acc-head">Product Details
          <svg viewBox="0 0 24 24" fill="none" stroke-width="1.5"><path d="M12 5v14M5 12h14"/></svg>
        </button>
        <div class="acc-body"><div class="acc-body-in"><ul>${p.details.map(d => `<li>${d}</li>`).join('')}</ul></div></div>
      </div>
      <div class="acc">
        <button class="acc-head">Care &amp; Composition
          <svg viewBox="0 0 24 24" fill="none" stroke-width="1.5"><path d="M12 5v14M5 12h14"/></svg>
        </button>
        <div class="acc-body"><div class="acc-body-in"><p>Wear it, love it — just keep it away from perfume, chlorine and the gym. Wipe with the flannel pouch after wear and store flat. Vermeil matures like everything beautiful: a soft patina is normal; a gold-tone polish cloth brings the shine right back.</p></div></div>
      </div>
      <div class="acc">
        <button class="acc-head">Shipping &amp; Returns
          <svg viewBox="0 0 24 24" fill="none" stroke-width="1.5"><path d="M12 5v14M5 12h14"/></svg>
        </button>
        <div class="acc-body"><div class="acc-body-in"><p>${SHIP_COPY} Exchange or store credit within 7 days of delivery — the piece must be unworn and in its box. Earrings are exchangeable only for manufacturing defects.</p></div></div>
      </div>
    </div>
  </div>`;
}


function bindPDP(p) {
  $('#pdpAcc').addEventListener('click', e => {
    const head = e.target.closest('.acc-head');
    if (!head) return;
    const acc = head.parentElement;
    const body = acc.querySelector('.acc-body');
    const open = acc.classList.toggle('open');
    body.style.maxHeight = open ? body.scrollHeight + 'px' : '0';
  });

  const sizeRow = $('#sizeRow');
  if (sizeRow) {
    sizeRow.addEventListener('click', e => {
      const b = e.target.closest('[data-size]');
      if (!b) return;
      $$('#sizeRow button').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      pdp.size = b.dataset.size;
    });
  }

  $('#pdpAdd').addEventListener('click', () => {
    if (addToCart(p.id, pdp.size, pdp.qty)) {
      const b = $('#pdpAdd');
      b.textContent = 'Added to Bag ✓';
      setTimeout(() => { b.textContent = 'Add to Bag — ' + money(p.price); }, 1800);
    }
  });

  $('#pdpWish').addEventListener('click', () => {
    toggleWish(p.id);
    $('#pdpWish').classList.toggle('active', isWished(p.id));
  });

  $('#buyNow').addEventListener('click', () => {
    if (addToCart(p.id, pdp.size, pdp.qty, false)) {
      window.location.href = 'checkout.html';
    }
  });

  const wa = $('#pdpWa');
  if (wa) {
    wa.href = 'https://wa.me/' + (typeof STORE !== 'undefined' ? STORE.whatsapp.number : '919000040000')
      + '?text=' + encodeURIComponent('Hi Amour Jewels! I would like to order: ' + p.name + ' (' + money(p.price) + ').');
  }

  const pinBtn = $('#pdpPinBtn');
  const pinCheck = () => {
    const res = $('#pdpPinResult');
    $('#pdpPin').value = $('#pdpPin').value.replace(/\D/g, '').slice(0, 6);
    const info = pincodeInfo($('#pdpPin').value);
    if (!info) { res.textContent = 'Enter a valid 6-digit pincode.'; return; }
    if (!info.serviceable) res.innerHTML = '✕ Not serviceable at ' + info.pin + ' yet.';
    else res.innerHTML = '✓ Delivers in <b>' + info.eta + '</b> via ' + info.courier + ' · Secure prepaid checkout.';
  };
  if (pinBtn) {
    pinBtn.addEventListener('click', pinCheck);
    $('#pdpPin').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); pinCheck(); } });
  }

  $$('.pdp-thumbs button').forEach(b => b.addEventListener('click', () => {
    $$('.pdp-thumbs button').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    $('#pdpMainImg').src = b.dataset.thumb;
  }));
}

document.addEventListener('DOMContentLoaded', () => {
  const root = $('#pdpRoot');
  if (!root) return;
  const id = new URLSearchParams(window.location.search).get('id');
  const p = productById(id) || PRODUCTS[0];
  document.title = p.name + ' — Amour Jewels';
  root.innerHTML = galleryHTML(p) + infoHTML(p);
  bindPDP(p);

  /* SEO — Product schema */
  const schema = document.createElement('script');
  schema.type = 'application/ld+json';
  schema.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    sku: p.sku,
    image: [p.img, p.alt],
    description: p.desc,
    brand: { '@type': 'Brand', name: 'Amour Jewels' },
    aggregateRating: { '@type': 'AggregateRating', ratingValue: p.rating, reviewCount: p.reviews },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'INR',
      price: p.price,
      availability: 'https://schema.org/InStock',
      url: window.location.href
    }
  });
  document.head.appendChild(schema);

  let pairs = PRODUCTS.filter(x => x.id !== p.id && (x.cat || []).some(c => (p.cat || []).includes(c)));
  if (pairs.length < 2) pairs = PRODUCTS.filter(x => x.id !== p.id);
  const sec = $('#pairsSection');
  sec.hidden = false;
  $('#pairsGrid').innerHTML = pairs.slice(0, 4).map(cardHTML).join('');
});