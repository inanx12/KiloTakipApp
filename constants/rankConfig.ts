/**
 * RÜTBE SİSTEMİ — TEK AYAR DOSYASI (V1)
 * =====================================
 * Solo Leveling tarzı rütbe sisteminin TÜM ayarlanabilir sabitleri burada.
 * `helpers.ts` içindeki computeRank / applyRankProgress / momentum vb. bu
 * dosyayı import eder; sayıyı fonksiyon içine GÖMME — kalibrasyon tek yerden.
 *
 * Tam spec: RUTBE_SISTEMI_V1.md (formüller, test senaryoları S1-S6).
 * V1 varsayımı: kilo VERME yolculuğu (hedef < başlangıç).
 */

// --- 1) Tutarlılık XP ekonomisi (davranış) -------------------------------
export const XP = {
  /** Günlük kilo kaydı (gün başına 1 kez). */
  LOG: 10,
  /** Günlük görev tamamlama (gün başına 1 kez). */
  QUEST: 15,
  /** Rütbe hesabında kullanılan XP tavanı (tutarlılık C'de tavanlanır). */
  CAP: 600,
} as const;

/**
 * Seri kilometre taşları — her ulaşımda 1 kez verilir.
 * gün sayısı -> ek XP. computeRank/applyRankProgress streak'i bununla ödüllendirir.
 */
export const STREAK_MILESTONES: { days: number; xp: number }[] = [
  { days: 7, xp: 30 },
  { days: 30, xp: 75 },
  { days: 100, xp: 150 },
];

// --- 2) Rütbe tablosu (V1 ana tablo) -------------------------------------
// Rütbe = HEM xpReq HEM rpReq sağlanan en yüksek rütbe.
// xpReq 600'de sabit çünkü tutarlılık C'de tavanlanır; B/A/S farkı RP'dir.
export type RankKey = "E" | "D" | "C" | "B" | "A" | "S" | "MUHAFIZ";

export interface RankRow {
  key: RankKey;
  name: string; // Avcı teması
  xpReq: number;
  rpReq: number;
  meaning: string;
}

export const RANK_TABLE: RankRow[] = [
  { key: "E", name: "Uyanan", xpReq: 0, rpReq: 0, meaning: "Başlangıç" },
  { key: "D", name: "Avcı", xpReq: 150, rpReq: 0, meaning: "~6 gün tutarlılık" },
  { key: "C", name: "Kıdemli Avcı", xpReq: 600, rpReq: 0, meaning: "Davranış tavanı" },
  { key: "B", name: "Elit Avcı", xpReq: 600, rpReq: 25, meaning: "Yolun %25'i" },
  { key: "A", name: "Usta Avcı", xpReq: 600, rpReq: 55, meaning: "Yolun %55'i" },
  { key: "S", name: "Hükümdar", xpReq: 600, rpReq: 90, meaning: "Yolun %90'ı" },
];

/** Bakım Modu (hedefe ulaşıldı) — tablo dışı, ayrı sakin sınıf. */
export const MAINTENANCE_RANK: { key: RankKey; name: string } = {
  key: "MUHAFIZ",
  name: "Muhafız",
};

// --- 3) Donma / Uyku / Comeback ------------------------------------------
export const DECAY = {
  /** Bu kadar gün yeni ilerleme olmazsa tutarlılık XP'si artmayı durdurur. */
  FREEZE_DAYS: 30,
  /** Bu kadar gün yeni ilerleme olmazsa "⏸ Durağan" + comeback hazırlanır. */
  SLEEP_DAYS: 45,
  /** Uykudan sonraki ilk ilerlemenin RP çarpanı (bir kez). */
  COMEBACK_MULTIPLIER: 2,
} as const;

// --- 4) Bakım modu & momentum bantları -----------------------------------
/** current7dAvg <= goal + bu bant ise hedefe ulaşılmış sayılır (kg). */
export const MAINTENANCE_BAND = 0.5;

/**
 * Momentum (hafta-üstü-hafta 7g ort. farkı) eşikleri (kg).
 * fark < -UP  -> "up" (hedefe doğru), fark > DOWN -> "down" (uzaklaşıyor).
 */
export const MOMENTUM = {
  UP: 0.1,
  DOWN: 0.1,
} as const;

// --- 5) Sıfıra bölme koruması --------------------------------------------
/** baselineB - goal mesafesinin alabileceği en küçük değer (kg). */
export const DISTANCE_FLOOR = 0.1;

// --- 6) RP ölçeği ---------------------------------------------------------
/** bankedE deltası RP'ye çevrilirken kullanılan tam-yol puanı. */
export const RP_FULL_SCALE = 100;

// --- 7) Günlük görev havuzu (1/gün, rastgele) ----------------------------
// "auto: true" => kilo kaydedilince otomatik tamamlanır (Bugün tartıl).
// Diğerleri Durum sekmesinden manuel "Tamamla" ile +XP verir.
// Hepsi davranış/sağlık temelli — asla "şu kadar ye/yeme" değil.
export interface DailyQuest {
  id: string;
  title: string;
  detail: string;
  auto: boolean;
}

export const QUEST_POOL: DailyQuest[] = [
  { id: "weigh_in", title: "Bugün tartıl", detail: "Günün kilonu kaydet.", auto: true },
  { id: "weekly_avg", title: "Haftalık ortalamana bak", detail: "7 günlük ortalamanı incele.", auto: false },
  { id: "goal_check", title: "Hedef ilerlemeni kontrol et", detail: "Hedefe ne kadar yaklaştığına bak.", auto: false },
  { id: "compare_yesterday", title: "Dünkü kilonla karşılaştır", detail: "Dünden bugüne değişimi gözden geçir.", auto: false },
  { id: "inspect_chart", title: "Grafiğini incele", detail: "Kilo grafiğindeki eğilimi izle.", auto: false },
];
