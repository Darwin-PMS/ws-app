import React, { useState, useCallback, useRef, useEffect } from 'react';
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
    FlatList,
    Keyboard,
    PanResponder,
    Dimensions,
    Animated,
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
    const [messages, setMessages] = useState([]);
    const [messageText, setMessageText] = useState('');
    const [sendingMessage, setSendingMessage] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(false);

    const [complaintType, setComplaintType] = useState('');
    const [description, setDescription] = useState('');
    const [title, setTitle] = useState('');
    const [priority, setPriority] = useState('medium');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const flatListRef = useRef(null);

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
                    `Your complaint has been submitted.\n\nCase ID: ${response.data?.case_id || 'N/A'}\n\nStatus: ${statusLabels[response.data?.status] || 'Pending'}\n\nWe will acknowledge within 24 hours and resolve within 15 days.`,
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

    const openGrievanceDetails = async (grievance) => {
        setSelectedGrievance(grievance);
        setLoadingMessages(true);
        
        try {
            const response = await grievanceService.getGrievanceWithMessages(grievance.id);
            if (response.success) {
                setMessages(response.data?.messages || []);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
            setMessages([]);
        } finally {
            setLoadingMessages(false);
        }
    };

    const handleSendMessage = async () => {
        if (!messageText.trim() || !selectedGrievance) return;

        Keyboard.dismiss();
        setSendingMessage(true);
        const textToSend = messageText.trim();
        setMessageText('');

        try {
            const response = await grievanceService.sendMessage(selectedGrievance.id, textToSend);
            if (response.success) {
                setMessages(prev => [...prev, response.data]);
                setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
            } else {
                Alert.alert('Error', 'Failed to send message');
                setMessageText(textToSend);
            }
        } catch (error) {
            console.error('Error sending message:', error);
            Alert.alert('Error', 'Failed to send message. Please try again.');
            setMessageText(textToSend);
        } finally {
            setSendingMessage(false);
        }
    };

    const SwipeableGrievanceCard = ({ item, onPress, onViewDetails, onDelete }) => {
        const swipeAnim = useRef(new Animated.Value(0)).current;
        const isSwipeOpen = useRef(false);

        const panResponder = useRef(
            PanResponder.create({
                onMoveShouldSetPanResponder: (_, gestureState) => {
                    return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 20;
                },
                onPanResponderMove: (_, gestureState) => {
                    if (gestureState.dx < 0) {
                        swipeAnim.setValue(Math.max(gestureState.dx, -160));
                    }
                },
                onPanResponderRelease: (_, gestureState) => {
                    if (gestureState.dx < -50) {
                        Animated.spring(swipeAnim, {
                            toValue: -160,
                            useNativeDriver: true,
                        }).start();
                        isSwipeOpen.current = true;
                    } else {
                        Animated.spring(swipeAnim, {
                            toValue: 0,
                            useNativeDriver: true,
                        }).start();
                        isSwipeOpen.current = false;
                    }
                },
            })
        ).current;

        const closeSwipe = () => {
            Animated.spring(swipeAnim, {
                toValue: 0,
                useNativeDriver: true,
            }).start();
            isSwipeOpen.current = false;
        };

        const handlePress = () => {
            if (isSwipeOpen.current) {
                closeSwipe();
            } else {
                onPress(item);
            }
        };

        return (
            <View style={styles.swipeContainer}>
                <View style={styles.swipeActions}>
                    <TouchableOpacity
                        style={[styles.swipeAction, styles.viewDetailsAction, { backgroundColor: '#2196F3' }]}
                        onPress={() => {
                            closeSwipe();
                            onViewDetails(item);
                        }}
                    >
                        <Ionicons name="eye-outline" size={22} color="#FFFFFF" />
                        <Text style={styles.swipeActionText}>Details</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.swipeAction, styles.deleteAction, { backgroundColor: '#F44336' }]}
                        onPress={() => {
                            closeSwipe();
                            onDelete(item);
                        }}
                    >
                        <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
                        <Text style={styles.swipeActionText}>Delete</Text>
                    </TouchableOpacity>
                </View>
                <Animated.View
                    style={[
                        styles.grievanceCard,
                        { backgroundColor: colors.card, borderColor: colors.border, transform: [{ translateX: swipeAnim }] },
                    ]}
                    {...panResponder.panHandlers}
                >
                    <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
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
                            <View style={styles.caseIdRow}>
                                <Ionicons name="document-text" size={12} color={colors.primary} />
                                <Text style={[styles.caseId, { color: colors.primary }]}>{item.case_id || 'N/A'}</Text>
                            </View>
                            <Text style={[styles.grievanceCategory, { color: colors.gray }]}>
                                {complaintTypes.find(c => c.id === item.category)?.label || item.category}
                            </Text>
                        </View>
                        <Text style={[styles.grievanceDesc, { color: colors.gray }]} numberOfLines={2}>
                            {item.description}
                        </Text>
                        <View style={styles.grievanceFooter}>
                            <View style={styles.footerLeft}>
                                <View style={[styles.priorityBadge, { backgroundColor: priorityColors[item.priority] + '20' }]}>
                                    <Text style={[styles.priorityText, { color: priorityColors[item.priority] }]}>
                                        {item.priority?.toUpperCase()}
                                    </Text>
                                </View>
                                <Text style={[styles.grievanceDate, { color: colors.gray }]}>
                                    {new Date(item.created_at).toLocaleDateString()}
                                </Text>
                            </View>
                            <View style={styles.swipeHint}>
                                <Ionicons name="chevron-back" size={14} color={colors.gray} />
                                <Text style={[styles.swipeHintText, { color: colors.gray }]}>Swipe</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        );
    };

    const handleViewDetails = (item) => {
        Alert.alert(
            'Complaint Details',
            `Case ID: ${item.case_id || 'N/A'}\n\nTitle: ${item.title}\n\nCategory: ${complaintTypes.find(c => c.id === item.category)?.label || item.category}\n\nStatus: ${statusLabels[item.status] || item.status}\n\nPriority: ${item.priority?.toUpperCase()}\n\nDescription:\n${item.description}\n\nSubmitted: ${new Date(item.created_at).toLocaleString()}${item.resolution_notes ? `\n\nResolution:\n${item.resolution_notes}` : ''}`,
            [
                { text: 'Close', style: 'cancel' },
                { text: 'View Conversation', onPress: () => openGrievanceDetails(item) },
            ]
        );
    };

    const handleDelete = (item) => {
        Alert.alert(
            'Delete Complaint',
            `Are you sure you want to delete this complaint?\n\nCase ID: ${item.case_id || 'N/A'}\n\nThis action cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await grievanceService.updateGrievance(item.id, { deleted: true });
                            setGrievances(prev => prev.filter(g => g.id !== item.id));
                            Alert.alert('Success', 'Complaint deleted successfully');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete complaint');
                        }
                    },
                },
            ]
        );
    };

    const renderGrievanceItem = ({ item }) => (
        <SwipeableGrievanceCard
            item={item}
            onPress={openGrievanceDetails}
            onViewDetails={handleViewDetails}
            onDelete={handleDelete}
        />
    );

    const renderMessageBubble = ({ item, index }) => {
        const isUser = !item.is_admin;
        const showSender = index === 0 || messages[index - 1]?.is_admin !== item.is_admin;
        
        return (
            <View style={[styles.messageContainer, isUser ? styles.userMessageContainer : styles.adminMessageContainer]}>
                {!isUser && showSender && (
                    <View style={styles.senderInfo}>
                        <Ionicons name="shield-checkmark" size={14} color={colors.primary} />
                        <Text style={[styles.senderName, { color: colors.primary }]}>
                            {item.sender_first_name ? `Support Team` : 'Admin'}
                        </Text>
                    </View>
                )}
                <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.adminBubble]}>
                    <Text style={[styles.messageText, { color: isUser ? '#FFFFFF' : colors.text }]}>
                        {item.message}
                    </Text>
                    <Text style={[styles.messageTime, { color: isUser ? 'rgba(255,255,255,0.7)' : colors.gray }]}>
                        {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
            </View>
        );
    };

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

    const renderConversationView = () => {
        if (!selectedGrievance) return null;

        return (
            <KeyboardAvoidingView 
                style={[styles.conversationContainer, { backgroundColor: colors.background }]}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <View style={[styles.conversationHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                    <TouchableOpacity onPress={() => setSelectedGrievance(null)} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <View style={styles.headerInfo}>
                        <View style={styles.caseIdHeader}>
                            <Ionicons name="document-text" size={14} color={colors.primary} />
                            <Text style={[styles.caseIdText, { color: colors.primary }]}>{selectedGrievance.case_id}</Text>
                        </View>
                        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
                            {selectedGrievance.title}
                        </Text>
                        <View style={[styles.statusBadgeSmall, { backgroundColor: statusColors[selectedGrievance.status] + '20' }]}>
                            <Text style={[styles.statusTextSmall, { color: statusColors[selectedGrievance.status] }]}>
                                {statusLabels[selectedGrievance.status]}
                            </Text>
                        </View>
                    </View>
                </View>

                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item) => item.id}
                    renderItem={renderMessageBubble}
                    contentContainerStyle={styles.messagesList}
                    ListEmptyComponent={
                        <View style={styles.emptyMessages}>
                            <Ionicons name="chatbubbles-outline" size={48} color={colors.gray} />
                            <Text style={[styles.emptyMessagesText, { color: colors.gray }]}>
                                No messages yet. Start the conversation!
                            </Text>
                        </View>
                    }
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
                />

                <View style={[styles.messageInputContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
                    <TextInput
                        style={[styles.messageInput, { backgroundColor: colors.background, color: colors.text }]}
                        placeholder="Type your message..."
                        placeholderTextColor={colors.gray}
                        value={messageText}
                        onChangeText={setMessageText}
                        multiline
                        maxLength={1000}
                    />
                    <TouchableOpacity
                        style={[styles.sendButton, { backgroundColor: colors.primary }, (!messageText.trim() || sendingMessage) && styles.sendButtonDisabled]}
                        onPress={handleSendMessage}
                        disabled={!messageText.trim() || sendingMessage}
                    >
                        <Ionicons name="send" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        );
    };

    if (selectedGrievance) {
        return renderConversationView();
    }

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
    caseIdRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    caseId: { fontSize: 11, fontWeight: '600', marginLeft: 4 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    statusText: { fontSize: 11, fontWeight: '600' },
    grievanceCategory: { fontSize: 12 },
    grievanceDesc: { fontSize: 13, marginBottom: 8 },
    grievanceFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
    footerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    priorityBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    priorityText: { fontSize: 10, fontWeight: '600' },
    grievanceDate: { fontSize: 12 },
    detailsButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
    detailsButtonText: { fontSize: 12, fontWeight: '600', marginLeft: 4 },
    swipeHint: { flexDirection: 'row', alignItems: 'center' },
    swipeHintText: { fontSize: 11, marginLeft: 2 },
    swipeContainer: { position: 'relative', marginBottom: 12 },
    swipeActions: { 
        position: 'absolute', 
        right: 0, 
        top: 0, 
        bottom: 12, 
        flexDirection: 'row', 
        alignItems: 'center' 
    },
    swipeAction: { 
        width: 80, 
        height: '100%', 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    viewDetailsAction: { borderTopRightRadius: 12 },
    deleteAction: { borderBottomRightRadius: 12 },
    swipeActionText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600', marginTop: 4 },
    emptyContainer: { alignItems: 'center', paddingTop: 60 },
    emptyText: { fontSize: 16, fontWeight: '600', marginTop: 16 },
    emptySubtext: { fontSize: 14, marginTop: 4 },
    conversationContainer: { flex: 1 },
    conversationHeader: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1 },
    backButton: { padding: 8, marginRight: 8 },
    headerInfo: { flex: 1 },
    caseIdHeader: { flexDirection: 'row', alignItems: 'center' },
    caseIdText: { fontSize: 12, fontWeight: '600', marginLeft: 4 },
    headerTitle: { fontSize: 16, fontWeight: '600', marginTop: 2 },
    statusBadgeSmall: { alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 4 },
    statusTextSmall: { fontSize: 10, fontWeight: '600' },
    messagesList: { padding: 16, flexGrow: 1 },
    messageContainer: { marginBottom: 12, maxWidth: '80%' },
    userMessageContainer: { alignSelf: 'flex-end' },
    adminMessageContainer: { alignSelf: 'flex-start' },
    senderInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    senderName: { fontSize: 12, fontWeight: '600', marginLeft: 4 },
    messageBubble: { padding: 12, borderRadius: 16 },
    userBubble: { backgroundColor: '#2563EB', borderBottomRightRadius: 4 },
    adminBubble: { backgroundColor: '#F3F4F6', borderBottomLeftRadius: 4 },
    messageText: { fontSize: 15, lineHeight: 20 },
    messageTime: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
    emptyMessages: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
    emptyMessagesText: { fontSize: 14, marginTop: 12, textAlign: 'center' },
    messageInputContainer: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, borderTopWidth: 1 },
    messageInput: { flex: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, maxHeight: 100, fontSize: 15 },
    sendButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
    sendButtonDisabled: { opacity: 0.5 },
});

export default GrievanceScreen;
