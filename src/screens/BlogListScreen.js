import * as React from 'react';
const { useState, useEffect } = React;
import {
  View, Text, StyleSheet, FlatList, Image,
  TouchableOpacity, StatusBar, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing } from '../styles/Theme';
import apiClient, { IMAGE_BASE_URL } from '../api/apiClient';

const BlogListScreen = ({ navigation }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🛠️ HELPER
  const getImageUrl = (path) => {
    if (!path) return 'https://via.placeholder.com/600x300';
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

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await apiClient.get('/v1/posts');
      if (response.data.success) {
        setPosts(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const PostCard = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('BlogDetail', { post: item })}
      activeOpacity={0.7}
    >
      <Image source={{ uri: getImageUrl(item.thumbnail || item.image) }} style={styles.cardImage} resizeMode="cover" />
      <View style={styles.cardContent}>
        <Text style={styles.cardCategory}>{item.category || 'Tin tức'}</Text>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.cardExcerpt} numberOfLines={2}>{item.excerpt || item.content?.substring(0, 100)}</Text>
        <View style={styles.cardMeta}>
          <Text style={styles.cardDate}>📅 {item.created_at || 'Hôm nay'}</Text>
          <Text style={styles.cardReadTime}>⏱️ {item.read_time || '3'} phút</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tin tức & Blog</Text>
        <View style={{ width: 44 }} />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : posts.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyIcon}>📰</Text>
          <Text style={styles.emptyTitle}>Chưa có bài viết</Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          renderItem={({ item }) => <PostCard item={item} />}
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

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.m, paddingVertical: Spacing.s, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.input, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  backIcon: { fontSize: 22, fontWeight: '700', color: Colors.dark },
  headerTitle: { fontSize: 20, fontWeight: '900', color: Colors.dark },

  listContent: { padding: Spacing.m },
  card: { backgroundColor: Colors.white, borderRadius: 20, overflow: 'hidden', marginBottom: Spacing.m, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  cardImage: { width: '100%', height: 180, backgroundColor: Colors.light },
  cardContent: { padding: Spacing.l },
  cardCategory: { fontSize: 11, fontWeight: '700', color: Colors.primary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  cardTitle: { fontSize: 18, fontWeight: '800', color: Colors.dark, lineHeight: 24, marginBottom: 8 },
  cardExcerpt: { fontSize: 14, color: Colors.muted, lineHeight: 21, marginBottom: 12 },
  cardMeta: { flexDirection: 'row', gap: 16 },
  cardDate: { fontSize: 12, color: Colors.muted, fontWeight: '600' },
  cardReadTime: { fontSize: 12, color: Colors.muted, fontWeight: '600' },

  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyIcon: { fontSize: 60, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: Colors.dark },
});

export default BlogListScreen;
