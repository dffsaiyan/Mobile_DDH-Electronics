import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, 
  Dimensions, StatusBar, ActivityIndicator, Animated, Platform,
  TextInput, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing } from '../styles/Theme';
import apiClient, { IMAGE_BASE_URL } from '../api/apiClient';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { FontAwesome5 as Icon } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const getImageUrl = (path) => {
  if (!path) return null;
  const pathStr = String(path);
  if (pathStr.startsWith('http') && !pathStr.includes('127.0.0.1') && !pathStr.includes('localhost')) return pathStr;
  const baseUrl = IMAGE_BASE_URL;
  if (pathStr.startsWith('http')) {
    const host = baseUrl.replace('http://', '').split(':')[0];
    return pathStr.replace('127.0.0.1', host).replace('localhost', host);
  }
  let cleanPath = pathStr.replace('public/', '');
  if (cleanPath.startsWith('images/') || cleanPath.startsWith('storage/')) return `${baseUrl}/${cleanPath}`;
  return `${baseUrl}/storage/${cleanPath}`;
};

const formatPrice = (price) => Math.round(price).toLocaleString('vi-VN') + ' VNĐ';

const ProductDetailScreen = ({ route, navigation }) => {
  const { product: initialProduct } = route.params;
  const [product, setProduct] = useState(initialProduct);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(initialProduct.image);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [reviewMessage, setReviewMessage] = useState('');
  const [replyMessages, setReplyMessages] = useState({});
  
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { user } = useAuth();
  const { showToast } = useNotification();
  const isAdmin = user?.is_admin == 1;

  useEffect(() => { 
    fetchProductDetails(); 
    fetchRelatedProducts();
  }, [initialProduct.id]);

  const fetchProductDetails = async () => {
    try {
      const response = await apiClient.get(`/v1/products/${initialProduct.id}`);
      if (response.data.success) {
        setProduct(response.data.data);
        setActiveImage(response.data.data.image);
      }
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const fetchRelatedProducts = async () => {
    try {
      const response = await apiClient.get('/v1/products', {
        params: { category_id: initialProduct.category_id, limit: 4 }
      });
      if (response.data.success) {
        let list = response.data.data.data.filter(p => p.id !== initialProduct.id);
        // Shuffle the list
        list = list.sort(() => Math.random() - 0.5);
        setRelatedProducts(list.slice(0, 4));
      }
    } catch (error) { console.error(error); }
  };

  const submitReview = async () => {
    if (!reviewMessage.trim()) return;
    try {
        const response = await apiClient.post('/v1/reviews', {
            product_id: product.id,
            rating: 5,
            message: reviewMessage
        });
        if (response.data.success) {
            showToast('Cảm ơn bạn đã gửi bình luận!');
            setReviewMessage('');
            fetchProductDetails();
        }
    } catch (error) {
        showToast('Bạn cần đăng nhập để thực hiện chức năng này.', 'error');
    }
  };

  const submitReply = async (reviewId) => {
    const msg = replyMessages[reviewId];
    if (!msg || !msg.trim()) return;
    try {
        const response = await apiClient.post(`/v1/reviews`, {
            product_id: product.id,
            message: msg,
            parent_id: reviewId
        });
        if (response.data.success) {
            showToast('Đã gửi phản hồi thành công!');
            setReplyMessages(prev => ({ ...prev, [reviewId]: '' }));
            fetchProductDetails();
        }
    } catch (error) {
        showToast('Lỗi khi gửi phản hồi.', 'error');
    }
  };

  const organizeReviews = () => {
    if (!product.reviews) return [];
    const parents = product.reviews.filter(r => !r.parent_id);
    const replies = product.reviews.filter(r => r.parent_id);
    return parents.map(p => ({
        ...p,
        replies: replies.filter(r => r.parent_id === p.id)
    }));
  };

  const organizedReviews = organizeReviews();
  const hasDiscount = product.is_flash_sale && Number(product.sale_price) > 0 && Number(product.sale_price) < Number(product.price);
  const discountPercent = hasDiscount ? Math.round(((Number(product.price) - Number(product.sale_price)) / Number(product.price)) * 100) : 0;
  const savings = hasDiscount ? product.price - product.sale_price : 0;
  
  const ratedReviews = product.reviews?.filter(r => r.rating && r.rating > 0) || [];
  const avgRating = ratedReviews.length > 0 
    ? (ratedReviews.reduce((sum, r) => sum + r.rating, 0) / ratedReviews.length).toFixed(1)
    : "5.0";

  const renderAvatar = (u, size = 44) => {
    const avatarPath = u?.social_avatar || u?.avatar || u?.avatar_url || u?.profile_photo_url || u?.image;
    const uri = getImageUrl(avatarPath);
    if (uri) return <Image source={{ uri }} style={{ width: '100%', height: '100%', borderRadius: size/2 }} />;
    return <Text style={[styles.avatarText, size < 40 && { fontSize: 12 }]}>{u?.name?.charAt(0) || 'U'}</Text>;
  };

  if (loading && !product) return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={Colors.secondary} />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* ── HEADER ── */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Icon name="chevron-left" size={18} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{product.name}</Text>
        <TouchableOpacity onPress={() => toggleWishlist(product)} style={styles.headerBtn}>
          <Icon name="heart" size={18} color={isInWishlist(product.id) ? Colors.secondary : Colors.muted} solid={isInWishlist(product.id)} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        
        {/* ── BREADCRUMB ── */}
        <View style={styles.breadcrumb}>
          <Text style={styles.breadcrumbItem}>Trang chủ</Text>
          <Icon name="chevron-right" size={8} color={Colors.muted} style={{ marginHorizontal: 8 }} />
          <Text style={styles.breadcrumbItem}>{product.category?.name || 'Gear'}</Text>
          <Icon name="chevron-right" size={8} color={Colors.muted} style={{ marginHorizontal: 8 }} />
          <Text style={[styles.breadcrumbItem, styles.breadcrumbActive]} numberOfLines={1}>{product.name}</Text>
        </View>

        {/* ── GALLERY ── */}
        <View style={styles.gallerySection}>
          <View style={styles.mainImageCard}>
            {hasDiscount && (
              <View style={styles.saleBadge}>
                <Text style={styles.saleBadgeText}>-{discountPercent}%</Text>
              </View>
            )}
            <Image source={{ uri: getImageUrl(activeImage) }} style={styles.mainImage} resizeMode="contain" />
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbScroll}>
            <TouchableOpacity 
              style={[styles.thumbItem, activeImage === product.image && styles.thumbActive]} 
              onPress={() => setActiveImage(product.image)}
            >
              <Image source={{ uri: getImageUrl(product.image) }} style={styles.thumbImg} />
            </TouchableOpacity>
            {product.images?.map((imgObj, idx) => (
              <TouchableOpacity 
                key={idx} 
                style={[styles.thumbItem, activeImage === imgObj.image && styles.thumbActive]} 
                onPress={() => setActiveImage(imgObj.image)}
              >
                <Image source={{ uri: getImageUrl(imgObj.image) }} style={styles.thumbImg} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── PRODUCT INFO ── */}
        <View style={styles.infoSection}>
          <View style={styles.brandRow}>
            <View style={styles.brandBadge}><Text style={styles.brandText}>{product.category?.name || 'Elite'}</Text></View>
            <View style={styles.authBadge}>
              <Icon name="check-circle" size={10} color={Colors.success} />
              <Text style={styles.authText}>Chính hãng</Text>
            </View>
          </View>

          <Text style={styles.productName}>{product.name}</Text>

          {/* Price Box */}
          <View style={styles.priceBox}>
            <View style={styles.priceRow}>
              <Text style={styles.salePrice}>{formatPrice(hasDiscount ? product.sale_price : product.price)}</Text>
              {hasDiscount && <Text style={styles.oldPrice}>{formatPrice(product.price)}</Text>}
            </View>
            {hasDiscount && (
              <View style={styles.savingsRow}>
                <Icon name="fire" size={12} color={Colors.secondary} />
                <Text style={styles.savingsText}>Tiết kiệm {formatPrice(savings)}</Text>
              </View>
            )}
          </View>

          {/* Highlights Card (SYNCED) */}
          <View style={styles.highlightsCard}>
            <View style={styles.highlightsHeader}>
              <Icon name="star" size={12} color="#fbbf24" solid />
              <Text style={styles.highlightsTitle}>Đặc điểm nổi bật</Text>
            </View>
            <Text style={styles.highlightsContent}>
              {product.description || `Dòng sản phẩm cao cấp ${product.name} với chất lượng đỉnh cao.`}
            </Text>
          </View>

          {/* Stock Status (SYNCED) */}
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: product.stock > 0 ? Colors.success : Colors.danger }]} />
            <Text style={styles.statusText}>
              {product.stock > 0 ? 'Còn hàng ' : 'Hết hàng '} 
              <Text style={{ color: Colors.success }}>({product.stock} sản phẩm)</Text>
            </Text>
          </View>

          {/* Policies */}
          <View style={styles.policyBox}>
            <View style={styles.policyItem}>
              <View style={styles.policyIcon}><Icon name="truck" size={16} color={Colors.primary} /></View>
              <Text style={styles.policyTitle}>Giao nhanh</Text>
              <Text style={styles.policySub}>Nội thành 2h</Text>
            </View>
            <View style={styles.policyItem}>
              <View style={styles.policyIcon}><Icon name="shield-alt" size={16} color={Colors.primary} /></View>
              <Text style={styles.policyTitle}>Bảo hành 12T</Text>
              <Text style={styles.policySub}>Chính hãng</Text>
            </View>
            <View style={styles.policyItem}>
              <View style={styles.policyIcon}><Icon name="undo" size={16} color={Colors.primary} /></View>
              <Text style={styles.policyTitle}>Đổi trả 7 ngày</Text>
              <Text style={styles.policySub}>Lỗi là đổi</Text>
            </View>
          </View>

          {/* Specs Section (SYNCED) */}
          <View style={styles.descSection}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionAccent} />
              <Text style={styles.sectionTitle}>Thông số kỹ thuật</Text>
            </View>
            <View style={styles.specTable}>
                {product.specifications && Object.keys(product.specifications).length > 0 ? (
                    Object.entries(product.specifications).map(([key, val], idx) => (
                        <View key={idx} style={[styles.specRow, idx % 2 === 0 && {backgroundColor: '#f8fafc'}]}>
                            <Text style={styles.specKey}>{key}</Text>
                            <Text style={styles.specVal}>{val}</Text>
                        </View>
                    ))
                ) : (
                    <Text style={styles.emptyDataText}>Thông số kỹ thuật đang được cập nhật...</Text>
                )}
            </View>
          </View>

          {/* FAQ Section (SYNCED) */}
          <View style={styles.descSection}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionAccent} />
              <Text style={styles.sectionTitle}>Câu hỏi thường gặp</Text>
            </View>
            <View style={styles.faqList}>
                {product.faqs && Object.keys(product.faqs).length > 0 ? (
                    Object.entries(product.faqs).map(([q, a], idx) => (
                        <View key={idx} style={styles.faqItem}>
                            <Text style={styles.faqQuestion}>Q: {q}</Text>
                            <Text style={styles.faqAnswer}>{a}</Text>
                        </View>
                    ))
                ) : (
                    <Text style={styles.emptyDataText}>Câu hỏi thường gặp đang được cập nhật...</Text>
                )}
            </View>
          </View>

          {/* Reviews Section */}
          <View style={styles.reviewSection}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionAccent} />
              <Text style={styles.sectionTitle}>Bình luận & Đánh giá ({product.reviews?.length || 0})</Text>
            </View>

            {/* Rating Widget (Moved up) */}
            <View style={styles.ratingWidget}>
                <Text style={styles.ratingTitle}>Đánh giá trung bình</Text>
                <View style={styles.ratingCenter}>
                    <Text style={styles.ratingValue}>{avgRating}</Text>
                    <View style={styles.starsRow}>
                        {[1,2,3,4,5].map(s => (
                            <Icon key={s} name="star" size={16} color={s <= Math.round(avgRating) ? "#fbbf24" : "#e2e8f0"} solid />
                        ))}
                    </View>
                    <Text style={styles.ratingCount}>Dựa trên {ratedReviews.length} lượt đánh giá thực tế</Text>
                </View>
            </View>

            {/* Comment Form */}
            <View style={styles.commentFormCard}>
                <Text style={styles.commentFormTitle}><Icon name="pen-nib" size={12} color={Colors.primary} /> Hỏi đáp về sản phẩm</Text>
                <TextInput 
                    style={styles.commentInput} 
                    placeholder="Nhập câu hỏi hoặc bình luận của bạn..." 
                    multiline
                    value={reviewMessage}
                    onChangeText={setReviewMessage}
                />
                <TouchableOpacity style={styles.commentSubmitBtn} onPress={submitReview}>
                    <Text style={styles.commentSubmitText}>Gửi bình luận</Text>
                    <Icon name="paper-plane" size={12} color={Colors.white} />
                </TouchableOpacity>
            </View>
            
            <View style={styles.reviewList}>
              {organizedReviews.length > 0 ? (
                  organizedReviews.map(rev => (
                    <View key={rev.id} style={styles.reviewWrapper}>
                        {/* Parent Comment */}
                        <View style={styles.reviewItem}>
                            <View style={styles.reviewHeader}>
                                <View style={styles.avatar}>
                                    {renderAvatar(rev.user, 44)}
                                </View>
                                <View style={{ flex: 1 }}>
                                    <View style={styles.reviewerNameRow}>
                                        <Text style={styles.reviewerName}>{(rev.user?.name || 'Khách hàng').replace(/\+/g, ' ')}</Text>
                                        <Text style={styles.reviewTime}>{new Date(rev.created_at).toLocaleDateString('vi-VN')}</Text>
                                    </View>
                                    <Text style={styles.reviewContent}>{rev.comment || rev.message}</Text>
                                    
                                    {/* ADMIN ONLY REPLY PILL INPUT */}
                                    {isAdmin && (
                                        <View style={styles.replyInputGroup}>
                                            <TextInput 
                                                style={styles.replyInput} 
                                                placeholder="Nhập phản hồi của bạn..." 
                                                placeholderTextColor="#94a3b8"
                                                value={replyMessages[rev.id] || ''}
                                                onChangeText={(txt) => setReplyMessages(prev => ({ ...prev, [rev.id]: txt }))}
                                            />
                                            <TouchableOpacity 
                                                style={styles.replySubmitBtn} 
                                                onPress={() => submitReply(rev.id)}
                                            >
                                                <Text style={styles.replySubmitText}>Gửi</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>
                            </View>
                        </View>

                        {/* Replies */}
                        {rev.replies && rev.replies.length > 0 && (
                            <View style={styles.repliesContainer}>
                                {rev.replies.map(reply => (
                                    <View key={reply.id} style={styles.replyItem}>
                                        <View style={styles.avatarSmall}>
                                            {renderAvatar(reply.user, 32)}
                                        </View>
                                        <View style={styles.replyContentBox}>
                                            <View style={styles.reviewerNameRow}>
                                                <Text style={styles.reviewerNameSmall}>{(reply.user?.name || 'Admin').replace(/\+/g, ' ')}</Text>
                                                {reply.user?.is_admin === 1 && <View style={styles.adminBadge}><Text style={styles.adminBadgeText}>Admin</Text></View>}
                                                <Text style={styles.reviewTime}>{new Date(reply.created_at).toLocaleDateString('vi-VN')}</Text>
                                            </View>
                                            <Text style={styles.replyText}>{reply.comment || reply.message}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                  ))
              ) : (
                <View style={styles.emptyReviews}>
                    <Text style={styles.emptyDataText}>Chưa có bình luận nào cho sản phẩm này.</Text>
                </View>
              )}
            </View>
          </View>
          {relatedProducts.length > 0 && (
            <View style={styles.relatedSection}>
                <View style={styles.sectionTitleRow}>
                    <View style={styles.sectionAccent} />
                    <Text style={styles.sectionTitle}>Có thể bạn cũng thích</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 15 }}>
                    {relatedProducts.map(item => (
                        <TouchableOpacity key={item.id} style={styles.relatedCard} onPress={() => navigation.push('ProductDetail', { product: item })}>
                            <Image source={{ uri: getImageUrl(item.image) }} style={styles.relatedImg} resizeMode="contain" />
                            <Text style={styles.relatedName} numberOfLines={2}>{item.name}</Text>
                            <Text style={styles.relatedPrice}>{formatPrice(Number(item.sale_price) > 0 ? item.sale_price : item.price)}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
          )}

        </View>

      </ScrollView>

      {/* ── BOTTOM BAR ── */}
      <View style={styles.bottomBar}>
        <View style={styles.qtyContainer}>
          <TouchableOpacity onPress={() => setQuantity(Math.max(1, quantity - 1))} style={styles.qtyBtn}><Text style={styles.qtyBtnText}>-</Text></TouchableOpacity>
          <Text style={styles.qtyValue}>{quantity}</Text>
          <TouchableOpacity onPress={() => setQuantity(quantity + 1)} style={styles.qtyBtn}><Text style={styles.qtyBtnText}>+</Text></TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.buyNowBtn} onPress={() => { addToCart(product, quantity); navigation.navigate('Cart'); }}>
          <Icon name="shopping-bag" size={14} color={Colors.white} style={{ marginRight: 8 }} />
          <Text style={styles.buyNowText}>MUA NGAY</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.addCartBtn} onPress={() => { addToCart(product, quantity); showToast(`Đã thêm ${product.name} vào giỏ hàng!`); }}>
          <Icon name="cart-plus" size={18} color={Colors.primary} />
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fdfdfd' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.m, paddingVertical: 10, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 13, fontWeight: '900', color: Colors.primary, letterSpacing: 0.5, flex: 1, textAlign: 'center', marginHorizontal: 10 },

  breadcrumb: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.m, paddingVertical: 12 },
  breadcrumbItem: { fontSize: 11, color: Colors.muted, fontWeight: '600' },
  breadcrumbActive: { color: Colors.primary, fontWeight: '800', flex: 1 },

  gallerySection: { paddingHorizontal: Spacing.m },
  mainImageCard: { width: '100%', height: 320, backgroundColor: Colors.white, borderRadius: 30, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 5, borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)', position: 'relative', overflow: 'hidden' },
  mainImage: { width: '85%', height: '85%' },
  saleBadge: { position: 'absolute', top: 20, left: 20, backgroundColor: Colors.secondary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, zIndex: 10 },
  saleBadgeText: { color: Colors.white, fontSize: 12, fontWeight: '900' },
  
  thumbScroll: { marginTop: 15, paddingLeft: 5 },
  thumbItem: { width: 64, height: 64, borderRadius: 16, backgroundColor: Colors.white, marginRight: 12, padding: 8, borderWidth: 2, borderColor: '#f1f5f9' },
  thumbActive: { borderColor: Colors.secondary },
  thumbImg: { width: '100%', height: '100%', borderRadius: 8 },

  infoSection: { padding: Spacing.m, marginTop: 10 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  brandBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  brandText: { fontSize: 11, fontWeight: '800', color: Colors.primary },
  authBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  authText: { fontSize: 11, fontWeight: '700', color: Colors.muted },
  
  productName: { fontSize: 20, fontWeight: '900', color: Colors.primary, lineHeight: 28, marginBottom: 20 },
  
  priceBox: { backgroundColor: '#f8fafc', padding: 20, borderRadius: 24, marginBottom: 24, borderWidth: 1, borderColor: '#f1f5f9' },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 12 },
  salePrice: { fontSize: 22, fontWeight: '900', color: Colors.secondary },
  oldPrice: { fontSize: 13, color: Colors.muted, textDecorationLine: 'line-through' },
  savingsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  savingsText: { fontSize: 11, color: Colors.primary, fontWeight: '700' },

  highlightsCard: { backgroundColor: Colors.white, padding: 20, borderRadius: 24, marginBottom: 24, borderWidth: 1, borderColor: '#f1f5f9' },
  highlightsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  highlightsTitle: { fontSize: 14, fontWeight: '800', color: Colors.primary },
  highlightsContent: { fontSize: 13, color: '#64748b', lineHeight: 22 },

  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 13, fontWeight: '700', color: '#334155' },

  policyBox: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 24, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#f1f5f9', marginBottom: 30 },
  policyItem: { alignItems: 'center', flex: 1 },
  policyIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  policyTitle: { fontSize: 11, fontWeight: '800', color: Colors.primary, marginBottom: 2 },
  policySub: { fontSize: 9, color: Colors.muted, fontWeight: '600' },

  descSection: { marginBottom: 30 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  sectionAccent: { width: 4, height: 20, backgroundColor: Colors.secondary, borderRadius: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '900', color: Colors.primary },
  emptyDataText: { fontSize: 12, color: Colors.muted, textAlign: 'center', paddingVertical: 20 },
  specTable: { backgroundColor: Colors.white, borderRadius: 20, borderWeight: 1, borderColor: '#f1f5f9', overflow: 'hidden' },
  specRow: { flexDirection: 'row', padding: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  specKey: { flex: 1, fontSize: 12, fontWeight: '700', color: Colors.primary },
  specVal: { flex: 2, fontSize: 12, color: '#4b5563' },

  faqList: { gap: 10 },
  faqItem: { backgroundColor: Colors.white, padding: 15, borderRadius: 16, borderWidth: 1, borderColor: '#f1f5f9' },
  faqQuestion: { fontSize: 13, fontWeight: '800', color: Colors.primary, marginBottom: 6 },
  faqAnswer: { fontSize: 12, color: '#64748b', lineHeight: 18 },

  reviewSection: { marginBottom: 30 },
  commentFormCard: { backgroundColor: '#f8fafc', padding: 20, borderRadius: 24, marginBottom: 20, borderWidth: 1, borderColor: '#f1f5f9' },
  commentFormTitle: { fontSize: 14, fontWeight: '900', color: Colors.primary, marginBottom: 15 },
  commentInput: { backgroundColor: Colors.white, borderRadius: 16, padding: 15, height: 100, textAlignVertical: 'top', fontSize: 13, color: Colors.primary, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 15 },
  commentSubmitBtn: { backgroundColor: Colors.primary, height: 44, borderRadius: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  commentSubmitText: { color: Colors.white, fontSize: 13, fontWeight: '800' },

  reviewWrapper: { marginBottom: 25, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 20 },
  reviewItem: { backgroundColor: 'transparent' },
  reviewHeader: { flexDirection: 'row', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 1, borderColor: '#f1f5f9' },
  avatarImg: { width: '100%', height: '100%' },
  avatarText: { color: Colors.primary, fontWeight: '900', fontSize: 18 },
  reviewerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  reviewerName: { fontSize: 13, fontWeight: '800', color: Colors.dark },
  reviewTime: { fontSize: 10, color: Colors.muted },
  reviewContent: { fontSize: 13, color: '#334155', lineHeight: 20, marginBottom: 8 },
  replyInputGroup: { flexDirection: 'row', alignItems: 'center', marginTop: 10, borderRadius: 25, backgroundColor: '#f1f5f9', overflow: 'hidden', height: 38, borderWidth: 1, borderColor: '#e2e8f0' },
  replyInput: { flex: 1, height: '100%', paddingHorizontal: 15, fontSize: 12, color: Colors.primary, fontWeight: '600' },
  replySubmitBtn: { backgroundColor: Colors.primary, height: '100%', paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center' },
  replySubmitText: { color: Colors.white, fontSize: 11, fontWeight: '900' },

  repliesContainer: { marginTop: 15, marginLeft: 50, borderLeftWidth: 2, borderLeftColor: '#f1f5f9', paddingLeft: 15 },
  replyItem: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  avatarSmall: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 1, borderColor: '#f1f5f9' },
  avatarTextSmall: { color: Colors.primary, fontWeight: '900', fontSize: 12 },
  replyContentBox: { flex: 1, backgroundColor: '#f8fafc', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: '#f1f5f9' },
  reviewerNameSmall: { fontSize: 12, fontWeight: '800', color: Colors.dark },
  replyText: { fontSize: 12, color: '#475569', lineHeight: 18 },
  adminBadge: { backgroundColor: Colors.secondary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  adminBadgeText: { color: Colors.white, fontSize: 9, fontWeight: '900' },

  ratingWidget: { backgroundColor: Colors.white, padding: 25, borderRadius: 24, borderWidth: 1, borderColor: '#f1f5f9', marginBottom: 25 },
  ratingTitle: { fontSize: 15, fontWeight: '800', color: Colors.primary, marginBottom: 20 },
  ratingCenter: { alignItems: 'center' },
  ratingValue: { fontSize: 48, fontWeight: '900', color: Colors.primary, marginBottom: 8 },
  starsRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  ratingCount: { fontSize: 12, color: Colors.muted, fontWeight: '600' },

  relatedSection: { marginTop: 10 },
  relatedCard: { width: 160, backgroundColor: Colors.white, borderRadius: 20, padding: 12, borderWidth: 1, borderColor: '#f1f5f9' },
  relatedImg: { width: '100%', height: 100, marginBottom: 10 },
  relatedName: { fontSize: 12, fontWeight: '700', color: Colors.primary, marginBottom: 8, height: 32 },
  relatedPrice: { fontSize: 13, fontWeight: '900', color: Colors.secondary },

  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 90, backgroundColor: Colors.white, flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.m, borderTopWidth: 1, borderTopColor: '#f1f5f9', gap: 12, paddingBottom: Platform.OS === 'ios' ? 25 : 10 },
  qtyContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 16, height: 48, paddingHorizontal: 4 },
  qtyBtn: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  qtyBtnText: { fontSize: 18, fontWeight: '700', color: Colors.primary },
  qtyValue: { fontSize: 14, fontWeight: '900', color: Colors.primary, width: 24, textAlign: 'center' },
  buyNowBtn: { flex: 1, height: 48, backgroundColor: Colors.secondary, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowColor: Colors.secondary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  buyNowText: { color: Colors.white, fontSize: 14, fontWeight: '900' },
  addCartBtn: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
});

export default ProductDetailScreen;
