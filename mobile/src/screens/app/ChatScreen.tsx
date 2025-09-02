import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { ConversationsApi, Message } from '../../utils/api';
import socketService, { MessageEvent, TypingUser } from '../../utils/socketService';

interface MessageWithFormatted extends Message {
  formattedTime: string;
}

const conversationsApi = new ConversationsApi();

const ChatScreen: React.FC<any> = ({ route }) => {
  const { user } = useAuth();
  const { userId, username, conversationId: initialConversationId } = route.params;
  
  const [messages, setMessages] = useState<MessageWithFormatted[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(initialConversationId || null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const unsubscribeFunctions = useRef<Array<() => void>>([]);

  // Format timestamp for display
  const formatMessageTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (messageDate.getTime() === today.getTime()) {
      // Today - show time only
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (messageDate.getTime() === today.getTime() - 24 * 60 * 60 * 1000) {
      // Yesterday
      return `Yesterday ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      // Older - show date and time
      return date.toLocaleDateString([], { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  };

  // Load conversation and messages
  const loadMessages = useCallback(async () => {
    try {
      setLoading(true);
      
      let currentConversationId = conversationId;
      
      // Get or create conversation if we don't have one
      if (!currentConversationId) {
        const conversationResponse = await ConversationsApi.getOrCreateConversation(userId);
        if (conversationResponse.success && conversationResponse.data) {
          currentConversationId = conversationResponse.data.id;
          setConversationId(conversationResponse.data.id);
        } else {
          throw new Error(conversationResponse.error || 'Failed to create conversation');
        }
      }

      // Load messages
      const messagesResponse = await ConversationsApi.getConversationMessages(currentConversationId);
      if (messagesResponse.success && messagesResponse.data) {
        const formattedMessages: MessageWithFormatted[] = messagesResponse.data.messages.map((message: Message) => ({
          ...message,
          formattedTime: formatMessageTime(message.timestamp)
        }));
        
        setMessages(formattedMessages);

        // Mark messages as read
        const unreadMessages = messagesResponse.data.messages.filter((msg: Message) => !msg.isRead && msg.senderId !== user?.id);
        if (unreadMessages.length > 0) {
          await ConversationsApi.markMessagesAsRead(currentConversationId);
          
          // Also emit to socket for real-time updates
          if (socketService.isSocketConnected()) {
            const messageIds = unreadMessages.map((msg: Message) => msg.id);
            socketService.markMessagesAsRead(currentConversationId, messageIds);
          }
        }
      } else {
        throw new Error(messagesResponse.error || 'Failed to load messages');
      }

    } catch (error) {
      console.error('Error loading messages:', error);
      Alert.alert('Error', 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [conversationId, userId, user?.id]);

  // Initialize socket connection
  const initializeSocket = useCallback(async () => {
    try {
      await socketService.connect();
      
      // Set up event listeners
      const unsubscribeConnection = socketService.onConnection((connected) => {
        setIsConnected(connected);
        if (connected && conversationId) {
          socketService.joinConversation(conversationId);
        }
      });

      const unsubscribeMessage = socketService.onMessage((data: MessageEvent) => {
        const newMessage: MessageWithFormatted = {
          ...data.message,
          formattedTime: formatMessageTime(data.message.timestamp)
        };
        
        setMessages(prev => [...prev, newMessage]);
        
        // Auto-mark as read if it's from the other user
        if (data.message.senderId !== user?.id && conversationId) {
          setTimeout(async () => {
            await ConversationsApi.markMessagesAsRead(conversationId);
            if (socketService.isSocketConnected()) {
              socketService.markMessagesAsRead(conversationId, [data.message.id]);
            }
          }, 1000);
        }
      });

      const unsubscribeTypingStart = socketService.onTypingStart((data: TypingUser) => {
        if (data.userId !== user?.id && data.conversationId === conversationId) {
          setTypingUsers(prev => {
            const exists = prev.find(u => u.userId === data.userId);
            return exists ? prev : [...prev, data];
          });
        }
      });

      const unsubscribeTypingStop = socketService.onTypingStop((data: TypingUser) => {
        if (data.userId !== user?.id) {
          setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
        }
      });

      const unsubscribeMessageRead = socketService.onMessageRead((data) => {
        if (data.conversationId === conversationId) {
          setMessages(prev => prev.map(msg => 
            data.messageIds.includes(msg.id) ? { ...msg, isRead: true } : msg
          ));
        }
      });

      // Store unsubscribe functions
      unsubscribeFunctions.current = [
        unsubscribeConnection,
        unsubscribeMessage,
        unsubscribeTypingStart,
        unsubscribeTypingStop,
        unsubscribeMessageRead,
      ];

    } catch (error) {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    }
  }, [conversationId, user?.id]);

  // Handle sending message
  const sendMessage = async () => {
    if (!inputText.trim() || sending || !conversationId) return;

    try {
      setSending(true);
      
      // Stop typing indicator
      handleStopTyping();
      
      const messageContent = inputText.trim();
      setInputText('');

      // Send via Socket.IO for real-time delivery
      if (socketService.isSocketConnected()) {
        socketService.sendMessage(conversationId, messageContent);
      } else {
        // Fallback to API if socket not connected
        const sendResponse = await ConversationsApi.sendMessage(conversationId, messageContent);
        if (sendResponse.success) {
          // Reload messages to show the new message
          loadMessages();
        } else {
          throw new Error(sendResponse.error || 'Failed to send message');
        }
      }

    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
      // Restore the input text if sending failed
      setInputText(inputText);
    } finally {
      setSending(false);
    }
  };

  // Handle typing indicators
  const handleTyping = (text: string) => {
    setInputText(text);
    
    if (!conversationId || !socketService.isSocketConnected()) return;

    // Start typing indicator
    if (text.trim() && !isTyping) {
      setIsTyping(true);
      socketService.startTyping(conversationId);
    }

    // Reset typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      handleStopTyping();
    }, 2000);
  };

  const handleStopTyping = () => {
    if (isTyping && conversationId && socketService.isSocketConnected()) {
      setIsTyping(false);
      socketService.stopTyping(conversationId);
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  // Initialize screen
  useEffect(() => {
    // Set screen title - Note: This would need navigation prop to work
    // navigation.setOptions({ title: username });
    
    const initialize = async () => {
      await loadMessages();
      await initializeSocket();
    };
    
    initialize();

    // Join conversation when we have an ID
    if (conversationId && socketService.isSocketConnected()) {
      socketService.joinConversation(conversationId);
    }

    return () => {
      // Cleanup
      if (conversationId && socketService.isSocketConnected()) {
        socketService.leaveConversation(conversationId);
      }
      
      handleStopTyping();
      
      // Unsubscribe from all socket events
      unsubscribeFunctions.current.forEach(unsubscribe => unsubscribe());
    };
  }, [username, loadMessages, initializeSocket, conversationId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Render message item
  const renderMessage = ({ item }: { item: MessageWithFormatted }) => {
    const isMyMessage = item.senderId === user?.id;
    
    return (
      <View style={[
        styles.messageContainer,
        isMyMessage ? styles.myMessage : styles.otherMessage
      ]}>
        <View style={[
          styles.messageBubble,
          isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble
        ]}>
          <Text style={[
            styles.messageText,
            isMyMessage ? styles.myMessageText : styles.otherMessageText
          ]}>
            {item.content}
          </Text>
          <View style={styles.messageFooter}>
            <Text style={[
              styles.messageTime,
              isMyMessage ? styles.myMessageTime : styles.otherMessageTime
            ]}>
              {item.formattedTime}
            </Text>
            {isMyMessage && (
              <Text style={[
                styles.readIndicator,
                { color: item.isRead ? '#4FC3F7' : '#B0BEC5' }
              ]}>
                {item.isRead ? '✓✓' : '✓'}
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  // Render typing indicator
  const renderTypingIndicator = () => {
    if (typingUsers.length === 0) return null;

    return (
      <View style={styles.typingContainer}>
        <Text style={styles.typingText}>
          {typingUsers[0].username} is typing...
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f59e0b" />
        <Text style={styles.loadingText}>Loading messages...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Connection status */}
      {!isConnected && (
        <View style={styles.connectionBanner}>
          <Text style={styles.connectionText}>Connecting...</Text>
        </View>
      )}

      {/* Messages list */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Typing indicator */}
      {renderTypingIndicator()}

      {/* Input area */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={handleTyping}
          placeholder="Type a message..."
          placeholderTextColor="#B0BEC5"
          multiline
          maxLength={1000}
          editable={!sending}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!inputText.trim() || sending) && styles.sendButtonDisabled
          ]}
          onPress={sendMessage}
          disabled={!inputText.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.sendButtonText}>Send</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fef3c7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    color: '#f59e0b',
    fontWeight: '600',
  },
  connectionBanner: {
    backgroundColor: 'linear-gradient(135deg, #fed6e3, #fbb6ce)',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  connectionText: {
    color: '#744210',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 20,
  },
  messageContainer: {
    marginHorizontal: 20,
    marginVertical: 6,
  },
  myMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '85%',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 25,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  myMessageBubble: {
    backgroundColor: '#f59e0b',
    borderBottomRightRadius: 8,
  },
  otherMessageBubble: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '500',
  },
  myMessageText: {
    color: 'white',
  },
  otherMessageText: {
    color: '#2d3748',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    justifyContent: 'flex-end',
  },
  messageTime: {
    fontSize: 12,
    fontWeight: '500',
  },
  myMessageTime: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  otherMessageTime: {
    color: '#a0aec0',
  },
  readIndicator: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  typingContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  typingText: {
    fontSize: 14,
    color: '#f59e0b',
    fontStyle: 'italic',
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  textInput: {
    flex: 1,
    borderWidth: 2,
    borderColor: 'rgba(245, 158, 11, 0.2)',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginRight: 12,
    maxHeight: 120,
    fontSize: 16,
    color: '#2d3748',
    backgroundColor: '#f7fafc',
    fontWeight: '500',
  },
  sendButton: {
    backgroundColor: '#f59e0b',
    borderRadius: 28,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  sendButtonDisabled: {
    backgroundColor: '#cbd5e0',
    shadowOpacity: 0.1,
  },
  sendButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
});

export default ChatScreen;
