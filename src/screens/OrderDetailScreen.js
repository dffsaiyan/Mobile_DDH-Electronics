import * as React from 'react';
const { useState, useEffect } = React;
import {
  View, Text, StyleSheet, ScrollView, Image,
  TouchableOpacity, StatusBar, Alert, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Shadow } from '../styles/Theme';
import { useNotification } from '../context/NotificationContext';
import apiClient, { IMAGE_BASE_URL } from '../api/apiClient';
import { FontAwesome5 as Icon } from '@expo/vector-icons';

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
  completed: { label: 'Đã giao', color: '#10b981', bg: '#f0fdf4', icon: 'check-circle' },
  delivered: { label: 'Đã giao', color: '#10b981', bg: '#f0fdf4', icon: 'check-circle' },
  cancelled: { label: 'Đã hủy', color: '#ef4444', bg: '#fef2f2', icon: 'times-circle' },
};

const OrderDetailScreen = ({ route, navigation }) => {
  const { order: initialOrder } = route.params;
  const [order, setOrder] = useState(initialOrder);
  const [loading, setLoading] = useState(true);
  const { showToast } = useNotification();

  useEffect(() => {
    fetchOrderDetail();
  }, []);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/v1/orders/${initialOrder.id}`);
      if (response.data.success) {
        setOrder(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching order detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = () => {
    Alert.alert('Xác nhận hủy đơn', 'Bạn có chắc chắn muốn hủy đơn hàng này? Thao tác này không thể hoàn tác.', [
      { text: 'Quay lại', style: 'cancel' },
      {
        text: 'Đúng, hủy đơn',
        style: 'destructive',
        onPress: async () => {
          try {
            const response = await apiClient.post(`/v1/orders/${order.id}/cancel`);
            if (response.data.success) {
              showToast('Đơn hàng đã được hủy thành công.', 'info');
              navigation.goBack();
            }
          } catch (error) {
            showToast('Không thể hủy đơn hàng vào lúc này.', 'error');
          }
        }
      }
    ]);
  };

  const status = STATUS_MAP[order.status] || STATUS_MAP.pending;

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0f172a" />
        <Text style={styles.loadingText}>Đang đồng bộ dữ liệu...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="chevron-left" size={18} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết đơn hàng</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Elite Ticket Header */}
        <View style={styles.ticketHeader}>
          <View style={[styles.statusBanner, { backgroundColor: status.color }]}>
            <Icon name={status.icon} size={20} color="#fff" />
            <Text style={styles.statusLabelText}>{status.label.toUpperCase()}</Text>
          </View>
          
          <View style={styles.ticketBody}>
            <View style={styles.orderMeta}>
              <View>
                <Text style={styles.metaLabel}>Mã đơn hàng</Text>
                <Text style={styles.metaValue}>#{order.id}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.metaLabel}>Ngày đặt</Text>
                <Text style={styles.metaValue}>{formatDate(order.created_at)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Shipping & Customer Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="user-alt" size={14} color="#0f172a" />
            <Text style={styles.sectionTitle}>Thông tin nhận hàng</Text>
          </View>
          <View style={styles.shippingCard}>
            <Text style={styles.receiverName}>{order.name || order.user?.name || 'Admin DDH'}</Text>
            <View style={styles.detailRow}>
              <Icon name="phone-alt" size={12} color="#64748b" />
              <Text style={styles.detailText}>{order.phone || 'Chưa cập nhật SĐT'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Icon name="envelope" size={12} color="#64748b" />
              <Text style={styles.detailText}>{order.email || order.user?.email || 'Chưa có email'}</Text>
            </View>
            <View style={[styles.detailRow, { alignItems: 'flex-start', marginTop: 8 }]}>
              <Icon name="map-marker-alt" size={12} color="#64748b" style={{ marginTop: 4 }} />
              <Text style={styles.detailText}>{order.shipping_address || order.address || 'Chưa cập nhật địa chỉ'}</Text>
            </View>
            {(order.notes || order.note) && (
              <View style={styles.noteBox}>
                <Text style={styles.noteLabel}>Ghi chú:</Text>
                <Text style={styles.noteText}>{order.notes || order.note}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Payment Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="credit-card" size={14} color="#0f172a" />
            <Text style={styles.sectionTitle}>Thanh toán</Text>
          </View>
          <View style={styles.paymentCard}>
            <View style={styles.billingRow}>
              <Text style={styles.billingLabel}>Phương thức</Text>
              <Text style={styles.billingValue}>
                {order.payment_method === 'cod' ? 'Thanh toán khi nhận hàng (COD)' : 
                 (order.payment_method === 'vnpay' ? 'VNPay' : 
                 (order.payment_method === 'momo' ? 'MoMo' : (order.payment_method || 'Chuyển khoản')))}
              </Text>
            </View>
            <View style={styles.billingRow}>
              <Text style={styles.billingLabel}>Trạng thái</Text>
              <View style={[styles.miniStatus, { backgroundColor: (order.payment_status === 'paid' || order.payment_status === 'Thanh toán thành công') ? '#f0fdf4' : '#fff7ed' }]}>
                <Text style={[styles.miniStatusText, { color: (order.payment_status === 'paid' || order.payment_status === 'Thanh toán thành công') ? '#15803d' : '#c2410c' }]}>
                   {(order.payment_status === 'paid' || order.payment_status === 'Thanh toán thành công') ? 'ĐÃ THANH TOÁN' : 'CHỜ THANH TOÁN'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Products Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="box-open" size={14} color="#0f172a" />
            <Text style={styles.sectionTitle}>Sản phẩm ({order.items?.length || 0})</Text>
          </View>
          <View style={styles.itemsList}>
            {(order.items || []).map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <Image 
                  source={{ uri: item.product?.image ? (item.product.image.startsWith('http') ? item.product.image : `${IMAGE_BASE_URL}/${item.product.image}`) : (item.image ? (item.image.startsWith('http') ? item.image : `${IMAGE_BASE_URL}/${item.image}`) : 'https://via.placeholder.com/150') }} 
                  style={styles.itemImage} 
                  resizeMode="contain" 
                />
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={2}>{item.product?.name || item.name}</Text>
                  <Text style={styles.itemVariant}>Số lượng: {item.quantity}</Text>
                  <View style={styles.itemPriceRow}>
                    <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Billing Summary */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="file-invoice-dollar" size={14} color="#0f172a" />
            <Text style={styles.sectionTitle}>Tóm tắt đơn hàng</Text>
          </View>
          <View style={styles.billingCard}>
            <View style={styles.billingRow}>
              <Text style={styles.billingLabel}>Tổng tiền hàng</Text>
              <Text style={styles.billingValue}>{formatPrice(order.subtotal || order.total || 0)}</Text>
            </View>
            <View style={styles.billingRow}>
              <Text style={styles.billingLabel}>Phí vận chuyển</Text>
              <Text style={styles.billingValue}>{order.shipping_fee === 0 ? 'Miễn phí' : formatPrice(order.shipping_fee || 0)}</Text>
            </View>
            {(order.discount_amount > 0 || order.discount > 0) && (
              <View style={styles.billingRow}>
                <Text style={styles.billingLabel}>Giảm giá Voucher</Text>
                <Text style={[styles.billingValue, { color: '#10b981' }]}>-{formatPrice(order.discount_amount || order.discount)}</Text>
              </View>
            )}
            <View style={styles.billingDivider} />
            <View style={styles.billingRow}>
              <Text style={styles.totalLabel}>Tổng thanh toán</Text>
              <Text style={styles.totalPriceValue}>{formatPrice(order.total_price || order.total || order.total_amount || 0)}</Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionContainer}>
          {order.status === 'pending' && (
            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelOrder} activeOpacity={0.7}>
              <Icon name="times-circle" size={14} color="#ef4444" style={{ marginRight: 8 }} />
              <Text style={styles.cancelBtnText}>HỦY ĐƠN HÀNG NÀY</Text>
            </TouchableOpacity>
          )}
          {['completed', 'delivered'].includes(order.status) && (
            <TouchableOpacity style={styles.reorderBtn} onPress={() => navigation.navigate('HomeTabs')} activeOpacity={0.7}>
              <Icon name="shopping-bag" size={14} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.reorderBtnText}>TIẾP TỤC MUA SẮM</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loadingContainer: { flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 15, fontSize: 13, color: '#64748b', fontWeight: '600' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#fff' },
  backBtn: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#0f172a' },
  scrollContent: { paddingBottom: 40 },

  // Ticket Style
  ticketHeader: { marginHorizontal: 20, marginTop: 10, backgroundColor: '#fff', borderRadius: 24, overflow: 'hidden', ...Shadow.tiny, borderWidth: 1, borderColor: '#f1f5f9' },
  statusBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 15 },
  statusLabelText: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  ticketBody: { padding: 20 },
  orderMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  metaValue: { fontSize: 15, fontWeight: '900', color: '#0f172a' },

  // Sections
  section: { marginTop: 25, paddingHorizontal: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15 },
  sectionTitle: { fontSize: 15, fontWeight: '900', color: '#0f172a', letterSpacing: 0.5 },
  
  shippingCard: { backgroundColor: '#f8fafc', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#f1f5f9' },
  receiverName: { fontSize: 16, fontWeight: '900', color: '#0f172a', marginBottom: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  detailText: { fontSize: 14, color: '#64748b', fontWeight: '600', flex: 1 },
  noteBox: { marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  noteLabel: { fontSize: 12, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  noteText: { fontSize: 13, color: '#64748b', fontStyle: 'italic' },

  // Payment
  paymentCard: { backgroundColor: '#fff', padding: 18, borderRadius: 20, borderWidth: 1, borderColor: '#f1f5f9' },
  miniStatus: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  miniStatusText: { fontSize: 10, fontWeight: '900' },

  // Items
  itemsList: { gap: 15 },
  itemRow: { flexDirection: 'row', gap: 15, backgroundColor: '#fff', padding: 10, borderRadius: 18, borderWidth: 1, borderColor: '#f1f5f9' },
  itemImage: { width: 70, height: 70, borderRadius: 12, backgroundColor: '#f8fafc' },
  itemInfo: { flex: 1, justifyContent: 'center' },
  itemName: { fontSize: 14, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  itemVariant: { fontSize: 12, color: '#64748b', fontWeight: '600', marginBottom: 8 },
  itemPriceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemQty: { fontSize: 13, fontWeight: '800', color: '#64748b' },
  itemPrice: { fontSize: 15, fontWeight: '900', color: '#0f172a' },

  // Billing
  billingCard: { backgroundColor: '#f8fafc', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#f1f5f9' },
  billingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  billingLabel: { fontSize: 14, color: '#64748b', fontWeight: '600' },
  billingValue: { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  billingDivider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 15, borderStyle: 'dashed' },
  totalLabel: { fontSize: 16, fontWeight: '900', color: '#0f172a' },
  totalPriceValue: { fontSize: 20, fontWeight: '900', color: '#0f172a' },

  // Actions
  actionContainer: { paddingHorizontal: 20, marginTop: 30 },
  cancelBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: 18, borderWidth: 1, borderColor: '#ef4444', backgroundColor: '#fff' },
  cancelBtnText: { color: '#ef4444', fontWeight: '900', fontSize: 13, letterSpacing: 1 },
  reorderBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: 18, backgroundColor: '#0f172a', ...Shadow.small },
  reorderBtnText: { color: '#fff', fontWeight: '900', fontSize: 13, letterSpacing: 1 },
});

export default OrderDetailScreen;
