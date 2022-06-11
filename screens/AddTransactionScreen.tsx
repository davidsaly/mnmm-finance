import { format, formatISO } from "date-fns";
import { Box, Button, Center, FormControl, HStack, Input, Pressable, Spacer, VStack, Stack, View, WarningOutlineIcon, Text, Select, CheckIcon, Icon, Radio } from "native-base";
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { loadData } from './Home';
import { loadCurrencies } from './Settings';
import { AntDesign } from '@expo/vector-icons';
import { findIndex, get, merge, assign } from 'lodash';
import { auth } from '../utils/hooks/useAuthentication';
import { getFirestore, addDoc, collection, doc, updateDoc, getDocs, DocumentData, query, where, getDoc, serverTimestamp } from "firebase/firestore";
import { orderSeriesFromDate } from "../utils/utils";

const db = getFirestore();

export async function loadSeriesFromDate(date: any, acc: any) {
    if (date && acc) {
        const dateFormatted = formatISO(new Date(date), { representation: 'date' });
        const user = auth.currentUser;
        const uid: string = user?.uid || '';
        const seriesRef = collection(db, 'users', uid, 'portfolios', get(acc, 'pf.id'), 'accounts', get(acc, 'id'), 'series');
        const q = query(seriesRef, where('date', '==', dateFormatted));
        const series = await getDocs(q);
        let seriesDocs: any[] = [];
        let recordDocs: any[] = [];
        series.forEach(doc => {
            seriesDocs = [...seriesDocs, { ...doc.data(), ...{ id: doc.id, ref: doc.ref } }];
        });
        seriesDocs = orderSeriesFromDate(seriesDocs);
        for (let index = 0; index < seriesDocs.length; index++) {
            const record = await getDoc(seriesDocs[index].createdFromRef);
            recordDocs = [...recordDocs, {
                ...record.data(), ...{
                    id: record.id,
                    linkFromSeries: seriesDocs[index].id,
                    linkRef: seriesDocs[index].ref,
                    recordType: seriesDocs[index].createdFrom,
                }
            }];
        }
        return recordDocs;
    }
    return [];
}

export default function AddTransactionScreen({ navigation, route }) {
    const { account, accountCurrency } = route.params;
    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
    const [date, setDate] = useState<string>();
    const [txType, setTxType] = useState(false);
    const [currencyIn, setCurrencyIn] = useState(accountCurrency);
    const [currencyOut, setCurrencyOut] = useState(accountCurrency);
    const [saveLabel, setSaveLabel] = useState('Save');
    const [saveDisabled, setSaveDisabled] = useState(true);
    const [inBeforeAfter, setInBeforeAfter] = useState('na');
    const [inRecord, setInRecord] = useState({ linkRef: '' });
    const [inRecordDocs, setInRecordDocs] = useState([{ recordType: 'na', id: 'na', amount: '0', currency: 'EUR', linkRef: '' }])
    const [outBeforeAfter, setOutBeforeAfter] = useState('na');
    const [outRecord, setOutRecord] = useState({ linkRef: '' });
    const [outRecordDocs, setOutRecordDocs] = useState([{ recordType: 'na', id: 'na', amount: '0', currency: 'EUR', linkRef: '' }])

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

    const handleConfirm = async (dt) => {
        console.log("A date has been picked: ", dt);
        const formatted = format(dt, 'MMMM dd yyyy');
        setDate(formatted);
        hideDatePicker();
        // await loadSeriesAndSet(dt, account);
        await loadSeriesAndSetWithDir(dt, account, 'inout');
    };

    const { control, handleSubmit, formState: { errors } } = useForm({
        defaultValues: {
            transactionType: '',
            accountIn: account,
            accountOut: account,
            currencyIn: accountCurrency,
            currencyOut: accountCurrency,
            inBeforeAfter,
            inRecord,
            outBeforeAfter,
            outRecord,
        }
    });
    async function onSubmit(data) {
        setSaveLabel('Saving...');
        await createTransaction(data);
        navigation.goBack();
    };

    function cancel() {
        navigation.goBack();
    }

    function handleTransactionType(type) {
        setTxType(type);
        setSaveDisabled(false);
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

    // async function loadSeriesAndSet(date: any, account: any) {
    //     const acc = findAccount(account);
    //     const recordDocs: any[] = await loadSeriesFromDate(date, acc);
    //     setInRecordDocs(recordDocs);
    //     if (recordDocs.length) {
    //         setInRecord(recordDocs[recordDocs.length - 1])
    //         setInBeforeAfter('After');
    //     } else {
    //         setInBeforeAfter('na');
    //     }
    //     setOutRecordDocs(recordDocs);
    //     if (recordDocs.length) {
    //         setOutRecord(recordDocs[recordDocs.length - 1]);
    //         setOutBeforeAfter('After');
    //     } else {
    //         setOutBeforeAfter('na');
    //     }
    // }

    async function loadSeriesAndSetWithDir(date: any, account: any, direction: string) {
        setSaveDisabled(true);
        const acc = findAccount(account);
        const recordDocs: any[] = await loadSeriesFromDate(date, acc);
        if (direction === 'inout' || direction === 'in') {
            setInRecordDocs(recordDocs);
            if (recordDocs.length) {
                setInRecord(recordDocs[recordDocs.length - 1])
                setInBeforeAfter('After');
            } else {
                setInBeforeAfter('na');
            }
        }
        if (direction === 'inout' || direction === 'out') {
            setOutRecordDocs(recordDocs);
            if (recordDocs.length) {
                setOutRecord(recordDocs[recordDocs.length - 1]);
                setOutBeforeAfter('After');
            } else {
                setOutBeforeAfter('na');
            }
        }
        setSaveDisabled(false);
    }

    // async function loadSeriesInAndSet(date: any, account: any) {
    //     const acc = findAccount(account);
    //     const recordDocs: any[] = await loadSeriesFromDate(date, acc);
    //     setInRecordDocs(recordDocs);
    //     if (recordDocs.length) {
    //         setInRecord(recordDocs[recordDocs.length - 1])
    //         setInBeforeAfter('After');
    //     } else {
    //         setInBeforeAfter('na');
    //     }
    // }

    // async function loadSeriesOutAndSet(date: any, account: any) {
    //     const acc = findAccount(account);
    //     const recordDocs: any[] = await loadSeriesFromDate(date, acc);
    //     setOutRecordDocs(recordDocs);
    //     if (recordDocs.length) {
    //         setOutRecord(recordDocs[recordDocs.length - 1]);
    //         setOutBeforeAfter('After');
    //     } else {
    //         setOutBeforeAfter('na');
    //     }
    // }

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
            created: serverTimestamp(),
            ordering: inBeforeAfter,
            orderingRef: inRecord.linkRef,
        };
        const docOut = {
            amount: `-${transaction.amountOut}`,
            currency: currencyOut,
            date: formatISO(new Date(date), { representation: 'date' }),
            flow: '-',
            type: txType,
            created: serverTimestamp(),
            ordering: outBeforeAfter,
            orderingRef: outRecord.linkRef,
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
                        <VStack>
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
                                                onValueChange={async (itemValue: string) => {
                                                    onChange(itemValue);
                                                    const currency = findAccountCurrency(itemValue);
                                                    setCurrencyIn(currency);
                                                    await loadSeriesAndSetWithDir(date, itemValue, 'in')
                                                    // await loadSeriesInAndSet(date, itemValue)
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
                                                keyboardType="number-pad"
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
                            </HStack>
                            {inRecordDocs.length > 0 && <HStack>
                                <FormControl w="1/2" isRequired isInvalid={'inBeforeAfter' in errors}>
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
                                                selectedValue={inBeforeAfter}
                                                onValueChange={(itemValue: string) => {

                                                    setInBeforeAfter(itemValue)
                                                }}
                                            >
                                                <Select.Item key={'Before'} label='Before' value={'Before'} />
                                                <Select.Item key={'After'} label='After' value={'After'} />
                                            </Select>
                                        )}
                                        name="inBeforeAfter"
                                    />
                                </FormControl>
                                <FormControl w="1/2" isRequired isInvalid={'inRecord' in errors}>
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
                                                selectedValue={inRecord.linkRef}
                                                onValueChange={(itemValue: string) => {
                                                    setInRecord({ linkRef: itemValue });
                                                }}
                                            >
                                                {inRecordDocs.map(rec => {
                                                    return (<Select.Item key={rec.id} label={`${rec.recordType} of ${rec.amount} ${rec.currency}`} value={rec.linkRef} />)
                                                })}
                                            </Select>
                                        )}
                                        name="inRecord"
                                    />
                                </FormControl>
                            </HStack>}
                        </VStack>}
                    {(txType === 'Outflow' || txType === 'Transfer') && <Text bold fontSize="sm" mb="3">OUT: </Text>}
                    {(txType === 'Outflow' || txType === 'Transfer') &&
                        <VStack>
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
                                                onValueChange={async (itemValue: string) => {
                                                    onChange(itemValue);
                                                    const currency = findAccountCurrency(itemValue);
                                                    setCurrencyOut(currency);
                                                    await loadSeriesAndSetWithDir(date, itemValue, 'out')
                                                    // await loadSeriesOutAndSet(date, itemValue)
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
                                                // keyboardType="numeric"
                                                keyboardType="number-pad"
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
                            </HStack>
                            {outRecordDocs.length > 0 && <HStack>
                                <FormControl w="1/2" isRequired isInvalid={'outBeforeAfter' in errors}>
                                    <FormControl.Label><Text fontSize="xs">Before/After</Text></FormControl.Label>
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
                                                selectedValue={outBeforeAfter}
                                                onValueChange={(itemValue: string) => {
                                                    setOutBeforeAfter(itemValue)
                                                }}
                                            >
                                                <Select.Item key={'Before'} label='Before' value={'Before'} />
                                                <Select.Item key={'After'} label='After' value={'After'} />
                                            </Select>
                                        )}
                                        name="outBeforeAfter"
                                    />
                                </FormControl>
                                <FormControl w="1/2" isRequired isInvalid={'outRecord' in errors}>
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
                                                selectedValue={outRecord.linkRef}
                                                onValueChange={(itemValue: string) => {
                                                    setOutRecord({ linkRef: itemValue });
                                                }}
                                            >
                                                {outRecordDocs.map(rec => {
                                                    return (<Select.Item key={rec.id} label={`${rec.recordType} of ${rec.amount} ${rec.currency}`} value={rec.linkRef} />)
                                                })}
                                            </Select>
                                        )}
                                        name="outRecord"
                                    />
                                </FormControl>
                            </HStack>}
                        </VStack>}

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
                        <Button onPress={handleSubmit(onSubmit)} colorScheme="emerald" isDisabled={saveDisabled}>
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
