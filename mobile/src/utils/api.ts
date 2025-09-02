import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// API Configuration
export const API_CONFIG = {
  // Update this to your actual server URL
  BASE_URL: 'http://localhost:3000',
  SOCKET_URL: 'http://localhost:3000', // Socket.IO endpoint
  ENDPOINTS: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    PROFILE: '/auth/profile',
    USERS: '/users',
    MESSAGES: '/messages',
    CONVERSATIONS: '/conversations',
  },
  TIMEOUT: 10000, // 10 seconds
};

// Storage Keys
export const STORAGE_KEYS = {
  USER_TOKEN: 'userToken',
  USER_DATA: 'userData',
  REFRESH_TOKEN: 'refreshToken',
};

// Response Type Definitions
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
}

export interface RegisterResponse extends LoginResponse {}

export interface User {
  id: string;
  username: string;
  email: string;
  isOnline?: boolean;
  lastSeen?: string;
  avatar?: string;
}

export interface UsersResponse {
  users: User[];
  total: number;
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  conversationId: string;
  timestamp: string;
  isRead: boolean;
  messageType?: 'text' | 'image' | 'file';
  sender?: {
    id: string;
    username: string;
  };
}

export interface Conversation {
  id: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationMessages {
  messages: Message[];
  conversation: Conversation;
  total: number;
  page: number;
  hasMore: boolean;
}

// Token Management Utilities
export class TokenManager {
  static async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.USER_TOKEN);
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  static async setToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_TOKEN, token);
    } catch (error) {
      console.error('Error setting token:', error);
    }
  }

  static async removeToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_TOKEN);
    } catch (error) {
      console.error('Error removing token:', error);
    }
  }

  static async getUserData(): Promise<any | null> {
    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  static async setUserData(userData: any): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
    } catch (error) {
      console.error('Error setting user data:', error);
    }
  }

  static async removeUserData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
    } catch (error) {
      console.error('Error removing user data:', error);
    }
  }

  static async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.USER_TOKEN,
        STORAGE_KEYS.USER_DATA,
        STORAGE_KEYS.REFRESH_TOKEN,
      ]);
    } catch (error) {
      console.error('Error clearing all data:', error);
    }
  }
}

// Configure Axios
const axiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
});

// Add request interceptor to include auth token
axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await TokenManager.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired, logout user
      TokenManager.clearAllData();
    }
    return Promise.reject(error);
  }
);

// API Helper Functions for Authentication
export class AuthApi {
  static async login(email: string, password: string): Promise<ApiResponse<LoginResponse>> {
    try {
      const response = await axiosInstance.post(API_CONFIG.ENDPOINTS.LOGIN, {
        email,
        password,
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Login failed',
      };
    }
  }

  static async register(
    username: string,
    email: string,
    password: string
  ): Promise<ApiResponse<RegisterResponse>> {
    try {
      const response = await axiosInstance.post(API_CONFIG.ENDPOINTS.REGISTER, {
        username,
        email,
        password,
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Registration failed',
      };
    }
  }

  static async getProfile(): Promise<ApiResponse<User>> {
    try {
      const response = await axiosInstance.get(API_CONFIG.ENDPOINTS.PROFILE);

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to get profile',
      };
    }
  }
}

// API Helper Functions for Users
export class UsersApi {
  static async getAllUsers(): Promise<ApiResponse<UsersResponse>> {
    try {
      const response = await axiosInstance.get(API_CONFIG.ENDPOINTS.USERS);

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch users',
      };
    }
  }

  static async getUserById(userId: string): Promise<ApiResponse<User>> {
    try {
      const response = await axiosInstance.get(`${API_CONFIG.ENDPOINTS.USERS}/${userId}`);

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch user',
      };
    }
  }

  static async updateOnlineStatus(isOnline: boolean): Promise<ApiResponse> {
    try {
      const response = await axiosInstance.put(`${API_CONFIG.ENDPOINTS.USERS}/status`, {
        isOnline,
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to update status',
      };
    }
  }
}

// API Helper Functions for Conversations and Messages
export class ConversationsApi {
  static async getConversationMessages(
    conversationId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<ApiResponse<ConversationMessages>> {
    try {
      const response = await axiosInstance.get(
        `${API_CONFIG.ENDPOINTS.CONVERSATIONS}/${conversationId}/messages`,
        {
          params: { page, limit }
        }
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch messages',
      };
    }
  }

  static async sendMessage(
    conversationId: string,
    content: string,
    messageType: 'text' | 'image' | 'file' = 'text'
  ): Promise<ApiResponse<Message>> {
    try {
      const response = await axiosInstance.post(
        `${API_CONFIG.ENDPOINTS.CONVERSATIONS}/${conversationId}/messages`,
        {
          content,
          messageType,
        }
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to send message',
      };
    }
  }

  static async markMessagesAsRead(conversationId: string): Promise<ApiResponse> {
    try {
      const response = await axiosInstance.put(
        `${API_CONFIG.ENDPOINTS.CONVERSATIONS}/${conversationId}/read`
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to mark messages as read',
      };
    }
  }

  static async getOrCreateConversation(userId: string): Promise<ApiResponse<Conversation>> {
    try {
      const response = await axiosInstance.post(
        `${API_CONFIG.ENDPOINTS.CONVERSATIONS}`,
        {
          participantId: userId,
        }
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to create conversation',
      };
    }
  }
}
