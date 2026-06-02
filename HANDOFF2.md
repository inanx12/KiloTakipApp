# HANDOFF 2 — KiloTakip (ilk redesign sonrası tüm güncellemeler)

Tarih: 2026-05-31 · Branch: `main` · Repo: inanx12/KiloTakipApp
(İlk durum için bkz. HANDOFF.md — bu dosya ondan sonraki işleri özetler.)

---

## 1. Çalışan / test edilen özellikler

Web'de (`npx expo start --web`) ve büyük kısmı mobilde (Expo Go / APK) test edildi:

- **UI cilası:** SuccessTick'in koyu backdrop'u kaldırıldı; stat kartı ("7 Gün Ort." / "Tahmini Hedef") ve Son Kayıtlar'daki büyük sayıların **üst kırpılması** giderildi (sayı + "kg" ayrı kardeş Text + `items-baseline`, hero deseni); düzenleme satırında "Güncelle" tek satıra sığıyor.
- **Seri rozeti:** kilo kaydında çıkan tik'in üstünde "🔥 {streak} Gün" rozeti (kısa alev nabzı). Tik davranışı değişmedi.
- **VKİ işaretleyici:** profildeki renkli bardaki beyaz nokta artık **doğru segmentte** (parçalı eşleme; 18.5/25/30 → %25/50/75). Önceki doğrusal eşleme yanlış segmente koyuyordu.
- **Silüet rengi:** VKİ kategorisine göre tek düz renk; obez yumuşak mercan `#FF8A5B`; silüet/bar/rozet renkleri tutarlı (`getBMICategory`).
- **Native takvim picker:** Android native dialog, iOS modal+inline takvim; geçmiş serbest, gelecek kapalı, tr-locale.
- **Yedekleme — Dışa Aktar (CSV):** profil (boy/hedef) + tüm kilo geçmişini içeren tam yedek CSV'si. Web'de indirme, native'de paylaşım.
- **Yedekleme — İçe Aktar (CSV **ve** Excel .xlsx):** dosya seçilir, parse edilir, kilolar tarihe göre birleşir + profil geri yüklenir, ekran **otomatik** tazelenir. `.xlsx` (Excel'in CSV'den ürettiği) dosyalar da desteklenir (SheetJS ile CSV'ye çevrilip okunur). Round-trip ve uçtan uca testler PASS.
- **EAS APK build** (`eas build -p android --profile preview`) çalıştı; kullanıcı kurdu, açıldı.
- **EAS Hosting (web):** `expo.web.output: "static"` + `eas deploy` ile yayınlandı.
- Önceki tüm çekirdek özellikler korundu: kayıt ekle/sil/düzenle, 7 gün ort., hedef çizgisi, ETA, streak, grafik (gifted-charts), çift tema.

## 2. Çalışmayan / yarım / bilinen sorunlar

- **Mobilde CSV'yi Excel "ele geçiriyor":** Telefonda `.csv` dosyaları Excel'e bağlı; Excel'de açılıp kaydedilince `.xlsx`'e dönüşüyordu ve import "geçerli veri yok" diyordu. **Çözüldü:** import artık `.xlsx`'i de okuyor. (Kök neden: import edilen dosya `PK` ile başlıyordu = ZIP/xlsx.)
- **Yeni native modüller rebuild ister:** `expo-document-picker` (CSV/Excel seçici) native bir modül; standalone APK'da görmek için **yeniden build** gerekti. (Expo Go'da zaten gömülü.) Buna karşılık `xlsx` (SheetJS) **saf JS** — Expo Go'da reload yeterli, rebuild gerekmez.
- **xlsx@0.18.5** npm audit uyarısı veriyor (prototype pollution/ReDoS). Yalnızca kullanıcının **kendi** yedek dosyaları okunduğu için pratik risk düşük; istenirse SheetJS CDN sürümüne (0.20.x) yükseltilebilir.
- Zararsız gifted-charts konsol uyarıları (web) hâlâ var (`onPressOut` vb.) — işlevi etkilemez.

## 3. Plandan sapmalar (ne / neden)

- **Profil kaydedince native çökme:** MorphingSilhouette reanimated `useAnimatedProps` ile SVG'ye sürekli değişen STRING `transform` yazıyordu → react-native-svg native'de çöküyordu. Reanimated silüetten çıkarıldı; transform **statik** yapıldı (görünüm aynı, morph anında oturuyor).
- **Tek veri noktasında grafik çökmesi (native):** gifted-charts tek noktada `curved`+`areaChart`+`animateOnDataChange` ile çöküyordu → bunlar yalnızca ≥2 noktada aktif, `animateOnDataChange` kaldırıldı.
- **CSV yedeğe profil eklendi:** "tüm bilgiler geri gelsin" için CSV artık boy/hedef de içeriyor (eski format-uyumlu).
- **CSV import → CSV+XLSX import:** mobilde Excel sürtünmesi yüzünden xlsx desteği eklendi (SheetJS).
- **lineHeight denemesi geri alındı:** sayı kırpılması lineHeight'la çözülmedi; gerçek sebep iç-içe karışık-boyut Text'ti → kardeş Text deseni.

## 4. Gerçekte kullanılan kütüphaneler

- **Grafik:** `react-native-gifted-charts` (+ `react-native-svg`). Skia/victory yok.
- **Tarih seçici:** `@react-native-community/datetimepicker@8.0.1` (native).
- **Dosya seçici (import):** `expo-document-picker@12.0.2` (native).
- **Excel okuma:** `xlsx`@0.18.5 (SheetJS, saf JS, statik import — `spreadsheetToCsv` ile xlsx→CSV).
- **Dosya yazma/paylaşma (export):** `expo-file-system`, `expo-sharing`.
- **OTA/Hosting:** `expo-updates@~0.25.28` + EAS Hosting (`output: static`).
- Değişmeyenler (KORUNDU): **expo 51.0.39, nativewind 4.1.23, react-native-reanimated 3.10.1, react-native 0.74.5.** Hiç `expo upgrade`/`--fix` çalıştırılmadı.

## 5. Klasör / dosya yapısı (kısa)

```
KiloTakip/
├─ app/(tabs)/ index.tsx (dashboard) · profile.tsx (yedekleme + CSV/XLSX import) · _layout.tsx
├─ app/_layout.tsx
├─ components/
│  ├─ AnimatedChart.tsx (gifted-charts; tek-nokta koruması)
│  ├─ MorphingSilhouette.tsx (statik SVG transform; tek düz renk)
│  └─ ui/ Card · Button · Input · SuccessTick(seri rozeti) · DateField(.tsx native picker / .web.tsx input[type=date])
├─ utils/
│  ├─ storage.ts (AsyncStorage + importBackup)
│  ├─ helpers.ts (VKİ/ETA/ortalama/streak + exportToCSV(profilli) + parseBackupCSV + spreadsheetToCsv)
│  └─ ThemeContext.tsx
├─ app.json (web static, eas projectId, updates.url, runtimeVersion)
├─ eas.json (development/preview/production + channel; preview = apk/internal)
└─ tailwind/metro/babel/postcss configleri, global.css
```

## 6. Açık sorular / kararlar

1. **xlsx import'u commit edeyim mi?** Şu an lokalde (test edilmeyi bekliyor). Expo Go'da reload yeterli (rebuild gerekmez). "Sorun yok" dersen commit + push ederim.
2. **APK'da xlsx/CSV import:** `expo-document-picker` native olduğu için **bu özellikleri telefonda standalone APK ile kullanmak için yeniden build** gerekir (`eas build -p android --profile preview`). Web için yeniden deploy yeterli.
3. **xlsx sürümü:** 0.18.5 (npm) yeterli mi, yoksa SheetJS CDN 0.20.x'e mi geçelim (güvenlik yaması)?
4. **JSON yedek?** Excel sürtünmesi tamamen bitsin istersen yedeği `.json` da yapabiliriz; şu an CSV+XLSX ikisi de çalışıyor, gerek kalmadı.
5. **GUNCELLEME.md.pdf / HANDOFF*.md:** lokalde tutuluyor, repoya girmiyor (senin tercihin).
