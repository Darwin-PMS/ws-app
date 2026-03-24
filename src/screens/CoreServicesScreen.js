import React, { useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useSecondaryMenu } from '../context/MenuContext';
import { useNavigation } from '@react-navigation/native';

const CoreServicesScreen = () => {
    const { colors, spacing, borderRadius, shadows } = useTheme();
    const { items: menuItems, isLoading, isInitialized } = useSecondaryMenu();
    // Use useNavigation to get the correct navigation object from CoreServicesStack
    const navigation = useNavigation();

    // Transform menu items from backend to service cards
    const services = useMemo(() => {
        // If menu is still loading or no items, show default
        if (!isInitialized || isLoading || !menuItems || menuItems.length === 0) {
            return getDefaultServices(colors);
        }

        // Transform backend menu items to service format
        return menuItems.map(item => {
            let screenName = item.screen;
            if (!screenName && item.route) {
                // Convert route like /live-share to LiveShare
                screenName = item.route
                    .replace(/^\//, '')
                    .split('-')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join('');
            }
            return {
                id: item.id,
                title: item.label || item.name,
                description: item.subtitle || '',
                icon: item.icon || 'apps',
                color: item.bgColor || item.bg_color || colors.primary,
                route: item.route,
                screen: screenName,
                children: item.children || [],
                category: item.category,
            };
        });
    }, [menuItems, isLoading, isInitialized, colors]);

    // Fallback default services - comprehensive list based on menus.sql
    function getDefaultServices(colors) {
        return [
            // Emergency & Safety (Red theme)
            {
                id: 'women-safety',
                title: 'Women Safety',
                description: 'SOS, emergency contacts & safety tips',
                icon: 'shield-checkmark',
                color: '#EC4899',
                route: '/women-safety',
                screen: 'WomenSafety',
            },
            {
                id: 'emergency-helpline',
                title: 'Emergency Helpline',
                description: 'Emergency contacts & hotlines',
                icon: 'call',
                color: '#DC2626',
                route: '/emergency-helpline',
                screen: 'EmergencyHelpline',
            },
            {
                id: 'live-share',
                title: 'Live Safety Share',
                description: 'Share live camera & screen with contacts',
                icon: 'videocam',
                color: '#EF4444',
                route: '/live-share',
                screen: 'LiveShare',
            },
            {
                id: 'grievance',
                title: 'Grievance',
                description: 'File a complaint',
                icon: 'warning',
                color: '#EF4444',
                route: '/grievance',
                screen: 'Grievance',
            },
            // Family (Purple theme)
            {
                id: 'family',
                title: 'Family',
                description: 'Manage family members & relationships',
                icon: 'people',
                color: '#8B5CF6',
                route: '/family',
                screen: 'Family',
            },
            {
                id: 'family-location',
                title: 'Family Location',
                description: 'Track family locations',
                icon: 'location',
                color: '#06B6D4',
                route: '/family-location',
                screen: 'FamilyLocation',
            },
            {
                id: 'childcare',
                title: 'Child Care',
                description: 'Tips, guidance & assistant',
                icon: 'happy',
                color: '#10B981',
                route: '/childcare',
                screen: 'ChildCare',
            },
            // AI Services (Purple/Blue theme)
            {
                id: 'ai-chat',
                title: 'AI Assistant',
                description: 'AI powered assistant',
                icon: 'chatbubbles',
                color: '#8B5CF6',
                route: '/ai-chat',
                screen: 'AIChat',
            },
            {
                id: 'vision',
                title: 'Vision',
                description: 'Image analysis with AI',
                icon: 'camera',
                color: '#8B5CF6',
                route: '/vision',
                screen: 'Vision',
            },
            {
                id: 'speech-to-text',
                title: 'Speech to Text',
                description: 'Transcribe audio with AI',
                icon: 'mic',
                color: '#10B981',
                route: '/speech-to-text',
                screen: 'SpeechToText',
            },
            {
                id: 'text-to-speech',
                title: 'Text to Speech',
                description: 'Convert text to speech',
                icon: 'volume-high',
                color: '#F59E0B',
                route: '/text-to-speech',
                screen: 'TextToSpeech',
            },
            {
                id: 'thought-generator',
                title: 'Thought Generator',
                description: 'Generate ideas with AI',
                icon: 'sparkles',
                color: '#8B5CF6',
                route: '/thought-generator',
                screen: 'ThoughtGenerator',
            },
            {
                id: 'models',
                title: 'Model Browser',
                description: 'Browse and select AI models',
                icon: 'server',
                color: '#8B5CF6',
                route: '/models',
                screen: 'Models',
            },
            // Safety Info (Teal theme)
            {
                id: 'safety-tips',
                title: 'Safety Tips',
                description: 'Safety guidelines & laws',
                icon: 'shield-checkmark',
                color: '#10B981',
                route: '/safety-tips',
                screen: 'SafetyTutorial',
            },
            {
                id: 'safety-laws',
                title: 'Safety Laws',
                description: 'Know your rights',
                icon: 'document-text',
                color: '#059669',
                route: '/safety-laws',
                screen: 'SafetyLaw',
            },
            {
                id: 'safety-news',
                title: 'Safety News',
                description: 'Latest safety updates',
                icon: 'newspaper',
                color: '#14B8A6',
                route: '/safety-news',
                screen: 'SafetyNews',
            },
            {
                id: 'safety-tutorials',
                title: 'Safety Tutorials',
                description: 'Learn safety skills',
                icon: 'school',
                color: '#14B8A6',
                route: '/safety-tutorials',
                screen: 'SafetyTutorial',
            },
            // Smart Features (Blue theme)
            {
                id: 'home-automation',
                title: 'Home Automation',
                description: 'Control smart devices & appliances',
                icon: 'home',
                color: '#3B82F6',
                route: '/home-automation',
                screen: 'HomeAutomation',
            },
            {
                id: 'cylinder-verify',
                title: 'Cylinder Verification',
                description: 'Verify gas cylinder validity & expiration',
                icon: 'flame',
                color: '#F97316',
                route: '/cylinder-verify',
                screen: 'CylinderVerification',
            },
            {
                id: 'safe-route',
                title: 'Safe Route',
                description: 'Find safest route to destination',
                icon: 'navigate',
                color: '#3B82F6',
                route: '/safe-route',
                screen: 'SafeRoute',
            },
            {
                id: 'smart-location',
                title: 'Smart Location',
                description: 'Advanced location features',
                icon: 'location',
                color: '#10B981',
                route: '/smart-location',
                screen: 'SmartLocation',
            },
            // Fake Features (Orange/Yellow theme)
            {
                id: 'fake-call',
                title: 'Fake Call',
                description: 'Simulate incoming calls',
                icon: 'call',
                color: '#F59E0B',
                route: '/fake-call',
                screen: 'FakeCall',
            },
            {
                id: 'fake-message',
                title: 'Fake Message Alert',
                description: 'Simulate message notifications',
                icon: 'chatbox-ellipses',
                color: '#F59E0B',
                route: '/fake-message',
                screen: 'FakeMessageAlert',
            },
            {
                id: 'fake-battery',
                title: 'Fake Battery Death',
                description: 'Simulate low battery screen',
                icon: 'battery-dead',
                color: '#F59E0B',
                route: '/fake-battery',
                screen: 'FakeBatteryDeath',
            },
            // Behavior & Community (Indigo theme)
            {
                id: 'behavior-monitor',
                title: 'Behavior Monitor',
                description: 'Monitor behavior patterns',
                icon: 'pulse',
                color: '#6366F1',
                route: '/behavior-pattern',
                screen: 'BehaviorPattern',
            },
            {
                id: 'community',
                title: 'Community',
                description: 'Community support',
                icon: 'people-circle',
                color: '#14B8A6',
                route: '/community',
                screen: 'Community',
            },
            // Settings & Profile (Gray theme)
            {
                id: 'settings',
                title: 'Settings',
                description: 'API key, preferences & about',
                icon: 'settings',
                color: '#6B7280',
                route: '/settings',
                screen: 'Settings',
            },
            {
                id: 'profile',
                title: 'My Profile',
                description: 'View & edit your profile',
                icon: 'person',
                color: '#8B5CF6',
                route: '/profile',
                screen: 'Profile',
            },
            // QR Code
            {
                id: 'qr-code',
                title: 'QR Scanner',
                description: 'Scan QR codes',
                icon: 'qr-code',
                color: '#8B5CF6',
                route: '/qr',
                screen: 'QRScreen',
            },
        ];
    }

    const handleServicePress = (service) => {
        // If service has children (from hierarchical menu), show options
        if (service.children && service.children.length > 0) {
            const options = service.children
                .filter(child => child.isVisible !== false)
                .map(child => ({
                    text: child.label || child.name,
                    onPress: () => {
                        const route = child.route || child.screen || child.name;
                        if (route) {
                            navigation.navigate(route);
                        }
                    },
                }));

            if (options.length > 0) {
                Alert.alert(
                    service.title,
                    'Choose an option:',
                    options.concat([{ text: 'Cancel', style: 'cancel' }])
                );
                return;
            }
        }

        // If service has a direct route/screen, navigate
        if (service.screen || service.route) {
            let screenName = service.screen;
            
            // If only route is available (e.g., "/community"), convert to screen name
            if (!screenName && service.route) {
                screenName = service.route
                    .replace(/^\//, '')
                    .split('-')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join('');
            }
            
            if (screenName) {
                navigation.navigate(screenName);
            }
            return;
        }

        // Fallback to old behavior with screens array
        if (service.screens) {
            if (service.screens.length === 1) {
                navigation.navigate(service.screens[0]);
            } else if (service.screens.length > 1) {
                Alert.alert(
                    service.title,
                    'Choose an option:',
                    service.screens.map(screen => ({
                        text: screen.replace(/([A-Z])/g, ' $1').trim(),
                        onPress: () => navigation.navigate(screen),
                    })).concat([{ text: 'Cancel', style: 'cancel' }])
                );
            }
        }
    };

    if (isLoading && !isInitialized) {
        return (
            <View style={[styles.container, styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.primary }]}>
                <Ionicons name="apps" size={40} color={colors.white} />
                <Text style={[styles.headerTitle, { color: colors.white }]}>Core Services</Text>
                <Text style={[styles.headerSubtitle, { color: colors.white + 'CC' }]}>
                    {menuItems && menuItems.length > 0
                        ? 'Powered by your menu configuration'
                        : 'Access all app features'}
                </Text>
            </View>

            <View style={styles.content}>
                {services.map((service) => (
                    <TouchableOpacity
                        key={service.id}
                        style={[styles.serviceCard, { backgroundColor: colors.card, borderRadius, ...shadows.small }]}
                        onPress={() => handleServicePress(service)}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: service.color + '20' }]}>
                            <Ionicons name={service.icon} size={28} color={service.color} />
                        </View>
                        <View style={styles.serviceInfo}>
                            <Text style={[styles.serviceTitle, { color: colors.text }]}>{service.title}</Text>
                            <Text style={[styles.serviceDescription, { color: colors.gray }]}>
                                {service.description}
                            </Text>
                        </View>
                        {(service.children && service.children.length > 0) || (service.screens && service.screens.length > 1) ? (
                            <Ionicons name="chevron-forward" size={20} color={colors.gray} />
                        ) : null}
                    </TouchableOpacity>
                ))}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        alignItems: 'center',
        padding: 24,
        paddingTop: 48,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
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
    serviceCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        marginBottom: 12,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    serviceInfo: {
        flex: 1,
        marginLeft: 16,
    },
    serviceTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    serviceDescription: {
        fontSize: 14,
        marginTop: 4,
    },
});

export default CoreServicesScreen;
