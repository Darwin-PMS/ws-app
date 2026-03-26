import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Linking,
    Dimensions,
    Share,
    Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import safetyTutorialService from '../services/safetyTutorialService';
import RenderHtml from 'react-native-render-html';

const { width } = Dimensions.get('window');

const DIFFICULTY_CONFIG = {
    beginner: { color: '#10B981', bg: '#10B98115', icon: 'happy-outline', label: 'Beginner' },
    intermediate: { color: '#F59E0B', bg: '#F59E0B15', icon: 'fitness-outline', label: 'Intermediate' },
    advanced: { color: '#EF4444', bg: '#EF444415', icon: 'flash-outline', label: 'Advanced' },
};

const SafetyTutorialDetailScreen = ({ route, navigation }) => {
    const { tutorialId } = route.params;
    const { colors, borderRadius, shadows } = useTheme();
    const [tutorial, setTutorial] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showFullContent, setShowFullContent] = useState(false);
    const scrollY = useRef(new Animated.Value(0)).current;

    useEffect(() => { loadTutorial(); }, [tutorialId]);

    const loadTutorial = async () => {
        try {
            setLoading(true);
            const response = await safetyTutorialService.getTutorialById(tutorialId);
            if (response.success) setTutorial(response.data);
            else setError(response.message || 'Failed to load tutorial');
        } catch (err) {
            console.error('Error loading tutorial:', err);
            setError('An error occurred while loading the tutorial');
        } finally {
            setLoading(false);
        }
    };

    const getDifficultyConfig = (difficulty) => DIFFICULTY_CONFIG[difficulty?.toLowerCase()] || DIFFICULTY_CONFIG.beginner;

    const handleShare = async () => {
        try {
            await Share.share({
                message: `${tutorial.title}\n\n${tutorial.description}\n\nLearn more in the Women Safety App`,
                title: tutorial.title,
            });
        } catch (err) { console.error('Share error:', err); }
    };

    const handleVideoLink = () => {
        if (tutorial?.videoUrl) Linking.openURL(tutorial.videoUrl).catch(err => console.error('Failed to open video URL:', err));
    };

    const handleCall = () => {
        Linking.openURL('tel:181').catch(err => console.error('Failed to open dialer:', err));
    };

    if (loading) return <LoadingSpinner fullScreen message="Loading tutorial..." />;

    if (error) return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <EmptyState icon="alert-circle-outline" title="Error Loading Tutorial" message={error} actionLabel="Try Again" onAction={loadTutorial} />
        </View>
    );

    if (!tutorial) return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <EmptyState icon="book-outline" title="Tutorial Not Found" message="The tutorial you're looking for doesn't exist." actionLabel="Go Back" onAction={() => navigation.goBack()} />
        </View>
    );

    const difficultyConfig = getDifficultyConfig(tutorial.difficulty);
    const headerOpacity = scrollY.interpolate({ inputRange: [0, 100], outputRange: [1, 0], extrapolate: 'clamp' });

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Animated.ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
                scrollEventThrottle={16}
            >
                <View style={[styles.heroSection, { backgroundColor: difficultyConfig.color }]}>
                    <View style={styles.heroOverlay}>
                        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                            <Ionicons name="arrow-back" size={24} color={colors.white} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                            <Ionicons name="share-social" size={22} color={colors.white} />
                        </TouchableOpacity>
                    </View>

                    <Animated.View style={[styles.heroContent, { opacity: headerOpacity }]}>
                        <View style={[styles.categoryBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                            <Text style={styles.categoryBadgeText}>{tutorial.category?.replace('-', ' ')}</Text>
                        </View>
                        <Text style={styles.heroTitle}>{tutorial.title}</Text>
                        <Text style={styles.heroDescription}>{tutorial.description}</Text>

                        <View style={styles.heroMeta}>
                            {tutorial.duration && (
                                <View style={styles.metaItem}>
                                    <Ionicons name="time-outline" size={16} color="rgba(255,255,255,0.9)" />
                                    <Text style={styles.metaItemText}>{tutorial.duration} min</Text>
                                </View>
                            )}
                            <View style={[styles.difficultyBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                                <Text style={styles.difficultyText}>{difficultyConfig.label}</Text>
                            </View>
                        </View>
                    </Animated.View>
                </View>

                <View style={styles.contentSection}>
                    {tutorial.videoUrl && (
                        <TouchableOpacity style={[styles.videoCard, { backgroundColor: colors.card, ...shadows.sm }]} onPress={handleVideoLink}>
                            <View style={[styles.videoThumbnail, { backgroundColor: colors.error + '15' }]}>
                                <Ionicons name="play-circle-outline" size={48} color={colors.error} />
                            </View>
                            <View style={styles.videoInfo}>
                                <Text style={[styles.videoTitle, { color: colors.text }]}>Watch Video Tutorial</Text>
                                <Text style={[styles.videoSubtitle, { color: colors.textSecondary }]}>Learn visually with this video guide</Text>
                            </View>
                            <Ionicons name="arrow-forward-outline" size={20} color={colors.textTertiary} />
                        </TouchableOpacity>
                    )}

                    <View style={[styles.infoCard, { backgroundColor: colors.card, borderRadius: borderRadius.xl, ...shadows.sm }]}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Info</Text>
                        <View style={styles.infoGrid}>
                            {tutorial.duration && (
                                <View style={styles.infoItem}>
                                    <Ionicons name="time-outline" size={22} color={colors.primary} />
                                    <Text style={[styles.infoValue, { color: colors.text }]}>{tutorial.duration}</Text>
                                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Minutes</Text>
                                </View>
                            )}
                            <View style={styles.infoItem}>
                                <Ionicons name="speedometer-outline" size={22} color={difficultyConfig.color} />
                                <Text style={[styles.infoValue, { color: colors.text }]}>{difficultyConfig.label}</Text>
                                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Level</Text>
                            </View>
                            <View style={styles.infoItem}>
                                <Ionicons name="bookmark-outline" size={22} color={colors.secondary} />
                                <Text style={[styles.infoValue, { color: colors.text }]}>{tutorial.category?.replace('-', ' ')}</Text>
                                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Category</Text>
                            </View>
                        </View>
                    </View>

                    <View style={[styles.contentCard, { backgroundColor: colors.card, borderRadius: borderRadius.xl, ...shadows.sm }]}>
                        <View style={styles.contentHeader}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>Full Content</Text>
                            <TouchableOpacity onPress={() => setShowFullContent(!showFullContent)}>
                                <Text style={[styles.expandText, { color: colors.primary }]}>
                                    {showFullContent ? 'Show Less' : 'Show More'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.htmlContent}>
                            <RenderHtml
                                contentWidth={width - 64}
                                source={{ html: tutorial.content }}
                                baseStyle={{ color: colors.text, fontSize: 15, lineHeight: 24 }}
                                tagsStyles={{
                                    h1: { fontSize: 22, fontWeight: 'bold', color: colors.text, marginVertical: 10 },
                                    h2: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginVertical: 10 },
                                    h3: { fontSize: 18, fontWeight: '600', color: colors.text, marginVertical: 8 },
                                    p: { fontSize: 15, lineHeight: 24, color: colors.text, marginVertical: 6 },
                                    ul: { marginLeft: 16, marginVertical: 10 },
                                    ol: { marginLeft: 16, marginVertical: 10 },
                                    li: { fontSize: 15, lineHeight: 24, color: colors.text, marginVertical: 4 },
                                    strong: { fontWeight: 'bold', color: colors.text },
                                }}
                            />
                        </View>
                    </View>

                    <View style={[styles.helpCard, { backgroundColor: colors.warning + '10', borderRadius: borderRadius.xl }]}>
                        <Ionicons name="bulb-outline" size={24} color={colors.warning} />
                        <View style={styles.helpContent}>
                            <Text style={[styles.helpTitle, { color: colors.text }]}>Need Help?</Text>
                            <Text style={[styles.helpText, { color: colors.textSecondary }]}>
                                If you're in an emergency situation, don't hesitate to call for help immediately.
                            </Text>
                            <TouchableOpacity style={[styles.helpButton, { backgroundColor: colors.error }]} onPress={handleCall}>
                                <Ionicons name="call-outline" size={18} color={colors.white} />
                                <Text style={styles.helpButtonText}>Call Helpline</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Animated.ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { paddingBottom: 40 },
    heroSection: { paddingTop: 50, paddingBottom: 30, paddingHorizontal: 20 },
    heroOverlay: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' },
    shareButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' },
    heroContent: {},
    categoryBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginBottom: 12 },
    categoryBadgeText: { color: '#fff', fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
    heroTitle: { color: '#fff', fontSize: 26, fontWeight: 'bold', lineHeight: 34, marginBottom: 10 },
    heroDescription: { color: 'rgba(255,255,255,0.9)', fontSize: 15, lineHeight: 22, marginBottom: 16 },
    heroMeta: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    metaItemText: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '500' },
    difficultyBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, gap: 6 },
    difficultyText: { color: '#fff', fontSize: 13, fontWeight: '600' },
    contentSection: { padding: 16, marginTop: -20 },
    videoCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16, marginBottom: 16 },
    videoThumbnail: { width: 56, height: 56, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    videoInfo: { flex: 1, marginLeft: 14 },
    videoTitle: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
    videoSubtitle: { fontSize: 12 },
    infoCard: { padding: 18, marginBottom: 16 },
    sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
    infoGrid: { flexDirection: 'row', justifyContent: 'space-around' },
    infoItem: { alignItems: 'center' },
    infoValue: { fontSize: 16, fontWeight: '700', marginTop: 6 },
    infoLabel: { fontSize: 11, marginTop: 2 },
    contentCard: { padding: 18, marginBottom: 16 },
    contentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    expandText: { fontSize: 14, fontWeight: '600' },
    htmlContent: {},
    helpCard: { flexDirection: 'row', padding: 18, gap: 14 },
    helpContent: { flex: 1 },
    helpTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
    helpText: { fontSize: 13, lineHeight: 18, marginBottom: 12 },
    helpButton: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, gap: 6 },
    helpButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});

export default SafetyTutorialDetailScreen;
