import * as React from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image,
  TouchableOpacity, StatusBar, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Shadow } from '../styles/Theme';
import { FontAwesome5 as Icon } from '@expo/vector-icons';

const BlogDetailScreen = ({ route, navigation }) => {
  const { post } = route.params;
  const { width } = useWindowDimensions();

  const formatDate = (dateString) => {
    if (!dateString) return 'Vừa xong';
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  };

  const calculateReadTime = (content) => {
    if (!content) return 1;
    const wordsPerMinute = 200;
    const words = content.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(words / wordsPerMinute));
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtnElite}>
          <Icon name="chevron-left" size={18} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitleElite} numberOfLines={1}>Nội dung bài viết</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <Image source={{ uri: post.image || post.thumbnail }} style={[styles.heroImage, { width }]} resizeMode="cover" />

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.category}>{post.category || 'Tin tức Elite'}</Text>
          <Text style={styles.title}>{post.title}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Icon name="calendar-alt" size={12} color="#94a3b8" />
              <Text style={styles.metaText}>{formatDate(post.created_at)}</Text>
            </View>
            <View style={styles.metaItem}>
              <Icon name="user" size={12} color="#94a3b8" />
              <Text style={styles.metaText}>{post.author || 'Admin DDH'}</Text>
            </View>
            <View style={styles.metaItem}>
              <Icon name="clock" size={12} color="#94a3b8" />
              <Text style={styles.metaText}>{calculateReadTime(post.content)} phút đọc</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.body}>
            {post.content || post.summary || 'Nội dung bài viết đang được cập nhật...'}
          </Text>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { paddingBottom: 20 },

  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    paddingHorizontal: 15, height: 60, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9'
  },
  backBtnElite: { 
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#f1f5f9', 
    justifyContent: 'center', alignItems: 'center' 
  },
  headerTitleElite: { fontSize: 17, fontWeight: 'bold', color: '#1e293b' },

  heroImage: { height: 240, backgroundColor: '#f8fafc' },

  content: { padding: 25 },
  category: { fontSize: 11, fontWeight: '800', color: '#f97316', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  title: { fontSize: 24, fontWeight: '900', color: '#1e293b', lineHeight: 34, marginBottom: 18 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 15, marginBottom: 25 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginBottom: 25 },
  body: { fontSize: 16, color: '#334155', lineHeight: 30 },
});

export default BlogDetailScreen;
