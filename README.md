# Cicikuş Kart Oyunu

1v1 düello kart oyunu, 2×52 = 104 kartlık ortak deste (mobil hedefli).

- `docs/KURAL_KITAPCIGI.md` — kurallar, kart metinleri
- `docs/TASARIM_ANALIZI.md` — enerji eğrisi, denge, simülasyon bulguları
- `data/cards.json`, `data/cards.csv` — kart verisi (Unity/Godot için)
- `tools/sim.py` — denge simülasyonu (`python3 tools/sim.py 5000`)

## Prototip (senaryo C)
- Oyna: `prototype/cicikus-prototype.html` dosyasını tarayıcıda aç (tek dosya, mobil uyumlu, bota karşı).
- `prototype/engine.js`: UI'dan bağımsız kural çekirdeği (Unity/Godot'a port referansı).
- `prototype/ui.js`, `prototype/index.html`: arayüz. Tek dosyayı yeniden üretmek: `python3 tools/build_prototype.py`.
- Test: `node prototype/test_bots.js 3000` (bot-bot; ~%52/%48, ~10 tur).
