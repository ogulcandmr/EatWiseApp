import { supabase } from './supabase';
import * as ImagePicker from 'expo-image-picker';

export class PhotoService {
  /**
   * Kamera izni iste
   */
  static async requestCameraPermission(): Promise<boolean> {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    return status === 'granted';
  }

  /**
   * Galeri izni iste
   */
  static async requestGalleryPermission(): Promise<boolean> {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === 'granted';
  }

  /**
   * Kamera ile fotoğraf çek
   */
  static async takePhoto(): Promise<string | null> {
    try {
      const hasPermission = await this.requestCameraPermission();
      if (!hasPermission) {
        throw new Error('Kamera izni reddedildi');
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        return result.assets[0].uri;
      }

      return null;
    } catch (error: any) {
      console.error('Fotoğraf çekme hatası:', error);
      throw new Error('Fotoğraf çekilemedi');
    }
  }

  /**
   * Galeriden fotoğraf seç
   */
  static async pickFromGallery(): Promise<string | null> {
    try {
      const hasPermission = await this.requestGalleryPermission();
      if (!hasPermission) {
        throw new Error('Galeri izni reddedildi');
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        return result.assets[0].uri;
      }

      return null;
    } catch (error: any) {
      console.error('Galeri seçme hatası:', error);
      throw new Error('Fotoğraf seçilemedi');
    }
  }

  /**
   * Fotoğrafı Supabase Storage'a yükle
   */
  static async uploadPhoto(uri: string, userId: string): Promise<string> {
    try {
      // Dosya adı oluştur
      const timestamp = Date.now();
      const fileName = `${userId}/${timestamp}.jpg`;

      // Fetch ile dosyayı al
      const response = await fetch(uri);
      const blob = await response.blob();

      // ArrayBuffer'a çevir
      const arrayBuffer = await new Response(blob).arrayBuffer();

      // Supabase'e yükle
      const { data, error } = await supabase.storage
        .from('food-photos')
        .upload(fileName, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (error) {
        console.error('Supabase upload error:', error);
        throw error;
      }

      // Public URL al
      const { data: urlData } = supabase.storage
        .from('food-photos')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error: any) {
      console.error('Fotoğraf yükleme hatası:', error);
      throw new Error('Fotoğraf yüklenemedi');
    }
  }

  /**
   * Fotoğrafı sil
   */
  static async deletePhoto(photoUrl: string): Promise<void> {
    try {
      // URL'den dosya yolunu çıkar
      const urlParts = photoUrl.split('/food-photos/');
      if (urlParts.length < 2) return;

      const filePath = urlParts[1].split('?')[0];

      const { error } = await supabase.storage
        .from('food-photos')
        .remove([filePath]);

      if (error) throw error;
    } catch (error: any) {
      console.error('Fotoğraf silme hatası:', error);
      throw new Error('Fotoğraf silinemedi');
    }
  }
}
