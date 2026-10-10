#!/usr/bin/env python3
"""Cicikus Kart Oyunu - hizli denge simulasyonu (core kurallar, basit bot).
Taktikler (Takas, Gizle, Risk, Peek) simule edilmez. Kullanim: python3 sim.py [oyun_sayisi]"""
import json, random, sys, collections, os

HERE = os.path.dirname(os.path.abspath(__file__))
CARDS = json.load(open(os.path.join(HERE, "..", "data", "cards.json"), encoding="utf-8"))["cards"]

# ---- ayarlanabilir kural parametreleri ----
P = dict(hp=20, energy=4, hand=5, draw=2, hand_limit=7, bank_cap=8,
         shield_per_slot=2, sh_slots=2, en_slots=2, max_sh=4, max_en=4,
         second_bonus_cards=0, second_bonus_energy=0, first_skip_draw=False, shared=True, copies=2,
         reflect_cap=3, curse_dmg=1, fatigue_from=0)

def build():
    d = []
    for c in CARDS:
        d += [c["id"]] * c["count"] * P["copies"]
    return d
INFO = {c["id"]: c for c in CARDS}

class Table:  # deste + cop (ortak ya da kisisel)
    def __init__(s):
        s.deck = build(); random.shuffle(s.deck); s.disc = []

class Pl:
    deck = property(lambda s: s.tbl.deck, lambda s, v: setattr(s.tbl, "deck", v))
    disc = property(lambda s: s.tbl.disc, lambda s, v: setattr(s.tbl, "disc", v))
    def __init__(s, p, second, tbl):
        s.tbl = tbl
        s.hp = P["hp"]; s.en = P["energy"] + (P["second_bonus_energy"] if second else 0)
        s.hand = []
        s.shield = 0; s.sh_slots = P["sh_slots"]; s.en_slots = P["en_slots"]
        s.metal = False; s.reflect = 0; s.mult = 1
        s.en_lock = 0; s.sh_lock = 0; s.dmg_dealt = 0; s.played = 0; s.scraps = 0; s.wasted = 0
    def draw(s, n=1):
        for _ in range(n):
            if not s.deck:
                s.deck, s.disc = s.disc, []; random.shuffle(s.deck)
            if s.deck: s.hand.append(s.deck.pop())
    def cap(s):  # etkin kalkan kapasitesi
        return P["shield_per_slot"] * max(0, s.sh_slots - s.sh_lock)

def hit(att, dfn, dmg):
    """Saldiri: once kalkan, sonra can. Yansitma kontrolu."""
    eff = min(dfn.shield, dfn.cap()); absorbed = min(eff, dmg)
    dfn.shield -= absorbed; thru = dmg - absorbed
    dfn.hp -= thru; att.dmg_dealt += thru
    if dfn.hp > 0 and dfn.reflect:
        r = min(dmg, P["reflect_cap"]); att.hp -= r; dfn.reflect = 0

def play(me, op, cid):
    c = INFO[cid]; m = me.mult; me.mult = 1 if c["type"] in ("attack", "shield", "draw", "energy") else me.mult
    e = c["effect"]
    if "atk" in e: hit(me, op, e["atk"] * m)
    if "shield" in e: me.shield = min(me.shield + e["shield"] * m, me.cap())
    if "draw" in e: me.draw(e["draw"] * m)
    if "gain_energy" in e: me.en = min(P["bank_cap"], me.en + e["gain_energy"] * m)
    k = e.get("special")
    if k == "shield_slot_add": me.sh_slots = min(P["max_sh"], me.sh_slots + 1)
    elif k == "shield_slot_break": op.sh_slots = max(1, op.sh_slots - 1); op.shield = min(op.shield, op.cap())
    elif k == "energy_slot_add": me.en_slots = min(P["max_en"], me.en_slots + 1)
    elif k == "status_draw":
        seen = []
        while me.deck or me.disc:
            if not me.deck: me.deck, me.disc = me.disc, []; random.shuffle(me.deck)
            x = me.deck.pop()
            if INFO[x]["group"] == "durum" and x != "status_draw": me.hand.append(x); break
            seen.append(x)
        random.shuffle(seen); me.deck = seen + me.deck
    elif k == "reflect": me.reflect = 1
    elif k == "lock_shield": op.sh_lock = 1
    elif k == "lock_energy": op.en_lock = 1
    elif k == "multiplier": me.mult = 2
    elif k == "metallic": me.metal = True
    me.played += 1
    if cid != "recycle_free": me.disc.append(cid)

def cost_ok(me, c):
    k = c["effect"].get("special")
    if k == "curse": return False
    if c["cost_type"] == "hp": return me.hp > c["cost"]
    return me.en >= c["cost"]

def pay(me, c):
    if c["cost_type"] == "hp": me.hp -= c["cost"]
    else: me.en -= c["cost"]

def score(me, op, cid):
    c = INFO[cid]; e = c["effect"]; k = e.get("special"); per = c["cost"] or 0.5
    if "gain_energy" in e: return 100
    if k == "multiplier": return 90 if any(INFO[h].get("effect", {}).get("atk", 0) >= 2 for h in me.hand) else -1
    if k in ("energy_slot_add",): return 85 if me.hp > 8 else -1
    if k == "metallic": return 80 if not me.metal else -1
    if k == "status_draw": return 60
    if k == "recycle": 
        t = me.disc[-1] if me.disc else None
        return 70 if t and INFO[t]["type"] in ("attack", "shield", "hybrid", "draw") and cost_ok(me, INFO[t]) else -1
    if k == "lock_shield": return 75 if op.shield > 1 and any("atk" in INFO[h]["effect"] for h in me.hand if h != cid) else -1
    if k == "lock_energy": return 40
    if k == "shield_slot_break": return 55 if op.sh_slots > 2 else 30
    if k == "shield_slot_add": return 20
    if k == "reflect": return 25
    if "draw" in e and "atk" not in e: return 50
    a = e.get("atk", 0); s = e.get("shield", 0)
    danger = 1.6 if me.hp <= 8 else (1.0 if me.hp <= 13 else 0.6)
    lethal = a * (me.mult) >= op.hp
    v = (a * 10 * (2 if lethal else 1) + s * 10 * danger * 0.9) / per
    if op.hp <= 6: v += a * 4
    return v

def turn(me, op, tn, first):
    if not (first and P["first_skip_draw"] and tn == 0): me.draw(P["draw"])
    me.shield = 0 if not me.metal else 0
    me.sh_lock = 0
    gain = max(0, me.en_slots - me.en_lock); me.en_lock = 0
    if me.en + gain > P["bank_cap"]: me.wasted += me.en + gain - P["bank_cap"]
    me.en = min(P["bank_cap"], me.en + gain)
    if me.metal: me.shield = min(1, me.cap())
    me.reflect = 0 if me.reflect else 0
    # curse ayiklama (2 kart -> 1 cek)
    if "curse" in me.hand and len(me.hand) >= 2:
        me.hand.remove("curse"); w = min((h for h in me.hand), key=lambda h: score(me, op, h)); me.hand.remove(w)
        me.disc += ["curse", w]; me.draw(1); me.scraps += 1
    while me.hp > 0 and op.hp > 0:
        opts = [(score(me, op, h), h) for h in set(me.hand) if cost_ok(me, INFO[h])]
        opts = [o for o in opts if o[0] > 0]
        if not opts: break
        _, cid = max(opts)
        me.hand.remove(cid)
        c = INFO[cid]
        if c["effect"].get("special") == "recycle":
            pay(me, c); me.disc.append(cid); t = me.disc.pop(-2)
            play(me, op, t); continue
        pay(me, c); play(me, op, cid)
    me.mult = 1
    if "curse" in me.hand: me.hp -= P["curse_dmg"]
    while len(me.hand) > P["hand_limit"]:
        w = min(me.hand, key=lambda h: score(me, op, h)); me.hand.remove(w); me.disc.append(w)

def game():
    if P["shared"]:
        tb = Table(); a, b = Pl(P, False, tb), Pl(P, True, tb)
    else:
        a, b = Pl(P, False, Table()), Pl(P, True, Table())
    a.draw(P["hand"]); b.draw(P["hand"] + P["second_bonus_cards"])
    pl = [a, b]; t = 0
    while t < 60:
        me, op = pl[t % 2], pl[(t + 1) % 2]
        if t % 2 == 0 and P["fatigue_from"] and t // 2 + 1 >= P["fatigue_from"]:
            f = t // 2 + 2 - P["fatigue_from"]; a.hp -= f; b.hp -= f
            if a.hp <= 0 or b.hp <= 0:
                if a.hp == b.hp: return 1, t // 2 + 1, a, b
                return (0 if a.hp > b.hp else 1), t // 2 + 1, a, b
        turn(me, op, t // 2, t % 2 == 0)
        if op.hp <= 0: return t % 2, t // 2 + 1, a, b
        if me.hp <= 0: return (t + 1) % 2, t // 2 + 1, a, b
        t += 1
    return -1, 30, a, b

def run(n):
    w = collections.Counter(); turns = []; pl_ = []; wasted = []; mins_t = []; mins_m = []
    for _ in range(n):
        r, t, a, b = game(); w[r] += 1; turns.append(t); pl_ += [a.played / t, b.played / t]; wasted.append((a.wasted + b.wasted) / 2)
        acts = a.played + b.played + a.scraps + b.scraps; tt = 2 * t
        mins_t.append((60 + tt * 20 + acts * 12) / 60)   # masa: kurulum 1dk + 20sn/tur + 12sn/aksiyon
        mins_m.append((tt * 8 + acts * 6) / 60)          # mobil: 8sn/tur + 6sn/aksiyon
    return dict(first=w[0] / n, second=w[1] / n, draw=w[-1] / n, avg_rounds=sum(turns) / n,
                p10=sorted(turns)[n // 10], p90=sorted(turns)[9 * n // 10],
                cards_per_turn=sum(pl_) / len(pl_), wasted_energy=sum(wasted) / n,
                dk_masa=sum(mins_t) / n, dk_mobil=sum(mins_m) / n, dk_masa_p90=sorted(mins_t)[9 * n // 10])

if __name__ == "__main__":
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 5000
    random.seed(7)
    base = dict(P)
    G = dict(fatigue_from=7, second_bonus_energy=1)
    sets = [("A) Ortak 104 kart, ham kurallar", {}),
            ("B) Ortak 104 + Gerilim R7", dict(fatigue_from=7)),
            ("C) B + 2.oyuncu +1 Enerji", G),
            ("D) C, Gerilim R6", dict(G, fatigue_from=6)),
            ("E) C, Can 15", dict(G, hp=15)),
            ("F) C, Can 15, Gerilim R6", dict(G, hp=15, fatigue_from=6)),
            ("G) Kisisel 52+52 (onceki), C", dict(G, shared=False, copies=1))]
    for name, over in sets:
        P.clear(); P.update(base); P.update(over)
        r = run(n); print(f"{name:34s}", {k: round(v, 2) for k, v in r.items()})
