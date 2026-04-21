import * as React from 'react';
import { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Image,
  ScrollView, StatusBar, ActivityIndicator, KeyboardAvoidingView, Platform, Dimensions, Modal
} from 'react-native';
import { useRef } from 'react';
import { WebView } from 'react-native-webview';
import apiClient from '../api/apiClient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../styles/Theme';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { IMAGE_BASE_URL } from '../api/apiClient';
import { FontAwesome as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const RegisterScreen = ({ navigation }) => {
  const { register, socialLogin } = useAuth();
  const { showToast } = useNotification();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState(null); // 'success' | 'error' | null
  const [message, setMessage] = useState('');
  
  // Social Login State
  const [socialModalVisible, setSocialModalVisible] = useState(false);
  const [socialUrl, setSocialUrl] = useState('');
  const webViewRef = useRef(null);
  
  const handleSocialPress = (provider) => {
    const url = `${IMAGE_BASE_URL}/login/${provider}?mobile=1`;
    setSocialUrl(url);
    setSocialModalVisible(true);
  };


  const handleRegister = async () => {
    setStatus(null);
    setMessage('');

    if (!name.trim() || !email.trim() || !password.trim()) {
      showToast('Vui lòng nhập đầy đủ thông tin.', 'error');
      return;
    }
    if (password !== confirmPassword) {
      showToast('Mật khẩu xác nhận không khớp.', 'error');
      return;
    }
    
    setLoading(true);
    const result = await register(name, email, password, confirmPassword);
    setLoading(false);
    
    if (!result.success) {
      showToast(result.message || 'Đăng ký thất bại.', 'error');
    } else {
      showToast('Gia nhập Elite thành công!');
      setTimeout(() => navigation.navigate('HomeTabs'), 1000);
    }
  };

  const handleSocialNavigationChange = async (navState) => {
    // Intercept mobile-specific success URL
    if (navState.url.includes('mobile-social-success')) {
      setSocialModalVisible(false);
      setLoading(true);

      try {
        const url = navState.url;
        
        // Helper function to get query params
        const getParam = (name) => {
          const match = url.match(new RegExp('[?&]' + name + '=([^&]*)'));
          return match ? decodeURIComponent(match[1].replace(/\+/g, ' ')) : null;
        };

        const token = getParam('token');
        const userData = {
          id: getParam('user_id'),
          name: getParam('name'),
          email: getParam('email'),
          social_avatar: getParam('social_avatar'),
          phone: getParam('phone'),
          address: getParam('address')
        };

        if (token && userData.name) {
          await socialLogin(userData, token);
          navigation.navigate('HomeTabs');
        } else {
          showToast('Không thể lấy thông tin đăng ký.', 'error');
        }
      } catch (error) {
        console.error('Social Registration Parsing Error:', error);
        showToast('Lỗi khi xử lý thông tin đăng ký.', 'error');
      } finally {
        setLoading(false);
      }
      return;
    }

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
          setStatus('error');
          setMessage('Vui lòng thử lại đăng ký.');
        }
      } catch (error) {
        console.error('Social Token Error (Register):', error);
        setStatus('error');
        setMessage('Phiên đăng ký hết hạn hoặc có lỗi xảy ra.');
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
              <Text style={styles.benefitTitle}>GIA NHẬP <Text style={{color: '#fbbf24'}}>DDH-ELITE</Text></Text>
              <Text style={styles.benefitSubtitle}>Mở khóa vạn đặc quyền công nghệ</Text>
              
              <View style={styles.benefitList}>
                <View style={styles.benefitItem}>
                  <Icon name="star" size={14} color="#fbbf24" style={styles.benefitIcon} />
                  <Text style={styles.benefitText}>Tích điểm Elite cho mỗi đơn hàng.</Text>
                </View>
                <View style={styles.benefitItem}>
                  <Icon name="gift" size={14} color="#3b82f6" style={styles.benefitIcon} />
                  <Text style={styles.benefitText}>Nhận quà tặng VIP vào dịp sinh nhật.</Text>
                </View>
                <View style={styles.benefitItem}>
                  <Icon name="support" size={14} color="#22c55e" style={styles.benefitIcon} />
                  <Text style={styles.benefitText}>Hỗ trợ kỹ thuật ưu tiên 24/7.</Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Register Form Section */}
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Đăng Ký</Text>
            <Text style={styles.formSubtitle}>Khởi tạo tài khoản DDH-Elite của riêng bạn</Text>

            <View style={styles.inputWrapper}>
              <Text style={styles.label}>HỌ VÀ TÊN</Text>
              <View style={[styles.inputContainer, status === 'error' && !name.trim() && { borderColor: '#ef4444' }]}>
                <View style={styles.inputIcon}>
                  <Icon name="user" size={16} color="#666" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Nguyễn Văn A"
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.label}>EMAIL</Text>
              <View style={[styles.inputContainer, status === 'error' && !email.trim() && { borderColor: '#ef4444' }]}>
                <View style={styles.inputIcon}>
                  <Icon name="envelope" size={16} color="#666" />
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
              <View style={[styles.inputContainer, status === 'error' && !password.trim() && { borderColor: '#ef4444' }]}>
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

            <View style={styles.inputWrapper}>
              <Text style={styles.label}>XÁC NHẬN MẬT KHẨU</Text>
              <View style={[styles.inputContainer, status === 'error' && password !== confirmPassword && { borderColor: '#ef4444' }]}>
                <View style={styles.inputIcon}>
                  <Icon name="check-circle" size={18} color="#666" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  <Icon name={showPassword ? "eye-slash" : "eye"} size={16} color="#666" />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.registerButton} 
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Icon name="user-plus" size={18} color="#fff" style={{ marginRight: 10 }} />
                  <Text style={styles.registerButtonText}>ĐĂNG KÝ NGAY</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={styles.line} />
              <Text style={styles.dividerText}>Hoặc gia nhập bằng</Text>
              <View style={styles.line} />
            </View>

            <View style={styles.socialContainer}>
              <TouchableOpacity style={styles.socialCircle} onPress={() => handleSocialPress('google')}>
                <Image 
                  source={{ uri: `${IMAGE_BASE_URL}/images/google_icon.png` }} 
                  style={styles.socialImg} 
                />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.socialCircle} onPress={() => handleSocialPress('zalo')}>
                <Image 
                  source={{ uri: `${IMAGE_BASE_URL}/images/zalo_icon.png` }} 
                  style={styles.socialImg} 
                />
              </TouchableOpacity>
            </View>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Bạn đã có tài khoản? </Text>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.loginLink}>Đăng nhập ngay</Text>
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
            <Text style={styles.modalTitle}>Đăng ký Elite</Text>
            <View style={{ width: 40 }} />
          </View>
          <WebView 
            ref={webViewRef}
            source={{ uri: socialUrl }}
            onNavigationStateChange={handleSocialNavigationChange}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            userAgent={Platform.OS === 'ios' ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' : 'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36'}
            startInLoadingState={true}
            renderLoading={() => <ActivityIndicator size="large" color="#f97316" style={styles.webViewLoading} />}
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
    height: 180,
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
  benefitList: { gap: 6 },
  benefitItem: { flexDirection: 'row', alignItems: 'center' },
  benefitIcon: { width: 20 },
  benefitText: { color: '#fff', fontSize: 11, fontWeight: '500' },

  formContainer: { paddingHorizontal: 25, marginTop: 10 },
  formTitle: { fontSize: 24, fontWeight: 'bold', color: '#1e293b', textAlign: 'center' },
  formSubtitle: { fontSize: 13, color: '#64748b', textAlign: 'center', marginTop: 5, marginBottom: 20 },
  
  // STATUS BOX STYLES
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
  },
  successBox: { backgroundColor: '#f0fdf4', borderColor: '#dcfce7' },
  errorBox: { backgroundColor: '#fef2f2', borderColor: '#fee2e2' },
  statusText: { flex: 1, fontSize: 12, fontWeight: '600' },
  successText: { color: '#15803d' },
  errorText: { color: '#b91c1c' },

  inputWrapper: { marginBottom: 15 },
  label: { fontSize: 11, fontWeight: '800', color: '#64748b', marginBottom: 8, letterSpacing: 0.5 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    height: 56,
    overflow: 'hidden',
  },
  inputIcon: { width: 50, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, fontSize: 15, color: '#1e293b' },
  eyeIcon: { width: 50, alignItems: 'center', justifyContent: 'center' },

  registerButton: {
    backgroundColor: '#0f172a', // var(--primary-blue) #0f172a
    borderRadius: 50, // rounded-pill
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // shadow-sm
  },
  registerButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },
  
  loginContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 25 },
  loginText: { color: '#64748b', fontSize: 13 },
  loginLink: { color: '#f97316', fontWeight: 'bold', fontSize: 13 },

  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 25 },
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
  
  modalHeader: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    paddingHorizontal: 15, height: 56, borderBottomWidth: 1, borderBottomColor: '#eee' 
  },
  closeBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  webViewLoading: { position: 'absolute', top: '50%', left: '50%', marginLeft: -15, marginTop: -15 },
});

export default RegisterScreen;
