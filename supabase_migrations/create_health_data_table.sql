-- Sağlık verisi tablosu
CREATE TABLE IF NOT EXISTS health_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  calories_consumed INTEGER DEFAULT 0,
  calories_burned INTEGER,
  water_intake INTEGER DEFAULT 0, -- ml cinsinden
  steps INTEGER,
  sleep_hours DECIMAL(3,1),
  weight DECIMAL(5,2), -- kg cinsinden
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_health_data_user_id ON health_data(user_id);
CREATE INDEX IF NOT EXISTS idx_health_data_date ON health_data(date);
CREATE INDEX IF NOT EXISTS idx_health_data_user_date ON health_data(user_id, date);

-- RLS (Row Level Security) politikaları
ALTER TABLE health_data ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar kendi sağlık verilerini görebilir
CREATE POLICY "Kullanıcılar kendi sağlık verilerini görebilir" ON health_data
  FOR SELECT USING (auth.uid() = user_id);

-- Kullanıcılar kendi sağlık verilerini ekleyebilir
CREATE POLICY "Kullanıcılar sağlık verisi ekleyebilir" ON health_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Kullanıcılar kendi sağlık verilerini güncelleyebilir
CREATE POLICY "Kullanıcılar sağlık verisi güncelleyebilir" ON health_data
  FOR UPDATE USING (auth.uid() = user_id);

-- Kullanıcılar kendi sağlık verilerini silebilir
CREATE POLICY "Kullanıcılar sağlık verisi silebilir" ON health_data
  FOR DELETE USING (auth.uid() = user_id);
