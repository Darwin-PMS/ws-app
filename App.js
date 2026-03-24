import React, { useEffect } from 'react';
import { StatusBar, View, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
    AppProvider,
    useApp,
    ChildCareProvider,
    ThemeProvider,
    useTheme,
    PermissionProvider,
    MenuProvider,
    SOSProvider,
    UserProvider,
    ConsentProvider,
    FamilyPlacesProvider,
    EventProvider,
} from './src/context';
import AppNavigator from './src/navigation/AppNavigator';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import { lightColors } from './src/theme/theme';
import { apiClient } from './src/services/api/client';
import { mobileApi } from './src/services/api/mobileApi';
import { offlineService } from './src/services';

const Stack = createNativeStackNavigator();

/**
 * Custom hook to create navigation theme based on current app theme
 * Updates dynamically when theme changes
 */
const useNavigationTheme = () => {
    const { isDark, colors } = useTheme();

    return {
        ...DefaultTheme,
        dark: isDark,
        colors: {
            ...DefaultTheme.colors,
            primary: colors.primary,
            background: colors.background,
            card: colors.surface,
            text: colors.text,
            border: colors.border,
            notification: colors.primary,
        },
    };
};

// Loading screen component (light mode only)
const LoadingScreen = () => (
    <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={lightColors.primary} />
    </View>
);

// Auth screens
const AuthStack = () => {
    const { colors } = useTheme();
    return (
        <Stack.Navigator
            screenOptions={{
                headerStyle: { backgroundColor: colors.background },
                headerTintColor: colors.text,
                headerShadowVisible: false,
                contentStyle: { backgroundColor: colors.background },
            }}
        >
            <Stack.Screen
                name="Login"
                component={LoginScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="Register"
                component={RegisterScreen}
                options={{
                    headerShown: true,
                    title: 'Create Account',
                    headerBackTitle: 'Back',
                }}
            />
        </Stack.Navigator>
    );
};

// Main app content
const AppContent = () => {
    const { isLoading, isLoggedIn, authToken, refreshToken, updateAuthToken, needsReLogin, logout } = useApp();
    const { isDark, colors } = useTheme();
    const navigationTheme = useNavigationTheme();
    const navigationRef = React.useRef();
    const hasLoggedReLoginAlert = React.useRef(false);

    // Set auth token and callbacks on API client when it becomes available
    useEffect(() => {
        if (!isLoading) {
            apiClient.setTokens(authToken || null, refreshToken || null);
            mobileApi.setTokens(authToken || null, refreshToken || null);
            
            apiClient.setTokenUpdateCallback((newToken) => {
                console.log('🔄 Token refreshed via callback');
                updateAuthToken(newToken);
            });
            apiClient.setAuthFailureCallback(() => {
                console.log('🔐 Auth failure detected');
                logout();
            });
        }
    }, [isLoading, authToken, refreshToken, updateAuthToken, logout]);

    // Handle re-login needed (token expired)
    useEffect(() => {
        if (needsReLogin && !isLoading && !hasLoggedReLoginAlert.current) {
            hasLoggedReLoginAlert.current = true;
            console.log('🔐 Token expired, redirecting to login...');
            
            // Show alert to user
            Alert.alert(
                'Session Expired',
                'Your session has expired. Please login again to continue.',
                [{ text: 'OK' }]
            );
            
            // Navigate to login screen using navigation ref
            if (navigationRef.current) {
                navigationRef.current.navigate('Login');
            }
            
            // Clear user data and redirect
            logout();
        }
        
        // Reset flag when needsReLogin becomes false
        if (!needsReLogin) {
            hasLoggedReLoginAlert.current = false;
        }
    }, [needsReLogin, isLoading, logout]);



    if (isLoading) {
        return <LoadingScreen />;
    }

    return (
        <ChildCareProvider>
            <UserProvider>
                <ConsentProvider>
                    <FamilyPlacesProvider>
                        <EventProvider>
                            <SOSProvider>
                                <StatusBar
                                    barStyle={isDark ? 'light-content' : 'dark-content'}
                                    backgroundColor={colors.background}
                                />
                                <NavigationContainer ref={navigationRef} theme={navigationTheme}>
                                    {isLoggedIn ? (
                                        <PermissionProvider>
                                            <MenuProvider>
                                                <AppNavigator />
                                            </MenuProvider>
                                        </PermissionProvider>
                                    ) : (
                                        <AuthStack />
                                    )}
                                </NavigationContainer>
                            </SOSProvider>
                        </EventProvider>
                    </FamilyPlacesProvider>
                </ConsentProvider>
            </UserProvider>
        </ChildCareProvider>
    );
};

// Inner component that uses theme context (must be inside ThemeProvider)
const AppWithTheme = () => {
    // Initialize offline service for network monitoring and offline SOS
    useEffect(() => {
        const initOfflineService = async () => {
            try {
                await offlineService.initialize();
                console.log('📡 Offline service initialized');
            } catch (error) {
                console.error('Failed to initialize offline service:', error);
            }
        };
        initOfflineService();
    }, []);

    return (
        <AppProvider>
            <AppContent />
        </AppProvider>
    );
};

// Root component - wraps with ThemeProvider first
export default function App() {
    return (
        <ThemeProvider>
            <AppWithTheme />
        </ThemeProvider>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: lightColors.background,
    },
});
