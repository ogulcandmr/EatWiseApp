// Utility fonksiyonları

// Kalori hesaplama fonksiyonları
export const calculateBMR = (weight: number, height: number, age: number, gender: 'male' | 'female'): number => {
  if (gender === 'male') {
    return 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
  } else {
    return 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
  }
};

export const calculateTDEE = (bmr: number, activityLevel: 'low' | 'moderate' | 'high'): number => {
  const multipliers = {
    low: 1.2,
    moderate: 1.55,
    high: 1.725
  };
  return bmr * multipliers[activityLevel];
};

export const calculateGoalCalories = (tdee: number, goal: 'weight_loss' | 'weight_gain' | 'maintenance' | 'muscle_gain'): number => {
  const adjustments = {
    weight_loss: -500, // 500 kalori açığı
    weight_gain: 300,  // 300 kalori fazlası
    maintenance: 0,    // Değişiklik yok
    muscle_gain: 200   // 200 kalori fazlası
  };
  return tdee + adjustments[goal];
};

// BMI hesaplama
export const calculateBMI = (weight: number, height: number): number => {
  const heightInMeters = height / 100;
  return weight / (heightInMeters * heightInMeters);
};

export const getBMICategory = (bmi: number): string => {
  if (bmi < 18.5) return 'Zayıf';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Fazla Kilolu';
  return 'Obez';
};

// Makro hesaplama
export const calculateMacros = (calories: number, goal: string) => {
  let proteinRatio, carbRatio, fatRatio;

  switch (goal) {
    case 'muscle_gain':
      proteinRatio = 0.3;
      carbRatio = 0.45;
      fatRatio = 0.25;
      break;
    case 'weight_loss':
      proteinRatio = 0.35;
      carbRatio = 0.35;
      fatRatio = 0.30;
      break;
    default:
      proteinRatio = 0.25;
      carbRatio = 0.50;
      fatRatio = 0.25;
  }

  return {
    protein: Math.round((calories * proteinRatio) / 4), // 1g protein = 4 kalori
    carbs: Math.round((calories * carbRatio) / 4),      // 1g karbonhidrat = 4 kalori
    fat: Math.round((calories * fatRatio) / 9)          // 1g yağ = 9 kalori
  };
};

// Tarih formatları
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const getRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) return 'Şimdi';
  if (diffInMinutes < 60) return `${diffInMinutes} dakika önce`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} saat önce`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} gün önce`;
};

// Validasyon fonksiyonları
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Şifre en az 8 karakter olmalıdır');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Şifre en az bir büyük harf içermelidir');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Şifre en az bir küçük harf içermelidir');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Şifre en az bir rakam içermelidir');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Besin değeri hesaplama
export const calculateNutrition = (foods: any[]): any => {
  return foods.reduce((total, food) => ({
    calories: total.calories + food.calories,
    protein: total.protein + food.protein,
    carbs: total.carbs + food.carbs,
    fat: total.fat + food.fat,
    fiber: total.fiber + (food.fiber || 0),
    sugar: total.sugar + (food.sugar || 0),
    sodium: total.sodium + (food.sodium || 0)
  }), {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0
  });
};

// Su tüketimi hesaplama
export const calculateWaterGoal = (weight: number, activityLevel: string): number => {
  const baseWater = weight * 35; // ml per kg
  const activityMultiplier = activityLevel === 'high' ? 1.2 : activityLevel === 'moderate' ? 1.1 : 1.0;
  return Math.round(baseWater * activityMultiplier);
};

// Hedef ilerlemesi hesaplama
export const calculateProgress = (current: number, target: number): number => {
  if (target === 0) return 0;
  return Math.min(Math.round((current / target) * 100), 100);
};

// Rastgele motivasyon mesajları
export const getMotivationalMessage = (): string => {
  const messages = [
    "Harika gidiyorsun! 💪",
    "Hedeflerine bir adım daha yaklaştın! 🎯",
    "Bugün de sağlıklı seçimler yapıyorsun! 🌟",
    "Su içmeyi unutma! 💧",
    "Protein alımını artırmaya devam et! 🥩",
    "Egzersiz yapmayı unutma! 🏃‍♂️",
    "Kalori hedefini yaklaşıyorsun! 🔥",
    "Sağlıklı beslenme yolculuğunda harikasın! 🌈"
  ];
  
  return messages[Math.floor(Math.random() * messages.length)];
};
