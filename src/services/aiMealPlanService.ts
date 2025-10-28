import { ENV } from '../config/env';
import { DietPlan, MealPlan } from './planService';
import { UserProfile } from '../types/types';

export interface MealPlanRequest {
  userProfile: UserProfile;
  goal: 'weight_loss' | 'weight_gain' | 'maintenance' | 'muscle_gain';
  duration: number; // days
  preferences?: string[];
  allergies?: string[];
  restrictions?: string[];
}

export interface GeneratedMealPlan {
  name: string;
  description: string;
  goal: 'weight_loss' | 'weight_gain' | 'maintenance' | 'muscle_gain';
  duration: number;
  daily_calories: number;
  daily_protein: number;
  daily_carbs: number;
  daily_fat: number;
  weekly_plan: {
    [key: string]: {
      breakfast: MealPlan[];
      lunch: MealPlan[];
      dinner: MealPlan[];
      snacks: MealPlan[];
    };
  };
}

export class AIMealPlanService {
  private static readonly GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

  /**
   * AI ile kişiselleştirilmiş meal plan oluştur
   */
  static async generateMealPlan(request: MealPlanRequest): Promise<GeneratedMealPlan> {
    // API key kontrolü
    if (!ENV.GROQ_API_KEY || ENV.GROQ_API_KEY === 'your_groq_api_key_here') {
      console.log('Groq API key bulunamadı, fallback meal plan kullanılıyor');
      return this.getFallbackMealPlan(request);
    }

    try {
      const systemPrompt = this.createSystemPrompt(request);
      const userPrompt = this.createUserPrompt(request);

      const response = await fetch(this.GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ENV.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_tokens: 2000,
          temperature: 0.7,
          response_format: { type: 'json_object' }
        }),
      });

      if (!response.ok) {
        console.error('AI Meal Plan API Hatası:', response.status);
        return this.getFallbackMealPlan(request);
      }

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content?.trim();
      
      if (!aiResponse) {
        console.log('AI yanıtı boş, fallback kullanılıyor');
        return this.getFallbackMealPlan(request);
      }

      try {
        const parsedPlan = JSON.parse(aiResponse);
        console.log('✅ AI Meal Plan oluşturuldu');
        return parsedPlan;
      } catch (parseError) {
        console.error('AI yanıtı parse edilemedi:', parseError);
        return this.getFallbackMealPlan(request);
      }

    } catch (error: any) {
      console.error('AI Meal Plan hatası:', error.message);
      return this.getFallbackMealPlan(request);
    }
  }

  /**
   * AI için system prompt oluştur
   */
  private static createSystemPrompt(request: MealPlanRequest): string {
    const { userProfile } = request;
    
    return `Sen bir uzman beslenme danışmanısın ve kişiselleştirilmiş meal plan oluşturuyorsun. 

GÖREV: Kullanıcının profili ve hedeflerine göre ${request.duration} günlük detaylı, uygulanabilir meal plan oluştur.

TEMEL KURALLAR:
1. Türk mutfağını ve yerel malzemeleri tercih et
2. Mevsimsel ve taze ürünleri kullan
3. Kalori ve makro besin değerlerini hassas hesapla
4. Çeşitli ve dengeli öğünler öner
5. Pratik ve uygulanabilir tarifler ver
6. Kullanıcının yaşam tarzına uygun öneriler sun
7. JSON formatında yanıt ver

BESLENME PRENSİPLERİ:
- Kahvaltı: Günlük kalorinin %25'i, yüksek protein
- Öğle: Günlük kalorinin %35'i, dengeli makrolar
- Akşam: Günlük kalorinin %30'u, hafif ve sindirilebilir
- Ara öğün: Günlük kalorinin %10'u, sağlıklı atıştırmalık

ÖZEL DURUMLAR:
${userProfile.allergies && userProfile.allergies.length > 0 ? `- ALERJİLER: ${userProfile.allergies.join(', ')} - Bu besinleri KESİNLİKLE kullanma!` : ''}
${request.restrictions && request.restrictions.length > 0 ? `- KISITLAMALAR: ${request.restrictions.join(', ')} - Bu besinlerden kaçın` : ''}
${request.preferences && request.preferences.length > 0 ? `- TERCİHLER: ${request.preferences.join(', ')} - Bu besinleri öncelikle kullan` : ''}

JSON YAPISI (ZORUNLU):
{
  "name": "Plan adı",
  "description": "Plan açıklaması ve faydaları",
  "goal": "Hedef",
  "duration": günSayısı,
  "daily_calories": günlükKalori,
  "daily_protein": günlükProtein,
  "daily_carbs": günlükKarbonhidrat,
  "daily_fat": günlükYağ,
  "weekly_plan": {
    "monday": {
      "breakfast": [{"id": "unique_id", "name": "Öğün adı", "description": "Detaylı açıklama", "calories": 0, "protein": 0, "carbs": 0, "fat": 0, "ingredients": ["malzeme1", "malzeme2"], "instructions": ["adım1", "adım2"]}],
      "lunch": [...],
      "dinner": [...],
      "snacks": [...]
    },
    "tuesday": {...},
    "wednesday": {...},
    "thursday": {...},
    "friday": {...},
    "saturday": {...},
    "sunday": {...}
  }
}

Her öğün için:
- Benzersiz ID ekle
- Detaylı malzeme listesi ver
- Adım adım hazırlama talimatları ekle
- Kalori ve makro değerleri hassas hesapla
- Toplam günlük değerler hedefle tam uyumlu olsun`;
  }

  /**
   * AI için user prompt oluştur
   */
  private static createUserPrompt(request: MealPlanRequest): string {
    const { userProfile, goal, duration, preferences, allergies, restrictions } = request;
    
    // BMR ve günlük kalori ihtiyacını hesapla
    const bmr = this.calculateBMR(userProfile);
    const dailyCalories = this.adjustCaloriesForGoal(bmr, goal);
    
    let prompt = `Kişiselleştirilmiş ${duration} günlük meal plan oluştur:

KULLANICI PROFİLİ:
- Yaş: ${userProfile.age || 25}
- Cinsiyet: ${userProfile.gender === 'female' ? 'kadın' : 'erkek'}
- Kilo: ${userProfile.weight || 70} kg
- Boy: ${userProfile.height || 170} cm
- Aktivite Seviyesi: ${this.getActivityLevelText(userProfile.activityLevel || 'moderate')}
- BMR (Bazal Metabolizma): ${Math.round(bmr)} kalori
- Günlük Kalori İhtiyacı: ${Math.round(dailyCalories)} kalori
- Hedef: ${this.getGoalText(goal)}

HEDEF DETAYLARI VE STRATEJİ:
${this.getGoalStrategy(goal, dailyCalories)}

BESLENME HEDEFLERİ:
- Günlük Kalori: ${Math.round(dailyCalories)} kcal
- Protein: ${Math.round(dailyCalories * 0.25 / 4)}g (${Math.round(dailyCalories * 0.25)} kcal - %25)
- Karbonhidrat: ${Math.round(dailyCalories * 0.45 / 4)}g (${Math.round(dailyCalories * 0.45)} kcal - %45)
- Yağ: ${Math.round(dailyCalories * 0.30 / 9)}g (${Math.round(dailyCalories * 0.30)} kcal - %30)`;

    if (preferences && preferences.length > 0) {
      prompt += `\n\nBESİN TERCİHLERİ: ${preferences.join(', ')} - Bu besinleri öncelikle kullan ve çeşitlendir`;
    }

    if (allergies && allergies.length > 0) {
      prompt += `\n\n⚠️ ALERJİLER: ${allergies.join(', ')} - Bu besinleri KESİNLİKLE kullanma ve alternatiflerini öner!`;
    }

    if (restrictions && restrictions.length > 0) {
      prompt += `\n\nDİYET KISITLAMALARI: ${restrictions.join(', ')} - Bu kısıtlamalara uygun alternatifler sun`;
    }

    prompt += `\n\nÖZEL TALİMATLAR:
1. Her öğün için pratik ve uygulanabilir tarifler ver
2. Türk mutfağından örnekler kullan
3. Mevsimsel ve ekonomik malzemeler tercih et
4. Hazırlama süreleri 30 dakikayı geçmesin
5. Her öğün için detaylı malzeme listesi ve adım adım tarif ver
6. Kalori ve makro hesaplamalarını hassas yap
7. Günler arası çeşitlilik sağla
8. Pratik ara öğünler öner

Lütfen yukarıdaki tüm bilgileri dikkate alarak detaylı, uygulanabilir ve kişiselleştirilmiş meal plan oluştur. JSON formatında yanıt ver.`;

    return prompt;
  }

  /**
   * Aktivite seviyesi açıklaması
   */
  private static getActivityLevelText(level: string): string {
    switch (level) {
      case 'low': return 'Düşük (Sedanter yaşam, az hareket)';
      case 'moderate': return 'Orta (Haftada 3-4 gün egzersiz)';
      case 'high': return 'Yüksek (Günlük egzersiz, aktif yaşam)';
      default: return 'Orta';
    }
  }

  /**
   * Hedef açıklaması
   */
  private static getGoalText(goal: 'weight_loss' | 'weight_gain' | 'maintenance' | 'muscle_gain'): string {
    switch (goal) {
      case 'weight_loss': return 'Sağlıklı Kilo Verme';
      case 'weight_gain': return 'Sağlıklı Kilo Alma';
      case 'maintenance': return 'Kilo Koruma';
      case 'muscle_gain': return 'Kas Kazanımı';
      default: return 'Kilo Koruma';
    }
  }

  /**
   * Hedefe özel strateji
   */
  private static getGoalStrategy(goal: 'weight_loss' | 'weight_gain' | 'maintenance' | 'muscle_gain', dailyCalories: number): string {
    switch (goal) {
      case 'weight_loss':
        return `- Sağlıklı kilo verme (haftada 0.5-1 kg)
- Kalori açığı: ${Math.round(dailyCalories * 0.8)} kcal (günlük ihtiyaçtan %20 az)
- Yüksek protein oranı kas kaybını önler
- Lif açısından zengin besinler tokluk sağlar
- Düzenli öğün saatleri metabolizmayı hızlandırır`;
      
      case 'weight_gain':
        return `- Sağlıklı kilo alma (haftada 0.5 kg)
- Kalori fazlası: ${Math.round(dailyCalories * 1.2)} kcal (günlük ihtiyaçtan %20 fazla)
- Kaliteli karbonhidrat ve protein dengesi
- Sık öğün (6 öğün) kas kazanımını destekler
- Sağlıklı yağlar enerji yoğunluğunu artırır`;
      
      case 'maintenance':
        return `- Mevcut kiloyu koruma
- Dengeli kalori alımı: ${Math.round(dailyCalories)} kcal
- Makro besin dengesi (%25 protein, %45 karb, %30 yağ)
- Çeşitli besin gruplarından yararlanma
- Sürdürülebilir beslenme alışkanlıkları`;
      
      case 'muscle_gain':
        return `- Kas kazanımı odaklı beslenme
- Yüksek protein: ${Math.round(dailyCalories * 0.30 / 4)}g (günlük)
- Antrenman öncesi/sonrası beslenme
- Kaliteli karbonhidrat kas glikojenini destekler
- Kreatin açısından zengin besinler (et, balık)`;
      
      default:
        return 'Dengeli ve sağlıklı beslenme';
    }
  }

  /**
   * API olmadığında kullanılacak fallback meal plan
   */
  private static getFallbackMealPlan(request: MealPlanRequest): GeneratedMealPlan {
    const { userProfile, goal, allergies, restrictions, preferences } = request;
    
    // Detaylı kalori hesaplama
    const bmr = this.calculateBMR(userProfile);
    const dailyCalories = this.adjustCaloriesForGoal(bmr, goal);
    
    // Hedefe göre makro oranlarını ayarla
    const macroRatios = this.getMacroRatiosForGoal(goal);
    
    return {
      name: `${this.getGoalText(goal)} Planı`,
      description: `${request.duration} günlük kişiselleştirilmiş beslenme planı. ${userProfile.name || 'Kullanıcı'} için özel olarak hazırlanmış, ${this.getGoalText(goal).toLowerCase()} hedefine uygun beslenme programı.`,
      goal,
      duration: request.duration,
      daily_calories: Math.round(dailyCalories),
      daily_protein: Math.round(dailyCalories * macroRatios.protein / 4),
      daily_carbs: Math.round(dailyCalories * macroRatios.carbs / 4),
      daily_fat: Math.round(dailyCalories * macroRatios.fat / 9),
      weekly_plan: this.generateFallbackWeeklyPlan(
        request.duration, 
        dailyCalories, 
        goal,
        allergies || [],
        restrictions || [],
        preferences || []
      )
    };
  }

  /**
   * Hedefe göre makro besin oranları
   */
  private static getMacroRatiosForGoal(goal: 'weight_loss' | 'weight_gain' | 'maintenance' | 'muscle_gain'): { protein: number; carbs: number; fat: number } {
    switch (goal) {
      case 'weight_loss':
        return { protein: 0.30, carbs: 0.40, fat: 0.30 }; // Yüksek protein
      case 'muscle_gain':
        return { protein: 0.30, carbs: 0.45, fat: 0.25 }; // Yüksek protein, orta karb
      case 'weight_gain':
        return { protein: 0.25, carbs: 0.50, fat: 0.25 }; // Yüksek karbonhidrat
      default: // maintenance
        return { protein: 0.25, carbs: 0.45, fat: 0.30 }; // Dengeli
    }
  }

  /**
   * BMR hesaplama (Mifflin-St Jeor formülü)
   */
  private static calculateBMR(profile: UserProfile): number {
    const weight = profile.weight || 70;
    const height = profile.height || 170;
    const age = profile.age || 25;
    const gender = profile.gender || 'male';

    let bmr: number;
    if (gender === 'male') {
      bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
    } else {
      bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
    }

    // Aktivite seviyesi çarpanı
    const activityMultipliers = {
      low: 1.2,
      moderate: 1.55,
      high: 1.725
    };

    const activityLevel = profile.activityLevel || 'moderate';
    return Math.round(bmr * (activityMultipliers[activityLevel] || 1.55));
  }

  /**
   * Hedefe göre kalori ayarlama
   */
  private static adjustCaloriesForGoal(bmr: number, goal: 'weight_loss' | 'weight_gain' | 'maintenance' | 'muscle_gain'): number {
    switch (goal) {
      case 'weight_loss':
        return Math.round(bmr - 400); // 400 kalori açık
      case 'weight_gain':
      case 'muscle_gain':
        return Math.round(bmr + 300); // 300 kalori fazla
      default:
        return bmr;
    }
  }

  /**
   * Fallback haftalık plan oluştur - Daha detaylı ve çeşitli öğünler
   */
  private static generateFallbackWeeklyPlan(
    duration: number, 
    dailyCalories: number, 
    goal: 'weight_loss' | 'weight_gain' | 'maintenance' | 'muscle_gain' = 'maintenance',
    allergies: string[] = [],
    restrictions: string[] = [],
    preferences: string[] = []
  ) {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const plan: any = {};

    const breakfastCalories = Math.round(dailyCalories * 0.25);
    const lunchCalories = Math.round(dailyCalories * 0.35);
    const dinnerCalories = Math.round(dailyCalories * 0.30);
    const snackCalories = Math.round(dailyCalories * 0.10);

    // Akıllı öğün seçenekleri - alerjiler, kısıtlamalar ve tercihleri dikkate alacak filtreleme sistemi ekleyeceğim:
    const allBreakfastOptions = [
      {
        name: 'Protein Kahvaltısı',
        description: 'Omlet, avokado, tam tahıl ekmek ve taze meyve ile güne enerjik başlayın',
        ingredients: ['3 adet yumurta', '1/2 avokado', '2 dilim tam tahıl ekmek', '1 orta boy elma', '1 tsp zeytinyağı'],
        instructions: ['Yumurtaları çırpın ve omlet yapın', 'Avokadoyu ezin ve ekmeğe sürün', 'Elmayı dilimleyin', 'Sıcak servis yapın'],
        allergens: ['yumurta', 'gluten'],
        dietaryTags: ['protein', 'healthy_fats'],
        cuisine: 'international'
      },
      {
        name: 'Yoğurtlu Kahvaltı',
        description: 'Protein açısından zengin Yunan yoğurdu, granola ve meyvelerle',
        ingredients: ['200g Yunan yoğurdu', '30g granola', '1 muz', '1 tbsp bal', '10 adet badem'],
        instructions: ['Yoğurdu kaseye koyun', 'Granola ve doğranmış meyveleri ekleyin', 'Bal ile tatlandırın', 'Bademleri üzerine serpin'],
        allergens: ['süt', 'fındık'],
        dietaryTags: ['protein', 'probiyotik'],
        cuisine: 'mediterranean'
      },
      {
        name: 'Smoothie Bowl',
        description: 'Antioxidan açısından zengin smoothie bowl ile sağlıklı başlangıç',
        ingredients: ['1 muz', '100g çilek', '200ml badem sütü', '1 tbsp chia tohumu', '30g granola'],
        instructions: ['Muz ve çileği blender\'da karıştırın', 'Badem sütü ekleyip smoothie yapın', 'Kaseye dökün', 'Chia tohumu ve granola ile süsleyin'],
        allergens: ['fındık'],
        dietaryTags: ['vegan', 'antioxidant', 'fiber'],
        cuisine: 'modern'
      },
      {
        name: 'Menemen',
        description: 'Geleneksel Türk kahvaltısı - domates, biber ve yumurta',
        ingredients: ['3 adet yumurta', '2 domates', '1 yeşil biber', '1 soğan', '2 tbsp zeytinyağı', 'Baharat'],
        instructions: ['Sebzeleri doğrayın ve kavurun', 'Yumurtaları ekleyin', 'Karıştırarak pişirin', 'Sıcak servis yapın'],
        allergens: ['yumurta'],
        dietaryTags: ['protein', 'traditional'],
        cuisine: 'turkish'
      },
      {
        name: 'Vegan Protein Bowl',
        description: 'Bitki bazlı protein kaynakları ile besleyici kahvaltı',
        ingredients: ['50g kinoa', '30g chia tohumu', '200ml hindistan cevizi sütü', '1 muz', '20g protein tozu'],
        instructions: ['Kinoayı haşlayın', 'Chia tohumu ile karıştırın', 'Hindistan cevizi sütü ekleyin', 'Protein tozu ile zenginleştirin'],
        allergens: [],
        dietaryTags: ['vegan', 'protein', 'gluten_free'],
        cuisine: 'modern'
      }
    ];

    const allLunchOptions = [
      {
        name: 'Akdeniz Salatası',
        description: 'Izgara tavuk, quinoa ve taze sebzelerle doyurucu öğle yemeği',
        ingredients: ['150g tavuk göğsü', '80g quinoa', '100g karışık yeşillik', '50g cherry domates', '30g feta peyniri', '2 tbsp zeytinyağı'],
        instructions: ['Tavuğu baharatla marine edin ve ızgarada pişirin', 'Quinoayı haşlayın', 'Sebzeleri doğrayın', 'Tüm malzemeleri karıştırın ve servis yapın'],
        allergens: ['süt'],
        dietaryTags: ['protein', 'healthy_fats', 'gluten_free'],
        cuisine: 'mediterranean'
      },
      {
        name: 'Somon Bowl',
        description: 'Omega-3 açısından zengin somon ile besleyici bowl',
        ingredients: ['150g somon fileto', '100g esmer pirinç', '1/2 avokado', '50g edamame', '1 tbsp susam', 'Soya sosu'],
        instructions: ['Salmonu fırında pişirin', 'Pirinci haşlayın', 'Avokadoyu dilimleyin', 'Bowl\'a yerleştirin ve susam ile süsleyin'],
        allergens: ['balık', 'soya'],
        dietaryTags: ['omega3', 'protein', 'healthy_fats'],
        cuisine: 'asian'
      },
      {
        name: 'Türk Usulü Köfte',
        description: 'Ev yapımı köfte, bulgur pilavı ve cacık ile geleneksel lezzet',
        ingredients: ['150g dana kıyma', '80g bulgur', '200g yoğurt', '1 salatalık', 'Maydanoz', 'Baharat'],
        instructions: ['Köfteleri yoğurun ve pişirin', 'Bulgur pilavı yapın', 'Cacık hazırlayın', 'Sıcak servis yapın'],
        allergens: ['süt'],
        dietaryTags: ['protein', 'traditional', 'fiber'],
        cuisine: 'turkish'
      },
      {
        name: 'Vegan Buddha Bowl',
        description: 'Çeşitli sebzeler, tahıllar ve baklagillerle besleyici vegan öğün',
        ingredients: ['100g kinoa', '100g nohut', '50g ıspanak', '1/2 avokado', '50g havuç', '2 tbsp tahin'],
        instructions: ['Kinoayı haşlayın', 'Nohutları marine edin ve fırınlayın', 'Sebzeleri hazırlayın', 'Tahin sosu ile servis yapın'],
        allergens: ['susam'],
        dietaryTags: ['vegan', 'protein', 'fiber', 'gluten_free'],
        cuisine: 'modern'
      },
      {
        name: 'Balık Izgara',
        description: 'Taze deniz ürünleri ile hafif ve besleyici öğle yemeği',
        ingredients: ['150g levrek', '100g bulgur pilavı', '100g ızgara sebze', '2 tbsp zeytinyağı', 'Limon'],
        instructions: ['Balığı marine edin', 'Izgarada pişirin', 'Bulgur pilavı hazırlayın', 'Sebzeleri ızgarada pişirin'],
        allergens: ['balık'],
        dietaryTags: ['protein', 'omega3', 'low_fat'],
        cuisine: 'mediterranean'
      }
    ];

    const allDinnerOptions = [
      {
        name: 'Fırın Balığı',
        description: 'Sebzeli fırın balığı ile hafif ve besleyici akşam yemeği',
        ingredients: ['150g levrek fileto', '200g karışık sebze', '100g tatlı patates', '2 tbsp zeytinyağı', 'Limon', 'Taze otlar'],
        instructions: ['Balığı marine edin', 'Sebzeleri doğrayın', 'Fırın tepsisine yerleştirin', '200°C\'de 25 dakika pişirin'],
        allergens: ['balık'],
        dietaryTags: ['protein', 'omega3', 'low_calorie'],
        cuisine: 'mediterranean'
      },
      {
        name: 'Tavuk Sote',
        description: 'Sebzeli tavuk sote ile protein açısından zengin akşam',
        ingredients: ['150g tavuk göğsü', '100g brokoli', '50g mantar', '1 kırmızı biber', '2 tbsp zeytinyağı', 'Baharat'],
        instructions: ['Tavuğu küp küp doğrayın', 'Sebzeleri hazırlayın', 'Tavada sote edin', 'Baharatlarla tatlandırın'],
        allergens: [],
        dietaryTags: ['protein', 'low_carb', 'vegetables'],
        cuisine: 'international'
      },
      {
        name: 'Mercimek Köftesi',
        description: 'Protein açısından zengin vejeteryan seçenek',
        ingredients: ['150g kırmızı mercimek', '50g bulgur', '1 soğan', 'Maydanoz', 'Baharat', 'Yeşillik'],
        instructions: ['Mercimeği haşlayın', 'Bulgurla karıştırın', 'Köfte şekli verin', 'Yeşillikle servis yapın'],
        allergens: [],
        dietaryTags: ['vegan', 'protein', 'fiber', 'traditional'],
        cuisine: 'turkish'
      },
      {
        name: 'Izgara Et',
        description: 'Protein ihtiyacını karşılayan ızgara et ile doyurucu akşam',
        ingredients: ['150g dana bonfile', '100g ızgara sebze', '80g kinoa', '2 tbsp zeytinyağı', 'Baharat'],
        instructions: ['Eti marine edin', 'Izgarada pişirin', 'Sebzeleri ızgarada hazırlayın', 'Kinoa ile servis yapın'],
        allergens: [],
        dietaryTags: ['protein', 'iron', 'gluten_free'],
        cuisine: 'international'
      },
      {
        name: 'Vegan Curry',
        description: 'Hindistan cevizi sütlü sebze curry ile egzotik lezzet',
        ingredients: ['200ml hindistan cevizi sütü', '100g nohut', '100g ıspanak', '1 patlıcan', 'Curry baharat', '80g esmer pirinç'],
        instructions: ['Sebzeleri doğrayın', 'Curry baharatı ile kavurun', 'Hindistan cevizi sütü ekleyin', 'Pirinç ile servis yapın'],
        allergens: [],
        dietaryTags: ['vegan', 'protein', 'spicy', 'fiber'],
        cuisine: 'indian'
      }
    ];

    const allSnackOptions = [
      {
        name: 'Protein Smoothie',
        description: 'Antrenman sonrası ideal protein smoothie',
        ingredients: ['1 muz', '200ml süt', '1 tbsp fıstık ezmesi', '1 tsp bal'],
        instructions: ['Tüm malzemeleri blender\'a koyun', '1 dakika karıştırın', 'Soğuk servis yapın'],
        allergens: ['süt', 'fındık'],
        dietaryTags: ['protein', 'post_workout'],
        cuisine: 'modern'
      },
      {
        name: 'Kuruyemiş Karışımı',
        description: 'Sağlıklı yağlar ve protein açısından zengin atıştırmalık',
        ingredients: ['15 adet badem', '10 adet ceviz', '5 adet hurma', '1 tbsp chia tohumu'],
        instructions: ['Kuruyemişleri karıştırın', 'Hurmaları doğrayın', 'Chia tohumu ekleyin', 'Porsiyonlayın'],
        allergens: ['fındık'],
        dietaryTags: ['healthy_fats', 'protein', 'energy'],
        cuisine: 'international'
      },
      {
        name: 'Yoğurt Parfesi',
        description: 'Probiyotik açısından zengin sağlıklı tatlı',
        ingredients: ['150g Yunan yoğurdu', '50g meyve', '20g granola', '1 tsp bal'],
        instructions: ['Yoğurdu kaseye koyun', 'Meyveleri ekleyin', 'Granola ile süsleyin', 'Bal ile tatlandırın'],
        allergens: ['süt'],
        dietaryTags: ['protein', 'probiyotik', 'antioxidant'],
        cuisine: 'modern'
      },
      {
        name: 'Hummus ve Sebze',
        description: 'Protein açısından zengin hummus ile taze sebzeler',
        ingredients: ['100g hummus', '1 havuç', '1 salatalık', '5 adet cherry domates', 'Tam tahıl kraker'],
        instructions: ['Sebzeleri dilimleyin', 'Hummusu kaseye koyun', 'Sebzelerle birlikte servis yapın'],
        allergens: ['susam'],
        dietaryTags: ['vegan', 'protein', 'fiber', 'vegetables'],
        cuisine: 'mediterranean'
      },
      {
        name: 'Vegan Energy Ball',
        description: 'Doğal şekerler ve protein ile enerji topu',
        ingredients: ['10 adet hurma', '30g badem', '1 tbsp chia tohumu', '1 tbsp kakao tozu'],
        instructions: ['Hurmaları ezin', 'Bademleri parçalayın', 'Tüm malzemeleri karıştırın', 'Top şekli verin'],
        allergens: ['fındık'],
        dietaryTags: ['vegan', 'energy', 'natural_sugar', 'protein'],
        cuisine: 'modern'
      }
    ];

    // Akıllı filtreleme fonksiyonu
    const filterMealsByPreferences = (meals: any[]) => {
      return meals.filter(meal => {
        // Alerji kontrolü
        const hasAllergy = allergies.some(allergy => 
          meal.allergens.some((allergen: string) => 
            allergen.toLowerCase().includes(allergy.toLowerCase()) ||
            allergy.toLowerCase().includes(allergen.toLowerCase())
          )
        );
        if (hasAllergy) return false;

        // Kısıtlama kontrolü (vegan, vegetarian, gluten-free, etc.)
        const violatesRestriction = restrictions.some(restriction => {
          const restrictionLower = restriction.toLowerCase();
          if (restrictionLower.includes('vegan') && !meal.dietaryTags.includes('vegan')) {
            return meal.allergens.includes('süt') || meal.allergens.includes('yumurta') || 
                   meal.ingredients.some((ing: string) => 
                     ing.toLowerCase().includes('tavuk') || 
                     ing.toLowerCase().includes('et') || 
                     ing.toLowerCase().includes('balık')
                   );
          }
          if (restrictionLower.includes('vegetarian')) {
            return meal.ingredients.some((ing: string) => 
              ing.toLowerCase().includes('tavuk') || 
              ing.toLowerCase().includes('et') || 
              ing.toLowerCase().includes('balık')
            );
          }
          if (restrictionLower.includes('gluten')) {
            return meal.allergens.includes('gluten') || 
                   meal.ingredients.some((ing: string) => 
                     ing.toLowerCase().includes('ekmek') || 
                     ing.toLowerCase().includes('bulgur')
                   );
          }
          return false;
        });
        if (violatesRestriction) return false;

        // Tercih kontrolü (pozitif filtreleme)
        if (preferences.length > 0) {
          const matchesPreference = preferences.some(preference => {
            const prefLower = preference.toLowerCase();
            return meal.dietaryTags.some((tag: string) => tag.toLowerCase().includes(prefLower)) ||
                   meal.cuisine.toLowerCase().includes(prefLower) ||
                   meal.name.toLowerCase().includes(prefLower);
          });
          if (!matchesPreference) return false;
        }

        return true;
      });
    };

    // Filtrelenmiş öğün seçenekleri
    const breakfastOptions = filterMealsByPreferences(allBreakfastOptions);
    const lunchOptions = filterMealsByPreferences(allLunchOptions);
    const dinnerOptions = filterMealsByPreferences(allDinnerOptions);
    const snackOptions = filterMealsByPreferences(allSnackOptions);

    // Eğer filtreleme sonucu hiç seçenek kalmadıysa, güvenli seçenekleri kullan
    const safeBreakfast = breakfastOptions.length > 0 ? breakfastOptions : [allBreakfastOptions[4]]; // Vegan option
    const safeLunch = lunchOptions.length > 0 ? lunchOptions : [allLunchOptions[3]]; // Vegan option
    const safeDinner = dinnerOptions.length > 0 ? dinnerOptions : [allDinnerOptions[2]]; // Vegan option
    const safeSnack = snackOptions.length > 0 ? snackOptions : [allSnackOptions[4]]; // Vegan option

    // Hedef bazlı makro oranları
    const macroRatios = this.getMacroRatiosForGoal(goal);

    for (let i = 0; i < Math.min(duration, 7); i++) {
      const day = days[i];
      const breakfast = safeBreakfast[i % safeBreakfast.length];
      const lunch = safeLunch[i % safeLunch.length];
      const dinner = safeDinner[i % safeDinner.length];
      const snack = safeSnack[i % safeSnack.length];

      plan[day] = {
        breakfast: [{
          id: Math.random().toString(36).substr(2, 9),
          name: breakfast.name,
          description: breakfast.description,
          calories: breakfastCalories,
          protein: Math.round(breakfastCalories * macroRatios.protein / 100 / 4),
          carbs: Math.round(breakfastCalories * macroRatios.carbs / 100 / 4),
          fat: Math.round(breakfastCalories * macroRatios.fat / 100 / 9),
          ingredients: breakfast.ingredients,
          instructions: breakfast.instructions
        }],
        lunch: [{
          id: Math.random().toString(36).substr(2, 9),
          name: lunch.name,
          description: lunch.description,
          calories: lunchCalories,
          protein: Math.round(lunchCalories * macroRatios.protein / 100 / 4),
          carbs: Math.round(lunchCalories * macroRatios.carbs / 100 / 4),
          fat: Math.round(lunchCalories * macroRatios.fat / 100 / 9),
          ingredients: lunch.ingredients,
          instructions: lunch.instructions
        }],
        dinner: [{
          id: Math.random().toString(36).substr(2, 9),
          name: dinner.name,
          description: dinner.description,
          calories: dinnerCalories,
          protein: Math.round(dinnerCalories * macroRatios.protein / 100 / 4),
          carbs: Math.round(dinnerCalories * macroRatios.carbs / 100 / 4),
          fat: Math.round(dinnerCalories * macroRatios.fat / 100 / 9),
          ingredients: dinner.ingredients,
          instructions: dinner.instructions
        }],
        snacks: [{
          id: Math.random().toString(36).substr(2, 9),
          name: snack.name,
          description: snack.description,
          calories: snackCalories,
          protein: Math.round(snackCalories * macroRatios.protein / 100 / 4),
          carbs: Math.round(snackCalories * macroRatios.carbs / 100 / 4),
          fat: Math.round(snackCalories * macroRatios.fat / 100 / 9),
          ingredients: snack.ingredients,
          instructions: snack.instructions
        }]
      };
    }

    return plan;
  }
}