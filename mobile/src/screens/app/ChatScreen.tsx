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
        <ActivityIndicator size="large" color="#007AFF" />
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
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  connectionBanner: {
    backgroundColor: '#FF9800',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  connectionText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 16,
  },
  messageContainer: {
    marginHorizontal: 16,
    marginVertical: 4,
  },
  myMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  myMessageBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 8,
  },
  otherMessageBubble: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  myMessageText: {
    color: 'white',
  },
  otherMessageText: {
    color: '#333',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    justifyContent: 'flex-end',
  },
  messageTime: {
    fontSize: 12,
  },
  myMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherMessageTime: {
    color: '#B0BEC5',
  },
  readIndicator: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: 'bold',
  },
  typingContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  typingText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#F8F8F8',
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 24,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#B0BEC5',
  },
  sendButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ChatScreen;
