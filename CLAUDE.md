# CLAUDE.md — KiloTakip

> Claude Code bunu her oturumda otomatik okur. Kısa tutuldu; detaylı geçmiş için
> alttaki "Daha fazla bağlam" dosyalarına bak.

## Proje nedir
Kilo takip uygulaması. **Expo SDK 54 (Yeni Mimari / New Architecture)** + expo-router +
**NativeWind** + **TypeScript**. Hem web hem Android (EAS ile APK). Android hedefi **API 36**.
**Veri lokalde (AsyncStorage), backend YOK.**
- Canlı web: https://kilotakip.expo.app
- Repo: `inanx12/KiloTakipApp`
- Yerel yol: `C:\Users\inane\Desktop\KiloTakip`

---

## ⛔ BOZMAMA KURALLARI (en kritik bölüm — her zaman uy)

> SDK 51→54 yükseltmesi **TAMAMLANDI** (Haziran 2026). Aşağıdaki kombinasyon
> çalışıyor + doğrulandı (web export + standalone APK + Yeni Mimari). Bunu rastgele
> oynatma. Geçmiş referans/karar geçmişi: arşivlenen `SDK54_UPGRADE.md`.

- **Yeni Mimari AÇIK** (`app.json` → `newArchEnabled: true`). Kapatma. reanimated 4 yalnızca
  Yeni Mimari'de çalışır.
- **Çalışan sürüm kombinasyonu (rastgele bump etme):** `expo ~54` · `react/react-dom 19.1` ·
  `react-native 0.81.x` · `nativewind ^4.2.x` · `react-native-reanimated ~4.1` ·
  `react-native-worklets 0.5.x` · `react-native-safe-area-context ~5.6` ·
  `react-native-edge-to-edge ~1.8`. nativewind 4.2 + reanimated 4 + worklets birlikte uyumlu.
- **`react-native-worklets` package.json'da AÇIKÇA bulunmalı** (gömülü olsa da Expo'nun katı
  kontrolü ister). `npx expo install react-native-worklets`.
- **`babel.config.js`'e reanimated/worklets plugin'i ELLE EKLEME.** `babel-preset-expo@54`
  worklets kuruluyken `react-native-worklets/plugin`'i **otomatik enjekte ediyor**; elle
  eklersen "duplicate plugin" hatası. babel.config.js sadece preset'leri içerir.
- **`.npmrc` → `legacy-peer-deps=true` KALMALI.** React 19 / RN 0.81 geçişinde topluluk
  paketleri peer çakışması (ERESOLVE) veriyor; EAS build de bu ayara güvenir.
- **`babel-preset-expo` kökte (açık devDependency/dependency) kalmalı** — yoksa `expo/node_modules`
  altına gömülüp "Cannot find module 'babel-preset-expo'" verir.
- **`expo-file-system` import'u `expo-file-system/legacy`'den** (yeni API varsayılan oldu;
  `documentDirectory`/`EncodingType`/`writeAsStringAsync` legacy'de). Runtime'da zararsız
  "deprecated" uyarısı verebilir.
- **`postcss.config.js` YOK** (NativeWind v4 + metro'da gereksiz; bilinçle silindi — geri ekleme).
- **Yeni native paket: `npx expo install <paket>`** kullan — düz `npm install` DEĞİL
  (SDK 54 uyumlu sürümü + sürüm eşleşmesini seçer). `expo install --fix` artık güvenli/kullanılır.
- **`@shopify/react-native-skia` ve `victory-native` KALDIRILDI** — geri ekleme.
- Çalışan **web build'ini bozma**; değişiklik sonrası `npx expo export -p web` ile doğrula.

### Kod tuzakları (daha önce native çökmeye yol açtı — tekrarlama)
- **`MorphingSilhouette`:** reanimated `useAnimatedProps` ile SVG'ye **dinamik string
  transform YAZMA** → react-native-svg native'de çöküyor. Transform **statik** kalsın.
- **`gifted-charts` tek veri noktası:** `curved` + `areaChart` + `animateOnDataChange`
  tek noktada çöküyor → bunlar yalnızca **≥2 noktada** aktif; `animateOnDataChange` kullanma.
- **`SuccessTick` kapatma:** reanimated animasyon tamamlanma callback'ine GÜVENME (reanimated 4 /
  Yeni Mimari'de güvenilir tetiklenmiyor → tik ekranda takılıyordu). Kapatma **JS `setTimeout`** ile.
- **`expo-document-picker` native:** import özelliklerinin standalone APK'da görünmesi
  için **rebuild** gerekir (Expo Go'da zaten gömülü, reload yeter).

---

## Komutlar

| Durum | Komut |
|---|---|
| Web'i güncelle (canlı) | `npx expo export -p web` → `eas deploy --prod` |
| Mobil — sadece JS/kod değişti | `eas update` |
| Mobil — native paket eklendi / SDK değişti | `eas build -p android --profile preview` |
| Yeni native paket kur | `npx expo install <paket>` |
| Giriş kontrolü | `eas whoami` |

---

## Mimari / dosya haritası

```
KiloTakip/
├─ app/
│  ├─ _layout.tsx              # kök: ThemeProvider, global.css, SystemBars (edge-to-edge)
│  └─ (tabs)/
│     ├─ _layout.tsx           # alt 3 sekme (Dashboard/Durum/Profil) + tab bar insets.bottom
│     ├─ index.tsx             # Dashboard (+ kompakt rütbe rozeti → Durum)
│     ├─ profile.tsx           # Profil/Ayarlar + yedekleme (CSV/XLSX; expo-file-system/legacy)
│     └─ status.tsx            # Rütbe/Durum sekmesi (rozet, XP/RP, momentum, görev, seri)
├─ components/
│  ├─ AnimatedChart.tsx        # gifted-charts (tek-nokta koruması)
│  ├─ MorphingSilhouette.tsx   # VKİ silüeti (SVG, STATİK transform, tek düz renk)
│  └─ ui/                      # Card · Button · Input · SuccessTick(setTimeout kapatma)
│                              #   · DateField (.tsx native picker / .web.tsx input[type=date])
├─ utils/
│  ├─ storage.ts               # AsyncStorage + importBackup + RankState kalıcılığı
│  ├─ helpers.ts               # VKİ/ETA/7g ort/streak + CSV/XLSX + RÜTBE saf fonksiyonları
│  │                           #   (computeRank, applyRankProgress, migrate, momentum, görev)
│  └─ ThemeContext.tsx         # sistem/açık/koyu tema
├─ constants/
│  ├─ rankConfig.ts            # rütbe ekonomisi/tablosu/eşikleri (TEK ayar dosyası)
│  └─ rankColors.ts            # rütbe → vurgu rengi
├─ app.json                    # newArchEnabled:true · web static · edge-to-edge + datetimepicker plugin
├─ eas.json                    # development/preview/production + channel (preview = apk/internal)
├─ .npmrc                      # legacy-peer-deps=true (React19/RN0.81 peer çakışması için)
└─ tailwind.config.js, global.css, babel/metro config (postcss YOK)
```

---

## Kütüphaneler (gerçekte kullanılan — SDK 54)

**Çekirdek (çalışan kombinasyon):** `expo ~54` · `react/react-dom 19.1.0` ·
`react-native 0.81.x` · `nativewind 4.2.x` · `react-native-reanimated 4.1.x` ·
`react-native-worklets 0.5.x` · `react-native-safe-area-context ~5.6` ·
`react-native-edge-to-edge ~1.8` (SystemBars). **Yeni Mimari açık.**

**Aktif:**
- Grafik: `react-native-gifted-charts` + `react-native-svg` (Skia/victory YOK)
- Tarih seçici: `@react-native-community/datetimepicker`@8.4.4 (native, config plugin)
- Dosya seçici (import): `expo-document-picker`@~14 (native)
- Excel okuma: `xlsx`@0.18.5 (SheetJS, **saf JS**, statik import; xlsx→CSV)
- Export/paylaşım: `expo-file-system` (**`/legacy` import**), `expo-sharing`
- OTA/Hosting: `expo-updates` + EAS Hosting (`output: static`)
- Diğer: AsyncStorage, `dayjs` (**Türkçe locale** + `dayOfYear` plugin), `lucide-react-native`, `expo-router`

> Kesin sürümler için `package.json`. Bump gerektiğinde **`npx expo install`** kullan.
> Not: `xlsx`@0.18.5 npm audit uyarısı veriyor (prototype pollution/ReDoS). Yalnızca
> kullanıcının kendi yedek dosyaları okunduğu için pratik risk düşük; istenirse SheetJS
> CDN 0.20.x'e yükseltilebilir.

---

## Konvansiyonlar

- **Mantık `helpers.ts`'te, saf/test edilebilir fonksiyonlar** olarak yazılır.
- **Yeni ayarlanabilir sabitler tek config dosyasında** (`constants/rankConfig.ts`) —
  sayıyı fonksiyon içine GÖMME (sonradan kolay kalibrasyon için).
- **VKİ renkleri tek kaynaktan** (`getBMICategory`); silüet + bar + rozet tutarlı.
  Obez kategorisi yumuşak mercan `#FF8A5B`.
- Vurgu renkleri: `#00F0FF` (neon cyan) + `#BF55EC` (mor) + neon açık yeşil — 3'ü kullanılabilir.
- Tema tercihi AsyncStorage'da; dark + light ikisi de desteklenir.
- **Push politikası: her commit push edilir.**

---

## Veri / kalıcılık (dikkat)

- **Web verisi ile telefon verisi AYRIDIR** — ikisi de lokalde, senkron değil.
- Yedek mekanizması: **CSV/XLSX dışa-içe aktar** (yedek CSV'si boy/hedef profilini de içerir).
  Uygulama silinince veri gider.

---

## Şu anki odak

- **Bitti:** Rütbe (Solo Leveling) sistemi V1 (`status.tsx` + Dashboard rozeti, saf JS/TS),
  VKİ renk fix, seri rozeti / "Gün X 🔥", tarih seçici, CSV+XLSX dışa-içe aktarma.
- **Bitti:** **SDK 51→54 yükseltme** (Yeni Mimari + reanimated 4 + nativewind 4.2 + edge-to-edge,
  Android API 36). APK + web (kilotakip.expo.app) doğrulandı.
- **Sonra (ayrı, planlı turlar):** havalı UI pası (rütbe görseli) → Play Store (AAB +
  `eas submit`, API 36 artık hazır).

---

## Daha fazla bağlam

- **`HANDOFF.md`** — mimari, çalışan/çalışmayan özellikler, geçmiş kararlar/sapmalar.
- **`GUNCELLEME.md`** (lokalde `.pdf`, repoda yok) — güncelleme/yayınlama prosedürü + Play Store.
- **`SDK54_UPGRADE.md`** — SDK 51→54 yükseltme kaynağı/kararları (görev bitti, arşiv referansı;
  not: babel plugin'i artık otomatik enjekte ediliyor, doc §2.3'ün aksine elle eklenmez).
- **`RUTBE_SISTEMI_V1.md`** — rütbe sistemi uygulanabilir spec (sayılar, formüller, tablolar).
- **`RUTBE_SISTEMI.md`** — rütbe sistemi tasarım gerekçeleri (neden böyle kurgulandı).
