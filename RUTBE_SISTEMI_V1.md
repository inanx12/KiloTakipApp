# RÜTBE SİSTEMİ — V1 (Uygulanabilir Spesifikasyon)

> Bu dosya, `RUTBE_SISTEMI.md`'deki felsefenin **somut sayılarla, koda dökülebilir**
> halidir. Amaç: doğrudan implemente edebilmek. Karar gerekçeleri için diğer dosyaya bak.
>
> **V1 varsayımı:** Kilo VERME yolculuğu (hedef < başlangıç). Kilo alma yolculuğu V1.1.

---

## 0. Bir bakışta V1

- Rütbe iki şeyden beslenir: **Tutarlılık XP'si** (davranış) ve **RP** (gerçek ilerleme).
- **Tutarlılık tek başına en fazla C'ye taşır.** B/A/S için RP (gerçek kg) şart.
- **RP geri gitmez, hedefi kolaylaştırınca şişmez.** Bu, "tırmanış satın alınamaz" güvencesi.
- **Ceza yok:** rütbe düşmez. Sadece donma (30 gün) ve uyku (45 gün) + comeback var.
- Hedefe varınca → **Bakım Modu** (S üstü, ayrı sakin sınıf).

---

## 1. Saklanan Veriler (state)

```ts
type RankState = {
  baselineB: number;        // İlk kayıttaki kilo. SABİT. (bir kez set edilir)
  goalCurrent: number;      // Aktif hedef kilo.
  bankedE: number;          // = baselineB - (şimdiye kadarki en düşük 7g ort). ≥0. SADECE ARTAR.
  rp: number;               // Rank Points. SADECE ARTAR (ratchet).
  consistencyXP: number;    // Davranış XP'si (kayıt/görev/seri).
  current7dAvg: number;     // Güncel 7 günlük ortalama.
  lastProgressDate: string; // bankedE'nin en son arttığı tarih. (donma/uyku sayacı)
  streakCount: number;
  lastLogDate: string;
  comebackArmed: boolean;   // uyku'dan çıkınca bir sonraki ilerlemeyi 2x'ler.
};
```

> `baselineB` ilk kayıtta set edilir, sabit kalır. Kişi "yeni yolculuk" başlatmak isterse
> bu ayrı bir manuel sıfırlama aksiyonudur (V1.1).

---

## 2. Üç Temel Sayı (formüller)

### a) Banka — `bankedE` (kalıcı)
Şimdiye kadar kilitlediğin en iyi 7-günlük-ortalama ilerlemesi. **Asla azalmaz.**
```
progressNow = max(0, baselineB - current7dAvg)
bankedE = max(bankedE, progressNow)   // high-water mark
```
Kilo geri alınsa bile `bankedE` düşmez → rütbe düşmez.

### b) İlerleme çubuğu — `barPct` (görsel, mevcut "hedef ilerlemesi")
Kullanıcıya gösterilen motive edici çubuk. **Aktif** hedefe göre.
```
distance = max(0.1, baselineB - goalCurrent)   // sıfıra bölme koruması
barPct   = clamp(bankedE / distance * 100, 0, 100)
```
- Hedef zorlaşınca: dolmuş kısım sabit kalır, **yeni yol uzar** (çubuk geri gitmez).
- Bu sadece görsel; rütbeyi belirlemez.

### c) Rank Points — `rp` (rütbe yakıtı, ratchet)
**Bu, rütbeyi belirleyen sayıdır.** Sadece **gerçek yeni kg** bankaya yatınca artar.
Hedef o an neyse ona göre ölçeklenir, sonra kilitlenir:
```
// bankedE delta kadar arttığında:
gain = delta * (100 / (baselineB - goalCurrent))   // o anki hedefe göre
if (comebackArmed) gain *= 2                        // toparlama bonusu
rp += gain                                          // ASLA azalmaz
```
**Neden ayrı bir sayı?** RP, hedefi kolaylaştırınca artmaz (yeni kg vermiyorsun, sadece
çizgiyi yaklaştırıyorsun → delta=0 → gain=0). Hedefi zorlaştırınca da düşmez (ratchet).
Böylece "çubuk dolar ama tırmanış satın alınamaz" garanti altında.

> **Sezgisel anlatım:** Hedefini hiç değiştirmezsen RP = barPct'tir (aynı sayı).
> İkisi sadece hedef değişince ayrışır.

---

## 3. Tutarlılık XP Ekonomisi

| Olay | XP |
|---|---|
| Günlük kilo kaydı | **+10** |
| Günlük görev tamamlama | **+15** |
| 7 günlük seri (her ulaşımda 1 kez) | +30 |
| 30 günlük seri | +75 |
| 100 günlük seri | +150 |

Günlük tipik kazanım: kayıt (10) + görev (15) = **25 XP/gün**.

> **Donma:** `bugün - lastProgressDate > 30 gün` ise tutarlılık XP'si **artmaz**
> (loglamaya devam edersin ama XP gelmez). Sıfırlama yok, sadece durur.

> İstersen "ömür boyu XP"yi gösterim/gurur için ayrı tut; rütbe hesabı `min(XP, 600)` kullanır.

---

## 4. ⭐ RÜTBE TABLOSU (V1 ana tablo)

Rütbe = **hem** `xpReq` **hem** `rpReq` sağlanan en yüksek rütbe.

| Rütbe | İsim (Avcı teması) | xpReq | rpReq | Anlamı |
|:---:|---|:---:|:---:|---|
| **E** | Uyanan | 0 | 0 | Başlangıç |
| **D** | Avcı | 150 | 0 | ~6 gün tutarlılık |
| **C** | Kıdemli Avcı | 600 | 0 | ~3.5 hafta tutarlılık — **davranış tavanı** |
| **B** | Elit Avcı | 600 | 25 | C tavanı + yolun %25'i gerçekten katedildi |
| **A** | Usta Avcı | 600 | 55 | + yolun %55'i |
| **S** | Hükümdar | 600 | 90 | + yolun %90'ı |
| **—** | **Muhafız (Bakım Modu)** | — | — | Hedefe ulaşıldı → ayrı sakin sınıf |

**Mantık:**
- `xpReq` 600'de sabitlenir çünkü tutarlılık C'de tavanlanır. B/A/S'in farkı RP'dir.
- B/A/S için "600 XP" gereği gerçek progress yapan birinde **otomatik karşılanır**
  (RP kazanmak için veri girmen şart, o da bol XP demek).
- İsimler bilinçle **başarısızlık kokmaz**: en alt "Uyanan" (havalı başlangıç), C "Kıdemli".

---

## 5. Rütbe Hesabı (pseudocode)

```ts
function computeRank(d: RankState) {
  // --- Bakım Modu kontrolü (en üstte) ---
  if (d.bankedE > 0 && d.current7dAvg <= d.goalCurrent + 0.5) {
    return { key: "MUHAFIZ", name: "Bakım Modu", barPct: 100, maintenance: true };
  }

  const distance = Math.max(0.1, d.baselineB - d.goalCurrent);
  const barPct = clamp((d.bankedE / distance) * 100, 0, 100);
  const xp = Math.min(d.consistencyXP, 600);
  const rp = d.rp;

  const TABLE = [
    { key:"E", name:"Uyanan",       xpReq:0,   rpReq:0  },
    { key:"D", name:"Avcı",         xpReq:150, rpReq:0  },
    { key:"C", name:"Kıdemli Avcı", xpReq:600, rpReq:0  },
    { key:"B", name:"Elit Avcı",    xpReq:600, rpReq:25 },
    { key:"A", name:"Usta Avcı",    xpReq:600, rpReq:55 },
    { key:"S", name:"Hükümdar",     xpReq:600, rpReq:90 },
  ];

  let cur = TABLE[0];
  for (const r of TABLE) if (xp >= r.xpReq && rp >= r.rpReq) cur = r;
  return { ...cur, barPct, maintenance:false };
}
```

---

## 6. Kayıt Anında Güncelleme (pseudocode — gösterim amaçlı)

```ts
function onWeightLogged(d: RankState, todayAvg: number, today: string) {
  updateStreak(d, today);
  d.current7dAvg = todayAvg;

  // 1) BANKA + RP
  const progressNow = Math.max(0, d.baselineB - d.current7dAvg);
  if (progressNow > d.bankedE) {
    const delta = progressNow - d.bankedE;
    d.bankedE = progressNow;

    const dist = Math.max(0.1, d.baselineB - d.goalCurrent);
    let gain = delta * (100 / dist);
    if (d.comebackArmed) { gain *= 2; d.comebackArmed = false; } // toparlama
    d.rp += gain;

    d.lastProgressDate = today;
  }

  // 2) TUTARLILIK XP (donmamışsa)
  const frozen = daysBetween(d.lastProgressDate, today) > 30;
  if (!frozen) {
    d.consistencyXP += 10;                       // kayıt
    if (dailyQuestDone(d)) d.consistencyXP += 15; // görev
    d.consistencyXP += streakMilestoneXP(d);      // 0 / 30 / 75 / 150
  }

  // 3) UYKU hazırlığı
  if (daysBetween(d.lastProgressDate, today) > 45) d.comebackArmed = true;
}
```

> Bu pseudocode **niyeti** gösterir; kendi `helpers.ts` yapına göre uyarlarsın.

---

## 7. Donma / Uyku / Comeback

| Durum | Koşul | Etki |
|---|---|---|
| **Donma** | 30 gün yeni ilerleme yok | Tutarlılık XP'si artmayı durdurur. **Rütbe korunur.** |
| **Uyku** | 45 gün yeni ilerleme yok | "⏸ Durağan" rozeti. **Rütbe korunur.** `comebackArmed=true`. |
| **Comeback** | Uykudan sonra yeni ilerleme | O ilerlemenin **RP'si 2x**. Bir kez. Rozet kalkar. |

**Çürüme (rütbe düşmesi) V1'de YOK.** (Plato cezalandırması ters teper — gerekçe diğer dosyada.)

---

## 8. Momentum / İvme (görsel sinyal — rütbeyi DÜŞÜRMEZ)

"Uzaklaşma da sayılsın" isteğinin yaşadığı yer. Rütbeyi düşürmez; donma/uyku sayacını besler
ve kullanıcıya geri bildirim verir.

```ts
function momentum(d): "up" | "flat" | "down" {
  const wow = d.current7dAvg - avg7dAvgOf(7_gun_once); // hafta-üstü-hafta
  if (wow < -0.1) return "up";   // kilo veriyor → hedefe doğru
  if (wow >  0.1) return "down"; // uzaklaşıyor
  return "flat";
}
```
- **up** → "🔥 İvme iyi"  · **flat** → "→ Sabit"  · **down** → "↓ Dikkat"
- Sadece gösterge. Rütbeyi etkilemez (V1).

---

## 9. Günlük Görev (Gizli Görev / Daily Quest)

Günde **1** görev, rastgele havuzdan. Tamamlanınca **+15 XP**. "Gizli" = açılınca görünür
(Solo Leveling "sistem görevi" hissi). **Hepsi davranış/sağlık temelli — asla "şu kadar ye/yeme" değil.**

Havuz:
1. Bugün tartıl (kayıt yapınca otomatik tamamlanır)
2. Haftalık ortalamana bak
3. Hedef ilerlemeni kontrol et
4. Dünkü kilonla karşılaştır
5. Grafiğini incele

---

## 10. Penalty Zone — bilinçli olarak YOK

Solo Leveling'de var ama **kiloya bağlı ceza bir kilo uygulamasında zararlıdır** (bozuk yeme
ilişkisi, plato cezalandırması, uninstall sebebi). Yerine: **uyku + comeback.** Rozet "ceza"
değil "yeniden uyanış". Estetik korunur, ceza felsefesi alınmaz.

---

## 11. Bildirim ile bağ (sonraki konu)

Rütbe sistemi bildirimi besler ama V1'de tek nazik tetik yeter:
- Günde **1** hatırlatma: "Serini sürdür / bugün tartıl."
- (Opsiyon) Uykuya düşmeden önce: "Avcı uykuya dalmak üzere — geri dön."
- `expo-notifications` native → **yeni build** gerekir (CSV import zaten native'di, gruplanabilir).

---

## 12. Test Senaryoları (V1 doğrulaması)

**S1 — Hızlı başlangıç (B=80, hedef=70, mesafe=10).**
- 6. gün: XP≈150 → **D**. 3.5. hafta: XP≈600 → **C**.
- 5kg verince: bankedE=5, RP = 5×(100/10)=50 ≥ 55? hayır → **B** (RP 25 ✓). 9kg → RP 90 → **S**.

**S2 — Adalet (küçük hedef, B=60, hedef=56, mesafe=4).**
- 1kg verince RP = 1×(100/4)=25 → **B**. Büyük hedefliyle aynı eşik. ✓

**S3 — Plato.** B'deyken 6 hafta ilerleme yok → 30g donma (XP durur), 45g "⏸ Durağan".
**Rütbe B'de kalır.** Tekrar verince comeback (RP 2x). ✓

**S4 — Geri alma.** B'de (RP 30) 2kg geri alındı. bankedE düşmez, RP düşmez → **B kalır.**
Momentum "↓ Dikkat" gösterir. ✓

**S5 — Hedef oyunu (kolaylaştırma).** B=80, current=77 (bankedE=3, RP=3×100/10=30 → B).
Hedef 70→75 yapılır. Yeni kg yok → delta=0 → **RP 30 kalır → B kalır.** barPct artar ama
**rütbe atlamaz.** ✓ ("Tırmanış satın alınamaz.")

**S6 — Hedef oyunu (şimdiki kiloya çekme).** current=77, hedef→77, bankedE=3>0,
current ≤ goal+0.5 → **Bakım Modu (Muhafız)**, S DEĞİL. (E=0 olsaydı sayılmazdı.) ✓

---

## 13. V1 KAPSAMI DIŞI (sonra: V1.1 / V2)

- Kilo ALMA yolculuğu (hedef > başlangıç) — momentum/formül yönü ters çevrilecek.
- A/S'te opsiyonel rütbe düşmesi (şimdilik kapalı).
- Çoklu günlük görev / görev zinciri.
- Sezonluk sıfırlama, lig/arkadaş tablosu, bulut senkron.
- RP'de "en hırslı hedef" denklemi (V1 "o anki hedef" yeterince sağlam).

---

## 14. Uygulama sırası önerisi

1. State alanlarını ekle (`baselineB`, `rp`, `bankedE`, `lastProgressDate`, ...).
2. `helpers.ts`'e `computeRank` + RP/banka güncellemesini ekle (saf fonksiyon, test edilebilir).
3. Profil/Dashboard'a rütbe rozeti + RP/XP çubuğu + momentum göstergesi.
4. Günlük görev (basit, 1/gün).
5. (Native build grubu) CSV import zaten yapıldı → bildirim ile birlikte tek build.

> Hepsi JS/mantık olduğu için **rütbe + görev + momentum `eas update` ile gidebilir.**
> Sadece bildirim native → yeni build.
