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
  // — Shop All dropdown —
  const navDrop = $('#navDrop');
  const shopBtn = $('#shopBtn');
  const shopDropdown = $('#shopDropdown');
  const ddCategories = $('#ddCategories');
  const ddList = $('#ddList');
  const shopOverlay = $('#shopOverlay');
  const ddClose = $('#ddClose');
  const ddHeading = $('#ddHeading');
  let ddHideTimer = null;
  let ddActive = '';

  // Build the category chips with product counts and a sample product image
  const categoryList = [{ key: '', label: 'All Jewellery', count: PRODUCTS.length, img: '' }];
  for (const [catKey, cat] of Object.entries(CATEGORIES)) {
    categoryList.push({
      key: catKey,
      label: cat.label,
      count: PRODUCTS.filter(p => (p.cat || []).includes(catKey)).length,
      img: cat.img
    });
  }

  function renderCategoryChips() {
    ddCategories.innerHTML = categoryList.map(c =>
      `<button type="button" class="dd-category${c.key === ddActive ? ' active' : ''}" data-cat="${c.key}">
        ${c.img ? `<img class="dc-badge" src="${c.img}" alt="${c.label}">` : '<span class="dc-badge dc-all">&#10022;</span>'}
        <span class="dc-label">${c.label}</span>
        <span class="dc-count">${c.count} pieces</span>
      </button>`).join('');
  }

  function renderProductList() {
    const list = ddActive ? PRODUCTS.filter(p => (p.cat || []).includes(ddActive)) : PRODUCTS;
    ddList.innerHTML = list.length
      ? list.map(p => `<a class="dd-product" href="product.html?id=${p.id}">
          <img src="${p.img}" alt="${p.name}" loading="lazy">
          <span class="dp-cat">${catLabel(p)}</span>
          <span class="dp-name">${p.name}</span>
          <span class="dp-price">${money(p.price)}</span>
        </a>`).join('')
      : '<div class="dd-empty">Nothing here (yet).</div>';
    if (ddHeading) {
      ddHeading.textContent = (ddActive ? CATEGORIES[ddActive].label : 'All Jewellery') +
        ' · ' + list.length + ' pieces';
    }
  }

  // — open on hover over the button + panel, close when the pointer leaves —
  function openDropdown() {
    clearTimeout(ddHideTimer);
    if (!shopDropdown) return;
    // Already open — stay put so the fade-in never restarts on navbar hover.
    if (!shopDropdown.hidden && shopDropdown.classList.contains('open')) return;
    renderCategoryChips();
    renderProductList();
    shopDropdown.hidden = false;
    void shopDropdown.offsetWidth;
    shopDropdown.classList.add('open');
    if (shopOverlay) shopOverlay.classList.add('show');
  }

  function closeDropdown() {
    clearTimeout(ddHideTimer);
    if (!shopDropdown || shopDropdown.hidden || !shopDropdown.classList.contains('open')) return;
    shopDropdown.classList.remove('open');
    if (shopOverlay) shopOverlay.classList.remove('show');
    ddHideTimer = setTimeout(() => { shopDropdown.hidden = true; }, 240);
  }

  function scheduleClose() {
    clearTimeout(ddHideTimer);
    ddHideTimer = setTimeout(closeDropdown, 220);
  }

  if (navDrop) {
    navDrop.addEventListener('mouseenter', openDropdown);
    navDrop.addEventListener('mouseleave', scheduleClose);
    navDrop.addEventListener('focusin', openDropdown);
    navDrop.addEventListener('focusout', scheduleClose);
  }

  // preview a category's products on hover — click navigates to the filtered shop page
  if (ddCategories) {
    ddCategories.addEventListener('mouseover', e => {
      const chip = e.target.closest('.dd-category');
      if (!chip || chip.dataset.cat === ddActive) return;
      ddActive = chip.dataset.cat;
      Array.prototype.forEach.call(ddCategories.children, c =>
        c.classList.toggle('active', c.dataset.cat === ddActive));
      renderProductList();
    });
    ddCategories.addEventListener('click', e => {
      const chip = e.target.closest('.dd-category');
      if (!chip) return;
      window.location.href = chip.dataset.cat ? 'shop.html?cat=' + chip.dataset.cat : 'shop.html';
    });
  }

  if (ddClose) ddClose.addEventListener('click', closeDropdown);
  if (shopOverlay) shopOverlay.addEventListener('click', closeDropdown);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDropdown(); });

  // tap fallback for touch devices (desktop nav is hidden ≤1080px anyway)
  if (shopBtn) {
    shopBtn.addEventListener('click', e => {
      if (window.matchMedia('(hover: none)').matches) {
        e.preventDefault();
        if (shopDropdown.hidden) openDropdown(); else closeDropdown();
      }
    });
  }

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