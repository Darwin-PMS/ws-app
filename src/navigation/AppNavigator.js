import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import NotificationScreen from '../screens/NotificationScreen';
import ChatScreen from '../screens/ChatScreen';
import VisionScreen from '../screens/VisionScreen';
import SpeechToTextScreen from '../screens/SpeechToTextScreen';
import TextToSpeechScreen from '../screens/TextToSpeechScreen';
import CoreServicesScreen from '../screens/CoreServicesScreen';
import ModelsScreen from '../screens/ModelsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import WomenSafetyScreen from '../screens/WomenSafetyScreen';
import LiveTrackingScreen from '../screens/LiveTrackingScreen';
import ChildCareScreen from '../screens/ChildCareScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ThoughtGeneratorScreen from '../screens/ThoughtGeneratorScreen';
import HomeAutomationScreen from '../screens/HomeAutomationScreen';
import FamilyScreen from '../screens/FamilyScreen';
import FamilyDetailsScreen from '../screens/FamilyDetailsScreen';
import CreateFamilyScreen from '../screens/CreateFamilyScreen';
import AddMemberScreen from '../screens/AddMemberScreen';
import RelationshipEditorScreen from '../screens/RelationshipEditorScreen';
import FamilyLocationScreen from '../screens/FamilyLocationScreen';
import CylinderVerificationScreen from '../screens/CylinderVerificationScreen';
import SafetyMapScreen from '../screens/SafetyMapScreen';
import FakeCallScreen from '../screens/FakeCallScreen';
import FakeMessageAlertScreen from '../screens/FakeMessageAlertScreen';
import FakeBatteryDeathScreen from '../screens/FakeBatteryDeathScreen';
import AISafetyWorkshopScreen from '../screens/AISafetyWorkshopScreen';
import SafeRouteScreen from '../screens/SafeRouteScreen';
import BehaviorPatternScreen from '../screens/BehaviorPatternScreen';
import SafetyTutorialScreen from '../screens/SafetyTutorialScreen';
import SafetyTutorialDetailScreen from '../screens/SafetyTutorialDetailScreen';
import SafetyNewsScreen from '../screens/SafetyNewsScreen';
import SafetyNewsDetailScreen from '../screens/SafetyNewsDetailScreen';
import SafetyLawScreen from '../screens/SafetyLawScreen';
import SafetyLawDetailScreen from '../screens/SafetyLawDetailScreen';
import SmartLocationScreen from '../screens/SmartLocationScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import TermsOfServiceScreen from '../screens/TermsOfServiceScreen';
import EmergencyHelplineScreen from '../screens/EmergencyHelplineScreen';
import GrievanceScreen from '../screens/GrievanceScreen';
import VoiceKeywordScreen from '../screens/VoiceKeywordScreen';
import VolumeButtonScreen from '../screens/VolumeButtonScreen';
import LogsScreen from '../screens/LogsScreen';
import QRScreen from '../screens/QRScreen';
import LiveShareScreen from '../screens/LiveShareScreen';
import LiveReceiverScreen from '../screens/LiveReceiverScreen';
import CommunityScreen from '../screens/CommunityScreen';
import AppGuideScreen from '../screens/AppGuideScreen';
import AboutAppScreen from '../screens/AboutAppScreen';
import HelpScreen from '../screens/HelpScreen';
import { TouchableOpacity } from 'react-native';

// Import Admin screens
import {
    AdminDashboardScreen,
    UserManagementScreen,
    UserDetailScreen,
    FamilyManagementScreen,
    FamilyDetailsScreen as AdminFamilyDetailsScreen,
    SOSAlertManagementScreen,
    AdminLiveTrackingScreen,
} from '../admin/screens';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Admin Stack Navigator
const AdminStack = () => {
    const { colors } = useTheme();

    return (
        <Stack.Navigator
            screenOptions={{
                headerStyle: {
                    backgroundColor: colors.background,
                },
                headerTintColor: colors.text,
                headerTitleStyle: {
                    fontWeight: '600',
                },
                headerShadowVisible: false,
                contentStyle: {
                    backgroundColor: colors.background,
                },
                headerBackVisible: true,
                headerBackTitle: 'Back',
                headerBackTitleVisible: true,
            }}
        >
            <Stack.Screen
                name="AdminDashboard"
                component={AdminDashboardScreen}
                options={{ title: 'Admin Dashboard', headerShown: false }}
            />
            <Stack.Screen
                name="UserManagement"
                component={UserManagementScreen}
                options={{ title: 'User Management' }}
            />
            <Stack.Screen
                name="UserDetail"
                component={UserDetailScreen}
                options={{ title: 'User Details' }}
            />
            <Stack.Screen
                name="FamilyManagement"
                component={FamilyManagementScreen}
                options={{ title: 'Family Management' }}
            />
            <Stack.Screen
                name="FamilyDetail"
                component={AdminFamilyDetailsScreen}
                options={{ title: 'Family Details' }}
            />
            <Stack.Screen
                name="SOSManagement"
                component={SOSAlertManagementScreen}
                options={{ title: 'SOS Alerts' }}
            />
            <Stack.Screen
                name="AdminLiveTracking"
                component={AdminLiveTrackingScreen}
                options={{ title: 'Live Tracking' }}
            />
        </Stack.Navigator>
    );
};

// Core Services stack (More menu) - uses useTheme for reactive colors
const CoreServicesStack = ({ navigation }) => {
    const { colors } = useTheme();

    return (
        <Stack.Navigator
            screenOptions={{
                headerStyle: {
                    backgroundColor: colors.background,
                },
                headerTintColor: colors.text,
                headerTitleStyle: {
                    fontWeight: '600',
                },
                headerShadowVisible: false,
                contentStyle: {
                    backgroundColor: colors.background,
                },
                headerBackVisible: true,
                headerBackTitle: 'Back',
                headerBackTitleVisible: true,
            }}
        >
            <Stack.Screen
                name="CoreServicesHome"
                component={CoreServicesScreen}
                options={{ title: 'Core Services' }}
            />
            <Stack.Screen
                name="ModelsList"
                component={ModelsScreen}
                options={{ title: 'Model Browser' }}
            />
            <Stack.Screen
                name="Settings"
                component={SettingsScreen}
                options={{ title: 'Settings' }}
            />
            <Stack.Screen
                name="Profile"
                component={ProfileScreen}
                options={{ title: 'My Profile' }}
            />
            <Stack.Screen
                name="WomenSafety"
                component={WomenSafetyScreen}
                options={{ title: 'Women Safety' }}
            />
            <Stack.Screen
                name="LiveTracking"
                component={LiveTrackingScreen}
                options={{ title: 'Live Tracking' }}
            />
            <Stack.Screen
                name="VoiceKeyword"
                component={VoiceKeywordScreen}
                options={{ title: 'Voice Keyword' }}
            />
            <Stack.Screen
                name="VolumeButton"
                component={VolumeButtonScreen}
                options={{ title: 'Volume Button' }}
            />
            <Stack.Screen
                name="Logs"
                component={LogsScreen}
                options={{ title: 'App Logs' }}
            />
            <Stack.Screen
                name="ChildCare"
                component={ChildCareScreen}
                options={{ title: 'Child Care' }}
            />
            <Stack.Screen
                name="Vision"
                component={VisionScreen}
                options={{ title: 'Vision' }}
            />
            <Stack.Screen
                name="SpeechToText"
                component={SpeechToTextScreen}
                options={{ title: 'Speech to Text' }}
            />
            <Stack.Screen
                name="TextToSpeech"
                component={TextToSpeechScreen}
                options={{ title: 'Text to Speech' }}
            />
            <Stack.Screen
                name="ThoughtGenerator"
                component={ThoughtGeneratorScreen}
                options={{ title: 'Thought Generator' }}
            />
            <Stack.Screen
                name="HomeAutomation"
                component={HomeAutomationScreen}
                options={{ title: 'Home Automation' }}
            />
            <Stack.Screen
                name="Family"
                component={FamilyScreen}
                options={({ navigation }) => ({
                    title: 'Family',
                    headerRight: () => (
                        <TouchableOpacity
                            onPress={() => navigation.navigate('CreateFamily')}
                            style={{ padding: 8 }}
                        >
                            <Ionicons name="add-circle" size={28} color={colors.primary} />
                        </TouchableOpacity>
                    ),
                })}
            />
            <Stack.Screen
                name="FamilyDetails"
                component={FamilyDetailsScreen}
                options={{ title: 'Family Details' }}
            />
            <Stack.Screen
                name="CreateFamily"
                component={CreateFamilyScreen}
                options={{ title: 'Create Family' }}
            />
            <Stack.Screen
                name="AddMember"
                component={AddMemberScreen}
                options={{ title: 'Add Member' }}
            />
            <Stack.Screen
                name="RelationshipEditor"
                component={RelationshipEditorScreen}
                options={{ title: 'Relationships' }}
            />
            <Stack.Screen
                name="FamilyLocation"
                component={FamilyLocationScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="CylinderVerification"
                component={CylinderVerificationScreen}
                options={{ title: 'Cylinder Verification' }}
            />
            <Stack.Screen
                name="SafetyMap"
                component={SafetyMapScreen}
                options={{ title: 'Safety Map' }}
            />
            <Stack.Screen
                name="FakeCall"
                component={FakeCallScreen}
                options={{ title: 'Fake Call' }}
            />
            <Stack.Screen
                name="FakeMessageAlert"
                component={FakeMessageAlertScreen}
                options={{ title: 'Fake Message Alert' }}
            />
            <Stack.Screen
                name="FakeBatteryDeath"
                component={FakeBatteryDeathScreen}
                options={{ title: 'Fake Battery Death' }}
            />
            <Stack.Screen
                name="AISafetyWorkshop"
                component={AISafetyWorkshopScreen}
                options={{ title: 'AI Safety Workshop' }}
            />
            <Stack.Screen
                name="SafeRoute"
                component={SafeRouteScreen}
                options={{ title: 'Safe Route' }}
            />
            <Stack.Screen
                name="BehaviorPattern"
                component={BehaviorPatternScreen}
                options={{ title: 'Behavior Analysis' }}
            />
            <Stack.Screen
                name="SafetyTutorial"
                component={SafetyTutorialScreen}
                options={{ title: 'Safety Tutorials' }}
            />
            <Stack.Screen
                name="SafetyTutorialDetail"
                component={SafetyTutorialDetailScreen}
                options={{ title: 'Tutorial Details' }}
            />
            <Stack.Screen
                name="SafetyNews"
                component={SafetyNewsScreen}
                options={{ title: 'Safety News' }}
            />
            <Stack.Screen
                name="SafetyNewsDetail"
                component={SafetyNewsDetailScreen}
                options={{ title: 'News Details' }}
            />
            <Stack.Screen
                name="SafetyLaw"
                component={SafetyLawScreen}
                options={{ title: 'Safety Laws' }}
            />
            <Stack.Screen
                name="SafetyLawDetail"
                component={SafetyLawDetailScreen}
                options={{ title: 'Law Details' }}
            />
            <Stack.Screen
                name="SmartLocation"
                component={SmartLocationScreen}
                options={{ title: 'Smart Location' }}
            />
            <Stack.Screen
                name="PrivacyPolicy"
                component={PrivacyPolicyScreen}
                options={{ title: 'Privacy Policy' }}
            />
            <Stack.Screen
                name="TermsOfService"
                component={TermsOfServiceScreen}
                options={{ title: 'Terms of Service' }}
            />
            <Stack.Screen
                name="EmergencyHelpline"
                component={EmergencyHelplineScreen}
                options={{ title: 'Emergency Helplines' }}
            />
            <Stack.Screen
                name="Grievance"
                component={GrievanceScreen}
                options={{ title: 'Grievance' }}
            />
            <Stack.Screen
                name="LiveShare"
                component={LiveShareScreen}
                options={{ title: 'Live Safety Share' }}
            />
            <Stack.Screen
                name="LiveReceiver"
                component={LiveReceiverScreen}
                options={{ title: 'Live View' }}
            />
            <Stack.Screen
                name="QRScreen"
                component={QRScreen}
                options={{ title: 'QR Scanner' }}
            />
            <Stack.Screen
                name="Community"
                component={CommunityScreen}
                options={{ title: 'Community' }}
            />
            <Stack.Screen
                name="AppGuide"
                component={AppGuideScreen}
                options={{ title: 'App Guide' }}
            />
            <Stack.Screen
                name="AboutApp"
                component={AboutAppScreen}
                options={{ title: 'About App' }}
            />
            <Stack.Screen
                name="HelpScreen"
                component={HelpScreen}
                options={{ title: 'Help & Support' }}
            />
        </Stack.Navigator>
    );
};

// Main tab navigator - uses useTheme for reactive colors
const AppNavigator = () => {
    const { colors } = useTheme();
    const { userRole } = useApp();
    const isAdmin = userRole === 'admin';

    return (
        <Stack.Navigator
            screenOptions={{
                headerStyle: { backgroundColor: colors.background },
                headerTintColor: colors.text,
                headerTitleStyle: { fontWeight: '600' },
                headerShadowVisible: false,
                headerBackVisible: true,
                headerBackTitle: 'Back',
                headerBackTitleVisible: true,
            }}
        >
            <Stack.Screen name="MainTabs" options={{ headerShown: false }}>
            {() => (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    switch (route.name) {
                        case 'Home':
                            iconName = focused ? 'home' : 'home-outline';
                            break;
                        case 'Notifications':
                            iconName = focused ? 'notifications' : 'notifications-outline';
                            break;
                        case 'AIChat':
                            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
                            break;
                        case 'Admin':
                            iconName = focused ? 'shield-checkmark' : 'shield-checkmark-outline';
                            break;
                        case 'More':
                            iconName = focused ? 'menu' : 'menu-outline';
                            break;
                        case 'Profile':
                            iconName = focused ? 'person' : 'person-outline';
                            break;
                        default:
                            iconName = 'ellipse';
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: colors.tabBarActive,
                tabBarInactiveTintColor: colors.tabBarInactive,
                tabBarStyle: {
                    backgroundColor: colors.tabBarBackground,
                    borderTopColor: colors.border,
                    borderTopWidth: 1,
                    height: 85,
                    paddingTop: 8,
                    paddingBottom: 25,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '500',
                },
                headerStyle: {
                    backgroundColor: colors.background,
                },
                headerTintColor: colors.text,
                headerTitleStyle: {
                    fontWeight: '600',
                    fontSize: 18,
                },
                headerShadowVisible: false,
            })}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    title: 'Home',
                    headerTitle: 'Welcome Home',
                }}
            />
            {isAdmin && (
                <Tab.Screen
                    name="Admin"
                    component={AdminStack}
                    options={{
                        title: 'Admin',
                        headerShown: false,
                    }}
                />
            )}
            <Tab.Screen
                name="Notifications"
                component={NotificationScreen}
                options={{
                    title: 'Alerts',
                    headerTitle: 'Notifications',
                }}
            />
            <Tab.Screen
                name="AIChat"
                component={ChatScreen}
                options={{
                    title: 'AI Chat',
                    headerTitle: 'AI Chat',
                }}
            />
            <Tab.Screen
                name="More"
                component={CoreServicesStack}
                options={{
                    title: 'More',
                    headerShown: false,
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    title: 'Profile',
                    headerTitle: 'My Profile',
                }}
            />
        </Tab.Navigator>
            )}
        </Stack.Screen>
        </Stack.Navigator>
    );
};

export default AppNavigator;
