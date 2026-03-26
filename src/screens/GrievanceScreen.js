import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Alert,
    KeyboardAvoidingView,
    Platform,
    RefreshControl,
    Modal,
    FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { grievanceService } from '../services/grievanceService';
import { useFocusEffect } from '@react-navigation/native';

const complaintTypes = [
    { id: 'data_privacy', label: 'Data Privacy Issue', icon: 'shield-outline' },
    { id: 'harassment', label: 'Harassment/Abuse', icon: 'alert-circle-outline' },
    { id: 'content', label: 'Inappropriate Content', icon: 'ban-outline' },
    { id: 'account', label: 'Account Issue', icon: 'person-outline' },
    { id: 'safety', label: 'Safety Concern', icon: 'warning-outline' },
    { id: 'general', label: 'General', icon: 'help-circle-outline' },
    { id: 'technical', label: 'Technical Issue', icon: 'construct-outline' },
    { id: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline' },
];

const priorityColors = {
    low: '#4CAF50',
    medium: '#2196F3',
    high: '#FF9800',
    urgent: '#F44336',
};

const statusLabels = {
    pending: 'Pending',
    in_progress: 'In Progress',
    resolved: 'Resolved',
    rejected: 'Rejected',
};

const statusColors = {
    pending: '#FF9800',
    in_progress: '#2196F3',
    resolved: '#4CAF50',
    rejected: '#F44336',
};

const GrievanceScreen = ({ navigation }) => {
    const { colors, spacing, borderRadius } = useTheme();

    const [activeTab, setActiveTab] = useState('submit');
    const [grievances, setGrievances] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedGrievance, setSelectedGrievance] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    const [complaintType, setComplaintType] = useState('');
    const [description, setDescription] = useState('');
    const [title, setTitle] = useState('');
    const [priority, setPriority] = useState('medium');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchGrievances = useCallback(async () => {
        try {
            const response = await grievanceService.getMyGrievances();
            if (response.success) {
                setGrievances(response.data || []);
            }
        } catch (error) {
            console.error('Error fetching grievances:', error);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            if (activeTab === 'my') {
                fetchGrievances();
            }
        }, [activeTab, fetchGrievances])
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchGrievances();
        setRefreshing(false);
    }, [fetchGrievances]);

    const handleSubmit = async () => {
        if (!title.trim()) {
            Alert.alert('Required', 'Please enter a title');
            return;
        }
        if (!complaintType) {
            Alert.alert('Required', 'Please select a complaint type');
            return;
        }
        if (!description.trim()) {
            Alert.alert('Required', 'Please describe your complaint');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await grievanceService.submitGrievance({
                title: title.trim(),
                description: description.trim(),
                category: complaintType,
                priority,
            });

            if (response.success) {
                Alert.alert(
                    'Complaint Submitted',
                    `Your complaint has been submitted.\n\nTicket ID: ${response.data?.id?.slice(-8) || 'N/A'}\n\nStatus: ${statusLabels[response.data?.status] || 'Pending'}\n\nWe will acknowledge within 24 hours and resolve within 15 days.`,
                    [
                        {
                            text: 'OK',
                            onPress: () => {
                                setTitle('');
                                setComplaintType('');
                                setDescription('');
                                setPriority('medium');
                                setActiveTab('my');
                            },
                        },
                    ]
                );
            } else {
                Alert.alert('Error', response.error || 'Failed to submit complaint');
            }
        } catch (error) {
            console.error('Submit error:', error);
            Alert.alert('Error', 'Failed to submit complaint. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const openGrievanceDetails = (grievance) => {
        setSelectedGrievance(grievance);
        setShowDetailsModal(true);
    };

    const renderGrievanceItem = ({ item }) => (
        <TouchableOpacity
            style={[styles.grievanceCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => openGrievanceDetails(item)}
        >
            <View style={styles.grievanceHeader}>
                <View style={styles.grievanceTitleRow}>
                    <Text style={[styles.grievanceTitle, { color: colors.text }]} numberOfLines={1}>
                        {item.title}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusColors[item.status] + '20' }]}>
                        <Text style={[styles.statusText, { color: statusColors[item.status] }]}>
                            {statusLabels[item.status] || item.status}
                        </Text>
                    </View>
                </View>
                <Text style={[styles.grievanceCategory, { color: colors.gray }]}>
                    {complaintTypes.find(c => c.id === item.category)?.label || item.category}
                </Text>
            </View>
            <Text style={[styles.grievanceDesc, { color: colors.gray }]} numberOfLines={2}>
                {item.description}
            </Text>
            <View style={styles.grievanceFooter}>
                <View style={[styles.priorityBadge, { backgroundColor: priorityColors[item.priority] + '20' }]}>
                    <Text style={[styles.priorityText, { color: priorityColors[item.priority] }]}>
                        {item.priority?.toUpperCase()}
                    </Text>
                </View>
                <Text style={[styles.grievanceDate, { color: colors.gray }]}>
                    {new Date(item.created_at).toLocaleDateString()}
                </Text>
            </View>
        </TouchableOpacity>
    );

    const renderSubmitTab = () => (
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={[styles.infoBanner, { backgroundColor: colors.primary + '15', borderRadius }]}>
                <Ionicons name="information-circle" size={24} color={colors.primary} />
                <Text style={[styles.infoText, { color: colors.text }]}>
                    As per IT Rules 2021, we will acknowledge your complaint within 24 hours and resolve within 15 days.
                </Text>
            </View>

            <Text style={[styles.label, { color: colors.text }]}>Title *</Text>
            <TextInput
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                placeholder="Enter complaint title"
                placeholderTextColor={colors.gray}
                value={title}
                onChangeText={setTitle}
            />

            <Text style={[styles.label, { color: colors.text }]}>Complaint Type *</Text>
            <View style={styles.typeGrid}>
                {complaintTypes.map((type) => (
                    <TouchableOpacity
                        key={type.id}
                        style={[
                            styles.typeButton,
                            { backgroundColor: colors.card, borderColor: complaintType === type.id ? colors.primary : colors.border },
                        ]}
                        onPress={() => setComplaintType(type.id)}
                    >
                        <Ionicons
                            name={type.icon}
                            size={18}
                            color={complaintType === type.id ? colors.primary : colors.gray}
                        />
                        <Text style={[styles.typeLabel, { color: complaintType === type.id ? colors.primary : colors.gray }]}>
                            {type.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <Text style={[styles.label, { color: colors.text }]}>Priority</Text>
            <View style={styles.priorityRow}>
                {['low', 'medium', 'high', 'urgent'].map((p) => (
                    <TouchableOpacity
                        key={p}
                        style={[
                            styles.priorityButton,
                            { backgroundColor: priority === p ? priorityColors[p] + '20' : colors.card, borderColor: priorityColors[p] },
                        ]}
                        onPress={() => setPriority(p)}
                    >
                        <Text style={[styles.priorityButtonText, { color: priorityColors[p] }]}>{p.toUpperCase()}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <Text style={[styles.label, { color: colors.text }]}>Description *</Text>
            <TextInput
                style={[styles.textArea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                placeholder="Please provide detailed information..."
                placeholderTextColor={colors.gray}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
            />

            <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: colors.primary }, isSubmitting && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={isSubmitting}
            >
                <Ionicons name="send" size={20} color="#FFFFFF" />
                <Text style={styles.submitText}>{isSubmitting ? 'Submitting...' : 'Submit Complaint'}</Text>
            </TouchableOpacity>

            <View style={[styles.altContact, { backgroundColor: colors.card, borderRadius }]}>
                <Text style={[styles.altTitle, { color: colors.text }]}>Other Ways to Contact</Text>
                <Text style={[styles.altText, { color: colors.gray }]}>Email: grievance@womensafetyapp.in</Text>
            </View>
        </ScrollView>
    );

    const renderMyGrievancesTab = () => (
        <FlatList
            data={grievances}
            keyExtractor={(item) => item.id}
            renderItem={renderGrievanceItem}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
            ListEmptyComponent={
                <View style={styles.emptyContainer}>
                    <Ionicons name="document-text-outline" size={64} color={colors.gray} />
                    <Text style={[styles.emptyText, { color: colors.gray }]}>No complaints yet</Text>
                    <Text style={[styles.emptySubtext, { color: colors.gray }]}>Submit your first complaint</Text>
                </View>
            }
        />
    );

    return (
        <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={styles.tabContainer}>
                <TouchableOpacity style={[styles.tab, activeTab === 'submit' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]} onPress={() => setActiveTab('submit')}>
                    <Text style={[styles.tabText, { color: activeTab === 'submit' ? colors.primary : colors.gray }]}>Submit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tab, activeTab === 'my' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]} onPress={() => setActiveTab('my')}>
                    <Text style={[styles.tabText, { color: activeTab === 'my' ? colors.primary : colors.gray }]}>My Complaints</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                {activeTab === 'submit' ? renderSubmitTab() : renderMyGrievancesTab()}
            </View>

            <Modal visible={showDetailsModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                        {selectedGrievance && (
                            <ScrollView showsVerticalScrollIndicator={false}>
                                <View style={styles.modalHeader}>
                                    <Text style={[styles.modalTitle, { color: colors.text }]}>Complaint Details</Text>
                                    <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
                                        <Ionicons name="close" size={24} color={colors.gray} />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.detailRow}>
                                    <Text style={[styles.detailLabel, { color: colors.gray }]}>Ticket ID</Text>
                                    <Text style={[styles.detailValue, { color: colors.text }]}>{selectedGrievance.id}</Text>
                                </View>

                                <View style={styles.detailRow}>
                                    <Text style={[styles.detailLabel, { color: colors.gray }]}>Title</Text>
                                    <Text style={[styles.detailValue, { color: colors.text }]}>{selectedGrievance.title}</Text>
                                </View>

                                <View style={styles.detailRow}>
                                    <Text style={[styles.detailLabel, { color: colors.gray }]}>Category</Text>
                                    <Text style={[styles.detailValue, { color: colors.text }]}>
                                        {complaintTypes.find(c => c.id === selectedGrievance.category)?.label || selectedGrievance.category}
                                    </Text>
                                </View>

                                <View style={styles.detailRow}>
                                    <Text style={[styles.detailLabel, { color: colors.gray }]}>Priority</Text>
                                    <View style={[styles.priorityBadge, { backgroundColor: priorityColors[selectedGrievance.priority] + '20' }]}>
                                        <Text style={[styles.priorityText, { color: priorityColors[selectedGrievance.priority] }]}>
                                            {selectedGrievance.priority?.toUpperCase()}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.detailRow}>
                                    <Text style={[styles.detailLabel, { color: colors.gray }]}>Status</Text>
                                    <View style={[styles.statusBadge, { backgroundColor: statusColors[selectedGrievance.status] + '20' }]}>
                                        <Text style={[styles.statusText, { color: statusColors[selectedGrievance.status] }]}>
                                            {statusLabels[selectedGrievance.status]}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.detailRow}>
                                    <Text style={[styles.detailLabel, { color: colors.gray }]}>Description</Text>
                                    <Text style={[styles.detailValue, { color: colors.text }]}>{selectedGrievance.description}</Text>
                                </View>

                                {selectedGrievance.resolution_notes && (
                                    <View style={styles.detailRow}>
                                        <Text style={[styles.detailLabel, { color: colors.gray }]}>Resolution Notes</Text>
                                        <Text style={[styles.detailValue, { color: colors.text }]}>{selectedGrievance.resolution_notes}</Text>
                                    </View>
                                )}

                                <View style={styles.detailRow}>
                                    <Text style={[styles.detailLabel, { color: colors.gray }]}>Submitted On</Text>
                                    <Text style={[styles.detailValue, { color: colors.text }]}>{new Date(selectedGrievance.created_at).toLocaleString()}</Text>
                                </View>

                                <View style={styles.detailRow}>
                                    <Text style={[styles.detailLabel, { color: colors.gray }]}>Last Updated</Text>
                                    <Text style={[styles.detailValue, { color: colors.text }]}>{new Date(selectedGrievance.updated_at).toLocaleString()}</Text>
                                </View>

                                <TouchableOpacity style={[styles.closeButton, { backgroundColor: colors.primary }]} onPress={() => setShowDetailsModal(false)}>
                                    <Text style={styles.closeButtonText}>Close</Text>
                                </TouchableOpacity>
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    tabContainer: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
    tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
    tabText: { fontSize: 15, fontWeight: '600' },
    content: { flex: 1 },
    listContent: { padding: 16 },
    infoBanner: { flexDirection: 'row', alignItems: 'flex-start', padding: 16, marginBottom: 16 },
    infoText: { flex: 1, marginLeft: 12, fontSize: 13, lineHeight: 20 },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 12 },
    input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 14 },
    typeGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
    typeButton: { width: '48%', flexDirection: 'row', alignItems: 'center', padding: 10, marginHorizontal: '1%', marginBottom: 8, borderRadius: 10, borderWidth: 1 },
    typeLabel: { fontSize: 12, marginLeft: 6, fontWeight: '500' },
    priorityRow: { flexDirection: 'row', marginHorizontal: -4 },
    priorityButton: { flex: 1, padding: 10, marginHorizontal: 4, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
    priorityButtonText: { fontSize: 12, fontWeight: '600' },
    textArea: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 14, minHeight: 120 },
    submitButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, marginTop: 24 },
    submitButtonDisabled: { opacity: 0.6 },
    submitText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600', marginLeft: 8 },
    altContact: { padding: 16, marginTop: 24 },
    altTitle: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
    altText: { fontSize: 13, marginBottom: 4 },
    grievanceCard: { borderWidth: 1, borderRadius: 12, padding: 16, marginBottom: 12 },
    grievanceHeader: { marginBottom: 8 },
    grievanceTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    grievanceTitle: { flex: 1, fontSize: 15, fontWeight: '600' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    statusText: { fontSize: 11, fontWeight: '600' },
    grievanceCategory: { fontSize: 12 },
    grievanceDesc: { fontSize: 13, marginBottom: 8 },
    grievanceFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    priorityBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    priorityText: { fontSize: 10, fontWeight: '600' },
    grievanceDate: { fontSize: 12 },
    emptyContainer: { alignItems: 'center', paddingTop: 60 },
    emptyText: { fontSize: 16, fontWeight: '600', marginTop: 16 },
    emptySubtext: { fontSize: 14, marginTop: 4 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 18, fontWeight: '700' },
    detailRow: { marginBottom: 16 },
    detailLabel: { fontSize: 12, marginBottom: 4 },
    detailValue: { fontSize: 15 },
    closeButton: { padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 20 },
    closeButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});

export default GrievanceScreen;