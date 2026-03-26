import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Share,
    Dimensions,
    Animated,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import safetyNewsService from '../services/safetyNewsService';
import RenderHtml from 'react-native-render-html';

const { width } = Dimensions.get('window');

const SafetyNewsDetailScreen = ({ route, navigation }) => {
    const { newsId } = route.params;
    const { colors, borderRadius, shadows } = useTheme();
    const [news, setNews] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [readProgress, setReadProgress] = useState(0);
    const scrollY = useRef(new Animated.Value(0)).current;

    useEffect(() => { loadNews(); }, [newsId]);

    const loadNews = async () => {
        try {
            setLoading(true);
            const response = await safetyNewsService.getNewsById(newsId);
            if (response.success) setNews(response.data);
            else setError(response.message || 'Failed to load news');
        } catch (err) {
            console.error('Error loading news:', err);
            setError('An error occurred while loading the news');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };

    const getTimeAgo = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diff = Math.floor((now - date) / (1000 * 60 * 60));
        if (diff < 1) return 'Just now';
        if (diff < 24) return `${diff} hours ago`;
        const days = Math.floor(diff / 24);
        return `${days} day${days > 1 ? 's' : ''} ago`;
    };

    const estimateReadTime = (content) => {
        if (!content) return 1;
        const words = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
        return Math.max(1, Math.ceil(words / 200));
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: `${news.title}\n\n${news.summary || ''}\n\nRead more in the Women Safety App`,
                title: news.title,
            });
        } catch (err) { console.error('Share error:', err); }
    };

    const handleBookmark = () => {};

    if (loading) return <LoadingSpinner fullScreen message="Loading article..." />;

    if (error) return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <EmptyState icon="alert-circle-outline" title="Error Loading Article" message={error} actionLabel="Try Again" onAction={loadNews} />
        </View>
    );

    if (!news) return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <EmptyState icon="newspaper-outline" title="Article Not Found" message="The article you're looking for doesn't exist." actionLabel="Go Back" onAction={() => navigation.goBack()} />
        </View>
    );

    const headerOpacity = scrollY.interpolate({ inputRange: [0, 150], outputRange: [1, 0], extrapolate: 'clamp' });
    const readTime = estimateReadTime(news.content);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Animated.ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
                scrollEventThrottle={16}
            >
                <View style={[styles.heroSection, { backgroundColor: colors.secondary }]}>
                    {news.imageUrl && (
                        <Image source={{ uri: news.imageUrl }} style={styles.heroImage} resizeMode="cover" />
                    )}
                    <View style={[styles.heroOverlay, news.imageUrl && styles.heroOverlayWithImage]}>
                        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                            <Ionicons name="arrow-back" size={24} color={colors.white} />
                        </TouchableOpacity>
                        <View style={styles.heroActions}>
                            <TouchableOpacity style={styles.actionButton} onPress={handleBookmark}>
                                <Ionicons name="bookmark-outline" size={22} color={colors.white} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                                <Ionicons name="share-social" size={22} color={colors.white} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <Animated.View style={[styles.heroContent, { opacity: headerOpacity }]}>
                        <View style={styles.badges}>
                            {news.category && (
                                <View style={[styles.categoryBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                                    <Text style={styles.categoryBadgeText}>{news.category?.replace('-', ' ')}</Text>
                                </View>
                            )}
                            {news.isFeatured && (
                                <View style={[styles.featuredBadge, { backgroundColor: colors.warning }]}>
                                    <Ionicons name="star" size={12} color="#fff" />
                                    <Text style={styles.featuredBadgeText}>Featured</Text>
                                </View>
                            )}
                        </View>
                        <Text style={styles.heroTitle}>{news.title}</Text>
                    </Animated.View>
                </View>

                <View style={styles.contentSection}>
                    <View style={[styles.metaCard, { backgroundColor: colors.card, borderRadius: borderRadius.xl, ...shadows.sm }]}>
                        {news.author && (
                            <View style={styles.authorRow}>
                                <View style={[styles.authorAvatar, { backgroundColor: colors.secondary }]}>
                                    <Text style={styles.authorInitial}>{news.author.charAt(0).toUpperCase()}</Text>
                                </View>
                                <View style={styles.authorInfo}>
                                    <Text style={[styles.authorName, { color: colors.text }]}>{news.author}</Text>
                                    {news.source && <Text style={[styles.source, { color: colors.textSecondary }]}>{news.source}</Text>}
                                </View>
                            </View>
                        )}
                        <View style={styles.metaDivider} />
                        <View style={styles.metaRow}>
                            <View style={styles.metaItem}>
                                <Ionicons name="calendar-outline" size={16} color={colors.textTertiary} />
                                <Text style={[styles.metaItemText, { color: colors.textSecondary }]}>{formatDate(news.publishedAt)}</Text>
                            </View>
                            <View style={styles.metaItem}>
                                <Ionicons name="time-outline" size={16} color={colors.textTertiary} />
                                <Text style={[styles.metaItemText, { color: colors.textSecondary }]}>{readTime} min read</Text>
                            </View>
                            {news.viewsCount > 0 && (
                                <View style={styles.metaItem}>
                                    <Ionicons name="eye-outline" size={16} color={colors.textTertiary} />
                                    <Text style={[styles.metaItemText, { color: colors.textSecondary }]}>{news.viewsCount} views</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {news.summary && (
                        <View style={[styles.summaryCard, { backgroundColor: colors.secondary + '10', borderRadius: borderRadius.xl }]}>
                            <Ionicons name="quote" size={24} color={colors.secondary} />
                            <Text style={[styles.summaryText, { color: colors.text }]}>{news.summary}</Text>
                        </View>
                    )}

                    {news.content && (
                        <View style={[styles.contentCard, { backgroundColor: colors.card, borderRadius: borderRadius.xl, ...shadows.sm }]}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>Full Article</Text>
                            <RenderHtml
                                contentWidth={width - 64}
                                source={{ html: news.content }}
                                baseStyle={{ color: colors.text, fontSize: 16, lineHeight: 26 }}
                                tagsStyles={{
                                    h1: { fontSize: 24, fontWeight: 'bold', color: colors.text, marginVertical: 12 },
                                    h2: { fontSize: 22, fontWeight: 'bold', color: colors.text, marginVertical: 12 },
                                    h3: { fontSize: 20, fontWeight: '600', color: colors.text, marginVertical: 10 },
                                    p: { fontSize: 16, lineHeight: 26, color: colors.text, marginVertical: 8 },
                                    ul: { marginLeft: 16, marginVertical: 10 },
                                    ol: { marginLeft: 16, marginVertical: 10 },
                                    li: { fontSize: 16, lineHeight: 26, color: colors.text, marginVertical: 4 },
                                    strong: { fontWeight: 'bold', color: colors.text },
                                    blockquote: { borderLeftWidth: 4, borderLeftColor: colors.secondary, paddingLeft: 16, fontStyle: 'italic' },
                                }}
                            />
                        </View>
                    )}

                    <View style={[styles.shareCard, { backgroundColor: colors.card, borderRadius: borderRadius.xl, ...shadows.sm }]}>
                        <View style={styles.shareContent}>
                            <Ionicons name="share-social" size={28} color={colors.primary} />
                            <View style={styles.shareText}>
                                <Text style={[styles.shareTitle, { color: colors.text }]}>Share this article</Text>
                                <Text style={[styles.shareSubtitle, { color: colors.textSecondary }]}>Help spread awareness about women safety</Text>
                            </View>
                        </View>
                        <TouchableOpacity style={[styles.shareButton, { backgroundColor: colors.primary }]} onPress={handleShare}>
                            <Ionicons name="share" size={20} color={colors.white} />
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.relatedCard, { backgroundColor: colors.info + '10', borderRadius: borderRadius.xl }]}>
                        <Ionicons name="information-circle" size={24} color={colors.info} />
                        <Text style={[styles.relatedText, { color: colors.text }]}>
                            Stay informed about the latest women safety news and updates to protect yourself and your loved ones.
                        </Text>
                    </View>
                </View>
            </Animated.ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { paddingBottom: 40 },
    heroSection: { paddingTop: 50, paddingBottom: 30, paddingHorizontal: 20, overflow: 'hidden' },
    heroImage: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },
    heroOverlay: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
    heroOverlayWithImage: { backgroundColor: 'rgba(0,0,0,0.4)', marginHorizontal: -20, marginTop: -50, paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16, borderRadius: 0 },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' },
    heroActions: { flexDirection: 'row', gap: 8 },
    actionButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' },
    heroContent: {},
    badges: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    categoryBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
    categoryBadgeText: { color: '#fff', fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
    featuredBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, gap: 4 },
    featuredBadgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
    heroTitle: { color: '#fff', fontSize: 26, fontWeight: 'bold', lineHeight: 34 },
    contentSection: { padding: 16, marginTop: -16 },
    metaCard: { padding: 18, marginBottom: 16 },
    authorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
    authorAvatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    authorInitial: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    authorInfo: { marginLeft: 12 },
    authorName: { fontSize: 16, fontWeight: '600' },
    source: { fontSize: 12, marginTop: 2 },
    metaDivider: { height: 1, backgroundColor: 'rgba(0,0,0,0.05)', marginBottom: 14 },
    metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    metaItemText: { fontSize: 13 },
    summaryCard: { flexDirection: 'row', padding: 18, gap: 12, marginBottom: 16 },
    summaryText: { flex: 1, fontSize: 16, fontWeight: '500', lineHeight: 24, fontStyle: 'italic' },
    contentCard: { padding: 18, marginBottom: 16 },
    sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
    shareCard: { flexDirection: 'row', alignItems: 'center', padding: 16, marginBottom: 16 },
    shareContent: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
    shareText: { flex: 1 },
    shareTitle: { fontSize: 15, fontWeight: '600' },
    shareSubtitle: { fontSize: 12, marginTop: 2 },
    shareButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    relatedCard: { flexDirection: 'row', padding: 16, gap: 12 },
    relatedText: { flex: 1, fontSize: 13, lineHeight: 20 },
});

export default SafetyNewsDetailScreen;
