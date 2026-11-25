// Bot-bot testi: node prototype/test_bots.js [oyun]
const E = require('./engine.js');
const N = +process.argv[2] || 3000; let w = [0, 0], rounds = 0, ger = 0, played = 0, bad = 0, cards = 0;
for (let s = 1; s <= N; s++) {
  const G = E.newGame(s); let guard = 0;
  while (G.winner === null && guard++ < 5000) E.botStep(G);
  if (G.winner === null) { bad++; continue; }
  w[G.winner]++; rounds += G.round; if (G.gerilimHit) ger++; played += G.p[0].played + G.p[1].played; cards += 0;
  // kart sayisi korunuyor mu
  const total = G.deck.length + G.disc.length + G.p[0].hand.length + G.p[1].hand.length + [0,1].reduce((a,i)=>a+(G.p[i].stash?1:0)+(G.p[i].metal?1:0),0);
  if (total !== 104) { bad++; if (bad < 4) console.log('kart sayisi', total, s); }
}
console.log({ oyun: N, ilk: (w[0] / N).toFixed(3), ikinci: (w[1] / N).toFixed(3), ort_tur: (rounds / N).toFixed(2), gerilimli: (ger / N).toFixed(2), kart_tur: (played / rounds / 2).toFixed(2), hatali: bad });
