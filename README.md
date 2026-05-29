# Kilo Takip (Weight Tracker) - Expo & TypeScript & NativeWind

Bu proje; backend bağımlılığı olmaksızın, tüm verilerini lokal depolamada (**AsyncStorage**) güvenli bir şekilde saklayan, hem mobil (Android & iOS) hem de web ortamında tam uyumlu çalışan, modern ve üst düzey tasarıma sahip bir **Kilo Takip (Weight Tracker)** uygulamasıdır. 

Gelecekte **EAS Build** ile Google Play Store ve Apple App Store'a doğrudan çıkarılabilecek standart Expo SDK 51 ve dosya tabanlı yönlendirme (**Expo Router**) yapısına sahiptir.

---

## 🚀 Hızlı Başlangıç

Controlled Folder Access (Klasör Erişim Koruması) veya PowerShell script çalıştırma engellerinden etkilenmemek için aşağıdaki adımları kendi terminalinizde (CMD, PowerShell veya VS Code Terminali) kolayca çalıştırabilirsiniz:

### 1. Bağımlılıkların Kurulması
Proje dizininde terminalinizi açın ve gerekli tüm paketleri tek seferde kurmak için aşağıdaki komutu çalıştırın:
```bash
npm install
```

### 2. Uygulamanın Çalıştırılması
Kurulum tamamlandıktan sonra yerel Expo geliştirici sunucusunu başlatmak için:
```bash
npx expo start
```

*   **Mobil Test İçin:** Telefonunuza **Expo Go** uygulamasını (Play Store / App Store) indirin. Terminalde beliren **QR Kodu** telefonunuzun kamerası (iOS) veya Expo Go uygulaması (Android) ile taratın.
*   **Web Testi İçin:** Terminal ekranında klavyenizden `w` tuşuna basarak uygulamayı tarayıcınızda açabilirsiniz.

---

## 🛠️ Teknoloji Seçimleri ve Yorum Satırları

*   **Expo SDK 51 + TypeScript:** Modern, kararlı ve tür güvenliği yüksek bir altyapı sunar. EAS derlemeleri için endüstri standardıdır.
*   **NativeWind v4 (Tailwind CSS):** Hem mobil hem web platformlarında tek bir CSS codebase ile harika duyarlı tasarımlar yapmayı sağlar. v4 sürümü modern Metro bundler entegrasyonu (`withNativeWind`) ile son derece performanslı çalışır.
*   **Expo Router (Bottom Tabs):** Dosya tabanlı yönlendirme yapısı sayesinde sayfa geçişleri native akıcılıktadır. `/app/(tabs)/_layout.tsx` dosyası sekmeleri yönetir.
*   **AsyncStorage:** Tüm kilo kayıtlarını, boy ve hedef kilo gibi profil verilerini cihazın kendi diskinde JSON formatında güvenle tutar.
*   **react-native-svg:** Parametrik ve yumuşak morphing yapısına sahip gövde silüeti için kullanılmıştır.
*   **react-native-chart-kit:** Cross-platform kararlılığı en yüksek çizgi grafik kütüphanesidir. Gerçek kilo, 7 günlük hareketli ortalama ve hedef çizgilerini üst üste harika bir performansla çizer.
*   **lucide-react-native:** Yüksek çözünürlüklü ve şık vektörel ikonlar sunar.

---

## 💎 Öne Çıkan Üst Düzey Özellikler

### 1. Dinamik Holografik Gövde Analizörü (`MorphingSilhouette.tsx`)
Profil sekmesinde yer alan gövde görseli statik bir resim değil, matematiksel olarak canlandırılmış tek bir **minimalist insan silüeti SVG**'sidir:
*   **Yatay Morphing (Genişlik):** Güncel kilonuz ve boyunuza göre hesaplanan **Vücut Kitle İndeksi (VKİ)** ile orantılıdır. Baseline (sağlıklı) VKİ değeri 22.0 kabul edilerek gövde genişliği `scaleX = VKİ / 22` parametresi ile dinamik olarak ölçeklenir. Kafa oranı bozulmaması için dampening (sönümleme) uygulanmıştır.
*   **Dikey Ölçekleme (Yükseklik):** Boy bilginiz değiştikçe silüet dikey olarak uzayıp kısalır (`scaleY = Boy / 175`).
*   **Görsel Tema:** Arka planda holografik yükseklik ızgaraları (Grid lines) ve VKİ durumuna göre anlık renk değiştiren neon mor/mavi gradyan kaplama (`LinearGradient`) yer alır.

### 2. Akıllı Tahmini Varış Analizi (ETA & Trend-line)
Sadece kalan gün sayısını bölmek yerine, **gerçek fitness veri analitiği** uygulanmıştır:
*   Kullanıcının son 7 ila 30 gün arasındaki kilo değişim hızını (haftalık değişim hızı) hesaplar.
*   Kullanıcı kilo vermek istiyorsa ve kilo veriyorsa (ya da almak istiyorsa ve alıyorsa) kalan süreyi hesaplayıp **tahmini hedef varış tarihini** Türkçe formatta yazar.
*   Eğer kilo eğilimi hedefle ters yöndeyse (kilo vermesi gerekirken alıyorsa) akıllı bir uyarı vererek eğilimin hatalı olduğunu belirtir.

### 3. Çift Çizgi + Referans Hedef Grafiği
*   **Kilo Seyri:** Girdiğiniz gerçek verileri neon mavi çizgisi ile birleştirir.
*   **7 Günlük Hareketli Ortalama (Moving Average):** Günlük dalgalanmaları (su tutumu, beslenme farkları) süzerek gerçek eğilimi gösteren yumuşak neon mor kesikli çizgi.
*   **Hedef Çizgisi:** Hedef kilonuza referans olan silik yatay kılavuz çizgisi.
*   **Tarih Süzgeci:** Hafta / Ay / Tümü filtreleri grafik altındaki segment butonlardan yönetilir. Grafiğin sıkışmaması için akıllı tarih seyreltme (label parsing) entegre edilmiştir.

### 4. Kusursuz Çapraz Platform CSV Paylaşımı
*   **Web ortamında:** Verileri anında tarayıcınızın indirme kuyruğuna pushlayan bir `Blob` indirme mekanizması çalışır.
*   **Mobil ortamda:** `expo-file-system` ile lokalde geçici bir `.csv` dosyası oluşturulur ve `expo-sharing` ile telefonunuzun native paylaşım menüsü (WhatsApp, Email, Drive vb.) tetiklenir.

---

## 📂 Proje Klasör Yapısı

```
KiloTakip/
├── app/                      # Expo Router Sayfaları
│   ├── _layout.tsx           # Kök sağlayıcılar ve Tailwind global.css yüklemesi
│   └── (tabs)/               # Bottom Tabs Yönlendirmesi
│       ├── _layout.tsx       # Sekme Barı ve İkon Yapılandırmaları
│       ├── index.tsx         # Dashboard (Kilo Kayıt, Grafik, Değişim Kartları, Geçmiş)
│       └── profile.tsx       # Profil Ayarları (VKİ Hesaplama, Silüet Görseli, CSV Paylaşım, Sıfırlama)
├── components/               # Ortak Bileşenler
│   ├── MorphingSilhouette.tsx# Parametrik SVG Silüet Görseli
│   └── ui/                   # Yeniden Kullanılabilir Stilize Tailwind Bileşenleri
│       ├── Card.tsx          # Dark Mode Cam Efektli Kart
│       ├── Button.tsx        # Neon Vurgulu Etkileşim Butonları
│       └── Input.tsx         # Durumsal Form Giriş Alanları
├── utils/                    # İş Mantığı ve Depolama
│   ├── storage.ts            # AsyncStorage Okuma/Yazma/Sıfırlama Soyutlamaları
│   └── helpers.ts            # VKİ, CSV, Hareketli Ortalama ve ETA Matematik Formülleri
├── package.json              # Proje Bağımlılıkları ve Scriptler
├── app.json                  # EAS Build & Expo Global Yapılandırma Dosyası
├── tsconfig.json             # TypeScript Yapılandırması
├── tailwind.config.js        # NativeWind/Tailwind Renk ve Kapsam Tanımları
├── postcss.config.js         # PostCSS Yapılandırması
├── metro.config.js           # NativeWind Metro Entegrasyon Dosyası
├── babel.config.js           # NativeWind Babel Çevirici Yapılandırması
└── global.css                # CSS Tailwind Direktifleri
```

---

## 📲 EAS Build ile Google Play Store'a Çıkış Süreci

Projeniz standart bir Expo yapısında kurulduğu için EAS Build işlemlerine tamamen hazırdır:

1.  **Expo Hesabı Açın:** [expo.dev](https://expo.dev) adresinden ücretsiz bir hesap oluşturun.
2.  **EAS CLI Kurun:**
    ```bash
    npm install -g eas-cli
    ```
3.  **Expo Girişi Yapın:**
    ```bash
    eas login
    ```
4.  **EAS Projesini Yapılandırın:**
    ```bash
    eas build:configure
    ```
    Bu komut, projenize `eas.json` yapılandırma dosyasını ekleyecektir.
5.  **Android Play Store Derlemesi (AAB) Alın:**
    ```bash
    eas build --platform android
    ```
    EAS, tüm imzalama anahtarlarını (Keystore) ve Play Store uyumlu derleme (.aab) paketini sizin için bulutta oluşturacaktır!

---

## 🎨 Tasarım Dili ve Renk Kodları

Tamamen premium bir fitness & dijital sağlık cihazı arayüzü hissi veren **Dark Mode** tasarımı uygulanmıştır:
*   **Arka Plan (`dark-bg`):** `#08080C` (Derin Kozmik Siyah)
*   **Kartlar (`dark-card`):** Cam efektli `#15151F` (Koyu Gece Mavisi Gri)
*   **Sınırlar (`dark-border`):** `#232335` (Zarif Grafit)
*   **Neon Mavi Vurgu (`accent-blue`):** `#00F0FF` (Elektrik Turkuaz - Birincil aksiyonlar, güncel durumlar)
*   **Neon Mor Vurgu (`accent-purple`):** `#BF55EC` (Holografik Mor - Düzenleme modları, hedefler, hareketli ortalama)
*   **Neon Yeşil (`accent-green`):** `#00FF87` (Kilo kaybı, sağlıklı aralık)
*   **Neon Kırmızı (`accent-red`):** `#FF3B30` (Kilo artışı, obezite uyarısı, sıfırlama butonları)
