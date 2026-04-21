import * as React from 'react';
const { useState, useEffect } = React;
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  StatusBar, ActivityIndicator, Image, Alert, Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Shadow } from '../styles/Theme';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import apiClient, { IMAGE_BASE_URL, getUserAvatar } from '../api/apiClient';
import { FontAwesome5 as Icon, FontAwesome as FaIcon } from '@expo/vector-icons';

const formatPrice = (price) => {
  if (!price || isNaN(price)) return '0 VNĐ';
  return Math.round(price).toLocaleString('vi-VN') + ' VNĐ';
};

const formatDate = (dateString) => {
  if (!dateString) return 'Vừa xong';
  try {
    const date = new Date(dateString);
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const mo = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${h}:${m} - ${d}/${mo}/${y}`;
  } catch (e) {
    return dateString;
  }
};

const STATUS_MAP = {
  pending: { label: 'Chờ xử lý', color: '#f59e0b', bg: '#fffbeb', icon: 'clock' },
  processing: { label: 'Đang xử lý', color: '#3b82f6', bg: '#eff6ff', icon: 'sync' },
  shipping: { label: 'Đang giao', color: '#8b5cf6', bg: '#f5f3ff', icon: 'truck' },
  delivered: { label: 'Đã giao', color: '#10b981', bg: '#f0fdf4', icon: 'check-circle' },
  cancelled: { label: 'Đã hủy', color: '#ef4444', bg: '#fef2f2', icon: 'times-circle' },
};

const OrderCard = ({ order, onPress }) => {
  const status = STATUS_MAP[order.status] || STATUS_MAP.pending;
  const itemsCount = order.items_count || order.items?.length || 0;

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(order)} activeOpacity={0.8}>
      <View style={styles.cardHeader}>
        <View style={styles.orderBadge}>
          <Text style={styles.orderId}>Mã đơn #{order.id}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
          <Icon name={status.icon} size={10} color={status.color} style={{ marginRight: 5 }} />
          <Text style={[styles.statusText, { color: status.color }]}>{status.label.toUpperCase()}</Text>
        </View>
      </View>
      
      <View style={styles.cardBody}>
        <View style={styles.infoCol}>
          <View style={styles.infoRow}>
            <Icon name="calendar-alt" size={12} color="#94a3b8" />
            <Text style={styles.infoText}>{formatDate(order.created_at)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Icon name="box" size={12} color="#94a3b8" />
            <Text style={styles.infoText}>{itemsCount} sản phẩm</Text>
          </View>
        </View>
        <View style={styles.priceContainer}>
          <Text style={styles.totalLabel}>Tổng tiền</Text>
          <Text style={styles.totalPrice}>{formatPrice(order.total_price || order.total || order.total_amount || order.grand_total || 0)}</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.viewDetailBtn} 
        onPress={() => onPress(order)}
      >
        <Text style={styles.viewDetailText}>XEM CHI TIẾT</Text>
        <Icon name="chevron-right" size={10} color="#0f172a" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const OrdersScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { showToast, showConfirm } = useNotification();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  const TABS = [
    { key: 'all', label: 'Tất cả' },
    { key: 'pending', label: 'Chờ xử lý' },
    { key: 'processing', label: 'Đang xử lý' },
    { key: 'shipping', label: 'Đang giao' },
    { key: 'completed', label: 'Đã giao' },
    { key: 'cancelled', label: 'Đã hủy' },
  ];

  useEffect(() => {
    fetchOrders();
    setCurrentPage(1); // Reset to page 1 on tab change
  }, [activeTab]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = activeTab !== 'all' ? { status: activeTab } : {};
      const response = await apiClient.get('/v1/orders', { params });
      if (response.data.success) {
        setOrders(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    showConfirm({
      title: 'Xác nhận thoát',
      message: 'Bạn có chắc chắn muốn đăng xuất tài khoản DDH Elite?',
      confirmText: 'Đăng xuất',
      type: 'logout',
      onConfirm: () => {
        logout();
        showToast('Đã đăng xuất thành công!', 'info');
      }
    });
  };

  const totalPages = Math.ceil(orders.length / ITEMS_PER_PAGE);
  const paginatedOrders = orders.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

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

      {/* 📋 MENU GRID */}
      <View style={styles.menuGrid}>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.replace('ProfileEdit')}>
          <Icon name="user-circle" size={16} color="#475569" />
          <Text style={styles.menuLabel}>Hồ sơ</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.replace('Wishlist')}>
          <Icon name="heart" size={16} color="#475569" />
          <Text style={styles.menuLabel}>Yêu thích</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.menuItem, styles.menuItemActive]}>
          <Icon name="shopping-bag" size={16} color="#fff" />
          <Text style={[styles.menuLabel, {color: '#fff'}]}>Đơn hàng</Text>
        </TouchableOpacity>
        {user?.email === 'admin@ddh.com' && (
          <TouchableOpacity style={styles.menuItem} onPress={() => Linking.openURL(`${IMAGE_BASE_URL}/admin`)}>
            <Icon name="user-shield" size={16} color="#3b82f6" />
            <Text style={[styles.menuLabel, {color: '#3b82f6'}]}>Quản trị</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
          <Icon name="sign-out-alt" size={16} color="#ef4444" />
          <Text style={[styles.menuLabel, {color: '#ef4444'}]}>Thoát</Text>
        </TouchableOpacity>
      </View>

      {/* 🏷️ TITLE WITH ORANGE BAR */}
      <View style={styles.titleRow}>
        <View style={styles.orangeBar} />
        <Text style={styles.titleText}>Đơn hàng đã mua ({orders.length})</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <View style={styles.fixedHeader}>
        <TouchableOpacity onPress={() => navigation.navigate('HomeTabs', { screen: 'Account' })} style={styles.backIconBtn}>
          <Icon name="arrow-left" size={20} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.fixedHeaderTitle}>Lịch sử mua hàng</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0f172a" />
        </View>
      ) : (
        <FlatList
          data={paginatedOrders}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderPagination}
          renderItem={({ item }) => (
            <OrderCard order={item} onPress={(o) => navigation.navigate('OrderDetail', { order: o })} />
          )}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="box-open" size={60} color="#e2e8f0" />
              <Text style={styles.emptyTitle}>Chưa có đơn hàng nào!</Text>
              <Text style={styles.emptySubtitle}>Hãy bắt đầu mua sắm để nhận được những ưu đãi Elite hấp dẫn nhất.</Text>
              <TouchableOpacity style={styles.shopBtn} onPress={() => navigation.navigate('HomeTabs')}>
                <Text style={styles.shopBtnText}>MUA SẮM NGAY</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
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
  avatarImg: { width: 70, height: 70, borderRadius: 35, borderWidth: 3, borderColor: '#fff' },
  avatarEditBtn: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#1e293b', width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  userName: { fontSize: 17, fontWeight: 'bold', color: '#1e293b' },
  userRole: { fontSize: 10, color: '#64748b', fontWeight: '600', marginTop: 2 },

  // Menu Grid
  menuGrid: { flexDirection: 'row', padding: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  menuItem: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12 },
  menuItemActive: { backgroundColor: '#0f172a' },
  menuLabel: { fontSize: 10, fontWeight: '700', color: '#64748b', marginTop: 6 },

  // Title with Orange Bar
  titleRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 25, marginTop: 25, marginBottom: 15 },
  orangeBar: { width: 6, height: 22, backgroundColor: '#f97316', borderRadius: 3, marginRight: 12 },
  titleText: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },

  // Tabs
  tabRow: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 20, gap: 8 },
  tab: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 50, backgroundColor: '#f1f5f9' },
  tabActive: { backgroundColor: '#0f172a' },
  tabText: { fontSize: 12, fontWeight: '700', color: '#64748b' },
  tabTextActive: { color: '#fff' },

  // Cards
  card: { backgroundColor: '#fff', marginHorizontal: 20, borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#f1f5f9', ...Shadow.tiny },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  orderBadge: { backgroundColor: '#f8fafc', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: '#f1f5f9' },
  orderId: { fontSize: 13, fontWeight: '900', color: '#0f172a' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 50 },
  statusText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  cardBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 },
  infoCol: { gap: 10 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  priceContainer: { alignItems: 'flex-end' },
  totalLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  totalPrice: { fontSize: 18, fontWeight: '900', color: '#0f172a' },
  viewDetailBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 8, 
    paddingVertical: 12, 
    backgroundColor: '#f8fafc', 
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  viewDetailText: { fontSize: 11, fontWeight: '800', color: '#0f172a', letterSpacing: 1 },

  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { paddingVertical: 60, alignItems: 'center', paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#64748b', marginTop: 15, marginBottom: 8 },
  emptySubtitle: { fontSize: 13, color: '#94a3b8', textAlign: 'center', marginBottom: 25, lineHeight: 20 },
  shopBtn: { backgroundColor: '#0f172a', paddingHorizontal: 30, paddingVertical: 14, borderRadius: 50 },
  shopBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },

  // Pagination Styles
  paginationRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 30, gap: 10 },
  pageBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  pageBtnDisabled: { opacity: 0.5 },
  pageNumber: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  pageNumberActive: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  pageText: { fontSize: 14, fontWeight: '700', color: '#64748b' },
  pageTextActive: { color: '#fff' },
});

export default OrdersScreen;
