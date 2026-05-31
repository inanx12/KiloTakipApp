import AsyncStorage from "@react-native-async-storage/async-storage";
import dayjs from "dayjs";

// Storage keys namespace
const STORAGE_KEYS = {
  WEIGHT_HISTORY: "@kilotakip:weight_history",
  USER_PROFILE: "@kilotakip:user_profile",
};

export interface WeightEntry {
  id: string;
  weight: number;
  date: string; // YYYY-MM-DD
}

export interface UserProfile {
  height: number; // cm
  targetWeight: number; // kg
}

/**
 * Fetch all weight records and sort them chronologically (oldest to newest)
 */
export async function getWeightHistory(): Promise<WeightEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.WEIGHT_HISTORY);
    if (!raw) return [];
    const entries: WeightEntry[] = JSON.parse(raw);
    return entries.sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf());
  } catch (e) {
    console.error("Error fetching weight history:", e);
    return [];
  }
}

/**
 * Save weight entry. If an entry with the exact date (YYYY-MM-DD) exists, it is overwritten.
 */
export async function saveWeightEntry(weight: number, dateStr?: string): Promise<WeightEntry[]> {
  try {
    const finalDate = dateStr || dayjs().format("YYYY-MM-DD");
    const entries = await getWeightHistory();

    const existingIndex = entries.findIndex((e) => e.date === finalDate);
    if (existingIndex !== -1) {
      // Overwrite existing record for today
      entries[existingIndex].weight = weight;
    } else {
      // Create new record
      entries.push({
        id: finalDate + "_" + Math.random().toString(36).substring(2, 11),
        weight,
        date: finalDate,
      });
    }

    const sorted = entries.sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf());
    await AsyncStorage.setItem(STORAGE_KEYS.WEIGHT_HISTORY, JSON.stringify(sorted));
    return sorted;
  } catch (e) {
    console.error("Error saving weight entry:", e);
    return [];
  }
}

/**
 * Delete a weight entry by its ID
 */
export async function deleteWeightEntry(id: string): Promise<WeightEntry[]> {
  try {
    const entries = await getWeightHistory();
    const filtered = entries.filter((e) => e.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.WEIGHT_HISTORY, JSON.stringify(filtered));
    return filtered;
  } catch (e) {
    console.error("Error deleting weight entry:", e);
    return [];
  }
}

/**
 * Fetch the user's profile details
 */
export async function getProfile(): Promise<UserProfile | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error("Error fetching profile:", e);
    return null;
  }
}

/**
 * Save the user's profile details
 */
export async function saveProfile(height: number, targetWeight: number): Promise<UserProfile> {
  try {
    const profile: UserProfile = { height, targetWeight };
    await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
    return profile;
  } catch (e) {
    console.error("Error saving profile:", e);
    return { height, targetWeight };
  }
}

/**
 * Wipe all weight records and profile configuration
 */
export async function clearAllData(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.WEIGHT_HISTORY);
    await AsyncStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
  } catch (e) {
    console.error("Error resetting AsyncStorage:", e);
  }
}

/**
 * Yedekten geri yükle. Kilo kayıtları mevcutla TARİHE GÖRE birleştirilir
 * (aynı tarih varsa yedek değeri kazanır). Profil verilmişse kaydedilir.
 * Döndürür: birleşmiş toplam kayıt sayısı ve profilin yüklenip yüklenmediği.
 */
export async function importBackup(
  entries: WeightEntry[],
  profile: UserProfile | null
): Promise<{ totalEntries: number; profileImported: boolean }> {
  try {
    const existing = await getWeightHistory();
    const byDate = new Map<string, WeightEntry>();
    for (const e of existing) byDate.set(e.date, e);
    for (const e of entries) byDate.set(e.date, e); // yedek çakışmada kazanır

    const merged = Array.from(byDate.values()).sort(
      (a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf()
    );
    await AsyncStorage.setItem(STORAGE_KEYS.WEIGHT_HISTORY, JSON.stringify(merged));

    let profileImported = false;
    if (profile && profile.height > 0 && profile.targetWeight > 0) {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
      profileImported = true;
    }

    return { totalEntries: merged.length, profileImported };
  } catch (e) {
    console.error("Error importing backup:", e);
    return { totalEntries: 0, profileImported: false };
  }
}
