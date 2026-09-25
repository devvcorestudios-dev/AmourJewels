import io

p = "css/theme-atelier.css"
lines = open(p, encoding="utf-8").read().splitlines(True)

# We expect line numbers 42,43,44 (1-based) to be:
#   42: --champagne:#fffbe6;    /* lit butter — highlight fill */
#   43: --cream:#fdf5c8;        /* raised — cards, drawers, panels, inputs */
#   44: --champagne:#fffbe6;    /* the page ground — light butter yellow */
# Replace them with a single champagne def + cream def, preserving leading whitespace.

new_block = (
    lines[41][:7] + "--champagne:#fffbe6;    /* lit butter \u2014 highlight fill / page ground */\n"
    + lines[42][:7] + "--cream:#fdf5c8;        /* raised \u2014 cards, drawers, panels, inputs */\n"
)

if 41 < len(lines) and 42 < len(lines) and 43 < len(lines):
    if "--champagne:#fffbe6;" in lines[41] and "--cream:#fdf5c8;" in lines[42] and "--champagne:#fffbe6;" in lines[43]:
        lines[41:44] = [new_block]
        open(p, "w", encoding="utf-8").write("".join(lines))
        print("theme-atelier.css: lines 42-44 collapsed into one champagne + cream def")
    else:
        print("lines 42-44 do not match expected pattern; dumping:")
        for n in (41,42,43):
            print(f"{n+1}:", repr(lines[n]))
else:
    print("file shorter than expected; dumping first 50 lines:")
    for n in range(0, min(50, len(lines))):
        print(f"{n+1}:", repr(lines[n]))
