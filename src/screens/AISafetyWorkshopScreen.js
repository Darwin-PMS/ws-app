// AI Safety Workshop Screen
// Interactive workshops teaching harassment awareness and safety protocols
// through AI-powered role-playing scenarios

import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Animated,
    Dimensions,
    Alert,
    Modal,
    FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import groqApi from '../services/groqApi';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Workshop Categories
const WORKSHOP_CATEGORIES = [
    {
        id: 'harassment',
        title: 'Harassment Awareness',
        icon: 'shield-checkmark',
        color: '#E91E63',
        description: 'Learn to identify and respond to harassment situations',
        scenarios: 5,
    },
    {
        id: 'self-defense',
        title: 'Self-Defense Basics',
        icon: 'fitness',
        color: '#FF5722',
        description: 'Interactive self-defense technique training',
        scenarios: 4,
    },
    {
        id: 'digital_safety',
        title: 'Digital Safety',
        icon: 'phone-portrait',
        color: '#9C27B0',
        description: 'Online safety and privacy protection',
        scenarios: 4,
    },
    {
        id: 'workplace',
        title: 'Workplace Safety',
        icon: 'business',
        color: '#2196F3',
        description: 'Workplace harassment prevention and response',
        scenarios: 4,
    },
    {
        id: 'public',
        title: 'Public Safety',
        icon: 'people',
        color: '#4CAF50',
        description: 'Safety in public spaces and transportation',
        scenarios: 4,
    },
];

// Sample Scenarios for each category
const SCENARIOS = {
    harassment: [
        {
            id: 'h1',
            title: 'Street Harassment Response',
            description: 'Practice responding to unwanted comments on the street',
            difficulty: 'Beginner',
            situations: [
                {
                    role: 'aggressor',
                    dialogue: 'Hey beautiful, why are you in such a hurry? Stop and talk to me!',
                    options: [
                        { text: 'Ignore and walk faster', response: 'This is a common strategy. Ignoring can sometimes escalate situations.', score: 3 },
                        { text: 'Firmly say "Leave me alone"', response: 'A clear, firm boundary is effective. Practice maintaining eye contact.', score: 5 },
                        { text: 'Start recording them', response: 'Documentation can deter harassment but may escalate the situation.', score: 4 },
                    ],
                },
            ],
        },
        {
            id: 'h2',
            title: 'Workplace Harassment',
            description: 'Handle inappropriate comments from a colleague',
            difficulty: 'Intermediate',
            situations: [],
        },
        {
            id: 'h3',
            title: 'Public Transport Harassment',
            description: 'Deal with inappropriate behavior on public transit',
            difficulty: 'Intermediate',
            situations: [],
        },
        {
            id: 'h4',
            title: 'Online Harassment',
            description: 'Respond to harassing messages on social media',
            difficulty: 'Beginner',
            situations: [],
        },
        {
            id: 'h5',
            title: 'Verbal Confrontation De-escalation',
            description: 'De-escalate an aggressive confrontation',
            difficulty: 'Advanced',
            situations: [],
        },
    ],
    self_defense: [
        {
            id: 'sd1',
            title: 'Basic Escape Techniques',
            description: 'Learn to break free from grabs',
            difficulty: 'Beginner',
            techniques: [
                { name: 'Wrist Escape', description: 'Rotate your wrist inward and pull away firmly' },
                { name: 'Arm Break', description: 'Use your body weight to bend their arm upward' },
            ],
        },
        {
            id: 'sd2',
            title: 'Voice Power',
            description: 'Use your voice effectively for self-defense',
            difficulty: 'Beginner',
            techniques: [
                { name: 'Scream Technique', description: 'Short, sharp screams: "HELP!" "BACK OFF!"' },
                { name: 'Command Voice', description: 'Use a low, authoritative tone to demand space' },
            ],
        },
        {
            id: 'sd3',
            title: 'Pressure Points',
            description: 'Learn vulnerable points on the body',
            difficulty: 'Intermediate',
            techniques: [
                { name: 'Eyes', description: 'Palm strike to eyes causes temporary blindness' },
                { name: 'Throat', description: 'Palm or finger strike to throat' },
                { name: 'Groin', description: 'Knee strike or palm strike' },
            ],
        },
        {
            id: 'sd4',
            title: 'Running Safety',
            description: 'Safe running and escape techniques',
            difficulty: 'Beginner',
            techniques: [
                { name: 'Zigzag Running', description: 'Change direction unpredictably' },
                { name: 'Make Noise', description: 'Scream while running to attract attention' },
            ],
        },
    ],
    digital_safety: [
        {
            id: 'ds1',
            title: 'Social Media Privacy',
            description: 'Secure your social media accounts',
            difficulty: 'Beginner',
            tips: [
                'Enable two-factor authentication',
                'Review privacy settings regularly',
                'Limit location sharing',
                'Be cautious with friend requests',
            ],
        },
        {
            id: 'ds2',
            title: 'Safe Online Dating',
            description: 'Protect yourself when dating online',
            difficulty: 'Intermediate',
            tips: [
                'Use separate phone number for dating apps',
                'Meet in public places first',
                'Tell someone about your plans',
                'Verify person identity before meeting',
            ],
        },
        {
            id: 'ds3',
            title: 'Password Security',
            description: 'Create and manage secure passwords',
            difficulty: 'Beginner',
            tips: [
                'Use unique passwords for each account',
                'Use a password manager',
                'Enable biometric login when available',
                'Never share passwords via text/email',
            ],
        },
        {
            id: 'ds4',
            title: 'Device Security',
            description: 'Protect your physical devices',
            difficulty: 'Intermediate',
            tips: [
                'Set up remote wipe capability',
                'Use screen lock always',
                'Encrypt sensitive data',
                'Be cautious with public WiFi',
            ],
        },
    ],
    workplace: [
        {
            id: 'w1',
            title: 'Identifying Workplace Harassment',
            description: 'Recognize different forms of harassment',
            difficulty: 'Beginner',
            signs: [
                'Unwanted physical contact',
                'Inappropriate jokes or comments',
                'Professional opportunities withheld',
                'Creating a hostile work environment',
            ],
        },
        {
            id: 'w2',
            title: 'Reporting Procedures',
            description: 'How to properly report incidents',
            difficulty: 'Intermediate',
            steps: [
                'Document everything with dates',
                'Report to HR in writing',
                'Know your company policies',
                'Seek external resources if needed',
            ],
        },
        {
            id: 'w3',
            title: 'Building Workplace Support',
            description: 'Create a support network at work',
            difficulty: 'Beginner',
            strategies: [
                'Build relationships with allies',
                'Know your rights',
                'Keep records of support',
                'Access employee assistance programs',
            ],
        },
        {
            id: 'w4',
            title: 'Legal Protections',
            description: 'Understand your legal rights',
            difficulty: 'Advanced',
            protections: [
                'Title VII protections',
                'State-specific laws',
                'File with EEOC',
                'Consult an attorney',
            ],
        },
    ],
    public: [
        {
            id: 'p1',
            title: 'Safe Walking',
            description: 'Stay safe while walking alone',
            difficulty: 'Beginner',
            tips: [
                'Walk with confidence',
                'Stay in well-lit areas',
                'Know your route',
                'Trust your instincts',
            ],
        },
        {
            id: 'p2',
            title: 'Ride Share Safety',
            description: 'Use ride shares safely',
            difficulty: 'Beginner',
            tips: [
                'Verify the license plate',
                'Sit in the back seat',
                'Share trip with friend',
                'Trust your instincts',
            ],
        },
        {
            id: 'p3',
            title: 'Emergency Response',
            description: 'Know what to do in emergencies',
            difficulty: 'Intermediate',
            steps: [
                'Call emergency services',
                'Know your location',
                'Find a safe place',
                'Get help from bystanders',
            ],
        },
        {
            id: 'p4',
            title: 'Self-Defense Products',
            description: 'Legal self-defense options',
            difficulty: 'Beginner',
            products: [
                'Personal alarm',
                'Whistle',
                'Pepper spray (where legal)',
                'Legal weapons by state',
            ],
        },
    ],
};

const AISafetyWorkshopScreen = ({ navigation }) => {
    const { colors, spacing, borderRadius, shadows } = useTheme();
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedScenario, setSelectedScenario] = useState(null);
    const [currentSituation, setCurrentSituation] = useState(0);
    const [showScenarioModal, setShowScenarioModal] = useState(false);
    const [userResponse, setUserResponse] = useState('');
    const [aiResponse, setAiResponse] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [workshopProgress, setWorkshopProgress] = useState({});
    const [showAITip, setShowAITip] = useState(false);

    // Animation refs
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    useEffect(() => {
        loadWorkshopProgress();
    }, []);

    useEffect(() => {
        if (showScenarioModal) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            fadeAnim.setValue(0);
            slideAnim.setValue(50);
        }
    }, [showScenarioModal]);

    const loadWorkshopProgress = async () => {
        // Load progress from storage
        setWorkshopProgress({
            harassment: { completed: 2, total: 5 },
            self_defense: { completed: 1, total: 4 },
            digital_safety: { completed: 0, total: 4 },
            workplace: { completed: 0, total: 4 },
            public: { completed: 1, total: 4 },
        });
    };

    const handleCategorySelect = (category) => {
        setSelectedCategory(category);
        setShowScenarioModal(true);
    };

    const getScenariosForCategory = (categoryId) => {
        return SCENARIOS[categoryId] || [];
    };

    const handleScenarioSelect = (scenario) => {
        setSelectedScenario(scenario);
        setCurrentSituation(0);
    };

    const handleOptionSelect = async (option) => {
        setIsLoading(true);

        // Get AI response based on user's choice
        try {
            const prompt = `You are a safety training AI assistant. A user is practicing a harassment awareness scenario. 
            
Scenario: ${selectedScenario?.title}
User chose: ${option.text}
Expected response from trainer: ${option.response}

Provide a brief, encouraging feedback message (2-3 sentences) to help the user learn.`;

            const response = await groqApi.generateResponse(prompt);
            setAiResponse(response || option.response);
        } catch (error) {
            // Fallback to predefined response
            setAiResponse(option.response);
        }

        setIsLoading(false);
        setShowAITip(true);
    };

    const handleNextSituation = () => {
        if (selectedScenario?.situations && currentSituation < selectedScenario.situations.length - 1) {
            setCurrentSituation(currentSituation + 1);
            setShowAITip(false);
            setAiResponse('');
        } else {
            // Workshop completed
            Alert.alert(
                'Workshop Completed! 🎉',
                'Great job completing this safety training scenario!',
                [
                    {
                        text: 'Back to Categories',
                        onPress: () => {
                            setShowScenarioModal(false);
                            setSelectedScenario(null);
                            setShowAITip(false);
                        },
                    },
                ]
            );
        }
    };

    const renderCategoryCard = ({ item }) => (
        <TouchableOpacity
            style={[styles.categoryCard, { backgroundColor: colors.card, ...shadows.small }]}
            onPress={() => handleCategorySelect(item)}
        >
            <View style={[styles.categoryIcon, { backgroundColor: item.color + '20' }]}>
                <Ionicons name={item.icon} size={32} color={item.color} />
            </View>
            <View style={styles.categoryInfo}>
                <Text style={[styles.categoryTitle, { color: colors.text }]}>{item.title}</Text>
                <Text style={[styles.categoryDesc, { color: colors.gray }]} numberOfLines={2}>
                    {item.description}
                </Text>
                <View style={styles.progressContainer}>
                    <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                        <View
                            style={[
                                styles.progressFill,
                                {
                                    backgroundColor: item.color,
                                    width: `${((workshopProgress[item.id]?.completed || 0) / item.scenarios) * 100}%`
                                }
                            ]}
                        />
                    </View>
                    <Text style={[styles.progressText, { color: colors.gray }]}>
                        {workshopProgress[item.id]?.completed || 0}/{item.scenarios}
                    </Text>
                </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.gray} />
        </TouchableOpacity>
    );

    const renderScenarioCard = ({ item }) => (
        <TouchableOpacity
            style={[styles.scenarioCard, { backgroundColor: colors.card, ...shadows.small }]}
            onPress={() => handleScenarioSelect(item)}
        >
            <View style={styles.scenarioHeader}>
                <Text style={[styles.scenarioTitle, { color: colors.text }]}>{item.title}</Text>
                <View style={[styles.difficultyBadge, {
                    backgroundColor: item.difficulty === 'Beginner' ? '#4CAF50' + '20' :
                        item.difficulty === 'Intermediate' ? '#FF9800' + '20' : '#F44336' + '20'
                }]}>
                    <Text style={[styles.difficultyText, {
                        color: item.difficulty === 'Beginner' ? '#4CAF50' :
                            item.difficulty === 'Intermediate' ? '#FF9800' : '#F44336'
                    }]}>{item.difficulty}</Text>
                </View>
            </View>
            <Text style={[styles.scenarioDesc, { color: colors.gray }]}>{item.description}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.primary }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Ionicons name="school" size={28} color="#fff" />
                    <Text style={styles.headerTitle}>AI Safety Workshops</Text>
                </View>
                <View style={styles.headerRight}>
                    <Ionicons name="trophy" size={24} color="#fff" />
                </View>
            </View>

            {/* Progress Summary */}
            <View style={[styles.progressSummary, { backgroundColor: colors.card, ...shadows.small }]}>
                <View style={styles.progressStat}>
                    <Text style={[styles.progressNumber, { color: colors.primary }]}>4</Text>
                    <Text style={[styles.progressLabel, { color: colors.gray }]}>Completed</Text>
                </View>
                <View style={styles.progressDivider} />
                <View style={styles.progressStat}>
                    <Text style={[styles.progressNumber, { color: colors.primary }]}>21</Text>
                    <Text style={[styles.progressLabel, { color: colors.gray }]}>Total</Text>
                </View>
                <View style={styles.progressDivider} />
                <View style={styles.progressStat}>
                    <Text style={[styles.progressNumber, { color: colors.primary }]}>3</Text>
                    <Text style={[styles.progressLabel, { color: colors.gray }]}>Hours</Text>
                </View>
            </View>

            {/* Workshop Categories */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Choose a Workshop</Text>

            <FlatList
                data={WORKSHOP_CATEGORIES}
                renderItem={renderCategoryCard}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.categoryList}
                showsVerticalScrollIndicator={false}
            />

            {/* Scenario Selection Modal */}
            <Modal visible={showScenarioModal} animationType="slide" transparent>
                <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                    <View style={[styles.modalContent, { backgroundColor: colors.background, ...shadows.large }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>
                                {selectedCategory?.title}
                            </Text>
                            <TouchableOpacity onPress={() => setShowScenarioModal(false)}>
                                <Ionicons name="close" size={24} color={colors.gray} />
                            </TouchableOpacity>
                        </View>

                        {!selectedScenario ? (
                            <FlatList
                                data={getScenariosForCategory(selectedCategory?.id)}
                                renderItem={renderScenarioCard}
                                keyExtractor={(item) => item.id}
                                contentContainerStyle={styles.scenarioList}
                            />
                        ) : (
                            // Active Scenario View
                            <ScrollView style={styles.activeScenario}>
                                <Text style={[styles.scenarioActiveTitle, { color: colors.text }]}>
                                    {selectedScenario.title}
                                </Text>
                                <Text style={[styles.scenarioActiveDesc, { color: colors.gray }]}>
                                    {selectedScenario.description}
                                </Text>

                                {selectedScenario.situations?.length > 0 && (
                                    <View style={[styles.situationCard, { backgroundColor: colors.card, ...shadows.small }]}>
                                        <Text style={[styles.situationLabel, { color: colors.primary }]}>
                                            Situation {currentSituation + 1}
                                        </Text>
                                        <Text style={[styles.situationDialogue, { color: colors.text }]}>
                                            {selectedScenario.situations[currentSituation]?.role === 'aggressor'
                                                ? selectedScenario.situations[currentSituation]?.dialogue
                                                : 'Practice your response'}
                                        </Text>

                                        {/* Response Options */}
                                        {selectedScenario.situations[currentSituation]?.options && (
                                            <View style={styles.optionsContainer}>
                                                {selectedScenario.situations[currentSituation].options.map((option, index) => (
                                                    <TouchableOpacity
                                                        key={index}
                                                        style={[styles.optionBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                                                        onPress={() => handleOptionSelect(option)}
                                                        disabled={isLoading}
                                                    >
                                                        <Text style={[styles.optionText, { color: colors.text }]}>{option.text}</Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        )}
                                    </View>
                                )}

                                {/* AI Response */}
                                {showAITip && (
                                    <Animated.View style={[styles.aiResponseCard, { opacity: fadeAnim }]}>
                                        <View style={styles.aiResponseHeader}>
                                            <Ionicons name="sparkles" size={20} color="#FFD700" />
                                            <Text style={[styles.aiResponseTitle, { color: colors.text }]}>
                                                AI Feedback
                                            </Text>
                                        </View>
                                        <Text style={[styles.aiResponseText, { color: colors.gray }]}>
                                            {aiResponse}
                                        </Text>
                                        <TouchableOpacity
                                            style={[styles.nextBtn, { backgroundColor: colors.primary }]}
                                            onPress={handleNextSituation}
                                        >
                                            <Text style={styles.nextBtnText}>Continue</Text>
                                            <Ionicons name="arrow-forward" size={20} color="#fff" />
                                        </TouchableOpacity>
                                    </Animated.View>
                                )}

                                {/* Tips & Techniques */}
                                {selectedScenario.techniques && (
                                    <View style={styles.techniquesContainer}>
                                        <Text style={[styles.sectionSubtitle, { color: colors.text }]}>
                                            Techniques to Practice
                                        </Text>
                                        {selectedScenario.techniques.map((technique, index) => (
                                            <View key={index} style={[styles.techniqueCard, { backgroundColor: colors.card, ...shadows.small }]}>
                                                <Ionicons name="fitness" size={24} color={colors.primary} />
                                                <View style={styles.techniqueInfo}>
                                                    <Text style={[styles.techniqueName, { color: colors.text }]}>
                                                        {technique.name}
                                                    </Text>
                                                    <Text style={[styles.techniqueDesc, { color: colors.gray }]}>
                                                        {technique.description}
                                                    </Text>
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                )}

                                {/* Safety Tips */}
                                {selectedScenario.tips && (
                                    <View style={styles.tipsContainer}>
                                        <Text style={[styles.sectionSubtitle, { color: colors.text }]}>
                                            Safety Tips
                                        </Text>
                                        {selectedScenario.tips.map((tip, index) => (
                                            <View key={index} style={[styles.tipCard, { backgroundColor: colors.card, ...shadows.small }]}>
                                                <View style={[styles.tipNumber, { backgroundColor: colors.primary + '20' }]}>
                                                    <Text style={[styles.tipNumberText, { color: colors.primary }]}>
                                                        {index + 1}
                                                    </Text>
                                                </View>
                                                <Text style={[styles.tipText, { color: colors.text }]}>{tip}</Text>
                                            </View>
                                        ))}
                                    </View>
                                )}

                                <TouchableOpacity
                                    style={[styles.backCategoryBtn, { borderColor: colors.border }]}
                                    onPress={() => setSelectedScenario(null)}
                                >
                                    <Ionicons name="arrow-back" size={20} color={colors.gray} />
                                    <Text style={[styles.backCategoryText, { color: colors.gray }]}>
                                        Back to Scenarios
                                    </Text>
                                </TouchableOpacity>
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backBtn: {
        padding: 8,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#fff',
    },
    headerRight: {
        padding: 8,
    },
    progressSummary: {
        flexDirection: 'row',
        margin: 16,
        padding: 16,
        borderRadius: 16,
        justifyContent: 'space-around',
    },
    progressStat: {
        alignItems: 'center',
    },
    progressNumber: {
        fontSize: 24,
        fontWeight: '700',
    },
    progressLabel: {
        fontSize: 12,
        marginTop: 4,
    },
    progressDivider: {
        width: 1,
        backgroundColor: '#E0E0E0',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginHorizontal: 16,
        marginBottom: 12,
    },
    categoryList: {
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    categoryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
    },
    categoryIcon: {
        width: 60,
        height: 60,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    categoryInfo: {
        flex: 1,
        marginLeft: 12,
    },
    categoryTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    categoryDesc: {
        fontSize: 12,
        marginTop: 4,
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        gap: 8,
    },
    progressBar: {
        flex: 1,
        height: 4,
        borderRadius: 2,
    },
    progressFill: {
        height: '100%',
        borderRadius: 2,
    },
    progressText: {
        fontSize: 12,
    },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '600',
    },
    scenarioList: {
        paddingBottom: 20,
    },
    scenarioCard: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    scenarioHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    scenarioTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    difficultyBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    difficultyText: {
        fontSize: 10,
        fontWeight: '600',
    },
    scenarioDesc: {
        fontSize: 12,
    },

    // Active Scenario
    activeScenario: {
        flex: 1,
    },
    scenarioActiveTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 8,
    },
    scenarioActiveDesc: {
        fontSize: 14,
        marginBottom: 20,
    },
    situationCard: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    situationLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 8,
    },
    situationDialogue: {
        fontSize: 16,
        fontStyle: 'italic',
        lineHeight: 24,
    },
    optionsContainer: {
        marginTop: 16,
        gap: 8,
    },
    optionBtn: {
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
    },
    optionText: {
        fontSize: 14,
    },
    aiResponseCard: {
        backgroundColor: '#FFF9C4',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    aiResponseHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    aiResponseTitle: {
        fontSize: 14,
        fontWeight: '600',
    },
    aiResponseText: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 12,
    },
    nextBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 12,
        gap: 8,
    },
    nextBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    techniquesContainer: {
        marginBottom: 20,
    },
    sectionSubtitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    techniqueCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
        gap: 12,
    },
    techniqueInfo: {
        flex: 1,
    },
    techniqueName: {
        fontSize: 14,
        fontWeight: '600',
    },
    techniqueDesc: {
        fontSize: 12,
        marginTop: 2,
    },
    tipsContainer: {
        marginBottom: 20,
    },
    tipCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
        gap: 12,
    },
    tipNumber: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tipNumberText: {
        fontSize: 12,
        fontWeight: '600',
    },
    tipText: {
        flex: 1,
        fontSize: 14,
    },
    backCategoryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        gap: 8,
        marginBottom: 20,
    },
    backCategoryText: {
        fontSize: 14,
    },
});

export default AISafetyWorkshopScreen;
