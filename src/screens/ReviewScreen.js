import * as React from 'react';
const { useState } = React;
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  StatusBar, Alert, ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing } from '../styles/Theme';
import { useNotification } from '../context/NotificationContext';
import apiClient from '../api/apiClient';

const ReviewScreen = ({ route, navigation }) => {
  const { product } = route.params;
  const { showToast } = useNotification();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await apiClient.post('/v1/reviews', {
        product_id: product.id,
        rating,
        comment,
      });
      if (response.data.success) {
        showToast('Cảm ơn bạn đã để lại đánh giá tuyệt vời!', 'success');
        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      }
    } catch (error) {
      showToast('Không thể gửi đánh giá. Vui lòng thử lại sau.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Viết đánh giá</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.content}>
        {/* Product Info */}
        <View style={styles.productInfo}>
          <Image source={{ uri: product.image }} style={styles.productImage} resizeMode="contain" />
          <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
        </View>

        {/* Rating Stars */}
        <Text style={styles.label}>Chất lượng sản phẩm</Text>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map(star => (
            <TouchableOpacity key={star} onPress={() => setRating(star)}>
              <Text style={[styles.starIcon, rating >= star ? styles.starActive : styles.starInactive]}>
                {rating >= star ? '⭐' : '☆'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.ratingText}>
          {['Rất tệ', 'Không hài lòng', 'Bình thường', 'Hài lòng', 'Tuyệt vời'][rating - 1]}
        </Text>

        {/* Comment */}
        <Text style={styles.label}>Nhận xét của bạn</Text>
        <TextInput
          style={styles.commentInput}
          placeholder="Hãy chia sẻ cảm nhận của bạn về sản phẩm nhé..."
          placeholderTextColor={Colors.muted}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          value={comment}
          onChangeText={setComment}
        />

        <TouchableOpacity
          style={[styles.submitBtn, loading && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.submitBtnText}>Gửi đánh giá</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.m, paddingVertical: Spacing.s, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.input, justifyContent: 'center', alignItems: 'center' },
  backIcon: { fontSize: 22, fontWeight: '700', color: Colors.dark },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.dark },

  content: { padding: Spacing.xl, alignItems: 'center' },
  productInfo: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.light, borderRadius: 20, padding: 16, marginBottom: 30, width: '100%' },
  productImage: { width: 60, height: 60, borderRadius: 12, marginRight: 14 },
  productName: { flex: 1, fontSize: 15, fontWeight: '700', color: Colors.dark },

  label: { fontSize: 16, fontWeight: '800', color: Colors.dark, marginBottom: 16, width: '100%' },
  starsRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  starIcon: { fontSize: 40 },
  starActive: { color: '#FACC15' },
  starInactive: { color: Colors.border },
  ratingText: { fontSize: 14, fontWeight: '700', color: Colors.primary, marginBottom: 30 },

  commentInput: { width: '100%', backgroundColor: Colors.input, borderRadius: 20, padding: 16, fontSize: 15, color: Colors.dark, borderWidth: 1, borderColor: Colors.border, marginBottom: 30 },

  submitBtn: { backgroundColor: Colors.primary, width: '100%', height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
  submitBtnText: { fontSize: 16, fontWeight: '800', color: Colors.white },
});

export default ReviewScreen;
