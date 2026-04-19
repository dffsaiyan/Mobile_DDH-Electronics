import * as React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing } from '../styles/Theme';

const OrderSuccessScreen = ({ navigation, route }) => {
  const order = route.params?.order;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Text style={styles.icon}>✅</Text>
        </View>
        <Text style={styles.title}>Đặt hàng thành công!</Text>
        <Text style={styles.subtitle}>Cảm ơn bạn đã mua sắm tại DDH Store</Text>

        {order && (
          <View style={styles.orderInfo}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Mã đơn hàng</Text>
              <Text style={styles.infoValue}>#{order.id || '---'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tổng tiền</Text>
              <Text style={styles.infoPrice}>{(order.total || 0).toLocaleString('vi-VN')}đ</Text>
            </View>
          </View>
        )}

        <Text style={styles.note}>
          Đơn hàng của bạn đang được xử lý. Chúng tôi sẽ thông báo khi đơn hàng được giao đi.
        </Text>

        <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('Orders')} activeOpacity={0.8}>
          <Text style={styles.primaryBtnText}>📦 Xem đơn hàng</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('HomeTabs')} activeOpacity={0.8}>
          <Text style={styles.secondaryBtnText}>🏠 Về trang chủ</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.xl },

  iconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: Colors.successSoft, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  icon: { fontSize: 50 },
  title: { fontSize: 26, fontWeight: '900', color: Colors.dark, marginBottom: 8 },
  subtitle: { fontSize: 15, color: Colors.muted, fontWeight: '500', marginBottom: 24 },

  orderInfo: { backgroundColor: Colors.input, borderRadius: 20, padding: Spacing.l, width: '100%', marginBottom: 20 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  infoLabel: { fontSize: 14, color: Colors.muted, fontWeight: '600' },
  infoValue: { fontSize: 14, fontWeight: '800', color: Colors.primary },
  infoPrice: { fontSize: 16, fontWeight: '900', color: Colors.danger },

  note: { fontSize: 14, color: Colors.muted, textAlign: 'center', lineHeight: 22, marginBottom: 30 },

  primaryBtn: { backgroundColor: Colors.primary, width: '100%', height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 12, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
  primaryBtnText: { fontSize: 16, fontWeight: '800', color: Colors.white },

  secondaryBtn: { backgroundColor: Colors.input, width: '100%', height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  secondaryBtnText: { fontSize: 16, fontWeight: '800', color: Colors.dark },
});

export default OrderSuccessScreen;
