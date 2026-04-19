import * as React from 'react';
import { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Image,
  ScrollView, StatusBar, ActivityIndicator, KeyboardAvoidingView, Platform, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../styles/Theme';
import { useAuth } from '../context/AuthContext';
import { IMAGE_BASE_URL } from '../api/apiClient';
import { FontAwesome as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const RegisterScreen = ({ navigation }) => {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState(null); // 'success' | 'error' | null
  const [message, setMessage] = useState('');

  const handleRegister = async () => {
    setStatus(null);
    setMessage('');

    if (!name.trim() || !email.trim() || !password.trim()) {
      setStatus('error');
      setMessage('Vui lòng nhập đầy đủ thông tin.');
      return;
    }
    if (password !== confirmPassword) {
      setStatus('error');
      setMessage('Mật khẩu xác nhận không khớp.');
      return;
    }
    
    setLoading(true);
    const result = await register(name, email, password, confirmPassword);
    setLoading(false);
    
    if (!result.success) {
      setStatus('error');
      setMessage(result.message || 'Đăng ký thất bại.');
    } else {
      setStatus('success');
      setMessage('Gia nhập Elite thành công! Đang chuyển hướng...');
      setTimeout(() => navigation.navigate('HomeTabs'), 1000);
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

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Bạn đã có tài khoản? </Text>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.loginLink}>Đăng nhập ngay</Text>
              </TouchableOpacity>
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
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
    backgroundColor: '#3b82f6',
    borderRadius: 50,
    padding: 15,
    alignItems: 'center',
    marginTop: 15,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  registerButtonText: { color: '#fff', fontSize: 15, fontWeight: 'bold', letterSpacing: 1 },
  
  loginContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 25 },
  loginText: { color: '#64748b', fontSize: 13 },
  loginLink: { color: '#f97316', fontWeight: 'bold', fontSize: 13 },
});

export default RegisterScreen;
