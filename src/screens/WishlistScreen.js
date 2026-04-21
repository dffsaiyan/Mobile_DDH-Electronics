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
import { useNotification } from '../context/NotificationContext';
import { useFocusEffect } from '@react-navigation/native';
import { IMAGE_BASE_URL, getUserAvatar } from '../api/apiClient';
import { FontAwesome5 as Icon, FontAwesome as FaIcon } from '@expo/vector-icons';

const getImageUrl = (path) => {
  if (!path) return 'https://via.placeholder.com/300';
  if (path.startsWith('http')) {
    return path.replace('127.0.0.1', IMAGE_BASE_URL.replace('http://', '').split(':')[0]);
  }
  let cleanPath = path.replace('public/', '');
  return `${IMAGE_BASE_URL}/${cleanPath}`;
};

const formatPrice = (price) => {
  return Math.round(price).toLocaleString('vi-VN') + ' VNĐ';
};

const WishlistScreen = ({ navigation }) => {
  const { wishlistItems, removeFromWishlist, clearWishlist, refreshWishlist } = useWishlist();
  
  // 🔄 REFRESH FROM API WHEN FOCUSED (SYNC WITH WEB)
  useFocusEffect(
    React.useCallback(() => {
      refreshWishlist();
    }, [])
  );
  const { addToCart } = useCart();
  const { user, logout } = useAuth();
  const { showToast, showConfirm } = useNotification();
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  const handleAddToCart = (item) => {
    addToCart({ ...item, sale_price: Number(item.sale_price) > 0 ? item.sale_price : item.price });
    removeFromWishlist(item.id);
    showToast(`Đã chuyển ${item.name} vào giỏ hàng!`, 'success');
  };

  const handleLogout = () => {
    showConfirm({
      title: 'Xác nhận đăng xuất',
      message: 'Bạn có chắc chắn muốn thoát?',
      confirmText: 'Đăng xuất',
      type: 'logout',
      onConfirm: logout
    });
  };

  const handleClearAll = () => {
    if (wishlistItems.length === 0) return;
    showConfirm({
      title: 'Xóa toàn bộ?',
      message: 'Bạn có chắc chắn muốn làm trống danh sách yêu thích của mình không?',
      confirmText: 'Xóa tất cả',
      type: 'danger',
      onConfirm: clearWishlist
    });
  };

  const totalPages = Math.ceil(wishlistItems.length / ITEMS_PER_PAGE);
  const paginatedWishlist = wishlistItems.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    return (
      <View style={styles.paginationRow}>
        <TouchableOpacity 
          style={[styles.pageBtn, currentPage === 1 && styles.pageBtnDisabled]} 
          onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
        >
          <Icon name="chevron-left" size={12} color={currentPage === 1 ? '#cbd5e1' : '#1e293b'} />
        </TouchableOpacity>
        
        {Array.from({ length: totalPages }).map((_, i) => (
          <TouchableOpacity 
            key={i} 
            style={[styles.pageNumber, currentPage === i + 1 && styles.pageNumberActive]}
            onPress={() => setCurrentPage(i + 1)}
          >
            <Text style={[styles.pageText, currentPage === i + 1 && styles.pageTextActive]}>{i + 1}</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity 
          style={[styles.pageBtn, currentPage === totalPages && styles.pageBtnDisabled]} 
          onPress={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages}
        >
          <Icon name="chevron-right" size={12} color={currentPage === totalPages ? '#cbd5e1' : '#1e293b'} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderHeader = () => (
    <View>
      {/* 👤 SIDEBAR-LIKE USER INFO */}
      <View style={styles.sidebarHeader}>
        <View style={styles.avatarContainer}>
          <Image 
            source={{ uri: getUserAvatar(user) }} 
            style={styles.avatarImg} 
          />
        </View>
        <Text style={styles.userName}>{user?.name || 'Admin DDH'}</Text>
        <Text style={styles.userRole}>Thành viên Elite</Text>
      </View>

      {/* 📋 MENU GRID (HORIZONTAL) */}
      <View style={styles.menuGrid}>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.replace('ProfileEdit')}>
          <Icon name="user-circle" size={16} color="#475569" />
          <Text style={styles.menuLabel}>Hồ sơ</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.menuItem, styles.menuItemActive]}>
          <Icon name="heart" size={16} color="#fff" />
          <Text style={[styles.menuLabel, {color: '#fff'}]}>Yêu thích</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.replace('Orders')}>
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
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <View style={styles.orangeBar} />
          <Text style={styles.wishlistTitleText}>Danh sách yêu thích ({wishlistItems.length})</Text>
        </View>
        {wishlistItems.length > 0 && (
          <TouchableOpacity style={styles.clearAllBtn} onPress={handleClearAll}>
            <Icon name="trash" size={12} color="#ef4444" />
            <Text style={styles.clearAllText}>Xóa tất cả</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
        <View style={styles.emptyIconBg}>
          <Icon name="heart" size={50} color={Colors.secondary} opacity={0.2} />
        </View>
        <View style={styles.emptyHeartIcon}>
          <Icon name="plus" size={14} color={Colors.white} />
        </View>
      </View>
      <Text style={styles.emptyTitle}>DANH SÁCH ĐANG TRỐNG!</Text>
      <Text style={styles.emptySubtitle}>
        Bạn chưa thêm "siêu phẩm" nào vào danh sách yêu thích. Hãy khám phá ngay để không bỏ lỡ những món đồ ưng ý!
      </Text>
      <TouchableOpacity 
        style={styles.shopBtn} 
        activeOpacity={0.8}
        onPress={() => navigation.navigate('HomeTabs')}
      >
        <View style={styles.shopBtnContent}>
          <Text style={styles.shopBtnText}>KHÁM PHÁ CỬA HÀNG</Text>
          <View style={styles.shopBtnIcon}>
            <Icon name="arrow-right" size={12} color={Colors.white} />
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <View style={styles.fixedHeader}>
        <TouchableOpacity onPress={() => navigation.navigate('HomeTabs', { screen: 'Account' })} style={styles.backIconBtn}>
          <Icon name="arrow-left" size={20} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.fixedHeaderTitle}>Danh sách yêu thích</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={paginatedWishlist}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderPagination}
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
                <Text style={styles.salePrice}>{formatPrice(Number(item.sale_price) > 0 ? item.sale_price : item.price)}</Text>
                {Number(item.sale_price) > 0 && Number(item.sale_price) < Number(item.price) && (
                  <Text style={styles.oldPrice}>{formatPrice(item.price)}</Text>
                )}
              </View>
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.cartBtn} onPress={() => handleAddToCart(item)}>
                  <Icon name="shopping-cart" size={12} color="#fff" style={{marginRight: 6}} />
                  <Text style={styles.cartBtnText}>THÊM GIỎ</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.removeBtn} onPress={() => {
                  removeFromWishlist(item.id);
                  showToast('Đã xóa khỏi danh sách yêu thích', 'info');
                }}>
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

  wishlistTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 25, marginTop: 25, marginBottom: 15 },
  orangeBar: { width: 6, height: 22, backgroundColor: '#f97316', borderRadius: 3, marginRight: 12 },
  wishlistTitleText: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  clearAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, padding: 8, backgroundColor: '#fef2f2', borderRadius: 8 },
  clearAllText: { fontSize: 11, fontWeight: 'bold', color: '#ef4444' },

  // Cards
  card: { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 20, borderRadius: 20, padding: 12, marginBottom: 15, borderWidth: 1, borderColor: '#f1f5f9', ...Shadow.small },
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
  emptyContainer: { paddingVertical: 80, alignItems: 'center', paddingHorizontal: 40, backgroundColor: '#fff' },
  emptyIconCircle: { width: 140, height: 140, marginBottom: 20, justifyContent: 'center', alignItems: 'center' },
  emptyIconBg: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 2 },
  emptyHeartIcon: { position: 'absolute', bottom: 15, right: 15, backgroundColor: Colors.secondary, width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: '#fff', elevation: 4 },
  emptyTitle: { fontSize: 20, fontWeight: '900', color: Colors.primary, marginBottom: 10, letterSpacing: -0.5 },
  emptySubtitle: { fontSize: 13, color: Colors.muted, textAlign: 'center', marginBottom: 35, lineHeight: 20 },
  shopBtn: { backgroundColor: Colors.primary, borderRadius: 50, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 15, elevation: 8, overflow: 'hidden' },
  shopBtnContent: { flexDirection: 'row', alignItems: 'center', paddingLeft: 30, paddingRight: 10, paddingVertical: 10 },
  shopBtnText: { fontSize: 13, fontWeight: '900', color: Colors.white, letterSpacing: 1, marginRight: 15 },
  shopBtnIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },

  // Pagination Styles
  paginationRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 30, gap: 10 },
  pageBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  pageBtnDisabled: { opacity: 0.5 },
  pageNumber: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  pageNumberActive: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  pageText: { fontSize: 14, fontWeight: '700', color: '#64748b' },
  pageTextActive: { color: '#fff' },
});

export default WishlistScreen;
