#!/usr/bin/env python3
"""Compara una matriz recién leída con el estado de la última versión procesada.

Uso:  python3 comparar.py NUEVO.json ESTADO.json SALIDA_DIR [--linea-base]

NUEVO.json   lo que escribió leer_matriz.py
ESTADO.json  el estado guardado en la plataforma (colección syncmatrices); si no existe
             o se pasa --linea-base, se toma la matriz actual como punto de partida
Escribe SALIDA_DIR/cambios.json (solo lo nuevo) y SALIDA_DIR/estado_nuevo.json
(para guardarlo en la plataforma una vez aplicados los cambios).
"""
import datetime, json, os, sys


def estado_de(nuevo, viejo):
    vs = (viejo or {}).get("slides", {})
    slides = {}
    for s in nuevo["slides"]:
        prev = vs.get(s["id"], {})
        slides[s["id"]] = {
            "n": s["n"], "nombre": s["campos"].get("nombre", ""), "huella": s["huella"],
            "textos": [t["t"][:2000] for t in s["textos"]],
            "artes": [a["sha1"] for a in s["artes"]], "videos": [v["sha1"] for v in s["videos"]],
            "comentarios": sorted(set(prev.get("comentarios", [])) | {c["cid"] for c in s["comentarios"]}),
            "posts": prev.get("posts", []),
        }
    return {"archivo": nuevo["archivo"], "sha1": nuevo["sha1"],
            "procesado": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"), "slides": slides}


def comparar(nuevo, viejo):
    vs = viejo["slides"]; out = []
    for s in nuevo["slides"]:
        p = vs.get(s["id"])
        if p is None:
            out.append({"id": s["id"], "n": s["n"], "nueva": True, "campos": s["campos"], "posts": [],
                        "comentarios_nuevos": s["comentarios"], "artes_nuevas": s["artes"], "videos_nuevos": s["videos"],
                        "texto": {"antes": [], "despues": [t["t"] for t in s["textos"]]}})
            continue
        by = {c["cid"]: c for c in s["comentarios"]}
        nuevos = []
        for c in s["comentarios"]:
            if c["cid"] in p["comentarios"]: continue
            c = dict(c)
            if c["padre"] and c["padre"] in by: c["hilo"] = {"autor": by[c["padre"]]["autor"], "texto": by[c["padre"]]["texto"]}
            nuevos.append(c)
        artes = [a for a in s["artes"] if a["sha1"] not in p.get("artes", [])] if p.get("artes") is not None else []
        videos = [v for v in s["videos"] if v["sha1"] not in p.get("videos", [])] if p.get("videos") is not None else []
        texto = None
        if s["huella"] != p.get("huella"):
            antes = set(p.get("textos", [])); despues = [t["t"] for t in s["textos"]]
            texto = {"antes": [t for t in p.get("textos", []) if t not in set(despues)], "despues": [t for t in despues if t not in antes]}
            if not texto["antes"] and not texto["despues"]: texto = None
        if nuevos or artes or videos or texto:
            out.append({"id": s["id"], "n": s["n"], "nueva": False, "campos": s["campos"], "posts": p.get("posts", []),
                        "comentarios_nuevos": nuevos, "artes_nuevas": artes, "videos_nuevos": videos, "texto": texto})
    ids = {s["id"] for s in nuevo["slides"]}
    borradas = [{"id": k, "n": v["n"], "nombre": v["nombre"], "posts": v.get("posts", [])} for k, v in vs.items() if k not in ids]
    return {"archivo": nuevo["archivo"], "sin_cambios": nuevo["sha1"] == viejo.get("sha1"), "slides": out, "borradas": borradas}


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if len(args) != 3: sys.exit(__doc__)
    nuevo = json.load(open(args[0]))
    viejo = json.load(open(args[1])) if os.path.exists(args[1]) else None
    os.makedirs(args[2], exist_ok=True)
    if viejo is None or "--linea-base" in sys.argv:
        cambios = {"archivo": nuevo["archivo"], "linea_base": True, "sin_cambios": False, "slides": [], "borradas": []}
    else:
        cambios = comparar(nuevo, viejo)
    json.dump(cambios, open(os.path.join(args[2], "cambios.json"), "w"), ensure_ascii=False, indent=1)
    json.dump(estado_de(nuevo, viejo), open(os.path.join(args[2], "estado_nuevo.json"), "w"), ensure_ascii=False)
    n = len(cambios["slides"])
    print("línea base guardada" if cambios.get("linea_base") else
          "sin cambios" if not n and not cambios["borradas"] else
          f"{n} diapositivas con cambios · {sum(len(s['comentarios_nuevos']) for s in cambios['slides'])} comentarios nuevos · "
          f"{sum(len(s['artes_nuevas']) for s in cambios['slides'])} artes nuevas · {len(cambios['borradas'])} borradas")
