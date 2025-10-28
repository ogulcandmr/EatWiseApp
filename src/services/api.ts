// API servisleri için temel yapı
export class ApiService {
  private static baseUrl = 'https://api.eatwise.com'; // Gerçek API URL'i

  static async get<T>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('API GET Error:', error);
      throw error;
    }
  }

  static async post<T>(endpoint: string, data: any): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('API POST Error:', error);
      throw error;
    }
  }
}

import { ENV } from '../config/env';

// OpenAI Vision API servisi
export class AIVisionService {
  private static apiKey = ENV.OPENAI_API_KEY;

  static async analyzeImage(imageBase64: string): Promise<any> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4-vision-preview',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Bu yemek fotoğrafındaki yiyecekleri tanımla ve her birinin tahmini miktarını, kalori değerini hesapla. Türkçe yanıt ver.'
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${imageBase64}`
                  }
                }
              ]
            }
          ],
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('AI Vision Error:', error);
      throw error;
    }
  }

  static async generateRecipe(ingredients: string[]): Promise<any> {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'user',
              content: `Bu malzemelerle sağlıklı tarifler oluştur: ${ingredients.join(', ')}. 
              Her tarif için kalori, protein, karbonhidrat ve yağ değerlerini de hesapla. 
              Türkçe yanıt ver ve JSON formatında döndür.`
            }
          ],
          max_tokens: 1500
        })
      });

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('AI Recipe Generation Error:', error);
      throw error;
    }
  }
}

// Besin veritabanı servisi
export class FoodDatabaseService {
  static async searchFood(query: string): Promise<any[]> {
    try {
      // OpenFoodFacts API kullanımı
      const response = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=20`);
      
      if (!response.ok) {
        throw new Error(`Food database error: ${response.status}`);
      }

      const data = await response.json();
      return data.products || [];
    } catch (error) {
      console.error('Food Database Error:', error);
      throw error;
    }
  }

  static async getFoodNutrition(foodId: string): Promise<any> {
    try {
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${foodId}.json`);
      
      if (!response.ok) {
        throw new Error(`Food nutrition error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Food Nutrition Error:', error);
      throw error;
    }
  }
}
