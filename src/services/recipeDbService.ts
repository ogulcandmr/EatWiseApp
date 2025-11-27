import { Alert } from 'react-native';

export interface RecipeDb {
  id: string;
  title: string;
  image_url: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  ingredients: string[];
  steps: string[];
  cuisine: string;
  diet_type: string;
  time_minutes: number;
}

const MOCK_RECIPES: RecipeDb[] = [
  // --- KAHVALTILAR ---
  {
    id: '1',
    title: 'Meyveli Yulaf Lapası',
    // Yulaf kasesi resmi
    image_url: 'https://images.unsplash.com/photo-1702648982253-8b851013e81f?q=80&w=3024&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    calories: 320,
    protein: 12,
    carbs: 45,
    fats: 8,
    cuisine: 'Modern',
    diet_type: 'Yüksek Lif',
    time_minutes: 10,
    ingredients: ['50g yulaf ezmesi', '150ml süt', '1 tatlı kaşığı bal', 'Yarım muz', 'Yaban mersini'],
    steps: ['Süt ve yulafı tencerede kıvam alana kadar pişirin.', 'Kaseye alıp üzerini meyvelerle süsleyin.', 'Bal gezdirip servis yapın.']
  },
  {
    id: '2',
    title: 'Geleneksel Menemen',
    // Tavada yumurtalı domatesli yemek (Shakshuka benzeri)
    image_url: 'https://images.unsplash.com/photo-1590412200988-a436970781fa?auto=format&fit=crop&w=800&q=80',
    calories: 410,
    protein: 18,
    carbs: 12,
    fats: 30,
    cuisine: 'Türk',
    diet_type: 'Vejetaryen',
    time_minutes: 20,
    ingredients: ['2 yumurta', '2 domates', '2 yeşil biber', '1 yk zeytinyağı', 'Baharatlar'],
    steps: ['Biberleri yağda kavurun.', 'Doğranmış domatesleri ekleyip pişirin.', 'Yumurtaları kırıp karıştırın.']
  },
  {
    id: '3',
    title: 'Avokado Soslu Ekmek',
    // Avokado tost resmi
    image_url: 'https://images.unsplash.com/photo-1588137372308-15f75323ca8d?auto=format&fit=crop&w=800&q=80',
    calories: 380,
    protein: 14,
    carbs: 22,
    fats: 25,
    cuisine: 'Modern',
    diet_type: 'Dengeli',
    time_minutes: 15,
    ingredients: ['1 dilim tam buğday ekmeği', 'Yarım avokado', '1 yumurta', 'Limon', 'Çörek otu'],
    steps: ['Ekmeği kızartın.', 'Avokadoyu ezip ekmeğe sürün.', 'Yumurtayı kaynar sirkeli suda 3 dk pişirip üzerine koyun.']
  },
  {
    id: '4',
    title: 'Ispanaklı Mantarlı Omlet',
    // Omlet resmi
    image_url: 'https://images.unsplash.com/photo-1510693206972-df098062cb71?auto=format&fit=crop&w=800&q=80',
    calories: 280,
    protein: 20,
    carbs: 5,
    fats: 18,
    cuisine: 'Avrupa',
    diet_type: 'Düşük Karb',
    time_minutes: 12,
    ingredients: ['2 yumurta', '50g ıspanak', '3 mantar', 'Az yağlı peynir'],
    steps: ['Mantarları ve ıspanağı soteleyin.', 'Çırpılmış yumurtayı ekleyin.', 'Peyniri serpip katlayın.']
  },
  {
    id: '5',
    title: 'Fit Muzlu Pankek',
    // Pankek yığını
    image_url: 'https://images.unsplash.com/photo-1506084868230-bb9d95c24759?auto=format&fit=crop&w=800&q=80',
    calories: 350,
    protein: 15,
    carbs: 40,
    fats: 10,
    cuisine: 'Amerikan',
    diet_type: 'Tatlı',
    time_minutes: 20,
    ingredients: ['1 muz', '2 yumurta', 'Yulaf unu', 'Kabartma tozu'],
    steps: ['Tüm malzemeleri blenderdan geçirin.', 'Yapışmaz tavada önlü arkalı pişirin.']
  },
  {
    id: '6',
    title: 'Yeşil Detoks Smoothie',
    // Yeşil içecek
    image_url: 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?auto=format&fit=crop&w=800&q=80',
    calories: 180,
    protein: 4,
    carbs: 35,
    fats: 2,
    cuisine: 'İçecek',
    diet_type: 'Vegan',
    time_minutes: 5,
    ingredients: ['1 yeşil elma', 'Yarım salatalık', '1 avuç ıspanak', 'Limon suyu', 'Su'],
    steps: ['Tüm malzemeleri pürüzsüz olana kadar blenderdan geçirin.']
  },

  // --- ANA YEMEKLER ---
  {
    id: '7',
    title: 'Izgara Tavuk ve Kinoa',
    // Tavuk salatası tabağı
    image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    calories: 450,
    protein: 40,
    carbs: 35,
    fats: 12,
    cuisine: 'Dünya',
    diet_type: 'Yüksek Protein',
    time_minutes: 30,
    ingredients: ['150g tavuk göğsü', '100g haşlanmış kinoa', 'Brokoli', 'Zeytinyağı'],
    steps: ['Tavuğu baharatlayıp ızgarada pişirin.', 'Kinoayı haşlayın.', 'Haşlanmış brokoli ile servis yapın.']
  },
  {
    id: '8',
    title: 'Fırında Köfte ve Sebze',
    // Köfte tabağı
    image_url: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&w=800&q=80',
    calories: 520,
    protein: 35,
    carbs: 20,
    fats: 28,
    cuisine: 'Türk',
    diet_type: 'Yüksek Protein',
    time_minutes: 45,
    ingredients: ['150g az yağlı kıyma', 'Soğan', 'Biber', 'Patates', 'Domates sosu'],
    steps: ['Köfteleri yoğurun.', 'Tepsiye köfte ve sebzeleri dizin.', 'Soslayıp 200 derecede pişirin.']
  },
  {
    id: '9',
    title: 'Asya Usulü Hindi Sote',
    // Wok tavada yemek
    image_url: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80',
    calories: 380,
    protein: 45,
    carbs: 10,
    fats: 15,
    cuisine: 'Asya',
    diet_type: 'Düşük Karb',
    time_minutes: 25,
    ingredients: ['200g hindi göğüs', 'Renkli biberler', 'Soya sosu', 'Susam'],
    steps: ['Hindiyi kuşbaşı doğrayıp soteleyin.', 'Biberleri ekleyin.', 'Soya sosu ile tatlandırın.']
  },
  {
    id: '10',
    title: 'Tavuklu Kabak Spagetti',
    // Kabak makarnası (Zoodles)
    image_url: 'https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?auto=format&fit=crop&w=800&q=80',
    calories: 320,
    protein: 30,
    carbs: 15,
    fats: 12,
    cuisine: 'İtalyan',
    diet_type: 'Düşük Karb',
    time_minutes: 20,
    ingredients: ['2 kabak', '150g tavuk', 'Domates sosu', 'Sarımsak'],
    steps: ['Kabakları spagetti gibi doğrayın.', 'Tavukları soteleyin.', 'Kabakları ekleyip 2-3 dk çevirin.']
  },
  {
    id: '11',
    title: 'Izgara Bonfile Salatası',
    // Etli salata
    image_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
    calories: 480,
    protein: 42,
    carbs: 12,
    fats: 25,
    cuisine: 'Akdeniz',
    diet_type: 'Yüksek Protein',
    time_minutes: 20,
    ingredients: ['150g bonfile', 'Roka', 'Cherry domates', 'Balzamik sirke', 'Parmesan'],
    steps: ['Eti ızgarada istediğiniz gibi pişirin.', 'Yeşilliklerin üzerine dilimleyin.', 'Soslayıp servis yapın.']
  },
  {
    id: '12',
    title: 'Tavuk Şiş',
    // Kebap şiş
    image_url: 'https://images.unsplash.com/photo-1532635224-cfcd87bdb5ed?auto=format&fit=crop&w=800&q=80',
    calories: 550,
    protein: 38,
    carbs: 55,
    fats: 15,
    cuisine: 'Türk',
    diet_type: 'Dengeli',
    time_minutes: 35,
    ingredients: ['Tavuk göğsü', 'Yoğurt (marine için)', 'Bulgur', 'Salça'],
    steps: ['Tavukları marine edip şişe dizin.', 'Izgarada pişirin.', 'Yanına sebzeli bulgur pilavı yapın.']
  },

  // --- DENİZ ÜRÜNLERİ ---
  {
    id: '13',
    title: 'Fırında Somon',
    // Pişmiş somon tabağı
    image_url: 'https://images.unsplash.com/photo-1485921325833-c519f76c4927?auto=format&fit=crop&w=800&q=80',
    calories: 450,
    protein: 35,
    carbs: 5,
    fats: 28,
    cuisine: 'Akdeniz',
    diet_type: 'Deniz Ürünleri',
    time_minutes: 25,
    ingredients: ['Somon fileto', 'Limon', 'Dereotu', 'Kuşkonmaz'],
    steps: ['Somonu yağlı kağıda koyun.', 'Limon ve dereotu ekleyin.', '200 derecede 15-20 dk pişirin.']
  },
  {
    id: '14',
    title: 'Ton Balıklı Salata',
    // Ton balıklı salata kasesi
    image_url: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?auto=format&fit=crop&w=800&q=80',
    calories: 320,
    protein: 28,
    carbs: 10,
    fats: 14,
    cuisine: 'Akdeniz',
    diet_type: 'Yüksek Protein',
    time_minutes: 10,
    ingredients: ['1 kutu ton balığı', 'Marul', 'Mısır', 'Salatalık', 'Zeytinyağı'],
    steps: ['Yeşillikleri yıkayıp doğrayın.', 'Ton balığını ekleyin.', 'Limon ve zeytinyağı ile soslayın.']
  },
  {
    id: '15',
    title: 'Karidesli Makarna',
    // Karidesli yemek
    image_url: 'https://images.unsplash.com/photo-1555126634-323283e090fa?auto=format&fit=crop&w=800&q=80',
    calories: 300,
    protein: 25,
    carbs: 45,
    fats: 15,
    cuisine: 'İtalyan',
    diet_type: 'Deniz Ürünleri',
    time_minutes: 25,
    ingredients: ['200g karides', 'Domates', 'Sarımsak', 'Tereyağı', 'Mantar'],
    steps: ['Sebzeleri soteleyin.', 'Karidesleri ekleyin.', 'Makarna ile karıştırın.']
  },
  {
    id: '16',
    title: 'Levrek Buğulama',
    // Bütün balık
    image_url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80',
    calories: 380,
    protein: 32,
    carbs: 15,
    fats: 18,
    cuisine: 'Türk',
    diet_type: 'Deniz Ürünleri',
    time_minutes: 35,
    ingredients: ['Levrek', 'Patates', 'Soğan', 'Limon', 'Defne yaprağı'],
    steps: ['Sebzeleri tepsiye dizin.', 'Balığı üste koyun.', 'Az su ve zeytinyağı ekleyip fırınlayın.']
  },

  // --- SEBZELER ---
  {
    id: '17',
    title: 'Zeytinyağlı Fasulye',
    // Yeşil fasulye
    image_url: 'https://images.unsplash.com/photo-1592417817098-8fd3d9eb14a5?auto=format&fit=crop&w=800&q=80',
    calories: 180,
    protein: 4,
    carbs: 20,
    fats: 10,
    cuisine: 'Türk',
    diet_type: 'Vejetaryen',
    time_minutes: 40,
    ingredients: ['500g taze fasulye', '1 soğan', '2 domates', 'Zeytinyağı'],
    steps: ['Soğanı kavurun.', 'Fasulyeleri ekleyip sarartın.', 'Domates ve az su ekleyip kısık ateşte pişirin.']
  },
  {
    id: '18',
    title: 'Falafel Tabağı',
    // Falafel
    image_url: 'https://images.unsplash.com/photo-1593001874117-c99c800e3eb7?auto=format&fit=crop&w=800&q=80',
    calories: 250,
    protein: 10,
    carbs: 40,
    fats: 5,
    cuisine: 'Akdeniz',
    diet_type: 'Vegan',
    time_minutes: 30,
    ingredients: ['Kırmızı mercimek', 'İnce bulgur', 'Soğan', 'Salça', 'Yeşillik'],
    steps: ['Mercimeği haşlayın, bulguru ekleyip şişirin.', 'Salçalı soğanı ekleyin.', 'Yeşillikle yoğurup şekil verin.']
  },
  {
    id: '19',
    title: 'Nohutlu Ispanak',
    // Ispanak yemeği
    image_url: 'https://images.unsplash.com/photo-1589139365511-b0113c01bf63?auto=format&fit=crop&w=800&q=80',
    calories: 220,
    protein: 12,
    carbs: 25,
    fats: 8,
    cuisine: 'Türk',
    diet_type: 'Vejetaryen',
    time_minutes: 25,
    ingredients: ['Ispanak', 'Haşlanmış nohut', 'Soğan', 'Salça'],
    steps: ['Soğanı kavurun.', 'Ispanakları ekleyip öldürün.', 'Nohutları ekleyip 5 dk daha pişirin.']
  },
  {
    id: '20',
    title: 'Sebze Köftesi (Mücver)',
    // Mücver benzeri kızarmış sebze
    image_url: 'https://images.unsplash.com/photo-1563126084-3c66289d09c3?auto=format&fit=crop&w=800&q=80',
    calories: 150,
    protein: 8,
    carbs: 12,
    fats: 6,
    cuisine: 'Türk',
    diet_type: 'Vejetaryen',
    time_minutes: 35,
    ingredients: ['2 kabak', '2 yumurta', 'Dereotu', 'Beyaz peynir', 'Tam buğday unu'],
    steps: ['Kabakları rendeleyip suyunu sıkın.', 'Malzemeleri karıştırın.', 'Yağlı kağıda kaşıkla döküp fırınlayın.']
  },
  {
    id: '21',
    title: 'Yeşil Mercimek Yemeği',
    // Mercimek çorbası/yemeği
    image_url: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80',
    calories: 280,
    protein: 18,
    carbs: 45,
    fats: 5,
    cuisine: 'Türk',
    diet_type: 'Vegan',
    time_minutes: 40,
    ingredients: ['Yeşil mercimek', 'Soğan', 'Havuç', 'Erişte (opsiyonel)'],
    steps: ['Mercimeği hafif haşlayıp süzün.', 'Soğan ve havucu kavurun.', 'Mercimeği ekleyip pişirin.']
  },
  {
    id: '22',
    title: 'Karnabahar Pilavı',
    // Karnabahar pilavı (beyaz taneli)
    image_url: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=800&q=80',
    calories: 120,
    protein: 5,
    carbs: 15,
    fats: 4,
    cuisine: 'Modern',
    diet_type: 'Düşük Karb',
    time_minutes: 15,
    ingredients: ['Karnabahar', 'Soğan', 'Sarımsak', 'Zerdeçal'],
    steps: ['Karnabaharı robottan geçirin.', 'Az yağda soğanla kavurun.', 'Baharatlandırıp servis yapın.']
  },
  {
    id: '23',
    title: 'Humus Tabağı',
    // Humus
    image_url: 'https://images.unsplash.com/photo-1637949385163-27500e4800bb?auto=format&fit=crop&w=800&q=80',
    calories: 420,
    protein: 16,
    carbs: 55,
    fats: 18,
    cuisine: 'Akdeniz',
    diet_type: 'Vegan',
    time_minutes: 40,
    ingredients: ['Nohut', 'Maydanoz', 'Sarımsak', 'Kimyon', 'Tahini sos'],
    steps: ['Nohutları ve otları robottan çekin.', 'Püre haline getirin.', 'Zeytinyağı ile servis yapın.']
  },
  {
    id: '24',
    title: 'Sebzeli Noodle',
    // Noodle kasesi
    image_url: 'https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=800&q=80',
    calories: 380,
    protein: 12,
    carbs: 65,
    fats: 8,
    cuisine: 'Asya',
    diet_type: 'Vegan',
    time_minutes: 15,
    ingredients: ['Tam buğday noodle', 'Kabak', 'Havuç', 'Soya sosu', 'Zencefil'],
    steps: ['Noodle\'ı haşlayın.', 'Sebzeleri jülyen doğrayıp yüksek ateşte soteleyin.', 'Hepsini karıştırın.']
  },

  // --- TATLILAR ---
  {
    id: '25',
    title: 'Chia Puding',
    // Chia puding
    image_url: 'https://images.unsplash.com/photo-1551024601-bec0273e132e?auto=format&fit=crop&w=800&q=80',
    calories: 220,
    protein: 8,
    carbs: 25,
    fats: 12,
    cuisine: 'Modern',
    diet_type: 'Tatlı',
    time_minutes: 5,
    ingredients: ['3 yk chia tohumu', '1 bardak süt', 'Bal', 'Çilek'],
    steps: ['Süt, bal ve chia tohumunu karıştırın.', 'Dolapta en az 2 saat bekletin.', 'Meyve ile süsleyin.']
  },
  {
    id: '26',
    title: 'Enerji Topları',
    // Enerji topları (hurma topları)
    image_url: 'https://images.unsplash.com/photo-1604547902528-7634f1647496?auto=format&fit=crop&w=800&q=80',
    calories: 180,
    protein: 5,
    carbs: 30,
    fats: 8,
    cuisine: 'Modern',
    diet_type: 'Tatlı',
    time_minutes: 10,
    ingredients: ['10 adet hurma', 'Ceviz', 'Kakao', 'Hindistan cevizi'],
    steps: ['Hurma, ceviz ve kakaoyu robottan geçirin.', 'Yuvarlayıp top yapın.', 'Hindistan cevizine bulayın.']
  },
  {
    id: '27',
    title: 'Fıstık Ezmeli Elma',
    // Elma dilimleri ve fıstık ezmesi
    image_url: 'https://images.unsplash.com/photo-1568289721666-3d23194a2879?auto=format&fit=crop&w=800&q=80',
    calories: 160,
    protein: 4,
    carbs: 20,
    fats: 8,
    cuisine: 'Pratik',
    diet_type: 'Dengeli',
    time_minutes: 5,
    ingredients: ['1 yeşil elma', '1 yk şekersiz fıstık ezmesi', 'Tarçın'],
    steps: ['Elmayı dilimleyin.', 'Üzerine fıstık ezmesi sürün.', 'Tarçın serpip yiyin.']
  },
  {
    id: '28',
    title: 'Ev Yapımı Granola',
    // Granola kasesi
    image_url: 'https://images.unsplash.com/photo-1515286214279-78c66a4f9408?auto=format&fit=crop&w=800&q=80',
    calories: 280,
    protein: 8,
    carbs: 40,
    fats: 12,
    cuisine: 'Modern',
    diet_type: 'Yüksek Lif',
    time_minutes: 30,
    ingredients: ['Yulaf', 'Kuruyemişler', 'Bal', 'Hindistan cevizi yağı'],
    steps: ['Hepsini karıştırıp tepsiye yayın.', '160 derece fırında karıştırarak kızartın.', 'Soğuyunca kavanoza alın.']
  },
  {
    id: '29',
    title: 'Orman Meyveli Yoğurt',
    // Yoğurt bar/kasesi
    image_url: 'https://images.unsplash.com/photo-1488477181946-6428a029177b?auto=format&fit=crop&w=800&q=80',
    calories: 140,
    protein: 6,
    carbs: 15,
    fats: 5,
    cuisine: 'Modern',
    diet_type: 'Tatlı',
    time_minutes: 10,
    ingredients: ['Süzme yoğurt', 'Bal', 'Orman meyveleri', 'Antep fıstığı'],
    steps: ['Yoğurt ve balı karıştırıp kaseye alın.', 'Meyveleri serpiştirin.', 'Soğuk servis yapın.']
  },
  {
    id: '30',
    title: 'Sütlaç (Şekersiz)',
    // Sütlaç kasesi
    image_url: 'https://images.unsplash.com/photo-1518330722306-38d706d81729?auto=format&fit=crop&w=800&q=80',
    calories: 200,
    protein: 6,
    carbs: 35,
    fats: 4,
    cuisine: 'Türk',
    diet_type: 'Tatlı',
    time_minutes: 30,
    ingredients: ['Süt', 'Pirinç', 'Bal', 'Vanilya', 'Tarçın'],
    steps: ['Pirinci haşlayın.', 'Sütü ekleyip pişirin.', 'Ilıyınca bal ekleyin, tarçınla servis edin.']
  },
];

export const RecipeDbService = {
  async getRecipes(): Promise<RecipeDb[]> {
    // Kullanıcıya veri çekiliyormuş hissi vermek için kısa bir bekleme (loading) ekliyoruz.
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(MOCK_RECIPES);
      }, 500);
    });
  },

  async getUserFavorites(userId: string): Promise<RecipeDb[]> {
    return [];
  },

  async addToFavorites(userId: string, recipeId: string): Promise<void> {
    console.log(`Tarif ${recipeId} favorilere eklendi`);
  },

  async removeFromFavorites(userId: string, recipeId: string): Promise<void> {
    console.log(`Tarif ${recipeId} favorilerden çıkarıldı`);
  },

  getCuisineTypes() {
    return ['Türk', 'İtalyan', 'Asya', 'Akdeniz', 'Modern', 'Amerikan', 'Avrupa'];
  },

  getDietTypes() {
    return ['Dengeli', 'Yüksek Protein', 'Vejetaryen', 'Vegan', 'Düşük Karb', 'Tatlı', 'Deniz Ürünleri', 'Yüksek Lif'];
  },

  getTimeFilters() {
    return [
      { label: '< 15 dk', value: 15 },
      { label: '< 30 dk', value: 30 },
      { label: '< 45 dk', value: 45 },
      { label: '< 60 dk', value: 60 },
    ];
  }
};