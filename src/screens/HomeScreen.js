import React, { useMemo, useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import { useSecondaryMenu } from '../context/MenuContext';
import BannerCarousel from '../components/BannerCarousel';
import bannerService from '../services/bannerService';

const ROLE_BASED_CONFIG = {
    mother: {
        title: 'Hello, Mom!',
        subtitle: 'Your family is protected',
        sections: {
            quickActions: [
                { id: 'sos', title: 'SOS', icon: 'warning', color: '#EF4444', screen: 'WomenSafety', urgent: true },
                { id: 'helpline', title: 'Helpline', icon: 'call', color: '#DC2626', screen: 'EmergencyHelpline' },
                { id: 'live', title: 'Live Share', icon: 'videocam', color: '#EC4899', screen: 'LiveShare' },
            ],
            features: [
                { id: 'child-care', title: 'Child Care', subtitle: 'Monitor kids', icon: 'happy', color: '#F59E0B', screen: 'ChildCare' },
                { id: 'family', title: 'Family', subtitle: 'Manage members', icon: 'people', color: '#8B5CF6', screen: 'Family' },
                { id: 'women-safety', title: 'Safety', subtitle: 'SOS & tools', icon: 'shield-checkmark', color: '#EC4899', screen: 'WomenSafety' },
                { id: 'safe-route', title: 'Safe Route', subtitle: 'Safe travels', icon: 'navigate', color: '#10B981', screen: 'SafeRoute' },
                { id: 'home-auto', title: 'Home Control', subtitle: 'Smart home', icon: 'home', color: '#3B82F6', screen: 'HomeAutomation' },
                { id: 'tutorials', title: 'Safety Tips', subtitle: 'Learn skills', icon: 'school', color: '#14B8A6', screen: 'SafetyTutorial' },
                { id: 'ai-chat', title: 'AI Chat', subtitle: 'Assistant', icon: 'chatbubbles', color: '#8B5CF6', screen: 'AIChat' },
                { id: 'settings', title: 'Settings', subtitle: 'Configure', icon: 'settings', color: '#6B7280', screen: 'Settings' },
            ],
            specialSection: { title: 'Family Overview', screen: 'FamilyLocation', icon: 'location' },
        },
    },
    father: {
        title: 'Hello, Dad!',
        subtitle: 'Your family is protected',
        sections: {
            quickActions: [
                { id: 'sos', title: 'SOS', icon: 'warning', color: '#EF4444', screen: 'WomenSafety', urgent: true },
                { id: 'helpline', title: 'Helpline', icon: 'call', color: '#DC2626', screen: 'EmergencyHelpline' },
                { id: 'live', title: 'Live Share', icon: 'videocam', color: '#EC4899', screen: 'LiveShare' },
            ],
            features: [
                { id: 'family', title: 'Family', subtitle: 'Manage members', icon: 'people', color: '#8B5CF6', screen: 'Family' },
                { id: 'location', title: 'Live Location', subtitle: 'Track family', icon: 'locate', color: '#3B82F6', screen: 'FamilyLocation' },
                { id: 'women-safety', title: 'Safety', subtitle: 'SOS & tools', icon: 'shield-checkmark', color: '#EC4899', screen: 'WomenSafety' },
                { id: 'safe-route', title: 'Safe Route', subtitle: 'Safe travels', icon: 'navigate', color: '#10B981', screen: 'SafeRoute' },
                { id: 'home-auto', title: 'Home Control', subtitle: 'Smart home', icon: 'home', color: '#3B82F6', screen: 'HomeAutomation' },
                { id: 'vision', title: 'Vision', subtitle: 'Analyze', icon: 'camera', color: '#8B5CF6', screen: 'Vision' },
                { id: 'ai-chat', title: 'AI Chat', subtitle: 'Assistant', icon: 'chatbubbles', color: '#8B5CF6', screen: 'AIChat' },
                { id: 'settings', title: 'Settings', subtitle: 'Configure', icon: 'settings', color: '#6B7280', screen: 'Settings' },
            ],
            specialSection: { title: 'Family Locations', screen: 'FamilyLocation', icon: 'location' },
        },
    },
    daughter: {
        title: 'Hello!',
        subtitle: 'Stay safe and connected',
        sections: {
            quickActions: [
                { id: 'sos', title: 'SOS', icon: 'warning', color: '#EF4444', screen: 'WomenSafety', urgent: true },
                { id: 'helpline', title: 'Helpline', icon: 'call', color: '#DC2626', screen: 'EmergencyHelpline' },
                { id: 'guardians', title: 'Guardians', icon: 'people', color: '#8B5CF6', screen: 'Family' },
            ],
            features: [
                { id: 'women-safety', title: 'Women Safety', subtitle: 'SOS & emergency', icon: 'shield-checkmark', color: '#EC4899', screen: 'WomenSafety' },
                { id: 'safe-route', title: 'Safe Route', subtitle: 'Get home safe', icon: 'navigate', color: '#10B981', screen: 'SafeRoute' },
                { id: 'fake-call', title: 'Fake Call', subtitle: 'Quick escape', icon: 'call', color: '#F59E0B', screen: 'FakeCall' },
                { id: 'ai-chat', title: 'AI Chat', subtitle: 'Talk to assistant', icon: 'chatbubbles', color: '#8B5CF6', screen: 'AIChat' },
                { id: 'tutorials', title: 'Safety Tips', subtitle: 'Learn skills', icon: 'school', color: '#14B8A6', screen: 'SafetyTutorial' },
                { id: 'laws', title: 'Laws', subtitle: 'Know your rights', icon: 'document-text', color: '#3B82F6', screen: 'SafetyLaw' },
                { id: 'community', title: 'Community', subtitle: 'Support group', icon: 'people-circle', color: '#EC4899', screen: 'Community' },
                { id: 'settings', title: 'Settings', subtitle: 'Configure', icon: 'settings', color: '#6B7280', screen: 'Settings' },
            ],
            specialSection: { title: 'Emergency Contacts', screen: 'EmergencyHelpline', icon: 'call' },
        },
    },
    son: {
        title: 'Hello!',
        subtitle: 'Stay safe and connected',
        sections: {
            quickActions: [
                { id: 'sos', title: 'SOS', icon: 'warning', color: '#EF4444', screen: 'WomenSafety', urgent: true },
                { id: 'helpline', title: 'Helpline', icon: 'call', color: '#DC2626', screen: 'EmergencyHelpline' },
                { id: 'guardians', title: 'Guardians', icon: 'people', color: '#8B5CF6', screen: 'Family' },
            ],
            features: [
                { id: 'women-safety', title: 'Safety', subtitle: 'SOS & tools', icon: 'shield-checkmark', color: '#EC4899', screen: 'WomenSafety' },
                { id: 'safe-route', title: 'Safe Route', subtitle: 'Get home safe', icon: 'navigate', color: '#10B981', screen: 'SafeRoute' },
                { id: 'fake-call', title: 'Fake Call', subtitle: 'Quick escape', icon: 'call', color: '#F59E0B', screen: 'FakeCall' },
                { id: 'ai-chat', title: 'AI Chat', subtitle: 'Talk to assistant', icon: 'chatbubbles', color: '#8B5CF6', screen: 'AIChat' },
                { id: 'vision', title: 'Vision', subtitle: 'Analyze', icon: 'camera', color: '#8B5CF6', screen: 'Vision' },
                { id: 'community', title: 'Community', subtitle: 'Support group', icon: 'people-circle', color: '#14B8A6', screen: 'Community' },
                { id: 'laws', title: 'Laws', subtitle: 'Know your rights', icon: 'document-text', color: '#3B82F6', screen: 'SafetyLaw' },
                { id: 'settings', title: 'Settings', subtitle: 'Configure', icon: 'settings', color: '#6B7280', screen: 'Settings' },
            ],
            specialSection: { title: 'Emergency Contacts', screen: 'EmergencyHelpline', icon: 'call' },
        },
    },
    grandmother: {
        title: 'Hello!',
        subtitle: 'Stay connected with family',
        sections: {
            quickActions: [
                { id: 'sos', title: 'SOS', icon: 'warning', color: '#EF4444', screen: 'WomenSafety', urgent: true },
                { id: 'helpline', title: 'Helpline', icon: 'call', color: '#DC2626', screen: 'EmergencyHelpline' },
                { id: 'family', title: 'Family', icon: 'people', color: '#8B5CF6', screen: 'Family' },
            ],
            features: [
                { id: 'women-safety', title: 'Women Safety', subtitle: 'SOS & emergency', icon: 'shield-checkmark', color: '#EC4899', screen: 'WomenSafety' },
                { id: 'emergency', title: 'Emergency', subtitle: 'Quick help', icon: 'alert-circle', color: '#EF4444', screen: 'EmergencyHelpline' },
                { id: 'family', title: 'Family', subtitle: 'Stay connected', icon: 'people', color: '#8B5CF6', screen: 'Family' },
                { id: 'fake-call', title: 'Fake Call', subtitle: 'Feel safe', icon: 'call', color: '#F59E0B', screen: 'FakeCall' },
                { id: 'fake-battery', title: 'Fake Battery', subtitle: 'Quick exit', icon: 'battery-dead', color: '#10B981', screen: 'FakeBatteryDeath' },
                { id: 'ai-chat', title: 'AI Chat', subtitle: 'Assistant', icon: 'chatbubbles', color: '#8B5CF6', screen: 'AIChat' },
                { id: 'community', title: 'Community', subtitle: 'Support group', icon: 'people-circle', color: '#14B8A6', screen: 'Community' },
                { id: 'settings', title: 'Settings', subtitle: 'Configure', icon: 'settings', color: '#6B7280', screen: 'Settings' },
            ],
            specialSection: { title: 'Quick Connect', screen: 'Family', icon: 'call' },
        },
    },
    grandfather: {
        title: 'Hello!',
        subtitle: 'Stay connected with family',
        sections: {
            quickActions: [
                { id: 'sos', title: 'SOS', icon: 'warning', color: '#EF4444', screen: 'WomenSafety', urgent: true },
                { id: 'helpline', title: 'Helpline', icon: 'call', color: '#DC2626', screen: 'EmergencyHelpline' },
                { id: 'family', title: 'Family', icon: 'people', color: '#8B5CF6', screen: 'Family' },
            ],
            features: [
                { id: 'women-safety', title: 'Safety', subtitle: 'SOS & tools', icon: 'shield-checkmark', color: '#EC4899', screen: 'WomenSafety' },
                { id: 'emergency', title: 'Emergency', subtitle: 'Quick help', icon: 'alert-circle', color: '#EF4444', screen: 'EmergencyHelpline' },
                { id: 'family', title: 'Family', subtitle: 'Stay connected', icon: 'people', color: '#8B5CF6', screen: 'Family' },
                { id: 'safe-route', title: 'Safe Route', subtitle: 'Travel safe', icon: 'navigate', color: '#10B981', screen: 'SafeRoute' },
                { id: 'fake-call', title: 'Fake Call', subtitle: 'Feel safe', icon: 'call', color: '#F59E0B', screen: 'FakeCall' },
                { id: 'ai-chat', title: 'AI Chat', subtitle: 'Assistant', icon: 'chatbubbles', color: '#8B5CF6', screen: 'AIChat' },
                { id: 'vision', title: 'Vision', subtitle: 'Analyze', icon: 'camera', color: '#8B5CF6', screen: 'Vision' },
                { id: 'settings', title: 'Settings', subtitle: 'Configure', icon: 'settings', color: '#6B7280', screen: 'Settings' },
            ],
            specialSection: { title: 'Quick Connect', screen: 'Family', icon: 'call' },
        },
    },
    guardian: {
        title: 'Hello, Guardian!',
        subtitle: 'Protected ones are safe',
        sections: {
            quickActions: [
                { id: 'sos', title: 'SOS', icon: 'warning', color: '#EF4444', screen: 'WomenSafety', urgent: true },
                { id: 'helpline', title: 'Helpline', icon: 'call', color: '#DC2626', screen: 'EmergencyHelpline' },
                { id: 'live', title: 'Live Share', icon: 'videocam', color: '#EC4899', screen: 'LiveShare' },
            ],
            features: [
                { id: 'child-care', title: 'Child Care', subtitle: 'Monitor kids', icon: 'happy', color: '#F59E0B', screen: 'ChildCare' },
                { id: 'family', title: 'Family', subtitle: 'Manage members', icon: 'people', color: '#8B5CF6', screen: 'Family' },
                { id: 'location', title: 'Live Location', subtitle: 'Track family', icon: 'locate', color: '#3B82F6', screen: 'FamilyLocation' },
                { id: 'women-safety', title: 'Safety', subtitle: 'SOS & tools', icon: 'shield-checkmark', color: '#EC4899', screen: 'WomenSafety' },
                { id: 'safe-route', title: 'Safe Route', subtitle: 'Safe travels', icon: 'navigate', color: '#10B981', screen: 'SafeRoute' },
                { id: 'tutorials', title: 'Safety Tips', subtitle: 'Learn skills', icon: 'school', color: '#14B8A6', screen: 'SafetyTutorial' },
                { id: 'ai-chat', title: 'AI Chat', subtitle: 'Assistant', icon: 'chatbubbles', color: '#8B5CF6', screen: 'AIChat' },
                { id: 'settings', title: 'Settings', subtitle: 'Configure', icon: 'settings', color: '#6B7280', screen: 'Settings' },
            ],
            specialSection: { title: 'Protected Members', screen: 'FamilyLocation', icon: 'location' },
        },
    },
    other: {
        title: 'Hello!',
        subtitle: 'Welcome to your safety hub',
        sections: {
            quickActions: [
                { id: 'sos', title: 'SOS', icon: 'warning', color: '#EF4444', screen: 'WomenSafety', urgent: true },
                { id: 'helpline', title: 'Helpline', icon: 'call', color: '#DC2626', screen: 'EmergencyHelpline' },
                { id: 'live', title: 'Live Share', icon: 'videocam', color: '#EC4899', screen: 'LiveShare' },
            ],
            features: [
                { id: 'women-safety', title: 'Women Safety', subtitle: 'SOS & emergency', icon: 'shield-checkmark', color: '#EC4899', screen: 'WomenSafety' },
                { id: 'family', title: 'Family', subtitle: 'Manage members', icon: 'people', color: '#8B5CF6', screen: 'Family' },
                { id: 'tutorials', title: 'Safety Tips', subtitle: 'Learn skills', icon: 'school', color: '#10B981', screen: 'SafetyTutorial' },
                { id: 'laws', title: 'Laws', subtitle: 'Know rights', icon: 'document-text', color: '#14B8A6', screen: 'SafetyLaw' },
                { id: 'ai-chat', title: 'AI Chat', subtitle: 'Assistant', icon: 'chatbubbles', color: '#8B5CF6', screen: 'AIChat' },
                { id: 'vision', title: 'Vision', subtitle: 'Analyze', icon: 'camera', color: '#8B5CF6', screen: 'Vision' },
                { id: 'community', title: 'Community', subtitle: 'Support', icon: 'people-circle', color: '#14B8A6', screen: 'Community' },
                { id: 'settings', title: 'Settings', subtitle: 'Configure', icon: 'settings', color: '#6B7280', screen: 'Settings' },
            ],
            specialSection: { title: 'Emergency Help', screen: 'EmergencyHelpline', icon: 'warning' },
        },
    },
    admin: {
        title: 'Admin Dashboard',
        subtitle: 'System management & monitoring',
        sections: {
            quickActions: [
                { id: 'users', title: 'Users', icon: 'people', color: '#3B82F6', screen: 'UserManagement', isAdmin: true },
                { id: 'families', title: 'Families', icon: 'people-circle', color: '#8B5CF6', screen: 'FamilyManagement', isAdmin: true },
                { id: 'sos', title: 'SOS Alerts', icon: 'warning', color: '#EF4444', screen: 'SOSManagement', isAdmin: true },
            ],
            features: [
                { id: 'admin-dashboard', title: 'Dashboard', subtitle: 'Overview & stats', icon: 'grid', color: '#3B82F6', screen: 'AdminDashboard', isAdmin: true },
                { id: 'user-mgmt', title: 'Users', subtitle: 'Manage all users', icon: 'people-outline', color: '#3B82F6', screen: 'UserManagement', isAdmin: true },
                { id: 'family-mgmt', title: 'Families', subtitle: 'Manage families', icon: 'people-circle-outline', color: '#8B5CF6', screen: 'FamilyManagement', isAdmin: true },
                { id: 'sos-alerts', title: 'SOS Alerts', subtitle: 'Monitor alerts', icon: 'alert-circle-outline', color: '#EF4444', screen: 'SOSManagement', isAdmin: true },
                { id: 'live-tracking', title: 'Live Tracking', subtitle: 'Track users', icon: 'locate-outline', color: '#10B981', screen: 'AdminLiveTracking', isAdmin: true },
                { id: 'ai-chat', title: 'AI Chat', subtitle: 'Assistant', icon: 'chatbubbles', color: '#8B5CF6', screen: 'AIChat' },
                { id: 'women-safety', title: 'Women Safety', subtitle: 'Safety tools', icon: 'shield-checkmark', color: '#EC4899', screen: 'WomenSafety' },
                { id: 'settings', title: 'Settings', subtitle: 'Configure', icon: 'settings', color: '#6B7280', screen: 'Settings' },
            ],
            specialSection: { title: 'Admin Panel', screen: 'AdminDashboard', icon: 'shield-checkmark', isAdmin: true },
        },
    },
    zone_head: {
        title: 'Zone Dashboard',
        subtitle: 'Managing your zone',
        sections: {
            quickActions: [
                { id: 'zone-alerts', title: 'Zone Alerts', icon: 'warning', color: '#EF4444', screen: 'ZoneDashboard' },
                { id: 'my-zone', title: 'My Zone', icon: 'map', color: '#8B5CF6', screen: 'ZoneDashboard' },
                { id: 'sos', title: 'SOS', icon: 'warning', color: '#EF4444', screen: 'WomenSafety', urgent: true },
            ],
            features: [
                { id: 'zone-users', title: 'Zone Users', subtitle: 'View assigned users', icon: 'people', color: '#3B82F6', screen: 'ZoneDashboard' },
                { id: 'zone-sos', title: 'SOS Cases', subtitle: 'View zone alerts', icon: 'alert-circle', color: '#EF4444', screen: 'ZoneDashboard' },
                { id: 'zone-grievances', title: 'Grievances', subtitle: 'Zone complaints', icon: 'document-text', color: '#F59E0B', screen: 'ZoneDashboard' },
                { id: 'zone-analytics', title: 'Analytics', subtitle: 'Zone stats', icon: 'stats-chart', color: '#10B981', screen: 'ZoneDashboard' },
                { id: 'women-safety', title: 'Women Safety', subtitle: 'Safety tools', icon: 'shield-checkmark', color: '#EC4899', screen: 'WomenSafety' },
                { id: 'ai-chat', title: 'AI Chat', subtitle: 'Assistant', icon: 'chatbubbles', color: '#8B5CF6', screen: 'AIChat' },
                { id: 'settings', title: 'Settings', subtitle: 'Configure', icon: 'settings', color: '#6B7280', screen: 'Settings' },
            ],
            specialSection: { title: 'My Zone', screen: 'ZoneDashboard', icon: 'map' },
        },
    },
};

const DEFAULT_CONFIG = {
    title: 'Hello!',
    subtitle: 'Stay safe today',
    sections: {
        quickActions: [
            { id: 'sos', title: 'SOS', icon: 'warning', color: '#EF4444', screen: 'WomenSafety', urgent: true },
            { id: 'helpline', title: 'Helpline', icon: 'call', color: '#DC2626', screen: 'EmergencyHelpline' },
            { id: 'live', title: 'Live Share', icon: 'videocam', color: '#EC4899', screen: 'LiveShare' },
        ],
        features: [
            { id: 'women-safety', title: 'Women Safety', subtitle: 'SOS & emergency', icon: 'shield-checkmark', color: '#EC4899', screen: 'WomenSafety' },
            { id: 'family', title: 'Family', subtitle: 'Manage members', icon: 'people', color: '#8B5CF6', screen: 'Family' },
            { id: 'tutorials', title: 'Safety Tips', subtitle: 'Learn skills', icon: 'school', color: '#10B981', screen: 'SafetyTutorial' },
            { id: 'laws', title: 'Laws', subtitle: 'Know rights', icon: 'document-text', color: '#14B8A6', screen: 'SafetyLaw' },
            { id: 'ai-chat', title: 'AI Chat', subtitle: 'Assistant', icon: 'chatbubbles', color: '#8B5CF6', screen: 'AIChat' },
            { id: 'vision', title: 'Vision', subtitle: 'Analyze', icon: 'camera', color: '#8B5CF6', screen: 'Vision' },
            { id: 'community', title: 'Community', subtitle: 'Support', icon: 'people-circle', color: '#14B8A6', screen: 'Community' },
            { id: 'settings', title: 'Settings', subtitle: 'Configure', icon: 'settings', color: '#6B7280', screen: 'Settings' },
        ],
    },
};

const HomeScreen = ({ navigation }) => {
    const { userName, isLoggedIn, userRole } = useApp();
    const { colors, spacing, borderRadius, shadows } = useTheme();
    const { items: menuItems, isLoading: menuLoading, isInitialized: menuInitialized } = useSecondaryMenu();
    const [banners, setBanners] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    const roleConfig = ROLE_BASED_CONFIG[userRole] || DEFAULT_CONFIG;

    useEffect(() => { loadBanners(); }, []);

    const loadBanners = async () => {
        try {
            const result = await bannerService.getBanners();
            if (result && result.success && result.banners) setBanners(result.banners);
        } catch (error) { console.log('Error loading banners:', error); }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadBanners();
        setTimeout(() => setRefreshing(false), 1000);
    };

    const handleNavigation = (screen) => {
        const nestedScreens = [
            'Vision', 'ThoughtGenerator', 'WomenSafety', 'Family', 'FamilyLocation', 
            'Settings', 'CylinderVerification', 'SafetyMap', 'FakeCall', 'FakeBatteryDeath', 
            'SafeRoute', 'SpeechToText', 'TextToSpeech', 'AISafetyWorkshop', 'SmartLocation', 
            'LiveShare', 'LiveReceiver', 'HomeAutomation', 'ChildCare', 'SafetyTutorial', 
            'SafetyNews', 'SafetyLaw', 'EmergencyHelpline', 'Grievance', 'Profile',
            'Models', 'FamilyDetails', 'CreateFamily', 'AddMember', 'RelationshipEditor',
            'SafetyTutorialDetail', 'SafetyNewsDetail', 'SafetyLawDetail',
            'FakeMessageAlert', 'QRScreen', 'BehaviorPattern', 'VoiceKeyword', 'VolumeButton',
            'Logs', 'LiveTracking', 'PrivacyPolicy', 'TermsOfService', 'Community',
            'Home', 'Notifications', 'AIChat', 'More'
        ];
        const adminScreens = [
            'AdminDashboard', 'UserManagement', 'UserDetail', 'FamilyManagement', 
            'FamilyDetail', 'SOSManagement', 'AdminLiveTracking'
        ];
        
        if (adminScreens.includes(screen)) {
            navigation.navigate('Admin', { screen });
        } else if (screen === 'Admin') {
            navigation.navigate('Admin');
        } else if (nestedScreens.includes(screen)) {
            navigation.navigate('More', { screen });
        } else {
            navigation.navigate(screen);
        }
    };

    const quickActions = roleConfig.sections.quickActions;

    const features = useMemo(() => {
        if (menuInitialized && !menuLoading && menuItems?.length > 0) {
            return menuItems.slice(0, 8).map(item => ({
                id: item.id,
                title: item.label || item.name,
                subtitle: item.subtitle || '',
                icon: item.icon || 'apps',
                color: item.bgColor || item.bg_color || colors.primary,
                screen: item.route ? item.route.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join('') : '',
            }));
        }
        return roleConfig.sections.features.map(f => ({
            ...f,
            color: f.color === (colors?.primary || '#8B5CF6') ? colors.primary : f.color,
        }));
    }, [menuItems, menuLoading, menuInitialized, colors, roleConfig]);

    const firstName = userName?.split(' ')[0] || 'User';
    const greetingTitle = roleConfig.title.replace('Hello,', 'Hello').includes(firstName) 
        ? roleConfig.title 
        : `${roleConfig.title.replace('Hello', '').trim()}, ${firstName}!`;

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}>
            <View style={[styles.header, { backgroundColor: colors.primary }]}>
                <View style={styles.headerTop}>
                    <View>
                        <Text style={styles.greeting}>{greetingTitle}</Text>
                        <Text style={styles.subGreeting}>{roleConfig.subtitle}</Text>
                    </View>
                    <TouchableOpacity style={styles.profileBtn} onPress={() => handleNavigation('Profile')}>
                        <Ionicons name="person" size={24} color={colors.white} />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.content}>
                {banners.length > 0 && (
                    <View style={styles.carouselSection}>
                        <BannerCarousel banners={banners} height={160} autoPlay={true} autoPlayInterval={5000} onPress={(banner) => banner.cta_action && handleNavigation(banner.cta_action)} />
                    </View>
                )}

                {roleConfig.sections.specialSection && (
                    <TouchableOpacity
                        style={[styles.specialSection, { backgroundColor: colors.primary + '10' }]}
                        onPress={() => handleNavigation(roleConfig.sections.specialSection.screen)}
                    >
                        <View style={[styles.specialIcon, { backgroundColor: colors.primary + '20' }]}>
                            <Ionicons name={roleConfig.sections.specialSection.icon} size={24} color={colors.primary} />
                        </View>
                        <Text style={[styles.specialTitle, { color: colors.primary }]}>{roleConfig.sections.specialSection.title}</Text>
                        <Ionicons name="chevron-forward" size={20} color={colors.primary} />
                    </TouchableOpacity>
                )}

                <View style={styles.quickActions}>
                    {quickActions.map((action) => (
                        <TouchableOpacity
                            key={action.id}
                            style={[styles.quickActionCard, { backgroundColor: action.color }]}
                            onPress={() => handleNavigation(action.screen)}
                            activeOpacity={0.8}
                        >
                            <Ionicons name={action.icon} size={28} color="#fff" />
                            <Text style={styles.quickActionText}>{action.title}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={[styles.sectionTitle, { color: colors.text }]}>Services</Text>
                <View style={styles.featuresGrid}>
                    {features.map((feature) => (
                        <TouchableOpacity
                            key={feature.id}
                            style={[styles.featureCard, { backgroundColor: colors.card, borderRadius: borderRadius.xl, ...shadows.md }]}
                            onPress={() => handleNavigation(feature.screen)}
                            activeOpacity={0.85}
                        >
                            <View style={[styles.featureIcon, { backgroundColor: feature.color + '20' }]}>
                                <Ionicons name={feature.icon} size={26} color={feature.color} />
                            </View>
                            <Text style={[styles.featureTitle, { color: colors.text }]}>{feature.title}</Text>
                            <Text style={[styles.featureSubtitle, { color: colors.textSecondary }]}>{feature.subtitle}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity
                    style={[styles.emergencyBanner, { backgroundColor: colors.error + '15' }]}
                    onPress={() => handleNavigation('EmergencyHelpline')}
                >
                    <View style={[styles.emergencyIcon, { backgroundColor: colors.error + '20' }]}>
                        <Ionicons name="warning" size={24} color={colors.error} />
                    </View>
                    <View style={styles.emergencyContent}>
                        <Text style={[styles.emergencyTitle, { color: colors.error }]}>Need Help?</Text>
                        <Text style={[styles.emergencySubtitle, { color: colors.textSecondary }]}>Access emergency helplines and support</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.error} />
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 50, paddingBottom: 24, paddingHorizontal: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    greeting: { fontSize: 26, fontWeight: 'bold', color: '#fff' },
    subGreeting: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
    profileBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    content: { padding: 16 },
    carouselSection: { marginBottom: 16, marginTop: -12 },
    specialSection: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16, marginBottom: 16 },
    specialIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    specialTitle: { flex: 1, marginLeft: 12, fontSize: 16, fontWeight: '600' },
    quickActions: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    quickActionCard: { flex: 1, alignItems: 'center', padding: 14, borderRadius: 16 },
    quickActionText: { color: '#fff', fontSize: 11, fontWeight: '600', marginTop: 6, textAlign: 'center' },
    sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 14 },
    featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
    featureCard: { width: '47%', padding: 16, alignItems: 'center' },
    featureIcon: { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    featureTitle: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
    featureSubtitle: { fontSize: 11, textAlign: 'center' },
    emergencyBanner: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 100 },
    emergencyIcon: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    emergencyContent: { flex: 1, marginLeft: 12 },
    emergencyTitle: { fontSize: 16, fontWeight: '600' },
    emergencySubtitle: { fontSize: 12, marginTop: 2 },
});

export default HomeScreen;
