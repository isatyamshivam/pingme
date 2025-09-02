import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AppStackParamList } from '../../navigation/AppStack';
import { useAuth } from '../../context/AuthContext';
import { UsersApi, User } from '../../utils/api';

type HomeScreenNavigationProp = StackNavigationProp<AppStackParamList>;

const HomeScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const navigation = useNavigation<HomeScreenNavigationProp>();
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setError(null);
      const result = await UsersApi.getAllUsers();
      
      if (result.success && result.data) {
        // Filter out current user from the list
        const filteredUsers = result.data.users.filter(u => u.id !== user?.id);
        setUsers(filteredUsers);
      } else {
        setError(result.error || 'Failed to fetch users');
        Alert.alert('Error', result.error || 'Failed to fetch users');
      }
    } catch (error) {
      const errorMessage = 'Network error. Please check your connection.';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleUserPress = (selectedUser: User) => {
    navigation.navigate('Chat', {
      userId: selectedUser.id,
      username: selectedUser.username,
    });
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            await logout();
          }
        },
      ]
    );
  };

  const getOnlineStatusColor = (isOnline?: boolean) => {
    return isOnline ? '#4CAF50' : '#9E9E9E';
  };

  const getOnlineStatusText = (isOnline?: boolean, lastSeen?: string) => {
    if (isOnline) return 'Online';
    if (lastSeen) {
      const lastSeenDate = new Date(lastSeen);
      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - lastSeenDate.getTime()) / (1000 * 60));
      
      if (diffInMinutes < 1) return 'Just now';
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
    return 'Offline';
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => handleUserPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.userAvatar}>
        <Text style={styles.userAvatarText}>
          {item.username.charAt(0).toUpperCase()}
        </Text>
        <View 
          style={[
            styles.onlineIndicator, 
            { backgroundColor: getOnlineStatusColor(item.isOnline) }
          ]} 
        />
      </View>
      
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.username}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
        <Text 
          style={[
            styles.userStatus, 
            { color: getOnlineStatusColor(item.isOnline) }
          ]}
        >
          {getOnlineStatusText(item.isOnline, item.lastSeen)}
        </Text>
      </View>
      
      <View style={styles.chatIndicator}>
        <Text style={styles.chatArrow}>›</Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateText}>
        {error ? 'Failed to load users' : 'No users found'}
      </Text>
      <TouchableOpacity style={styles.retryButton} onPress={fetchUsers}>
        <Text style={styles.retryButtonText}>
          {error ? 'Retry' : 'Refresh'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>PingMe</Text>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading users...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Welcome back!</Text>
          <Text style={styles.headerSubtitle}>Hello, {user?.username}!</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.usersSection}>
        <Text style={styles.sectionTitle}>
          Users ({users.length})
        </Text>
        
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={renderUserItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={users.length === 0 ? styles.emptyContainer : undefined}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  logoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#dc3545',
    borderRadius: 6,
  },
  logoutText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  usersSection: {
    flex: 1,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    position: 'relative',
  },
  userAvatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  userStatus: {
    fontSize: 12,
    fontWeight: '500',
  },
  chatIndicator: {
    paddingLeft: 12,
  },
  chatArrow: {
    fontSize: 24,
    color: '#ccc',
    fontWeight: '300',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyContainer: {
    flex: 1,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#007AFF',
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default HomeScreen;
