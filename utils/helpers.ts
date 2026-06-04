import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import dayOfYear from "dayjs/plugin/dayOfYear";
import "dayjs/locale/tr";
import * as XLSX from "xlsx";
import {
  XP,
  STREAK_MILESTONES,
  RANK_TABLE,
  MAINTENANCE_RANK,
  DECAY,
  MAINTENANCE_BAND,
  MOMENTUM,
  DISTANCE_FLOOR,
  RP_FULL_SCALE,
  QUEST_POOL,
  RankKey,
  DailyQuest,
} from "../constants/rankConfig";

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.extend(dayOfYear);
dayjs.locale("tr");

export interface WeightEntry {
  id: string;
  weight: number;
  date: string;
}

export function calculateBMI(weight: number, heightCm: number): number {
  if (heightCm <= 0 || weight <= 0) return 0;
  const heightM = heightCm / 100;
  return Number((weight / (heightM * heightM)).toFixed(1));
}

export function getBMICategory(bmi: number): {
  category: string;
  color: string;
  description: string;
} {
  if (bmi <= 0) return { category: "Belirtilmemiş", color: "#9A9AB0", description: "Lütfen profilinizi güncelleyin." };
  if (bmi < 18.5) {
    return { category: "Zayıf", color: "#00F0FF", description: "Boyunuza göre kilonuz düşük. Dengeli beslenmeye özen gösterin." };
  } else if (bmi < 25.0) {
    return { category: "Normal", color: "#30E0A1", description: "Tebrikler! Kilonuz boyunuz için son derece sağlıklı bir aralıkta." };
  } else if (bmi < 30.0) {
    return { category: "Fazla Kilolu", color: "#BF55EC", description: "İdeal kilonuzun biraz üzerindesiniz. Egzersiz ve beslenmeye dikkat edebilirsiniz." };
  } else {
    return { category: "Obez", color: "#FF8A5B", description: "Sağlık risklerini azaltmak için beslenme uzmanı yardımı almanız önerilir." };
  }
}

export function calculateMovingAverage(
  entries: WeightEntry[],
  windowSize = 7
): number[] {
  if (entries.length === 0) return [];
  const result: number[] = [];
  
  for (let i = 0; i < entries.length; i++) {
    let sum = 0;
    let count = 0;
    const start = Math.max(0, i - windowSize + 1);
    
    for (let j = start; j <= i; j++) {
      sum += entries[j].weight;
      count++;
    }
    
    result.push(Number((sum / count).toFixed(1)));
  }
  
  return result;
}

export interface BackupProfile {
  height: number;
  targetWeight: number;
}

/**
 * Tam yedek CSV'si: (varsa) profil bölümü + kilo geçmişi.
 * Eski format (yalnızca "Tarih,Kilo (kg)") ile geriye dönük uyumludur.
 */
export function exportToCSV(entries: WeightEntry[], profile?: BackupProfile | null): string {
  let out = "";
  if (profile) {
    out += "Boy (cm),Hedef Kilo (kg)\n";
    out += `${profile.height},${profile.targetWeight}\n\n`;
  }
  out += "Tarih,Kilo (kg)\n";
  out += entries.map((e) => `${e.date},${e.weight}`).join("\n");
  return out;
}

export interface BackupData {
  entries: WeightEntry[];
  profile: BackupProfile | null;
}

/**
 * Yedek CSV'sini ayrıştırır. Hem yeni (profil + kilo) hem eski (yalnızca kilo)
 * formatı desteklenir. Satır sırası/başlıklara karşı toleranslıdır.
 */
export function parseBackupCSV(text: string): BackupData {
  // BOM ve sıfır-genişlik/yönlü karakterleri temizle (Excel/aktarım artıkları)
  const clean = (text || "").replace(/[\uFEFF\u200B\u200E\u200F\u00A0]/g, "");
  const lines = clean
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const entries: WeightEntry[] = [];
  let profile: BackupProfile | null = null;
  let mode: "none" | "profile" | "weight" = "none";
  const seenDates = new Set<string>();
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

  for (const line of lines) {
    const low = line.toLowerCase();

    // Başlık satırları
    if (low.includes("boy") && low.includes("hedef")) {
      mode = "profile";
      continue;
    }
    if (low.includes("tarih") && low.includes("kilo")) {
      mode = "weight";
      continue;
    }

    const parts = line.split(/[;,]/).map((p) => p.trim());
    if (parts.length < 2) continue;

    // Kilo kaydı (ilk sütun YYYY-MM-DD) — başlık olmasa bile yakalanır
    if (dateRegex.test(parts[0])) {
      const w = parseFloat(parts[1].replace(",", "."));
      if (!isNaN(w) && w > 0 && w <= 600 && !seenDates.has(parts[0])) {
        seenDates.add(parts[0]);
        entries.push({
          id: parts[0] + "_" + Math.random().toString(36).substring(2, 11),
          weight: w,
          date: parts[0],
        });
      }
      continue;
    }

    // Profil satırı (iki sayı) — yalnızca profil modunda
    if (mode === "profile") {
      const h = parseInt(parts[0], 10);
      const t = parseFloat(parts[1].replace(",", "."));
      if (!isNaN(h) && !isNaN(t) && h >= 100 && h <= 250 && t >= 20 && t <= 300) {
        profile = { height: h, targetWeight: t };
      }
      continue;
    }
  }

  entries.sort((a, b) => a.date.localeCompare(b.date));
  return { entries, profile };
}

/**
 * Excel (.xlsx/.xls) dosyasını, parseBackupCSV'nin anladığı CSV metnine çevirir.
 * SheetJS dinamik import edilir (ana bundle'ı şişirmemek için, yalnızca gerektiğinde).
 * Tarih hücreleri YYYY-MM-DD'ye normalize edilir.
 * @param data base64 string (native) veya ArrayBuffer (web)
 * @param type "base64" | "array"
 */
export function spreadsheetToCsv(
  data: string | ArrayBuffer | Uint8Array,
  type: "base64" | "array"
): string {
  const wb = XLSX.read(data, { type, cellDates: true });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) return "";
  const sheet = wb.Sheets[sheetName];
  const rows: any[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: true,
    blankrows: true,
    defval: "",
  });

  const fmt = (c: any): string => {
    if (c instanceof Date) {
      const y = c.getFullYear();
      const m = String(c.getMonth() + 1).padStart(2, "0");
      const d = String(c.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }
    return c === null || c === undefined ? "" : String(c);
  };

  return rows.map((r) => (Array.isArray(r) ? r.map(fmt).join(",") : "")).join("\n");
}

export interface ETAResult {
  status: "insufficient_data" | "stable" | "wrong_direction" | "success" | "reached";
  ratePerWeek: number; // kg per week
  weeksRemaining: number;
  etaDate: string; // Locale date string
}

export function calculateETA(
  history: WeightEntry[],
  currentWeight: number,
  targetWeight: number
): ETAResult {
  if (currentWeight === targetWeight) {
    return { status: "reached", ratePerWeek: 0, weeksRemaining: 0, etaDate: "Ulaşıldı!" };
  }

  if (history.length < 2) {
    return { status: "insufficient_data", ratePerWeek: 0, weeksRemaining: 0, etaDate: "Veri yetersiz (En az 2 kayıt gerekir)" };
  }

  const newestEntry = history[history.length - 1];
  let baselineEntry = history[0];
  const newestTime = dayjs(newestEntry.date);
  
  for (let i = history.length - 2; i >= 0; i--) {
    const entryTime = dayjs(history[i].date);
    const diffDays = newestTime.diff(entryTime, 'day');
    if (diffDays >= 7) {
      baselineEntry = history[i];
      break;
    }
  }

  const weightDiff = newestEntry.weight - baselineEntry.weight;
  const timeDiffDays = newestTime.diff(dayjs(baselineEntry.date), 'day');

  if (timeDiffDays <= 0) {
    return { status: "insufficient_data", ratePerWeek: 0, weeksRemaining: 0, etaDate: "Zaman aralığı yetersiz" };
  }

  const kgPerDay = weightDiff / timeDiffDays;
  const ratePerWeek = Number((kgPerDay * 7).toFixed(2));

  if (Math.abs(kgPerDay) < 0.01) {
    return { status: "stable", ratePerWeek: 0, weeksRemaining: 0, etaDate: "Kilonuz sabit seyrediyor." };
  }

  const toLose = currentWeight > targetWeight;
  const losingWeight = kgPerDay < 0;

  if ((toLose && !losingWeight) || (!toLose && losingWeight)) {
    return {
      status: "wrong_direction",
      ratePerWeek,
      weeksRemaining: 0,
      etaDate: "Mevcut eğilim hedefinizle ters yönde.",
    };
  }

  const neededChange = Math.abs(currentWeight - targetWeight);
  const daysRemaining = neededChange / Math.abs(kgPerDay);
  const weeksRemaining = Number((daysRemaining / 7).toFixed(1));

  const eta = dayjs().add(daysRemaining, 'day');

  return {
    status: "success",
    ratePerWeek,
    weeksRemaining,
    etaDate: eta.toDate().toLocaleDateString("tr-TR", { year: "numeric", month: "long", day: "numeric" }),
  };
}

export function calculateStreak(history: WeightEntry[]): number {
  if (history.length === 0) return 0;

  // Create a set of dates that have entries
  const dateSet = new Set(history.map(e => dayjs(e.date).format('YYYY-MM-DD')));
  
  let streak = 0;
  let currentDate = dayjs();
  
  // If no entry today, check if there's one yesterday. If not, streak is 0.
  if (!dateSet.has(currentDate.format('YYYY-MM-DD'))) {
    currentDate = currentDate.subtract(1, 'day');
    if (!dateSet.has(currentDate.format('YYYY-MM-DD'))) {
      return 0;
    }
  }

  // Count backwards continuously
  while (dateSet.has(currentDate.format('YYYY-MM-DD'))) {
    streak++;
    currentDate = currentDate.subtract(1, 'day');
  }

  return streak;
}

// =========================================================================
// RÜTBE SİSTEMİ (Solo Leveling tarzı) — saf, test edilebilir fonksiyonlar
// Tüm sabitler constants/rankConfig.ts'ten gelir. Spec: RUTBE_SISTEMI_V1.md
// =========================================================================

/** Saklanan rütbe durumu. baselineB ilk kayıtta set edilir, SABİT kalır. */
export interface RankState {
  baselineB: number; // İlk kayıttaki kilo. SABİT.
  goalCurrent: number; // Aktif hedef kilo.
  bankedE: number; // = max(0, baselineB - en düşük 7g ort). ≥0, SADECE ARTAR.
  rp: number; // Rank Points. SADECE ARTAR (ratchet).
  consistencyXP: number; // Davranış XP'si (ömür boyu; rütbede min(.,CAP)).
  current7dAvg: number; // Güncel 7 günlük ortalama.
  prev7dAvg: number; // ~7 kayıt önceki 7g ort. (momentum için).
  lastProgressDate: string; // bankedE'nin en son arttığı tarih (donma/uyku sayacı).
  streakCount: number;
  lastLogDate: string; // En son kilo kaydının tarihi (günlük XP guard'ı).
  comebackArmed: boolean; // Uykudan çıkınca bir sonraki ilerlemeyi 2x'ler.
  questDoneDate: string; // Günlük görevin tamamlandığı tarih (1/gün guard'ı).
}

export interface RankResult {
  key: RankKey;
  name: string;
  barPct: number; // Görsel hedef ilerlemesi (%), aktif hedefe göre.
  maintenance: boolean;
  xp: number; // Rütbede kullanılan (tavanlı) XP.
  rp: number;
}

/** İki YYYY-MM-DD tarihi arasındaki gün farkı (b - a). */
export function daysBetween(a: string, b: string): number {
  if (!a || !b) return 0;
  return dayjs(b).startOf("day").diff(dayjs(a).startOf("day"), "day");
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/** baselineB - goal mesafesi (sıfıra bölme korumalı). */
export function rankDistance(baselineB: number, goalCurrent: number): number {
  return Math.max(DISTANCE_FLOOR, baselineB - goalCurrent);
}

/**
 * Bir seri uzunluğunun TAM olarak bir kilometre taşına denk gelmesi halinde
 * verilecek ek XP (her taş 1 kez). Aksi halde 0.
 */
export function streakMilestoneXP(streak: number): number {
  const hit = STREAK_MILESTONES.find((m) => m.days === streak);
  return hit ? hit.xp : 0;
}

/**
 * RÜTBE HESABI (RUTBE_SISTEMI_V1.md §5). Saf fonksiyon.
 * Rütbe = hem xpReq hem rpReq sağlanan en yüksek satır.
 */
export function computeRank(d: RankState): RankResult {
  const distance = rankDistance(d.baselineB, d.goalCurrent);
  const barPct = clamp((d.bankedE / distance) * 100, 0, 100);
  const xp = Math.min(d.consistencyXP, XP.CAP);
  const rp = d.rp;

  // Bakım Modu kontrolü (en üstte): gerçek ilerleme var + hedefe ulaşıldı.
  if (d.bankedE > 0 && d.current7dAvg > 0 && d.current7dAvg <= d.goalCurrent + MAINTENANCE_BAND) {
    return {
      key: MAINTENANCE_RANK.key,
      name: MAINTENANCE_RANK.name,
      barPct: 100,
      maintenance: true,
      xp,
      rp,
    };
  }

  let cur = RANK_TABLE[0];
  for (const r of RANK_TABLE) {
    if (xp >= r.xpReq && rp >= r.rpReq) cur = r;
  }
  return { key: cur.key, name: cur.name, barPct, maintenance: false, xp, rp };
}

export type Momentum = "up" | "flat" | "down";

/**
 * Momentum / İvme (V1 §8) — sadece görsel sinyal, rütbeyi DÜŞÜRMEZ.
 * Hafta-üstü-hafta 7g ortalama farkına bakar.
 */
export function getMomentum(current7dAvg: number, prev7dAvg: number): Momentum {
  if (!prev7dAvg || !current7dAvg) return "flat";
  const wow = current7dAvg - prev7dAvg;
  if (wow < -MOMENTUM.UP) return "up"; // kilo veriyor → hedefe doğru
  if (wow > MOMENTUM.DOWN) return "down"; // uzaklaşıyor
  return "flat";
}

/** Bir tarih için günlük görev (deterministik: gün-no havuz boyutuna göre). */
export function getDailyQuest(dateStr?: string): DailyQuest {
  const d = dateStr ? dayjs(dateStr) : dayjs();
  const idx = d.dayOfYear ? d.dayOfYear() % QUEST_POOL.length : 0;
  return QUEST_POOL[idx >= 0 ? idx : 0];
}

/** current7dAvg ve prev7dAvg'yi tam geçmişten türetir (tek kaynak: moving avg). */
function compute7dPair(history: WeightEntry[]): { current: number; prev: number } {
  if (history.length === 0) return { current: 0, prev: 0 };
  const sorted = [...history].sort(
    (a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf()
  );
  const avg = calculateMovingAverage(sorted, 7);
  const current = avg[avg.length - 1] || 0;
  const prev = avg.length >= 8 ? avg[avg.length - 8] : avg[0] || 0;
  return { current, prev };
}

/**
 * MİGRASYON / İLK KURULUM: mevcut kullanıcı verisinden güvenli RankState türet.
 * Eksik/0 alanlar geçmişten türetilir; path-bağımlı XP yaklaşık hesaplanır.
 * baselineB = en eski kayıt; bankedE = high-water mark (en düşük 7g ort).
 */
export function deriveRankState(
  history: WeightEntry[],
  goalCurrent: number
): RankState {
  const today = dayjs().format("YYYY-MM-DD");

  if (history.length === 0) {
    return {
      baselineB: 0,
      goalCurrent: goalCurrent || 0,
      bankedE: 0,
      rp: 0,
      consistencyXP: 0,
      current7dAvg: 0,
      prev7dAvg: 0,
      lastProgressDate: today,
      streakCount: 0,
      lastLogDate: "",
      comebackArmed: false,
      questDoneDate: "",
    };
  }

  const sorted = [...history].sort(
    (a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf()
  );
  const baselineB = sorted[0].weight;
  const avg = calculateMovingAverage(sorted, 7);
  const minAvg = Math.min(...avg);
  const bankedE = Math.max(0, baselineB - minAvg);
  const { current, prev } = compute7dPair(sorted);

  const dist = rankDistance(baselineB, goalCurrent);
  const rp = clamp((bankedE / dist) * RP_FULL_SCALE, 0, RP_FULL_SCALE);

  // Tutarlılık XP'sini benzersiz kayıt günü sayısından türet + seri taşları.
  const distinctDays = new Set(sorted.map((e) => e.date)).size;
  const streakCount = calculateStreak(sorted);
  const milestoneBonus = STREAK_MILESTONES.filter((m) => streakCount >= m.days).reduce(
    (s, m) => s + m.xp,
    0
  );
  const consistencyXP = distinctDays * XP.LOG + milestoneBonus;

  // lastProgressDate: high-water'a ulaşılan tarihi yaklaşık bul (ilk minAvg).
  let lastProgressDate = sorted[sorted.length - 1].date;
  for (let i = 0; i < sorted.length; i++) {
    if (avg[i] === minAvg) {
      lastProgressDate = sorted[i].date;
      break;
    }
  }

  return {
    baselineB,
    goalCurrent: goalCurrent || baselineB,
    bankedE,
    rp,
    consistencyXP,
    current7dAvg: current,
    prev7dAvg: prev,
    lastProgressDate,
    streakCount,
    lastLogDate: sorted[sorted.length - 1].date,
    comebackArmed: false,
    questDoneDate: "",
  };
}

/**
 * Eksik alanları olan (eski) bir state'i güvenli tamamlar. Mevcut SADECE-ARTAR
 * değerleri (bankedE/rp/consistencyXP) korunur; eksikler geçmişten türetilir.
 */
export function migrateRankState(
  prev: Partial<RankState> | null | undefined,
  history: WeightEntry[],
  goalCurrent: number
): RankState {
  const derived = deriveRankState(history, goalCurrent);
  if (!prev) return derived;

  return {
    // baselineB SABİT: bir kez set edildiyse korunur.
    baselineB: prev.baselineB && prev.baselineB > 0 ? prev.baselineB : derived.baselineB,
    goalCurrent: goalCurrent || prev.goalCurrent || derived.goalCurrent,
    // SADECE-ARTAR alanlar: kayıtlı vs türetilenin büyüğü (ratchet korunur).
    bankedE: Math.max(prev.bankedE ?? 0, derived.bankedE),
    rp: Math.max(prev.rp ?? 0, derived.rp),
    consistencyXP: Math.max(prev.consistencyXP ?? 0, derived.consistencyXP),
    current7dAvg: derived.current7dAvg,
    prev7dAvg: derived.prev7dAvg,
    lastProgressDate: prev.lastProgressDate || derived.lastProgressDate,
    streakCount: derived.streakCount,
    lastLogDate: prev.lastLogDate || derived.lastLogDate,
    comebackArmed: prev.comebackArmed ?? false,
    questDoneDate: prev.questDoneDate || "",
  };
}

/**
 * KAYIT ANINDA GÜNCELLEME (RUTBE_SISTEMI_V1.md §6). Saf: yeni state döndürür.
 * - Banka + RP: high-water mark (idempotent → düzenleme/yeniden hesap güvenli).
 * - Tutarlılık XP: günde 1 kez (donmamışsa). Görev otomatikse +görev XP.
 * - Donma/Uyku/Comeback sayaçları lastProgressDate'e göre.
 *
 * @param history Tüm kilo geçmişi (current7dAvg buradan türetilir).
 * @param goalCurrent Aktif hedef.
 * @param today Gerçek bugünün tarihi (XP/donma/uyku için).
 */
export function applyRankProgress(
  prev: RankState,
  history: WeightEntry[],
  goalCurrent: number,
  today: string
): RankState {
  const sorted = [...history].sort(
    (a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf()
  );
  const d: RankState = { ...prev, goalCurrent };

  // baselineB ilk kayıtta set edilir, sabit kalır.
  if ((!d.baselineB || d.baselineB <= 0) && sorted.length > 0) {
    d.baselineB = sorted[0].weight;
  }

  const { current, prev: prevAvg } = compute7dPair(sorted);
  d.current7dAvg = current;
  d.prev7dAvg = prevAvg;
  d.streakCount = calculateStreak(sorted);

  // --- 1) BANKA + RP (high-water mark) ---
  const progressNow = Math.max(0, d.baselineB - d.current7dAvg);
  if (progressNow > d.bankedE) {
    const delta = progressNow - d.bankedE;
    d.bankedE = progressNow;

    const dist = rankDistance(d.baselineB, d.goalCurrent);
    let gain = delta * (RP_FULL_SCALE / dist);
    if (d.comebackArmed) {
      gain *= DECAY.COMEBACK_MULTIPLIER; // toparlama bonusu (bir kez)
      d.comebackArmed = false;
    }
    d.rp += gain; // ASLA azalmaz
    d.lastProgressDate = today;
  }

  // --- 2) TUTARLILIK XP (donmamışsa, günde 1 kez) ---
  const frozen = daysBetween(d.lastProgressDate, today) > DECAY.FREEZE_DAYS;
  const isNewDay = d.lastLogDate !== today;
  if (!frozen && isNewDay) {
    d.consistencyXP += XP.LOG; // kayıt
    d.consistencyXP += streakMilestoneXP(d.streakCount); // 7/30/100 taşları
  }

  // Otomatik günlük görev (Bugün tartıl): bugün kayıt varsa tamamlanır.
  // isNewDay'den BAĞIMSIZ — ilk kayıtta migration lastLogDate'i bugüne çekince
  // isNewDay false oluyordu ve görev hiç tamamlanmıyordu (questDoneDate guard'ı
  // XP'nin çift sayılmasını önler).
  const quest = getDailyQuest(today);
  const loggedToday = sorted.some((e) => e.date === today);
  if (!frozen && quest.auto && loggedToday && d.questDoneDate !== today) {
    d.consistencyXP += XP.QUEST;
    d.questDoneDate = today;
  }

  d.lastLogDate = today;

  // --- 3) UYKU hazırlığı (45 gün ilerleme yok → bir sonraki ilerleme 2x) ---
  if (daysBetween(d.lastProgressDate, today) > DECAY.SLEEP_DAYS) {
    d.comebackArmed = true;
  }

  return d;
}

/**
 * Manuel günlük görev tamamlama (Durum sekmesi). Günde 1 kez, donmamışsa +XP.
 * Otomatik (Bugün tartıl) görevler kayıtla tamamlanır; bu fonksiyon onlara
 * tekrar XP vermez.
 */
export function completeDailyQuest(prev: RankState, today: string): RankState {
  if (prev.questDoneDate === today) return prev; // zaten yapıldı
  const frozen = daysBetween(prev.lastProgressDate, today) > DECAY.FREEZE_DAYS;
  const d: RankState = { ...prev, questDoneDate: today };
  if (!frozen) d.consistencyXP += XP.QUEST;
  return d;
}

/** Durum tipi (donma/uyku) — UI rozetleri için. */
export type RankPhase = "active" | "frozen" | "sleeping";

export function getRankPhase(d: RankState, today: string): RankPhase {
  const gap = daysBetween(d.lastProgressDate, today);
  if (gap > DECAY.SLEEP_DAYS) return "sleeping";
  if (gap > DECAY.FREEZE_DAYS) return "frozen";
  return "active";
}

/**
 * Bir sonraki rütbeye ilerleme (UI çubuğu için). Mevcut rütbeden sonraki
 * satırın xpReq/rpReq'ine göre 0-1 oranlar + eksik miktarlar döndürür.
 */
export function getNextRankProgress(d: RankState): {
  next: { key: RankKey; name: string } | null;
  xpPct: number; // 0-1
  rpPct: number; // 0-1
  xpNeed: number; // bir sonraki için kalan XP
  rpNeed: number; // bir sonraki için kalan RP
} {
  const cur = computeRank(d);
  if (cur.maintenance) {
    return { next: null, xpPct: 1, rpPct: 1, xpNeed: 0, rpNeed: 0 };
  }

  const curIdx = RANK_TABLE.findIndex((r) => r.key === cur.key);
  const next = RANK_TABLE[curIdx + 1];
  if (!next) {
    return { next: null, xpPct: 1, rpPct: 1, xpNeed: 0, rpNeed: 0 };
  }

  const curRow = RANK_TABLE[curIdx];
  const xp = Math.min(d.consistencyXP, XP.CAP);
  const xpSpan = Math.max(1, next.xpReq - curRow.xpReq);
  const rpSpan = Math.max(1, next.rpReq - curRow.rpReq);
  const xpPct = clamp((xp - curRow.xpReq) / xpSpan, 0, 1);
  const rpPct = clamp((d.rp - curRow.rpReq) / rpSpan, 0, 1);

  return {
    next: { key: next.key, name: next.name },
    xpPct,
    rpPct,
    xpNeed: Math.max(0, next.xpReq - xp),
    rpNeed: Math.max(0, next.rpReq - d.rp),
  };
}
