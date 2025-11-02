// Environment Configuration Template
// 1. Bu dosyayı kopyalayın: cp env.example.ts env.ts
// 2. env.ts dosyasına gerçek API key'lerinizi yapıştırın
// 3. env.ts dosyası .gitignore'da olduğu için commit edilmeyecek

export const ENV = {
  // OpenAI API Key
  // https://platform.openai.com/api-keys adresinden alın
  OPENAI_API_KEY: 'your_openai_api_key_here',
  
  // Supabase Configuration (Opsiyonel - zaten supabase.ts'de tanımlı)
  // Eğer değiştirmek isterseniz buraya ekleyin
  SUPABASE_URL: 'https://iwkrncptlrfyisanvuqg.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3a3JuY3B0bHJmeWlzYW52dXFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NjAzMTEsImV4cCI6MjA3NjIzNjMxMX0.Las3DaeoAhV0_9IvvZSvZLDR2ZSlTWFbFIQD7lxRfXM',
};

// Geliştirme ortamında console'a yazdır
if (__DEV__) {
  console.log('ENV Config yüklendi');
  console.log('OPENAI_API_KEY:', ENV.OPENAI_API_KEY ? 'Mevcut (' + ENV.OPENAI_API_KEY.substring(0, 10) + '...)' : 'Yok');
}
