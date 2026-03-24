// Safety Tutorial Detail Screen
// Full tutorial content display

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Linking,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import safetyTutorialService from '../services/safetyTutorialService';

const SafetyTutorialDetailScreen = ({ route, navigation }) => {
    const { tutorialId } = route.params;
    const { colors, spacing, borderRadius, shadows } = useTheme();

    const [tutorial, setTutorial] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Load tutorial details
    useEffect(() => {
        loadTutorial();
    }, [tutorialId]);

    const loadTutorial = async () => {
        try {
            setLoading(true);
            const response = await safetyTutorialService.getTutorialById(tutorialId);

            if (response.success) {
                setTutorial(response.data);
            } else {
                setError(response.message || 'Failed to load tutorial');
            }
        } catch (err) {
            console.error('Error loading tutorial:', err);
            setError('An error occurred while loading the tutorial');
        } finally {
            setLoading(false);
        }
    };

    // Get difficulty color
    const getDifficultyColor = (difficulty) => {
        switch (difficulty?.toLowerCase()) {
            case 'beginner':
                return colors.success;
            case 'intermediate':
                return colors.warning;
            case 'advanced':
                return colors.error;
            default:
                return colors.info;
        }
    };

    // Handle video link
    const handleVideoLink = () => {
        if (tutorial?.video_url) {
            Linking.openURL(tutorial.video_url).catch(err =>
                console.error('Failed to open video URL:', err)
            );
        }
    };

    // Render loading state
    if (loading) {
        return <LoadingSpinner fullScreen message="Loading tutorial..." />;
    }

    // Render error state
    if (error) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <EmptyState
                    icon="alert-circle-outline"
                    title="Error Loading Tutorial"
                    message={error}
                    actionLabel="Try Again"
                    onAction={loadTutorial}
                />
            </View>
        );
    }

    // Render empty state
    if (!tutorial) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <EmptyState
                    icon="book-outline"
                    title="Tutorial Not Found"
                    message="The tutorial you're looking for doesn't exist."
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
                <View style={[styles.header, { backgroundColor: colors.primary }]}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color={colors.white} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.white }]}>
                        Tutorial Details
                    </Text>
                </View>

                {/* Content Card */}
                <View style={styles.contentContainer}>
                    {/* Title */}
                    <Text style={[styles.title, { color: colors.text }]}>
                        {tutorial.title}
                    </Text>

                    {/* Meta Information */}
                    <View style={styles.metaContainer}>
                        {tutorial.category && (
                            <View style={[styles.badge, { backgroundColor: colors.primary + '20' }]}>
                                <Text style={[styles.badgeText, { color: colors.primary }]}>
                                    {tutorial.category}
                                </Text>
                            </View>
                        )}
                        {tutorial.difficulty && (
                            <View style={[styles.badge, { backgroundColor: getDifficultyColor(tutorial.difficulty) + '20' }]}>
                                <Text style={[styles.badgeText, { color: getDifficultyColor(tutorial.difficulty) }]}>
                                    {tutorial.difficulty}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Duration & Info */}
                    <View style={[styles.infoCard, { backgroundColor: colors.surface, borderRadius, ...shadows.small }]}>
                        {tutorial.duration && (
                            <View style={styles.infoRow}>
                                <Ionicons name="time-outline" size={20} color={colors.primary} />
                                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                                    Duration:
                                </Text>
                                <Text style={[styles.infoValue, { color: colors.text }]}>
                                    {tutorial.duration}
                                </Text>
                            </View>
                        )}
                        {tutorial.steps && (
                            <View style={styles.infoRow}>
                                <Ionicons name="list-outline" size={20} color={colors.primary} />
                                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                                    Steps:
                                </Text>
                                <Text style={[styles.infoValue, { color: colors.text }]}>
                                    {tutorial.steps.length} steps
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Description */}
                    {tutorial.description && (
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                Description
                            </Text>
                            <Text style={[styles.description, { color: colors.textSecondary }]}>
                                {tutorial.description}
                            </Text>
                        </View>
                    )}

                    {/* Video Section */}
                    {tutorial.video_url && (
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                Video Tutorial
                            </Text>
                            <TouchableOpacity
                                style={[styles.videoButton, { backgroundColor: colors.error }]}
                                onPress={handleVideoLink}
                            >
                                <Ionicons name="play-circle" size={32} color={colors.white} />
                                <Text style={[styles.videoButtonText, { color: colors.white }]}>
                                    Watch Video
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Content */}
                    {tutorial.content && (
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                Content
                            </Text>
                            <View style={[styles.contentCard, { backgroundColor: colors.surface, borderRadius, ...shadows.small }]}>
                                <Text style={[styles.contentText, { color: colors.text }]}>
                                    {tutorial.content}
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* Steps (if available) */}
                    {tutorial.steps && tutorial.steps.length > 0 && (
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                Steps
                            </Text>
                            {tutorial.steps.map((step, index) => (
                                <View
                                    key={index}
                                    style={[styles.stepCard, { backgroundColor: colors.surface, borderRadius, ...shadows.small }]}
                                >
                                    <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                                        <Text style={styles.stepNumberText}>{index + 1}</Text>
                                    </View>
                                    <View style={styles.stepContent}>
                                        {step.title && (
                                            <Text style={[styles.stepTitle, { color: colors.text }]}>
                                                {step.title}
                                            </Text>
                                        )}
                                        {step.description && (
                                            <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
                                                {step.description}
                                            </Text>
                                        )}
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Tips (if available) */}
                    {tutorial.tips && tutorial.tips.length > 0 && (
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                Tips
                            </Text>
                            {tutorial.tips.map((tip, index) => (
                                <View
                                    key={index}
                                    style={[styles.tipCard, { backgroundColor: colors.success + '15', borderRadius }]}
                                >
                                    <Ionicons name="bulb" size={20} color={colors.success} />
                                    <Text style={[styles.tipText, { color: colors.text }]}>
                                        {tip}
                                    </Text>
                                </View>
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
        alignItems: 'center',
        padding: 24,
        paddingTop: 48,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    backButton: {
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
    },
    contentContainer: {
        padding: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    metaContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    badgeText: {
        fontSize: 14,
        fontWeight: '500',
        textTransform: 'capitalize',
    },
    infoCard: {
        padding: 16,
        marginBottom: 20,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    infoLabel: {
        fontSize: 14,
        marginLeft: 8,
        marginRight: 4,
    },
    infoValue: {
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
    videoButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        gap: 8,
    },
    videoButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    contentCard: {
        padding: 16,
    },
    contentText: {
        fontSize: 15,
        lineHeight: 24,
    },
    stepCard: {
        flexDirection: 'row',
        padding: 16,
        marginBottom: 12,
    },
    stepNumber: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    stepNumberText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    stepContent: {
        flex: 1,
    },
    stepTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    stepDescription: {
        fontSize: 14,
        lineHeight: 20,
    },
    tipCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        marginBottom: 8,
        gap: 12,
    },
    tipText: {
        flex: 1,
        fontSize: 14,
        lineHeight: 20,
    },
});

export default SafetyTutorialDetailScreen;
