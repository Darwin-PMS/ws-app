// Safety News Detail Screen
// Full news article display

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Share,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import safetyNewsService from '../services/safetyNewsService';

const { width } = Dimensions.get('window');

const SafetyNewsDetailScreen = ({ route, navigation }) => {
    const { newsId } = route.params;
    const { colors, spacing, borderRadius, shadows } = useTheme();

    const [news, setNews] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Load news details
    useEffect(() => {
        loadNews();
    }, [newsId]);

    const loadNews = async () => {
        try {
            setLoading(true);
            const response = await safetyNewsService.getNewsById(newsId);

            if (response.success) {
                setNews(response.data);
            } else {
                setError(response.message || 'Failed to load news');
            }
        } catch (err) {
            console.error('Error loading news:', err);
            setError('An error occurred while loading the news');
        } finally {
            setLoading(false);
        }
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    // Handle share
    const handleShare = async () => {
        try {
            await Share.share({
                message: `${news.title}\n\n${news.summary || news.content?.substring(0, 200)}...`,
                title: news.title,
            });
        } catch (err) {
            console.error('Share error:', err);
        }
    };

    // Render loading state
    if (loading) {
        return <LoadingSpinner fullScreen message="Loading article..." />;
    }

    // Render error state
    if (error) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <EmptyState
                    icon="alert-circle-outline"
                    title="Error Loading Article"
                    message={error}
                    actionLabel="Try Again"
                    onAction={loadNews}
                />
            </View>
        );
    }

    // Render empty state
    if (!news) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <EmptyState
                    icon="newspaper-outline"
                    title="Article Not Found"
                    message="The article you're looking for doesn't exist."
                    actionLabel="Go Back"
                    onAction={() => navigation.goBack()}
                />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Header */}
                <View style={[styles.header, { backgroundColor: colors.secondary }]}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color={colors.white} />
                    </TouchableOpacity>
                    <View style={styles.headerActions}>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={handleShare}
                        >
                            <Ionicons name="share-social" size={22} color={colors.white} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Featured Image */}
                {news.image ? (
                    <Image
                        source={{ uri: news.image }}
                        style={styles.featuredImage}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={[styles.imagePlaceholder, { backgroundColor: colors.primary + '20' }]}>
                        <Ionicons name="newspaper" size={64} color={colors.primary} />
                    </View>
                )}

                {/* Content */}
                <View style={styles.contentContainer}>
                    {/* Category & Featured Badge */}
                    <View style={styles.metaRow}>
                        {news.category && (
                            <View style={[styles.categoryBadge, { backgroundColor: colors.primary + '20' }]}>
                                <Text style={[styles.categoryText, { color: colors.primary }]}>
                                    {news.category}
                                </Text>
                            </View>
                        )}
                        {news.featured && (
                            <View style={[styles.featuredBadge, { backgroundColor: colors.warning + '20' }]}>
                                <Ionicons name="star" size={14} color={colors.warning} />
                                <Text style={[styles.featuredText, { color: colors.warning }]}>
                                    Featured
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Title */}
                    <Text style={[styles.title, { color: colors.text }]}>
                        {news.title}
                    </Text>

                    {/* Author & Date */}
                    <View style={[styles.authorCard, { backgroundColor: colors.surface, borderRadius, ...shadows.small }]}>
                        <View style={styles.authorInfo}>
                            {news.author ? (
                                <View style={styles.authorRow}>
                                    <View style={[styles.authorAvatar, { backgroundColor: colors.primary }]}>
                                        <Text style={styles.authorInitial}>
                                            {news.author.charAt(0).toUpperCase()}
                                        </Text>
                                    </View>
                                    <View>
                                        <Text style={[styles.authorName, { color: colors.text }]}>
                                            {news.author}
                                        </Text>
                                        {news.source && (
                                            <Text style={[styles.source, { color: colors.textSecondary }]}>
                                                {news.source}
                                            </Text>
                                        )}
                                    </View>
                                </View>
                            ) : news.source ? (
                                <View style={styles.sourceOnly}>
                                    <Text style={[styles.sourceLabel, { color: colors.textSecondary }]}>
                                        Source:
                                    </Text>
                                    <Text style={[styles.sourceName, { color: colors.text }]}>
                                        {news.source}
                                    </Text>
                                </View>
                            ) : null}
                        </View>

                        {news.published_date && (
                            <View style={styles.dateRow}>
                                <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
                                <Text style={[styles.dateText, { color: colors.textSecondary }]}>
                                    {formatDate(news.published_date)}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Summary */}
                    {news.summary && (
                        <View style={styles.section}>
                            <Text style={[styles.summary, { color: colors.text }]}>
                                {news.summary}
                            </Text>
                        </View>
                    )}

                    {/* Content */}
                    {news.content && (
                        <View style={styles.section}>
                            <View style={[styles.contentCard, { backgroundColor: colors.surface, borderRadius, ...shadows.small }]}>
                                <Text style={[styles.contentText, { color: colors.text }]}>
                                    {news.content}
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* Tags (if available) */}
                    {news.tags && news.tags.length > 0 && (
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                Related Topics
                            </Text>
                            <View style={styles.tagsContainer}>
                                {news.tags.map((tag, index) => (
                                    <View
                                        key={index}
                                        style={[styles.tag, { backgroundColor: colors.primary + '15', borderRadius }]}
                                    >
                                        <Text style={[styles.tagText, { color: colors.primary }]}>
                                            #{tag}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Related News (placeholder - would need API) */}
                    {news.related && news.related.length > 0 && (
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                Related Articles
                            </Text>
                            {news.related.map((item, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[styles.relatedCard, { backgroundColor: colors.surface, borderRadius, ...shadows.small }]}
                                    onPress={() => navigation.push('SafetyNewsDetail', { newsId: item.id })}
                                >
                                    <Text style={[styles.relatedTitle, { color: colors.text }]} numberOfLines={2}>
                                        {item.title}
                                    </Text>
                                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 32,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        paddingTop: 48,
    },
    backButton: {
        padding: 8,
    },
    headerActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        padding: 8,
    },
    featuredImage: {
        width: width,
        height: 250,
    },
    imagePlaceholder: {
        width: width,
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
    },
    contentContainer: {
        padding: 16,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 12,
    },
    categoryBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    categoryText: {
        fontSize: 14,
        fontWeight: '500',
    },
    featuredBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 4,
    },
    featuredText: {
        fontSize: 13,
        fontWeight: '500',
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        lineHeight: 34,
        marginBottom: 16,
    },
    authorCard: {
        padding: 16,
        marginBottom: 20,
    },
    authorInfo: {
        marginBottom: 12,
    },
    authorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    authorAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    authorInitial: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    authorName: {
        fontSize: 16,
        fontWeight: '600',
    },
    source: {
        fontSize: 13,
        marginTop: 2,
    },
    sourceOnly: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    sourceLabel: {
        fontSize: 14,
    },
    sourceName: {
        fontSize: 14,
        fontWeight: '500',
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    dateText: {
        fontSize: 13,
    },
    section: {
        marginBottom: 20,
    },
    summary: {
        fontSize: 18,
        fontWeight: '500',
        lineHeight: 28,
    },
    contentCard: {
        padding: 16,
    },
    contentText: {
        fontSize: 16,
        lineHeight: 26,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    tag: {
        paddingHorizontal: 14,
        paddingVertical: 8,
    },
    tagText: {
        fontSize: 14,
        fontWeight: '500',
    },
    relatedCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        marginBottom: 8,
    },
    relatedTitle: {
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
        marginRight: 8,
    },
});

export default SafetyNewsDetailScreen;
