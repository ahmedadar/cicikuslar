# Tasarım Analizi ve Denge Raporu (v0.1)

## 1. Deste ve Enerji Eğrisi
| Maliyet | Adet | İçerik |
|---|---|---|
| 0 | 6 | Tüneme ×4, Kan Bedeli ×2 (2 Can) |
| 1 | 28 | Pençe 8, Kanat Siperi 8, Keşif 4, Durum Avı 2, Ayna 2, Kilit 2, Hortlayan 1, Çığlık 1 |
| 2 | 16 | Atılış 4, Tüy Duvarı 4, Gaga 4, Siper Kur 2, Siper Kır 2 |
| 3 | 1 | Metalik Deri |
| Oynanamaz | 1 | Lanet |

- Ortalama maliyet (oynanabilir 50 kart): **1,26 Enerji.** Tur geliri 2 (+ Tüneme). Beklenen: tur başına ~1,5–2,5 kart oynanır; simülasyonda **2,4** kart/tur.
- Eğri düşük ve akıcı: elin kilitlenme riski az. 3 Enerjilik tek kart olduğu için "geç oyun" hissi eksik.
- 2 Enerjilik kartlar iki adet 1 Enerjilik karttan **daha güçlü değil** (örn. Gaga = 2×Pençe). Tek avantajı el yerinden tasarruf. İstersen: Gaga Darbesi'ne "Kalkan varsa +1" gibi bonus ekle.
- Saldırı değeri destede 20, Kalkan 20. **1 Enerji = 1 Hasar = 1 Kalkan** olduğu için savunma saldırıyı tam siler.

## 2. Simülasyon Bulguları (`tools/sim.py`, 6000 maç, basit bot)
| Senaryo | 1. oy. kazanır | 2. oy. kazanır | Beraberlik/tıkanma | Ort. tur |
|---|---|---|---|---|
| A) Ham kurallar | %38 | %24 | **%39** | 26 |
| B) + Gerilim (7. tur) | %58 | %42 | %0 | 10,1 |
| **C) B + 2. oyuncu +1 Enerji (önerilen)** | **%54** | **%46** | %0 | **10,1** |
| D) C + 20 yerine 15 Can | %53 | %47 | %0 | 9,2 |

**Ana bulgu:** Verilen sayılarla (20 Can, 2 Enerji/tur, 1 Enerji = 1 Hasar = 1 Kalkan) oyun **tıkanır.** Savunma saldırıyı eşit karşılar, Kalkan kapasite sınırı (yuvalar) tek başına yetmez. Ham kurallarda maçların %39'u 30 turda bitmedi. Saldırıya tamamen odaklanan bot bile ~15 turda bitirebiliyor, yani saldırı yoğunluğu düşük.

**Çözümler:**
1. **Gerilim** kuralı (7. turdan itibaren artan Can kaybı): tıkanmayı bitirir, maçlar ~10 tura iner.
2. **2. oyuncuya +1 Enerji**: ilk oyuncu avantajını %58–42'den %54–46'ya düşürdü.
3. Kalkan sadece sahibinin sonraki tur başına kadar sürer (bir tur tutar).
4. Alternatifler: Can 15, ya da Saldırı kartlarını güçlendir (ör. Pençe 1, Gaga 3). Bu seçenekleri simüle ettik; Can 15 maçı 9 tura çeker.

**Sınırlar:** Bot basit (açgözlü, kart kombosu planlamaz). Taktikler (Gizle, Takas, Gözcü, Risk) simüle edilmedi. Sonuçlar yön gösterir, gerçek denge için insan testi gerekir. Yani Gerilim'in gerçek oyuncularda maçı belirleyip belirlemediğini gözlemlemeliyiz.

## 3. Kural Değişiklikleri ve Gerekçesi
| Orijinal fikir | Değişiklik |
|---|---|
| "2 kart at, 1 çek istediğin an" | Yalnızca kendi Hamle Fazı'nda, tur başına en çok 2 kez. Kart avantajını kontrol eder, ve anlık-tepki karmaşasını önler. |
| "Kalkan Yuvası / Enerji Yuvası" | Yuva = kalıcı kaynak. Enerji Yuvası +1 Enerji/tur, Kalkan Yuvası 2 Kalkan kapasitesi. Hepsi Kilit/Kır ile hedeflenebilir. |
| Lanet "yük oluşturur" | El sınırında yer kaplar + her tur sonu 1 Hasar. Takas ile rakibe devredilir, bu yüzden tek kopya bile oyun yaratır. |
| Enerji Yuvası 2 Can | Sayısız Enerji kazancı Can pahasına, Gerilim ile dengelenir. |
| Zaman ayarlı saklama | **Gizle** taktiği: kapalı kart, sonra bedava. |
| Kart takası & çalma | **Takas**: kör seçim + değiş tokuş (2 E) veya zorla attırma (3 E). |
| Risk & ödül | **Cesur** (+2 kart −1 Enerji) ve **Kumar** (yazı-tura). |
| Deste yönetimi | **Gözcü** (1 Enerji). |

## 4. Açık Kararlar (sana kalan)
1. **Ayna deste mi, ortak deste mi?** Şu an her oyuncunun kendi 52 kartı var (mobil için daha basit, Takas ve Çöp mantığı net).
2. **Gerilim şiddeti** (7. tur, artan) ve **Can 20 vs 15**.
3. **Takas / Gizle / Gözcü / Risk** değerleri test edilmedi.
4. **Hortlayan Hamle** için verdiğin maliyet yoktu (1 Enerji varsaydım). **Cicikuş Çığlığı** 1, **Metalik Deri** 3 Enerji varsaydım.
5. Tema/isimler geçici. Kart adlarını sen değiştirebilirsin.

## 5. Mobil Yolu (öneri)
1. Kural kitapçığı ve `data/cards.json` ile **kağıt/Tabletop Simulator testi** (en az 20 maç).
2. `tools/sim.py` ile denge: kart başına kazanma oranı, bot geliştirme.
3. **Motor:** 2D kart oyunu için **Godot** (hafif, GDScript, JSON okur) veya **Unity** (ekosistem, reklam/IAP SDK). Oyun mantığını UI'dan ayrı bir "kural çekirdeği" olarak yaz. Kart verisi JSON'dan gelsin.
4. Önce tek oyunculu (bot rakip), ardından çevrimiçi PvP.
