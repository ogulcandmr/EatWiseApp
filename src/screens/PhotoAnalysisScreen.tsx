import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { colors, shadows } from '../theme';
import { PhotoService } from '../services/photoService';
import { FoodAnalysisService } from '../services/foodAnalysisService';
import { MealService } from '../services/mealService';
import { AuthService } from '../services/authService';
import { FoodAnalysisResult } from '../types/foodAnalysis';

export default function PhotoAnalysisScreen() {
  const { isDark } = useTheme();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<FoodAnalysisResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [useAI, setUseAI] = useState(true); // AI analiz varsayılan olarak açık

  const handleTakePhoto = async () => {
    try {
      const uri = await PhotoService.takePhoto();
      if (uri) {
        setPhotoUri(uri);
        setAnalysis(null);
      }
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Fotoğraf çekilemedi');
    }
  };

  const handlePickFromGallery = async () => {
    try {
      const uri = await PhotoService.pickFromGallery();
      if (uri) {
        setPhotoUri(uri);
        setAnalysis(null);
      }
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Fotoğraf seçilemedi');
    }
  };

  const handleAnalyze = async () => {
    if (!photoUri) {
      Alert.alert('Hata', 'Lütfen önce bir fotoğraf seçin');
      return;
    }

    try {
      setUploading(true);
      setAnalyzing(true);

      // Kullanıcı ID'sini al
      const user = await AuthService.getCurrentUser();
      if (!user) {
        throw new Error('Kullanıcı bulunamadı');
      }

      // Fotoğrafı Supabase'e yükle
      const imageUrl = await PhotoService.uploadPhoto(photoUri, user.id);

      // Analiz yap (AI veya Mock)
      const result = await FoodAnalysisService.analyzeFoodPhoto(imageUrl, useAI);

      setAnalysis(result);
      
      const analysisTypeText = result.analysisType === 'ai' ? 'AI ile' : 'Mock';
      Alert.alert(
        'Analiz Tamamlandı',
        `${analysisTypeText} ${result.items.length} yemek tespit edildi. Toplam ${Math.round(result.totals.calories)} kalori.`
      );
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Analiz yapılamadı');
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  };

  const handleSaveToMeals = async () => {
    if (!analysis) return;

    try {
      setSaving(true);

      const user = await AuthService.getCurrentUser();
      if (!user) {
        throw new Error('Kullanıcı bulunamadı');
      }

      // Meal olarak kaydet
      const mealData = FoodAnalysisService.formatAsMeal(analysis, user.id);
      await MealService.addMeal(mealData);

      Alert.alert(
        'Başarılı',
        'Öğün kaydedildi! Öğünler sekmesinden görebilirsiniz.',
        [
          {
            text: 'Tamam',
            onPress: () => {
              // Reset
              setPhotoUri(null);
              setAnalysis(null);
            }
          }
        ]
      );
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Öğün kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setPhotoUri(null);
    setAnalysis(null);
  };

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={isDark ? ['#1E3A8A', '#1E40AF', '#2563EB'] : ['#10B981', '#059669'] as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View>
          <Text style={styles.title}>Fotoğrafla Kalori</Text>
          <Text style={styles.subtitle}>Yemeğini çek, kalorisini öğren</Text>
        </View>
        
        {/* AI Toggle */}
        <TouchableOpacity
          style={[styles.aiToggle, useAI && styles.aiToggleActive]}
          onPress={() => setUseAI(!useAI)}
        >
          <MaterialIcons
            name={useAI ? 'psychology' : 'lightbulb-outline'}
            size={20}
            color={useAI ? 'white' : '#666'}
          />
          <Text style={[styles.aiToggleText, useAI && styles.aiToggleTextActive]}>
            {useAI ? 'AI Analiz' : 'Mock'}
          </Text>
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Photo Section */}
        {!photoUri ? (
          <View style={styles.uploadSection}>
            <MaterialIcons name="camera-alt" size={64} color="#ccc" />
            <Text style={styles.uploadText}>Fotoğraf ekle</Text>
            <Text style={styles.uploadSubtext}>
              Yemeğinizin fotoğrafını çekin veya galeriden seçin
            </Text>

            <View style={styles.uploadButtons}>
              <TouchableOpacity style={styles.uploadButton} onPress={handleTakePhoto}>
                <MaterialIcons name="camera" size={24} color="white" />
                <Text style={styles.uploadButtonText}>Fotoğraf Çek</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.uploadButton, styles.galleryButton]}
                onPress={handlePickFromGallery}
              >
                <MaterialIcons name="photo-library" size={24} color="#4CAF50" />
                <Text style={[styles.uploadButtonText, styles.galleryButtonText]}>
                  Galeriden Seç
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.photoContainer}>
            <Image source={{ uri: photoUri }} style={styles.photo} />
            
            {!analysis && (
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.analyzeButton]}
                  onPress={handleAnalyze}
                  disabled={uploading || analyzing}
                >
                  {uploading || analyzing ? (
                    <>
                      <ActivityIndicator size="small" color="white" />
                      <Text style={styles.actionButtonText}>
                        {uploading ? 'Yükleniyor...' : 'Analiz Ediliyor...'}
                      </Text>
                    </>
                  ) : (
                    <>
                      <MaterialIcons name="analytics" size={20} color="white" />
                      <Text style={styles.actionButtonText}>Analiz Et</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.resetButton]}
                  onPress={handleReset}
                  disabled={uploading || analyzing}
                >
                  <MaterialIcons name="refresh" size={20} color="#666" />
                  <Text style={styles.resetButtonText}>Yeni Fotoğraf</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Analysis Results */}
        {analysis && (
          <View style={styles.resultsSection}>
            {/* Analysis Type Badge */}
            <View style={styles.analysisTypeBadge}>
              <MaterialIcons
                name={analysis.analysisType === 'ai' ? 'psychology' : 'lightbulb'}
                size={16}
                color="white"
              />
              <Text style={styles.analysisTypeText}>
                {analysis.analysisType === 'ai' ? 'AI Analiz' : 'Mock Analiz'}
              </Text>
            </View>

            {/* Totals Card */}
            <View style={styles.totalsCard}>
              <Text style={styles.totalsTitle}>Toplam Besin Değerleri</Text>
              <Text style={styles.portionText}>{analysis.portion}</Text>

              <View style={styles.totalsGrid}>
                <View style={styles.totalItem}>
                  <MaterialIcons name="local-fire-department" size={32} color="#FF5722" />
                  <Text style={styles.totalValue}>{Math.round(analysis.totals.calories)}</Text>
                  <Text style={styles.totalLabel}>Kalori</Text>
                </View>
                <View style={styles.totalItem}>
                  <Text style={styles.totalValueSmall}>
                    {Math.round(analysis.totals.protein)}g
                  </Text>
                  <Text style={styles.totalLabel}>Protein</Text>
                </View>
                <View style={styles.totalItem}>
                  <Text style={styles.totalValueSmall}>
                    {Math.round(analysis.totals.carbs)}g
                  </Text>
                  <Text style={styles.totalLabel}>Karbonhidrat</Text>
                </View>
                <View style={styles.totalItem}>
                  <Text style={styles.totalValueSmall}>{Math.round(analysis.totals.fats)}g</Text>
                  <Text style={styles.totalLabel}>Yağ</Text>
                </View>
              </View>
            </View>

            {/* Food Items */}
            <View style={styles.itemsSection}>
              <Text style={styles.sectionTitle}>Tespit Edilen Yiyecekler</Text>
              {analysis.items.map((item, index) => (
                <View key={index} style={styles.foodItem}>
                  <View style={styles.foodItemHeader}>
                    <Text style={styles.foodItemName}>{item.name}</Text>
                    <Text style={styles.foodItemGrams}>{item.grams}g</Text>
                  </View>

                  <View style={styles.foodItemMacros}>
                    <View style={styles.foodMacro}>
                      <Text style={styles.foodMacroValue}>{Math.round(item.calories)}</Text>
                      <Text style={styles.foodMacroLabel}>kcal</Text>
                    </View>
                    <View style={styles.foodMacro}>
                      <Text style={styles.foodMacroValue}>{Math.round(item.protein)}g</Text>
                      <Text style={styles.foodMacroLabel}>Protein</Text>
                    </View>
                    <View style={styles.foodMacro}>
                      <Text style={styles.foodMacroValue}>{Math.round(item.carbs)}g</Text>
                      <Text style={styles.foodMacroLabel}>Karbonhidrat</Text>
                    </View>
                    <View style={styles.foodMacro}>
                      <Text style={styles.foodMacroValue}>{Math.round(item.fats)}g</Text>
                      <Text style={styles.foodMacroLabel}>Yağ</Text>
                    </View>
                  </View>

                  {item.confidence && (
                    <View style={styles.confidenceBar}>
                      <View
                        style={[
                          styles.confidenceFill,
                          {
                            width: `${item.confidence * 100}%`,
                            backgroundColor: FoodAnalysisService.getConfidenceColor(
                              item.confidence
                            )
                          }
                        ]}
                      />
                      <Text style={styles.confidenceText}>
                        {FoodAnalysisService.getConfidenceText(item.confidence)}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveToMeals}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <MaterialIcons name="save" size={20} color="white" />
                  <Text style={styles.saveButtonText}>Öğün Olarak Kaydet</Text>
                </>
              )}
            </TouchableOpacity>

            {/* New Photo Button */}
            <TouchableOpacity style={styles.newPhotoButton} onPress={handleReset}>
              <MaterialIcons name="add-a-photo" size={20} color="#4CAF50" />
              <Text style={styles.newPhotoButtonText}>Yeni Fotoğraf Ekle</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>💡 İpuçları</Text>
          <Text style={styles.infoText}>
            • Yemeğin tamamını görecek şekilde fotoğraf çekin{'\n'}
            • İyi aydınlatılmış bir ortamda çekin{'\n'}
            • Tabağı yukarıdan çekin{'\n'}
            • Analiz sonuçları tahminidir, kesin değildir
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  containerDark: {
    backgroundColor: colors.dark.background,
  },
  header: {
    padding: 24,
    paddingTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aiToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 5,
  },
  aiToggleActive: {
    backgroundColor: '#2196F3',
  },
  aiToggleText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
  },
  aiToggleTextActive: {
    color: 'white',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.95)',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  uploadSection: {
    alignItems: 'center',
    padding: 40,
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  uploadText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    marginBottom: 5,
  },
  uploadSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  uploadButtons: {
    width: '100%',
    gap: 10,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    gap: 8,
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  galleryButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  galleryButtonText: {
    color: '#4CAF50',
  },
  photoContainer: {
    margin: 20,
  },
  photo: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  actionButtons: {
    marginTop: 15,
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    gap: 8,
  },
  analyzeButton: {
    backgroundColor: '#4CAF50',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resetButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  resetButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultsSection: {
    padding: 20,
  },
  analysisTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 5,
    marginBottom: 15,
  },
  analysisTypeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  totalsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  totalsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  portionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  totalsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  totalItem: {
    alignItems: 'center',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF5722',
    marginTop: 5,
  },
  totalValueSmall: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  totalLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  itemsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  foodItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  foodItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  foodItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  foodItemGrams: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  foodItemMacros: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  foodMacro: {
    alignItems: 'center',
  },
  foodMacroValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  foodMacroLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  confidenceBar: {
    marginTop: 10,
    height: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 10,
  },
  confidenceText: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    textAlign: 'center',
    lineHeight: 20,
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    gap: 8,
    marginBottom: 10,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  newPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    gap: 8,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  newPhotoButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoSection: {
    margin: 20,
    padding: 15,
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
});
