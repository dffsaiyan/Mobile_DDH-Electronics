import * as React from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image,
  TouchableOpacity, StatusBar, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing } from '../styles/Theme';

const BlogDetailScreen = ({ route, navigation }) => {
  const { post } = route.params;
  const { width } = useWindowDimensions();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Bài viết</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <Image source={{ uri: post.image || post.thumbnail }} style={[styles.heroImage, { width }]} resizeMode="cover" />

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.category}>{post.category || 'Tin tức'}</Text>
          <Text style={styles.title}>{post.title}</Text>

          <View style={styles.metaRow}>
            <Text style={styles.metaText}>📅 {post.created_at || 'Hôm nay'}</Text>
            <Text style={styles.metaText}>👤 {post.author || 'Admin'}</Text>
            <Text style={styles.metaText}>⏱️ {post.read_time || '3'} phút đọc</Text>
          </View>

          <View style={styles.divider} />

          <Text style={styles.body}>
            {post.content || post.body || 'Nội dung bài viết đang được cập nhật...'}
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  scrollContent: {},

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.m, paddingVertical: Spacing.s, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.input, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  backIcon: { fontSize: 22, fontWeight: '700', color: Colors.dark },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.dark, maxWidth: '60%' },

  heroImage: { height: 220, backgroundColor: Colors.light },

  content: { padding: Spacing.l },
  category: { fontSize: 12, fontWeight: '800', color: Colors.primary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  title: { fontSize: 24, fontWeight: '900', color: Colors.dark, lineHeight: 32, marginBottom: 14 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 16 },
  metaText: { fontSize: 13, color: Colors.muted, fontWeight: '600' },
  divider: { height: 1, backgroundColor: Colors.border, marginBottom: 20 },
  body: { fontSize: 16, color: '#374151', lineHeight: 28 },
});

export default BlogDetailScreen;
