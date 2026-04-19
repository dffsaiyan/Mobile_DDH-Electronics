import * as React from 'react';
const { useState, useEffect } = React;
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  StatusBar, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing } from '../styles/Theme';
import apiClient from '../api/apiClient';

const STATUS_MAP = {
  pending: { label: 'Chờ xử lý', color: Colors.warning, bg: '#FEF3C7', icon: '⏳' },
  processing: { label: 'Đang xử lý', color: '#3B82F6', bg: '#DBEAFE', icon: '📋' },
  shipping: { label: 'Đang giao', color: '#8B5CF6', bg: '#EDE9FE', icon: '🚚' },
  delivered: { label: 'Đã giao', color: Colors.success, bg: Colors.successSoft, icon: '✅' },
  cancelled: { label: 'Đã hủy', color: Colors.danger, bg: Colors.dangerSoft, icon: '❌' },
};

const OrderCard = ({ order, onPress }) => {
  const status = STATUS_MAP[order.status] || STATUS_MAP.pending;
  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(order)} activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        <Text style={styles.orderId}>Đơn #{order.id}</Text>
        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
          <Text style={{ fontSize: 12 }}>{status.icon}</Text>
          <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.orderDate}>📅 {order.created_at || 'Hôm nay'}</Text>
        <Text style={styles.itemCount}>{order.items_count || order.items?.length || 0} sản phẩm</Text>
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.totalLabel}>Tổng cộng</Text>
        <Text style={styles.totalPrice}>{(order.total || 0).toLocaleString('vi-VN')}đ</Text>
      </View>
    </TouchableOpacity>
  );
};

const OrdersScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  const TABS = [
    { key: 'all', label: 'Tất cả' },
    { key: 'pending', label: 'Chờ xử lý' },
    { key: 'shipping', label: 'Đang giao' },
    { key: 'delivered', label: 'Đã giao' },
  ];

  useEffect(() => {
    fetchOrders();
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đơn hàng của tôi</Text>
        <View style={{ width: 44 }} />
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

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyIcon}>📦</Text>
          <Text style={styles.emptyTitle}>Chưa có đơn hàng</Text>
          <Text style={styles.emptySubtitle}>Hãy mua sắm để có đơn hàng đầu tiên!</Text>
          <TouchableOpacity style={styles.shopBtn} onPress={() => navigation.navigate('HomeTabs')}>
            <Text style={styles.shopBtnText}>🛍️ Mua sắm ngay</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={({ item }) => (
            <OrderCard order={item} onPress={(o) => navigation.navigate('OrderDetail', { order: o })} />
          )}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.m, paddingVertical: Spacing.s, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.input, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  backIcon: { fontSize: 22, fontWeight: '700', color: Colors.dark },
  headerTitle: { fontSize: 20, fontWeight: '900', color: Colors.dark },

  tabRow: { flexDirection: 'row', backgroundColor: Colors.white, paddingHorizontal: Spacing.m, paddingVertical: Spacing.s, gap: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 50, backgroundColor: Colors.input },
  tabActive: { backgroundColor: Colors.primarySoft },
  tabText: { fontSize: 13, fontWeight: '700', color: Colors.muted },
  tabTextActive: { color: Colors.primary },

  listContent: { padding: Spacing.m },
  card: { backgroundColor: Colors.white, borderRadius: 20, padding: Spacing.l, marginBottom: Spacing.m, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  orderId: { fontSize: 16, fontWeight: '900', color: Colors.dark },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, gap: 4 },
  statusText: { fontSize: 12, fontWeight: '700' },
  cardBody: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  orderDate: { fontSize: 13, color: Colors.muted, fontWeight: '600' },
  itemCount: { fontSize: 13, fontWeight: '700', color: Colors.dark },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 12 },
  totalLabel: { fontSize: 14, color: Colors.muted, fontWeight: '600' },
  totalPrice: { fontSize: 18, fontWeight: '900', color: Colors.danger },

  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.xl },
  emptyIcon: { fontSize: 60, marginBottom: Spacing.m },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: Colors.dark, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: Colors.muted, marginBottom: 20 },
  shopBtn: { backgroundColor: Colors.primary, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 50 },
  shopBtnText: { fontSize: 15, fontWeight: '800', color: Colors.white },
});

export default OrdersScreen;
