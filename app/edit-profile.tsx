import { View, Text, TextInput, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { useAuth, useUser } from '../lib/useClerkSafe';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { Calendar, Check } from 'lucide-react-native';
import { ZodiacYearPicker, getZodiacByYear } from '../components/profile/ZodiacYearPicker';
import { useUserStore } from '../store/userStore';
import authApi from '../lib/authApi';

export default function EditProfileScreen() {
    const router = useRouter();
    const { user: clerkUser } = useUser();
    const { user: dbUser, fetchProfile } = useUserStore();

    const [firstName, setFirstName] = useState(dbUser?.firstName || clerkUser?.firstName || '');
    const [lastName, setLastName] = useState(dbUser?.lastName || clerkUser?.lastName || '');
    const [dateOfBirth, setDateOfBirth] = useState<Date | null>(
        dbUser?.dateOfBirth ? new Date(dbUser.dateOfBirth) : null
    );
    const [zodiacYear, setZodiacYear] = useState(dbUser?.zodiacYear || '');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (selectedDate) {
            setDateOfBirth(selectedDate);
            // Auto-set zodiac year based on birth year
            const zodiac = getZodiacByYear(selectedDate.getFullYear());
            if (zodiac) {
                setZodiacYear(zodiac.key);
            }
        }
    };

    const formatDate = (date: Date | null) => {
        if (!date) return 'Select date';
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const handleSave = async () => {
        if (!firstName.trim() || !lastName.trim()) {
            setError('Please enter your first and last name');
            return;
        }

        if (!dateOfBirth) {
            setError('Please select your date of birth');
            return;
        }

        if (!zodiacYear) {
            setError('Please select your zodiac year');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await authApi.updateProfile({
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                dateOfBirth: dateOfBirth.toISOString().split('T')[0],
                zodiacYear,
            });

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await fetchProfile(); // Refresh profile data
            router.back();
        } catch (err: any) {
            console.error('Failed to update profile:', err);
            setError(err.response?.data?.message || 'Failed to update profile');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-stone-50">
            <Stack.Screen
                options={{
                    headerTitle: 'Edit Profile',
                    headerRight: () => (
                        <Pressable
                            onPress={handleSave}
                            disabled={isLoading}
                            className="mr-2"
                            style={{ minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' }}
                        >
                            {isLoading ? (
                                <ActivityIndicator size="small" color="#D97706" />
                            ) : (
                                <Check size={24} color="#D97706" />
                            )}
                        </Pressable>
                    ),
                }}
            />

            <ScrollView className="flex-1 px-4" keyboardShouldPersistTaps="handled">
                {error && (
                    <View className="bg-red-50 border border-red-200 rounded-xl p-4 mt-4">
                        <Text className="text-red-600 text-center">{error}</Text>
                    </View>
                )}

                {/* Name Section */}
                <View className="mt-6">
                    <Text className="text-sm font-medium text-stone-500 uppercase px-2 mb-2">
                        Personal Information
                    </Text>

                    <View className="bg-white rounded-xl overflow-hidden">
                        <View className="px-4 py-4 border-b border-stone-200">
                            <Text className="text-stone-500 text-sm mb-1">First Name</Text>
                            <TextInput
                                value={firstName}
                                onChangeText={setFirstName}
                                placeholder="Enter first name"
                                className="text-stone-800 text-lg"
                                autoCapitalize="words"
                            />
                        </View>
                        <View className="px-4 py-4">
                            <Text className="text-stone-500 text-sm mb-1">Last Name</Text>
                            <TextInput
                                value={lastName}
                                onChangeText={setLastName}
                                placeholder="Enter last name"
                                className="text-stone-800 text-lg"
                                autoCapitalize="words"
                            />
                        </View>
                    </View>
                </View>

                {/* Date of Birth Section */}
                <View className="mt-6">
                    <Text className="text-sm font-medium text-stone-500 uppercase px-2 mb-2">
                        Date of Birth
                    </Text>

                    <Pressable
                        onPress={() => setShowDatePicker(true)}
                        className="bg-white rounded-xl px-4 py-4 flex-row items-center active:bg-stone-50"
                        style={{ minHeight: 56 }}
                    >
                        <Calendar size={22} color="#78716C" />
                        <Text className={`ml-3 text-lg ${dateOfBirth ? 'text-stone-800' : 'text-stone-400'}`}>
                            {formatDate(dateOfBirth)}
                        </Text>
                    </Pressable>

                    {showDatePicker && (
                        <DateTimePicker
                            value={dateOfBirth || new Date(2000, 0, 1)}
                            mode="date"
                            display="spinner"
                            onChange={handleDateChange}
                            maximumDate={new Date()}
                            minimumDate={new Date(1920, 0, 1)}
                        />
                    )}
                </View>

                {/* Zodiac Year Section */}
                <View className="mt-6">
                    <Text className="text-sm font-medium text-stone-500 uppercase px-2 mb-2">
                        Zodiac Year (Mongolian)
                    </Text>
                    <ZodiacYearPicker
                        value={zodiacYear}
                        onChange={setZodiacYear}
                        language="mn"
                    />
                    <Text className="text-stone-500 text-sm mt-2 px-2">
                        Your zodiac sign is important for Mongolian astrological readings and rituals.
                    </Text>
                </View>

                {/* Save Button */}
                <Pressable
                    onPress={handleSave}
                    disabled={isLoading}
                    className={`mt-8 mb-8 py-4 rounded-xl ${isLoading ? 'bg-amber-400' : 'bg-amber-600 active:bg-amber-700'}`}
                    style={{ minHeight: 56 }}
                >
                    {isLoading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className="text-white text-center font-semibold text-lg">
                            Save Changes
                        </Text>
                    )}
                </Pressable>
            </ScrollView>
        </SafeAreaView>
    );
}
