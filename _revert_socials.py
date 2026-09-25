import os

here = "c:\\Users\\piyush sharma\\Documents\\amour jewel"
files = ["about.html", "cart.html", "contact.html", "product.html", "shop.html"]

wa = ('<a href="https://wa.me/919000040000" target="_blank" rel="noopener" aria-label="WhatsApp">'
      '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.4">'
      '<path d="M12 2a9.9 9.9 0 0 0-8.5 15L2 22l5.2-1.4A10 10 0 1 0 12 2z"/>'
      '<path d="M9 8.5c0 4 2.5 6.5 6.5 6.5"/></svg></a>')

orig = (
    '<a href="https://www.facebook.com" target="_blank" rel="noopener" aria-label="Facebook">'
    '<svg viewBox="0 0 24 24"><path d="M14 8.5V6.8c0-.8.6-1 1-1h2.5V2.2H14c-2.9 0-4.2 2.1-4.2 4.4v1.9H7.5V12h2.3v10H14V12h2.8l.4-3.5H14z"/></svg></a>'
    '<a href="https://www.pinterest.com" target="_blank" rel="noopener" aria-label="Pinterest">'
    '<svg viewBox="0 0 24 24"><path d="M12 2C6.5 2 2 6.5 2 12c0 4.2 2.6 7.8 6.3 9.3-.1-.8-.2-2 0-2.9l1.2-4.9s-.3-.6-.3-1.5c0-1.4.8-2.4 1.8-2.4.9 0 1.3.6 1.3 1.4 0 .9-.6 2.2-.9 3.4-.2 1 .5 1.8 1.5 1.8 1.8 0 3.2-1.9 3.2-4.7 0-2.4-1.7-4.1-4.2-4.1-2.9 0-4.6 2.2-4.6 4.4 0 .9.3 1.8.8 2.3.1.1.1.2.1.3l-.3 1.1c0 .2-.1.2-.3.1-1.2-.6-2-2.4-2-3.9 0-3.2 2.3-6.1 6.6-6.1 3.5 0 6.2 2.5 6.2 5.8 0 3.5-2.2 6.2-5.2 6.2-1 0-2-.5-2.3-1.1l-.6 2.4c-.2.9-.8 1.9-1.2 2.6.9.3 1.9.4 2.9.4 5.5 0 10-4.5 10-10S17.5 2 12 2z"/></svg></a>'
    '<a href="https://www.youtube.com" target="_blank" rel="noopener" aria-label="YouTube">'
    '<svg viewBox="0 0 24 24"><path d="M21.6 7.2c-.2-1.5-1-2.3-2.5-2.5C17.2 4.5 12 4.5 12 4.5s-5.2 0-7.1.2c-1.5.2-2.3 1-2.5 2.5C2.2 9.1 2.2 12 2.2 12s0 2.9.2 4.8c.2 1.5 1 2.3 2.5 2.5 1.9.2 7.1.2 7.1.2s5.2 0 7.1-.2c1.5-.2 2.3-1 2.5-2.5.2-1.9.2-4.8.2-4.8s0-2.9-.2-4.8zM10 15V9l5.2 3L10 15z"/></svg></a>'
)

for f in files:
    p = os.path.join(here, f)
    s = open(p, encoding="utf-8").read()
    if wa in s:
        s = s.replace(wa, orig)
        open(p, "w", encoding="utf-8").write(s)
        print(f, "reverted")
    else:
        print(f, "unchanged (no WA link)")
