import * as React from 'react';
const { useState, useEffect } = React;
import {
  View, Text, StyleSheet, FlatList, Image,
  TouchableOpacity, StatusBar, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Shadow } from '../styles/Theme';
import apiClient, { IMAGE_BASE_URL } from '../api/apiClient';
import { FontAwesome5 as Icon } from '@expo/vector-icons';

const BlogListScreen = ({ navigation }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🛠️ HELPERS
  const formatDate = (dateString) => {
    if (!dateString) return 'Vừa xong';
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  };

  const calculateReadTime = (content) => {
    if (!content) return 1;
    const wordsPerMinute = 200; // Average reading speed
    const words = content.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(words / wordsPerMinute));
  };

  const getImageUrl = (path) => {
    if (!path) return 'https://via.placeholder.com/600x300';
    if (path.startsWith('http')) {
      return path.replace('127.0.0.1', IMAGE_BASE_URL.replace('http://', '').split(':')[0]);
    }
    const baseUrl = IMAGE_BASE_URL;
    let cleanPath = path.replace('public/', '');
    return `${baseUrl}/${cleanPath}`;
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await apiClient.get('/v1/posts');
      if (response.data.success) {
        const rawData = response.data.data;
        setPosts(Array.isArray(rawData) ? rawData : (rawData.data || []));
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
      activeOpacity={0.8}
    >
      <Image source={{ uri: getImageUrl(item.thumbnail || item.image) }} style={styles.cardImage} resizeMode="cover" />
      <View style={styles.cardContent}>
        <Text style={styles.cardCategory}>{item.category || 'Tin tức Elite'}</Text>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.cardExcerpt} numberOfLines={2}>{item.summary || item.content?.substring(0, 100)}</Text>
        <View style={styles.cardMeta}>
          <View style={styles.metaItem}>
            <Icon name="calendar-alt" size={10} color={Colors.muted} />
            <Text style={styles.cardMetaText}>{formatDate(item.created_at)}</Text>
          </View>
          <View style={styles.metaItem}>
            <Icon name="clock" size={10} color={Colors.muted} />
            <Text style={styles.cardMetaText}>{calculateReadTime(item.content)} phút đọc</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtnElite}>
          <Icon name="chevron-left" size={18} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitleElite}>Tin tức & Blog</Text>
        <View style={{ width: 44 }} />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0f172a" />
        </View>
      ) : posts.length === 0 ? (
        <View style={styles.centerContainer}>
          <Icon name="newspaper" size={60} color="#e2e8f0" />
          <Text style={styles.emptyTitle}>Chưa có bài viết nào</Text>
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
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    paddingHorizontal: 15, height: 60, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9'
  },
  backBtnElite: { 
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#f1f5f9', 
    justifyContent: 'center', alignItems: 'center' 
  },
  headerTitleElite: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },

  listContent: { padding: 20 },
  card: { 
    backgroundColor: '#fff', borderRadius: 24, overflow: 'hidden', 
    marginBottom: 20, ...Shadow.medium, borderWidth: 1, borderColor: '#f1f5f9' 
  },
  cardImage: { width: '100%', height: 190, backgroundColor: '#f8fafc' },
  cardContent: { padding: 18 },
  cardCategory: { fontSize: 10, fontWeight: '800', color: '#f97316', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  cardTitle: { fontSize: 17, fontWeight: 'bold', color: '#1e293b', lineHeight: 24, marginBottom: 8 },
  cardExcerpt: { fontSize: 13, color: '#64748b', lineHeight: 20, marginBottom: 15 },
  cardMeta: { flexDirection: 'row', gap: 15 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardMetaText: { fontSize: 11, color: '#94a3b8', fontWeight: '600' },

  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: 'bold', color: '#94a3b8', marginTop: 15 },
});

export default BlogListScreen;
