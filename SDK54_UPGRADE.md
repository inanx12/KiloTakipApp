# SDK54_UPGRADE.md — KiloTakip Expo SDK 51 → 54

> Bu dosya **tek seferlik bir yükseltme görevinin** kaynağıdır. Amaç: Play Store için
> Android API 36 hedefine ulaşmak (SDK 54 bunu otomatik getirir). Görev bitince bu
> dosya arşivlenebilir; kalıcı kurallar CLAUDE.md'ye işlenecek.
>
> Doğrulama: aşağıdaki kırıcı değişiklikler Expo SDK 54 changelog + topluluk
> raporlarıyla (Eylül 2025 stable + sonrası) teyit edildi.

---

## ⛔ EN KRİTİK — BU GÖREVDE "BOZMAMA / SABİT SÜRÜM" KURALLARI ASKIDA

CLAUDE.md'deki "şu sürümlere DOKUNMA" kuralı **bu görev için bilinçli olarak iptal
edildi.** Aşağıdaki sürümler **DEĞİŞECEK** — bu beklenen, doğru davranıştır:

| Paket | Eski (sabit) | Yeni (hedef) |
|---|---|---|
| `expo` | 51.0.39 | `~54.0.x` |
| `react` / `react-dom` | 18 | `19.1.0` |
| `react-native` | 0.74.5 | `0.81.x` |
| `nativewind` | 4.1.23 | `^4.2.1` |
| `react-native-reanimated` | 3.10.1 | `~4.1.x` |
| `react-native-worklets` | (yok) | `0.5.x` — **yeni, zorunlu** |
| `react-native-safe-area-context` | mevcut | `~5.6.x` |

> Kesin sürümleri **`npx expo install`** belirler. Yukarıdakiler hedef; geri kalan her
> paket (`react-native-svg`, `datetimepicker`, `expo-document-picker`, `expo-updates`,
> `react-native-screens` …) `npx expo install --fix` ile SDK 54 uyumlu sürüme çekilir.
> `xlsx` (SheetJS) saf JS — dokunma, değişmez.

CLAUDE.md'deki **kod tuzakları HÂLÂ GEÇERLİ** (sürüm değil, kod kararı):
- `MorphingSilhouette` → SVG transform **STATİK** kalsın (dinamik string transform native'de çökertir).
- `gifted-charts` tek veri noktası → `curved`+`areaChart`+`animateOnDataChange` yalnızca ≥2 noktada.

---

## 1. Strateji kararı

- **Doğrudan 51 → 54** (kademeli 52→53→54 DEĞİL). Gerekçe: yükseltmenin zor kısmı
  (Yeni Mimari + reanimated 4 + edge-to-edge) tamamen SDK 54'e özel; kademeli bunu
  azaltmaz, sadece RN sürüm sıçramasını yayar. Uygulama küçük + managed akış.
- **Fallback:** doğrudan sıçrama lokalize edilemeyen bir hata verirse → branch atılır,
  kademeli (51→52→53→54) ile hangi adımın kırdığı izole edilir.
- **Tüm iş `sdk54-upgrade` branch'inde.** `main` (çalışan SDK 51) el değmeden durur.

---

## 2. Kırıcı değişiklik + tuzak envanteri (kök neden → ne yapılacak)

### 2.1 Yeni Mimari (New Architecture) — artık kaçış yok
- Reanimated v4 **yalnızca Yeni Mimari'de** çalışır. Reanimated 4'e geçmek = Yeni Mimari'ye geçmek.
- SDK 54, eski mimariyi destekleyen **son** sürüm; SDK 55 zaten zorunlu kılacak → şimdi geçmek doğru.
- İyi haber: tüm `expo-*` paketleri + `react-native-svg` Yeni Mimari'yi destekliyor.
- **Yapılacak:** `app.json` → `"newArchEnabled": true`.

### 2.2 nativewind ↔ reanimated düğümü — ÇÖZÜLDÜ
- Eski uyarı ("nativewind kullanıyorsan reanimated 3'te kal") **artık geçersiz.**
- `nativewind` **4.2.0+** reanimated 4 uyumluluğu için yama içeriyor.
- Çalışan kombinasyon: `nativewind ^4.2.1` + `reanimated ~4.1.x` + `react-native-worklets 0.5.x` + `safe-area-context ~5.6.x`.

### 2.3 babel + config tuzakları (en sık çökme sebebi)
- **`babel.config.js`:** worklets plugin'i reanimated/plugin'in İÇİNDE gömülü. **İkisini birlikte ekleme** → "Duplicate plugin" hatası. Bilinen-iyi hali:
  ```js
  module.exports = function (api) {
    api.cache(true);
    return {
      presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
      plugins: ['react-native-reanimated/plugin'], // react-native-worklets/plugin EKLEME
    };
  };
  ```
  (Güncel nativewind+SDK54 dokümanına karşı doğrula — bu nokta sürümle ufak değişebilir.)
- **`postcss.config.js`:** NativeWind v4 + Expo'da **gerekmez** → varsa kaldır.
- **`react-native-worklets` peer:** gömülü olsa da Expo'nun katı kontrolü yüzünden `package.json`'da **açıkça** bulunmalı → `npx expo install react-native-worklets`.
- **Sürüm eşleşmesi:** worklets JS/native sürümü SDK'nın gönderdiğiyle **birebir** olmalı (Expo Go önderlenmiş kütüphane kullanır). Daima `npx expo install`, asla düz `npm install`.

### 2.4 Edge-to-edge — Android'de ZORUNLU (asıl Play Store/API 36 sebebi)
SDK 54'te hem yeni hem mevcut projeler için zorunlu. İçerik sistem çubuklarının altına akar.
- **StatusBar:** yerleşik `StatusBar` / `expo-status-bar` / `expo-navigation-bar` edge-to-edge'de deprecated API kullanıyor → `_layout.tsx`'teki StatusBar'ı `react-native-edge-to-edge`'in **`SystemBars`** bileşeniyle değiştir.
- **Safe-area:** içerik çubuk altına girmesin → `react-native-safe-area-context` inset'leri (expo-router üzerinden zaten var).
- **Klavye:** edge-to-edge `adjustResize`'ı bozar → **kilo giriş input'unun (Dashboard) ve boy/hedef input'larının (Profil) klavyeyle örtülmediğini Android'de test et.** Gerekirse `KeyboardAvoidingView`.
- **`app.json`:** `statusBar` özelliği şemadan kalktı (`expo-doctor` yakalar) → varsa kaldır/uyarla.

### 2.5 expo-file-system değişti (CSV export'u kırar)
- SDK 54'te **yeni** expo-file-system API'si varsayılan oldu; eski API `expo-file-system/legacy`'ye taşındı.
- CSV dışa/içe aktarma kodun eski API'yi kullanıyor.
- **Hızlı yol:** import'u `import * as FileSystem from 'expo-file-system/legacy'` yap.
- (Alternatif: yeni API'ye taşı — daha fazla iş, V2'ye bırakılabilir.)

### 2.6 Android native — managed olduğun için OTOMATİK
- SDK 54, compileSdk/targetSdk'yı **36**'ya, buildTools'u 36'ya, Kotlin'i 2.1.x'e çeker → **API 36 hedefi buradan geliyor.**
- **Sen managed/prebuild akıştasın (repoda android/ios klasörü yok).** EAS build sırasında prebuild bunu üretir → `MainApplication.kt` vb. **elle düzenleme gerekmez.** (Bare-proje blog rehberlerindeki native düzenlemeler seni ilgilendirmez.)

### 2.7 Seni İLGİLENDİRMEYENLER (zaman kaybetme)
- **expo-av kaldırması:** bağımlılığında expo-av YOK → konu dışı.
- **React 19 tip değişiklikleri:** `tsc --noEmit`'te ufak tip hataları çıkabilir (küçük uygulama, az yer).

---

## 3. Adım sırası + her adımda test geçidi

Her adımdan sonra **§4'teki test geçitlerini sırayla** çalıştır. Biri kırmızıysa
**sonraki adıma geçme**, önce düzelt. Yeşilse → commit (§5).

- **Adım 0** — Güvence: `git tag sdk51-working` + lockfile commit + branch (`sdk54-upgrade`). Detay: §5/§6.
- **Adım 1** — Çekirdek SDK bump: `expo` / `react` / `react-dom` / `react-native` / `babel-preset-expo`, sonra `npx expo install --fix`. → 4 geçit.
- **Adım 2** — Yeni Mimari + reanimated 3→4 + worklets + nativewind 4.2. babel/postcss tuzaklarını (§2.3) çöz, `app.json` `newArchEnabled: true`. → 4 geçit (özellikle web export + Expo Go).
- **Adım 3** — Edge-to-edge (§2.4): StatusBar→SystemBars, safe-area inset, klavye/input testi. → Expo Go'da Android görsel + klavye.
- **Adım 4** — expo-file-system (§2.5): import `/legacy`. → Expo Go'da CSV+XLSX export/import round-trip (document-picker Expo Go'da gömülü).
- **Adım 5** — `eas build -p android --profile preview` → APK'yı cihaza kur → **tüm akış testi** (kayıt ekle/sil/düzenle, grafik, rütbe rozeti, tarih seçici, CSV/XLSX dışa-içe, çift tema, klavye). Sonra web: `npx expo export -p web` → `eas deploy`.
- **Adım 6** — CLAUDE.md + GUNCELLEME.md'deki sabit sürümleri ve "bozmama kuralları"nı **yeni SDK 54 gerçeğine göre güncelle.**

---

## 4. Test geçitleri (bu sırayla)

```bash
npx tsc --noEmit        # 1) tip hataları (React 19 değişiklikleri burada)
npx expo-doctor         # 2) app.json şeması + peer-dependency uyumu (statusBar/worklets)
npx expo export -p web  # 3) EN ZOR HEDEF: babel/nativewind/bundle kırılması ilk burada
npx expo start          # 4) Expo Go ile runtime (SDK 54 = Yeni Mimari; reanimated/grafik/silüet çökmesi burada)
```

> Not: SDK 54 Expo Go zaten Yeni Mimari çalıştırır → Expo Go testi Yeni Mimari yolunu
> da sınar. `expo-document-picker` Expo Go'da gömülü olduğundan import özelliği orada
> test edilebilir; **standalone APK'da görmek için yeniden build** gerekir (Adım 5).

---

## 5. Git — checkpoint & kurtarma (özet; ayrıntılı anlatım sohbet geçmişinde)

**Başlamadan (Adım 0):**
```bash
git status                                  # "On branch main" + "clean" olmalı
git add -A && git commit -m "SDK 51 calisan durum + lockfile"   # (gerekiyorsa)
git tag sdk51-working
git push origin main && git push origin sdk51-working
git checkout -b sdk54-upgrade               # dalı oluştur + içine geç
git push -u origin sdk54-upgrade
```

**Her yeşil checkpoint'te:**
```bash
git add -A && git commit -m "adim N: <ne yapildi> - testler gecti"
git push
```

**Bozulursa geri dön:**
```bash
git restore .            # kaydedilmemiş değişiklikleri sil, son commit'e dön
git reset --hard HEAD~1  # son commit'i at, bir öncekine dön (kaydedilmemişi de siler)
git checkout main        # upgrade'den vazgeç → çalışan SDK 51'e dön
```
> ⚠️ `git checkout main`'den SONRA `node_modules` hâlâ SDK 54 paketleri içerir →
> **`npm install`** ile SDK 51 bağımlılıklarını geri kur. Takılırsa: `node_modules`
> sil + `npm install`, sonra `npx expo start -c` (temiz başlat).

**Tam doğrulanınca (Adım 5 PASS):**
```bash
git checkout main
git merge sdk54-upgrade
git push origin main
```

> **Binary güvencesi:** Telefondaki kurulu APK ve Expo'nun verdiği `.apk` dosyası
> koddan bağımsızdır → git'te ne yaparsan yap çalışır. O dosyayı silme.

---

## 6. Claude Code'a verilecek prompt (görev başında yapıştır)

```
Bağlam: KiloTakip, managed Expo, şu an SDK 51. Hedef: SDK 54 (Play Store API 36).
Bu repodaki SDK54_UPGRADE.md ve CLAUDE.md'yi oku.

ÖNEMLİ: Bu görev için CLAUDE.md'deki "sabit sürüm / bozmama" kuralları BİLİNÇLİ
OLARAK ASKIYA ALINDI. expo, react-native, nativewind, reanimated sürümleri
DEĞİŞECEK (bkz. SDK54_UPGRADE.md §"EN KRİTİK"). Bu beklenen davranıştır; tereddüt etme.

Kurallar:
1. `sdk54-upgrade` branch'inde çalış; `main`'e DOKUNMA. (tag sdk51-working + lockfile
   commit + branch zaten atıldı varsay; atılmamışsa önce beni uyar.)
2. Hedef mimari: YENİ MİMARİ + reanimated 4 + nativewind 4.2 + worklets. Legacy'de kalma.
3. Native paket = HER ZAMAN `npx expo install`, asla düz `npm install`.
4. Adımları (SDK54_UPGRADE.md §3) TEKER TEKER yap. Her adımdan sonra DUR; çalıştıracağım
   test komutlarını ver (§4: tsc --noEmit → expo-doctor → expo export -p web → expo start),
   sonucu bildirmemi BEKLE. Ben "geçti" demeden sonraki adıma geçme.
5. Bilinen tuzakları (§2) proaktif çöz ve neyi neden değiştirdiğini söyle:
   (a) babel'de worklets/plugin + reanimated/plugin'i BİRLİKTE ekleme,
   (b) gereksizse postcss.config.js'i kaldır,
   (c) react-native-worklets'i package.json'a açıkça ekle,
   (d) edge-to-edge: StatusBar→SystemBars + safe-area insets + klavye/input kontrolü,
   (e) expo-file-system import'unu `/legacy`'ye al,
   (f) app.json'da statusBar özelliğini ve newArchEnabled'ı düzenle.
6. KOD TUZAKLARINI BOZMA: MorphingSilhouette statik transform; gifted-charts tek-nokta koruması.
7. En sonda CLAUDE.md + GUNCELLEME.md'deki sabit sürümleri/kuralları SDK 54'e göre güncelle.
8. Önce adım planını özetle (hangi adım, ne değişecek, hangi testle doğrulanacak),
   onayımı al, SONRA Adım 1'e başla.
```

---

## 7. Bitti tanımı (Definition of Done)

- [ ] `tsc --noEmit`, `expo-doctor`, `expo export -p web`, Expo Go → hepsi yeşil
- [ ] APK cihazda kuruldu; kayıt/grafik/rütbe/tarih/CSV-XLSX/tema/klavye akışları çalışıyor
- [ ] Web `eas deploy` ile yeni sürüm canlıda
- [ ] `sdk54-upgrade` → `main` merge edildi
- [ ] CLAUDE.md + GUNCELLEME.md yeni SDK 54 sürümleriyle güncellendi
- [ ] (Sonraki tur) AAB build + `eas submit` → Play Store
