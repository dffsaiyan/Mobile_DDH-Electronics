import * as React from 'react';
const { createContext, useState, useContext, useEffect } = React;
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/apiClient';

import { AuthContext } from './AuthContext';

const WishlistContext = createContext();

export const useWishlist = () => useContext(WishlistContext);

export const WishlistProvider = ({ children }) => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const auth = useContext(AuthContext);
  const isLoggedIn = auth ? auth.isLoggedIn : false;

  useEffect(() => {
    if (isLoggedIn && auth?.token) {
      fetchWishlistFromApi();
    } else if (!isLoggedIn) {
      loadWishlistFromStorage();
    }
  }, [isLoggedIn, auth?.token]);

  const fetchWishlistFromApi = async () => {
    try {
      const response = await apiClient.get('/v1/wishlist');
      if (response.data.success) {
        // Handle different API response structures (array or object with data property)
        const items = Array.isArray(response.data.data) ? response.data.data : (response.data.data?.data || []);
        setWishlistItems(items);
      }
    } catch (error) {
      if (error.response?.status !== 401) {
        console.error('Error fetching wishlist from API:', error.response?.status || error.message);
      }
    }
  };

  const loadWishlistFromStorage = async () => {
    try {
      const stored = await AsyncStorage.getItem('wishlist_items');
      if (stored) setWishlistItems(JSON.parse(stored));
    } catch (error) {
      console.error('Error loading wishlist:', error);
    }
  };

  const saveWishlistToStorage = async (items) => {
    try {
      await AsyncStorage.setItem('wishlist_items', JSON.stringify(items));
    } catch (error) {
      console.error('Error saving wishlist:', error);
    }
  };

  const toggleWishlist = async (product) => {
    const exists = wishlistItems.find(item => item.id === product.id);
    
    // Update UI immediately (Optimistic UI)
    let newItems;
    if (exists) {
      newItems = wishlistItems.filter(item => item.id !== product.id);
    } else {
      newItems = [...wishlistItems, product];
    }
    setWishlistItems(newItems);
    if (!isLoggedIn) saveWishlistToStorage(newItems);

    // Call API if logged in
    if (isLoggedIn) {
      try {
        await apiClient.post(`/v1/wishlist/toggle/${product.id}`);
      } catch (error) {
        console.error('Error toggling wishlist on API:', error);
        // Fallback if API fails? Maybe revert state
      }
    }
  };

  const isInWishlist = (productId) => {
    return wishlistItems.some(item => item.id === productId);
  };

  const removeFromWishlist = async (productId) => {
    const newItems = wishlistItems.filter(item => item.id !== productId);
    setWishlistItems(newItems);
    if (!isLoggedIn) saveWishlistToStorage(newItems);

    if (isLoggedIn) {
      try {
        await apiClient.post(`/v1/wishlist/toggle/${productId}`);
      } catch (error) {
        console.error('Error removing from wishlist on API:', error);
      }
    }
  };

  const clearWishlist = async () => {
    const itemsToClear = [...wishlistItems];
    setWishlistItems([]);
    
    if (!isLoggedIn) {
      await saveWishlistToStorage([]);
    } else {
      // Vì API không có endpoint /clear (404), ta sẽ lặp qua từng item để xóa
      try {
        for (const item of itemsToClear) {
          await apiClient.post(`/v1/wishlist/toggle/${item.id}`);
        }
      } catch (error) {
        console.error('Error clearing wishlist items one by one:', error);
      }
    }
  };

  return (
    <WishlistContext.Provider value={{
      wishlistItems,
      toggleWishlist, 
      isInWishlist, 
      removeFromWishlist,
      clearWishlist,
      refreshWishlist: fetchWishlistFromApi,
      wishlistCount: wishlistItems.length,
    }}>
      {children}
    </WishlistContext.Provider>
  );
};
