import * as React from 'react';
import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Image, Alert, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Shadow } from '../styles/Theme';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { FontAwesome5 as Icon } from '@expo/vector-icons';
import { IMAGE_BASE_URL } from '../api/apiClient';

const AccountScreen = ({ navigation }) => {
  const { user, isLoggedIn, logout, updateProfile } = useAuth();
  const { totalItems } = useCart();
  const { wishlistCount } = useWishlist();

  // Form States
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setAddress(user.address || '');
    }
  }, [user]);

  const handleUpdate = async () => {
    setLoading(true);
    const result = await updateProfile({ name, phone, address });
    setLoading(false);
    if (result.success) {
      Alert.alert('Thành công', 'Thông tin hồ sơ đã được cập nhật!');
    } else {
      Alert.alert('Lỗi', result.message || 'Không thể cập nhật hồ sơ.');
    }
  };

  const handleLogout = () => {
    Alert.alert('Xác nhận đăng xuất', 'Bạn có chắc chắn muốn thoát khỏi phiên làm việc này?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: logout },
    ]);
  };

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.guestContainer}>
          <Image source={{ uri: `${IMAGE_BASE_URL}/images/auth_mascot.png` }} style={styles.guestMascot} />
          <Text style={styles.guestTitle}>Chào Bạn!</Text>
          <Text style={styles.guestSubtitle}>Đăng nhập để trải nghiệm đặc quyền DDH-Elite và quản lý tài khoản của bạn.</Text>
          <TouchableOpacity style={styles.loginBtn} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginBtnText}>ĐĂNG NHẬP NGAY</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : null} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* 👤 SIDEBAR-LIKE USER INFO (WEB SYNC) */}
          <View style={styles.sidebarHeader}>
            <View style={styles.avatarContainer}>
              <Image 
                source={{ uri: user?.avatar ? (user.avatar.startsWith('http') ? user.avatar : `${IMAGE_BASE_URL}/${user.avatar.replace('public/', '')}`) : `${IMAGE_BASE_URL}/images/avatars/1776311457.jpg` }} 
                style={styles.avatarImg} 
              />
              <TouchableOpacity style={styles.avatarEditBtn}>
                <Icon name="camera" size={12} color="#fff" />
              </TouchableOpacity>
            </View>
            <Text style={styles.userName}>{user?.name || 'Admin DDH'}</Text>
            <Text style={styles.userRole}>Thành viên Elite</Text>
          </View>

          {/* 📋 MENU ITEMS (GRID FOR MOBILE) */}
          <View style={styles.menuGrid}>
            <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('ProfileEdit')}>
              <Icon name="user-circle" size={18} color="#1e293b" />
              <Text style={styles.menuLabel}>Hồ sơ</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Wishlist')}>
              <Icon name="heart" size={18} color="#1e293b" />
              <Text style={styles.menuLabel}>Yêu thích</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Orders')}>
              <Icon name="shopping-bag" size={18} color="#1e293b" />
              <Text style={styles.menuLabel}>Đơn hàng</Text>
            </TouchableOpacity>
            {user?.email === 'admin@ddh.com' && (
              <>
                <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('BlogList')}>
                  <Icon name="edit" size={18} color="#1e293b" />
                  <Text style={styles.menuLabel}>Viết bài</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={() => Linking.openURL(`${IMAGE_BASE_URL}/admin`)}>
                  <Icon name="user-shield" size={18} color="#3b82f6" />
                  <Text style={[styles.menuLabel, {color: '#3b82f6'}]}>Quản trị</Text>
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
              <Icon name="sign-out-alt" size={18} color="#ef4444" />
              <Text style={[styles.menuLabel, {color: '#ef4444'}]}>Thoát</Text>
            </TouchableOpacity>
          </View>

          {/* 📝 PROFILE FORM SECTION (WEB SYNC) */}
          <View style={styles.formSection}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionLine} />
              <Text style={styles.sectionTitleText}>THÔNG TIN CƠ BẢN</Text>
              <View style={styles.sectionLine} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>HỌ VÀ TÊN</Text>
              <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Admin DDH" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>ĐỊA CHỈ EMAIL</Text>
              <TextInput style={[styles.input, styles.inputDisabled]} value={user?.email} editable={false} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>SỐ ĐIỆN THOẠI</Text>
              <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="0337xxxxxx" keyboardType="phone-pad" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>ĐỊA CHỈ CỤ THỂ</Text>
              <TextInput 
                style={[styles.input, {height: 80, textAlignVertical: 'top', paddingTop: 12}]} 
                value={address} 
                onChangeText={setAddress} 
                multiline 
                placeholder="VD: Số 123, Đường ABC..." 
              />
            </View>

            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionLine} />
              <Text style={styles.sectionTitleText}>THAY ĐỔI MẬT KHẨU</Text>
              <View style={styles.sectionLine} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>MẬT KHẨU HIỆN TẠI</Text>
              <TextInput style={styles.input} secureTextEntry placeholder="••••••••" />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>MẬT KHẨU MỚI</Text>
              <TextInput style={styles.input} secureTextEntry placeholder="••••••••" />
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleUpdate} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : (
                <View style={styles.saveBtnContent}>
                  <Text style={styles.saveBtnText}>LƯU THAY ĐỔI</Text>
                  <Icon name="save" size={16} color="#fbbf24" style={{marginLeft: 10}} />
                </View>
              )}
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { paddingBottom: 50 },
  
  // Header Sidebar Style
  sidebarHeader: {
    paddingVertical: 30,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  avatarContainer: { position: 'relative', marginBottom: 15 },
  avatarImg: { width: 90, height: 90, borderRadius: 45, borderWidth: 4, borderColor: '#fff' },
  avatarEditBtn: { 
    position: 'absolute', bottom: 0, right: 0, 
    backgroundColor: '#1e293b', width: 28, height: 28, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff'
  },
  userName: { fontSize: 20, fontWeight: 'bold', color: '#1e293b' },
  userRole: { fontSize: 12, color: '#64748b', fontWeight: '600', marginTop: 4 },

  // Menu Grid
  menuGrid: { 
    flexDirection: 'row', flexWrap: 'wrap', padding: 15, 
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' 
  },
  menuItem: { width: '33.33%', alignItems: 'center', paddingVertical: 15 },
  menuLabel: { fontSize: 11, fontWeight: '700', color: '#475569', marginTop: 8 },

  // Form Section
  formSection: { padding: 25 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 25 },
  sectionLine: { flex: 1, height: 1, backgroundColor: '#f1f5f9' },
  sectionTitleText: { marginHorizontal: 15, fontSize: 11, fontWeight: '900', color: '#94a3b8', letterSpacing: 1 },
  
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 11, fontWeight: '800', color: '#1e293b', marginBottom: 8 },
  input: { 
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', 
    borderRadius: 12, height: 48, paddingHorizontal: 15, fontSize: 14, color: '#1e293b' 
  },
  inputDisabled: { backgroundColor: '#f8fafc', color: '#94a3b8' },

  saveBtn: {
    backgroundColor: '#0f172a', borderRadius: 50, height: 56,
    justifyContent: 'center', alignItems: 'center', marginTop: 20,
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8
  },
  saveBtnContent: { flexDirection: 'row', alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold', letterSpacing: 1 },

  // Guest State
  guestContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  guestMascot: { width: 150, height: 150, marginBottom: 20 },
  guestTitle: { fontSize: 24, fontWeight: 'bold', color: '#1e293b', marginBottom: 10 },
  guestSubtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 30 },
  loginBtn: { backgroundColor: '#0f172a', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 30 },
  loginBtnText: { color: '#fff', fontWeight: 'bold' },
});

export default AccountScreen;
