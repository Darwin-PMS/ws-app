import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal, FlatList, Animated, ActivityIndicator, Dimensions, TextInput, RefreshControl, Vibration } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import groqApi from '../services/groqApi';
import settingsService from '../services/settingsService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const STORAGE_KEYS = {
    USER_AGE: '@workshop_user_age',
    COMPLETED_SCENARIOS: '@workshop_completed',
    LEARNING_PATH: '@workshop_learning_path',
    AI_PERSONALIZATION: '@workshop_ai_personalization',
};

const AGE_GROUPS = {
    TEEN: { min: 13, max: 19, label: 'Teen (13-19)', icon: 'school', recommendedCategories: ['harassment', 'digital_safety', 'public'] },
    YOUNG_ADULT: { min: 20, max: 29, label: 'Young Adult (20-29)', icon: 'briefcase', recommendedCategories: ['workplace', 'digital_safety', 'dating_safety', 'harassment'] },
    ADULT: { min: 30, max: 49, label: 'Adult (30-49)', icon: 'business', recommendedCategories: ['workplace', 'digital_safety', 'family_safety'] },
    MIDDLE: { min: 50, max: 64, label: 'Middle Age (50-64)', icon: 'heart', recommendedCategories: ['digital_safety', 'public', 'health_safety'] },
    SENIOR: { min: 65, max: 120, label: 'Senior (65+)', icon: 'medkit', recommendedCategories: ['digital_safety', 'health_safety', 'public', 'scam_awareness'] },
};

const WORKSHOP_CATEGORIES = [
    { id: 'harassment', title: 'Harassment Awareness', icon: 'shield-checkmark', color: '#E91E63', description: 'Identify and respond to harassment situations', scenarios: 5, ageGroups: ['TEEN', 'YOUNG_ADULT', 'ADULT'] },
    { id: 'self-defense', title: 'Self-Defense Training', icon: 'fitness', color: '#FF5722', description: 'Interactive physical safety training', scenarios: 4, ageGroups: ['TEEN', 'YOUNG_ADULT', 'ADULT', 'MIDDLE', 'SENIOR'] },
    { id: 'digital_safety', title: 'Digital Safety', icon: 'phone-portrait', color: '#9C27B0', description: 'Online privacy & security', scenarios: 5, ageGroups: ['TEEN', 'YOUNG_ADULT', 'ADULT', 'MIDDLE', 'SENIOR'] },
    { id: 'workplace', title: 'Workplace Safety', icon: 'business', color: '#2196F3', description: 'Workplace harassment prevention', scenarios: 4, ageGroups: ['YOUNG_ADULT', 'ADULT', 'MIDDLE'] },
    { id: 'public', title: 'Public Safety', icon: 'people', color: '#4CAF50', description: 'Safety in public spaces', scenarios: 4, ageGroups: ['TEEN', 'YOUNG_ADULT', 'ADULT', 'MIDDLE', 'SENIOR'] },
    { id: 'dating_safety', title: 'Dating Safety', icon: 'heart-half', color: '#FF4081', description: 'Safe dating practices', scenarios: 4, ageGroups: ['TEEN', 'YOUNG_ADULT'] },
    { id: 'scam_awareness', title: 'Scam Awareness', icon: 'warning', color: '#FF9800', description: 'Recognize and avoid scams', scenarios: 4, ageGroups: ['MIDDLE', 'SENIOR'] },
    { id: 'family_safety', title: 'Family Safety', icon: 'home', color: '#00BCD4', description: 'Protecting your family', scenarios: 4, ageGroups: ['ADULT', 'MIDDLE'] },
];

const SCENARIOS = {
    harassment: [
        { id: 'h1', title: 'Street Harassment', description: 'Respond to unwanted comments on the street', difficulty: 'Beginner', situations: [{ dialogue: 'Hey beautiful, why are you in such a hurry? Stop and talk to me!', options: [{ text: 'Ignore and walk faster', response: 'Ignoring can work but may escalate. Consider being more assertive.' }, { text: 'Firmly say "Leave me alone"', response: 'A clear, firm boundary is effective. Maintain eye contact.' }, { text: 'Start recording them', response: 'Documentation can deter harassment but may escalate.' }] }] },
        { id: 'h2', title: 'Workplace Harassment', description: 'Handle inappropriate comments at work', difficulty: 'Intermediate', situations: [{ dialogue: 'Hey, you look great in that outfit!', options: [{ text: 'Thank you and walk away', response: 'Politely acknowledging but not engaging is a good approach.' }, { text: 'This is inappropriate', response: 'Being direct is effective. Document the incident.' }, { text: 'Ignore and continue', response: 'Ignoring may not address the underlying issue.' }] }] },
        { id: 'h3', title: 'Public Transport', description: 'Deal with inappropriate behavior on transit', difficulty: 'Intermediate', situations: [{ dialogue: 'Move closer to me, there is no space', options: [{ text: 'Move to another seat', response: 'Creating distance is a smart safety choice.' }, { text: 'Say "Please give me space"', response: 'Using polite but firm language works well.' }, { text: 'Take out phone to record', response: 'Documentation can provide evidence if needed.' }] }] },
        { id: 'h4', title: 'Online Harassment', description: 'Respond to harassing messages', difficulty: 'Beginner', situations: [{ dialogue: 'You receive inappropriate messages online', options: [{ text: 'Block and report', response: 'Blocking is the first step to protect yourself.' }, { text: 'Reply with harsh words', response: 'Engaging may escalate the situation.' }, { text: 'Save evidence', response: 'Saving evidence is important for reporting.' }] }] },
        { id: 'h5', title: 'Verbal De-escalation', description: 'De-escalate confrontation safely', difficulty: 'Advanced', situations: [{ dialogue: 'Why are you looking at me? Fight me!', options: [{ text: 'Stay calm and walk away', response: 'De-escalation through ignoring works in many cases.' }, { text: 'Call for help', response: 'Getting attention from others can deter aggression.' }, { text: 'Find a safe exit', response: 'Having an exit plan is always wise.' }] }] },
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
        { id: 'ds5', title: 'Phishing Awareness', description: 'Identify phishing attempts', difficulty: 'Beginner', tips: ['Check sender email carefully', 'Never click suspicious links', 'Verify requests through official channels', 'Be wary of urgent requests', 'When in doubt, contact IT or the company directly'] },
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
    dating_safety: [
        { id: 'dt1', title: 'First Date Safety', description: 'Stay safe on first dates', difficulty: 'Beginner', tips: ['Meet in public places', 'Tell a friend your plans', 'Keep your phone charged', 'Watch your drink at all times', 'Trust your instincts'] },
        { id: 'dt2', title: 'Online to Offline', description: 'Transitioning safely', difficulty: 'Intermediate', tips: ['Video chat first', 'Verify their identity', 'Search for red flags', 'Keep personal info private', 'Set clear boundaries'] },
        { id: 'dt3', title: 'Recognizing Red Flags', description: 'Identify warning signs', difficulty: 'Beginner', tips: ['Controlling behavior', 'Isolation attempts', 'Gaslighting', 'Jealousy and accusations', 'Physical aggression threats'] },
        { id: 'dt4', title: 'Safe Exit Planning', description: 'How to leave safely', difficulty: 'Advanced', tips: ['Have a support system', 'Keep important documents', 'Plan financially', 'Know resources available', 'Prioritize your safety'] },
    ],
    scam_awareness: [
        { id: 'sc1', title: 'Phone Scams', description: 'Identify phone scams', difficulty: 'Beginner', tips: ['Never give personal info to callers', 'Hang up on suspicious calls', 'Government won\'t demand payment', 'When in doubt, call the organization directly', 'Don\'t trust caller ID'] },
        { id: 'sc2', title: 'Email Scams', description: 'Recognize phishing emails', difficulty: 'Beginner', tips: ['Check the sender address carefully', 'Hover over links before clicking', 'Look for grammatical errors', 'Don\'t download unexpected attachments', 'Verify requests through official channels'] },
        { id: 'sc3', title: 'Tech Support Scams', description: 'Avoid fake tech support', difficulty: 'Intermediate', tips: ['Microsoft/Apple won\'t call you', 'Never give remote access', 'Hang up on cold calls', 'Search for known scam patterns', 'Ask a trusted person'] },
        { id: 'sc4', title: 'Financial Scams', description: 'Protect your money', difficulty: 'Intermediate', tips: ['Too good to be true = scam', 'Never wire money to strangers', 'Verify before investing', 'Protect your Social Security number', 'Monitor your accounts regularly'] },
    ],
    family_safety: [
        { id: 'f1', title: 'Home Security', description: 'Secure your home', difficulty: 'Beginner', tips: ['Install quality locks', 'Use outdoor lighting', 'Keep landscaping trimmed', 'Don\'t hide spare keys', 'Use a security system'] },
        { id: 'f2', title: 'Child Safety Online', description: 'Protect children online', difficulty: 'Intermediate', tips: ['Monitor online activity', 'Set parental controls', 'Teach about privacy', 'Know their friends online', 'Open communication'] },
        { id: 'f3', title: 'Emergency Planning', description: 'Family emergency plans', difficulty: 'Beginner', tips: ['Create a family meeting point', 'Have emergency contacts', 'Prepare emergency kits', 'Practice evacuation plans', 'Keep important documents secure'] },
        { id: 'f4', title: 'Elder Safety', description: 'Protect elderly family members', difficulty: 'Intermediate', tips: ['Regular check-ins', 'Review financial accounts', 'Watch for exploitation signs', 'Keep medications organized', 'Home safety modifications'] },
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
    const [showAgeModal, setShowAgeModal] = useState(false);
    const [userAge, setUserAge] = useState(null);
    const [ageGroup, setAgeGroup] = useState(null);
    const [completedScenarios, setCompletedScenarios] = useState({});
    const [refreshing, setRefreshing] = useState(false);
    const [aiTipOfDay, setAiTipOfDay] = useState('');
    const [loadingTip, setLoadingTip] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredCategories, setFilteredCategories] = useState(WORKSHOP_CATEGORIES);
    const [streak, setStreak] = useState(0);
    const [showCustomScenario, setShowCustomScenario] = useState(false);
    const [customScenarioInput, setCustomScenarioInput] = useState('');
    const [generatedScenario, setGeneratedScenario] = useState(null);
    const [generatingScenario, setGeneratingScenario] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const aiFadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(100)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;

    useEffect(() => { 
        loadUserData();
    }, []);

    useEffect(() => {
        if (userAge) {
            const group = Object.entries(AGE_GROUPS).find(([_, g]) => userAge >= g.min && userAge <= g.max);
            if (group) setAgeGroup(group[1]);
        }
    }, [userAge]);

    useEffect(() => {
        if (searchQuery) {
            const filtered = WORKSHOP_CATEGORIES.filter(cat => 
                cat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                cat.description.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredCategories(filtered);
        } else {
            setFilteredCategories(WORKSHOP_CATEGORIES);
        }
    }, [searchQuery]);

    useEffect(() => { 
        if (showModal) { 
            Animated.parallel([
                Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
                Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, friction: 8 })
            ]).start(); 
        } else { 
            fadeAnim.setValue(0); 
            slideAnim.setValue(100);
        } 
    }, [showModal]);

    useEffect(() => { 
        if (showAITip) { 
            Animated.timing(aiFadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start(); 
        } else { 
            aiFadeAnim.setValue(0); 
        } 
    }, [showAITip]);

    const loadUserData = async () => {
        try {
            const [age, completed, tip] = await Promise.all([
                AsyncStorage.getItem(STORAGE_KEYS.USER_AGE),
                AsyncStorage.getItem(STORAGE_KEYS.COMPLETED_SCENARIOS),
                AsyncStorage.getItem('@workshop_ai_tip'),
            ]);
            
            if (age) setUserAge(parseInt(age));
            if (completed) setCompletedScenarios(JSON.parse(completed));
            
            const today = new Date().toDateString();
            const savedTipDate = await AsyncStorage.getItem('@workshop_tip_date');
            
            if (savedTipDate !== today) {
                fetchAITipOfDay();
                await AsyncStorage.setItem('@workshop_tip_date', today);
            } else if (tip) {
                setAiTipOfDay(tip);
            }

            const savedStreak = await AsyncStorage.getItem('@workshop_streak');
            if (savedStreak) setStreak(parseInt(savedStreak));
        } catch (e) {
            console.error('Error loading user data:', e);
        }
    };

    const fetchAITipOfDay = async () => {
        setLoadingTip(true);
        try {
            const apiKey = await settingsService.getGroqApiKey();
            if (!apiKey) {
                setLoadingTip(false);
                return;
            }
            
            const prompt = `Generate a unique, practical safety tip for today. Format: "💡 [Your tip]" - Keep it under 20 words. Focus on personal safety, digital safety, or self-defense. Make it actionable and specific.`;
            const response = await groqApi.generateResponse(prompt, apiKey);
            
            if (response) {
                setAiTipOfDay(response);
                await AsyncStorage.setItem('@workshop_ai_tip', response);
            }
        } catch (e) {
            console.error('Error fetching AI tip:', e);
        }
        setLoadingTip(false);
    };

    const saveUserAge = async (age) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.USER_AGE, age.toString());
            setUserAge(age);
            setShowAgeModal(false);
            
            const group = Object.entries(AGE_GROUPS).find(([_, g]) => age >= g.min && age <= g.max);
            if (group) {
                setAgeGroup(group[1]);
                Alert.alert('Personalized Experience', `We've customized workshops for ${group[1].label}s. Enjoy your tailored safety training!`);
            }
        } catch (e) {
            console.error('Error saving age:', e);
        }
    };

    const getProgressPercent = (completed, total) => {
        if (!total || total === 0) return 0;
        return (completed / total) * 100;
    };

    const getTotalProgress = () => {
        const completed = Object.values(completedScenarios).flat().length;
        const total = WORKSHOP_CATEGORIES.reduce((sum, cat) => sum + cat.scenarios, 0);
        return { completed, total, percent: getProgressPercent(completed, total) };
    };

    const getRecommendedCategories = () => {
        if (!ageGroup) return WORKSHOP_CATEGORIES;
        return WORKSHOP_CATEGORIES.filter(cat => cat.ageGroups.includes(ageGroup.label.split(' ')[0]));
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
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
    };
    
    const handleOptionSelect = async (option, index) => { 
        setLoadingOption(index);
        const fallbackResponse = option.response;
        
        try { 
            const apiKey = await settingsService.getGroqApiKey();
            
            const personalizationContext = ageGroup ? `User age group: ${ageGroup.label}. ` : '';
            const prompt = `Safety training feedback. ${personalizationContext}Scenario: "${selectedScenario?.title}". User chose: "${option.text}". Give brief encouraging feedback in 1-2 sentences. Make it personalized based on the user's age group.`; 
            const response = await groqApi.generateResponse(prompt, apiKey); 
            setAiResponse(response || fallbackResponse); 
        } catch (e) { 
            setAiResponse(fallbackResponse); 
        } 
        
        setLoadingOption(null);
        setShowAITip(true);
        Vibration.vibrate(50);
    };
    
    const handleNext = () => { 
        const hasMoreSituations = selectedScenario?.situations && currentSituation < selectedScenario.situations.length - 1;
        
        if (hasMoreSituations) { 
            setCurrentSituation(currentSituation + 1); 
            setShowAITip(false); 
            setAiResponse(''); 
        } else { 
            markScenarioComplete();
            Alert.alert('🎉 Completed!', 'Great job completing this workshop!', [
                { text: 'Back to Categories', onPress: closeModal },
                { text: 'Stay', style: 'cancel' }
            ]); 
        } 
    };

    const markScenarioComplete = async () => {
        if (!selectedCategory || !selectedScenario) return;
        
        const key = `${selectedCategory.id}_${selectedScenario.id}`;
        const newCompleted = { ...completedScenarios };
        
        if (!newCompleted[selectedCategory.id]) {
            newCompleted[selectedCategory.id] = [];
        }
        
        if (!newCompleted[selectedCategory.id].includes(selectedScenario.id)) {
            newCompleted[selectedCategory.id].push(selectedScenario.id);
            setCompletedScenarios(newCompleted);
            await AsyncStorage.setItem(STORAGE_KEYS.COMPLETED_SCENARIOS, JSON.stringify(newCompleted));
            
            const today = new Date().toDateString();
            const lastStreakDate = await AsyncStorage.getItem('@workshop_last_completion');
            
            if (lastStreakDate !== today) {
                const newStreak = (streak || 0) + 1;
                setStreak(newStreak);
                await AsyncStorage.setItem('@workshop_streak', newStreak.toString());
                await AsyncStorage.setItem('@workshop_last_completion', today);
            }
        }
    };
    
    const getProgress = (id) => completedScenarios[id]?.length || 0;
    
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

    const generateCustomScenario = async () => {
        if (!customScenarioInput.trim()) {
            Alert.alert('Error', 'Please describe a safety scenario you want to practice.');
            return;
        }
        
        setGeneratingScenario(true);
        
        try {
            const apiKey = await settingsService.getGroqApiKey();
            if (!apiKey) {
                Alert.alert('API Key Required', 'Please configure your Groq API key in settings to use AI features.');
                setGeneratingScenario(false);
                return;
            }
            
            const prompt = `Generate a custom safety scenario based on this request: "${customScenarioInput}". 
            
            Return ONLY a JSON object with this exact structure (no additional text):
            {
                "title": "Scenario title",
                "description": "Brief description",
                "difficulty": "Beginner" or "Intermediate" or "Advanced",
                "situations": [
                    {
                        "dialogue": "The threat or situation the user faces",
                        "options": [
                            {"text": "Option 1", "response": "Feedback for option 1"},
                            {"text": "Option 2", "response": "Feedback for option 2"},
                            {"text": "Option 3", "response": "Feedback for option 3"}
                        ]
                    }
                ]
            }`;
            
            const response = await groqApi.generateResponse(prompt, apiKey);
            
            try {
                const parsed = JSON.parse(response);
                setGeneratedScenario(parsed);
                setSelectedScenario(parsed);
                setCurrentSituation(0);
                setShowAITip(false);
                setAiResponse('');
                setShowCustomScenario(false);
            } catch (parseError) {
                Alert.alert('Error', 'Failed to generate scenario. Please try again.');
            }
        } catch (e) {
            Alert.alert('Error', 'Failed to generate scenario. Please try again.');
        }
        
        setGeneratingScenario(false);
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadUserData();
        fetchAITipOfDay();
        setRefreshing(false);
    }, []);

    const renderCategory = ({ item, index }) => (
        <Animated.View 
            entering={FadeInDown.delay(index * 100).springify()}
        >
            <TouchableOpacity 
                style={[styles.categoryCard, { backgroundColor: colors.card, ...shadows.sm }]} 
                onPress={() => handleCategorySelect(item)}
                activeOpacity={0.7}
            >
                <View style={[styles.categoryIcon, { backgroundColor: item.color + '20' }]}>
                    <Ionicons name={item.icon} size={24} color={item.color} />
                </View>
                <View style={styles.categoryInfo}>
                    <View style={styles.titleRow}>
                        <Text style={[styles.categoryTitle, { color: colors.text }]}>{item.title}</Text>
                        {ageGroup && item.ageGroups.includes(ageGroup.label.split(' ')[0]) && (
                            <View style={[styles.recommendedBadge, { backgroundColor: colors.primary + '20' }]}>
                                <Ionicons name="star" size={10} color={colors.primary} />
                            </View>
                        )}
                    </View>
                    <Text style={[styles.categoryDesc, { color: colors.gray }]} numberOfLines={1}>{item.description}</Text>
                    <View style={styles.progressContainer}>
                        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                            <View style={[styles.progressFill, { backgroundColor: item.color, width: `${getProgressPercent(getProgress(item.id), item.scenarios)}%` }]} />
                        </View>
                        <Text style={[styles.progressText, { color: colors.gray }]}>{getProgress(item.id)}/{item.scenarios}</Text>
                    </View>
                </View>
                <View style={[styles.playButton, { backgroundColor: item.color }]}>
                    <Ionicons name="play" size={16} color="#fff" />
                </View>
            </TouchableOpacity>
        </Animated.View>
    );

    const renderScenario = ({ item }) => (
        <TouchableOpacity 
            style={[styles.scenarioCard, { backgroundColor: colors.card, ...shadows.sm }]} 
            onPress={() => handleScenarioSelect(item)}
            activeOpacity={0.7}
        >
            <View style={styles.scenarioHeader}>
                <Text style={[styles.scenarioTitle, { color: colors.text }]}>{item.title}</Text>
                <View style={[styles.difficultyBadge, { backgroundColor: (DIFFICULTY_COLORS[item.difficulty] || '#999') + '20' }]}>
                    <Text style={[styles.difficultyText, { color: DIFFICULTY_COLORS[item.difficulty] || '#999' }]}>{item.difficulty}</Text>
                </View>
            </View>
            <Text style={[styles.scenarioDesc, { color: colors.gray }]} numberOfLines={1}>{item.description}</Text>
            {completedScenarios[selectedCategory?.id]?.includes(item.id) && (
                <View style={[styles.completedBadge, { backgroundColor: '#4CAF50' }]}>
                    <Ionicons name="checkmark" size={12} color="#fff" />
                    <Text style={styles.completedText}>Completed</Text>
                </View>
            )}
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
                
                <Animated.View 
                    style={[styles.scenarioTitleCard, { backgroundColor: colors.card, ...shadows.md }, { transform: [{ scale: scaleAnim }] }]}
                    entering={FadeInDown.springify()}
                >
                    <View style={styles.titleCardHeader}>
                        <Text style={[styles.scenarioActiveTitle, { color: colors.text }]}>{scenario.title}</Text>
                        {generatedScenario && (
                            <View style={[styles.aiGeneratedBadge, { backgroundColor: colors.primary + '20' }]}>
                                <Ionicons name="sparkles" size={12} color={colors.primary} />
                                <Text style={[styles.aiGeneratedText, { color: colors.primary }]}>AI Generated</Text>
                            </View>
                        )}
                    </View>
                    <Text style={[styles.scenarioActiveDesc, { color: colors.gray }]}>{scenario.description}</Text>
                </Animated.View>
                
                {hasSituations && (
                    <Animated.View 
                        style={[styles.situationCard, { backgroundColor: colors.card, ...shadows.sm }]}
                        entering={FadeInDown.delay(100)}
                    >
                        <View style={styles.situationHeader}>
                            <View style={[styles.situationLabelContainer, { backgroundColor: colors.primary + '15' }]}>
                                <Ionicons name="chatbubbles" size={14} color={colors.primary} />
                                <Text style={[styles.situationLabel, { color: colors.primary }]}>Practice Scenario</Text>
                            </View>
                            <View style={[styles.progressBadge, { backgroundColor: colors.border }]}>
                                <Text style={[styles.situationProgress, { color: colors.gray }]}>{currentSituation + 1}/{scenario.situations.length}</Text>
                            </View>
                        </View>
                        <View style={[styles.dialogueBox, { backgroundColor: colors.primary + '10' }]}>
                            <Text style={[styles.situationDialogue, { color: colors.text }]}>"{scenario.situations[currentSituation]?.dialogue}"</Text>
                        </View>
                        
                        {scenario.situations[currentSituation]?.options && (
                            <View style={styles.optionsContainer}>
                                {scenario.situations[currentSituation].options.map((option, index) => (
                                    <Animated.View key={index} entering={FadeInDown.delay(index * 50)}>
                                        <TouchableOpacity 
                                            style={[styles.optionBtn, { backgroundColor: colors.card, borderColor: colors.border }]} 
                                            onPress={() => handleOptionSelect(option, index)}
                                            disabled={loadingOption !== null}
                                            activeOpacity={0.7}
                                        >
                                            {loadingOption === index ? (
                                                <ActivityIndicator size="small" color={colors.primary} />
                                            ) : (
                                                <>
                                                    <View style={[styles.optionNumber, { backgroundColor: colors.primary + '20' }]}>
                                                        <Text style={[styles.optionNumberText, { color: colors.primary }]}>{index + 1}</Text>
                                                    </View>
                                                    <Text style={[styles.optionText, { color: colors.text }]}>{option.text}</Text>
                                                </>
                                            )}
                                        </TouchableOpacity>
                                    </Animated.View>
                                ))}
                            </View>
                        )}
                    </Animated.View>
                )}

                {showAITip && (
                    <Animated.View style={[styles.aiResponseCard, { opacity: aiFadeAnim }]}>
                        <View style={styles.aiResponseHeader}>
                            <View style={styles.sparkleContainer}>
                                <Ionicons name="sparkles" size={20} color="#FFD700" />
                            </View>
                            <Text style={[styles.aiResponseTitle, { color: colors.text }]}>AI Feedback</Text>
                            {ageGroup && (
                                <Text style={[styles.personalizedBadge, { color: colors.primary }]}>Personalized</Text>
                            )}
                        </View>
                        <Text style={[styles.aiResponseText, { color: colors.gray }]}>{aiResponse}</Text>
                        {hasSituations && (
                            <TouchableOpacity 
                                style={[styles.nextBtn, { backgroundColor: colors.primary }]} 
                                onPress={handleNext}
                                activeOpacity={0.8}
                            >
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
                            <Animated.View 
                                key={i} 
                                style={[styles.techniqueCard, { backgroundColor: colors.card, ...shadows.sm }]}
                                entering={FadeInDown.delay(i * 50)}
                            >
                                <View style={[styles.techniqueIcon, { backgroundColor: colors.primary + '20' }]}>
                                    <Ionicons name="fitness" size={18} color={colors.primary} />
                                </View>
                                <View style={styles.techniqueInfo}>
                                    <Text style={[styles.techniqueName, { color: colors.text }]}>{tech.name}</Text>
                                    <Text style={[styles.techniqueDesc, { color: colors.gray }]}>{tech.desc}</Text>
                                </View>
                            </Animated.View>
                        ))}
                    </View>
                )}

                {hasTips && (
                    <View style={styles.contentSection}>
                        <Text style={[styles.sectionSubtitle, { color: colors.text }]}>Safety Tips</Text>
                        {scenario.tips.map((tip, i) => (
                            <Animated.View 
                                key={i} 
                                style={[styles.tipCard, { backgroundColor: colors.card, ...shadows.sm }]}
                                entering={FadeInDown.delay(i * 50)}
                            >
                                <View style={[styles.tipNumber, { backgroundColor: colors.primary + '20' }]}>
                                    <Text style={[styles.tipNumberText, { color: colors.primary }]}>{i + 1}</Text>
                                </View>
                                <Text style={[styles.tipText, { color: colors.text }]}>{tip}</Text>
                            </Animated.View>
                        ))}
                    </View>
                )}
                
                {!hasSituations && !hasTechniques && !hasTips && (
                    <Text style={[styles.noContent, { color: colors.gray }]}>Content coming soon...</Text>
                )}

                {!hasSituations && (hasTechniques || hasTips) && (
                    <TouchableOpacity 
                        style={[styles.completeBtn, { backgroundColor: colors.primary }]} 
                        onPress={() => {
                            markScenarioComplete();
                            Alert.alert('Completed!', 'Great job completing this workshop!', [{ text: 'Back', onPress: handleBackFromScenario }]);
                        }}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="trophy" size={18} color="#fff" />
                        <Text style={styles.completeBtnText}>Mark as Complete</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>
        );
    };

    const totalProgress = getTotalProgress();

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.primary }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBackBtn}>
                    <Ionicons name="arrow-back" size={22} color="#fff" />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Ionicons name="shield-checkmark" size={22} color="#fff" />
                    <Text style={styles.headerTitle}>AI Safety Workshops</Text>
                </View>
                <TouchableOpacity 
                    style={styles.headerRight} 
                    onPress={() => {
                        if (!userAge) {
                            setShowAgeModal(true);
                        } else {
                            setShowAgeModal(true);
                        }
                    }}
                >
                    <Ionicons name="person-circle" size={22} color="#fff" />
                </TouchableOpacity>
            </View>

            <ScrollView 
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
            >
                <View style={[styles.welcomeCard, { backgroundColor: colors.primary }]}>
                    <View style={styles.welcomeContent}>
                        <Text style={styles.welcomeTitle}>Your Safety Journey</Text>
                        <Text style={styles.welcomeSubtitle}>
                            {ageGroup ? `Welcome back, ${ageGroup.label}!` : 'Personalized safety training awaits'}
                        </Text>
                    </View>
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{totalProgress.completed}</Text>
                            <Text style={styles.statLabel}>Completed</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{totalProgress.total}</Text>
                            <Text style={styles.statLabel}>Total</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{streak}</Text>
                            <Text style={styles.statLabel}>Day Streak</Text>
                        </View>
                    </View>
                </View>

                {(aiTipOfDay || loadingTip) && (
                    <Animated.View 
                        style={[styles.aiTipCard, { backgroundColor: colors.card, ...shadows.sm }]}
                        entering={FadeInDown.springify()}
                    >
                        <View style={styles.aiTipHeader}>
                            <Ionicons name="sparkles" size={18} color="#FFD700" />
                            <Text style={[styles.aiTipTitle, { color: colors.text }]}>AI Tip of the Day</Text>
                        </View>
                        {loadingTip ? (
                            <ActivityIndicator size="small" color={colors.primary} />
                        ) : (
                            <Text style={[styles.aiTipText, { color: colors.gray }]}>{aiTipOfDay}</Text>
                        )}
                    </Animated.View>
                )}

                <View style={styles.searchContainer}>
                    <View style={[styles.searchBar, { backgroundColor: colors.card, ...shadows.sm }]}>
                        <Ionicons name="search" size={18} color={colors.gray} />
                        <TextInput 
                            style={[styles.searchInput, { color: colors.text }]}
                            placeholder="Search workshops..."
                            placeholderTextColor={colors.gray}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery ? (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <Ionicons name="close-circle" size={18} color={colors.gray} />
                            </TouchableOpacity>
                        ) : null}
                    </View>
                    <TouchableOpacity 
                        style={[styles.customBtn, { backgroundColor: colors.primary }]}
                        onPress={() => setShowCustomScenario(true)}
                    >
                        <Ionicons name="add" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>

                {ageGroup && (
                    <View style={styles.recommendedSection}>
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recommended for You</Text>
                            <View style={[styles.recommendedPill, { backgroundColor: colors.primary + '20' }]}>
                                <Ionicons name="star" size={12} color={colors.primary} />
                                <Text style={[styles.recommendedPillText, { color: colors.primary }]}>AI Personalized</Text>
                            </View>
                        </View>
                    </View>
                )}

                <FlatList 
                    data={filteredCategories} 
                    renderItem={renderCategory} 
                    keyExtractor={(item) => item.id} 
                    contentContainerStyle={styles.categoryList} 
                    showsVerticalScrollIndicator={false}
                    scrollEnabled={false}
                />
            </ScrollView>
            
            <Modal visible={showModal} animationType="slide" transparent onRequestClose={closeModal}>
                <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
                    <Animated.View 
                        style={[
                            styles.modalContent, 
                            { backgroundColor: colors.background },
                            { transform: [{ translateY: slideAnim }] }
                        ]}
                    >
                        <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
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
                    </Animated.View>
                </Animated.View>
            </Modal>

            <Modal visible={showAgeModal} animationType="fade" transparent onRequestClose={() => setShowAgeModal(false)}>
                <View style={styles.ageModalOverlay}>
                    <Animated.View style={[styles.ageModalContent, { backgroundColor: colors.card }]}>
                        <View style={[styles.ageModalIcon, { backgroundColor: colors.primary + '20' }]}>
                            <Ionicons name="person" size={32} color={colors.primary} />
                        </View>
                        <Text style={[styles.ageModalTitle, { color: colors.text }]}>Set Your Age</Text>
                        <Text style={[styles.ageModalSubtitle, { color: colors.gray }]}>
                            We'll personalize workshops based on your age group for the best learning experience.
                        </Text>
                        
                        <View style={styles.ageInputContainer}>
                            <TextInput
                                style={[styles.ageInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                                placeholder="Enter your age"
                                placeholderTextColor={colors.gray}
                                keyboardType="numeric"
                                value={userAge?.toString() || ''}
                                onChangeText={(text) => {
                                    const age = parseInt(text);
                                    if (!isNaN(age) && age > 0 && age < 120) {
                                        setUserAge(age);
                                    }
                                }}
                            />
                        </View>

                        <View style={styles.ageGroupButtons}>
                            {[18, 25, 35, 55, 70].map(age => (
                                <TouchableOpacity
                                    key={age}
                                    style={[styles.ageQuickBtn, { borderColor: colors.border }]}
                                    onPress={() => saveUserAge(age)}
                                >
                                    <Text style={{ color: colors.text }}>{age}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        
                        <TouchableOpacity 
                            style={[styles.ageSaveBtn, { backgroundColor: colors.primary }]}
                            onPress={() => userAge && saveUserAge(userAge)}
                            disabled={!userAge}
                        >
                            <Text style={styles.ageSaveBtnText}>Save & Continue</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={styles.skipBtn}
                            onPress={() => setShowAgeModal(false)}
                        >
                            <Text style={[styles.skipBtnText, { color: colors.gray }]}>Skip for now</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </Modal>

            <Modal visible={showCustomScenario} animationType="fade" transparent onRequestClose={() => setShowCustomScenario(false)}>
                <View style={styles.ageModalOverlay}>
                    <Animated.View style={[styles.customModalContent, { backgroundColor: colors.card }]}>
                        <View style={[styles.ageModalIcon, { backgroundColor: colors.primary + '20' }]}>
                            <Ionicons name="sparkles" size={32} color="#FFD700" />
                        </View>
                        <Text style={[styles.ageModalTitle, { color: colors.text }]}>AI Scenario Generator</Text>
                        <Text style={[styles.ageModalSubtitle, { color: colors.gray }]}>
                            Describe a safety scenario you'd like to practice, and our AI will generate a custom training scenario.
                        </Text>
                        
                        <TextInput
                            style={[styles.customInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                            placeholder="e.g., Someone following me at night..."
                            placeholderTextColor={colors.gray}
                            multiline
                            numberOfLines={3}
                            value={customScenarioInput}
                            onChangeText={setCustomScenarioInput}
                        />
                        
                        <TouchableOpacity 
                            style={[styles.ageSaveBtn, { backgroundColor: colors.primary }]}
                            onPress={generateCustomScenario}
                            disabled={generatingScenario || !customScenarioInput.trim()}
                        >
                            {generatingScenario ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <>
                                    <Ionicons name="sparkles" size={18} color="#fff" />
                                    <Text style={styles.ageSaveBtnText}>Generate Scenario</Text>
                                </>
                            )}
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={styles.skipBtn}
                            onPress={() => {
                                setShowCustomScenario(false);
                                setCustomScenarioInput('');
                            }}
                        >
                            <Text style={[styles.skipBtnText, { color: colors.gray }]}>Cancel</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </Modal>
        </View>
    );
};

const FadeInDown = {
    from: { opacity: 0, transform: [{ translateY: 20 }] },
    to: { opacity: 1, transform: [{ translateY: 0 }] },
};

const AnimatedView = ({ children, style, entering, exiting }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true })
        ]).start();
    }, []);

    return (
        <Animated.View style={[style, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            {children}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headerBackBtn: { padding: 6 },
    headerContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    headerTitle: { fontSize: 18, fontWeight: '600', color: '#fff' },
    headerRight: { padding: 6 },
    welcomeCard: { margin: 12, padding: 20, borderRadius: 20, overflow: 'hidden' },
    welcomeContent: { marginBottom: 16 },
    welcomeTitle: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 4 },
    welcomeSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
    statsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)' },
    statItem: { alignItems: 'center' },
    statNumber: { fontSize: 24, fontWeight: '700', color: '#fff' },
    statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
    statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
    aiTipCard: { marginHorizontal: 12, marginBottom: 12, padding: 14, borderRadius: 14 },
    aiTipHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    aiTipTitle: { fontSize: 14, fontWeight: '600' },
    aiTipText: { fontSize: 13, lineHeight: 20 },
    searchContainer: { flexDirection: 'row', paddingHorizontal: 12, gap: 8, marginBottom: 16 },
    searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, gap: 8 },
    searchInput: { flex: 1, fontSize: 14 },
    customBtn: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    recommendedSection: { paddingHorizontal: 16, marginBottom: 12 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    sectionTitle: { fontSize: 16, fontWeight: '600' },
    recommendedPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 4 },
    recommendedPillText: { fontSize: 11, fontWeight: '500' },
    categoryList: { paddingHorizontal: 16, paddingBottom: 20 },
    categoryCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16, marginBottom: 10 },
    categoryIcon: { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    categoryInfo: { flex: 1, marginLeft: 12 },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    categoryTitle: { fontSize: 15, fontWeight: '600' },
    recommendedBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
    categoryDesc: { fontSize: 12, marginTop: 2 },
    progressContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
    progressBar: { flex: 1, height: 4, borderRadius: 2 },
    progressFill: { height: '100%', borderRadius: 2 },
    progressText: { fontSize: 11 },
    playButton: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '90%' },
    modalHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 12 },
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
    completedBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginTop: 8, alignSelf: 'flex-start', gap: 4 },
    completedText: { fontSize: 10, color: '#fff', fontWeight: '500' },
    emptyContainer: { alignItems: 'center', paddingTop: 40 },
    emptyText: { textAlign: 'center', marginTop: 12, fontSize: 14 },
    activeScenario: { flex: 1 },
    backBtnRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
    backBtnText: { fontSize: 14 },
    scenarioTitleCard: { padding: 16, borderRadius: 16, marginBottom: 16 },
    titleCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    scenarioActiveTitle: { fontSize: 20, fontWeight: '700', marginBottom: 6 },
    aiGeneratedBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4 },
    aiGeneratedText: { fontSize: 10, fontWeight: '500' },
    scenarioActiveDesc: { fontSize: 14 },
    situationCard: { padding: 16, borderRadius: 14, marginBottom: 16 },
    situationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    situationLabelContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, gap: 6 },
    situationLabel: { fontSize: 12, fontWeight: '600' },
    progressBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    situationProgress: { fontSize: 12 },
    dialogueBox: { padding: 16, borderRadius: 12, marginBottom: 16 },
    situationDialogue: { fontSize: 16, fontStyle: 'italic', lineHeight: 24 },
    optionsContainer: { gap: 10 },
    optionBtn: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, gap: 12 },
    optionNumber: { width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
    optionNumberText: { fontSize: 12, fontWeight: '600' },
    optionText: { flex: 1, fontSize: 14 },
    aiResponseCard: { backgroundColor: '#FFF9C4', padding: 16, borderRadius: 14, marginBottom: 16 },
    aiResponseHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    sparkleContainer: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFF59D', justifyContent: 'center', alignItems: 'center' },
    aiResponseTitle: { fontSize: 14, fontWeight: '600', flex: 1 },
    personalizedBadge: { fontSize: 10, fontWeight: '500' },
    aiResponseText: { fontSize: 14, lineHeight: 20, marginBottom: 12 },
    nextBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 12, gap: 8 },
    nextBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
    contentSection: { marginBottom: 20 },
    sectionSubtitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
    techniqueCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, marginBottom: 8, gap: 12 },
    techniqueIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
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
    ageModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    ageModalContent: { width: '100%', maxWidth: 340, padding: 24, borderRadius: 20, alignItems: 'center' },
    ageModalIcon: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    ageModalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
    ageModalSubtitle: { fontSize: 14, textAlign: 'center', marginBottom: 20, lineHeight: 20 },
    ageInputContainer: { width: '100%', marginBottom: 12 },
    ageInput: { width: '100%', padding: 14, borderRadius: 12, borderWidth: 1, fontSize: 16, textAlign: 'center' },
    ageGroupButtons: { flexDirection: 'row', gap: 8, marginBottom: 20, flexWrap: 'wrap', justifyContent: 'center' },
    ageQuickBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
    ageSaveBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12, gap: 8 },
    ageSaveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    skipBtn: { marginTop: 12 },
    skipBtnText: { fontSize: 14 },
    customModalContent: { width: '100%', maxWidth: 340, padding: 24, borderRadius: 20, alignItems: 'center' },
    customInput: { width: '100%', padding: 14, borderRadius: 12, borderWidth: 1, fontSize: 14, minHeight: 100, textAlignVertical: 'top', marginBottom: 16 },
});

export default AISafetyWorkshopScreen;
