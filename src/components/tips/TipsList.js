// Tips List Component
// FlatList wrapper for displaying tips with pull-to-refresh

import React from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import TipCard from './TipCard';
import EmptyState from '../common/EmptyState';
import LoadingSpinner from '../common/LoadingSpinner';

const TipsList = ({
    tips = [],
    loading = false,
    onRefresh,
    onTipPress,
    onFavorite,
    favorites = [],
    ListHeaderComponent,
}) => {
    const { colors, spacing } = useTheme();

    // Styles defined inside component to access theme values
    const styles = StyleSheet.create({
        list: {
            flex: 1,
            backgroundColor: colors.background,
        },
        content: {
            padding: spacing.md,
            paddingBottom: spacing.xxl,
        },
        emptyContent: {
            flexGrow: 1,
        },
        loadingContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
        },
    });
    const renderTip = ({ item }) => (
        <TipCard
            tip={item}
            onPress={onTipPress}
            onFavorite={onFavorite}
            isFavorite={favorites.includes(item.id)}
        />
    );

    const keyExtractor = (item) => item.id;

    if (loading && tips.length === 0) {
        return (
            <View style={styles.loadingContainer}>
                <LoadingSpinner message="Loading tips..." fullScreen={false} />
            </View>
        );
    }

    return (
        <FlatList
            data={tips}
            renderItem={renderTip}
            keyExtractor={keyExtractor}
            style={styles.list}
            contentContainerStyle={[
                styles.content,
                tips.length === 0 && styles.emptyContent
            ]}
            showsVerticalScrollIndicator={false}
            refreshControl={
                onRefresh ? (
                    <RefreshControl
                        refreshing={loading}
                        onRefresh={onRefresh}
                        colors={[colors.primary]}
                        tintColor={colors.primary}
                    />
                ) : undefined
            }
            ListHeaderComponent={ListHeaderComponent}
            ListEmptyComponent={
                <EmptyState
                    icon="book-outline"
                    title="No Tips Found"
                    message="There are no tips available for the selected category."
                    iconColor={colors.textSecondary}
                />
            }
        />
    );
};

export default TipsList;
