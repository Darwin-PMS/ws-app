import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const CommunityScreen = ({ navigation }) => {
    const { colors, spacing, borderRadius, shadows } = useTheme();

    const features = [
        { id: 'forums', title: 'Community Forums', icon: 'people', description: 'Discuss safety topics' },
        { id: 'events', title: 'Safety Events', icon: 'calendar', description: 'Upcoming community events' },
        { id: 'support', title: 'Support Groups', icon: 'heart', description: 'Connect with others' },
        { id: 'volunteer', title: 'Volunteer', icon: 'hand-left', description: 'Join as volunteer' },
    ];

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.primary }]}>
                <Ionicons name="people-circle" size={50} color={colors.white} />
                <Text style={[styles.headerTitle, { color: colors.white }]}>Community</Text>
                <Text style={[styles.headerSubtitle, { color: colors.white + 'CC' }]}>
                    Connect with others for support
                </Text>
            </View>

            <View style={styles.content}>
                {features.map((feature) => (
                    <View
                        key={feature.id}
                        style={[styles.featureCard, { backgroundColor: colors.card, borderRadius, ...shadows.small }]}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
                            <Ionicons name={feature.icon} size={28} color={colors.primary} />
                        </View>
                        <View style={styles.featureInfo}>
                            <Text style={[styles.featureTitle, { color: colors.text }]}>{feature.title}</Text>
                            <Text style={[styles.featureDescription, { color: colors.gray }]}>{feature.description}</Text>
                        </View>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 24,
        paddingTop: 48,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 12,
    },
    headerSubtitle: {
        fontSize: 14,
        marginTop: 4,
    },
    content: {
        padding: 16,
    },
    featureCard: {
        flexDirection: 'row',
        padding: 16,
        marginBottom: 12,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    featureInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    featureTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    featureDescription: {
        fontSize: 14,
        marginTop: 4,
    },
});

export default CommunityScreen;
