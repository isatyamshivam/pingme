import io from 'socket.io-client';
import { API_CONFIG, TokenManager } from './api';

export interface TypingUser {
  userId: string;
  username: string;
  conversationId: string;
}

export interface MessageEvent {
  message: {
    id: string;
    content: string;
    senderId: string;
    receiverId: string;
    conversationId: string;
    timestamp: string;
    isRead: boolean;
    sender: {
      id: string;
      username: string;
    };
  };
}

export interface MessageReadEvent {
  conversationId: string;
  messageIds: string[];
  readerId: string;
}

type SocketType = ReturnType<typeof io>;

class SocketService {
  private socket: SocketType | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectInterval: number = 3000;

  // Event listeners
  private messageListeners: Array<(data: MessageEvent) => void> = [];
  private typingStartListeners: Array<(data: TypingUser) => void> = [];
  private typingStopListeners: Array<(data: TypingUser) => void> = [];
  private messageReadListeners: Array<(data: MessageReadEvent) => void> = [];
  private connectionListeners: Array<(connected: boolean) => void> = [];

  async connect(): Promise<void> {
    if (this.socket?.connected) {
      return;
    }

    try {
      const token = await TokenManager.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      this.socket = io(API_CONFIG.SOCKET_URL, {
        auth: {
          token,
        },
        transports: ['websocket'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectInterval,
      });

      this.setupEventListeners();
      
    } catch (error) {
      console.error('Socket connection error:', error);
      throw error;
    }
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.notifyConnectionListeners(true);
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('Socket disconnected:', reason);
      this.isConnected = false;
      this.notifyConnectionListeners(false);
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('Socket connection error:', error);
      this.isConnected = false;
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        this.notifyConnectionListeners(false);
      }
    });

    // Message events
    this.socket.on('message:new', (data: MessageEvent) => {
      console.log('New message received:', data);
      this.notifyMessageListeners(data);
    });

    this.socket.on('typing:start', (data: TypingUser) => {
      console.log('User started typing:', data);
      this.notifyTypingStartListeners(data);
    });

    this.socket.on('typing:stop', (data: TypingUser) => {
      console.log('User stopped typing:', data);
      this.notifyTypingStopListeners(data);
    });

    this.socket.on('message:read', (data: MessageReadEvent) => {
      console.log('Messages marked as read:', data);
      this.notifyMessageReadListeners(data);
    });
  }

  // Message operations
  sendMessage(conversationId: string, content: string): void {
    if (!this.socket?.connected) {
      throw new Error('Socket not connected');
    }

    this.socket.emit('message:send', {
      conversationId,
      content,
      timestamp: new Date().toISOString(),
    });
  }

  // Typing indicators
  startTyping(conversationId: string): void {
    if (!this.socket?.connected) return;
    
    this.socket.emit('typing:start', { conversationId });
  }

  stopTyping(conversationId: string): void {
    if (!this.socket?.connected) return;
    
    this.socket.emit('typing:stop', { conversationId });
  }

  // Read receipts
  markMessagesAsRead(conversationId: string, messageIds: string[]): void {
    if (!this.socket?.connected) return;
    
    this.socket.emit('message:read', {
      conversationId,
      messageIds,
    });
  }

  // Join/Leave conversation rooms
  joinConversation(conversationId: string): void {
    if (!this.socket?.connected) return;
    
    this.socket.emit('conversation:join', { conversationId });
  }

  leaveConversation(conversationId: string): void {
    if (!this.socket?.connected) return;
    
    this.socket.emit('conversation:leave', { conversationId });
  }

  // Event listener management
  onMessage(callback: (data: MessageEvent) => void): () => void {
    this.messageListeners.push(callback);
    return () => {
      this.messageListeners = this.messageListeners.filter(cb => cb !== callback);
    };
  }

  onTypingStart(callback: (data: TypingUser) => void): () => void {
    this.typingStartListeners.push(callback);
    return () => {
      this.typingStartListeners = this.typingStartListeners.filter(cb => cb !== callback);
    };
  }

  onTypingStop(callback: (data: TypingUser) => void): () => void {
    this.typingStopListeners.push(callback);
    return () => {
      this.typingStopListeners = this.typingStopListeners.filter(cb => cb !== callback);
    };
  }

  onMessageRead(callback: (data: MessageReadEvent) => void): () => void {
    this.messageReadListeners.push(callback);
    return () => {
      this.messageReadListeners = this.messageReadListeners.filter(cb => cb !== callback);
    };
  }

  onConnection(callback: (connected: boolean) => void): () => void {
    this.connectionListeners.push(callback);
    return () => {
      this.connectionListeners = this.connectionListeners.filter(cb => cb !== callback);
    };
  }

  // Notification methods
  private notifyMessageListeners(data: MessageEvent): void {
    this.messageListeners.forEach(callback => callback(data));
  }

  private notifyTypingStartListeners(data: TypingUser): void {
    this.typingStartListeners.forEach(callback => callback(data));
  }

  private notifyTypingStopListeners(data: TypingUser): void {
    this.typingStopListeners.forEach(callback => callback(data));
  }

  private notifyMessageReadListeners(data: MessageReadEvent): void {
    this.messageReadListeners.forEach(callback => callback(data));
  }

  private notifyConnectionListeners(connected: boolean): void {
    this.connectionListeners.forEach(callback => callback(connected));
  }

  // Utility methods
  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Clean up all listeners
  removeAllListeners(): void {
    this.messageListeners = [];
    this.typingStartListeners = [];
    this.typingStopListeners = [];
    this.messageReadListeners = [];
    this.connectionListeners = [];
  }
}

// Export singleton instance
export const socketService = new SocketService();
export default socketService;
