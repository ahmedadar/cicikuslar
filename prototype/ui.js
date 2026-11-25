(function () {
  var E = window.Cicikus, INFO = E.INFO;
  var G, H = 0, mode = null, sel = [], busy = false, takasTarget = null;
  var $ = function (id) { return document.getElementById(id); };
  var typeTr = { attack: 'Saldırı', shield: 'Kalkan', hybrid: 'Melez', draw: 'Çekme', energy: 'Enerji', slot: 'Yuva', stun: 'Kilit', reaction: 'Tepki', curse: 'Lanet', recycle: 'Özel', buff: 'Güçlendir', permanent: 'Kalıcı' };

  function costTxt(c) { return c.cost == null ? '—' : (c.cost_type === 'hp' ? c.cost + ' Can' : c.cost + ' E'); }
  function cardHtml(id, cls, extra) {
    var c = INFO[id];
    return '<button class="card ' + c.type + ' ' + (cls || '') + '" ' + (extra || '') + '>' +
      '<span class="c ' + (c.cost_type === 'hp' ? 'hpc' : '') + '">' + costTxt(c) + '</span><b>' + c.name_tr + '</b><small>' + c.text_tr + '</small></button>';
  }
  function slots(p) {
    var s = '', i;
    for (i = 0; i < p.shSlots; i++) s += '<span class="slot s' + (i < p.shLock ? ' lock' : '') + '" title="Kalkan Yuvası"></span>';
    s += ' ';
    for (i = 0; i < p.enSlots; i++) s += '<span class="slot e' + (i < p.enLock ? ' lock' : '') + '" title="Enerji Yuvası"></span>';
    return '<span class="slots">' + s + '</span>';
  }
  function panel(who, mine) {
    var p = G.p[who], tags = '';
    if (p.metal) tags += '<span class="tag">Metalik Deri</span>';
    if (p.reflect) tags += '<span class="tag">Yansıt</span>';
    if (p.mult > 1) tags += '<span class="tag">×2 hazır</span>';
    if (p.shLock) tags += '<span class="tag">Siper Kilitli</span>';
    if (p.enLock) tags += '<span class="tag">Kaynak Kilitli</span>';
    var st = p.stash ? (mine ? 'Gizli: ' + INFO[p.stash].name_tr : 'Gizli: 1 kapalı kart') : '';
    return '<div class="row"><span class="name">' + (mine ? 'Sen' : 'Rakip (Bot)') + '</span>' +
      (G.turn === who ? '<span class="turn ' + (mine ? '' : 'opp') + '">sıra</span>' : '') + '<span class="sp"></span>' +
      '<span class="stat hp">♥ ' + Math.max(0, p.hp) + '</span><span class="stat en">⚡ ' + p.en + '</span><span class="stat sh">🛡 ' + E.effShield(p) + '/' + E.cap(p) + '</span></div>' +
      '<div class="row" style="margin-top:6px">' + slots(p) + tags + '<span class="sp"></span><span class="mut">' + (mine ? '' : 'El: ' + p.hand.length) + ' ' + st + '</span></div>';
  }

  function render() {
    var O = 1 - H, me = G.p[H], myTurn = G.turn === H && G.phase === 'main' && !busy;
    var opHtml = panel(O, false);
    if (mode === 'takasPick') {
      opHtml += '<div class="row" style="margin-top:6px">' + G.p[O].hand.map(function (_, i) { return '<div class="back pick" data-opp="' + i + '"></div>'; }).join('') + '</div>';
    }
    $('oppPanel').innerHTML = opHtml;
    $('mePanel').innerHTML = panel(H, true);
    var gNext = Math.max(0, G.round + 1 - G.R.gerilimFrom + 1);
    $('info').innerHTML = '<div><b>Tur ' + G.round + '</b></div><div class="mut">Deste: ' + G.deck.length + '</div><div class="mut">Çöp: ' + G.disc.length + '</div>' +
      (G.disc.length ? '<div class="tag" style="margin-top:4px">üst: ' + INFO[G.disc[G.disc.length - 1]].name_tr + '</div>' : '') +
      '<div class="mut" style="margin-top:4px">' + (gNext > 0 ? '⚠ Gerilim sonraki turda: −' + gNext : 'Gerilim: ' + G.R.gerilimFrom + '. turda') + '</div>';
    var lg = $('log'); lg.innerHTML = G.log.slice(-40).map(function (l) {
      var cls = l.who === -1 ? 'sys' : (l.who === H ? 'me' : 'op'); return '<div class="' + cls + '">' + (l.who === -1 ? '' : (l.who === H ? 'Sen: ' : 'Bot: ')) + l.msg + '</div>';
    }).join(''); lg.scrollTop = lg.scrollHeight;

    // el
    var hh = '';
    me.hand.forEach(function (id, i) {
      var err = myTurn ? E.canPlay(G, H, id) : 'x';
      var off = (mode === null && err) ? 'off' : '';
      var s = sel.indexOf(i) >= 0 ? ' sel' : '';
      hh += cardHtml(id, off + s, 'data-i="' + i + '" title="' + (err && err !== 'x' ? err : '') + '"');
    });
    if (me.stash) {
      var ready = G.tcount > me.stashTurn;
      hh += '<div style="flex:0 0 auto;border-left:2px dashed var(--line);padding-left:6px">' + cardHtml(me.stash, ready ? '' : 'off', 'data-stash="1"') + '<div class="mut" style="font-size:10px;text-align:center">Gizli Alan' + (ready ? ' · bedava' : ' · hazır değil') + '</div></div>';
    }
    $('hand').innerHTML = hh;

    // prompt
    var pr = $('prompt');
    var msgs = { scrap: 'Çöp Atma: atılacak 2 kartı seç (' + sel.length + '/2)', stash: 'Gizle: Gizli Alan\'a koyulacak kartı seç', takasPick: 'Takas: rakibin kapalı kartlarından birini seç',
      takasGive: 'Takas: karşılığında vereceğin kartı seç', discard: 'El sınırı: atılacak ' + E.needDiscard(G, H) + ' kartı seç (' + sel.length + ' seçili)' };
    if (mode) { pr.style.display = 'block'; pr.innerHTML = msgs[mode] + (mode === 'takasGive' || mode === 'discard' ? '' : ' <button class="b" id="cancel" style="margin-left:8px;flex:none;padding:3px 10px">İptal</button>'); }
    else pr.style.display = 'none';

    // aksiyonlar
    var a = '';
    if (G.phase === 'ended') a = '<button class="b pri" id="again">Yeni oyun</button>';
    else {
      var t = me.tactic, en = me.en;
      a += '<button class="b" id="bScrap"' + (myTurn && me.scraps < G.R.scrapMax && me.hand.length >= 2 ? '' : ' disabled') + '>Çöp Atma 2→1 (' + (G.R.scrapMax - me.scraps) + ')</button>';
      a += '<button class="b" id="bStash"' + (myTurn && !t && !me.stash && me.hand.length ? '' : ' disabled') + '>Gizle</button>';
      a += '<button class="b" id="bTakas"' + (myTurn && !t && en >= 2 && G.p[O].hand.length ? '' : ' disabled') + '>Takas 2⚡</button>';
      a += '<button class="b" id="bGozcu"' + (myTurn && !t && en >= 1 ? '' : ' disabled') + '>Gözcü 1⚡</button>';
      a += '<button class="b pri" id="bEnd"' + (myTurn && mode === null ? '' : ' disabled') + '>Turu bitir</button>';
    }
    $('acts').innerHTML = a;
    bind();
  }

  function bind() {
    var q = function (s) { return document.querySelector(s); };
    var c = $('cancel'); if (c) c.onclick = function () { mode = null; sel = []; render(); };
    document.querySelectorAll('#hand [data-i]').forEach(function (el) { el.onclick = function () { onHand(+el.getAttribute('data-i')); }; });
    var st = q('#hand [data-stash]'); if (st) st.onclick = function () {
      if (G.turn !== H || G.phase !== 'main' || busy || mode) return; var r = E.playCard(G, H, 'stash'); if (!r.ok) flash(r.err); afterAct(); };
    document.querySelectorAll('[data-opp]').forEach(function (el) { el.onclick = function () { takasReveal(+el.getAttribute('data-opp')); }; });
    var map = { bScrap: function () { mode = 'scrap'; sel = []; render(); }, bStash: function () { mode = 'stash'; render(); },
      bTakas: function () { mode = 'takasPick'; render(); }, bGozcu: gozcuModal, bEnd: endMyTurn, again: start };
    Object.keys(map).forEach(function (k) { var b = $(k); if (b) b.onclick = map[k]; });
  }

  function flash(msg) { G.log.push({ who: -1, msg: '⚠ ' + msg }); }
  function onHand(i) {
    var me = G.p[H];
    if (G.phase === 'ended' || busy) return;
    if (mode === 'scrap') {
      var k = sel.indexOf(i); if (k >= 0) sel.splice(k, 1); else sel.push(i);
      if (sel.length === 2) { var r = E.scrap(G, H, sel[0], sel[1]); if (!r.ok) flash(r.err); mode = null; sel = []; }
      return render();
    }
    if (mode === 'stash') { var r2 = E.stash(G, H, i); if (!r2.ok) flash(r2.err); mode = null; return render(); }
    if (mode === 'takasGive') { var r3 = E.takas(G, H, takasTarget, 'swap', i); if (!r3.ok) flash(r3.err); mode = null; takasTarget = null; return afterAct(); }
    if (mode === 'discard') {
      var j = sel.indexOf(i); if (j >= 0) sel.splice(j, 1); else sel.push(i);
      if (sel.length === E.needDiscard(G, H)) { var d = sel.slice(); sel = []; mode = null; var re = E.endTurn(G, H, d); if (!re.ok) flash(re.err); return afterEnd(); }
      return render();
    }
    if (G.turn !== H || G.phase !== 'main') return;
    var r4 = E.playCard(G, H, i); if (!r4.ok) flash(r4.err); afterAct();
  }
  function afterAct() { render(); if (G.phase === 'ended') showEnd(); }
  function afterEnd() { render(); if (G.phase === 'ended') return showEnd(); runBot(); }

  function endMyTurn() {
    var n = E.needDiscard(G, H);
    if (n > 0) { mode = 'discard'; sel = []; return render(); }
    var r = E.endTurn(G, H); if (!r.ok) flash(r.err); afterEnd();
  }

  function modal(html) { $('modalBox').innerHTML = html; $('modal').style.display = 'flex'; }
  function closeModal() { $('modal').style.display = 'none'; }

  function riskModal() {
    var me = G.p[H], gain = Math.max(0, me.enSlots - me.enLock);
    modal('<h3>Tur ' + G.round + ' · Risk seçimi</h3><div class="mut">Enerji kazancın: +' + gain + ', kart: 2</div>' +
      '<button class="b opt" id="r0"><b>Normal</b><br><span class="mut">+' + gain + ' Enerji, 2 kart çek</span></button>' +
      '<button class="b opt" id="r1"><b>Cesur</b><br><span class="mut">+2 fazladan kart, −1 Enerji (kazançtan)</span></button>' +
      '<button class="b opt" id="r2"><b>Kumar (yazı-tura)</b><br><span class="mut">Yazı: +1 kart, +1 Enerji · Tura: −1 Enerji, −1 Can</span></button>');
    ['none', 'cesur', 'kumar'].forEach(function (m, i) { $('r' + i).onclick = function () { closeModal(); E.chooseRisk(G, H, m); render(); if (G.phase === 'ended') showEnd(); }; });
  }

  function takasReveal(oi) {
    takasTarget = oi; var id = G.p[1 - H].hand[oi], me = G.p[H];
    mode = null;
    modal('<h3>Takas: seçtiğin kart</h3>' + '<div style="display:flex;justify-content:center;margin:8px 0">' + cardHtml(id, '', 'disabled') + '</div>' +
      '<button class="b opt" id="tSwap"' + (me.en >= 2 ? '' : ' disabled') + '>Değiştir (2⚡): bir kartını ver</button>' +
      '<button class="b opt" id="tDisc"' + (me.en >= 3 ? '' : ' disabled') + '>Çöp\'e attır (3⚡)</button>');
    $('tSwap').onclick = function () { closeModal(); mode = 'takasGive'; render(); };
    $('tDisc').onclick = function () { closeModal(); var r = E.takas(G, H, oi, 'discard'); if (!r.ok) flash(r.err); takasTarget = null; afterAct(); };
  }

  function gozcuModal() {
    var top = E.gozcuPeek(G), bottom = [false, false];
    function draw() {
      modal('<h3>Gözcü: destenin üstü</h3><div class="mut">Alta koymak istediklerini işaretle.</div><div style="display:flex;gap:8px;justify-content:center;margin:10px 0">' +
        top.map(function (id, i) { return '<div style="text-align:center">' + cardHtml(id, bottom[i] ? 'off' : '', 'disabled') + '<button class="b" data-g="' + i + '" style="margin-top:6px;flex:none;width:100%">' + (bottom[i] ? 'Altta' : 'Üstte') + '</button></div>'; }).join('') +
        '</div><button class="b pri opt" id="gOk">Tamam (1⚡)</button><button class="b opt" id="gNo">Vazgeç</button>');
      document.querySelectorAll('[data-g]').forEach(function (b) { b.onclick = function () { var i = +b.getAttribute('data-g'); bottom[i] = !bottom[i]; draw(); }; });
      $('gOk').onclick = function () { closeModal(); var r = E.gozcu(G, H, bottom); if (!r.ok) flash(r.err); render(); };
      $('gNo').onclick = closeModal;
    }
    draw();
  }

  function showEnd() {
    var win = G.winner === H;
    modal('<h3>' + (win ? '🏆 Kazandın!' : 'Kaybettin') + '</h3><div class="mut">' + G.why + ' · ' + G.round + '. tur</div>' +
      '<div style="margin:8px 0">Sen ♥ ' + Math.max(0, G.p[H].hp) + ' · Bot ♥ ' + Math.max(0, G.p[1 - H].hp) + '</div><button class="b pri opt" id="mAgain">Yeni oyun</button><button class="b opt" id="mClose">Masaya bak</button>');
    $('mAgain').onclick = function () { closeModal(); start(); }; $('mClose').onclick = closeModal;
  }

  function runBot() {
    if (G.phase === 'ended') return;
    if (G.turn === H) { busy = false; render(); if (G.phase === 'risk') riskModal(); return; }
    busy = true; render();
    setTimeout(function step() {
      var more = E.botStep(G); render();
      if (G.phase === 'ended') { busy = false; return showEnd(); }
      if (more && G.turn !== H) setTimeout(step, 750);
      else runBot();
    }, 750);
  }

  function start() {
    modal('<h3>Cicikuş Kart Oyunu</h3><div class="mut">Prototip · Senaryo C · ortak 104 kart · Can 20</div>' +
      '<button class="b opt" id="s0"><b>1. oyuncu olarak başla</b><br><span class="mut">Enerji 4</span></button>' +
      '<button class="b opt" id="s1"><b>2. oyuncu olarak başla</b><br><span class="mut">Enerji 5 (denge bonusu)</span></button>' +
      '<div class="mut" style="margin-top:8px;font-size:12px">Bir kartı oynamak için üstüne dokun. Gizle/Takas/Gözcü: tur başına 1 Taktik.</div>');
    [0, 1].forEach(function (s) { $('s' + s).onclick = function () { closeModal(); H = s; G = E.newGame(); mode = null; sel = []; busy = false; render(); runBot(); }; });
  }
  window.addEventListener('load', function () { G = E.newGame(); render(); start(); });
})();
