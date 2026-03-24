import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    RefreshControl,
    Modal,
    TextInput,
    FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { mobileApi, ENDPOINTS } from '../services/api/mobileApi';

const API_BASE = 'http://YOUR_API_URL/api/v1/mobile/childcare';

const ChildCareScreen = ({ navigation }) => {
    const { colors, spacing, borderRadius, shadows } = useTheme();
    const [children, setChildren] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showAddChild, setShowAddChild] = useState(false);
    const [showAddSchedule, setShowAddSchedule] = useState(false);
    const [selectedChild, setSelectedChild] = useState(null);
    const [newChild, setNewChild] = useState({ firstName: '', lastName: '', dateOfBirth: '', gender: '', bloodGroup: '' });
    const [newSchedule, setNewSchedule] = useState({ title: '', scheduleTime: '', repeatDays: [] });

    const fetchChildren = useCallback(async () => {
        try {
            const token = await getAuthToken();
            const response = await fetch(`${API_BASE}/children`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setChildren(data.data);
            }
        } catch (error) {
            console.error('Error fetching children:', error);
        }
    }, []);

    const fetchSchedules = useCallback(async (childId) => {
        try {
            const token = await getAuthToken();
            const url = childId ? `${API_BASE}/schedules?childId=${childId}` : `${API_BASE}/schedules`;
            const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
            const data = await response.json();
            if (data.success) {
                setSchedules(data.data);
            }
        } catch (error) {
            console.error('Error fetching schedules:', error);
        }
    }, []);

    const fetchAlerts = useCallback(async () => {
        try {
            const token = await getAuthToken();
            const response = await fetch(`${API_BASE}/alerts`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setAlerts(data.data);
            }
        } catch (error) {
            console.error('Error fetching alerts:', error);
        }
    }, []);

    const loadData = async () => {
        setLoading(true);
        await Promise.all([fetchChildren(), fetchSchedules(), fetchAlerts()]);
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, [fetchChildren, fetchSchedules, fetchAlerts]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const getAuthToken = async () => {
        return '';
    };

    const handleAddChild = async () => {
        if (!newChild.firstName || !newChild.dateOfBirth) {
            Alert.alert('Error', 'First name and date of birth are required');
            return;
        }
        try {
            const token = await getAuthToken();
            const response = await fetch(`${API_BASE}/children`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(newChild),
            });
            const data = await response.json();
            if (data.success) {
                Alert.alert('Success', 'Child added successfully');
                setShowAddChild(false);
                setNewChild({ firstName: '', lastName: '', dateOfBirth: '', gender: '', bloodGroup: '' });
                fetchChildren();
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to add child');
        }
    };

    const handleAddSchedule = async () => {
        if (!newSchedule.title || !newSchedule.scheduleTime || !selectedChild) {
            Alert.alert('Error', 'Please fill all required fields and select a child');
            return;
        }
        try {
            const token = await getAuthToken();
            const response = await fetch(`${API_BASE}/schedules`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ ...newSchedule, childId: selectedChild }),
            });
            const data = await response.json();
            if (data.success) {
                Alert.alert('Success', 'Schedule added');
                setShowAddSchedule(false);
                setNewSchedule({ title: '', scheduleTime: '', repeatDays: [] });
                fetchSchedules(selectedChild);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to add schedule');
        }
    };

    const handleUpdateLocation = async (childId, latitude, longitude, locationType) => {
        try {
            const token = await getAuthToken();
            await fetch(`${API_BASE}/locations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ childId, latitude, longitude, locationType }),
            });
            fetchAlerts();
        } catch (error) {
            console.error('Location update error:', error);
        }
    };

    const renderChildCard = (child) => (
        <TouchableOpacity
            key={child.id}
            style={[styles.childCard, { backgroundColor: colors.card, borderRadius, ...shadows.small }]}
            onPress={() => setSelectedChild(child.id === selectedChild ? null : child.id)}
        >
            <View style={[styles.childAvatar, { backgroundColor: colors.primary }]}>
                <Ionicons name="happy" size={32} color={colors.white} />
            </View>
            <View style={styles.childInfo}>
                <Text style={[styles.childName, { color: colors.text }]}>{child.firstName} {child.lastName}</Text>
                <Text style={[styles.childDob, { color: colors.gray }]}>
                    {child.dateOfBirth ? `Born: ${new Date(child.dateOfBirth).toLocaleDateString()}` : ''}
                </Text>
                {child.schedules?.length > 0 && (
                    <View style={[styles.badge, { backgroundColor: colors.success + '20' }]}>
                        <Text style={[styles.badgeText, { color: colors.success }]}>{child.schedules.length} schedules</Text>
                    </View>
                )}
            </View>
            <Ionicons name={selectedChild === child.id ? 'chevron-up' : 'chevron-down'} size={24} color={colors.gray} />
        </TouchableOpacity>
    );

    const renderSchedule = (schedule) => (
        <View key={schedule.id} style={[styles.scheduleItem, { borderBottomColor: colors.border }]}>
            <View style={styles.scheduleTime}>
                <Text style={[styles.timeText, { color: colors.primary }]}>{schedule.schedule_time}</Text>
            </View>
            <View style={styles.scheduleContent}>
                <Text style={[styles.scheduleTitle, { color: colors.text }]}>{schedule.title}</Text>
                <Text style={[styles.scheduleChild, { color: colors.gray }]}>{schedule.child_name}</Text>
            </View>
            <TouchableOpacity style={[styles.scheduleAction, { backgroundColor: colors.success + '20' }]}>
                <Ionicons name="checkmark" size={20} color={colors.success} />
            </TouchableOpacity>
        </View>
    );

    const renderAlert = (alert) => (
        <View key={alert.id} style={[styles.alertItem, { backgroundColor: alert.is_read ? colors.card : colors.error + '10' }]}>
            <View style={[styles.alertIcon, { backgroundColor: getAlertColor(alert.alert_type) + '20' }]}>
                <Ionicons name={getAlertIcon(alert.alert_type)} size={20} color={getAlertColor(alert.alert_type)} />
            </View>
            <View style={styles.alertContent}>
                <Text style={[styles.alertTitle, { color: colors.text }]}>{alert.title}</Text>
                <Text style={[styles.alertMessage, { color: colors.gray }]}>{alert.message}</Text>
                <Text style={[styles.alertTime, { color: colors.gray }]}>
                    {new Date(alert.created_at).toLocaleString()}
                </Text>
            </View>
        </View>
    );

    const getAlertIcon = (type) => {
        switch (type) {
            case 'school_arrival': return 'school';
            case 'school_departure': return 'exit';
            case 'safety_concern': return 'warning';
            case 'emergency': return 'alert-circle';
            default: return 'notifications';
        }
    };

    const getAlertColor = (type) => {
        switch (type) {
            case 'school_arrival': return colors.success;
            case 'school_departure': return colors.warning;
            case 'safety_concern': return colors.error;
            case 'emergency': return colors.error;
            default: return colors.primary;
        }
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
            <View style={[styles.header, { backgroundColor: colors.primary }]}>
                <Ionicons name="happy" size={40} color={colors.white} />
                <Text style={[styles.headerTitle, { color: colors.white }]}>Child Care Mode</Text>
                <Text style={[styles.headerSubtitle, { color: colors.white + 'CC' }]}>Track schedules, monitor locations, receive alerts</Text>
            </View>

            <View style={styles.content}>
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>My Children</Text>
                    <TouchableOpacity onPress={() => setShowAddChild(true)}>
                        <Ionicons name="add-circle" size={28} color={colors.primary} />
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <Text style={{ color: colors.gray }}>Loading...</Text>
                ) : children.length === 0 ? (
                    <TouchableOpacity style={[styles.emptyCard, { backgroundColor: colors.card, borderRadius }]} onPress={() => setShowAddChild(true)}>
                        <Ionicons name="person-add" size={48} color={colors.gray} />
                        <Text style={[styles.emptyText, { color: colors.gray }]}>Add your first child</Text>
                    </TouchableOpacity>
                ) : (
                    children.map(renderChildCard)
                )}

                <View style={[styles.statsCard, { backgroundColor: colors.card, borderRadius, ...shadows.small }]}>
                    <View style={styles.statItem}>
                        <Text style={[styles.statNumber, { color: colors.primary }]}>{children.length}</Text>
                        <Text style={[styles.statLabel, { color: colors.gray }]}>Children</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={[styles.statNumber, { color: colors.success }]}>{schedules.length}</Text>
                        <Text style={[styles.statLabel, { color: colors.gray }]}>Schedules</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={[styles.statNumber, { color: colors.error }]}>{alerts.filter(a => !a.is_read).length}</Text>
                        <Text style={[styles.statLabel, { color: colors.gray }]}>New Alerts</Text>
                    </View>
                </View>

                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Today's Schedule</Text>
                    <TouchableOpacity onPress={() => setShowAddSchedule(true)}>
                        <Ionicons name="add-circle" size={28} color={colors.primary} />
                    </TouchableOpacity>
                </View>

                {schedules.length === 0 ? (
                    <Text style={[styles.emptyText, { color: colors.gray }]}>No schedules set</Text>
                ) : (
                    schedules.map(renderSchedule)
                )}

                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Alerts</Text>
                </View>

                {alerts.length === 0 ? (
                    <Text style={[styles.emptyText, { color: colors.gray }]}>No alerts</Text>
                ) : (
                    alerts.slice(0, 5).map(renderAlert)
                )}

                <View style={styles.featuresGrid}>
                    <TouchableOpacity style={[styles.featureCard, { backgroundColor: colors.card, borderRadius, ...shadows.small }]} onPress={() => Alert.alert('Coming Soon', 'Growth tracking feature')}>
                        <View style={[styles.featureIcon, { backgroundColor: colors.success + '20' }]}>
                            <Ionicons name="trending-up" size={28} color={colors.success} />
                        </View>
                        <Text style={[styles.featureTitle, { color: colors.text }]}>Growth Tracker</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.featureCard, { backgroundColor: colors.card, borderRadius, ...shadows.small }]} onPress={() => Alert.alert('Coming Soon', 'Health records feature')}>
                        <View style={[styles.featureIcon, { backgroundColor: colors.error + '20' }]}>
                            <Ionicons name="medical" size={28} color={colors.error} />
                        </View>
                        <Text style={[styles.featureTitle, { color: colors.text }]}>Health Records</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.featureCard, { backgroundColor: colors.card, borderRadius, ...shadows.small }]} onPress={() => Alert.alert('Coming Soon', 'School zones feature')}>
                        <View style={[styles.featureIcon, { backgroundColor: colors.warning + '20' }]}>
                            <Ionicons name="school" size={28} color={colors.warning} />
                        </View>
                        <Text style={[styles.featureTitle, { color: colors.text }]}>School Zones</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.featureCard, { backgroundColor: colors.card, borderRadius, ...shadows.small }]} onPress={() => Alert.alert('Coming Soon', 'Safety check feature')}>
                        <View style={[styles.featureIcon, { backgroundColor: colors.info + '20' }]}>
                            <Ionicons name="shield-checkmark" size={28} color={colors.info} />
                        </View>
                        <Text style={[styles.featureTitle, { color: colors.text }]}>Safety Check</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <Modal visible={showAddChild} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card, borderRadius: 20 }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Add Child</Text>
                        <TextInput style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]} placeholder="First Name *" placeholderTextColor={colors.gray} value={newChild.firstName} onChangeText={(text) => setNewChild({ ...newChild, firstName: text })} />
                        <TextInput style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]} placeholder="Last Name" placeholderTextColor={colors.gray} value={newChild.lastName} onChangeText={(text) => setNewChild({ ...newChild, lastName: text })} />
                        <TextInput style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]} placeholder="Date of Birth (YYYY-MM-DD) *" placeholderTextColor={colors.gray} value={newChild.dateOfBirth} onChangeText={(text) => setNewChild({ ...newChild, dateOfBirth: text })} />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.gray }]} onPress={() => setShowAddChild(false)}><Text style={styles.modalBtnText}>Cancel</Text></TouchableOpacity>
                            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.primary }]} onPress={handleAddChild}><Text style={styles.modalBtnText}>Add</Text></TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal visible={showAddSchedule} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card, borderRadius: 20 }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Add Schedule</Text>
                        <Text style={[styles.label, { color: colors.gray }]}>Select Child</Text>
                        <ScrollView horizontal style={styles.childSelector}>
                            {children.map(child => (
                                <TouchableOpacity key={child.id} style={[styles.childChip, { backgroundColor: selectedChild === child.id ? colors.primary : colors.background, borderColor: colors.border }]} onPress={() => setSelectedChild(child.id)}>
                                    <Text style={{ color: selectedChild === child.id ? colors.white : colors.text }}>{child.firstName}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <TextInput style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]} placeholder="Schedule Title *" placeholderTextColor={colors.gray} value={newSchedule.title} onChangeText={(text) => setNewSchedule({ ...newSchedule, title: text })} />
                        <TextInput style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]} placeholder="Time (HH:MM) *" placeholderTextColor={colors.gray} value={newSchedule.scheduleTime} onChangeText={(text) => setNewSchedule({ ...newSchedule, scheduleTime: text })} />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.gray }]} onPress={() => setShowAddSchedule(false)}><Text style={styles.modalBtnText}>Cancel</Text></TouchableOpacity>
                            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.primary }]} onPress={handleAddSchedule}><Text style={styles.modalBtnText}>Add</Text></TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { alignItems: 'center', padding: 24, paddingTop: 48, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
    headerTitle: { fontSize: 24, fontWeight: 'bold', marginTop: 12 },
    headerSubtitle: { fontSize: 14, marginTop: 4 },
    content: { padding: 16 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 16 },
    sectionTitle: { fontSize: 18, fontWeight: '600' },
    childCard: { flexDirection: 'row', alignItems: 'center', padding: 16, marginBottom: 12 },
    childAvatar: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
    childInfo: { flex: 1, marginLeft: 16 },
    childName: { fontSize: 16, fontWeight: '600' },
    childDob: { fontSize: 12, marginTop: 2 },
    badge: { marginTop: 6, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, alignSelf: 'flex-start' },
    badgeText: { fontSize: 12 },
    statsCard: { flexDirection: 'row', justifyContent: 'space-around', padding: 16, marginVertical: 16 },
    statItem: { alignItems: 'center' },
    statNumber: { fontSize: 24, fontWeight: 'bold' },
    statLabel: { fontSize: 12, marginTop: 4 },
    scheduleItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
    scheduleTime: { width: 70 },
    timeText: { fontSize: 14, fontWeight: '600' },
    scheduleContent: { flex: 1 },
    scheduleTitle: { fontSize: 14, fontWeight: '500' },
    scheduleChild: { fontSize: 12, marginTop: 2 },
    scheduleAction: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    alertItem: { flexDirection: 'row', padding: 12, marginBottom: 8, borderRadius: 12 },
    alertIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    alertContent: { flex: 1, marginLeft: 12 },
    alertTitle: { fontSize: 14, fontWeight: '500' },
    alertMessage: { fontSize: 12, marginTop: 2 },
    alertTime: { fontSize: 10, marginTop: 4 },
    featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 16 },
    featureCard: { width: '47%', padding: 16, alignItems: 'center' },
    featureIcon: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    featureTitle: { fontSize: 14, fontWeight: '500' },
    emptyCard: { padding: 32, alignItems: 'center', marginVertical: 16 },
    emptyText: { fontSize: 14, marginTop: 8 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: '90%', padding: 24 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
    input: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12, fontSize: 16 },
    label: { fontSize: 14, marginBottom: 8 },
    modalButtons: { flexDirection: 'row', gap: 12, marginTop: 12 },
    modalBtn: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
    modalBtnText: { color: 'white', fontWeight: '600', fontSize: 16 },
    childSelector: { marginBottom: 12 },
    childChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8, borderWidth: 1 },
});

export default ChildCareScreen;
