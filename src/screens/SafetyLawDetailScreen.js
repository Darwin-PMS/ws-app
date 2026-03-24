// Safety Law Detail Screen
// Full law details display

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import safetyLawService from '../services/safetyLawService';

const SafetyLawDetailScreen = ({ route, navigation }) => {
    const { lawId } = route.params;
    const { colors, spacing, borderRadius, shadows } = useTheme();

    const [law, setLaw] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Load law details
    useEffect(() => {
        loadLaw();
    }, [lawId]);

    const loadLaw = async () => {
        try {
            setLoading(true);
            const response = await safetyLawService.getLawById(lawId);

            if (response.success) {
                setLaw(response.data);
            } else {
                setError(response.message || 'Failed to load law');
            }
        } catch (err) {
            console.error('Error loading law:', err);
            setError('An error occurred while loading the law');
        } finally {
            setLoading(false);
        }
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    // Get penalty color
    const getPenaltyColor = (penalty) => {
        if (!penalty) return colors.error;
        const penaltyLower = penalty.toLowerCase();
        if (penaltyLower.includes('death') || penaltyLower.includes('life imprisonment')) {
            return colors.error;
        } else if (penaltyLower.includes('imprisonment') || penaltyLower.includes('jail')) {
            return colors.warning;
        } else if (penaltyLower.includes('fine')) {
            return colors.info;
        }
        return colors.error;
    };

    // Handle share
    const handleShare = async () => {
        try {
            await Share.share({
                message: `${law.title}\n\n${law.description || ''}\n\nPenalty: ${law.penalty || 'N/A'}`,
                title: law.title,
            });
        } catch (err) {
            console.error('Share error:', err);
        }
    };

    // Render loading state
    if (loading) {
        return <LoadingSpinner fullScreen message="Loading law details..." />;
    }

    // Render error state
    if (error) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <EmptyState
                    icon="alert-circle-outline"
                    title="Error Loading Law"
                    message={error}
                    actionLabel="Try Again"
                    onAction={loadLaw}
                />
            </View>
        );
    }

    // Render empty state
    if (!law) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <EmptyState
                    icon="document-text-outline"
                    title="Law Not Found"
                    message="The law you're looking for doesn't exist."
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
                <View style={[styles.header, { backgroundColor: colors.info }]}>
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

                {/* Content */}
                <View style={styles.contentContainer}>
                    {/* Title */}
                    <Text style={[styles.title, { color: colors.text }]}>
                        {law.title}
                    </Text>

                    {/* Category & Jurisdiction */}
                    <View style={styles.metaRow}>
                        {law.category && (
                            <View style={[styles.badge, { backgroundColor: colors.primary + '20' }]}>
                                <Ionicons name="folder" size={14} color={colors.primary} />
                                <Text style={[styles.badgeText, { color: colors.primary }]}>
                                    {law.category}
                                </Text>
                            </View>
                        )}
                        {law.jurisdiction && (
                            <View style={[styles.badge, { backgroundColor: colors.secondary + '20' }]}>
                                <Ionicons name="location" size={14} color={colors.secondary} />
                                <Text style={[styles.badgeText, { color: colors.secondary }]}>
                                    {law.jurisdiction}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Description */}
                    {law.description && (
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                Description
                            </Text>
                            <Text style={[styles.description, { color: colors.textSecondary }]}>
                                {law.description}
                            </Text>
                        </View>
                    )}

                    {/* Effective Date */}
                    {law.effective_date && (
                        <View style={[styles.infoCard, { backgroundColor: colors.surface, borderRadius, ...shadows.small }]}>
                            <View style={styles.infoRow}>
                                <Ionicons name="calendar-outline" size={20} color={colors.info} />
                                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                                    Effective Date:
                                </Text>
                                <Text style={[styles.infoValue, { color: colors.text }]}>
                                    {formatDate(law.effective_date)}
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* Penalty */}
                    {law.penalty && (
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                Penalty
                            </Text>
                            <View style={[styles.penaltyCard, { backgroundColor: getPenaltyColor(law.penalty) + '15', borderRadius }]}>
                                <View style={styles.penaltyHeader}>
                                    <Ionicons name="warning" size={24} color={getPenaltyColor(law.penalty)} />
                                    <Text style={[styles.penaltyLabel, { color: getPenaltyColor(law.penalty) }]}>
                                        Penalty / Punishment
                                    </Text>
                                </View>
                                <Text style={[styles.penaltyText, { color: colors.text }]}>
                                    {law.penalty}
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* Content / Full Law Text */}
                    {law.content && (
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                Law Details
                            </Text>
                            <View style={[styles.contentCard, { backgroundColor: colors.surface, borderRadius, ...shadows.small }]}>
                                <Text style={[styles.contentText, { color: colors.text }]}>
                                    {law.content}
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* Key Points (if available) */}
                    {law.key_points && law.key_points.length > 0 && (
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                Key Points
                            </Text>
                            {law.key_points.map((point, index) => (
                                <View
                                    key={index}
                                    style={[styles.keyPointCard, { backgroundColor: colors.surface, borderRadius, ...shadows.small }]}
                                >
                                    <View style={[styles.pointNumber, { backgroundColor: colors.primary }]}>
                                        <Text style={styles.pointNumberText}>{index + 1}</Text>
                                    </View>
                                    <Text style={[styles.pointText, { color: colors.text }]}>
                                        {point}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Rights (if available) */}
                    {law.rights && law.rights.length > 0 && (
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                Your Rights
                            </Text>
                            {law.rights.map((right, index) => (
                                <View
                                    key={index}
                                    style={[styles.rightCard, { backgroundColor: colors.success + '15', borderRadius }]}
                                >
                                    <Ionicons name="shield-checkmark" size={20} color={colors.success} />
                                    <Text style={[styles.rightText, { color: colors.text }]}>
                                        {right}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Related Laws (placeholder - would need API) */}
                    {law.related && law.related.length > 0 && (
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                Related Laws
                            </Text>
                            {law.related.map((item, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[styles.relatedCard, { backgroundColor: colors.surface, borderRadius, ...shadows.small }]}
                                    onPress={() => navigation.push('SafetyLawDetail', { lawId: item.id })}
                                >
                                    <Text style={[styles.relatedTitle, { color: colors.text }]} numberOfLines={2}>
                                        {item.title}
                                    </Text>
                                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    {/* Help Section */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>
                            Need Help?
                        </Text>
                        <View style={[styles.helpCard, { backgroundColor: colors.primary + '15', borderRadius }]}>
                            <Ionicons name="help-circle" size={24} color={colors.primary} />
                            <Text style={[styles.helpText, { color: colors.text }]}>
                                If you need legal assistance or have questions about your rights, consider consulting with a legal professional or contacting relevant authorities.
                            </Text>
                        </View>
                    </View>
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
    contentContainer: {
        padding: 16,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        lineHeight: 34,
        marginBottom: 12,
    },
    metaRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 20,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 6,
    },
    badgeText: {
        fontSize: 14,
        fontWeight: '500',
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
    },
    description: {
        fontSize: 15,
        lineHeight: 22,
    },
    infoCard: {
        padding: 16,
        marginBottom: 20,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    infoLabel: {
        fontSize: 14,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '500',
    },
    penaltyCard: {
        padding: 16,
    },
    penaltyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    penaltyLabel: {
        fontSize: 14,
        fontWeight: '600',
    },
    penaltyText: {
        fontSize: 16,
        fontWeight: '500',
        lineHeight: 24,
    },
    contentCard: {
        padding: 16,
    },
    contentText: {
        fontSize: 15,
        lineHeight: 26,
    },
    keyPointCard: {
        flexDirection: 'row',
        padding: 16,
        marginBottom: 10,
    },
    pointNumber: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    pointNumberText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 13,
    },
    pointText: {
        flex: 1,
        fontSize: 14,
        lineHeight: 20,
    },
    rightCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        marginBottom: 8,
        gap: 12,
    },
    rightText: {
        flex: 1,
        fontSize: 14,
        lineHeight: 20,
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
    helpCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 16,
        gap: 12,
    },
    helpText: {
        flex: 1,
        fontSize: 14,
        lineHeight: 20,
    },
});

export default SafetyLawDetailScreen;
