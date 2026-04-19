import * as React from 'react';
const { useState, useEffect } = React;
import {
  View, Text, StyleSheet, FlatList, Image,
  TouchableOpacity, StatusBar, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing } from '../styles/Theme';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { IMAGE_BASE_URL } from '../api/apiClient';
import { FontAwesome5 as Icon } from '@expo/vector-icons';

// 🛠️ HELPER
const getImageUrl = (path) => {
  if (!path) return 'https://via.placeholder.com/300';
  if (path.startsWith('http')) {
    return path.replace('127.0.0.1', IMAGE_BASE_URL.replace('http://', '').split(':')[0]);
  }
  let cleanPath = path.replace('public/', '');
  if (cleanPath.startsWith('images/') || cleanPath.startsWith('storage/')) {
    return `${IMAGE_BASE_URL}/${cleanPath}`;
  }
  return `${IMAGE_BASE_URL}/storage/${cleanPath}`;
};

const WishlistScreen = ({ navigation }) => {
  const { wishlistItems, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  const handleAddToCart = (item) => {
    addToCart({ ...item, sale_price: item.sale_price || item.price });
    removeFromWishlist(item.id);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('HomeTabs')} 
          style={styles.backBtn}
        >
          <Icon name="arrow-left" size={18} color={Colors.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Yêu thích ({wishlistItems.length})</Text>
        <View style={{ width: 44 }} />
      </View>

      {wishlistItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyCircle}>
            <Icon name="heart" size={40} color={Colors.secondary} />
          </View>
          <Text style={styles.emptyTitle}>Danh sách trống!</Text>
          <Text style={styles.emptySubtitle}>Hãy thêm những sản phẩm bạn yêu thích để dễ dàng theo dõi và mua sắm sau này.</Text>
          <TouchableOpacity style={styles.shopBtn} onPress={() => navigation.navigate('HomeTabs')}>
            <Text style={styles.shopBtnText}>KHÁM PHÁ CỬA HÀNG</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={wishlistItems}
          renderItem={({ item }) => (
            <TouchableOpacity 
                style={styles.card} 
                activeOpacity={0.9}
                onPress={() => navigation.navigate('ProductDetail', { product: item })}
            >
              <View style={styles.imageBox}>
                <Image source={{ uri: getImageUrl(item.image) }} style={styles.cardImage} resizeMode="contain" />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardCategory}>{item.category?.name || 'Sản phẩm'}</Text>
                <Text style={styles.cardName} numberOfLines={2}>{item.name}</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.salePrice}>{(item.sale_price || item.price).toLocaleString('vi-VN')}đ</Text>
                  {item.sale_price < item.price && (
                    <Text style={styles.oldPrice}>{item.price.toLocaleString('vi-VN')}đ</Text>
                  )}
                </View>
                <View style={styles.actionRow}>
                  <TouchableOpacity style={styles.cartBtn} onPress={() => handleAddToCart(item)}>
                    <Icon name="shopping-cart" size={12} color={Colors.white} style={{marginRight: 6}} />
                    <Text style={styles.cartBtnText}>THÊM GIỎ</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.removeBtn} onPress={() => removeFromWishlist(item.id)}>
                    <Icon name="trash-alt" size={16} color={Colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          )}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.m, paddingVertical: 12, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.03)' },
  backBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: Colors.dark, letterSpacing: -0.5 },

  listContent: { padding: Spacing.m },
  card: { flexDirection: 'row', backgroundColor: Colors.white, borderRadius: 24, padding: 12, marginBottom: Spacing.m, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 4, borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)' },
  imageBox: { width: 100, height: 100, borderRadius: 16, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  cardImage: { width: '80%', height: '80%' },
  cardInfo: { flex: 1, justifyContent: 'center' },
  cardCategory: { fontSize: 9, fontWeight: '800', color: Colors.secondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  cardName: { fontSize: 14, fontWeight: '700', color: Colors.primary, lineHeight: 20, marginBottom: 6 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  salePrice: { fontSize: 16, fontWeight: '900', color: Colors.primary },
  oldPrice: { fontSize: 11, color: Colors.muted, textDecorationLine: 'line-through' },
  actionRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  cartBtn: { flex: 1, backgroundColor: Colors.primary, height: 40, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  cartBtnText: { fontSize: 10, fontWeight: '900', color: Colors.white, letterSpacing: 0.5 },
  removeBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#fee2e2', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#fecaca' },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.xl },
  emptyCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: Colors.secondarySoft, justifyContent: 'center', alignItems: 'center', marginBottom: 25 },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '900', color: Colors.primary, marginBottom: 10 },
  emptySubtitle: { fontSize: 12, color: Colors.muted, textAlign: 'center', marginBottom: 30, lineHeight: 20 },
  shopBtn: { backgroundColor: Colors.primary, paddingHorizontal: 35, paddingVertical: 16, borderRadius: 50, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 8 },
  shopBtnText: { fontSize: 13, fontWeight: '900', color: Colors.white, letterSpacing: 1 },
});

export default WishlistScreen;
