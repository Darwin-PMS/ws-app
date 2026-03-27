import React, { useMemo, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Animated, TextInput, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useSecondaryMenu } from '../context/MenuContext';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 44) / 2;

const CATEGORY_ICONS = { 'Emergency': 'warning-outline', 'Safety': 'shield-checkmark-outline', 'Family': 'people-outline', 'AI': 'chatbubbles-outline', 'Smart': 'bulb-outline', 'Tools': 'construct-outline', 'Community': 'people-circle-outline', 'default': 'apps-outline' };

const CoreServicesScreen = () => {
    const { colors, shadows } = useTheme();
    const { items: menuItems, isLoading, isInitialized } = useSecondaryMenu();
    const navigation = useNavigation();
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const searchAnim = useRef(new Animated.Value(0)).current;

    const groupedServices = useMemo(() => {
        let services = [];
        if (!isInitialized || isLoading || !menuItems || menuItems.length === 0) { services = getDefaultServices(colors); }
        else {
            services = menuItems.map(item => {
                let screenName = item.screen;
                if (!screenName && item.route) { screenName = item.route.replace(/^\//, '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(''); }
                return { id: item.id, title: item.label || item.name, description: item.subtitle || '', icon: item.icon || 'apps', color: item.bgColor || item.bg_color || colors.primary, route: item.route, screen: screenName, children: item.children || [], category: item.category || 'default' };
            });
        }
        const filtered = searchQuery.trim() ? services.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()) || s.description.toLowerCase().includes(searchQuery.toLowerCase())) : services;
        const groups = {};
        filtered.forEach(service => { const cat = service.category || 'default'; if (!groups[cat]) groups[cat] = []; groups[cat].push(service); });
        return groups;
    }, [menuItems, isLoading, isInitialized, colors, searchQuery]);

    const handleServicePress = (service) => {
        if (service.children?.length > 0) {
            const options = service.children.filter(c => c.isVisible !== false).map(c => ({ text: c.label || c.name, onPress: () => navigation.navigate(c.route || c.screen || c.name) }));
            if (options.length > 0) { Alert.alert(service.title, 'Choose an option:', options.concat([{ text: 'Cancel', style: 'cancel' }])); return; }
        }
        if (service.screen || service.route) {
            let sn = service.screen || service.route.replace(/^\//, '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
            if (sn) navigation.navigate(sn);
        }
    };

    const toggleSearch = () => { const to = showSearch ? 0 : 1; Animated.timing(searchAnim, { toValue: to, duration: 200, useNativeDriver: false }).start(); if (showSearch) setSearchQuery(''); setShowSearch(!showSearch); };
    const getCategoryIcon = (c) => CATEGORY_ICONS[c] || CATEGORY_ICONS.default;
    const getCategoryColor = (c) => { const catColors = { 'Emergency': '#EF4444', 'Safety': '#10B981', 'Family': '#8B5CF6', 'AI': '#6366F1', 'Smart': '#3B82F6', 'Tools': '#F59E0B', 'Community': '#14B8A6' }; return catColors[c] || colors.primary; };

    if (isLoading && !isInitialized) { return (<View style={[styles.container, styles.loadingContainer, { backgroundColor: colors.background }]}><ActivityIndicator size="large" color={colors.primary} /><Text style={[styles.loadingText, { color: colors.gray }]}>Loading services...</Text></View>); }

    const totalServices = Object.values(groupedServices).reduce((acc, g) => acc + g.length, 0);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.primary }]}>
                <View style={styles.headerTop}><View><Text style={styles.headerTitle}>Core Services</Text><Text style={styles.headerSubtitle}>{totalServices} features available</Text></View><TouchableOpacity style={styles.searchButton} onPress={toggleSearch}><Ionicons name={showSearch ? 'close' : 'search'} size={22} color={colors.white} /></TouchableOpacity></View>
                <Animated.View style={[styles.searchContainer, { maxHeight: searchAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 60] }), opacity: searchAnim }]}><View style={styles.searchInputWrapper}><Ionicons name="search" size={18} color={colors.gray} /><View style={[styles.searchInput, { backgroundColor: colors.white + '20' }]}><TextInput style={styles.searchInputField} placeholder="Search services..." placeholderTextColor={colors.white + '80'} value={searchQuery} onChangeText={setSearchQuery} /></View></View></Animated.View>
            </View>
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>{Object.entries(groupedServices).map(([category, services]) => (<View key={category} style={styles.categorySection}><View style={styles.categoryHeader}><View style={[styles.categoryIcon, { backgroundColor: getCategoryColor(category) + '20' }]}><Ionicons name={getCategoryIcon(category)} size={16} color={getCategoryColor(category)} /></View><Text style={[styles.categoryTitle, { color: colors.text }]}>{category}</Text><View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(category) + '20' }]}><Text style={[styles.categoryBadgeText, { color: getCategoryColor(category) }]}>{services.length}</Text></View></View><View style={styles.servicesGrid}>{services.map((service) => (<TouchableOpacity key={service.id} style={[styles.serviceCard, { backgroundColor: colors.card, ...shadows.sm }]} onPress={() => handleServicePress(service)} activeOpacity={0.7}><View style={[styles.serviceIconWrapper, { backgroundColor: service.color + '15' }]}><Ionicons name={service.icon} size={24} color={service.color} /></View><Text style={[styles.serviceTitle, { color: colors.text }]} numberOfLines={1}>{service.title}</Text><Text style={[styles.serviceDescription, { color: colors.gray }]} numberOfLines={2}>{service.description}</Text>{(service.children?.length > 0) && <View style={styles.hasSubmenu}><Ionicons name="chevron-forward" size={14} color={colors.gray} /></View>}</TouchableOpacity>))}</View></View>))}{totalServices === 0 && (<View style={styles.emptyState}><Ionicons name="search" size={48} color={colors.gray + '50'} /><Text style={[styles.emptyTitle, { color: colors.text }]}>No services found</Text><Text style={[styles.emptySubtitle, { color: colors.gray }]}>Try a different search term</Text></View>)}<View style={styles.bottomPadding} /></ScrollView>
        </View>
    );
};

function getDefaultServices(colors) {
    return [
        { id: 'app-guide', title: 'App Guide', description: 'Complete guide & how to use', icon: 'book', color: '#3B82F6', screen: 'AppGuide', category: 'default' },
        { id: 'women-safety', title: 'Women Safety', description: 'SOS, emergency contacts & safety tips', icon: 'shield-checkmark', color: '#EC4899', screen: 'WomenSafety', category: 'Emergency' },
        { id: 'emergency-helpline', title: 'Emergency Helpline', description: 'Emergency contacts & hotlines', icon: 'call', color: '#DC2626', screen: 'EmergencyHelpline', category: 'Emergency' },
        { id: 'live-share', title: 'Live Safety Share', description: 'Share live camera & screen', icon: 'videocam', color: '#EF4444', screen: 'LiveShare', category: 'Emergency' },
        { id: 'live-tracking', title: 'Live Tracking', description: 'Track your location real-time', icon: 'location', color: '#EF4444', screen: 'LiveTracking', category: 'Emergency' },
        { id: 'grievance', title: 'Grievance', description: 'File a complaint', icon: 'warning', color: '#EF4444', screen: 'Grievance', category: 'Safety' },
        { id: 'safety-map', title: 'Safety Map', description: 'View nearby safe zones', icon: 'map', color: '#10B981', screen: 'SafetyMap', category: 'Safety' },
        { id: 'family', title: 'Family', description: 'Manage family members', icon: 'people', color: '#8B5CF6', screen: 'Family', category: 'Family' },
        { id: 'family-location', title: 'Family Location', description: 'Track family locations', icon: 'location', color: '#06B6D4', screen: 'FamilyLocation', category: 'Family' },
        { id: 'childcare', title: 'Child Care', description: 'Tips, guidance & assistant', icon: 'happy', color: '#10B981', screen: 'ChildCare', category: 'Family' },
        { id: 'ai-chat', title: 'AI Assistant', description: 'AI powered assistant', icon: 'chatbubbles', color: '#8B5CF6', screen: 'AIChat', category: 'AI' },
        { id: 'vision', title: 'Vision', description: 'Image analysis with AI', icon: 'camera', color: '#8B5CF6', screen: 'Vision', category: 'AI' },
        { id: 'speech-to-text', title: 'Speech to Text', description: 'Transcribe audio with AI', icon: 'mic', color: '#10B981', screen: 'SpeechToText', category: 'AI' },
        { id: 'text-to-speech', title: 'Text to Speech', description: 'Convert text to speech', icon: 'volume-high', color: '#F59E0B', screen: 'TextToSpeech', category: 'AI' },
        { id: 'thought-generator', title: 'Thought Generator', description: 'Generate creative thoughts', icon: 'bulb', color: '#8B5CF6', screen: 'ThoughtGenerator', category: 'AI' },
        { id: 'ai-safety-workshop', title: 'AI Safety Workshop', description: 'Interactive AI training', icon: 'school', color: '#8B5CF6', screen: 'AISafetyWorkshop', category: 'AI' },
        { id: 'safety-tips', title: 'Safety Tips', description: 'Safety guidelines', icon: 'shield-checkmark', color: '#10B981', screen: 'SafetyTutorial', category: 'Safety' },
        { id: 'safety-laws', title: 'Safety Laws', description: 'Know your rights', icon: 'document-text', color: '#059669', screen: 'SafetyLaw', category: 'Safety' },
        { id: 'safety-news', title: 'Safety News', description: 'Latest safety updates', icon: 'newspaper', color: '#14B8A6', screen: 'SafetyNews', category: 'Safety' },
        { id: 'safe-route', title: 'Safe Route', description: 'Find safest route', icon: 'navigate', color: '#3B82F6', screen: 'SafeRoute', category: 'Smart' },
        { id: 'smart-location', title: 'Smart Location', description: 'Smart tracking', icon: 'locate', color: '#3B82F6', screen: 'SmartLocation', category: 'Smart' },
        { id: 'cylinder-verification', title: 'Cylinder Verification', description: 'Verify cylinder authenticity', icon: 'checkmark-circle', color: '#F59E0B', screen: 'CylinderVerification', category: 'Smart' },
        { id: 'home-automation', title: 'Home Automation', description: 'Control smart devices', icon: 'home', color: '#F59E0B', screen: 'HomeAutomation', category: 'Smart' },
        { id: 'behavior-pattern', title: 'Behavior Analysis', description: 'Analyze patterns', icon: 'analytics', color: '#3B82F6', screen: 'BehaviorPattern', category: 'Smart' },
        { id: 'fake-call', title: 'Fake Call', description: 'Simulate incoming calls', icon: 'call', color: '#F59E0B', screen: 'FakeCall', category: 'Tools' },
        { id: 'fake-message', title: 'Fake Message Alert', description: 'Simulate message alerts', icon: 'chatbox-ellipses', color: '#F59E0B', screen: 'FakeMessageAlert', category: 'Tools' },
        { id: 'fake-battery-death', title: 'Fake Battery Death', description: 'Simulate battery dying', icon: 'battery-dead', color: '#F59E0B', screen: 'FakeBatteryDeath', category: 'Tools' },
        { id: 'qr-scanner', title: 'QR Scanner', description: 'Scan QR codes', icon: 'qr-code', color: '#10B981', screen: 'QRScreen', category: 'Tools' },
        { id: 'models', title: 'Model Browser', description: 'Browse AI models', icon: 'cube', color: '#8B5CF6', screen: 'ModelsList', category: 'Tools' },
        { id: 'voice-keyword', title: 'Voice Keyword', description: 'Set voice activation', icon: 'mic', color: '#10B981', screen: 'VoiceKeyword', category: 'Tools' },
        { id: 'volume-button', title: 'Volume Button', description: 'Volume shortcuts', icon: 'volume-medium', color: '#F59E0B', screen: 'VolumeButton', category: 'Tools' },
        { id: 'logs', title: 'App Logs', description: 'View application logs', icon: 'list', color: '#6B7280', screen: 'Logs', category: 'Tools' },
        { id: 'community', title: 'Community', description: 'Community support', icon: 'people-circle', color: '#14B8A6', screen: 'Community', category: 'Community' },
        { id: 'settings', title: 'Settings', description: 'API key, preferences', icon: 'settings', color: '#6B7280', screen: 'Settings', category: 'default' },
        { id: 'privacy-policy', title: 'Privacy Policy', description: 'Read privacy policy', icon: 'shield', color: '#6B7280', screen: 'PrivacyPolicy', category: 'default' },
        { id: 'terms-of-service', title: 'Terms of Service', description: 'Read our terms', icon: 'document-text', color: '#6B7280', screen: 'TermsOfService', category: 'default' },
        { id: 'profile', title: 'My Profile', description: 'View & edit profile', icon: 'person', color: '#8B5CF6', screen: 'Profile', category: 'default' },
    ];
}

const styles = StyleSheet.create({
    container: { flex: 1 }, loadingContainer: { justifyContent: 'center', alignItems: 'center' }, loadingText: { marginTop: 12, fontSize: 16 },
    header: { paddingTop: 50, paddingHorizontal: 16, paddingBottom: 16, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' }, headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
    searchButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    searchContainer: { overflow: 'hidden', marginTop: 12 }, searchInputWrapper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    searchInput: { flex: 1, flexDirection: 'row', alignItems: 'center', borderRadius: 10, paddingHorizontal: 10, height: 40 },
    searchInputField: { flex: 1, fontSize: 15, color: '#fff', marginLeft: 6 },
    content: { flex: 1, padding: 12 },
    categorySection: { marginBottom: 16 },
    categoryHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
    categoryIcon: { width: 28, height: 28, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
    categoryTitle: { fontSize: 14, fontWeight: '700' },
    categoryBadge: { marginLeft: 'auto', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
    categoryBadgeText: { fontSize: 10, fontWeight: '700' },
    servicesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
    serviceCard: { width: CARD_WIDTH, borderRadius: 12, padding: 10 },
    serviceIconWrapper: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
    serviceTitle: { fontSize: 12, fontWeight: '600', marginBottom: 2 },
    serviceDescription: { fontSize: 10, lineHeight: 13 },
    hasSubmenu: { position: 'absolute', top: 6, right: 6 },
    emptyState: { alignItems: 'center', paddingVertical: 60 },
    emptyTitle: { fontSize: 18, fontWeight: '600', marginTop: 16 },
    emptySubtitle: { fontSize: 14, marginTop: 4 },
    bottomPadding: { height: 20 },
});

export default CoreServicesScreen;
