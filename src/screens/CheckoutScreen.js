import * as React from 'react';
const { useState, useEffect } = React;
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, StatusBar, Alert, ActivityIndicator, Image, Modal, FlatList, Linking
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { FontAwesome5 as Icon } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing } from '../styles/Theme';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import apiClient, { IMAGE_BASE_URL } from '../api/apiClient';

import { useNotification } from '../context/NotificationContext';

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

const CheckoutScreen = ({ navigation }) => {
  const { cartItems, totalPrice, clearCart } = useCart();
  const { user, updateProfile } = useAuth();
  const { showToast } = useNotification();
  
  // 🔄 REFRESH PROFILE FROM SERVER WHEN ENTERING CHECKOUT
  useFocusEffect(
    React.useCallback(() => {
      const refreshProfile = async () => {
        try {
          const response = await apiClient.get('/v1/profile');
          if (response.data.success) {
            // Update auth context manually if needed, or just use local state for this screen
            const u = response.data.user;
            setName(u.name || '');
            setPhone(u.phone || '');
            setEmail(u.email || '');
            setAddress(u.address || '');
            
            // Trigger location pre-fill if we have codes
            if (u.province_id && provinces.length > 0) {
              preFillLocation(u, provinces);
            }
          }
        } catch (e) {
          console.error('Refresh profile in checkout error:', e);
        }
      };
      refreshProfile();
    }, [provinces])
  );
  
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [address, setAddress] = useState(user?.address || '');
  const [note, setNote] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [loading, setLoading] = useState(false);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('province');

  useEffect(() => {
    fetch('https://provinces.open-api.vn/api/v2/p/')
      .then(res => res.json())
      .then(data => setProvinces(data))
      .catch(err => console.error('Error fetching provinces:', err));
  }, []);

  const preFillLocation = async (userData, provinceList) => {
    if (!userData || !provinceList || provinceList.length === 0) return;
    
    let pCode = userData.province_id;
    let dVal = userData.district_id;

    // 🔍 FALLBACK: If IDs are missing, try to parse from the address string
    if (!pCode && userData.address) {
      const parts = userData.address.split(', ');
      if (parts.length >= 3) {
        const pName = parts[parts.length - 1].trim();
        const dName = parts[parts.length - 2].trim();
        const foundP = provinceList.find(p => p.name.includes(pName) || pName.includes(p.name));
        if (foundP) {
          pCode = foundP.code;
          dVal = dName;
        }
      }
    }

    if (!pCode) return;

    const foundProvince = provinceList.find(p => p.code == pCode || p.name == pCode);
    if (foundProvince) {
      setProvince(foundProvince.name);
      try {
        const dRes = await fetch(`https://provinces.open-api.vn/api/v2/w/?province=${foundProvince.code}`);
        const districtsData = await dRes.json();
        const subdivisions = Array.isArray(districtsData) ? districtsData : (districtsData.wards || []);
        setDistricts(subdivisions);
        
        if (dVal) {
          const foundDistrict = subdivisions.find(d => d.code == dVal || d.name == dVal);
          if (foundDistrict) setDistrict(foundDistrict.name);
        }
      } catch (err) {
        console.error('Error pre-filling districts:', err);
      }
    }
  };

  useEffect(() => {
    if (user && provinces.length > 0) {
      preFillLocation(user, provinces);
    }
  }, [user, provinces]);

  // Handle case where user is refreshed from server
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setEmail(user.email || '');
      setAddress(user.address || '');
    }
  }, [user]);

  const handleProvinceSelect = async (p) => {
    setProvince(p.name);
    setDistrict('');
    setModalVisible(false);
    try {
      const dRes = await fetch(`https://provinces.open-api.vn/api/v2/w/?province=${p.code}`);
      const districtsData = await dRes.json();
      setDistricts(Array.isArray(districtsData) ? districtsData : (districtsData.wards || []));
    } catch (err) {
      console.error('Error fetching districts:', err);
    }
  };

  const shippingFee = (province === 'Thành phố Hà Nội' || province === '1') ? 0 : 30000;
  const finalTotal = totalPrice - discount + shippingFee;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const response = await apiClient.post('/v1/coupon/verify', { code: couponCode, total: totalPrice });
      if (response.data.success) {
        setDiscount(response.data.data.discount);
        showToast(`Tuyệt vời! Bạn được giảm ${response.data.data.discount.toLocaleString('vi-VN')}đ`, 'success');
      }
    } catch (error) {
      showToast('Mã giảm giá không hợp lệ hoặc đã hết hạn.', 'error');
    }
  };

  const handleCheckout = async () => {
    if (!name.trim() || !phone.trim() || !address.trim() || !province || !district) {
      showToast('Vui lòng nhập đầy đủ thông tin giao hàng nhé!', 'warning');
      return;
    }
    setLoading(true);
    try {
      const orderData = {
        name, phone, email, province, district, address, note,
        coupon_code: couponCode,
        payment_method: paymentMethod,
        items: cartItems.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          price: item.price,
        })),
      };
      const response = await apiClient.post('/v1/checkout', orderData);
      if (response.data.success) {
        await clearCart();
        if (response.data.payment_url) {
          // Open payment gateway
          Linking.openURL(response.data.payment_url);
          // Go straight to orders history
          navigation.replace('Orders');
        } else {
          navigation.replace('OrderSuccess', { order: response.data.order });
        }
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Đặt hàng thất bại. Vui lòng thử lại.';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const PAYMENT_METHODS = [
    { id: 'cod', label: 'Thanh toán COD', icon: 'hand-holding-usd', color: '#10b981', desc: 'Trả tiền khi nhận hàng' },
    { id: 'vnpay', label: 'Ví VNPay / Thẻ', image: `${IMAGE_BASE_URL}/images/vnpay-logo.png`, color: '#3b82f6', desc: 'QR Code & Thẻ nội địa' },
    { id: 'momo', label: 'Ví MoMo', image: `${IMAGE_BASE_URL}/images/MOMO-Logo-App.png`, color: '#a50064', desc: 'Thanh toán qua app MoMo' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Stepper currentStep={2} />

      {/* Location Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{modalType === 'province' ? 'Chọn Tỉnh / Thành phố' : 'Chọn Xã / Phường'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}><Icon name="times" size={20} color={Colors.dark} /></TouchableOpacity>
            </View>
            <FlatList
              data={modalType === 'province' ? provinces : districts}
              keyExtractor={(item) => item.code.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.locationItem} onPress={() => modalType === 'province' ? handleProvinceSelect(item) : (setDistrict(item.name), setModalVisible(false))}>
                  <Text style={styles.locationName}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
      
      {/* Payment Pending Modal has been removed per user request */}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerSection}>
          <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()}>
            <Icon name="chevron-left" size={10} color={Colors.muted} />
            <Text style={styles.backText}>Quay lại giỏ hàng</Text>
          </TouchableOpacity>
          <View style={styles.titleRow}>
            <View style={styles.accentBar} />
            <Text style={styles.mainTitle}>Thông tin thanh toán</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.iconCircle}><Icon name="truck" size={14} color={Colors.secondary} /></View>
            <Text style={styles.sectionTitle}>Địa chỉ giao hàng</Text>
          </View>

          <View style={styles.inputRow}>
            <Text style={styles.eliteLabel}>Họ tên người nhận</Text>
            <TextInput style={styles.eliteInput} value={name} onChangeText={setName} placeholder="Nguyễn Văn A" />
          </View>

          <View style={styles.inputRow}>
            <Text style={styles.eliteLabel}>Số điện thoại</Text>
            <TextInput style={styles.eliteInput} value={phone} onChangeText={setPhone} placeholder="0912 345 678" keyboardType="phone-pad" />
          </View>

          <View style={styles.inputRow}>
            <Text style={styles.eliteLabel}>Tỉnh / Thành phố</Text>
            <TouchableOpacity style={styles.pickerTrigger} onPress={() => {setModalType('province'); setModalVisible(true)}}>
              <Text style={[styles.pickerText, !province && {color: '#94a3b8'}]}>{province || 'Chọn Tỉnh/Thành phố'}</Text>
              <Icon name="chevron-down" size={12} color={Colors.muted} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputRow}>
            <Text style={styles.eliteLabel}>Xã / Phường / Thị trấn</Text>
            <TouchableOpacity style={styles.pickerTrigger} onPress={() => {if(!province) return showToast('Bạn hãy chọn tỉnh/thành phố trước nhé', 'warning'); setModalType('district'); setModalVisible(true)}}>
              <Text style={[styles.pickerText, !district && {color: '#94a3b8'}]}>{district || 'Chọn Xã/Phường'}</Text>
              <Icon name="chevron-down" size={12} color={Colors.muted} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputRow}>
            <Text style={styles.eliteLabel}>Địa chỉ cụ thể</Text>
            <TextInput style={styles.eliteInput} value={address} onChangeText={setAddress} placeholder="Số nhà, tên đường..." />
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.iconCircle}><Icon name="credit-card" size={14} color={Colors.secondary} /></View>
            <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
          </View>

          {PAYMENT_METHODS.map(m => (
            <TouchableOpacity key={m.id} style={[styles.methodItem, paymentMethod === m.id && styles.methodItemActive]} onPress={() => setPaymentMethod(m.id)}>
              <View style={[styles.methodIconBox, {backgroundColor: m.icon ? `${m.color}15` : 'transparent'}]}>
                {m.icon ? (
                  <Icon name={m.icon} size={16} color={m.color} />
                ) : (
                  <Image source={{uri: m.image}} style={{width: 32, height: 32}} resizeMode="contain" />
                )}
              </View>
              <View style={{flex: 1}}>
                <Text style={[styles.methodLabel, paymentMethod === m.id && styles.methodLabelActive]}>{m.label}</Text>
                <Text style={styles.methodDesc}>{m.desc}</Text>
              </View>
              <View style={[styles.radio, paymentMethod === m.id && styles.radioActive]}>
                {paymentMethod === m.id && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.iconCircle}><Icon name="ticket-alt" size={14} color={Colors.secondary} /></View>
            <Text style={styles.sectionTitle}>Mã giảm giá</Text>
          </View>
          <View style={styles.couponRow}>
            <TextInput 
              style={[styles.eliteInput, {flex: 1}]} 
              value={couponCode} 
              onChangeText={setCouponCode} 
              placeholder="Nhập mã ưu đãi" 
              autoCapitalize="characters"
            />
            <TouchableOpacity style={styles.applyBtn} onPress={handleApplyCoupon}>
              <Text style={styles.applyBtnText}>Áp dụng</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.iconCircle}><Icon name="receipt" size={14} color={Colors.secondary} /></View>
            <Text style={styles.sectionTitle}>Tóm tắt đơn hàng</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tạm tính:</Text>
            <Text style={styles.summaryValue}>{totalPrice.toLocaleString('vi-VN')} VNĐ</Text>
          </View>
          {discount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Giảm giá:</Text>
              <Text style={[styles.summaryValue, {color: '#059669'}]}>-{discount.toLocaleString('vi-VN')} VNĐ</Text>
            </View>
          )}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Phí vận chuyển:</Text>
            <Text style={styles.summaryValue}>{shippingFee === 0 ? 'Miễn phí' : `${shippingFee.toLocaleString('vi-VN')} VNĐ`}</Text>
          </View>

          <View style={styles.divider} />
          
          <View style={styles.totalBlock}>
            <Text style={styles.totalLabel}>TỔNG THANH TOÁN:</Text>
            <Text style={styles.totalValue}>{finalTotal.toLocaleString('vi-VN')} VNĐ</Text>
          </View>

          <TouchableOpacity style={styles.orderBtn} activeOpacity={0.8} onPress={handleCheckout} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : (
              <>
                <Text style={styles.orderBtnText}>XÁC NHẬN ĐẶT HÀNG</Text>
                <Icon name="chevron-right" size={12} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContent: { paddingBottom: 20 },
  stepperContainer: { backgroundColor: '#f8fafc', paddingVertical: 20, paddingHorizontal: 40 },
  stepLine: { position: 'absolute', top: 42, left: 60, right: 60, height: 2, backgroundColor: '#e2e8f0' },
  stepsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stepItem: { alignItems: 'center', flex: 1 },
  stepIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.white, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#e2e8f0', zIndex: 2 },
  stepIconActive: { backgroundColor: Colors.dark, borderColor: Colors.dark },
  stepIconText: { fontSize: 14, fontWeight: '700', color: '#94a3b8' },
  stepIconTextActive: { color: Colors.secondary },
  stepLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', color: '#94a3b8', marginTop: 10, letterSpacing: 0.5 },
  stepLabelActive: { color: Colors.dark },

  headerSection: { paddingHorizontal: Spacing.l, marginBottom: 20 },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 15 },
  backText: { fontSize: 11, fontWeight: '800', color: Colors.muted, textTransform: 'uppercase' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  accentBar: { width: 5, height: 24, backgroundColor: Colors.secondary, borderRadius: 10 },
  mainTitle: { fontSize: 22, fontWeight: '900', color: Colors.dark },

  sectionCard: { marginHorizontal: Spacing.l, padding: 20, backgroundColor: Colors.white, borderRadius: 24, borderWidth: 1, borderColor: '#f1f5f9', marginBottom: 20 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  iconCircle: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 15, fontWeight: '900', color: Colors.dark, textTransform: 'uppercase' },

  inputRow: { marginBottom: 15 },
  eliteLabel: { fontSize: 11, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: 8 },
  eliteInput: { height: 50, backgroundColor: '#f8fafc', borderRadius: 12, paddingHorizontal: 15, fontSize: 14, fontWeight: '600', color: Colors.dark, borderWidth: 1, borderColor: '#e2e8f0' },
  pickerTrigger: { height: 50, backgroundColor: '#f8fafc', borderRadius: 12, paddingHorizontal: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  pickerText: { fontSize: 14, fontWeight: '600', color: Colors.dark },

  methodItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 16, backgroundColor: '#f8fafc', marginBottom: 10, borderWidth: 1.5, borderColor: 'transparent' },
  methodItemActive: { backgroundColor: '#fff', borderColor: Colors.secondary },
  methodIconBox: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  methodLabel: { fontSize: 14, fontWeight: '700', color: Colors.dark, marginBottom: 2 },
  methodLabelActive: { color: Colors.secondary },
  methodDesc: { fontSize: 11, color: Colors.muted },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center' },
  radioActive: { borderColor: Colors.secondary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.secondary },

  couponRow: { flexDirection: 'row', gap: 10 },
  applyBtn: { backgroundColor: Colors.dark, paddingHorizontal: 20, borderRadius: 12, justifyContent: 'center' },
  applyBtnText: { color: '#fff', fontWeight: '800', fontSize: 12 },

  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryLabel: { fontSize: 12, fontWeight: '700', color: Colors.muted, textTransform: 'uppercase' },
  summaryValue: { fontSize: 14, fontWeight: '800', color: Colors.dark },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 20, borderStyle: 'dashed', borderRadius: 1 },
  totalBlock: { alignItems: 'center', marginBottom: 25 },
  totalLabel: { fontSize: 11, fontWeight: '800', color: Colors.muted, textTransform: 'uppercase', marginBottom: 8 },
  totalValue: { fontSize: 28, fontWeight: '900', color: Colors.secondary },
  orderBtn: { backgroundColor: Colors.dark, height: 60, borderRadius: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12 },
  orderBtnText: { fontSize: 15, fontWeight: '900', color: Colors.white },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, height: '70%', padding: 25 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '900', color: Colors.dark },
  locationItem: { paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  locationName: { fontSize: 15, fontWeight: '600', color: Colors.dark },
});

export default CheckoutScreen;
