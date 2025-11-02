import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { VoiceService } from '../services/voiceService';
import { RecipeService } from '../services/recipeService';
import { Recipe, RecipeMode } from '../types/recipe';

interface VoiceAssistantModalProps {
  visible: boolean;
  onClose: () => void;
  onRecipesGenerated?: (recipes: Recipe[]) => void;
}

export default function VoiceAssistantModal({
  visible,
  onClose,
  onRecipesGenerated,
}: VoiceAssistantModalProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  
  // Animasyon
  const pulseAnim = useState(new Animated.Value(1))[0];
  const waveAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    if (isRecording) {
      // Pulse animasyonu
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Wave animasyonu
      Animated.loop(
        Animated.timing(waveAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        })
      ).start();
    } else {
      pulseAnim.setValue(1);
      waveAnim.setValue(0);
    }
  }, [isRecording]);

  const handleStartRecording = async () => {
    try {
      // UI state'i temizle
      setTranscribedText('');
      setRecipes([]);
      setIsProcessing(false);
      setIsSpeaking(false);
      
      // Önceki konuşmayı durdur
      await VoiceService.stopSpeaking();
      
      // Kaydı başlat
      await VoiceService.startRecording();
      setIsRecording(true);
      
      console.log('Ses kaydı başlatıldı');
    } catch (error: any) {
      console.error('Kayıt başlatma hatası:', error);
      setIsRecording(false);
      Alert.alert('Hata', error.message || 'Ses kaydı başlatılamadı');
    }
  };

  const handleStopRecording = async () => {
    try {
      console.log('Ses kaydı durduruluyor...');
      
      // UI state güncelle
      setIsRecording(false);
      setIsProcessing(true);

      // Ses kaydını durdur ve metne çevir
      const text = await VoiceService.stopRecording();
      
      console.log('Transkripsiyon alındı:', text);
      setTranscribedText(text);

      // Text validation
      if (!text || text.trim().length === 0) {
        Alert.alert('Uyarı', 'Ses algılanamadı. Lütfen tekrar deneyin.');
        setIsProcessing(false);
        return;
      }

      // Malzemeleri ayır ve temizle
      const ingredients = text
        .split(/[,;]/) // Virgül veya noktalı virgül ile ayır
        .map(i => i.trim())
        .filter(i => i.length > 0)
        .filter(i => i.length > 2); // Çok kısa kelimeleri filtrele

      console.log('Ayrıştırılan malzemeler:', ingredients);

      if (ingredients.length === 0) {
        Alert.alert(
          'Uyarı', 
          'Malzeme tespit edilemedi. Lütfen malzemeleri virgülle ayırarak söyleyin.\n\nÖrnek: "yumurta, domates, peynir"'
        );
        setIsProcessing(false);
        return;
      }

      try {
        // Tarifleri oluştur
        console.log('Tarifler oluşturuluyor...');
        const generatedRecipes = await RecipeService.generateRecipes(ingredients, 'normal');
        
        if (!generatedRecipes || generatedRecipes.length === 0) {
          Alert.alert('Uyarı', 'Bu malzemelerle tarif oluşturulamadı. Lütfen farklı malzemeler deneyin.');
          setIsProcessing(false);
          return;
        }

        setRecipes(generatedRecipes);
        console.log('Tarifler oluşturuldu:', generatedRecipes.length);

        // Özet sesli oku
        try {
          const summary = VoiceService.formatRecipeSummary(generatedRecipes);
          await VoiceService.speak(summary);
        } catch (ttsError) {
          console.warn('TTS hatası:', ttsError);
          // TTS hatası kritik değil, devam et
        }

        // Callback
        if (onRecipesGenerated) {
          onRecipesGenerated(generatedRecipes);
        }

      } catch (recipeError: any) {
        console.error('Tarif oluşturma hatası:', recipeError);
        Alert.alert('Hata', 'Tarif oluşturulamadı. Lütfen tekrar deneyin.');
      }

      setIsProcessing(false);
    } catch (error: any) {
      console.error('Kayıt durdurma hatası:', error);
      
      // State'i temizle
      setIsRecording(false);
      setIsProcessing(false);
      
      // Kullanıcı dostu hata mesajı
      let errorMessage = 'İşlem başarısız';
      if (error.message.includes('timeout')) {
        errorMessage = 'İşlem zaman aşımına uğradı. Lütfen tekrar deneyin.';
      } else if (error.message.includes('API')) {
        errorMessage = 'Ses tanıma servisi geçici olarak kullanılamıyor.';
      } else if (error.message.includes('permission')) {
        errorMessage = 'Mikrofon izni gerekli. Lütfen ayarlardan izin verin.';
      }
      
      Alert.alert('Hata', errorMessage);
    }
  };

  const handleSpeakRecipe = async (recipe: Recipe) => {
    try {
      console.log('Tarif okunuyor:', recipe.title);
      setIsSpeaking(true);
      
      // Önce mevcut konuşmayı durdur
      await VoiceService.stopSpeaking();
      
      const text = VoiceService.formatRecipeForSpeech(recipe);
      await VoiceService.speak(text);
      setIsSpeaking(false);
      
      console.log('Tarif okuma tamamlandı');
    } catch (error: any) {
      console.error('TTS hatası:', error);
      setIsSpeaking(false);
      Alert.alert('Hata', 'Tarif okunamadı. Lütfen tekrar deneyin.');
    }
  };

  const handleStopSpeaking = async () => {
    try {
      console.log('Konuşma durduruluyor...');
      await VoiceService.stopSpeaking();
      setIsSpeaking(false);
    } catch (error: any) {
      console.error('Konuşma durdurma hatası:', error);
      setIsSpeaking(false);
    }
  };

  const handleClose = async () => {
    try {
      console.log('Modal kapatılıyor...');
      
      // Tüm ses işlemlerini durdur
      await VoiceService.stopSpeaking();
      
      // Eğer kayıt devam ediyorsa durdur
      if (VoiceService.getRecordingStatus()) {
        try {
          await VoiceService.stopRecording();
        } catch (recordingError) {
          console.warn('Kayıt durdurma hatası:', recordingError);
        }
      }
      
      // State'i temizle
      setIsRecording(false);
      setIsProcessing(false);
      setIsSpeaking(false);
      setTranscribedText('');
      setRecipes([]);
      
      // Modal'ı kapat
      onClose();
    } catch (error: any) {
      console.error('Modal kapatma hatası:', error);
      
      // Hata olsa bile modal'ı kapat
      setIsRecording(false);
      setIsProcessing(false);
      setIsSpeaking(false);
      setTranscribedText('');
      setRecipes([]);
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>🎤 Sesli Asistan</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          {/* Microphone Button */}
          <View style={styles.microphoneContainer}>
            {isRecording && (
              <>
                {/* Wave Animation */}
                <Animated.View
                  style={[
                    styles.wave,
                    {
                      opacity: waveAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.3, 0],
                      }),
                      transform: [
                        {
                          scale: waveAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, 2],
                          }),
                        },
                      ],
                    },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.wave,
                    styles.wave2,
                    {
                      opacity: waveAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.2, 0],
                      }),
                      transform: [
                        {
                          scale: waveAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, 2.5],
                          }),
                        },
                      ],
                    },
                  ]}
                />
              </>
            )}

            <Animated.View
              style={[
                styles.microphoneButton,
                isRecording && styles.microphoneButtonActive,
                { transform: [{ scale: pulseAnim }] },
              ]}
            >
              <TouchableOpacity
                onPress={isRecording ? handleStopRecording : handleStartRecording}
                disabled={isProcessing}
                style={styles.microphoneTouchable}
              >
                <MaterialIcons
                  name={isRecording ? 'stop' : 'mic'}
                  size={48}
                  color="white"
                />
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Status Text */}
          <View style={styles.statusContainer}>
            {isRecording && (
              <Text style={styles.statusText}>🎙️ Dinliyorum... Malzemeleri söyleyin</Text>
            )}
            {isProcessing && (
              <View style={styles.processingContainer}>
                <ActivityIndicator size="small" color="#4CAF50" />
                <Text style={styles.statusText}>İşleniyor...</Text>
              </View>
            )}
            {!isRecording && !isProcessing && recipes.length === 0 && (
              <Text style={styles.hintText}>
                Mikrofona dokunun ve malzemeleri söyleyin{'\n'}
                Örn: "yumurta, domates, peynir"
              </Text>
            )}
          </View>

          {/* Transcribed Text */}
          {transcribedText && (
            <View style={styles.transcriptionContainer}>
              <Text style={styles.transcriptionLabel}>Anladığım:</Text>
              <Text style={styles.transcriptionText}>{transcribedText}</Text>
            </View>
          )}

          {/* Recipes */}
          {recipes.length > 0 && (
            <View style={styles.recipesContainer}>
              <Text style={styles.recipesTitle}>
                {recipes.length} Tarif Bulundu
              </Text>
              {recipes.map((recipe, index) => (
                <View key={index} style={styles.recipeCard}>
                  <View style={styles.recipeHeader}>
                    <Text style={styles.recipeTitle}>{recipe.title}</Text>
                    <TouchableOpacity
                      onPress={() => handleSpeakRecipe(recipe)}
                      disabled={isSpeaking}
                      style={styles.speakButton}
                    >
                      <MaterialIcons
                        name={isSpeaking ? 'volume-off' : 'volume-up'}
                        size={24}
                        color="#4CAF50"
                      />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.recipeInfo}>
                    <Text style={styles.recipeInfoText}>⏱️ {recipe.time}</Text>
                    <Text style={styles.recipeInfoText}>🔥 {recipe.calories} kcal</Text>
                  </View>
                </View>
              ))}

              {isSpeaking && (
                <TouchableOpacity
                  style={styles.stopSpeakingButton}
                  onPress={handleStopSpeaking}
                >
                  <MaterialIcons name="stop" size={20} color="white" />
                  <Text style={styles.stopSpeakingText}>Okumayı Durdur</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Tips */}
          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>💡 İpuçları:</Text>
            <Text style={styles.tipsText}>
              • Malzemeleri virgülle ayırarak söyleyin{'\n'}
              • Net ve yavaş konuşun{'\n'}
              • Tarifleri dinlemek için 🔊 ikonuna dokunun
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  microphoneContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
    position: 'relative',
  },
  wave: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#4CAF50',
  },
  wave2: {
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  microphoneButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  microphoneButtonActive: {
    backgroundColor: '#F44336',
  },
  microphoneTouchable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusContainer: {
    alignItems: 'center',
    marginVertical: 20,
    minHeight: 50,
  },
  statusText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  hintText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 22,
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  transcriptionContainer: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  transcriptionLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
    fontWeight: 'bold',
  },
  transcriptionText: {
    fontSize: 16,
    color: '#333',
  },
  recipesContainer: {
    marginTop: 10,
  },
  recipesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  recipeCard: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  speakButton: {
    padding: 5,
  },
  recipeInfo: {
    flexDirection: 'row',
    gap: 15,
  },
  recipeInfoText: {
    fontSize: 14,
    color: '#666',
  },
  stopSpeakingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F44336',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    gap: 8,
  },
  stopSpeakingText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tipsContainer: {
    backgroundColor: '#E3F2FD',
    padding: 15,
    borderRadius: 10,
    marginTop: 15,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 20,
  },
});
