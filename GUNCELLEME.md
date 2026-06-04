# KiloTakip — Güncelleme & Yayınlama Rehberi

Bu dosya, kodda değişiklik yaptıktan sonra **web** ve **mobil** tarafını nasıl
güncelleyeceğini özetler. Tüm komutlar proje klasöründe açılan terminalde çalıştırılır:
`C:\Users\inane\Desktop\KiloTakip`

> Güncel durum: proje **Expo SDK 54** (Yeni Mimari + reanimated 4 + nativewind 4.2 +
> worklets + edge-to-edge, Android API 36). SDK 51→54 yükseltmesi tamamlandı.

---

## 0. Her şeyden önce: bozmama kuralları

Proje belirli sürümlere **bilinçli olarak sabitli**. Güncelleme yaparken:

- `expo` (~54), `react-native` (0.81), `nativewind` (^4.2.1),
  `react-native-reanimated` (~4.1), `react-native-worklets` (0.5.x) sürümlerine
  **gereksiz dokunma**. Bunlar birbirine bağlı; biri oynayınca bundle kırılabilir.
- **`expo upgrade` ÇALIŞTIRMA** — bir sonraki SDK'ya (55) habersiz sıçratır.
  SDK yükseltmesi ayrı, planlı bir iştir (bkz. SDK54_UPGRADE.md deneyimi).
- Yeni bir native paket kurman gerekirse **`npx expo install <paket>`** kullan (düz
  `npm install` değil) — bu, SDK 54 ile uyumlu sürümü seçer.
- **`react-native-worklets` özel:** JS/native sürümü SDK'nın gönderdiğiyle **birebir**
  eşleşmeli. Sürüm uyuşmazlığı (JS x.y, native a.b) hatası görürsen `npx expo install
  react-native-worklets` ile SDK 54 sürümüne çek.

### Kod tuzakları (değişmedi — hâlâ geçerli)
- `MorphingSilhouette` → SVG transform **STATİK** kalsın (dinamik string transform native'de çöker).
- `gifted-charts` tek veri noktası → `curved`+`areaChart` yalnızca **≥2 noktada**;
  `animateOnDataChange` kullanma.

> Not: SDK 55'e geçilirse bu sürümler yeniden ele alınır (SDK 55 yalnızca Yeni Mimari;
> `newArchEnabled` artık zorunlu/varsayılan). O da ayrı, planlı bir tur.

---

## 1. WEB'i güncelleme

Her kod değişikliğinden sonra **iki komut**, sırayla:

```bash
npx expo export -p web
eas deploy --prod
```

- `expo export -p web` → `dist/` klasörünü yeniden üretir. **Her deploy öncesi tekrar
  çalıştır** (yoksa eski hali yayınlanır).
- `eas deploy --prod` → yeni sürümü **canlı (production) adrese** basar.
  (`--prod` olmadan çalıştırırsan önizleme/preview adresine gider, canlıya değil.)

**Canlı adres:** https://kilotakip.expo.app

Hızlıdır (saniyeler/dakika), kuyruk beklemezsin.

---

## 2. MOBİL'i güncelleme

Burada **ne değiştiğine** göre iki yol var. Önce kendine sor:
**"Sadece arayüz/mantık mı değişti, yoksa yeni bir native paket mi ekledim?"**

### 2A. Sadece JS / kod değişikliği → `eas update` (kolay yol)

Yeni ekran, renk, grafik mantığı, buton, metin, hesaplama gibi değişiklikler nativeye
dokunmaz. Bunlar için **yeni APK almaya gerek yok**:

```bash
eas update
```

Değişiklik telefondaki uygulamana **internetten iner**; uygulamayı kapatıp açınca
güncellenir. APK'yı yeniden kurmazsın, build kuyruğu beklemezsin.

> ⚠️ İlk kullanımdan önce tek seferlik kurulum gerekir: `eas update:configure` ve
> build profilinin update'leri alacak şekilde ayarlı olması. Bu yapılmadıysa ilk
> `eas update` öncesi yapılmalı.

### 2B. Native değişiklik → yeni build (zorunlu yol)

Yeni bir native paket kurduysan (bildirim, kamera gibi) ya da SDK'yı yükselttiysen,
uygulamanın native iskeleti değişmiştir. EAS Update bunu **gönderemez**; yeni bir APK
alıp **tekrar kurman** gerekir:

```bash
eas build -p android --profile preview
```

Bittiğinde Expo bir indirme linki/QR verir → telefona indir → kur (bilinmeyen
kaynaklara izin ver) → çalıştır.

---

## 3. Hızlı komut tablosu

| Durum | Komut(lar) |
|---|---|
| Web'i güncelle | `npx expo export -p web` → `eas deploy --prod` |
| Mobil — sadece JS/kod değişti | `eas update` |
| Mobil — native paket eklendi / SDK değişti | `eas build -p android --profile preview` |
| Yeni native paket kur | `npx expo install <paket>` (npm install DEĞİL) |
| Giriş kontrolü | `eas whoami` |

---

## 4. Akılda tutulacaklar

- **Web verisi ile telefon verisi AYRIDIR.** İkisi tarayıcının/cihazın lokalinde durur,
  birbiriyle senkron değildir. Bulut senkronu ileride ayrı bir iş.
- Veri yalnızca cihazda olduğu için, uygulamayı silersen ya da tarayıcı verisini
  temizlersen **veri gider**. Tek yedeğin uygulamadaki **CSV/XLSX dışa aktar**. Önemli
  veri için düzenli yedek al.
- `dist/` ve `.expo/` klasörleri `.gitignore`'da olmalı (export çıktısı repoya girmesin).

---

## 5. Play Store (sonraki büyük adım)

> SDK yükseltmesi **tamamlandı** → Android **API 36** hedefi artık karşılanıyor.
> Aşağıdaki tur teknik olarak hazır; geri kalanı çoğunlukla hesap/listeleme işi.

1. ~~SDK'yı API 36 hedefine yükselt~~ → **bitti (SDK 54).**
2. APK yerine **AAB** build'i al: `eas build -p android --profile production`
   (production profili AAB üretecek şekilde ayarlı olmalı).
3. **Google Play Developer hesabı** aç (25$ tek seferlik).
4. Mağaza listesi hazırla (ikon, açıklama, ekran görüntüleri, **gizlilik politikası**).
5. `eas submit -p android` ile yükle.

> En sağlıklısı: SDK 54 sürümünü bir süre kullanıp eksikleri gördükten sonra, çalışan
> yapıyı riske atmamak için bu turu **tek seferde** yapmak.

---

## 6. Güvence noktaları (git)

- `sdk51-working` tag → eski çalışan SDK 51 hâli (korundu, silme).
- `sdk54-working` tag → mevcut doğrulanmış SDK 54 hâli.
- Bir şey bozulursa: `git checkout sdk54-working` (ya da en kötü ihtimalde
  `sdk51-working`) ile sağlam noktaya dönülür. Detaylı kurtarma: SDK54_UPGRADE.md §5.
