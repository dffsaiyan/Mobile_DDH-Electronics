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
    if (isLoggedIn) {
      fetchWishlistFromApi();
    } else {
      loadWishlistFromStorage();
    }
  }, [isLoggedIn]);

  const fetchWishlistFromApi = async () => {
    try {
      const response = await apiClient.get('/v1/wishlist');
      if (response.data.success) {
        setWishlistItems(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching wishlist from API:', error.response?.status || error.message);
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

  return (
    <WishlistContext.Provider value={{
      wishlistItems,
      toggleWishlist, isInWishlist, removeFromWishlist,
      wishlistCount: wishlistItems.length,
    }}>
      {children}
    </WishlistContext.Provider>
  );
};
