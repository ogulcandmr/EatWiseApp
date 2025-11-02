-- Tarif tablosu
CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  cuisine TEXT NOT NULL,
  diet_type TEXT NOT NULL,
  time_minutes INTEGER NOT NULL,
  ingredients JSONB NOT NULL,
  steps JSONB NOT NULL,
  calories INTEGER NOT NULL,
  protein DECIMAL(5,1) NOT NULL,
  carbs DECIMAL(5,1) NOT NULL,
  fats DECIMAL(5,1) NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Favoriler tablosu
CREATE TABLE IF NOT EXISTS users_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, recipe_id)
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_recipes_cuisine ON recipes(cuisine);
CREATE INDEX IF NOT EXISTS idx_recipes_diet_type ON recipes(diet_type);
CREATE INDEX IF NOT EXISTS idx_recipes_time ON recipes(time_minutes);
CREATE INDEX IF NOT EXISTS idx_users_favorites_user_id ON users_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_users_favorites_recipe_id ON users_favorites(recipe_id);

-- RLS (Row Level Security) politikaları
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE users_favorites ENABLE ROW LEVEL SECURITY;

-- Herkes tarifleri okuyabilir
CREATE POLICY "Tarifler herkese açık" ON recipes
  FOR SELECT USING (true);

-- Sadece admin tarif ekleyebilir (şimdilik herkes)
CREATE POLICY "Herkes tarif ekleyebilir" ON recipes
  FOR INSERT WITH CHECK (true);

-- Kullanıcılar kendi favorilerini görebilir
CREATE POLICY "Kullanıcılar kendi favorilerini görebilir" ON users_favorites
  FOR SELECT USING (auth.uid() = user_id);

-- Kullanıcılar kendi favorilerine ekleyebilir
CREATE POLICY "Kullanıcılar favori ekleyebilir" ON users_favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Kullanıcılar kendi favorilerini silebilir
CREATE POLICY "Kullanıcılar favori silebilir" ON users_favorites
  FOR DELETE USING (auth.uid() = user_id);

-- Örnek tarifler ekle
INSERT INTO recipes (title, cuisine, diet_type, time_minutes, ingredients, steps, calories, protein, carbs, fats) VALUES
('Yumurtalı Omlet', 'Türk', 'Normal', 10, 
  '["2 yumurta", "1 domates", "1 biber", "Tuz", "Karabiber"]'::jsonb,
  '["Yumurtaları çırpın", "Domates ve biberi doğrayın", "Tavada pişirin", "Servis yapın"]'::jsonb,
  220, 14, 8, 15),

('Vegan Buddha Bowl', 'Akdeniz', 'Vegan', 25,
  '["Kinoa", "Nohut", "Avokado", "Domates", "Salatalık", "Limon"]'::jsonb,
  '["Kinoayı haşlayın", "Nohutları fırınlayın", "Sebzeleri doğrayın", "Kasede birleştirin"]'::jsonb,
  380, 12, 45, 18),

('Tavuk Göğsü Izgara', 'Türk', 'Düşük Karbonhidrat', 20,
  '["Tavuk göğsü", "Zeytinyağı", "Baharatlar", "Limon"]'::jsonb,
  '["Tavuğu marine edin", "Izgarada pişirin", "Dinlendirin", "Servis yapın"]'::jsonb,
  165, 31, 0, 3.6),

('Makarna Carbonara', 'İtalyan', 'Normal', 30,
  '["Spagetti", "Yumurta", "Parmesan", "Pancetta", "Karabiber"]'::jsonb,
  '["Makarnayı haşlayın", "Pancetta''yı kızartın", "Yumurta sosunu hazırlayın", "Karıştırıp servis yapın"]'::jsonb,
  520, 22, 58, 22),

('Somon Izgara', 'Akdeniz', 'Keto', 15,
  '["Somon fileto", "Limon", "Dereotu", "Zeytinyağı"]'::jsonb,
  '["Somonu marine edin", "Izgarada pişirin", "Limon sıkın", "Servis yapın"]'::jsonb,
  280, 34, 0, 15),

('Mercimek Çorbası', 'Türk', 'Vegan', 35,
  '["Kırmızı mercimek", "Soğan", "Havuç", "Baharatlar"]'::jsonb,
  '["Sebzeleri kavurun", "Mercimeği ekleyin", "Haşlayın", "Blenderdan geçirin"]'::jsonb,
  180, 9, 30, 2);
