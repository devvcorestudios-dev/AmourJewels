/* ============================================================
   AMOUR JEWELS — GST tax invoice (printable)
   ============================================================ */
const rupee2 = n => '₹' + (Math.round(n * 100) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const inWords = n => {
  n = Math.round(n);
  const a = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  const seg = x => {
    let s = '';
    if (x >= 100) { s += a[Math.floor(x / 100)] + ' hundred '; x %= 100; }
    if (x >= 20) { s += b[Math.floor(x / 10)] + (x % 10 ? ' ' + a[x % 10] : '') + ' '; }
    else if (x > 0) { s += a[x] + ' '; }
    return s;
  };
  const crore = Math.floor(n / 1e7), lakh = Math.floor((n % 1e7) / 1e5), thou = Math.floor((n % 1e5) / 1e3), rest = n % 1e3;
  let s = '';
  if (crore) s += seg(crore) + 'crore ';
  if (lakh) s += seg(lakh) + 'lakh ';
  if (thou) s += seg(thou) + 'thousand ';
  if (rest) s += seg(rest);
  return (s.trim() ? s.trim() + ' rupees only' : 'zero rupees only').replace(/^\w/, c => c.toUpperCase());
};

function renderInvoice() {
  seedOrdersIfEmpty();
  const id = new URLSearchParams(window.location.search).get('order');
  const orders = getOrders();
  const o = (id && orders.find(x => x.id === id)) || orders[0];
  if (!o) { $('#invRoot').innerHTML = '<p>No invoice found. <a href="index.html">Back to store</a>.</p>'; return; }

  const a = o.addr || o.customer || { name: 'Guest', city: '', state: '', pin: '' };
  const full = a.address ? a.address : '—';
  const addrBlock = `${a.name || ''}<br>${full}${a.landmark ? ', ' + a.landmark : ''}<br>${a.city || ''}, ${a.state || ''} — ${a.pincode || a.pin || ''}${o.gstin ? '<br>GSTIN: ' + o.gstin : ''}`;
  $('#invBuyer').innerHTML = addrBlock;
  $('#invShip').innerHTML = addrBlock;
  $('#invPos').textContent = a.state || STORE.sellerState;
  $('#invNo').textContent = 'AJ/' + new Date(o.date).getFullYear() + '/' + o.id.replace('AJ', '');
  $('#invDate').textContent = new Date(o.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const g = o.gst || { rate: STORE.gst.rate, taxable: o.sub / (1 + STORE.gst.rate), cgst: 0, sgst: 0, igst: 0, intra: false };
  const recomputed = gstSplit(Math.max(0, (o.sub || 0) - (o.disc || 0)), g.rate, a.state);
  const gs = o.gst && o.gst.taxable != null ? { ...o.gst } : recomputed;
  const ship = o.ship || 0;
  const rows = (o.items || []).map((i, n) => {
    const lineTaxable = (i.price * i.qty) / (1 + gs.rate);
    const lineTax = i.price * i.qty - lineTaxable;
    return `<tr><td>${n + 1}</td><td>${i.name}</td><td>${hsnFor(productById(i.id))}</td><td class="num">${i.qty}</td><td class="num">${rupee2(lineTaxable)}</td><td class="num">${rupee2(lineTax)}</td><td class="num">${rupee2(i.price * i.qty)}</td></tr>`;
  }).join('');
  $('#invRows').innerHTML = rows;

  const taxableSub = (o.sub - (o.disc || 0)) / (1 + gs.rate);
  const taxAmt = (o.sub - (o.disc || 0)) - taxableSub;
  const rowsTot = `
    <div class="srow"><span>Taxable value</span><span>${rupee2(taxableSub)}</span></div>
    ${gs.intra || gs.cgst
      ? `<div class="srow"><span>CGST @ ${gs.rate * 100 / 2}%</span><span>${rupee2(taxAmt / 2)}</span></div>
         <div class="srow"><span>SGST @ ${gs.rate * 100 / 2}%</span><span>${rupee2(taxAmt / 2)}</span></div>`
      : `<div class="srow"><span>IGST @ ${gs.rate * 100}%</span><span>${rupee2(taxAmt)}</span></div>`}
    ${ship ? `<div class="srow"><span>Shipping (insured)</span><span>${rupee2(ship)}</span></div>` : ''}
    <div class="srow big"><span>Total</span><span>${rupee2((o.total != null ? o.total : o.sub + ship))}</span></div>
    <div class="srow"><span style="color:var(--taupe)">Amount in words</span></div>
    <div class="srow" style="font-size:11.5px;color:var(--taupe)"><span>${inWords(o.total != null ? o.total : o.sub + ship)}</span></div>`;
  $('#invTots').innerHTML = rowsTot;
}

document.addEventListener('DOMContentLoaded', () => {
  renderInvoice();
  $('#invPrint').addEventListener('click', () => window.print());
});