import React, { useEffect, useState } from 'react';
import { DocumentData, collection, query, orderBy, onSnapshot, QuerySnapshot, deleteDoc, doc } from "firebase/firestore";
import { auth } from '../utils/hooks/useAuthentication';
import { db } from '../config/firebase';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { Entypo } from "@expo/vector-icons";
import {
    VStack,
    HStack,
    Heading,
    Spacer,
    Box,
    FlatList,
    Text,
    Pressable,
    Button,
    SectionList,
    View,
    Popover,
    IconButton,
    Icon
} from "native-base";
import BackButton from '../components/backButton';
import { getValuesForAccount, getTransactionsForAccount } from '../utils/dataCalls';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { loadTransactions } from '../utils/dataCallsSeries';
import { useFocusEffect } from '@react-navigation/native';

export default function AccountDetailsScreen({ route, navigation }) {
    const [showType, setShowType] = useState("Values");
    const [values, setValues] = useState<DocumentData[]>([]);
    const [transactions, setTransactions] = useState<DocumentData[]>([]);
    const [ccy, setCcy] = useState();
    const { accountName, accountId, portfolioId, accountCurrency, valueAdded } = route.params;

    const { data, refetch } = loadTransactions({
        placeholderData: {
            docs: [],
            accs: [],
            totalValue: 0
        },
        variables: {
            pfId: portfolioId,
            accId: accountId,
        }
    });

    async function setValuesData() {
        const valuesData = await getValuesForAccount(db, auth, portfolioId, accountId);
        setValues(valuesData);
    };

    async function setTransactionsData() {
        const transactionsData = await getTransactionsForAccount(db, auth, portfolioId, accountId);
        setTransactions(transactionsData);
    };

    function addValue() {
        navigation.navigate('Add Value', { portfolio: portfolioId, account: accountId, accountName, accountCurrency: ccy })
    }

    function editValue(amount: string, date: any, ref: any, docId: string) {
        navigation.navigate('Edit Value', { portfolio: portfolioId, account: accountId, accountName, accountCurrency: ccy, amount, dt: date, ref, docId })
    }

    function addTransaction() {
        navigation.navigate('Add Transaction', { account: accountName, accountCurrency: ccy })
    }

    function editTransaction() {
        navigation.navigate('Edit Transaction', { account: accountName, accountCurrency: ccy })
    }

    useEffect(() => {
        setValuesData();
        setCcy(accountCurrency);
    }, []);

    useEffect(() => {
        setValuesData();
    }, [valueAdded])

    useFocusEffect(React.useCallback(() => {
        refetch();
    }, []));

    async function deleteValue(value: any) {
        try {
            const docRef = await deleteDoc(doc(db, value.ref))
            console.log('Value has been deleted');
        } catch (e) {
            console.error('Error deleting document');
        }
        navigation.navigate('Account Details', { valueAdded: 'deleted', accountId, portfolioId, accountName });
    }

    async function deleteTransaction(tx: any) {
        const linkedTx = tx.transactionRef;
        if (linkedTx) {
            const path = linkedTx.path;
            try {
                const docRef = await deleteDoc(doc(db, path))
                console.log('Linked tx has been deleted');
            } catch (e) {
                console.error('Error deleting transaction document');
            }
        }
        try {
            const docRef = await deleteDoc(doc(db, tx.ref))
            console.log('tx has been deleted');
        } catch (e) {
            console.error('Error deleting transaction document');
        }
        refetch();
    }

    function DeleteTransactionPopover(item) {
        return <Box>
            <Popover placement='left' trigger={triggerProps => {
                return <IconButton {...triggerProps}
                    colorScheme='emerald'
                    size="sm"
                    icon={<Icon as={Entypo} name="dots-three-horizontal" />} />
            }}>
                <Popover.Content accessibilityLabel="Delete Transaction" w="56">
                    <Popover.Arrow />
                    <Popover.CloseButton />
                    <Popover.Header>Delete Transaction</Popover.Header>
                    <Popover.Body>
                        This will remove the transaction. This action cannot be
                        reversed. Deleted data can not be recovered.
                    </Popover.Body>
                    <Popover.Footer justifyContent="flex-end">
                        <Button.Group space={2}>
                            <Button colorScheme="danger" onPress={() => deleteTransaction(item)}>Delete</Button>
                        </Button.Group>
                    </Popover.Footer>
                </Popover.Content>
            </Popover>
        </Box>;
    }

    function DeleteValuePopover(item: any) {
        return <Box>
            <Popover placement='left' trigger={triggerProps => {
                return <IconButton {...triggerProps}
                    colorScheme='emerald'
                    size="sm"
                    icon={<Icon as={Entypo} name="dots-three-horizontal" />} />
            }}>
                <Popover.Content accessibilityLabel="Delete Transaction" w="56">
                    <Popover.Arrow />
                    <Popover.CloseButton />
                    <Popover.Header>Delete Value</Popover.Header>
                    <Popover.Body>
                        This will remove the value. This action cannot be
                        reversed. Deleted data can not be recovered.
                    </Popover.Body>
                    <Popover.Footer justifyContent="flex-end">
                        <Button.Group space={2}>
                            <Button colorScheme="danger" onPress={() => deleteValue(item)}>Delete</Button>
                        </Button.Group>
                    </Popover.Footer>
                </Popover.Content>
            </Popover>
        </Box>;
    }



    function valueList() {
        return (
            <View h="90%">
                <HStack>
                    <Heading fontSize="lg" p="4" pb="3">
                        Values
                    </Heading>
                    <Spacer />
                    <Button mt="2" colorScheme="emerald" variant="link" onPress={addValue}>
                        Add value
                    </Button>
                </HStack>
                <FlatList data={values} renderItem={({
                    item
                }) => <Pressable key={item.id}
                // onPress={() => editValue(item.amount, item.date, item.ref, item.id)}
                >
                        <Box borderBottomWidth="1" _dark={{
                            borderColor: "gray.600"
                        }} borderColor="coolGray.200" pl="4" pr="5" py="2">
                            <VStack>
                                <HStack>
                                    <Text _dark={{
                                        color: "warmGray.50"
                                    }} color="coolGray.800" bold>
                                        {format(new Date(item.date), 'MMMM dd yyyy')}
                                    </Text>
                                    <Spacer />
                                    {DeleteValuePopover(item)}
                                </HStack>
                                <HStack>
                                    <Text mt="2" fontSize="xs" color="coolGray.700">
                                        Value:
                                    </Text>
                                    <Spacer />
                                    <Text mt="2" fontSize="sm" color="coolGray.700">
                                        {item.amount} {item.currency}
                                    </Text>
                                </HStack>
                            </VStack>
                        </Box>
                    </Pressable>} keyExtractor={item => item.id} />
            </View>
        )
    }

    function transactionList() {
        return (
            <View h="90%">
                <HStack>
                    <Heading fontSize="lg" p="4" pb="3">
                        Transactions
                    </Heading>
                    <Spacer />
                    <Button mt="2" colorScheme="emerald" variant="link" onPress={addTransaction}>
                        Add transaction
                    </Button>
                </HStack>
                <FlatList data={data} renderItem={({
                    item
                }) => <Pressable key={item.id}
                // onPress={() => console.log('Pressed transaction', item)}
                >
                        <Box borderBottomWidth="1" _dark={{
                            borderColor: "gray.600"
                        }} borderColor="coolGray.200" pl="4" pr="5" py="2">
                            <VStack>
                                <HStack>
                                    <Text _dark={{
                                        color: "warmGray.50"
                                    }} color="coolGray.800" bold>
                                        {format(new Date(item.date), 'MMMM dd yyyy')}
                                    </Text>
                                    <Spacer />
                                    {DeleteTransactionPopover(item)}
                                </HStack>
                                <HStack>
                                    <Text mt="2" fontSize="xs" color="coolGray.700">
                                        {item.type}
                                    </Text>
                                    <Spacer />
                                    <Text mt="2" fontSize="sm" color="coolGray.700">
                                        {item.amount} {item.currency}
                                    </Text>
                                </HStack>
                            </VStack>
                        </Box>
                    </Pressable>} keyExtractor={item => item.id} />
            </View>
        )
    }

    function oneList() {
        const transactionItem = (item) => <Pressable key={item.id} onPress={() => console.log('Pressed transaction')}>
            <Box borderBottomWidth="1" _dark={{
                borderColor: "gray.600"
            }} borderColor="coolGray.200" pl="4" pr="5" py="2">
                <VStack>
                    <HStack>
                        <Text _dark={{
                            color: "warmGray.50"
                        }} color="coolGray.800" bold>
                            {format(new Date(item.date), 'MMMM dd yyyy')}
                        </Text>
                    </HStack>
                    <HStack>
                        <Text mt="2" fontSize="xs" color="coolGray.700">
                            {item.type}
                        </Text>
                        <Spacer />
                        <Text mt="2" fontSize="sm" color="coolGray.700">
                            {item.flow} {item.amount} {item.currency}
                        </Text>
                    </HStack>
                </VStack>
            </Box>
        </Pressable>

        const valueItem = (item) => <Pressable key={item.id} onPress={() => console.log('Pressed value')}>
            <Box borderBottomWidth="1" _dark={{
                borderColor: "gray.600"
            }} borderColor="coolGray.200" pl="4" pr="5" py="2">
                <VStack>
                    <HStack>
                        <Text _dark={{
                            color: "warmGray.50"
                        }} color="coolGray.800" bold>
                            {format(new Date(item.date), 'MMMM dd yyyy')}
                        </Text>
                    </HStack>
                    <HStack>
                        <Text mt="2" fontSize="xs" color="coolGray.700">
                            Value:
                        </Text>
                        <Spacer />
                        <Text mt="2" fontSize="sm" color="coolGray.700">
                            {item.amount} {item.currency}
                        </Text>
                    </HStack>
                </VStack>
            </Box>
        </Pressable>

        const valueHeader = (title) => {
            if (title === "Transactions") {
                return (<Heading fontSize="lg" p="4" pb="3">{title}</Heading>)
            } else {
                return (<HStack>
                    <Heading fontSize="lg" p="4" pb="3">
                        Values
                    </Heading>
                    <Spacer />
                    <Button mt="2" colorScheme="emerald" variant="link" onPress={addValue}>
                        Add value
                    </Button>
                </HStack>)
            }
        }

        return (
            <Box>
                <SectionList
                    renderSectionHeader={({ section: { title } }) => valueHeader(title)}
                    sections={[
                        { title: "Values", data: values, renderItem: ({ item, index, section: { title, data } }) => valueItem(item) },
                        { title: "Transactions", data: transactions, renderItem: ({ item, index, section: { title, data } }) => transactionItem(item) },
                    ]}
                    keyExtractor={(item, index) => item.date + index}
                />
            </Box>
        )
    }

    return (
        <SafeAreaView style={{ paddingBottom: 100 }}>
            <HStack>
                <BackButton nav={navigation} screenName="Account List" param={{ valueAdded }} />
                <Spacer />
                <Heading fontSize="xl" p="4" pb="3">
                    {accountName}
                </Heading>
            </HStack>
            <HStack mb="2">
                <Button mt="1" colorScheme="emerald" variant={showType === "Values" ? "subtle" : "link"} onPress={() => setShowType('Values')}>
                    Values
                </Button>
                {/* <Spacer /> */}
                <Button mt="1" colorScheme="emerald" variant={showType === "Transactions" ? "subtle" : "link"} onPress={() => setShowType('Transactions')}>
                    Transactions
                </Button>
            </HStack>
            {showType === 'Values' && valueList()}
            {showType === 'Transactions' && transactionList()}
        </SafeAreaView>
    )
}
