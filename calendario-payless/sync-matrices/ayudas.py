#!/usr/bin/env python3
"""Ayudas para la rutina de matrices de Payless (ver sync/RUTINA.md e INSTRUCCIONES.md).

Funciones principales:
- finales2(slide, formato): artes finales de una diapositiva leída con leer_matriz.py (orden de lectura).
- es_captura(carpeta_trabajo, arte): True si la imagen es una captura de pantalla del programa de diseño.
- prep_img / prep_vid: dejan el arte en JPG (calidad 90, máx. 1920 px; corta tiras de carrusel) o el video en MP4 ≤19 MB.
- persona(autor) -> (nombre, "cliente"|"inside", personaId).
- estado_hilo(comentarios) -> (estado, cambiosPendientes, fecha_ultimo) para el mes en curso.
- estado_hist / piece_date: estado y fecha (exacta o estimada) para meses cerrados.
- tt_calendar / tt_from_comments: fechas y países de la matriz de TikTok.
"""
import json,os,glob,re,unicodedata,collections
MES={'ene':1,'jan':1,'feb':2,'mar':3,'abr':4,'apr':4,'may':5,'jun':6,'jul':7,'ago':8,'aug':8,'sep':9,'set':9,'oct':10,'nov':11,'dic':12,'dec':12}
def norm(t): return unicodedata.normalize('NFKD',t or '').encode('ascii','ignore').decode().lower()
def fecha_de(txt,mes_def,anio=2026):
    t=norm(txt)
    m=re.search(r'(\d{1,2})\s*(?:de\s*)?([a-z]{3})',t) or None
    m2=re.search(r'([a-z]{3})[a-z]*\.?\s*(\d{1,2})(?:st|nd|rd|th)?\b',t)
    if m and m.group(2) in MES: return f'{anio}-{MES[m.group(2)]:02d}-{int(m.group(1)):02d}'
    if m2 and m2.group(1) in MES: return f'{anio}-{MES[m2.group(1)]:02d}-{int(m2.group(2)):02d}'
    m3=re.search(r'\b(\d{1,2})\b',t)
    if m3 and mes_def: return f'{anio}-{mes_def:02d}-{int(m3.group(1)):02d}'
    return ''
def formato_de(txt):
    t=norm(txt)
    for k,v in [('carrusel','Carrusel'),('carousel','Carrusel'),('reel','Reel'),('video','Reel'),('tiktok','Reel'),('estatic','Estático'),('static','Estático'),('post','Estático'),('historia','Historia'),('stor','Historia'),('portada','Portada'),('cover','Portada')]:
        if k in t: return v
    return ''
REG={'CENTRO':['GT','SV','HN','NI','CR'],'SUR':['PA','CO','EC','PE'],'RD':['RD'],'CARIBE':['TT','JM','BB','ECI','GY','USVI']}
ALIAS_P={'PERU':'PE','PB':'PA','PANAMA':'PA','COLOMBIA':'CO','ECUADOR':'EC','DR':'RD'}
def paises_de(txt,region):
    if not txt: return []
    t=norm(txt).upper()
    out=[]
    for tok in re.split(r'[^A-Z]+',t):
        tok=ALIAS_P.get(tok,tok)
        if tok in REG.get(region,[]) and tok not in out: out.append(tok)
    return out
def finales(s,minkb=1200):
    """Artes finales visibles de una diapositiva: dentro, no tapadas por una capa superior, y pesadas (las referencias suelen pesar menos)."""
    A=[a for a in s['artes'] if a['dentro']]
    def area(a): return max(0,a['w'])*max(0,a['h'])
    def inter(a,b):
        x=max(0,min(a['x']+a['w'],b['x']+b['w'])-max(a['x'],b['x'])); y=max(0,min(a['y']+a['h'],b['y']+b['h'])-max(a['y'],b['y'])); return x*y
    vis=[a for a in A if not any(b['capa']>a['capa'] and inter(a,b)>0.6*area(a) for b in A)]
    fin=[a for a in vis if a['kb']>=minkb]
    # orden de lectura: filas por y (tolerancia 0.12) y luego x
    fin.sort(key=lambda a:(round(a['y']/0.12),a['x']))
    seen=set(); out=[]
    for a in fin:
        if a['sha1'] in seen: continue
        seen.add(a['sha1']); out.append(a)
    return out

PERS={'Alcantara, Dainy':('Dainy Alcántara','cliente','p-dainy-alcantara'),'Khan, Stephanie':('Stephanie Khan','cliente','p-stephanie-khan'),
 'Quezada, Cristina':('Cristina Quezada','cliente','p-cristina-quezada'),'Poveda, Karla':('Karla Poveda','cliente','p-karla-poveda'),
 'QUISBERT, CARLA':('Carla Quisbert','cliente','p-carla-quisbert'),'Narino, Nicolas':('Nicolás Nariño','cliente','p-nicolas-narino'),
 'Sunniva Giraldo':('Sunny','inside','p-sunny'),'rolazabal':('Roberto','inside','p-roberto'),'Silvana Molano Barreto':('Silvana Molano Barreto','inside','p-silvana'),
 'aguerrero':('Allison','inside','p-allison'),'Ariana Fernanda Torrecilla Namaní':('Ariana Fernanda Torrecilla Namaní','inside','p-ariana'),
 'atorrecilla@agenciainside.lat':('Ariana Fernanda Torrecilla Namaní','inside','p-ariana'),
 'rguerrero':('rguerrero','inside','p-rguerrero'),'david':('david','inside','p-david'),'amedrano':('amedrano','inside','p-amedrano'),
 'eurbano':('eurbano','inside','p-eurbano'),'ahuata':('ahuata','inside','p-ahuata'),'epadron':('epadron','inside','p-epadron')}
def persona(a):
    return PERS.get(a,(a or 'Sin nombre','inside',''))
RE_OK=re.compile(r'^[\s\-\*•]*(video |pieza |arte |copy )?(aprobad[oa]s?|approved|ok\b|okay|perfecto|todo ok|lo demas ok|listo para publicar)',re.I)
RE_HECHO=re.compile(r'^\s*(ajustad|done|hecho|corregid|realizad|listo|cambio realizado|ajustes realizados|cambios realizados|dise[nñ]ad|pieza[s]? realizada|legal ajustado|updated|changed|fixed)',re.I)
def es_ok(t): return bool(RE_OK.match(norm(t)))
def es_hecho(t): return bool(RE_HECHO.match(norm(t)))
def estado_hilo(coms):
    """coms: comentarios de la diapositiva (dicts de leer_matriz). Devuelve (estado, cambiosPendientes, fecha_ultimo) según el último movimiento."""
    cs=sorted([c for c in coms if c.get('fecha')],key=lambda c:c['fecha'])
    if not cs: return None,None,''
    last_cli=None; idx=-1
    for i,c in enumerate(cs):
        if persona(c['autor'])[1]=='cliente': last_cli=c; idx=i
    if last_cli is None:
        if any(es_hecho(c['texto']) for c in cs): return 'Enviado a cliente',False,cs[-1]['fecha']
        return None,None,cs[-1]['fecha']
    after=[c for c in cs[idx+1:] if persona(c['autor'])[1]=='inside']
    t=last_cli['texto']
    if es_ok(t): return 'Aprobado por cliente',False,cs[-1]['fecha']
    if after and any(es_hecho(c['texto']) for c in after): 
        # si el cliente ya había aprobado antes y luego pidió un ajuste menor que Inside resolvió, sigue en revisión del cliente
        return 'Enviado a cliente',False,cs[-1]['fecha']
    return 'Comentarios del cliente',True,cs[-1]['fecha']
def copy_de(textos):
    for t in textos:
        tt=t['t'] if isinstance(t,dict) else t
        m=re.search(r'COPY\s*:\s*(.+)$',tt,re.S|re.I)
        if m:
            c=m.group(1).strip()
            c=re.split(r'\n\s*(?:LEGAL|HASHTAGS?|CTA|NOTA|AJUSTE)\s*:',c,flags=re.I)[0].strip()
            if len(c)>8: return c
    return ''

UP='subidas'  # carpeta donde se dejan los JPG y MP4 listos para subir
def prep_img(work,a,parts=None):
    """Convierte un arte a JPG (calidad 90, máx. 1920 px). Si parts>1 corta una tira de carrusel en paneles. Devuelve claves."""
    from PIL import Image
    src=f"{work}/media/{a['sha1']}{a['ext']}"
    im=Image.open(src); im=im.convert('RGB')
    keys=[]
    if parts and parts>1:
        W,H=im.size; w=W/parts
        for i in range(parts):
            k=f"{a['sha1'][:16]}p{i+1}"; out=f"{UP}/{k}.jpg"
            if not os.path.exists(out):
                p=im.crop((round(i*w),0,round((i+1)*w),H)); p.thumbnail((1920,1920)); p.save(out,quality=90)
            keys.append(k)
        return keys
    k=a['sha1'][:16]; out=f"{UP}/{k}.jpg"
    if not os.path.exists(out):
        im.thumbnail((1920,1920)); im.save(out,quality=90)
    return [k]
def img_ratio(work,a):
    from PIL import Image
    try:
        w,h=Image.open(f"{work}/media/{a['sha1']}{a['ext']}").size; return w/h
    except Exception: return 1
def prep_vid(work,v):
    import subprocess
    k='v'+v['sha1'][:15]; out=f"{UP}/{k}.mp4"
    if not os.path.exists(out):
        src=f"{work}/media/{v['sha1']}{v['ext']}"
        if os.path.getsize(src)<=19*1024*1024 and v['ext'].lower()=='.mp4':
            import shutil; shutil.copyfile(src,out)
        else:
            for crf in (23,27,31):
                subprocess.run(['ffmpeg','-y','-loglevel','error','-i',src,'-vf','scale=-2:min(1280\\,ih)','-c:v','libx264','-crf',str(crf),'-preset','medium','-c:a','aac','-b:a','96k','-movflags','+faststart',out],check=True)
                if os.path.getsize(out)<=19*1024*1024: break
    return k
def finales2(s,fmt=''):
    """Como finales() pero: tapada si la suma de intersecciones con capas superiores cubre >60%; descarta imágenes con <65% dentro de la diapositiva;
    en historias acepta artes livianas si tienen proporción vertical 9:16."""
    A=[a for a in s['artes'] if a['dentro']]
    def area(a): return max(1e-9,a['w']*a['h'])
    def inter(a,b):
        x=max(0,min(a['x']+a['w'],b['x']+b['w'])-max(a['x'],b['x'])); y=max(0,min(a['y']+a['h'],b['y']+b['h'])-max(a['y'],b['y'])); return x*y
    def inside(a):
        x=max(0,min(a['x']+a['w'],1)-max(a['x'],0)); y=max(0,min(a['y']+a['h'],1)-max(a['y'],0)); return x*y/area(a)
    out=[]
    for a in A:
        if inside(a)<0.65: continue
        cov=sum(inter(a,b) for b in A if b['capa']>a['capa'])
        if cov>0.6*area(a): continue
        pr=(a['w']*16)/(a['h']*9) if a['h'] else 1
        story=0.45<pr<0.68
        if a['kb']>=1200 or (fmt=='Historia' and story and a['kb']>=60) or (story and a['kb']>=900):
            out.append(a)
    out.sort(key=lambda a:(round(a['y']/0.15),a['x']))
    seen=set(); res=[]
    for a in out:
        if a['sha1'] in seen: continue
        seen.add(a['sha1']); res.append(a)
    return res

_SC={}
def es_captura(work,a):
    """Captura de pantalla del programa de diseño: mucho gris oscuro sin saturación y formato apaisado."""
    k=a['sha1']
    if k in _SC: return _SC[k]
    from PIL import Image
    try:
        im=Image.open(f"{work}/media/{a['sha1']}{a['ext']}").convert('RGB'); w,h=im.size
        sm=im.resize((96,max(1,int(96*h/w))))
        px=list(sm.getdata()); n=len(px)
        gray=sum(1 for r,g,b in px if max(r,g,b)-min(r,g,b)<18 and 25<=max(r,g,b)<=110)
        r=(gray/n>0.30 and w/h>1.2)
    except Exception: r=False
    _SC[k]=r; return r

# ---------- historial
MES_CARPETA={'JUL':7,'AGO':8,'SEP':9,'OCT':10,'NOV':11,'DIC':12}; MESN={7:'julio',8:'agosto',9:'septiembre'}
PRE={'CENTRO':'cen','SUR':'sur','RD':'rd','CARIBE':'car'}
PNAME={'GUATEMALA':'GT','EL SALVADOR':'SV','SALVADOR':'SV','HONDURAS':'HN','NICARAGUA':'NI','COSTA RICA':'CR','PANAMA':'PA','PANAMÁ':'PA','COLOMBIA':'CO','ECUADOR':'EC','PERU':'PE','PERÚ':'PE',
       'REPUBLICA DOMINICANA':'RD','TRINIDAD':'TT','JAMAICA':'JM','BARBADOS':'BB','GUYANA':'GY','USVI':'USVI','ECI':'ECI'}
CC={'GT':'GT','CR':'CR','CO':'CO','C':'CO','HN':'HN','ES':'SV','SV':'SV','NI':'NI','NC':'NI','PB':'PA','PA':'PA','EC':'EC','PE':'PE','RD':'RD'}
REG_OF={'GT':'CENTRO','SV':'CENTRO','HN':'CENTRO','NI':'CENTRO','CR':'CENTRO','PA':'SUR','CO':'SUR','EC':'SUR','PE':'SUR','RD':'RD'}
RE_DESC=re.compile(r'(descartad|ya no aplica|no se publica|no publicar|no lo publiquen|eliminar esta pieza|no va\b|se cancela|cancelad|no la usaremos|no se usar)',re.I)
def paises_txt(t,R):
    if not t: return []
    u=norm(t).upper(); out=[]
    for k,v in PNAME.items():
        if norm(k).upper() in u and v not in out: out.append(v)
    out+= [c for c in paises_de(t,R) if c not in out]
    return [c for c in out if c in REG[R]]
def fmt_of(t):
    t=norm(t)
    if 'carrusel' in t or 'carousel' in t: return 'Carrusel'
    if 'reel' in t or 'video' in t: return 'Reel'
    if 'histori' in t or 'stor' in t: return 'Historia'
    if 'portada' in t or 'cover' in t: return 'Portada'
    if 'estatic' in t or 'static' in t or 'post' in t: return 'Estático'
    return ''
def linea_of(t):
    t=norm(t)
    for k,v in [('bogo','Promociones'),('promo','Promociones'),('descuento','Promociones'),('clearance','Promociones'),('% off','Promociones'),('kid','Kids'),('nino','Kids'),('nina','Kids'),('school','Kids'),('escolar','Kids'),('sneaker','Sneakers'),('atletic','Sneakers'),('champion','Sneakers'),('la gear','Sneakers'),('comfort','Comfort Plus'),('llegada','Nuevas Llegadas'),('arrival','Nuevas Llegadas')]:
        if k in t: return v
    return 'Otra'
def legal_of(textos):
    for t in textos:
        m=re.search(r'LEGAL\s*:\s*(.+)',t['t'],re.S|re.I)
        if m and len(m.group(1).strip())>20: return m.group(1).strip()[:1500]
    for t in textos:
        if re.match(r'\s*(Promoci[oó]n v[aá]lida|Promotion valid|Valid from)',t['t'],re.I): return t['t'].strip()[:1500]
    return ''
def fecha_explicita(textos,m):
    txt=' '.join(t['t'] for t in textos)
    mm=re.search(r'FECHA DE (?:PUBLICACI[OÓ]N|PIEZA)\s*:?\s*(?:Para el\s*)?([^\n/]{0,40})',txt,re.I)
    if mm:
        f=fecha_de(mm.group(1),m)
        if f and int(f[5:7]) in (m,m%12+1) : return f
    return ''
def estado_hist(coms):
    cs=sorted([c for c in coms if c.get('fecha')],key=lambda c:c['fecha'])
    cli=[c for c in cs if persona(c['autor'])[1]=='cliente']
    if any(RE_DESC.search(norm(c['texto'])) for c in cli[-2:]): return 'desc',cs
    if cli and es_ok(cli[-1]['texto']): return 'ok',cs
    ins=[c for c in cs if persona(c['autor'])[1]=='inside']
    if any(re.search(r'\b(publicad|programad)',norm(c['texto'])) for c in ins) and any(es_ok(c['texto']) for c in cli): return 'ok',cs
    if any(es_ok(c['texto']) for c in cli): return 'ok_luego',cs
    return 'sin',cs
def piece_date(textos,coms,m,anio=2026):
    f=fecha_explicita(textos,m)
    if f: return f,False
    st,cs=estado_hist(coms)
    oks=[c for c in cs if persona(c['autor'])[1]=='cliente' and es_ok(c['texto'])]
    for c in (oks[-1:] + cs[-1:]):
        if int(c['fecha'][5:7])==m: return c['fecha'][:10],True
    return f'{anio}-{m:02d}-01',True

# ---------- TikTok
import datetime as _dt
PAT_CC=re.compile(r'\b(GT|SV|HN|NI|CR|DR|RD|PB|PA|CO|EC|PE)\b')
NAMES={'guatemala':'GT','salvador':'SV','honduras':'HN','nicaragua':'NI','costa rica':'CR','panama':'PA','colombia':'CO','ecuador':'EC','peru':'PE','centroamerica':'GT,SV,HN,NI,CR'}
APR_DEF={'Quezada, Cristina':['PA','CO','EC','PE'],'QUISBERT, CARLA':['GT','SV','HN','NI','CR'],'Alcantara, Dainy':['RD']}
def tt_from_comments(coms,m):
    cs=sorted([c for c in coms if c.get('fecha')],key=lambda c:c['fecha'])
    if not cs: return None
    paises=[]
    for c in cs:
        t=c['texto']; tn=norm(t)
        for mm in PAT_CC.finditer(t):
            cc={'DR':'RD','PB':'PA'}.get(mm.group(1),mm.group(1))
            if cc not in paises: paises.append(cc)
        for k2,v in NAMES.items():
            if k2 in tn:
                for cc in v.split(','):
                    if cc not in paises: paises.append(cc)
    if not paises:
        for c in cs:
            if c['autor'] in APR_DEF: paises=list(APR_DEF[c['autor']]); break
    if not paises: return None
    fecha=''
    MO={'jul':7,'ago':8,'sep':9,'oct':10}
    for c in [c for c in cs if persona(c['autor'])[1]=='inside']+[c for c in cs if persona(c['autor'])[1]!='inside']:
        tn=norm(c['texto'])
        if not re.search(r'(programad|publicad|carg|publicar)',tn): continue
        mm=re.search(r'(\d{1,2})\s*de\s*(jul|ago|sep|oct)',tn) or re.search(r'(?:para el|para las?|el|sab\w*|dom\w*|lun\w*|mar\w*|mie\w*|jue\w*|vie\w*)\s+(\d{1,2})\b(?!\s*(?:am|pm|p\.m|a\.m|:))',tn)
        if mm:
            d=int(mm.group(1)); mo=MO.get(mm.group(2),m) if mm.lastindex and mm.lastindex>=2 else m
            if 1<=d<=31: fecha=f'2026-{mo:02d}-{d:02d}'; break
        if 'manana' in tn: fecha=(_dt.date.fromisoformat(c['fecha'][:10])+_dt.timedelta(days=1)).isoformat(); break
        if 'hoy' in tn or tn.strip() in ('publicado','programado'): fecha=c['fecha'][:10]; break
    if fecha: return paises,fecha,False
    f,fe=piece_date([],coms,m); return paises,f,True

def tt_calendar(M,m):
    cal=collections.defaultdict(list)
    for s in M['slides']:
        if not any(re.match(r'(?i)(domingo|lunes)$',t['t'].strip()) for t in s['textos']): continue
        for t in s['textos']:
            parts=[p.strip() for p in t['t'].split('\n') if p.strip()]
            if not parts: continue
            nums=[p for p in parts if re.fullmatch(r'\d{1,2}',p)]
            codes=[p for p in parts if re.search(r'[A-Z]',p)]
            if not nums: continue
            day=int(nums[0])
            for c in codes:
                for mm in re.finditer(r'\b([A-Z]{1,2})\s*(\d)\b',c.replace('GT4','GT 4')):
                    cc=CC.get(mm.group(1)); 
                    if cc: cal[(cc,int(mm.group(2)))].append(day)
    return cal
