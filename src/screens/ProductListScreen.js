import * as React from 'react';
const { useState, useEffect } = React;
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing } from '../styles/Theme';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useNotification } from '../context/NotificationContext';
import { useNavigation } from '@react-navigation/native';
import apiClient, { IMAGE_BASE_URL } from '../api/apiClient';
import { FontAwesome5 as Icon } from '@expo/vector-icons';


const { width } = Dimensions.get('window');

// 🏷️ CATEGORY CHIP COMPONENT
const CategoryChip = ({ label, isActive, onPress, id, isFlash }) => (
  <TouchableOpacity
    onPress={() => onPress(id)}
    style={[styles.categoryChip, isActive && styles.categoryChipActive]}
    activeOpacity={0.7}
  >
    <Text style={[styles.categoryText, isActive && styles.categoryTextActive, isFlash && { color: isActive ? '#fff' : '#ef4444' }]}>
      {label}
    </Text>
  </TouchableOpacity>
);

// 🛠️ HELPERS
const getImageUrl = (path) => {
  if (!path) return 'https://via.placeholder.com/300';
  if (path.startsWith('http')) {
    return path.replace('127.0.0.1', IMAGE_BASE_URL.replace('http://', '').split(':')[0]);
  }
  
  const baseUrl = IMAGE_BASE_URL;
  let cleanPath = path.replace('public/', '');
  
  if (cleanPath.startsWith('images/')) {
    return `${baseUrl}/${cleanPath}`;
  }
  
  if (cleanPath.startsWith('storage/')) {
    return `${baseUrl}/${cleanPath}`;
  }
  
  return `${baseUrl}/storage/${cleanPath}`;
};

const formatPrice = (price) => {
  return Math.round(price).toLocaleString('vi-VN') + ' VNĐ';
};

// 🃏 PRODUCT CARD COMPONENT
const ProductCard = ({ item }) => {
  const navigation = useNavigation();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { showToast } = useNotification();
  
  const hasDiscount = item.is_flash_sale && item.sale_price > 0 && item.sale_price < item.price;

  return (
    <View style={styles.card}>
      <TouchableOpacity 
        style={styles.imageContainer} 
        activeOpacity={0.9}
        onPress={() => navigation.navigate('ProductDetail', { product: item })}
      >
        <Image source={{ uri: getImageUrl(item.image) }} style={styles.productImage} resizeMode="contain" />
        <TouchableOpacity 
          style={[styles.cardWishBtn, isInWishlist(item.id) && {backgroundColor: Colors.secondarySoft}]} 
          onPress={() => {
            toggleWishlist(item);
            showToast(isInWishlist(item.id) ? 'Đã xóa khỏi danh sách yêu thích' : 'Đã thêm vào danh sách yêu thích', 'info');
          }}
        >
          <Icon name="heart" size={14} color={isInWishlist(item.id) ? Colors.secondary : Colors.muted} solid={isInWishlist(item.id)} />
        </TouchableOpacity>
      </TouchableOpacity>

      <View style={styles.infoContainer}>
        <Text style={styles.categoryLabel}>{item.category?.name || 'ELITE'}</Text>
        <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
        
        <View style={styles.priceRow}>
          <Text style={styles.salePrice}>{formatPrice(hasDiscount ? item.sale_price : item.price)}</Text>
          {hasDiscount && (
            <Text style={styles.originalPrice}>{formatPrice(item.price)}</Text>
          )}
        </View>

        {item.is_flash_sale && (
          <View style={styles.stockRow}>
            <View style={styles.stockTextRow}>
              <Text style={styles.stockText}>Đã bán: <Text style={{fontWeight: '900'}}>{item.sold_count || 0}</Text></Text>
              <Text style={styles.stockText}>Còn: <Text style={{fontWeight: '900'}}>{item.stock || 0}</Text></Text>
            </View>
            <View style={styles.stockBar}>
              <View style={[styles.stockFill, { width: `${(Number(item.sold_count) || 0) / ((Number(item.sold_count) || 0) + (Number(item.stock) || 0)) * 100}%` }]} />
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.cardActions}>
          <View style={styles.cardActionRow}>
            <TouchableOpacity style={styles.btnSecondary} onPress={() => navigation.navigate('ProductDetail', { product: item })}>
              <Icon name="eye" size={10} color={Colors.primary} />
              <Text style={styles.btnSecondaryText}>Chi tiết</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnSecondary} onPress={() => { addToCart(item); showToast('Đã thêm vào giỏ hàng!', 'success'); }}>
              <Icon name="cart-plus" size={10} color={Colors.primary} />
              <Text style={styles.btnSecondaryText}>+ Giỏ</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity 
            style={[styles.btnBuy, { backgroundColor: item.is_flash_sale ? Colors.secondary : Colors.primary }]} 
            onPress={() => { addToCart(item); navigation.navigate('Cart'); }}
          >
            <Text style={styles.btnBuyText}>Mua Ngay</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// 📱 MAIN SCREEN
const ProductListScreen = ({ route, navigation }) => {
  const initialCategoryId = route?.params?.categoryId || null;
  const initialSearch = route?.params?.search || '';
  const initialFlashSale = route?.params?.flash_sale || 0;

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([{ id: null, name: 'Tất cả' }]);
  const [activeCategory, setActiveCategory] = useState(initialCategoryId);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [isFlashSale, setIsFlashSale] = useState(initialFlashSale);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isMoreLoading, setIsMoreLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  // 🔄 UPDATE SEARCH WHEN PARAMS CHANGE (From Home)
  useEffect(() => {
    if (route?.params?.search !== undefined) {
      const term = route.params.search;
      // Try to find matching category first
      const match = categories.find(c => c.name.toLowerCase() === term.toLowerCase());
      if (match) {
        setActiveCategory(match.id);
        setSearchQuery('');
        setIsFlashSale(0);
      } else {
        setSearchQuery(term);
        setActiveCategory(null);
        setIsFlashSale(0);
      }
    }
    if (route?.params?.categoryId !== undefined) {
      setActiveCategory(route.params.categoryId);
      setSearchQuery('');
      setIsFlashSale(0);
    }
    if (route?.params?.flash_sale !== undefined) {
      setIsFlashSale(route.params.flash_sale);
      setActiveCategory(null);
      setSearchQuery('');
    }
  }, [route?.params, categories]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setPage(1);
      setProducts([]);
      setHasMore(true);
      fetchProducts(1);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [activeCategory, searchQuery, isFlashSale]);

  const fetchCategories = async () => {
    try {
      const response = await apiClient.get('/v1/categories');
      if (response.data.success) {
        let cats = [{ id: null, name: 'Tất cả' }];
        
        // Insert Flash Sale if active
        if (response.data.is_flash_active) {
          cats.push({ id: 'flash', name: 'Flash Sale 🔥', is_flash: true });
        }

        cats = [...cats, ...response.data.data];
        setCategories(cats);
        
        // If there's an initial search, try to match it with a category
        if (initialSearch) {
          const match = cats.find(c => c.name.toLowerCase() === initialSearch.toLowerCase());
          if (match) {
            setActiveCategory(match.id);
            setSearchQuery(''); 
          }
        }
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async (appPage = 1) => {
    setLoading(true);
    try {
      const response = await apiClient.get('/v1/products', {
        params: {
          category_id: activeCategory,
          search: searchQuery,
          flash_sale: isFlashSale,
          page: appPage,
          per_page: 6
        }
      });

      if (response.data.success) {
        setProducts(response.data.data.data || []);
        setTotal(response.data.data.total || 0);
      } else {
        setProducts([]);
        setTotal(0);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(total / 6);

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    let pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <TouchableOpacity 
          key={i} 
          style={[styles.pageBtn, page === i && styles.pageBtnActive]}
          onPress={() => {
            setPage(i);
            fetchProducts(i);
          }}
        >
          <Text style={[styles.pageText, page === i && styles.pageTextActive]}>{i}</Text>
        </TouchableOpacity>
      );
    }
    return (
      <View style={styles.paginationRow}>
        <TouchableOpacity 
          disabled={page === 1} 
          onPress={() => { setPage(page-1); fetchProducts(page-1); }}
          style={[styles.navBtn, page === 1 && {opacity: 0.5}]}
        >
          <Icon name="chevron-left" size={14} color={Colors.primary} />
        </TouchableOpacity>
        
        {pages}

        <TouchableOpacity 
          disabled={page === totalPages} 
          onPress={() => { setPage(page+1); fetchProducts(page+1); }}
          style={[styles.navBtn, page === totalPages && {opacity: 0.5}]}
        >
          <Icon name="chevron-right" size={14} color={Colors.primary} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.header}>
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
          {navigation.canGoBack() && (
            <TouchableOpacity 
              onPress={() => navigation.goBack()} 
              style={styles.backBtn}
            >
              <Icon name="arrow-left" size={18} color={Colors.dark} />
            </TouchableOpacity>
          )}
          <View>
            <Text style={styles.headerTitle}>Sản phẩm</Text>
            <Text style={styles.headerSubtitle}>
              Tổng cộng: <Text style={styles.headerCount}>{total}</Text> sản phẩm
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Icon name="search" size={14} color={Colors.muted} style={{marginRight: 10}} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm sản phẩm..."
            placeholderTextColor={Colors.muted}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              if (text.length > 0) {
                setActiveCategory(null);
                setIsFlashSale(0);
              }
            }}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="times-circle" size={16} color={Colors.muted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.categoryContainer}>
        <View style={styles.categoryGrid}>
          {categories.map((cat) => (
            <CategoryChip
              key={cat.id ?? 'all'}
              label={cat.name}
              isActive={
                (cat.id === null && activeCategory === null && isFlashSale === 0 && searchQuery === '') || 
                (cat.id === activeCategory && isFlashSale === 0) ||
                (cat.is_flash && isFlashSale === 1)
              }
              onPress={(id) => {
                if (id === 'flash') {
                  setIsFlashSale(1);
                  setActiveCategory(null);
                  setSearchQuery('');
                } else {
                  setIsFlashSale(0);
                  setActiveCategory(id);
                  setSearchQuery('');
                }
                setPage(1);
              }}
              id={cat.is_flash ? 'flash' : cat.id}
              isFlash={cat.is_flash}
            />
          ))}
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="box-open" size={60} color={Colors.border} style={{marginBottom: 20}} />
          <Text style={styles.emptyTitle}>Không tìm thấy sản phẩm</Text>
          <Text style={styles.emptySubtitle}>Thử thay đổi bộ lọc hoặc từ khóa</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={({ item }) => (
            <ProductCard item={item} />
          )}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          numColumns={2}
          columnWrapperStyle={styles.row}
          ListFooterComponent={renderPagination}
        />
      )}
    </SafeAreaView>
  );
};

const CARD_WIDTH = (width - Spacing.m * 3) / 2;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light },
  header: { paddingHorizontal: Spacing.m, paddingTop: Spacing.m, paddingBottom: Spacing.s, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.03)' },
  backBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: Colors.dark, letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 11, color: Colors.muted, marginTop: 2 },
  headerCount: { fontWeight: '800', color: Colors.secondary },
  searchContainer: { paddingHorizontal: Spacing.m, paddingVertical: Spacing.s, backgroundColor: Colors.white },
  searchInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.input, borderRadius: 16, paddingHorizontal: Spacing.m, height: 48, borderWidth: 1, borderColor: Colors.border },
  searchIcon: { fontSize: 16, marginRight: Spacing.s },
  searchInput: { flex: 1, fontSize: 13, fontWeight: '600', color: Colors.dark },
  clearIcon: { fontSize: 16, color: Colors.muted, paddingLeft: Spacing.s },
  categoryContainer: { backgroundColor: Colors.white, paddingBottom: Spacing.m, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.03)' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.m, gap: 6 },
  categoryChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: '#f1f5f9', marginBottom: 4 },
  categoryChipActive: { backgroundColor: Colors.secondary, borderColor: Colors.secondary },
  categoryText: { fontSize: 10, fontWeight: '700', color: '#64748b' },
  categoryTextActive: { color: Colors.white },
  listContent: { padding: Spacing.m, paddingBottom: 120 },
  row: { justifyContent: 'space-between', marginBottom: Spacing.m },
  card: { width: CARD_WIDTH, backgroundColor: Colors.white, borderRadius: 24, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 4, borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)' },
  imageContainer: { width: '100%', height: CARD_WIDTH * 0.85, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center' },
  productImage: { width: '75%', height: '75%' },
  cardWishBtn: { position: 'absolute', bottom: 10, right: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.white, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  discountBadge: { position: 'absolute', top: 10, left: 10, backgroundColor: Colors.secondary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, zIndex: 10 },
  discountBadgeText: { fontSize: 9, fontWeight: '900', color: Colors.white },
  
  infoContainer: { padding: 14, minHeight: 165 },
  categoryLabel: { fontSize: 8, fontWeight: '800', color: Colors.secondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  productName: { fontSize: 12, fontWeight: '700', color: Colors.primary, lineHeight: 16, marginBottom: 6, minHeight: 32 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8, flexWrap: 'wrap' },
  salePrice: { fontSize: 13, fontWeight: '900', color: Colors.primary },
  originalPrice: { fontSize: 10, color: Colors.muted, textDecorationLine: 'line-through' },
  
  stockRow: { marginTop: 4, marginBottom: 8 },
  stockTextRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  stockBar: { height: 6, backgroundColor: Colors.input, borderRadius: 3, overflow: 'hidden' },
  stockFill: { height: '100%', backgroundColor: Colors.secondary, borderRadius: 3 },
  stockText: { fontSize: 9, fontWeight: '700', color: Colors.muted },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.xl },
  emptyIcon: { fontSize: 60, marginBottom: Spacing.m },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: Colors.dark, marginBottom: Spacing.xs },
  emptySubtitle: { fontSize: 12, color: Colors.muted, textAlign: 'center' },

  paginationRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, paddingVertical: 30 },
  pageBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.white, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  pageBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  pageText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  pageTextActive: { color: Colors.white },
  navBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },

  // Action Buttons
  cardActions: { marginTop: 4, gap: 8 },
  cardActionRow: { flexDirection: 'row', gap: 6 },
  btnSecondary: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: '#f1f5f9', paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  btnSecondaryText: { fontSize: 9, fontWeight: '800', color: Colors.primary },
  btnBuy: { backgroundColor: Colors.secondary, paddingVertical: 10, borderRadius: 12, alignItems: 'center', shadowColor: Colors.secondary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3 },
  btnBuyText: { color: Colors.white, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
});

export default ProductListScreen;
