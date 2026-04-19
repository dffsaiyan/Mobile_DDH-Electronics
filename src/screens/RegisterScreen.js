import * as React from 'react';
import { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Image,
  ScrollView, StatusBar, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Shadow } from '../styles/Theme';
import { useAuth } from '../context/AuthContext';
import { IMAGE_BASE_URL } from '../api/apiClient';
import { FontAwesome5 as Icon } from '@expo/vector-icons';

const RegisterScreen = ({ navigation }) => {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập đầy đủ thông tin.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Thông báo', 'Mật khẩu xác nhận không khớp.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Thông báo', 'Mật khẩu phải có ít nhất 8 ký tự.');
      return;
    }
    setLoading(true);
    const result = await register(name, email, password, confirmPassword);
    setLoading(false);
    if (!result.success) {
      Alert.alert('Đăng ký thất bại', result.message);
    } else {
      navigation.navigate('HomeTabs');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* ── HEADER ── */}
          <View style={styles.headerSection}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Icon name="arrow-left" size={16} color={Colors.primary} />
            </TouchableOpacity>
            
            <View style={styles.brandingRow}>
                <Image 
                source={{ uri: `${IMAGE_BASE_URL}/images/logo.jpg` }} 
                style={styles.logoElite} 
                resizeMode="contain" 
                />
                <View style={styles.mascotSmallContainer}>
                    <Image 
                    source={{ uri: `${IMAGE_BASE_URL}/images/auth_mascot.png` }} 
                    style={styles.mascotSmall} 
                    resizeMode="contain" 
                    />
                </View>
            </View>
            
            <Text style={styles.title}>Đăng Ký Tài Khoản</Text>
            <Text style={styles.subtitle}>Gia nhập cộng đồng DDH Elite để nhận đặc quyền</Text>
          </View>

          {/* ── BENEFITS MINI ── */}
          <View style={styles.benefitsMiniCard}>
            <View style={styles.benefitItem}>
                <Icon name="check-circle" size={14} color="#fbbf24" />
                <Text style={styles.benefitText}>Bảo hành 24 tháng</Text>
            </View>
            <View style={styles.benefitItem}>
                <Icon name="check-circle" size={14} color="#fbbf24" />
                <Text style={styles.benefitText}>Tích điểm đổi quà</Text>
            </View>
            <View style={styles.benefitItem}>
                <Icon name="check-circle" size={14} color="#fbbf24" />
                <Text style={styles.benefitText}>Ưu đãi Member Day</Text>
            </View>
          </View>

          {/* ── FORM ── */}
          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>HỌ VÀ TÊN</Text>
              <View style={styles.inputWrapper}>
                <Icon name="user" size={14} color={Colors.muted} style={styles.prefixIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Nguyễn Văn A"
                  placeholderTextColor="rgba(15, 23, 42, 0.3)"
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>EMAIL</Text>
              <View style={styles.inputWrapper}>
                <Icon name="envelope" size={14} color={Colors.muted} style={styles.prefixIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="nhapemail@domain.com"
                  placeholderTextColor="rgba(15, 23, 42, 0.3)"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>MẬT KHẨU MỚI</Text>
              <View style={styles.inputWrapper}>
                <Icon name="lock" size={14} color={Colors.muted} style={styles.prefixIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="rgba(15, 23, 42, 0.3)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.suffixBtn}>
                  <Icon name={showPassword ? 'eye' : 'eye-slash'} size={14} color={Colors.muted} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>XÁC NHẬN LẠI</Text>
              <View style={styles.inputWrapper}>
                <Icon name="check-double" size={14} color={Colors.muted} style={styles.prefixIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="rgba(15, 23, 42, 0.3)"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.registerBtn, loading && styles.registerBtnDisabled]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <>
                    <Icon name="user-plus" size={14} color={Colors.white} style={{marginRight: 10}} />
                    <Text style={styles.registerBtnText}>ĐĂNG KÝ NGAY</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* ── LOGIN LINK ── */}
          <View style={styles.loginRow}>
            <Text style={styles.loginLabel}>Đã có tài khoản? </Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.loginLink}>Đăng nhập ngay</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.securityNote}>
              <Icon name="shield-alt" size={12} color={Colors.muted} style={{marginRight: 8}} />
              <Text style={styles.securityText}>Thông tin của bạn được bảo mật tuyệt đối</Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  scrollContent: { paddingHorizontal: 30, paddingBottom: 60 },

  headerSection: { paddingTop: 10, paddingBottom: 20 },
  backBtn: { 
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#f1f5f9', 
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
    borderWidth: 1, borderColor: '#e2e8f0'
  },
  brandingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  logoElite: { width: 120, height: 50, borderRadius: 10 },
  mascotSmallContainer: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9' },
  mascotSmall: { width: '80%', height: '80%' },
  
  title: { fontSize: 26, fontWeight: '900', color: Colors.primary, marginBottom: 8 },
  subtitle: { fontSize: 13, color: Colors.muted, fontWeight: '600' },

  benefitsMiniCard: { 
    flexDirection: 'row', justifyContent: 'space-between', backgroundColor: Colors.primary,
    borderRadius: 16, padding: 15, marginBottom: 25, ...Shadow.small
  },
  benefitItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  benefitText: { fontSize: 10, fontWeight: '800', color: Colors.white, textTransform: 'uppercase' },

  formSection: { marginTop: 0 },
  inputGroup: { marginBottom: 18 },
  inputLabel: { fontSize: 11, fontWeight: '900', color: Colors.muted, letterSpacing: 1, marginBottom: 8 },
  inputWrapper: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', 
    borderRadius: 16, paddingHorizontal: 15, height: 56, 
    borderWidth: 1, borderColor: '#e2e8f0' 
  },
  prefixIcon: { marginRight: 12, opacity: 0.6 },
  input: { flex: 1, fontSize: 14, fontWeight: '700', color: Colors.primary },
  suffixBtn: { padding: 5 },

  registerBtn: { 
    backgroundColor: Colors.secondary, height: 56, borderRadius: 28, 
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', 
    marginTop: 15, ...Shadow.medium 
  },
  registerBtnDisabled: { opacity: 0.7 },
  registerBtnText: { fontSize: 14, fontWeight: '900', color: Colors.white, letterSpacing: 1 },

  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 30, marginBottom: 20 },
  loginLabel: { fontSize: 14, color: Colors.muted, fontWeight: '600' },
  loginLink: { fontSize: 14, fontWeight: '900', color: '#3b82f6' },

  securityNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', opacity: 0.6 },
  securityText: { fontSize: 11, fontWeight: '700', color: Colors.muted },
});

export default RegisterScreen;
