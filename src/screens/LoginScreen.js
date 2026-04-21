import * as React from 'react';
import { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Image,
  ScrollView, StatusBar, ActivityIndicator, KeyboardAvoidingView, Platform, Modal, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../styles/Theme';
import { useAuth } from '../context/AuthContext';
import { IMAGE_BASE_URL } from '../api/apiClient';
import { WebView } from 'react-native-webview';
import apiClient from '../api/apiClient';
import { FontAwesome as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// Standard user agent to bypass Google 403 disallowed_useragent
const USER_AGENT = Platform.OS === 'ios' 
  ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  : 'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36';

const LoginScreen = ({ navigation }) => {
  const { login, socialLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // 'success' | 'error' | null
  const [message, setMessage] = useState('');
  
  // Social Login State
  const [socialModalVisible, setSocialModalVisible] = useState(false);
  const [socialUrl, setSocialUrl] = useState('');
  const webViewRef = useRef(null);

  const handleLogin = async () => {
    setStatus(null);
    setMessage('');

    if (!email.trim() || !password.trim()) {
      setStatus('error');
      setMessage('Vui lòng nhập đầy đủ email và mật khẩu.');
      return;
    }
    
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    
    if (!result.success) {
      setStatus('error');
      setMessage(result.message || 'Đăng nhập thất bại.');
    } else {
      setStatus('success');
      setMessage('Đăng nhập thành công! Đang chuyển hướng...');
      setTimeout(() => navigation.navigate('HomeTabs'), 1000);
    }
  };

  const handleSocialPress = (provider) => {
    const url = `${IMAGE_BASE_URL}/login/${provider}?mobile=1`;
    setSocialUrl(url);
    setSocialModalVisible(true);
  };

  const onNavigationStateChange = async (navState) => {
    // Check for our new mobile-specific success URL
    if (navState.url.includes('mobile-social-success')) {
      setSocialModalVisible(false);
      setLoading(true);

      try {
        const url = navState.url;
        const tokenMatch = url.match(/token=([^&]+)/);
        const userMatch = url.match(/user=([^&]+)/);

        if (tokenMatch && userMatch) {
          const token = tokenMatch[1];
          const userStr = decodeURIComponent(userMatch[1].replace(/\+/g, ' '));
          const userData = JSON.parse(userStr);
          
          await socialLogin(userData, token);
          navigation.navigate('HomeTabs');
        } else {
          setStatus('error');
          setMessage('Không thể lấy thông tin đăng nhập.');
        }
      } catch (error) {
        console.error('Social Success Parsing Error:', error);
        setStatus('error');
        setMessage('Lỗi khi xử lý thông tin đăng nhập.');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Legacy fallback (might still be needed if server redirects to root)
    const isSuccess = navState.url === `${IMAGE_BASE_URL}/` || 
                      navState.url === `${IMAGE_BASE_URL}/home` ||
                      navState.url.includes('success');

    if (isSuccess && socialModalVisible) {
      // If we are here, it means the server didn't redirect to mobile-social-success
      // We try the old way but it likely will fail with 401 if cookies aren't shared
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
          setMessage('Vui lòng thử lại đăng nhập.');
        }
      } catch (error) {
        console.error('Social Token Error (Legacy):', error);
        setStatus('error');
        setMessage('Phiên đăng nhập hết hạn hoặc có lỗi xảy ra.');
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

            {/* 💎 PREMIUM STATUS MESSAGE BOX */}
            {status && (
              <View style={[styles.statusBox, status === 'success' ? styles.successBox : styles.errorBox]}>
                <Icon 
                  name={status === 'success' ? "check-circle" : "exclamation-circle"} 
                  size={16} 
                  color={status === 'success' ? "#15803d" : "#b91c1c"} 
                  style={{ marginRight: 10 }}
                />
                <Text style={[styles.statusText, status === 'success' ? styles.successText : styles.errorText]}>
                  {message}
                </Text>
              </View>
            )}

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
              <View style={styles.labelRow}>
                <Text style={styles.label}>MẬT KHẨU</Text>
                <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                  <Text style={styles.forgotText}>Quên mật khẩu?</Text>
                </TouchableOpacity>
              </View>
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

            <View style={styles.rememberContainer}>
              <TouchableOpacity 
                style={styles.checkboxRow} 
                onPress={() => setRememberMe(!rememberMe)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
                  {rememberMe && <Icon name="check" size={10} color="#fff" />}
                </View>
                <Text style={styles.rememberText}>Ghi nhớ đăng nhập</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.loginButton} 
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Icon name="sign-in" size={18} color="#fff" style={{ marginRight: 10 }} />
                  <Text style={styles.loginButtonText}>ĐĂNG NHẬP</Text>
                </View>
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
            userAgent={USER_AGENT}
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
    height: 200,
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
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  label: { fontSize: 11, fontWeight: '800', color: '#64748b', letterSpacing: 0.5 },
  forgotText: { fontSize: 12, color: '#f97316', fontWeight: '600' },
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

  rememberContainer: { marginBottom: 20 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center' },
  checkbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 1, borderColor: '#cbd5e1', backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  checkboxActive: { backgroundColor: '#f97316', borderColor: '#f97316' },
  rememberText: { fontSize: 13, color: '#64748b' },

  loginButton: {
    backgroundColor: '#f97316',
    borderRadius: 50,
    padding: 15,
    alignItems: 'center',
    marginTop: 0,
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  loginButtonText: { color: '#fff', fontSize: 15, fontWeight: 'bold', letterSpacing: 1 },
  
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
  
  registerContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 25 },
  registerText: { color: '#64748b', fontSize: 13 },
  registerLink: { color: '#3b82f6', fontWeight: 'bold', fontSize: 13 },
  
  modalHeader: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    paddingHorizontal: 15, height: 56, borderBottomWidth: 1, borderBottomColor: '#eee' 
  },
  closeBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  webViewLoading: { position: 'absolute', top: '50%', left: '50%', marginLeft: -15, marginTop: -15 },
});

export default LoginScreen;
