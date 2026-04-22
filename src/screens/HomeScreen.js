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
import { Colors, Spacing, Shadow } from '../styles/Theme';
import apiClient, { IMAGE_BASE_URL } from '../api/apiClient';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { FontAwesome5 as Icon } from '@expo/vector-icons';
import { useNotification } from '../context/NotificationContext';

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
  const { wishlistItems, toggleWishlist, isInWishlist, refreshWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { showToast } = useNotification();

  // 🔄 REFRESH WISHLIST ON FOCUS (SYNC WITH WEB)
  useFocusEffect(
    useCallback(() => {
      refreshWishlist();
    }, [refreshWishlist])
  );

  const handleToggleWishlist = (item) => {
    toggleWishlist(item);
    showToast(isInWishlist(item.id) ? 'Đã xóa khỏi danh sách yêu thích' : 'Đã thêm vào danh sách yêu thích', 'info');
  };

  const handleAddToCart = (item) => {
    addToCart(item);
    showToast('Đã thêm vào giỏ hàng!', 'success');
  };
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
    { id: 'cat-0', name: 'FLASH SALE', icon: 'images/icon/pngtree-3d-lightning-icon-flash-sale-listrik-petir-png-image_17854619.webp', is_flash: true },
    { id: 'cat-6', name: 'Lót chuột Gear', icon: 'images/icon/ai-gaming-mouse-pad-3d-icon-png-download-jpg-13387054.webp' },
    { id: 'cat-7', name: 'Keycaps & Switch', icon: 'images/icon/keycap-p-3d-icon-png-download-13964981.png' },
    { id: 'cat-8', name: 'Ghế công thái học', icon: 'images/icon/gaming-chair-3d-illustration-office-equipment-icon-png.png' },
  ];

  const categoriesToShow = data?.is_flash_active ? eliteCategories : eliteCategories.filter(c => !c.is_flash);

  // ⚡ Flash Pulse Animation
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [pulseAnim]);

  useFocusEffect(useCallback(() => { fetchHomeData(); }, []));

  useEffect(() => {
    const findEndTime = (obj) => {
      if (!obj) return null;
      if (obj.flash_sale_end) return obj.flash_sale_end;
      if (obj.flashSaleEnd) return obj.flashSaleEnd;
      if (obj.end_time) return obj.end_time;
      if (Array.isArray(obj.flash_sale) && obj.flash_sale[0]?.flash_sale_end) return obj.flash_sale[0].flash_sale_end;
      return null;
    };

    const flashSaleEnd = findEndTime(data);
    
    if (flashSaleEnd) {
      const updateTimer = () => {
        let dateStr = String(flashSaleEnd).replace(/\//g, '-').replace('T', ' ').trim();
        
        try {
          let year, month, day, hour = 0, min = 0, sec = 0;
          const dateTimeParts = dateStr.split(' ');
          const dateParts = dateTimeParts[0].split('-');
          
          if (dateParts[0].length === 4) { // YYYY-MM-DD
            year = parseInt(dateParts[0]);
            month = parseInt(dateParts[1]) - 1;
            day = parseInt(dateParts[2]);
          } else { // DD-MM-YYYY
            year = parseInt(dateParts[2]);
            month = parseInt(dateParts[1]) - 1;
            day = parseInt(dateParts[0]);
          }

          if (dateTimeParts[1]) {
            const timeParts = dateTimeParts[1].split(':');
            hour = parseInt(timeParts[0]);
            min = parseInt(timeParts[1]);
            sec = parseInt(timeParts[2] || 0);
          }

          const endTime = new Date(year, month, day, hour, min, sec).getTime();
          const now = new Date().getTime();
          const distance = endTime - now;
          
          if (distance > 0) {
            const h = Math.floor(distance / 3600000);
            const m = Math.floor((distance % 3600000) / 60000);
            const s = Math.floor((distance % 60000) / 1000);
            setCountdown({
              hours: h.toString().padStart(2, '0'),
              minutes: m.toString().padStart(2, '0'),
              seconds: s.toString().padStart(2, '0')
            });
          } else {
            setCountdown({ hours: '00', minutes: '00', seconds: '00' });
          }
        } catch (e) {
          console.error('Date Parse Error:', e);
          setCountdown({ hours: '00', minutes: '00', seconds: '00' });
        }
      };

      updateTimer();
      const timer = setInterval(updateTimer, 1000);
      return () => clearInterval(timer);
    }
  }, [data]);

  useEffect(() => {
    if (data?.slides?.length > 0) {
      const interval = setInterval(() => {
        const nextSlide = (activeSlide + 1) % data.slides.length;
        if (sliderRef.current) {
          sliderRef.current.scrollTo({ x: nextSlide * width, animated: true });
          setActiveSlide(nextSlide);
        }
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [activeSlide, data?.slides]);

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
        let homeData = response.data.data;
        
        const findInObj = (obj) => {
          if (!obj || typeof obj !== 'object') return null;
          if (obj.flash_sale_end) return obj.flash_sale_end;
          if (obj.flashSaleEnd) return obj.flashSaleEnd;
          if (obj.end_time) return obj.end_time;
          for (let key in obj) {
            if (typeof obj[key] === 'object') {
              const found = findInObj(obj[key]);
              if (found) return found;
            }
          }
          return null;
        };

        const detectedEndTime = findInObj(response.data);
        if (detectedEndTime) homeData.flash_sale_end = detectedEndTime;

        const flashItems = homeData.flash_sale || homeData.flashSale || [];
        if (flashItems.length === 0 && homeData.popular) {
          const extractedFlash = homeData.popular.filter(p => p.is_flash_sale);
          if (extractedFlash.length > 0) {
            homeData.flash_sale = extractedFlash;
            homeData.popular = homeData.popular.filter(p => !p.is_flash_sale);
          }
        }
        
        setData(homeData);
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
        <View style={styles.sliderContainer}>
          <ScrollView ref={sliderRef} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={(e) => setActiveSlide(Math.round(e.nativeEvent.contentOffset.x / width))}>
            {data?.slides?.map(slide => (
              <Image key={slide.id} source={{ uri: getImageUrl(slide.image) }} style={styles.slideImage} resizeMode="cover" />
            ))}
          </ScrollView>
          <View style={styles.dotRow}>{data?.slides?.map((_, i) => (<View key={i} style={[styles.dot, activeSlide === i && styles.dotActive]} />))}</View>
        </View>

        <View style={styles.bannerRow}>
          {data?.banners?.slice(0, 3).map((bn, idx) => (
            <TouchableOpacity key={idx} style={styles.bannerItem} activeOpacity={0.9}>
              <Image source={{ uri: getImageUrl(bn.image) }} style={styles.bannerImg} resizeMode="stretch" />
            </TouchableOpacity>
          ))}
        </View>

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
                {categoriesToShow.map((cat, idx) => (
                    <TouchableOpacity 
                        key={cat.id} 
                        style={[styles.eliteCatItem, idx === categoriesToShow.length - 1 && { borderBottomWidth: 0 }]} 
                        onPress={() => {
                            toggleCategory();
                            if (cat.is_flash) {
                                navigation.navigate('ProductList', { flash_sale: 1 });
                            } else {
                                navigation.navigate('ProductList', { search: cat.name });
                            }
                        }}
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
        {data?.is_flash_active && (data?.flash_sale?.length > 0 || data?.flashSale?.length > 0) && (
          <View style={styles.flashSaleContainerElite}>
            <Icon name="gift" size={16} color="#ef4444" style={[styles.giftDeco, { left: 20 }]} />
            <Icon name="gift" size={16} color="#ef4444" style={[styles.giftDeco, { right: 20 }]} />

            <View style={styles.flashHeaderElite}>
              <View style={styles.flashHeaderLeft}>
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                  <Image 
                    source={{ uri: 'https://ddh-electronics.powercapital-hk.space/images/icon/pngtree-3d-lightning-icon-flash-sale-listrik-petir-png-image_17854619.webp' }} 
                    style={styles.flashHeaderIcon}
                    resizeMode="contain"
                  />
                </Animated.View>
                <View>
                  <Text style={styles.flashHeaderText}>FLASH SALE</Text>
                  <TouchableOpacity onPress={() => navigation.navigate('ProductList', { flash_sale: 1 })}>
                    <Text style={styles.seeAllFlash}>Xem tất cả →</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.flashHeaderRight}>
                <Text style={styles.endsInText}>KẾT THÚC SAU:</Text>
                <View style={styles.countdownRow}>
                  <View style={styles.timerBoxElite}><Text style={styles.timerTextElite}>{countdown.hours}</Text></View>
                  <Text style={styles.timerSepElite}>:</Text>
                  <View style={styles.timerBoxElite}><Text style={styles.timerTextElite}>{countdown.minutes}</Text></View>
                  <Text style={styles.timerSepElite}>:</Text>
                  <View style={[styles.timerBoxElite, styles.timerBoxSec]}>
                    <Text style={styles.timerTextElite}>{countdown.seconds}</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.flashContentElite}>
              <View style={styles.flashGridElite}>
                {(data?.flash_sale || data?.flashSale).slice(0, 2).map(item => {
                  const soldCount = Number(item.sold_count) || 0;
                  const stockLeft = Number(item.stock) || 0;
                  const totalCount = soldCount + stockLeft;
                  const progress = totalCount > 0 ? (soldCount / totalCount) * 100 : 0;
                  
                  return (
                    <TouchableOpacity key={item.id} style={styles.flashCardElite} onPress={() => navigation.navigate('ProductDetail', { product: item })}>
                      <View style={styles.badgeFlashElite}>
                        <Icon name="bolt" size={8} color="#fff" />
                        <Text style={styles.badgeFlashText}>FLASH SALE</Text>
                      </View>

                      <View style={styles.flashImageBoxElite}>
                        <Image source={{ uri: getImageUrl(item.image) }} style={styles.flashImageElite} resizeMode="contain" />
                      </View>

                      <View style={styles.flashBodyElite}>
                        <Text style={styles.flashLimitText}>Limited Edition</Text>
                        <Text style={styles.flashNameElite} numberOfLines={1}>{item.name}</Text>
                        
                        <View style={styles.flashPriceRowElite}>
                          <Text style={styles.flashSalePriceElite} numberOfLines={1} adjustsFontSizeToFit>
                            {formatPrice(item.is_flash_sale && Number(item.sale_price) > 0 ? item.sale_price : item.price)}
                          </Text>
                        </View>

                        <View style={styles.stockInfoElite}>
                          <View style={styles.stockTextRow}>
                            <Text style={styles.stockLabel}>Đã bán: <Text style={{fontWeight: '900'}}>{soldCount}</Text></Text>
                            <Text style={styles.stockLabel}>Còn: <Text style={{fontWeight: '900'}}>{stockLeft}</Text></Text>
                          </View>
                          <View style={styles.stockBarContainer}>
                            <View style={[styles.stockBarFill, { width: `${progress}%` }]} />
                          </View>
                        </View>

                        <TouchableOpacity 
                          style={styles.btnFlashBuy} 
                          onPress={() => { addToCart(item); navigation.navigate('Cart'); }}
                        >
                          <Icon name="bolt" size={12} color="#fff" />
                          <Text style={styles.btnBuyTextElite}>Mua Ngay</Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View><Text style={styles.sectionTitle}>SẢN PHẨM PHỔ BIẾN</Text><Text style={styles.sectionSubtitle}>Top Trending Gear</Text></View>
            <TouchableOpacity onPress={() => navigation.navigate('ProductList')}><Text style={styles.seeAll}>Tất cả →</Text></TouchableOpacity>
          </View>
          <View style={styles.popularGrid}>
            {data?.popular?.slice(0, 6).map(item => (
              <TouchableOpacity key={item.id} style={styles.popularCard} onPress={() => navigation.navigate('ProductDetail', { product: item })}>
                <View style={styles.popImageBox}><Image source={{ uri: getImageUrl(item.image) }} style={styles.popularImage} resizeMode="contain" /></View>
                <Text style={styles.popularName} numberOfLines={2}>{item.name}</Text>
                <View style={styles.popPriceContainer}>
                  <View style={styles.popPriceRow}>
                    <Text style={styles.popularPrice}>{formatPrice(item.is_flash_sale && Number(item.sale_price) > 0 ? item.sale_price : item.price)}</Text>
                    <TouchableOpacity onPress={() => handleToggleWishlist(item)}>
                      <Icon name="heart" size={14} color={isInWishlist(item.id) ? Colors.secondary : Colors.muted} solid={isInWishlist(item.id)} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.popOldPriceBox}>
                    {item.is_flash_sale && Number(item.sale_price) > 0 && (
                      <Text style={styles.popularOldPrice}>{formatPrice(item.price)}</Text>
                    )}
                  </View>
                </View>

                <View style={[styles.cardActions, { marginTop: 10 }]}>
                  <View style={styles.cardActionRow}>
                    <TouchableOpacity style={styles.btnSecondary} onPress={() => navigation.navigate('ProductDetail', { product: item })}>
                      <Icon name="eye" size={10} color={Colors.primary} />
                      <Text style={styles.btnSecondaryText}>Chi tiết</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.btnSecondary} onPress={() => handleAddToCart(item)}>
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
  flashSaleContainerElite: { backgroundColor: Colors.white, borderRadius: 24, marginHorizontal: Spacing.m, marginBottom: Spacing.xl, ...Shadow.medium, overflow: 'hidden', borderWidth: 1, borderColor: '#fee2e2' },
  giftDeco: { position: 'absolute', top: 15, opacity: 0.1 },
  flashHeaderElite: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#fee2e2' },
  flashHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flashHeaderIcon: { width: 36, height: 36 },
  flashHeaderText: { fontSize: 22, fontWeight: '900', color: '#ef4444', letterSpacing: -0.5 },
  seeAllFlash: { fontSize: 10, fontWeight: '700', color: Colors.secondary, marginTop: -2 },
  flashHeaderRight: { alignItems: 'flex-end' },
  endsInText: { fontSize: 8, fontWeight: '800', color: Colors.muted, marginBottom: 4 },
  countdownRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  timerBoxElite: { backgroundColor: '#1e293b', width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  timerBoxSec: { backgroundColor: '#ef4444', shadowColor: '#ef4444', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  timerTextElite: { color: Colors.white, fontSize: 13, fontWeight: '900' },
  timerSepElite: { fontSize: 14, fontWeight: '900', color: '#1e293b' },
  flashContentElite: { padding: 12 },
  flashGridElite: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  flashCardElite: { flex: 1, backgroundColor: Colors.white, borderRadius: 20, padding: 10, borderWidth: 1, borderColor: '#f1f5f9' },
  badgeFlashElite: { position: 'absolute', top: 10, left: 10, backgroundColor: '#ef4444', flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, zIndex: 10 },
  badgeFlashText: { color: Colors.white, fontSize: 8, fontWeight: '900' },
  flashImageBoxElite: { width: '100%', height: 140, backgroundColor: '#f8fafc', borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  flashImageElite: { width: '80%', height: '80%' },
  flashBodyElite: { flex: 1 },
  flashLimitText: { fontSize: 9, fontWeight: '800', color: Colors.muted, textTransform: 'uppercase', marginBottom: 2, opacity: 0.7 },
  flashNameElite: { fontSize: 13, fontWeight: '700', color: '#1e293b', marginBottom: 6 },
  flashPriceRowElite: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4, marginBottom: 10, minHeight: 35 },
  flashSalePriceElite: { fontSize: 14, fontWeight: '900', color: '#ef4444', flexShrink: 1 },
  flashOldPriceElite: { fontSize: 9, color: Colors.muted, textDecorationLine: 'line-through' },
  stockInfoElite: { marginBottom: 12 },
  stockTextRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  stockLabel: { fontSize: 9, color: '#64748b' },
  stockBarContainer: { height: 6, backgroundColor: '#f1f5f9', borderRadius: 3, overflow: 'hidden' },
  stockBarFill: { height: '100%', backgroundColor: '#ef4444', borderRadius: 3 },
  cardActionsElite: { gap: 6 },
  actionRowElite: { flexDirection: 'row', gap: 6 },
  btnSecondaryElite: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: '#f8fafc', height: 36, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  btnSecTextElite: { fontSize: 10, fontWeight: '700', color: '#475569' },
  btnFlashBuy: { backgroundColor: '#ef4444', height: 44, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: '#ef4444', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 },
  btnBuyTextElite: { color: Colors.white, fontSize: 13, fontWeight: '900' },
  popularGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.m },
  popularCard: { width: CARD_W, backgroundColor: Colors.white, borderRadius: 20, padding: 12, borderWidth: 1, borderColor: '#f1f5f9' },
  popImageBox: { width: '100%', height: CARD_W * 0.75, borderRadius: 16, backgroundColor: '#f8fafc', marginBottom: 12, justifyContent: 'center', alignItems: 'center' },
  popularImage: { width: '80%', height: '80%' },
  popularName: { fontSize: 13, fontWeight: '700', color: Colors.primary, marginBottom: 8, minHeight: 36 },
  popPriceContainer: { minHeight: 40, justifyContent: 'flex-start' },
  popPriceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  popularPrice: { fontSize: 15, fontWeight: '900', color: Colors.primary },
  popOldPriceBox: { height: 16, justifyContent: 'center' },
  popularOldPrice: { fontSize: 10, color: Colors.muted, textDecorationLine: 'line-through' },
  cardActions: { marginTop: 12, gap: 8 },
  cardActionRow: { flexDirection: 'row', gap: 6 },
  btnSecondary: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: '#f1f5f9', paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  btnSecondaryText: { fontSize: 9, fontWeight: '800', color: Colors.primary },
  btnBuy: { backgroundColor: Colors.secondary, paddingVertical: 10, borderRadius: 12, alignItems: 'center', shadowColor: Colors.secondary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3 },
  btnBuyText: { color: Colors.white, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
});

export default HomeScreen;
