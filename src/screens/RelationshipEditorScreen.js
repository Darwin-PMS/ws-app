import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import familyService from '../services/familyService';

const RELATIONSHIPS = [
    { id: 'spouse', label: 'Spouse', icon: 'heart' },
    { id: 'parent', label: 'Parent', icon: 'people' },
    { id: 'child', label: 'Child', icon: 'person' },
    { id: 'sibling', label: 'Sibling', icon: 'people-circle' },
    { id: 'grandparent', label: 'Grandparent', icon: 'accessibility' },
    { id: 'grandchild', label: 'Grandchild', icon: 'happy' },
    { id: 'other', label: 'Other', icon: 'ellipsis-horizontal' },
];

const RelationshipEditorScreen = ({ navigation, route }) => {
    const { colors, spacing, borderRadius, shadows } = useTheme();
    const { userId } = useApp();

    const familyId = route.params?.familyId;
    const memberId = route.params?.memberId;
    const memberName = route.params?.memberName || 'Member';

    const [selectedRelationship, setSelectedRelationship] = useState('other');
    const [customName, setCustomName] = useState('');
    const [notes, setNotes] = useState('');

    const saveRelationship = async () => {
        if (!familyId) {
            Alert.alert('Error', 'Family ID is missing');
            return;
        }

        if (!userId) {
            Alert.alert('Error', 'User session not found. Please log in again.');
            return;
        }

        try {
            const response = await familyService.addRelationship(familyId, {
                from_user_id: userId,
                to_user_id: memberId,
                relationship_type: selectedRelationship,
                notes: notes,
            });

            if (response.success) {
                Alert.alert('Success', 'Relationship updated successfully', [
                    { text: 'OK', onPress: () => navigation.goBack() },
                ]);
            } else {
                Alert.alert('Error', response.message || 'Failed to update relationship');
            }
        } catch (error) {
            Alert.alert('Error', 'An error occurred while saving');
        }
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.primary }]}>
                <Text style={[styles.headerTitle, { color: colors.white }]}>Edit Relationship</Text>
                <Text style={[styles.headerSubtitle, { color: colors.white + 'CC' }]}>
                    {memberName}
                </Text>
            </View>

            <View style={styles.content}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Relationship</Text>
                <View style={styles.relationshipsGrid}>
                    {RELATIONSHIPS.map((rel) => (
                        <TouchableOpacity
                            key={rel.id}
                            style={[
                                styles.relationshipCard,
                                {
                                    backgroundColor: selectedRelationship === rel.id ? colors.primary : colors.card,
                                    borderRadius,
                                    ...shadows.small,
                                },
                            ]}
                            onPress={() => setSelectedRelationship(rel.id)}
                        >
                            <Ionicons
                                name={rel.icon}
                                size={28}
                                color={selectedRelationship === rel.id ? colors.white : colors.gray}
                            />
                            <Text
                                style={[
                                    styles.relationshipLabel,
                                    { color: selectedRelationship === rel.id ? colors.white : colors.text },
                                ]}
                            >
                                {rel.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {selectedRelationship === 'other' && (
                    <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border, marginTop: spacing.md }]}>
                        <TextInput
                            style={[styles.input, { color: colors.text }]}
                            placeholder="Custom relationship name"
                            placeholderTextColor={colors.gray}
                            value={customName}
                            onChangeText={setCustomName}
                        />
                    </View>
                )}

                <Text style={[styles.sectionTitle, { color: colors.text, marginTop: spacing.lg }]}>Notes</Text>
                <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <TextInput
                        style={[styles.input, styles.notesInput, { color: colors.text }]}
                        placeholder="Add notes about this relationship..."
                        placeholderTextColor={colors.gray}
                        value={notes}
                        onChangeText={setNotes}
                        multiline
                        numberOfLines={4}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.saveButton, { backgroundColor: colors.primary }]}
                    onPress={saveRelationship}
                >
                    <Ionicons name="save" size={20} color={colors.white} />
                    <Text style={[styles.saveButtonText, { color: colors.white }]}>Save Relationship</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 24,
        paddingTop: 48,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    headerSubtitle: {
        fontSize: 16,
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
    relationshipsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    relationshipCard: {
        width: '30%',
        alignItems: 'center',
        padding: 16,
    },
    relationshipLabel: {
        fontSize: 12,
        fontWeight: '500',
        marginTop: 8,
    },
    inputContainer: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
    },
    input: {
        fontSize: 16,
    },
    notesInput: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 56,
        borderRadius: 12,
        gap: 8,
        marginTop: 24,
    },
    saveButtonText: {
        fontSize: 18,
        fontWeight: '600',
    },
});

export default RelationshipEditorScreen;
