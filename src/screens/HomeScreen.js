import * as React from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, StatusBar, 
  Dimensions, ActivityIndicator, TextInput, Animated, Easing, 
  LayoutAnimation, Platform, UIManager, RefreshControl, Alert,
  TouchableWithoutFeedback, Keyboard, Pressable
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing } from '../styles/Theme';
import apiClient, { IMAGE_BASE_URL } from '../api/apiClient';
import { useWishlist } from '../context/WishlistContext';
import { FontAwesome5 as Icon } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');
const CARD_W = (width - Spacing.m * 3) / 2;

// 🎊 TOP MARQUEE (Elite Style)
const TopMarquee = () => {
  const scrollX = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const startAnimation = () => {
      scrollX.setValue(0);
      Animated.timing(scrollX, {
        toValue: -width * 2,
        duration: 25000,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(() => startAnimation());
    };
    startAnimation();
  }, [scrollX]);
  const items = [
    { icon: 'crown', color: '#fbbf24', text: 'CHÀO MỪNG ĐẾN VỚI DDH ELECTRONICS - GEAR CHÍNH HÃNG 100%' },
    { icon: 'shield-alt', color: '#10b981', text: 'HỖ TRỢ TRẢ GÓP 0% - BẢO HÀNH 24 THÁNG 1 ĐỔI 1' },
    { icon: 'bolt', color: '#f97316', text: 'GIAO HÀNG HỎA TỐC 2H TRONG NỘI THÀNH HÀ NỘI' },
  ];
  const displayItems = [...items, ...items, ...items];
  return (
    <View style={styles.marqueeWrapper}>
      <Animated.View style={[styles.marqueeContent, { transform: [{ translateX: scrollX }] }]}>
        {displayItems.map((item, index) => (
          <View key={index} style={styles.marqueeItem}>
            <Icon name={item.icon} size={14} color={item.color} style={{ marginRight: 8 }} />
            <Text style={styles.marqueeText} numberOfLines={1}>{item.text}</Text>
          </View>
        ))}
      </Animated.View>
    </View>
  );
};

const getImageUrl = (path) => {
  if (!path) return `${IMAGE_BASE_URL}/images/logo.jpg`;
  if (path.startsWith('http')) return path.replace('127.0.0.1', IMAGE_BASE_URL.replace('http://', '').split(':')[0]);
  const baseUrl = IMAGE_BASE_URL;
  let cleanPath = path.replace('public/', '');
  if (cleanPath.startsWith('images/') || cleanPath.startsWith('storage/')) return `${baseUrl}/${cleanPath}`;
  return `${baseUrl}/storage/${cleanPath}`;
};

const formatPrice = (price) => Math.round(price).toLocaleString('vi-VN') + ' VNĐ';

// 🏠 HOME SCREEN
const HomeScreen = ({ navigation }) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState({ slides: [], categories: [], flash_sale: [], popular: [], banners: [] });
  const { wishlistItems, toggleWishlist, isInWishlist } = useWishlist();
  const wishlistCount = wishlistItems?.length || 0;
  const [countdown, setCountdown] = useState({ hours: '00', minutes: '00', seconds: '00' });
  const sliderRef = useRef(null);

  // Search Live States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Dropdown States
  const [isCategoryExpanded, setIsCategoryExpanded] = useState(false);

  // 🏆 HARDCODED CATEGORIES (WEB SYNC)
  const eliteCategories = [
    { id: 'cat-1', name: 'Bàn phím cơ', icon: 'images/icon/vecteezy_ergonomic-mechanical-keyboard-with-custom-keycaps-for_60514914.png' },
    { id: 'cat-2', name: 'Chuột Gaming', icon: 'images/icon/gaming-mouse-3d-icon-png-download-9675855.webp' },
    { id: 'cat-3', name: 'Màn hình đồ họa', icon: 'images/icon/premium-computer-parts-display-monitor-icon-3d-rendering-isolated-background_150525-4565.png' },
    { id: 'cat-4', name: 'Laptop Gaming', icon: 'images/icon/laptop-gaming-3d-icon-png-download-11431625.webp' },
    { id: 'cat-5', name: 'Âm thanh & Loa', icon: 'images/icon/audio-icon-concept-with-3d-cartoon-style-headphone-and-blue-speaker-3d-illustration-png.png' },
    { id: 'cat-6', name: 'Lót chuột Gear', icon: 'images/icon/ai-gaming-mouse-pad-3d-icon-png-download-jpg-13387054.webp' },
    { id: 'cat-7', name: 'Keycaps & Switch', icon: 'images/icon/keycap-p-3d-icon-png-download-13964981.png' },
    { id: 'cat-8', name: 'Ghế công thái học', icon: 'images/icon/gaming-chair-3d-illustration-office-equipment-icon-png.png' },
  ];

  useFocusEffect(useCallback(() => { fetchHomeData(); }, []));

  useEffect(() => {
    if (data?.flash_sale_end) {
      const timer = setInterval(() => {
        const distance = new Date(data.flash_sale_end.replace(' ', 'T')).getTime() - new Date().getTime();
        if (distance < 0) {
          clearInterval(timer);
          setCountdown({ hours: '00', minutes: '00', seconds: '00' });
        } else {
          setCountdown({
            hours: Math.floor(distance / 3600000).toString().padStart(2, '0'),
            minutes: Math.floor((distance % 3600000) / 60000).toString().padStart(2, '0'),
            seconds: Math.floor((distance % 60000) / 1000).toString().padStart(2, '0')
          });
        }
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [data?.flash_sale_end]);

  // 🎡 AUTOPLAY SLIDER LOGIC
  useEffect(() => {
    if (data?.slides?.length > 0) {
      const interval = setInterval(() => {
        const nextSlide = (activeSlide + 1) % data.slides.length;
        if (sliderRef.current) {
          sliderRef.current.scrollTo({ x: nextSlide * width, animated: true });
          setActiveSlide(nextSlide);
        }
      }, 4000); // Auto scroll every 4 seconds
      return () => clearInterval(interval);
    }
  }, [activeSlide, data?.slides]);

  // LIVE SEARCH LOGIC
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      setShowResults(false);
      return;
    }

    setShowResults(true);
    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await apiClient.get('/v1/products', { params: { search: searchQuery } });
        if (response.data.success) {
          setSearchResults(response.data.data.data.slice(0, 5));
        }
      } catch (error) {
        console.error('Live Search Error:', error);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const fetchHomeData = async () => {
    try {
      const response = await apiClient.get('/v1/home');
      if (response.data.success) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setData(response.data.data);
      }
    } catch (error) { console.error('Fetch Error:', error); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const toggleCategory = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsCategoryExpanded(!isCategoryExpanded);
  };

  const handleProductPress = (product) => {
    closeSearch();
    navigation.navigate('ProductDetail', { product });
  };

  const closeSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
    Keyboard.dismiss();
  };

  if (loading) return (
    <View style={styles.loadingContainer}>
      <Image source={{ uri: `${IMAGE_BASE_URL}/images/logo.jpg` }} style={{ width: 120, height: 60, marginBottom: 20 }} resizeMode="contain" />
      <ActivityIndicator size="large" color={Colors.secondary} />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <TopMarquee />

      {/* 🌫️ DISMISS OVERLAY */}
      {showResults && <Pressable style={styles.overlay} onPress={closeSearch} />}

      <View style={styles.header}>
        <View style={styles.searchContainerElite}>
          <Image source={{ uri: `${IMAGE_BASE_URL}/images/logo.jpg` }} style={{ width: 60, height: 30, marginRight: 10 }} resizeMode="contain" />
          <View style={styles.searchWrapperElite}>
            <Icon name="search" size={14} color={Colors.muted} style={{ marginRight: 10 }} />
            <TextInput 
              style={styles.searchInputElite} 
              placeholder="Tìm kiếm gear..." 
              placeholderTextColor="rgba(0,0,0,0.3)" 
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
              onSubmitEditing={(e) => {
                closeSearch();
                navigation.navigate('ProductList', { search: e.nativeEvent.text });
              }}
            />
            {isSearching && <ActivityIndicator size="small" color={Colors.secondary} style={{ marginLeft: 5 }} />}
          </View>
          <TouchableOpacity style={styles.heartBtnElite} onPress={() => navigation.navigate('Wishlist')}>
            <Icon name="heart" size={18} color={Colors.secondary} solid />
            {wishlistCount > 0 && <View style={styles.heartBadge} />}
          </TouchableOpacity>
        </View>

        {/* 🚀 LIVE SEARCH RESULTS OVERLAY */}
        {showResults && (
          <View style={styles.liveSearchResults}>
            {searchResults.length > 0 ? (
              searchResults.map(item => (
                <TouchableOpacity key={item.id} style={styles.liveSearchItem} onPress={() => handleProductPress(item)}>
                  <Image source={{ uri: getImageUrl(item.image) }} style={styles.liveSearchImg} resizeMode="contain" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.liveSearchName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.liveSearchPrice}>{formatPrice(item.is_flash_sale && Number(item.sale_price) > 0 ? item.sale_price : item.price)}</Text>
                  </View>
                  <Icon name="chevron-right" size={10} color={Colors.muted} />
                </TouchableOpacity>
              ))
            ) : !isSearching ? (
              <View style={styles.liveSearchEmpty}>
                <Text style={styles.liveSearchEmptyText}>Không tìm thấy siêu phẩm nào!</Text>
              </View>
            ) : (
                <View style={styles.liveSearchEmpty}>
                    <ActivityIndicator size="small" color={Colors.secondary} />
                </View>
            )}
          </View>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); fetchHomeData();}} colors={[Colors.secondary]} />}>
        {/* ── SLIDER ── */}
        <View style={styles.sliderContainer}>
          <ScrollView ref={sliderRef} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={(e) => setActiveSlide(Math.round(e.nativeEvent.contentOffset.x / width))}>
            {data?.slides?.map(slide => (
              <Image key={slide.id} source={{ uri: getImageUrl(slide.image) }} style={styles.slideImage} resizeMode="cover" />
            ))}
          </ScrollView>
          <View style={styles.dotRow}>{data?.slides?.map((_, i) => (<View key={i} style={[styles.dot, activeSlide === i && styles.dotActive]} />))}</View>
        </View>

        {/* ── BANNERS ── */}
        <View style={styles.bannerRow}>
          {data?.banners?.slice(0, 3).map((bn, idx) => (
            <TouchableOpacity key={idx} style={styles.bannerItem} activeOpacity={0.9}>
              <Image source={{ uri: getImageUrl(bn.image) }} style={styles.bannerImg} resizeMode="stretch" />
            </TouchableOpacity>
          ))}
        </View>

        {/* ── FULL BANNER ── */}
        <TouchableOpacity style={styles.fullBannerContainer} activeOpacity={0.9}>
          <Image source={{ uri: `${IMAGE_BASE_URL}/images/banner_ngang1.jpg` }} style={styles.fullBannerImg} resizeMode="stretch" />
        </TouchableOpacity>

        {/* ── 🏆 PREMIUM ELITE DROPDOWN MENU (WEB SYNC) ── */}
        <View style={styles.eliteCategoryCard}>
          <TouchableOpacity 
            style={styles.eliteCategoryHeader} 
            activeOpacity={0.8} 
            onPress={toggleCategory}
          >
            <View style={styles.eliteCategoryHeaderLeft}>
                <Icon name="bars" size={14} color={Colors.accent} />
                <Text style={styles.eliteCategoryHeaderText}>DANH MỤC SẢN PHẨM</Text>
            </View>
            <Icon 
                name={isCategoryExpanded ? "chevron-up" : "chevron-down"} 
                size={12} 
                color={Colors.white} 
                style={{ opacity: 0.7 }}
            />
          </TouchableOpacity>
          
          {isCategoryExpanded && (
            <View style={styles.eliteCategoryContent}>
                {eliteCategories.map((cat, idx) => (
                    <TouchableOpacity 
                        key={cat.id} 
                        style={[styles.eliteCatItem, idx === eliteCategories.length - 1 && { borderBottomWidth: 0 }]} 
                        onPress={() => navigation.navigate('ProductList', { search: cat.name })}
                    >
                        <View style={styles.eliteCatLeft}>
                        <View style={styles.eliteCatIconBox}>
                            <Image source={{ uri: `${IMAGE_BASE_URL}/${cat.icon}` }} style={styles.eliteCatIconImg} resizeMode="contain" />
                        </View>
                        <Text style={styles.eliteCatName}>{cat.name}</Text>
                        </View>
                        <Icon name="chevron-right" size={10} color="#cbd5e1" />
                    </TouchableOpacity>
                ))}
            </View>
          )}
        </View>

        {/* ── FLASH SALE ── */}
        {data?.flash_sale?.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.flashTitleRow}>
                <Text style={styles.flashTitle}>FLASH SALE</Text>
                <View style={styles.timerContainer}>
                  <View style={styles.timerBox}><Text style={styles.timerText}>{countdown.hours}</Text></View>
                  <Text style={styles.timerSeparator}>:</Text>
                  <View style={styles.timerBox}><Text style={styles.timerText}>{countdown.minutes}</Text></View>
                  <Text style={styles.timerSeparator}>:</Text>
                  <View style={[styles.timerBox, { backgroundColor: Colors.danger }]}><Text style={styles.timerText}>{countdown.seconds}</Text></View>
                </View>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
              {data.flash_sale.map(item => (
                <TouchableOpacity key={item.id} style={styles.flashCard} onPress={() => navigation.navigate('ProductDetail', { product: item })}>
                  <View style={styles.flashImageBox}>
                    <Image source={{ uri: getImageUrl(item.image) }} style={styles.flashImage} resizeMode="contain" />
                    {item.is_flash_sale && Number(item.sale_price) > 0 && (
                      <View style={styles.flashTag}>
                        <Text style={styles.flashTagText}>-{Math.round(((Number(item.price) - Number(item.sale_price)) / Number(item.price)) * 100)}%</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.flashName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.flashSalePrice}>{formatPrice(item.is_flash_sale && Number(item.sale_price) > 0 ? item.sale_price : item.price)}</Text>
                  <Text style={styles.flashOldPrice}>{item.is_flash_sale && Number(item.sale_price) > 0 ? formatPrice(item.price) : ''}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── POPULAR GEAR ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View><Text style={styles.sectionTitle}>SẢN PHẨM PHỔ BIẾN</Text><Text style={styles.sectionSubtitle}>Top Trending Gear</Text></View>
            <TouchableOpacity onPress={() => navigation.navigate('ProductList')}><Text style={styles.seeAll}>Tất cả →</Text></TouchableOpacity>
          </View>
          <View style={styles.popularGrid}>
            {data?.popular?.slice(0, 8).map(item => (
              <TouchableOpacity key={item.id} style={styles.popularCard} onPress={() => navigation.navigate('ProductDetail', { product: item })}>
                <View style={styles.popImageBox}><Image source={{ uri: getImageUrl(item.image) }} style={styles.popularImage} resizeMode="contain" /></View>
                <Text style={styles.popularName} numberOfLines={2}>{item.name}</Text>
                <View style={styles.popPriceRow}><Text style={styles.popularPrice}>{formatPrice(item.is_flash_sale && Number(item.sale_price) > 0 ? item.sale_price : item.price)}</Text><TouchableOpacity onPress={() => toggleWishlist(item)}><Icon name="heart" size={14} color={isInWishlist(item.id) ? Colors.secondary : Colors.muted} solid={isInWishlist(item.id)} /></TouchableOpacity></View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.white },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999, backgroundColor: 'rgba(0,0,0,0.05)' },
  marqueeWrapper: { backgroundColor: '#0f172a', height: 32, justifyContent: 'center', overflow: 'hidden' },
  marqueeContent: { flexDirection: 'row', alignItems: 'center' },
  marqueeItem: { flexDirection: 'row', alignItems: 'center', paddingRight: 50 },
  marqueeText: { color: 'rgba(255,255,255,0.95)', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  header: { paddingHorizontal: Spacing.m, paddingVertical: 12, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.03)', zIndex: 1000 },
  searchContainerElite: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  searchWrapperElite: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 20, paddingHorizontal: 16, height: 44 },
  searchInputElite: { flex: 1, fontSize: 12, fontWeight: '600', color: Colors.primary },
  heartBtnElite: { width: 44, height: 44, borderRadius: 20, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  heartBadge: { position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.secondary, borderWidth: 1.5, borderColor: Colors.white },
  
  // LIVE SEARCH STYLES
  liveSearchResults: { position: 'absolute', top: 60, left: Spacing.m, right: Spacing.m, backgroundColor: Colors.white, borderRadius: 20, padding: 10, elevation: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.15, shadowRadius: 25, borderWidth: 1, borderColor: '#f1f5f9' },
  liveSearchItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  liveSearchImg: { width: 40, height: 40, backgroundColor: '#f8fafc', borderRadius: 10 },
  liveSearchName: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  liveSearchPrice: { fontSize: 11, fontWeight: '800', color: Colors.secondary },
  liveSearchEmpty: { padding: 20, alignItems: 'center' },
  liveSearchEmptyText: { fontSize: 12, color: Colors.muted, fontWeight: '600' },

  sliderContainer: { height: 180 },
  slideImage: { width: width, height: 180 },
  dotRow: { position: 'absolute', bottom: 15, width: '100%', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  dotActive: { backgroundColor: Colors.white, width: 20 },
  bannerRow: { flexDirection: 'row', padding: Spacing.m, gap: 10, height: 100 },
  bannerItem: { flex: 1, height: '100%', borderRadius: 12, overflow: 'hidden', backgroundColor: '#f1f5f9' },
  bannerImg: { width: '100%', height: '100%' },
  fullBannerContainer: { marginHorizontal: Spacing.m, marginBottom: Spacing.l, height: 90, borderRadius: 12, overflow: 'hidden' },
  fullBannerImg: { width: '100%', height: '100%' },

  // 🏆 ELITE DROPDOWN MENU STYLES
  eliteCategoryCard: { marginHorizontal: Spacing.m, backgroundColor: Colors.white, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 5, marginBottom: Spacing.xl },
  eliteCategoryHeader: { backgroundColor: '#0f172a', padding: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 3, borderBottomColor: Colors.accent },
  eliteCategoryHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  eliteCategoryHeaderText: { color: Colors.white, fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
  eliteCategoryContent: { paddingVertical: 5 },
  eliteCatItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  eliteCatLeft: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  eliteCatIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center' },
  eliteCatIconImg: { width: '80%', height: '80%' },
  eliteCatName: { fontSize: 14, fontWeight: '700', color: '#334155' },

  section: { paddingHorizontal: Spacing.m, marginBottom: Spacing.xl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: Colors.primary },
  sectionSubtitle: { fontSize: 11, color: Colors.secondary, fontWeight: '700' },
  seeAll: { fontSize: 12, fontWeight: '700', color: Colors.secondary },
  flashTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  flashTitle: { fontSize: 18, fontWeight: '900', color: Colors.danger },
  timerContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timerBox: { backgroundColor: '#1e293b', minWidth: 26, height: 26, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  timerText: { color: Colors.white, fontSize: 11, fontWeight: '800' },
  timerSeparator: { fontSize: 12, fontWeight: '900', color: Colors.primary },
  hScroll: { gap: 14 },
  flashCard: { width: 170, backgroundColor: Colors.white, borderRadius: 24, padding: 12, borderWidth: 1, borderColor: '#f1f5f9' },
  flashImageBox: { width: '100%', height: 120, borderRadius: 16, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  flashImage: { width: '80%', height: '80%' },
  flashTag: { position: 'absolute', top: 8, right: 8, backgroundColor: Colors.secondary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  flashTagText: { fontSize: 10, fontWeight: '900', color: Colors.white },
  flashName: { fontSize: 13, fontWeight: '700', color: Colors.primary, marginBottom: 4 },
  flashSalePrice: { fontSize: 16, fontWeight: '900', color: Colors.secondary },
  flashOldPrice: { fontSize: 11, color: Colors.muted, textDecorationLine: 'line-through' },
  popularGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.m },
  popularCard: { width: CARD_W, backgroundColor: Colors.white, borderRadius: 20, padding: 12, borderWidth: 1, borderColor: '#f1f5f9' },
  popImageBox: { width: '100%', height: CARD_W * 0.75, borderRadius: 16, backgroundColor: '#f8fafc', marginBottom: 12, justifyContent: 'center', alignItems: 'center' },
  popularImage: { width: '80%', height: '80%' },
  popularName: { fontSize: 13, fontWeight: '700', color: Colors.primary, marginBottom: 8, minHeight: 36 },
  popPriceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  popularPrice: { fontSize: 15, fontWeight: '900', color: Colors.primary },
});

export default HomeScreen;
