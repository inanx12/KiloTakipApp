import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

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
  if (bmi <= 0) return { category: "Belirtilmemiş", color: "text-dark-subtext", description: "Lütfen profilinizi güncelleyin." };
  if (bmi < 18.5) {
    return { category: "Zayıf", color: "#00F0FF", description: "Boyunuza göre kilonuz düşük. Dengeli beslenmeye özen gösterin." };
  } else if (bmi < 25.0) {
    return { category: "Normal", color: "#00FF87", description: "Tebrikler! Kilonuz boyunuz için son derece sağlıklı bir aralıkta." };
  } else if (bmi < 30.0) {
    return { category: "Fazla Kilolu", color: "#BF55EC", description: "İdeal kilonuzun biraz üzerindesiniz. Egzersiz ve beslenmeye dikkat edebilirsiniz." };
  } else {
    return { category: "Obez", color: "#FF3B30", description: "Sağlık risklerini azaltmak için beslenme uzmanı yardımı almanız önerilir." };
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

export function exportToCSV(entries: WeightEntry[]): string {
  const header = "Tarih,Kilo (kg)\n";
  const rows = entries
    .map((e) => `${e.date},${e.weight}`)
    .join("\n");
  return header + rows;
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
