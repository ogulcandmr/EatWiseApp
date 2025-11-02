/**
 * Sağlık hesaplamaları için yardımcı fonksiyonlar
 * BMR (Basal Metabolic Rate) ve TDEE (Total Daily Energy Expenditure) hesaplamaları
 */

export interface BMRCalculationParams {
  weight: number; // kg
  height: number; // cm
  age: number; // yıl
  gender: 'male' | 'female';
}

export interface TDEECalculationParams extends BMRCalculationParams {
  activityLevel: 'low' | 'moderate' | 'high';
}

export interface CalorieGoalParams extends TDEECalculationParams {
  goal: 'weight_loss' | 'weight_gain' | 'maintenance' | 'muscle_gain';
}

export interface HealthMetrics {
  bmr: number;
  tdee: number;
  dailyCalorieGoal: number;
  bmi: number;
  bmiCategory: string;
  proteinGoal: number; // gram
  carbsGoal: number; // gram
  fatGoal: number; // gram
}

/**
 * Mifflin-St Jeor formülü ile BMR hesaplama
 * Erkek: BMR = (10 × kilo) + (6.25 × boy) - (5 × yaş) + 5
 * Kadın: BMR = (10 × kilo) + (6.25 × boy) - (5 × yaş) - 161
 */
export function calculateBMR(params: BMRCalculationParams): number {
  const { weight, height, age, gender } = params;
  
  const baseBMR = (10 * weight) + (6.25 * height) - (5 * age);
  
  if (gender === 'male') {
    return Math.round(baseBMR + 5);
  } else {
    return Math.round(baseBMR - 161);
  }
}

/**
 * Harris-Benedict formülü ile BMR hesaplama (alternatif)
 * Erkek: BMR = 88.362 + (13.397 × kilo) + (4.799 × boy) - (5.677 × yaş)
 * Kadın: BMR = 447.593 + (9.247 × kilo) + (3.098 × boy) - (4.330 × yaş)
 */
export function calculateBMRHarrisBenedict(params: BMRCalculationParams): number {
  const { weight, height, age, gender } = params;
  
  if (gender === 'male') {
    return Math.round(88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age));
  } else {
    return Math.round(447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age));
  }
}

/**
 * Aktivite seviyesine göre çarpan değerleri
 */
const ACTIVITY_MULTIPLIERS = {
  low: 1.2,      // Hareketsiz (ofis işi, az veya hiç egzersiz)
  moderate: 1.55, // Orta aktif (haftada 3-5 gün egzersiz)
  high: 1.725    // Çok aktif (haftada 6-7 gün egzersiz veya fiziksel iş)
};

/**
 * TDEE (Total Daily Energy Expenditure) hesaplama
 * TDEE = BMR × Aktivite Çarpanı
 */
export function calculateTDEE(params: TDEECalculationParams): number {
  const bmr = calculateBMR(params);
  const multiplier = ACTIVITY_MULTIPLIERS[params.activityLevel];
  
  return Math.round(bmr * multiplier);
}

/**
 * Hedefe göre günlük kalori hedefi hesaplama
 */
export function calculateDailyCalorieGoal(params: CalorieGoalParams): number {
  const tdee = calculateTDEE(params);
  
  switch (params.goal) {
    case 'weight_loss':
      // Kilo verme: TDEE'den %20 eksik (sağlıklı kilo kaybı)
      return Math.round(tdee * 0.8);
    
    case 'weight_gain':
      // Kilo alma: TDEE'den %10 fazla
      return Math.round(tdee * 1.1);
    
    case 'muscle_gain':
      // Kas yapma: TDEE'den %15 fazla (protein ağırlıklı)
      return Math.round(tdee * 1.15);
    
    case 'maintenance':
    default:
      // Koruma: TDEE
      return tdee;
  }
}

/**
 * BMI (Body Mass Index) hesaplama
 * BMI = kilo (kg) / (boy (m))²
 */
export function calculateBMI(weight: number, height: number): number {
  const heightInMeters = height / 100;
  return Math.round((weight / (heightInMeters * heightInMeters)) * 10) / 10;
}

/**
 * BMI kategorisi belirleme
 */
export function getBMICategory(bmi: number): string {
  if (bmi < 18.5) return 'Zayıf';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Fazla Kilolu';
  return 'Obez';
}

/**
 * Makro besin hedeflerini hesaplama
 * Protein: 25-30% kalori
 * Karbonhidrat: 45-50% kalori
 * Yağ: 20-25% kalori
 */
export function calculateMacroGoals(
  dailyCalories: number,
  goal: 'weight_loss' | 'weight_gain' | 'maintenance' | 'muscle_gain'
): { protein: number; carbs: number; fat: number } {
  let proteinPercent = 0.25;
  let carbsPercent = 0.50;
  let fatPercent = 0.25;
  
  // Hedefe göre makro oranlarını ayarla
  if (goal === 'muscle_gain') {
    proteinPercent = 0.30; // Daha fazla protein
    carbsPercent = 0.45;
    fatPercent = 0.25;
  } else if (goal === 'weight_loss') {
    proteinPercent = 0.30; // Kas kaybını önlemek için protein
    carbsPercent = 0.40;
    fatPercent = 0.30;
  }
  
  // Kalori → gram dönüşümü
  // Protein: 4 kcal/g, Karbonhidrat: 4 kcal/g, Yağ: 9 kcal/g
  return {
    protein: Math.round((dailyCalories * proteinPercent) / 4),
    carbs: Math.round((dailyCalories * carbsPercent) / 4),
    fat: Math.round((dailyCalories * fatPercent) / 9)
  };
}

/**
 * Tüm sağlık metriklerini hesaplama
 */
export function calculateAllHealthMetrics(params: CalorieGoalParams): HealthMetrics {
  const bmr = calculateBMR(params);
  const tdee = calculateTDEE(params);
  const dailyCalorieGoal = calculateDailyCalorieGoal(params);
  const bmi = calculateBMI(params.weight, params.height);
  const bmiCategory = getBMICategory(bmi);
  const macros = calculateMacroGoals(dailyCalorieGoal, params.goal);
  
  return {
    bmr,
    tdee,
    dailyCalorieGoal,
    bmi,
    bmiCategory,
    proteinGoal: macros.protein,
    carbsGoal: macros.carbs,
    fatGoal: macros.fat
  };
}

/**
 * İdeal kilo aralığı hesaplama (BMI 18.5-25 arası)
 */
export function calculateIdealWeightRange(height: number): { min: number; max: number } {
  const heightInMeters = height / 100;
  const minWeight = Math.round(18.5 * heightInMeters * heightInMeters);
  const maxWeight = Math.round(25 * heightInMeters * heightInMeters);
  
  return { min: minWeight, max: maxWeight };
}

/**
 * Su ihtiyacı hesaplama (ml)
 * Genel kural: Kilo × 30-35 ml
 */
export function calculateWaterIntake(weight: number, activityLevel: 'low' | 'moderate' | 'high'): number {
  let multiplier = 30;
  
  if (activityLevel === 'moderate') multiplier = 35;
  if (activityLevel === 'high') multiplier = 40;
  
  return Math.round(weight * multiplier);
}
