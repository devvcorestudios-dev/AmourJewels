# Amour Jewels — Frontend Study Guide (for Backend Build)

Purpose: study doc for building the backend. For each major component: what it does, exact HTML+CSS location, JS logic location, backend API that replaces it.

Snapshot: static multi-page site, no framework/build step. State = localStorage/sessionStorage. Rule in `js/admin.js` L1-7: going live = swap local readers for API calls.

## 0. File map

| File | Lines | Role |
|---|---|---|
| `index.html` | ~480 | header, hero slideshow, product rails, story, footer |
| `shop.html` | 255 | banner + filters + sort + `#shopGrid` |
| `product.html` | 223 | PDP shell `#pdpRoot` + `#pairsGrid` |
| `cart.html` | 214 | shell `#cartRoot` filled by `js/cart.js` |
| `checkout.html` | 349 | wizard `#cxStep1/2/3` + summary aside |
| `track.html` / `js/track.js` | ~130/162 | AWB form + timeline + return requests |
| `invoice.html` / `js/invoice.js` | ~90/120 | GST invoice from last order |
| `gift-card.html` | 77 | amount buttons, inline script L58-75 |
| `contact.html` | 378 | `#contactForm`, FAQ `#faqList`, inline JS L339-376 |
| `login.html` / `register.html` | 279/284 | black-and-gold auth pages (`body.auth-dark`): centred `.auth-box` with Email/Phone tabs, `#pnlEmail` (login: password · register: password + confirm), `#pnlPhone` → `#pnlOtp` OTP step, Google mount `#authGoogle`, session panel `#authDone` |
| `js/auth.js` | 316 | `GOOGLE_CLIENT_ID`, `auHash` demo password hash, `auSubmitEmail`/`auSendOtp`/`auVerifyOtp` flows, Google `authHandleCredential` -> `amour_account_v1`, GIS `authRenderButton` (filled_black · signin_with/signup_with), boot + load poll |
| `css/auth.css` | 132 | black/gold skin for `body.auth-dark` (header + drawers included), centred `.auth-shell`/`.auth-box`, tabs, gold-hairline fields, gold gradient button, signed-in panel |
| `orders.html` / `js/orders.js` | ~370/220 | signed-in orders hub: status steppers `#ordList`, buy again `#buyGrid`, address chooser `#addrGrid` + `#addrNew`, related picks `#relGrid`; signed-out visitors are redirected to `register.html?next=orders.html` |
| `about.html` | 287 | static story page |
| `policies.html` | 311 | anchors `#shipping #returns #privacy` etc |
| `admin.html` | 113 | login `#admLogin`, console `#admShell`, nav L56-74 |
| `js/products.js` | 600+ | `CATEGORIES` L8-15, `PRODUCTS[]` L17+, `IMG()` L5-6 |
| `js/store-config.js` | 255 | `STORE` L8-33, coupons L36-44, `pincodeInfo` L54-66, settings ~L150-220, `getCoupons` L223-230, readers L232-255 |
| `js/main.js` | ~788 | helpers L5-10, `cardHTML` L19-43, toast L46-59, wishlist L62-71, cart L75-114, drawer L121-203, account L206-465, header/search ~L466-660 |
| `js/shop.js` | 140 | state L5, params L7-13, banner L15-39, filters L41-58, apply L60-80, render L83-111, boot L120-140 |
| `js/product.js` | 201 | gallery L9-21, info L23-70, bind L90-163, boot L165-201 |
| `js/cart.js` | 102 | `renderCartPage` L5-100, boot L102 |
| `js/checkout.js` | 241 | keys L7-8, pincode L24-37, ship L40-47, coupons L50-79, totals L81-120, steps L150-241 |
| `js/admin.js` | 2037 | auth L9-14, seeds L17-97, helpers L99-185, renderers L186-1937, router L1938+, login L1952-2037 |
| `css/style.css` | 954 | header L118-196, hero L221-287, cards L306-350, shop L527-558, PDP L559-603, cart L680-722, checkout L723-767 |
| `css/admin.css` | 159 | shell L9, nav L14-17, KPI L24-29, cards L31-42, tables L43+, login L132-141 |
| `css/theme-atelier.css` | 154 | LOADS LAST: tokens L32-92, type L99-116, grain L124-128 |

Load order: `products.js` -> `store-config.js` -> `main.js` -> page script, all `defer`. Cache buster `?v=YYYYMMDD`.

## Storage keys (today = localStorage, tomorrow = backend tables)

| Key | JS | Shape | Backend entity |
|---|---|---|---|
| `amour_cart_v1` | main.js L75 | `[{key,id,size,qty}]` + gift lines `{id:'giftcard',amount}` | carts |
| `amour_wishlist_v1` | main.js L62 | `[productId]` | wishlists |
| `amour_account_v1` | main.js L206 | `{name,phone,email}` | customers + auth |
| `amour_addresses_v1` | main.js L207 | array of address objects | addresses |
| `amour_address_v1` | checkout.js L7 | single checkout address | embedded in order |
| `amour_coupon_active_v1` | checkout.js L8 (session) | applied coupon object | validate server-side |
| `amour_orders_v1` | store-config readers | order objects (see S8) | orders |
| `amour_coupons_v1` | store-config L45 | admin coupons | coupons |
| `amour_returns_v1` | store-config L46 | return requests | returns/RMA |
| `amour_abandoned_carts_v1` | store-config L47 | snapshots | abandoned_carts |
| `amour_broadcasts_v1` | store-config L49 | broadcast log | campaigns |
| `amour_giftcards_v1` | store-config L182 | issued gift cards | gift_cards |
| `amour_product_overrides_v1` | store-config L245 | admin price/stock patch | products admin writes |
| `amour_settings_v1` | store-config ~L194-206 | settings patch deep-merged | store_settings |
| `amour_content_v1` | admin.js L14 | `{categories,reviews,discounts,messages,carts}` | various tables |
| `amour_admin_session_v1` etc | admin.js L11-13 | session/lockout/audit | server session + audit |

## 1. Global chrome (header, search, drawer, footer)

### 1A. Announcement + sticky header
- HTML `index.html` L20-63: `header#siteHeader > .announce > .announce-track > span` (message set x2 for loop) + `.header-main` (nav-toggle L34, `nav.main-nav` L37-44, logo L45-48, actions L49-61 with `#searchToggle`, `[data-account]`, `#bagBtn > #bagCount`).
- CSS `style.css` L118-174: `.announce-track` flex keyframes translateX; `.site-header` sticky top translucent butter `rgba(var(--cream-rgb),..)`; 3-zone grid; `.badge-count` pill hidden until `.show`.
- JS `main.js` initHeader ~L466-587: scroll shadow; hydrate `[data-store-money=freeShip]` from `STORE.freeShip`; wire bag/search/account; `syncBadges()` L115-118 updates `#bagCount`.
- Backend: `GET /settings` -> `{freeShip, announcements[]}`. Announce copy hardcoded today; move to settings if editable.

### 1B. Mobile nav + overlay
- HTML L65-91: `#pageOverlay` + `aside#mobileNav` (top, nav, `.m-cats`, foot).
- CSS L175-196: off-canvas left, `.open` slides in.
- JS: navToggle/navClose toggle, overlay click + body scroll lock.
- Backend: none (static links; cats optionally from `GET /categories`).

### 1C. Search overlay
- HTML L93-110: `#searchPanel > .container > .search-row(#searchInput,#searchClose) + .search-hint button[data-q] + #searchResults`.
- CSS L197-220: full-width dropdown under header.
- JS initSearch ~L588-632: filters `PRODUCTS` by name/desc/cat (same predicate shop.js L64-67); popular buttons fill+run; rows link `product.html?id=`.
- Backend: `GET /products?q=` full-text; return min `{id,name,price,mrp,img,cat}`.

### 1D. Cart drawer (mini-cart)
- HTML L112-124: `aside#cartDrawer > .cd-head(#cdCount,#cdClose) + #cdShip + #cdItems + #cdFoot(#cdSubtotal, View Bag link, #cdContinue)`.
- CSS L479-518: right slide-in; `.cd-ship .bar>i` progress; `.qty` stepper.
- JS main.js L121-203: `drawerLineHTML` L121-160 (gift vs product branch); `renderDrawer` L162-188 (empty hides foot; else free-ship bar `FREE_SHIP-sub`); `openBag/closeBag/maybeHideOverlay` L190-203 shared overlay lock. Mutations `addToCart/setQty/removeLine` L84-114 always `saveCart->syncBadges+renderDrawer`.
- Backend: `GET/POST /cart` lines keyed `id|size` (gifts `gc-amt-ts`); threshold+progress server-computed.

### 1E. Account drawer
- HTML: injected by JS, root `#acctDrawer` created in main.js (no static markup).
- CSS `style.css` L894+: same drawer pattern, profile/orders/addresses sections.
- JS main.js L206-465: keys L206-207, `acctView` home|orders|addrs|verify L208, OTP DEMO (any 6 digits); orders view filters `getOrders()` by phone/email; buy-again re-adds lines; address CRUD on ADDRS_KEY.
- Backend: `POST /auth/otp` + session/JWT; `GET /account/orders` (scope by user!); `GET/POST /account/addresses`.

### 1E2. Login + Register pages (black & gold, three ways in)
- HTML `login.html` / `register.html` (`<body class="auth-dark" data-auth-mode="login|register">`): full chrome + centred `.auth-main > .auth-shell.rv` → `.auth-head` (kicker on-dark, serif `h1`, `.auth-sub`) + `.auth-box` (double gold frame) containing `#authGate`: `.auth-tabs` (Email/Phone via `data-au-tab`), `#pnlEmail` (login: email+password · register: email+password+confirm `#auPass2`), `#pnlPhone` (10-digit mobile → Send OTP), `#pnlOtp` (6-digit `#auOtp` + `#otpBack`), `.auth-or` divider → `#authGoogle` → `#authMsg` → cross-link `.auth-switch` → `.auth-terms`; session panel `#authDone` (`#authAva #authWho #authEmail #authSignOut`); `.auth-foot` footnote (register promotes FIRST10). No `.page-banner` — the block IS the page.
- CSS `css/auth.css` (loads after theme-atelier.css): `body.auth-dark` = black ground `#0b0a08` + gold/champagne ink; dark editions of announce/header/nav/logo/icons AND the menu/search/bag/account drawers; centred `.auth-main/.auth-shell`, `.auth-box::before` inner frame, `.auth-tab(.active)`, `.a-field` gold-hairline inputs (`.bad` error state), `.auth-box .btn` gold gradient, `.auth-err` #ff9d94, `.auth-msg(.bad/.note)`, `.auth-done/.auth-ava`, responsive ≤520px.
- JS `js/auth.js`: `GOOGLE_CLIENT_ID` (paste from Google Cloud; origin must be whitelisted — placeholder raises a `.note` in `#authMsg`). **Email** `auSubmitEmail()` — register validates email + ≥8-char password + confirm match and blocks duplicates, storing `{type:'email', provider:'form', pwHash:auHash(pass)}`; login re-checks the hash and steers Google-created accounts to the OAuth button. **Phone** `auSendOtp()` — validates `[6-9]\d{9}`; register requires a new number, login requires an existing one; generates a 6-digit demo OTP surfaced in `#authMsg` (production: SMS gateway); `auVerifyOtp()` completes. **Google** `authHandleCredential` saves `{provider:'google'}`. Every path writes `amour_account_v1` (same key as `ACCT_KEY`, so orders/addresses/checkout are untouched), then `authRenderState()` + toast + sanitised `?next=` redirect. GIS button: `filled_black`, `signin_with`|`signup_with`, 10s load poll then loud failure.
- Entry points: header account icon (signed out → `register.html`), footer Help column, `.auth-switch` cross-links between the pages, account-drawer `.acct-or` row.
- Backend: verify passwords server-side (bcrypt/argon2), deliver OTPs via an SMS gateway, and verify the GIS ID token (`aud` + signature) before minting a session JWT — today all three run client-side as a demo.

### 1E3. Your Orders page (`orders.html` + `js/orders.js`)
- Signed-in only: the boot guard redirects to `register.html?next=orders.html` when `getProfile()` is empty — the auth pages' sanitised `?next=` then lands back here after signup/login.
- **Order status** — `#ordList` cards from `ordersForMe()`: `#id` + date · city · AWB, status chip via `ordChipCls` (`.acct-chip ok|warn|bad|placed`), 4-step progress `.ord-steps` (`ORD_STEPS` = Placed→Packed→Shipped→Delivered, `ordStepIndex`; stepper hidden for Cancelled / Return Requested), item tiles link straight to `product.html?id=` (non-catalogue lines stay unlinked), footer = `ordTotal(o)` + Track / Invoice / Help — both use `?order=`, the param `track.js`/`invoice.js` actually read.
- **Buy again** — `#buyGrid`: `boughtIds()` = unique product ids across `ordersForMe()` → `cardHTML` (product-details link + Add to Bag), first 8, `.ord-empty` fallback.
- **Address chooser** — `#addrGrid`: index 0 renders `.def` Default + "Delivering here"; `data-addr-pick` moves an address to the front through `saveAddresses` (first entry = the checkout default `amour_address_v1`), `data-addr-del` removes; `#addrToggle` opens `#addrNew` using the `.f-row/.f-group/.invalid` pattern, `ordAddAddress()` validates name / phone `[6-9]\d{9}` / address / pincode / city / state.
- **Related** — `#relGrid`: products sharing a category with owned pieces, excluding what they own, padded with popular picks, first 8 → `cardHTML`.
- CSS lives in the page's inline `<style>` (`.ord-card`, `.o-step`, `.ord-item`, `.addr-card`, `.ord-empty`…) and reuses `.acct-chip`, `.grid-4`, `.sec-head`, `.link-arrow`, `.f-row/.f-group`.
- Entry points: the signed-in panel's "Your Orders" button on login/register and the account drawer's orders view link.
- Backend: `GET /orders?mine=1`, `GET/POST/DELETE /account/addresses` (first = default), recommendations from `GET /recommendations?owned=`.

### 1F. Footer + newsletter
- HTML e.g. `cart.html` L138-208: `.site-footer > .footer-news(.fn-inner: kicker+h3 + form#nlForm>input+.btn.gold+.nl-msg) + .footer-main(.fm-grid: brand+Shop+Help+Visit) + .footer-bottom(.fb-inner: (c)+.pay-chips+policy links+admin link)`.
- CSS L437-478: dark espresso band; `.fn-inner` split; `.fm-grid` 4-col stacks mobile; `.pay-chips span` pills.
- JS newsletter ~L633-660: preventDefault, regex email, show `.nl-msg`, toast; NO network today.
- Backend: `POST /newsletter {email, source}` double opt-in + rate limit.

## 2. Homepage (`index.html`)

Sections in order: trust strip, hero slideshow, category tiles, New Arrivals rail `#arrivalsGrid`, Bestsellers `#bestGrid`, story split, editorial dark banner, stats, testimonials, instagram grid. Rails filled by `main.js` initHome ~L570-710 using `cardHTML`.
- Product card HTML (built by `cardHTML` main.js L19-43, NOT static):
```html
<article class="p-card" data-id="..."><div class="p-media">
<a href="product.html?id="><img class="main"><img class="alt"></a>
<span class="p-tag new|sale"> / <button class="wish-btn" data-wish="id">heart</button>
<div class="p-quick"><button data-quick="id">Add to Bag</button></div></div>
<div class="p-info"><p class="cat">..</p><h3><a>name</a></h3><span class="p-stars">..</span><p class="p-price">Rs <s>mrp</s><span class="off">% off</span></p></div></article>
```
- CSS L221-436: hero full-bleed slideshow (faces top-weighted L228, stills centred L231); trust strip L288; cards L306-350 (hover swaps main->alt, quick-add slides up); tiles L351-361; split L362-376; dark banner L377-389; stats L390-398; testi L399-417; IG L418-436.
- Logic: hero rotation + dots; rails = filter PRODUCTS by collection/tag then `cardHTML`; `data-quick` -> `addToCart` (size-required check main.js L87); `data-wish` -> `toggleWish` L65-71 persists WL_KEY, syncs all `[data-wish=id]`.
- Backend: `GET /products?collection=new|bridal&limit=` powers rails; hero/banner copy -> `cms_blocks`; wishlist needs auth.

## 3. Catalogue data (`js/products.js` + `store-config.js`)

- `IMG(id,w)` L5-6 builds Unsplash URL. Product object: `{id,name,sku,cat[],collection,new|bridal|core,price,mrp,tag New|Bestseller,rating,reviews,img,alt,desc,details[],sizes[]|null}`.
- `CATEGORIES` L8-15: earrings, necklaces, rings, bracelets, pearls, everyday (+bridal used as collection in shop.js L31).
- `STORE` L8-33: brand/legal/gstin, `freeShip:2500` L27, `ship{std:99,express:249}` L28, couriers L29, metroPrefixes L30, `gst{rate:0.03,inclusive:true,hsnDefault:7117}` L31, whatsapp L32. `applyStoreSettings()` L209-220 overwrites freeShip/ship/gst/whatsapp from saved settings at load.
- `DEFAULT_COUPONS` L36-44: FIRST10 pct10 min1500; FESTIVE15 pct15 min5000; AMOUR250 flat250 min2000; FREESHIP ship; AJ-GIFT-* giftcard; REF-MEERA10 referral. `getCoupons()` L223-230 merges defaults + `amour_coupons_v1` by uppercased code.
- `pincodeInfo(pin)` L54-66: null unless 6-digit; serviceable = first digit != 9; eta = metro prefix ? 2-3d : 3-6d; courier = digit-sum odd ? Delhivery : BlueDart. PROD: replace with courier API.
- `gstSplit(amountInclTax,rate,buyerState)` L69+: taxable=amt/(1+rate); intra-state (sellerState vs buyer) -> CGST+SGST else IGST. Used by checkout + invoice.
- Backend tables: `products, categories, coupons, store_settings, couriers/pincodes`. Admin overrides (`getCatalog` L249-255 merges `amour_product_overrides_v1`) become direct product writes.

## 4. Shop page (`shop.html` + `js/shop.js`)

- HTML L128-175: `.page-banner(.crumbs, h1#bannerHead, p#bannerLede)` + `.container > .shop-wrap > aside.filters(#catFilter,#collFilter, price `[data-band]`, promise) + div(.shop-bar: `#shopCount` + `.sort > #sortSel`[featured|new|low|high|rating], `#chipsRow`, `#shopGrid`)`.
- CSS L519-558: `.page-banner` sand band L519-526; `.shop-wrap` sidebar+grid L527-541; `.filters a.active` underline; `.shop-bar` sticky-ish row; `.chips-row .chip > button[data-clear]`; `.shop-grid` responsive auto-fill; `.shop-empty`.
- JS flow: boot L120-140 guards `#shopGrid` -> `readParams()` L7-13 parses `?cat &collection &q &sort` into `shopState` L5 -> `bannerCopy()` L15-39 sets h1/lede per cat/coll/q -> `buildFilters()` L41-58 injects cat links w/ live counts + coll links -> `renderShop()` L83-111: `applyFilters()` L60-80 (cat includes, coll ===, q substring on name+desc+catLabel, band range; sort switch low|high|rating|new|featured=Bestseller-first) -> `#shopCount` + grid `cardHTML` or `.shop-empty` -> chips row + band active toggle. Band click L128-132 in-state (no reload); chip clear L133-138 in-state for band else `clearParam` L113-118 reloads URL minus key.
- Backend: `GET /products?cat=&collection=&q=&min=&max=&sort=&page=` server-side; banner copy + counts from API facets. Keep URL params as canonical state.

## 5. Product page (`product.html` + `js/product.js`)

- HTML L126-145: `.container > .pdp#pdpRoot (JS-filled) + section#pairsSection>.sec-head + .grid-4#pairsGrid`.
- CSS L559-618: `.pdp` 2-col gallery/info -> stack mobile; `.pdp-main` img + `.p-tag`; `.pdp-thumbs button.active` ring; `.pdp-price .now/s/off`; `.size-row button.active`; `.pdp-actions` + `.wish-toggle.active`; `.wa-inline` green pill; `.ship-widget.ok/.bad`; `.pdp-trust` icon row; accordions L604-618.
- JS: boot L165-201 reads `?id`, fallback PRODUCTS[0], sets title, `root.innerHTML = galleryHTML+infoHTML`, `bindPDP`, injects JSON-LD Product schema L174-194, pairs L196-200 (same-cat else any, 4x cardHTML). `galleryHTML` L9-21 dedupes img/alt, tag badge; `infoHTML` L23-70 crumbs/stars/price/SKU/desc/sizes/add/wish/buyNow/WA/pin widget/trust. `bindPDP` L90-163: qty step, size select (active class + `pdp.size`), `#pdpAdd` -> `addToCart` + temp label L119-125, wish toggle L127-130, `#buyNow` add silent + goto checkout L132-136, WA deep link w/ product L138-142, pin check via `pincodeInfo` L144-156, thumbs swap L158-162.
- Backend: `GET /products/:id` (+ variants/stock per size); `POST /cart`; pairs -> `GET /products/:id/related`; reviews -> `GET /products/:id/reviews`; pin -> courier API; schema.org from API fields.

## 6. Cart page (`cart.html` + `js/cart.js`)

- HTML L126-136: `.page-banner` + `.container.cart-page#cartRoot` (JS-filled).
- CSS L680-722: `.cart-layout` 2-col -> stack; `.cart-row` thumb+body+right; `.cr-remove`; `aside.summary` sticky card; `.sum-row.total`; `.trust-lines`.
- JS `renderCartPage()` L5-100: empty -> `.cart-empty-wrap` L10-16; else rows (gift branch L25-46 w/ emoji tile; product L47-67 w/ img, catLabel, size, qty stepper, line total) + summary L70-82: sub, ship = sub>=FREE_SHIP?0:99, total, progress note, `#checkoutBtn` -> checkout.html. Delegated qty/remove L86-95 -> setQty/removeLine (which re-call renderCartPage). Boot L102 DOMContentLoaded.
- Backend: cart + pricing server-side; ship rule from settings; gift-card redeem as payment not line (today AJ-GIFT codes are coupons AND gift.html adds purchasable gift lines — reconcile: purchase creates `gift_cards` row w/ code; redeem path = coupon type giftcard).

## 7. Gift card page (`gift-card.html` L1-77)

- HTML: centered `.gc-card` L35-50 (kicker+h2+p, `.gc-amts#gcAmts` 4 amount buttons L39-44 default active 1000, inputs `#gcTo #gcEmail #gcNote` L45-47, `#gcAdd` L48, fine print L49) + back/admin links L51-52. Page CSS inline L15-28 (dark espresso card, inner border ::after, amount pill active state).
- JS inline L58-75: amount toggle L61-65; `#gcAdd` L66-73 pushes `{key:'gc-'+amt+'-'+ts, id:'giftcard', qty:1, size:'Rs'+amt, amount:amt}` via getCart/saveCart, syncBadges+renderDrawer, toast, redirect cart.html after 700ms. NOTE: recipient name/email/note collected but NEVER stored/sent — backend must capture.
- Backend: `POST /gift-cards {amount, recipient_name, recipient_email, note}` -> creates code + sends email; redeem `POST /checkout/apply {code}` validates balance/expiry; admin list = giftCardSection (admin.js L1075+).

## 8. Checkout (`checkout.html` + `js/checkout.js`)

- HTML: banner L127-133; `.checkout-grid` L136: left `.bento` step tabs L138-144 (`.step-tab[data-step-tab]` 1-3) + `#cxStep1` address form L147-206 (`#cxAddressForm .f-grid`: cxName/cxPhone/cxEmail/cxAddress/cxLandmark/cxPincode+`#cxShipBox`/cxCity/cxState/cxGstin/cxWaOpt, each `.field` has `p.err`) + `#cxStep2` L209-250 (`#cxPayForm`: shipMethod radios std/express, coupon row `#cxCodeRow(#cxCode,#cxApply)` + `#cxApplied`, payMethod radios UPI/Card/NetBanking, `#cxPayNow`, `#cxBackToAddress`) + `#cxStep3` success L253-270 (ring svg, `#cxSuccessName`, `#cxOrderId`, shop/track/invoice btns, `#cxWaBtn`); right `aside.summary .bento` L273-286 (`#cxShipTo,#cxLines,#cxSub,#cxDisc row,#cxShip,#cxGst,#cxTotal`).
- CSS L723-767 + forms L629-648: `.checkout-grid` 2-col; `.bento` curved card; `.step-tabs .step-tab.active .dot`; `.f-grid` 2-col fields (`.full` spans); `.field.invalid input` red + `p.err` show; `.pay-opt` radio cards; `.coupon-row`; `.code-chip`; `.success-ring` animated; `[hidden]` override L794+.
- JS: validators `fieldOk` L13-21 (phone `^[6-9]d{9}$`, pin 6-digit); `checkPincode` L24-37 renders `#cxShipBox` ok/bad via pincodeInfo; `shipMethod/shipCost` L40-47 (express 249 else 0 if sub>=freeShip else std 99); coupons L50-79 (`activeCoupon` sessionStorage, `applyCoupon` uppercase lookup in getCoupons + min-subtotal check, `discountFor` pct|flat|giftcard; FREESHIP type ship + referral type handled in totals); totals ~L81-120: sub=cartSubtotal, disc=discountFor, ship (FREESHIP->0), total=sub-disc+ship, gst=gstSplit incl 3% w/ state from cxState; `renderSummary` updates aside + `#cxStdRate`; boot ~L150-241: empty-cart guard, prefill, listeners (pin sanitize L177-180, state/pay change re-render, address submit L187-195 validate->saveAddr ADDR_KEY->setStep(2), pay submit L198-234 fake 1600ms processing -> build order + unshift getOrders/saveOrders + clear cart+coupon + trackEvent Purchase + fill success + setStep(3)).
- Order object L209-222: `{id:'AJ'+ts8, date ISO, items[{id,name,qty,price}], sub,disc,ship,shipMethod,coupon,method,total, gst{rate,taxable,cgst,sgst,igst,intra}, gstin, addr, status:'Placed', courier:'-', awb:'-', whatsapp}`.
- Backend: `POST /checkout/validate-coupon`, `POST /orders` (server recomputes ALL money, validates coupon/min/expiry/usage, reserves stock, creates payment intent w/ gateway; NO fake timeout — real PSP webhook confirms); `GET /orders/:id`; GST split server-side w/ seller vs buyer state; pincode via courier API; addresses saved to account if logged in.

## 9. Track + Invoice + Contact/About/Policies

- Track (`track.html` + `js/track.js` L1-162): form (order id/AWB + email/phone) -> lookup `getOrders()` by id; timeline renders status steps Placed>Packed>Shipped>In Transit>Out for Delivery>Delivered (+Cancelled/RTO branches) via `statusChip`-like mapping; return/exchange form writes `amour_returns_v1` via saveReturns (fields: order, reason, type, pickup). Backend: `GET /orders/lookup?id=&contact=`, `GET /shipments/:awb` courier webhook-driven status, `POST /returns` RMA + pickup slot.
- Invoice (`invoice.html` + `js/invoice.js`): reads latest `getOrders()` (last or `?id=`), seller block from STORE (legalName/gstin/address), buyer from order.addr+gtsin, lines table, GST breakup from stored order.gst (computed by gstSplit), totals + amount-in-words, print CSS. Backend: `GET /orders/:id/invoice` PDF; store immutable invoice snapshot (numbers must never recompute differently later).
- Contact (`contact.html` L126-260 + JS L339-376): `.contact-cards` 3 links (WA/mail/visit), `.form-card > #contactForm` fields cfName/cfEmail/cfPhone/cfTopic select/cfMsg + `p.err` each; submit validates (name>1, email regex, topic!=, msg>3) toggles `.invalid`, hides form shows `#contactSuccess` + toast — NO network. FAQ `#faqList` L223-260 `.acc.faq > .acc-head + .acc-body` toggle maxHeight L364-374. Backend: `POST /messages {name,email,phone,topic,message}` -> admin Messages queue; FAQ -> `faqs` table if editable.
- About (L125-200): `.about-quote`, `.split(.media img + .copy)`, `.value-grid .value x4`, stats — all static. Backend: none (or CMS blocks).
- Policies (L145-230): `.policy-block` chips nav + `h2#shipping #cancellation #returns #exchange #warranty #care #privacy #terms #grievance` + `[data-store-money]` spans hydrated. Backend: none (or CMS); keep anchor ids stable for footer links.

## 10. Admin console (`admin.html` + `js/admin.js` 2037 lines)

- Shell `admin.html` L16-112: `.adm-login#admLogin` (L19-47: `#admStep1` user+pass+eye `#admPassEye`, `#admLoginBtn`, `#admErr`; `#admStep2` OTP `#admOtp` `#admOtpBtn`) + `.adm-shell#admShell` (L50-106: `aside.adm-side` brand + `nav#admNav` 17 buttons L56-74 + foot session/logout; `main.adm-main` top `#admTitle/#admWho` + 17 `section.adm-sec[data-sec]` L88-104, content ALL injected by JS).
- CSS `admin.css`: shell grid 240px+1fr L9; side espresso sticky L10-18; nav buttons L15-17 (active gold left bar); main pad L19-23; KPI grid L24-29; `.adm-cards` L31-42 (bars L34-37, donut L38-41); tables; `.chip` states (ok/warn/bad retinted theme-atelier L146-153); modal; alerts; login L132-141; responsive collapse L155-159.
- Auth L9-14 + L1952-2037: hardcoded `AUTH{user:amour,pass:amour12423,maxFails:5,lockMins:5}`; fails in FAILS_KEY w/ 5-min lock; OTP demo accepts any 6 digits; session in ADM_KEY; `openPanel` wires nav->`renderSection`. PROD: replace ENTIRELY with server sessions, bcrypt, TOTP/SMS, IP allowlist, WAF, audit log (audit() L151 writes AUDIT_KEY only).
- Shared: seeds DEMO_CATEGORIES L17-26, DEMO_DISCOUNTS L29-36, DEMO_REVIEWS L39+, DEMO_MSGS ~L70-80, DEMO_ABANDONED L82-88, DEMO_CUSTOMERS L90-97; helpers `chip/moneyK/stars/esc/dshort/pct/yn` L100-106, `tbl/tr` L108-113, `openModal` L115-134, `getContent/saveContent` L135-150 (CONTENT_KEY overlay), `notifyStage` L159-173 (WA deep links), `pseudoSeries/dayLabels` L174-185 (demo chart data), `statusChip` L186-188, `metrics()` L190-209 (revenue = demo customers spent + live orders sub; units sold = max(3,reviews/18)).
- Sections (nav key -> renderer -> backend):
  1. dash -> renderDash L256-272 (tabs sales/customers/products; dashSales L211-254 KPIs+bars+donut+ledger+funnel) -> `GET /admin/metrics`.
  2. orders -> renderOrders L622-686 + orderModal L687-757 (status advance, AWB/courier, notify) -> `GET/PATCH /orders`, courier API.
  3. products -> renderProducts L355-384 + productModal L385-435 (price/mrp/stock/tag) + productSeoModal L436-472 -> `GET/POST/PATCH /products`.
  4. categories -> renderCategories L473-527 + categoryModal L528-558 -> `/categories`.
  5. inventory -> renderInventory L559-621 (stock = p.stock || id.length%26+4 pseudo) -> `/inventory` + alerts.
  6. customers -> renderCustomers L758-810 + modal L811-842 -> `/customers`.
  7. reviews -> renderReviews L843-929 (approve/reject in CONTENT_KEY) -> `/reviews?status=`.
  8. returns -> renderReturns L938-1001 (seed + RETURNS_KEY) -> `/returns` RMA flow.
  9. coupons -> renderCoupons L1002-1074 + couponModal L1097-1121 + giftCardSection L1075-1084 + giftCardModal L1122-1149 -> `/coupons`, `/gift-cards`.
  10. discounts -> renderDiscounts L1150-1215 + modal L1216-1242 (rule engine demo) -> `/discount-rules` (evaluate server-side at checkout!).
  11. marketing -> renderMarketing L1243-1353 (first-order/referral/abandoned config + broadcast log BCAST_KEY) -> `/campaigns`.
  12. whatsapp -> renderWhatsApp L1398-1451 (journey L1354, templates L1374, broadcast L1384) -> WA Business API templates + opt-in store.
  13. abandoned -> renderAbandoned L1452-1543 (CARTS_KEY + nudge) -> `/abandoned-carts` + cron nudges.
  14. messages -> renderMessages L1544-1633 (CONTENT_KEY + contact form queue) -> `/messages`.
  15. shipping -> renderShipping L1634-1715 (rates, couriers, metro prefixes) -> `/settings/shipping` + courier APIs.
  16. gst -> renderGST L1716-1807 (rate, HSN, intra/inter) -> `/settings/tax` + invoice service.
  17. settings -> renderSettings L1848-1937 (roles L1814, backup L1831 export/import JSON) -> `/settings`, `/auth/staff`, backup jobs.
- Router `renderSection(key)` L1938-1951 maps key->title+renderer; every mutation re-renders section + writes its localStorage key — backend: same shape over fetch, optimistic UI + rollback on 4xx/5xx.

## 11. Theme + shared CSS primitives (backend cares: keep class names!)

- `theme-atelier.css` loads LAST so it wins without specificity fights. Tokens L32-92: butter surfaces (`--champagne #fffbe6` ground, `--cream #fdf5c8` raised, `--sand #f7e08d` recessed, `--linen #eed574` deepest), ink (`--espresso #1a1712`, `--cocoa`, `--taupe`, `--stone`), gold (`--gold-deep #7d590f` AA on butter), wine, `--line` warm hairlines, `--r:2px` (pills keep `--r-pill`), `--container:1320px`, status colors. Type L99-116: Fraunces display + Karla body, tabular nums for money. Grain L124-128: fixed 4% fractal-noise overlay `body::after` (pointer-events none, z 400).
- Reusable primitives in `style.css`: `.container`, `.kicker`, `.btn(.gold/.ghost/.wide)`, `.icon-btn`, `.p-stars` (gold fill `i{width:pct%}`), `.toast` L619-628 (`.show` 2.6s, main.js L46-59), `.qty` stepper, `.chip`, `.sec-head`, `.link-arrow`, `.page-banner`, `.bento`, `.field+.err` validation pattern, `.acc` accordion, `.wa-inline`, `.ship-widget.ok/.bad`, `[hidden]` guard L794.
- Backend implication: API responses must supply fields these primitives render (`price/mrp` for `.off`, `rating/reviews` for stars, order status strings for chips). Do NOT rename classes when wiring fetch — JS builds HTML strings with them.

## 12. Backend build checklist (endpoint-first)

```
GET  /products?cat=&collection=&q=&min=&max=&sort=&page=   (shop, rails, search)
GET  /products/:id  |  GET /products/:id/related  |  GET /products/:id/reviews
GET  /categories
GET  /cart  |  POST /cart {id,size,qty}  |  PATCH /cart/:key  |  DELETE /cart/:key
POST /auth/otp{phone|email}  |  POST /auth/verify  |  GET /account/orders  |  /account/addresses
POST /newsletter {email,source}
POST /gift-cards {amount,recipient_*}  |  POST /checkout/validate-coupon {code,subtotal}
POST /orders {address,shipMethod,payMethod,coupon,gstin}  (server prices everything)
GET  /orders/lookup?id=&contact=  |  GET /orders/:id/invoice (PDF snapshot)
POST /returns  |  POST /messages  |  GET /settings  |  GET /pincode/:pin
ADMIN: /admin/metrics /orders/PATCH /products* /categories* /inventory /customers /reviews /returns /coupons /gift-cards /discount-rules /campaigns /messages /settings/* /auth/staff
WEBHOOKS: PSP payment confirm, courier tracking (status->timeline+WA notify), WA inbound/opt-out.
JOBS: abandoned-cart nudges (60m/24h/72h per marketing defaults), low-stock alerts, invoice numbering, backup.
```

Security non-negotiables: recompute price/discount/ship/GST server-side (never trust client totals); coupon min/expiry/usage server-checked; auth-scoped order/account reads; rate-limit OTP/newsletter/lookup; admin behind real sessions + roles + audit (replace admin.js L9-14 + L1952-2037 entirely); GST invoices immutable once issued; gift-card balances ledgered, never client-editable.








