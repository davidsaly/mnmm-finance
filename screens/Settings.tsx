import React, { useEffect, useState } from 'react';
import BackButton from '../components/backButton';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    Stack,
    Box,
    Text,
    FormControl,
    Input,
    WarningOutlineIcon,
    Select,
    CheckIcon,
    Button,
    HStack,
    Spacer,
} from "native-base";
import { useForm, Controller } from 'react-hook-form';
import { auth } from '../utils/hooks/useAuthentication';
import { getFirestore, addDoc, collection, getDocs, getDoc, doc, updateDoc } from "firebase/firestore";
import { loadCurrencyList } from '../utils/dataCalls';
import {
    useQuery,
} from 'react-query';

const db = getFirestore();

export const loadCurrencies = () => useQuery('getCurrencies', loadCurrencyList, {
    placeholderData: [],
    refetchOnMount: false,
})

export default function SettingsScreen({ navigation }) {
    const { control, handleSubmit, formState: { errors } } = useForm({
        defaultValues: {
            currency: '',
        }
    });
    const [settings, setSettings] = useState({
        currency: '',
        email: '',
        firstname: '',
        surname: ''
    });
    const [currency, setCurrency] = useState('')

    async function onSubmit(data) {
        await saveSettings(data);
        navigation.navigate('HomeScreen', { currencyChanged: currency });
    };
    function cancel() {
        navigation.navigate('HomeTabs');
    }
    async function saveSettings() {
        const user = auth.currentUser;
        const uid: string = user?.uid.toString() || '';
        const userRef = doc(db, 'users', uid);
        try {
            const user = await updateDoc(userRef, { currency });
        } catch (e) {
            console.error('Error saving settings', e);
        }
    }
    async function loadSettings() {
        const user = auth.currentUser;
        const uid: string = user?.uid.toString() || '';
        const userRef = doc(db, 'users', uid);
        try {
            const user = await getDoc(userRef);
            const data = user.data();
            setCurrency(data.currency);
        } catch (e) {
            console.error('Error fetching user settings', e);
        }
    }

    const { data } = loadCurrencies({
        placeholderData: []
    });

    useEffect(() => {
        loadSettings();
    }, [])

    const currencies = data.map((ccy) => <Select.Item key={ccy.code} label={`${ccy.code} ${ccy.description}`} value={ccy.code} />);

    return (
        <SafeAreaView>
            <BackButton nav={navigation} screenName="HomeTabs" param={{}} />
            <KeyboardAwareScrollView style={{
                width: "100%"
            }}>
                <Stack space={2.5} alignSelf="center" px="4" safeArea mt="4" w={{
                    base: "100%",
                    md: "25%"
                }}>
                    <Box>
                        <Text bold fontSize="xl" mb="4">
                            Settings
                        </Text>
                        <FormControl mb="5" isRequired isInvalid={'currency' in errors}>
                            <FormControl.Label>Default Currency</FormControl.Label>
                            <Controller
                                control={control}
                                render={({ field: { onChange, value } }) => (
                                    <Select minWidth="200"
                                        accessibilityLabel="Choose Currency"
                                        placeholder="Currency"
                                        _selectedItem={{
                                            bg: "teal.600",
                                            endIcon: <CheckIcon size={5} />
                                        }}
                                        mt="1"
                                        selectedValue={currency}
                                        onValueChange={(itemValue: string) => {
                                            setCurrency(itemValue);
                                        }}
                                    >
                                        {currencies}
                                    </Select>
                                )}
                                name="currency"
                                // rules={{ required: 'Please make a selection' }}
                                defaultValue={currency}
                            />
                            <FormControl.HelperText>
                                Your default currency of the app.
                            </FormControl.HelperText>
                            <FormControl.ErrorMessage leftIcon={<WarningOutlineIcon size="xs" />}>
                                {errors.currency?.message}
                            </FormControl.ErrorMessage>
                        </FormControl>
                        <HStack>
                            <Button onPress={handleSubmit(onSubmit)} colorScheme="emerald">
                                Save
                            </Button>
                            <Spacer />
                            <Button mt="2" variant="unstyled" onPress={cancel}>
                                Cancel
                            </Button>
                        </HStack>
                    </Box>
                </Stack>
            </KeyboardAwareScrollView>
        </SafeAreaView>
    )
}
