# Cicikuş Kart Oyunu — Kural Kitapçığı (v0.1)

2 oyunculu (1v1) düello kart oyunu · 52 kartlık deste · ~10 tur · ~15 dk

## 1. Malzemeler
- Her oyuncu için **aynı içerikte 52 kartlık kişisel deste** (ayna deste; kart listesi: `data/cards.json`).
- Can sayacı (20), Enerji sayacı, Kalkan sayacı, Yuva göstergeleri, 1 jeton (yazı-tura).
- Her oyuncunun masasında: **Deste, Çöp (atılanlar, açık), Gizli Alan (1 kart), Kalıcı Alan, Yuva Şeridi**.

## 2. Hazırlık
| | 1. oyuncu | 2. oyuncu |
|---|---|---|
| Can | 20 | 20 |
| Başlangıç Enerjisi | 4 | **5** (ilk-oyuncu dengesi) |
| Başlangıç eli | 5 kart | 5 kart |
| Kalkan Yuvası | 2 | 2 |
| Enerji Yuvası | 2 | 2 |

Desteni karıştır. Başlayanı yazı-tura belirler.

## 3. Terimler (Sözlük)
| Terim | Anlamı (İngilizce karşılığı) |
|---|---|
| **Hasar** | Rakibin önce Kalkan'ını, kalanı Can'ını azaltır. (Damage) |
| **Kalkan** | Gelen Hasar'ı 1'e 1 emer. Sahibinin bir sonraki tur başına kadar kalır. (Shield) |
| **Kalkan Yuvası** | Her yuva en fazla **2 Kalkan** tutar. Etkin Kalkan = 2 × (yuva − Kilitli yuva). En fazla 4 yuva, en az 1. (Shield Slot) |
| **Enerji Yuvası** | Her yuva tur başı **+1 Enerji** üretir. En fazla 4 yuva. (Energy Slot) |
| **Kilit** | Hedef yuvayı geçici devre dışı bırakır. (Stun/Lock) |
| **Yansıt** | Aldığın Saldırı kadar Hasar'ı (en fazla 3) engellenemez şekilde geri gönderir. (Reflect) |
| **Güçlendir** | Sonraki kartın sayılarını ×2 yapar. (Buff) |
| **Lanet** | Elde duran, oynanamayan ve Can kaybettiren kart. (Curse) |
| **Kalıcı** | Masada kalan, tekrar tekrar etki eden kart. (Permanent) |
| **Durum kartı** | Destedeki "Durum" grubu: Yuva, Kilit, Ayna Tüy, Durum Avı. |
| **Çöp** | Her oyuncunun açık atık yığını. Deste biterse Çöp karıştırılıp yeni deste olur. |
| **Enerji havuzu** | Harcanmayan Enerji kalır; üst sınır **8**. |

## 4. Tur Yapısı
Her tur 3 fazdan oluşur.

### 4.1 Çekme Fazı (Başlangıç)
1. **Kalkan sıfırlanır** (önceki turdan kalan Kalkan'ın silinir).
2. **Enerji kazan:** Enerji Yuvası sayısı kadar (Kilitli yuva sayılmaz). Varsayılan 2.
3. **Metalik Deri** masadaysa +1 Kalkan.
4. **Risk seçeneği (isteğe bağlı, tur başına 1):** kartlarını çekmeden önce söyle.
   - **Cesur:** bu tur +2 fazladan kart çek, −1 Enerji (Enerji kazancından düşer, 0'ın altına inmez).
   - **Kumar (yazı-tura):** *Yazı* → +1 kart ve +1 Enerji. *Tura* → −1 Enerji ve −1 Can.
5. **2 kart çek.**
6. **Gizli Alan:** önceki turlardan kalan kartın varsa bu turdan itibaren **Enerjisiz** oynayabilirsin (bkz. Taktikler).

### 4.2 Hamle Fazı
Sırayla, istediğin kadar yap:
- **Kart oyna:** maliyeti öde, etkiyi uygula, kart Çöp'e gider (Kalıcı kartlar masada kalır).
- **Çöp Atma (2→1):** elinden 2 kart at, 1 kart çek. Tur başına en fazla 2 kez. (Lanet bu atışta kullanılabilir.)
- **1 Taktik** (tur başına 1): Gizle · Takas · Gözcü.

### 4.3 Tur Sonu Fazı
1. Elinde **Lanet** varsa **1 Hasar** al.
2. El sınırı **7**: fazlasını Çöp'e at.
3. Güçlendir etkisi (kullanılmadıysa) biter. Yansıt, Kilit: kartında yazan süre kadar sürer.

## 5. Taktikler (kart değil, oyuncu aksiyonu)
| Taktik | Maliyet | Etki |
|---|---|---|
| **Gizle** | 0 | Elinden 1 kartı **kapalı** Gizli Alan'a koy (en fazla 1). Sonraki turlardan itibaren **bedava** oynayabilirsin. Takas bu alana dokunamaz. |
| **Takas** | 2 Enerji | Rakibin elinden **kapalı 1 kart seç**, bak. Ona kendi elinden 1 kartı ver (Lanet'i böyle devredersin). *Alternatif:* 3 Enerji ver, kartı rakip Çöp'e atsın. Rakibin eli boşsa kullanılamaz. |
| **Gözcü** | 1 Enerji | Destenin üstündeki 2 karta bak; istediklerini destenin altına koy. |

## 6. Kart Metni Standardı
Biçim: **[Maliyet] Anahtar kelime: değer.** Anahtar kelimeler hep büyük harfle: Hasar, Kalkan, Çek, Enerji, Yuva, Kilit, Yansıt, Güçlendir, Lanet, Kalıcı.

| Kart | Adet | Maliyet | Standart metin |
|---|---|---|---|
| Pençe | 8 | 1 E | Hasar 1. |
| Kanat Siperi | 8 | 1 E | Kalkan 1. |
| Atılış | 4 | 2 E | Hasar 1. Kalkan 1. |
| Tüy Duvarı | 4 | 2 E | Kalkan 2. |
| Gaga Darbesi | 4 | 2 E | Hasar 2. |
| Keşif Uçuşu | 4 | 1 E | Çek 2. |
| Tüneme | 4 | 0 E | Enerji +1. |
| Siper Kur | 2 | 2 E | Kalkan Yuvası +1. Kalıcı. |
| Siper Kır | 2 | 2 E | Rakip Kalkan Yuvası −1 (en az 1). |
| Kan Bedeli | 2 | 2 Can | Enerji Yuvası +1. Kalıcı. |
| Durum Avı | 2 | 1 E | Durum kartı çıkana dek aç, eline al, kalanı desteğin altına. |
| Ayna Tüy | 2 | 1 E | Yansıt: ilk Saldırı'nın Hasar'ı (maks. 3). Sonraki turuna dek. |
| Kilit: Siper | 1 | 1 E | Rakibin 1 Kalkan Yuvası bu tur Kilitli. |
| Kilit: Kaynak | 1 | 1 E | Rakibin 1 Enerji Yuvası sonraki turunda Kilitli. |
| Kara Tüy | 1 | — | Oynanamaz. Elindeyken Tur Sonu'nda Hasar 1 (kendine). |
| Hortlayan Hamle | 1 | 1 E | Çöp'ün üstündeki kartı (Lanet hariç) bedava oyna. |
| Cicikuş Çığlığı | 1 | 1 E | Güçlendir: sonraki Hasar/Kalkan/Çek/Enerji kartı ×2. |
| Metalik Deri | 1 | 3 E | Kalıcı. Her tur başı Kalkan 1. |

## 7. Netleştirmeler
- **Hasar sırası:** önce Kalkan, kalanı Can. Rakibin Can'ı 0'a inerse oyun hemen biter, Yansıt işlemez.
- **Yansıt** engellenemez; Kalkan'ı atlar. Yalnızca Saldırı kartı/Hasar veren etkilere tepki verir.
- **Güçlendir** yuva, Kilit ve Yansıt kartlarını etkilemez. Melez kartta (Atılış) iki sayı da ×2. Hortlayan Hamle ile oynanan kopya da Güçlendirilir.
- **Kilit: Siper** etkin Kalkan'ı 2 düşürür; fazla Kalkan o tur etkisizdir ama silinmez.
- **Enerji maliyeti Can olan kart** (Kan Bedeli) Can'ın maliyetten fazlaysa oynanabilir (0'a inemezsin).
- **Lanet**'i Çöp Atma ile (2→1) veya Takas ile elden çıkar. Çöp'e giren Lanet deste karışınca geri gelir.
- **Deste biterse** Çöp karıştırılıp yeni deste olur (Kalıcı kartlar hariç).

## 8. Zafer Şartları
1. **Rakibin Can'ını 0'a indir.**
2. **Gerilim (Sudden Death):** 7. turdan başlayarak her tur başında (1. oyuncunun Çekme Fazı'ndan önce) **iki oyuncu da (tur − 6) Can kaybeder**: 7. tur 1, 8. tur 2, 9. tur 3 …. Engellenemez.
3. Gerilim ile aynı anda 0'a inilirse **kalan Can fazla olan** kazanır; eşitse **2. oyuncu** kazanır.
4. İsteğe bağlı maç formatı: **3 el, 2 galibiyet.**

## 9. Etkileşim Özeti
Rakibi etkileyen araçlar: Kilit (iki tür), Siper Kır, Ayna Tüy, Takas (blind kart seç, Lanet devret), Gerilim baskısı. Amaç: sadece sıranı bekleme, her turda rakibin kararını etkile.
