import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthApi, TokenManager } from '../utils/api';

interface User {
  id: string;
  username: string;
  email: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await TokenManager.getToken();
      const userData = await TokenManager.getUserData();
      
      if (token && userData) {
        setUser(userData);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await AuthApi.login(email, password);

      if (result.success && result.data) {
        // Store JWT token and user data
        await TokenManager.setToken(result.data.token);
        await TokenManager.setUserData(result.data.user);
        
        setUser(result.data.user);
        setIsAuthenticated(true);
        return { success: true };
      } else {
        return { 
          success: false, 
          error: result.error || 'Login failed. Please check your credentials.' 
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: 'Network error. Please check your connection and try again.' 
      };
    }
  };

  const register = async (username: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await AuthApi.register(username, email, password);

      if (result.success && result.data) {
        // Store JWT token and user data
        await TokenManager.setToken(result.data.token);
        await TokenManager.setUserData(result.data.user);
        
        setUser(result.data.user);
        setIsAuthenticated(true);
        return { success: true };
      } else {
        return { 
          success: false, 
          error: result.error || 'Registration failed. Please try again.' 
        };
      }
    } catch (error) {
      console.error('Register error:', error);
      return { 
        success: false, 
        error: 'Network error. Please check your connection and try again.' 
      };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await TokenManager.clearAllData();
      
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value: AuthContextType = {
    isAuthenticated,
    user,
    login,
    register,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
