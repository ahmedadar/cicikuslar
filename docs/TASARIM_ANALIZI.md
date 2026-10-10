# Tasarım Analizi ve Denge Raporu (v0.1)

## 1. Deste ve Enerji Eğrisi
| Maliyet | Adet | İçerik |
|---|---|---|
| 0 | 6 | Tüneme ×4, Kan Bedeli ×2 (2 Can) |
| 1 | 28 | Pençe 8, Kanat Siperi 8, Keşif 4, Durum Avı 2, Ayna 2, Kilit 2, Hortlayan 1, Çığlık 1 |
| 2 | 16 | Atılış 4, Tüy Duvarı 4, Gaga 4, Siper Kur 2, Siper Kır 2 |
| 3 | 1 | Metalik Deri |
| Oynanamaz | 1 | Lanet |

- Eğri 2 kopya için de aynıdır (oranlar değişmez). Ortalama maliyet (oynanabilir 50 kart): **1,26 Enerji.** Tur geliri 2 (+ Tüneme). Beklenen: tur başına ~1,5–2,5 kart oynanır; simülasyonda **2,4** kart/tur.
- Eğri düşük ve akıcı: elin kilitlenme riski az. 3 Enerjilik tek kart olduğu için "geç oyun" hissi eksik.
- 2 Enerjilik kartlar iki adet 1 Enerjilik karttan **daha güçlü değil** (örn. Gaga = 2×Pençe). Tek avantajı el yerinden tasarruf. İstersen: Gaga Darbesi'ne "Kalkan varsa +1" gibi bonus ekle.
- Saldırı değeri destede 20, Kalkan 20. **1 Enerji = 1 Hasar = 1 Kalkan** olduğu için savunma saldırıyı tam siler.

## 2. Süre ve Simülasyon (ortak 104 kartlık deste; `tools/sim.py`, 5000 maç, basit bot)

**Cevap: Önerilen kurallarla bir maç masada ~17 dk (aralık 15–19), mobilde ~7 dk sürüyor.** Gerilim kuralı olmazsa maç ~42 dk sürüyor ve çoğu zaman bitmiyor.

Süre varsayımları (tahmin, oyun testinde doğrulanmalı): masada kurulum 1 dk + tur başı 20 sn + oynanan kart/aksiyon başına 12 sn; mobilde tur başı 8 sn + aksiyon başı 6 sn. Bot ortalama turda 2,4 kart oynuyor.

| Senaryo | 1. oy. | 2. oy. | Tıkanma | Ort. tur | Masa dk | Mobil dk |
|---|---|---|---|---|---|---|
| A) Ham kurallar | %43 | %32 | **%24** | 24,4 | **42** | 19 |
| B) + Gerilim (7. tur) | %57 | %43 | %0 | 10,1 | 17,5 | 7,6 |
| **C) B + 2. oyuncu +1 Enerji (önerilen)** | **%52** | **%48** | %0 | **10,1** | **17,6** | **7,6** |
| D) C, Gerilim 6. turdan | %52 | %48 | %0 | 9,2 | 16,3 | 7,0 |
| E) C, Can 15 | %51 | %49 | %0 | 9,2 | 16,0 | 6,9 |
| F) C, Can 15, Gerilim 6. tur | %53 | %47 | %0 | 8,3 | 14,7 | 6,3 |
| G) Kişisel 52+52 deste (eski plan), C | %53 | %47 | %0 | 10,1 | 17,8 | 7,7 |

**Karar için kullanabileceğin sonuçlar:**
1. **Ortak desteye geçmek tempoyu ve dengeyi bozmuyor** (C ile G neredeyse aynı). Ortak deste etkileşimi artırır: rakibin attığı kartı Hortlayan Hamle ile kullanabilirsin, Gözcü ve Durum Avı ortak desteyi etkiler.
2. **Süreyi belirleyen kural Gerilim:** onsuz oyun tıkanıyor (savunma 1 Enerji = 1 Kalkan ile saldırıyı eşit karşılıyor). Hedefin 10–12 dk ise ya Can 15 ya Gerilim 6. tur (F) ya da ikisi birden.
3. **Dikkat:** Bot maçlarının çoğu Gerilim ile ~9.–11. turda bitiyor, yani şu an kazananı çoğunlukla "Gerilim anında kimin Can'ı fazla" belirliyor. İnsanlar daha saldırgan oynarsa maç kısalır. Bu varsayımı oyun testinde mutlaka doğrulayalım.
4. 104 kartta deste maçta bitmiyor (tur başı ~5 kart tüketilir, ~50 kart), yani karıştırma kuralı neredeyse hiç devreye girmez.

**Sınırlar:** Bot açgözlü ve kart kombosu planlamıyor. Taktikler (Gizle, Takas, Gözcü, Risk) simüle edilmedi. Süre değerleri tahmin. Gerçek denge için insan testi şart.

## 3. Kural Değişiklikleri ve Gerekçesi
| Orijinal fikir | Değişiklik |
|---|---|
| "2 kart at, 1 çek istediğin an" | Yalnızca kendi Hamle Fazı'nda, tur başına en çok 2 kez. Kart avantajını kontrol eder, ve anlık-tepki karmaşasını önler. |
| "Kalkan Yuvası / Enerji Yuvası" | Yuva = kalıcı kaynak. Enerji Yuvası +1 Enerji/tur, Kalkan Yuvası 2 Kalkan kapasitesi. Hepsi Kilit/Kır ile hedeflenebilir. |
| Lanet "yük oluşturur" | El sınırında yer kaplar + her tur sonu 1 Hasar. Takas ile rakibe devredilir, bu yüzden tek kopya bile oyun yaratır. |
| Enerji Yuvası 2 Can | Sayısız Enerji kazancı Can pahasına, Gerilim ile dengelenir. |
| Deste yapısı | 2 × 52 = 104 kartlık **ortak** Çekme Destesi ve ortak Çöp. |
| Zaman ayarlı saklama | **Gizle** taktiği: kapalı kart, sonra bedava. |
| Kart takası & çalma | **Takas**: kör seçim + değiş tokuş (2 E) veya zorla attırma (3 E). |
| Risk & ödül | **Cesur** (+2 kart −1 Enerji) ve **Kumar** (yazı-tura). |
| Deste yönetimi | **Gözcü** (1 Enerji). |

## 4. Açık Kararlar (sana kalan)
1. ~~Ortak/ayna deste~~ → **karar verildi: ortak 104 kartlık deste ve ortak Çöp.**
2. **Hedef maç süresi:** masada ~17 dk (önerilen C) mi, ~15 dk (F) mi? Gerilim turu ve Can 20/15 buna göre seçilecek.
3. **Takas / Gizle / Gözcü / Risk** değerleri test edilmedi.
4. **Hortlayan Hamle** için verdiğin maliyet yoktu (1 Enerji varsaydım). **Cicikuş Çığlığı** 1, **Metalik Deri** 3 Enerji varsaydım.
5. Tema/isimler geçici. Kart adlarını sen değiştirebilirsin.

## 5. Mobil Yolu (öneri)
1. Kural kitapçığı ve `data/cards.json` ile **kağıt/Tabletop Simulator testi** (en az 20 maç).
2. `tools/sim.py` ile denge: kart başına kazanma oranı, bot geliştirme.
3. **Motor:** 2D kart oyunu için **Godot** (hafif, GDScript, JSON okur) veya **Unity** (ekosistem, reklam/IAP SDK). Oyun mantığını UI'dan ayrı bir "kural çekirdeği" olarak yaz. Kart verisi JSON'dan gelsin.
4. Önce tek oyunculu (bot rakip), ardından çevrimiçi PvP.
