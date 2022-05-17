import { format, formatISO } from "date-fns";
import { Box, Button, Center, FormControl, HStack, Input, Pressable, Spacer, VStack, Stack, View, WarningOutlineIcon, Text, Select, CheckIcon, Icon } from "native-base";
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { loadData } from './Home';
import { loadCurrencies } from './Settings';
import { AntDesign } from '@expo/vector-icons';
import { findIndex, get, merge, assign } from 'lodash';
import { auth } from '../utils/hooks/useAuthentication';
import { getFirestore, addDoc, collection, doc, updateDoc } from "firebase/firestore";

const db = getFirestore();

export default function AddTransactionScreen({ navigation, route }) {
    const { account, accountCurrency } = route.params;
    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
    const [date, setDate] = useState<string>();
    const [txType, setTxType] = useState(false);
    const [currencyIn, setCurrencyIn] = useState(accountCurrency);
    const [currencyOut, setCurrencyOut] = useState(accountCurrency);
    const [saveLabel, setSaveLabel] = useState('Save');

    const { data, refetch } = loadData({
        placeholderData: {
            docs: [],
            accs: [],
            totalValue: 0
        }
    });

    const currencyData = loadCurrencies({
        placeholderData: []
    });

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
            transactionType: '',
            accountIn: account,
            accountOut: account,
            currencyIn: accountCurrency,
            currencyOut: accountCurrency,
        }
    });
    async function onSubmit(data) {
        await createTransaction(data);
        setSaveLabel('Saving...');
        await new Promise(resolve => setTimeout(resolve, 4000));
        refetch();
        navigation.goBack();
    };

    function cancel() {
        navigation.goBack();
    }

    function handleTransactionType(type) {
        setTxType(type);
    }

    const findAccountCurrency = (name) => {
        const i = findIndex(data.accs, (acc) => acc.name === name);
        const currency = get(data, `accs[${i}].currency`);
        return currency;
    }

    const findAccount = (name) => {
        const i = findIndex(data.accs, (acc) => acc.name === name);
        const account = get(data, `accs[${i}]`);
        return account;
    }

    async function createTransaction(transaction) {
        const user = auth.currentUser;
        const uid: string = user?.uid || '';
        const accountIn = findAccount(transaction.accountIn);
        const accountOut = findAccount(transaction.accountOut);
        let refIn;
        let refOut;
        let refPathIn;
        let refPathOut;
        if (accountIn) {
            refIn = collection(db, 'users', uid, 'portfolios', get(accountIn, 'pf.id'), 'accounts', get(accountIn, 'id'), 'transactions');
        }
        if (accountOut) {
            refOut = collection(db, 'users', uid, 'portfolios', get(accountOut, 'pf.id'), 'accounts', get(accountOut, 'id'), 'transactions');
        }
        const docIn = {
            amount: transaction.amountIn,
            currency: currencyIn,
            date: formatISO(new Date(date), { representation: 'date' }),
            flow: '+',
            type: txType,
            created: formatISO(new Date(), { format: 'basic' }),
        };
        const docOut = {
            amount: `-${transaction.amountOut}`,
            currency: currencyOut,
            date: formatISO(new Date(date), { representation: 'date' }),
            flow: '-',
            type: txType,
            created: formatISO(new Date(), { format: 'basic' }),
        }
        if (txType === 'Inflow' || txType === 'Transfer') {
            try {
                const docRef = await addDoc(refIn, docIn);
                refPathIn = doc(db, docRef.path);
                console.log('Created Inflow transaction with id', docRef.id);
            } catch (e) {
                console.error('Error adding document: ', e);
            }
        }
        if (txType === 'Outflow' || txType === 'Transfer') {
            try {
                if (refPathIn) {
                    assign(docOut, { transactionRef: refPathIn });
                }
                const docRef = await addDoc(refOut, docOut);
                refPathOut = doc(db, docRef.path);
                console.log('Created Outflow transaction with id', docRef.id);
            } catch (e) {
                console.error('Error adding document: ', e);
            }
        }
        if (txType === 'Transfer') {
            try {
                await updateDoc(refPathIn, {
                    transactionRef: refPathOut
                });
                console.log('Updated transactionRef on inflow');
            } catch (e) {
                console.error('Error updating document: ', e);
            }
        }
    }

    const accounts = data.accs.map((acc) => <Select.Item key={acc.id} label={`${acc.name}`} value={acc.name} />);
    const currencies = currencyData.data.map((ccy) => <Select.Item key={ccy.code} label={`${ccy.code}`} value={ccy.code} />);

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
                        Add Transaction
                    </Text>
                    <Text bold fontSize="sm" mb="1">
                        Select transaction type
                    </Text>
                    <HStack mb="5">
                        <Button mt="2" colorScheme="emerald" variant={txType === "Inflow" ? "subtle" : "link"} onPress={() => handleTransactionType('Inflow')}>
                            Inflow
                        </Button>
                        <Spacer />
                        <Button mt="2" colorScheme="emerald" variant={txType === "Outflow" ? "subtle" : "link"} onPress={() => handleTransactionType('Outflow')}>
                            Outflow
                        </Button>
                        <Spacer />
                        <Button mt="2" colorScheme="emerald" variant={txType === "Transfer" ? "subtle" : "link"} onPress={() => handleTransactionType('Transfer')}>
                            Transfer
                        </Button>
                    </HStack>
                    {(txType === 'Inflow' || txType === 'Transfer') && <Text bold fontSize="sm" mb="3">IN: </Text>}
                    {(txType === 'Inflow' || txType === 'Transfer') &&
                        <HStack mb="3">
                            <FormControl w="1/3" isRequired isInvalid={'accountIn' in errors}>
                                <FormControl.Label><Text fontSize="xs">Account</Text></FormControl.Label>
                                <Controller
                                    control={control}
                                    render={({ field: { onChange, value } }) => (
                                        <Select
                                            accessibilityLabel="Choose Account"
                                            placeholder="Account"
                                            _selectedItem={{
                                                bg: "teal.600",
                                                endIcon: <CheckIcon size={5} />
                                            }}
                                            // mt="1"
                                            selectedValue={value}
                                            onValueChange={(itemValue: string) => {
                                                onChange(itemValue);
                                                const currency = findAccountCurrency(itemValue);
                                                setCurrencyIn(currency);
                                            }}
                                        >
                                            {accounts}
                                        </Select>
                                    )}
                                    name="accountIn"
                                    rules={{ required: 'Please make a selection' }}
                                    defaultValue=""
                                />

                                <FormControl.ErrorMessage leftIcon={<WarningOutlineIcon size="xs" />}>
                                    {errors.accountIn?.message}
                                </FormControl.ErrorMessage>
                            </FormControl>
                            <FormControl w="1/3" isRequired isInvalid={'amountIn' in errors}>
                                <FormControl.Label><Text fontSize="xs">Amount In</Text></FormControl.Label>
                                <Controller
                                    control={control}
                                    render={({ field: { onChange, value } }) => (
                                        <Input
                                            placeholder="Amount"
                                            onChangeText={onChange}
                                            value={value}
                                            InputLeftElement={<Icon as={<AntDesign name="plus" />} size={3} ml="2" color="muted.400" />}
                                        />
                                    )}
                                    name="amountIn"
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
                                    {errors.amountIn?.message}
                                </FormControl.ErrorMessage>
                            </FormControl>
                            < Spacer />
                            <FormControl w="1/3" isRequired isInvalid={'currencyIn' in errors}>
                                <FormControl.Label><Text fontSize="xs">Currency</Text></FormControl.Label>
                                <Controller
                                    control={control}
                                    render={({ field: { onChange, value } }) => (
                                        <Select
                                            accessibilityLabel="Choose Currency"
                                            placeholder="Currency"
                                            _selectedItem={{
                                                bg: "teal.600",
                                                endIcon: <CheckIcon size={5} />
                                            }}
                                            selectedValue={currencyIn}
                                            onValueChange={(itemValue: string) => {
                                                setCurrencyIn(itemValue);
                                            }}
                                        >
                                            {currencies}
                                        </Select>
                                    )}
                                    name="currencyIn"
                                />
                            </FormControl>
                        </HStack>}
                    {(txType === 'Outflow' || txType === 'Transfer') && <Text bold fontSize="sm" mb="3">OUT: </Text>}
                    {(txType === 'Outflow' || txType === 'Transfer') &&
                        <HStack mb="3">
                            <FormControl w="1/3" isRequired isInvalid={'accountOut' in errors}>
                                <FormControl.Label><Text fontSize="xs">Account</Text></FormControl.Label>
                                <Controller
                                    control={control}
                                    render={({ field: { onChange, value } }) => (
                                        <Select
                                            accessibilityLabel="Choose Account"
                                            placeholder="Account"
                                            _selectedItem={{
                                                bg: "teal.600",
                                                endIcon: <CheckIcon size={5} />
                                            }}
                                            selectedValue={value}
                                            onValueChange={(itemValue: string) => {
                                                onChange(itemValue);
                                                const currency = findAccountCurrency(itemValue);
                                                setCurrencyOut(currency);
                                            }}
                                        >
                                            {accounts}
                                        </Select>
                                    )}
                                    name="accountOut"
                                    rules={{ required: 'Please make a selection' }}
                                    defaultValue=""
                                />

                                <FormControl.ErrorMessage leftIcon={<WarningOutlineIcon size="xs" />}>
                                    {errors.accountOut?.message}
                                </FormControl.ErrorMessage>
                            </FormControl>
                            <FormControl w="1/3" isRequired isInvalid={'amountOut' in errors}>
                                <FormControl.Label><Text fontSize="xs">Amount Out</Text></FormControl.Label>
                                <Controller
                                    control={control}
                                    render={({ field: { onChange, value } }) => (
                                        <Input
                                            placeholder="Amount"
                                            onChangeText={onChange}
                                            value={value}
                                            InputLeftElement={<Icon as={<AntDesign name="minus" />} size={3} ml="2" color="muted.400" />}
                                        />
                                    )}
                                    name="amountOut"
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
                                    {errors.amountOut?.message}
                                </FormControl.ErrorMessage>
                            </FormControl>
                            < Spacer />
                            <FormControl w="1/3" isRequired isInvalid={'currencyOut' in errors}>
                                <FormControl.Label><Text fontSize="xs">Currency</Text></FormControl.Label>
                                <Controller
                                    control={control}
                                    render={({ field: { onChange, value } }) => (
                                        <Select
                                            accessibilityLabel="Choose Currency"
                                            placeholder="Currency"
                                            _selectedItem={{
                                                bg: "teal.600",
                                                endIcon: <CheckIcon size={5} />
                                            }}
                                            selectedValue={currencyOut}
                                            onValueChange={(itemValue: string) => {
                                                setCurrencyOut(itemValue)
                                            }}
                                        >
                                            {currencies}
                                        </Select>
                                    )}
                                    name="currencyOut"
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
                            defaultValue=""
                        />
                        <FormControl.ErrorMessage leftIcon={<WarningOutlineIcon size="xs" />}>
                            {errors.date?.message}
                        </FormControl.ErrorMessage>
                    </FormControl>
                    <HStack>
                        <Button onPress={handleSubmit(onSubmit)} colorScheme="emerald">
                            {saveLabel}
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

    )
}
