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
    Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import safetyLawService from '../services/safetyLawService';
import RenderHtml from 'react-native-render-html';

const { width } = Dimensions.get('window');

const CATEGORY_CONFIG = {
    criminal: { color: '#EF4444', bg: '#EF444415', icon: 'shield-outline' },
    workplace: { color: '#3B82F6', bg: '#3B82F615', icon: 'briefcase-outline' },
    road: { color: '#F59E0B', bg: '#F59E0B15', icon: 'car-outline' },
    domestic: { color: '#8B5CF6', bg: '#8B5CF615', icon: 'home-outline' },
    default: { color: '#10B981', bg: '#10B98115', icon: 'document-text-outline' },
};

const PENALTY_CONFIG = {
    severe: { color: '#DC2626', bg: '#DC262615', icon: 'alert-circle-outline' },
    imprisonment: { color: '#EA580C', bg: '#EA580C15', icon: 'lock-closed-outline' },
    fine: { color: '#CA8A04', bg: '#CA8A0415', icon: 'cash-outline' },
    other: { color: '#6B7280', bg: '#6B728015', icon: 'document-outline' },
};

const SafetyLawDetailScreen = ({ route, navigation }) => {
    const { lawId } = route.params;
    const { colors, borderRadius, shadows } = useTheme();
    const [law, setLaw] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const scrollY = useRef(new Animated.Value(0)).current;

    useEffect(() => { loadLaw(); }, [lawId]);

    const loadLaw = async () => {
        try {
            setLoading(true);
            const response = await safetyLawService.getLawById(lawId);
            if (response.success) setLaw(response.data);
            else setError(response.message || 'Failed to load law');
        } catch (err) {
            console.error('Error loading law:', err);
            setError('An error occurred while loading the law');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const getCategoryConfig = (category) => {
        const key = category?.toLowerCase() || 'default';
        return CATEGORY_CONFIG[key] || CATEGORY_CONFIG.default;
    };

    const getPenaltyConfig = (penalty) => {
        if (!penalty) return PENALTY_CONFIG.other;
        const lower = penalty.toLowerCase();
        if (lower.includes('death') || lower.includes('life imprisonment')) return PENALTY_CONFIG.severe;
        if (lower.includes('imprisonment') || lower.includes('jail') || lower.includes('rigorous')) return PENALTY_CONFIG.imprisonment;
        if (lower.includes('fine')) return PENALTY_CONFIG.fine;
        return PENALTY_CONFIG.other;
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: `${law.title}\n\n${law.description || ''}\n\nPenalty: ${law.penalty || 'N/A'}\n\nKnow your rights. Women Safety App`,
                title: law.title,
            });
        } catch (err) { console.error('Share error:', err); }
    };

    const handleCallHelpline = () => Linking.openURL('tel:181');

    if (loading) return <LoadingSpinner fullScreen message="Loading law details..." />;

    if (error) return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <EmptyState icon="alert-circle-outline" title="Error Loading Law" message={error} actionLabel="Try Again" onAction={loadLaw} />
        </View>
    );

    if (!law) return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <EmptyState icon="document-text-outline" title="Law Not Found" message="The law you're looking for doesn't exist." actionLabel="Go Back" onAction={() => navigation.goBack()} />
        </View>
    );

    const categoryConfig = getCategoryConfig(law.category);
    const penaltyConfig = getPenaltyConfig(law.penalty);
    const headerOpacity = scrollY.interpolate({ inputRange: [0, 100], outputRange: [1, 0], extrapolate: 'clamp' });

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Animated.ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
                scrollEventThrottle={16}
            >
                <View style={[styles.heroSection, { backgroundColor: categoryConfig.color }]}>
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
                            <Ionicons name={categoryConfig.icon} size={14} color="#fff" />
                            <Text style={styles.categoryBadgeText}>{law.category?.replace('-', ' ')}</Text>
                        </View>
                        <Text style={styles.heroTitle}>{law.title}</Text>
                        <Text style={styles.heroDescription}>{law.description}</Text>

                        <View style={styles.heroMeta}>
                            {law.jurisdiction && (
                                <View style={[styles.metaItem, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                                    <Ionicons name="location-outline" size={14} color="#fff" />
                                    <Text style={styles.metaItemText}>{law.jurisdiction}</Text>
                                </View>
                            )}
                            {law.effectiveDate && (
                                <View style={[styles.metaItem, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                                    <Ionicons name="calendar-outline" size={14} color="#fff" />
                                    <Text style={styles.metaItemText}>{formatDate(law.effectiveDate)}</Text>
                                </View>
                            )}
                        </View>
                    </Animated.View>
                </View>

                <View style={styles.contentSection}>
                    {law.penalty && (
                        <View style={[styles.penaltyCard, { backgroundColor: penaltyConfig.bg, borderRadius: borderRadius.xl }]}>
                            <View style={styles.penaltyHeader}>
                                <View style={[styles.penaltyIcon, { backgroundColor: penaltyConfig.color + '20' }]}>
                                    <Ionicons name={penaltyConfig.icon} size={24} color={penaltyConfig.color} />
                                </View>
                                <View style={styles.penaltyInfo}>
                                    <Text style={[styles.penaltyLabel, { color: penaltyConfig.color }]}>Punishment / Penalty</Text>
                                    <Text style={[styles.penaltyText, { color: colors.text }]}>{law.penalty}</Text>
                                </View>
                            </View>
                        </View>
                    )}

                    <View style={[styles.quickInfoCard, { backgroundColor: colors.card, borderRadius: borderRadius.xl, ...shadows.sm }]}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Information</Text>
                        <View style={styles.infoGrid}>
                            <View style={[styles.infoItem, { backgroundColor: categoryConfig.bg }]}>
                                <Text style={[styles.infoValue, { color: colors.text }]}>{law.category?.replace('-', ' ')}</Text>
                                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Category</Text>
                            </View>
                            <View style={[styles.infoItem, { backgroundColor: colors.secondary + '15' }]}>
                                <Ionicons name="globe-outline" size={24} color={colors.secondary} />
                                <Text style={[styles.infoValue, { color: colors.text }]}>{law.jurisdiction || 'N/A'}</Text>
                                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Region</Text>
                            </View>
                        </View>
                    </View>

                    {law.content && (
                        <View style={[styles.contentCard, { backgroundColor: colors.card, borderRadius: borderRadius.xl, ...shadows.sm }]}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>Law Details</Text>
                            <RenderHtml
                                contentWidth={width - 64}
                                source={{ html: law.content }}
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
                    )}

                    <View style={[styles.yourRightsCard, { backgroundColor: colors.success + '10', borderRadius: borderRadius.xl }]}>
                        <View style={styles.yourRightsHeader}>
                            <Ionicons name="shield-checkmark-outline" size={28} color={colors.success} />
                            <Text style={[styles.yourRightsTitle, { color: colors.text }]}>Your Rights</Text>
                        </View>
                        <Text style={[styles.yourRightsText, { color: colors.textSecondary }]}>
                            Every woman has the right to live with dignity and free from violence. If you or someone you know needs help, don't hesitate to reach out.
                        </Text>
                    </View>

                    <View style={[styles.helpCard, { backgroundColor: colors.primary + '10', borderRadius: borderRadius.xl }]}>
                        <Ionicons name="call" size={28} color={colors.primary} />
                        <View style={styles.helpContent}>
                            <Text style={[styles.helpTitle, { color: colors.text }]}>Need Legal Help?</Text>
                            <Text style={[styles.helpText, { color: colors.textSecondary }]}>
                                Contact the women helpline or consult with a legal professional for guidance on your specific situation.
                            </Text>
                            <TouchableOpacity style={[styles.helpButton, { backgroundColor: colors.primary }]} onPress={handleCallHelpline}>
                                <Ionicons name="call" size={18} color={colors.white} />
                                <Text style={styles.helpButtonText}>Call 181 Helpline</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={[styles.disclaimerCard, { backgroundColor: colors.surface, borderRadius: borderRadius.xl, ...shadows.sm }]}>
                        <Ionicons name="information-circle" size={20} color={colors.textTertiary} />
                        <Text style={[styles.disclaimerText, { color: colors.textSecondary }]}>
                            This information is for educational purposes only and should not be considered legal advice. For specific legal matters, please consult with a qualified legal professional.
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
    heroSection: { paddingTop: 50, paddingBottom: 30, paddingHorizontal: 20 },
    heroOverlay: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' },
    shareButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' },
    heroContent: {},
    categoryBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, gap: 6, marginBottom: 12 },
    categoryBadgeText: { color: '#fff', fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
    heroTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold', lineHeight: 32, marginBottom: 10 },
    heroDescription: { color: 'rgba(255,255,255,0.9)', fontSize: 15, lineHeight: 22, marginBottom: 16 },
    heroMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    metaItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, gap: 6 },
    metaItemText: { color: '#fff', fontSize: 12, fontWeight: '500' },
    contentSection: { padding: 16, marginTop: -16 },
    penaltyCard: { padding: 18, marginBottom: 16 },
    penaltyHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
    penaltyIcon: { width: 50, height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    penaltyInfo: { flex: 1 },
    penaltyLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
    penaltyText: { fontSize: 15, lineHeight: 22, fontWeight: '500' },
    quickInfoCard: { padding: 18, marginBottom: 16 },
    sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
    infoGrid: { flexDirection: 'row', gap: 12 },
    infoItem: { flex: 1, alignItems: 'center', padding: 16, borderRadius: 16 },
    infoValue: { fontSize: 13, fontWeight: '700', marginTop: 10, textTransform: 'capitalize', textAlign: 'center' },
    infoLabel: { fontSize: 11, marginTop: 4 },
    contentCard: { padding: 18, marginBottom: 16 },
    yourRightsCard: { padding: 18, marginBottom: 16 },
    yourRightsHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
    yourRightsTitle: { fontSize: 17, fontWeight: '700' },
    yourRightsText: { fontSize: 14, lineHeight: 21 },
    helpCard: { flexDirection: 'row', padding: 18, marginBottom: 16, gap: 14 },
    helpContent: { flex: 1 },
    helpTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
    helpText: { fontSize: 13, lineHeight: 19, marginBottom: 12 },
    helpButton: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, gap: 6 },
    helpButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
    disclaimerCard: { flexDirection: 'row', padding: 14, gap: 10 },
    disclaimerText: { flex: 1, fontSize: 12, lineHeight: 18 },
});

export default SafetyLawDetailScreen;
