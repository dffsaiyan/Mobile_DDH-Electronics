import * as React from 'react';
import { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Image,
  ScrollView, StatusBar, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Modal, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../styles/Theme';
import { useAuth } from '../context/AuthContext';
import { IMAGE_BASE_URL } from '../api/apiClient';
import { WebView } from 'react-native-webview';
import apiClient from '../api/apiClient';
import Icon from 'react-native-vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const { login, socialLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Social Login State
  const [socialModalVisible, setSocialModalVisible] = useState(false);
  const [socialUrl, setSocialUrl] = useState('');
  const webViewRef = useRef(null);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập email và mật khẩu.');
      return;
    }
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (!result.success) {
      Alert.alert('Đăng nhập thất bại', result.message);
    } else {
      navigation.navigate('HomeTabs');
    }
  };

  const handleSocialPress = (provider) => {
    const url = `${IMAGE_BASE_URL}/login/${provider}`;
    setSocialUrl(url);
    setSocialModalVisible(true);
  };

  const onNavigationStateChange = async (navState) => {
    const isSuccess = navState.url === `${IMAGE_BASE_URL}/` || 
                      navState.url === `${IMAGE_BASE_URL}/home` ||
                      navState.url.includes('success');

    if (isSuccess && socialModalVisible) {
      setSocialModalVisible(false);
      setLoading(true);
      
      try {
        const response = await apiClient.get('/v1/social/token');
        if (response.data.success) {
          const { user, token } = response.data;
          await socialLogin(user, token);
          navigation.navigate('HomeTabs');
        } else {
          Alert.alert('Lỗi', 'Không thể lấy thông tin đăng nhập từ mạng xã hội.');
        }
      } catch (error) {
        console.error('Social Token Error:', error);
        Alert.alert('Lỗi', 'Phiên đăng nhập hết hạn hoặc có lỗi xảy ra.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header with Back Button */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="chevron-left" size={20} color="#333" />
        </TouchableOpacity>
        <Image 
          source={{ uri: `${IMAGE_BASE_URL}/images/logo.jpg` }} 
          style={styles.headerLogo} 
          resizeMode="contain" 
        />
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Mascot & Benefits Section */}
          <View style={styles.benefitsContainer}>
            <Image 
              source={{ uri: `${IMAGE_BASE_URL}/images/auth_mascot.png` }} 
              style={styles.mascotBg} 
              resizeMode="cover"
            />
            <LinearGradient
              colors={['rgba(15, 23, 42, 0.85)', 'rgba(249, 115, 22, 0.4)']}
              style={styles.benefitCard}
            >
              <Text style={styles.benefitTitle}>ĐẶC QUYỀN <Text style={{color: '#fbbf24'}}>DDH-ELITE</Text></Text>
              <Text style={styles.benefitSubtitle}>Kỷ nguyên công nghệ số</Text>
              
              <View style={styles.benefitList}>
                <View style={styles.benefitItem}>
                  <Icon name="bolt" size={14} color="#fbbf24" style={styles.benefitIcon} />
                  <Text style={styles.benefitText}>Giảm trực tiếp 5% cho mọi đơn hàng phụ kiện.</Text>
                </View>
                <View style={styles.benefitItem}>
                  <Icon name="truck" size={14} color="#3b82f6" style={styles.benefitIcon} />
                  <Text style={styles.benefitText}>Miễn phí vận chuyển toàn quốc đơn từ 299k.</Text>
                </View>
                <View style={styles.benefitItem}>
                  <Icon name="birthday-cake" size={14} color="#ef4444" style={styles.benefitIcon} />
                  <Text style={styles.benefitText}>Tặng Voucher 500k trong tháng sinh nhật.</Text>
                </View>
                <View style={styles.benefitItem}>
                  <Icon name="shield" size={14} color="#22c55e" style={styles.benefitIcon} />
                  <Text style={styles.benefitText}>Đặc quyền 1 đổi 1 trong 45 ngày đầu tiên.</Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Login Form Section */}
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Đăng Nhập</Text>
            <Text style={styles.formSubtitle}>Chào mừng quay trở lại với kỷ nguyên số DDH</Text>

            <View style={styles.inputWrapper}>
              <Text style={styles.label}>EMAIL</Text>
              <View style={styles.inputContainer}>
                <View style={styles.inputIcon}>
                  <Icon name="envelope-o" size={16} color="#666" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="nhapemail@domain.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.label}>MẬT KHẨU</Text>
              <View style={styles.inputContainer}>
                <View style={styles.inputIcon}>
                  <Icon name="lock" size={18} color="#666" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  <Icon name={showPassword ? "eye-slash" : "eye"} size={16} color="#666" />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.loginButton} 
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginButtonText}>ĐĂNG NHẬP</Text>
              )}
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={styles.line} />
              <Text style={styles.dividerText}>Hoặc đăng nhập bằng</Text>
              <View style={styles.line} />
            </View>

            <View style={styles.socialContainer}>
              <TouchableOpacity style={styles.socialCircle} onPress={() => handleSocialPress('google')}>
                <Image 
                  source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/1200px-Google_%22G%22_logo.svg.png' }} 
                  style={styles.socialImg} 
                />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.socialCircle} onPress={() => handleSocialPress('zalo')}>
                <Image 
                  source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Zalo_logo.svg/1200px-Zalo_logo.svg.png' }} 
                  style={styles.socialImg} 
                />
              </TouchableOpacity>
            </View>

            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Bạn chưa có tài khoản? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.registerLink}>Đăng ký DDH-Elite</Text>
              </TouchableOpacity>
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={socialModalVisible} animationType="slide" onRequestClose={() => setSocialModalVisible(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setSocialModalVisible(false)} style={styles.closeBtn}>
              <Icon name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Đăng nhập</Text>
            <View style={{ width: 40 }} />
          </View>
          <WebView 
            ref={webViewRef}
            source={{ uri: socialUrl }}
            onNavigationStateChange={onNavigationStateChange}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            renderLoading={() => <ActivityIndicator size="large" color={Colors.primary} style={styles.webViewLoading} />}
          />
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    height: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  headerLogo: { width: 100, height: 35 },
  scrollContent: { paddingBottom: 40 },
  
  benefitsContainer: {
    height: 220,
    margin: 15,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  mascotBg: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  benefitCard: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#f97316',
    borderRadius: 20,
  },
  benefitTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 2,
  },
  benefitSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 15,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  benefitList: { gap: 8 },
  benefitItem: { flexDirection: 'row', alignItems: 'center' },
  benefitIcon: { width: 20 },
  benefitText: { color: '#fff', fontSize: 11, fontWeight: '500' },

  formContainer: { paddingHorizontal: 25, marginTop: 10 },
  formTitle: { fontSize: 24, fontWeight: 'bold', color: '#1e293b', textAlign: 'center' },
  formSubtitle: { fontSize: 13, color: '#64748b', textAlign: 'center', marginTop: 5, marginBottom: 30 },
  
  inputWrapper: { marginBottom: 20 },
  label: { fontSize: 11, fontWeight: '800', color: '#64748b', marginBottom: 8, letterSpacing: 0.5 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  inputIcon: { paddingHorizontal: 15 },
  input: { flex: 1, paddingVertical: 12, fontSize: 14, color: '#1e293b' },
  eyeIcon: { paddingHorizontal: 15 },

  loginButton: {
    backgroundColor: '#f97316',
    borderRadius: 50,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  loginButtonText: { color: '#fff', fontSize: 15, fontWeight: 'bold', letterSpacing: 1 },
  
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 30 },
  line: { flex: 1, height: 1, backgroundColor: '#f1f5f9' },
  dividerText: { marginHorizontal: 10, color: '#94a3b8', fontSize: 11 },
  
  socialContainer: { flexDirection: 'row', justifyContent: 'center', gap: 25 },
  socialCircle: {
    width: 55,
    height: 55,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  socialImg: { width: 28, height: 28, resizeMode: 'contain' },
  
  registerContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 30 },
  registerText: { color: '#64748b', fontSize: 13 },
  registerLink: { color: '#007bff', fontWeight: 'bold', fontSize: 13 },
  
  modalHeader: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    paddingHorizontal: 15, height: 56, borderBottomWidth: 1, borderBottomColor: '#eee' 
  },
  closeBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  webViewLoading: { position: 'absolute', top: '50%', left: '50%', marginLeft: -15, marginTop: -15 },
});

export default LoginScreen;
