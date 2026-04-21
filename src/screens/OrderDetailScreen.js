import * as React from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image,
  TouchableOpacity, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing } from '../styles/Theme';
import apiClient from '../api/apiClient';

const formatPrice = (price) => {
  return Math.round(price).toLocaleString('vi-VN') + ' VNĐ';
};

const STATUS_MAP = {
  pending: { label: 'Chờ xử lý', color: Colors.warning, bg: '#FEF3C7', icon: '⏳' },
  processing: { label: 'Đang xử lý', color: '#3B82F6', bg: '#DBEAFE', icon: '📋' },
  shipping: { label: 'Đang giao', color: '#8B5CF6', bg: '#EDE9FE', icon: '🚚' },
  delivered: { label: 'Đã giao', color: Colors.success, bg: Colors.successSoft, icon: '✅' },
  cancelled: { label: 'Đã hủy', color: Colors.danger, bg: Colors.dangerSoft, icon: '❌' },
};

const OrderDetailScreen = ({ route, navigation }) => {
  const { order } = route.params;
  const status = STATUS_MAP[order.status] || STATUS_MAP.pending;

  const handleCancelOrder = () => {
    Alert.alert('Xác nhận', 'Bạn có chắc chắn muốn hủy đơn hàng này?', [
      { text: 'Quay lại', style: 'cancel' },
      {
        text: 'Đúng, hủy đơn',
        style: 'destructive',
        onPress: async () => {
          try {
            const response = await apiClient.post(`/v1/orders/${order.id}/cancel`);
            if (response.data.success) {
              Alert.alert('Thành công', 'Đơn hàng đã được hủy.');
              navigation.goBack();
            }
          } catch (error) {
            Alert.alert('Lỗi', 'Không thể hủy đơn hàng vào lúc này.');
          }
        }
      }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đơn #{order.id}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Status */}
        <View style={[styles.statusCard, { borderLeftColor: status.color }]}>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Text style={{ fontSize: 20 }}>{status.icon}</Text>
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
          <Text style={styles.statusDate}>Đặt ngày: {order.created_at || 'Hôm nay'}</Text>
        </View>

        {/* Shipping Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Thông tin giao hàng</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Người nhận</Text>
            <Text style={styles.infoValue}>{order.name || order.user?.name || '---'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>SĐT</Text>
            <Text style={styles.infoValue}>{order.phone || '---'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Địa chỉ</Text>
            <Text style={styles.infoValue}>{order.address || '---'}</Text>
          </View>
          {order.note && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Ghi chú</Text>
              <Text style={styles.infoValue}>{order.note}</Text>
            </View>
          )}
        </View>

        {/* Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📦 Sản phẩm ({order.items?.length || 0})</Text>
          {(order.items || []).map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <Image source={{ uri: item.product?.image || item.image }} style={styles.itemImage} resizeMode="contain" />
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={2}>{item.product?.name || item.name || 'Sản phẩm'}</Text>
                <Text style={styles.itemQty}>x{item.quantity}</Text>
                {order.status === 'delivered' && (
                  <TouchableOpacity
                    style={styles.reviewBtn}
                    onPress={() => navigation.navigate('Review', { product: item.product || item })}
                  >
                    <Text style={styles.reviewBtnText}>⭐ Viết đánh giá</Text>
                  </TouchableOpacity>
                )}
              </View>
              <Text style={styles.itemPrice}>{formatPrice(item.price * item.quantity)}</Text>
            </View>
          ))}
        </View>

        {/* Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Tóm tắt</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tạm tính</Text>
            <Text style={styles.summaryValue}>{formatPrice(order.subtotal || order.total || 0)}</Text>
          </View>
          {order.discount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Giảm giá</Text>
              <Text style={[styles.summaryValue, { color: Colors.success }]}>-{formatPrice(order.discount)}</Text>
            </View>
          )}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Phí vận chuyển</Text>
            <Text style={styles.summaryValue}>{order.shipping_fee === 0 ? 'Miễn phí' : formatPrice(order.shipping_fee || 0)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Tổng cộng</Text>
            <Text style={styles.totalValue}>{formatPrice(order.total || 0)}</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionSection}>
          {order.status === 'pending' && (
            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelOrder}>
              <Text style={styles.cancelBtnText}>❌ Hủy đơn hàng</Text>
            </TouchableOpacity>
          )}
          {order.status === 'delivered' && (
            <TouchableOpacity style={styles.reorderBtn} onPress={() => navigation.navigate('HomeTabs')}>
              <Text style={styles.reorderBtnText}>🔄 Mua lại</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // ... existing styles ...
  actionSection: { padding: Spacing.m, gap: 12 },
  cancelBtn: { backgroundColor: Colors.dangerSoft, paddingVertical: 16, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: Colors.danger },
  cancelBtnText: { fontSize: 15, fontWeight: '800', color: Colors.danger },
  reorderBtn: { backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  reorderBtnText: { fontSize: 15, fontWeight: '800', color: Colors.white },

  reviewBtn: { marginTop: 8, backgroundColor: Colors.primarySoft, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, alignSelf: 'flex-start' },
  reviewBtnText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  container: { flex: 1, backgroundColor: Colors.light },
  scrollContent: { paddingBottom: 20 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.m, paddingVertical: Spacing.s, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.input, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  backIcon: { fontSize: 22, fontWeight: '700', color: Colors.dark },
  headerTitle: { fontSize: 20, fontWeight: '900', color: Colors.dark },

  statusCard: { backgroundColor: Colors.white, marginTop: Spacing.m, marginHorizontal: Spacing.m, borderRadius: 20, padding: Spacing.l, borderLeftWidth: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 50, alignSelf: 'flex-start', gap: 8, marginBottom: 8 },
  statusText: { fontSize: 15, fontWeight: '800' },
  statusDate: { fontSize: 13, color: Colors.muted, fontWeight: '600' },

  section: { backgroundColor: Colors.white, marginTop: Spacing.m, marginHorizontal: Spacing.m, borderRadius: 20, padding: Spacing.l },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.dark, marginBottom: 14 },

  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  infoLabel: { fontSize: 13, color: Colors.muted, fontWeight: '600' },
  infoValue: { fontSize: 13, fontWeight: '700', color: Colors.dark, maxWidth: '60%', textAlign: 'right' },

  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  itemImage: { width: 56, height: 56, borderRadius: 12, backgroundColor: Colors.light, marginRight: 12 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '700', color: Colors.dark, marginBottom: 4 },
  itemQty: { fontSize: 12, color: Colors.muted, fontWeight: '600' },
  itemPrice: { fontSize: 15, fontWeight: '900', color: Colors.danger },

  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  summaryLabel: { fontSize: 14, color: Colors.muted, fontWeight: '600' },
  summaryValue: { fontSize: 14, fontWeight: '700', color: Colors.dark },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 10 },
  totalLabel: { fontSize: 17, fontWeight: '900', color: Colors.dark },
  totalValue: { fontSize: 20, fontWeight: '900', color: Colors.danger },
});

export default OrderDetailScreen;
