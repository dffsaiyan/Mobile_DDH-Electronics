import * as React from 'react';
import {
  View, Text, StyleSheet, FlatList, Image,
  TouchableOpacity, StatusBar, Dimensions, Alert, ScrollView, TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing } from '../styles/Theme';
import { useCart } from '../context/CartContext';
import { useNotification } from '../context/NotificationContext';
import { IMAGE_BASE_URL } from '../api/apiClient';
import { FontAwesome5 as Icon } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// 🛠️ HELPERS
const getImageUrl = (path) => {
  if (!path) return 'https://via.placeholder.com/300';
  if (path.startsWith('http')) {
    return path.replace('127.0.0.1', IMAGE_BASE_URL.replace('http://', '').split(':')[0]);
  }
  
  const baseUrl = IMAGE_BASE_URL;
  let cleanPath = path.replace('public/', '');
  
  if (cleanPath.startsWith('images/')) {
    return `${baseUrl}/${cleanPath}`;
  }
  
  if (cleanPath.startsWith('storage/')) {
    return `${baseUrl}/${cleanPath}`;
  }
  
  return `${baseUrl}/storage/${cleanPath}`;
};

const formatPrice = (price) => {
  return Math.round(price).toLocaleString('vi-VN') + ' VNĐ';
};

const Stepper = ({ currentStep }) => (
  <View style={styles.stepperContainer}>
    <View style={styles.stepLine} />
    <View style={styles.stepsRow}>
      {[
        { id: 1, label: 'Giỏ hàng' },
        { id: 2, label: 'Thông tin' },
        { id: 3, label: 'Thanh toán' }
      ].map((step) => (
        <View key={step.id} style={styles.stepItem}>
          <View style={[styles.stepIcon, currentStep >= step.id && styles.stepIconActive]}>
            {currentStep > step.id ? (
              <Icon name="check" size={12} color={Colors.secondary} />
            ) : (
              <Text style={[styles.stepIconText, currentStep === step.id && styles.stepIconTextActive]}>{step.id}</Text>
            )}
          </View>
          <Text style={[styles.stepLabel, currentStep >= step.id && styles.stepLabelActive]}>{step.label}</Text>
        </View>
      ))}
    </View>
  </View>
);

const CartItem = ({ item, onIncrease, onDecrease, onRemove }) => (
  <View style={styles.cartCard}>
    <View style={styles.imageBox}>
      <Image source={{ uri: getImageUrl(item.image) }} style={styles.cartImage} resizeMode="contain" />
      <View style={styles.eliteBadge}>
        <Text style={styles.eliteBadgeText}>ELITE</Text>
      </View>
    </View>
    
    <View style={styles.cartInfo}>
      <View style={styles.nameRow}>
        <Text style={styles.cartName} numberOfLines={2}>{item.name}</Text>
        <TouchableOpacity onPress={() => onRemove(item.id)} style={styles.removeBtn}>
          <Icon name="trash-alt" size={13} color="#ef4444" />
        </TouchableOpacity>
      </View>
      
      <Text style={styles.brandText}>Sản phẩm chính hãng</Text>
      
      <View style={styles.priceRow}>
        <Text style={styles.cartPrice}>{formatPrice(item.price)}</Text>
        <View style={styles.qtyControl}>
          <TouchableOpacity style={styles.qtyBtn} onPress={() => onDecrease(item.id)}>
            <Icon name="minus" size={10} color={Colors.dark} />
          </TouchableOpacity>
          <Text style={styles.qtyValue}>{item.quantity}</Text>
          <TouchableOpacity style={styles.qtyBtn} onPress={() => onIncrease(item.id)}>
            <Icon name="plus" size={10} color={Colors.dark} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </View>
);

const CartScreen = ({ navigation }) => {
  const { cartItems, totalItems, totalPrice, increaseQuantity, decreaseQuantity, removeFromCart, clearCart } = useCart();
  const { showToast } = useNotification();

  const handleClearCart = () => {
    Alert.alert(
      'Xác nhận',
      'Bạn có chắc chắn muốn làm trống giỏ hàng?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Làm trống', 
          style: 'destructive', 
          onPress: () => {
            clearCart();
            showToast('Giỏ hàng đã được làm trống!', 'info');
          } 
        }
      ]
    );
  };

  if (cartItems.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <View style={styles.emptyIconBg}>
              <Icon name="shopping-basket" size={50} color={Colors.secondary} opacity={0.2} />
            </View>
            <View style={styles.emptySearchIcon}>
              <Icon name="search" size={14} color={Colors.white} />
            </View>
          </View>
          <Text style={styles.emptyTitle}>GIỎ HÀNG ĐANG TRỐNG!</Text>
          <Text style={styles.emptySubtitle}>
            Có vẻ như bạn chưa chọn được "vũ khí" nào cho trạm chiến đấu của mình. Hãy lấp đầy nó bằng những siêu phẩm công nghệ!
          </Text>
          <TouchableOpacity 
            style={styles.shopBtn} 
            activeOpacity={0.8}
            onPress={() => navigation.navigate('ProductList')}
          >
            <View style={styles.shopBtnContent}>
              <Text style={styles.shopBtnText}>KHÁM PHÁ CỬA HÀNG</Text>
              <View style={styles.shopBtnIcon}>
                <Icon name="arrow-right" size={12} color={Colors.white} />
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* 1. PROGRESS STEPPER */}
      <Stepper currentStep={1} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* 2. HEADER SECTION */}
        <View style={styles.headerSection}>
          <TouchableOpacity 
            style={styles.backLink}
            onPress={() => navigation.navigate('HomeTabs')}
          >
            <Icon name="chevron-left" size={10} color={Colors.muted} />
            <Text style={styles.backText}>Tiếp tục mua sắm</Text>
          </TouchableOpacity>
          
          <View style={styles.titleRow}>
            <View style={styles.accentBar} />
            <Text style={styles.mainTitle}>Giỏ hàng của bạn</Text>
          </View>

          <View style={styles.actionHeader}>
            <View style={styles.countBadge}>
              <Icon name="shopping-basket" size={12} color={Colors.secondary} />
              <Text style={styles.countText}>{totalItems} siêu phẩm</Text>
            </View>
            <TouchableOpacity onPress={handleClearCart} style={styles.clearBtnHeader}>
              <Icon name="trash-alt" size={12} color="#ef4444" />
              <Text style={styles.clearTextHeader}>Làm trống</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 3. CART ITEMS */}
        <View style={styles.itemsSection}>
          {cartItems.map(item => (
            <CartItem 
              key={item.id} 
              item={item} 
              onIncrease={increaseQuantity} 
              onDecrease={decreaseQuantity} 
              onRemove={(id) => {
                removeFromCart(id);
                showToast('Đã xóa sản phẩm khỏi giỏ hàng', 'info');
              }} 
            />
          ))}
        </View>

        {/* 4. COUPON SECTION */}
        <View style={styles.couponSection}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.iconCircle}><Icon name="ticket-alt" size={14} color={Colors.secondary} /></View>
            <Text style={styles.sectionTitle}>Mã ưu đãi</Text>
          </View>
          <Text style={styles.couponLabel}>Nhập mã giảm giá của bạn</Text>
          <View style={styles.couponInputRow}>
            <TextInput 
              style={styles.couponInput} 
              placeholder="Nhập mã ưu đãi"
              placeholderTextColor="#94a3b8"
            />
            <TouchableOpacity style={styles.applyBtn}>
              <Text style={styles.applyBtnText}>Áp dụng</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 5. SUMMARY BOX */}
        <View style={styles.summarySection}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.iconCircle}><Icon name="receipt" size={14} color={Colors.secondary} /></View>
            <Text style={styles.sectionTitle}>Chi tiết thanh toán</Text>
          </View>
          
          <View style={styles.summaryContent}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tổng giá trị hàng:</Text>
              <Text style={styles.summaryValue}>{formatPrice(totalPrice)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Phí vận chuyển:</Text>
              <Text style={[styles.summaryValue, {color: '#059669'}]}>Miễn phí</Text>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.totalBlock}>
              <Text style={styles.grandTotalLabel}>Số tiền cần thanh toán:</Text>
              <Text style={styles.grandTotalValue}>{formatPrice(totalPrice)}</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.mainCheckoutBtn}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Checkout')}
            >
              <Text style={styles.mainCheckoutText}>Tiến hành thanh toán</Text>
              <Icon name="chevron-right" size={12} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContent: { paddingBottom: 20 },

  // Stepper
  stepperContainer: { backgroundColor: '#f8fafc', paddingVertical: 20, paddingHorizontal: 40 },
  stepLine: { position: 'absolute', top: 42, left: 60, right: 60, height: 2, backgroundColor: '#e2e8f0' },
  stepsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stepItem: { alignItems: 'center', flex: 1 },
  stepIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.white, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#e2e8f0', zIndex: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  stepIconActive: { backgroundColor: Colors.dark, borderColor: Colors.dark },
  stepIconText: { fontSize: 14, fontWeight: '700', color: '#94a3b8' },
  stepIconTextActive: { color: Colors.secondary },
  stepLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', color: '#94a3b8', marginTop: 10, letterSpacing: 0.5 },
  stepLabelActive: { color: Colors.dark },

  // Header
  headerSection: { paddingHorizontal: Spacing.l, marginBottom: 25 },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 15 },
  backText: { fontSize: 11, fontWeight: '800', color: Colors.muted, textTransform: 'uppercase', letterSpacing: 0.8 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 15 },
  accentBar: { width: 5, height: 24, backgroundColor: Colors.secondary, borderRadius: 10 },
  mainTitle: { fontSize: 22, fontWeight: '900', color: Colors.dark, letterSpacing: -0.5 },
  actionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f1f5f9', paddingHorizontal: 15, paddingVertical: 12, borderRadius: 14 },
  countBadge: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  countText: { fontSize: 12, fontWeight: '800', color: Colors.dark, textTransform: 'uppercase' },
  clearBtnHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  clearTextHeader: { fontSize: 11, fontWeight: '800', color: '#ef4444', textTransform: 'uppercase' },

  // Cart Items
  itemsSection: { paddingHorizontal: Spacing.l, marginBottom: 25 },
  cartCard: { flexDirection: 'row', backgroundColor: Colors.white, borderRadius: 24, padding: 15, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.04, shadowRadius: 20, elevation: 4, borderWidth: 1, borderColor: '#f1f5f9' },
  imageBox: { position: 'relative' },
  cartImage: { width: 85, height: 85, borderRadius: 15, backgroundColor: '#f8fafc' },
  eliteBadge: { position: 'absolute', top: -5, left: -5, backgroundColor: Colors.dark, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  eliteBadgeText: { fontSize: 8, fontWeight: '900', color: Colors.white },
  cartInfo: { flex: 1, marginLeft: 15 },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cartName: { fontSize: 14, fontWeight: '700', color: Colors.dark, flex: 1, marginRight: 10, lineHeight: 20 },
  removeBtn: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#fef2f2', justifyContent: 'center', alignItems: 'center' },
  brandText: { fontSize: 10, fontWeight: '700', color: Colors.muted, textTransform: 'uppercase', marginTop: 4, opacity: 0.7 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  cartPrice: { fontSize: 15, fontWeight: '900', color: Colors.secondary },
  qtyControl: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 50, padding: 3 },
  qtyBtn: { width: 26, height: 26, borderRadius: 13, backgroundColor: Colors.white, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 1 },
  qtyValue: { fontSize: 14, fontWeight: '900', color: Colors.dark, minWidth: 35, textAlign: 'center' },

  // Coupon
  couponSection: { marginHorizontal: Spacing.l, padding: 20, backgroundColor: Colors.white, borderRadius: 24, borderWidth: 1, borderColor: '#f1f5f9', marginBottom: 20 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15 },
  iconCircle: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 15, fontWeight: '900', color: Colors.dark, textTransform: 'uppercase' },
  couponLabel: { fontSize: 11, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: 10, letterSpacing: 0.5 },
  couponInputRow: { flexDirection: 'row', gap: 10 },
  couponInput: { flex: 1, height: 50, backgroundColor: '#f8fafc', borderRadius: 12, paddingHorizontal: 15, fontSize: 13, fontWeight: '600', color: Colors.dark, borderWidth: 1, borderColor: '#e2e8f0' },
  applyBtn: { backgroundColor: Colors.dark, paddingHorizontal: 20, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  applyBtnText: { fontSize: 12, fontWeight: '800', color: Colors.white, textTransform: 'uppercase' },

  // Summary
  summarySection: { marginHorizontal: Spacing.l, padding: 20, backgroundColor: Colors.white, borderRadius: 24, borderWidth: 1, borderColor: '#f1f5f9' },
  summaryContent: { paddingHorizontal: 5 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryLabel: { fontSize: 12, fontWeight: '700', color: Colors.muted, textTransform: 'uppercase' },
  summaryValue: { fontSize: 14, fontWeight: '800', color: Colors.dark },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 20, borderStyle: 'dashed', borderRadius: 1 },
  totalBlock: { alignItems: 'center', marginBottom: 25 },
  grandTotalLabel: { fontSize: 11, fontWeight: '800', color: Colors.muted, textTransform: 'uppercase', marginBottom: 8 },
  grandTotalValue: { fontSize: 28, fontWeight: '900', color: Colors.secondary, letterSpacing: -1 },
  mainCheckoutBtn: { backgroundColor: Colors.dark, height: 60, borderRadius: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, shadowColor: Colors.dark, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 10 },
  mainCheckoutText: { fontSize: 15, fontWeight: '900', color: Colors.white, textTransform: 'uppercase', letterSpacing: 0.5 },

  // Empty State
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, backgroundColor: '#f8fafc' },
  emptyIconCircle: { width: 140, height: 140, marginBottom: 30, justifyContent: 'center', alignItems: 'center' },
  emptyIconBg: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 5 },
  emptySearchIcon: { position: 'absolute', bottom: 15, right: 15, backgroundColor: Colors.secondary, width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: '#f8fafc', elevation: 6 },
  emptyTitle: { fontSize: 22, fontWeight: '900', color: Colors.dark, marginBottom: 15, letterSpacing: -0.5 },
  emptySubtitle: { fontSize: 14, color: Colors.muted, textAlign: 'center', lineHeight: 22, marginBottom: 40, paddingHorizontal: 10 },
  shopBtn: { backgroundColor: Colors.primary, borderRadius: 50, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10, overflow: 'hidden' },
  shopBtnContent: { flexDirection: 'row', alignItems: 'center', paddingLeft: 30, paddingRight: 10, paddingVertical: 10 },
  shopBtnText: { fontSize: 13, fontWeight: '900', color: Colors.white, letterSpacing: 1, marginRight: 15 },
  shopBtnIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
});

export default CartScreen;
