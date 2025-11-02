import { FoodAnalysisResult, FoodItem } from '../types/foodAnalysis';
import { ENV } from '../config/env';

const OPENAI_API_KEY = ENV.OPENAI_API_KEY;
const OPENAI_VISION_URL = 'https://api.openai.com/v1/chat/completions';

export class FoodAnalysisService {
  /**
   * Fotoğraftan yemek analizi yap (AI Vision aktif)
   */
  static async analyzeFoodPhoto(imageUrl: string, useAI: boolean = true): Promise<FoodAnalysisResult> {
    // AI key kontrolü
    if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your_openai_api_key_here') {
      console.log('OpenAI API key bulunamadı, mock analiz kullanılıyor');
      return this.getMockAnalysis(imageUrl);
    }

    // AI analiz kullan (default)
    if (useAI) {
      try {
        console.log('OpenAI Vision ile analiz yapılıyor...');
        return await this.analyzeWithOpenAIVision(imageUrl);
      } catch (error) {
        console.error('AI analiz hatası, mock\'a geçiliyor:', error);
        return this.getMockAnalysis(imageUrl);
      }
    }

    // Manuel olarak mock istendiyse
    return this.getMockAnalysis(imageUrl);
  }

  /**
   * Mock analiz (MVP)
   */
  private static getMockAnalysis(imageUrl: string): FoodAnalysisResult {
    // Rastgele mock yemekler
    const mockFoods = [
      {
        items: [
          { name: 'Izgara Tavuk Göğsü', grams: 150, calories: 248, protein: 46, carbs: 0, fats: 5 },
          { name: 'Pilav', grams: 100, calories: 130, protein: 2, carbs: 28, fats: 0.3 },
          { name: 'Yeşil Salata', grams: 80, calories: 20, protein: 1, carbs: 4, fats: 0.2 }
        ],
        portion: '1 porsiyon'
      },
      {
        items: [
          { name: 'Omlet (2 yumurta)', grams: 120, calories: 188, protein: 13, carbs: 1, fats: 14 },
          { name: 'Tam Buğday Ekmeği', grams: 60, calories: 140, protein: 6, carbs: 24, fats: 2 },
          { name: 'Domates', grams: 100, calories: 18, protein: 1, carbs: 4, fats: 0.2 }
        ],
        portion: '1 porsiyon'
      },
      {
        items: [
          { name: 'Izgara Somon', grams: 150, calories: 280, protein: 39, carbs: 0, fats: 13 },
          { name: 'Buharda Brokoli', grams: 100, calories: 34, protein: 3, carbs: 7, fats: 0.4 },
          { name: 'Kinoa', grams: 80, calories: 120, protein: 4, carbs: 21, fats: 2 }
        ],
        portion: '1 porsiyon'
      },
      {
        items: [
          { name: 'Mercimek Çorbası', grams: 250, calories: 180, protein: 12, carbs: 30, fats: 1 },
          { name: 'Yoğurt', grams: 100, calories: 61, protein: 3, carbs: 5, fats: 3 }
        ],
        portion: '1 kase'
      },
      {
        items: [
          { name: 'Tavuklu Wrap', grams: 200, calories: 350, protein: 28, carbs: 38, fats: 10 },
          { name: 'Patates Kızartması', grams: 100, calories: 312, protein: 4, carbs: 41, fats: 15 }
        ],
        portion: '1 adet'
      }
    ];

    // Rastgele bir mock seç
    const selected = mockFoods[Math.floor(Math.random() * mockFoods.length)];

    // Toplamları hesapla
    const totals = selected.items.reduce(
      (acc, item) => ({
        calories: acc.calories + item.calories,
        protein: acc.protein + item.protein,
        carbs: acc.carbs + item.carbs,
        fats: acc.fats + item.fats
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );

    return {
      items: selected.items,
      totals,
      portion: selected.portion,
      imageUrl,
      analysisType: 'mock'
    };
  }

  /**
   * OpenAI Vision ile gerçek AI analiz
   */
  private static async analyzeWithOpenAIVision(imageUrl: string): Promise<FoodAnalysisResult> {
    try {
      const prompt = `Bu yemek fotoğrafını analiz et ve tabakta/kasede görünen tüm yiyecekleri tespit et.

Her yiyecek için şunları belirle:
1. İsim (Türkçe)
2. Tahmini ağırlık (gram cinsinden, görsel porsiyon büyüklüğüne göre)
3. Tahmini kalori
4. Protein (gram)
5. Karbonhidrat (gram)
6. Yağ (gram)
7. Güven skoru (0-1 arası, ne kadar emin olduğun)

Sonucu TAM OLARAK bu JSON formatında dön (başka hiçbir şey yazma):
{
  "items": [
    {
      "name": "Yiyecek adı Türkçe",
      "grams": 150,
      "calories": 200,
      "protein": 20,
      "carbs": 10,
      "fats": 8,
      "confidence": 0.85
    }
  ],
  "portion": "1 porsiyon"
}

Besin değerlerinde mümkün olduğunca doğru ol. Emin olmadığın yiyecekler için confidence değerini düşür. Sadece JSON dön, başka açıklama yapma.`;

      const response = await fetch(OPENAI_VISION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini', // gpt-4o-mini daha ucuz, gpt-4o daha doğru
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: prompt
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: imageUrl,
                    detail: 'low' // 'low' daha ucuz, 'high' daha detaylı
                  }
                }
              ]
            }
          ],
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('OpenAI API Error Details:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(`OpenAI Vision API error: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error('OpenAI yanıt formatı hatalı:', data);
        throw new Error('OpenAI yanıt formatı hatalı');
      }
      
      let content = data.choices[0].message.content;

      console.log('OpenAI Vision yanıtı:', content);

      // JSON'u temizle (markdown code block varsa)
      content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      // JSON parse et
      const parsed = JSON.parse(content);

      // Toplamları hesapla
      const totals = parsed.items.reduce(
        (acc: any, item: FoodItem) => ({
          calories: acc.calories + item.calories,
          protein: acc.protein + item.protein,
          carbs: acc.carbs + item.carbs,
          fats: acc.fats + item.fats
        }),
        { calories: 0, protein: 0, carbs: 0, fats: 0 }
      );

      return {
        items: parsed.items,
        totals,
        portion: parsed.portion,
        imageUrl,
        analysisType: 'ai'
      };
    } catch (error: any) {
      console.error('OpenAI Vision analiz hatası:', error);
      throw error;
    }
  }

  /**
   * Analiz sonucunu meal olarak formatla
   */
  static formatAsMeal(analysis: FoodAnalysisResult, userId: string) {
    return {
      user_id: userId,
      name: analysis.items.map(i => i.name).join(', '),
      total_calories: Math.round(analysis.totals.calories),
      total_protein: Math.round(analysis.totals.protein),
      total_carbs: Math.round(analysis.totals.carbs),
      total_fat: Math.round(analysis.totals.fats),
      meal_type: this.determineMealType(),
      portion: analysis.portion
    };
  }

  /**
   * Saate göre öğün tipini belirle
   */
  private static determineMealType(): 'breakfast' | 'lunch' | 'dinner' | 'snack' {
    const hour = new Date().getHours();

    if (hour >= 6 && hour < 11) return 'breakfast';
    if (hour >= 11 && hour < 15) return 'lunch';
    if (hour >= 18 && hour < 22) return 'dinner';
    return 'snack';
  }

  /**
   * Confidence score'a göre renk
   */
  static getConfidenceColor(confidence?: number): string {
    if (!confidence) return '#999';
    if (confidence >= 0.8) return '#4CAF50';
    if (confidence >= 0.6) return '#FF9800';
    return '#F44336';
  }

  /**
   * Confidence score'a göre text
   */
  static getConfidenceText(confidence?: number): string {
    if (!confidence) return 'Tahmini';
    if (confidence >= 0.8) return 'Yüksek güven';
    if (confidence >= 0.6) return 'Orta güven';
    return 'Düşük güven';
  }
}
