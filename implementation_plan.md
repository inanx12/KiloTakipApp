# Kilo Takip Uygulaması - Uygulama Planı

Bu belge, lokal veri tabanlı (AsyncStorage), NativeWind (Tailwind) ile tasarlanmış, modern dark mode temasına sahip, hem mobil hem web uyumlu bir **Kilo Takip (Weight Tracker) Expo** uygulamasının kurulum planını içerir.

---

## User Review Required

> [!IMPORTANT]
> **Proje Kurulumu Hakkında:** PowerShell ortamındaki Controlled Folder Access / izin kısıtlamaları nedeniyle terminal komutlarını doğrudan bizim çalıştırmamız yerine, tüm proje dosyalarını ve yapısını eksiksiz bir şekilde oluşturacağız. Ardından, projeyi kendi bilgisayarınızda sadece iki basit komutla (`npm install` ve `npx expo start`) nasıl çalıştırabileceğinizi adım adım açıklayacağız.

> [!TIP]
> **Dinamik Vücut Görseli:** BMI (Vücut Kitle İndeksi - VKİ) değerine göre gövde genişliğini parametrik olarak ölçeklendiren (`scaleX`) minimalist bir insan silüeti SVG bileşeni oluşturacağız. Boy bilgisi değiştikçe silüet dikey olarak da uzayıp kısalacaktır (`scaleY`). Bu sayede statik görseller yerine akıcı ve dinamik bir morph yapısı elde edilecektir.

---

## Proposed Changes

Proje yapısı standart modern Expo + TypeScript + `expo-router` yapısına uygun olarak şu şekilde kurulacaktır:

```
KiloTakip/
├── app/
│   ├── _layout.tsx           # Kök bileşen ve stil sağlayıcıları
│   └── (tabs)/
│       ├── _layout.tsx       # Bottom Tabs (Alt Sekmeler) navigasyonu
│       ├── index.tsx         # Dashboard (Ana Ekran)
│       └── profile.tsx       # Profil & Ayarlar Ekranı
├── components/
│   ├── MorphingSilhouette.tsx# Parametrik SVG Vücut Silüeti
│   └── ui/
│       ├── Card.tsx          # Modern Dark Mode Kart Bileşeni
│       ├── Button.tsx        # Neon Vurgulu Buton Bileşeni
│       └── Input.tsx         # Özelleştirilmiş Giriş Alanları
├── utils/
│   ├── storage.ts            # AsyncStorage işlemleri (Kilo geçmişi, Profil)
│   └── helpers.ts            # VKİ, Hareketli Ortalama, CSV dışa aktarma hesaplayıcıları
├── package.json              # Gerekli bağımlılıklar ve scriptler
├── app.json                  # Expo Yapılandırması
├── tsconfig.json             # TypeScript Yapılandırması
├── tailwind.config.js        # Tailwind / NativeWind yapılandırması
└── postcss.config.js         # PostCSS yapılandırması
```

---

### 1. Yapılandırma Dosyaları (Foundation)

#### [NEW] [package.json](file:///c:/Users/inane/Desktop/KiloTakip/package.json)
Uygulamanın çalışması için gerekli tüm kütüphaneleri (Expo SDK, NativeWind, react-native-svg, react-native-chart-kit, AsyncStorage, lucide-react-native vb.) içerecektir.

#### [NEW] [app.json](file:///c:/Users/inane/Desktop/KiloTakip/app.json)
Expo Router ve Android/iOS derlemeleri için gerekli EAS uyumlu yapılandırma.

#### [NEW] [tsconfig.json](file:///c:/Users/inane/Desktop/KiloTakip/tsconfig.json)
TypeScript yapılandırması.

#### [NEW] [tailwind.config.js](file:///c:/Users/inane/Desktop/KiloTakip/tailwind.config.js) ve [postcss.config.js](file:///c:/Users/inane/Desktop/KiloTakip/postcss.config.js)
NativeWind entegrasyonu için Tailwind yapılandırması. Dark mode ve neon vurgular (neon blue `#00F0FF`, neon purple `#BF55EC`) tanımlanacaktır.

---

### 2. Veri ve Yardımcı Fonksiyonlar (Utilities)

#### [NEW] [storage.ts](file:///c:/Users/inane/Desktop/KiloTakip/utils/storage.ts)
Lokal depolama (AsyncStorage) için asenkron fonksiyonlar:
- `saveWeightEntry(weight: number, date?: string)` -> Belirtilen tarihe kilo kaydeder, aynı tarih varsa günceller.
- `deleteWeightEntry(id: string)` -> Kayıt siler.
- `getWeightHistory()` -> Tüm kilo geçmişini tarihe göre sıralı getirir.
- `saveProfile(height: number, targetWeight: number)` -> Profil verilerini kaydeder.
- `getProfile()` -> Profil verilerini getirir.
- `clearAllData()` -> Tüm verileri sıfırlar.

#### [NEW] [helpers.ts](file:///c:/Users/inane/Desktop/KiloTakip/utils/helpers.ts)
Uygulama içi hesaplamalar:
- `calculateBMI(weight: number, heightCm: number)` -> VKİ hesaplar.
- `calculateMovingAverage(entries: Array<{weight: number, date: string}>, windowDays: number)` -> 7 günlük hareketli ortalama veri setini hesaplar.
- `exportToCSV(entries: Array<{weight: number, date: string}>)` -> Kilo verilerini CSV metnine dönüştürür.
- `calculateETA(history: Array<{weight: number, date: string}>, currentWeight: number, targetWeight: number)` -> Son 7/30 gündeki kilo değişim hızına göre hedef kiloya kalan tahmini gün sayısını hesaplar.

---

### 3. Arayüz Bileşenleri (UI & Components)

#### [NEW] [MorphingSilhouette.tsx](file:///c:/Users/inane/Desktop/KiloTakip/components/MorphingSilhouette.tsx)
- Minimalist bir insan silüeti içeren `<Svg>` bileşeni.
- Silüetin gövdesini temsil eden grup (`<G>`), hesaplanan `scaleX` değeri ile yatayda genişletilip daraltılacaktır:
  - Normal VKİ (22) baz alınır. `scaleX = BMI / 22`. Sınırlar: 0.6 (aşırı zayıf) ile 1.7 (aşırı kilolu).
  - Boy bilgisine göre `scaleY = Boy / 175` dikey ölçeklendirmesi de uygulanacaktır.
- Silüet, modern neon mavi/mor gradyanı ile boyanacaktır.

#### [NEW] [Card.tsx](file:///c:/Users/inane/Desktop/KiloTakip/components/ui/Card.tsx), [Button.tsx](file:///c:/Users/inane/Desktop/KiloTakip/components/ui/Button.tsx), [Input.tsx](file:///c:/Users/inane/Desktop/KiloTakip/components/ui/Input.tsx)
Tailwind ile şekillendirilmiş, reusable ve şık dark mode bileşenleri.

---

### 4. Sayfalar ve Navigasyon (Screens & Navigation)

#### [NEW] [_layout.tsx](file:///c:/Users/inane/Desktop/KiloTakip/app/_layout.tsx)
Kök düzen. Durum çubuğunu (StatusBar) açık renk (dark mode uyumlu) olarak ayarlar ve SafeAreaProvider ile sarmalar.

#### [NEW] [(tabs)/_layout.tsx](file:///c:/Users/inane/Desktop/KiloTakip/app/(tabs)/_layout.tsx)
Expo-Router tabs navigasyonu. Sekmeler modern dark gri arkaplan, neon mavi aktif ikon ve başlık rengiyle özelleştirilecektir.

#### [NEW] [(tabs)/index.tsx](file:///c:/Users/inane/Desktop/KiloTakip/app/(tabs)/index.tsx) (Dashboard)
- **Kilo Girişi:** Bugünün tarihini otomatik alan, şık input alanı ve neon "Kaydet" butonu.
- **Zaman Filtresi:** Hafta / Ay / Tümü için modern segment butonları.
- **Grafik Bölümü:** `react-native-chart-kit` kullanılarak oluşturulan çizgi grafik.
  - Grafik üzerinde gerçek kilo seyri (neon mavi çizgi).
  - Hedef Kilo çizgisi (kesikli veya ince sabit çizgi).
  - 7 günlük hareketli ortalama (neon mor çizgi).
- **Bilgi Kartı:** İlk kilodan bugüne toplam fark. Kilo verilmişse yeşil (örn. `-3.2 kg`), alınmışsa kırmızı (örn. `+1.5 kg`) yanan neon metin.
- **Geçmiş Listesi:** Her kaydın yanında silme ve düzenleme (modal veya form üstünden) aksiyonları barındıran şık bir liste görünümü.

#### [NEW] [(tabs)/profile.tsx](file:///c:/Users/inane/Desktop/KiloTakip/app/(tabs)/profile.tsx) (Profil/Ayarlar)
- **Profil Girişleri:** Boy (cm) ve Hedef Kilo giriş alanları ve kaydetme aksiyonu.
- **VKİ Gösterimi:** Boy ve güncel kiloyla hesaplanan VKİ değeri, kategorisi (Zayıf, Normal, Fazla Kilolu, Obez) ve renkli bar göstergesi.
- **Dinamik Silüet:** Parametrik morphing silüet SVG görseli tam ortada yer alacaktır.
- **İlerleme & ETA:** Hedefe yüzde kaç yaklaşıldığı (Modern progress bar ile) ve mevcut kilo verme/alma hızına göre hedefe varılacak tahmini tarih gösterimi.
- **Dışa Aktar & Sıfırla:** CSV indirme (Expo Sharing API ile) ve tüm veriyi temizleme butonları.

---

## Verification Plan

### Manual Verification
Proje kurulduktan sonra aşağıdaki adımlarla test edilebilir:
1. `npm install` komutuyla bağımlılıklar kurulur.
2. `npx expo start` veya web testi için `npx expo start --web` çalıştırılır.
3. **Kilo Ekleme:** Birkaç gün için kilo verisi eklenir. Grafiğin güncellendiği, hareketli ortalamanın çizildiği ve bilgi kartındaki değişim değerinin renklendiği görülür.
4. **Profil Tanımlama:** Profil sekmesinde boy (örn: 180) ve hedef kilo (örn: 75) girilir. Vücut görselinin girilen boy ve kilo ile orantılı olarak anında morph olduğu gözlemlenir.
5. **CSV Aktarma:** CSV butonu tetiklenerek dosyanın dışa aktarım dialoğu açılır.
6. **Sıfırlama:** "Tümünü Sıfırla" basıldığında verilerin temizlendiği ve Dashboard'a yansıdığı doğrulanır.
