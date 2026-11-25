#!/usr/bin/env python3
"""data/cards.json -> prototype/cards-data.js ve tek dosyalik prototype/cicikus-prototype.html uretir."""
import json, os
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
j = json.load(open(os.path.join(R, "data", "cards.json"), encoding="utf-8"))
open(os.path.join(R, "prototype", "cards-data.js"), "w", encoding="utf-8").write(
    "// otomatik uretildi: python3 tools/build_prototype.py (kaynak: data/cards.json)\nvar CICIKUS_CARDS = "
    + json.dumps(j["cards"], ensure_ascii=False) + ";\nif (typeof module !== 'undefined') module.exports = CICIKUS_CARDS;\n")
p = lambda n: open(os.path.join(R, "prototype", n), encoding="utf-8").read()
html = p("index.html")
for n in ("cards-data.js", "engine.js", "ui.js"):
    html = html.replace('<script src="%s"></script>' % n, "<script>\n" + p(n) + "\n</script>")
open(os.path.join(R, "prototype", "cicikus-prototype.html"), "w", encoding="utf-8").write(html)
print("ok", len(html) // 1024, "KB")
