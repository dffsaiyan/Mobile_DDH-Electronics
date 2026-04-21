import * as React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import { WishlistProvider } from './src/context/WishlistContext';
import { NotificationProvider } from './src/context/NotificationContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <NotificationProvider>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <AppNavigator />
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </NotificationProvider>
    </SafeAreaProvider>
  );
}
