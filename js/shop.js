/* ============================================================
   AMOUR JEWELS — Shop page (filters + sort + search)
   ============================================================ */

const shopState = { cat: null, coll: null, band: null, q: null, sort: 'featured' };

function readParams() {
  const u = new URLSearchParams(window.location.search);
  shopState.cat = u.get('cat');
  shopState.coll = u.get('collection');
  shopState.q = u.get('q');
  if (u.get('sort')) shopState.sort = u.get('sort');
}

function bannerCopy() {
  const head = $('#bannerHead'), title = $('#bannerTitle'), lede = $('#bannerLede');
  let h = 'Shop All';
  let l = 'Every piece hand-finished in our atelier — 92.5 silver, brass and 18k gold vermeil, set with moissanite polki and hand-picked stones.';
  if (shopState.cat && CATEGORIES[shopState.cat]) {
    h = CATEGORIES[shopState.cat].label;
    l = {
      earrings: 'From everyday gold hoops to statement drops — light enough for all-day wear, bold enough for the baraat.',
      necklaces: 'Chokers, rani haars, lockets and layered chains — the pieces that sit closest and get noticed first.',
      rings: 'Solitaires, halos, bands and stackables in moissanite, zircon and hand-picked stones.',
      bracelets: 'Bridal kadas, chunky chains and tennis lines — weighed, clasped and finished by hand.',
      pearls: 'Freshwater and baroque pearls, hand-knotted and hand-strung in the atelier.',
      everyday: 'The no-occasion pieces — chains, hoops, lockets and studs made to live in.'
    }[shopState.cat] || l;
  } else if (shopState.coll === 'new') {
    h = 'New Arrivals'; l = 'Fresh off the workbench — small-batch drops, usually gone within the fortnight.';
  } else if (shopState.coll === 'bridal') {
    h = 'The Bridal Edit'; l = 'Heirloom-grade sets for the six functions and the sixty years after — moissanite polki, hand-pavé and antique finishes.';
  } else if (shopState.q) {
    h = 'Search: “' + shopState.q + '”'; l = 'Here’s everything that matches your search.';
  }
  if (head) head.textContent = h;
  if (title) title.textContent = h;
  if (lede) lede.textContent = l;
}

function buildFilters() {
  const catWrap = $('#catFilter');
  const collWrap = $('#collFilter');
  const counts = {};
  PRODUCTS.forEach(p => (p.cat || []).forEach(c => counts[c] = (counts[c] || 0) + 1));
  if (catWrap) {
    catWrap.insertAdjacentHTML('beforeend',
      `<a href="shop.html" class="${!shopState.cat ? 'active' : ''}">All Jewellery <span class="n">${PRODUCTS.length}</span></a>` +
      Object.keys(CATEGORIES).map(c =>
        `<a href="shop.html?cat=${c}" class="${shopState.cat === c ? 'active' : ''}">${CATEGORIES[c].label} <span class="n">${counts[c] || 0}</span></a>`
      ).join(''));
  }
  if (collWrap) {
    collWrap.insertAdjacentHTML('beforeend',
      [['new', 'New Arrivals'], ['bridal', 'The Bridal Edit'], ['core', 'Everyday Icons']]
        .map(([k, label]) => `<a href="shop.html?collection=${k}" class="${shopState.coll === k ? 'active' : ''}">${label}</a>`).join(''));
  }
}

function applyFilters() {
  let list = PRODUCTS.slice();
  if (shopState.cat) list = list.filter(p => (p.cat || []).includes(shopState.cat));
  if (shopState.coll) list = list.filter(p => p.collection === shopState.coll);
  if (shopState.q) {
    const t = shopState.q.toLowerCase();
    list = list.filter(p => p.name.toLowerCase().includes(t) || p.desc.toLowerCase().includes(t) || catLabel(p).toLowerCase().includes(t));
  }
  if (shopState.band) {
    const parts = shopState.band.split('-').map(Number);
    list = list.filter(p => p.price >= parts[0] && p.price < parts[1]);
  }
  switch (shopState.sort) {
    case 'low': list.sort((a, b) => a.price - b.price); break;
    case 'high': list.sort((a, b) => b.price - a.price); break;
    case 'rating': list.sort((a, b) => b.rating - a.rating); break;
    case 'new': list.sort((a, b) => (b.collection === 'new') - (a.collection === 'new')); break;
    default: list.sort((a, b) => (b.tag === 'Bestseller') - (a.tag === 'Bestseller'));
  }
  return list;
}


function renderShop() {
  const grid = $('#shopGrid');
  const list = applyFilters();
  $('#shopCount').innerHTML = `Showing <b>${list.length}</b> of ${PRODUCTS.length} pieces`;
  grid.innerHTML = list.length
    ? list.map(cardHTML).join('')
    : `<div class="shop-empty"><h3>Nothing here (yet).</h3><p>Try a different filter — or tell us what you’re hunting for and we’ll make it.</p><a class="btn ghost" href="contact.html">Request a Piece</a></div>`;

  const chips = [];
  if (shopState.cat && CATEGORIES[shopState.cat]) chips.push(['cat', CATEGORIES[shopState.cat].label]);
  if (shopState.coll === 'new') chips.push(['coll', 'New Arrivals']);
  if (shopState.coll === 'bridal') chips.push(['coll', 'The Bridal Edit']);
  if (shopState.coll === 'core') chips.push(['coll', 'Everyday Icons']);
  if (shopState.q) chips.push(['q', '“' + shopState.q + '”']);
  if (shopState.band) {
    const parts = shopState.band.split('-').map(Number);
    chips.push(['band', parts[0] === 0
      ? 'Under ₹' + parts[1].toLocaleString('en-IN')
      : '₹' + parts[0].toLocaleString('en-IN') + ' – ₹' + parts[1].toLocaleString('en-IN')]);
  }
  const row = $('#chipsRow');
  if (row) {
    row.hidden = chips.length === 0;
    row.innerHTML = chips.map(([k, label]) =>
      `<span class="chip">${label}<button data-clear="${k}" aria-label="Clear filter">×</button></span>`).join('');
  }
  $$('.filter-group [data-band]').forEach(a =>
    a.classList.toggle('active', a.dataset.band === shopState.band));
}

function clearParam(k) {
  const u = new URLSearchParams(window.location.search);
  u.delete(k);
  const qs = u.toString();
  window.location.href = 'shop.html' + (qs ? '?' + qs : '');
}

document.addEventListener('DOMContentLoaded', () => {
  if (!$('#shopGrid')) return;
  readParams();
  bannerCopy();
  buildFilters();
  const sel = $('#sortSel');
  sel.value = shopState.sort;
  sel.addEventListener('change', () => { shopState.sort = sel.value; renderShop(); });
  $$('.filter-group [data-band]').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    shopState.band = shopState.band === a.dataset.band ? null : a.dataset.band;
    renderShop();
  }));
  $('#chipsRow').addEventListener('click', e => {
    const btn = e.target.closest('[data-clear]');
    if (!btn) return;
    if (btn.dataset.clear === 'band') { shopState.band = null; renderShop(); }
    else clearParam(btn.dataset.clear);
  });
  renderShop();
});