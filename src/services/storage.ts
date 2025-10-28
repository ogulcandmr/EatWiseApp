// Storage servisi - AsyncStorage kullanımı
import AsyncStorage from '@react-native-async-storage/async-storage';

export class StorageService {
  // Kullanıcı verilerini kaydet
  static async saveUser(user: any): Promise<void> {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(user));
    } catch (error) {
      console.error('Save user error:', error);
      throw error;
    }
  }

  // Kullanıcı verilerini getir
  static async getUser(): Promise<any | null> {
    try {
      const user = await AsyncStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Get user error:', error);
      return null;
    }
  }

  // Öğün verilerini kaydet
  static async saveMeal(meal: any): Promise<void> {
    try {
      const meals = await this.getMeals();
      meals.push(meal);
      await AsyncStorage.setItem('meals', JSON.stringify(meals));
    } catch (error) {
      console.error('Save meal error:', error);
      throw error;
    }
  }

  // Öğün verilerini getir
  static async getMeals(): Promise<any[]> {
    try {
      const meals = await AsyncStorage.getItem('meals');
      return meals ? JSON.parse(meals) : [];
    } catch (error) {
      console.error('Get meals error:', error);
      return [];
    }
  }

  // Sağlık verilerini kaydet
  static async saveHealthData(date: string, data: any): Promise<void> {
    try {
      const healthData = await this.getHealthData();
      healthData[date] = data;
      await AsyncStorage.setItem('healthData', JSON.stringify(healthData));
    } catch (error) {
      console.error('Save health data error:', error);
      throw error;
    }
  }

  // Sağlık verilerini getir
  static async getHealthData(): Promise<any> {
    try {
      const healthData = await AsyncStorage.getItem('healthData');
      return healthData ? JSON.parse(healthData) : {};
    } catch (error) {
      console.error('Get health data error:', error);
      return {};
    }
  }

  // Ayarları kaydet
  static async saveSettings(settings: any): Promise<void> {
    try {
      await AsyncStorage.setItem('settings', JSON.stringify(settings));
    } catch (error) {
      console.error('Save settings error:', error);
      throw error;
    }
  }

  // Ayarları getir
  static async getSettings(): Promise<any> {
    try {
      const settings = await AsyncStorage.getItem('settings');
      return settings ? JSON.parse(settings) : {};
    } catch (error) {
      console.error('Get settings error:', error);
      return {};
    }
  }

  // Tüm verileri temizle
  static async clearAll(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Clear storage error:', error);
      throw error;
    }
  }
}
