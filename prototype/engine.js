// Cicikus Kart Oyunu - kural cekirdegi (senaryo C). UI'dan bagimsiz; Unity/Godot'a port edilebilir.
// Senaryo C: ortak 104 kart (2x52), ortak Cop, Can 20, Enerji 4 (2. oyuncu 5), Gerilim 7. turdan.
(function (root) {
  var CARDS = (typeof module !== 'undefined' && typeof require === 'function') ? require('./cards-data.js') : root.CICIKUS_CARDS;
  var INFO = {}; CARDS.forEach(function (c) { INFO[c.id] = c; });

  var RULES = { hp: 20, energy: 4, secondEnergy: 5, hand: 5, draw: 2, handLimit: 7, bankCap: 8,
    perSlot: 2, shSlots: 2, enSlots: 2, maxSh: 4, maxEn: 4, gerilimFrom: 7, copies: 2,
    reflectCap: 3, scrapMax: 2, stackMetal: false };

  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function shuffle(a, rng) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rng() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  function newPlayer(R, second) {
    return { hp: R.hp, en: second ? R.secondEnergy : R.energy, hand: [], shield: 0, shSlots: R.shSlots, enSlots: R.enSlots,
      shLock: 0, enLock: 0, metal: false, reflect: 0, mult: 1, stash: null, stashTurn: -1, scraps: 0, tactic: false,
      played: 0, dealt: 0 };
  }

  function newGame(seed, rules) {
    var R = Object.assign({}, RULES, rules || {}); var rng = mulberry32(seed == null ? (Math.random() * 1e9) | 0 : seed);
    var deck = [];
    CARDS.forEach(function (c) { for (var i = 0; i < c.count * R.copies; i++) deck.push(c.id); });
    shuffle(deck, rng);
    var G = { R: R, rng: rng, deck: deck, disc: [], p: [newPlayer(R, false), newPlayer(R, true)], turn: 0, round: 1, tcount: 0,
      phase: 'risk', winner: null, why: '', log: [], gerilimHit: false };
    draw(G, 0, R.hand); draw(G, 1, R.hand);
    beginTurn(G);
    return G;
  }

  function log(G, who, msg) { G.log.push({ who: who, msg: msg }); }
  function draw(G, who, n) {
    var got = 0;
    for (var i = 0; i < n; i++) {
      if (!G.deck.length) { G.deck = shuffle(G.disc, G.rng); G.disc = []; }
      if (!G.deck.length) break;
      G.p[who].hand.push(G.deck.pop()); got++;
    }
    return got;
  }
  function cap(p) { return RULES.perSlot * Math.max(0, p.shSlots - p.shLock); }
  function effShield(p) { return Math.min(p.shield, cap(p)); }

  function checkEnd(G) {
    if (G.winner !== null) return true;
    var a = G.p[0].hp, b = G.p[1].hp;
    if (a > 0 && b > 0) return false;
    if (a <= 0 && b <= 0) { G.winner = a > b ? 0 : 1; G.why = 'Ayni anda 0: Can fazla / esitlikte 2. oyuncu'; }
    else G.winner = a <= 0 ? 1 : 0;
    G.phase = 'ended'; if (!G.why) G.why = 'Can 0'; log(G, G.winner, 'Oyun bitti.');
    return true;
  }

  function hit(G, me, dmg) {
    var A = G.p[me], D = G.p[1 - me];
    var eff = effShield(D), ab = Math.min(eff, dmg); D.shield -= ab; var thru = dmg - ab;
    D.hp -= thru; A.dealt += thru;
    if (thru || ab) log(G, me, 'Hasar ' + dmg + (ab ? ' (Kalkan ' + ab + ' emdi)' : '') + (thru ? ' -> Can -' + thru : ''));
    if (checkEnd(G)) return;
    if (D.reflect) { var r = Math.min(dmg, G.R.reflectCap); A.hp -= r; D.reflect = 0; log(G, 1 - me, 'Yansit: rakibe ' + r + ' Hasar'); checkEnd(G); }
  }

  // ---- tur akisi ----
  function beginTurn(G) {
    var who = G.turn, P = G.p[who];
    if (who === 0 && G.round >= G.R.gerilimFrom) {
      var f = G.round - G.R.gerilimFrom + 1; G.p[0].hp -= f; G.p[1].hp -= f; G.gerilimHit = true;
      log(G, -1, 'GERILIM: iki oyuncu da ' + f + ' Can kaybeder.');
      if (checkEnd(G)) return;
    }
    P.shield = 0; P.reflect = 0; P.mult = 1; P.scraps = 0; P.tactic = false; P.riskUsed = false;
    G.phase = 'risk';
  }

  // mode: 'none' | 'cesur' | 'kumar'  (kumar: opts.heads boolean opsiyonel)
  function chooseRisk(G, who, mode, heads) {
    if (G.phase !== 'risk' || G.turn !== who) return { ok: false, err: 'Risk fazi degil' };
    var P = G.p[who], R = G.R, gain = Math.max(0, P.enSlots - P.enLock); P.enLock = 0; var extra = 0;
    if (mode === 'cesur') { gain = Math.max(0, gain - 1); extra = 2; log(G, who, 'Cesur: +2 kart, -1 Enerji'); }
    var kumarTails = false;
    if (mode === 'kumar') {
      if (heads === undefined) heads = G.rng() < 0.5;
      if (heads) { extra = 1; gain += 1; log(G, who, 'Kumar: YAZI -> +1 kart, +1 Enerji'); }
      else { kumarTails = true; log(G, who, 'Kumar: TURA -> -1 Enerji, -1 Can'); }
    }
    P.en = Math.min(R.bankCap, P.en + gain);
    if (kumarTails) { P.en = Math.max(0, P.en - 1); P.hp -= 1; if (checkEnd(G)) return { ok: true }; }
    if (P.metal) { P.shield = Math.min(1, cap(P)); }
    draw(G, who, R.draw + extra);
    G.phase = 'main'; log(G, who, 'Tur basi: Enerji ' + P.en + ', el ' + P.hand.length);
    return { ok: true, heads: heads };
  }

  function canPlay(G, who, id, free) {
    var c = INFO[id], P = G.p[who], k = c.effect.special;
    if (G.phase !== 'main' || G.turn !== who) return 'Senin turun degil';
    if (k === 'curse') return 'Lanet oynanamaz';
    if (k === 'recycle') { var t = G.disc[G.disc.length - 1]; if (!t || INFO[t].effect.special === 'curse' || INFO[t].effect.special === 'recycle') return 'Cop ustu uygun degil'; }
    if (k === 'metallic' && P.metal && !G.R.stackMetal) return 'Zaten masada';
    if (!free) {
      if (c.cost_type === 'hp') { if (P.hp <= c.cost) return 'Yeterli Can yok'; }
      else if (P.en < c.cost) return 'Yeterli Enerji yok';
    }
    return null;
  }

  function apply(G, who, id, free) {
    var c = INFO[id], P = G.p[who], O = G.p[1 - who], e = c.effect, k = e.special;
    if (!free) { if (c.cost_type === 'hp') P.hp -= c.cost; else P.en -= c.cost; }
    var numeric = e.atk || e.shield || e.draw || e.gain_energy; var m = P.mult; if (numeric) P.mult = 1;
    log(G, who, c.name_tr + (m > 1 && numeric ? ' (x2)' : ''));
    if (e.atk) hit(G, who, e.atk * m);
    if (G.winner !== null) return;
    if (e.shield) { P.shield = Math.min(P.shield + e.shield * m, cap(P)); }
    if (e.draw) draw(G, who, e.draw * m);
    if (e.gain_energy) P.en = Math.min(G.R.bankCap, P.en + e.gain_energy * m);
    switch (k) {
      case 'shield_slot_add': P.shSlots = Math.min(G.R.maxSh, P.shSlots + 1); break;
      case 'shield_slot_break': O.shSlots = Math.max(1, O.shSlots - 1); O.shield = Math.min(O.shield, cap(O)); break;
      case 'energy_slot_add': P.enSlots = Math.min(G.R.maxEn, P.enSlots + 1); break;
      case 'status_draw':
        var seen = [], found = null;
        while (G.deck.length || G.disc.length) {
          if (!G.deck.length) { G.deck = shuffle(G.disc, G.rng); G.disc = []; }
          var x = G.deck.pop();
          if (INFO[x].group === 'durum' && x !== 'status_draw') { found = x; break; }
          seen.push(x);
        }
        if (found) { P.hand.push(found); log(G, who, 'Durum Avi: ' + INFO[found].name_tr); }
        shuffle(seen, G.rng); G.deck = seen.concat(G.deck); break;
      case 'reflect': P.reflect = 1; break;
      case 'lock_shield': O.shLock = 1; break;
      case 'lock_energy': O.enLock = 1; break;
      case 'multiplier': P.mult = 2; break;
      case 'metallic': P.metal = true; break;
    }
    P.played++;
    checkEnd(G);
  }

  // src: el indeksi (sayi) veya 'stash'
  function playCard(G, who, src) {
    var P = G.p[who], id, free = false;
    if (src === 'stash') {
      if (!P.stash || G.tcount <= P.stashTurn) return { ok: false, err: 'Gizli kart henuz hazir degil' };
      id = P.stash; free = true;
    } else { id = P.hand[src]; if (!id) return { ok: false, err: 'Kart yok' }; }
    var err = canPlay(G, who, id, free); if (err) return { ok: false, err: err };
    var k = INFO[id].effect.special;
    if (src === 'stash') P.stash = null; else P.hand.splice(src, 1);
    if (k === 'recycle') {
      if (!free) P.en -= INFO[id].cost; G.disc.push(id); log(G, who, 'Hortlayan Hamle');
      var t = G.disc.splice(G.disc.length - 2, 1)[0];
      apply(G, who, t, true); if (INFO[t].effect.special !== 'metallic') G.disc.push(t);
      return { ok: true };
    }
    apply(G, who, id, free);
    if (!(k === 'metallic')) G.disc.push(id);
    return { ok: true };
  }

  function scrap(G, who, i, j) {
    var P = G.p[who];
    if (G.phase !== 'main' || G.turn !== who) return { ok: false, err: 'Senin turun degil' };
    if (P.scraps >= G.R.scrapMax) return { ok: false, err: 'Tur basina en fazla ' + G.R.scrapMax + ' Cop Atma' };
    if (i === j || P.hand[i] == null || P.hand[j] == null) return { ok: false, err: 'Iki farkli kart sec' };
    var hi = Math.max(i, j), lo = Math.min(i, j);
    G.disc.push(P.hand.splice(hi, 1)[0], P.hand.splice(lo, 1)[0]);
    draw(G, who, 1); P.scraps++; log(G, who, 'Cop Atma (2->1)');
    return { ok: true };
  }

  // ---- taktikler (tur basina 1) ----
  function stash(G, who, i) {
    var P = G.p[who];
    if (G.phase !== 'main' || G.turn !== who) return { ok: false, err: 'Senin turun degil' };
    if (P.tactic) return { ok: false, err: 'Bu tur Taktik kullandin' };
    if (P.stash) return { ok: false, err: 'Gizli Alan dolu' };
    if (!P.hand[i]) return { ok: false, err: 'Kart yok' };
    P.stash = P.hand.splice(i, 1)[0]; P.stashTurn = G.tcount; P.tactic = true; log(G, who, 'Gizle: 1 kart kapali konuldu'); return { ok: true };
  }
  // mode 'swap' (2 E, myIdx gerekli) | 'discard' (3 E)
  function takas(G, who, oppIdx, mode, myIdx) {
    var P = G.p[who], O = G.p[1 - who], cost = mode === 'discard' ? 3 : 2;
    if (G.phase !== 'main' || G.turn !== who) return { ok: false, err: 'Senin turun degil' };
    if (P.tactic) return { ok: false, err: 'Bu tur Taktik kullandin' };
    if (P.en < cost) return { ok: false, err: 'Yeterli Enerji yok' };
    if (!O.hand.length || O.hand[oppIdx] == null) return { ok: false, err: 'Rakibin eli bos' };
    var taken = O.hand[oppIdx];
    if (mode === 'swap') {
      if (P.hand[myIdx] == null) return { ok: false, err: 'Verecegin karti sec' };
      O.hand[oppIdx] = P.hand[myIdx]; P.hand[myIdx] = taken; log(G, who, 'Takas: rakibin elinden kart alindi, 1 kart verildi');
    } else { O.hand.splice(oppIdx, 1); G.disc.push(taken); log(G, who, 'Takas: rakibin karti Cop\'e atildi (' + INFO[taken].name_tr + ')'); }
    P.en -= cost; P.tactic = true; return { ok: true, taken: taken };
  }
  function gozcuPeek(G) { return G.deck.slice(-2).reverse(); } // [ust, ikinci]
  // bottom: [bool ust, bool ikinci] -> true = destenin altina
  function gozcu(G, who, bottom) {
    var P = G.p[who];
    if (G.phase !== 'main' || G.turn !== who) return { ok: false, err: 'Senin turun degil' };
    if (P.tactic) return { ok: false, err: 'Bu tur Taktik kullandin' };
    if (P.en < 1) return { ok: false, err: 'Yeterli Enerji yok' };
    var top = [];
    for (var n = 0; n < 2; n++) { if (!G.deck.length && G.disc.length) { G.deck = shuffle(G.disc, G.rng); G.disc = []; } if (G.deck.length) top.push(G.deck.pop()); }
    var keep = [], down = [];
    top.forEach(function (c, i) { (bottom[i] ? down : keep).push(c); });
    G.deck = down.concat(G.deck); for (var i = keep.length - 1; i >= 0; i--) G.deck.push(keep[i]);
    P.en -= 1; P.tactic = true; log(G, who, 'Gozcu: ust 2 karta bakildi (' + down.length + ' alta)'); return { ok: true };
  }

  function needDiscard(G, who) { return Math.max(0, G.p[who].hand.length - G.R.handLimit); }
  function endTurn(G, who, discardIdx) {
    var P = G.p[who];
    if (G.phase !== 'main' || G.turn !== who) return { ok: false, err: 'Senin turun degil' };
    if (P.hand.indexOf('curse') >= 0) { P.hp -= 1; log(G, who, 'Lanet: -1 Can'); if (checkEnd(G)) return { ok: true }; }
    var n = needDiscard(G, who);
    if (n > 0) {
      var idx = (discardIdx || []).slice().sort(function (a, b) { return b - a; });
      if (idx.length !== n) { return { ok: false, needDiscard: n, err: 'El siniri: ' + n + ' kart at' }; }
      idx.forEach(function (i) { G.disc.push(P.hand.splice(i, 1)[0]); });
    }
    P.mult = 1; G.p[1 - who].shLock = 0;
    G.tcount++; G.turn = 1 - who; if (G.turn === 0) G.round++;
    beginTurn(G); return { ok: true };
  }

  // ---- bot ----
  function score(G, who, id) {
    var me = G.p[who], op = G.p[1 - who], c = INFO[id], e = c.effect, k = e.special, per = c.cost || 0.5;
    if (e.gain_energy) return 100;
    if (k === 'multiplier') return me.hand.some(function (h) { return (INFO[h].effect.atk || 0) >= 2; }) ? 90 : -1;
    if (k === 'energy_slot_add') return me.hp > 8 ? 85 : -1;
    if (k === 'metallic') return me.metal ? -1 : 80;
    if (k === 'status_draw') return 60;
    if (k === 'recycle') { var t = G.disc[G.disc.length - 1]; return t && ['attack', 'shield', 'hybrid', 'draw'].indexOf(INFO[t].type) >= 0 ? 70 : -1; }
    if (k === 'lock_shield') return op.shield > 1 && me.hand.some(function (h) { return h !== id && INFO[h].effect.atk; }) ? 75 : -1;
    if (k === 'lock_energy') return 40;
    if (k === 'shield_slot_break') return op.shSlots > 2 ? 55 : 30;
    if (k === 'shield_slot_add') return 20;
    if (k === 'reflect') return 25;
    if (e.draw && !e.atk) return 50;
    var a = e.atk || 0, s = e.shield || 0, danger = me.hp <= 8 ? 1.6 : (me.hp <= 13 ? 1.0 : 0.6);
    var v = (a * 10 * (a * me.mult >= op.hp ? 2 : 1) + s * 10 * danger * 0.9) / per;
    if (op.hp <= 6) v += a * 4;
    return v;
  }
  // tek bir bot aksiyonu; false = tur bitti
  function botStep(G) {
    var who = G.turn, P = G.p[who];
    if (G.winner !== null) return false;
    if (G.phase === 'risk') { chooseRisk(G, who, 'none'); return true; }
    if (G.phase !== 'main') return false;
    var ci = P.hand.indexOf('curse');
    if (ci >= 0 && P.hand.length >= 2 && P.scraps < G.R.scrapMax) {
      var best = -1, bs = 1e9; P.hand.forEach(function (h, i) { if (i !== ci) { var s = score(G, who, h); if (s < bs) { bs = s; best = i; } } });
      scrap(G, who, ci, best); return true;
    }
    if (ci >= 0 && !P.tactic && P.en >= 2 && G.p[1 - who].hand.length) { // Lanet'i rakibe devret
      var oi = Math.floor(G.rng() * G.p[1 - who].hand.length); takas(G, who, oi, 'swap', ci); return true;
    }
    var opts = [];
    P.hand.forEach(function (h, i) { if (!canPlay(G, who, h)) { var s = score(G, who, h); if (s > 0) opts.push([s, i]); } });
    if (opts.length) { opts.sort(function (a, b) { return b[0] - a[0]; }); playCard(G, who, opts[0][1]); return true; }
    if (P.stash === null && false) return false;
    var n = needDiscard(G, who), di = [];
    if (n > 0) { var order = P.hand.map(function (h, i) { return [score(G, who, h), i]; }).sort(function (a, b) { return a[0] - b[0]; }); di = order.slice(0, n).map(function (o) { return o[1]; }); }
    endTurn(G, who, di); return false;
  }

  var API = { CARDS: CARDS, INFO: INFO, RULES: RULES, newGame: newGame, chooseRisk: chooseRisk, canPlay: canPlay, playCard: playCard,
    scrap: scrap, stash: stash, takas: takas, gozcu: gozcu, gozcuPeek: gozcuPeek, endTurn: endTurn, needDiscard: needDiscard,
    botStep: botStep, cap: cap, effShield: effShield, score: score };
  if (typeof module !== 'undefined') module.exports = API; else root.Cicikus = API;
})(typeof window !== 'undefined' ? window : globalThis);
