import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, KeyboardAvoidingView, Platform, Animated, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native'; 
import { AuthService } from '../services/authService';
import { colors, shadows } from '../theme';

// NOT: npm install lottie-react-native yapılı olmalı.
// Dosyalar src/assets/animations/ klasöründe olmalı.

type AuthMode = 'login' | 'register';

const { width, height } = Dimensions.get('window');

export default function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Animasyon Değerleri
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const nameInputOpacity = useRef(new Animated.Value(0)).current;
  const nameInputHeight = useRef(new Animated.Value(0)).current;
  const robotLottieRef = useRef<LottieView>(null);

  useEffect(() => {
      // Robot animasyonunu başlat
      setTimeout(() => {
        robotLottieRef.current?.play();
      }, 100);
  }, []);

  const switchMode = (newMode: AuthMode) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setMode(newMode);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    });

    if (newMode === 'register') {
      Animated.parallel([
        Animated.timing(nameInputOpacity, { toValue: 1, duration: 300, useNativeDriver: false }),
        Animated.timing(nameInputHeight, { toValue: 80, duration: 300, useNativeDriver: false }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(nameInputOpacity, { toValue: 0, duration: 200, useNativeDriver: false }),
        Animated.timing(nameInputHeight, { toValue: 0, duration: 200, useNativeDriver: false }),
      ]).start();
    }
  };

  const handleLogin = async () => {
    if (!email || !password) { Alert.alert('Hata', 'Lütfen tüm alanları doldurun'); return; }
    setLoading(true);
    try {
      const user = await AuthService.login(email, password);
      Alert.alert('Başarılı', `Hoş geldin ${user.name}!`);
    } catch (error: any) { Alert.alert('Hata', error.message);
    } finally { setLoading(false); }
  };

  const handleRegister = async () => {
    if (!email || !password || !name) { Alert.alert('Hata', 'Lütfen tüm alanları doldurun'); return; }
    if (password.length < 6) { Alert.alert('Hata', 'Şifre en az 6 karakter olmalı'); return; }
    setLoading(true);
    try {
      const user = await AuthService.register(email, password, name);
      Alert.alert('Başarılı', `Hoş geldin ${user.name}! Hesabın oluşturuldu.`);
      switchMode('login');
    } catch (error: any) { Alert.alert('Hata', error.message);
    } finally { setLoading(false); }
  };

  // Input Yardımcı Fonksiyonu
  const renderInput = (
    label: string,
    value: string,
    onChange: (text: string) => void,
    icon: keyof typeof Ionicons.glyphMap,
    placeholder: string,
    isSecure = false,
    keyboardType: any = 'default',
    autoCapitalize: any = 'none'
  ) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.inputContainer}>
        <Ionicons name={icon} size={20} color={colors.primary[500]} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#999"
          value={value}
          onChangeText={onChange}
          secureTextEntry={isSecure && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
        />
        {isSecure && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.passwordToggle}>
             <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* ORİJİNAL YEŞİL GRADIENT */}
      <LinearGradient
        colors={['#10B981', '#059669', '#047857']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* HEADER: Robot Animasyonu (Eski ikon yerine) */}
        <View style={styles.header}>
          <View style={styles.robotContainer}>
            <LottieView
                ref={robotLottieRef}
                source={require('../../assets/animations/robot-welcome.json')}
                autoPlay
                loop={true}
                style={styles.robotAnimation}
            />
          </View>
          <Text style={styles.logoText}>EatWise</Text>
          <Text style={styles.tagline}>AI Destekli Diyet Asistanı</Text>
        </View>

        {/* BEYAZ FORM ALANI (Orijinal Tasarım) */}
        <Animated.View 
          style={[
            styles.formContainer,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
          ]}
        >
          <Text style={styles.formTitle}>
            {mode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
          </Text>

          {/* İsim Inputu */}
          <Animated.View 
            style={{
              opacity: nameInputOpacity,
              height: nameInputHeight,
              overflow: 'hidden'
            }}
          >
             {renderInput('Ad Soyad', name, setName, 'person-outline', 'Adınız Soyadınız', false, 'default', 'words')}
          </Animated.View>

          {/* Email ve Şifre */}
          {renderInput('E-posta', email, setEmail, 'mail-outline', 'ornek@email.com', false, 'email-address')}
          {renderInput('Şifre', password, setPassword, 'lock-closed-outline', '••••••', true)}

          {/* Buton: Yüklenirken Robot Dönüyor */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.disabledButton]}
            onPress={mode === 'login' ? handleLogin : handleRegister}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
               <LottieView
               source={require('../../assets/animations/robot-loading.json')}
               autoPlay
               loop
               style={styles.loadingAnimation}
           />
            ) : (
              <Text style={styles.submitButtonText}>
                {mode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => switchMode(mode === 'login' ? 'register' : 'login')}
          >
            <Text style={styles.switchButtonText}>
              {mode === 'login' 
                ? 'Hesabın yok mu? Kayıt Ol' 
                : 'Zaten hesabın var mı? Giriş Yap'
              }
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Eski Özellikler Listesi (Olduğu gibi) */}
        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>Özellikler</Text>
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>📸</Text>
              <Text style={styles.featureText}>Fotoğrafla Kalori Hesaplama</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🍽️</Text>
              <Text style={styles.featureText}>Malzemelerle Tarif Oluşturma</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🧠</Text>
              <Text style={styles.featureText}>Kişisel AI Diyet Planı</Text>
            </View>
          </View>
        </View>

        <View style={styles.termsContainer}>
            <Text style={styles.termsText}>
                Devam ederek Kullanım Şartları'nı kabul etmiş olursun.
            </Text>
        </View>

      </ScrollView>
      <StatusBar style="light" />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 40,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  // Robotun olduğu yuvarlak alan
  robotContainer: {
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  robotAnimation: {
    width: '100%',
    height: '100%',
  },
  logoText: {
    fontSize: 36,
    fontWeight: '800',
    color: 'white',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    fontWeight: '500',
  },
  // ORİJİNAL BEYAZ FORM KARTI
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    marginBottom: 30,
    ...shadows.xl, // Tema dosyasındaki gölge
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  // INPUT STİLİ: Beyaz arka plan, gri kenarlık (Orijinal Tarz)
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: colors.text.primary,
  },
  passwordToggle: {
    padding: 8,
  },
  submitButton: {
    height: 52,
    backgroundColor: colors.primary[500],
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    ...shadows.md,
  },
  disabledButton: {
    opacity: 0.6,
  },
  loadingAnimation: {
    width: 50,
    height: 50,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '700',
  },
  switchButton: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 8,
  },
  switchButtonText: {
    color: colors.primary[600],
    fontSize: 15,
    fontWeight: '600',
  },
  featuresContainer: {
    marginBottom: 24,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    marginBottom: 16,
  },
  featureList: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  featureText: {
    fontSize: 15,
    color: 'white',
    flex: 1,
  },
  termsContainer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  termsText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 18,
  },
});