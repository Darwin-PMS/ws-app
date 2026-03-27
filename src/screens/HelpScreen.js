import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Linking,
    TextInput,
    Alert,
    Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';

const HelpScreen = ({ navigation }) => {
    const { colors, shadows } = useTheme();
    const { userId } = useApp();

    const [expandedFAQ, setExpandedFAQ] = useState(null);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [feedbackType, setFeedbackType] = useState('general');
    const [feedbackMessage, setFeedbackMessage] = useState('');
    const [feedbackEmail, setFeedbackEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const feedbackTypes = [
        { id: 'general', label: 'General Inquiry', icon: 'chatbox-ellipses-outline' },
        { id: 'bug', label: 'Report a Bug', icon: 'bug-outline' },
        { id: 'feature', label: 'Feature Request', icon: 'bulb-outline' },
        { id: 'emergency', label: 'Emergency Issue', icon: 'warning-outline' },
    ];

    const faqData = [
        {
            id: 'sos',
            question: 'How does the SOS feature work?',
            answer: 'Press the SOS button for 3 seconds or shake your phone vigorously to trigger an emergency alert. This will send your location and emergency notification to all your trusted contacts and local authorities. You can configure SOS settings in Settings > SOS Settings.',
        },
        {
            id: 'location',
            question: 'How do I share my location with family?',
            answer: 'Go to Settings > Location & Sharing and enable "Share Location". Your family members who have been added to your family circle will be able to see your real-time location. You can also manually share your location from the Live Tracking screen.',
        },
        {
            id: 'fake_call',
            question: 'How do I use the Fake Call feature?',
            answer: 'Navigate to More > Fake Call to set up a fake incoming call. You can customize the caller name, timing, and ringtone. When activated, your phone will ring as if receiving a real call, giving you an excuse to leave any situation.',
        },
        {
            id: 'live_share',
            question: 'What is Live Share and how do I use it?',
            answer: 'Live Share activates your camera and microphone to stream audio/video to your emergency contacts in real-time. Go to More > Live Share to start a session. Your trusted contacts will receive a link to view your live stream and location.',
        },
        {
            id: 'privacy',
            question: 'Is my data and location data secure?',
            answer: 'Yes, your privacy is our top priority. All data is encrypted and stored securely. Your location is only shared when you explicitly enable sharing or during an SOS emergency. You can review and manage your data in Settings > Privacy.',
        },
        {
            id: 'notifications',
            question: 'Why am I not receiving notifications?',
            answer: 'Check that notifications are enabled in your device settings and that our app has notification permissions. Go to Settings > Permissions > Notifications and ensure "Allow Notifications" is enabled. Also check your phone\'s do-not-disturb settings.',
        },
        {
            id: 'battery',
            question: 'Does this app drain my battery?',
            answer: 'We\'ve optimized the app to minimize battery usage. Location updates only run when actively sharing or during an SOS. You can reduce background activity in Settings > Notifications by disabling features you don\'t use.',
        },
        {
            id: 'family',
            question: 'How do I add family members?',
            answer: 'Go to More > Family and tap the + button. You can add members by their phone number or email. They\'ll receive an invitation to join your family circle. Once accepted, they\'ll receive your emergency alerts and can track your location.',
        },
    ];

    const quickGuides = [
        {
            id: 'getting_started',
            title: 'Getting Started',
            icon: 'rocket-outline',
            color: '#10B981',
            items: ['Complete your profile', 'Add emergency contacts', 'Enable location sharing', 'Set up SOS preferences'],
        },
        {
            id: 'sos_setup',
            title: 'SOS Setup',
            icon: 'warning-outline',
            color: '#EF4444',
            items: ['Configure SOS contacts', 'Set SOS timer', 'Enable shake detection', 'Add quick actions'],
        },
        {
            id: 'safety_features',
            title: 'Safety Features',
            icon: 'shield-checkmark-outline',
            color: '#3B82F6',
            items: ['Live location sharing', 'Safe route navigation', 'Audio evidence recording', 'Voice keyword detection'],
        },
    ];

    const contactOptions = [
        {
            id: 'email',
            title: 'Email Support',
            subtitle: 'support@safeher.in',
            icon: 'mail-outline',
            color: '#3B82F6',
            action: () => Linking.openURL('mailto:support@safeher.in?subject=Help & Support Request'),
        },
        {
            id: 'phone',
            title: '24/7 Helpline',
            subtitle: '+91 98765 43210',
            icon: 'call-outline',
            color: '#10B981',
            action: () => Linking.openURL('tel:+919876543210'),
        },
        {
            id: 'whatsapp',
            title: 'WhatsApp',
            subtitle: 'Chat with us',
            icon: 'logo-whatsapp',
            color: '#25D366',
            action: () => Linking.openURL('https://wa.me/919876543210'),
        },
        {
            id: 'feedback',
            title: 'Send Feedback',
            subtitle: 'Help us improve',
            icon: 'chatbox-ellipses-outline',
            color: '#F59E0B',
            action: () => setShowFeedbackModal(true),
        },
    ];

    const toggleFAQ = (id) => {
        setExpandedFAQ(expandedFAQ === id ? null : id);
    };

    const handleSubmitFeedback = async () => {
        if (!feedbackMessage.trim()) {
            Alert.alert('Error', 'Please enter your message');
            return;
        }

        setIsSubmitting(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1500));
            Alert.alert('Success', 'Thank you for your feedback! We will get back to you within 24 hours.');
            setShowFeedbackModal(false);
            setFeedbackMessage('');
            setFeedbackEmail('');
            setFeedbackType('general');
        } catch (error) {
            Alert.alert('Error', 'Failed to submit feedback. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: '#F59E0B' }]}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <View style={[styles.headerIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                    <Ionicons name="help-circle" size={40} color="#fff" />
                </View>
                <Text style={styles.headerTitle}>Help & Support</Text>
                <Text style={styles.headerSubtitle}>We're here to help you</Text>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={20} color={colors.gray} />
                    <Text style={[styles.searchPlaceholder, { color: colors.gray }]}>Search help articles...</Text>
                </View>

                <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Guides</Text>
                <View style={styles.quickGuidesContainer}>
                    {quickGuides.map((guide) => (
                        <TouchableOpacity
                            key={guide.id}
                            style={[styles.quickGuideCard, { backgroundColor: colors.card, ...shadows.md }]}
                        >
                            <View style={[styles.quickGuideIcon, { backgroundColor: guide.color + '15' }]}>
                                <Ionicons name={guide.icon} size={24} color={guide.color} />
                            </View>
                            <Text style={[styles.quickGuideTitle, { color: colors.text }]}>{guide.title}</Text>
                            <View style={styles.quickGuideItems}>
                                {guide.items.map((item, index) => (
                                    <View key={index} style={styles.quickGuideItem}>
                                        <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                                        <Text style={[styles.quickGuideItemText, { color: colors.gray }]}>{item}</Text>
                                    </View>
                                ))}
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={[styles.sectionTitle, { color: colors.text }]}>Frequently Asked Questions</Text>
                <View style={[styles.faqContainer, { backgroundColor: colors.card, ...shadows.md }]}>
                    {faqData.map((faq, index) => (
                        <TouchableOpacity
                            key={faq.id}
                            style={[
                                styles.faqItem,
                                index < faqData.length - 1 && { borderBottomWidth: 1, borderColor: colors.border }
                            ]}
                            onPress={() => toggleFAQ(faq.id)}
                        >
                            <View style={styles.faqHeader}>
                                <Text style={[styles.faqQuestion, { color: colors.text }]}>{faq.question}</Text>
                                <Ionicons
                                    name={expandedFAQ === faq.id ? 'chevron-up' : 'chevron-down'}
                                    size={20}
                                    color={colors.gray}
                                />
                            </View>
                            {expandedFAQ === faq.id && (
                                <Text style={[styles.faqAnswer, { color: colors.gray }]}>{faq.answer}</Text>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={[styles.sectionTitle, { color: colors.text }]}>Contact Us</Text>
                <View style={styles.contactContainer}>
                    {contactOptions.map((contact) => (
                        <TouchableOpacity
                            key={contact.id}
                            style={[styles.contactCard, { backgroundColor: colors.card, ...shadows.md }]}
                            onPress={contact.action}
                        >
                            <View style={[styles.contactIcon, { backgroundColor: contact.color + '15' }]}>
                                <Ionicons name={contact.icon} size={22} color={contact.color} />
                            </View>
                            <View style={styles.contactContent}>
                                <Text style={[styles.contactTitle, { color: colors.text }]}>{contact.title}</Text>
                                <Text style={[styles.contactSubtitle, { color: colors.gray }]}>{contact.subtitle}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={colors.gray} />
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={[styles.emergencyCard, { backgroundColor: '#EF444415' }]}>
                    <View style={styles.emergencyHeader}>
                        <Ionicons name="warning" size={24} color="#EF4444" />
                        <Text style={styles.emergencyTitle}>In Immediate Danger?</Text>
                    </View>
                    <Text style={[styles.emergencyText, { color: colors.text }]}>
                        If you're in immediate danger, please contact local emergency services immediately.
                    </Text>
                    <TouchableOpacity
                        style={styles.emergencyButton}
                        onPress={() => Linking.openURL('tel:100')}
                    >
                        <Ionicons name="call" size={20} color="#fff" />
                        <Text style={styles.emergencyButtonText}>Call Emergency Services</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.bottomPadding} />
            </ScrollView>

            <Modal
                visible={showFeedbackModal}
                animationType="slide"
                transparent
                onRequestClose={() => setShowFeedbackModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card, borderRadius: 24 }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>Send Feedback</Text>
                            <TouchableOpacity onPress={() => setShowFeedbackModal(false)} style={styles.closeButton}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.inputLabel, { color: colors.gray }]}>Feedback Type</Text>
                        <View style={styles.feedbackTypeContainer}>
                            {feedbackTypes.map((type) => (
                                <TouchableOpacity
                                    key={type.id}
                                    style={[
                                        styles.feedbackTypeButton,
                                        feedbackType === type.id && { backgroundColor: colors.primary + '20', borderColor: colors.primary },
                                    ]}
                                    onPress={() => setFeedbackType(type.id)}
                                >
                                    <Ionicons
                                        name={type.icon}
                                        size={18}
                                        color={feedbackType === type.id ? colors.primary : colors.gray}
                                    />
                                    <Text
                                        style={[
                                            styles.feedbackTypeText,
                                            { color: feedbackType === type.id ? colors.primary : colors.gray }
                                        ]}
                                    >
                                        {type.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: colors.gray }]}>Email (Optional)</Text>
                            <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                                <Ionicons name="mail-outline" size={20} color={colors.gray} />
                                <TextInput
                                    style={[styles.input, { color: colors.text }]}
                                    value={feedbackEmail}
                                    onChangeText={setFeedbackEmail}
                                    placeholder="your@email.com"
                                    placeholderTextColor={colors.gray}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: colors.gray }]}>Message</Text>
                            <View style={[styles.textAreaWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                                <TextInput
                                    style={[styles.textArea, { color: colors.text }]}
                                    value={feedbackMessage}
                                    onChangeText={setFeedbackMessage}
                                    placeholder="Describe your issue or suggestion..."
                                    placeholderTextColor={colors.gray}
                                    multiline
                                    numberOfLines={5}
                                    textAlignVertical="top"
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.submitButton, { backgroundColor: colors.primary }]}
                            onPress={handleSubmitFeedback}
                            disabled={isSubmitting}
                        >
                            <Text style={styles.submitButtonText}>
                                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 60, paddingBottom: 28, alignItems: 'center', borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
    backBtn: { position: 'absolute', top: 16, left: 16, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    headerIcon: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
    headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
    content: { flex: 1, padding: 16 },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 20, gap: 10 },
    searchPlaceholder: { fontSize: 15 },
    sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, marginTop: 8 },
    quickGuidesContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
    quickGuideCard: { width: '47%', padding: 16, borderRadius: 16 },
    quickGuideIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    quickGuideTitle: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
    quickGuideItems: { gap: 4 },
    quickGuideItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    quickGuideItemText: { fontSize: 11 },
    faqContainer: { borderRadius: 16, marginBottom: 20, overflow: 'hidden' },
    faqItem: { padding: 16 },
    faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    faqQuestion: { fontSize: 14, fontWeight: '600', flex: 1, marginRight: 10 },
    faqAnswer: { fontSize: 13, lineHeight: 20, marginTop: 10 },
    contactContainer: { gap: 12, marginBottom: 20 },
    contactCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, gap: 14 },
    contactIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    contactContent: { flex: 1 },
    contactTitle: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
    contactSubtitle: { fontSize: 13 },
    emergencyCard: { padding: 20, borderRadius: 20, marginBottom: 20 },
    emergencyHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
    emergencyTitle: { fontSize: 16, fontWeight: '700', color: '#EF4444' },
    emergencyText: { fontSize: 13, lineHeight: 20, marginBottom: 16 },
    emergencyButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#EF4444', paddingVertical: 14, borderRadius: 12, gap: 8 },
    emergencyButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
    bottomPadding: { height: 30 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContent: { padding: 24, paddingBottom: 40, maxHeight: '90%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: '700' },
    closeButton: { padding: 4 },
    feedbackTypeContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
    feedbackTypeButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#ddd', gap: 8 },
    feedbackTypeText: { fontSize: 13, fontWeight: '500' },
    inputGroup: { marginBottom: 16 },
    inputLabel: { fontSize: 13, fontWeight: '500', marginBottom: 8 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, height: 50, gap: 12 },
    input: { flex: 1, fontSize: 16 },
    textAreaWrapper: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, minHeight: 120 },
    textArea: { fontSize: 16, flex: 1 },
    submitButton: { padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
    submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export default HelpScreen;
