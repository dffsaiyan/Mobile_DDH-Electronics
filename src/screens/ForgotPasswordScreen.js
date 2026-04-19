import * as React from 'react';
import { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Image,
  ScrollView, StatusBar, ActivityIndicator, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../styles/Theme';
import { IMAGE_BASE_URL } from '../api/apiClient';
import { FontAwesome as Icon } from '@expo/vector-icons';

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập email của bạn.');
      return;
    }
    setLoading(true);
    // Giả lập gửi yêu cầu (hoặc kết nối API nếu có)
    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        'Thành công',
        'Yêu cầu khôi phục mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư email của bạn.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="chevron-left" size={20} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quên mật khẩu</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.mascotSection}>
            <Image 
              source={{ uri: `${IMAGE_BASE_URL}/images/auth_mascot.png` }} 
              style={styles.mascot} 
              resizeMode="contain"
            />
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.title}>Khôi Phục Mật Khẩu</Text>
            <Text style={styles.subtitle}>Nhập email đã đăng ký để nhận liên kết đặt lại mật khẩu của DDH-Elite.</Text>

            <View style={styles.inputWrapper}>
              <Text style={styles.label}>EMAIL ĐÃ ĐĂNG KÝ</Text>
              <View style={styles.inputContainer}>
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

            <TouchableOpacity 
              style={styles.resetButton} 
              onPress={handleReset}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.resetButtonText}>GỬI YÊU CẦU</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.backToLogin} onPress={() => navigation.goBack()}>
              <Text style={styles.backToLoginText}>Quay lại đăng nhập</Text>
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
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  scrollContent: { paddingBottom: 40 },
  mascotSection: { alignItems: 'center', marginTop: 30, marginBottom: 20 },
  mascot: { width: 120, height: 120 },
  formContainer: { paddingHorizontal: 25 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1e293b', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', marginTop: 10, marginBottom: 35, lineHeight: 22 },
  inputWrapper: { marginBottom: 25 },
  label: { fontSize: 11, fontWeight: '800', color: '#64748b', marginBottom: 10, letterSpacing: 0.5 },
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
  resetButton: {
    backgroundColor: '#f97316',
    borderRadius: 50,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
    elevation: 4,
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  resetButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
  backToLogin: { marginTop: 25, alignItems: 'center' },
  backToLoginText: { color: '#64748b', fontSize: 14, fontWeight: '600' },
});

export default ForgotPasswordScreen;
