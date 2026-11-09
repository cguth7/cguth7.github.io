"""Turn the served /play page into a static site dir: index.html + data.json + figures/ + style.css + play_figures.js."""
import json, re, shutil, sys, urllib.request
from pathlib import Path

BASE, PID, OUT = "http://localhost:8011", "doi:10.1371/journal.pmed.0020124", Path(sys.argv[1])
get = lambda p: urllib.request.urlopen(BASE + p).read()

html = get(f"/play/{PID}").decode()
m = re.search(r'<script id="blob" type="application/json">(.*?)</script>\n', html, re.S)
blob = json.loads(m.group(1))
html = html.replace(m.group(0), "")

OUT.mkdir(parents=True, exist_ok=True)
(OUT / "figures").mkdir(exist_ok=True)
figs = sorted(set(re.findall(r'/figures/[^"\s]+\.png', html + m.group(1))))
for f in figs:
    (OUT / "figures" / Path(f).name).write_bytes(get(f))
(OUT / "style.css").write_bytes(get("/static/style.css"))
(OUT / "play_figures.js").write_bytes(get("/static/play_figures.js"))

s = json.dumps(blob, ensure_ascii=False)
s = re.sub(r'/figures/[^/"]+/', "figures/", s)
(OUT / "data.json").write_text(s)

html = re.sub(r'/figures/[^/"]+/', "figures/", html)
html = html.replace('href="/static/style.css"', 'href="style.css"').replace('src="/static/play_figures.js"', 'src="play_figures.js"')
html = html.replace('<script src="https://unpkg.com/htmx.org@2.0.4"></script>\n', "")
# admin nav and run/rubric links point at the local server; drop them
html = re.sub(r'<header>.*?</header>', '<header>\n  <span class="brand">rubric-review</span>\n</header>', html, flags=re.S)
html = html.replace('<a href="/run/${c.run_id}">run ${c.run_id}</a>', 'run ${c.run_id}')
html = re.sub(r'<a href="/rubric/[^"]*">(.*?)</a>', r'\1', html)
# load the blob from data.json instead of an inline script
html = html.replace("const B = JSON.parse(document.getElementById('blob').textContent);",
                    "(async () => {\nconst B = await (await fetch('data.json')).json();", 1)
i = html.index("(async () => {")
j = html.index("</script>", i)
html = html[:j] + "})();\n" + html[j:]
(OUT / "index.html").write_text(html)
print(len(figs), "figures;", len(html), "html bytes;", len(s), "json bytes")
left = re.findall(r'(?:href|src)="/[^"]*"', html)
print("remaining absolute:", left)
