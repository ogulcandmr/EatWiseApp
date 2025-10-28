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
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { colors, shadows } from '../theme';
import { AIChatService, ChatMessage } from '../services/aiChatService';

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

const AIChat: React.FC<AIChatProps> = ({ visible, onClose }) => {
  const { isDark } = useTheme();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Merhaba! Ben EatWise AI asistanınızım. Beslenme, egzersiz ve sağlık konularında size yardımcı olabilirim. Nasıl yardımcı olabilirim?',
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const sendMessage = async () => {
    if (inputText.trim() === '') return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      // Mesaj geçmişini ChatMessage formatına çevir
      const chatHistory: ChatMessage[] = messages
        .filter(msg => !msg.text.includes('Merhaba! Ben EatWise AI')) // İlk karşılama mesajını hariç tut
        .map(msg => ({
          role: msg.isUser ? 'user' : 'assistant',
          content: msg.text,
        }));

      // Yeni kullanıcı mesajını ekle
      chatHistory.push({
        role: 'user',
        content: userMessage.text,
      });

      // OpenAI API çağrısı yap
      const aiResponseText = await AIChatService.sendMessage(chatHistory);

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponseText,
        isUser: false,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    } catch (error) {
      console.error('AI Chat hatası:', error);
      
      // Hata durumunda fallback mesaj
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Üzgünüm, şu anda bir teknik sorun yaşıyorum. Lütfen daha sonra tekrar deneyin.',
        isUser: false,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorResponse]);
      setIsTyping(false);
    }
  };

  const quickQuestions = AIChatService.getQuickQuestions();

  useEffect(() => {
    if (visible) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, visible]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={[styles.container, isDark && styles.containerDark]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={[styles.header, isDark && styles.headerDark]}>
          <View style={styles.headerLeft}>
            <View style={styles.aiAvatar}>
              <MaterialIcons name="psychology" size={24} color="white" />
            </View>
            <View>
              <Text style={[styles.headerTitle, isDark && styles.textDark]}>
                EatWise AI
              </Text>
              <Text style={[styles.headerSubtitle, isDark && styles.textSecondaryDark]}>
                Beslenme Asistanı
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons 
              name="close" 
              size={24} 
              color={isDark ? colors.dark.text.primary : '#333'} 
            />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageContainer,
                message.isUser ? styles.userMessage : styles.aiMessage,
              ]}
            >
              <View
                style={[
                  styles.messageBubble,
                  message.isUser 
                    ? styles.userBubble 
                    : [styles.aiBubble, isDark && styles.aiBubbleDark],
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    message.isUser 
                      ? styles.userMessageText 
                      : [styles.aiMessageText, isDark && styles.textDark],
                  ]}
                >
                  {message.text}
                </Text>
              </View>
            </View>
          ))}

          {isTyping && (
            <View style={[styles.messageContainer, styles.aiMessage]}>
              <View style={[styles.messageBubble, styles.aiBubble, isDark && styles.aiBubbleDark]}>
                <Text style={[styles.typingText, isDark && styles.textDark]}>
                  AI yazıyor...
                </Text>
              </View>
            </View>
          )}

          {/* Quick Questions */}
          {messages.length === 1 && (
            <View style={styles.quickQuestionsContainer}>
              <Text style={[styles.quickQuestionsTitle, isDark && styles.textDark]}>
                Hızlı Sorular:
              </Text>
              {quickQuestions.map((question, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.quickQuestionButton, isDark && styles.quickQuestionButtonDark]}
                  onPress={async () => {
                    // Hızlı soruyu direkt mesaj olarak gönder
                    const userMessage: Message = {
                      id: Date.now().toString(),
                      text: question,
                      isUser: true,
                      timestamp: new Date(),
                    };

                    setMessages(prev => [...prev, userMessage]);
                    setIsTyping(true);

                    try {
                      // Mesaj geçmişini ChatMessage formatına çevir
                      const chatHistory: ChatMessage[] = messages
                        .filter(msg => !msg.text.includes('Merhaba! Ben EatWise AI'))
                        .map(msg => ({
                          role: msg.isUser ? 'user' : 'assistant',
                          content: msg.text,
                        }));

                      // Yeni kullanıcı mesajını ekle
                      chatHistory.push({
                        role: 'user',
                        content: question,
                      });

                      // OpenAI API çağrısı yap
                      const aiResponseText = await AIChatService.sendMessage(chatHistory);

                      const aiResponse: Message = {
                        id: (Date.now() + 1).toString(),
                        text: aiResponseText,
                        isUser: false,
                        timestamp: new Date(),
                      };
                      
                      setMessages(prev => [...prev, aiResponse]);
                      setIsTyping(false);
                    } catch (error) {
                      console.error('AI Chat hatası:', error);
                      
                      // Hata durumunda fallback mesaj
                      const errorResponse: Message = {
                        id: (Date.now() + 1).toString(),
                        text: 'Üzgünüm, şu anda bir teknik sorun yaşıyorum. Lütfen daha sonra tekrar deneyin.',
                        isUser: false,
                        timestamp: new Date(),
                      };
                      
                      setMessages(prev => [...prev, errorResponse]);
                      setIsTyping(false);
                    }
                  }}
                >
                  <Text style={[styles.quickQuestionText, isDark && styles.textDark]}>
                    {question}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View style={[styles.inputContainer, isDark && styles.inputContainerDark]}>
          <TextInput
            style={[styles.textInput, isDark && styles.textInputDark]}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Mesajınızı yazın..."
            placeholderTextColor={isDark ? colors.dark.text.secondary : '#999'}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              inputText.trim() === '' && styles.sendButtonDisabled,
            ]}
            onPress={sendMessage}
            disabled={inputText.trim() === ''}
          >
            <MaterialIcons 
              name="send" 
              size={20} 
              color={inputText.trim() === '' ? '#ccc' : 'white'} 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// Floating Chat Button Component
export const FloatingChatButton: React.FC<{ onPress: () => void }> = ({ onPress }) => {
  const { isDark } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    onPress();
  };

  return (
    <Animated.View style={[styles.floatingButton, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity onPress={handlePress} style={styles.floatingButtonInner}>
        <MaterialIcons name="psychology" size={28} color="white" />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  containerDark: {
    backgroundColor: colors.dark.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerDark: {
    backgroundColor: colors.dark.surface,
    borderBottomColor: colors.dark.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#9C27B0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  textDark: {
    color: colors.dark.text.primary,
  },
  textSecondaryDark: {
    color: colors.dark.text.secondary,
  },
  closeButton: {
    padding: 8,
  },
  messagesContainer: {
    flex: 1,
    padding: 20,
  },
  messageContainer: {
    marginBottom: 16,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  aiMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 16,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: '#9C27B0',
    borderBottomRightRadius: 8,
  },
  aiBubble: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 8,
    ...shadows.sm,
  },
  aiBubbleDark: {
    backgroundColor: colors.dark.surface,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: 'white',
  },
  aiMessageText: {
    color: '#333',
  },
  typingText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
  quickQuestionsContainer: {
    marginTop: 20,
  },
  quickQuestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  quickQuestionButton: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    ...shadows.sm,
  },
  quickQuestionButtonDark: {
    backgroundColor: colors.dark.surface,
  },
  quickQuestionText: {
    fontSize: 14,
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  inputContainerDark: {
    backgroundColor: colors.dark.surface,
    borderTopColor: colors.dark.border,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  textInputDark: {
    backgroundColor: colors.dark.background,
    borderColor: colors.dark.border,
    color: colors.dark.text.primary,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#9C27B0',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    ...shadows.lg,
  },
  floatingButtonInner: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    backgroundColor: '#9C27B0',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AIChat;