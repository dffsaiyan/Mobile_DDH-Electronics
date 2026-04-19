import * as React from 'react';
import { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Image,
  ScrollView, StatusBar, ActivityIndicator, KeyboardAvoidingView, Platform, Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../styles/Theme';
import apiClient, { IMAGE_BASE_URL } from '../api/apiClient';
import { FontAwesome as Icon } from '@expo/vector-icons';

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // 'success' | 'error' | null
  const [message, setMessage] = useState('');

  const validateEmail = (email) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const handleReset = async () => {
    setStatus(null);
    setMessage('');

    if (!email.trim()) {
      setStatus('error');
      setMessage('Vui lòng nhập email của bạn.');
      return;
    }
    if (!validateEmail(email)) {
      setStatus('error');
      setMessage('Định dạng email không hợp lệ.');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post('/v1/password/email', { email });
      if (response.data.success) {
        setStatus('success');
        setMessage(response.data.message || 'Chúng tôi đã gửi liên kết khôi phục mật khẩu vào Email của bạn!');
      } else {
        setStatus('error');
        setMessage(response.data.message || 'Chúng tôi không tìm thấy người dùng nào với địa chỉ Email này.');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Có lỗi xảy ra khi kết nối với máy chủ.';
      setStatus('error');
      setMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
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
          
          <View style={styles.mascotSection}>
            <Image 
              source={{ uri: `${IMAGE_BASE_URL}/images/auth_mascot.png` }} 
              style={styles.mascot} 
              resizeMode="contain"
            />
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.title}>Quên Mật Khẩu?</Text>
            <Text style={styles.subtitle}>Đừng lo lắng, chúng tôi sẽ giúp bạn lấy lại quyền truy cập vào kỳ nguyên số DDH.</Text>

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
              <Text style={styles.label}>ĐỊA CHỈ EMAIL</Text>
              <View style={[styles.inputContainer, status === 'error' && { borderColor: '#ef4444' }]}>
                <View style={styles.inputIcon}>
                  <Icon name="envelope" size={16} color="#666" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="duongnguyen@gmail.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <TouchableOpacity 
              style={styles.resetButton} 
              onPress={handleReset}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={styles.btnContent}>
                  <Text style={styles.resetButtonText}>GỬI LINK KHÔI PHỤC</Text>
                  <Icon name="paper-plane" size={16} color="#fff" style={{ marginLeft: 10 }} />
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.backToLogin} onPress={() => navigation.goBack()}>
              <Text style={styles.backToLoginText}>
                Nhớ lại mật khẩu? <Text style={{ color: '#3b82f6', fontWeight: 'bold' }}>Quay lại đăng nhập</Text>
              </Text>
            </TouchableOpacity>
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
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  headerLogo: { width: 100, height: 35 },
  scrollContent: { paddingBottom: 40 },
  
  mascotSection: { alignItems: 'center', marginTop: 20, marginBottom: 10 },
  mascot: { width: 140, height: 140 },
  
  formContainer: { paddingHorizontal: 30 },
  title: { fontSize: 28, fontWeight: '900', color: '#1e293b', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', marginTop: 8, marginBottom: 25, lineHeight: 20 },

  // STATUS BOX STYLES
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
  },
  successBox: { backgroundColor: '#f0fdf4', borderColor: '#dcfce7' },
  errorBox: { backgroundColor: '#fef2f2', borderColor: '#fee2e2' },
  statusText: { flex: 1, fontSize: 13, fontWeight: '600' },
  successText: { color: '#15803d' },
  errorText: { color: '#b91c1c' },

  inputWrapper: { marginBottom: 25 },
  label: { fontSize: 11, fontWeight: '900', color: '#64748b', marginBottom: 10, letterSpacing: 0.5 },
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
  input: { flex: 1, fontSize: 15, color: '#1e293b', fontWeight: '600' },
  
  resetButton: {
    backgroundColor: '#0f172a', // Dark blue like web button
    borderRadius: 50,
    padding: 16,
    alignItems: 'center',
    marginTop: 5,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  btnContent: { flexDirection: 'row', alignItems: 'center' },
  resetButtonText: { color: '#fff', fontSize: 15, fontWeight: 'bold', letterSpacing: 1 },
  
  backToLogin: { marginTop: 30, alignItems: 'center' },
  backToLoginText: { color: '#64748b', fontSize: 13, fontWeight: '500' },
});

export default ForgotPasswordScreen;
