import { Recipe, RecipeMode } from '../types/recipe';
import { ENV } from '../config/env';

const GROQ_API_KEY = ENV.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export class RecipeService {
  /**
   * Malzemelerden tarif oluştur (OpenAI ile)
   */
  static async generateRecipes(
    ingredients: string[],
    mode: RecipeMode = 'normal'
  ): Promise<Recipe[]> {
    // Eğer API key yoksa mock data dön
    if (!GROQ_API_KEY || GROQ_API_KEY === 'your_groq_api_key_here') {
      console.log('Groq API key bulunamadı, mock data kullanılıyor');
      return this.getMockRecipes(ingredients, mode);
    }

    try {
      const prompt = this.buildPrompt(ingredients, mode);

      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: 'Sen bir beslenme uzmanı ve aşçısın. Kullanıcının verdiği malzemelerden sağlıklı, lezzetli ve kolay tarifler oluşturuyorsun.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Groq API Hatası:', {
          status: response.status,
          error: errorData
        });
        
        // 429 = Rate limit, direkt mock'a geç
        if (response.status === 429) {
          console.log('⚠️ Groq rate limit aşıldı, mock data kullanılıyor');
          return this.getMockRecipes(ingredients, mode);
        }
        
        throw new Error(`Groq API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;

      // JSON parse et
      const recipes = JSON.parse(content);
      return recipes;
    } catch (error: any) {
      console.error('Tarif oluşturma hatası:', error.message);
      // Hata durumunda mock data dön
      console.log('✅ Mock tarifler kullanılıyor');
      return this.getMockRecipes(ingredients, mode);
    }
  }

  /**
   * OpenAI için prompt oluştur
   */
  private static buildPrompt(ingredients: string[], mode: RecipeMode): string {
    const ingredientsList = ingredients.join(', ');
    
    let modeDescription = '';
    switch (mode) {
      case 'fit':
        modeDescription = 'Düşük kalorili, yüksek proteinli, fit yaşam tarzına uygun';
        break;
      case 'vegan':
        modeDescription = 'Tamamen bitkisel, vegan';
        break;
      case 'kas-yapıcı':
        modeDescription = 'Yüksek proteinli, kas yapımına yardımcı';
        break;
      default:
        modeDescription = 'Dengeli ve sağlıklı';
    }

    return `
Şu malzemeleri kullanarak 3-5 ${modeDescription} tarif oluştur: ${ingredientsList}

Her tarif için şu bilgileri JSON formatında ver:
- title: Tarifin adı (Türkçe)
- time: Tahmini hazırlama süresi (örn: "15 dakika", "30 dakika")
- ingredients: Malzeme listesi (array, Türkçe)
- steps: Adım adım talimatlar (array, Türkçe, kısa ve net)
- calories: Tahmini kalori (sayı, tek porsiyon için)
- protein: Protein miktarı gram cinsinden (sayı)
- carbs: Karbonhidrat miktarı gram cinsinden (sayı)
- fats: Yağ miktarı gram cinsinden (sayı)

Çıktıyı sadece JSON array olarak ver, başka açıklama ekleme:
[{title, time, ingredients, steps, calories, protein, carbs, fats}, ...]
`;
  }

  /**
   * Mock tarifler (API key yoksa veya hata durumunda)
   */
  private static getMockRecipes(ingredients: string[], mode: RecipeMode): Recipe[] {
    const ingredientsList = ingredients.join(', ');
    
    const mockRecipes: Recipe[] = [
      {
        title: `${ingredients[0] || 'Malzeme'} ile Hızlı Omlet`,
        time: '10 dakika',
        ingredients: [
          '2 adet yumurta',
          ...ingredients.slice(0, 3),
          '1 çay kaşığı zeytinyağı',
          'Tuz, karabiber'
        ],
        steps: [
          'Yumurtaları bir kapta çırpın',
          'Malzemeleri küçük küpler halinde doğrayın',
          'Tavada zeytinyağını ısıtın',
          'Yumurtaları dökün ve malzemeleri ekleyin',
          'Orta ateşte 3-4 dakika pişirin',
          'Servis tabağına alın'
        ],
        calories: mode === 'fit' ? 180 : mode === 'kas-yapıcı' ? 250 : 220,
        protein: mode === 'kas-yapıcı' ? 18 : 12,
        carbs: 8,
        fats: mode === 'fit' ? 10 : 14
      },
      {
        title: `${ingredients[1] || 'Sebze'} Salatası`,
        time: '15 dakika',
        ingredients: [
          ...ingredients.slice(0, 4),
          '1 yemek kaşığı zeytinyağı',
          '1 tatlı kaşığı limon suyu',
          'Tuz, karabiber'
        ],
        steps: [
          'Tüm malzemeleri yıkayın',
          'Küçük parçalar halinde doğrayın',
          'Geniş bir salata kasesine alın',
          'Zeytinyağı ve limon suyu ekleyin',
          'Tuz, karabiber ile tatlandırın',
          'Karıştırıp servis edin'
        ],
        calories: mode === 'fit' ? 120 : 180,
        protein: mode === 'vegan' ? 8 : 6,
        carbs: 15,
        fats: mode === 'fit' ? 6 : 10
      },
      {
        title: `${ingredients[0] || 'Malzeme'} Smoothie`,
        time: '5 dakika',
        ingredients: [
          ...ingredients.slice(0, 2),
          '1 su bardağı süt (veya bitkisel süt)',
          '1 yemek kaşığı bal',
          'Buz küpleri'
        ],
        steps: [
          'Tüm malzemeleri blender\'a koyun',
          'Yüksek hızda 1-2 dakika karıştırın',
          'Pürüzsüz bir kıvam elde edin',
          'Bardağa dökün',
          'Hemen servis edin'
        ],
        calories: mode === 'fit' ? 150 : mode === 'kas-yapıcı' ? 280 : 200,
        protein: mode === 'kas-yapıcı' ? 20 : mode === 'vegan' ? 8 : 10,
        carbs: 25,
        fats: mode === 'fit' ? 3 : 8
      }
    ];

    // Mode'a göre filtreleme
    if (mode === 'vegan') {
      return mockRecipes.filter(r => !r.title.includes('Omlet')).map(r => ({
        ...r,
        ingredients: r.ingredients.map(i => 
          i.includes('süt') ? i.replace('süt', 'badem sütü') : i
        )
      }));
    }

    return mockRecipes.slice(0, 3);
  }

  /**
   * Tarif modlarını getir
   */
  static getRecipeModes(): { value: RecipeMode; label: string; icon: string; description: string }[] {
    return [
      {
        value: 'normal',
        label: 'Normal',
        icon: '🍽️',
        description: 'Dengeli ve sağlıklı'
      },
      {
        value: 'fit',
        label: 'Fit',
        icon: '💪',
        description: 'Düşük kalorili'
      },
      {
        value: 'vegan',
        label: 'Vegan',
        icon: '🌱',
        description: 'Bitkisel beslenme'
      },
      {
        value: 'kas-yapıcı',
        label: 'Kas Yapıcı',
        icon: '🏋️',
        description: 'Yüksek proteinli'
      }
    ];
  }

  /**
   * Tarifin makro dağılımını hesapla (yüzde)
   */
  static calculateMacroPercentages(recipe: Recipe): {
    proteinPercent: number;
    carbsPercent: number;
    fatsPercent: number;
  } {
    const totalCalories = (recipe.protein * 4) + (recipe.carbs * 4) + (recipe.fats * 9);
    
    return {
      proteinPercent: Math.round((recipe.protein * 4 / totalCalories) * 100),
      carbsPercent: Math.round((recipe.carbs * 4 / totalCalories) * 100),
      fatsPercent: Math.round((recipe.fats * 9 / totalCalories) * 100)
    };
  }
}
