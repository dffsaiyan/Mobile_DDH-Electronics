import * as React from 'react';
import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Image, KeyboardAvoidingView, Platform,
  ImageBackground, Dimensions, Linking
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Shadow } from '../styles/Theme';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { FontAwesome5 as Icon } from '@expo/vector-icons';
import { IMAGE_BASE_URL, getUserAvatar } from '../api/apiClient';

const { height, width } = Dimensions.get('window');

const AccountScreen = ({ navigation }) => {
  const { user, isLoggedIn, logout } = useAuth();
  const { showToast, showConfirm } = useNotification();
  const { totalItems } = useCart();
  const { wishlistCount } = useWishlist();

  const handleLogout = () => {
    showConfirm({
      title: 'Xác nhận thoát',
      message: 'Bạn có chắc chắn muốn đăng xuất khỏi phiên làm việc này?',
      confirmText: 'Đăng xuất',
      type: 'logout',
      onConfirm: logout
    });
  };

  if (!isLoggedIn) {
    return (
      <View style={styles.guestFullContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        
        <ImageBackground 
          source={{ uri: `${IMAGE_BASE_URL}/images/auth_mascot.png` }} 
          style={styles.guestMascotFull}
          resizeMode="cover"
        >
          <LinearGradient
            colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.5)', '#fff']}
            style={styles.guestGradient}
          >
            <View style={styles.authCardElite}>
              <Text style={styles.guestTitle}>Chào Bạn!</Text>
              <Text style={styles.guestSubtitle}>Đăng nhập để trải nghiệm đặc quyền DDH-Elite và quản lý tài khoản của bạn.</Text>
              
              <TouchableOpacity style={styles.loginBtn} onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginBtnText}>ĐĂNG NHẬP NGAY</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.loginBtn, { backgroundColor: '#64748b', marginTop: 15 }]} 
                onPress={() => navigation.navigate('Register')}
              >
                <Text style={styles.loginBtnText}>ĐĂNG KÝ TÀI KHOẢN</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </ImageBackground>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* SIDEBAR-LIKE USER INFO */}
        <View style={styles.sidebarHeader}>
          <View style={styles.avatarContainer}>
            <Image 
              source={{ uri: getUserAvatar(user) }} 
              style={styles.avatarImg} 
            />
          </View>
          <Text style={styles.userName}>{(user?.name || 'Thành viên DDH').replace(/\+/g, ' ')}</Text>
          <Text style={styles.userRole}>Thành viên Elite</Text>
        </View>

        {/* MENU GRID */}
        <View style={styles.menuGrid}>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('ProfileEdit')}>
            <View style={styles.iconCircle}>
              <Icon name="user-circle" size={20} color={Colors.primary} />
            </View>
            <Text style={styles.menuLabel}>Hồ sơ</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Wishlist')}>
            <View style={styles.iconCircle}>
              <Icon name="heart" size={20} color="#ef4444" />
            </View>
            <Text style={styles.menuLabel}>Yêu thích</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Orders')}>
            <View style={styles.iconCircle}>
              <Icon name="shopping-bag" size={20} color="#3b82f6" />
            </View>
            <Text style={styles.menuLabel}>Đơn hàng</Text>
          </TouchableOpacity>

          {user?.email === 'admin@ddh.com' && (
            <>
              <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('BlogList')}>
                <View style={styles.iconCircle}>
                  <Icon name="newspaper" size={20} color="#8b5cf6" />
                </View>
                <Text style={styles.menuLabel}>Tin tức</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={() => Linking.openURL(`${IMAGE_BASE_URL}/admin`)}>
                <View style={styles.iconCircle}>
                  <Icon name="user-shield" size={20} color="#10b981" />
                </View>
                <Text style={styles.menuLabel}>Quản trị</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <View style={styles.iconCircle}>
              <Icon name="sign-out-alt" size={20} color="#64748b" />
            </View>
            <Text style={styles.menuLabel}>Thoát</Text>
          </TouchableOpacity>
        </View>

        {/* STATS SECTION */}
        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{wishlistCount || 0}</Text>
            <Text style={styles.statLabel}>Yêu thích</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalItems || 0}</Text>
            <Text style={styles.statLabel}>Giỏ hàng</Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { paddingBottom: 50 },
  
  // Header Sidebar Style
  sidebarHeader: {
    paddingVertical: 40,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  avatarContainer: { position: 'relative', marginBottom: 15 },
  avatarImg: { width: 100, height: 100, borderRadius: 50, borderWidth: 4, borderColor: '#fff' },
  userName: { fontSize: 22, fontWeight: 'bold', color: '#1e293b' },
  userRole: { fontSize: 13, color: '#64748b', fontWeight: '600', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 },

  // Menu Grid
  menuGrid: { 
    flexDirection: 'row', flexWrap: 'wrap', padding: 20, 
    backgroundColor: '#fff'
  },
  menuItem: { width: '33.33%', alignItems: 'center', marginBottom: 25 },
  iconCircle: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: '#f1f5f9',
    justifyContent: 'center', alignItems: 'center', marginBottom: 10
  },
  menuLabel: { fontSize: 12, fontWeight: '700', color: '#475569' },

  // Stats
  statsSection: { 
    flexDirection: 'row', marginHorizontal: 25, backgroundColor: '#1e293b', 
    borderRadius: 20, padding: 20, alignItems: 'center'
  },
  statCard: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 4, fontWeight: '700' },
  statDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.1)' },

  infoNote: { 
    flexDirection: 'row', alignItems: 'center', padding: 30, opacity: 0.7 
  },
  infoNoteText: { 
    fontSize: 12, color: '#64748b', marginLeft: 10, flex: 1, lineHeight: 18, fontWeight: '600' 
  },

  // Guest State Elite
  guestFullContainer: { flex: 1, backgroundColor: '#fff' },
  guestMascotFull: { width: width, height: height },
  guestGradient: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 25,
  },
  authCardElite: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    width: '100%',
    padding: 30,
    borderRadius: 35,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)'
  },
  guestTitle: { fontSize: 24, fontWeight: 'bold', color: '#1e293b', marginBottom: 10 },
  guestSubtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 30, lineHeight: 22 },
  loginBtn: { backgroundColor: '#0f172a', paddingVertical: 16, borderRadius: 30, width: '100%', alignItems: 'center' },
  loginBtnText: { color: '#fff', fontWeight: '900', letterSpacing: 1 },
});

export default AccountScreen;
