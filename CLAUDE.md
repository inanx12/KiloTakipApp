# CLAUDE.md — KiloTakip

> Claude Code bunu her oturumda otomatik okur. Kısa tutuldu; detaylı geçmiş için
> alttaki "Daha fazla bağlam" dosyalarına bak.

## Proje nedir
Kilo takip uygulaması. **Expo SDK 51** + expo-router + **NativeWind** + **TypeScript**.
Hem web hem Android (EAS ile APK). **Veri lokalde (AsyncStorage), backend YOK.**
- Canlı web: https://kilotakip--0iqw6iqa8m.expo.app
- Repo: `inanx12/KiloTakipApp`
- Yerel yol: `C:\Users\inane\Desktop\KiloTakip`

---

## ⛔ BOZMAMA KURALLARI (en kritik bölüm — her zaman uy)

- **Sabit sürümlere DOKUNMA:** `expo` 51.0.39 · `react-native` 0.74.5 ·
  `nativewind` 4.1.23 · `react-native-reanimated` 3.10.1. Bilinçli sabitlendi.
  nativewind caret ile 4.2.x'e çıkarsa reanimated 4 / `react-native-worklets/plugin`
  zorunlu olup **bundle kırılır.**
- **`expo upgrade` ve `expo install --fix` ÇALIŞTIRMA** (her şeyi yükseltip kırar).
- **Yeni native paket: `npx expo install <paket>`** kullan — düz `npm install` DEĞİL
  (SDK 51 uyumlu sürümü seçer).
- **`@shopify/react-native-skia` ve `victory-native` KALDIRILDI** — geri ekleme.
- Çalışan **web build'ini bozma**; değişiklik sonrası `npx expo export -p web` ile doğrula.
- Bu kurallar **SDK 51'de kaldığımız sürece** geçerli. SDK yükseltmesi ayrı, planlı bir
  iş; o zaman bu sürümler yeniden ele alınacak (şimdi yapma).

### Kod tuzakları (daha önce native çökmeye yol açtı — tekrarlama)
- **`MorphingSilhouette`:** reanimated `useAnimatedProps` ile SVG'ye **dinamik string
  transform YAZMA** → react-native-svg native'de çöküyor. Transform **statik** kalsın.
- **`gifted-charts` tek veri noktası:** `curved` + `areaChart` + `animateOnDataChange`
  tek noktada çöküyor → bunlar yalnızca **≥2 noktada** aktif; `animateOnDataChange` kullanma.
- **`expo-document-picker` native:** import özelliklerinin standalone APK'da görünmesi
  için **rebuild** gerekir (Expo Go'da zaten gömülü, reload yeter).

---

## Komutlar

| Durum | Komut |
|---|---|
| Web'i güncelle | `npx expo export -p web` → `eas deploy` |
| Mobil — sadece JS/kod değişti | `eas update` |
| Mobil — native paket eklendi / SDK değişti | `eas build -p android --profile preview` |
| Yeni native paket kur | `npx expo install <paket>` |
| Giriş kontrolü | `eas whoami` |

---

## Mimari / dosya haritası

```
KiloTakip/
├─ app/
│  ├─ _layout.tsx              # kök: ThemeProvider, global.css, StatusBar
│  └─ (tabs)/
│     ├─ _layout.tsx           # alt sekmeler
│     ├─ index.tsx             # Dashboard
│     ├─ profile.tsx           # Profil/Ayarlar + yedekleme (CSV/XLSX dışa-içe aktar)
│     └─ status.tsx            # (PLANLI) Rütbe/Durum sekmesi
├─ components/
│  ├─ AnimatedChart.tsx        # gifted-charts (tek-nokta koruması)
│  ├─ MorphingSilhouette.tsx   # VKİ silüeti (SVG, STATİK transform, tek düz renk)
│  └─ ui/                      # Card · Button · Input · SuccessTick(seri rozeti)
│                              #   · DateField (.tsx native picker / .web.tsx input[type=date])
├─ utils/
│  ├─ storage.ts               # AsyncStorage + importBackup
│  ├─ helpers.ts               # VKİ/ETA/7g ort/streak + exportToCSV(profilli)
│  │                           #   + parseBackupCSV + spreadsheetToCsv
│  └─ ThemeContext.tsx         # sistem/açık/koyu tema
├─ constants/rankConfig.ts     # (PLANLI) rütbe ayarlanabilir sabitleri
├─ app.json                    # web static · eas projectId · updates.url · runtimeVersion
├─ eas.json                    # development/preview/production + channel (preview = apk/internal)
└─ tailwind.config.js, global.css, babel/metro/postcss
```

---

## Kütüphaneler (gerçekte kullanılan)

**Sabit/korunan:** `expo` 51.0.39 · `react-native` 0.74.5 · `nativewind` 4.1.23 ·
`react-native-reanimated` 3.10.1. (Hiç `expo upgrade`/`--fix` çalıştırılmadı.)

**Aktif:**
- Grafik: `react-native-gifted-charts` + `react-native-svg` (Skia/victory YOK)
- Tarih seçici: `@react-native-community/datetimepicker`@8.0.1 (native)
- Dosya seçici (import): `expo-document-picker`@12.0.2 (native)
- Excel okuma: `xlsx`@0.18.5 (SheetJS, **saf JS**, statik import; xlsx→CSV)
- Export/paylaşım: `expo-file-system`, `expo-sharing`
- OTA/Hosting: `expo-updates`@~0.25.28 + EAS Hosting (`output: static`)
- Diğer: AsyncStorage, `dayjs` (**Türkçe locale**), `lucide-react-native`, `expo-router`

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

**Rütbe (Solo Leveling tarzı) sistemi** ekleniyor → tam spec: **`RUTBE_SISTEMI_V1.md`**
(uygularken bunu oku). Tamamı saf JS/TS, `eas update`'le gider. Yeni "Durum" sekmesi
(`status.tsx`) + Dashboard'da mini rozet.

- **Bitti:** VKİ renk fix, seri rozeti / "Gün X 🔥", tarih seçici, CSV+XLSX dışa-içe
  aktarma, UI cilası (sayı kırpılması, SuccessTick backdrop).
- **Sonra (ayrı, planlı turlar):** SDK 51→54 yükseltme (Play Store API 36 için) →
  havalı UI pası (rütbe oturduktan SONRA) → Play Store (AAB + `eas submit`).

---

## Daha fazla bağlam

- **`HANDOFF.md`** — mimari, çalışan/çalışmayan özellikler, geçmiş kararlar/sapmalar
  (HANDOFF + HANDOFF2 birleştirilmiş hali).
- **`GUNCELLEME.md`** — detaylı güncelleme/yayınlama prosedürü + Play Store adımları.
- **`RUTBE_SISTEMI_V1.md`** — rütbe sistemi uygulanabilir spec (sayılar, formüller, tablolar).
- **`RUTBE_SISTEMI.md`** — rütbe sistemi tasarım gerekçeleri (neden böyle kurgulandı).
