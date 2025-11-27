import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient'; // Gradient eklendi
import LottieView from 'lottie-react-native'; // Animasyon eklendi
import { useTheme } from '../context/ThemeContext';
import { colors, shadows } from '../theme';
import { AIChatService, ChatMessage } from '../services/aiChatService';

// NOT: AuthScreen'deki dosyaları kullanıyoruz (src/assets/animations/)
// robot-welcome.json -> Header'daki robot
// robot-loading.json -> Düşünme/Yazma efekti

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface AIChatProps {
  visible: boolean;
  onClose: () => void;
}

const { width } = Dimensions.get('window');

const AIChat: React.FC<AIChatProps> = ({ visible, onClose }) => {
  const { isDark } = useTheme();
  
  // Mesaj State'i
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Merhaba! Ben EatWise AI. Senin kişisel beslenme asistanınım. Bugün sana nasıl yardımcı olabilirim?',
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // Ref'ler
  const scrollViewRef = useRef<ScrollView>(null);
  const headerRobotRef = useRef<LottieView>(null);

  // Modal açıldığında robotu oynat
  useEffect(() => {
    if (visible) {
      setTimeout(() => {
         headerRobotRef.current?.play();
         // En aşağı kaydır
         scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [visible]);

  // Yeni mesaj gelince aşağı kaydır
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, isTyping]);


  const sendMessage = async (textToSend: string = inputText) => {
    if (textToSend.trim() === '') return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: textToSend.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      const chatHistory: ChatMessage[] = messages
        .filter(msg => !msg.text.includes('Merhaba! Ben EatWise AI'))
        .map(msg => ({
          role: msg.isUser ? 'user' : 'assistant',
          content: msg.text,
        }));

      chatHistory.push({ role: 'user', content: userMessage.text });

      const aiResponseText = await AIChatService.sendMessage(chatHistory);

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponseText,
        isUser: false,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('AI Chat hatası:', error);
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Üzgünüm, bağlantımda bir sorun var. Birazdan tekrar deneyebilir misin?',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
        setIsTyping(false);
    }
  };

  const quickQuestions = [
    "Bugün ne yemeliyim?",
    "Bu öğün kaç kalori?",
    "Su içmeyi hatırlat",
    "Sağlıklı atıştırmalık önerisi"
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, isDark && styles.containerDark]}>
        
        {/* MODERN HEADER */}
        <View style={[styles.header, isDark && styles.headerDark]}>
          <View style={styles.headerLeft}>
            <View style={styles.robotAvatarContainer}>
                {/* AuthScreen'deki robotu buraya da koyduk */}
                <LottieView
                    ref={headerRobotRef}
                    source={require('../../assets/animations/robot-welcome.json')}
                    autoPlay
                    loop
                    style={{ width: 60, height: 60 }}
                />
            </View>
            <View style={styles.headerInfo}>
              <Text style={[styles.headerTitle, isDark && styles.textDark]}>
                EatWise AI
              </Text>
              <View style={styles.statusContainer}>
                <View style={styles.onlineDot} />
                <Text style={[styles.headerSubtitle, isDark && styles.textSecondaryDark]}>
                  Çevrimiçi
                </Text>
              </View>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons 
              name="close-circle" 
              size={32} 
              color={isDark ? colors.neutral[400] : colors.neutral[300]} 
            />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
        
        {/* MESAJ ALANI */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageRow,
                message.isUser ? styles.userMessageRow : styles.aiMessageRow,
              ]}
            >
              {/* Eğer AI mesajıysa soluna minik bir ikon koyalım */}
              {!message.isUser && (
                  <View style={styles.miniAiIcon}>
                       <MaterialIcons name="smart-toy" size={16} color="white" />
                  </View>
              )}

              {/* Baloncuk Tasarımı */}
              {message.isUser ? (
                 // KULLANICI MESAJI: Gradient Arkaplan (AuthScreen renkleri)
                 <LinearGradient
                    colors={['#10B981', '#059669', '#047857']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.messageBubble, styles.userBubble]}
                 >
                    <Text style={styles.userMessageText}>{message.text}</Text>
                 </LinearGradient>
              ) : (
                 // AI MESAJI: Sade
                 <View style={[styles.messageBubble, styles.aiBubble, isDark && styles.aiBubbleDark]}>
                    <Text style={[styles.aiMessageText, isDark && styles.textDark]}>{message.text}</Text>
                 </View>
              )}
            </View>
          ))}

          {/* Typing Indicator (Robot Loading) */}
          {isTyping && (
            <View style={[styles.messageRow, styles.aiMessageRow]}>
              <View style={styles.miniAiIcon}>
                   <MaterialIcons name="smart-toy" size={16} color="white" />
              </View>
              <View style={[styles.messageBubble, styles.aiBubble, isDark && styles.aiBubbleDark, { paddingVertical: 8, paddingHorizontal: 12 }]}>
                 <LottieView
                    source={require('../../assets/animations/robot-loading.json')} 
                    autoPlay
                    loop
                    style={{ width: 40, height: 25 }}
                 />
              </View>
            </View>
          )}

          {/* Hızlı Sorular (Chips) */}
          {messages.length === 1 && !isTyping && (
            <View style={styles.quickQuestionsContainer}>
              <Text style={[styles.quickQuestionsTitle, isDark && styles.textSecondaryDark]}>
                Hızlıca sorabilirsin:
              </Text>
              <View style={styles.chipsWrapper}>
                {quickQuestions.map((question, index) => (
                    <TouchableOpacity
                    key={index}
                    style={[styles.chip, isDark && styles.chipDark]}
                    onPress={() => sendMessage(question)}
                    >
                    <Text style={[styles.chipText, isDark && styles.textDark]}>{question}</Text>
                    </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {/* INPUT ALANI */}
        <View style={[styles.inputWrapper, isDark && styles.inputWrapperDark]}>
          <View style={[styles.inputContainer, isDark && styles.inputContainerDark]}>
            <TextInput
              style={[styles.textInput, isDark && styles.textInputDark]}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Bir şeyler sor..."
              placeholderTextColor={isDark ? colors.neutral[500] : colors.neutral[400]}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                inputText.trim() === '' && styles.sendButtonDisabled,
              ]}
              onPress={() => sendMessage()}
              disabled={inputText.trim() === ''}
            >
               {/* Send butonu Gradient */}
               {inputText.trim() !== '' ? (
                   <LinearGradient
                    colors={['#10B981', '#059669']}
                    style={styles.sendButtonGradient}
                   >
                       <Ionicons name="arrow-up" size={24} color="white" />
                   </LinearGradient>
               ) : (
                   <View style={[styles.sendButtonGradient, { backgroundColor: '#E5E7EB' }]}>
                       <Ionicons name="arrow-up" size={24} color="#9CA3AF" />
                   </View>
               )}
            </TouchableOpacity>
          </View>
        </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

// Floating Button (Bu da gradient oldu)
export const FloatingChatButton: React.FC<{ onPress: () => void }> = ({ onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.9, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={[styles.floatingButtonContainer, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
        <LinearGradient
            colors={['#10B981', '#047857']}
            style={styles.floatingButtonGradient}
        >
             <LottieView
                source={require('../../assets/animations/robot-welcome.json')}
                autoPlay
                loop
                style={{ width: 40, height: 40 }}
            />
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB', // Daha temiz bir gri
  },
  containerDark: {
    backgroundColor: colors.dark.background,
  },
  // HEADER STİLLERİ
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    ...shadows.sm,
  },
  headerDark: {
    backgroundColor: colors.dark.surface,
    borderBottomColor: colors.dark.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  robotAvatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ECFDF5', // Açık yeşil arka plan
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#D1FAE5',
    overflow: 'hidden'
  },
  headerInfo: {
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  closeButton: {
    padding: 4,
  },
  // MESAJ STİLLERİ
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  messageRow: {
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  userMessageRow: {
    justifyContent: 'flex-end',
  },
  aiMessageRow: {
    justifyContent: 'flex-start',
  },
  miniAiIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginBottom: 4,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 14,
    borderRadius: 20,
  },
  userBubble: {
    borderBottomRightRadius: 4,
    // Renkler Gradient tarafından veriliyor
  },
  aiBubble: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    ...shadows.sm,
  },
  aiBubbleDark: {
    backgroundColor: colors.dark.surface,
    borderColor: colors.dark.border,
  },
  userMessageText: {
    color: 'white',
    fontSize: 16,
    lineHeight: 22,
  },
  aiMessageText: {
    color: '#374151',
    fontSize: 16,
    lineHeight: 22,
  },
  // QUICK QUESTIONS
  quickQuestionsContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  quickQuestionsTitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    fontWeight: '500',
  },
  chipsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  chip: {
    backgroundColor: 'white',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    margin: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...shadows.sm,
  },
  chipDark: {
    backgroundColor: colors.dark.surface,
    borderColor: colors.dark.border,
  },
  chipText: {
    color: '#4B5563',
    fontSize: 14,
    fontWeight: '500',
  },
  // INPUT ALANI
  inputWrapper: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  inputWrapperDark: {
    backgroundColor: colors.dark.surface,
    borderTopColor: colors.dark.border,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  inputContainerDark: {
    // dark styles
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingRight: 40,
    marginRight: 10,
    maxHeight: 100,
    fontSize: 16,
    color: '#1F2937',
  },
  textInputDark: {
    backgroundColor: colors.dark.background,
    borderColor: colors.dark.border,
    color: colors.dark.text.primary,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: 'transparent',
  },
  sendButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // FLOATING BUTTON
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    borderRadius: 30,
    ...shadows.lg,
  },
  floatingButtonGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // RENK & THEME HELPERS
  textDark: { color: colors.dark.text.primary },
  textSecondaryDark: { color: colors.dark.text.secondary },
});

export default AIChat;