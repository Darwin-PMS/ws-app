import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Switch,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const HomeAutomationScreen = () => {
    const { colors, spacing, borderRadius, shadows } = useTheme();

    const [devices, setDevices] = useState([
        { id: 1, name: 'Living Room Light', type: 'light', isOn: true, icon: 'bulb' },
        { id: 2, name: 'Bedroom Light', type: 'light', isOn: false, icon: 'bulb' },
        { id: 3, name: 'Front Door Lock', type: 'lock', isOn: true, icon: 'lock-closed' },
        { id: 4, name: 'Air Conditioner', type: 'ac', isOn: false, icon: 'snow' },
        { id: 5, name: 'Security Camera', type: 'camera', isOn: true, icon: 'videocam' },
    ]);

    const [scenes, setScenes] = useState([
        { id: 1, name: 'Home', icon: 'home', color: colors.success },
        { id: 2, name: 'Away', icon: 'walk', color: colors.warning },
        { id: 3, name: 'Sleep', icon: 'moon', color: colors.primary },
    ]);

    const toggleDevice = (id) => {
        setDevices(prev =>
            prev.map(device =>
                device.id === id ? { ...device, isOn: !device.isOn } : device
            )
        );
    };

    const activateScene = (sceneId) => {
        Alert.alert('Scene Activated', `The ${scenes.find(s => s.id === sceneId)?.name} scene has been activated`);
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.accent }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.white} />
                </TouchableOpacity>
                <Ionicons name="home" size={40} color={colors.white} />
                <Text style={[styles.headerTitle, { color: colors.white }]}>Home Automation</Text>
                <Text style={[styles.headerSubtitle, { color: colors.white + 'CC' }]}>
                    Control your smart home devices
                </Text>
            </View>

            <View style={styles.content}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Scenes</Text>
                <View style={styles.scenesContainer}>
                    {scenes.map((scene) => (
                        <TouchableOpacity
                            key={scene.id}
                            style={[styles.sceneCard, { backgroundColor: scene.color, borderRadius }]}
                            onPress={() => activateScene(scene.id)}
                        >
                            <Ionicons name={scene.icon} size={28} color={colors.white} />
                            <Text style={[styles.sceneText, { color: colors.white }]}>{scene.name}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={[styles.sectionTitle, { color: colors.text, marginTop: spacing.lg }]}>Devices</Text>
                <View style={[styles.devicesCard, { backgroundColor: colors.card, borderRadius, ...shadows.small }]}>
                    {devices.map((device, index) => (
                        <View
                            key={device.id}
                            style={[
                                styles.deviceItem,
                                index < devices.length - 1 && { borderBottomWidth: 1, borderColor: colors.border },
                            ]}
                        >
                            <View style={[styles.deviceIcon, { backgroundColor: device.isOn ? colors.success + '20' : colors.gray + '20' }]}>
                                <Ionicons
                                    name={device.icon}
                                    size={24}
                                    color={device.isOn ? colors.success : colors.gray}
                                />
                            </View>
                            <View style={styles.deviceInfo}>
                                <Text style={[styles.deviceName, { color: colors.text }]}>{device.name}</Text>
                                <Text style={[styles.deviceStatus, { color: device.isOn ? colors.success : colors.gray }]}>
                                    {device.isOn ? 'On' : 'Off'}
                                </Text>
                            </View>
                            <Switch
                                value={device.isOn}
                                onValueChange={() => toggleDevice(device.id)}
                                trackColor={{ false: colors.border, true: colors.success }}
                                thumbColor={colors.white}
                            />
                        </View>
                    ))}
                </View>

                <TouchableOpacity
                    style={[styles.addButton, { backgroundColor: colors.primary }]}
                    onPress={() => Alert.alert('Coming Soon', 'Add device feature coming soon')}
                >
                    <Ionicons name="add" size={24} color={colors.white} />
                    <Text style={[styles.addButtonText, { color: colors.white }]}>Add Device</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    backBtn: {
        position: 'absolute',
        top: 48,
        left: 16,
        zIndex: 10,
        padding: 8,
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
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
    },
    scenesContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    sceneCard: {
        flex: 1,
        alignItems: 'center',
        padding: 16,
    },
    sceneText: {
        fontSize: 14,
        fontWeight: '500',
        marginTop: 8,
    },
    devicesCard: {
        overflow: 'hidden',
    },
    deviceItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    deviceIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    deviceInfo: {
        flex: 1,
        marginLeft: 12,
    },
    deviceName: {
        fontSize: 16,
        fontWeight: '500',
    },
    deviceStatus: {
        fontSize: 12,
        marginTop: 2,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 56,
        borderRadius: 12,
        gap: 8,
        marginTop: 24,
    },
    addButtonText: {
        fontSize: 18,
        fontWeight: '600',
    },
});

export default HomeAutomationScreen;
