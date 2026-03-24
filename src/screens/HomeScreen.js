import React, { useMemo, useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import { useSecondaryMenu } from '../context/MenuContext';
import BannerCarousel from '../components/BannerCarousel';
import bannerService from '../services/bannerService';

const HomeScreen = ({ navigation }) => {
    const { userName, isLoggedIn } = useApp();
    const { colors, spacing, borderRadius, shadows } = useTheme();
    const { items: menuItems, isLoading: menuLoading, isInitialized: menuInitialized } = useSecondaryMenu();
    const [banners, setBanners] = useState([]);
    const [bannersLoading, setBannersLoading] = useState(true);

    useEffect(() => {
        const loadBanners = async () => {
            try {
                const result = await bannerService.getBanners();
                if (result.success && result.banners) {
                    setBanners(result.banners);
                }
            } catch (error) {
                console.log('Error loading banners:', error);
            } finally {
                setBannersLoading(false);
            }
        };
        loadBanners();
    }, []);

    // Helper function to handle navigation with nested navigator support
    const handleNavigation = (screen) => {
        // All screens in the 'More' (CoreServicesStack) nested navigator
        const nestedScreens = [
            // Core Services
            'Vision', 'ThoughtGenerator', 'WomenSafety', 'Family', 'FamilyLocation', 
            'Settings', 'CylinderVerification', 'SafetyMap', 'FakeCall', 'FakeBatteryDeath', 
            'SafeRoute', 'SpeechToText', 'TextToSpeech', 'AISafetyWorkshop', 'SmartLocation', 
            'LiveShare', 'LiveReceiver', 'HomeAutomation', 'ChildCare', 'SafetyTutorial', 
            'SafetyNews', 'SafetyLaw', 'EmergencyHelpline', 'Grievance', 'Profile',
            // Additional screens
            'Models', 'FamilyDetails', 'CreateFamily', 'AddMember', 'RelationshipEditor',
            'SafetyTutorialDetail', 'SafetyNewsDetail', 'SafetyLawDetail',
            'FakeMessageAlert', 'QRScreen', 'BehaviorPattern', 'VoiceKeyword', 'VolumeButton',
            'Logs', 'LiveTracking', 'PrivacyPolicy', 'TermsOfService', 'Community',
            // Home tabs
            'Home', 'Notifications', 'AIChat', 'More'
        ];

        if (nestedScreens.includes(screen)) {
            navigation.navigate('More', { screen });
        } else {
            navigation.navigate(screen);
        }
    };

    // Transform menu items to features - use backend data if available
    const features = useMemo(() => {
        if (menuInitialized && !menuLoading && menuItems && menuItems.length > 0) {
            // Transform backend menu items to feature format
            return menuItems.slice(0, 6).map(item => ({
                id: item.id,
                title: item.label || item.name,
                subtitle: item.subtitle || item.category || '',
                icon: item.icon || 'apps',
                color: item.bgColor || item.bg_color || colors.primary,
                screen: item.route || item.screen || '',
            }));
        }
        // Fallback to default features (matching menus.sql)
        return [
            // Emergency & Safety
            { id: 'women-safety', title: 'Women Safety', subtitle: 'SOS & emergency contacts', icon: 'shield-checkmark', color: '#EC4899', screen: 'WomenSafety' },
            { id: 'sos', title: 'SOS', subtitle: 'Emergency assistance', icon: 'alert-circle', color: '#EF4444', screen: 'SOS' },
            { id: 'emergency-helpline', title: 'Helpline', subtitle: 'Emergency hotlines', icon: 'call', color: '#DC2626', screen: 'EmergencyHelpline' },
            { id: 'live-share', title: 'Live Share', subtitle: 'Share live location', icon: 'videocam', color: '#EF4444', screen: 'LiveShare' },
            // Family
            { id: 'family', title: 'Family', subtitle: 'Manage family members', icon: 'people', color: '#8B5CF6', screen: 'Family' },
            { id: 'family-location', title: 'Location', subtitle: 'Track family', icon: 'location', color: '#06B6D4', screen: 'FamilyLocation' },
            { id: 'childcare', title: 'Child Care', subtitle: 'Tips & guidance', icon: 'happy', color: '#10B981', screen: 'ChildCare' },
            // AI Features
            { id: 'ai-chat', title: 'AI Chat', subtitle: 'Chat with AI', icon: 'chatbubbles', color: colors.primary, screen: 'AIChat' },
            { id: 'vision', title: 'Vision', subtitle: 'Analyze images', icon: 'camera', color: colors.secondary, screen: 'Vision' },
            { id: 'thought', title: 'Thoughts', subtitle: 'Generate ideas', icon: 'sparkles', color: colors.accent, screen: 'ThoughtGenerator' },
            { id: 'speech-text', title: 'Speech to Text', subtitle: 'Transcribe audio', icon: 'mic', color: '#10B981', screen: 'SpeechToText' },
            { id: 'text-speech', title: 'Text to Speech', subtitle: 'Convert text to speech', icon: 'volume-high', color: '#F59E0B', screen: 'TextToSpeech' },
            // Smart Features
            { id: 'cylinder', title: 'Cylinder', subtitle: 'Verify gas cylinder', icon: 'flame', color: '#F97316', screen: 'CylinderVerification' },
            { id: 'home-automation', title: 'Smart Home', subtitle: 'Control devices', icon: 'home', color: '#3B82F6', screen: 'HomeAutomation' },
            { id: 'safe-route', title: 'Safe Route', subtitle: 'Find safest route', icon: 'navigate', color: '#3B82F6', screen: 'SafeRoute' },
            { id: 'smart-location', title: 'Smart Location', subtitle: 'Advanced features', icon: 'location', color: '#10B981', screen: 'SmartLocation' },
            // Safety Info
            { id: 'safety-tips', title: 'Safety Tips', subtitle: 'Guidelines & laws', icon: 'shield-checkmark', color: '#10B981', screen: 'SafetyTutorial' },
            { id: 'safety-laws', title: 'Laws', subtitle: 'Know your rights', icon: 'document-text', color: '#059669', screen: 'SafetyLaw' },
            { id: 'safety-news', title: 'News', subtitle: 'Latest updates', icon: 'newspaper', color: '#14B8A6', screen: 'SafetyNews' },
            // Fake Features
            { id: 'fake-call', title: 'Fake Call', subtitle: 'Simulate calls', icon: 'call', color: '#F59E0B', screen: 'FakeCall' },
            // Settings
            { id: 'settings', title: 'Settings', subtitle: 'App configuration', icon: 'settings', color: '#6B7280', screen: 'Settings' },
            { id: 'profile', title: 'Profile', subtitle: 'User profile', icon: 'person', color: '#8B5CF6', screen: 'Profile' },
        ];
    }, [menuItems, menuLoading, menuInitialized, colors]);

    const quickActions = [
        { id: 'profile', title: 'Profile', icon: 'person', screen: 'Profile' },
        { id: 'settings', title: 'Settings', icon: 'settings', screen: 'Settings' },
        { id: 'notifications', title: 'Alerts', icon: 'notifications', screen: 'Notifications' },
    ];

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.primary }]}>
                <Text style={[styles.greeting, { color: colors.white }]}>
                    Hello, {userName || 'User'}!
                </Text>
                <Text style={[styles.subGreeting, { color: colors.white + 'CC' }]}>
                    Stay safe and connected
                </Text>
            </View>

            {/* Banner Carousel at Top */}
            <View style={styles.carouselContainer}>
                <BannerCarousel 
                    banners={banners} 
                    height={140} 
                    autoPlay={true} 
                    autoPlayInterval={4000} 
                    onPress={(banner) => {
                        if (banner.cta_action) {
                            handleNavigation(banner.cta_action);
                        }
                    }}
                />
            </View>

            <View style={styles.content}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Features</Text>
                <View style={styles.featuresGrid}>
                    {features.map((feature) => (
                        <TouchableOpacity
                            key={feature.id}
                            style={[styles.featureCard, { backgroundColor: colors.card, borderRadius, ...shadows.small }]}
                            onPress={() => handleNavigation(feature.screen)}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: feature.color + '20' }]}>
                                <Ionicons name={feature.icon} size={28} color={feature.color} />
                            </View>
                            <Text style={[styles.featureTitle, { color: colors.text }]}>{feature.title}</Text>
                            <Text style={[styles.featureSubtitle, { color: colors.gray }]}>{feature.subtitle}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={[styles.sectionTitle, { color: colors.text, marginTop: spacing.lg }]}>Quick Actions</Text>
                <View style={[styles.quickActions, { backgroundColor: colors.card, borderRadius, ...shadows.small }]}>
                    {quickActions.map((action, index) => (
                        <TouchableOpacity
                            key={action.id}
                            style={[styles.actionItem, index < quickActions.length - 1 && styles.actionBorder, { borderColor: colors.border }]}
                            onPress={() => handleNavigation(action.screen)}
                        >
                            <Ionicons name={action.icon} size={24} color={colors.primary} />
                            <Text style={[styles.actionText, { color: colors.text }]}>{action.title}</Text>
                            <Ionicons name="chevron-forward" size={20} color={colors.gray} />
                        </TouchableOpacity>
                    ))}
                </View>
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
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    greeting: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    subGreeting: {
        fontSize: 16,
        marginTop: 4,
    },
    content: {
        padding: 16,
    },
    carouselContainer: {
        marginTop: -8,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 16,
    },
    featuresGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    featureCard: {
        width: '47%',
        padding: 16,
        alignItems: 'center',
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    featureTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    featureSubtitle: {
        fontSize: 12,
    },
    quickActions: {
        overflow: 'hidden',
    },
    actionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    actionBorder: {
        borderBottomWidth: 1,
    },
    actionText: {
        flex: 1,
        fontSize: 16,
        marginLeft: 12,
    },
});

export default HomeScreen;
