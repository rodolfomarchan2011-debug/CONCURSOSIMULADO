import re
import urllib.request

URNS = {
    "CF": "urn:lex:br:federal:constituicao:1988-10-05;1988",
    "CP": "urn:lex:br:federal:decreto.lei:1940-12-07;2848",
    "CPP": "urn:lex:br:federal:decreto.lei:1941-10-03;3689",
    "CPC": "urn:lex:br:federal:lei:2015-03-16;13105",
    "L9099": "urn:lex:br:federal:lei:1995-09-26;9099",
    "L8429": "urn:lex:br:federal:lei:1992-06-02;8429",
    "L13146": "urn:lex:br:federal:lei:2015-07-06;13146",
    "L12153": "urn:lex:br:federal:lei:2009-12-22;12153",
}

for nome, urn in URNS.items():
    url = "https://www.lexml.gov.br/urn/" + urn
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        raw = urllib.request.urlopen(req, timeout=40).read().decode("utf-8", "replace")
    except Exception as exc:  # noqa: BLE001
        print(nome, "erro", exc)
        continue
    links = sorted(set(re.findall(r'https?://[^"\'<> ]+', raw)))
    alvos = [
        link
        for link in links
        if ("camara.leg.br" in link or "senado.leg.br" in link)
        and ("html" in link or "norma" in link)
    ]
    print("=" * 10, nome, len(alvos))
    for link in alvos[:8]:
        print("  ", link)
