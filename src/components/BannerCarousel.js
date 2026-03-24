import React, { useRef, useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Dimensions,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * BannerCarousel Component
 * A simple horizontal carousel with auto-scroll and pagination dots
 * 
 * @param {Object} props
 * @param {Array} props.banners - Array of banner objects with { id, title, subtitle, image, backgroundColor }
 * @param {Function} props.onPress - Callback when a banner is pressed
 * @param {Object} props.style - Additional container styles
 * @param {number} props.height - Height of the carousel (default: 150)
 * @param {boolean} props.autoPlay - Enable auto-scroll (default: true)
 * @param {number} props.autoPlayInterval - Auto-scroll interval in ms (default: 3000)
 */
const BannerCarousel = ({
    banners = [],
    onPress,
    style,
    height = 150,
    autoPlay = true,
    autoPlayInterval = 3000,
}) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const flatListRef = useRef(null);

    // Sample banners if none provided
    const defaultBanners = [
        {
            id: '1',
            title: 'Stay Safe',
            subtitle: 'Your safety is our priority',
            backgroundColor: '#FF6B6B',
        },
        {
            id: '2',
            title: 'Emergency Services',
            subtitle: 'Quick access to help',
            backgroundColor: '#4ECDC4',
        },
        {
            id: '3',
            title: 'Family Safety',
            subtitle: 'Keep your loved ones safe',
            backgroundColor: '#45B7D1',
        },
    ];

    const displayBanners = banners.length > 0 ? banners : defaultBanners;

    // Auto-scroll effect
    useEffect(() => {
        if (!autoPlay || displayBanners.length <= 1) return;

        const interval = setInterval(() => {
            const nextIndex = (activeIndex + 1) % displayBanners.length;
            flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
            setActiveIndex(nextIndex);
        }, autoPlayInterval);

        return () => clearInterval(interval);
    }, [activeIndex, autoPlay, autoPlayInterval, displayBanners.length]);

    const handleOnViewableItemsChanged = useRef(({ viewableItems }) => {
        if (viewableItems.length > 0) {
            setActiveIndex(viewableItems[0].index || 0);
        }
    }).current;

    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 50,
    }).current;

    const renderBanner = ({ item, index }) => {
        const isActive = index === activeIndex;

        return (
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => onPress && onPress(item)}
                style={[styles.bannerItem, { height }]}
            >
                <View
                    style={[
                        styles.bannerContent,
                        {
                            backgroundColor: item.backgroundColor || '#667eea',
                        },
                    ]}
                >
                    <Text style={styles.bannerTitle}>{item.title}</Text>
                    <Text style={styles.bannerSubtitle}>{item.subtitle}</Text>
                    {item.cta && (
                        <View style={styles.ctaButton}>
                            <Text style={styles.ctaText}>{item.cta}</Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    const renderPagination = () => {
        return (
            <View style={styles.pagination}>
                {displayBanners.map((_, index) => {
                    const isActive = index === activeIndex;
                    return (
                        <View
                            key={index}
                            style={[
                                styles.dot,
                                isActive ? styles.dotActive : styles.dotInactive,
                            ]}
                        />
                    );
                })}
            </View>
        );
    };

    if (displayBanners.length === 0) {
        return null;
    }

    const onScrollEnd = (event) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / SCREEN_WIDTH);
        setActiveIndex(index);
    };

    return (
        <View style={[styles.container, { height: height + 20 }, style]}>
            <FlatList
                ref={flatListRef}
                data={displayBanners}
                renderItem={renderBanner}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                pagingEnabled
                onScroll={onScrollEnd}
                scrollEventThrottle={16}
                onViewableItemsChanged={handleOnViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                getItemLayout={(data, index) => ({
                    length: SCREEN_WIDTH,
                    offset: SCREEN_WIDTH * index,
                    index,
                })}
            />
            {displayBanners.length > 1 && renderPagination()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    bannerItem: {
        width: SCREEN_WIDTH,
        paddingHorizontal: 16,
        justifyContent: 'center',
    },
    bannerContent: {
        flex: 1,
        borderRadius: 16,
        padding: 20,
        justifyContent: 'center',
    },
    bannerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    bannerSubtitle: {
        fontSize: 14,
        color: '#FFFFFF',
        opacity: 0.9,
    },
    ctaButton: {
        marginTop: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        alignSelf: 'flex-start',
    },
    ctaText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 12,
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
    },
    dot: {
        height: 8,
        borderRadius: 4,
        marginHorizontal: 4,
    },
    dotActive: {
        width: 16,
        backgroundColor: '#FFFFFF',
    },
    dotInactive: {
        width: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
    },
});

export default BannerCarousel;
