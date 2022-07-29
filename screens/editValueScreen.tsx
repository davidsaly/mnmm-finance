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
import { getFirestore, addDoc, updateDoc ,collection, doc, serverTimestamp, deleteDoc } from "firebase/firestore";
import { useForm, Controller } from 'react-hook-form';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { format, formatISO } from 'date-fns';
import { loadSeriesFromDate } from './AddTransactionScreen';
import {filter} from 'lodash';

import { loadData } from './Home';

const auth = getAuth();
const db = getFirestore();

export default function EditValueScreen({ route, navigation }) {
    const { portfolio, account, accountName, accountCurrency, dt, amount, ref, docId } = route.params;

    // for date picker
    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
    const [date, setDate] = useState<string>();
    const [currency, setCurrency] = useState<string>(accountCurrency);
    const [saveLabel, setSaveLabel] = useState('Save');
    const [beforeAfter, setBeforeAfter] = useState('na');
    const [record, setRecord] = useState({ linkRef: '' });
    const [recordDocs, setRecordDocs] = useState([{ recordType: 'na', id: 'na', amount: '0', currency: 'EUR', linkRef: '' }])
    const [saveDisabled, setSaveDisabled] = useState(true);

    const { refetch } = loadData();

    const showDatePicker = () => {
        setDatePickerVisibility(true);
    };

    const hideDatePicker = () => {
        setDatePickerVisibility(false);
    };

    useEffect(() => {
        handleConfirm(new Date(dt));
    }, [])

    const handleConfirm = async (dt) => {
        console.log("A date has been picked: ", dt);
        const formatted = format(dt, 'MMMM dd yyyy');
        setDate(formatted);
        hideDatePicker();
        await loadSeriesAndSet(dt, account);
    };

    async function loadSeriesAndSet(date: any, account: any) {
        setSaveDisabled(true);
        let recordDocs: any[] = await loadSeriesFromDate(date, { pf: { id: portfolio }, id: account });
        recordDocs = filter(recordDocs, doc => doc.id !== docId );
        console.log('recordDocs', recordDocs);
        setRecordDocs(recordDocs);
        if (recordDocs.length) {
            setRecord(recordDocs[recordDocs.length - 1]);
            setBeforeAfter('After');
        } else {
            setBeforeAfter('na');
        }
        setSaveDisabled(false);
    }

    const { control, handleSubmit, formState: { errors } } = useForm({
        defaultValues: {
            amount,
            portfolio: '',
            account: '',
            currency: '',
            date: '',
            record,
            beforeAfter,
        }
    });
    async function onSubmit(data) {
        setSaveLabel('Saving...');
        await editValue(data);
        navigation.navigate('Account Details', { valueAdded: data, accountId: account, portfolioId: portfolio, accountName });
    };

    async function deleteValue() {
        try {
            const docRef = await deleteDoc(doc(db, ref))
            console.error('Value has been deleted');
        } catch (e) {
            console.error('Error deleting document');
        }
        navigation.navigate('Account Details', { valueAdded: 'deleted', accountId: account, portfolioId: portfolio, accountName });
    }

    async function editValue(val) {
        console.log('edit value', val);
        console.log('date', date);
        console.log('currency', currency);
        const user = auth.currentUser;
        const uid: string = user?.uid || '';
        try {
            const docRef = await updateDoc(doc(db, ref), {
                amount: val.amount,
                currency,
                date: formatISO(new Date(date), { representation: 'date' }),
                ordering: beforeAfter,
                orderingRef: record.linkRef,
            });
            console.log('Updated the value document');
        } catch (e) {
            console.error('Error updating document: ', e);
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
                        Edit Value of {accountName}
                    </Text>
                    <FormControl mb="5" isRequired isInvalid={'amount' in errors}>
                        <FormControl.Label>Value in {currency}</FormControl.Label>
                        <Controller
                            control={control}
                            render={({ field: { onChange, value } }) => (
                                <Input
                                    placeholder="Amount"
                                    onChangeText={onChange}
                                    value={value}
                                    keyboardType="number-pad"
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
                    {recordDocs.length > 0 && <HStack>
                        <FormControl w="1/2" isRequired isInvalid={'beforeAfter' in errors}>
                            <FormControl.Label><Text fontSize="xs">Impact</Text></FormControl.Label>
                            <Controller
                                control={control}
                                render={({ field: { onChange, value } }) => (
                                    <Select
                                        accessibilityLabel="Choose Before/After"
                                        placeholder="Before/After"
                                        _selectedItem={{
                                            bg: "teal.600",
                                            endIcon: <CheckIcon size={5} />
                                        }}
                                        selectedValue={beforeAfter}
                                        onValueChange={(itemValue: string) => {
                                            setBeforeAfter(itemValue)
                                        }}
                                    >
                                        <Select.Item key={'Before'} label='Before' value={'Before'} />
                                        <Select.Item key={'After'} label='After' value={'After'} />
                                    </Select>
                                )}
                                name="beforeAfter"
                            />
                        </FormControl>
                        <FormControl w="1/2" isRequired isInvalid={'record' in errors}>
                            <FormControl.Label><Text fontSize="xs">Transaction/Value</Text></FormControl.Label>
                            <Controller
                                control={control}
                                render={({ field: { onChange, value } }) => (
                                    <Select
                                        accessibilityLabel="Choose Transaction/Value"
                                        placeholder="Transaction/Value"
                                        _selectedItem={{
                                            bg: "teal.600",
                                            endIcon: <CheckIcon size={5} />
                                        }}
                                        selectedValue={record.linkRef}
                                        onValueChange={(itemValue: string) => {
                                            setRecord({ linkRef: itemValue });
                                        }}
                                    >
                                        {recordDocs.map(rec => {
                                            return (<Select.Item key={rec.id} label={`${rec.recordType} of ${rec.amount} ${rec.currency}`} value={rec.linkRef} />)
                                        })}
                                    </Select>
                                )}
                                name="record"
                            />
                        </FormControl>
                    </HStack>}
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
                        <Button onPress={handleSubmit(onSubmit)} colorScheme="emerald" isDisabled={saveDisabled}>
                            {saveLabel}
                        </Button>
                        <Spacer />
                        <Button onPress={deleteValue} colorScheme="warning">
                            Delete
                        </Button>
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
