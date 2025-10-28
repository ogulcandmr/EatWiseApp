import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { colors, shadows, gradients, borderRadius } from '../theme';

export default function HomeScreen({ navigation, user }: any) {
  const { isDark } = useTheme();
  const discoverCards = [
     {
       title: 'Keşfet',
       desc: 'Tarifleri keşfet',
       icon: 'travel-explore',
       gradient: gradients.info,
       onPress: () => navigation?.navigate('explore'),
     },
     {
       title: 'Plan',
       desc: 'Öğünlerini planla',
       icon: 'event-note',
       gradient: gradients.success,
       onPress: () => navigation?.navigate('plan'),
     },
     {
       title: 'Takip',
       desc: 'Sağlık verilerini takip et',
       icon: 'analytics',
       gradient: gradients.purple,
       onPress: () => navigation?.navigate('tracking'),
     },
     {
       title: 'Malzemeden Tarif',
       desc: 'Malzemeleri tarife dönüştür',
       icon: 'restaurant-menu',
       gradient: gradients.secondary,
       onPress: () => navigation?.navigate('recipes'),
     },
  ];

  const DiscoverCard: React.FC<{ item: { title: string; desc: string; icon: string; gradient: string[]; onPress: () => void } }> = ({ item }) => {
    const scale = React.useRef(new Animated.Value(1)).current;
    const handlePressIn = () => {
      Animated.spring(scale, { toValue: 0.98, useNativeDriver: true }).start();
    };
    const handlePressOut = () => {
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
    };
    return (
      <Animated.View style={{ transform: [{ scale }], marginRight: 12 }}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={item.onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[styles.discoverCard, isDark && styles.discoverCardDark]}
        >
          <LinearGradient
              colors={item.gradient as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientCard}
            >
            <View style={styles.discoverHeader}>
              <View style={styles.discoverIconWrap}>
                <MaterialIcons name={item.icon as any} size={22} color={'#fff'} />
              </View>
              <Text style={styles.discoverTitle}>{item.title}</Text>
            </View>
            <Text style={styles.discoverDesc}>{item.desc}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const extraScreens = [
    { title: 'Kamera (Native)', desc: 'Expo Camera ekranı', icon: 'camera-alt', route: 'cameraNative' },
    { title: 'Profil Düzenle', desc: 'Bilgilerini güncelle', icon: 'edit', route: 'profileEdit' },
    { title: 'Takip Ekranı', desc: 'Haftalık özet grafikler', icon: 'analytics', route: 'tracking' },
    { title: 'Tarif Detayı (Demo)', desc: 'Örnek tarif detayı', icon: 'menu-book', route: 'recipeDetailDemo' },
    { title: 'Modern Auth', desc: 'Yeni giriş arayüzü', icon: 'fingerprint', route: 'modernAuth' },
    { title: 'Auth', desc: 'Klasik giriş ekranı', icon: 'lock', route: 'auth' },
  ];

  const ExtraCardItem: React.FC<{ item: { title: string; desc: string; icon: string; route: string } }> = ({ item }) => {
    const scale = React.useRef(new Animated.Value(1)).current;
    const handlePressIn = () => {
      Animated.spring(scale, { toValue: 0.98, useNativeDriver: true }).start();
    };
    const handlePressOut = () => {
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
    };
    return (
      <Animated.View style={{ transform: [{ scale }] }}>
        <TouchableOpacity
          style={[styles.extraCard, isDark && styles.cardDark]}
          activeOpacity={0.85}
          onPress={() => navigation?.navigate(item.route)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <View style={[styles.extraIcon, isDark && { backgroundColor: colors.dark.surfaceElevated }]}> 
            <MaterialIcons name={item.icon as any} size={22} color="#4CAF50" />
          </View>
          <Text style={styles.extraCardTitle}>{item.title}</Text>
          <Text style={styles.extraCardDesc}>{item.desc}</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };


  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <ScrollView style={styles.scrollView}>
        {/* Header with Gradient */}
        <LinearGradient
          colors={isDark ? ['#1E3A8A', '#1E40AF', '#2563EB'] : ['#10B981', '#059669']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <Text style={styles.greeting}>
            Merhaba {user?.name || user?.email?.split('@')[0] || 'Kullanıcı'}! 👋
          </Text>
          <Text style={styles.subtitle}>Bugün nasıl beslenmek istiyorsun?</Text>
        </LinearGradient>

        {/* Günlük Özet Kartı - Modern */}
        <View style={[styles.summaryCard, isDark && styles.cardDark, isDark && { shadowColor: colors.dark.shadow }]}> 
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, isDark && styles.textDark]}>Bugünkü Özet</Text>
            <View style={[styles.progressBadge, isDark && { backgroundColor: colors.dark.primary + '20' }]}> 
              <Text style={[styles.progressText, isDark && { color: colors.dark.primary }]}>62%</Text>
            </View>
          </View>
          
          {/* Progress Bar */}
          <View style={[styles.progressBarContainer, isDark && { backgroundColor: colors.dark.surfaceElevated }]}> 
            <View style={[styles.progressBar, { width: '62%' }, isDark && { backgroundColor: colors.dark.primary }]} />
          </View>
          <Text style={[styles.progressLabel, isDark && styles.textSecondaryDark]}>Günlük hedefinizin %62'si</Text>
          
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <View style={[styles.iconCircle, isDark && { backgroundColor: colors.dark.surfaceElevated }]}> 
                <Text style={styles.iconEmoji}>🔥</Text>
              </View>
              <Text style={[styles.summaryValue, isDark && styles.textDark]}>1,240</Text>
              <Text style={[styles.summaryLabel, isDark && styles.textSecondaryDark]}>Kalori</Text>
            </View>
            <View style={styles.summaryItem}>
              <View style={[styles.iconCircle, isDark && { backgroundColor: colors.dark.surfaceElevated }]}> 
                <Text style={styles.iconEmoji}>💪</Text>
              </View>
              <Text style={[styles.summaryValue, isDark && styles.textDark]}>45g</Text>
              <Text style={[styles.summaryLabel, isDark && styles.textSecondaryDark]}>Protein</Text>
            </View>
            <View style={styles.summaryItem}>
              <View style={[styles.iconCircle, isDark && { backgroundColor: colors.dark.surfaceElevated }]}> 
                <Text style={styles.iconEmoji}>💧</Text>
              </View>
              <Text style={[styles.summaryValue, isDark && styles.textDark]}>1.2L</Text>
              <Text style={[styles.summaryLabel, isDark && styles.textSecondaryDark]}>Su</Text>
            </View>
          </View>
        </View>

        {/* Keşfet ve Planla - Kaydırılabilir kartlar */}
        <View style={styles.discoverContainer}>
          <Text style={[styles.sectionTitle, isDark && styles.textDark]}>Keşfet ve Planla</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.discoverScroll}>
            {discoverCards.map((item, idx) => (
              <DiscoverCard key={idx} item={item} />
            ))}
          </ScrollView>
        </View>

        {/* AI Önerisi - Modern */}
        <View style={[styles.aiSuggestionCard, isDark && styles.aiCardDark]}> 
          <LinearGradient
            colors={isDark ? [colors.dark.primary + '20', colors.dark.primary + '10'] : ['#ECFDF5', '#D1FAE5']}
            style={styles.aiGradient}
          >
            <View style={styles.aiHeader}>
              <View style={[styles.aiIconCircle, isDark && { backgroundColor: colors.dark.primary + '30' }]}> 
                <MaterialIcons name="psychology" size={24} color={isDark ? colors.dark.primary : "#10B981"} />
              </View>
              <Text style={[styles.aiTitle, isDark && { color: colors.dark.text.primary }]}>AI Önerisi</Text>
            </View>
            <Text style={[styles.aiText, isDark && { color: colors.dark.text.secondary }]}> 
              Bugün protein alımını artırmak için akşam yemeğinde balık veya tavuk tercih edebilirsin. 
              Ayrıca 2 bardak daha su içmeyi unutma! 💧
            </Text>
          </LinearGradient>
        </View>

        {/* Son Aktiviteler */}
        <View style={[styles.recentActivity, isDark && styles.cardDark]}> 
          <Text style={[styles.sectionTitle, isDark && styles.textDark]}>Son Aktiviteler</Text>
          <View style={[styles.activityItem, isDark && { borderBottomColor: colors.dark.border }]}> 
            <MaterialIcons name="restaurant" size={20} color={isDark ? colors.dark.success : "#4CAF50"} />
            <Text style={[styles.activityText, isDark && styles.textDark]}>Öğle yemeği: Tavuk salatası (320 kalori)</Text>
            <Text style={[styles.activityTime, isDark && styles.textSecondaryDark]}>2 saat önce</Text>
          </View>
          <View style={[styles.activityItem, isDark && { borderBottomColor: colors.dark.border }]}> 
            <MaterialIcons name="camera-alt" size={20} color={isDark ? colors.dark.warning : "#FF9800"} />
            <Text style={[styles.activityText, isDark && styles.textDark]}>Kahvaltı fotoğrafı analiz edildi</Text>
            <Text style={[styles.activityTime, isDark && styles.textSecondaryDark]}>5 saat önce</Text>
          </View>
        </View>


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
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: 20,
    paddingBottom: 60,
  },
  greeting: {
    fontSize: 32,
    fontWeight: '800',
    color: 'white',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
  },
  summaryCard: {
    marginHorizontal: 20,
    marginTop: -40,
    padding: 24,
    backgroundColor: 'white',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  cardDark: {
    backgroundColor: colors.dark.surface,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  textDark: {
    color: colors.dark.text.primary,
  },
  textSecondaryDark: {
    color: colors.dark.text.secondary,
  },
  aiCardDark: {
    backgroundColor: colors.dark.surface,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#262626',
  },
  progressBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 20,
  },
  progressLabel: {
    fontSize: 14,
    color: '#737373',
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  iconEmoji: {
    fontSize: 24,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#262626',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#737373',
  },
  quickActionsContainer: {
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
    color: '#262626',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    color: '#262626',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  actionSubtitle: {
    color: '#737373',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  aiSuggestionCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  aiGradient: {
    padding: 20,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  aiIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  aiTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#065F46',
  },
  aiText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#047857',
  },
  recentActivity: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    ...shadows.md,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityText: {
    flex: 1,
    fontSize: 14,
    color: '#262626',
    marginLeft: 12,
    fontWeight: '500',
  },
  activityTime: {
    fontSize: 12,
    color: '#A3A3A3',
  },
  page: {
    paddingBottom: 24,
  },
  hubHeaderBox: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
  },
  hubHeaderTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#4CAF50',
    marginBottom: 6,
  },
  hubHeaderDesc: {
    fontSize: 14,
    color: '#666',
  },
  hubGrid: {
    paddingHorizontal: 20,
    paddingTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  hubCard: {
    width: '48%',
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  hubCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F8E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  hubCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4CAF50',
    marginBottom: 6,
  },
  hubCardDesc: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  extraSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  extraTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
    color: '#262626',
  },
  extraGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  extraCard: {
    width: '48%',
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  extraIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F8E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  extraCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4CAF50',
    marginBottom: 6,
  },
  extraCardDesc: {
    fontSize: 12,
    color: '#737373',
    lineHeight: 16,
  },
  discoverContainer: {
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
  },
  discoverScroll: {
    paddingRight: 20,
  },
  discoverCard: {
    width: 280,
    borderRadius: borderRadius['2xl'],
    // shadow-lg
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
  },
  discoverCardDark: {
    shadowColor: colors.dark.shadow,
  },
  gradientCard: {
    padding: 18,
    borderRadius: borderRadius['2xl'],
    minHeight: 120,
    justifyContent: 'center',
  },
  discoverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  discoverIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  discoverTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  discoverDesc: {
    fontSize: 13,
    color: '#fff',
    opacity: 0.9,
  },
});
