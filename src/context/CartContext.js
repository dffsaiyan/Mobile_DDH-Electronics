import * as React from 'react';
const { createContext, useState, useContext, useEffect } = React;
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/apiClient';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCart();
  }, [token]);

  const loadCart = async () => {
    setLoading(true);
    try {
      if (token) {
        try {
          // Fetch from API if logged in
          const response = await apiClient.get('/v1/cart');
          if (response.data.success) {
            setCartItems(response.data.data);
            setLoading(false);
            return;
          }
        } catch (apiError) {
          // If 401 (Unauthorized), just proceed to local storage
          if (apiError.response?.status !== 401) {
            console.error('API Cart Error:', apiError.message);
          }
        }
      }
      
      // Fallback to Local Storage
      const stored = await AsyncStorage.getItem('cart_items');
      if (stored) {
        setCartItems(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveLocalCart = async (items) => {
    try {
      await AsyncStorage.setItem('cart_items', JSON.stringify(items));
    } catch (error) {
      console.error('Error saving local cart:', error);
    }
  };

  const refreshCart = () => loadCart();

  const addToCart = async (product, quantity = 1) => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        const res = await apiClient.post('/v1/cart', { product_id: product.id, quantity });
        if (res.data.success) {
          setCartItems(res.data.data);
          return;
        }
      }

      // Local logic
      setCartItems(prev => {
        const existing = prev.find(item => item.id === product.id);
        let newItems;
        if (existing) {
          newItems = prev.map(item =>
            item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
          );
        } else {
          newItems = [...prev, {
            id: product.id,
            name: product.name,
            price: product.sale_price || product.price,
            image: product.image,
            stock: product.stock,
            quantity,
            slug: product.slug
          }];
        }
        saveLocalCart(newItems);
        return newItems;
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const removeFromCart = async (productId) => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        const res = await apiClient.delete(`/v1/cart/${productId}`);
        if (res.data.success) {
          setCartItems(res.data.data);
          return;
        }
      }

      setCartItems(prev => {
        const newItems = prev.filter(item => item.id !== productId);
        saveLocalCart(newItems);
        return newItems;
      });
    } catch (error) {
      console.error('Error removing from cart:', error);
    }
  };

  const increaseQuantity = async (productId) => {
    const item = cartItems.find(i => i.id === productId);
    if (!item) return;
    
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        const res = await apiClient.put('/v1/cart', { product_id: productId, quantity: item.quantity + 1 });
        if (res.data.success) {
          setCartItems(res.data.data);
          return;
        }
      }

      setCartItems(prev => {
        const newItems = prev.map(i => i.id === productId ? { ...i, quantity: i.quantity + 1 } : i);
        saveLocalCart(newItems);
        return newItems;
      });
    } catch (error) {
      console.error('Error increasing qty:', error);
    }
  };

  const decreaseQuantity = async (productId) => {
    const item = cartItems.find(i => i.id === productId);
    if (!item || item.quantity <= 1) return;

    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        const res = await apiClient.put('/v1/cart', { product_id: productId, quantity: item.quantity - 1 });
        if (res.data.success) {
          setCartItems(res.data.data);
          return;
        }
      }

      setCartItems(prev => {
        const newItems = prev.map(i => i.id === productId ? { ...i, quantity: i.quantity - 1 } : i);
        saveLocalCart(newItems);
        return newItems;
      });
    } catch (error) {
      console.error('Error decreasing qty:', error);
    }
  };

  const clearCart = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        await apiClient.delete('/v1/cart/clear');
      }
      setCartItems([]);
      await AsyncStorage.removeItem('cart_items');
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cartItems, loading,
      totalItems, totalPrice,
      addToCart, removeFromCart,
      increaseQuantity, decreaseQuantity, clearCart,
      refreshCart
    }}>
      {children}
    </CartContext.Provider>
  );
};
