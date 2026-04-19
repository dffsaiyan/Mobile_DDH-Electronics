import * as React from 'react';
const { useState, useEffect } = React;
import {
  View, Text, StyleSheet, FlatList, Image,
  TouchableOpacity, StatusBar, ActivityIndicator, ScrollView, Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Shadow } from '../styles/Theme';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { IMAGE_BASE_URL } from '../api/apiClient';
import { FontAwesome5 as Icon, FontAwesome as FaIcon } from '@expo/vector-icons';

const getImageUrl = (path) => {
  if (!path) return 'https://via.placeholder.com/300';
  if (path.startsWith('http')) {
    return path.replace('127.0.0.1', IMAGE_BASE_URL.replace('http://', '').split(':')[0]);
  }
  let cleanPath = path.replace('public/', '');
  return `${IMAGE_BASE_URL}/${cleanPath}`;
};

const WishlistScreen = ({ navigation }) => {
  const { wishlistItems, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { user, logout } = useAuth();

  const handleAddToCart = (item) => {
    addToCart({ ...item, sale_price: item.sale_price || item.price });
    removeFromWishlist(item.id);
  };

  const handleLogout = () => {
    Alert.alert('Xác nhận đăng xuất', 'Bạn có chắc chắn muốn thoát?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: logout },
    ]);
  };

  const renderHeader = () => (
    <View>
      {/* 👤 SIDEBAR-LIKE USER INFO */}
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

      {/* 📋 MENU GRID (HORIZONTAL) */}
      <View style={styles.menuGrid}>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('ProfileEdit')}>
          <Icon name="user-circle" size={16} color="#475569" />
          <Text style={styles.menuLabel}>Hồ sơ</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.menuItem, styles.menuItemActive]}>
          <Icon name="heart" size={16} color="#fff" />
          <Text style={[styles.menuLabel, {color: '#fff'}]}>Yêu thích</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Orders')}>
          <Icon name="shopping-bag" size={16} color="#475569" />
          <Text style={styles.menuLabel}>Đơn hàng</Text>
        </TouchableOpacity>
        {user?.email === 'admin@ddh.com' && (
          <TouchableOpacity style={styles.menuItem} onPress={() => Linking.openURL(`${IMAGE_BASE_URL}/admin`)}>
            <Icon name="user-shield" size={16} color="#3b82f6" />
            <Text style={[styles.menuLabel, {color: '#3b82f6'}]}>Quản trị</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.menuItem} onPress={logout}>
          <Icon name="sign-out-alt" size={16} color="#ef4444" />
          <Text style={[styles.menuLabel, {color: '#ef4444'}]}>Thoát</Text>
        </TouchableOpacity>
      </View>

      {/* 🏷️ WISHLIST TITLE WITH ORANGE BAR */}
      <View style={styles.wishlistTitleRow}>
        <View style={styles.orangeBar} />
        <Text style={styles.wishlistTitleText}>Danh sách yêu thích ({wishlistItems.length})</Text>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <FaIcon name="heart-o" size={80} color="#e2e8f0" />
      </View>
      <Text style={styles.emptyTitle}>Danh sách yêu thích trống!</Text>
      <Text style={styles.emptySubtitle}>Hãy thêm những sản phẩm bạn yêu thích để dễ dàng theo dõi và mua sắm sau này.</Text>
      <TouchableOpacity style={styles.shopBtn} onPress={() => navigation.navigate('HomeTabs')}>
        <Text style={styles.shopBtnText}>KHÁM PHÁ CỬA HÀNG</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <View style={styles.fixedHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backIconBtn}>
          <Icon name="chevron-left" size={20} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.fixedHeaderTitle}>Danh sách yêu thích</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={wishlistItems.length > 0 ? wishlistItems : []}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        keyExtractor={item => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.card} 
            activeOpacity={0.9}
            onPress={() => navigation.navigate('ProductDetail', { product: item })}
          >
            <View style={styles.imageBox}>
              <Image source={{ uri: getImageUrl(item.image) }} style={styles.cardImage} resizeMode="contain" />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardCategory}>{item.category?.name || 'Sản phẩm'}</Text>
              <Text style={styles.cardName} numberOfLines={2}>{item.name}</Text>
              <View style={styles.priceRow}>
                <Text style={styles.salePrice}>{(item.sale_price || item.price).toLocaleString('vi-VN')}đ</Text>
                {item.sale_price < item.price && (
                  <Text style={styles.oldPrice}>{item.price.toLocaleString('vi-VN')}đ</Text>
                )}
              </View>
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.cartBtn} onPress={() => handleAddToCart(item)}>
                  <Icon name="shopping-cart" size={12} color="#fff" style={{marginRight: 6}} />
                  <Text style={styles.cartBtnText}>THÊM GIỎ</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.removeBtn} onPress={() => removeFromWishlist(item.id)}>
                  <Icon name="trash-alt" size={16} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  fixedHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 56, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  backIconBtn: { width: 40, height: 40, justifyContent: 'center' },
  fixedHeaderTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  
  listContent: { paddingBottom: 50 },

  // Sidebar-like Header
  sidebarHeader: { paddingVertical: 25, alignItems: 'center', backgroundColor: '#f8fafc', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  avatarContainer: { position: 'relative', marginBottom: 12 },
  avatarImg: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: '#fff' },
  avatarEditBtn: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#1e293b', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  userName: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  userRole: { fontSize: 11, color: '#64748b', fontWeight: '600', marginTop: 2 },

  // Menu Grid
  menuGrid: { flexDirection: 'row', padding: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  menuItem: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12 },
  menuItemActive: { backgroundColor: '#f97316' },
  menuLabel: { fontSize: 10, fontWeight: '700', color: '#64748b', marginTop: 6 },

  // Title with Orange Bar
  wishlistTitleRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 25, marginTop: 25, marginBottom: 15 },
  orangeBar: { width: 6, height: 22, backgroundColor: '#f97316', borderRadius: 3, marginRight: 12 },
  wishlistTitleText: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },

  // Cards
  card: { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 20, borderRadius: 20, padding: 12, marginBottom: 15, borderWidth: 1, borderColor: '#f1f5f9', ...Shadow.tiny },
  imageBox: { width: 90, height: 90, borderRadius: 16, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  cardImage: { width: '80%', height: '80%' },
  cardInfo: { flex: 1, justifyContent: 'center' },
  cardCategory: { fontSize: 9, fontWeight: '800', color: '#f97316', textTransform: 'uppercase', marginBottom: 3 },
  cardName: { fontSize: 13, fontWeight: '700', color: '#1e293b', lineHeight: 18, marginBottom: 5 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  salePrice: { fontSize: 15, fontWeight: '900', color: '#1e293b' },
  oldPrice: { fontSize: 10, color: '#94a3b8', textDecorationLine: 'line-through' },
  actionRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  cartBtn: { flex: 1, backgroundColor: '#1e293b', height: 36, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  cartBtnText: { fontSize: 10, fontWeight: 'bold', color: '#fff' },
  removeBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#fef2f2', justifyContent: 'center', alignItems: 'center' },

  // Empty State
  emptyContainer: { paddingVertical: 80, alignItems: 'center', paddingHorizontal: 40 },
  emptyIconContainer: { marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#64748b', marginBottom: 10 },
  emptySubtitle: { fontSize: 13, color: '#94a3b8', textAlign: 'center', marginBottom: 30, lineHeight: 20 },
  shopBtn: { backgroundColor: '#0f172a', paddingHorizontal: 35, paddingVertical: 16, borderRadius: 50, ...Shadow.medium },
  shopBtnText: { fontSize: 13, fontWeight: 'bold', color: '#fff', letterSpacing: 1 },
});

export default WishlistScreen;
