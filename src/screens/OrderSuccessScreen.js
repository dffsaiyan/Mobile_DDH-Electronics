import * as React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Dimensions, Image, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Shadow } from '../styles/Theme';
import { FontAwesome5 as Icon } from '@expo/vector-icons';
import { IMAGE_BASE_URL } from '../api/apiClient';

const { width } = Dimensions.get('window');

const OrderSuccessScreen = ({ navigation, route }) => {
  const order = route.params?.order;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 5, useNativeDriver: true }),
    ]).start();
  }, []);

  const formatPrice = (price) => {
    if (!price || isNaN(price)) return '0 VNĐ';
    return Math.round(price).toLocaleString('vi-VN') + ' VNĐ';
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        {/* 🏆 SUCCESS HEADER */}
        <View style={styles.successHeader}>
          <View style={styles.iconWrapper}>
            <View style={styles.pulseCircle} />
            <View style={styles.mainCircle}>
              <Icon name="check" size={40} color={Colors.white} />
            </View>
          </View>
          <Text style={styles.title}>ĐẶT HÀNG THÀNH CÔNG!</Text>
          <Text style={styles.subtitle}>Giao dịch của bạn đã được xác nhận vào hệ thống Elite.</Text>
        </View>

        {/* 🎫 TICKET-STYLE ORDER INFO */}
        <View style={styles.ticketContainer}>
          <View style={styles.ticketTop}>
            <Image 
              source={{ uri: `${IMAGE_BASE_URL}/images/logo.jpg` }} 
              style={styles.logo} 
              resizeMode="contain" 
            />
            <View style={styles.divider} />
          </View>

          <View style={styles.ticketBody}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>MÃ ĐƠN HÀNG</Text>
              <Text style={styles.infoValue}>#{order?.id || 'DDH' + Date.now().toString().slice(-6)}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>THANH TOÁN</Text>
              <Text style={styles.infoValue}>{formatPrice(order?.total_price || order?.total || order?.total_amount || order?.grand_total || 0)}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>TRẠNG THÁI</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>CHỜ XỬ LÝ</Text>
              </View>
            </View>
          </View>

          <View style={styles.ticketFooter}>
            <View style={styles.leftHole} />
            <View style={styles.rightHole} />
            <View style={styles.dashLine} />
          </View>

          <View style={styles.thankYouSection}>
            <Text style={styles.note}>
              Đội ngũ DDH đang chuẩn bị "vũ khí" mới cho bạn. Chúng tôi sẽ thông báo ngay khi đơn hàng bắt đầu di chuyển!
            </Text>
          </View>
        </View>

        {/* 🚀 ACTIONS */}
        <View style={styles.actionSection}>
          <TouchableOpacity 
            style={styles.primaryBtn} 
            onPress={() => navigation.navigate('Orders')} 
            activeOpacity={0.8}
          >
            <View style={styles.btnContent}>
              <Text style={styles.primaryBtnText}>XEM ĐƠN HÀNG</Text>
              <Icon name="box-open" size={16} color={Colors.white} style={{ marginLeft: 10 }} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryBtn} 
            onPress={() => navigation.navigate('HomeTabs')} 
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryBtnText}>TIẾP TỤC MUA SẮM</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { flex: 1, alignItems: 'center', paddingHorizontal: 30, paddingTop: 40 },

  // Success Header
  successHeader: { alignItems: 'center', marginBottom: 40 },
  iconWrapper: { width: 120, height: 120, justifyContent: 'center', alignItems: 'center', marginBottom: 25 },
  mainCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center', elevation: 10, shadowColor: '#10b981', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 15 },
  pulseCircle: { position: 'absolute', width: 110, height: 110, borderRadius: 55, backgroundColor: 'rgba(16, 185, 129, 0.1)', borderWidth: 2, borderColor: 'rgba(16, 185, 129, 0.2)' },
  title: { fontSize: 24, fontWeight: '900', color: '#0f172a', letterSpacing: -0.5, marginBottom: 10 },
  subtitle: { fontSize: 13, color: '#64748b', textAlign: 'center', fontWeight: '500', lineHeight: 20 },

  // Ticket Styles
  ticketContainer: { width: '100%', backgroundColor: Colors.white, borderRadius: 24, overflow: 'hidden', ...Shadow.large, borderWidth: 1, borderColor: '#f1f5f9' },
  ticketTop: { padding: 25, alignItems: 'center' },
  logo: { width: 120, height: 40 },
  divider: { width: 40, height: 3, backgroundColor: Colors.secondary, borderRadius: 10, marginTop: 15 },
  
  ticketBody: { paddingHorizontal: 30, paddingVertical: 10 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  infoLabel: { fontSize: 11, fontWeight: '800', color: '#94a3b8', letterSpacing: 0.8 },
  infoValue: { fontSize: 14, fontWeight: '900', color: '#0f172a' },
  statusBadge: { backgroundColor: '#fff7ed', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 50, borderWidth: 1, borderColor: '#ffedd5' },
  statusText: { fontSize: 10, fontWeight: '900', color: '#f97316' },

  ticketFooter: { height: 30, justifyContent: 'center', position: 'relative' },
  leftHole: { position: 'absolute', left: -15, width: 30, height: 30, borderRadius: 15, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#f1f5f9' },
  rightHole: { position: 'absolute', right: -15, width: 30, height: 30, borderRadius: 15, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#f1f5f9' },
  dashLine: { marginHorizontal: 25, borderBottomWidth: 1.5, borderBottomColor: '#f1f5f9', borderStyle: 'dashed' },

  thankYouSection: { padding: 25, alignItems: 'center' },
  note: { fontSize: 12, color: '#64748b', textAlign: 'center', lineHeight: 20, fontStyle: 'italic' },

  // Actions
  actionSection: { width: '100%', marginTop: 40 },
  primaryBtn: { backgroundColor: '#0f172a', width: '100%', height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 15, ...Shadow.medium },
  btnContent: { flexDirection: 'row', alignItems: 'center' },
  primaryBtnText: { fontSize: 15, fontWeight: '900', color: Colors.white, letterSpacing: 1 },
  
  secondaryBtn: { width: '100%', height: 56, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  secondaryBtnText: { fontSize: 14, fontWeight: '800', color: '#64748b', textTransform: 'uppercase' },
});

export default OrderSuccessScreen;
