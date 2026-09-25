import os, re

here = r"c:\Users\piyush sharma\Documents\amour jewel"

# ---- 1. Light butter yellow ground: make --champagne the page ground ----
theme_path = os.path.join(here, "css", "theme-atelier.css")
s = open(theme_path, encoding="utf-8").read()

# Re-point the ground token from --ivory to --champagne in two places:
#   (a) the token definition line
#   (b) the "ground" comment so anyone reading it sees the new intent
s = re.sub(
    r"(--ivory:\s*#[0-9a-fA-F]{6};[^/]*the page ground[^/]*/)",
    "--champagne:#fffbe6;    /* the page ground — light butter yellow */",
    s, count=1)

# also make sure the :root body reading is champagne (the page canvas)
s = s.replace("background:var(--ivory)", "background:var(--champagne)")

open(theme_path, "w", encoding="utf-8").write(s)
print("theme-atelier.css: page ground -> light butter yellow (--champagne)")

# ---- 2. Footer socials: drop Facebook/Pinterest/YouTube, add WhatsApp ----
wa = ('<a href="https://wa.me/919000040000" target="_blank" rel="noopener" aria-label="WhatsApp">'
      '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.4">'
      '<path d="M12 2a9.9 9.9 0 0 0-8.5 15L2 22l5.2-1.4A10 10 0 1 0 12 2z"/>'
      '<path d="M9 8.5c0 4 2.5 6.5 6.5 6.5"/></svg></a>')

# Match the contiguous FB + Pinterest + YouTube <a> block (with any whitespace between)
fb_pat = re.compile(
    r'<a href="https://www\.facebook\.com"[^>]*>.*?</a>\s*'
    r'<a href="https://www\.pinterest\.com"[^>]*>.*?</a>\s*'
    r'<a href="https://www\.youtube\.com"[^>]*>.*?</a>',
    re.S)

files = ["about.html","cart.html","contact.html","product.html","shop.html","policies.html"]
for fn in files:
    p = os.path.join(here, fn)
    t = open(p, encoding="utf-8").read()
    if fb_pat.search(t):
        t2 = fb_pat.sub(wa, t, count=1)
        open(p, "w", encoding="utf-8").write(t2)
        print(f"{fn}: footer socials -> Instagram + WhatsApp")
    else:
        print(f"{fn}: no FB/Pin/YT block found")
