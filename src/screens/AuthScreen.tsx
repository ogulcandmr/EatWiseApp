import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, KeyboardAvoidingView, Platform, Animated, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { AuthService } from '../services/authService';
import { UserProfile } from '../types/types';
import { colors, gradients, spacing, borderRadius, shadows } from '../theme';

type AuthMode = 'login' | 'register';

const { width, height } = Dimensions.get('window');

export default function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  // Animasyon değerleri
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const nameInputOpacity = useRef(new Animated.Value(0)).current;
  const nameInputHeight = useRef(new Animated.Value(0)).current;

  // Mode değişikliği animasyonu
  const switchMode = (newMode: AuthMode) => {
    // Önce küçülme animasyonu
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Mode'u değiştir
      setMode(newMode);
      
      // Sonra büyüme animasyonu
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    });

    // Name input animasyonu
    if (newMode === 'register') {
      Animated.parallel([
        Animated.timing(nameInputOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(nameInputHeight, {
          toValue: 80,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(nameInputOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(nameInputHeight, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun');
      return;
    }

    setLoading(true);
    try {
      const user = await AuthService.login(email, password);
      Alert.alert('Başarılı', `Hoş geldin ${user.name}!`);
      // Burada ana uygulamaya yönlendirme yapılacak
    } catch (error: any) {
      Alert.alert('Hata', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!email || !password || !name) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Hata', 'Şifre en az 6 karakter olmalı');
      return;
    }

    setLoading(true);
    try {
      const user = await AuthService.register(email, password, name);
      Alert.alert('Başarılı', `Hoş geldin ${user.name}! Hesabın oluşturuldu.`);
      switchMode('login');
    } catch (error: any) {
      Alert.alert('Hata', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Background Gradient */}
      <LinearGradient
        colors={['#10B981', '#059669', '#047857'] as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoIcon}>🍽️</Text>
          </View>
          <Text style={styles.logoText}>EatWise</Text>
          <Text style={styles.tagline}>AI Destekli Diyet Asistanı</Text>
        </View>

        <Animated.View 
          style={[
            styles.formContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <Text style={styles.formTitle}>
            {mode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
          </Text>

          <Animated.View 
            style={[
              styles.inputGroup,
              {
                opacity: nameInputOpacity,
                height: nameInputHeight,
                overflow: 'hidden'
              }
            ]}
          >
            <Text style={styles.inputLabel}>Ad Soyad</Text>
            <TextInput
              style={styles.input}
              placeholder="Adınızı ve soyadınızı girin"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </Animated.View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>E-posta</Text>
            <TextInput
              style={styles.input}
              placeholder="ornek@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Şifre</Text>
            <TextInput
              style={styles.input}
              placeholder="En az 6 karakter"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.disabledButton]}
            onPress={mode === 'login' ? handleLogin : handleRegister}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading 
                ? 'İşleniyor...' 
                : mode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'
              }
            </Text>
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
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>📊</Text>
              <Text style={styles.featureText}>Sağlık Takibi ve Analiz</Text>
            </View>
          </View>
        </View>

        <View style={styles.termsContainer}>
          <Text style={styles.termsText}>
            Devam ederek Kullanım Şartları ve Gizlilik Politikası'nı kabul etmiş olursun.
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
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoIcon: {
    fontSize: 40,
  },
  logoText: {
    fontSize: 36,
    fontWeight: '800',
    color: 'white',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    fontWeight: '500',
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    marginBottom: 30,
    ...shadows.xl,
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
  input: {
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: colors.neutral[50],
    color: colors.text.primary,
  },
  submitButton: {
    backgroundColor: colors.primary[500],
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    ...shadows.md,
  },
  disabledButton: {
    opacity: 0.6,
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