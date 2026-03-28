import React, { useState, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    PanResponder,
    Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import appFeaturesData from '../data/appFeatures.json';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = 50;

const AppGuideScreen = ({ navigation }) => {
    const { colors, spacing, borderRadius } = useTheme();

    const [currentPage, setCurrentPage] = useState(0);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedFeature, setSelectedFeature] = useState(null);
    const [isSwipeEnabled, setIsSwipeEnabled] = useState(true);

    const categories = appFeaturesData.categories;
    const totalPages = categories.length + 1;

    const translateX = useRef(new Animated.Value(0)).current;

    const goToNextPage = useCallback(() => {
        if (currentPage < totalPages - 1) {
            Animated.sequence([
                Animated.timing(translateX, {
                    toValue: -SCREEN_WIDTH,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(translateX, {
                    toValue: 0,
                    duration: 0,
                    useNativeDriver: true,
                }),
            ]).start();
            setCurrentPage(prev => prev + 1);
        }
    }, [currentPage, totalPages, translateX]);

    const goToPrevPage = useCallback(() => {
        if (currentPage > 0) {
            Animated.sequence([
                Animated.timing(translateX, {
                    toValue: SCREEN_WIDTH,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(translateX, {
                    toValue: 0,
                    duration: 0,
                    useNativeDriver: true,
                }),
            ]).start();
            setCurrentPage(prev => prev - 1);
        }
    }, [currentPage, translateX]);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => false,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return isSwipeEnabled && Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 30;
            },
            onPanResponderMove: (_, gestureState) => {
                if (!isSwipeEnabled) return;
                translateX.setValue(gestureState.dx * 0.3);
            },
            onPanResponderRelease: (_, gestureState) => {
                if (!isSwipeEnabled) return;
                if (gestureState.dx < -SWIPE_THRESHOLD) {
                    goToNextPage();
                } else if (gestureState.dx > SWIPE_THRESHOLD) {
                    goToPrevPage();
                } else {
                    Animated.spring(translateX, {
                        toValue: 0,
                        useNativeDriver: true,
                    }).start();
                }
            },
        })
    ).current;

    const renderCover = () => (
        <View style={[styles.coverPage, { backgroundColor: colors.primary }]}>
            <View style={styles.coverContent}>
                <View style={[styles.bookIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                    <Ionicons name="shield-checkmark" size={60} color="#fff" />
                </View>
                <Text style={styles.coverTitle}>{appFeaturesData.appName}</Text>
                <Text style={styles.coverSubtitle}>App Guide & Manual</Text>
                <Text style={styles.coverVersion}>Version {appFeaturesData.version}</Text>

                <View style={styles.coverDecoration}>
                    <View style={[styles.decorLine, { backgroundColor: 'rgba(255,255,255,0.3)' }]} />
                    <Text style={styles.coverDescription}>
                        Your complete guide to all features, how to use them, and tips for staying safe
                    </Text>
                    <View style={[styles.decorLine, { backgroundColor: 'rgba(255,255,255,0.3)' }]} />
                </View>

                <TouchableOpacity
                    style={[styles.startButton, { backgroundColor: '#fff' }]}
                    onPress={goToNextPage}
                >
                    <Text style={[styles.startButtonText, { color: colors.primary }]}>
                        Open Guide
                    </Text>
                    <Ionicons name="arrow-forward" size={20} color={colors.primary} />
                </TouchableOpacity>
            </View>

            <View style={[styles.pageFold, { borderBottomColor: colors.primary }]} />
        </View>
    );

    const renderCategoryPage = (category, index) => (
        <View style={[styles.page, { backgroundColor: colors.background }]}>
            <View style={[styles.pageHeader, { backgroundColor: category.color }]}>
                <Ionicons name={category.icon} size={32} color="#fff" />
                <Text style={styles.pageHeaderTitle}>{category.name}</Text>
            </View>

            <ScrollView style={styles.pageContent} showsVerticalScrollIndicator={false}>
                <Text style={[styles.categoryDescription, { color: colors.textSecondary }]}>
                    {category.description}
                </Text>

                <View style={styles.featureList}>
                    {category.features.slice(0, 4).map((feature, fIndex) => (
                        <TouchableOpacity
                            key={feature.id}
                            style={[styles.featureCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                            onPress={() => setSelectedFeature({ ...feature, categoryName: category.name })}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.featureIcon, { backgroundColor: category.color + '20' }]}>
                                <Ionicons name={feature.icon} size={20} color={category.color} />
                            </View>
                            <View style={styles.featureInfo}>
                                <Text style={[styles.featureTitle, { color: colors.text }]}>
                                    {feature.title}
                                </Text>
                                <Text style={[styles.featureSubtitle, { color: colors.textSecondary }]} numberOfLines={2}>
                                    {feature.description}
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                        </TouchableOpacity>
                    ))}
                </View>

                {category.features.length > 4 && (
                    <TouchableOpacity
                        style={[styles.viewAllButton, { backgroundColor: category.color + '15' }]}
                        onPress={() => setSelectedCategory(category)}
                    >
                        <Text style={[styles.viewAllText, { color: category.color }]}>
                            View All {category.features.length} Features
                        </Text>
                        <Ionicons name="arrow-forward" size={18} color={category.color} />
                    </TouchableOpacity>
                )}
            </ScrollView>

            <View style={[styles.pageNumber, { borderTopColor: colors.border }]}>
                <Text style={[styles.pageNumberText, { color: colors.textMuted }]}>
                    Page {index + 2} of {totalPages}
                </Text>
            </View>

            <View style={[styles.pageFoldCorner, { borderBottomColor: category.color }]} />
        </View>
    );

    const renderFeatureDetail = () => {
        if (!selectedFeature) return null;

        const category = categories.find(c => c.name === selectedFeature.categoryName);
        const color = category?.color || colors.primary;

        return (
            <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
                <View style={[styles.modalHeader, { backgroundColor: color }]}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => setSelectedFeature(null)}
                    >
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <View style={styles.modalHeaderContent}>
                        <Ionicons name={selectedFeature.icon} size={28} color="#fff" />
                        <Text style={styles.modalTitle}>{selectedFeature.title}</Text>
                    </View>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                    <View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.detailDescription, { color: colors.text }]}>
                            {selectedFeature.description}
                        </Text>
                    </View>

                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        How to Use
                    </Text>
                    <View style={styles.stepsContainer}>
                        {selectedFeature.steps.map((step, index) => (
                            <View key={index} style={styles.stepItem}>
                                <View style={[styles.stepNumber, { backgroundColor: color }]}>
                                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                                </View>
                                <Text style={[styles.stepText, { color: colors.text }]}>{step}</Text>
                            </View>
                        ))}
                    </View>

                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        Tips
                    </Text>
                    <View style={styles.tipsContainer}>
                        {selectedFeature.tips.map((tip, index) => (
                            <View key={index} style={[styles.tipItem, { backgroundColor: color + '15' }]}>
                                <Ionicons name="bulb" size={18} color={color} />
                                <Text style={[styles.tipText, { color: colors.text }]}>{tip}</Text>
                            </View>
                        ))}
                    </View>
                </ScrollView>
            </View>
        );
    };

    const renderCategoryDetail = () => {
        if (!selectedCategory) return null;

        return (
            <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
                <View style={[styles.modalHeader, { backgroundColor: selectedCategory.color }]}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => setSelectedCategory(null)}
                    >
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <View style={styles.modalHeaderContent}>
                        <Ionicons name={selectedCategory.icon} size={28} color="#fff" />
                        <Text style={styles.modalTitle}>{selectedCategory.name}</Text>
                    </View>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                    <Text style={[styles.categoryFullDescription, { color: colors.textSecondary }]}>
                        {selectedCategory.description}
                    </Text>

                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        All Features ({selectedCategory.features.length})
                    </Text>

                    {selectedCategory.features.map((feature, index) => (
                        <TouchableOpacity
                            key={feature.id}
                            style={[styles.featureExpandCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                            onPress={() => setSelectedFeature({ ...feature, categoryName: selectedCategory.name })}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.featureExpandIcon, { backgroundColor: selectedCategory.color + '20' }]}>
                                <Ionicons name={feature.icon} size={22} color={selectedCategory.color} />
                            </View>
                            <View style={styles.featureExpandInfo}>
                                <Text style={[styles.featureExpandTitle, { color: colors.text }]}>
                                    {feature.title}
                                </Text>
                                <Text style={[styles.featureExpandDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                                    {feature.description}
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={22} color={colors.textMuted} />
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        );
    };

    if (selectedFeature) {
        return renderFeatureDetail();
    }

    if (selectedCategory) {
        return renderCategoryDetail();
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Animated.View 
                style={[styles.bookContainer, { transform: [{ translateX }] }]}
                {...panResponder.panHandlers}
            >
                {currentPage === 0 ? renderCover() : renderCategoryPage(categories[currentPage - 1], currentPage - 1)}
            </Animated.View>

            {currentPage > 0 && (
                <TouchableOpacity
                    style={[styles.navButton, styles.prevButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={goToPrevPage}
                >
                    <Ionicons name="chevron-back" size={28} color={colors.primary} />
                </TouchableOpacity>
            )}

            {currentPage < totalPages - 1 && (
                <TouchableOpacity
                    style={[styles.navButton, styles.nextButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={goToNextPage}
                >
                    <Ionicons name="chevron-forward" size={28} color={colors.primary} />
                </TouchableOpacity>
            )}

            <View style={styles.pagination}>
                {Array.from({ length: totalPages }).map((_, index) => (
                    <TouchableOpacity
                        key={index}
                        onPress={() => {
                            Animated.sequence([
                                Animated.timing(translateX, {
                                    toValue: index > currentPage ? -SCREEN_WIDTH : SCREEN_WIDTH,
                                    duration: 200,
                                    useNativeDriver: true,
                                }),
                                Animated.timing(translateX, {
                                    toValue: 0,
                                    duration: 0,
                                    useNativeDriver: true,
                                }),
                            ]).start();
                            setCurrentPage(index);
                        }}
                    >
                        <View
                            style={[
                                styles.paginationDot,
                                {
                                    backgroundColor: index === currentPage ? colors.primary : colors.border,
                                    width: index === currentPage ? 24 : 8,
                                }
                            ]}
                        />
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.swipeHint}>
                <Ionicons name="finger-print" size={16} color={colors.textMuted} />
                <Text style={[styles.swipeHintText, { color: colors.textMuted }]}>
                    Swipe left or right to change pages
                </Text>
            </View>

            <TouchableOpacity
                style={[styles.tocButton, { backgroundColor: colors.primary }]}
                onPress={() => setCurrentPage(0)}
            >
                <Ionicons name="book" size={20} color="#fff" />
                <Text style={styles.tocButtonText}>Contents</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    bookContainer: {
        flex: 1,
    },
    coverPage: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    coverContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bookIcon: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    coverTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
    },
    coverSubtitle: {
        fontSize: 18,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 8,
    },
    coverVersion: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
        marginTop: 16,
        paddingHorizontal: 16,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
        borderRadius: 12,
    },
    coverDecoration: {
        marginTop: 32,
        alignItems: 'center',
    },
    decorLine: {
        width: 60,
        height: 2,
        marginVertical: 12,
    },
    coverDescription: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.85)',
        textAlign: 'center',
        paddingHorizontal: 20,
        lineHeight: 22,
    },
    startButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 25,
        marginTop: 40,
        gap: 8,
    },
    startButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    pageFold: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 20,
        borderBottomWidth: 20,
        borderBottomColor: 'transparent',
        borderLeftWidth: SCREEN_WIDTH,
        borderLeftColor: 'transparent',
        borderRightWidth: 0,
        borderRightColor: 'transparent',
    },
    page: {
        flex: 1,
    },
    pageHeader: {
        padding: 20,
        alignItems: 'center',
    },
    pageHeaderTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 8,
    },
    pageContent: {
        flex: 1,
        padding: 16,
    },
    categoryDescription: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 20,
    },
    featureList: {
        gap: 12,
    },
    featureCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
    },
    featureIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    featureInfo: {
        flex: 1,
        marginLeft: 12,
    },
    featureTitle: {
        fontSize: 15,
        fontWeight: '600',
    },
    featureSubtitle: {
        fontSize: 12,
        marginTop: 2,
    },
    viewAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        borderRadius: 12,
        marginTop: 16,
        gap: 8,
    },
    viewAllText: {
        fontSize: 14,
        fontWeight: '600',
    },
    pageNumber: {
        padding: 12,
        borderTopWidth: 1,
        alignItems: 'center',
    },
    pageNumberText: {
        fontSize: 12,
    },
    pageFoldCorner: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 0,
        height: 0,
        borderStyle: 'solid',
        borderLeftWidth: 30,
        borderBottomWidth: 30,
        borderLeftColor: 'transparent',
        borderBottomColor: 'transparent',
    },
    navButton: {
        position: 'absolute',
        top: '50%',
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        borderWidth: 1,
    },
    prevButton: {
        left: 10,
    },
    nextButton: {
        right: 10,
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
        gap: 6,
    },
    paginationDot: {
        height: 8,
        borderRadius: 4,
    },
    swipeHint: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 20,
        gap: 6,
    },
    swipeHintText: {
        fontSize: 12,
    },
    tocButton: {
        position: 'absolute',
        bottom: 70,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        gap: 6,
    },
    tocButtonText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },
    modalContainer: {
        flex: 1,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        paddingTop: 50,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalHeaderContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    modalContent: {
        flex: 1,
        padding: 16,
    },
    detailCard: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 20,
    },
    detailDescription: {
        fontSize: 15,
        lineHeight: 22,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    stepsContainer: {
        gap: 12,
        marginBottom: 24,
    },
    stepItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    stepNumber: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepNumberText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    stepText: {
        flex: 1,
        fontSize: 14,
        lineHeight: 20,
    },
    tipsContainer: {
        gap: 10,
        marginBottom: 40,
    },
    tipItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 14,
        borderRadius: 10,
        gap: 10,
    },
    tipText: {
        flex: 1,
        fontSize: 14,
        lineHeight: 20,
    },
    categoryFullDescription: {
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 24,
        textAlign: 'center',
    },
    featureExpandCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 12,
    },
    featureExpandIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    featureExpandInfo: {
        flex: 1,
        marginLeft: 12,
    },
    featureExpandTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    featureExpandDesc: {
        fontSize: 13,
        marginTop: 4,
    },
});

export default AppGuideScreen;
