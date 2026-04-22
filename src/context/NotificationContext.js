import React, { createContext, useState, useContext, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Platform, StatusBar, Modal, TouchableOpacity } from 'react-native';
import { FontAwesome5 as Icon } from '@expo/vector-icons';

import { Colors } from '../styles/Theme';

const { width, height } = Dimensions.get('window');

const NotificationContext = createContext({
  showToast: () => {},
  showConfirm: () => {}
});

export const NotificationProvider = ({ children }) => {
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [confirm, setConfirm] = useState({ 
    visible: false, 
    title: '', 
    message: '', 
    onConfirm: null, 
    confirmText: 'Xác nhận', 
    cancelText: 'Hủy',
    type: 'info' 
  });
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;

  const showToast = useCallback((message, type = 'success') => {
    setToast({ visible: true, message, type });
    
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 40, duration: 400, useNativeDriver: true }),
    ]).start();

    // Auto hide after 4 seconds
    setTimeout(() => {
      hideToast();
    }, 4000);
  }, []);

  const hideToast = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -100, duration: 300, useNativeDriver: true }),
    ]).start(() => {
      setToast({ visible: false, message: '', type: 'success' });
    });
  }, []);

  const showConfirm = useCallback(({ title, message, onConfirm, confirmText = 'Xác nhận', cancelText = 'Hủy', type = 'info' }) => {
    setConfirm({ visible: true, title, message, onConfirm, confirmText, cancelText, type });
  }, []);

  const hideConfirm = () => {
    setConfirm(prev => ({ ...prev, visible: false }));
  };

  const handleConfirm = useCallback(() => {
    const action = confirm.onConfirm;
    hideConfirm();
    if (typeof action === 'function') {
      action();
    }
  }, [confirm.onConfirm]);

  const getConfirmTheme = () => {
    switch (confirm.type) {
      case 'danger': return { icon: 'exclamation-triangle', color: Colors.danger };
      case 'logout': return { icon: 'sign-out-alt', color: Colors.danger };
      case 'warning': return { icon: 'exclamation-circle', color: Colors.warning };
      default: return { icon: 'question-circle', color: Colors.accent };
    }
  };

  const theme = getConfirmTheme();

  return (
    <NotificationContext.Provider value={{ showToast, showConfirm }}>
      {children}
      
      {/* --- ELITE TOAST --- */}
      {toast.visible && (
        <Animated.View style={[
          styles.toastContainer, 
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
        ]}>
          <View style={styles.eliteToast}>
            <View style={[styles.iconContainer, { backgroundColor: toast.type === 'error' ? Colors.danger : Colors.success }]}>
              <Icon name={toast.type === 'error' ? "exclamation-circle" : "check"} size={14} color="#fff" solid />
            </View>
            <View style={styles.contentContainer}>
              <Text style={styles.headerText}>THÔNG BÁO</Text>
              <Text style={styles.messageText}>{toast.message}</Text>
            </View>
          </View>
        </Animated.View>
      )}

      {/* --- ELITE CONFIRM MODAL --- */}
      <Modal
        visible={confirm.visible}
        transparent
        animationType="fade"
        onRequestClose={hideConfirm}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.eliteConfirmCard}>
            <View style={[styles.confirmIconWrap, { borderColor: theme.color + '20' }]}>
              <Icon name={theme.icon} size={30} color={theme.color} solid />
            </View>
            
            <Text style={styles.confirmTitle}>{confirm.title}</Text>
            <Text style={styles.confirmMessage}>{confirm.message}</Text>
            
            <View style={styles.confirmActions}>
              <TouchableOpacity 
                style={[styles.confirmBtn, styles.cancelBtn]} 
                onPress={hideConfirm}
              >
                <Text style={styles.cancelBtnText}>{confirm.cancelText}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.confirmBtn, { backgroundColor: Colors.primary }]} 
                onPress={handleConfirm}
              >
                <Text style={styles.actionBtnText}>{confirm.confirmText}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 20) + 10,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10000,
  },
  eliteToast: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    width: width * 0.9,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  contentContainer: {
    flex: 1,
  },
  headerText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 2,
    letterSpacing: 1,
  },
  messageText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#fff',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  eliteConfirmCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 25,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 25
  },
  confirmIconWrap: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 10,
    textAlign: 'center'
  },
  confirmMessage: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 25,
    paddingHorizontal: 10
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%'
  },
  confirmBtn: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center'
  },
  cancelBtn: {
    backgroundColor: '#f1f5f9',
  },
  cancelBtnText: {
    fontWeight: '900',
    color: '#64748b',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  actionBtn: {
    backgroundColor: '#0f172a',
  },
  actionBtnText: {
    fontWeight: '900',
    color: '#fff',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  }
});
