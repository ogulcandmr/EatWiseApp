import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, CameraType } from 'expo-camera';
import { MaterialIcons } from '@expo/vector-icons';

export default function CameraScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [type, setType] = useState(CameraType.back);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const cameraRef = useRef<Camera>(null);

  React.useEffect(() => {
    getCameraPermissions();
  }, []);

  const getCameraPermissions = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: true,
        });
        setCapturedImage(photo.uri);
      } catch (error) {
        Alert.alert('Hata', 'Fotoğraf çekilirken bir hata oluştu');
      }
    }
  };

  const analyzeImage = async () => {
    if (!capturedImage) return;
    
    setIsAnalyzing(true);
    
    // Simüle edilmiş AI analizi (gerçek API entegrasyonu sonra gelecek)
    setTimeout(() => {
      setIsAnalyzing(false);
      Alert.alert(
        'Analiz Tamamlandı! 🎉',
        'Tespit edilen yiyecekler:\n• Tavuk göğsü (150g) - 250 kalori\n• Bulgur pilavı (100g) - 150 kalori\n• Salata (50g) - 25 kalori\n\nToplam: 425 kalori\n\nProtein: 35g\nKarbonhidrat: 45g\nYağ: 8g',
        [
          { text: 'Tekrar Çek', onPress: () => setCapturedImage(null) },
          { text: 'Kaydet', onPress: () => {
            // Kaydetme işlemi
            setCapturedImage(null);
            Alert.alert('Başarılı', 'Öğün kaydedildi!');
          }}
        ]
      );
    }, 2000);
  };

  const retakePhoto = () => {
    setCapturedImage(null);
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text>Kamera izni bekleniyor...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Kamera erişimi reddedildi</Text>
        <TouchableOpacity style={styles.button} onPress={getCameraPermissions}>
          <Text style={styles.buttonText}>İzin Ver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (capturedImage) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.previewContainer}>
          <Image source={{ uri: capturedImage }} style={styles.previewImage} />
          
          <View style={styles.previewActions}>
            <TouchableOpacity style={styles.actionButton} onPress={retakePhoto}>
              <MaterialIcons name="refresh" size={24} color="white" />
              <Text style={styles.actionButtonText}>Tekrar Çek</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.analyzeButton]} 
              onPress={analyzeImage}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <>
                  <MaterialIcons name="hourglass-empty" size={24} color="white" />
                  <Text style={styles.actionButtonText}>Analiz Ediliyor...</Text>
                </>
              ) : (
                <>
                  <MaterialIcons name="psychology" size={24} color="white" />
                  <Text style={styles.actionButtonText}>Analiz Et</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.cameraContainer}>
        <Camera
          style={styles.camera}
          type={type}
          ref={cameraRef}
        >
          <View style={styles.cameraOverlay}>
            {/* Üst bilgi */}
            <View style={styles.topOverlay}>
              <Text style={styles.overlayText}>Yemeğini çek, AI analiz etsin!</Text>
            </View>

            {/* Kamera kontrolleri */}
            <View style={styles.bottomOverlay}>
              <TouchableOpacity
                style={styles.flipButton}
                onPress={() => setType(type === CameraType.back ? CameraType.front : CameraType.back)}
              >
                <MaterialIcons name="flip-camera-android" size={30} color="white" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>

              <View style={styles.placeholder} />
            </View>
          </View>
        </Camera>
      </View>

      {/* Alt bilgi */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Nasıl Çalışır?</Text>
        <Text style={styles.infoText}>
          1. Yemeğini tabağa koy{'\n'}
          2. Fotoğrafı çek{'\n'}
          3. AI otomatik olarak kalori ve besin değerlerini hesaplasın
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topOverlay: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
    alignItems: 'center',
  },
  overlayText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomOverlay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 30,
  },
  flipButton: {
    padding: 10,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#4CAF50',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4CAF50',
  },
  placeholder: {
    width: 50,
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  previewImage: {
    flex: 1,
    resizeMode: 'contain',
  },
  previewActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#666',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  analyzeButton: {
    backgroundColor: '#4CAF50',
  },
  actionButtonText: {
    color: 'white',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoContainer: {
    backgroundColor: 'white',
    padding: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
  },
  errorText: {
    fontSize: 18,
    color: 'red',
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    alignSelf: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
