import * as React from 'react';
import { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, StatusBar, Alert, ActivityIndicator, Image,
  KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Shadow } from '../styles/Theme';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { FontAwesome5 as Icon } from '@expo/vector-icons';
import { IMAGE_BASE_URL, getUserAvatar } from '../api/apiClient';
import { Modal, FlatList } from 'react-native';

// 🛠️ HELPERS
const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) {
    return path.replace('127.0.0.1', IMAGE_BASE_URL.replace('http://', '').split(':')[0]);
  }
  return `${IMAGE_BASE_URL}/${path.replace('public/', '')}`;
};

const ProfileEditScreen = ({ navigation }) => {
  const { user, updateProfile } = useAuth();
  const { showToast } = useNotification();
  const [name, setName] = useState((user?.name || '').replace(/\+/g, ' '));
  const [phone, setPhone] = useState((user?.phone || '').replace(/\+/g, ' '));
  
  // Address Dropdown States
  const [showCityModal, setShowCityModal] = useState(false);
  const CITIES = ['Hà Nội', 'TP. Hồ Chí Minh', 'Lạng Sơn', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ'];
  
  // Parse existing address
  const initialAddress = (user?.address || '').replace(/\+/g, ' ');
  const addressParts = initialAddress.split(', ');
  const [address, setAddress] = useState(addressParts.length > 1 ? addressParts[0] : initialAddress);
  const [selectedCity, setSelectedCity] = useState(addressParts.length > 1 ? addressParts[1] : 'Lạng Sơn');
  
  const [loading, setLoading] = useState(false);

  // Password States (Moved from Account)
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      showToast('Tên không được để trống bạn nhé!', 'warning');
      return;
    }
    setLoading(true);
    // Combine full address
    const fullAddress = `${address}, ${selectedCity}`;
    const result = await updateProfile({ 
      name, 
      phone, 
      address: fullAddress,
      old_password: oldPassword,
      password: newPassword
    });
    setLoading(false);
    if (result.success) {
      showToast('Hồ sơ DDH Elite đã được cập nhật thành công!', 'success');
      setOldPassword('');
      setNewPassword('');
      setTimeout(() => {
        navigation.navigate('HomeTabs', { screen: 'Account' });
      }, 1500);
    } else {
      showToast(result.message || 'Cập nhật thất bại', 'error');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      
      {/* Fixed Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.navigate('HomeTabs', { screen: 'Account' })} 
          style={styles.backBtn}
        >
          <Icon name="arrow-left" size={16} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Thiết Lập Hồ Sơ</Text>
        <Text style={styles.subtitle}>Cập nhật thông tin định danh DDH Elite</Text>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Premium Avatar Section */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
                <View style={styles.avatarRingOuter}>
                  <Image 
                    source={{ uri: getUserAvatar(user) }} 
                    style={styles.avatarImage} 
                  />
                </View>
                <TouchableOpacity style={styles.cameraBtn} activeOpacity={0.8}>
                  <Icon name="camera" size={12} color={Colors.white} />
                </TouchableOpacity>
            </View>
            <Text style={styles.changeText}>Nhấn để đổi ảnh đại diện</Text>
          </View>

          {/* Elite Form */}
          <View style={styles.formSection}>
            {[
              { label: 'HỌ VÀ TÊN', icon: 'user', value: name, setter: setName, placeholder: 'Nhập tên đầy đủ' },
              { label: 'ĐỊA CHỈ EMAIL (Cố định)', icon: 'envelope', value: user?.email || '', setter: null, placeholder: '', editable: false },
              { label: 'SỐ ĐIỆN THOẠI', icon: 'phone', value: phone, setter: setPhone, placeholder: '09xx xxx xxx', keyboard: 'phone-pad' },
            ].map((field, index) => (
              <View key={index} style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{field.label}</Text>
                  <View style={[styles.inputWrapper, field.editable === false && styles.inputDisabled]}>
                  <Icon name={field.icon} size={14} color={Colors.muted} style={styles.fieldIcon} />
                  <TextInput
                      style={[styles.input, field.editable === false && { color: Colors.muted }]}
                      placeholder={field.placeholder}
                      placeholderTextColor="rgba(15, 23, 42, 0.3)"
                      value={field.value}
                      onChangeText={field.setter}
                      editable={field.editable !== false}
                      keyboardType={field.keyboard || 'default'}
                  />
                  </View>
              </View>
            ))}

            {/* Address Dropdown */}
            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>TỈNH / THÀNH PHỐ</Text>
                <TouchableOpacity 
                  style={styles.inputWrapper} 
                  onPress={() => setShowCityModal(true)}
                >
                  <Icon name="city" size={14} color={Colors.muted} style={styles.fieldIcon} />
                  <Text style={styles.input}>{selectedCity}</Text>
                  <Icon name="chevron-down" size={12} color={Colors.muted} />
                </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>ĐỊA CHỈ CHI TIẾT</Text>
                <View style={styles.inputWrapper}>
                <Icon name="map-marker-alt" size={14} color={Colors.muted} style={styles.fieldIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="Số nhà, tên đường..."
                    placeholderTextColor="rgba(15, 23, 42, 0.3)"
                    value={address}
                    onChangeText={setAddress}
                />
                </View>
            </View>

            {/* Password Section (Moved from Account) */}
            <View style={{marginTop: 20, marginBottom: 10}}>
              <Text style={[styles.inputLabel, {color: Colors.secondary}]}>BẢO MẬT & ĐỔI MẬT KHẨU</Text>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>MẬT KHẨU HIỆN TẠI</Text>
                <View style={styles.inputWrapper}>
                  <Icon name="lock" size={14} color={Colors.muted} style={styles.fieldIcon} />
                  <TextInput
                      style={styles.input}
                      placeholder="Nhập mật khẩu cũ"
                      secureTextEntry={!showOldPassword}
                      value={oldPassword}
                      onChangeText={setOldPassword}
                  />
                  <TouchableOpacity onPress={() => setShowOldPassword(!showOldPassword)}>
                    <Icon name={showOldPassword ? "eye" : "eye-slash"} size={14} color={Colors.muted} />
                  </TouchableOpacity>
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>MẬT KHẨU MỚI</Text>
                <View style={styles.inputWrapper}>
                  <Icon name="key" size={14} color={Colors.muted} style={styles.fieldIcon} />
                  <TextInput
                      style={styles.input}
                      placeholder="Nhập mật khẩu mới"
                      secureTextEntry={!showNewPassword}
                      value={newPassword}
                      onChangeText={setNewPassword}
                  />
                  <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                    <Icon name={showNewPassword ? "eye" : "eye-slash"} size={14} color={Colors.muted} />
                  </TouchableOpacity>
                </View>
            </View>
        </View>

        {/* City Picker Modal */}
        <Modal visible={showCityModal} transparent animationType="slide">
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Chọn Tỉnh / Thành phố</Text>
              <FlatList
                data={CITIES}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.cityItem} 
                    onPress={() => {
                      setSelectedCity(item);
                      setShowCityModal(false);
                    }}
                  >
                    <Text style={[styles.cityText, selectedCity === item && { color: Colors.secondary }]}>{item}</Text>
                    {selectedCity === item && <Icon name="check" size={14} color={Colors.secondary} />}
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity style={styles.closeModal} onPress={() => setShowCityModal(false)}>
                <Text style={styles.closeModalText}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <TouchableOpacity
          style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <>
              <Icon name="check-circle" size={16} color={Colors.white} style={{marginRight: 10}} />
              <Text style={styles.saveBtnText}>LƯU THAY ĐỔI</Text>
            </>
          )}
        </TouchableOpacity>
        
        <View style={styles.footerNote}>
            <Icon name="info-circle" size={12} color={Colors.muted} style={{marginRight: 8}} />
            <Text style={styles.footerNoteText}>Thông tin này giúp chúng tôi phục vụ bạn tốt hơn</Text>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  scrollContent: { paddingHorizontal: 30, paddingBottom: 50 },

  header: { paddingTop: 10, paddingBottom: 25, paddingHorizontal: 30 },
  backBtn: { 
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#f1f5f9', 
    justifyContent: 'center', alignItems: 'center', marginBottom: 20, 
    borderWidth: 1, borderColor: '#e2e8f0' 
  },
  title: { fontSize: 26, fontWeight: '900', color: Colors.primary, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: Colors.muted, fontWeight: '600', marginTop: 4 },

  avatarSection: { alignItems: 'center', marginBottom: 35 },
  avatarContainer: { position: 'relative' },
  avatarRingOuter: { 
    width: 110, height: 110, borderRadius: 55, borderWidth: 3, 
    borderColor: '#f1f5f9', padding: 4, ...Shadow.medium, backgroundColor: '#fff' 
  },
  avatarImage: { width: '100%', height: '100%', borderRadius: 50, resizeMode: 'cover' },
  avatarPlaceholder: { 
    width: '100%', height: '100%', borderRadius: 50, 
    backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' 
  },
  avatarText: { fontSize: 44, fontWeight: '900', color: Colors.white },
  cameraBtn: { 
    position: 'absolute', bottom: 0, right: 0, 
    backgroundColor: Colors.secondary, width: 34, height: 34, 
    borderRadius: 17, justifyContent: 'center', alignItems: 'center', 
    borderWidth: 3, borderColor: '#fff' 
  },
  changeText: { fontSize: 12, fontWeight: '700', color: Colors.secondary, marginTop: 15 },

  formSection: { marginBottom: 20 },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 11, fontWeight: '900', color: Colors.muted, letterSpacing: 1, marginBottom: 8 },
  inputWrapper: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', 
    borderRadius: 16, paddingHorizontal: 16, height: 56, 
    borderWidth: 1, borderColor: '#e2e8f0' 
  },
  inputDisabled: { backgroundColor: '#f8fafc', opacity: 0.7 },
  fieldIcon: { marginRight: 12, opacity: 0.6 },
  input: { flex: 1, fontSize: 14, fontWeight: '700', color: Colors.primary },

  saveBtn: { 
    backgroundColor: Colors.primary, height: 58, borderRadius: 29, 
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', 
    marginTop: 15, ...Shadow.medium 
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { fontSize: 14, fontWeight: '900', color: Colors.white, letterSpacing: 1 },

  footerNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 30, opacity: 0.5 },
  footerNoteText: { fontSize: 11, fontWeight: '700', color: Colors.muted },

  // Modal Styles
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 30, maxHeight: '60%' },
  modalTitle: { fontSize: 18, fontWeight: '900', color: Colors.primary, marginBottom: 20, textAlign: 'center' },
  cityItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  cityText: { fontSize: 15, fontWeight: '700', color: Colors.primary },
  closeModal: { marginTop: 20, backgroundColor: '#f1f5f9', paddingVertical: 15, borderRadius: 15, alignItems: 'center' },
  closeModalText: { fontSize: 14, fontWeight: '900', color: Colors.muted },
});

export default ProfileEditScreen;
