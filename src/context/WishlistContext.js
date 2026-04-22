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
  const isFetching = React.useRef(false);
  const lastFetchedToken = React.useRef(null);

  useEffect(() => {
    if (isLoggedIn && auth?.token) {
      // Only fetch if NOT already fetching and token has changed or not yet fetched
      if (!isFetching.current && lastFetchedToken.current !== auth.token) {
        fetchWishlistFromApi();
      }
    } else if (!isLoggedIn) {
      loadWishlistFromStorage();
      lastFetchedToken.current = null;
    }
  }, [isLoggedIn, auth?.token]);

  const fetchWishlistFromApi = async () => {
    if (isFetching.current) return;
    isFetching.current = true;
    lastFetchedToken.current = auth.token;

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
    } finally {
      isFetching.current = false;
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
    if (isFetching.current) return false;
    isFetching.current = true;

    try {
      // 1. Update UI immediately (Optimistic UI)
      setWishlistItems([]);
      
      // 2. Clear storage (for guest users or as fallback)
      await saveWishlistToStorage([]);
      
      // 3. Sync with server if logged in
      if (isLoggedIn) {
        console.log('Syncing wishlist clear with server...');
        const response = await apiClient.post('/v1/wishlist/clear', {});
        console.log('Server response:', response.data);
        
        if (!response.data.success) {
          throw new Error(response.data.message || 'Server error');
        }

        // 4. Re-fetch to ensure absolute synchronization with DB
        // We do this AFTER the clear is confirmed by server
        isFetching.current = false; // Release lock for the fetch
        await fetchWishlistFromApi();
      }
      return true;
    } catch (error) {
      console.error('Error clearing wishlist:', error);
      // If it failed, re-fetch to restore UI state to match server
      isFetching.current = false;
      if (isLoggedIn) await fetchWishlistFromApi();
      throw error;
    } finally {
      isFetching.current = false;
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
