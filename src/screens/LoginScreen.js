import * as React from 'react';
import { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Image,
  ScrollView, StatusBar, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../styles/Theme';
import { useAuth } from '../context/AuthContext';
import { IMAGE_BASE_URL } from '../api/apiClient';
import { WebView } from 'react-native-webview';
import apiClient from '../api/apiClient';
import Icon from 'react-native-vector-icons/FontAwesome';

const LoginScreen = ({ navigation }) => {
  const { login, socialLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          <View style={styles.header}>
            <Image 
              source={{ uri: `${IMAGE_BASE_URL}/images/logo.jpg` }} 
              style={styles.logo} 
              resizeMode="contain" 
            />
            <Text style={styles.title}>Đăng Nhập</Text>
            <Text style={styles.subtitle}>Vui lòng đăng nhập để tiếp tục</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập email của bạn"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Mật khẩu</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập mật khẩu"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity 
              style={styles.loginButton} 
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginButtonText}>Đăng Nhập</Text>
              )}
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={styles.line} />
              <Text style={styles.dividerText}>Hoặc đăng nhập với</Text>
              <View style={styles.line} />
            </View>

            <View style={styles.socialContainer}>
              <TouchableOpacity style={styles.socialButton} onPress={() => handleSocialPress('google')}>
                <Icon name="google" size={20} color="#DB4437" />
                <Text style={styles.socialText}>Google</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.socialButton, styles.zaloButton]} onPress={() => handleSocialPress('zalo')}>
                <Image source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Zalo_logo.svg/1200px-Zalo_logo.svg.png' }} style={styles.zaloIcon} />
                <Text style={styles.zaloText}>Zalo</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Chưa có tài khoản? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.registerLink}>Đăng ký ngay</Text>
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
  scrollContent: { padding: 20, paddingTop: 40 },
  header: { alignItems: 'center', marginBottom: 40 },
  logo: { width: 150, height: 80, marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  subtitle: { fontSize: 14, color: '#666', marginTop: 5 },
  form: { width: '100%' },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 14, color: '#333', marginBottom: 8, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#f9f9f9',
  },
  loginButton: {
    backgroundColor: Colors.primary || '#000',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  loginButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 30 },
  line: { flex: 1, height: 1, backgroundColor: '#eee' },
  dividerText: { marginHorizontal: 10, color: '#999', fontSize: 12 },
  socialContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  socialButton: {
    flex: 0.48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
  },
  socialText: { marginLeft: 10, fontSize: 14, fontWeight: '600', color: '#333' },
  zaloButton: { backgroundColor: '#0068ff', borderColor: '#0068ff' },
  zaloIcon: { width: 20, height: 20 },
  zaloText: { marginLeft: 10, fontSize: 14, fontWeight: '600', color: '#fff' },
  registerContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 30 },
  registerText: { color: '#666' },
  registerLink: { color: Colors.secondary || '#ff6b00', fontWeight: 'bold' },
  modalHeader: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    paddingHorizontal: 15, height: 56, borderBottomWidth: 1, borderBottomColor: '#eee' 
  },
  closeBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  webViewLoading: { position: 'absolute', top: '50%', left: '50%', marginLeft: -15, marginTop: -15 },
});

export default LoginScreen;
