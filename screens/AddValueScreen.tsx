import { useEffect, useState } from 'react'
import { Pressable } from 'react-native';
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
    View,
} from "native-base";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { getAuth } from 'firebase/auth';
import { getFirestore, addDoc, collection } from "firebase/firestore";
import { useForm, Controller } from 'react-hook-form';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { format, formatISO } from 'date-fns'

const auth = getAuth();
const db = getFirestore();

export default function AddValueScreen({ route, navigation }) {
    const { portfolio, account, accountName, accountCurrency } = route.params;

    // for date picker
    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
    const [date, setDate] = useState<string>();
    const [currency, setCurrency] = useState<string>(accountCurrency);

    const showDatePicker = () => {
        setDatePickerVisibility(true);
    };

    const hideDatePicker = () => {
        setDatePickerVisibility(false);
    };

    useEffect(() => {
        handleConfirm(new Date());
    }, [])

    const handleConfirm = (dt) => {
        console.log("A date has been picked: ", dt);
        const formatted = format(dt, 'MMMM dd yyyy');
        setDate(formatted);
        hideDatePicker();
    };

    const { control, handleSubmit, formState: { errors } } = useForm({
        defaultValues: {
            amount: '',
            portfolio: '',
            account: '',
            currency: '',
            date: ''
        }
    });
    async function onSubmit(data) {
        await createValue(data);
        navigation.navigate('Account Details', { valueAdded: data, accountId: account, portfolioId: portfolio, accountName});
    };

    async function createValue(val) {
        console.log('create value', val);
        console.log('date', date);
        console.log('currency', currency);
        const user = auth.currentUser;
        const email = user?.email;
        const uid: string = user?.uid || '';
        try {
            const docRef = await addDoc(collection(db, 'users', uid, 'portfolios', portfolio, 'accounts', account, 'values'), {
                amount: val.amount,
                currency,
                date: formatISO(new Date(date), { representation: 'date' })
            });
            console.log('Created a value with id', docRef.id);
        } catch (e) {
            console.error('Error adding document: ', e);
        }
    }

    function cancel() {
        navigation.goBack();
    }

    return (
        <KeyboardAwareScrollView style={{
            width: "100%"
        }}>
            <Stack space={2.5} alignSelf="center" px="4" safeArea mt="4" w={{
                base: "100%",
                md: "25%"
            }}>
                <Box>
                    <Text bold fontSize="xl" mb="4">
                        Add Value of {accountName}
                    </Text>
                    <FormControl mb="5" isRequired isInvalid={'amount' in errors}>
                        <FormControl.Label>Value</FormControl.Label>
                        <Controller
                            control={control}
                            render={({ field: { onChange, value } }) => (
                                <Input
                                    placeholder="Amount"
                                    onChangeText={onChange}
                                    value={value}
                                />
                            )}
                            name="amount"
                            rules={{
                                required: 'Field is required',
                                pattern: {
                                    value: /^[0-9]+$/,
                                    message: 'Please enter a number with no decimals',
                                },
                            }}
                            defaultValue=""
                        />
                        <FormControl.ErrorMessage leftIcon={<WarningOutlineIcon size="xs" />}>
                            {errors.amount?.message}
                        </FormControl.ErrorMessage>
                        <FormControl.HelperText>
                            Value of the account.
                        </FormControl.HelperText>
                    </FormControl>
                    <FormControl mb="5" isInvalid={'currency' in errors}>
                        <FormControl.Label>Currency</FormControl.Label>
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
                                        // onChange(itemValue);
                                        setCurrency(itemValue);
                                    }}
                                >
                                    <Select.Item label="EUR" value="EUR" />
                                    <Select.Item label="USD" value="USD" />
                                    <Select.Item label="CHF" value="CHF" />
                                    <Select.Item label="GBP" value="GBP" />
                                </Select>
                            )}
                            name="currency"
                            // rules={{ required: 'Please make a selection' }}
                            defaultValue={accountCurrency}
                        />
                        <FormControl.HelperText>
                            Currency of the value
                        </FormControl.HelperText>
                        <FormControl.ErrorMessage leftIcon={<WarningOutlineIcon size="xs" />}>
                            {errors.currency?.message}
                        </FormControl.ErrorMessage>
                    </FormControl>
                    <FormControl mb="5" isInvalid={'date' in errors}>
                        <FormControl.Label>Date</FormControl.Label>
                        <Controller
                            control={control}
                            render={({ field: { onChange, value, onBlur } }) => (
                                <Pressable onPress={() => showDatePicker()}>
                                    <View pointerEvents="none">
                                        <Input
                                            placeholder="Date"
                                            value={date}
                                        />
                                    </View>
                                </Pressable>
                            )}
                            name="date"
                            // rules={{
                            //     required: 'Field is required',
                            // }}
                            defaultValue=""
                        />
                        <FormControl.ErrorMessage leftIcon={<WarningOutlineIcon size="xs" />}>
                            {errors.date?.message}
                        </FormControl.ErrorMessage>
                        <FormControl.HelperText>
                            Value date
                        </FormControl.HelperText>
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
            <View>
                <DateTimePickerModal
                    isVisible={isDatePickerVisible}
                    mode="date"
                    onConfirm={handleConfirm}
                    onCancel={hideDatePicker}
                />
            </View>
        </KeyboardAwareScrollView>
    );
}
