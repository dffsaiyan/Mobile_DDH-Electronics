import React, { createContext, useState, useContext, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Platform, StatusBar } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';

const { width } = Dimensions.get('window');

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
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

  return (
    <NotificationContext.Provider value={{ showToast }}>
      {children}
      {toast.visible && (
        <Animated.View style={[
          styles.toastContainer, 
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
        ]}>
          <View style={styles.eliteToast}>
            <View style={[styles.iconContainer, { backgroundColor: toast.type === 'error' ? '#ef4444' : '#10b981' }]}>
              <Icon name={toast.type === 'error' ? "exclamation-circle" : "check"} size={14} color="#fff" />
            </View>
            <View style={styles.contentContainer}>
              <Text style={styles.headerText}>THÔNG BÁO</Text>
              <Text style={styles.messageText}>{toast.message}</Text>
            </View>
          </View>
        </Animated.View>
      )}
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
  }
});
