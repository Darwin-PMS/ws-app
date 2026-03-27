import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal, FlatList, Animated, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import groqApi from '../services/groqApi';
import settingsService from '../services/settingsService';

const WORKSHOP_CATEGORIES = [
    { id: 'harassment', title: 'Harassment Awareness', icon: 'shield-checkmark', color: '#E91E63', description: 'Learn to identify and respond to harassment', scenarios: 5 },
    { id: 'self-defense', title: 'Self-Defense', icon: 'fitness', color: '#FF5722', description: 'Interactive self-defense training', scenarios: 4 },
    { id: 'digital_safety', title: 'Digital Safety', icon: 'phone-portrait', color: '#9C27B0', description: 'Online safety & privacy', scenarios: 4 },
    { id: 'workplace', title: 'Workplace Safety', icon: 'business', color: '#2196F3', description: 'Workplace harassment prevention', scenarios: 4 },
    { id: 'public', title: 'Public Safety', icon: 'people', color: '#4CAF50', description: 'Safety in public spaces', scenarios: 4 },
];

const SCENARIOS = {
    harassment: [
        { id: 'h1', title: 'Street Harassment', description: 'Respond to unwanted comments', difficulty: 'Beginner', situations: [{ dialogue: 'Hey beautiful, why are you in such a hurry? Stop and talk to me!', options: [{ text: 'Ignore and walk faster', response: 'Ignoring can work but may escalate. Consider being more assertive.' }, { text: 'Firmly say "Leave me alone"', response: 'A clear, firm boundary is effective. Maintain eye contact.' }, { text: 'Start recording them', response: 'Documentation can deter harassment but may escalate.' }] }] },
        { id: 'h2', title: 'Workplace Harassment', description: 'Handle inappropriate comments', difficulty: 'Intermediate', situations: [{ dialogue: 'Hey, you look great in that outfit!', options: [{ text: 'Thank you and walk away', response: 'Politely acknowledging but not engaging is a good approach.' }, { text: 'This is inappropriate', response: 'Being direct is effective. Document the incident.' }, { text: 'Ignore and continue', response: 'Ignoring may not address the underlying issue.' }] }] },
        { id: 'h3', title: 'Public Transport', description: 'Deal with inappropriate behavior', difficulty: 'Intermediate', situations: [{ dialogue: 'Move closer to me, there is no space', options: [{ text: 'Move to another seat', response: 'Creating distance is a smart safety choice.' }, { text: 'Say "Please give me space"', response: 'Using polite but firm language works well.' }, { text: 'Take out phone to record', response: 'Documentation can provide evidence if needed.' }] }] },
        { id: 'h4', title: 'Online Harassment', description: 'Respond to harassing messages', difficulty: 'Beginner', situations: [{ dialogue: 'Send inappropriate messages', options: [{ text: 'Block and report', response: 'Blocking is the first step to protect yourself.' }, { text: 'Reply with harsh words', response: 'Engaging may escalate the situation.' }, { text: 'Save evidence', response: 'Saving evidence is important for reporting.' }] }] },
        { id: 'h5', title: 'Verbal De-escalation', description: 'De-escalate confrontation', difficulty: 'Advanced', situations: [{ dialogue: 'Why are you looking at me? Fight me!', options: [{ text: 'Stay calm and walk away', response: 'De-escalation through ignoring works in many cases.' }, { text: 'Call for help', response: 'Getting attention from others can deter aggression.' }, { text: 'Find a safe exit', response: 'Having an exit plan is always wise.' }] }] },
    ],
    self_defense: [
        { id: 'sd1', title: 'Basic Escape', description: 'Break free from grabs', difficulty: 'Beginner', techniques: [{ name: 'Wrist Escape', desc: 'Rotate wrist inward and pull away firmly' }, { name: 'Arm Break', desc: 'Use body weight to bend arm upward' }, { name: 'Palm Strike', desc: 'Strike palm upward to create space' }] },
        { id: 'sd2', title: 'Voice Power', description: 'Use your voice effectively', difficulty: 'Beginner', techniques: [{ name: 'Scream', desc: 'Short, sharp: "HELP!" "BACK OFF!"' }, { name: 'Command Voice', desc: 'Low, authoritative tone' }, { name: 'Distress Signal', desc: 'Attract attention by calling specific person' }] },
        { id: 'sd3', title: 'Pressure Points', description: 'Learn vulnerable points', difficulty: 'Intermediate', techniques: [{ name: 'Eyes', desc: 'Palm strike to eyes causes temporary blindness' }, { name: 'Throat', desc: 'Palm or finger strike to throat' }, { name: 'Groin', desc: 'Knee strike or palm strike' }] },
        { id: 'sd4', title: 'Running Safety', description: 'Safe escape techniques', difficulty: 'Beginner', techniques: [{ name: 'Zigzag Running', desc: 'Change direction unpredictably' }, { name: 'Make Noise', desc: 'Scream while running to attract attention' }, { name: 'Find Crowd', desc: 'Run toward populated areas' }] },
    ],
    digital_safety: [
        { id: 'ds1', title: 'Social Media Privacy', description: 'Secure your accounts', difficulty: 'Beginner', tips: ['Enable two-factor authentication', 'Review privacy settings regularly', 'Limit location sharing', 'Be cautious with friend requests', 'Use strong passwords'] },
        { id: 'ds2', title: 'Safe Online Dating', description: 'Protect yourself online', difficulty: 'Intermediate', tips: ['Use separate phone number for dating apps', 'Meet in public places first', 'Tell someone about your plans', 'Verify person identity before meeting', 'Never share financial info'] },
        { id: 'ds3', title: 'Password Security', description: 'Create secure passwords', difficulty: 'Beginner', tips: ['Use unique passwords for each account', 'Use a password manager', 'Enable biometric login when available', 'Never share passwords via text/email', 'Use passphrases'] },
        { id: 'ds4', title: 'Device Security', description: 'Protect your devices', difficulty: 'Intermediate', tips: ['Set up remote wipe capability', 'Use screen lock always', 'Encrypt sensitive data', 'Be cautious with public WiFi', 'Keep software updated'] },
    ],
    workplace: [
        { id: 'w1', title: 'Identifying Harassment', description: 'Recognize harassment forms', difficulty: 'Beginner', tips: ['Unwanted physical contact', 'Inappropriate jokes or comments', 'Professional opportunities withheld', 'Creating a hostile work environment', 'Sexual advances'] },
        { id: 'w2', title: 'Reporting Procedures', description: 'How to report incidents', difficulty: 'Intermediate', tips: ['Document everything with dates', 'Report to HR in writing', 'Know your company policies', 'Seek external resources if needed', 'Keep copies of reports'] },
        { id: 'w3', title: 'Building Support', description: 'Create support network', difficulty: 'Beginner', tips: ['Build relationships with allies', 'Know your rights', 'Keep records of support', 'Access employee assistance programs', 'Join support groups'] },
        { id: 'w4', title: 'Legal Protections', description: 'Understand your rights', difficulty: 'Advanced', tips: ['Title VII protections', 'State-specific laws', 'File with EEOC', 'Consult an attorney', 'Know filing deadlines'] },
    ],
    public: [
        { id: 'p1', title: 'Safe Walking', description: 'Stay safe while walking', difficulty: 'Beginner', tips: ['Walk with confidence', 'Stay in well-lit areas', 'Know your route', 'Trust your instincts', 'Avoid distracted walking'] },
        { id: 'p2', title: 'Ride Share Safety', description: 'Use ride shares safely', difficulty: 'Beginner', tips: ['Verify the license plate', 'Sit in the back seat', 'Share trip with friend', 'Trust your instincts', 'Check driver info'] },
        { id: 'p3', title: 'Emergency Response', description: 'Know what to do in emergencies', difficulty: 'Intermediate', tips: ['Call emergency services', 'Know your location', 'Find a safe place', 'Get help from bystanders', 'Stay calm'] },
        { id: 'p4', title: 'Self-Defense Products', description: 'Legal self-defense options', difficulty: 'Beginner', tips: ['Personal alarm', 'Whistle', 'Pepper spray (where legal)', 'Legal weapons by state', 'Self-defense classes'] },
    ],
};

const DIFFICULTY_COLORS = { 'Beginner': '#4CAF50', 'Intermediate': '#FF9800', 'Advanced': '#F44336' };

const AISafetyWorkshopScreen = ({ navigation }) => {
    const { colors, shadows } = useTheme();
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedScenario, setSelectedScenario] = useState(null);
    const [currentSituation, setCurrentSituation] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [aiResponse, setAiResponse] = useState('');
    const [loadingOption, setLoadingOption] = useState(null);
    const [showAITip, setShowAITip] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const aiFadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => { 
        if (showModal) { 
            Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start(); 
        } else { 
            fadeAnim.setValue(0); 
        } 
    }, [showModal]);

    useEffect(() => { 
        if (showAITip) { 
            Animated.timing(aiFadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start(); 
        } else { 
            aiFadeAnim.setValue(0); 
        } 
    }, [showAITip]);

    const getProgressPercent = (completed, total) => {
        if (!total || total === 0) return 0;
        return (completed / total) * 100;
    };

    const handleCategorySelect = (category) => { 
        setSelectedCategory(category); 
        setSelectedScenario(null); 
        setShowModal(true); 
    };
    
    const getScenarios = (id) => SCENARIOS[id] || [];
    
    const handleScenarioSelect = (scenario) => { 
        setSelectedScenario(scenario); 
        setCurrentSituation(0); 
        setShowAITip(false); 
        setAiResponse(''); 
    };
    
    const handleOptionSelect = async (option, index) => { 
        setLoadingOption(index);
        const fallbackResponse = option.response;
        
        try { 
            // Get API key from settings service
            const apiKey = await settingsService.getGroqApiKey();
            
            const prompt = `Safety training feedback. Scenario: "${selectedScenario?.title}". User chose: "${option.text}". Give brief encouraging feedback in 1-2 sentences.`; 
            const response = await groqApi.generateResponse(prompt, apiKey); 
            setAiResponse(response || fallbackResponse); 
        } catch (e) { 
            setAiResponse(fallbackResponse); 
        } 
        
        setLoadingOption(null);
        setShowAITip(true); 
    };
    
    const handleNext = () => { 
        const hasMoreSituations = selectedScenario?.situations && currentSituation < selectedScenario.situations.length - 1;
        
        if (hasMoreSituations) { 
            setCurrentSituation(currentSituation + 1); 
            setShowAITip(false); 
            setAiResponse(''); 
        } else { 
            Alert.alert('Completed!', 'Great job completing this workshop!', [
                { text: 'Back to Categories', onPress: () => closeModal() },
                { text: 'Stay', style: 'cancel' }
            ]); 
        } 
    };
    
    const getProgress = (id) => { 
        const progress = { harassment: 2, self_defense: 1, digital_safety: 0, workplace: 0, public: 1 }; 
        return progress[id] || 0; 
    };
    
    const closeModal = () => { 
        setShowModal(false); 
        setSelectedCategory(null); 
        setSelectedScenario(null); 
        setShowAITip(false); 
        setCurrentSituation(0);
    };

    const handleBackFromScenario = () => {
        setSelectedScenario(null);
        setShowAITip(false);
        setAiResponse('');
        setCurrentSituation(0);
    };

    const renderCategory = ({ item }) => (
        <TouchableOpacity 
            style={[styles.categoryCard, { backgroundColor: colors.card, ...shadows.sm }]} 
            onPress={() => handleCategorySelect(item)}
        >
            <View style={[styles.categoryIcon, { backgroundColor: item.color + '20' }]}>
                <Ionicons name={item.icon} size={24} color={item.color} />
            </View>
            <View style={styles.categoryInfo}>
                <Text style={[styles.categoryTitle, { color: colors.text }]}>{item.title}</Text>
                <Text style={[styles.categoryDesc, { color: colors.gray }]} numberOfLines={1}>{item.description}</Text>
                <View style={styles.progressContainer}>
                    <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                        <View style={[styles.progressFill, { backgroundColor: item.color, width: `${getProgressPercent(getProgress(item.id), item.scenarios)}%` }]} />
                    </View>
                    <Text style={[styles.progressText, { color: colors.gray }]}>{getProgress(item.id)}/{item.scenarios}</Text>
                </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.gray} />
        </TouchableOpacity>
    );

    const renderScenario = ({ item }) => (
        <TouchableOpacity 
            style={[styles.scenarioCard, { backgroundColor: colors.card, ...shadows.sm }]} 
            onPress={() => handleScenarioSelect(item)}
        >
            <View style={styles.scenarioHeader}>
                <Text style={[styles.scenarioTitle, { color: colors.text }]}>{item.title}</Text>
                <View style={[styles.difficultyBadge, { backgroundColor: (DIFFICULTY_COLORS[item.difficulty] || '#999') + '20' }]}>
                    <Text style={[styles.difficultyText, { color: DIFFICULTY_COLORS[item.difficulty] || '#999' }]}>{item.difficulty}</Text>
                </View>
            </View>
            <Text style={[styles.scenarioDesc, { color: colors.gray }]} numberOfLines={1}>{item.description}</Text>
        </TouchableOpacity>
    );

    const renderScenarioContent = () => {
        if (!selectedScenario) return null;
        const scenario = selectedScenario;
        const hasSituations = scenario.situations && scenario.situations.length > 0;
        const hasTechniques = scenario.techniques && scenario.techniques.length > 0;
        const hasTips = scenario.tips && scenario.tips.length > 0;
        
        return (
            <ScrollView style={styles.activeScenario} showsVerticalScrollIndicator={false}>
                <TouchableOpacity style={styles.backBtnRow} onPress={handleBackFromScenario}>
                    <Ionicons name="arrow-back" size={18} color={colors.gray} />
                    <Text style={[styles.backBtnText, { color: colors.gray }]}>Back to list</Text>
                </TouchableOpacity>
                
                <View style={[styles.scenarioTitleCard, { backgroundColor: colors.card, ...shadows.sm }]}>
                    <Text style={[styles.scenarioActiveTitle, { color: colors.text }]}>{scenario.title}</Text>
                    <Text style={[styles.scenarioActiveDesc, { color: colors.gray }]}>{scenario.description}</Text>
                </View>
                
                {hasSituations && (
                    <View style={[styles.situationCard, { backgroundColor: colors.card, ...shadows.sm }]}>
                        <View style={styles.situationHeader}>
                            <Text style={[styles.situationLabel, { color: colors.primary }]}>Practice Scenario</Text>
                            <Text style={[styles.situationProgress, { color: colors.gray }]}>{currentSituation + 1}/{scenario.situations.length}</Text>
                        </View>
                        <Text style={[styles.situationDialogue, { color: colors.text }]}>"{scenario.situations[currentSituation]?.dialogue}"</Text>
                        
                        {scenario.situations[currentSituation]?.options && (
                            <View style={styles.optionsContainer}>
                                {scenario.situations[currentSituation].options.map((option, index) => (
                                    <TouchableOpacity 
                                        key={index} 
                                        style={[styles.optionBtn, { backgroundColor: colors.card, borderColor: colors.border }]} 
                                        onPress={() => handleOptionSelect(option, index)}
                                        disabled={loadingOption !== null}
                                    >
                                        {loadingOption === index ? (
                                            <ActivityIndicator size="small" color={colors.primary} />
                                        ) : (
                                            <Text style={[styles.optionText, { color: colors.text }]}>{option.text}</Text>
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>
                )}

                {showAITip && (
                    <Animated.View style={[styles.aiResponseCard, { opacity: aiFadeAnim }]}>
                        <View style={styles.aiResponseHeader}>
                            <Ionicons name="sparkles" size={18} color="#FFD700" />
                            <Text style={[styles.aiResponseTitle, { color: colors.text }]}>AI Feedback</Text>
                        </View>
                        <Text style={[styles.aiResponseText, { color: colors.gray }]}>{aiResponse}</Text>
                        {hasSituations && (
                            <TouchableOpacity style={[styles.nextBtn, { backgroundColor: colors.primary }]} onPress={handleNext}>
                                <Text style={styles.nextBtnText}>
                                    {currentSituation < scenario.situations.length - 1 ? 'Next Situation' : 'Complete'}
                                </Text>
                                <Ionicons name="arrow-forward" size={18} color="#fff" />
                            </TouchableOpacity>
                        )}
                    </Animated.View>
                )}

                {hasTechniques && (
                    <View style={styles.contentSection}>
                        <Text style={[styles.sectionSubtitle, { color: colors.text }]}>Techniques</Text>
                        {scenario.techniques.map((tech, i) => (
                            <View key={i} style={[styles.techniqueCard, { backgroundColor: colors.card, ...shadows.sm }]}>
                                <Ionicons name="fitness" size={20} color={colors.primary} />
                                <View style={styles.techniqueInfo}>
                                    <Text style={[styles.techniqueName, { color: colors.text }]}>{tech.name}</Text>
                                    <Text style={[styles.techniqueDesc, { color: colors.gray }]}>{tech.desc}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {hasTips && (
                    <View style={styles.contentSection}>
                        <Text style={[styles.sectionSubtitle, { color: colors.text }]}>Safety Tips</Text>
                        {scenario.tips.map((tip, i) => (
                            <View key={i} style={[styles.tipCard, { backgroundColor: colors.card, ...shadows.sm }]}>
                                <View style={[styles.tipNumber, { backgroundColor: colors.primary + '20' }]}>
                                    <Text style={[styles.tipNumberText, { color: colors.primary }]}>{i + 1}</Text>
                                </View>
                                <Text style={[styles.tipText, { color: colors.text }]}>{tip}</Text>
                            </View>
                        ))}
                    </View>
                )}
                
                {!hasSituations && !hasTechniques && !hasTips && (
                    <Text style={[styles.noContent, { color: colors.gray }]}>Content coming soon...</Text>
                )}

                {!hasSituations && (hasTechniques || hasTips) && (
                    <TouchableOpacity style={[styles.completeBtn, { backgroundColor: colors.primary }]} onPress={() => Alert.alert('Completed!', 'Great job completing this workshop!', [{ text: 'Back', onPress: handleBackFromScenario }])}>
                        <Text style={styles.completeBtnText}>Mark as Complete</Text>
                        <Ionicons name="checkmark" size={18} color="#fff" />
                    </TouchableOpacity>
                )}
            </ScrollView>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.primary }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBackBtn}>
                    <Ionicons name="arrow-back" size={22} color="#fff" />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Ionicons name="school" size={22} color="#fff" />
                    <Text style={styles.headerTitle}>AI Safety Workshops</Text>
                </View>
                <TouchableOpacity style={styles.headerRight}>
                    <Ionicons name="trophy" size={22} color="#fff" />
                </TouchableOpacity>
            </View>
            
            <View style={[styles.progressSummary, { backgroundColor: colors.card, ...shadows.sm }]}>
                <View style={styles.progressStat}>
                    <Text style={[styles.progressNumber, { color: colors.primary }]}>4</Text>
                    <Text style={[styles.progressLabel, { color: colors.gray }]}>Done</Text>
                </View>
                <View style={styles.progressDivider} />
                <View style={styles.progressStat}>
                    <Text style={[styles.progressNumber, { color: colors.primary }]}>21</Text>
                    <Text style={[styles.progressLabel, { color: colors.gray }]}>Total</Text>
                </View>
                <View style={styles.progressDivider} />
                <View style={styles.progressStat}>
                    <Text style={[styles.progressNumber, { color: colors.primary }]}>3h</Text>
                    <Text style={[styles.progressLabel, { color: colors.gray }]}>Saved</Text>
                </View>
            </View>
            
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Choose a Workshop</Text>
            <FlatList 
                data={WORKSHOP_CATEGORIES} 
                renderItem={renderCategory} 
                keyExtractor={(item) => item.id} 
                contentContainerStyle={styles.categoryList} 
                showsVerticalScrollIndicator={false} 
            />
            
            <Modal visible={showModal} animationType="slide" transparent onRequestClose={closeModal}>
                <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                    <View style={[styles.modalContent, { backgroundColor: colors.background }]} key={selectedScenario?.id || 'scenarios'}>
                        <View style={styles.modalHeader}>
                            <TouchableOpacity onPress={closeModal} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color={colors.gray} />
                            </TouchableOpacity>
                            <Text style={[styles.modalTitle, { color: colors.text }]} numberOfLines={1}>
                                {selectedScenario ? selectedScenario.title : (selectedCategory?.title || '')}
                            </Text>
                            <View style={styles.closeBtn} />
                        </View>
                        
                        {selectedScenario ? (
                            renderScenarioContent()
                        ) : (
                            <FlatList 
                                data={getScenarios(selectedCategory?.id)} 
                                renderItem={renderScenario} 
                                keyExtractor={(item) => item.id} 
                                contentContainerStyle={styles.scenarioList} 
                                showsVerticalScrollIndicator={false} 
                                ListEmptyComponent={
                                    <View style={styles.emptyContainer}>
                                        <Ionicons name="folder-open" size={48} color={colors.gray + '50'} />
                                        <Text style={[styles.emptyText, { color: colors.gray }]}>No scenarios available</Text>
                                    </View>
                                } 
                            />
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headerBackBtn: { padding: 6 },
    headerContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    headerTitle: { fontSize: 18, fontWeight: '600', color: '#fff' },
    headerRight: { padding: 6 },
    progressSummary: { flexDirection: 'row', margin: 12, padding: 14, borderRadius: 12, justifyContent: 'space-around' },
    progressStat: { alignItems: 'center' },
    progressNumber: { fontSize: 20, fontWeight: '700' },
    progressLabel: { fontSize: 11, marginTop: 2 },
    progressDivider: { width: 1, backgroundColor: '#E0E0E0' },
    sectionTitle: { fontSize: 16, fontWeight: '600', marginHorizontal: 16, marginBottom: 10 },
    categoryList: { paddingHorizontal: 16, paddingBottom: 20 },
    categoryCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, marginBottom: 10 },
    categoryIcon: { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    categoryInfo: { flex: 1, marginLeft: 12 },
    categoryTitle: { fontSize: 15, fontWeight: '600' },
    categoryDesc: { fontSize: 12, marginTop: 2 },
    progressContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
    progressBar: { flex: 1, height: 4, borderRadius: 2 },
    progressFill: { height: '100%', borderRadius: 2 },
    progressText: { fontSize: 11 },
    modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '90%' },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
    closeBtn: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
    modalTitle: { fontSize: 18, fontWeight: '600', flex: 1, textAlign: 'center' },
    scenarioList: { paddingBottom: 20 },
    scenarioCard: { padding: 14, borderRadius: 12, marginBottom: 10 },
    scenarioHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    scenarioTitle: { fontSize: 15, fontWeight: '600' },
    difficultyBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    difficultyText: { fontSize: 10, fontWeight: '600' },
    scenarioDesc: { fontSize: 12 },
    emptyContainer: { alignItems: 'center', paddingTop: 40 },
    emptyText: { textAlign: 'center', marginTop: 12, fontSize: 14 },
    activeScenario: { flex: 1 },
    backBtnRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
    backBtnText: { fontSize: 14 },
    scenarioTitleCard: { padding: 16, borderRadius: 14, marginBottom: 16 },
    scenarioActiveTitle: { fontSize: 20, fontWeight: '700', marginBottom: 6 },
    scenarioActiveDesc: { fontSize: 14 },
    situationCard: { padding: 16, borderRadius: 14, marginBottom: 16 },
    situationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    situationLabel: { fontSize: 12, fontWeight: '600' },
    situationProgress: { fontSize: 12 },
    situationDialogue: { fontSize: 15, fontStyle: 'italic', lineHeight: 24, marginBottom: 16 },
    optionsContainer: { gap: 8 },
    optionBtn: { padding: 14, borderRadius: 12, borderWidth: 1, alignItems: 'center', minHeight: 48, justifyContent: 'center' },
    optionText: { fontSize: 14 },
    aiResponseCard: { backgroundColor: '#FFF9C4', padding: 16, borderRadius: 14, marginBottom: 16 },
    aiResponseHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    aiResponseTitle: { fontSize: 14, fontWeight: '600' },
    aiResponseText: { fontSize: 14, lineHeight: 20, marginBottom: 12 },
    nextBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 12, gap: 8 },
    nextBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
    contentSection: { marginBottom: 20 },
    sectionSubtitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
    techniqueCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, marginBottom: 8, gap: 12 },
    techniqueInfo: { flex: 1 },
    techniqueName: { fontSize: 14, fontWeight: '600' },
    techniqueDesc: { fontSize: 12, marginTop: 2 },
    tipCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, marginBottom: 8, gap: 12 },
    tipNumber: { width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
    tipNumberText: { fontSize: 12, fontWeight: '600' },
    tipText: { flex: 1, fontSize: 14 },
    noContent: { textAlign: 'center', marginTop: 40, fontSize: 14 },
    completeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 12, marginTop: 20, gap: 8 },
    completeBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});

export default AISafetyWorkshopScreen;
