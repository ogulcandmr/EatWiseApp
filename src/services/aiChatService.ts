import { ENV } from '../config/env';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export class AIChatService {
  private static readonly GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
  private static readonly SYSTEM_PROMPT = `Sen EatWise uygulamasının AI asistanısın. Kullanıcılara beslenme, egzersiz, sağlık ve kilo yönetimi konularında yardım ediyorsun. 

Özellikler:
- Türkçe yanıt ver
- Kısa ve anlaşılır açıklamalar yap
- Beslenme uzmanı gibi davran
- Kişiselleştirilmiş öneriler sun
- Güvenilir ve bilimsel bilgiler ver
- Pozitif ve motive edici ol

Konular:
- Kalori hesaplama ve takibi
- Makro besin ögeleri (protein, karbonhidrat, yağ)
- Su tüketimi ve hidrasyon
- Egzersiz programları
- Kilo verme/alma stratejileri
- Sağlıklı beslenme önerileri
- Öğün planlaması

Yanıtlarını 2-3 cümle ile sınırla ve pratik öneriler ver.`;

  /**
   * Groq Chat API ile mesaj gönder
   */
  static async sendMessage(messages: ChatMessage[]): Promise<string> {
    // API key kontrolü
    if (!ENV.GROQ_API_KEY || ENV.GROQ_API_KEY === 'your_groq_api_key_here') {
      console.log('Groq API key bulunamadı, fallback yanıt kullanılıyor');
      return this.getFallbackResponse(messages[messages.length - 1]?.content || '');
    }

    try {
      const response = await fetch(this.GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ENV.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: this.SYSTEM_PROMPT },
            ...messages
          ],
          max_tokens: 300,
          temperature: 0.7,
          presence_penalty: 0.1,
          frequency_penalty: 0.1,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('OpenAI API Hatası:', {
          status: response.status,
          error: errorData
        });
        
        // Rate limit veya diğer hatalar için fallback
        if (response.status === 429) {
          console.log('⚠️ OpenAI rate limit aşıldı, fallback yanıt kullanılıyor');
        }
        
        return this.getFallbackResponse(messages[messages.length - 1]?.content || '');
      }

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content?.trim();
      
      if (!aiResponse) {
        console.log('OpenAI yanıtı boş, fallback kullanılıyor');
        return this.getFallbackResponse(messages[messages.length - 1]?.content || '');
      }

      console.log('✅ OpenAI AI Chat yanıtı alındı');
      return aiResponse;

    } catch (error: any) {
      console.error('AI Chat hatası:', error.message);
      return this.getFallbackResponse(messages[messages.length - 1]?.content || '');
    }
  }

  /**
   * API key yoksa veya hata durumunda kullanılacak fallback yanıtlar
   */
  private static getFallbackResponse(userMessage: string): string {
    const lowerMessage = userMessage.toLowerCase();
    
    const responses = [
      {
        keywords: ['kalori', 'kcal', 'günlük kalori', 'kalori hesaplama'],
        response: 'Günlük kalori ihtiyacınız yaş, cinsiyet, kilo, boy ve aktivite seviyenize göre hesaplanır. Profil sayfanızdan bu bilgileri güncelleyebilir ve kişiselleştirilmiş kalori hedefi alabilirsiniz. Genel olarak kadınlar için 1800-2200, erkekler için 2200-2800 kalori önerilir.',
      },
      {
        keywords: ['protein', 'protein ihtiyacı', 'protein alımı'],
        response: 'Günlük protein ihtiyacınız vücut ağırlığınızın kg başına 0.8-2.2g arasında değişir. Kilo verme için 1.6-2.2g, kas kazanımı için 1.6-2.2g, koruma için 0.8-1.2g önerilir. Et, balık, yumurta, baklagiller iyi protein kaynaklarıdır.',
      },
      {
        keywords: ['su', 'su içme', 'hidrasyon', 'su tüketimi'],
        response: 'Günde en az 2.5-3 litre su içmeniz önerilir. Egzersiz yaptığınız günlerde bu miktarı artırın. Su takip özelliğimizi kullanarak günlük su tüketiminizi kolayca takip edebilirsiniz. Susuzluk hissetmeden önce su için.',
      },
      {
        keywords: ['egzersiz', 'spor', 'antrenman', 'fitness'],
        response: 'Hedeflere göre egzersiz önerileri: Kilo verme için haftada 3-4 kez kardio + 2-3 kez ağırlık, kas kazanımı için haftada 4-5 kez ağırlık antrenmanı önerilir. Başlangıç için haftada 3 gün 30 dakika yeterli.',
      },
      {
        keywords: ['kilo verme', 'zayıflama', 'diyet'],
        response: 'Sağlıklı kilo verme için haftada 0.5-1 kg kaybetmeyi hedefleyin. Kalori açığı oluşturun (günlük 300-500 kalori), protein alımınızı artırın ve düzenli egzersiz yapın. Aşırı kısıtlama yapmayın.',
      },
      {
        keywords: ['kilo alma', 'kas kazanımı', 'bulk'],
        response: 'Sağlıklı kilo alma için günlük kalori fazlası (300-500 kalori) oluşturun, protein alımınızı artırın (vücut ağırlığı kg başına 1.6-2.2g) ve ağırlık antrenmanlarına odaklanın. Sabırlı olun, kas kazanımı zaman alır.',
      },
      {
        keywords: ['öğün', 'yemek', 'beslenme', 'diyet planı'],
        response: 'Günde 3 ana öğün + 2 ara öğün önerilir. Kahvaltıyı atlamayın, protein ve lif açısından zengin besinler tercih edin. Porsiyon kontrolü yapın ve çeşitli besinler tüketin.',
      },
      {
        keywords: ['vitamin', 'mineral', 'takviye'],
        response: 'Dengeli beslenme ile çoğu vitamin ve minerali alabilirsiniz. D vitamini, B12 ve omega-3 eksikliği yaygındır. Takviye almadan önce kan tahlili yaptırın ve doktor önerisi alın.',
      },
    ];

    // Anahtar kelime eşleşmesi ara
    for (const response of responses) {
      if (response.keywords.some(keyword => lowerMessage.includes(keyword))) {
        return response.response;
      }
    }
    
    // Genel yanıt
    const generalResponses = [
      'Bu konuda size daha detaylı yardım edebilmek için lütfen daha spesifik bir soru sorun. Beslenme, egzersiz, kalori hesaplama konularında size yardımcı olabilirim.',
      'Sağlık ve beslenme konularında size yardımcı olmaya hazırım. Kalori, protein, su tüketimi, egzersiz gibi konularda sorularınızı sorabilirsiniz.',
      'EatWise uygulamasının özelliklerini kullanarak hedeflerinize ulaşabilirsiniz. Hangi konuda yardıma ihtiyacınız var?',
    ];
    
    return generalResponses[Math.floor(Math.random() * generalResponses.length)];
  }

  /**
   * Hızlı soru önerileri
   */
  static getQuickQuestions(): string[] {
    return [
      'Günlük kaç kalori almalıyım?',
      'Protein ihtiyacım nedir?',
      'Kilo vermek için ne yapmalıyım?',
      'Su tüketimimi nasıl artırabilirim?',
      'Hangi egzersizleri yapmalıyım?',
      'Sağlıklı atıştırmalık önerileri',
      'Kas kazanımı için beslenme',
      'Metabolizmamı nasıl hızlandırabilirim?',
    ];
  }
}