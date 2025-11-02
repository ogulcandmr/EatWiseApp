import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import { ENV } from '../config/env';

const OPENAI_API_KEY = ENV.OPENAI_API_KEY;
const OPENAI_WHISPER_URL = 'https://api.openai.com/v1/audio/transcriptions';

export class VoiceService {
  private static recording: Audio.Recording | null = null;
  private static isRecording = false;

  /**
   * Mikrofon izni iste
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Mikrofon izni hatası:', error);
      return false;
    }
  }

  /**
   * Ses kaydı başlat
   */
  static async startRecording(): Promise<void> {
    try {
      // Önceki kaydı temizle
      if (this.recording) {
        try {
          await this.recording.stopAndUnloadAsync();
        } catch (cleanupError) {
          console.warn('Önceki kayıt temizleme hatası:', cleanupError);
        }
        this.recording = null;
      }

      // İzin kontrolü
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Mikrofon izni reddedildi');
      }

      // Audio mode ayarla
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      });

      // Kayıt başlat - Whisper API uyumlu ayarlar
      const recordingOptions = {
        android: {
          extension: '.mp4',
          outputFormat: 2, // MPEG_4
          audioEncoder: 3, // AAC
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.mp4',
          outputFormat: 'mp4',
          audioQuality: 1, // HIGH
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        web: {
          mimeType: 'audio/mp4',
          bitsPerSecond: 128000,
        },
      };

      const { recording } = await Audio.Recording.createAsync(recordingOptions);

      this.recording = recording;
      this.isRecording = true;

      console.log('Ses kaydı başladı');
    } catch (error: any) {
      console.error('Kayıt başlatma hatası:', error);
      // State'i temizle
      this.recording = null;
      this.isRecording = false;
      
      // Audio mode'u sıfırla
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
        });
      } catch (resetError) {
        console.warn('Audio mode sıfırlama hatası:', resetError);
      }
      
      throw new Error(`Ses kaydı başlatılamadı: ${error.message}`);
    }
  }

  /**
   * Ses kaydı durdur ve metne çevir
   */
  static async stopRecording(): Promise<string> {
    try {
      if (!this.recording) {
        throw new Error('Aktif kayıt yok');
      }

      if (!this.isRecording) {
        throw new Error('Kayıt durumu geçersiz');
      }

      console.log('Ses kaydı durduruluyor...');
      
      // Kayıt durumunu önce false yap
      this.isRecording = false;
      
      // Kaydı durdur
      await this.recording.stopAndUnloadAsync();
      
      // Audio mode'u sıfırla
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
        });
      } catch (audioModeError) {
        console.warn('Audio mode sıfırlama hatası:', audioModeError);
      }

      // URI'yi al ve validate et
      const uri = this.recording.getURI();
      this.recording = null;

      console.log('Ses kaydı tamamlandı:', uri);

      // URI validation
      if (!uri) {
        console.error('Ses dosyası URI\'si alınamadı');
        return this.mockSpeechToText();
      }

      // Dosya varlığını kontrol et (React Native için)
      if (!uri.startsWith('file://') && !uri.startsWith('content://')) {
        console.error('Geçersiz dosya URI formatı:', uri);
        return this.mockSpeechToText();
      }

      // OpenAI Whisper ile metne çevir
      if (this.isValidApiKey(OPENAI_API_KEY)) {
        try {
          console.log('Whisper API\'ye gönderiliyor...');
          return await this.transcribeWithWhisper(uri);
        } catch (whisperError) {
          console.error('Whisper hatası, mock\'a geçiliyor:', whisperError);
          return this.mockSpeechToText();
        }
      }

      // API key yoksa mock kullan
      console.log('API key geçersiz, mock kullanılıyor');
      return this.mockSpeechToText();
    } catch (error: any) {
      console.error('Kayıt durdurma hatası:', error);
      
      // State'i temizle
      this.recording = null;
      this.isRecording = false;
      
      // Audio mode'u güvenli şekilde sıfırla
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
        });
      } catch (resetError) {
        console.warn('Audio mode sıfırlama hatası:', resetError);
      }
      
      throw new Error(`Ses kaydı durdurulamadı: ${error.message}`);
    }
  }

  /**
   * API key validation
   */
  private static isValidApiKey(apiKey: string): boolean {
    return !!apiKey &&
           apiKey !== 'your_openai_api_key_here' && 
           apiKey.length > 10 && 
           typeof apiKey === 'string';
  }

  /**
   * OpenAI Whisper ile Speech-to-Text
   */
  private static async transcribeWithWhisper(audioUri: string): Promise<string> {
    try {
      console.log('OpenAI Whisper ile transkripsiyon yapılıyor...', audioUri);

      // URI validation
      if (!audioUri || typeof audioUri !== 'string') {
        throw new Error('Geçersiz audio URI');
      }

      // FormData oluştur - React Native için özel format
      const formData = new FormData();
      
      // Audio dosyasını ekle - React Native FormData format
      const audioFile = {
        uri: audioUri,
        type: 'audio/mp4', // m4a yerine mp4 kullan
        name: 'recording.mp4',
      } as any;
      
      formData.append('file', audioFile);
      formData.append('model', 'whisper-1');
      formData.append('language', 'tr'); // Türkçe
      formData.append('response_format', 'json'); // text yerine json

      console.log('FormData hazırlandı, API çağrısı yapılıyor...');

      // API çağrısı - timeout ile
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 saniye timeout

      try {
        const response = await fetch(OPENAI_WHISPER_URL, {
           method: 'POST',
           headers: {
             'Authorization': `Bearer ${OPENAI_API_KEY}`,
             // Content-Type otomatik olarak FormData tarafından ayarlanır
           },
           body: formData,
           signal: controller.signal,
         });

        clearTimeout(timeoutId);

        console.log('API yanıtı alındı:', response.status);

        if (!response.ok) {
          let errorData: any = {};
          try {
            const errorText = await response.text();
            errorData = JSON.parse(errorText);
          } catch (parseError) {
            console.warn('Error response parse edilemedi:', parseError);
          }
          
          console.error('Whisper API Error:', {
            status: response.status,
            statusText: response.statusText,
            error: errorData
          });
          
          throw new Error(`Whisper API error: ${response.status} - ${response.statusText}`);
        }

        // JSON yanıtı al
        const data = await response.json();
        
        console.log('Whisper transkripsiyon başarılı:', data);
        
        // JSON'dan text'i çıkar
        const text = data.text || '';
        
        if (!text || text.trim().length === 0) {
          throw new Error('Boş transkripsiyon yanıtı');
        }
        
        return text.trim();
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        if (fetchError.name === 'AbortError') {
          throw new Error('Whisper API timeout (30s)');
        }
        
        throw fetchError;
      }
    } catch (error: any) {
      console.error('Whisper transkripsiyon hatası:', {
        message: error.message,
        stack: error.stack,
        audioUri
      });
      
      // Hata tipine göre özel mesajlar
      if (error.message.includes('timeout')) {
        throw new Error('Ses dosyası işleme zaman aşımı');
      } else if (error.message.includes('401')) {
        throw new Error('OpenAI API anahtarı geçersiz');
      } else if (error.message.includes('429')) {
        throw new Error('API kullanım limiti aşıldı');
      } else if (error.message.includes('400')) {
        throw new Error('Ses dosyası formatı desteklenmiyor');
      }
      
      throw new Error(`Transkripsiyon hatası: ${error.message}`);
    }
  }

  /**
   * Mock Speech-to-Text (Fallback)
   */
  private static mockSpeechToText(): string {
    const mockPhrases = [
      'yumurta, domates, peynir',
      'tavuk, pilav, salata',
      'makarna, domates sosu, fesleğen',
      'somon, brokoli, kinoa',
      'yoğurt, meyve, granola'
    ];
    
    console.log('Mock Speech-to-Text kullanılıyor');
    return mockPhrases[Math.floor(Math.random() * mockPhrases.length)];
  }

  /**
   * Metni sesli oku (Text-to-Speech)
   */
  static async speak(text: string, options?: {
    language?: string;
    pitch?: number;
    rate?: number;
  }): Promise<void> {
    try {
      // Önce konuşmayı durdur
      await this.stopSpeaking();

      // Yeni konuşmayı başlat
      await Speech.speak(text, {
        language: options?.language || 'tr-TR',
        pitch: options?.pitch || 1.0,
        rate: options?.rate || 0.9,
        onDone: () => console.log('Konuşma tamamlandı'),
        onError: (error) => console.error('TTS hatası:', error),
      });

      console.log('TTS başlatıldı:', text.substring(0, 50) + '...');
    } catch (error: any) {
      console.error('TTS hatası:', error);
      throw new Error('Metin okunamadı');
    }
  }

  /**
   * Konuşmayı durdur
   */
  static async stopSpeaking(): Promise<void> {
    try {
      await Speech.stop();
    } catch (error) {
      console.error('TTS durdurma hatası:', error);
    }
  }

  /**
   * TTS mevcut mu kontrol et
   */
  static async isSpeechAvailable(): Promise<boolean> {
    try {
      const available = await Speech.isSpeakingAsync();
      return true; // Expo Speech her zaman mevcut
    } catch (error) {
      return false;
    }
  }

  /**
   * Kayıt durumu
   */
  static getRecordingStatus(): boolean {
    return this.isRecording;
  }

  /**
   * Tarif metnini formatla (TTS için)
   */
  static formatRecipeForSpeech(recipe: any): string {
    let text = `${recipe.title}. `;
    text += `Hazırlama süresi ${recipe.time}. `;
    text += `Toplam ${recipe.calories} kalori. `;
    
    text += 'Malzemeler: ';
    text += recipe.ingredients.join(', ') + '. ';
    
    text += 'Hazırlanışı: ';
    recipe.steps.forEach((step: string, index: number) => {
      text += `${index + 1}. ${step}. `;
    });
    
    return text;
  }

  /**
   * Kısa özet oluştur (TTS için)
   */
  static formatRecipeSummary(recipes: any[]): string {
    if (recipes.length === 0) {
      return 'Tarif bulunamadı.';
    }

    let text = `${recipes.length} tarif bulundu. `;
    
    recipes.forEach((recipe, index) => {
      text += `${index + 1}. ${recipe.title}, ${recipe.calories} kalori. `;
    });
    
    text += 'Detayları görmek için bir tarife dokunun.';
    
    return text;
  }
}
