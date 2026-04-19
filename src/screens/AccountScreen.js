import * as React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Image, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Shadow } from '../styles/Theme';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { FontAwesome5 as Icon } from '@expo/vector-icons';
import { IMAGE_BASE_URL } from '../api/apiClient';

// 🛠️ HELPERS
const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) {
    return path.replace('127.0.0.1', IMAGE_BASE_URL.replace('http://', '').split(':')[0]);
  }
  return `${IMAGE_BASE_URL}/${path.replace('public/', '')}`;
};

const AccountScreen = ({ navigation }) => {
  const { user, isLoggedIn, logout } = useAuth();
  const { totalItems } = useCart();
  const { wishlistCount } = useWishlist();

  const handleLogout = () => {
    Alert.alert('Xác nhận đăng xuất', 'Bạn có chắc chắn muốn thoát khỏi phiên làm việc này?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: logout },
    ]);
  };

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
        <ScrollView contentContainerStyle={styles.guestScroll} showsVerticalScrollIndicator={false}>
          {/* Logo & Mascot Spotlight */}
          <View style={styles.guestHeader}>
            <Image 
                source={{ uri: `${IMAGE_BASE_URL}/images/logo.jpg` }} 
                style={styles.guestLogo} 
                resizeMode="contain" 
            />
            <View style={styles.guestMascotContainer}>
                <Image 
                source={{ uri: `${IMAGE_BASE_URL}/images/auth_mascot.png` }} 
                style={styles.guestMascot} 
                />
            </View>
          </View>

          <View style={styles.guestContent}>
            <Text style={styles.guestTitle}>Chào Bạn, <Text style={{color: Colors.secondary}}>Elite-er!</Text></Text>
            <Text style={styles.guestSubtitle}>Đăng nhập để trải nghiệm kỷ nguyên mua sắm Gear cao cấp và quản lý đơn hàng chuyên nghiệp.</Text>
            
            {/* Elite Perks Mini Section */}
            <View style={styles.perksRow}>
                <View style={styles.perkItem}>
                    <View style={styles.perkIconBox}><Icon name="coins" size={14} color="#fbbf24" /></View>
                    <Text style={styles.perkLabel}>Tích điểm</Text>
                </View>
                <View style={styles.perkItem}>
                    <View style={styles.perkIconBox}><Icon name="shipping-fast" size={14} color="#38bdf8" /></View>
                    <Text style={styles.perkLabel}>Freeship</Text>
                </View>
                <View style={styles.perkItem}>
                    <View style={styles.perkIconBox}><Icon name="headset" size={14} color="#f87171" /></View>
                    <Text style={styles.perkLabel}>Hỗ trợ 24/7</Text>
                </View>
            </View>

            <TouchableOpacity 
                style={styles.loginBtnElite} 
                onPress={() => navigation.navigate('Login')} 
                activeOpacity={0.9}
            >
              <Icon name="sign-in-alt" size={16} color={Colors.white} style={{marginRight: 10}} />
              <Text style={styles.loginBtnTextElite}>ĐĂNG NHẬP NGAY</Text>
            </TouchableOpacity>

            <TouchableOpacity 
                style={styles.registerBtnElite} 
                onPress={() => navigation.navigate('Register')} 
                activeOpacity={0.8}
            >
              <Text style={styles.registerBtnTextElite}>Gia nhập DDH Elite</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.guestFooter}>
              <Text style={styles.guestFooterText}>Kỷ nguyên số DDH Electronics © 2026</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const MENU_ITEMS = [
    { id: 'orders', icon: 'box-open', label: 'Quản lý đơn hàng', screen: 'Orders', color: '#3b82f6', desc: 'Theo dõi tiến độ giao hàng' },
    { id: 'wishlist', icon: 'heart', label: 'Danh sách yêu thích', screen: 'Wishlist', badge: wishlistCount, color: '#f97316', desc: 'Sản phẩm bạn đã lưu' },
    { id: 'profile', icon: 'user-cog', label: 'Thông tin cá nhân', screen: 'ProfileEdit', color: '#8b5cf6', desc: 'Cập nhật hồ sơ & địa chỉ' },
    { id: 'blog', icon: 'newspaper', label: 'Tin tức & Ưu đãi', screen: 'BlogList', color: '#10b981', desc: 'Khám phá bài viết mới nhất' },
    { id: 'help', icon: 'headset', label: 'Trung tâm hỗ trợ', screen: null, color: '#64748b', desc: 'Hỗ trợ kỹ thuật 24/7' },
  ];

  if (user?.is_admin == 1) {
    MENU_ITEMS.unshift({ 
      id: 'admin', 
      icon: 'shield-alt', 
      label: 'Quyền Quản Trị (Admin)', 
      screen: null, 
      color: '#ef4444',
      desc: 'Hệ thống quản lý Elite Web',
      onPress: () => Alert.alert('Thông báo Admin', 'Vui lòng truy cập trang Quản trị trên bản Web để thực hiện các thao tác quản lý dữ liệu chuyên sâu.')
    });
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 40}}>
        
        {/* Profile Premium Header */}
        <View style={styles.profileHeader}>
            <View style={styles.headerTop}>
                <View style={styles.avatarWrapper}>
                    <View style={styles.avatarRingOuter}>
                        {user?.avatar ? (
                            <Image source={{ uri: getImageUrl(user.avatar) }} style={styles.avatarPremium} />
                        ) : (
                            <View style={styles.avatarPlaceholderPremium}>
                                <Text style={styles.avatarInitialPremium}>{user?.name?.charAt(0).toUpperCase() || 'E'}</Text>
                            </View>
                        )}
                    </View>
                    {user?.is_admin == 1 && (
                        <View style={styles.adminVerified}>
                            <Icon name="check" size={8} color={Colors.white} />
                        </View>
                    )}
                </View>
                <View style={styles.profileInfo}>
                    <Text style={styles.userNamePremium}>{user?.name}</Text>
                    <Text style={styles.userEmailPremium}>{user?.email}</Text>
                    {user?.is_admin == 1 && (
                        <View style={styles.roleBadge}>
                            <Icon name="crown" size={10} color="#fbbf24" style={{marginRight: 5}} />
                            <Text style={styles.roleText}>DDH ADMINISTRATOR</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Premium Stats Row */}
            <View style={styles.premiumStatsRow}>
                <TouchableOpacity style={styles.statCard} onPress={() => navigation.navigate('Orders')}>
                    <View style={[styles.statIconBox, {backgroundColor: '#3b82f615'}]}>
                        <Icon name="box" size={16} color="#3b82f6" />
                    </View>
                    <Text style={styles.statVal}>Kiểm tra</Text>
                    <Text style={styles.statLab}>Đơn hàng</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.statCard} onPress={() => navigation.navigate('Cart')}>
                    <View style={[styles.statIconBox, {backgroundColor: '#f59e0b15'}]}>
                        <Icon name="shopping-cart" size={16} color="#f59e0b" />
                    </View>
                    <Text style={styles.statVal}>{totalItems}</Text>
                    <Text style={styles.statLab}>Giỏ hàng</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.statCard} onPress={() => navigation.navigate('Wishlist')}>
                    <View style={[styles.statIconBox, {backgroundColor: '#f9731615'}]}>
                        <Icon name="heart" size={16} color="#f97316" />
                    </View>
                    <Text style={styles.statVal}>{wishlistCount}</Text>
                    <Text style={styles.statLab}>Yêu thích</Text>
                </TouchableOpacity>
            </View>
        </View>

        {/* Menu Section */}
        <View style={styles.menuContainer}>
          <Text style={styles.sectionTitle}>TÀI KHOẢN & TRẢI NGHIỆM</Text>
          {MENU_ITEMS.map(item => (
            <TouchableOpacity
              key={item.id}
              style={styles.premiumMenuItem}
              activeOpacity={0.7}
              onPress={() => item.onPress ? item.onPress() : (item.screen && navigation.navigate(item.screen))}
            >
              <View style={[styles.menuIconBoxPremium, { backgroundColor: `${item.color}10` }]}>
                <Icon name={item.icon} size={16} color={item.color} />
              </View>
              <View style={{flex: 1}}>
                  <Text style={styles.menuLabelPremium}>{item.label}</Text>
                  <Text style={styles.menuDescPremium}>{item.desc}</Text>
              </View>
              {item.badge > 0 && (
                <View style={[styles.badgePremium, {backgroundColor: item.color}]}>
                  <Text style={styles.badgeTextPremium}>{item.badge}</Text>
                </View>
              )}
              <Icon name="chevron-right" size={10} color={Colors.muted} style={{opacity: 0.5}} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Support Card */}
        <View style={styles.supportCard}>
            <View style={styles.supportInfo}>
                <Text style={styles.supportTitle}>Cần trợ giúp?</Text>
                <Text style={styles.supportText}>Liên hệ đội ngũ CSKH DDH Electronics</Text>
            </View>
            <TouchableOpacity style={styles.supportBtn}>
                <Text style={styles.supportBtnText}>Chat ngay</Text>
            </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtnPremium} activeOpacity={0.8} onPress={handleLogout}>
          <Icon name="power-off" size={14} color="#ef4444" style={{ marginRight: 10 }} />
          <Text style={styles.logoutTextPremium}>ĐĂNG XUẤT TÀI KHOẢN</Text>
        </TouchableOpacity>

        <View style={styles.appVersion}>
            <Text style={styles.versionText}>Phiên bản 2.4.0 • Elite Edition</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },

  // ── GUEST STYLES (UPGRADED) ──
  guestScroll: { flexGrow: 1, paddingBottom: 40 },
  guestHeader: { alignItems: 'center', paddingTop: 40, paddingBottom: 20 },
  guestLogo: { width: 140, height: 60, marginBottom: 25 },
  guestMascotContainer: { 
    width: 180, height: 180, borderRadius: 90, backgroundColor: '#fff', 
    justifyContent: 'center', alignItems: 'center', ...Shadow.medium,
    borderWidth: 1, borderColor: '#f1f5f9'
  },
  guestMascot: { width: '100%', height: '100%', borderRadius: 90, resizeMode: 'cover' },
  guestContent: { paddingHorizontal: 40, alignItems: 'center' },
  guestTitle: { fontSize: 26, fontWeight: '900', color: Colors.primary, marginBottom: 12, textAlign: 'center' },
  guestSubtitle: { fontSize: 13, color: Colors.muted, textAlign: 'center', marginBottom: 30, lineHeight: 20, fontWeight: '600' },
  
  perksRow: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginBottom: 35 },
  perkItem: { alignItems: 'center', gap: 8 },
  perkIconBox: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  perkLabel: { fontSize: 10, fontWeight: '800', color: Colors.muted, textTransform: 'uppercase' },

  loginBtnElite: { 
    backgroundColor: Colors.primary, width: '100%', height: 58, borderRadius: 29, 
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', 
    marginBottom: 15, ...Shadow.medium 
  },
  loginBtnTextElite: { fontSize: 14, fontWeight: '900', color: Colors.white, letterSpacing: 1 },
  registerBtnElite: { 
    backgroundColor: '#fff', width: '100%', height: 58, borderRadius: 29, 
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' 
  },
  registerBtnTextElite: { fontSize: 14, fontWeight: '800', color: Colors.primary },
  guestFooter: { marginTop: 'auto', paddingTop: 40, alignItems: 'center' },
  guestFooterText: { fontSize: 11, color: Colors.muted, fontWeight: '700', opacity: 0.5 },

  // ── LOGGED-IN PREMIUM STYLES ──
  profileHeader: { backgroundColor: Colors.white, paddingHorizontal: 25, paddingTop: 20, paddingBottom: 25, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, ...Shadow.small },
  headerTop: { flexDirection: 'row', alignItems: 'center' },
  avatarWrapper: { position: 'relative' },
  avatarRingOuter: { width: 84, height: 84, borderRadius: 42, borderWidth: 3, borderColor: '#f1f5f9', padding: 3 },
  avatarPremium: { width: '100%', height: '100%', borderRadius: 42, resizeMode: 'cover' },
  avatarPlaceholderPremium: { width: '100%', height: '100%', borderRadius: 42, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  avatarInitialPremium: { fontSize: 28, fontWeight: '900', color: Colors.white },
  adminVerified: { position: 'absolute', bottom: 5, right: 5, backgroundColor: '#3b82f6', width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  
  profileInfo: { marginLeft: 20, flex: 1 },
  userNamePremium: { fontSize: 22, fontWeight: '900', color: Colors.primary, letterSpacing: -0.5 },
  userEmailPremium: { fontSize: 13, color: Colors.muted, fontWeight: '600', marginTop: 2 },
  roleBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff8e1', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start', marginTop: 8, borderWidth: 1, borderColor: '#ffe082' },
  roleText: { fontSize: 9, fontWeight: '900', color: '#b45309', letterSpacing: 0.5 },

  premiumStatsRow: { flexDirection: 'row', gap: 12, marginTop: 25 },
  statCard: { flex: 1, backgroundColor: '#f8fafc', borderRadius: 20, padding: 15, alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9' },
  statIconBox: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statVal: { fontSize: 15, fontWeight: '900', color: Colors.primary },
  statLab: { fontSize: 9, fontWeight: '800', color: Colors.muted, textTransform: 'uppercase', marginTop: 2 },

  menuContainer: { paddingHorizontal: 25, marginTop: 25 },
  sectionTitle: { fontSize: 11, fontWeight: '900', color: Colors.muted, letterSpacing: 1.5, marginBottom: 15 },
  premiumMenuItem: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, 
    padding: 16, borderRadius: 20, marginBottom: 12, ...Shadow.tiny,
    borderWidth: 1, borderColor: '#f1f5f9'
  },
  menuIconBoxPremium: { width: 40, height: 40, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  menuLabelPremium: { fontSize: 15, fontWeight: '800', color: Colors.primary },
  menuDescPremium: { fontSize: 11, color: Colors.muted, fontWeight: '500', marginTop: 2 },
  badgePremium: { borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2, marginRight: 10 },
  badgeTextPremium: { fontSize: 10, fontWeight: '900', color: Colors.white },

  supportCard: { 
    marginHorizontal: 25, marginTop: 10, backgroundColor: Colors.primary, 
    borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' 
  },
  supportTitle: { fontSize: 16, fontWeight: '900', color: Colors.white },
  supportText: { fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: '600', marginTop: 2 },
  supportBtn: { backgroundColor: Colors.secondary, paddingHorizontal: 15, paddingVertical: 8, borderRadius: 12 },
  supportBtnText: { fontSize: 12, fontWeight: '900', color: Colors.white },

  logoutBtnPremium: { 
    flexDirection: 'row', marginTop: 30, marginHorizontal: 25, 
    backgroundColor: '#fff', paddingVertical: 16, borderRadius: 20, 
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#fee2e2' 
  },
  logoutTextPremium: { fontSize: 13, fontWeight: '900', color: '#ef4444', letterSpacing: 0.5 },
  appVersion: { alignItems: 'center', marginTop: 25 },
  versionText: { fontSize: 10, color: Colors.muted, fontWeight: '700', opacity: 0.4 },
});

export default AccountScreen;
