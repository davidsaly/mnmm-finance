import React, { useEffect, useState } from 'react';
import { DocumentData } from "firebase/firestore";
import { auth } from '../utils/hooks/useAuthentication';
import { db } from '../config/firebase';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns'
import {
    VStack,
    HStack,
    Heading,
    Spacer,
    Box,
    FlatList,
    Text,
    Pressable,
    Button
} from "native-base";
import BackButton from '../components/backButton';
import { getValuesForAccount } from '../utils/dataCalls';

export default function AccountDetailsScreen({ route, navigation }) {
    const [values, setValues] = useState<DocumentData[]>([]);
    const [ccy, setCcy] = useState();
    const { accountName, accountId, portfolioId, accountCurrency, valueAdded } = route.params;

    async function setValuesData() {
        const valuesData = await getValuesForAccount(db, auth, portfolioId, accountId);
        setValues(valuesData);
    };

    function addValue() {
        navigation.navigate('Add Value', { portfolio: portfolioId, account: accountId, accountName, accountCurrency: ccy })
    }

    useEffect(() => {
        setValuesData();
        setCcy(accountCurrency);
    }, []);

    useEffect(() => {
        setValuesData();
    }, [valueAdded])

    function valueList() {
        return (
            <Box>
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
                }) => <Pressable key={item.id} onPress={() => console.log('Pressed value')}>
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
                    </Pressable>} keyExtractor={item => item.id} />
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
            {valueList()}
        </SafeAreaView>
    )
}
